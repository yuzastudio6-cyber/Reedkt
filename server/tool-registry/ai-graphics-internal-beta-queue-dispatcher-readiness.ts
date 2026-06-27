import {
  AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION,
  buildAiGraphicsInternalBetaQueueAdapterReadiness,
  type AiGraphicsInternalBetaQueueAdapterReadiness,
  type AiGraphicsInternalBetaQueueAdapterReadinessInput,
  type AiGraphicsInternalBetaQueueAdapterSubmission,
} from './ai-graphics-internal-beta-queue-adapter-readiness'
import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { createProductionWorkerRuntimeState } from '../workers/production/production-worker-lease-manager'
import type {
  ProductionWorkerEventType,
  ProductionWorkerJobStatus,
  ProductionWorkerRuntimeState,
} from '../workers/production/production-worker-types'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION =
  'ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher'

export type AiGraphicsInternalBetaQueueDispatcherReadinessStatus =
  | 'missing_queue_adapter_evidence'
  | 'mock_safe_dispatcher_probe_completed_runtime_still_blocked'

export interface AiGraphicsInternalBetaQueueDispatcherReadinessInput
  extends AiGraphicsInternalBetaQueueAdapterReadinessInput {}

export interface AiGraphicsInternalBetaQueueDispatcherProbeResult {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: AiGraphicsInternalBetaQueueAdapterSubmission['workerType']
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  sourceAdapterSubmissionReadyWithProvidedEvidence: boolean
  productionWorkerJobStatus: ProductionWorkerJobStatus | 'skipped'
  futureHandler: string
  aiGraphicsToolCallHandoffRoute: boolean
  mockOnlyRoute: boolean
  gateChecksEvaluated: number
  hardGateBlockCount: number
  warningCount: number
  eventNames: ProductionWorkerEventType[]
  inMemoryLeaseRecordCreated: boolean
  inMemoryLeaseReleased: boolean
  dispatcherProbeCompletedWithProvidedEvidence: boolean
  canSubmitToBackendQueueNow: false
  canCreateLiveWorkerLeaseNow: false
  canDispatchLiveProductionWorkerNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaQueueDispatcherCapabilityScenario {
  capabilityId: AiGraphicsCapabilityId
  selectedDispatcherProbeTools: AiGraphicsCanonicalToolId[]
  completedDispatcherProbeToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  scenarioDispatcherProbeCompletedWithProvidedEvidence: boolean
  canSubmitToBackendQueueNow: false
  canDispatchLiveWorkersNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaQueueDispatcherReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION
  sourceQueueAdapterDecision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION
  status: AiGraphicsInternalBetaQueueDispatcherReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  dispatcherProbeJobsPrepared: 21
  dispatcherProbeJobsCompletedWithProvidedEvidence: number
  dispatcherCapabilityScenariosPrepared: 12
  dispatcherCapabilityScenariosCompletedWithProvidedEvidence: number
  dispatcherHardGateBlockCount: number
  dispatcherWarningCount: number
  inMemoryDispatcherLeaseRecordsCreated: number
  inMemoryDispatcherLeaseRecordsReleased: number
  inMemoryDispatcherEventsRecorded: number
  aiGraphicsToolCallHandoffRoutes: number
  liveBackendQueueSubmissionsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveProductionWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  sourceQueueAdapterReadiness: AiGraphicsInternalBetaQueueAdapterReadiness
  sourceQueueAdapterAccepted: boolean
  allowedMockSafeDispatcherProbeActions: string[]
  blockedRuntimeActions: string[]
  dispatcherProbeResults: AiGraphicsInternalBetaQueueDispatcherProbeResult[]
  dispatcherCapabilityScenarios: AiGraphicsInternalBetaQueueDispatcherCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    internalBetaQueueDispatcherReadinessPrepared: true
    sourceQueueAdapterAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21DispatcherProbeJobsPrepared: true
    all21DispatcherProbeJobsCompletedWithProvidedEvidence: boolean
    all12CapabilityScenariosCompletedWithProvidedEvidence: boolean
    allDispatcherGateHardBlocksClear: boolean
    allDispatcherRoutesMockOnly: boolean
    allDispatcherRoutesAiGraphicsToolCallHandoff: boolean
    allInMemoryLeaseRecordsReleased: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    gpuRuntimeTargetsExact: boolean
    gpuRuntimeOnDemandOnly: true
    privateArtifactManifestOnly: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
    workerLeaseCreationApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    workerLeaseCreated: false
    productionWorkerDispatchPerformed: false
    productionWorkerRouteExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const productFacingCapabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
] satisfies AiGraphicsCapabilityId[]

const allowedMockSafeDispatcherProbeActions = [
  'run all 21 adapter payloads through the in-memory production worker dispatcher probe',
  'evaluate production worker gates, idempotency, lease lifecycle, event emission, and AI graphics tool-call handoff routing',
  'verify GPU-heavy tools remain assigned to gpu_ai_worker dispatcher probes',
  'verify dispatcher routes land on AI graphics handoff handlers, remain mockOnly, and do not execute tools, providers, browser runtimes, or GPU model runtimes',
  'return fail-closed live queue, live lease, live dispatch, route, and execution blockers',
]

const blockedRuntimeActions = [
  'backend queue submission',
  'live worker queue enqueue',
  'live worker lease creation',
  'live production worker dispatch',
  'production worker route execution',
  'worker execution',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'external beta unlock',
  'production unlock',
]

const nextMilestones = [
  'Persist the queue adapter submissions into backend queue storage only after service-role queue writes and runtime owner approval are complete.',
  'Replace the in-memory dispatcher probe with an environment-scoped worker queue smoke after approved internal beta runtime infrastructure exists.',
  'Keep GPU/model tools on gpu_ai_worker lanes and reject CPU fallback for heavy runtime paths.',
  'Require private artifact manifests, approved snapshots, credit reservations, and quality gates before any live worker dispatch.',
]

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
} as const

