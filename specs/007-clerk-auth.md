# Spec: Clerk Authentication Integration

## Status

approved

## Context

The app currently uses a single hardcoded user created by `db:seed`. There is no authentication — anyone who can reach the URL can read and edit all notes. Before deploying to production, we need real auth. The app should be invite-only so the owner can share access with specific people (e.g., recruiters reviewing a portfolio).

Clerk was chosen as the auth provider (see [ADR-005](../ADR/005-clerk-auth.md)). This spec covers the full integration.

## Goals

- Protect all routes behind Clerk authentication
- Replace the hardcoded `getCurrentUser()` with Clerk's real user identity
- Map Clerk users to the existing `users` table (provision on first sign-in)
- Configure invite-only access via Clerk's restricted mode
- Show sign-in UI for unauthenticated visitors

## Non-Goals

- Role-based access control or permissions — single-role for now
- Organization/team features
- Custom social login configuration beyond Google and GitHub
- Migrating existing notes to a different user — single-user dev data is disposable

## Manual Setup (Clerk Dashboard)

These steps must be completed by the developer before or during implementation. They cannot be automated.

### 1. Create a Clerk application

1. Go to [clerk.com](https://clerk.com) and sign up / sign in
2. Create a new application — name it "auto-note" (or similar)
3. Clerk will generate a **Publishable Key** and a **Secret Key**

### 2. Configure authentication methods

1. Keep the defaults — **Email** (verification code) and **Google** are fine
2. Optionally enable **GitHub** under **Configure → SSO connections**
3. Disable **Password**, **Phone number**, and **Username** if enabled

The specific sign-in methods don't matter much — restricted mode (step 3 below) gates *who* can access the app regardless of how they authenticate.

### 3. Enable restricted mode (invite-only)

1. Navigate to **Configure → Restrictions**
2. Toggle **Enable restricted mode** → Save
3. This makes the sign-up page accessible only to invited users

### 4. Invite your first user (yourself)

1. Navigate to **Users** in the Clerk Dashboard
2. Click **Create user** or use the **Invitations** tab
3. Enter your email — you'll receive a magic link to sign in

### 5. Add environment variables (production only)

In development, Clerk runs in **keyless mode** — no env vars needed. It auto-generates temporary credentials and shows a "Configure your application" prompt you can use to claim the instance later.

For production deployment, add to `.env.local` and Vercel environment variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

## Implementation

### 1. Install dependency

```bash
npm install @clerk/nextjs
```

### 2. Add `ClerkProvider` to layout — `src/app/layout.tsx`

Wrap the app in `<ClerkProvider>`. It must be inside `<html>` and `<body>`, wrapping `<AppShell>`:

```tsx
import { ClerkProvider } from '@clerk/nextjs'

// in the return:
<ClerkProvider>
  <AppShell>{children}</AppShell>
</ClerkProvider>
```

### 3. Create proxy — `src/proxy.ts`

Clerk uses `proxy.ts` (not `middleware.ts`) for its middleware. Since we have a `src/` directory, it goes in `src/proxy.ts`. Protect all routes except a public sign-in page:

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### 4. Create sign-in page — `src/app/sign-in/[[...sign-in]]/page.tsx`

A minimal page hosting Clerk's `<SignIn />` component:

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  )
}
```

This page renders outside `<AppShell>` since unauthenticated users shouldn't see the sidebar/header. We need a separate layout for this route (see step 5).

### 5. Create auth layout — `src/app/sign-in/layout.tsx`

A minimal layout without AppShell for the sign-in page:

```tsx
export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

Alternatively, restructure with route groups:
- `src/app/(app)/` — all authenticated routes, uses `AppShell` layout
- `src/app/(auth)/sign-in/` — sign-in page, no AppShell

This is the cleaner approach and should be used if the file moves are manageable.

### 6. Update `getCurrentUser()` — `src/db/queries.ts`

Replace the hardcoded single-user query with Clerk-backed user resolution:

```tsx
import { auth } from '@clerk/nextjs/server'

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  // Find existing user mapped to this Clerk ID
  let user = await db.selectFrom('users')
    .selectAll()
    .where('clerk_id', '=', userId)
    .executeTakeFirst()

  // Auto-provision on first sign-in
  if (!user) {
    user = await db.insertInto('users')
      .values({ clerk_id: userId })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return user
}
```

### 7. Database migration — `src/db/migrations/003_clerk_user.ts`

Add `clerk_id` column to users table and remove the seed user dependency:

```tsx
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('clerk_id', 'text')
    .execute()

  await db.schema
    .alterTable('users')
    .addUniqueConstraint('users_clerk_id_unique', ['clerk_id'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropConstraint('users_clerk_id_unique')
    .execute()

  await db.schema
    .alterTable('users')
    .dropColumn('clerk_id')
    .execute()
}
```

### 8. Update types — `src/db/types.ts`

Add `clerk_id` to `UsersTable`:

```tsx
clerk_id: string | null
```

### 9. Update `UserBadge` — `src/components/UserBadge.tsx`

Replace the manual API fetch with Clerk's `<UserButton />` and `<Show>`:

```tsx
import { Show, UserButton, SignInButton } from '@clerk/nextjs'

export function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </div>
  )
}
```

`<UserButton />` provides avatar, name, and a sign-out menu. `<Show>` replaces the deprecated `<SignedIn>`/`<SignedOut>` components. The settings gear can remain as a separate element if needed.

### 10. Remove `/api/users/me` route

This route was used to fetch/update the hardcoded user's display name and theme. With Clerk:
- Display name comes from Clerk's user profile
- Theme preference can stay in the `users` table (fetched via `getCurrentUser()`)

The GET and PATCH for display name are no longer needed. Theme persistence can move to a dedicated `/api/preferences` route or stay on `/api/users/me` but scoped to just `color_theme`.

**Decision:** Keep `/api/users/me` but simplify it to only handle `color_theme`. Remove `display_name` from the PATCH body — Clerk owns the user's name.

### 11. Environment variable setup

Keyless mode handles development automatically. For production, add:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
```

## Route Structure

```
src/app/
  (app)/                    → Authenticated layout with AppShell
    page.tsx                → Home (redirect to first note)
    notes/[id]/page.tsx     → Note editor
  (auth)/                   → Unauthenticated layout (no AppShell)
    sign-in/[[...sign-in]]/
      page.tsx              → Clerk SignIn component
  api/
    notes/...               → All existing API routes (unchanged)
    users/me/route.ts       → Simplified to color_theme only
```

## File Inventory

New files:
| File | Purpose |
|------|---------|
| `src/proxy.ts` | Clerk proxy middleware, protects all routes except sign-in |
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Sign-in page |
| `src/app/(auth)/layout.tsx` | Minimal layout for auth pages |
| `src/db/migrations/003_clerk_user.ts` | Add `clerk_id` column |

Modified files:
| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add `ClerkProvider` |
| `src/db/queries.ts` | Clerk-backed `getCurrentUser()` with auto-provision |
| `src/db/types.ts` | Add `clerk_id` to `UsersTable` |
| `src/components/UserBadge.tsx` | Replace with Clerk's `UserButton` |
| `src/app/api/users/me/route.ts` | Simplify to theme-only |
| `package.json` | Add `@clerk/nextjs` |

Moved files (route group restructure):
| From | To |
|------|-----|
| `src/app/page.tsx` | `src/app/(app)/page.tsx` |
| `src/app/notes/[id]/page.tsx` | `src/app/(app)/notes/[id]/page.tsx` |

## Inviting Users After Setup

Once the app is deployed and Clerk is in restricted mode:

1. Go to the Clerk Dashboard → **Users**
2. Click **Invite user** and enter their email
3. They receive an email invitation with a link
4. Clicking the link takes them to the sign-in page where they authenticate via magic link
5. On first sign-in, `getCurrentUser()` auto-provisions their database row

No admin UI in the app is needed — the Clerk Dashboard handles all user management.

## Acceptance Criteria

- [ ] `npm install @clerk/nextjs` added to dependencies
- [ ] `ClerkProvider` wraps the app in root layout
- [ ] `src/proxy.ts` protects all routes; unauthenticated users redirected to `/sign-in`
- [ ] `/sign-in` page renders Clerk's `SignIn` component
- [ ] Sign-in page has no AppShell (sidebar/header)
- [ ] `getCurrentUser()` resolves user via Clerk's `auth()` and `clerk_id` column
- [ ] First-time sign-in auto-provisions a new database user
- [ ] `UserBadge` uses Clerk's `UserButton` component
- [ ] `clerk_id` column added with unique constraint via migration
- [ ] Existing API routes work unchanged (they call `getCurrentUser()` which now uses Clerk)
- [ ] Clerk restricted mode enabled — only invited users can sign up
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Keyless mode works in development; production keys configured for deploy

## Open Questions

- **Theme on `UserButton`:** Clerk's components have their own styling. We may need to pass `appearance` props to match our theme system. Defer to implementation — try defaults first.
- **Seed data migration:** Existing dev notes are attached to the seed user. After switching to Clerk, the seed user won't match any Clerk ID. Options: (a) drop and re-seed, (b) manually update the seed user's `clerk_id` after first sign-in. Option (a) is simplest for dev.

## References

- [ADR-005: Clerk as Auth Provider](../ADR/005-clerk-auth.md)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Middleware Docs](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Clerk Restrictions](https://clerk.com/docs/authentication/configuration/restrictions)
