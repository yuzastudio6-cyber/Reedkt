# Phase 44F Desktop Benchmark Runner

Phase 44F adds a bounded desktop benchmark runner for Track B route and cost planning metadata only. It does not execute routes, workers, sidecars, media/audio/OCR/VLM/model runtimes, providers, Docker, Cloud Build, Cloud Run, GCP/IAM mutation, GPU jobs, beta, production, or Track A.

## Status

- Phase: 44F
- Run id: `phase44f-desktop-benchmark-runner-20260604`
- Branch: `codex/rp-activation-44f-desktop-benchmark-runner`
- Base: `codex/rp-activation-44e-desktop-capability-profiler`
- Status target: `phase_complete_restricted_scope`

## Implementation

- Server activation/reporting module: `server/activation/desktop-benchmark-runner/`
- Desktop-safe benchmark module: `src/lib/track-b/desktop-benchmark-runner/`
- Reports: `docs/activation-phase-44f-desktop-benchmark-runner-reports/`

Default Phase 44F evidence uses generated/mock benchmark fixtures. Optional bounded local benchmark execution is implemented but skipped by policy unless `REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_LOCAL_RUN=true` is set for a later approved run.

## Safety

The benchmark runner uses generated data only, strict caps, and redacted/coarse buckets. It blocks live upload, local persistence by default, identifiers, hostnames, usernames, MAC addresses, exact CPU/GPU identifiers, environment dumps, directory scans, arbitrary paths, media files, network benchmarks, GPU benchmarks, and sustained stress tests.
