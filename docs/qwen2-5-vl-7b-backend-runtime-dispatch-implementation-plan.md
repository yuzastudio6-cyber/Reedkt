# Qwen2.5-VL 7B Backend Runtime Dispatch Implementation Plan

Decision: `qwen2_5_vl_backend_runtime_dispatch_implementation_plan_recorded_fail_closed_coordinator_required`.

This packet plans the backend runtime dispatch implementation after approved worker integration readiness. It identifies the existing ReeditPro queue, lease, idempotency, Qwen fail-closed dispatch adapter, private invoke envelope, private invoke config, and private invoke transport preview surfaces that must be composed before any future real Qwen worker dispatch can be considered.

This plan does not implement real dispatch, create jobs, claim real leases, invoke Cloud Run, resolve service URLs, fetch identity tokens, run inference, import or load Qwen, initialize vLLM, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `src/backend/services/job-queue-runtime-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/runtime/idempotency-service.ts`
- `server/validation/worker-schemas.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- `docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md`

## Existing Backend Surfaces

| Surface | Current state | Implementation use |
| --- | --- | --- |
| `runWorkerJobSchema` | available | Validate the future Qwen job envelope before any backend runtime action. |
| `queueMockJob` / queue item helpers | mock-safe only | Inform the future real queue shape; not sufficient for live mutation. |
| `claimWorkerLeaseMock` | mock-safe only | Defines lease lifecycle expectations, but real transactional claim is still required. |
| `claimWorkerLease()` | backend-required fail-closed | Confirms real lease claim is intentionally unavailable in frontend/mock runtime. |
| `checkIdempotencyConflictMock` / `recordIdempotencyResultMock` | mock-safe only | Defines idempotency behavior; real backend persistence still required. |
| Qwen fail-closed dispatch adapter | implemented | Validates the local Qwen queue fixture and refuses runtime execution. |
| Qwen private invoke envelope | implemented | Builds the future POST envelope without service URL, auth header, or invocation. |
| Qwen private invoke config | implemented | Defines backend-only service target/config defaults with invocation disabled. |
| Qwen private invoke transport preview | implemented | Validates future transport boundaries without calling dependencies. |

## Required Implementation Shape

The next implementation should add a backend-only, fail-closed Qwen dispatch coordinator that composes the accepted surfaces in this order:

```text
runWorkerJobSchema validation
→ approved snapshot + credit + source-of-truth checks
→ idempotency conflict check
→ transactional lease precondition
→ Qwen fail-closed dispatch adapter
→ Qwen private invoke envelope
→ Qwen private invoke transport preview
→ local result classification
→ no persistence / no runtime side effect
```

The coordinator must default to no dispatch. It should accept only the approved-snapshot local Qwen queue fixture and return a deterministic blocked result until a future approved backend runtime prompt supplies real queue persistence, lease mutation, private invocation dependencies, observability, credit failure handling, and cleanup.

## Required Coordinator Outcomes

The fail-closed coordinator should expose these outcomes:

- `blocked_invalid_worker_job_schema`
- `blocked_missing_approved_snapshot`
- `blocked_missing_credit_reservation`
- `blocked_missing_source_of_truth_refs`
- `blocked_idempotency_conflict`
- `blocked_real_lease_backend_required`
- `blocked_qwen_dispatch_adapter_fail_closed`
- `blocked_private_invoke_transport_preview_only`

Every outcome must keep runtime side-effect gates false.

## Runtime Gate Requirements

The next coordinator must keep these false:

- `realJobCreated=false`
- `realLeaseClaimed=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `identityTokenFetched=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Backend Runtime Work Still Required

- Real backend queue persistence for Qwen jobs.
- Transactional lease claim, heartbeat, renewal, completion, failure, expiry, stale recovery, and cleanup.
- Real idempotency persistence and conflict handling.
- Approved plan snapshot hash/version verification against source-of-truth records.
- Credit reservation verification plus failure release/refund behavior.
- Private source-of-truth refs with manifests and checksums.
- Backend-only Cloud Run service URL and audience resolution.
- Backend-only identity-token fetch and request send, only in a future approved runtime prompt.
- Observability for dispatch attempt, lease state, service response, failure class, retry decision, and cleanup.

## What This Proves

- The existing repo has enough local/mock-safe queue, lease, idempotency, Qwen adapter, envelope, config, and transport-preview surfaces to implement a fail-closed backend dispatch coordinator next.
- The next code step can be bounded and non-runtime: it can validate composition without invoking Cloud Run or mutating backend state.

## What This Does Not Prove

- no real backend dispatcher exists yet;
- no real job row, lease row, idempotency row, event row, generated asset row, credit row, or storage row is created;
- no Cloud Run invocation, model load, vLLM startup, or inference is approved;
- no generated asset, public artifact, signed URL, render/export, beta, or production path is approved;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58K-FAIL-CLOSED-BACKEND-RUNTIME-DISPATCH-COORDINATOR: implement Qwen backend dispatch coordinator fail-closed, no cloud/no assets/no beta`
