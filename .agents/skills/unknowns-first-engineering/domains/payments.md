# Payment and Webhook Guide

Treat payment state as a security and data-integrity boundary.

Consider:

- server-side verification;
- signature, token, or provider callback validation;
- idempotency, duplicate callbacks, and concurrent delivery races;
- out-of-order events;
- amount, currency, merchant, and order validation;
- order ownership and authorization;
- atomic state transitions;
- replay protection;
- reconciliation and audit trail;
- retry and timeout behavior;
- test versus production separation;
- refund, cancellation, expiration, and partial failure;
- observability without exposing sensitive data;
- safe migration and rollback.

Never trust client-side success as proof of payment.

Require approval before changing real billing behavior or production payment configuration.
