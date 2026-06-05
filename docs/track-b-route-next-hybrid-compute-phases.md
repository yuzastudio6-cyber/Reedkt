# Track B Route Next Hybrid Compute Phases

Phase 44I creates route metadata only. Full hybrid compute routing still needs profiler, cost, sidecar, and E2E simulation evidence before any later live route execution approval can be considered.

Completed metadata phases:

- Phase 44D: web capability profiler.
- Phase 44E: desktop capability profiler.
- Phase 44F: desktop benchmark runner.
- Phase 44H: cost estimator.
- Phase 44G: local worker sidecar planning.
- Phase 44J: hybrid compute E2E simulation.
- Phase 44K: desktop beta readiness gate for restricted metadata/planning/simulation.
- Phase 44L: route dry-run approval packet for a future no-op handshake only.
- Phase 44M: no-op route dry-run execution for `candidate-noop-sidecar-handshake` only.
- Phase 44N: metadata route dry-run approval packet for future `candidate-duckdb-metadata-route-dry-run` execution only.
- Phase 44O: metadata-only route dry-run execution for the Phase 44N-approved DuckDB candidate only.
- Phase 44P: Track B readiness rollup and Supabase-ready milestone export for future Foundation/Supabase staging backfill only.

Next candidate phase: Foundation/Supabase-approved Track B milestone staging backfill using the Phase 44P export, a separate tool-runtime route approval packet for the lowest-risk metadata tool route, or product-level internal beta aggregation if roadmap priority shifts.

Cost/capacity labels in the route manifest remain metadata only: `cpu_low`, `cpu_medium`, `cpu_heavy`, `gpu_required`, `blocked_unknown`, and `pending_estimator`.

Workers must execute approved plan snapshots and approved artifact scopes only. Raw chat execution, direct tool execution from model output, public artifacts, provider calls, broad media, production, product-wide beta, external beta, live route execution, worker execution, sidecar execution, Supabase writes from Track B phases, and Track A remain blocked.
