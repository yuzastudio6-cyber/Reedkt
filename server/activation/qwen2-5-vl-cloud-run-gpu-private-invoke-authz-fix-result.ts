import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN25_PRIVATE_INVOKE_TOKEN_PATH_FIX_RESULT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-token-path-fix-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan'

export const QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT = {
  mode: 'qwen2_5_vl_private_invoke_authz_fix_result',
  runId: 'qwen25-private-invoke-smoke-20260627T113052',
  status: 'blocked',
  decision:
    'qwen2_5_vl_private_invoke_authz_fixed_blocked_unexpected_404_no_inference',
  target: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN.targetService,
  authReverifyRunId: QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.runId,
  tokenPathFixRunId: QWEN25_PRIVATE_INVOKE_TOKEN_PATH_FIX_RESULT.runId,
  preflightRunId: 'qwen25-private-invoke-auth-20260627T101708',
  iamChangesApplied: {
    serviceAccountTokenCreatorBindingAdded: true,
    tokenCreatorMember: 'user:aiediting@reeditpro.com',
    tokenCreatorTarget:
      'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    cloudRunInvokerBindingAdded: true,
    cloudRunInvokerMember:
      'serviceAccount:reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    cloudRunInvokerTarget: 'reeditpro-qwen2-5-vl-l4-worker',
    broadProjectRoleAdded: false,
    serviceAccountKeyCreated: false,
    publicInvokerAdded: false,
  },
  probes: [
    {
      id: 'service_account_iam_policy',
      status: 'passed',
      outputSummary:
        'runtime service account IAM policy includes user-scoped roles/iam.serviceAccountTokenCreator binding',
    },
    {
      id: 'cloud_run_service_iam_policy',
      status: 'passed',
      outputSummary:
        'Cloud Run service IAM policy includes runtime service account roles/run.invoker binding',
    },
    {
      id: 'identity_token_fetch',
      status: 'passed',
      commandSummary:
        'gcloud --quiet --impersonate-service-account redacted_not_stored auth print-identity-token --audiences redacted_not_stored',
      outputSummary:
        'identity_token_fetched=true; identity_token_value_stored=false; identity_token_output_printed=false',
    },
    {
      id: 'cloud_run_contract_post',
      status: 'blocked',
      commandSummary: 'fetch redacted_service_url POST / with redacted_identity_token',
      outputSummary:
        'httpStatus=404; reason=non_json_or_missing_reason; contractSatisfiedForFutureRuntime=false; modelInferenceEnabled=false; runtimeContractExecutesNow=false',
    },
    {
      id: 'cloud_run_revision_logs',
      status: 'blocked',
      outputSummary:
        'no Cloud Run revision log rows were observed for the bounded smoke timestamp window',
    },
  ],
  blockers: ['private_invoke_response_unexpected'],
  tokenPathFinding: {
    audienceBoundIdentityTokenRequired: true,
    identityTokenFetched: true,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
    serviceAccountImpersonationConfigured: true,
    serviceAccountImpersonationAttempted: true,
    tokenCreatorPermissionEffectiveAfterPropagation: true,
    serviceAccountKeyCreated: false,
    authHeaderCreated: true,
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
    received: true,
    httpStatus: 404,
    serviceReason: 'non_json_or_missing_reason',
    contractSatisfiedForFutureRuntime: false,
    modelInferenceEnabled: false,
    runtimeContractExecutesNow: false,
    classificationStatus: 'blocked_unexpected_runtime_response',
  },
  routingFinding: {
    serviceContractReached: false,
    expectedHttpStatus: 403,
    actualHttpStatus: 404,
    expectedReason: 'qwen_inference_disabled_after_contract_check',
    actualReason: 'non_json_or_missing_reason',
    cloudRunRevisionLogsObserved: false,
    suspectedBlocker: 'cloud_run_ingress_or_private_route_not_reaching_contract_handler',
  },
  observedCostPosture: {
    selectedGpu: 'nvidia_l4',
    minScaleAnnotationPresent: false,
    templateMaxScale: '1',
    serviceMaxScale: '3',
    singleRequestNoRetry: true,
    costGuardReviewedBeforeInvoke: true,
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
    authHeaderCreated: true,
    identityTokenFetched: true,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
    serviceAccountImpersonationConfigured: true,
    serviceAccountImpersonationAttempted: true,
    serviceAccountKeyCreated: false,
    cloudRunInvocationAttempted: true,
    serviceRuntimeRequestSent: true,
    responseClassifiedLocally: true,
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
    'QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX: fix controlled private invoke route/ingress contract response, no inference',
} as const

export type Qwen25PrivateInvokeAuthzFixResult =
  typeof QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT
