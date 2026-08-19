# Discovery and Blind-Spot Guide

Use for exploration, diagnosis, feasibility checks, and the discovery stage of material implementations.

## Establish the baseline

Before non-trivial implementation, record only what is needed to distinguish existing state from effects of the change:

- repository root, applicable instructions, branch, `git status`, and relevant uncommitted work;
- current behavior or reproducible failure;
- relevant test, build, lint, and runtime status before editing;
- actual framework, database, deployment environment, credentials, tools, and provider access available.

Do not attribute pre-existing failures to new work. If a check cannot run, preserve that as `unable to run` rather than replacing it with a weaker claim.

## Frame the task

Establish:

- desired user-visible outcome;
- explicit scope and exclusions;
- practical acceptance criteria;
- constraints such as read-only, no-deploy, no-commit, or limited network;
- risk level and reversibility.

Derive missing criteria when reasonable and label them as assumptions.

## Inspect relevant context

Inspect only what can materially affect the task:

- repository instructions such as `AGENTS.md`, `CLAUDE.md`, README, and contribution guides;
- manifests, lockfiles, runtime and framework versions;
- application entry points, routing, schemas, types, and shared interfaces;
- existing implementations of similar behavior;
- authentication, authorization, configuration, and environment boundaries;
- tests, fixtures, mocks, and available verification commands;
- CI/CD, hosting, deployment, redirects, and rollback mechanisms;
- logging, monitoring, retries, caching, and failure handling;
- Git status and existing uncommitted work.

Avoid unrelated generated or vendor directories unless evidence points there.

## Unknowns matrix

Use internally when the task is material:

### Verified facts
Directly evidenced by code, runtime behavior, official documentation, or explicit user statements.

### Known unknowns
Visible unresolved choices or missing facts.

### Hidden assumptions
Claims that influence the solution but have not been verified.

### Candidate unknown unknowns
Potentially overlooked failures, including:

- environment or version differences;
- stale cache and state;
- concurrency and race conditions;
- duplicate or out-of-order events;
- partial failure and retry behavior;
- time zones, localization, and encoding;
- mobile, accessibility, SEO, and direct navigation;
- security, permissions, secret exposure, and trust boundaries;
- compatibility, migration, deployment triggers, and rollback;
- unrelated local user changes.

Rank by impact, likelihood, cost of discovering later, and difficulty of reversal.

## Discovery output

For Explore mode, report:

1. the most important finding;
2. supporting evidence;
3. unresolved material uncertainty;
4. likely root cause or feasible approaches;
5. recommended next action.

Do not edit files in Explore mode.
