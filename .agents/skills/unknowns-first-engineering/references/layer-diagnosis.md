# Engineering Layer Diagnosis

Use this when an agent or workflow repeatedly fails.

## Prompt layer

Symptoms:

- ambiguous goal;
- conflicting constraints;
- unclear output contract;
- missing definition of done.

Fix the goal, constraints, or success criteria.

## Context layer

Symptoms:

- wrong framework/database assumptions;
- stale documentation overrides current code;
- relevant call sites or tests were not read;
- critical facts are buried in excessive context.

Curate, compress, refresh, and prioritize context.

## Harness layer

Symptoms:

- tools cannot access required files or runtime;
- command errors are hidden or truncated;
- dangerous actions are insufficiently guarded;
- no verifier or diff inspection exists.

Improve tools, permissions, error propagation, sandboxing, and guardrails.

## Loop layer

Symptoms:

- agent stops after generating code;
- repeated retries make no progress;
- no budget or escalation condition;
- completion is declared without checking criteria.

Add observation, progress detection, bounded retries, and completion checks.

## Graph layer

Symptoms:

- subagents duplicate work;
- overlapping file edits conflict;
- dependencies run in the wrong order;
- integration ownership is unclear.

Clarify node scope, dependencies, ownership, and merge verification.
