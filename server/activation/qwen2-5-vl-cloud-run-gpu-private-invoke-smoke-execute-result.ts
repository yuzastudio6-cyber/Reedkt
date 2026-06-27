import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan'

export const QWEN25_PRIVATE_INVOKE_SMOKE_EXECUTE_RESULT = {
  mode: 'qwen2_5_vl_private_invoke_smoke_execute_result_blocked_before_request',
  runId: 'qwen25-private-invoke-smoke-20260627T104058',
  status: 'blocked',
  decision:
    'qwen2_5_vl_private_invoke_smoke_blocked_identity_token_fetch_no_request',
  target: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN.targetService,
  authReverifyRunId: QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.runId,
  preflightRunId: 'qwen25-private-invoke-auth-20260627T101708',
  sourceSmokePlanDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN.decision,
  probes: [
    {
      id: 'gcloud_version',
      status: 'passed',
      outputSummary: 'Google Cloud SDK 558.0.0',
    },
    {
      id: 'active_project',
      status: 'passed',
      outputSummary: 'reeditpro',
    },
    {
      id: 'cloud_run_service_describe',
      status: 'passed',
      outputSummary:
        'service describe passed; service URL was resolved only in memory and not stored; ingress internal-and-cloud-load-balancing; template max scale 1; service max scale 3',
    },
    {
      id: 'identity_token_fetch',
      status: 'blocked',
      outputSummary: 'identity_token_fetched=false; identity_token_value_stored=false',
      errorSummary:
        'gcloud active account cannot mint an audience-bound identity token with the requested command; a service-account token path or approved impersonation path is required',
    },
  ],
  blockers: ['identity_token_fetch_blocked'],
  tokenPathFinding: {
    audienceBoundIdentityTokenRequired: true,
    identityTokenFetched: false,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
    activeUserAudienceTokenBlocked: true,
    serviceAccountImpersonationAttempted: false,
    serviceAccountKeyCreated: false,
    requiredNextReview:
      'approve backend-safe service-account token path or impersonation path without key files',
  },
  smokeRequest: {
    method: 'POST',
    path: '/',
    bodySource: 'approved_snapshot_local_queue_fixture',
    bodyByteLength: 1714,
    maxBodyBytes: 65536,
    retryAttempted: false,
  },
  smokeResponse: {
    received: false,
    httpStatus: undefined,
    serviceReason: undefined,
    contractSatisfiedForFutureRuntime: false,
    modelInferenceEnabled: false,
    runtimeContractExecutesNow: false,
    classificationStatus: undefined,
  },
  observedCostPosture: {
    selectedGpu: 'nvidia_l4',
    minScaleAnnotationPresent: false,
    templateMaxScale: '1',
    serviceMaxScale: '3',
    singleRequestNoRetry: true,
    costGuardReviewedBeforeInvoke: true,
    gpuInstanceInvokedByThisSmoke: false,
  },
  runtimeFlags: {
    privateInvokeSmokeRunnerDefined: true,
    requiresExplicitExecutionFlag: true,
    requiresConfirmationEnv: true,
    authReverifyPassed: true,
    costGuardReviewedBeforeInvoke: true,
    serviceUrlResolvedNow: true,
    serviceUrlValueStored: false,
    audienceResolvedNow: true,
    audienceValueStored: false,
    authHeaderCreated: false,
    identityTokenFetched: false,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    responseClassifiedLocally: false,
    retryAttempted: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    providerCallsMade: false,
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
    'QWEN2_5_VL_STACK_TOOL_52-FIX-PRIVATE-INVOKE-SMOKE: fix controlled private invoke smoke blocker, no inference',
} as const

export type Qwen25PrivateInvokeSmokeExecuteResult =
  typeof QWEN25_PRIVATE_INVOKE_SMOKE_EXECUTE_RESULT
