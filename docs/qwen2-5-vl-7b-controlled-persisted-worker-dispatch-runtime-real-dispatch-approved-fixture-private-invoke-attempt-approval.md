# Qwen2.5-VL 58DJ Approved Fixture Private Invoke Attempt Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_attempt_approval_accepted_attempt_required`.

This packet approves the recorded 58DI preflight for one future bounded approved-fixture private invoke attempt through the persisted job and lease bridge. It does not run the attempt, create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, send a private request, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The approval accepts only that the 58DI static preflight is specific enough for a later bounded private-invoke attempt. The later attempt may verify the persisted worker dispatch envelope and private transport contract path, but it must keep Qwen inference disabled unless a separate future inference gate explicitly approves it.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-preflight-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`
- `intent-led-edit-planning.md`

## Approval Outcome

- approved-fixture private invoke preflight recorded: true
- approved-fixture private invoke preflight passed: true
- approved-fixture private invoke attempt approval required: false
- approved-fixture private invoke attempt approval recorded: true
- approved-fixture private invoke approved for future bounded attempt: true
- approved-fixture private invoke attempt required: true
- future persisted worker dispatch envelope during attempt approved: true
- future service URL resolution during attempt approved: true
- future audience resolution during attempt approved: true
- future identity token fetch during attempt approved: true
- future auth header creation during attempt approved: true
- future private request send during attempt approved: true
- future Cloud Run contract invocation during attempt approved: true
- future response classification during attempt approved: true
- future sanitized metadata evidence during attempt approved: true
- future cleanup and rollback during attempt approved: true
- real job creation approved now: false
- lease claim approved now: false
- idempotency record approved now: false
- service URL resolution approved now: false
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
- generated assets approved now: false
- storage objects approved now: false
- signed URLs approved now: false
- public artifacts approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Future Attempt Areas

| Area | Owner | Accepted for future attempt | Runtime value resolved now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| approved fixture and snapshot scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| persisted job, idempotency, and lease | WORKER_RUNTIME_JOBS | true | false | false | false |
| private source-of-truth refs | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false |
| private invoke transport runtime values | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| Cloud Run L4 contract invocation | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| Qwen runtime inference lock | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| response classification and metadata evidence | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| QA/audit/cost/credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| cleanup/retry/beta lock | WORKER_RUNTIME_JOBS | true | false | false | false |

## Future Attempt Rules

- future attempt may create one persisted worker dispatch envelope: true
- future attempt may resolve runtime values: true
- future attempt may fetch identity token: true
- future attempt may create auth header: true
- future attempt may send one bounded private request: true
- future attempt may invoke Cloud Run contract endpoint: true
- future attempt must keep inference disabled: true
- future attempt may record sanitized contract evidence: true
- future attempt must use approved fixture only: true
- future attempt must not import model: true
- future attempt must not load model: true
- future attempt must not initialize vLLM: true
- future attempt must not run forward pass: true
- future attempt must not run inference: true
- future attempt must not create generated assets: true
- future attempt must not create storage objects: true
- future attempt must not create signed URLs: true
- future attempt must not create public artifacts: true
- future attempt must not mutate credits: true
- future attempt must not unlock beta or production: true
- inference requires separate future approval: true
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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovedForFutureBoundedAttempt=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptRequired=true`
- `approvedFixtureAndSnapshotScopeAttemptApproved=true`
- `persistedJobIdempotencyAndLeaseAttemptApproved=true`
- `privateSourceOfTruthRefsAttemptApproved=true`
- `privateInvokeTransportRuntimeValuesAttemptApproved=true`
- `cloudRunL4ContractInvocationAttemptApproved=true`
- `qwenRuntimeInferenceLockAttemptApproved=true`
- `responseClassificationAndMetadataEvidenceAttemptApproved=true`
- `qaAuditCostCreditNoSpendAttemptApproved=true`
- `cleanupRetryAndBetaLockAttemptApproved=true`
- `readyForApprovedFixturePrivateInvokeAttempt=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInvokeAttemptExecutedNow=false`
- `approvedFixturePrivateInvokeAcceptedForPersistedDispatch=false`
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
- `serviceUrlResolvedNow=false`
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

- approved-fixture private invoke attempt required: true
- approved-fixture private invoke attempt executed now: false
- ready for real worker dispatch: false
- private invoke ready: false
- Qwen inference accepted now: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

This approval advances the Qwen tool toward controlled external agent execution by accepting one future private transport contract attempt through the persisted job and lease bridge. It still requires a separately recorded attempt result and result review before any runtime-readiness claim can advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DK-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-ATTEMPT: run one bounded approved-fixture private invoke attempt through the persisted job and lease bridge, no inference/no generated assets/no beta`
