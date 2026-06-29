import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_result_review_accepted_runtime_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BN-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-PLAN: plan controlled persisted Qwen worker dispatch runtime, no Cloud Run invocation/no inference/no assets/no beta' as const

const executionResult = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT
const mockCounts = executionResult.mockRecordCounts

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_result_review',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchSmokeExecutionDecision: executionResult.decision,
  reviewedEvidence: {
    smokeExecutionResultDoc:
      'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-execution-result.md',
    smokeExecutionResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result.ts',
    smokeExecutionResultSmoke:
      'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result-smoke.ts',
    failClosedCoordinator:
      'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
    localQueueContract:
      'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
    mockDatabase: 'src/backend/mock/mock-database.ts',
    idempotencyService: 'src/backend/runtime/idempotency-service.ts',
    workerLeaseService: 'src/backend/runtime/worker-lease-service.ts',
    backendRuntimeTransportService: 'src/backend/runtime/backend-runtime-transport-service.ts',
  },
  acceptedEvidence: {
    smokeExecutionResultAccepted:
      executionResult.executionSummary.controlledPersistedWorkerDispatchSmokePassed,
    queueFixtureValidationAccepted:
      executionResult.executedChecks.some((check) =>
        check.id === 'queue_fixture_validation' && check.status === 'passed',
      ),
    coordinatorDefaultBoundaryAccepted:
      executionResult.executedChecks.some((check) =>
        check.id === 'coordinator_default_path' &&
        check.status === 'blocked_real_lease_backend_required',
      ),
    coordinatorAdapterPreviewBoundaryAccepted:
      executionResult.executedChecks.some((check) =>
        check.id === 'coordinator_adapter_preview_path' &&
        check.status === 'blocked_qwen_dispatch_adapter_fail_closed',
      ),
    coordinatorTransportPreviewBoundaryAccepted:
      executionResult.executedChecks.some((check) =>
        check.id === 'coordinator_transport_preview_path' &&
        check.status === 'blocked_private_invoke_transport_preview_only',
      ),
    mockJobRecordShapeAccepted: mockCounts.jobs === 1,
    mockIdempotencyRecordShapeAccepted: mockCounts.runtimeIdempotencyRecords === 1,
    mockWorkerLeaseShapeAccepted: mockCounts.workerLeases === 1,
    mockWorkerClaimAttemptShapeAccepted: mockCounts.workerLeaseClaimAttempts === 1,
    mockJobEventShapeAccepted: mockCounts.jobEvents === 1,
    mockBackendRuntimeMessageShapeAccepted: mockCounts.backendRuntimeMessages === 1,
    generatedAssetsAbsent: mockCounts.generatedAssets === 0,
    creditReservationsAbsent: mockCounts.creditReservations === 0,
    qaReportsAbsent: mockCounts.qaReports === 0,
    signedUrlsRemainNonSourceOfTruth:
      executionResult.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth === false,
    publicUrlsRemainNonSourceOfTruth:
      executionResult.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth === false,
    storageObjectsNotCreated:
      executionResult.sourceOfTruthExpectation.storageObjectsCreated === false,
    signedUrlsNotCreated:
      executionResult.sourceOfTruthExpectation.signedUrlsCreated === false,
    mockOnlyInMemoryBoundaryAccepted:
      executionResult.executionSummary.recordsStoredInMemoryOnly,
  },
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimePlanRequired: true,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    cloudRunInvocationAccepted: false,
    inferenceAccepted: false,
    generatedAssetCreationAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'runtime_plan_not_recorded',
      'real_worker_dispatch_still_blocked',
      'lease_and_claim_mutation_ownership_not_promoted',
      'private_invoke_runtime_preconditions_not_revalidated',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchSmokeResultReviewRecorded: true,
    controlledPersistedWorkerDispatchSmokeResultReviewAccepted: true,
    controlledPersistedWorkerDispatchSmokeResultReviewRequired: false,
    controlledPersistedWorkerDispatchRuntimePlanRequired: true,
    controlledPersistedWorkerDispatchSmokeExecuted: true,
    controlledPersistedWorkerDispatchSmokePassed: true,
    mockQueueFixtureValidated: true,
    mockCoordinatorDefaultPathAccepted: true,
    mockCoordinatorAdapterPreviewPathAccepted: true,
    mockCoordinatorTransportPreviewPathAccepted: true,
    mockJobRecordAccepted: true,
    mockIdempotencyRecordAccepted: true,
    mockWorkerLeaseAccepted: true,
    mockWorkerClaimAttemptAccepted: true,
    mockJobEventAccepted: true,
    mockBackendRuntimeMessageAccepted: true,
    mockRecordsStoredInMemoryOnly: true,
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
    supabaseCloudTouched: false,
    stagingTouched: false,
    productionTouched: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchSmokeResultReview =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW
