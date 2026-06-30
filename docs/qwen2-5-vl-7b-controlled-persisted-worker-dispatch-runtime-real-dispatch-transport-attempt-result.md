# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Attempt Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_passed_fail_closed_result_review_required`.

This packet records the live bounded no-inference transport attempt result. It created one Cloud Run Job execution and one internal service request. It did not run Qwen inference, create generated assets, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

This result is evidence only. It proves the approved CPU-only caller could fetch an identity token inside runtime scope, create an auth header without exposing it, send one private request to the Qwen Cloud Run service, and receive the expected fail-closed inference-disabled response. It does not make the Qwen private runtime user-facing-ready. Result review remains required before the readiness rollup can advance.

## Reviewed Evidence

- attempt approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.md`
- attempt approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-approval.ts`
- transport preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md`
- CPU-only caller source: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- CPU-only caller README: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/README.md`
- private invoke response classifier: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`

## Sanitized Command Summary

The attempt resolved the Qwen Cloud Run service target and audience in memory only, then executed one CPU-only Cloud Run Job task with `QWEN_CPU_CALLER_EXECUTION_ENABLED=true` and `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`.

The command output and logs were sanitized:

- service target value printed: false
- audience value printed: false
- identity token printed: false
- auth header printed: false
- raw response body stored: false
- generated output stored: false

## Preflight State

- project verified: `reeditpro`
- account verified: `aiediting@reeditpro.com`
- GPU service: `reeditpro-qwen2-5-vl-l4-worker`
- GPU service region: `us-central1`
- GPU service ready: true
- GPU service latest ready revision: `reeditpro-qwen2-5-vl-l4-worker-00037-658`
- selected GPU: `nvidia_l4`
- max scale observed: 1
- minimum scale configured: false
- CPU caller job ready: true
- CPU caller default execution gate false: true
- CPU caller default fixture inference expectation false: true
- CPU caller persistent target URL configured: false
- CPU caller persistent audience configured: false

## Attempt Result

- run id: `qwen25-persisted-real-dispatch-transport-attempt-20260630T073537Z`
- execution name: `reeditpro-qwen2-5-vl-private-caller-fwrgv`
- started at: `2026-06-30T07:35:49.156372Z`
- completed at: `2026-06-30T07:37:45.366080Z`
- completed: true
- exit code: 0
- succeeded count: 1
- failed count: 0
- task count: 1
- duration message: `Execution completed successfully in 1m56.2s.`
- selected path: `cpu_only_internal_caller_cloud_run_job`
- target URL resolved in memory: true
- target URL stored: false
- audience resolved in memory: true
- audience stored: false
- identity token fetched inside caller: true
- identity token printed: false
- auth header created inside caller: true
- auth header printed: false
- Cloud Run Job execution created: true
- Cloud Run invocation attempted: true
- service runtime request sent: true
- retry attempted: false

## Response Classification

- HTTP status: 403
- expected HTTP status: 403
- service reason: `qwen_inference_disabled_after_contract_check`
- contract satisfied for future runtime: true
- runtime contract executes now: false
- fixture inference expected: false
- fixture inference smoke passed: false
- model inference enabled: false
- runtime version present: false
- structured metadata output accepted: false
- metadata output stored: false
- raw response body stored: false
- classification status: `blocked_contract_valid_inference_disabled`
- runtime can advance now: false
- output persistence allowed now: false
- credit spend allowed now: false

## Post-Attempt State

- CPU caller default execution gate false: true
- CPU caller default fixture inference expectation false: true
- CPU caller persistent target URL absent: true
- CPU caller persistent audience absent: true
- GPU service revision unchanged: true
- GPU service latest ready revision after attempt: `reeditpro-qwen2-5-vl-l4-worker-00037-658`
- fail-closed environment remains false: true
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The bounded CPU-only caller can reach the private Qwen service contract path through the approved backend/runtime route.
- The caller can fetch an identity token inside runtime scope without printing or storing it.
- The private service responds fail-closed when inference is disabled.
- The response classifier can treat HTTP 403 with `qwen_inference_disabled_after_contract_check` as expected transport evidence.
- NVIDIA L4 remains the selected run-on-use, scale-to-zero GPU posture.

## What This Does Not Prove

- It does not prove Qwen inference readiness.
- It does not prove model import, model load, vLLM engine initialization, prompt processing, or forward pass.
- It does not create, persist, or accept structured Qwen metadata output.
- It does not create generated assets, public artifacts, signed URLs, storage objects, Supabase rows, SQL changes, credit rows, approval rows, beta readiness, or production readiness.
- It does not prove user-facing worker dispatch readiness.
- It does not claim `generated_local_fixture_passed`.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptPassedFailClosed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewRequired=true`
- `selectedGpuL4=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `maxScaleOneObserved=true`
- `serviceUrlResolvedNow=true`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=true`
- `audienceValueStored=false`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `authHeaderCreated=true`
- `authHeaderValueStored=false`
- `cloudRunJobExecutionCreated=true`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `responseClassifiedLocally=true`
- `failClosedResponseObserved=true`
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
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Required Next Step

The next action is result review. The review must decide whether this fail-closed transport attempt is sufficient to advance the readiness blocker while still keeping inference, generated assets, public artifacts, signed URLs, storage, Supabase mutation, credits, beta, production, and `generated_local_fixture_passed` blocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CW-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT-RESULT-REVIEW: review controlled Qwen real-dispatch transport attempt result, no inference/no generated assets/no beta`
