# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_preflight_verified_attempt_approval_required`.

This packet records preflight verification only for one bounded approved-fixture private Qwen inference envelope through the persisted job and lease bridge. It does not create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, resolve service targets, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The preflight verifies the 58DN approval as static envelope evidence only. It proves the approved-fixture private inference envelope is ready for a later attempt-approval decision, not that a private inference attempt is allowed now.

## Reviewed Evidence

- private inference approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.md`
- private inference approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.ts`
- private inference approval smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval-smoke.ts`
- private inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md`
- private invoke attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- async work graph: `async-edit-work-graph.md`
- editing asset manifest: `editing-asset-manifest.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Preflight Outcome

- approved-fixture private inference approval recorded: true
- approved-fixture private inference preflight required: false
- approved-fixture private inference preflight recorded: true
- approved-fixture private inference preflight passed: true
- approved-fixture private inference attempt approval required: true
- static envelope verified only: true
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
- Qwen inference approved now: false
- result persistence approved now: false
- generated asset creation approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Verified Static Preflight Areas

| Area | Owner | Static envelope verified | Runtime value resolved now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| approved snapshot and fixture scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| persisted job, lease, and idempotency refs | WORKER_RUNTIME_JOBS | true | false | false | false |
| private source-of-truth refs | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false |
| Qwen private inference request envelope | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| private invoke transport and credential handling | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| model runtime boundary | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| metadata-only response contract | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| QA, audit, cost, and credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| cleanup, retry, rollback, and review | WORKER_RUNTIME_JOBS | true | false | false | false |

## Attempt Approval Requirements

The next approval packet must re-check these items before any private inference attempt may be considered:

- exact approved fixture id, approved plan snapshot id, immutable plan version, checksum, structured findings, edit intents, source-order refs, timing refs, worker graph refs, private source refs, manifest refs, and checksum refs;
- one persisted Qwen worker job reference, persisted lease reference, worker claim reference, backend runtime message reference, job event reference, idempotency key, request hash, workspace/project scope, and duplicate-source rejection evidence;
- backend-only service-role lease claim path, stale-lease cleanup, conflict handling, sanitized job event path, backend runtime message path, and worker claim handoff path;
- private source-of-truth refs, storage object record refs, artifact manifest refs, checksum refs, approved snapshot refs, and source media immutability refs;
- private invoke transport dependency envelope, service target resolver path, audience resolver path, identity-token path, auth-header creation path, timeout policy, retry policy, and response classifier with no runtime credential value persisted;
- NVIDIA L4 Cloud Run target with scale-to-zero, minimum instances zero, initial maximum one, bounded timeout, and CPU fallback disabled;
- Qwen visual-understanding and visual-QA metadata scope only, with import, model load, vLLM initialization, prompt processing, forward pass, and inference separately attempt-gated;
- `qwen_fixture_visual_metadata_v1` response schema expectation, raw output exclusion, invalid schema handling, disabled inference handling, normalized metadata hash, and separate result review gate;
- QA, audit, latency, cost placeholder, no credit spend, cleanup, rollback, retry, beta, production, generated asset, signed URL, public artifact, and render/export locks.

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

The preflight preserves these rules:

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

The preflight keeps the existing cost-controlled posture. It does not resize, deploy, warm, resolve, or invoke the runtime.

## Runtime Flags

- `approvedFixturePrivateInferencePlanRecorded=true`
- `approvedFixturePrivateInferenceApprovalRequired=false`
- `approvedFixturePrivateInferenceApprovalRecorded=true`
- `approvedFixturePrivateInferenceApprovalAccepted=true`
- `approvedFixturePrivateInferencePreflightRequired=false`
- `approvedFixturePrivateInferencePreflightRecorded=true`
- `approvedFixturePrivateInferencePreflightPassed=true`
- `approvedFixturePrivateInferenceAttemptApprovalRequired=true`
- `approvedSnapshotAndFixtureScopePreflightVerified=true`
- `persistedJobLeaseAndIdempotencyRefsPreflightVerified=true`
- `privateSourceOfTruthRefsPreflightVerified=true`
- `qwenPrivateInferenceRequestEnvelopePreflightVerified=true`
- `privateInvokeTransportAndCredentialHandlingPreflightVerified=true`
- `modelRuntimeBoundaryPreflightVerified=true`
- `metadataOnlyResponseContractPreflightVerified=true`
- `qaAuditCostCreditNoSpendPreflightVerified=true`
- `cleanupRetryRollbackReviewPreflightVerified=true`
- `readyForApprovedFixturePrivateInferenceAttemptApproval=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInferencePreflightExecuted=false`
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

- approved-fixture private inference attempt approval required: true
- approved-fixture private inference attempt executed: false
- ready for real worker dispatch: false
- private invoke ready: false
- Qwen inference accepted now: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

This preflight advances the Qwen tool toward controlled external-agent execution by verifying the bounded private inference envelope as static evidence. It still requires an explicit attempt approval, a separately recorded attempt result, and a result review before any runtime-readiness claim can advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DP-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-ATTEMPT-APPROVAL: approve one bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta`
