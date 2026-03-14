# Project Status

**Last updated:** 2026-03-14

## Where We Are

The app has a fully functional note-taking UI backed by a real Postgres database. Users can create, edit, and delete notes — delete is now soft-delete with a "Recently Deleted" trash section that supports restore and permanent delete. The editor auto-saves, themes persist to the database, and the sidebar reflects live data. What's missing: authentication (single hardcoded user), production hosting, CI/CD, and the core AI synthesis feature (the panel exists but doesn't call any AI yet).

## What Was Just Done

- **Spec 004 — API routes:** Built full CRUD for notes and user preferences (`/api/notes`, `/api/notes/[id]`, `/api/users/me`)
- **Spec 005 — Wire UI to API:** Replaced all mock data with real API calls. Editor auto-saves with debounce, sidebar fetches/creates/deletes notes, theme and user preferences persist to DB. Deleted the mock data layer.
- **Spec 006 — Soft delete and trash:** Notes soft-delete via `deleted_at` column. Collapsible "Recently Deleted" section in sidebar with restore and permanent delete. Auto-purge after 30 days on trash access.
- Closed issues: #13 (API routes), #7 (note input — split out AI synthesis to #14), #2 (Kysely basics)

## What's Next

In priority order:

1. **Auth strategy** (#6) — Decide and implement an auth provider. Currently single-user with a hardcoded DB user. Needed before anything can go to production.
2. **Postgres hosting** (#1) — Pick a provider (Neon, Supabase, etc.) so we have a production database. Write ADR.
3. **Vercel deployment and CI/CD** (#10, #9, #8) — Get the app deployed with environment/secrets management and a basic pipeline.
4. **AI synthesis** (#14) — The core value prop. Wire the synthesis panel to Claude API. Depends on secrets management being in place for the API key.

## Blocked / Needs Decision

- **Auth strategy** (#6) — Needs ADR. NextAuth vs Clerk vs other. Blocks multi-user and production deployment.
- **Postgres hosting** (#1) — Needs ADR. Developing against local Docker Postgres for now.

## Open Questions

- Making skills/slash commands agent-agnostic (#11)
- Automating STATUS.md delivery to Claude.ai Project (#12)
- Indexes beyond PKs — deferred until query patterns emerge (noted in spec 003)
