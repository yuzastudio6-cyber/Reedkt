# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Execution Attempt Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_recorded_result_review_required`.

This record completes the first controlled persisted Qwen worker dispatch runtime real-dispatch execution attempt after the real-dispatch execution preflight. It runs only the repo-local controlled persisted runtime shape against the approved fixture queue contract and records the current fail-closed result. It does not create a real persisted job, claim a real lease, invoke Cloud Run, run Qwen inference, create generated assets, create signed URLs, mutate Supabase, run SQL, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Scope

- Workstream: `AI_VIDEO_BROLL_GENERATION`
- Tool: `qwen2_5_vl_7b_instruct`
- Registry tool: `qwen_vl`
- Selected runtime: `google_cloud_run_gpu`
- Selected GPU: `nvidia_l4`
- Cost posture: `scale_to_zero_required`
- Min instances: `0`
- Initial max instances: `1`
- CPU fallback allowed: `false`

## Attempt Inputs

- Approved fixture scope only: true
- Approved snapshot reference required: true
- Credit reservation reference required: true
- Private storage path required: true
- Manifest required: true
- Checksum required: true
- Signed URLs are source of truth: false
- Public URLs are source of truth: false
- Raw chat worker execution allowed: false
- Raw prompt payload execution allowed: false

## Attempt Results

| Attempt | Result | Status |
| --- | --- | --- |
| Real-dispatch default runtime path | blocked as expected | `blocked_real_lease_backend_required` |
| Real-dispatch adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed` |
| Real-dispatch transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only` |

The transport preview reached every runtime boundary as metadata only: worker job schema validation, local queue contract validation, approved snapshot and credit refs, idempotency, backend lease boundary, Qwen dispatch adapter, private invoke envelope, private invoke transport preview, QA/audit/cost/credit boundary, and cleanup boundary.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired=true`
- `realDispatchDefaultAttemptBlocked=true`
- `realDispatchAdapterPreviewBlocked=true`
- `realDispatchTransportPreviewBlocked=true`
- `transportPreviewReachedAllRuntimeBoundaries=true`
- `selectedGpuL4=true`
- `scaleToZeroRequired=true`
- `readyForRealWorkerDispatch=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `workersDispatched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
- `providerCallsMade=false`
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

## What This Proves

- The approved fixture can enter the real-dispatch execution attempt shape.
- The current runtime still blocks at the real backend lease boundary by default.
- Preview-only continuations still block at the Qwen adapter and private invoke transport boundaries.
- The selected GPU and cost posture remain NVIDIA L4, scale-to-zero, minimum instances 0, and initial maximum instances 1.
- No real job, lease, worker claim, job event, backend runtime message, storage object record, signed URL event, QA report, audit event, credit mutation, service request, model load, inference, generated asset, public artifact, beta state, or production state is created.

## What This Does Not Prove

- It does not prove live Cloud Run invocation readiness.
- It does not prove Qwen inference readiness.
- It does not prove generated asset readiness.
- It does not prove beta or production readiness.
- It does not claim `dry_run_passed`.
- It does not claim `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CF-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-ATTEMPT-RESULT-REVIEW: review first real persisted Qwen worker dispatch execution attempt result, no generated assets/no beta`
