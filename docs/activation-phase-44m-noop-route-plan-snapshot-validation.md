# Phase 44M Plan Snapshot Validation

Phase 44M validates the Phase 44L no-op plan snapshot before the no-op dry-run report can pass.

Required plan snapshot properties:

- Candidate id is `candidate-noop-sidecar-handshake`.
- Tool id is synthetic: `track_b_noop_route_validator`.
- Compatibility validator maps only to `local_worker_sidecar_planning` with `requestedAction: validate_only`.
- `routeExecutionAllowed=false`.
- `runtimeExecutionAllowed=false`.
- `workerExecutionAllowed=false`.
- `sidecarExecutionAllowed=false`.
- `toolExecutionAllowed=false`.
- Raw chat execution, provider calls, public output, broad media, and arbitrary media are false.

Any request for real tool ids, Demucs, VLM, runtime execution, route execution, workers, sidecars, or raw chat fails closed.
