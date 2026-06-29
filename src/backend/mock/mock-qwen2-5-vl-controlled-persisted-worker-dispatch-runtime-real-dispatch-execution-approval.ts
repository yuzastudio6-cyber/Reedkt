import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_approval_accepted_preflight_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CD-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-PREFLIGHT: verify first real persisted Qwen worker dispatch execution preflight, no Cloud Run invocation/no inference/no generated assets/no beta' as const

const executionPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_APPROVAL = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_approval',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanDecision:
    executionPlan.decision,
  executionApproval: {
    decisionRecorded: true,
    acceptsExecutionPlanForFutureControlledRealDispatchPreflight: true,
    controlledRealDispatchExecutionPreflightRequired: true,
    approvesExecutionNow: false,
    approvesWorkerDispatchNow: false,
    approvesWorkerLeaseClaimNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedRealDispatchExecutionPlanEvidence: executionPlan.firstRealDispatchExecutionEnvelope.map((entry) => ({
    id: entry.id,
    acceptedForPreflight: true,
    executionAllowedNow: false,
    requiredInputs: entry.requiredInputs,
  })),
  approvedRuntimePosture: executionPlan.selectedRuntime,
  controlledRealDispatchExecutionPreflightRequirements: executionPlan.executionApprovalPreconditions,
  sourceOfTruthRules: executionPlan.sourceOfTruthRules,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanAccepted: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired: false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRecorded: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalAcceptedForPreflight: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRequired: true,
    readyForRealWorkerDispatch: false,
    realJobCreated: false,
    realLeaseClaimed: false,
    idempotencyRowCreated: false,
    jobEventCreated: false,
    backendRuntimeMessageCreated: false,
    workerClaimCreated: false,
    storageObjectRecordCreated: false,
    signedUrlEventCreated: false,
    qaReportCreated: false,
    auditEventCreated: false,
    creditMutationCreated: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    authHeaderCreated: false,
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
    mediaProcessingRun: false,
    renderExportRun: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApproval =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_APPROVAL
