Git add, commit, and push the changes from this session.

1. Run `git status` and `git diff` to see what changed
2. Stage only files related to this session's work
3. Run `gh issue list --state open` to check for related issues
4. Write a conventional commit message based on what was done
   - If the work **completes** an issue, include `closes #N` in the commit body
   - If the work **partially addresses** an issue, include `refs #N` in the commit body
   - Multiple issues can be referenced in the same commit
5. Push to remote

Ask before including files that look unrelated to the current session.
