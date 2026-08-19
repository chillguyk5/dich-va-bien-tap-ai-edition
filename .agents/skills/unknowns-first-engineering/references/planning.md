# Planning Guide

Use when the user requests architecture, an implementation plan, or when a material change needs a plan before editing.

## Plan by decisions, not filenames

Order the plan by:

1. acceptance criteria and compatibility contracts;
2. data model and migration behavior;
3. public APIs, URLs, types, and interfaces;
4. authentication, authorization, and security boundaries;
5. user-visible states and error behavior;
6. integration and deployment boundaries;
7. observability, testing, and rollback;
8. mechanical file changes.

## Decision entry

For a material decision, capture:

- decision;
- evidence from the repository or official contract;
- assumption still being made;
- chosen option;
- principal alternative;
- reason for the choice;
- risk;
- verification method;
- rollback path.

Do not produce a full decision record for obvious local choices.

## Milestones

Each implementation milestone should have:

- goal;
- behavior or contract affected;
- relevant files or systems;
- focused verification;
- risk or rollback note.

Prefer milestones that can be reviewed, tested, and reverted independently.

## Approval boundaries

Seek explicit approval before planning to execute:

- destructive migrations or data deletion;
- production deployment;
- payment or billing changes;
- public breaking changes;
- security weakening;
- broad dependency upgrades;
- replacement of substantial user work.
