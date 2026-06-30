# Qwen2.5-VL 58DI Approved Fixture Private Invoke Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_preflight_verified_attempt_approval_required`.

This packet records preflight verification only for one bounded approved-fixture private invoke through the persisted job and lease bridge. It does not create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, send a private request, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The preflight verifies the 58DH approval as static envelope evidence only. It proves the approved-fixture private invoke envelope is ready for a later attempt-approval decision, not that a private invoke attempt is allowed now.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-approval-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`
- `intent-led-edit-planning.md`

## Preflight Outcome

- approved-fixture private invoke execution approval recorded: true
- approved-fixture private invoke preflight recorded: true
- approved-fixture private invoke preflight passed: true
- approved-fixture private invoke attempt approval required: true
- static envelope verified only: true
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
- Qwen inference approved now: false
- generated asset creation approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Verified Static Preflight Areas

| Area | Owner | Static envelope verified | Runtime value resolved now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| approved fixture selection | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| approved snapshot binding | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| persisted job reference | WORKER_RUNTIME_JOBS | true | false | false | false |
| idempotency guard | WORKER_RUNTIME_JOBS | true | false | false | false |
| transactional lease claim | WORKER_RUNTIME_JOBS | true | false | false | false |
| sanitized runtime event | WORKER_RUNTIME_JOBS | true | false | false | false |
| worker claim handoff | WORKER_RUNTIME_JOBS | true | false | false | false |
| private invoke transport | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| Cloud Run L4 request | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| Qwen runtime boundary | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| response schema handling | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| QA/audit/cost/credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| cleanup/rollback/retry | WORKER_RUNTIME_JOBS | true | false | false | false |

## Attempt Approval Requirements

The next approval packet must re-check these items before any private invoke attempt may be considered:

- exact approved fixture id, approved snapshot id, immutable plan version, checksum, structured findings, edit intents, timing refs, source-order refs, worker graph, private source refs, manifest refs, and checksum refs;
- one persisted Qwen worker job reference, persisted idempotency guard, request hash, workspace/project scope, runtime target, duplicate-source rejection, and retry-safe conflict handling;
- backend-only service-role lease claim path, stale-lease cleanup, conflict handling, sanitized job event path, backend runtime message path, and worker claim handoff;
- private invoke transport dependency envelope, service target resolver path, audience resolver path, identity-token path, auth-header creation path, timeout policy, retry policy, and response classifier with no runtime value persisted;
- NVIDIA L4 Cloud Run target with scale-to-zero, minimum instances zero, initial maximum one, bounded timeout, and CPU fallback disabled;
- Qwen visual-understanding and visual-QA metadata scope only, with model import, model load, vLLM initialization, prompt processing, forward pass, and inference separately attempt-gated;
- `qwen_fixture_visual_metadata_v1` response schema expectation, raw output exclusion, invalid schema handling, disabled inference handling, and separate result review gate;
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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAttemptApprovalRequired=true`
- `approvedFixtureSelectionPreflightVerified=true`
- `approvedSnapshotBindingPreflightVerified=true`
- `persistedJobReferencePreflightVerified=true`
- `idempotencyGuardPreflightVerified=true`
- `transactionalLeaseClaimPreflightVerified=true`
- `sanitizedRuntimeEventPreflightVerified=true`
- `workerClaimHandoffPreflightVerified=true`
- `privateInvokeTransportPreflightVerified=true`
- `cloudRunL4RequestPreflightVerified=true`
- `qwenRuntimeBoundaryPreflightVerified=true`
- `responseSchemaHandlingPreflightVerified=true`
- `qaAuditCostCreditNoSpendPreflightVerified=true`
- `cleanupRollbackRetryPreflightVerified=true`
- `readyForApprovedFixturePrivateInvokeAttemptApproval=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInvokePreflightExecuted=false`
- `approvedFixturePrivateInvokeAttemptExecuted=false`
- `approvedFixturePrivateInvokeAcceptedForPersistedDispatch=false`
- `approvedFixturePrivateInvokeApprovedNow=false`
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

- approved-fixture private invoke attempt approval required: true
- approved-fixture private invoke attempt executed: false
- ready for real worker dispatch: false
- private invoke ready: false
- Qwen inference accepted now: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

This preflight advances the Qwen tool toward controlled external agent execution by verifying the bounded private-invoke envelope as static evidence. It still requires an explicit attempt approval, a separately recorded attempt result, and a result review before any runtime-readiness claim can advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DJ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-ATTEMPT-APPROVAL: approve one bounded approved-fixture private invoke attempt through the persisted job and lease bridge, no inference/no generated assets/no beta`
