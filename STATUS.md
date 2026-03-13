# Project Status

**Last updated:** 2026-03-13

## Where We Are

Pre-implementation phase. The repo scaffold is complete — project docs, ADRs, specs folder, GitHub templates, and a Next.js starter app are all in place. Four ADRs have been approved (Next.js fullstack, Kysely, Vercel deployment, Claude API server-only). No application code has been written yet. The focus right now is on tooling, workflow infrastructure, and making two key decisions (Postgres hosting and which feature to spec first) that unblock all implementation work.

## What Was Just Done

- Adopted the AGENTS.md pattern — moved all agent-agnostic rules out of CLAUDE.md into a shared AGENTS.md file, making the repo portable across AI coding tools
- Created a separate public research repo (ai-dev-research) for documenting learnings about agentic development workflows, prompt engineering, and tool comparisons
- Built the `/update-status` slash command (this one) for generating project status snapshots
- Added TODO.md to the repo as the source of truth for task tracking, synced from a Claude.ai Project used for mobile capture
- Fixed Playwright MCP config for Windows (cmd /c wrapper)

## What's Next

Two decisions are blocking all implementation work and should be made soon:
1. **Postgres hosting provider** (Supabase vs Railway vs Neon vs self-hosted) — needed before any database specs
2. **Which feature to spec first** — this kicks off actual app development

After those: fill in ARCHITECTURE.md, learn Kysely basics, and write the first feature spec.

## Blocked / Needs Decision

- **Postgres hosting provider** — can't write DB specs without knowing the hosting target
- **Which feature to spec first** — nothing to implement until this is chosen

## Open Questions

- Vector embeddings for note connections — useful or scope creep?
- Whisper API for audio upload — adds cost, demonstrates audio pipeline. Defer?
- Weekly digest / Q&A over notes — interesting but significant complexity
- GitHub MCP server vs `gh` CLI — which is better for Claude Code GitHub integration?
- Claude.ai Projects API — can STATUS.md delivery be automated, or is it manual copy for now?
