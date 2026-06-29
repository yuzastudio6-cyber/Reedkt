import {
  runQwen25VlControlledPersistedWorkerDispatchRuntime,
  type Qwen25VlControlledPersistedWorkerDispatchRuntimeResult,
} from '../workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'

type JsonRecord = Record<string, unknown>

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_executed_mock_only_result_review_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch runtime smoke result, no Cloud Run invocation/no inference/no assets/no beta' as const

const queueFixture = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture

function cloneFixture(): JsonRecord {
  return JSON.parse(JSON.stringify(queueFixture)) as JsonRecord
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function withoutApprovedSnapshot(): JsonRecord {
  const copy = cloneFixture()
  const payload = asRecord(copy.payloadJson)
  delete copy.approvedPlanSnapshotId
  delete payload.approvedPlanSnapshotId
  return copy
}

function withoutCreditReservation(): JsonRecord {
  const copy = cloneFixture()
  const payload = asRecord(copy.payloadJson)
  delete copy.creditReservationId
  delete payload.creditReservationId
  return copy
}

function withoutPrivateSourceRefs(): JsonRecord {
  const copy = cloneFixture()
  const payload = asRecord(copy.payloadJson)
  payload.sourceOfTruthRefs = {
    supabaseRowRefs: [],
    privateManifestRefs: [],
    checksumRefs: [],
    approvedPlanSnapshotRefs: [],
    signedUrlsAreSourceOfTruth: false,
    publicUrlsAreSourceOfTruth: false,
  }
  return copy
}

function invalidWorkerJobSchema(): JsonRecord {
  return {
    id: 'mock_invalid_qwen_runtime_job_shape',
    payloadJson: {
      reason: 'missing_run_worker_job_schema_fields',
    },
  }
}

const smokeResults = {
  defaultRuntimePath: runQwen25VlControlledPersistedWorkerDispatchRuntime({ queueFixture }),
  adapterPreviewPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
    continueAfterLeaseBoundaryForPreview: true,
  }),
  transportPreviewPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
    continueAfterLeaseBoundaryForPreview: true,
    continueAfterAdapterBoundaryForPreview: true,
  }),
  idempotencyConflictPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
    forceIdempotencyConflict: true,
  }),
  missingApprovedSnapshotPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture: withoutApprovedSnapshot(),
  }),
  missingCreditReservationPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture: withoutCreditReservation(),
  }),
  missingSourceOfTruthRefsPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture: withoutPrivateSourceRefs(),
  }),
  invalidWorkerJobSchemaPath: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture: invalidWorkerJobSchema(),
  }),
} as const

const expectedStatuses = {
  defaultRuntimePath: 'blocked_real_lease_backend_required',
  adapterPreviewPath: 'blocked_qwen_dispatch_adapter_fail_closed',
  transportPreviewPath: 'blocked_private_invoke_transport_preview_only',
  idempotencyConflictPath: 'blocked_idempotency_conflict',
  missingApprovedSnapshotPath: 'blocked_missing_approved_snapshot',
  missingCreditReservationPath: 'blocked_missing_credit_reservation',
  missingSourceOfTruthRefsPath: 'blocked_missing_source_of_truth_refs',
  invalidWorkerJobSchemaPath: 'blocked_invalid_worker_job_schema',
} as const

function allUnsafeFlagsFalse(result: Qwen25VlControlledPersistedWorkerDispatchRuntimeResult) {
  return [
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
    'jobEventCreated',
    'backendRuntimeMessageCreated',
    'workerClaimCreated',
    'storageObjectRecordCreated',
    'signedUrlEventCreated',
    'qaReportCreated',
    'auditEventCreated',
    'creditMutationCreated',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ].every((key) => result.runtimeFlags[key as keyof typeof result.runtimeFlags] === false)
}

