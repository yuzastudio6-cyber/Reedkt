import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_approval_accepted_preflight_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CM-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PREFLIGHT: verify controlled Qwen real-dispatch transport dependency enablement execution preflight, no Cloud Run invocation/no inference/no generated assets/no beta' as const

const executionPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_APPROVAL = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_approval',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanDecision:
    executionPlan.decision,
  executionApproval: {
    decisionRecorded: true,
    acceptsExecutionPlanForFutureControlledTransportDependencyEnablementPreflight: true,
    controlledTransportDependencyEnablementExecutionPreflightRequired: true,
    approvesExecutionNow: false,
    approvesDependencyEnablementNow: false,
    approvesRealBackendLeaseClaimNow: false,
    approvesInjectedPrivateInvokeDependenciesNow: false,
    approvesServiceUrlResolutionNow: false,
    approvesAudienceResolutionNow: false,
    approvesIdentityTokenFetchNow: false,
    approvesPrivateRequestSendNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedTransportDependencyEnablementPlanEvidence:
    executionPlan.controlledDependencyEnablementSequence.map((entry) => ({
      id: entry.id,
      owner: entry.owner,
      acceptedForPreflight: true,
      dependencyEnablementAllowedNow: false,
      executionAllowedNow: false,
      requiredInputs: entry.requiredInputs,
    })),
  approvedRuntimePosture: executionPlan.selectedRuntime,
  controlledTransportDependencyEnablementExecutionPreflightRequirements:
    executionPlan.executionApprovalPreconditions,
  localContractPreview: executionPlan.localContractPreview,
  transportDependencyShape: executionPlan.transportDependencyShape,
  sourceOfTruthRules: executionPlan.sourceOfTruthRules,
  runtimeFlags: {
    ...executionPlan.runtimeFlags,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalAcceptedForPreflight:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired:
      true,
    readyForRealWorkerDispatch: false,
    transportDependenciesEnabledNow: false,
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
  warnings: [
    'This approval accepts the transport dependency enablement execution plan for a future preflight only.',
    'It does not enable private invoke dependencies, resolve service URLs, resolve audiences, fetch identity tokens, send requests, invoke Cloud Run, or run Qwen inference.',
    'Generated assets, signed URLs, public artifacts, beta, and production remain blocked.',
  ],
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApproval =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_APPROVAL
