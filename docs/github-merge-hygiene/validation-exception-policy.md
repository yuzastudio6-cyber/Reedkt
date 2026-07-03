# Validation Exception Policy

Decision: `validation_exception_accepted_for_future_parent_chain_merge_execution`

The following validation failures are treated as pre-existing PR #350 base blockers for future parent-chain merge execution only:

- `typecheck:server`
- `build:server`

Accepted failure categories:

- `sharp`
- `jsdom`
- `@mozilla/readability`
- `@turf/turf`
- `DOM unknown typings`

Policy:

- New failure categories block merge execution approval.
- `build:server` may fail only because it reruns the same `typecheck:server` blockers.
- These failures do not authorize runtime execution, Supabase writes, provider calls, production, external beta, or paid production.
- A separate repair PR remains required before this server typecheck can become a hard merge gate.
- Reevaluate after package dependency changes, server activation runner changes, or before any production/runtime unlock.