const executedRuntimeChecks = Object.entries(smokeResults).map(([id, result]) => {
  const expectedStatus = expectedStatuses[id as keyof typeof expectedStatuses]
  return {
    id,
    expectedStatus,
    actualStatus: result.status,
    passed: result.status === expectedStatus && allUnsafeFlagsFalse(result),
    message: result.message,
    reachedStepIds: result.runtimeSteps
      .filter((runtimeStep) => runtimeStep.status !== 'not_reached')
      .map((runtimeStep) => runtimeStep.id),
  }
})

const transportPreviewStepStatuses = smokeResults.transportPreviewPath.runtimeSteps.map((runtimeStep) => ({
  id: runtimeStep.id,
  status: runtimeStep.status,
}))

const runtimeSmokePassed =
  executedRuntimeChecks.every((check) => check.passed) &&
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN.requiredRuntimeStatuses.every((status) =>
    Object.values(smokeResults).some((result) => result.status === status),
  )

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_execution_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeSmokePlanDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN.decision,
  selectedRuntime: smokeResults.defaultRuntimePath.selectedRuntime,
  executionSummary: {
    controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired: false,
    controlledPersistedWorkerDispatchRuntimeSmokeExecuted: true,
    controlledPersistedWorkerDispatchRuntimeSmokePassed: runtimeSmokePassed,
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired: true,
    mockOnly: true,
    recordsStoredInMemoryOnly: true,
    generatedLocalFixturePassedClaimed: false,
  },
  executedRuntimeChecks,
  runtimeStatusesObserved: Object.values(smokeResults).map((result) => result.status),
  transportPreviewStepStatuses,
  sourceOfTruthExpectation: smokeResults.transportPreviewPath.sourceOfTruthExpectation,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeImplementationRequired: false,
    controlledPersistedWorkerDispatchRuntimeImplemented: true,
    controlledPersistedWorkerDispatchRuntimeSmokePlanRequired: false,
    controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired: false,
    controlledPersistedWorkerDispatchRuntimeSmokeExecuted: true,
    controlledPersistedWorkerDispatchRuntimeSmokePassed: runtimeSmokePassed,
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired: true,
    defaultRuntimeLeaseBoundaryBlocked:
      smokeResults.defaultRuntimePath.status === 'blocked_real_lease_backend_required',
    adapterPreviewBoundaryBlocked:
      smokeResults.adapterPreviewPath.status === 'blocked_qwen_dispatch_adapter_fail_closed',
    transportPreviewBoundaryBlocked:
      smokeResults.transportPreviewPath.status === 'blocked_private_invoke_transport_preview_only',
    idempotencyConflictBlocked:
      smokeResults.idempotencyConflictPath.status === 'blocked_idempotency_conflict',
    missingApprovedSnapshotBlocked:
      smokeResults.missingApprovedSnapshotPath.status === 'blocked_missing_approved_snapshot',
    missingCreditReservationBlocked:
      smokeResults.missingCreditReservationPath.status === 'blocked_missing_credit_reservation',
    missingSourceOfTruthRefsBlocked:
      smokeResults.missingSourceOfTruthRefsPath.status === 'blocked_missing_source_of_truth_refs',
    invalidWorkerJobSchemaBlocked:
      smokeResults.invalidWorkerJobSchemaPath.status === 'blocked_invalid_worker_job_schema',
    allRequiredRuntimeStatusesObserved:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN.requiredRuntimeStatuses.every((status) =>
        Object.values(smokeResults).some((result) => result.status === status),
      ),
    transportPreviewReachedAllRuntimeBoundaries:
      transportPreviewStepStatuses.every((runtimeStep) => runtimeStep.status !== 'not_reached'),
    selectedGpuL4: smokeResults.defaultRuntimePath.selectedRuntime.gpu === 'nvidia_l4',
    scaleToZeroRequired:
      smokeResults.defaultRuntimePath.selectedRuntime.costPosture === 'scale_to_zero_required',
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeSmokeExecutionResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT
