# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Readiness Rollup

Decision: `qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_fixture_smoke_fix_required`.

This packet rolls up the current Qwen2.5-VL 7B ReeditPro stack-tool state. It confirms that the registry, production readiness metadata, private-invoke mock route, frontend-safe client, chat-native UI surfacing, guarded read-only Cloud Run auth/IAM reverify, controlled private invoke smoke plan, non-key impersonation token-path runner, narrow authz bindings, routing fix, internal caller harness plan, internal caller deploy preflight, internal route approval, Direct VPC route config, CPU-only caller source, CPU-only caller deployment, CPU-only caller contract smoke, runtime readiness review, first approved-fixture inference smoke plan, approved-fixture inference service source, approved-fixture inference service deploy result, and first controlled approved-fixture inference smoke attempt are in place. The earlier local developer-machine request returned HTTP `404`, classified as `private_invoke_response_unexpected`, because the service ingress is `internal-and-cloud-load-balancing`; the dedicated CPU-only Cloud Run Job now provides the approved private caller path. The controlled caller execution `reeditpro-qwen2-5-vl-private-caller-nlc88` observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`. The gated service source was deployed as Cloud Run revision `reeditpro-qwen2-5-vl-l4-worker-00005-bw9`; the first fixture smoke attempted execution through `reeditpro-qwen2-5-vl-private-caller-f2xtb`, temporarily deployed revision `reeditpro-qwen2-5-vl-l4-worker-00006-rr8`, restored fail-closed revision `reeditpro-qwen2-5-vl-l4-worker-00007-kpp`, and failed before inference because vLLM could not allocate KV cache memory after model load. The remaining blocker is a fixture inference smoke memory-envelope fix and retry.

This is evidence only. It records that the guarded backend smoke resolved the target in memory, created an auth header, fetched an identity token without printing or storing token values, and sent one bounded Cloud Run contract request. The packet itself does not enable inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Current Readiness

- registry profile: ready
- production readiness spec: ready
- private-invoke dry-run route: ready
- frontend-safe API client: ready
- chat-native readiness UI: ready
- Cloud Run auth/IAM reverify: ready
- controlled private invoke smoke plan: ready
- controlled private invoke smoke execution: ready
- private invoke runtime readiness review: ready
- first approved-fixture inference smoke plan: ready
- approved-fixture inference service source: ready
- approved-fixture inference service deploy: ready
- first approved-fixture inference smoke execution: blocked, memory-envelope fix required
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
| Controlled private invoke smoke execution | ready | Read-only auth/IAM reverify passed, narrow TokenCreator and Run Invoker bindings were applied, the Direct VPC route config created the dedicated `qwen-private-caller-us-central1` subnet with Private Google Access enabled, the CPU-only caller source is defined, the CPU-only caller deploy path is ready, the caller Docker command was fixed to run the caller by default, and one controlled caller execution observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`. | none |
| Private invoke runtime readiness review | ready | The fail-closed private invoke contract path is proven, persistent CPU caller/GPU service configs remain fail-closed after the smoke, and the runtime readiness review defines the first approved-fixture inference requirements. | none |
| First approved-fixture inference smoke plan | ready | Runtime readiness review requires approved snapshot, private artifact, worker, QA, cost, no-public-output, no-beta, and no-production evidence before any inference smoke. The plan records the existing local queue contract, pinned model revision/checksum, L4 runtime posture, and use-case ranking. | none |
| Approved-fixture inference service source | ready | The GPU service source supports a gated lazy vLLM approved-fixture inference path while preserving default fail-closed behavior, and the CPU caller source supports the future fixture-response expectation. | none |
| Approved-fixture inference service deploy | ready | GPU service image was built and deployed with gated fixture inference source; GPU service revision `reeditpro-qwen2-5-vl-l4-worker-00005-bw9` is ready with NVIDIA L4, template max scale 1, internal ingress, no public unauthenticated access, and read-only private model-cache mount; CPU caller image was rebuilt and the Cloud Run Job was updated while execution stayed disabled. | none |
| First approved-fixture inference smoke execution | blocked approved-fixture inference smoke fix required | One controlled private approved-fixture inference smoke was attempted through the CPU caller. The temporary GPU fixture revision was restored to fail-closed after the attempt. The Qwen weights loaded from the private mount, but vLLM reported `-0.96 GiB` available KV cache memory and failed before inference. | A tuned controlled retry that produces sanitized metadata-only inference output and a Qwen fixture result review after the KV-cache memory fix. |

