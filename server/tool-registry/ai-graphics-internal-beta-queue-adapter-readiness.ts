import {
  AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION,
  buildAiGraphicsInternalBetaProductionWorkerJobReadiness,
  type AiGraphicsInternalBetaProductionWorkerJobCandidate,
  type AiGraphicsInternalBetaProductionWorkerJobReadiness,
} from './ai-graphics-internal-beta-production-worker-job-readiness'
import {
  AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION,
  buildAiGraphicsInternalBetaQueueAdmissionReadiness,
  type AiGraphicsInternalBetaQueueAdmissionPacket,
  type AiGraphicsInternalBetaQueueAdmissionReadiness,
  type AiGraphicsInternalBetaQueueAdmissionReadinessInput,
} from './ai-graphics-internal-beta-queue-admission-readiness'
import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION =
  'ai_graphics_internal_beta_queue_adapter_readiness_contract_prepared_with_runtime_blocks'

export type AiGraphicsInternalBetaQueueAdapterReadinessStatus =
  | 'missing_queue_admission_evidence'
  | 'missing_production_worker_job_evidence'
  | 'internal_beta_queue_adapter_ready_runtime_still_blocked'

export interface AiGraphicsInternalBetaQueueAdapterReadinessInput
  extends AiGraphicsInternalBetaQueueAdmissionReadinessInput {}

