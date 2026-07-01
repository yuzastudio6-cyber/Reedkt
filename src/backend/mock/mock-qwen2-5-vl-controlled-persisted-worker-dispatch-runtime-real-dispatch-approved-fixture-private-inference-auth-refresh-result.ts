import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_auth_refresh_verified_read_only_service_job_visible' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DR-PRIVATE-INFERENCE-RETRY-PLAN: plan bounded approved-fixture private inference retry after auth refresh, no inference/no mutation' as const

const attemptResult =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_auth_refresh_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAttemptResultDecision:
    attemptResult.decision,
  authRefreshSummary: {
    sourceBranch: 'codex/external-agent-preflight-auth-skip-handoff',
    sourceCommit: '07a5993',
    sourcePullRequest: 1950,
    localGcloudBinaryFound: true,
    gcloudVersion: '558.0.0',
    projectConfigured: true,
    projectId: 'reeditpro',
    activeAccountConfigured: true,
    activeAccountDomain: 'reeditpro.com',
    accessTokenRefreshAttempted: true,
    accessTokenRefreshPassed: true,
    serviceDescribeAttempted: true,
    serviceDescribePassed: true,
    jobDescribeAttempted: true,
    jobDescribePassed: true,
    blocker: 'cleared',
    manualInteractiveAuthRequired: false,
    tokenValuePrinted: false,
    tokenValueStored: false,
    rawGcloudOutputStored: false,
    blockedBeforeRuntimeMutation: true,
    blockedBeforeGpuSpend: true,
  },
  sanitizedCommands: [
    'command -v gcloud',
    'gcloud --version',
    'gcloud config get-value project',
    'gcloud auth list --filter=status:ACTIVE --format=value(account)',
    'gcloud auth print-access-token --quiet >/dev/null',
    'gcloud run services describe reeditpro-qwen2-5-vl-l4-worker --project reeditpro --region us-central1 --format=value(metadata.name)',
    'gcloud run jobs describe reeditpro-qwen2-5-vl-private-caller --project reeditpro --region us-central1 --format=value(metadata.name)',
  ],
  sourceOfTruthRules: attemptResult.sourceOfTruthRules,
  runtimeFlags: {
    authRefreshResultRecorded: true,
    gcloudInstalled: true,
    projectConfigured: true,
    activeAccountConfigured: true,
    accessTokenRefreshAttempted: true,
    accessTokenRefreshPassed: true,
    serviceDescribeAttempted: true,
    serviceDescribePassed: true,
    jobDescribeAttempted: true,
    jobDescribePassed: true,
    manualInteractiveAuthRequired: false,
    serviceUpdateAttempted: false,
    cpuCallerJobExecuted: false,
    serviceIdentityTokenFetched: false,
    serviceIdentityTokenPrinted: false,
    serviceIdentityTokenStored: false,
    authHeaderCreated: false,
    authHeaderValueStored: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
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
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAuthRefreshResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_AUTH_REFRESH_RESULT
