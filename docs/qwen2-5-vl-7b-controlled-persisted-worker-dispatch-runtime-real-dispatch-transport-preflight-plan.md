# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Preflight Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_plan_recorded_approval_required`.

This packet records the controlled Qwen real-dispatch transport preflight plan. It turns the accepted transport readiness approval into a bounded checklist for a future preflight, but it does not execute the preflight now.

This is preflight planning only. It does not resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, run Qwen inference, persist output, create generated assets, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Documents

- transport readiness approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.md`
- transport readiness approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval.ts`
- transport readiness approval smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-approval-smoke.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`
- tool usage planning UI policy: `tool-usage-planning-ui.md`

## Plan Result

- transport readiness approval recorded upstream: true
- transport preflight plan recorded: true
- transport preflight approval required: true
- service URL resolution planned for future preflight: true
- audience resolution planned for future preflight: true
- identity-token dependency planned for future preflight: true
- auth-header redaction planned for future preflight: true
- private request envelope planned for future preflight: true
- timeout, retry, and idempotency planned for future preflight: true
- response classification planned for future preflight: true
- persistence, QA, audit, cost, and credit preflight planned: true
- cleanup, rollback, beta, and production locks planned: true
- service URL resolution executed now: false
- audience resolution executed now: false
- identity-token fetch executed now: false
- auth-header creation executed now: false
- private request send executed now: false
- Cloud Run invocation executed now: false
- Qwen inference executed now: false
- generated asset creation executed now: false
- beta approved now: false
- production approved now: false

## Preflight Scope

| Check | Owner | Planned for future preflight | Current execution allowed |
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

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle. This plan does not keep GPU instances running and does not invoke the runtime.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Future Preflight Checklist

The future preflight must remain no-call unless a later prompt explicitly authorizes execution. It should verify the checklist shape without resolving or transmitting secrets:

- approved snapshot id, job id, lease id, private source refs, and idempotency refs are present;
- raw chat, raw prompt, and raw worker prompt fields are rejected;
- service URL resolver is backend-only and does not expose URLs to frontend payloads;
- audience resolver derives only from approved runtime metadata;
- identity-token dependency is available only to backend runtime code;
- auth-header creation is redacted, scoped, and not persisted;
- private request envelope has timeout, retry, and idempotency boundaries;
- response classification covers auth failure, timeout, unavailable service, invalid runtime response, disabled inference, and future metadata-only output;
- result persistence remains blocked until a separate approval exists;
- QA, audit, cost, credit, cleanup, rollback, beta, production, public artifact, and signed URL locks remain false.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRequired=true`
- `approvedSnapshotTransportPreflightPlanned=true`
- `serviceUrlResolutionPreflightPlanned=true`
- `audienceResolutionPreflightPlanned=true`
- `identityTokenDependencyPreflightPlanned=true`
- `authHeaderRedactionPreflightPlanned=true`
- `privateRequestEnvelopePreflightPlanned=true`
- `timeoutRetryIdempotencyPreflightPlanned=true`
- `responseClassificationPreflightPlanned=true`
- `persistenceQaAuditCostCreditPreflightPlanned=true`
- `cleanupRollbackBetaProductionLockPreflightPlanned=true`
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

The previous readiness approval established that transport requirements were accepted, but it deliberately did not define the concrete preflight checklist. That leaves the stack unable to distinguish a safe no-call readiness verification from an accidental runtime transport attempt.

This plan fixes that by naming each preflight area, owner boundary, expected evidence, and false runtime gate before any later approval can run the preflight. The safer next move is approval of this preflight plan, not direct service URL resolution, token minting, private request sending, Cloud Run invocation, or inference.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CS-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT-APPROVAL: approve controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta`
