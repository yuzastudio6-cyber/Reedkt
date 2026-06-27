# Qwen2.5-VL 7B Cloud Run GPU Fail-Closed Dispatch Adapter

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation`

This packet adds a Qwen-specific fail-closed dispatch adapter under `src/backend/workers`. The adapter accepts the validated local Qwen queue fixture, checks the approved-snapshot queue contract, and then refuses runtime execution before any worker dispatch, Cloud Run invocation, model import, model load, vLLM startup, forward pass, or inference can occur.

This packet does not dispatch a worker, claim a real lease, heartbeat a real worker, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness.ts`
- `src/backend/workers/index.ts`

## Adapter Purpose

Raw chat must not become a worker input. The future execution path remains:

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

The adapter added here stops before private Cloud Run invocation. It is the worker-owned place where a later transport prompt can attach service-to-service invocation once backend runtime, lease, idempotency, credit, and observability gates are implemented.

## Adapter Contract

| Field | Value |
| --- | --- |
| Adapter ID | `qwen2_5_vl_cloud_run_gpu_fail_closed_dispatch_adapter` |
| Worker type | `qwen2_5_vl_cloud_run_gpu_worker` |
| Job type | `media_analysis` |
| Runtime schema | `qwen2_5_vl_cloud_run_gpu_runtime_request_v1` |
| Accepts local queue contract | true |
| Submits dispatch | false |
| Invokes Cloud Run | false |
| Enables inference | false |

## Behavior

The adapter has two local outcomes:

- `blocked_invalid_queue_contract`: the adapter refuses invalid queue fixtures before runtime invocation.
- `blocked_fail_closed_cloud_run_invocation_disabled`: the adapter accepts the queue contract shape but refuses Cloud Run invocation and inference.

Both outcomes return `ok=false`.

## Accepted Inputs

- Validated `runWorkerJobSchema` queue envelope.
- Approved-snapshot runtime payload.
- Credit reservation reference.
- Queue lease reference.
- Idempotency key.
- Private source-of-truth references.

## Refused Inputs

- Invalid queue contract.
- Raw prompt payload.
- Signed URL source of truth.
- Public URL source of truth.
- Enabled runtime gate.
- Model policy mismatch.
- Missing approved snapshot.
- Missing credit reservation.
- Missing queue lease.

## Required Before Enabling Cloud Run Invocation

- Backend dispatch route for the Qwen worker.
- Service-role transactional job claim and lease.
- Backend idempotency conflict enforcement.
- Private Cloud Run service-to-service invocation auth.
- Approved snapshot hash verification.
- Credit reservation verification.
- Failure release or refund policy.
- Observability for dispatch attempts and results.

## Runtime Flags

- `adapterImplemented=true`
- `adapterInvokedLocally=true`
- `validQueueFixtureRefusedFailClosed=true`
- `invalidQueueFixtureRefusedBeforeRuntime=true`
- `dispatchSubmitted=false`
- `cloudRunInvocationAttempted=false`
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

- Qwen now has a worker-owned dispatch adapter surface.
- The adapter validates the existing approved-snapshot local queue contract.
- Valid queue fixtures are still refused fail-closed before Cloud Run invocation.
- Invalid queue fixtures are refused before runtime.
- The adapter is exported from the worker surface for future backend runtime integration.

## What This Does Not Prove

- It does not prove live job creation.
- It does not prove real lease claim or heartbeat.
- It does not prove worker dispatch.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_35-CLOUD-RUN-GPU-PRIVATE-INVOKE-PLAN: plan private Cloud Run invocation transport for Qwen dispatch adapter, no invocation`
