export type Qwen25VlPrivateInvokeReadinessStatus =
  | 'ready'
  | 'blocked_auth_reverify_required'
  | 'blocked_runtime_acceptance_required'

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
    'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_blocked_private_invoke_smoke_required',
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
      id: 'private_invoke_smoke_approval',
      label: 'Controlled private invoke smoke approval',
      status: 'blocked_runtime_acceptance_required',
      evidence: [
        'Read-only auth/IAM reverify passed without token fetch or Cloud Run invocation.',
        'Observed Cloud Run posture uses one NVIDIA L4, concurrency 1, no min scale annotation, and template max scale 1.',
      ],
      missingEvidence: [
        'Controlled private invoke smoke plan must approve whether an identity token may be fetched.',
        'Controlled private invoke smoke plan must verify service audience and request body handling without raw prompts.',
        'Cost guard must review observed service-level max scale annotation of 3 before invocation.',
        'No beta or production runtime approval has been granted.',
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
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    serviceUrlResolvedNow: false,
    authHeaderCreated: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
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
    'controlled_private_invoke_smoke_plan_approved',
    'identity_token_fetch_policy_explicitly_approved',
    'service_audience_resolution_policy_explicitly_approved',
    'cloud_run_service_max_scale_cost_guard_reviewed',
    'private_invoke_smoke_explicitly_approved',
  ],
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_51-PRIVATE-INVOKE-SMOKE-PLAN: define controlled private invoke smoke after auth/IAM reverify, no inference',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeReadinessRollup =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP
