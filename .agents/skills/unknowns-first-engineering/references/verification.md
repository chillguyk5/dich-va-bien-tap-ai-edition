# Verification and Review Guide

Use for implementation review, pull-request review, and final verification.

## Derive the verification target

Translate the requested outcome into observable acceptance criteria. Verify the highest-risk behavior first.

## Verification ladder

Choose the strongest practical checks:

### Static
- formatting;
- lint;
- type-check;
- compile or build.

### Automated behavior
- focused unit tests;
- regression tests for the original failure;
- integration tests;
- end-to-end tests.

### Runtime
When feasible:

- start the real application;
- exercise the changed path;
- inspect logs and network behavior;
- test success and failure;
- test unauthorized or permission boundaries;
- test retry and duplicate behavior;
- test refresh and direct navigation;
- inspect responsive UI behavior.

### Final diff review
Check for:

- missing error handling;
- secret exposure;
- permission regressions;
- incorrect trust assumptions;
- race conditions and duplicate side effects;
- backward incompatibility;
- missing migrations or rollback;
- untested branches;
- dead code;
- unrelated edits;
- unexpected deploy triggers.

## Evidence classification

Report each important check as:

- **Passed**
- **Failed**
- **Not run**
- **Unable to run**
- **Manually inspected**

Never convert inference into a claimed test result.

## Review priority

Report findings in this order:

1. correctness or data-loss risk;
2. security and permission risk;
3. breaking compatibility;
4. missing failure handling;
5. missing tests;
6. maintainability concerns;
7. style or minor cleanup.

Use paths and line references when available.
