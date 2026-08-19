# Claude Code Adapter

- Invoke this skill once at the start of a non-trivial task, not on every follow-up message.
- Use repository instructions such as `CLAUDE.md` as higher-priority project context.
- Read only relevant references and domain guides to avoid context bloat.
- Use subagents only for independent work with explicit node contracts.
- Do not assume plan mode or worktrees are mandatory.
- After context compaction, restate goal, constraints, verified decisions, current evidence, and remaining success criteria.
- Do not commit, push, or deploy unless explicitly authorized.
