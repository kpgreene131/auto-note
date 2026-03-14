# Project Status

**Last updated:** 2026-03-13

## Where We Are

The project has a working UI prototype and a real database schema. The three-panel layout (sidebar, Tiptap editor, synthesis preview) runs on mock data. Kysely is set up, local Postgres runs via Docker Compose, and the initial data model (users, notes, tags, note_tags) is migrated and verified. The next phase is connecting the UI to real data through API routes, then wiring up AI synthesis.

## What Was Just Done

- Implemented spec 003: initial data model with four tables (users, notes, tags, note_tags)
- Created Kysely migration (`001_initial_schema.ts`) with correct types, FKs, cascade deletes, and unique constraint on tags
- Created migration runner (`src/db/migrate.ts`) with `db:migrate` script
- Updated `src/db/types.ts` with full Database interface and all Selectable/Insertable/Updateable exports
- Installed `tsx` for running TypeScript scripts outside Next.js
- Verified migration runs cleanly, tables exist, cascade deletes work
- Created GitHub issue #13: Wire up API routes for notes CRUD
- Closed UI prototype issue (#4)

## What's Next

1. **Wire up API routes for notes CRUD** (#13) — Replace mock data with real database queries. This is the bridge between the working UI and the real schema. Single-user MVP (no auth gating yet).
2. **Decide auth strategy** (#6) — Needed before multi-user support. Blocking real user creation.
3. **Core AI synthesis feature** (#7) — The main value prop. Depends on API routes being in place.

## Blocked / Needs Decision

- **Postgres hosting provider** (#1) — Deferred for now; developing against local Docker Postgres. Needs ADR before deployment.
- **Auth strategy** (#6) — NextAuth vs Clerk vs custom vs defer. Needs ADR. Blocks multi-user features.

## Open Questions

- Making skills/slash commands agent-agnostic (#11)
- Automating STATUS.md delivery to Claude.ai Project (#12)
- Learn Kysely basics (#2) — ongoing as we build real queries
- Indexes beyond PKs — wait until query patterns emerge (noted in spec 003)
