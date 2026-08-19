# Database and Migrations

- Confirm the actual database engine, driver, ORM, transaction model, deployment topology, and representative data volume.
- Inspect existing schemas, migrations, constraints, indexes, legacy data, and data access conventions.
- Define the compatibility window and rollout order; use backward-compatible expand/migrate/contract steps for live systems.
- Plan data preservation, rerun idempotency, locking, concurrency, isolation, retries, downtime, and partial-failure recovery.
- Never assume a migration is safe because it works on an empty or newly created database.
- Define backup feasibility, rollback limits, and verification strategy before destructive changes.
- Test representative existing/legacy data, concurrent writes, reruns, and failure paths when practical.
- Require explicit approval before destructive production migration or irreversible data rewrite.
