# Project Status

**Last updated:** 2026-03-13

## Where We Are

The UI prototype (spec 002) is implemented and working. This is the first real application code — a three-panel layout (sidebar, editor, synthesis preview) with mock data, Tiptap rich text editing, and a multi-theme system. No backend, no auth, no real data yet. The next phase is connecting real infrastructure: database, auth, and the AI synthesis pipeline.

## What Was Just Done

- Implemented spec 002: full UI prototype with sidebar, Tiptap editor, and synthesis panel
- Set up shadcn/ui manually (CLI incompatible with Node 24) — button, avatar, scroll-area components
- Installed Tiptap (rich text editor) and react-markdown (synthesis rendering)
- Built resizable/collapsible synthesis panel with drag-to-resize
- Built collapsible sidebar with toggle in header
- Added note title bar spanning editor and synthesis panel
- Created 6-theme system (2 light, 4 dark) with palette switcher and localStorage persistence
- Tuned dark mode surface hierarchy: header (darkest) → sidebar → titlebar → content (lightest)
- Created AppShell client component to keep root layout as a server component

## What's Next

1. **Decide Postgres hosting provider** (#1) — blocks all database work including the data model and Kysely setup
2. **Decide auth strategy** (#6) — blocks user-facing feature work
3. **Define initial data model** (#5) — once Postgres hosting is decided, spec the schema and set up Kysely
4. **Close out UI prototype issue** (#4) — commit the current work and close the issue

## Blocked / Needs Decision

- **Postgres hosting provider** (#1) — Supabase vs Railway vs Neon vs self-hosted. Needs ADR.
- **Auth strategy** (#6) — NextAuth vs Clerk vs custom vs defer for MVP. Needs ADR.

## Open Questions

- Making skills/slash commands agent-agnostic (#11)
- Automating STATUS.md delivery to Claude.ai Project (#12)
- Vector embeddings, Whisper API, weekly digest — deferred features, not yet decided
