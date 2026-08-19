---
name: unknowns-first-engineering
description: "Use to investigate, plan, implement, review, or verify non-trivial software engineering where repository or runtime evidence materially affects correctness: complex or intermittent bugs, multi-step features, shared-interface refactors, API/provider integrations, authentication or authorization, payments, database migrations, persistent data, concurrency, CI/CD, deployment, security boundaries, or small edits that control a high-risk boundary. Do not trigger for typos, harmless one-line/local edits, exact symbol lookups, general concept explanations, translation, writing-only work, or brainstorming without a repository/runtime decision."
metadata:
  version: "3.1.1"
  author: "Fox"
  maturity: "production-candidate"
---

# Unknowns-First Engineering v3.1.1

Build for the system that actually exists, not the one implied by the prompt.

> Goal → Context and baseline → Material unknowns → Smallest correct action → Verify → Learn or finish

## Route and scale

Infer the operating mode:

- **Explain:** explain repository behavior from evidence; do not edit.
- **Explore:** inspect, reproduce, or diagnose; do not edit.
- **Plan:** inspect first, then produce a proportionate implementation plan; do not edit production code.
- **Implement:** inspect, edit surgically, and verify.
- **Review:** assess a plan, diff, PR, commit, or implementation; fixes require explicit scope.
- **Verify:** establish evidence against acceptance criteria without changing production behavior unless an authorized fixture requires it.

Select the lightest path that controls the real risk:

- **Trivial:** obvious, local, low-risk, reversible. Inspect nearby code, make the smallest change, and run the narrowest practical check. Do not add plans, worktrees, matrices, or abstractions unless they reveal a real decision.
- **Standard:** normal feature work, complex bugs, API changes, refactors, and multi-file edits. State observable success, inspect implementation and call sites, resolve material uncertainty, act incrementally, run targeted checks, inspect the diff, and repeat only with a changed hypothesis.
- **High-risk:** auth, billing, payments, migrations, persistent data, concurrency, deployment, public contracts, security boundaries, or several subsystems. Define invariants and failure behavior; inspect code, tests, schemas, runtime evidence, and authoritative docs; resolve high-impact unknowns; plan compatibility, rollback, observability, and verification; test relevant success, failure, unauthorized, retry, idempotency, concurrency, and rollback paths.

Mode and tier are independent. The mode is the outcome the request owes — explanation, exploration, plan, implementation, review, or verification; the tier is how much inspection and evidence that outcome justifies. Take the mode from what the request asks for; set the tier from the cost of being wrong.

A change can be one line and still be High-risk when it controls identity, money, persistent data, permissions, production, or a public contract. Read `references/operating-model.md` when depth selection is not obvious.

Do not turn a simple explanation, exact lookup, typo, or harmless local edit into a project workflow.

## Context and baseline

Before non-trivial implementation, establish only the evidence needed for the next decision:

- repository root, instructions, branch, status, and relevant uncommitted work;
- current behavior or reproducible failure and any pre-existing failed checks;
- relevant implementation, call sites, tests, types, schemas, migrations, and executable contracts;
- actual runtime, framework, database, deployment, credentials, tools, and provider environment available.

Do not attribute baseline failures to the new change. When sources conflict, prefer evidence closest to runtime behavior and expose the conflict. Read `references/discovery.md`.

## Core rules

1. Distinguish verified facts, assumptions, inferences, known unknowns, and plausible blind spots.
2. Gather only decision-relevant context; prefer executable evidence over stale prose.
3. Read relevant call sites before changing shared interfaces.
4. Prefer the smallest design satisfying current acceptance criteria; avoid speculative abstractions and unrelated cleanup.
5. Preserve compatibility unless a breaking change is explicitly approved.
6. Validate untrusted data at trust boundaries and preserve error, retry, idempotency, and concurrency semantics where relevant.
7. Never overwrite unrelated user work, expose secrets, weaken security boundaries, or bypass verification controls.
8. Obtain explicit approval before destructive or hard-to-reverse work involving production, persistent data, billing, secrets, permissions, public contracts, deployment, external communications, broad dependency upgrades, or substantial user work.
9. Honor read-only, no-commit, no-push, no-deploy, no-network, and scope constraints.
10. User and repository instructions take precedence. An approved specification is design input; do not repeat brainstorming unless material questions remain.

Ask the user only when the answer changes architecture, persistent data, public contracts, auth, billing, deployment, destructive actions, or a central product decision. Otherwise state a safe reversible assumption and proceed.

## Debugging and bounded execution

For bugs, work one falsifiable root-cause hypothesis at a time:

1. reproduce the symptom or establish the strongest available evidence;
2. trace the failing data and control path;
3. run the smallest experiment that distinguishes the hypothesis;
4. add a regression check when feasible;
5. implement one root-cause fix;
6. verify the original symptom and adjacent behavior.

For each general iteration: **Act → Observe → Check → Decide**. Stop blind retries after two materially identical failures. After three distinct falsified fix hypotheses, stop stacking patches and reassess architecture, assumptions, and evidence before another fix.

Do not weaken tests or acceptance criteria to obtain a pass. When a failure spans agent infrastructure, identify the broken layer before rewriting the prompt: prompt, context, harness, loop, or task graph. Read `references/loop-engineering.md` and `references/layer-diagnosis.md`.

## Verification and completion

Use proportionate evidence: formatter, lint, type-check, compile, unit/integration/contract/regression tests, runtime exercise, logs, network behavior, database state, security boundaries, deployment evidence, or final diff.

Classify every relevant check as **passed**, **failed**, **not run**, **unable to run**, or **manually inspected**. Never claim a check passed unless it ran. A passing build alone does not prove user-visible behavior.

Lead the final response with the outcome, then only material decisions, assumptions, evidence, failed or unrun checks, deviations, remaining risk, rollback, and required action.

**Learn or finish:** once verification is done, capture any durable lesson the run surfaced — a new invariant, a corrected assumption, a failure mode to watch for — where the next run will find it, then stop. Do not invent follow-up work beyond the request. See `references/teach-back.md` when a lesson deserves explicit teaching.

## Load guidance only when relevant

References:

- Depth and mode selection: `references/operating-model.md`
- Discovery/context: `references/discovery.md`
- Planning: `references/planning.md`
- Implementation: `references/implementation.md`
- Loop/recovery and long-running work: `references/loop-engineering.md`
- Verification: `references/verification.md`
- Agent/workflow diagnosis: `references/layer-diagnosis.md`
- Multi-agent coordination: `references/coordination.md`
- Teach-back: `references/teach-back.md`

Domain guides:

- API/provider integrations: `domains/api.md`
- Authentication/authorization: `domains/auth.md`
- Payments/webhooks: `domains/payments.md`
- Database/migrations: `domains/database.md`
- Frontend/UI: `domains/frontend.md`
- Documentation sites: `domains/docs-site.md`
- Debugging: `domains/debugging.md`
- Refactoring: `domains/refactoring.md`
- CI/CD and deployment: `domains/ci-cd.md`
- Machine learning/data work: `domains/ml-data.md`

Host adapters:

- Claude Code: `adapters/claude-code.md`
- Codex/ChatGPT coding agents: `adapters/codex.md`
- Other agents or direct API use: `adapters/generic-agent.md`

Do not assume the host supports slash commands, subagents, worktrees, or specific tool names. Adapt to the capabilities actually available.
