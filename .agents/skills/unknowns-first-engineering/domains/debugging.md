# Debugging Guide

Do not patch the visible symptom before establishing evidence.

1. Reproduce the issue or identify the strongest available evidence.
2. Trace the failing data and control path.
3. Form one falsifiable root-cause hypothesis and run the smallest discriminating experiment.
4. Compare with a known working path when available.
5. Add a focused regression test or reproducible check.
6. Fix the smallest correct layer.
7. Search for parallel occurrences.
8. Verify the original symptom and adjacent behavior.
9. Stop blind retries after two materially identical failures; after three distinct falsified fixes, reassess architecture and assumptions before another patch.

Distinguish:

- confirmed root cause;
- likely cause;
- contributing factor;
- unrelated observation.

For provider or network failures, compare request URL, headers, payload, response status, response body, timeout, proxy, environment variables, and direct-provider behavior.
