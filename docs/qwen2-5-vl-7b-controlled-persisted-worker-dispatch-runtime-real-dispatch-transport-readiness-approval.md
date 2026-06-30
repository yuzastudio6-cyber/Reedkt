# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Readiness Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_approval_accepted_preflight_plan_required`.

This packet accepts the controlled Qwen real-dispatch transport readiness plan for a future bounded transport preflight plan. The accepted readiness evidence covers approved snapshot transport scope, private source-of-truth refs, service URL and audience resolution requirements, identity-token and auth-header requirements, private request send requirements, response classification and persistence requirements, QA/audit/cost/credit readiness, retry/timeout/cleanup/rollback expectations, and beta/production/public-artifact locks.

This is transport readiness approval only. It does not resolve a service URL, resolve an audience, fetch an identity token, create an auth header, send a private request, invoke Cloud Run, run Qwen inference, persist output, create generated assets, create public artifacts, create signed URLs, dispatch workers, mutate Supabase, execute SQL, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Documents

- transport readiness plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan.md`
- transport readiness plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan.ts`
- transport readiness plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan-smoke.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`

## Approval Result

- transport readiness plan recorded upstream: true
- transport readiness approval recorded: true
- transport readiness accepted for future preflight planning: true
- transport preflight plan required: true
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

## Accepted Readiness Evidence

| Evidence | Status | Current execution allowed |
| --- | --- | --- |
| approved snapshot transport scope | accepted for preflight planning | false |
| service URL and audience resolution | accepted for preflight planning | false |
| identity token and auth header | accepted for preflight planning | false |
| private request send | accepted for preflight planning | false |
| response classification and persistence | accepted for preflight planning | false |
| QA, audit, cost, and credit readiness | accepted for preflight planning | false |
| billing credit no-spend boundary | accepted for preflight planning | false |
| retry, timeout, cleanup, and rollback | accepted for preflight planning | false |
| beta and production public-artifact lock | accepted for preflight planning | false |

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

## Future Preflight Planning Scope

The next prompt may plan a bounded transport preflight that checks what would be required before a later controlled transport attempt. The plan must keep every live transport dependency off until a separate preflight and execution authorization exist:

- service URL resolution remains disabled now;
- audience resolution remains disabled now;
- identity-token fetch remains disabled now;
- auth-header creation remains disabled now;
- private request send remains disabled now;
- Cloud Run invocation remains disabled now;
- Qwen inference remains disabled now;
- response persistence remains disabled now;
- generated assets, public artifacts, signed URLs, beta, and production remain blocked.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalAcceptedForPreflightPlanning=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired=true`
- `readyForRealWorkerDispatch=false`
- `transportDependenciesEnabledNow=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT-PLAN: plan controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta`
