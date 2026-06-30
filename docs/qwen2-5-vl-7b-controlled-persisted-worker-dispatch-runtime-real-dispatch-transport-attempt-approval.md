# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Attempt Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_approval_accepted_attempt_required`.

This packet approves a future controlled Qwen real-dispatch transport attempt. It accepts the no-call transport preflight as sufficient evidence to allow a later prompt to attempt one bounded private transport contract check, but it does not resolve runtime values or send a request now.

This is attempt approval only. It does not resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, run Qwen inference, persist output, create generated assets, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- transport preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.md`
- transport preflight spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight.ts`
- transport preflight smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-smoke.ts`
- transport preflight approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`

## Approval Outcome

- transport preflight recorded: true
- transport preflight passed: true
- controlled transport attempt approval required: false
- controlled transport attempt approval recorded: true
- controlled transport attempt approved for future bounded attempt: true
- controlled transport attempt required: true
- future service URL resolution during attempt approved: true
- future audience resolution during attempt approved: true
- future identity-token fetch during attempt approved: true
- future auth-header creation during attempt approved: true
- future private request send during attempt approved: true
- future Cloud Run contract invocation during attempt approved: true
- future response classification during attempt approved: true
- service URL resolution approved now: false
- audience resolution approved now: false
- identity-token fetch approved now: false
- auth-header creation approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Attempt Approval Areas

| Area | Owner | Accepted for future attempt | Runtime value resolved now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| approved snapshot transport attempt scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| backend-only service URL resolution | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| backend-only audience resolution | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| identity-token dependency | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| auth-header redaction | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| bounded private request envelope | WORKER_RUNTIME_JOBS | true | false | false | false |
| inference-disabled contract | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| response classification | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| persistence without generated assets | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false |
| cleanup rollback beta production lock | WORKER_RUNTIME_JOBS | true | false | false | false |

## Future Transport Attempt Requirements

The next prompt may run only a bounded transport attempt if it keeps these constraints:

- use approved snapshot, immutable plan version, structured findings, edit intents, private source refs, manifest refs, checksum refs, job refs, lease refs, idempotency refs, and runtime target refs;
- resolve service target and audience only in backend/runtime scope during the attempt;
- fetch identity token and create auth header only in backend/runtime scope during the attempt;
- never print, persist, return, or store service target, audience, token value, auth-header value, credential material, or raw response bodies;
- send at most one bounded private request with timeout, retry classification, duplicate-source idempotency, and sanitized failure events;
- keep Qwen inference disabled unless a separate inference approval exists;
- record only sanitized status class, reason code, timing class, fail-closed outcome, and no-secret/no-output evidence;
- avoid generated assets, storage objects, signed URLs, public artifacts, credit mutations, approval records, beta, production, and `generated_local_fixture_passed` claims.

## Runtime Posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis transport checks. The approved runtime posture still requires run-on-use behavior, scale-to-zero, and no idle GPU cost.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovedForFutureBoundedAttempt=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRequired=true`
- `approvedSnapshotTransportAttemptApproved=true`
- `serviceUrlResolutionAttemptApproved=true`
- `audienceResolutionAttemptApproved=true`
- `identityTokenDependencyAttemptApproved=true`
- `authHeaderRedactionAttemptApproved=true`
- `boundedPrivateRequestEnvelopeAttemptApproved=true`
- `inferenceDisabledContractAttemptApproved=true`
- `responseClassificationAttemptApproved=true`
- `persistenceWithoutGeneratedAssetsAttemptApproved=true`
- `cleanupRollbackBetaProductionLockAttemptApproved=true`
- `readyForRealWorkerDispatch=false`
- `transportAttemptExecutedNow=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
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

The prior preflight proved the static envelope was ready, but it did not authorize runtime value resolution or a bounded private request. This packet records the missing approval boundary: a later prompt may attempt transport only under backend/runtime scope, with inference disabled and sanitized evidence only.

The safer next move is a controlled transport attempt, not Qwen inference, generated assets, beta, production, public artifacts, signed URLs, or broad worker execution.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CV-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT: run controlled Qwen real-dispatch transport attempt, no inference/no generated assets/no beta`
