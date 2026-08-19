# Refactoring Guide

Before refactoring:

- define behavior and contracts that must remain unchanged;
- establish tests or characterization checks;
- identify current complexity and the expected improvement;
- separate structural cleanup from behavioral changes;
- inspect all shared call sites;
- preserve compatibility unless explicitly approved;
- keep milestones independently reviewable and reversible.

After refactoring, verify both behavior and whether the intended complexity actually decreased.

Avoid abstraction introduced only for hypothetical future use.
