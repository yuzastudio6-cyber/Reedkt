# Qwen2.5-VL 7B Fail-Closed Backend Runtime Dispatch Coordinator

Decision: `qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator_implemented_review_required`.

This packet implements the local fail-closed backend dispatch coordinator for Qwen2.5-VL 7B. The coordinator composes the accepted worker job schema, approved-snapshot local queue contract, idempotency check, real lease backend-required boundary, Qwen fail-closed dispatch adapter, private invoke envelope, and private invoke transport preview.

This implementation does not create real jobs, claim real leases, create idempotency rows, invoke Cloud Run, resolve service URLs, fetch identity tokens, run inference, import or load Qwen, initialize vLLM, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md`
- `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `server/validation/worker-schemas.ts`

## Coordinator Pipeline

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

The coordinator stops at the real lease boundary by default. Preview options exist only for local smoke coverage of downstream fail-closed outcomes and still do not call injected transport dependencies.

## Deterministic Blocked Outcomes

- `blocked_invalid_worker_job_schema`
- `blocked_missing_approved_snapshot`
- `blocked_missing_credit_reservation`
- `blocked_missing_source_of_truth_refs`
- `blocked_idempotency_conflict`
- `blocked_real_lease_backend_required`
- `blocked_qwen_dispatch_adapter_fail_closed`
- `blocked_private_invoke_transport_preview_only`

Every outcome returns `ok=false` and keeps runtime side-effect gates false.

## Runtime Gates

- `coordinatorImplemented=true`
- `coordinatorInvokedLocally=true`
- `workerJobSchemaValidated=true`
- `localQueueValidated=true`
- `approvedSnapshotChecked=true`
- `creditReservationChecked=true`
- `sourceOfTruthRefsChecked=true`
- `idempotencyChecked=true`
- `backendLeasePreconditionChecked=true`
- `qwenDispatchAdapterChecked=true`
- `privateInvokeEnvelopeChecked=true`
- `privateInvokeTransportPreviewChecked=true`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
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
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The backend dispatch coordinator can compose the current ReeditPro Qwen queue, snapshot, credit, source-of-truth, idempotency, lease, adapter, envelope, and transport-preview surfaces.
- The coordinator blocks unsafe worker job shapes, missing approved snapshot evidence, missing credit reservation evidence, missing private source-of-truth refs, idempotency conflicts, real lease requirements, Cloud Run adapter execution, and private transport execution.
- The Qwen worker path remains approved-snapshot-first and does not use raw chat as execution input.

## What This Does Not Prove

- no real backend dispatcher is enabled;
- no real queue row, lease row, idempotency row, event row, generated asset row, credit row, or storage row is created;
- no Cloud Run invocation, model load, vLLM startup, or inference is approved;
- no generated asset, public artifact, signed URL, render/export, beta, or production path is approved;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58L-CONTROLLED-BACKEND-DISPATCH-DRY-RUN: run Qwen fail-closed backend dispatch coordinator smoke review, no cloud/no assets/no beta`
