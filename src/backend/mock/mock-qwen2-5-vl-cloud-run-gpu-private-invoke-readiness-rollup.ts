import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from './mock-qwen2-5-vl-private-invoke-runtime-readiness-review'

export type Qwen25VlPrivateInvokeReadinessStatus =
  | 'ready'
  | 'blocked_auth_reverify_required'
  | 'blocked_runtime_acceptance_required'
  | 'blocked_identity_token_path_required'
  | 'blocked_token_creator_permission_required'
  | 'blocked_routing_contract_response_required'
  | 'blocked_internal_ingress_private_caller_required'
  | 'blocked_direct_vpc_route_config_required'
  | 'blocked_cpu_only_internal_caller_source_required'
  | 'blocked_cpu_only_internal_caller_deploy_required'
  | 'blocked_cpu_only_internal_caller_contract_smoke_required'
  | 'blocked_approved_fixture_inference_smoke_plan_required'

export type Qwen25VlPrivateInvokeReadinessGate = {
  id: string
  label: string
  status: Qwen25VlPrivateInvokeReadinessStatus
  evidence: string[]
  missingEvidence: string[]
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_mock_only',
  decision:
    'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_runtime_review_recorded_fixture_plan_required',
  upstreamCpuCallerSourceDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE.decision,
  upstreamCpuCallerDeployDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT.decision,
  upstreamCpuCallerContractSmokeDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT.decision,
  upstreamRuntimeReadinessReviewDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW.decision,
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    costPosture: 'scale_to_zero_required',
    minInstancesRequired: 0,
    maxInstancesForInitialPrivateInvoke: 1,
    cpuFallbackAllowed: false,
    reason:
      'NVIDIA L4 on Cloud Run GPU is the current cost-friendly target for bounded Qwen visual-analysis requests that should run only when invoked and scale back down when idle.',
  },
  readinessGates: [
    {
      id: 'production_registry_profile',
      label: 'Production tool registry profile',
      status: 'ready',
      evidence: [
        'qwen_vl profile registered as Qwen2.5-VL 7B Instruct.',
        'Profile is visual_analysis, gpu_ai_worker scoped, gpuRequired=true, cpuAllowed=false.',
      ],
      missingEvidence: [],
    },
    {
      id: 'production_readiness_spec',
      label: 'Production readiness spec',
      status: 'ready',
      evidence: [
        'Qwen2.5-VL 7B Instruct appears in model-weight readiness specs.',
        'qwen-vl-utils import check is optional and model-weight gated.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_route',
      label: 'Private invoke dry-run route',
      status: 'ready',
      evidence: [
        'Route id jobs.qwen2_5_vl.privateInvoke.dryRun is registered as mock_ready.',
        'Route path is /api/jobs/qwen2-5-vl/private-invoke/dry-run/mock.',
        'Raw prompt-shaped inputs are rejected before dry-run coordination.',
      ],
      missingEvidence: [],
    },
    {
      id: 'frontend_client',
      label: 'Frontend-safe API client',
      status: 'ready',
      evidence: [
        'callQwen25VlPrivateInvokeDryRun uses the central ReeditPro API client.',
        'getQwen25VlPrivateInvokeFrontendClientStatus exposes fail-closed readiness.',
      ],
      missingEvidence: [],
    },
    {
      id: 'chat_ui_surface',
      label: 'Chat-native readiness UI',
      status: 'ready',
      evidence: [
        'InlineQwenPlannerRoutingCard surfaces route/client readiness.',
        'UI displays blocked Cloud Run invocation, inference, worker dispatch, generated assets, service URL, auth header, identity token, and raw prompt state.',
      ],
      missingEvidence: [],
    },
    {
      id: 'cloud_run_auth_reverify',
      label: 'Cloud Run auth/IAM reverify',
      status: 'ready',
      evidence: [
        'gcloud version, active project, and active account-domain probes passed.',
        'Cloud Run service describe, Cloud Run service IAM policy read, runtime service account describe, and project invoker policy read passed.',
        'No identity token was fetched and no Cloud Run invocation was attempted.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_smoke_plan',
      label: 'Controlled private invoke smoke plan',
      status: 'ready',
      evidence: [
        'Private invoke smoke plan defines backend-only health/readiness and contract POST candidates.',
        'Expected POST response is 403 qwen_inference_disabled_after_contract_check with contractSatisfiedForFutureRuntime=true and modelInferenceEnabled=false.',
        'Plan keeps token fetch, service URL resolution, Cloud Run request, inference, worker dispatch, Supabase, assets, signed/public artifacts, credits, beta, and production false.',
      ],
      missingEvidence: [],
    },
    {
      id: 'private_invoke_smoke_execution',
      label: 'Controlled private invoke smoke execution',
      status: 'ready',
      evidence: [
        'Read-only auth/IAM reverify passed without Cloud Run invocation.',
        'Observed Cloud Run posture uses one NVIDIA L4, concurrency 1, no min scale annotation, and template max scale 1.',
        'Private invoke smoke plan is defined.',
        'Controlled smoke runner supports non-key service-account impersonation, TokenCreator and Run Invoker bindings are present, and one bounded request returned HTTP 404 instead of the expected fail-closed contract JSON.',
        'Routing fix records ingress internal-and-cloud-load-balancing and blocks future direct local service-host requests before token fetch unless an approved internal route is confirmed.',
        'Internal caller harness plan selects a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU future path.',
        'Deploy preflight found the preferred route is not ready because Private Google Access is disabled on the inspected default subnet and no equivalent private route is recorded.',
        'Internal route approval conditionally accepts Direct VPC egress with Private Google Access for a future configuration prompt only.',
        'Direct VPC route config created a dedicated qwen-private-caller-us-central1 subnet with Private Google Access enabled and left the default subnet unchanged.',
        'CPU-only internal caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path.',
        'CPU-only internal caller image was built and pushed, a dedicated caller service account was created, narrow service-level Run Invoker was granted, and the controlled Cloud Run Job was deployed Ready without execution.',
        'CPU caller Docker command was fixed to run the caller by default, the caller now parses service JSON, and one controlled execution completed with HTTP 403, serviceReason qwen_inference_disabled_after_contract_check, contractSatisfiedForFutureRuntime=true, runtimeContractExecutesNow=false, and modelInferenceEnabled=false.',
      ],
      missingEvidence: [
        'No beta or production runtime approval has been granted.',
      ],
    },
    {
      id: 'private_invoke_runtime_readiness_review',
      label: 'Private invoke runtime readiness review',
      status: 'ready',
      evidence: [
        'Fail-closed private invoke contract path is proven through the CPU-only internal caller.',
        'Persistent CPU caller and GPU service configs remain fail-closed after the smoke.',
        'Runtime readiness review is recorded and defines the first approved-fixture inference smoke requirements.',
      ],
      missingEvidence: [],
    },
    {
      id: 'first_approved_fixture_inference_smoke_plan',
      label: 'First approved-fixture inference smoke plan',
      status: 'blocked_approved_fixture_inference_smoke_plan_required',
      evidence: [
        'Runtime readiness review requires approved snapshot, private artifact, worker, QA, cost, no-public-output, no-beta, and no-production evidence before any inference smoke.',
        'Qwen remains visual understanding and QA metadata only.',
      ],
      missingEvidence: [
        'First private approved-fixture inference smoke plan.',
        'Bounded private sampled-frame fixture contract.',
        'Metadata-only output schema and no-spend cost gate.',
      ],
    },
  ] satisfies Qwen25VlPrivateInvokeReadinessGate[],
  runtimeFlags: {
    registryProfileReady: true,
    productionReadinessSpecRegistered: true,
    routeMockReady: true,
    frontendClientReady: true,
    uiSurfacingReady: true,
    privateInvocationAuthVerified: true,
    cloudRunServiceDescribeVerified: true,
    cloudRunIamPolicyVerified: true,
    runtimeServiceAccountVerified: true,
    projectInvokerPolicyVerified: true,
    privateInvokeSmokePlanDefined: true,
    internalCallerHarnessPlanDefined: true,
    internalCallerDeployPreflightRecorded: true,
    internalRouteApprovalRecorded: true,
    futureDirectVpcRouteConfigApproved: true,
    directVpcRouteConfigResultRecorded: true,
    gcpNetworkMutationOccurred: true,
    dedicatedCallerSubnetCreated: true,
    dedicatedCallerSubnetPrivateGoogleAccess: true,
    defaultSubnetPrivateGoogleAccess: false,
    defaultSubnetChanged: false,
    approvedPrivateRouteReady: true,
    directVpcPrivateRoutePrerequisiteReady: true,
    cpuOnlyCallerSourceDefined: true,
    cpuOnlyCallerImageSourceDefined: true,
    cpuOnlyCallerImageDefined: true,
    cpuOnlyCallerImageBuilt: true,
    cpuOnlyCallerImagePushed: true,
    cpuOnlyCallerImageDeployed: true,
    cpuOnlyCallerJobDeployed: true,
    callerHarnessReady: true,
    callerHarnessExecuted: true,
    jobExecutionCount: 1,
    serviceAccountCreated: true,
    targetServiceInvokerIamChanged: true,
    directVpcEgressConfigured: true,
    privateGoogleAccessChanged: false,
    internalCallerHarnessDeployed: true,
    privateInvokeSmokeAttempted: true,
    privateInvokeSmokeBlockedBeforeRequest: false,
    privateInvokeSmokeExecuted: true,
    privateInvokeSmokePassed: true,
    failClosedResponseObserved: true,
    contractSatisfiedForFutureRuntime: true,
    runtimeContractExecutesNow: false,
    runtimeReadinessReviewRecorded: true,
    firstApprovedFixtureInferenceSmokeReady: false,
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    serviceUrlResolvedNow: true,
    serviceUrlValueStored: false,
    audienceResolvedNow: true,
    audienceValueStored: false,
    authHeaderCreated: true,
    identityTokenFetched: true,
    serviceAccountImpersonationConfigured: true,
    serviceAccountImpersonationAttempted: true,
    serviceAccountKeyCreated: false,
    cloudRunInvocationAttempted: true,
    restrictedIngressDirectLocalRequestBlocked: true,
    serviceRuntimeRequestSent: true,
    responseClassifiedLocally: true,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    inferenceRun: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  blockedUntil: [
    'approved_fixture_inference_smoke_plan_required',
    'approved_fixture_inference_smoke_execution_required',
    'beta_and_production_approval_required',
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_57-APPROVED-FIXTURE-INFERENCE-SMOKE-PLAN: define first private approved-fixture Qwen inference smoke, no execution',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeReadinessRollup =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP
