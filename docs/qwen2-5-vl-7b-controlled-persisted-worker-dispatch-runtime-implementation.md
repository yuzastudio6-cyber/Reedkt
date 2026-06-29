# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Implementation

Status: `implemented_fail_closed`

Decision:
`qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implemented_fail_closed_private_invoke_execution_required`

This document records the backend-only controlled persisted Qwen worker dispatch runtime implementation. It implements the planned runtime boundary from the 58BN runtime plan, but it does not authorize real worker dispatch, Cloud Run invocation, Qwen inference, generated assets, public artifacts, signed URLs, credit mutation, beta, or production.

## Scope

This is a runtime-boundary implementation for approved persisted Qwen worker job shapes only. It composes the existing ReEditPro worker envelope validation, local Qwen queue contract, idempotency guard, backend lease requirement, fail-closed Qwen dispatch adapter, private invoke envelope, and private invoke transport preview boundary.

The selected runtime remains:

- Platform: `google_cloud_run_gpu`
- GPU: `nvidia_l4`
- Region: `us-central1`
- Service: `reeditpro-qwen2-5-vl-l4-worker`
- Cost posture: `scale_to_zero_required`
- Minimum instances: `0`
- Initial max instances: `1`
- CPU fallback: `false`

This keeps the future GPU cost model aligned with run-on-demand behavior: the runtime may be used only when a future approved backend gate dispatches work, and the planned Cloud Run GPU service must remain scaled to zero when idle.

## Source-Of-Truth Path

Qwen runtime work must use persisted source-of-truth references, not browser payloads or signed URLs:

```text
approved plan snapshot
+ credit reservation
+ Supabase row refs
+ private manifest refs
+ checksum refs
+ approved Qwen model policy
```

Signed URLs and public URLs remain non-source-of-truth references.

## Execution Path

Qwen workers must follow the approved ReEditPro path:

```text
user/chat request
-> structured agent findings
-> edit intents
-> approved plan snapshot
-> persisted worker job
-> backend-only lease and idempotency gate
-> Qwen private invoke runtime boundary
```

Raw chat, raw worker prompts, browser calls, direct service URLs, identity tokens, provider secrets, service-role keys, signed URLs, and public artifact paths are not valid runtime inputs.

## Implemented Runtime Surface

File:
`src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`

Exports:

- `runQwen25VlControlledPersistedWorkerDispatchRuntime`
- `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT`

The runtime validates:

- `runWorkerJobSchema`
- approved Qwen local queue fixture contract
- approved plan snapshot reference
- credit reservation reference
- private source-of-truth refs
- idempotency conflict state
- backend lease boundary
- fail-closed Qwen dispatch adapter
- private invoke envelope
- private invoke transport preview
- QA/audit/cost/credit boundary
- cleanup boundary

## Runtime Outcomes

The implementation records these deterministic fail-closed outcomes:

- `blocked_invalid_worker_job_schema`
- `blocked_missing_approved_snapshot`
- `blocked_missing_credit_reservation`
- `blocked_missing_source_of_truth_refs`
- `blocked_idempotency_conflict`
- `blocked_real_lease_backend_required`
- `blocked_qwen_dispatch_adapter_fail_closed`
- `blocked_private_invoke_transport_preview_only`

Default execution stops at `blocked_real_lease_backend_required`. Preview-only paths can inspect adapter and transport boundaries, but still do not resolve service URLs, fetch identity tokens, invoke Cloud Run, run inference, create assets, mutate Supabase, mutate credits, or publish artifacts.

## Gates

- `controlledPersistedWorkerDispatchRuntimePlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeImplementationRequired=false`
- `controlledPersistedWorkerDispatchRuntimeImplemented=true`
- `controlledPersistedWorkerDispatchRuntimeSmokePlanRequired=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `workersDispatched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `serviceUrlResolvedNow=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- A backend-only runtime boundary exists for controlled persisted Qwen dispatch.
- The runtime accepts the approved queue shape only after schema, approved snapshot, credit, private source refs, and idempotency checks pass.
- The runtime stops at the real lease boundary by default.
- The adapter and private invoke transport paths remain preview-only and fail-closed.
- NVIDIA L4 scale-to-zero remains the selected cost posture.

## What This Does Not Prove

- No real worker was dispatched.
- No Cloud Run service was invoked.
- No Qwen model was imported, loaded, initialized, or run.
- No inference output was produced.
- No generated asset, public artifact, signed URL, QA report, audit row, credit mutation, or Supabase mutation was created.
- No beta, production, or generated-local-fixture stage was unlocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BP-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-PLAN: plan controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta`
