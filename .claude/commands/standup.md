Gather context and orient at the start of a session.

## Gather

1. Run `git log --oneline -10` for recent git activity
2. Run `gh issue list --state open` for open GitHub issues
3. Run `gh issue list --state closed --limit 5` for recently closed issues
4. Read `STATUS.md` for the last generated project status
5. Run `git diff --stat HEAD~10` for recently changed files (adjust range if needed)

## Synthesize

Present a concise briefing with these sections:

### Where We Left Off
What was the last meaningful work based on git history and closed issues. One or two sentences.

### What's Ready to Pick Up
Open issues that aren't blocked, ordered by what seems most impactful. List each with its issue number and a one-line reason why it matters now.

### What's Blocked
Issues labeled `blocked` and what decision or dependency they're waiting on.

### Suggested Focus
Based on the state of things, suggest what to work on this session and why. This is a recommendation, not a decision — the user picks.

## Rules
- Keep it brief — this is a standup, not a novel
- Don't read every file in the repo — use git history and issues as your signal
- If STATUS.md is stale (more than a few days old), note that
- Don't start working on anything — just present the landscape
