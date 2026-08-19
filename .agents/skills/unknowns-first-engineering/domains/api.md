# API and Provider Integration Guide

Use these as investigation prompts, not as a mandatory reporting template.

Consider:

- official contract and API version;
- actual base URL and environment selection;
- authentication headers and credential storage;
- provider-specific deviations from claimed compatibility;
- request and response schema;
- streaming, pagination, cancellation, and partial responses;
- timeouts and resource limits;
- retryable versus non-retryable errors, backoff, and duplicate effects;
- rate limits and quotas;
- idempotency and replay behavior;
- error-schema compatibility;
- logging without leaking secrets or sensitive payloads;
- test and production separation;
- fallbacks and partial provider outages.

Prefer official documentation plus a real request/response trace over marketing claims of compatibility.
