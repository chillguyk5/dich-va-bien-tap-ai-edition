# Operating Model

## Select depth by risk, not apparent effort

A task can look small but still be High-risk when it touches money, identity, persistent data, permissions, production, concurrency, or public contracts.

| Signal | Trivial | Standard | High-risk |
|---|---|---|---|
| Scope | one local behavior | multiple files/layers | several subsystems or an external system |
| Reversibility | trivial revert | moderate rollback | migration, production, or external side effect |
| Trust boundary | none | ordinary API/input | auth, secret, billing, payment |
| Data | no persistence | additive/local persistence | destructive, concurrent, regulated, or financial |
| Verification | focused check | tests plus runtime path | adversarial, concurrency, rollback, production-safe evidence |

Use the highest applicable column.

## Materiality score

Internally prioritize uncertainty by:

1. impact if wrong;
2. likelihood of being wrong;
3. cost of late discovery;
4. difficulty of rollback.

Resolve high-combined-impact uncertainty first. Low-impact uncertainty may remain explicit instead of blocking work.

## Mode-action contract

- Explain is read-only and evidence-based.
- Explore is read-only.
- Plan may write a requested plan artifact but not production code.
- Implement may edit within scope and verify.
- Review reports findings; fixes require explicit scope.
- Verify changes no production behavior unless a safe authorized fixture requires it.

A user's explicit constraint always overrides an inferred mode.
