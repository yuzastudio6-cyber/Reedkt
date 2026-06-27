# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Readiness Rollup

Decision: `qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_blocked_routing_contract_response_required`.

This packet rolls up the current Qwen2.5-VL 7B ReeditPro stack-tool state. It confirms that the registry, production readiness metadata, private-invoke mock route, frontend-safe client, chat-native UI surfacing, guarded read-only Cloud Run auth/IAM reverify, controlled private invoke smoke plan, non-key impersonation token-path runner, and narrow authz bindings are in place. The latest controlled smoke minted an identity token and sent one authenticated contract request, but the response was HTTP `404` instead of the expected fail-closed contract JSON.

This is evidence only. It records that the guarded backend smoke resolved the target in memory, created an auth header, fetched an identity token without printing or storing token values, and sent one bounded Cloud Run contract request. The packet itself does not enable inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Current Readiness

- registry profile: ready
- production readiness spec: ready
- private-invoke dry-run route: ready
- frontend-safe API client: ready
- chat-native readiness UI: ready
- Cloud Run auth/IAM reverify: ready
- controlled private invoke smoke plan: ready
- controlled private invoke smoke execution: blocked before request
- private invoke runtime readiness: false
- beta readiness: false
- production readiness: false

## Selected GPU And Runtime Posture

- selected runtime: Google Cloud Run GPU
- selected GPU: NVIDIA L4
- target region: `us-central1`
- target service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: scale to zero required
- initial max instances: 1
- minimum instances: 0
- CPU fallback: false

NVIDIA L4 remains the cost-friendly target for bounded Qwen visual-analysis requests. The intended operating model is run-on-use and stop-when-idle, not an always-on GPU instance. Larger GPU shapes require separate evidence-based escalation.

## Evidence Rows

| Area | Status | Evidence | Missing Evidence |
| --- | --- | --- | --- |
| Production registry profile | ready | `qwen_vl` is registered as `Qwen2.5-VL 7B Instruct`, visual analysis only, GPU worker scoped, and CPU execution blocked. | none |
| Production readiness spec | ready | Qwen model-weight readiness and optional `qwen-vl-utils` import checks are registered. | none |
| Private invoke dry-run route | ready | `jobs.qwen2_5_vl.privateInvoke.dryRun` is registered as mock-ready at `/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`. | none |
| Frontend-safe client | ready | `callQwen25VlPrivateInvokeDryRun` uses the central ReeditPro API client and mock route boundary. | none |
| Chat-native UI | ready | `InlineQwenPlannerRoutingCard` surfaces mock route/client readiness and blocked runtime gates. | none |
| Cloud Run auth/IAM reverify | ready | Local `gcloud` version, active project, active account-domain, Cloud Run service describe, Cloud Run service IAM policy read, runtime service account describe, and project invoker policy read probes passed. | none |
| Controlled private invoke smoke plan | ready | The plan allows only backend-only health/readiness and contract POST candidates. The expected contract POST response is `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, and `modelInferenceEnabled=false`. | none |
| Controlled private invoke smoke execution | blocked unexpected response | Read-only auth/IAM reverify passed, narrow TokenCreator and Run Invoker bindings were applied, the smoke runner reviewed cost posture, minted an identity token without printing or storing it, and sent one authenticated contract request. The response was HTTP `404` with no expected JSON contract, classified as `private_invoke_response_unexpected`. | Cloud Run ingress/private route/load balancer/proxy/service URL/audience path that reaches the fail-closed contract handler, and a successful controlled contract response with inference disabled. |

## Runtime Gates

- `privateInvocationAuthVerified=true`
- `cloudRunServiceDescribeVerified=true`
- `cloudRunIamPolicyVerified=true`
- `runtimeServiceAccountVerified=true`
- `projectInvokerPolicyVerified=true`
- `privateInvokeSmokePlanDefined=true`
- `privateInvokeSmokeAttempted=true`
- `privateInvokeSmokeBlockedBeforeRequest=false`
- `privateInvokeSmokeExecuted=false`
- `privateInvokeReady=false`
- `betaReady=false`
- `productionReady=false`
- `serviceUrlResolvedNow=true`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=true`
- `audienceValueStored=false`
- `authHeaderCreated=true`
- `identityTokenFetched=true`
- `serviceAccountImpersonationConfigured=true`
- `serviceAccountImpersonationAttempted=true`
- `serviceAccountKeyCreated=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `responseClassifiedLocally=true`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Scope Boundaries

Qwen2.5-VL is a visual understanding and visual QA metadata tool. It can be planned for source-frame understanding, B-roll candidate review, generated-asset QA, caption/visual consistency, and screen/chart context review after deterministic tools prepare bounded inputs.

Qwen2.5-VL must not generate B-roll video, replace Wan or LTX generation routes, replace deterministic OCR when exact text is required, render or export final media, call providers, run from frontend code, or execute raw chat as a worker plan.

## Required Next Step

The next action is fixing the route/ingress boundary for the controlled private invoke smoke. That future prompt must determine why the authenticated request returns HTTP `404` instead of reaching the fail-closed contract handler. It must preserve the same single-request/no-retry/no-token-printing/no-service-URL-storage/no-inference/no-assets/no-credits/no-beta/no-production posture.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX: fix controlled private invoke route/ingress contract response, no inference`
