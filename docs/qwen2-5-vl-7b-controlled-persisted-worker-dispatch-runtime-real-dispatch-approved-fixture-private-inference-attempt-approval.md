# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Attempt Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_attempt_approval_accepted_attempt_required`.

This packet approves the recorded 58DO private inference preflight for one future bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge. It does not run the attempt, create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, resolve service targets, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The approval accepts only that the 58DO static preflight is specific enough for a later bounded private inference attempt. The later attempt may exercise the private Qwen inference path once for the approved fixture, but it must keep generated assets, storage writes, signed URLs, public artifacts, credit mutation, beta, production, and broad user-facing dispatch blocked.

## Reviewed Evidence

- private inference preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.md`
- private inference preflight spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.ts`
- private inference preflight smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight-smoke.ts`
- private inference approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.md`
- private inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md`
- private invoke attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- async work graph: `async-edit-work-graph.md`
- editing asset manifest: `editing-asset-manifest.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Approval Outcome

- approved-fixture private inference preflight recorded: true
- approved-fixture private inference preflight passed: true
- approved-fixture private inference attempt approval required: false
- approved-fixture private inference attempt approval recorded: true
- approved-fixture private inference approved for future bounded attempt: true
- approved-fixture private inference attempt required: true
- future persisted worker dispatch envelope during attempt approved: true
- future approved snapshot binding during attempt approved: true
- future private source-of-truth refs during attempt approved: true
- future service target resolution during attempt approved: true
- future audience resolution during attempt approved: true
- future identity token fetch during attempt approved: true
- future auth header creation during attempt approved: true
- future private request send during attempt approved: true
- future Cloud Run invocation during attempt approved: true
- future model import during attempt approved: true
- future model load during attempt approved: true
- future vLLM initialization during attempt approved: true
- future prompt processing during attempt approved: true
- future forward pass during attempt approved: true
- future one bounded private inference during attempt approved: true
- future metadata-only response classification during attempt approved: true
- future sanitized attempt evidence during attempt approved: true
- future cleanup and rollback during attempt approved: true
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

## Accepted Future Attempt Areas

| Area | Owner | Accepted for future attempt | Runtime value resolved now | Model/service touched now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- | --- |
| approved snapshot and fixture scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| persisted job, lease, and idempotency refs | WORKER_RUNTIME_JOBS | true | false | false | false | false |
| private source-of-truth refs | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false | false |
| Qwen private inference request envelope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| private invoke transport and credential handling | PROVIDER_GATEWAY_MODELS | true | false | false | false | false |
| model runtime boundary | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| metadata-only response contract | OBSERVABILITY_AUDIT_COST | true | false | false | false | false |
| QA, audit, cost, and credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false | false |
| cleanup, retry, rollback, and review | WORKER_RUNTIME_JOBS | true | false | false | false | false |

## Future Attempt Rules

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
- future attempt may run one bounded private inference: true
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

Workers execute approved snapshots, not raw chat:

```text
approved plan snapshot
-> persisted worker job
-> persisted idempotency guard
-> transactional lease claim
-> sanitized job event
-> backend runtime message
-> worker claim
-> private invoke handoff
-> Qwen metadata result review
```

The approval preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-controlled target because it supports bounded Qwen visual-analysis requests while preserving a scale-to-zero posture. This approval does not resize, deploy, warm, resolve, invoke, import, load, or run the runtime.

## Runtime Flags

- `approvedFixturePrivateInferencePlanRecorded=true`
- `approvedFixturePrivateInferenceApprovalRequired=false`
- `approvedFixturePrivateInferenceApprovalRecorded=true`
- `approvedFixturePrivateInferenceApprovalAccepted=true`
- `approvedFixturePrivateInferencePreflightRequired=false`
- `approvedFixturePrivateInferencePreflightRecorded=true`
- `approvedFixturePrivateInferencePreflightPassed=true`
- `approvedFixturePrivateInferenceAttemptApprovalRequired=false`
- `approvedFixturePrivateInferenceAttemptApprovalRecorded=true`
- `approvedFixturePrivateInferenceAttemptApprovedForFutureBoundedAttempt=true`
- `approvedFixturePrivateInferenceAttemptRequired=true`
- `approvedSnapshotAndFixtureScopeAttemptApproved=true`
- `persistedJobLeaseAndIdempotencyRefsAttemptApproved=true`
- `privateSourceOfTruthRefsAttemptApproved=true`
- `qwenPrivateInferenceRequestEnvelopeAttemptApproved=true`
- `privateInvokeTransportAndCredentialHandlingAttemptApproved=true`
- `modelRuntimeBoundaryAttemptApproved=true`
- `metadataOnlyResponseContractAttemptApproved=true`
- `qaAuditCostCreditNoSpendAttemptApproved=true`
- `cleanupRetryRollbackReviewAttemptApproved=true`
- `readyForApprovedFixturePrivateInferenceAttempt=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInferenceAttemptExecuted=false`
- `approvedFixturePrivateInferenceAcceptedForPersistedDispatch=false`
- `approvedFixturePrivateInferenceApprovedNow=false`
- `qwenInferenceAcceptedNow=false`
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

## Remaining Blockers

- approved-fixture private inference attempt required: true
- approved-fixture private inference attempt executed: false
- ready for real worker dispatch: false
- private invoke ready: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

This approval advances the Qwen tool toward controlled external-agent execution by accepting one future bounded approved-fixture private inference attempt through the persisted job and lease bridge. It still requires a separately recorded attempt result and result review before any runtime-readiness claim can advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DQ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-ATTEMPT: run one bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge, no generated assets/no beta`
