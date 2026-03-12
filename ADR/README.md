# Architecture Decision Records (ADRs)

An ADR captures a significant architectural or technical decision along with its context and consequences.

## When to Write an ADR

Write an ADR when a decision:

- Affects the overall system architecture
- Chooses a technology, framework, or external service
- Establishes a pattern that the rest of the codebase will follow
- Is difficult or costly to reverse
- Affects AI API costs or behavior
- Involves a meaningful tradeoff between competing concerns

## How to Write an ADR

1. Copy `template.md` and name it `NNN-short-title.md` (e.g., `001-use-postgres.md`)
2. Fill in all sections
3. Set status to `proposed`
4. Submit for review
5. Update status to `accepted` or `rejected` after review

## Statuses

- **proposed** — Under discussion, not yet decided
- **accepted** — Decision has been made and approved
- **rejected** — Considered and explicitly rejected
- **superseded** — Replaced by a later ADR (link to it)
