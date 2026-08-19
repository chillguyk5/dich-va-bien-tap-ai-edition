# Codex / ChatGPT Coding Agent Adapter

- Treat the skill as an adaptive workflow, not a fixed sequence of tool names.
- Inspect the current repository and available tools before planning edits.
- Use the host's plan/task mechanism only when the task benefits from it.
- Preserve exact command output needed for verification.
- For long tasks, maintain a compact state summary: goal, constraints, decisions, completed checks, blockers, and next step.
- Do not commit, push, open a PR, or deploy unless explicitly requested.
