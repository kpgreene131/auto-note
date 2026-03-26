# Project Status

**Last updated:** 2026-03-14

## Where We Are

The foundation is complete. The app is deployed to Vercel, backed by a Neon Postgres database, with Clerk authentication handling invite-only access. Users can create, edit, soft-delete, and restore notes through a three-panel layout with theme persistence. Everything is wired end-to-end — local changes push straight to production. We're now entering the "fun stuff" phase: AI synthesis (the core value prop) and making the app responsive for mobile use.

## What Was Just Done

- **Neon Postgres provisioned** — production database live, all migrations applied, confirmed working with real user data
- **Vercel deployment** — app deployed and connected to Neon and Clerk in production (spec 008)
- **Clerk authentication** — invite-only access implemented (spec 007)
- **Soft delete and trash** — notes soft-delete with restore and auto-purge after 30 days (spec 006)
- **UI wired to API** — replaced all mock data with real API calls, auto-save, live sidebar (spec 005)
- **Closed issues:** #1 (Postgres provider), #6 (auth strategy), #8 (env/secrets), #10 (Vercel deploy), #13 (API routes)

## What's Next

Two tracks running in parallel:

1. **AI synthesis** (#14) — The reason this app exists. Wire the synthesis panel to Claude API so messy notes become clean summaries. Spec needed.
2. **Responsive/mobile-friendly** (#15) — The app needs to work well on phones, especially since notes are often captured on mobile. Can be done alongside AI work.

## Blocked / Needs Decision

Nothing is currently blocked. All infrastructure decisions have been made and implemented.

## Open Questions

- Automating STATUS.md delivery to Claude.ai Project (#12)
- Making skills/slash commands agent-agnostic (#11)
- CI/CD pipeline (#9) — Vercel handles CD; CI gates (tests, linting) deferred until needed
- GitHub Projects board (#3) — low priority, issues are working fine for now
