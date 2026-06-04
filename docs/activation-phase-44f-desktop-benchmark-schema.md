# Phase 44F Desktop Benchmark Schema

The desktop benchmark schema records bounded generated benchmark metadata only:

- `benchmarkCaps`: hard limits for time, memory, temp files, worker count, runtime tool timeouts, and disallowed network/GPU/stress tests.
- `benchmarkResults`: baseline, single-thread CPU, optional parallel CPU, memory, temp storage, runtime tools, and policy categories.
- `normalizedBuckets`: coarse performance, storage, and runtime-tool buckets.
- `routePlanningHints` and `costEstimatorHints`: planning metadata only.
- `blockedReasons` and `warnings`: fail-closed policy signals.

The schema does not include raw PII, secrets, persistent IDs, exact CPU/GPU IDs, media paths, arbitrary file paths, or public artifact URLs.
