# Track B Route Next Hybrid Compute Phases

Phase 44I creates route metadata only. Full hybrid compute routing still needs future profiler and cost evidence.

Next candidate phases:

- Phase 44D: web capability profiler.
- Phase 44E: desktop capability profiler.
- Phase 44G: local worker sidecar planning.
- Phase 44H: cost estimator.

Phase 44J should wait if it depends on profiler, sidecar, or cost evidence from 44D-H. Until those phases exist, cost/capacity labels in the route manifest are coarse metadata only: `cpu_low`, `cpu_medium`, `cpu_heavy`, `gpu_required`, `blocked_unknown`, and `pending_estimator`.

Workers must execute approved plan snapshots and approved artifact scopes only. Raw chat execution, direct tool execution from model output, public artifacts, provider calls, broad media, production, beta, and Track A remain blocked.
