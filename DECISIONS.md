# Decision Log

A running log of decisions made during development. For significant architectural decisions, write a full ADR in `ADR/` instead.

## Format

Each entry follows this structure:

```
### YYYY-MM-DD — Short title

**Context:** What situation or question prompted this decision.

**Decision:** What was decided.

**Tradeoff:** What was gained and what was given up.
```

---

<!-- Decisions go below this line, most recent first. -->

### 2026-03-13 — Agent-agnostic instructions via AGENTS.md

**Context:** All coding agent rules lived in `CLAUDE.md`, tying repo conventions to a single tool. We want the repo to work with any AI coding agent.

**Decision:** Moved all agent-agnostic rules to `AGENTS.md`. `CLAUDE.md` now imports `AGENTS.md` and adds only Claude-specific config (slash command skills). Other agents can read `AGENTS.md` directly.

**Tradeoff:** Gained portability across coding agents and a clean separation of universal rules vs tool-specific config. Added one level of indirection for Claude (two files instead of one). Slash commands and skills still need investigation for full agent-agnostic support.

### 2026-03-12 — Rejected separate Java Spring Boot backend

**Context:** A separate Java Spring Boot backend was considered as the API layer, with Next.js handling only the frontend. This would have provided a separate backend in a different language.

**Decision:** Rejected for this project. The full Next.js stack handles both frontend and backend. Java Spring Boot will be revisited as a separate focused project later.

**Tradeoff:** Gained a simpler single-stack architecture and full focus on AI integration complexity. Gave up a separate Java/Spring Boot backend for this project. A split architecture would have divided focus between learning Java and building a complex AI application — overkill for this project's scope.

See also: [ADR-001](ADR/001-nextjs-fullstack.md)

### 2026-03-12 — Auto-synthesize on inactivity, not every keystroke

**Context:** The app uses AI to synthesize notes automatically. A trigger strategy was needed — when should synthesis run? Triggering on every keystroke would flood the Claude API with redundant calls, driving up costs and producing noisy intermediate results.

**Decision:** Auto-synthesize on inactivity using a debounced approach with smart change detection. Synthesis triggers only after the user stops typing, not on every keystroke.

**Tradeoff:** Saves API costs and reduces noise from partial inputs. Users don't see synthesis results instantly while typing, but get clean results after natural pauses. Exact debounce timing and what qualifies as a "smart trigger" are not yet specified — these will be defined in a feature spec.
