import { getApiRouteById } from '../api/api-route-registry'
import { QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID } from '../api/qwen2-5-vl-private-invoke-frontend-client'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route'

const routeDefinition = getApiRouteById(QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID)

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_frontend_client_mock_only',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_frontend_client_registered_mock_only',
  routeId: QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID,
  routeStatus: routeDefinition?.status,
  routeRuntimeMode: routeDefinition?.runtimeMode,
  routeSecurityLevel: routeDefinition?.securityLevel,
  upstreamRouteDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE.decision,
  clientBoundaries: {
    usesCentralReeditProApiClient: true,
    callsMockDryRunRouteOnly: true,
    rawPromptBodyRejectedByMockRoute: true,
    browserMayLoadModelWeights: false,
    browserMayReadProviderSecrets: false,
    browserMayCreateAuthHeaders: false,
    browserMayCallCloudRun: false,
    browserMayPersistRuntimeOutput: false,
  },
  runtimeFlags: {
    frontendClientDefined: true,
    exportedFromApiIndex: true,
    routeRegistered: routeDefinition !== undefined,
    routeMockReady: routeDefinition?.status === 'mock_ready',
    backendRouteDeployed: false,
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
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_51-PRIVATE-INVOKE-SMOKE-PLAN: define controlled private invoke smoke after auth/IAM reverify, no inference',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeFrontendClient =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT
