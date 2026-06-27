# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Dispatch Readiness

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_dispatch_readiness_audited_no_dispatch`

This packet audits the Worker Runtime dispatch readiness boundary for future Qwen2.5-VL approved-snapshot jobs. The local queue contract is structurally valid, but real dispatch remains blocked because ReeditPro still needs backend/service-role worker runtime dispatch, transactional queue leasing, private Cloud Run invocation wiring, and side-effect reconciliation before any Qwen job can execute.

This packet does not dispatch a worker, claim a real lease, heartbeat a real worker, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `approved-plan-snapshot-policy.md`
- `intent-led-edit-planning.md`
- `model-routing-policy.md`
- `editing-agent-execution-architecture.md`
- `docs/backend-readiness-gap-report.md`
- `server/validation/worker-schemas.ts`
- `src/types/job-runtime.ts`
- `src/types/worker-lease.ts`
- `src/backend/services/job-gate-service.ts`
- `src/backend/services/job-queue-runtime-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/services/worker-dispatch-service.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`

## Dispatch Path

Raw chat must not become a worker input. The only acceptable future path remains:

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ credit reservation
→ queue lease / worker contract
→ bounded Qwen runtime request
→ private Cloud Run invocation
```

This dispatch-readiness packet stops before the final private invocation step.

## Current Readiness Decision

| Area | Status | Notes |
| --- | --- | --- |
| Qwen runtime contract | ready for local validation | Runtime request schema exists and valid requests still return no-inference. |
| Qwen local queue contract | ready for dispatch planning | Queue envelope validates against `runWorkerJobSchema`. |
| Worker runtime gate | blocked | Real backend runtime dispatch remains missing. |
| Real queue lease | blocked | Service-role transactional lease claim is required. |
| Idempotency | partial | Mock idempotency helpers exist; backend enforcement is required. |
| Cloud Run invocation | blocked | Private service-to-service invocation is not wired from worker runtime. |
| Supabase queue/job mutation | blocked | No live queue row mutation is performed by this packet. |
| Credit mutation | blocked | No spend, release, refund, or reservation mutation is performed by this packet. |
| Inference | blocked | Qwen inference remains disabled. |

The dispatch readiness status is `blocked_backend_runtime_missing`.

## Worker Runtime Surfaces

The Qwen dispatch path must reuse existing Worker Runtime surfaces:

- `runWorkerJobSchema` for the API/queue envelope.
- `JobRuntimeQueueItem` for queued work representation.
- `checkJobRuntimeGates` for approval, credit, dependency, timing, and backend-runtime gates.
- `claimWorkerLeaseMock` as the mock-only shape for future lease behavior.
- `checkIdempotencyConflictMock` / `recordIdempotencyResultMock` as the mock-only idempotency shape.
- `dispatchMockWorkerJob` as an existing mock dispatch placeholder that Qwen must not call until a Qwen-specific dispatch adapter is approved.

Real production dispatch must be backend-only and service-role controlled.

## Required Before Real Dispatch

Real dispatch for Qwen remains blocked until these are accepted and implemented:

- Backend dispatcher route for `qwen2_5_vl_cloud_run_gpu_worker`.
- Transactional job claim and lease with heartbeat, expiry, renewal, completion, failure, and stale recovery.
- Idempotency conflict handling around queue dispatch and Cloud Run invocation.
- Approved plan snapshot read/verification by service-role backend.
- Credit reservation verification and failure refund/release policy.
- Private source-of-truth references: Supabase row references, private manifests, checksums, and approved snapshot references.
- Private Cloud Run invocation auth for the Qwen service.
- No raw prompt payload fields.
- No signed URL or public URL source-of-truth inputs.
- No provider transport, media processing, Track A export, public artifact, or generated asset side effect.
- Runtime observability for dispatch attempt, lease heartbeat, Qwen service response, failure, and retry decision.
- Backend-only secret and service account policy.

## Qwen Worker Identity

| Field | Value |
| --- | --- |
| Worker type | `qwen2_5_vl_cloud_run_gpu_worker` |
| Job type | `media_analysis` |
| Worker kind | `qa` for Worker Runtime readiness classification |
| Runtime kind | `qa_worker` for lease classification |
| Runtime target | Cloud Run GPU service |
| GPU | `nvidia-l4` |
| Serving profile | `bounded_preview_scale_to_zero` |

Qwen is a visual understanding and QA tool. It is not an AI-video generation model, render/export worker, provider fallback route, or broad media processor.

## Blocked Bypasses

The dispatch readiness layer blocks:

- Dispatch without approved plan snapshot.
- Dispatch without credit reservation.
- Dispatch without queue lease.
- Dispatch from raw chat or raw prompt payload.
- Dispatch using signed URLs or public URLs as source of truth.
- Dispatch with enabled inference or provider/media/Track A gates.
- Dispatch with model policy mismatch.
- Dispatch through a generic worker that can complete without Qwen-specific side-effect checks.
- Dispatch before backend runtime service-role lease and idempotency are implemented.

## Runtime Flags

- `dispatchReadinessAudited=true`
- `localQueueContractValid=true`
- `acceptedForDispatchReadinessPlanning=true`
- `readyForRealDispatch=false`
- `backendRuntimeRequired=true`
- `backendRuntimeAvailable=false`
- `workerDispatchAdapterImplemented=false`
- `realLeaseClaimAllowedNow=false`
- `idempotencyBackendEnforced=false`
- `cloudRunInvocationAllowedNow=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- Qwen has a Worker Runtime dispatch-readiness packet tied to existing repo queue, gate, lease, idempotency, and dispatch surfaces.
- The local queue fixture is suitable for future dispatch planning.
- The backend-runtime gate is still the correct blocker before real dispatch.
- Qwen-specific dispatch must not reuse generic mock dispatch as a production substitute.
- The fail-closed runtime model remains intact.

## What This Does Not Prove

- It does not prove live job creation.
- It does not prove real lease claim or heartbeat.
- It does not prove worker dispatch.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_34-CLOUD-RUN-GPU-FAIL-CLOSED-DISPATCH-ADAPTER: add a Qwen-specific fail-closed dispatch adapter, no Cloud Run invocation`
