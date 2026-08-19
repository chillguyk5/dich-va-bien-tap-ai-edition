# Implementation Guide

Use during code changes.

## Editing discipline

- Follow the repository's instructions and surrounding idioms.
- Preserve unrelated user changes.
- Inspect relevant call sites before modifying shared contracts.
- Keep scope focused.
- Avoid speculative abstractions and opportunistic rewrites.
- Add dependencies only with a concrete justification.
- Validate untrusted inputs at trust boundaries.
- Keep secrets out of source, logs, tests, and examples.
- Update tests and documentation when behavior or contracts change.

## Adaptive milestones

For low-risk work, one edit-and-check cycle may be enough.

For material work:

1. implement one coherent milestone;
2. inspect the diff;
3. run the narrowest relevant checks;
4. fix failures before expanding scope;
5. confirm the milestone's acceptance criterion.

## Deviation handling

Surface a deviation when newly discovered evidence changes:

- architecture;
- persistent data;
- shared or public interfaces;
- authentication or permissions;
- payment behavior;
- deployment;
- the intended user experience;
- the risk or rollback profile.

Continue autonomously when the change is safe, local, reversible, and consistent with the requested outcome.

Request approval when the deviation crosses a non-negotiable boundary.

## Completion threshold

Implementation is not complete merely because code was written. Complete only when:

- the intended behavior exists;
- relevant checks are performed or limitations are stated;
- the final diff contains no accidental unrelated change;
- remaining material risks are disclosed.
