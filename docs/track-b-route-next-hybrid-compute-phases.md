# Track B Route Next Hybrid Compute Phases

Phase 44I creates route metadata only. Full hybrid compute routing still needs profiler, cost, sidecar, and E2E simulation evidence before any later live route execution approval can be considered.

Completed metadata phases:

- Phase 44D: web capability profiler.
- Phase 44E: desktop capability profiler.
- Phase 44F: desktop benchmark runner.
- Phase 44H: cost estimator.
- Phase 44G: local worker sidecar planning.
- Phase 44J: hybrid compute E2E simulation.

Next candidate phase: Phase 44K desktop beta readiness gate, unless a narrower route dry-run/live-execution approval phase is inserted first.

Cost/capacity labels in the route manifest remain metadata only: `cpu_low`, `cpu_medium`, `cpu_heavy`, `gpu_required`, `blocked_unknown`, and `pending_estimator`.

Workers must execute approved plan snapshots and approved artifact scopes only. Raw chat execution, direct tool execution from model output, public artifacts, provider calls, broad media, production, beta, and Track A remain blocked.
