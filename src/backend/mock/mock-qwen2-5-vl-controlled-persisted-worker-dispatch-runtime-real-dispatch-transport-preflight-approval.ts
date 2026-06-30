import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-preflight-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_approval_accepted_preflight_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CT-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-PREFLIGHT: verify controlled Qwen real-dispatch transport preflight, no Cloud Run invocation/no inference/no generated assets/no beta' as const

const preflightPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_APPROVAL = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_preflight_approval',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanDecision:
    preflightPlan.decision,
  transportPreflightApproval: {
    decisionRecorded: true,
    acceptsTransportPreflightPlanForFutureNoCallVerification: true,
    controlledTransportPreflightRequired: true,
    approvesServiceUrlResolutionNow: false,
    approvesAudienceResolutionNow: false,
    approvesIdentityTokenFetchNow: false,
    approvesAuthHeaderCreationNow: false,
    approvesPrivateRequestSendNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedPreflightEvidence: preflightPlan.preflightChecks.map((entry) => ({
    id: entry.id,
    owner: entry.owner,
    acceptedForFuturePreflight: true,
    executionAllowedNow: false,
    requiredEvidence: entry.requiredEvidence,
  })),
  approvedRuntimePosture: preflightPlan.selectedRuntime,
  sourceOfTruthRules: preflightPlan.sourceOfTruthRules,
  futurePreflightExecutionRules: {
    ...preflightPlan.futurePreflightExecutionRules,
    approvalRecordedBeforePreflight: true,
    futurePreflightMayVerifyStaticEnvelopeOnly: true,
    futurePreflightMayResolveRuntimeValuesNow: false,
    futurePreflightMaySendNetworkRequestNow: false,
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightPlanRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApprovalAcceptedForPreflight:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightRequired:
      true,
    approvedSnapshotTransportPreflightAccepted: true,
    serviceUrlResolutionPreflightAccepted: true,
    audienceResolutionPreflightAccepted: true,
    identityTokenDependencyPreflightAccepted: true,
    authHeaderRedactionPreflightAccepted: true,
    privateRequestEnvelopePreflightAccepted: true,
    timeoutRetryIdempotencyPreflightAccepted: true,
    responseClassificationPreflightAccepted: true,
    persistenceQaAuditCostCreditPreflightAccepted: true,
    cleanupRollbackBetaProductionLockPreflightAccepted: true,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportPreflightApproval =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_PREFLIGHT_APPROVAL
