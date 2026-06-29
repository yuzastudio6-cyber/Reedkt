import {
  runQwen25VlControlledPersistedWorkerDispatchRuntime,
  type Qwen25VlControlledPersistedWorkerDispatchRuntimeResult,
} from '../workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_attempt_recorded_result_review_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BY-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-ATTEMPT-RESULT-REVIEW: review controlled persisted Qwen worker dispatch runtime execution attempt result, no generated assets/no beta' as const

const queueFixture =
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture

const attemptResults = {
  approvedFixtureDefaultAttempt: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
  }),
  approvedFixtureAdapterPreviewAttempt: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
    continueAfterLeaseBoundaryForPreview: true,
  }),
  approvedFixtureTransportPreviewAttempt: runQwen25VlControlledPersistedWorkerDispatchRuntime({
    queueFixture,
    continueAfterLeaseBoundaryForPreview: true,
    continueAfterAdapterBoundaryForPreview: true,
  }),
} as const

const expectedStatuses = {
  approvedFixtureDefaultAttempt: 'blocked_real_lease_backend_required',
  approvedFixtureAdapterPreviewAttempt: 'blocked_qwen_dispatch_adapter_fail_closed',
  approvedFixtureTransportPreviewAttempt: 'blocked_private_invoke_transport_preview_only',
} as const

const unsafeRuntimeFlagKeys: Array<
  keyof Qwen25VlControlledPersistedWorkerDispatchRuntimeResult['runtimeFlags']
> = [
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
]

function allUnsafeFlagsFalse(result: Qwen25VlControlledPersistedWorkerDispatchRuntimeResult) {
  return unsafeRuntimeFlagKeys.every((key) => result.runtimeFlags[key] === false)
}

const executedAttemptChecks = Object.entries(attemptResults).map(([id, result]) => {
  const expectedStatus = expectedStatuses[id as keyof typeof expectedStatuses]
  return {
    id,
    approvedFixtureOnly: true,
    expectedStatus,
    actualStatus: result.status,
    passed: result.status === expectedStatus && allUnsafeFlagsFalse(result),
    message: result.message,
    reachedStepIds: result.runtimeSteps
      .filter((runtimeStep) => runtimeStep.status !== 'not_reached')
      .map((runtimeStep) => runtimeStep.id),
  }
})

const attemptPassed = executedAttemptChecks.every((check) => check.passed)
const transportPreview = attemptResults.approvedFixtureTransportPreviewAttempt

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_attempt_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeExecutionPreflightDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT.decision,
  selectedRuntime: transportPreview.selectedRuntime,
  executionAttemptSummary: {
    controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired: false,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed: attemptPassed,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired: true,
    approvedFixtureOnly: true,
    recordsStoredInMemoryOnly: true,
    generatedLocalFixturePassedClaimed: false,
  },
  executedAttemptChecks,
  runtimeStatusesObserved: Object.values(attemptResults).map((result) => result.status),
  transportPreviewStepStatuses: transportPreview.runtimeSteps.map((runtimeStep) => ({
    id: runtimeStep.id,
    status: runtimeStep.status,
  })),
  sourceOfTruthExpectation: transportPreview.sourceOfTruthExpectation,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired: false,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded: true,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed: attemptPassed,
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired: true,
    approvedFixtureDefaultAttemptBlocked:
      attemptResults.approvedFixtureDefaultAttempt.status === 'blocked_real_lease_backend_required',
    approvedFixtureAdapterPreviewBlocked:
      attemptResults.approvedFixtureAdapterPreviewAttempt.status ===
      'blocked_qwen_dispatch_adapter_fail_closed',
    approvedFixtureTransportPreviewBlocked:
      attemptResults.approvedFixtureTransportPreviewAttempt.status ===
      'blocked_private_invoke_transport_preview_only',
    transportPreviewReachedAllRuntimeBoundaries:
      transportPreview.runtimeSteps.every((runtimeStep) => runtimeStep.status !== 'not_reached'),
    selectedGpuL4: transportPreview.selectedRuntime.gpu === 'nvidia_l4',
    scaleToZeroRequired: transportPreview.selectedRuntime.costPosture === 'scale_to_zero_required',
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeExecutionAttemptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT
