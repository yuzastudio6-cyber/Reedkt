# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Inference Attempt Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_attempt_approval_accepted_attempt_required`.

This packet approves a future controlled Qwen approved-fixture inference attempt. It accepts the recorded static preflight as sufficient evidence to allow a later prompt to attempt one bounded approved-fixture inference through persisted worker dispatch, but it does not create a job, claim a lease, resolve runtime values, invoke Cloud Run, import or load Qwen, initialize vLLM, process a prompt, run a forward pass, run inference, persist output, or create generated assets now.

This is attempt approval only. It does not create real worker jobs, claim leases, create idempotency rows, create job events, create backend runtime messages, resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompt text, run a forward pass, run Qwen inference, create generated assets, create storage objects, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- approved-fixture inference preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.md`
- approved-fixture inference preflight spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight.ts`
- approved-fixture inference preflight smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-preflight-smoke.ts`
- approved-fixture inference approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md`
- approved-fixture inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`

## Approval Outcome

- approved-fixture inference preflight recorded: true
- approved-fixture inference preflight passed: true
- controlled approved-fixture inference attempt approval required: false
- controlled approved-fixture inference attempt approval recorded: true
- controlled approved-fixture inference attempt approved for future bounded attempt: true
- controlled approved-fixture inference attempt required: true
- future real job creation during attempt approved: true
- future lease claim during attempt approved: true
- future idempotency record during attempt approved: true
- future private invoke runtime values during attempt approved: true
- future Cloud Run invocation during attempt approved: true
- future model import during attempt approved: true
- future model load during attempt approved: true
- future vLLM initialization during attempt approved: true
- future prompt processing during attempt approved: true
- future forward pass during attempt approved: true
- future single fixture inference during attempt approved: true
- future sanitized metadata result during attempt approved: true
- real job creation approved now: false
- lease claim approved now: false
- idempotency record approved now: false
- private invoke runtime values approved now: false
- Cloud Run invocation approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- inference approved now: false
- generated asset creation approved now: false
- storage object creation approved now: false
- signed URL creation approved now: false
- public artifact creation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Attempt Approval Areas

| Area | Owner | Accepted for future attempt | Runtime value resolved now | Model/runtime touched now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- | --- |
| approved snapshot and fixture scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| persisted worker dispatch refs | WORKER_RUNTIME_JOBS | true | false | false | false | false |
| private source-of-truth refs | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false | false |
| Qwen request envelope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| private invoke transport dependencies | PROVIDER_GATEWAY_MODELS | true | false | false | false | false |
| Qwen runtime inference boundary | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| response schema and result handling | OBSERVABILITY_AUDIT_COST | true | false | false | false | false |
| QA audit cost and credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false | false |
| cleanup retry and beta lock | WORKER_RUNTIME_JOBS | true | false | false | false | false |

## Future Approved-Fixture Inference Attempt Requirements

The next prompt may run only one bounded approved-fixture inference attempt if it keeps these constraints:

- use approved snapshot, immutable plan version, structured findings, edit intents, private source refs, manifest refs, checksum refs, job refs, lease refs, idempotency refs, and runtime target refs;
- create at most one persisted worker-dispatch envelope through approved backend paths;
- use only the deterministic approved fixture, not arbitrary user media, raw chat, raw worker prompts, public URLs, signed URLs, or broad media inputs;
- resolve service target and audience only in backend/runtime scope during the attempt;
- fetch identity token and create auth header only in backend/runtime scope during the attempt;
- never print, persist, return, or store service target, audience, token value, auth-header value, credential material, or raw response bodies;
- invoke Cloud Run at most once for this approved-fixture attempt;
- import Qwen, load the approved local model cache, initialize vLLM, process the bounded prompt, run one forward pass, and run one fixture inference only inside the future attempt;
- record only sanitized visual metadata schema summaries, status class, timing class, object counts, text-like region counts, spatial relation counts, blocked action counts, and normalized metadata hash;
- exclude raw model output text from repo evidence;
- keep generated assets, storage objects, signed URLs, public artifacts, credit mutations, beta, production, and `generated_local_fixture_passed` blocked.

## Runtime Posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis attempts. The approved runtime posture still requires run-on-use behavior, scale-to-zero, and no idle GPU cost.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovedForFutureBoundedAttempt=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptRequired=true`
- `approvedSnapshotAndFixtureScopeAttemptApproved=true`
- `persistedWorkerDispatchRefsAttemptApproved=true`
- `privateSourceOfTruthRefsAttemptApproved=true`
- `qwenRequestEnvelopeAttemptApproved=true`
- `privateInvokeTransportDependenciesAttemptApproved=true`
- `qwenRuntimeInferenceBoundaryAttemptApproved=true`
- `responseSchemaAndResultHandlingAttemptApproved=true`
- `qaAuditCostAndCreditNoSpendAttemptApproved=true`
- `cleanupRetryAndBetaLockAttemptApproved=true`
- `readyForRealWorkerDispatch=false`
- `approvedFixtureInferenceAttemptExecutedNow=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `workerClaimCreated=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Approval Fixes

The prior preflight verified the static approved-fixture inference envelope and runtime prerequisites, but it did not authorize a bounded runtime attempt. This packet records the missing approval boundary: a later prompt may attempt exactly one approved-fixture inference through persisted worker dispatch under backend/runtime scope, with sanitized metadata evidence only.

The safer next move is the controlled approved-fixture inference attempt, not generated assets, beta, production, public artifacts, signed URLs, arbitrary media, raw prompt execution, or broad worker dispatch.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DB-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-ATTEMPT: run one controlled Qwen approved-fixture inference attempt through persisted worker dispatch, no generated assets/no beta`
