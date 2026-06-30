# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Invoke Attempt Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_attempt_completed_fail_closed_result_review_required`.

This packet records one bounded approved-fixture private invoke attempt through the persisted job and lease bridge. It created one CPU-only Cloud Run Job execution and sent one private service request under the approved fixture scope. It did not run Qwen inference, import Qwen, load Qwen, initialize vLLM, process a prompt, run a forward pass, create generated assets, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

This result is evidence only. It proves the approved CPU-only caller could use the persisted dispatch reference envelope, fetch an identity token inside backend/runtime scope, create an auth header without exposing it, send one private request to the Qwen Cloud Run service, and receive the expected fail-closed inference-disabled response. It does not make Qwen user-facing-ready. Result review remains required before the readiness rollup can advance.

## Reviewed Evidence

- attempt approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.md`
- attempt approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-approval.ts`
- approved-fixture private invoke preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight.md`
- persisted job/lease bridge result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md`
- CPU-only caller source: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- private invoke response classifier: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`

## Sanitized Command Summary

The attempt resolved the Qwen Cloud Run service target and audience in memory only, then executed one CPU-only Cloud Run Job task with approved-fixture dispatch references and `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`.

The command output and logs were sanitized:

- local CLI output target URL detected: true
- target URL value stored in repo: false
- target URL value printed in this report: false
- Cloud Run log URL values present in stored evidence: false
- identity token printed: false
- auth header printed: false
- raw response body stored: false
- generated output stored: false

## Preflight State

- project verified: `reeditpro`
- GPU service: `reeditpro-qwen2-5-vl-l4-worker`
- GPU service region: `us-central1`
- GPU service ready: true
- selected GPU: `nvidia_l4`
- max scale observed: 1
- minimum scale configured: false
- CPU caller job: `reeditpro-qwen2-5-vl-private-caller`
- CPU caller ready: true
- CPU caller default execution gate false: true
- CPU caller default fixture inference expectation false: true
- CPU caller persistent target URL configured: false
- CPU caller persistent audience configured: false

## Attempt Result

- run id: `qwen25-approved-fixture-private-invoke-attempt-20260630T161436Z`
- execution name: `reeditpro-qwen2-5-vl-private-caller-44hxx`
- created at: `2026-06-30T16:14:38.343116Z`
- started at: `2026-06-30T16:14:50.748885Z`
- completed at: `2026-06-30T16:17:20.634831Z`
- completed: true
- succeeded count: 1
- failed count: 0
- selected path: `cpu_only_internal_caller_cloud_run_job_with_persisted_dispatch_reference_env`
- persisted job reference sent: true
- lease reference sent: true
- idempotency reference sent: true
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

## What This Proves

- The bounded CPU-only caller can reach the private Qwen service contract path through the approved backend/runtime route.
- The caller can carry persisted dispatch reference metadata for job, lease, worker, and idempotency scope.
- The caller can fetch an identity token inside runtime scope without printing or storing token values.
- The private service responds fail-closed when inference is disabled.
- The response classifier can treat HTTP 403 with `qwen_inference_disabled_after_contract_check` as expected fail-closed contract evidence.
- NVIDIA L4 remains the selected run-on-use, scale-to-zero GPU posture.

## What This Does Not Prove

- It does not prove Qwen inference readiness.
- It does not prove model import, model load, vLLM engine initialization, prompt processing, or forward pass.
- It does not create, persist, or accept structured Qwen metadata output.
- It does not create real Supabase worker job rows, lease rows, idempotency rows, or source-of-truth rows.
- It does not create generated assets, public artifacts, signed URLs, storage objects, Supabase rows, SQL changes, credit rows, approval rows, beta readiness, or production readiness.
- It does not prove user-facing worker dispatch readiness.
- It does not claim `generated_local_fixture_passed`.

## Runtime Gates

- `approvedFixturePrivateInvokeAttemptApprovalRecorded=true`
- `approvedFixturePrivateInvokeAttemptRequired=false`
- `approvedFixturePrivateInvokeAttemptRecorded=true`
- `approvedFixturePrivateInvokeAttemptPassedFailClosed=true`
- `approvedFixturePrivateInvokeAttemptResultReviewRequired=true`
- `localCommandOutputTargetUrlDetected=true`
- `targetUrlValueStoredInRepo=false`
- `targetUrlValuePrintedToFinalReport=false`
- `logPayloadUrlValueDetected=false`
- `logPayloadTokenValueDetected=false`
- `selectedGpuL4=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
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

The next action is result review. The review must decide whether this fail-closed approved-fixture private invoke attempt is sufficient to advance the readiness blocker while still keeping inference, generated assets, public artifacts, signed URLs, storage, Supabase mutation, credits, beta, production, and `generated_local_fixture_passed` blocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DL-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-ATTEMPT-RESULT-REVIEW: review bounded approved-fixture private invoke attempt result, no inference/no generated assets/no beta`
