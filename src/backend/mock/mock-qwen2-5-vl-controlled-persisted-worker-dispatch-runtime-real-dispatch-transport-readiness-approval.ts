import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-readiness-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_approval_accepted_preflight_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT-PLAN: plan controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta' as const

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_approval',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanDecision:
    plan.decision,
  readinessApproval: {
    decisionRecorded: true,
    acceptsTransportReadinessPlanForFuturePreflightPlanning: true,
    controlledTransportPreflightPlanRequired: true,
    approvesServiceUrlResolutionNow: false,
    approvesAudienceResolutionNow: false,
    approvesIdentityTokenFetchNow: false,
    approvesAuthHeaderCreationNow: false,
    approvesPrivateRequestSendNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesResponsePersistenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedReadinessEvidence: plan.readinessPlan.map((entry) => ({
    id: entry.id,
    owner: entry.owner,
    acceptedForPreflightPlanning: true,
    executionAllowedNow: false,
    requiredEvidence: entry.requiredEvidence,
  })),
  approvedRuntimePosture: plan.selectedRuntime,
  futureTransportDependencyShape: plan.futureTransportDependencyShape,
  sourceOfTruthRules: plan.sourceOfTruthRules,
  futurePreflightPlanningScope: {
    mayPlanServiceUrlResolutionPreflight: true,
    mayPlanAudienceResolutionPreflight: true,
    mayPlanIdentityTokenPreflight: true,
    mayPlanPrivateRequestPreflight: true,
    mayPlanResponseClassificationPreflight: true,
    mayPlanQaAuditCostCreditPreflight: true,
    mayPlanRetryCleanupRollbackPreflight: true,
    mayExecutePreflightNow: false,
    mayExecuteTransportNow: false,
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalAcceptedForPreflightPlanning:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRequired:
      true,
    approvedSnapshotTransportScopeAcceptedForPreflightPlanning: true,
    serviceUrlAudienceResolutionAcceptedForPreflightPlanning: true,
    identityTokenAuthHeaderAcceptedForPreflightPlanning: true,
    privateRequestSendAcceptedForPreflightPlanning: true,
    responseClassificationPersistenceAcceptedForPreflightPlanning: true,
    qaAuditCostCreditReadinessAcceptedForPreflightPlanning: true,
    billingCreditNoSpendBoundaryAcceptedForPreflightPlanning: true,
    retryTimeoutCleanupRollbackAcceptedForPreflightPlanning: true,
    betaProductionPublicArtifactLockAcceptedForPreflightPlanning: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    minInstancesZeroAccepted: true,
    initialMaxInstancesOneAccepted: true,
    cpuFallbackDisabledAccepted: true,
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
    privateRequestSendAllowedNow: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApproval =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_READINESS_APPROVAL
