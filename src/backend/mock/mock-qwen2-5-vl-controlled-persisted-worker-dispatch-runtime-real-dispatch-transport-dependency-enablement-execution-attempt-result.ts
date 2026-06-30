import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION } from '../workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement'
import {
  createQwen25VlPrivateInvokeRuntimeApproval,
  previewQwen25VlPrivateInvokeTransportAdapter,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'
import { classifyQwen25VlPrivateInvokeResponse } from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-preflight'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_attempt_recorded_result_review_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CO-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-ATTEMPT-RESULT-REVIEW: review controlled Qwen real-dispatch transport dependency enablement execution attempt result, no generated assets/no beta' as const

const queueFixture =
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture

const dependencyImplementation =
  QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION

const transportPreviewAttempt = previewQwen25VlPrivateInvokeTransportAdapter({
  queueFixture,
  runtimeApproval: createQwen25VlPrivateInvokeRuntimeApproval({
    invocationEnabledNow: true,
    authReverifyPassed: true,
    cloudRunServiceDescribeVerified: true,
    cloudRunIamPolicyVerified: true,
    runtimeServiceAccountVerified: true,
    projectInvokerPolicyVerified: true,
  }),
  dependencies: {
    resolveServiceUrl: async () => {
      throw new Error('58CN preview must not resolve a service URL.')
    },
    resolveAudience: async () => {
      throw new Error('58CN preview must not resolve an audience.')
    },
    fetchIdentityToken: async () => {
      throw new Error('58CN preview must not fetch an identity token.')
    },
    sendRequest: async () => {
      throw new Error('58CN preview must not send a private request.')
    },
  },
})

const responseClassificationPreview = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 200,
  bodyJson: {
    ok: false,
    reason: 'qwen_inference_disabled_after_contract_check',
    contractSatisfiedForFutureRuntime: true,
    generatedAssetCreated: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    creditSpendCreated: false,
  },
})

const attemptPassedFailClosed =
  transportPreviewAttempt.status === 'blocked_transport_preview_only' &&
  responseClassificationPreview.status === 'blocked_contract_valid_inference_disabled' &&
  responseClassificationPreview.runtimeCanAdvanceNow === false

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_ATTEMPT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_attempt_result',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT.decision,
  selectedRuntime:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT.approvedRuntimePosture,
  executionAttemptSummary: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightPassed:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptPassedFailClosed:
      attemptPassedFailClosed,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptResultReviewRequired:
      true,
    approvedFixtureOnly: true,
    dependencyEnablementPreviewOnly: true,
    recordsStoredInMemoryOnly: true,
    generatedLocalFixturePassedClaimed: false,
  },
  transportDependencyAttempt: {
    dependencyImplementationDecision: dependencyImplementation.decision,
    requiredInjectedDependencies:
      dependencyImplementation.transportDependencyShape.requiredInjectedDependencies,
    injectedDependenciesProvidedForShape: true,
    injectedDependencyCallsExecuted: false,
    status: transportPreviewAttempt.status,
    envelopeAcceptedForFutureTransport:
      transportPreviewAttempt.envelopeAcceptedForFutureTransport,
    missingApprovalGates: transportPreviewAttempt.missingApprovalGates,
    missingDependencies: transportPreviewAttempt.missingDependencies,
    message: transportPreviewAttempt.message,
  },
  responseClassificationAttempt: {
    status: responseClassificationPreview.status,
    httpStatus: responseClassificationPreview.httpStatus,
    serviceReason: responseClassificationPreview.serviceReason,
    contractSatisfiedForFutureRuntime:
      responseClassificationPreview.contractSatisfiedForFutureRuntime,
    acceptedForFutureMetadataOnly:
      responseClassificationPreview.acceptedForFutureMetadataOnly,
    runtimeCanAdvanceNow: responseClassificationPreview.runtimeCanAdvanceNow,
    persistOutputAllowedNow: responseClassificationPreview.persistOutputAllowedNow,
    creditSpendAllowedNow: responseClassificationPreview.creditSpendAllowedNow,
  },
  sourceOfTruthRules:
    {
      ...QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT.sourceOfTruthRules,
      signedUrlsAreSourceOfTruth: false,
      publicUrlsAreSourceOfTruth: false,
    },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightPassed:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptPassedFailClosed:
      attemptPassedFailClosed,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptResultReviewRequired:
      true,
    transportDependencyPreviewAttemptBlocked:
      transportPreviewAttempt.status === 'blocked_transport_preview_only',
    injectedDependenciesProvidedForShape: true,
    injectedDependencyCallsExecuted: false,
    responseClassificationAttemptBlocked:
      responseClassificationPreview.status === 'blocked_contract_valid_inference_disabled',
    responseClassificationRuntimeCanAdvanceNow:
      responseClassificationPreview.runtimeCanAdvanceNow,
    selectedGpuL4:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT.approvedRuntimePosture.gpu === 'nvidia_l4',
    scaleToZeroRequired:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_PREFLIGHT.approvedRuntimePosture.costPosture === 'scale_to_zero_required',
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_ATTEMPT_RESULT
