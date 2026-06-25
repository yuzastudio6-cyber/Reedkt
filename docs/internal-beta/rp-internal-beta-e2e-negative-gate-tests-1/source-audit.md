# RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1 Source Audit

Packet: `RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1`

Decision: `completed_internal_beta_negative_gate_tests_for_disabled_runtime_lane`

Execution: `completed_tests_only_no_runtime_unlock`

Internal beta end-to-end status: `not_ready`

Product-ready end-to-end local OSS tools: `0`

## Source Chain

- `RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION` remains local-only data validation.
- `RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS` remains route-contract only.
- `RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` remains fail-closed service-role runtime scaffolding.
- `RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD` remains fail-closed credit ledger scaffolding.
- `RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD` remains fail-closed job/worker scaffolding.
- `RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD` remains fail-closed private artifact scaffolding.
- `RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` remains fail-closed render worker scaffolding.
- `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD` is merged at `f7d8a79ed68b0505da33b6056cd0ea1424dc46f4`.
- #577 remains open/draft/blocked and excluded as source-of-truth.

## Duplicate Scan

- Exact open duplicate PR: `none`
- Exact remote duplicate branch: `none`

## Scope

This packet adds a smoke test and diagnostics proving the disabled internal beta lane still blocks the critical negative paths:

- no generation before approved plan and credit approval;
- no credit spend without reservation;
- no frontend/direct provider or raw prompt execution path;
- no worker execution from raw chat;
- no public artifact or signed URL without a future private artifact policy;
- Basic/Pro no-Veo and Premium final-fallback-only Veo policy.

The smoke test invokes only local fail-closed scaffold functions and the deterministic intent compiler. It does not call routes, providers, models, workers, Remotion, FFmpeg/FFprobe, Supabase, SQL, storage, signed URL, public artifact, billing, or media paths.
