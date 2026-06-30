import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_APPROVAL } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-approval'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_attempt_blocked_gcloud_reauthentication_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-REFRESH: refresh local gcloud auth for the approved private inference attempt, no Cloud Run mutation/no inference/no generated assets/no beta' as const

const attemptApproval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_APPROVAL

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_attempt_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAttemptApprovalDecision:
    attemptApproval.decision,
  attemptSummary: {
    approvalRecorded: true,
    preflightSmokesPassed: true,
    localGcloudBinaryFound: true,
    gcloudVersion: '558.0.0',
    activeProjectVerified: true,
    projectId: 'reeditpro',
    serviceDescribeAttempted: true,
    serviceDescribePassed: false,
    jobDescribeAttempted: true,
    jobDescribePassed: false,
    blocker: 'gcloud_reauthentication_required',
    blockedBeforeRuntimeMutation: true,
    blockedBeforeGpuSpend: true,
    privateInferenceAttemptExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  },
  selectedRuntime: attemptApproval.approvedRuntimePosture,
  preflightCommands: [
    'npm run smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-approval',
    'npm run smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight',
    'npm run smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup',
    'command -v gcloud',
    'gcloud --version',
    'gcloud config get-value project',
    'gcloud run services describe reeditpro-qwen2-5-vl-l4-worker --project reeditpro --region us-central1 --format=json',
    'gcloud run jobs describe reeditpro-qwen2-5-vl-private-caller --project reeditpro --region us-central1 --format=json',
  ],
  sanitizedBlocker: {
    id: 'gcloud_reauthentication_required',
    serviceDescribeBlocked: true,
    jobDescribeBlocked: true,
    interactiveAuthRequired: true,
    nonInteractiveTokenRefreshSucceeded: false,
    credentialsPrinted: false,
    tokenPrinted: false,
    serviceUrlPrinted: false,
    rawGcloudOutputStored: false,
  },
  sourceOfTruthRules: attemptApproval.sourceOfTruthRules,
  runtimeFlags: {
    privateInferenceAttemptApprovalRecorded: true,
    privateInferenceAttemptResultRecorded: true,
    privateInferenceAttemptBlockedBeforeRuntime: true,
    gcloudReauthenticationRequired: true,
    serviceDescribeAttempted: true,
    serviceDescribePassed: false,
    jobDescribeAttempted: true,
    jobDescribePassed: false,
    serviceUpdateAttempted: false,
    cpuCallerJobExecuted: false,
    serviceTargetResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    identityTokenPrinted: false,
    identityTokenValueStored: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInferenceAttemptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_PRIVATE_INFERENCE_ATTEMPT_RESULT
