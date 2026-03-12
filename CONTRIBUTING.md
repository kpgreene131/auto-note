# Contributing

This project follows a spec-driven development workflow. No code lands without an approved spec.

## Workflow

1. **Spec first** — Write a spec in `specs/` describing the feature, change, or fix. Use the template at `specs/template.md`. For architectural decisions, write an ADR in `ADR/` as well.
2. **Review** — The spec is reviewed and approved before any implementation begins. Open questions must be resolved.
3. **Implement** — Build according to the approved spec. Propose interfaces before writing logic. Do not deviate from the spec without updating it first.
4. **Log decisions** — Record any decisions made during implementation in `DECISIONS.md`. If a decision is significant enough, write an ADR.
5. **Merge** — Submit a PR using the pull request template. Ensure the checklist is complete: spec referenced, decisions logged, tests considered, docs updated.

## Commit Messages

Use conventional commits. See `CLAUDE.md` for the full list of allowed prefixes.

## Key Principles

- Specs are the source of truth for what gets built.
- ADRs are the source of truth for why technical choices were made.
- If it's not in a spec, it doesn't get implemented.
- If it's not in an ADR, it wasn't decided.
