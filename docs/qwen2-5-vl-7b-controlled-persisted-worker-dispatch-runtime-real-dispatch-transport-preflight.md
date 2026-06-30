# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_verified_attempt_approval_required`.

This packet verifies the controlled Qwen real-dispatch transport preflight as a no-call, static-envelope check. It accepts the 58CS approval as sufficient to move to a future transport attempt approval, but it does not resolve runtime values or send a request now.

This is preflight verification only. It does not resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, run Qwen inference, persist output, create generated assets, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- transport preflight approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval.md`
- transport preflight approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval.ts`
- transport preflight approval smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-approval-smoke.ts`
- transport preflight plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`

## Preflight Outcome

- transport preflight approval accepted for future preflight: true
- controlled transport preflight recorded: true
- controlled transport preflight passed: true
- controlled transport attempt approval required: true
- static envelope verified only: true
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

## Verified Preflight Areas

| Check | Owner | Static envelope verified | Runtime value resolved now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| approved snapshot and private source refs | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| service URL resolver | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| audience resolver | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| identity-token dependency | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| auth-header redaction | PROVIDER_GATEWAY_MODELS | true | false | false | false |
| private request envelope | WORKER_RUNTIME_JOBS | true | false | false | false |
| timeout retry idempotency | WORKER_RUNTIME_JOBS | true | false | false | false |
| response classification | AI_VIDEO_BROLL_GENERATION | true | false | false | false |
| persistence QA audit cost credit | OBSERVABILITY_AUDIT_COST | true | false | false | false |
| cleanup rollback beta production lock | WORKER_RUNTIME_JOBS | true | false | false | false |

## Future Transport Attempt Approval Requirements

The next approval prompt must decide whether a later prompt may attempt a bounded transport call. It must still require:

- approved snapshot, immutable plan version, structured findings, edit intents, private source refs, manifest refs, checksum refs, job refs, lease refs, idempotency refs, and runtime target refs;
- backend-only service URL resolver contract shape with no URL value persisted, logged, surfaced to UI, or stored in fixture data;
- backend-only audience resolver contract shape with no audience value persisted, logged, surfaced to UI, or stored in fixture data;
- identity-token dependency contract shape with no token fetch, token value, auth-header value, or credential material created now;
- private request envelope shape with bounded timeout, retry classification, duplicate-source idempotency, and sanitized failure events;
- response classification for auth failure, timeout, unavailable service, invalid response, disabled inference, and metadata-only output states;
- QA, audit, cost, credit, cleanup, rollback, beta, production, signed URL, public artifact, and generated asset locks;
- NVIDIA L4 Cloud Run GPU posture with scale-to-zero, minimum instances zero, initial maximum one, and CPU fallback disabled.

## Runtime Posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle. This preflight does not keep GPU instances running and does not invoke the runtime.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptApprovalRequired=true`
- `approvedSnapshotTransportPreflightVerified=true`
- `serviceUrlResolutionPreflightVerified=true`
- `audienceResolutionPreflightVerified=true`
- `identityTokenDependencyPreflightVerified=true`
- `authHeaderRedactionPreflightVerified=true`
- `privateRequestEnvelopePreflightVerified=true`
- `timeoutRetryIdempotencyPreflightVerified=true`
- `responseClassificationPreflightVerified=true`
- `persistenceQaAuditCostCreditPreflightVerified=true`
- `cleanupRollbackBetaProductionLockPreflightVerified=true`
- `readyForRealWorkerDispatch=false`
- `transportDependenciesEnabledNow=false`
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

## What Went Wrong And How This Fixes The Next Step

The previous approval recorded that the transport preflight could be verified, but the stack still needed a no-call check that the planned transport envelope, owner boundaries, and source-of-truth rules were complete. Jumping from approval directly to service URL resolution or token minting would skip the safety proof.

This preflight fixes that gap by verifying the static transport envelope and keeping all runtime values unresolved. The safer next move is explicit transport attempt approval, not direct Cloud Run invocation, inference, generated assets, beta, or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CU-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-ATTEMPT-APPROVAL: approve controlled Qwen real-dispatch transport attempt, no inference/no generated assets/no beta`
