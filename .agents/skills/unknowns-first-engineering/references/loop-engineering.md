# Loop Engineering

Use this reference when a task requires multiple tool calls, autonomous execution, retries, or explicit completion checks.

## Define the loop before running

State:

- goal;
- measurable success criteria;
- current evidence;
- next highest-value action;
- practical iteration/time/token boundary;
- escalation condition.

## One iteration

1. Act on one hypothesis or milestone.
2. Observe exact tool output and changed state.
3. Compare evidence with the success criteria.
4. Decide whether to finish, continue, change hypothesis, or stop for input.

## No-progress detection

Treat the loop as stalled when one or more occur:

- the same command fails repeatedly with materially identical output;
- edits oscillate between prior states;
- new actions do not reduce uncertainty;
- tests are rerun without a changed hypothesis;
- the agent starts weakening checks instead of fixing behavior;
- remaining work depends on unavailable credentials, environment, or user decisions.

After two materially identical failures, stop blind retries. Reframe the hypothesis, inspect a different layer, or surface the blocker.

## Recovery ladder

1. Re-read the error and exact command.
2. Verify environment, paths, versions, permissions, and prerequisites.
3. Reduce to the smallest reproduction.
4. Inspect adjacent call sites and contracts.
5. Compare with a known-good path or official documentation.
6. Change one variable at a time.
7. Escalate with evidence if the blocker is external or requires authorization.

## Progress and interruption

For genuinely multi-step work:

- give a brief initial plan;
- report blockers, baseline failures, and changed assumptions early;
- update after meaningful milestones rather than every command;
- incorporate user interruptions without discarding valid evidence;
- never promise asynchronous completion unless the host supports it;
- when constrained, hand off the verified partial result and clearly mark unfinished evidence.

Progress messages must not claim success ahead of verification or expose private scratch reasoning.

## Completion check

Before finalizing, map each success criterion to evidence. Mark it passed, failed, unrun, unable to run, or manually inspected.

Do not treat “the model believes it is done” as evidence.
