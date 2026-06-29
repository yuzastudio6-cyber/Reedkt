import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_approval_accepted_preflight_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BW-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-PREFLIGHT: verify controlled persisted Qwen worker dispatch runtime execution preflight, no Cloud Run invocation/no inference/no assets/no beta' as const

const executionPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_approval',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeExecutionPlanDecision:
    executionPlan.decision,
  executionApproval: {
    decisionRecorded: true,
    acceptsExecutionPlanForFutureControlledRuntimePreflight: true,
    controlledRuntimeExecutionPreflightRequired: true,
    approvesExecutionNow: false,
    approvesWorkerDispatchNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedExecutionPlanEvidence: executionPlan.futureExecutionEnvelope.map((entry) => ({
    id: entry.id,
    acceptedForPreflight: true,
    executionAllowedNow: false,
    requiredInputs: entry.requiredInputs,
  })),
  approvedRuntimePosture: executionPlan.selectedRuntime,
  controlledRuntimeExecutionPreflightRequirements: executionPlan.futurePreflightRequirements,
  sourceOfTruthRules: executionPlan.sourceOfTruthRules,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeExecutionPlanAccepted: true,
    controlledPersistedWorkerDispatchRuntimeExecutionApprovalRequired: false,
    controlledPersistedWorkerDispatchRuntimeExecutionApprovalRecorded: true,
    controlledPersistedWorkerDispatchRuntimeExecutionApprovalAcceptedForPreflight: true,
    controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired: true,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeExecutionApproval =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL
