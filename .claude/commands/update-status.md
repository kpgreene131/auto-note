Generate a fresh STATUS.md summarizing the current state of the project.

## How to gather context

1. Read the existing `STATUS.md` (if it exists) to understand previous state and find the last-updated date
2. Run `git log --oneline --since="<last STATUS.md date>"` to see what changed since the last status update. If no previous STATUS.md exists, use the last 10 commits.
3. Run `git diff --stat HEAD~5` for a quick sense of recent file changes
4. Run `gh issue list --state open` for current open issues and their labels
5. Run `gh issue list --state closed --limit 5` for recently closed issues
6. Read recent ADRs in `ADR/` for any new decisions logged

## Output format

Write `STATUS.md` in the repo root with this exact structure:

```
# Project Status

**Last updated:** YYYY-MM-DD

## Where We Are
One paragraph on overall project state — what phase we're in, what's working, what's not yet started.

## What Was Just Done
Bulleted list of meaningful work completed since the last status update. Derived from git history and current session knowledge. Keep it concise — group related commits, skip trivial changes.

## What's Next
The single most important next action and why it matters. If there are 2-3 things at the same priority, list them, but don't dump the whole backlog here.

## Blocked / Needs Decision
Anything that cannot proceed without user input. Pull from GitHub issues labeled `blocked`. If nothing is blocked, say so.

## Open Questions
Tracked but not yet decided. Pull from GitHub issues labeled `research` and any open questions in ADRs. Keep brief — these are pointers, not full analysis.
```

## Rules
- Replace the previous STATUS.md entirely — this is not append-only
- Use plain language, not jargon. This gets read on mobile.
- Be honest about what's actually done vs. in progress vs. not started
- Do not fabricate progress — only report what's evidenced by git history, GitHub issues, or session context
