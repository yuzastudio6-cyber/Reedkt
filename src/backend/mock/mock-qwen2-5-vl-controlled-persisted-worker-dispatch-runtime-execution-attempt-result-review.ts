import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_attempt_result_review_accepted_real_dispatch_approval_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BZ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-PLAN: plan real persisted Qwen worker dispatch runtime approval, no generated assets/no beta' as const

const attemptResult =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT

function checkAccepted(id: string, expectedStatus: string) {
  return attemptResult.executedAttemptChecks.some((check) =>
    check.id === id && check.actualStatus === expectedStatus && check.passed,
  )
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_attempt_result_review',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultDecision:
    attemptResult.decision,
  reviewedEvidence: {
    executionAttemptResultDoc:
      'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md',
    executionAttemptResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.ts',
    executionAttemptResultSmoke:
      'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-smoke.ts',
    runtimeImplementation:
      'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
    approvedQueueFixture:
      'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  },
  acceptedEvidence: {
    executionAttemptResultAccepted:
      attemptResult.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed,
    approvedFixtureOnlyAccepted:
      attemptResult.executionAttemptSummary.approvedFixtureOnly,
    defaultRuntimeLeaseBoundaryAccepted:
      checkAccepted('approvedFixtureDefaultAttempt', 'blocked_real_lease_backend_required'),
    adapterPreviewBoundaryAccepted:
      checkAccepted('approvedFixtureAdapterPreviewAttempt', 'blocked_qwen_dispatch_adapter_fail_closed'),
    transportPreviewBoundaryAccepted:
      checkAccepted(
        'approvedFixtureTransportPreviewAttempt',
        'blocked_private_invoke_transport_preview_only',
      ),
    transportPreviewRuntimeBoundaryCoverageAccepted:
      attemptResult.runtimeFlags.transportPreviewReachedAllRuntimeBoundaries,
    selectedGpuL4Accepted: attemptResult.runtimeFlags.selectedGpuL4,
    scaleToZeroCostPostureAccepted: attemptResult.runtimeFlags.scaleToZeroRequired,
    signedUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth === false,
    publicUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth === false,
    generatedAssetNonCreationAccepted:
      attemptResult.runtimeFlags.generatedAssetsCreated === false,
    realDispatchNonExecutionAccepted:
      attemptResult.runtimeFlags.workersDispatched === false &&
      attemptResult.runtimeFlags.readyForRealWorkerDispatch === false,
    cloudRunNonInvocationAccepted:
      attemptResult.runtimeFlags.cloudRunInvocationAttempted === false &&
      attemptResult.runtimeFlags.serviceRuntimeRequestSent === false,
    inferenceNonExecutionAccepted: attemptResult.runtimeFlags.inferenceRun === false,
  },
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired: true,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    cloudRunInvocationAccepted: false,
    inferenceAccepted: false,
    generatedAssetCreationAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'real_dispatch_approval_plan_not_recorded',
      'real_worker_dispatch_still_blocked',
      'service_role_lease_and_claim_mutation_not_approved_for_execution',
      'private_invoke_transport_dependencies_not_approved_for_execution',
      'qa_audit_cost_credit_evidence_still_required_for_runtime_result_handling',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired: false,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRecorded: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed: true,
    approvedFixtureOnlyAccepted: true,
    defaultRuntimeLeaseBoundaryAccepted: true,
    adapterPreviewBoundaryAccepted: true,
    transportPreviewBoundaryAccepted: true,
    transportPreviewRuntimeBoundaryCoverageAccepted: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReview =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW
