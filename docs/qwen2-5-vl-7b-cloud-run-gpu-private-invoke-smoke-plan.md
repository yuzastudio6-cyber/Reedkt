# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Smoke Plan

Decision: `qwen2_5_vl_cloud_run_gpu_private_invoke_smoke_plan_defined_no_invocation`.

This packet defines the next controlled private invoke smoke for the Qwen2.5-VL 7B Cloud Run GPU worker after the guarded read-only auth/IAM reverify passed. It is a plan and contract gate only. It does not fetch an identity token, resolve or store a service URL, create an auth header, invoke Cloud Run, run model import, load Qwen, initialize vLLM, run a forward pass, run inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator.md`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Verified Preconditions

- read-only auth/IAM reverify: passed
- Cloud Run service describe: passed
- Cloud Run service IAM policy read: passed
- runtime service account describe: passed
- project invoker policy read: passed
- identity token fetched: false
- Cloud Run invocation attempted: false

## Target

- project: `reeditpro`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- runtime identity: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- runtime platform: Google Cloud Run GPU
- GPU: NVIDIA L4
- minimum scale required: `0`
- observed template max scale: `1`
- observed service max scale: `3`
- cost guard review required before invoke: true

## Future Smoke Shape

The future smoke must be backend-only and bounded. It may only prove that a private authenticated request reaches the fail-closed service contract path. It must not prove inference, model load, generated output, worker completion, beta readiness, or production readiness.

Allowed future smoke candidates:

- authenticated `GET /healthz` or `GET /readyz` to read fail-closed gate state;
- authenticated `POST /` with a valid approved-snapshot runtime request body derived from the existing local queue fixture;
- response classification through `classifyQwen25VlPrivateInvokeResponse`;
- no retry unless a separate idempotency retry gate is approved.

Required future POST expectation:

- method: `POST`
- path: `/`
- content type: `application/json`
- max body bytes: `65536`
- expected status: `403`
- expected reason: `qwen_inference_disabled_after_contract_check`
- expected `contractSatisfiedForFutureRuntime`: true
- expected `modelInferenceEnabled`: false
- expected runtime advancement: false

## Runtime Approval Gates

A future execution prompt must explicitly set every approval gate before calling transport dependencies:

- `invocationEnabledNow=true`
- `authReverifyPassed=true`
- `cloudRunServiceDescribeVerified=true`
- `cloudRunIamPolicyVerified=true`
- `runtimeServiceAccountVerified=true`
- `projectInvokerPolicyVerified=true`

This plan does not set those gates to true for execution. It only records the conditions for a later prompt.

## Cost Guard

The selected runtime remains cost-first: Cloud Run GPU, NVIDIA L4, scale-to-zero, no CPU fallback, one request at a time. The read-only service inspection observed no minimum scale annotation and template max scale `1`, but also observed service-level max scale `3`. The next prompt must review that service-level max scale before any request is sent.

## Forbidden Smoke Behavior

- raw chat or raw worker prompt execution
- user media or broad media input
- model download, model import, model load, vLLM startup, forward pass, or inference
- generated asset, public artifact, signed URL, or storage write
- Supabase mutation or SQL
- credit estimate, reservation, spend, refund, release, or Stripe/payment action
- frontend invocation
- public unauthenticated invocation
- service URL or identity-token value checked into repo evidence
- retry without approved idempotency policy
- beta or production unlock

## Runtime Flags

- `privateInvokeSmokePlanDefined=true`
- `authIamReverifyPassed=true`
- `futureIdentityTokenFetchMayBeRequested=false`
- `futureCloudRunRequestMayBeRequested=false`
- `smokeExecutedNow=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `forwardPassRun=false`
- `inferenceRun=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_52-PRIVATE-INVOKE-SMOKE-EXECUTE: run controlled private invoke contract smoke, no inference`
