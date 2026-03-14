# Specs

A spec defines what will be built, why, and what "done" looks like. Every feature, significant change, or non-trivial fix starts with a spec.

## When to Write a Spec

- New features or capabilities
- Changes to existing behavior
- Non-trivial bug fixes where the fix approach needs discussion
- Integrations with external services or APIs

## How to Write a Spec

1. Copy `template.md` and name it descriptively (e.g., `note-synthesis-v1.md`)
2. Fill in all sections. Leave "Open Questions" populated if unknowns remain.
3. Submit for review before beginning implementation.
4. Update the spec if requirements change during implementation.

## Definition of Done

A spec is considered done when:

- All acceptance criteria are met
- Open questions are resolved (or explicitly deferred with rationale)
- Decisions made during implementation are logged as ADRs in `ADR/`
- Code is merged and the spec status is updated to `completed`

## Statuses

- **draft** — Work in progress, not ready for review
- **proposed** — Ready for review
- **approved** — Reviewed and approved for implementation
- **in-progress** — Implementation underway
- **completed** — Fully implemented and merged
- **abandoned** — Will not be implemented (include reason)
