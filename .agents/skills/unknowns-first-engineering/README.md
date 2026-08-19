# Unknowns-First Engineering v3.1.1

A model-agnostic, adaptive engineering skill for non-trivial repository-backed software work.

## What it does

- establishes a repository/runtime baseline before material implementation;
- separates facts, assumptions, unknowns, and blind spots;
- chooses Explain, Explore, Plan, Implement, Review, or Verify mode;
- scales from Trivial to Standard and High-risk rather than forcing ceremony;
- uses one falsifiable root-cause hypothesis at a time for complex bugs;
- verifies affected behavior and labels unrun evidence honestly;
- preserves unrelated work, permission boundaries, compatibility, rollback, and idempotency.

## When to use

Use for complex or intermittent bugs, multi-step/multi-file features, shared-interface refactors, API/provider integrations, auth, payments, migrations, persistent data, concurrency, CI/CD, deployment, security boundaries, implementation reviews, verification work, or a small edit that controls a high-risk boundary.

Do not use for typos, harmless one-line/local edits, exact symbol lookups, general explanations, translation, writing-only work, or brainstorming without a repository/runtime decision.

## Natural examples

- “Điều tra lỗi 403 trong repo, đọc log và tìm giả định sai trước khi sửa.”
- “Add this multi-file feature after inspecting the existing architecture, baseline tests, and runtime flow.”
- “Review this payment webhook plan for idempotency, race conditions, and rollback.”
- “Explain the current filter-name function in this repository.” — Explain mode, not full implementation workflow.

## Install on Windows

Manual installation is the supported local method: copy this directory to:

```text
%USERPROFILE%\.claude\skills\unknowns-first-engineering
```

Do not install another copy with the same canonical name in the same discovery roots. The package intentionally has one root `SKILL.md`.

## Validate the package

From this directory:

```powershell
python scripts\validate_package.py .
python scripts\evaluate_triggers.py . --output reports\trigger-eval.json
python scripts\secret_scan.py .
python -m py_compile scripts\validate_package.py scripts\evaluate_triggers.py scripts\secret_scan.py
```

The output-eval cases are a human/model protocol; shipping them is not evidence that output quality was evaluated. Runtime, cross-host, clean-install, and public-release evidence must remain explicitly unverified until actually performed.

## Troubleshooting

**The skill routes too broadly:** add a natural negative or near-neighbor case to `evals/trigger_cases.json`, then rerun the trigger evaluator. Check that the prompt is not a high-risk boundary disguised as a small edit.

**The workflow is too heavy:** choose Trivial when the change is obvious, local, reversible, and low-risk; read `references/operating-model.md` when depth is ambiguous.

**A check cannot run:** report it as `unable to run` or `not run`; do not replace it with a claim based only on a build or model confidence.

**A bug has resisted repeated patches:** stop after two materially identical failures; after three distinct falsified hypotheses, reassess the architecture and assumptions.

## Version

Current package: **3.1.1**
