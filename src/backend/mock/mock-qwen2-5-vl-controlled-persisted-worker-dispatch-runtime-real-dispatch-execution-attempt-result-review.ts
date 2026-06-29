import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_result_review_accepted_transport_dependency_enablement_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CG-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-PLAN: plan controlled Qwen real-dispatch lease adapter and private invoke transport dependencies, no generated assets/no beta' as const

const attemptResult =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT

function checkAccepted(id: string, expectedStatus: string) {
  return attemptResult.executedAttemptChecks.some((check) =>
    check.id === id && check.actualStatus === expectedStatus && check.passed,
  )
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_result_review',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultDecision:
    attemptResult.decision,
  reviewedEvidence: {
    realDispatchExecutionAttemptResultDoc:
      'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.md',
    realDispatchExecutionAttemptResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.ts',
    realDispatchExecutionAttemptResultSmoke:
      'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-smoke.ts',
    runtimeImplementation:
      'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
    failClosedDispatchAdapter:
      'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
    privateInvokeTransportAdapter:
      'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
    approvedQueueFixture:
      'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  },
  acceptedEvidence: {
    realDispatchExecutionAttemptResultAccepted:
      attemptResult.realDispatchExecutionAttemptSummary
        .controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed,
    approvedFixtureOnlyAccepted:
      attemptResult.realDispatchExecutionAttemptSummary.approvedFixtureOnly,
    realDispatchDefaultLeaseBoundaryAccepted:
      checkAccepted('realDispatchDefaultAttempt', 'blocked_real_lease_backend_required'),
    realDispatchAdapterPreviewBoundaryAccepted:
      checkAccepted('realDispatchAdapterPreviewAttempt', 'blocked_qwen_dispatch_adapter_fail_closed'),
    realDispatchTransportPreviewBoundaryAccepted:
      checkAccepted(
        'realDispatchTransportPreviewAttempt',
        'blocked_private_invoke_transport_preview_only',
      ),
    transportPreviewRuntimeBoundaryCoverageAccepted:
      attemptResult.runtimeFlags.transportPreviewReachedAllRuntimeBoundaries,
    selectedGpuL4Accepted: attemptResult.runtimeFlags.selectedGpuL4,
    scaleToZeroCostPostureAccepted: attemptResult.runtimeFlags.scaleToZeroRequired,
    minInstancesZeroAccepted: attemptResult.selectedRuntime.minInstances === 0,
    initialMaxInstancesOneAccepted:
      attemptResult.selectedRuntime.maxInstancesForInitialRuntime === 1,
    cpuFallbackDisabledAccepted: attemptResult.selectedRuntime.cpuFallbackAllowed === false,
    signedUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth === false,
    publicUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth === false,
    generatedAssetNonCreationAccepted:
      attemptResult.runtimeFlags.generatedAssetsCreated === false,
    realJobNonCreationAccepted: attemptResult.runtimeFlags.realJobCreated === false,
    realLeaseNonClaimAccepted: attemptResult.runtimeFlags.realLeaseClaimed === false,
    cloudRunNonInvocationAccepted:
      attemptResult.runtimeFlags.cloudRunInvocationAttempted === false &&
      attemptResult.runtimeFlags.serviceRuntimeRequestSent === false,
    inferenceNonExecutionAccepted: attemptResult.runtimeFlags.inferenceRun === false,
    supabaseNonMutationAccepted:
      attemptResult.runtimeFlags.supabaseTouched === false &&
      attemptResult.runtimeFlags.sqlExecuted === false,
  },
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired:
      true,
    readyForRealWorkerDispatch: false,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    cloudRunInvocationAccepted: false,
    inferenceAccepted: false,
    generatedAssetCreationAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'real_dispatch_transport_dependency_enablement_plan_not_recorded',
      'service_role_lease_and_claim_mutation_still_requires_backend_enablement_plan',
      'qwen_dispatch_adapter_still_fail_closed',
      'private_invoke_transport_dependencies_still_preview_only',
      'qa_audit_cost_credit_result_handling_still_required',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRecorded: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed: true,
    approvedFixtureOnlyAccepted: true,
    realDispatchDefaultLeaseBoundaryAccepted: true,
    realDispatchAdapterPreviewBoundaryAccepted: true,
    realDispatchTransportPreviewBoundaryAccepted: true,
    transportPreviewRuntimeBoundaryCoverageAccepted: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    minInstancesZeroAccepted: true,
    initialMaxInstancesOneAccepted: true,
    cpuFallbackDisabledAccepted: true,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReview =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW
