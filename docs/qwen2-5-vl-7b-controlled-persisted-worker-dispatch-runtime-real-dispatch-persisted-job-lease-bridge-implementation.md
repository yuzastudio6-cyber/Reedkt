# Qwen2.5-VL 58DD Persisted Job / Lease Bridge Implementation

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_implemented_fail_closed_result_review_required`.

This packet implements the Qwen2.5-VL controlled persisted job and lease bridge as a fail-closed TypeScript backend worker helper. It converts the 58DC bridge plan into a deterministic bridge surface that validates the approved Qwen worker job envelope, checks private source-of-truth refs, verifies idempotency conflict behavior, creates controlled bridge references, builds the private invoke envelope, and stops at private invoke transport preview.

This does not run inference. It does not create real Supabase rows, claim a real lease, execute SQL, invoke Cloud Run, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, create generated assets, create public artifacts, create signed URLs, mutate credits, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Documents And Code

- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `intent-led-edit-planning.md`
- `model-routing-policy.md`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`

## Implementation Status

- 58DC bridge plan recorded: true
- 58DD bridge implementation recorded: true
- bridge implementation required: false
- bridge result review required: true
- approved Qwen queue fixture accepted: true
- idempotency conflict blocked: true
- private invoke envelope checked: true
- private invoke transport preview checked: true
- private invoke transport executed: false
- Cloud Run invocation attempted: false
- inference run: false
- generated assets created: false
- beta ready: false
- production ready: false

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
- minimum instances: `0`
- initial max instances: `1`
- CPU fallback allowed: `false`

## Bridge Behavior

The new helper is `runQwen25VlControlledPersistedJobLeaseBridge`.

It validates:

- `runWorkerJobSchema`
- Qwen local queue contract
- approved plan snapshot refs
- credit reservation refs
- private source-of-truth refs
- signed URL and public URL non-source-of-truth rules
- raw prompt rejection
- model policy match
- all runtime gates false
- idempotency conflict behavior

It creates controlled reference metadata for:

- approved Qwen job
- idempotency key
- lease id
- lease expiry
- worker claim id
- backend runtime message id
- sanitized job event id
- private manifest refs
- checksum refs
- structured finding ids
- edit intent ids
- private invoke envelope acceptance

These are local reference metadata only. They are not live Supabase rows and do not imply production worker dispatch.

## Required Runtime Outcomes

The bridge must keep these fail-closed outcomes covered:

| Outcome | Expected status |
| --- | --- |
| valid approved fixture bridge preview | `blocked_private_invoke_transport_preview_only` |
| idempotency conflict | `blocked_idempotency_conflict` |
| missing approved snapshot | `blocked_missing_approved_snapshot` |
| missing credit reservation | `blocked_missing_credit_reservation` |
| missing private source-of-truth refs | `blocked_missing_source_of_truth_refs` |
| invalid worker job schema | `blocked_invalid_worker_job_schema` |

## Bridge References

Required reference fields:

- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `jobId`
- `jobType`
- `workerType`
- `workerInstanceId`
- `idempotencyKey`
- `leaseId`
- `leaseExpiresAt`
- `workerClaimId`
- `backendRuntimeMessageId`
- `jobEventId`
- `privateManifestRefs`
- `checksumRefs`
- `structuredFindingIds`
- `editIntentIds`

Forbidden fields remain absent from bridge payloads:

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

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplemented=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired=true`
- `approvedJobIntakeChecked=true`
- `persistedIdempotencyGuardChecked=true`
- `persistedJobReferenceCreated=true`
- `persistedLeaseReferenceCreated=true`
- `sanitizedJobEventReferenceCreated=true`
- `backendRuntimeMessageReferenceCreated=true`
- `workerClaimReferenceCreated=true`
- `privateSourceOfTruthRefsChecked=true`
- `privateInvokeEnvelopeChecked=true`
- `privateInvokeTransportPreviewChecked=true`
- `qaAuditCostCreditBoundaryChecked=true`
- `idempotencyConflictBlocked=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `mockRecordsStoredInMemoryOnly=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeHandoffAllowedNow=false`
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
- `supabaseTouched=false`
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

## What This Moves Forward

The previous blocker was “bridge implementation required.” This implementation records the bridge as implemented fail-closed and changes the next blocker to bridge result review. It still does not authorize another Qwen inference attempt.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DE-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-RESULT-REVIEW: review the fail-closed persisted job and lease bridge result, no inference/no generated assets/no beta`
