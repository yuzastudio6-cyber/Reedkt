# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Retry Attempt Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_attempt_approval_accepted_attempt_required`.

This packet approves the recorded 58DS private inference retry gate for one future bounded approved-fixture private Qwen inference retry attempt through the persisted job and lease bridge. It does not run the attempt, create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, resolve service targets, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The approval accepts only that the 58DS retry gate is specific enough for a later bounded private inference retry attempt. The later attempt may exercise the private Qwen inference path once for the approved fixture, but it must keep generated assets, storage writes, signed URLs, public artifacts, credit mutation, beta, production, and broad user-facing dispatch blocked.

## Reviewed Evidence

- private inference retry gate: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md`
- private inference retry gate spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts`
- private inference retry gate smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts`
- private inference retry plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md`
- private inference auth-refresh result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md`
- private inference attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- async work graph: `async-edit-work-graph.md`
- editing asset manifest: `editing-asset-manifest.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Approval Outcome

- private inference retry gate recorded: true
- private inference retry gate passed: true
- approved-fixture private inference retry attempt approval required: false
- approved-fixture private inference retry attempt approval recorded: true
- approved-fixture private inference retry attempt approved for future bounded attempt: true
- approved-fixture private inference retry attempt required: true
- future persisted worker dispatch envelope during retry attempt approved: true
- future approved snapshot binding during retry attempt approved: true
- future private source-of-truth refs during retry attempt approved: true
- future service target resolution during retry attempt approved: true
- future audience resolution during retry attempt approved: true
- future identity token fetch during retry attempt approved: true
- future auth header creation during retry attempt approved: true
- future private request send during retry attempt approved: true
- future Cloud Run invocation during retry attempt approved: true
- future model import during retry attempt approved: true
- future model load during retry attempt approved: true
- future vLLM initialization during retry attempt approved: true
- future prompt processing during retry attempt approved: true
- future forward pass during retry attempt approved: true
- future one bounded private inference retry during attempt approved: true
- future metadata-only response classification during retry attempt approved: true
- future sanitized retry attempt evidence during attempt approved: true
- future cleanup and rollback during retry attempt approved: true
- real job creation approved now: false
- lease claim approved now: false
- idempotency record approved now: false
- service target resolution approved now: false
- audience resolution approved now: false
- identity token fetch approved now: false
- auth header creation approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- inference approved now: false
- result persistence approved now: false
- generated assets approved now: false
- storage objects approved now: false
- signed URLs approved now: false
- public artifacts approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Future Retry Attempt Areas

| Area | Owner | Accepted for future retry attempt | Retry gate verified | Runtime value resolved now | Model/service touched now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth-Refreshed Gate Recheck | AI_VIDEO_BROLL_GENERATION | true | true | false | false | false | false |
| Approved Snapshot And Fixture Lock | AI_VIDEO_BROLL_GENERATION | true | true | false | false | false | false |
| Persisted Worker Dispatch Refs | WORKER_RUNTIME_JOBS | true | true | false | false | false | false |
| Private Source-Of-Truth Refs | SUPABASE_RLS_STORAGE_DATABASE | true | true | false | false | false | false |
| Private Inference Request Envelope | AI_VIDEO_BROLL_GENERATION | true | true | false | false | false | false |
| Transport, Credential, And Cloud Run Boundary | PROVIDER_GATEWAY_MODELS | true | true | false | false | false | false |
| Model Runtime One-Fixture Boundary | AI_VIDEO_BROLL_GENERATION | true | true | false | false | false | false |
| Sanitized Response Result Review | OBSERVABILITY_AUDIT_COST | true | true | false | false | false | false |

## Future Retry Attempt Rules

- future attempt may create one persisted worker dispatch envelope: true
- future attempt may resolve service target: true
- future attempt may resolve audience: true
- future attempt may fetch identity token: true
- future attempt may create auth header: true
- future attempt may send one bounded private request: true
- future attempt may invoke Cloud Run: true
- future attempt may import model: true
- future attempt may load model: true
- future attempt may initialize vLLM: true
- future attempt may process prompt: true
- future attempt may run one forward pass: true
- future attempt may run one bounded private inference retry: true
- future attempt may record sanitized metadata-only evidence: true
- future attempt must use approved fixture only: true
- future attempt must use persisted job and lease bridge: true
- future attempt must use private source-of-truth refs: true
- future attempt must keep NVIDIA L4 scale-to-zero: true
- future attempt must not create generated assets: true
- future attempt must not create storage objects: true
- future attempt must not create signed URLs: true
- future attempt must not create public artifacts: true
- future attempt must not mutate Supabase rows: true
- future attempt must not mutate credits: true
- future attempt must not unlock beta or production: true
- result persistence requires separate future review: true
- generated assets require separate future approval: true

## Source-Of-Truth Rules

- workers execute approved snapshots, not raw chat: true
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- raw provider prompt allowed: false
- signed URL source of truth allowed: false
- public URL source of truth allowed: false
- browser-facing invocation allowed: false
- Qwen may generate B-roll video: false
- Qwen may render/export: false

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

## Runtime Flags

- `approvedFixturePrivateInferenceRetryPlanRecorded=true`
- `approvedFixturePrivateInferenceRetryGateRequired=false`
- `approvedFixturePrivateInferenceRetryGateRecorded=true`
- `approvedFixturePrivateInferenceRetryGatePassed=true`
- `approvedFixturePrivateInferenceRetryAttemptApprovalRequired=false`
- `approvedFixturePrivateInferenceRetryAttemptApprovalRecorded=true`
- `approvedFixturePrivateInferenceRetryAttemptApprovedForFutureBoundedAttempt=true`
- `approvedFixturePrivateInferenceRetryAttemptRequired=true`
- `readyForApprovedFixturePrivateInferenceRetryAttempt=true`
- `retryAttemptRunNow=false`
- `approvedFixturePrivateInferenceRetryAttemptExecuted=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `cloudRunInvocationAttempted=false`
- `cloudRunJobExecuted=false`
- `serviceRuntimeRequestSent=false`
- `serviceTargetResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Advances

This advances Qwen from `retry_gate_verified_attempt_approval_required` to `retry_attempt_approval_accepted_attempt_required`. It prepares the next prompt to attempt one bounded approved-fixture private inference retry, but this packet does not run the retry.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DU-PRIVATE-INFERENCE-RETRY-ATTEMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation`
