# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Preflight Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_approval_accepted_preflight_required`.

This packet approves the controlled Qwen real-dispatch transport preflight plan for a future no-call verification prompt only. It does not execute the preflight now.

This is approval metadata only. It does not resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, run Qwen inference, persist output, create generated assets, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Documents

- transport preflight plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.md`
- transport preflight plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.ts`
- transport preflight plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan-smoke.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`
- tool usage planning UI policy: `tool-usage-planning-ui.md`

## Approval Result

- transport preflight plan recorded upstream: true
- transport preflight approval recorded: true
- transport preflight accepted for future no-call verification: true
- controlled transport preflight required: true
- service URL resolution approved now: false
- audience resolution approved now: false
- identity-token fetch approved now: false
- auth-header creation approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta approved now: false
- production approved now: false

## Accepted Future Preflight Scope

| Check | Owner | Accepted for future preflight | Current execution allowed |
| --- | --- | --- | --- |
| approved snapshot and private source refs | AI_VIDEO_BROLL_GENERATION | true | false |
| service URL resolver | PROVIDER_GATEWAY_MODELS | true | false |
| audience resolver | PROVIDER_GATEWAY_MODELS | true | false |
| identity-token dependency | PROVIDER_GATEWAY_MODELS | true | false |
| auth-header redaction | PROVIDER_GATEWAY_MODELS | true | false |
| private request envelope | WORKER_RUNTIME_JOBS | true | false |
| timeout retry idempotency | WORKER_RUNTIME_JOBS | true | false |
| response classification | AI_VIDEO_BROLL_GENERATION | true | false |
| persistence QA audit cost credit | OBSERVABILITY_AUDIT_COST | true | false |
| cleanup rollback beta production lock | WORKER_RUNTIME_JOBS | true | false |

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle. This approval does not keep GPU instances running and does not invoke the runtime.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Future Preflight Boundaries

The future preflight may verify only the static shape and readiness of the planned transport envelope unless a later prompt explicitly authorizes a bounded request attempt. The immediate future preflight must keep these runtime values false:

- service URL resolution executed now: false
- audience resolution executed now: false
- identity-token fetch executed now: false
- auth-header creation executed now: false
- private request send executed now: false
- Cloud Run invocation executed now: false
- Qwen inference executed now: false
- generated asset creation executed now: false
- Supabase mutation executed now: false
- credit mutation executed now: false

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRequired=true`
- `approvedSnapshotTransportPreflightAccepted=true`
- `serviceUrlResolutionPreflightAccepted=true`
- `audienceResolutionPreflightAccepted=true`
- `identityTokenDependencyPreflightAccepted=true`
- `authHeaderRedactionPreflightAccepted=true`
- `privateRequestEnvelopePreflightAccepted=true`
- `timeoutRetryIdempotencyPreflightAccepted=true`
- `responseClassificationPreflightAccepted=true`
- `persistenceQaAuditCostCreditPreflightAccepted=true`
- `cleanupRollbackBetaProductionLockPreflightAccepted=true`
- `readyForRealWorkerDispatch=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What Went Wrong And How This Fixes The Next Step

The previous preflight plan was correctly detailed, but it remained unapproved. That meant the stack had the checklist but still had no explicit owner decision allowing the next prompt to verify the no-call transport inputs.

This approval fixes that by accepting the checklist for a future preflight while preserving every runtime gate. The safer next move is no-call transport preflight verification, not service URL resolution, token minting, private request sending, Cloud Run invocation, inference, generated assets, or beta.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CT-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT: verify controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta`
