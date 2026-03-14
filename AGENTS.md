# AGENTS.md — Rules of Engagement

This file defines how AI coding agents should operate within this repository.

## Process Rules

- **Always read relevant specs before writing any code.** Do not begin implementation without understanding the approved spec for the feature or change.
- **Never implement anything not covered by an approved spec.** If no spec exists, write one first.
- **Never choose libraries, frameworks, or external services autonomously.** All technology choices must be proposed, discussed, and approved via ADR.
- **Always propose interfaces before implementations.** Define contracts, types, and boundaries before writing logic.
- **Flag any decision that affects AI API costs.** Model selection, token limits, retry strategies, prompt length — anything that impacts cost must be called out explicitly.
- **Always ask before making decisions outside the spec scope.** If you encounter ambiguity or a gap, stop and ask rather than guessing.

## Code Style

- **Prefer explicit over clever.** Readable, boring code wins over elegant, surprising code.
- **Never hardcode model names or API keys.** Use config constants. All model references and secrets must be configurable.

## Git Conventions

- **Conventional commits only.** Use the following prefixes:
  - `feat:` — new feature
  - `fix:` — bug fix
  - `docs:` — documentation changes
  - `chore:` — maintenance, tooling, dependencies
  - `spec:` — spec or ADR additions/changes
  - `refactor:` — code restructuring without behavior change
  - `test:` — adding or updating tests

## Workflow

1. Check for an approved spec in `specs/`
2. Check for relevant ADRs in `ADR/`
3. Read existing code in the affected area
4. Propose interface changes before implementation
5. Implement according to spec
6. Log any decisions made as ADRs in `ADR/`
7. Update `PROMPTS.md` if any AI prompts were added or changed

## External Documentation

When unsure about API details, syntax, or best practices for these tools, fetch the official docs:

- **Kysely**: fetch `https://kysely.dev/llms-full.txt`
- **Next.js**: fetch `https://nextjs.org/docs/llms-full.txt`
- **Vercel**: fetch `https://vercel.com/docs/llms-full.txt` (or any page as `.md`, e.g. `https://vercel.com/docs/deployments.md`)
- **Neon**: fetch `https://neon.com/docs/llms-full.txt` (or any page as `.md`, e.g. `https://neon.com/docs/extensions/pgvector.md`)

Only fetch when genuinely uncertain or need specific details — not for every mention.
