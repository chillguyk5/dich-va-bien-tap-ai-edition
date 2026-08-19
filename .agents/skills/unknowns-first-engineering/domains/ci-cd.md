# CI/CD and Deployment

- Inspect workflow triggers, environments, permissions, secret usage, third-party actions, and deployment providers before changing or pushing.
- Separate observable repository-side automation from external webhooks, linked hosting projects, and unobservable server-side hooks.
- Inspect actual build/start commands, rewrites, base paths, environment variables, health checks, and migration ordering.
- Do not infer that a push is safe without checking active triggers and linked deployment behavior.
- Preserve least privilege and pin or verify third-party actions where appropriate.
- Define rollback and post-deploy evidence: target, revision, status, logs, health path, and user-visible route.
- Treat deployment as an external shared-state write and require explicit approval before production mutation, secret rotation, or destructive rollback.
