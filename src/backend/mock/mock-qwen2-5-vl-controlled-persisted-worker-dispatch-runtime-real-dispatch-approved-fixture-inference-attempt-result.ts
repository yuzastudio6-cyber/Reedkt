import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-attempt-approval'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_attempt_blocked_persisted_job_lease_bridge_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DC-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-PLAN: plan the missing persisted job and lease bridge before another Qwen inference attempt, no generated assets/no beta' as const

const attemptApproval =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_APPROVAL

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_attempt_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalDecision:
    attemptApproval.decision,
  attemptResult: {
    attemptApprovalRecorded: true,
    approvedFixtureInferenceAttemptInspected: true,
    approvedFixtureInferenceAttemptExecuted: false,
    approvedFixtureInferenceAttemptBlocked: true,
    blocker: 'persisted_job_lease_bridge_required',
    persistedWorkerDispatchDefaultStatus: 'blocked_real_lease_backend_required',
    persistedWorkerDispatchAdapterPreviewStatus: 'blocked_qwen_dispatch_adapter_fail_closed',
    persistedWorkerDispatchTransportPreviewStatus: 'blocked_private_invoke_transport_preview_only',
    cpuCallerInferencePathReused: false,
    cpuCallerReuseBlockedReason:
      'cpu_caller_does_not_prove_persisted_worker_dispatch_job_lease_bridge',
    resultReviewRequired: false,
  },
  priorRuntimeEvidence: {
    structuredFixtureOutputPreviouslyPassed: true,
    structuredFixtureOutputRunId: 'qwen25-structured-fixture-output-retry-20260627t204453z',
    structuredFixtureOutputSchemaValid: true,
    structuredFixtureOutputParsedJson: true,
    structuredFixtureOutputObjectCount: 3,
    structuredFixtureOutputTextLikeRegionCount: 1,
    transportAttemptPreviouslyPassedFailClosed: true,
    transportAttemptRunId: 'qwen25-persisted-real-dispatch-transport-attempt-20260630T073537Z',
    transportAttemptCloudRunJobExecutionCreated: true,
    transportAttemptInferenceRun: false,
  },
  requiredBridgeBeforeNextInferenceAttempt: {
    persistedJobCreationRequired: true,
    realLeaseClaimRequired: true,
    persistedIdempotencyRequired: true,
    jobEventRequired: true,
    backendRuntimeMessageRequired: true,
    workerClaimRequired: true,
    approvedSnapshotReferenceRequired: true,
    creditReservationReferenceRequired: true,
    privateSourceOfTruthRefsRequired: true,
    privateInvokeTransportHandoffRequired: true,
    serviceUrlResolutionBackendOnly: true,
    audienceResolutionBackendOnly: true,
    identityTokenFetchRuntimeOnly: true,
    authHeaderCreationRuntimeOnly: true,
    rawResponseBodyStorageAllowed: false,
    generatedAssetCreationAllowed: false,
  },
  sourceOfTruthRules: attemptApproval.sourceOfTruthRules,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptInspected:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptExecuted:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptBlocked:
      true,
    persistedJobLeaseBridgeRequired: true,
    persistedWorkerDispatchDefaultLeaseBoundaryBlocked: true,
    persistedWorkerDispatchAdapterPreviewBlocked: true,
    persistedWorkerDispatchTransportPreviewBlocked: true,
    cpuCallerInferencePathReused: false,
    readyForRealWorkerDispatch: false,
    approvedFixtureInferenceAcceptedForPersistedDispatch: false,
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
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    authHeaderCreated: false,
    privateRequestSendAllowedNow: false,
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
    mediaProcessingRun: false,
    renderExportRun: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_ATTEMPT_RESULT
