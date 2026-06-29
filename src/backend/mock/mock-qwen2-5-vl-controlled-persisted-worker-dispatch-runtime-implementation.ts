import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT,
  runQwen25VlControlledPersistedWorkerDispatchRuntime,
} from '../workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'

type JsonRecord = Record<string, unknown>

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implemented_fail_closed_private_invoke_execution_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BP-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-PLAN: plan controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta' as const

const queueFixture = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
const defaultRuntimeResult = runQwen25VlControlledPersistedWorkerDispatchRuntime({ queueFixture })
const adapterPreviewResult = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  queueFixture,
  continueAfterLeaseBoundaryForPreview: true,
})
const transportPreviewResult = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  queueFixture,
  continueAfterLeaseBoundaryForPreview: true,
  continueAfterAdapterBoundaryForPreview: true,
})
const idempotencyConflictResult = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  queueFixture,
  forceIdempotencyConflict: true,
})

function withoutApprovedSnapshot(): JsonRecord {
  const payload = queueFixture.payloadJson as JsonRecord
  const copy: JsonRecord = {
    ...queueFixture,
    approvedPlanSnapshotId: undefined,
    payloadJson: {
      ...payload,
      approvedPlanSnapshotId: undefined,
    },
  }
  return copy
}

const missingApprovedSnapshotResult = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  queueFixture: withoutApprovedSnapshot(),
})

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implementation',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimePlanDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN.decision,
  runtimeSurface: {
    path: 'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
    exports: [
      'runQwen25VlControlledPersistedWorkerDispatchRuntime',
      'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT',
    ],
    status: 'implemented_fail_closed',
    contractDecision:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT.decision,
  },
  selectedRuntime: defaultRuntimeResult.selectedRuntime,
  implementationChecks: [
    {
      id: 'default_runtime_path',
      status: defaultRuntimeResult.status,
      expectedStatus: 'blocked_real_lease_backend_required',
      message: defaultRuntimeResult.message,
    },
    {
      id: 'adapter_preview_path',
      status: adapterPreviewResult.status,
      expectedStatus: 'blocked_qwen_dispatch_adapter_fail_closed',
      message: adapterPreviewResult.message,
    },
    {
      id: 'transport_preview_path',
      status: transportPreviewResult.status,
      expectedStatus: 'blocked_private_invoke_transport_preview_only',
      message: transportPreviewResult.message,
    },
    {
      id: 'idempotency_conflict_path',
      status: idempotencyConflictResult.status,
      expectedStatus: 'blocked_idempotency_conflict',
      message: idempotencyConflictResult.message,
    },
    {
      id: 'missing_approved_snapshot_path',
      status: missingApprovedSnapshotResult.status,
      expectedStatus: 'blocked_missing_approved_snapshot',
      message: missingApprovedSnapshotResult.message,
    },
  ],
  runtimeStepIds: defaultRuntimeResult.runtimeSteps.map((runtimeStep) => runtimeStep.id),
  acceptedImplementationEvidence: {
    runtimeImplementedFailClosed:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT.implementsRuntimeBoundary,
    defaultRuntimeStopsAtLeaseBoundary:
      defaultRuntimeResult.status === 'blocked_real_lease_backend_required',
    adapterPreviewStopsAtFailClosedAdapter:
      adapterPreviewResult.status === 'blocked_qwen_dispatch_adapter_fail_closed',
    transportPreviewStopsBeforeDependencies:
      transportPreviewResult.status === 'blocked_private_invoke_transport_preview_only',
    idempotencyConflictBlocked:
      idempotencyConflictResult.status === 'blocked_idempotency_conflict',
    missingApprovedSnapshotBlocked:
      missingApprovedSnapshotResult.status === 'blocked_missing_approved_snapshot',
    selectedGpu: defaultRuntimeResult.selectedRuntime.gpu,
    scaleToZeroRequired: defaultRuntimeResult.selectedRuntime.costPosture === 'scale_to_zero_required',
  },
  sourceOfTruthExpectation: defaultRuntimeResult.sourceOfTruthExpectation,
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimeSmokePlanRequired: true,
    controlledPersistedWorkerDispatchRuntimeSmokeRequired: true,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    cloudRunInvocationAccepted: false,
    inferenceAccepted: false,
    generatedAssetCreationAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'runtime_smoke_plan_not_recorded',
      'real_worker_dispatch_still_blocked',
      'lease_and_claim_mutation_still_backend_only',
      'private_invoke_transport_dependencies_not_called',
      'qa_audit_cost_credit_evidence_still_required',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimePlanRequired: false,
    controlledPersistedWorkerDispatchRuntimePlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeImplementationRequired: false,
    controlledPersistedWorkerDispatchRuntimeImplemented: true,
    controlledPersistedWorkerDispatchRuntimeSmokePlanRequired: true,
    controlledPersistedWorkerDispatchRuntimeSmokeRequired: true,
    defaultRuntimeLeaseBoundaryBlocked: true,
    adapterPreviewBoundaryBlocked: true,
    transportPreviewBoundaryBlocked: true,
    idempotencyConflictBlocked: true,
    missingApprovedSnapshotBlocked: true,
    selectedGpuL4: true,
    scaleToZeroRequired: true,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeImplementation =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION
