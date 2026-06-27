import { getApiRouteById } from '../api/api-route-registry'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run'

const routeId = 'jobs.qwen2_5_vl.privateInvoke.dryRun'
const routeDefinition = getApiRouteById(routeId)

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_dry_run_route_contract',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_route_contract_registered_mock_only',
  routeId,
  routeDefinition,
  upstreamDryRunDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN.decision,
  routeBoundaries: {
    registeredInApiRouteMap: routeDefinition !== undefined,
    domain: routeDefinition?.domain,
    method: routeDefinition?.method,
    path: routeDefinition?.path,
    status: routeDefinition?.status,
    runtimeMode: routeDefinition?.runtimeMode,
    securityLevel: routeDefinition?.securityLevel,
    requiresSupabase: routeDefinition?.requiresSupabase,
    requiresServiceRole: routeDefinition?.requiresServiceRole,
    requiresProviderSecret: routeDefinition?.requiresProviderSecret,
    requiresStripeSecret: routeDefinition?.requiresStripeSecret,
    rawPromptBodyRejectedByMockHandler: true,
  },
  runtimeFlags: {
    routeContractRegistered: routeDefinition !== undefined,
    mockHandlerRegistered: routeDefinition?.mockHandlerName === 'handleMockQwenPrivateInvokeDryRun',
    backendRouteDeployed: false,
    serviceUrlResolvedNow: false,
    authHeaderCreated: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    inferenceRun: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_49-PRIVATE-INVOKE-AUTH-REVERIFY-PLAN: prepare guarded auth reverify after user gcloud reauth, no invocation',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeDryRunRoute =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE
