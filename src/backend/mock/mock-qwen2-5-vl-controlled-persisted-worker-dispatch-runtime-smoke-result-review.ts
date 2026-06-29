import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_result_review_accepted_runtime_approval_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BS-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-APPROVAL-PLAN: plan controlled persisted Qwen worker dispatch runtime approval, no Cloud Run invocation/no inference/no assets/no beta' as const

const executionResult = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT

function checkAccepted(id: string, expectedStatus: string) {
  return executionResult.executedRuntimeChecks.some((check) =>
    check.id === id && check.actualStatus === expectedStatus && check.passed,
  )
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_result_review',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeSmokeExecutionDecision:
    executionResult.decision,
  reviewedEvidence: {
    runtimeSmokeExecutionResultDoc:
      'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.md',
    runtimeSmokeExecutionResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.ts',
    runtimeSmokeExecutionResultSmoke:
      'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result-smoke.ts',
    runtimeImplementation:
      'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
    runtimeSmokePlan:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan.ts',
    localQueueContract:
      'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  },
  acceptedEvidence: {
    runtimeSmokeExecutionResultAccepted:
      executionResult.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokePassed,
    defaultRuntimeLeaseBoundaryAccepted:
      checkAccepted('defaultRuntimePath', 'blocked_real_lease_backend_required'),
    adapterPreviewBoundaryAccepted:
      checkAccepted('adapterPreviewPath', 'blocked_qwen_dispatch_adapter_fail_closed'),
    transportPreviewBoundaryAccepted:
      checkAccepted('transportPreviewPath', 'blocked_private_invoke_transport_preview_only'),
    idempotencyConflictAccepted:
      checkAccepted('idempotencyConflictPath', 'blocked_idempotency_conflict'),
    missingApprovedSnapshotAccepted:
      checkAccepted('missingApprovedSnapshotPath', 'blocked_missing_approved_snapshot'),
    missingCreditReservationAccepted:
      checkAccepted('missingCreditReservationPath', 'blocked_missing_credit_reservation'),
    missingSourceOfTruthRefsAccepted:
      checkAccepted('missingSourceOfTruthRefsPath', 'blocked_missing_source_of_truth_refs'),
    invalidWorkerJobSchemaAccepted:
      checkAccepted('invalidWorkerJobSchemaPath', 'blocked_invalid_worker_job_schema'),
    allRequiredRuntimeStatusesAccepted:
      executionResult.runtimeFlags.allRequiredRuntimeStatusesObserved,
    transportPreviewRuntimeBoundaryCoverageAccepted:
      executionResult.runtimeFlags.transportPreviewReachedAllRuntimeBoundaries,
    selectedGpuL4Accepted: executionResult.runtimeFlags.selectedGpuL4,
    scaleToZeroCostPostureAccepted: executionResult.runtimeFlags.scaleToZeroRequired,
    signedUrlsRemainNonSourceOfTruth:
      executionResult.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth === false,
    publicUrlsRemainNonSourceOfTruth:
      executionResult.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth === false,
  },
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired: true,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    cloudRunInvocationAccepted: false,
    inferenceAccepted: false,
    generatedAssetCreationAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'runtime_approval_plan_not_recorded',
      'real_worker_dispatch_still_blocked',
      'service_role_lease_and_claim_mutation_not_approved',
      'private_invoke_transport_dependencies_not_called',
      'qa_audit_cost_credit_evidence_still_required',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRecorded: true,
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted: true,
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired: false,
    controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired: true,
    controlledPersistedWorkerDispatchRuntimeSmokeExecuted: true,
    controlledPersistedWorkerDispatchRuntimeSmokePassed: true,
    defaultRuntimeLeaseBoundaryAccepted: true,
    adapterPreviewBoundaryAccepted: true,
    transportPreviewBoundaryAccepted: true,
    idempotencyConflictAccepted: true,
    missingApprovedSnapshotAccepted: true,
    missingCreditReservationAccepted: true,
    missingSourceOfTruthRefsAccepted: true,
    invalidWorkerJobSchemaAccepted: true,
    allRequiredRuntimeStatusesAccepted: true,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeSmokeResultReview =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW
