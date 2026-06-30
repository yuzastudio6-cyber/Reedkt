import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan'
import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT,
  runQwen25VlControlledPersistedJobLeaseBridge,
} from '../workers/qwen2-5-vl-controlled-persisted-job-lease-bridge'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_implemented_fail_closed_result_review_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DE-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-RESULT-REVIEW: review the fail-closed persisted job and lease bridge result, no inference/no generated assets/no beta' as const

const bridgePreview = runQwen25VlControlledPersistedJobLeaseBridge()
const conflictPreview = runQwen25VlControlledPersistedJobLeaseBridge({
  forceIdempotencyConflict: true,
})

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_implementation',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN.decision,
  bridgeContractDecision: QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT.decision,
  selectedRuntime: QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT.selectedRuntime,
  implementationSummary: {
    bridgePlanRecorded: true,
    bridgeImplementedFailClosed: true,
    bridgeResultReviewRequired: true,
    approvedQueueFixtureAccepted: bridgePreview.workerJobSchemaValidated && bridgePreview.localQueueValidated,
    defaultBridgeStatus: bridgePreview.status,
    idempotencyConflictStatus: conflictPreview.status,
    privateInvokeEnvelopeChecked: bridgePreview.runtimeFlags.privateInvokeEnvelopeChecked,
    privateInvokeTransportPreviewChecked: bridgePreview.runtimeFlags.privateInvokeTransportPreviewChecked,
    mockRecordsStoredInMemoryOnly: bridgePreview.runtimeFlags.mockRecordsStoredInMemoryOnly,
    generatedLocalFixturePassedClaimed: false,
  },
  bridgeRefs: bridgePreview.bridgeRefs,
  bridgeStepIds: bridgePreview.runtimeSteps.map((step) => step.id),
  requiredRuntimeStatuses: [
    'blocked_invalid_worker_job_schema',
    'blocked_missing_approved_snapshot',
    'blocked_missing_credit_reservation',
    'blocked_missing_source_of_truth_refs',
    'blocked_idempotency_conflict',
    'blocked_private_invoke_transport_preview_only',
  ],
  sourceOfTruthRules: {
    workersExecuteApprovedSnapshots: true,
    rawChatWorkerExecutionAllowed: false,
    rawWorkerPromptAllowed: false,
    privateStorageManifestChecksumApprovedSnapshotRefsRequired: true,
    signedUrlSourceOfTruthAllowed: false,
    publicUrlSourceOfTruthAllowed: false,
    frontendMayClaimLease: false,
    frontendMayResolvePrivateInvokeCredentials: false,
    frontendMayCallCloudRun: false,
    frontendMayCreateGeneratedAssets: false,
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplemented:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired:
      true,
    approvedJobIntakeChecked: bridgePreview.runtimeFlags.approvedJobIntakeChecked,
    persistedIdempotencyGuardChecked: bridgePreview.runtimeFlags.persistedIdempotencyGuardChecked,
    persistedJobReferenceCreated: bridgePreview.runtimeFlags.persistedJobReferenceCreated,
    persistedLeaseReferenceCreated: bridgePreview.runtimeFlags.persistedLeaseReferenceCreated,
    sanitizedJobEventReferenceCreated: bridgePreview.runtimeFlags.sanitizedJobEventReferenceCreated,
    backendRuntimeMessageReferenceCreated: bridgePreview.runtimeFlags.backendRuntimeMessageReferenceCreated,
    workerClaimReferenceCreated: bridgePreview.runtimeFlags.workerClaimReferenceCreated,
    privateSourceOfTruthRefsChecked: bridgePreview.runtimeFlags.privateSourceOfTruthRefsChecked,
    privateInvokeEnvelopeChecked: bridgePreview.runtimeFlags.privateInvokeEnvelopeChecked,
    privateInvokeTransportPreviewChecked: bridgePreview.runtimeFlags.privateInvokeTransportPreviewChecked,
    qaAuditCostCreditBoundaryChecked: bridgePreview.runtimeFlags.qaAuditCostCreditBoundaryChecked,
    idempotencyConflictBlocked: conflictPreview.status === 'blocked_idempotency_conflict',
    selectedGpuL4Accepted:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture.payloadJson.modelPolicy.gpu ===
      'nvidia-l4',
    scaleToZeroCostPostureAccepted: true,
    minInstancesZeroAccepted: true,
    initialMaxInstancesOneAccepted: true,
    cpuFallbackDisabledAccepted: true,
    mockRecordsStoredInMemoryOnly: bridgePreview.runtimeFlags.mockRecordsStoredInMemoryOnly,
    readyForRealWorkerDispatch: false,
    privateInvokeHandoffAllowedNow: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementation =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION
