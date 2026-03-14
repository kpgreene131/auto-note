# Spec: Vercel Deployment Setup

## Status

completed

## Context

The app needs a deployment platform. Vercel was chosen as the deployment target (see [ADR-003](../ADR/003-vercel-deployment.md)) for its native Next.js support, zero-config deployments, and built-in CI/CD from Git pushes.

The project currently runs locally only — there's no deployment pipeline, no production environment variables, and no `.env.example` documenting required secrets. This spec covers the full initial deployment setup, including both manual platform steps and code changes needed to make the project deploy-ready.

## Goals

- Deploy the app to Vercel with working production builds
- Document all required environment variables via `.env.example`
- Set up GitHub integration for automatic preview + production deployments
- Install Vercel CLI for local workflow (deploy, env pull, logs)
- Ensure database connectivity works in production (Vercel → hosted Postgres)

## Non-Goals

- Custom domain setup — use the default `*.vercel.app` domain initially
- Vercel Analytics or Speed Insights — add later when there's traffic to measure
- Edge Functions or Middleware optimization — current defaults are fine
- CI/CD beyond Vercel's built-in Git integration (no GitHub Actions)
- ISR, PPR, or advanced caching strategies — not needed yet

## Manual Setup (Vercel Dashboard + CLI)

These steps must be completed by the developer. They cannot be automated.

### 1. Create a Vercel account

1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Authenticate with your GitHub account (recommended — enables Git integration automatically)
3. The Hobby plan is sufficient for a portfolio project

### 2. Install Vercel CLI

Install globally for use across projects:

```bash
npm i -g vercel
```

Then authenticate:

```bash
vercel login
```

This opens a browser window for authentication. Once complete, the CLI is linked to your account.

### 3. Link the project

From the project root directory:

```bash
vercel link
```

This is interactive — it will prompt you to:
- Select your Vercel team/account
- Create a new project or link to an existing one
- Confirm the project settings (framework: Next.js, root directory: `./`)

This creates a `.vercel/` directory (already in `.gitignore`) with project and org configuration.

### 4. Import the GitHub repository (alternative to CLI link)

If you prefer the dashboard approach:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select the `auto-note` repository
4. Vercel auto-detects Next.js — accept the defaults
5. Don't deploy yet — environment variables need to be configured first

Either approach (CLI link or dashboard import) works. The GitHub import also sets up automatic deployments on push.

### 5. Configure environment variables

In the Vercel Dashboard, navigate to **Project Settings → Environment Variables** and add:

| Variable | Environments | Notes |
|----------|-------------|-------|
| `DATABASE_URL` | Production, Preview | Connection string for hosted Postgres (e.g., Neon, Supabase, or Vercel Postgres) |
| `CLERK_SECRET_KEY` | Production, Preview | `sk_live_...` from Clerk Dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production, Preview | `pk_live_...` from Clerk Dashboard |

Or via CLI:

```bash
vercel env add DATABASE_URL production preview
vercel env add CLERK_SECRET_KEY production preview
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production preview
```

The `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` values are hardcoded in the app and don't need to be set as environment variables unless overriding.

### 6. Set up a hosted PostgreSQL database

The local development database (`localhost:5432`) won't be accessible from Vercel. Options:

1. **Vercel Postgres** (built-in integration) — navigate to **Storage** tab in dashboard, create a Postgres database. This auto-populates the `DATABASE_URL` env var.
2. **Neon** — free tier available, create a project at [neon.tech](https://neon.tech) and copy the connection string.
3. **Supabase** — free tier available at [supabase.com](https://supabase.com).

Whichever provider is chosen, the connection string format is:
```
postgresql://user:password@host:port/database?sslmode=require
```

**Important:** Run migrations against the production database before the first deployment:
```bash
DATABASE_URL="<production-connection-string>" npm run db:migrate
```

Or pull env vars from Vercel and run locally:
```bash
vercel env pull .env.local
npm run db:migrate
```

### 7. Deploy

First deployment (preview):
```bash
vercel deploy
```

Verify the preview URL works, then deploy to production:
```bash
vercel deploy --prod
```

Or if GitHub integration is set up, simply push to `main`:
```bash
git push origin main
```

### 8. Verify the deployment

```bash
# Check for errors in deployment logs
vercel logs --environment production --level error --since 5m

# Hit the production URL
vercel curl / --deployment <production-url>
```

## Implementation (Code Changes)

### 1. Create `.env.example`

Document all required environment variables so any developer (or future you) knows what's needed:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auto_note

# Clerk Authentication
# In development, Clerk runs in keyless mode — these are only needed for production.
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### 2. Verify `next.config.ts` is deployment-ready

The current empty config is fine — Vercel auto-detects Next.js and applies optimal settings. No changes needed unless we hit specific issues.

### 3. Verify `.gitignore` includes Vercel artifacts

The `.gitignore` should already contain `.vercel` (it does). Confirm it also has:
```
.vercel
.env*.local
```

### 4. Add `postinstall` or `build` script considerations

The current `build` script (`next build`) is correct for Vercel. No changes needed.

For database migrations on deploy, Vercel doesn't run custom scripts automatically. Options:
- **Run migrations manually** before deploying (simplest for a solo project)
- **Add to build script**: `"build": "npm run db:migrate && next build"` — runs migrations on every deploy

**Decision:** Keep migrations manual for now. A solo portfolio project doesn't need automated migration on deploy, and running migrations in the build step risks partial failures. We can revisit when the project has multiple contributors.

## File Inventory

New files:
| File | Purpose |
|------|---------|
| `.env.example` | Documents required environment variables |

No files need to be modified — the project is already Vercel-compatible.

## Acceptance Criteria

- [ ] Vercel CLI installed and authenticated (`vercel --version` works)
- [ ] Project linked to Vercel (`vercel link` completed, `.vercel/` directory exists)
- [ ] GitHub repo connected for automatic deployments on push
- [ ] Environment variables configured in Vercel dashboard (DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
- [ ] Hosted PostgreSQL database provisioned and accessible from Vercel
- [ ] Migrations run against production database
- [ ] `.env.example` committed to repo documenting all required variables
- [ ] `vercel deploy --prod` succeeds with no build errors
- [ ] Production URL loads the app and Clerk auth works
- [ ] Preview deployments auto-create on PR/branch push

## Open Questions

- ~~**Database provider:**~~ **Resolved:** Neon Postgres (free tier) via Vercel integration. Auto-populates DATABASE_URL. pgvector available for future AI features.
- **Migration strategy for deploy:** Manual for now, but may want `build`-step migrations if deploys become frequent. Revisit after first few deploys.
- **Serverless function timeout:** ADR-003 flags that Claude API calls may hit Vercel's function timeout limits (default 10s on Hobby, up to 60s on Pro). Not a blocker for initial deployment, but relevant when AI features land.

## References

- [ADR-003: Vercel Deployment](../ADR/003-vercel-deployment.md)
- [Vercel Getting Started](https://vercel.com/docs/getting-started-with-vercel)
- [Deploy from CLI](https://vercel.com/docs/projects/deploy-from-cli)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Agent Resources](https://vercel.com/docs/agent-resources) — docs available as `.md` on any page
