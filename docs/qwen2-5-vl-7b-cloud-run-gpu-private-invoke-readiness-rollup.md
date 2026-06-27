# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Readiness Rollup

Decision: `qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_structured_fixture_output_smoke_passed_review_required`.

This packet rolls up the current Qwen2.5-VL 7B ReeditPro stack-tool state. It confirms that the registry, production readiness metadata, private-invoke mock route, frontend-safe client, chat-native UI surfacing, guarded Cloud Run auth/IAM reverify, controlled private invoke smoke plan, private caller route, Direct VPC route config, CPU-only caller source, CPU-only caller deploy, CPU-only caller contract smoke, runtime readiness review, approved-fixture inference smoke plan, gated service source, service deploy, first fixture attempt, tuned fixture retry, structured output source fix, and controlled structured-output retry are recorded.

The latest controlled retry `qwen25-structured-fixture-output-retry-20260627t204453z` built and deployed the fixed GPU image fail-closed, temporarily enabled only approved fixture gates, ran CPU caller execution `reeditpro-qwen2-5-vl-private-caller-hn9sw`, observed HTTP `200` with `qwen_fixture_inference_smoke_completed`, accepted structured metadata with `parsedJson=true` and `schemaValid=true`, and restored fail-closed GPU revision `reeditpro-qwen2-5-vl-l4-worker-00013-kms`. Raw model output text is intentionally not stored in the repo.

This is evidence only. It does not enable persistent inference, dispatch a user-facing worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

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
- first approved-fixture inference smoke execution: ready, failed attempt documented
- approved-fixture inference smoke fix retry: ready, metadata-only invocation proof recorded
- approved-fixture inference result review: ready, structured-output blocker recorded
- structured fixture output source fix: ready, parser and caller pass condition updated
- structured fixture output smoke retry: ready, schema-valid structured metadata accepted for review
- structured fixture output result review: blocked, review required
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

NVIDIA L4 remains the cost-friendly target for bounded Qwen visual-analysis requests. The intended operating model is run-on-use and stop-when-idle, not an always-on GPU instance.

## Evidence Rows

| Area | Status | Evidence | Missing Evidence |
| --- | --- | --- | --- |
| Production registry profile | ready | `qwen_vl` is registered as `Qwen2.5-VL 7B Instruct`, visual analysis only, GPU worker scoped, and CPU execution blocked. | none |
| Production readiness spec | ready | Qwen model-weight readiness and optional `qwen-vl-utils` import checks are registered. | none |
| Private invoke dry-run route | ready | `jobs.qwen2_5_vl.privateInvoke.dryRun` is registered as mock-ready at `/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`. | none |
| Frontend-safe client | ready | `callQwen25VlPrivateInvokeDryRun` uses the central ReeditPro API client and mock route boundary. | none |
| Chat-native UI | ready | `InlineQwenPlannerRoutingCard` surfaces mock route/client readiness and blocked runtime gates. | none |
| Cloud Run auth/IAM reverify | ready | Local project/account, Cloud Run service describe, service IAM policy read, runtime service account describe, and project invoker policy read probes passed. | none |
| Controlled private invoke smoke execution | ready | The dedicated CPU-only Cloud Run Job path observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`. | none |
| Runtime readiness review | ready | The fail-closed private invoke contract path is proven and the first approved-fixture inference requirements are recorded. | none |
| Approved-fixture inference service source | ready | The GPU service supports gated lazy vLLM approved-fixture inference while preserving default fail-closed behavior. | none |
| Approved-fixture inference service deploy | ready | GPU service image was built and deployed with gated fixture source; CPU caller image was rebuilt and the Cloud Run Job was updated while execution stayed disabled. | none |
| First approved-fixture inference smoke execution | ready | One controlled private approved-fixture inference smoke loaded model weights but failed before inference because vLLM could not allocate KV cache memory. | none |
| Approved-fixture inference smoke fix retry | ready | The tuned retry observed HTTP `200` with `qwen_fixture_inference_smoke_completed`; output evidence was sanitized as length, hash, and counts only. | none |
| Approved-fixture inference result review | ready | Result review accepted invocation, model-cache load, vLLM initialization, and bounded L4 fixture profile evidence, but blocked runtime readiness because `parsedJson=false`, `schemaKeys=[]`, `objectCount=0`, and `textLikeRegionCount=0`. | none |
| Structured fixture output source fix | ready | Fixture prompt targets `qwen_fixture_visual_metadata_v1`, parser recovers JSON objects, metadata normalization reports schema state, and the CPU caller pass condition requires structured metadata. | none |
| Structured fixture output smoke retry | ready | Fixed GPU image tag `structured-fixture-output-retry-46e43a0d-20260627t204453z` ran one controlled private retry, observed `parsedJson=true`, `schemaValid=true`, `objectCount=3`, `textLikeRegionCount=1`, `spatialRelationCount=2`, and `blockedActionCount=4`, then restored fail-closed revision `reeditpro-qwen2-5-vl-l4-worker-00013-kms`. | none |
| Structured fixture output result review | blocked approved-fixture structured output result review required | Structured output smoke retry passed and produced schema-valid metadata-only evidence. | Review accepted structured metadata counts, schema keys, and normalized metadata hash before advancing private runtime readiness. |

## Runtime Gates

- `privateInvocationAuthVerified=true`
- `cloudRunServiceDescribeVerified=true`
- `cloudRunIamPolicyVerified=true`
- `runtimeServiceAccountVerified=true`
- `projectInvokerPolicyVerified=true`
- `privateInvokeSmokePlanDefined=true`
- `privateInvokeSmokeAttempted=true`
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
- `approvedFixtureInferenceSmokeFixAttempted=true`
- `approvedFixtureInferenceSmokeFixPassed=true`
- `approvedFixtureInferenceSmokeResultReviewRequired=true`
- `approvedFixtureInferenceStructuredOutputAccepted=false`
- `approvedFixtureInferenceStructuredOutputFixRequired=true`
- `structuredFixtureOutputSourceFixDefined=true`
- `structuredFixturePromptSchemaTargetDefined=true`
- `structuredFixtureJsonExtractionDefined=true`
- `structuredFixtureMetadataNormalizationDefined=true`
- `structuredFixtureCpuCallerPassConditionTightened=true`
- `structuredFixtureOutputLocalParserValidationPassed=true`
- `structuredFixtureOutputSmokeRetryRequired=false`
- `structuredFixtureOutputSmokeRetryAttempted=true`
- `structuredFixtureOutputSmokeRetryPassed=true`
- `structuredFixtureOutputAcceptedForReview=true`
- `structuredFixtureOutputResultReviewRequired=true`
- `structuredFixtureOutputSchemaValid=true`
- `structuredFixtureOutputParsedJson=true`
- `structuredFixtureOutputObjectCount=3`
- `structuredFixtureOutputTextLikeRegionCount=1`
- `structuredFixtureOutputRawOutputStoredInRepo=false`
- `privateInvokeReady=false`
- `betaReady=false`
- `productionReady=false`
- `serviceUrlResolvedNow=true`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=true`
- `audienceValueStored=false`
- `authHeaderCreated=true`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `responseClassifiedLocally=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `modelLoadCompleted=true`
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

The broad `vllmEngineInitialized=false` and `inferenceRun=false` flags mean persistent runtime readiness remains closed. The bounded retry evidence is recorded under structured-output-specific flags and still requires review before private runtime readiness advances.

## Scope Boundaries

Qwen2.5-VL is a visual understanding and visual QA metadata tool. It can be planned for source-frame understanding, B-roll candidate review, generated-asset QA, caption/visual consistency, and screen/chart context review after deterministic tools prepare bounded inputs.

Qwen2.5-VL must not generate B-roll video, replace Wan or LTX generation routes, replace deterministic OCR when exact text is required, render or export final media, call providers, run from frontend code, or execute raw chat as a worker plan.

## Required Next Step

The next action is result review for the accepted structured metadata. That future review must inspect the schema-valid counts and hashes without committing raw model output text, enabling beta, enabling production, creating generated assets, creating public artifacts, creating signed URLs, or claiming `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58G-STRUCTURED-FIXTURE-OUTPUT-RESULT-REVIEW: review accepted structured Qwen fixture metadata, no beta/no generated assets`
