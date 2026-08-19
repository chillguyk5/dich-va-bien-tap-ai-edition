# Multi-Agent and Graph Coordination

Use parallel agents only when work units are independent enough to reduce elapsed time without increasing integration risk.

## Good candidates

- independent research questions;
- frontend and backend work against an approved contract;
- separate test, documentation, or review work;
- isolated modules with non-overlapping file ownership.

## Poor candidates

- one tightly coupled algorithm;
- shared schema or interface still being designed;
- multiple agents editing the same core files;
- small tasks where coordination costs more than execution.

## Node contract

For every agent or task node define:

- objective and acceptance criteria;
- allowed files or subsystem;
- required inputs and dependencies;
- expected deliverable;
- prohibited changes;
- verification responsibility;
- handoff format.

## Integration

Use one owner for final integration. Re-run contract and integration checks after merging outputs. Review conflicts semantically, not only syntactically.