## Runtime Gates

- `privateInvocationAuthVerified=true`
- `cloudRunServiceDescribeVerified=true`
- `cloudRunIamPolicyVerified=true`
- `runtimeServiceAccountVerified=true`
- `projectInvokerPolicyVerified=true`
- `privateInvokeSmokePlanDefined=true`
- `internalCallerHarnessPlanDefined=true`
- `internalCallerDeployPreflightRecorded=true`
- `internalRouteApprovalRecorded=true`
- `futureDirectVpcRouteConfigApproved=true`
- `directVpcRouteConfigResultRecorded=true`
- `gcpNetworkMutationOccurred=true`
- `dedicatedCallerSubnetCreated=true`
- `dedicatedCallerSubnetPrivateGoogleAccess=true`
- `defaultSubnetPrivateGoogleAccess=false`
- `defaultSubnetChanged=false`
- `approvedPrivateRouteReady=true`
- `directVpcPrivateRoutePrerequisiteReady=true`
- `cpuOnlyCallerSourceDefined=true`
- `cpuOnlyCallerImageSourceDefined=true`
- `cpuOnlyCallerImageDefined=true`
- `cpuOnlyCallerImageBuilt=true`
- `cpuOnlyCallerImagePushed=true`
- `cpuOnlyCallerImageDeployed=true`
- `cpuOnlyCallerJobDeployed=true`
- `callerHarnessReady=true`
- `callerHarnessExecuted=true`
- `jobExecutionCount=1`
- `serviceAccountCreated=true`
- `targetServiceInvokerIamChanged=true`
- `directVpcEgressConfigured=true`
- `privateGoogleAccessChanged=false`
- `internalCallerHarnessDeployed=true`
- `privateInvokeSmokeAttempted=true`
- `privateInvokeSmokeBlockedBeforeRequest=false`
- `privateInvokeSmokeExecuted=true`
- `privateInvokeSmokePassed=true`
- `failClosedResponseObserved=true`
- `contractSatisfiedForFutureRuntime=true`
- `runtimeContractExecutesNow=false`
- `runtimeReadinessReviewRecorded=true`
- `firstApprovedFixtureInferenceSmokePlanDefined=true`
- `approvedFixtureInferenceServiceSourceDefined=true`
- `approvedFixtureInferenceServiceDeployed=true`
- `approvedFixtureInferenceServiceDeployVerified=true`
- `approvedFixtureInferenceGpuImageBuilt=true`
- `approvedFixtureInferenceGpuImagePushed=true`
- `approvedFixtureInferenceGpuServiceReady=true`
- `approvedFixtureInferenceGpuServiceRevisionReady=true`
- `approvedFixtureInferenceCpuCallerImageBuilt=true`
- `approvedFixtureInferenceCpuCallerImagePushed=true`
- `approvedFixtureInferenceCpuCallerJobUpdated=true`
- `approvedFixtureInferenceCpuCallerJobReady=true`
- `approvedFixtureInferenceCpuCallerJobExecuted=true`
- `firstApprovedFixtureInferenceSmokeAttempted=true`
- `firstApprovedFixtureInferenceSmokeExecuted=true`
- `firstApprovedFixtureInferenceSmokePassed=false`
- `approvedFixtureInferenceSmokeFixRequired=true`
- `temporaryFixtureInferenceServiceRevisionDeployed=true`
- `temporaryFixtureInferenceServiceRestored=true`
- `serviceRestoredFailClosedAfterFixtureAttempt=true`
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
- `restrictedIngressDirectLocalRequestBlocked=true`
- `serviceRuntimeRequestSent=true`
- `responseClassifiedLocally=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `modelLoadCompleted=true`
- `vllmKvCacheMemoryFailureObserved=true`
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

The next action is a bounded memory-envelope fix before another private approved-fixture inference smoke. That future prompt must keep the service fail-closed by default, tune only the controlled fixture path, avoid generated assets and public outputs, and continue using run-on-use Cloud Run GPU behavior rather than an always-on instance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58C-APPROVED-FIXTURE-INFERENCE-SMOKE-FIX: tune Qwen fixture inference memory envelope after failed L4 smoke, no generated assets/no beta`
