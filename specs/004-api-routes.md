# Spec: API Routes for Notes CRUD

## Status

proposed

## Context

The UI prototype (spec 002) renders mock data. The database schema (spec 003) is migrated and the Kysely DB client exists (`src/db/index.ts`). This spec defines the Next.js App Router API routes that connect the two — real CRUD operations against Postgres, consumed by the frontend.

This is a single-user MVP. There is no auth yet, so all routes operate against a single hardcoded user ID (seeded on first request or via migration). Auth gating is a separate concern (#6).

## Goals

- Define API route handlers for notes CRUD (list, get, create, update, delete)
- Define a user preferences route (get/update theme, display name)
- Replace mock data imports with real database queries
- Establish the `src/app/api/` directory structure

## Non-Goals

- Authentication or authorization (separate ADR #6)
- Tags CRUD (will come with tagging feature)
- AI synthesis triggering (separate spec #7)
- Pagination or filtering (add when needed — MVP has few notes)
- Rate limiting, request validation libraries, or middleware

## Route Structure

```
src/app/
  api/
    notes/
      route.ts              → GET (list all), POST (create)
      [id]/
        route.ts            → GET (single), PUT (update), DELETE
    users/
      me/
        route.ts            → GET (preferences), PATCH (update preferences)
```

No base `api/route.ts` — there's nothing useful at the bare `/api` endpoint.

## Single-User Strategy

Until auth is implemented, the app needs a user row to satisfy the `notes.user_id` FK. Strategy:

1. Add a seed script (`src/db/seed.ts`) that inserts a default user if none exists
2. Add `db:seed` npm script
3. API routes query for the first user (`SELECT * FROM users LIMIT 1`) as the "current user"
4. When auth lands, replace this with the authenticated user from the session

The seed user:
```typescript
{
  display_name: 'Default User',
  color_theme: 'theme-dark',
}
```

## Route Definitions

### GET /api/notes

List all notes for the current user, ordered by `updated_at` descending.

**Response 200:**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "Meeting Notes",
      "content": { /* Tiptap JSON */ },
      "synthesis": "## Summary\n...",
      "created_at": "2026-03-14T...",
      "updated_at": "2026-03-14T...",
      "synthesized_at": null
    }
  ]
}
```

**Query:**
```typescript
db.selectFrom('notes')
  .selectAll()
  .where('user_id', '=', userId)
  .orderBy('updated_at', 'desc')
  .execute()
```

### GET /api/notes/[id]

Get a single note by ID.

**Response 200:** Single note object (same shape as list items).

**Response 404:** `{ "error": "Note not found" }` — when note doesn't exist or doesn't belong to current user.

**Query:**
```typescript
db.selectFrom('notes')
  .selectAll()
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .executeTakeFirst()
```

### POST /api/notes

Create a new note.

**Request body:**
```json
{
  "title": "Optional title",
  "content": { /* Tiptap JSON */ }
}
```

Both fields are optional. A note can be created empty (title null, content as empty Tiptap doc).

**Response 201:** The created note object.

**Query:**
```typescript
db.insertInto('notes')
  .values({
    user_id: userId,
    title: body.title ?? null,
    content: body.content ?? null,
  })
  .returningAll()
  .executeTakeFirstOrThrow()
```

### PUT /api/notes/[id]

Update an existing note. Partial updates — only provided fields are changed.

**Request body (all fields optional):**
```json
{
  "title": "Updated title",
  "content": { /* Tiptap JSON */ },
  "synthesis": "## Updated synthesis"
}
```

**Response 200:** The updated note object.

**Response 404:** `{ "error": "Note not found" }`

Sets `updated_at` to `new Date()` on every update (per spec 003 decision).

**Query:**
```typescript
db.updateTable('notes')
  .set({ ...fields, updated_at: new Date() })
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .returningAll()
  .executeTakeFirst()
```

### DELETE /api/notes/[id]

Delete a note.

**Response 200:** `{ "deleted": true }`

**Response 404:** `{ "error": "Note not found" }`

**Query:**
```typescript
db.deleteFrom('notes')
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .returningAll()
  .executeTakeFirst()
```

### GET /api/users/me

Get current user's profile/preferences.

**Response 200:**
```json
{
  "id": "uuid",
  "display_name": "Default User",
  "color_theme": "theme-dark",
  "created_at": "2026-03-14T...",
  "updated_at": "2026-03-14T..."
}
```

### PATCH /api/users/me

Update current user's preferences.

**Request body (all fields optional):**
```json
{
  "display_name": "New Name",
  "color_theme": "theme-pink"
}
```

**Response 200:** The updated user object.

Validate `color_theme` against the known theme IDs from `src/lib/themes.ts` before saving. Return 400 if invalid.

## Error Handling

Keep it simple — no error handling framework. Each route handler uses try/catch:

- **400** — invalid request body or validation failure (e.g., bad theme ID)
- **404** — resource not found or doesn't belong to current user
- **500** — unexpected database or server error, log to console

Response shape for errors:
```json
{ "error": "Human-readable message" }
```

## Helper: getCurrentUser

Extract a shared helper to avoid repeating the "get first user" query in every route:

```typescript
// src/db/queries.ts
import { db } from '.'

export async function getCurrentUser() {
  const user = await db.selectFrom('users')
    .selectAll()
    .limit(1)
    .executeTakeFirst()

  if (!user) throw new Error('No user found — run db:seed')

  return user
}
```

This is the one function that gets replaced wholesale when auth is added.

## File Inventory

New files:
| File | Purpose |
|------|---------|
| `src/app/api/notes/route.ts` | GET list, POST create |
| `src/app/api/notes/[id]/route.ts` | GET single, PUT update, DELETE |
| `src/app/api/users/me/route.ts` | GET preferences, PATCH update |
| `src/db/queries.ts` | `getCurrentUser` helper |
| `src/db/seed.ts` | Seed script for default user |

Modified files:
| File | Change |
|------|--------|
| `package.json` | Add `db:seed` script |

## Acceptance Criteria

- [ ] `npm run db:seed` creates a default user (idempotent — no-ops if user exists)
- [ ] `GET /api/notes` returns notes from the database, ordered by `updated_at` desc
- [ ] `POST /api/notes` creates a note and returns it with 201
- [ ] `GET /api/notes/[id]` returns a single note or 404
- [ ] `PUT /api/notes/[id]` updates provided fields and sets `updated_at`
- [ ] `DELETE /api/notes/[id]` removes the note and returns `{ "deleted": true }`
- [ ] `GET /api/users/me` returns the current user's profile
- [ ] `PATCH /api/users/me` updates display_name and/or color_theme with validation
- [ ] All routes scope queries to the current user's ID
- [ ] Invalid `color_theme` values return 400
- [ ] 404 returned for non-existent note IDs
- [ ] `src/db/index.ts` is committed (currently untracked)

## Design Decisions

- **No base `/api` route** — no useful purpose; avoid dead endpoints.
- **`/users/me` not `/users/[id]`** — single-user MVP, no need for arbitrary user lookup. `me` is a clear convention that maps cleanly to "the authenticated user" when auth arrives.
- **PATCH for user updates, PUT for note updates** — notes receive full field replacement semantics (you send the complete content); user preferences are partial updates (change just the theme). Both are implemented as partial in practice, but the verb signals intent.
- **Seed script over migration-inserted data** — keeps migrations purely structural. Seed data is a dev concern, not a schema concern.
- **`getCurrentUser` in `src/db/queries.ts`** — single point of replacement when auth is added. Every route imports this instead of writing its own user lookup.
- **No request validation library** — the request bodies are simple (2-3 optional fields). Manual validation is clear and avoids a new dependency. Revisit if bodies grow more complex.
- **Theme validation against `src/lib/themes.ts`** — single source of truth for valid themes, already exists.

## References

- [Spec 002: UI Prototype](./002-ui-prototype.md)
- [Spec 003: Initial Data Model](./003-initial-data-model.md)
- [GitHub Issue #13: Wire up API routes](https://github.com/kpgre/auto-note/issues/13)
- [Next.js Route Handlers docs](https://nextjs.org/docs/app/getting-started/route-handlers)