function statusFromSource(
  sourceQueueAdapterAccepted: boolean,
): AiGraphicsInternalBetaQueueDispatcherReadinessStatus {
  return sourceQueueAdapterAccepted
    ? 'mock_safe_dispatcher_probe_completed_runtime_still_blocked'
    : 'missing_queue_adapter_evidence'
}

function skippedProbeResult(
  submission: AiGraphicsInternalBetaQueueAdapterSubmission,
): AiGraphicsInternalBetaQueueDispatcherProbeResult {
  return {
    toolId: submission.toolId,
    productionToolId: submission.productionToolId,
    workerType: submission.workerType,
    runtimeTarget: submission.runtimeTarget,
    capabilityIds: [...submission.capabilityIds],
    sourceAdapterSubmissionReadyWithProvidedEvidence:
      submission.adapterSubmissionReadyWithProvidedEvidence,
    productionWorkerJobStatus: 'skipped',
    futureHandler: 'queue_adapter_evidence_missing',
    aiGraphicsToolCallHandoffRoute: false,
    mockOnlyRoute: false,
    gateChecksEvaluated: 0,
    hardGateBlockCount: 0,
    warningCount: 0,
    eventNames: [],
    inMemoryLeaseRecordCreated: false,
    inMemoryLeaseReleased: false,
    dispatcherProbeCompletedWithProvidedEvidence: false,
    canSubmitToBackendQueueNow: false,
    canCreateLiveWorkerLeaseNow: false,
    canDispatchLiveProductionWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

function gpuRuntimeTargetsExact(
  results: AiGraphicsInternalBetaQueueDispatcherProbeResult[],
): boolean {
  return Object.entries(expectedGpuRuntimeTargets).every(([toolId, runtimeTarget]) => (
    results.some((result) => (
      result.toolId === toolId &&
      result.workerType === 'gpu_ai_worker' &&
      result.runtimeTarget === runtimeTarget
    ))
  ))
}

async function dispatchProbeResult(input: {
  submission: AiGraphicsInternalBetaQueueAdapterSubmission
  state: ProductionWorkerRuntimeState
}): Promise<AiGraphicsInternalBetaQueueDispatcherProbeResult> {
  const result = await dispatchProductionWorkerJob({
    payload: input.submission.productionWorkerJobPayload,
    state: input.state,
    workerInstanceId: `ai-graphics-${input.submission.workerType}-dispatcher-probe`,
  })
  const hardGateBlockCount = result.gateChecks.filter((gate) => gate.hardBlock).length
  const eventNames = result.events.map((event) => event.eventName)
  const inMemoryLeaseRecordCreated = eventNames.includes('job_claimed')
  const inMemoryLeaseReleased = eventNames.includes('job_completed') &&
    input.state.leases.some((lease) => (
      lease.jobId === result.jobId && lease.leaseStatus === 'released'
    ))
  const mockOnlyRoute = result.output?.mockOnly === true
  const aiGraphicsToolCallHandoffRoute =
    result.output?.futureHandler?.startsWith('ai_graphics_') === true &&
    Boolean(result.output?.aiGraphicsToolCallHandoffResult)
  const dispatcherProbeCompletedWithProvidedEvidence =
    input.submission.adapterSubmissionReadyWithProvidedEvidence &&
    result.status === 'completed' &&
    hardGateBlockCount === 0 &&
    aiGraphicsToolCallHandoffRoute &&
    mockOnlyRoute &&
    result.toolRunResults.length === 0 &&
    result.artifactRecords.length === 0 &&
    result.qualityGateResults.length === 0

  return {
    toolId: input.submission.toolId,
    productionToolId: input.submission.productionToolId,
    workerType: input.submission.workerType,
    runtimeTarget: input.submission.runtimeTarget,
    capabilityIds: [...input.submission.capabilityIds],
    sourceAdapterSubmissionReadyWithProvidedEvidence:
      input.submission.adapterSubmissionReadyWithProvidedEvidence,
    productionWorkerJobStatus: result.status,
    futureHandler: result.output?.futureHandler ?? 'missing_future_handler',
    aiGraphicsToolCallHandoffRoute,
    mockOnlyRoute,
    gateChecksEvaluated: result.gateChecks.length,
    hardGateBlockCount,
    warningCount: result.warnings.length,
    eventNames,
    inMemoryLeaseRecordCreated,
    inMemoryLeaseReleased,
    dispatcherProbeCompletedWithProvidedEvidence,
    canSubmitToBackendQueueNow: false,
    canCreateLiveWorkerLeaseNow: false,
    canDispatchLiveProductionWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

function capabilityScenarios(
  probeResults: AiGraphicsInternalBetaQueueDispatcherProbeResult[],
): AiGraphicsInternalBetaQueueDispatcherCapabilityScenario[] {
  return productFacingCapabilities.map((capabilityId) => {
    const selectedDispatcherProbeTools = probeResults
      .filter((result) => result.capabilityIds.includes(capabilityId))
      .map((result) => result.toolId)
    const completedDispatcherProbeToolsWithProvidedEvidence = probeResults
      .filter((result) => (
        result.capabilityIds.includes(capabilityId) &&
        result.dispatcherProbeCompletedWithProvidedEvidence
      ))
      .map((result) => result.toolId)

    return {
      capabilityId,
      selectedDispatcherProbeTools,
      completedDispatcherProbeToolsWithProvidedEvidence,
      scenarioDispatcherProbeCompletedWithProvidedEvidence:
        selectedDispatcherProbeTools.length > 0 &&
        completedDispatcherProbeToolsWithProvidedEvidence.length ===
          selectedDispatcherProbeTools.length,
      canSubmitToBackendQueueNow: false,
      canDispatchLiveWorkersNow: false,
      canExecuteToolsNow: false,
    }
  })
}

export async function buildAiGraphicsInternalBetaQueueDispatcherReadiness(
  input: AiGraphicsInternalBetaQueueDispatcherReadinessInput = {},
): Promise<AiGraphicsInternalBetaQueueDispatcherReadiness> {
  const sourceQueueAdapterReadiness = buildAiGraphicsInternalBetaQueueAdapterReadiness(input)
  const sourceQueueAdapterAccepted =
    sourceQueueAdapterReadiness.status ===
      'internal_beta_queue_adapter_ready_runtime_still_blocked' &&
    sourceQueueAdapterReadiness.booleans.all21QueueAdapterSubmissionsReadyWithProvidedEvidence &&
    sourceQueueAdapterReadiness.booleans.allAdapterPayloadsMatchQueueAdmission
  const status = statusFromSource(sourceQueueAdapterAccepted)
  const state = createProductionWorkerRuntimeState()
  const dispatcherProbeResults = sourceQueueAdapterAccepted
    ? await Promise.all(sourceQueueAdapterReadiness.queueAdapterSubmissions.map((submission) => (
      dispatchProbeResult({ submission, state })
    )))
    : sourceQueueAdapterReadiness.queueAdapterSubmissions.map(skippedProbeResult)
  const dispatcherCapabilityScenarios = capabilityScenarios(dispatcherProbeResults)
  const dispatcherProbeJobsCompletedWithProvidedEvidence =
    dispatcherProbeResults.filter((result) => (
      result.dispatcherProbeCompletedWithProvidedEvidence
    )).length
  const dispatcherCapabilityScenariosCompletedWithProvidedEvidence =
    dispatcherCapabilityScenarios.filter((scenario) => (
      scenario.scenarioDispatcherProbeCompletedWithProvidedEvidence
    )).length
  const dispatcherHardGateBlockCount =
    dispatcherProbeResults.reduce((total, result) => total + result.hardGateBlockCount, 0)
  const dispatcherWarningCount =
    dispatcherProbeResults.reduce((total, result) => total + result.warningCount, 0)
  const inMemoryDispatcherLeaseRecordsCreated =
    dispatcherProbeResults.filter((result) => result.inMemoryLeaseRecordCreated).length
  const inMemoryDispatcherLeaseRecordsReleased =
    dispatcherProbeResults.filter((result) => result.inMemoryLeaseReleased).length
  const inMemoryDispatcherEventsRecorded = state.events.length
  const allDispatcherRoutesMockOnly =
    dispatcherProbeResults.every((result) => result.mockOnlyRoute)
  const aiGraphicsToolCallHandoffRoutes =
    dispatcherProbeResults.filter((result) => result.aiGraphicsToolCallHandoffRoute).length
  const gpuRuntimeTargetedTools =
    dispatcherProbeResults.filter((result) => result.workerType === 'gpu_ai_worker').length
  const gpuRuntimeTargetsExactForResults = gpuRuntimeTargetsExact(dispatcherProbeResults)

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION,
    sourceQueueAdapterDecision: AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    dispatcherProbeJobsPrepared: dispatcherProbeResults.length as 21,
    dispatcherProbeJobsCompletedWithProvidedEvidence,
    dispatcherCapabilityScenariosPrepared: dispatcherCapabilityScenarios.length as 12,
    dispatcherCapabilityScenariosCompletedWithProvidedEvidence,
    dispatcherHardGateBlockCount,
    dispatcherWarningCount,
    inMemoryDispatcherLeaseRecordsCreated,
    inMemoryDispatcherLeaseRecordsReleased,
    inMemoryDispatcherEventsRecorded,
    aiGraphicsToolCallHandoffRoutes,
    liveBackendQueueSubmissionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveProductionWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    sourceQueueAdapterReadiness,
    sourceQueueAdapterAccepted,
    allowedMockSafeDispatcherProbeActions,
    blockedRuntimeActions,
    dispatcherProbeResults,
    dispatcherCapabilityScenarios,
    nextMilestones,
    booleans: {
      internalBetaQueueDispatcherReadinessPrepared: true,
      sourceQueueAdapterAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21DispatcherProbeJobsPrepared: true,
      all21DispatcherProbeJobsCompletedWithProvidedEvidence:
        dispatcherProbeJobsCompletedWithProvidedEvidence === 21,
      all12CapabilityScenariosCompletedWithProvidedEvidence:
        dispatcherCapabilityScenariosCompletedWithProvidedEvidence === 12,
      allDispatcherGateHardBlocksClear: dispatcherHardGateBlockCount === 0,
      allDispatcherRoutesMockOnly,
      allDispatcherRoutesAiGraphicsToolCallHandoff:
        aiGraphicsToolCallHandoffRoutes === 21,
      allInMemoryLeaseRecordsReleased:
        inMemoryDispatcherLeaseRecordsCreated === 21 &&
        inMemoryDispatcherLeaseRecordsReleased === 21,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      gpuRuntimeTargetsExact: gpuRuntimeTargetsExactForResults,
      gpuRuntimeOnDemandOnly: true,
      privateArtifactManifestOnly:
        sourceQueueAdapterReadiness.booleans.privateArtifactManifestOnly,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      workerLeaseCreated: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
