# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_plan_recorded_runtime_implementation_required`.

This packet records the runtime plan after the controlled persisted worker dispatch smoke result review. It translates the accepted mock-only persisted dispatch evidence into an implementation shape for a future backend-only, fail-closed runtime. It does not implement real dispatch, create jobs, claim real leases, invoke Cloud Run, resolve service URLs, fetch identity tokens, create auth headers, import or load Qwen, initialize vLLM, run inference, mutate Supabase cloud, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-result-review.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review-smoke.ts`
- `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/runtime/backend-runtime-transport-service.ts`

## Runtime Selection

- platform: Google Cloud Run GPU
- GPU: NVIDIA L4
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- maximum instances for the first runtime: 1
- CPU fallback: false

NVIDIA L4 remains the cost-friendly GPU target because the Qwen runtime is visual-understanding and visual-QA metadata only, the workload should be bounded by approved snapshots, and the service must scale to zero when idle.

## Required Runtime Path

```text
structured agent findings
→ edit intents
→ approved plan snapshot
→ persisted Qwen worker job
→ backend-only idempotency check
→ backend-only transactional lease claim
→ Qwen fail-closed dispatch adapter
→ private invoke envelope
→ backend-only private invoke transport gate
→ sanitized job event / runtime message
→ QA, audit, cost, credit, and cleanup evidence
```

Raw chat must not become a worker payload. Signed URLs and public URLs must not become source of truth.

## Required Source Of Truth

The future runtime implementation must require all of these references before any dispatch attempt:

- approved snapshot id, checksum, immutable plan version, structured finding refs, and edit intent refs
- credit reservation reference
- private storage path reference
- private manifest reference
- checksum reference
- Qwen runtime config reference
- idempotency key scoped to workspace, approved snapshot, job type, and request hash

## Runtime Implementation Plan

| Area | Future behavior | Must block |
| --- | --- | --- |
| approved snapshot intake | Load only approved snapshot, credit reservation, private source refs, manifest refs, checksums, and bounded Qwen use-case metadata from persisted job payloads. | raw chat, raw prompt fields, missing approved snapshot, missing credit reservation, signed URL source of truth |
| idempotency and job claim | Check idempotency before lease claim, persist deterministic conflicts, and permit only one active Qwen claim per approved snapshot/job scope. | idempotency conflict, duplicate active worker claim, lease claim without backend ownership |
| lease lifecycle | Use backend-only transactional claim, heartbeat, renewal, completion, failure, expiry, stale recovery, and cleanup semantics. | frontend lease claim, stale claim without cleanup, orphaned worker state |
| Qwen adapter and envelope | Build the private invoke envelope from persisted source-of-truth refs and bounded visual-analysis use case only. | frontend Cloud Run invocation, direct service URL exposure, token persistence, provider-secret persistence |
| private invoke transport boundary | Keep transport dependencies injected and disabled until later approved execution revalidates IAM, service URL, audience, token fetch, timeout, response classification, and cleanup. | Cloud Run invocation now, identity token fetch now, service runtime request now |
| QA, audit, cost, credit | Record only sanitized plan metadata now; future implementation must attach QA, audit, cost, credit reservation, failure release/refund, and cleanup evidence before runtime acceptance. | credit spend without approved result, QA report without generated asset review, audit event with secret values |
| result and cleanup | Future runtime must finalize job state, release lease, record sanitized events, preserve private refs, and fail closed on partial failure. | generated asset row before QA/storage acceptance, public artifact, signed URL, beta or production claim |

## Required Runtime Statuses

- `queued_approved_snapshot_job`
- `blocked_invalid_worker_job_schema`
- `blocked_missing_approved_snapshot`
- `blocked_missing_credit_reservation`
- `blocked_missing_source_of_truth_refs`
- `blocked_idempotency_conflict`
- `blocked_real_lease_backend_required`
- `blocked_qwen_dispatch_adapter_fail_closed`
- `blocked_private_invoke_transport_dependencies`
- `blocked_private_invoke_transport_preview_only`
- `blocked_runtime_approval_missing`
- `blocked_cleanup_required`
- `blocked_qa_audit_cost_evidence_required`

## Blocked Bypasses

- raw chat worker input
- raw prompt payload fields
- raw model output persistence
- signed URL source of truth
- public URL source of truth
- frontend browser invocation
- direct Cloud Run service URL exposure
- token or bearer header persistence
- provider secret persistence
- service role key value persistence
- database URL persistence
- duplicate active worker claims
- missing credit reservation
- missing approved snapshot
- missing private storage checksum manifest
- generated asset row before QA/storage acceptance
- beta or production readiness claim

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimePlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeImplementationRequired=true`
- `controlledPersistedWorkerDispatchRuntimeImplemented=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `workerClaimCreated=false`
- `storageObjectRecordCreated=false`
- `signedUrlEventCreated=false`
- `qaReportCreated=false`
- `auditEventCreated=false`
- `creditMutationCreated=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The runtime implementation shape is now recorded against the accepted smoke result review.
- The next implementation can be bounded: backend-only, persisted, idempotent, lease-aware, approved-snapshot-only, private-source-of-truth-only, and fail-closed.
- L4 / scale-to-zero remains the selected cost posture.

## What This Does Not Prove

- no real worker dispatch is implemented;
- no real job, lease, idempotency, event, runtime message, worker claim, storage, QA, audit, or credit row is created;
- no Cloud Run invocation, model load, vLLM startup, or inference is approved;
- no generated asset, public artifact, signed URL, render/export, beta, or production path is approved;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BO-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-IMPLEMENTATION: implement controlled persisted Qwen worker dispatch runtime fail-closed, no Cloud Run invocation/no inference/no assets/no beta`