export interface AiGraphicsInternalBetaQueueAdapterSubmission {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  queueTransportRef: string
  idempotencyNamespace: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  productionWorkerJobPayload: ProductionWorkerJobPayload
  sourceQueueAdmissionReadyWithProvidedEvidence: boolean
  sourceProductionWorkerJobReadyWithProvidedEvidence: boolean
  adapterPayloadMatchesQueueAdmission: boolean
  adapterSubmissionReadyWithProvidedEvidence: boolean
  canSubmitToBackendQueueNow: false
  canCreateWorkerLeaseNow: false
  canDispatchProductionWorkerNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaQueueAdapterCapabilityScenario {
  capabilityId: AiGraphicsCapabilityId
  selectedAdapterSubmissions: AiGraphicsCanonicalToolId[]
  readyAdapterSubmissionsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  scenarioAdapterReadyWithProvidedEvidence: boolean
  canSubmitToBackendQueueNow: false
  canDispatchWorkersNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaQueueAdapterReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION
  sourceQueueAdmissionDecision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION
  sourceProductionWorkerJobDecision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION
  status: AiGraphicsInternalBetaQueueAdapterReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  queueAdapterSubmissionsPrepared: 21
  queueAdapterSubmissionsReadyWithProvidedEvidence: number
  queueAdapterCapabilityScenariosPrepared: 12
  queueAdapterCapabilityScenariosReadyWithProvidedEvidence: number
  liveBackendQueueSubmissionsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveProductionWorkerDispatchesNow: 0
  sourceQueueAdmissionReadiness: AiGraphicsInternalBetaQueueAdmissionReadiness
  sourceProductionWorkerJobReadiness: AiGraphicsInternalBetaProductionWorkerJobReadiness
  sourceQueueAdmissionAccepted: boolean
  sourceProductionWorkerJobsAccepted: boolean
  allowedQueueAdapterPreparationActions: string[]
  blockedRuntimeActions: string[]
  queueAdapterSubmissions: AiGraphicsInternalBetaQueueAdapterSubmission[]
  queueAdapterCapabilityScenarios: AiGraphicsInternalBetaQueueAdapterCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    internalBetaQueueAdapterReadinessPrepared: true
    sourceQueueAdmissionAccepted: boolean
    sourceProductionWorkerJobsAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21QueueAdapterSubmissionsPrepared: true
    all21QueueAdapterSubmissionsReadyWithProvidedEvidence: boolean
    all12CapabilityScenariosReadyWithProvidedEvidence: boolean
    allAdapterPayloadsMatchQueueAdmission: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
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

const allowedQueueAdapterPreparationActions = [
  'shape all 21 queue-admission packets into backend queue adapter submission candidates',
  'reuse canonical ProductionWorkerJobPayload records without dispatching them',
  'verify productionToolId, workerType, runtimeTarget, approved snapshot, credit reservation, private manifest, and idempotency metadata',
  'confirm GPU-heavy tools remain assigned to GPU worker submissions',
  'return fail-closed backend queue, lease, dispatch, route, and execution blockers',
]

const blockedRuntimeActions = [
  'backend queue submission',
  'live worker queue enqueue',
  'worker lease creation',
  'production worker dispatch',
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
  'Add a live queue adapter implementation only after backend queue storage, service-role boundaries, and runtime owner approvals are complete.',
  'Keep this contract fail-closed until live queue submission is explicitly approved per environment.',
  'Require private artifact manifests and approved snapshot IDs to match persisted backend records before queue submission.',
  'Run internal beta runtime smoke on private projects before external beta or production approval.',
]

function statusFromSources(input: {
  queueAdmissionAccepted: boolean
  productionWorkerJobsAccepted: boolean
}): AiGraphicsInternalBetaQueueAdapterReadinessStatus {
  if (!input.queueAdmissionAccepted) return 'missing_queue_admission_evidence'
  if (!input.productionWorkerJobsAccepted) return 'missing_production_worker_job_evidence'
  return 'internal_beta_queue_adapter_ready_runtime_still_blocked'
}

function payloadMatchesQueueAdmission(
  queueAdmission: AiGraphicsInternalBetaQueueAdmissionPacket,
  jobCandidate: AiGraphicsInternalBetaProductionWorkerJobCandidate | undefined,
  evidence: AiGraphicsInternalBetaQueueAdmissionReadiness['queueAdmissionEvidence'],
): boolean {
  const payload = jobCandidate?.productionWorkerJobPayload
  return Boolean(
    payload &&
    jobCandidate?.sourceProductionToolId === queueAdmission.productionToolId &&
    payload.requestedToolIds.includes(queueAdmission.productionToolId) &&
    payload.workerType === queueAdmission.workerType &&
    payload.approvedSnapshotId === evidence.approvedPlanSnapshotId &&
    payload.creditReservationId === evidence.creditReservationId &&
    payload.storageReferenceIds.length === 1 &&
    payload.toolExecutionPlanId &&
    payload.idempotencyKey &&
    queueAdmission.runtimeTarget &&
    queueAdmission.capabilityIds.length > 0,
  )
}

function toSubmission(input: {
  queueAdmission: AiGraphicsInternalBetaQueueAdmissionPacket
  jobCandidate: AiGraphicsInternalBetaProductionWorkerJobCandidate | undefined
  queueReadiness: AiGraphicsInternalBetaQueueAdmissionReadiness
  adapterReady: boolean
}): AiGraphicsInternalBetaQueueAdapterSubmission {
  const payload = input.jobCandidate?.productionWorkerJobPayload
  if (!payload) {
    throw new Error(`Production worker job payload missing for ${input.queueAdmission.toolId}`)
  }

  const adapterPayloadMatchesQueueAdmission = payloadMatchesQueueAdmission(
    input.queueAdmission,
    input.jobCandidate,
    input.queueReadiness.queueAdmissionEvidence,
  )

  return {
    toolId: input.queueAdmission.toolId,
    productionToolId: input.queueAdmission.productionToolId,
    workerType: payload.workerType,
    runtimeTarget: input.queueAdmission.runtimeTarget,
    capabilityIds: [...input.queueAdmission.capabilityIds],
    queueTransportRef: input.queueReadiness.queueAdmissionEvidence.workerQueueTransportRef,
    idempotencyNamespace: input.queueReadiness.queueAdmissionEvidence.workerIdempotencyNamespace,
    approvedPlanSnapshotId: input.queueReadiness.queueAdmissionEvidence.approvedPlanSnapshotId,
    creditReservationId: input.queueReadiness.queueAdmissionEvidence.creditReservationId,
    privateArtifactManifestRef: input.queueReadiness.queueAdmissionEvidence.privateArtifactManifestRef,
    productionWorkerJobPayload: payload,
    sourceQueueAdmissionReadyWithProvidedEvidence:
      input.queueAdmission.queueAdmissionReadyWithProvidedEvidence,
    sourceProductionWorkerJobReadyWithProvidedEvidence:
      input.jobCandidate?.productionWorkerJobReadyWithProvidedEvidence === true,
    adapterPayloadMatchesQueueAdmission,
    adapterSubmissionReadyWithProvidedEvidence:
      input.adapterReady &&
      input.queueAdmission.queueAdmissionReadyWithProvidedEvidence &&
      input.jobCandidate?.productionWorkerJobReadyWithProvidedEvidence === true &&
      adapterPayloadMatchesQueueAdmission,
    canSubmitToBackendQueueNow: false,
    canCreateWorkerLeaseNow: false,
    canDispatchProductionWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

export function buildAiGraphicsInternalBetaQueueAdapterReadiness(
  input: AiGraphicsInternalBetaQueueAdapterReadinessInput = {},
): AiGraphicsInternalBetaQueueAdapterReadiness {
  const sourceQueueAdmissionReadiness =
    buildAiGraphicsInternalBetaQueueAdmissionReadiness(input)
  const sourceProductionWorkerJobReadiness =
    buildAiGraphicsInternalBetaProductionWorkerJobReadiness(input)
  const sourceQueueAdmissionAccepted =
    sourceQueueAdmissionReadiness.status ===
      'internal_beta_queue_admission_ready_runtime_still_blocked' &&
    sourceQueueAdmissionReadiness.booleans.all21QueueAdmissionPacketsReadyWithProvidedEvidence
  const sourceProductionWorkerJobsAccepted =
    sourceProductionWorkerJobReadiness.status === 'owner_approved_production_worker_jobs_ready' &&
    sourceProductionWorkerJobReadiness.booleans.all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence
  const status = statusFromSources({
    queueAdmissionAccepted: sourceQueueAdmissionAccepted,
    productionWorkerJobsAccepted: sourceProductionWorkerJobsAccepted,
  })
  const adapterReady =
    status === 'internal_beta_queue_adapter_ready_runtime_still_blocked'

  const jobsByTool = new Map(
    sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.map((candidate) => [
      candidate.sourceToolId,
      candidate,
    ]),
  )
  const queueAdapterSubmissions =
    sourceQueueAdmissionReadiness.queueAdmissionPackets.map((queueAdmission) => toSubmission({
      queueAdmission,
      jobCandidate: jobsByTool.get(queueAdmission.toolId),
      queueReadiness: sourceQueueAdmissionReadiness,
      adapterReady,
    }))
  const queueAdapterSubmissionsReadyWithProvidedEvidence =
    queueAdapterSubmissions.filter((submission) => (
      submission.adapterSubmissionReadyWithProvidedEvidence
    )).length
  const queueAdapterCapabilityScenarios = productFacingCapabilities.map((capabilityId) => {
    const selectedAdapterSubmissions = queueAdapterSubmissions
      .filter((submission) => submission.capabilityIds.includes(capabilityId))
      .map((submission) => submission.toolId)
    const readyAdapterSubmissionsWithProvidedEvidence = queueAdapterSubmissions
      .filter((submission) => (
        submission.capabilityIds.includes(capabilityId) &&
        submission.adapterSubmissionReadyWithProvidedEvidence
      ))
      .map((submission) => submission.toolId)

    return {
      capabilityId,
      selectedAdapterSubmissions,
      readyAdapterSubmissionsWithProvidedEvidence,
      scenarioAdapterReadyWithProvidedEvidence:
        readyAdapterSubmissionsWithProvidedEvidence.length > 0,
      canSubmitToBackendQueueNow: false,
      canDispatchWorkersNow: false,
      canExecuteToolsNow: false,
    } satisfies AiGraphicsInternalBetaQueueAdapterCapabilityScenario
  })
  const queueAdapterCapabilityScenariosReadyWithProvidedEvidence =
    queueAdapterCapabilityScenarios.filter((scenario) => (
      scenario.scenarioAdapterReadyWithProvidedEvidence
    )).length
  const allAdapterPayloadsMatchQueueAdmission =
    queueAdapterSubmissions.every((submission) => submission.adapterPayloadMatchesQueueAdmission)
  const gpuRuntimeTargetedTools =
    queueAdapterSubmissions.filter((submission) => submission.workerType === 'gpu_ai_worker').length

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADAPTER_READINESS_DECISION,
    sourceQueueAdmissionDecision: AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION,
    sourceProductionWorkerJobDecision:
      AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    queueAdapterSubmissionsPrepared: queueAdapterSubmissions.length as 21,
    queueAdapterSubmissionsReadyWithProvidedEvidence,
    queueAdapterCapabilityScenariosPrepared: queueAdapterCapabilityScenarios.length as 12,
    queueAdapterCapabilityScenariosReadyWithProvidedEvidence,
    liveBackendQueueSubmissionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveProductionWorkerDispatchesNow: 0,
    sourceQueueAdmissionReadiness,
    sourceProductionWorkerJobReadiness,
    sourceQueueAdmissionAccepted,
    sourceProductionWorkerJobsAccepted,
    allowedQueueAdapterPreparationActions,
    blockedRuntimeActions,
    queueAdapterSubmissions,
    queueAdapterCapabilityScenarios,
    nextMilestones,
    booleans: {
      internalBetaQueueAdapterReadinessPrepared: true,
      sourceQueueAdmissionAccepted,
      sourceProductionWorkerJobsAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21QueueAdapterSubmissionsPrepared: true,
      all21QueueAdapterSubmissionsReadyWithProvidedEvidence:
        queueAdapterSubmissionsReadyWithProvidedEvidence === 21,
      all12CapabilityScenariosReadyWithProvidedEvidence:
        queueAdapterCapabilityScenariosReadyWithProvidedEvidence === 12,
      allAdapterPayloadsMatchQueueAdmission,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      privateArtifactManifestOnly:
        sourceQueueAdmissionReadiness.booleans.privateArtifactManifestOnly,
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
