# Qwen2.5-VL 58DC Persisted Job / Lease Bridge Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_plan_recorded_implementation_required`.

This packet plans the missing persisted job and lease bridge for Qwen2.5-VL controlled persisted worker dispatch. It records what must be implemented before another approved-fixture Qwen inference attempt can run through the real ReeditPro worker path.

This is plan-only. It does not create a job row, claim a real lease, write idempotency, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA reports, create audit events, mutate credits, resolve a service target, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, create generated assets, create public artifacts, mutate Supabase, execute SQL, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Documents

- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `intent-led-edit-planning.md`
- `model-routing-policy.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-result.ts`

## Current Evidence

- approved-fixture inference attempt result recorded: true
- persisted job / lease bridge plan recorded: true
- persisted job / lease bridge implementation required: true
- real worker dispatch ready: false
- private invoke handoff allowed now: false
- Cloud Run invocation now: false
- Qwen inference now: false
- generated asset creation now: false
- Supabase mutation now: false
- SQL execution now: false

The 58DB attempt result found the important gap: the structured Qwen fixture inference path works, and the fail-closed transport attempt proved private reachability, but the current TypeScript persisted worker dispatch runtime still blocks by design at `blocked_real_lease_backend_required`. Reusing the older CPU-only caller path would not prove persisted job and lease dispatch.

## Correct Execution Path

Workers execute approved snapshots, not raw chat:

```text
approved plan snapshot
→ persisted worker job
→ persisted idempotency guard
→ transactional lease claim
→ sanitized job event
→ backend runtime message
→ worker claim
→ private invoke handoff
→ Qwen metadata result review
```

## Selected Runtime

- platform: `google_cloud_run_gpu`
- GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

## Bridge Plan

### Approved Job Intake

Owner: `WORKER_RUNTIME_JOBS`.

The future implementation must accept exactly one Qwen `media_analysis` job envelope that passes `runWorkerJobSchema`, requires approved plan snapshot refs, immutable plan version refs, structured finding ids, edit intent ids, and Qwen task refs.

It must reject raw chat, raw prompts, arbitrary media, public URLs, signed URL source-of-truth, and enabled runtime gates.

Current execution allowed: false.

### Persisted Idempotency Guard

Owner: `WORKER_RUNTIME_JOBS`.

The future implementation must persist idempotency by workspace, approved snapshot, job id, task ref, and fixture attempt scope.

It must block duplicate source mismatch before lease claim or private invoke handoff. It may return a compatible recorded result only when the source and approved snapshot match.

Current execution allowed: false.

### Transactional Job And Lease Claim

Owner: `WORKER_RUNTIME_JOBS`.

The future implementation must claim one eligible queued Qwen job in a transaction with one active lease per job. It must record lease id, expiry, worker instance id, and worker type without exposing secret token values.

Stale lease recovery and timeout cleanup must be deterministic before any retry.

Current execution allowed: false.

### Job Event, Runtime Message, And Worker Claim

Owner: `WORKER_RUNTIME_JOBS`.

The future implementation must record sanitized job events for bridge-created attempt start, block, fail, cleanup, and completion states.

It must create backend runtime message refs for the private invoke handoff without storing raw model output, and worker claim refs tied to workspace, project, approved snapshot, job, lease, and idempotency key.

Current execution allowed: false.

### Private Source-Of-Truth Refs

Owner: `SUPABASE_RLS_STORAGE_DATABASE`.

The bridge must require Supabase row refs, private manifest refs, checksum refs, and approved snapshot refs before any handoff.

Signed URLs and public URLs remain non-source-of-truth. This bridge plan does not create storage objects, signed URLs, generated assets, or public artifacts.

Current execution allowed: false.

### Private Invoke Handoff Boundary

Owner: `PROVIDER_GATEWAY_MODELS`.

The bridge may only hand off an approved private invoke envelope after job, lease, idempotency, and source refs exist.

Service target, audience, identity token, and auth header stay runtime-scoped and non-persisted. This plan does not call Cloud Run, import Qwen, load Qwen, initialize vLLM, or run inference.

Current execution allowed: false.

### QA, Audit, Cost, And Credit Boundary

Owner: `OBSERVABILITY_AUDIT_COST`.

The bridge must record sanitized readiness metadata for no-call, blocked, cleanup, and future handoff states. Cost posture stays scale-to-zero with one bounded approved fixture scope.

Credit estimate, reservation spend, release, refund, and payment operations remain blocked.

Current execution allowed: false.

### Cleanup, Retry, And Result Review

Owner: `WORKER_RUNTIME_JOBS`.

Cleanup must handle duplicate idempotency, failed lease claim, stale lease, invalid handoff, timeout, and later private invoke failure. Cleanup cannot delete approved snapshot refs, private source-of-truth refs, or audit evidence.

Future bridge implementation must still require preflight, controlled attempt, and result review before inference readiness.

Current execution allowed: false.

## Future Implementation Shape

Required refs:

- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `jobId`
- `leaseId`
- `workerClaimId`
- `backendRuntimeMessageId`
- `idempotencyKey`
- `privateManifestRefs`
- `checksumRefs`
- `structuredFindingIds`
- `editIntentIds`

Forbidden payload fields:

- `prompt`
- `raw_prompt`
- `rawPrompt`
- `rawWorkerPrompt`
- `raw_worker_prompt`
- `serviceUrl`
- `audience`
- `identityToken`
- `authHeader`
- `publicUrl`
- `signedUrl`

Required behavior:

- one active lease per job: true
- duplicate source mismatch blocked: true
- backend-only mutation required for future implementation: true
- private invoke handoff allowed by this plan now: false

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptResultRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired=true`
- `approvedJobIntakePlanned=true`
- `persistedIdempotencyGuardPlanned=true`
- `transactionalJobAndLeaseClaimPlanned=true`
- `jobEventRuntimeMessageWorkerClaimPlanned=true`
- `privateSourceOfTruthRefsPlanned=true`
- `privateInvokeHandoffBoundaryPlanned=true`
- `qaAuditCostCreditBoundaryPlanned=true`
- `cleanupRetryAndResultReviewPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `bridgeImplementedNow=false`
- `privateInvokeHandoffAllowedNow=false`
- `readyForRealWorkerDispatch=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `workerClaimCreated=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
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

## What This Moves Forward

The previous blocker was “bridge required.” This packet records the bridge plan and changes the next blocker to bridge implementation. It does not claim the bridge exists.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DD-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-IMPLEMENTATION: implement the persisted job and lease bridge fail-closed, no inference/no generated assets/no beta`
