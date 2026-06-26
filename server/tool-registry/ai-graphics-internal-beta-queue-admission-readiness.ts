import {
  AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION,
  buildAiGraphicsInternalBetaRuntimeEnqueueApproval,
  type AiGraphicsInternalBetaRuntimeEnqueueApproval,
  type AiGraphicsInternalBetaRuntimeEnqueueApprovalInput,
  type AiGraphicsInternalBetaRuntimeEnqueueToolScope,
} from './ai-graphics-internal-beta-runtime-enqueue-approval'
import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION =
  'ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks'

export type AiGraphicsInternalBetaQueueAdmissionReadinessStatus =
  | 'missing_runtime_enqueue_scope_approval'
  | 'missing_queue_admission_prerequisites'
  | 'internal_beta_queue_admission_ready_runtime_still_blocked'

export interface AiGraphicsInternalBetaQueueAdmissionReadinessInput
  extends AiGraphicsInternalBetaRuntimeEnqueueApprovalInput {
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  privateArtifactManifestRef?: string
  artifactBoundaryApprovalRef?: string
  toolRouteApprovalRef?: string
  workerApprovalRef?: string
  workerQueueTransportRef?: string
  workerIdempotencyNamespace?: string
  internalBetaRuntimeOwnerApprovalRef?: string
}

export interface AiGraphicsInternalBetaQueueAdmissionEvidence {
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  artifactBoundaryApprovalRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  workerQueueTransportRef: string
  workerIdempotencyNamespace: string
  internalBetaRuntimeOwnerApprovalRef: string
}

export interface AiGraphicsInternalBetaQueueAdmissionPacket {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  sourceRuntimeEnqueueScopeApprovedWithProvidedEvidence: boolean
  queueAdmissionReadyWithProvidedEvidence: boolean
  liveWorkerQueueApprovedNow: false
  liveWorkerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  blockedRuntimeActions: string[]
  nextRuntimeProofMilestone: string
}

export interface AiGraphicsInternalBetaQueueAdmissionReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION
  sourceRuntimeEnqueueApprovalDecision: typeof AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION
  status: AiGraphicsInternalBetaQueueAdmissionReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  queueAdmissionPacketsPrepared: 21
  queueAdmissionPacketsReadyWithProvidedEvidence: number
  queueAdmissionCapabilitiesReadyWithProvidedEvidence: number
  liveWorkerQueueApprovedNowTools: 0
  liveWorkerExecutionApprovedNowTools: 0
  sourceRuntimeEnqueueApproval: AiGraphicsInternalBetaRuntimeEnqueueApproval
  sourceRuntimeEnqueueScopeAccepted: boolean
  queueAdmissionPrerequisitesSatisfied: boolean
  queueAdmissionEvidence: AiGraphicsInternalBetaQueueAdmissionEvidence
  missingQueueAdmissionPrerequisites: string[]
  requiredQueueAdmissionEvidence: string[]
  allowedQueueAdmissionPreparationActions: string[]
  blockedRuntimeActions: string[]
  queueAdmissionPackets: AiGraphicsInternalBetaQueueAdmissionPacket[]
  nextMilestones: string[]
  booleans: {
    internalBetaQueueAdmissionReadinessPrepared: true
    sourceRuntimeEnqueueScopeAccepted: boolean
    queueAdmissionPrerequisitesSatisfied: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21QueueAdmissionPacketsPrepared: true
    all21QueueAdmissionPacketsReadyWithProvidedEvidence: boolean
    all12CapabilitiesReadyWithProvidedEvidence: boolean
    privateArtifactManifestOnly: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
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

const requiredQueueAdmissionEvidence = [
  'approvedPlanSnapshotId',
  'creditReservationId',
  'privateArtifactManifestRef',
  'artifactBoundaryApprovalRef',
  'toolRouteApprovalRef',
  'workerApprovalRef',
  'workerQueueTransportRef',
  'workerIdempotencyNamespace',
  'internalBetaRuntimeOwnerApprovalRef',
]

const allowedQueueAdmissionPreparationActions = [
  'bind all 21 AI graphics production tool IDs to approved snapshot and credit reservation evidence',
  'bind each candidate to a private artifact manifest reference',
  'bind Tool Route and Worker approval references without executing either surface',
  'bind worker queue transport and idempotency namespace metadata without enqueueing work',
  'return queue-admission readiness and live runtime blockers per tool',
]

const blockedRuntimeActions = [
  'live worker queue enqueue',
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
  'Attach queue-admission readiness to a real backend queue adapter only after an owner runtime approval explicitly allows live enqueue.',
  'Keep GPU/model tools on native NVIDIA L4 worker lanes and reject CPU fallback for heavy runtime paths.',
  'Require private artifact manifests and approved plan snapshots for every queue candidate before live enqueue.',
  'Run external beta and production launch approvals separately after internal beta runtime evidence exists.',
]

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

function asString(value: string | undefined): string {
  return value?.trim() ?? ''
}

function normalizeEvidence(
  input: AiGraphicsInternalBetaQueueAdmissionReadinessInput,
): AiGraphicsInternalBetaQueueAdmissionEvidence {
  return {
    approvedPlanSnapshotId: asString(input.approvedPlanSnapshotId),
    creditReservationId: asString(input.creditReservationId),
    privateArtifactManifestRef: asString(input.privateArtifactManifestRef),
    artifactBoundaryApprovalRef: asString(input.artifactBoundaryApprovalRef),
    toolRouteApprovalRef: asString(input.toolRouteApprovalRef),
    workerApprovalRef: asString(input.workerApprovalRef),
    workerQueueTransportRef: asString(input.workerQueueTransportRef),
    workerIdempotencyNamespace: asString(input.workerIdempotencyNamespace),
    internalBetaRuntimeOwnerApprovalRef: asString(input.internalBetaRuntimeOwnerApprovalRef),
  }
}

function privateArtifactManifestOnly(ref: string): boolean {
  if (!ref) return false
  if (/^https?:\/\//i.test(ref)) return false
  if (/^signed:\/\//i.test(ref)) return false
  if (/^public:\/\//i.test(ref)) return false
  if (/^gs:\/\//i.test(ref)) return false
  return /^private:\/\//i.test(ref) || /^reeditpro-private:\/\//i.test(ref)
}

function missingPrerequisites(
  evidence: AiGraphicsInternalBetaQueueAdmissionEvidence,
): string[] {
  const missing = requiredQueueAdmissionEvidence.filter((key) => (
    !evidence[key as keyof AiGraphicsInternalBetaQueueAdmissionEvidence]
  ))

  if (evidence.privateArtifactManifestRef && !privateArtifactManifestOnly(evidence.privateArtifactManifestRef)) {
    missing.push('privateArtifactManifestRef must use a private-only scheme')
  }

  return missing
}

function statusFromEvidence(input: {
  sourceAccepted: boolean
  queueAdmissionPrerequisitesSatisfied: boolean
}): AiGraphicsInternalBetaQueueAdmissionReadinessStatus {
  if (!input.sourceAccepted) return 'missing_runtime_enqueue_scope_approval'
  if (!input.queueAdmissionPrerequisitesSatisfied) return 'missing_queue_admission_prerequisites'
  return 'internal_beta_queue_admission_ready_runtime_still_blocked'
}

function toPacket(
  scope: AiGraphicsInternalBetaRuntimeEnqueueToolScope,
  readyWithProvidedEvidence: boolean,
): AiGraphicsInternalBetaQueueAdmissionPacket {
  return {
    toolId: scope.toolId,
    productionToolId: scope.productionToolId,
    workerType: scope.workerType,
    runtimeTarget: scope.runtimeTarget,
    capabilityIds: [...scope.capabilityIds],
    gpuRequiredForRuntime: scope.gpuRequiredForRuntime,
    sourceRuntimeEnqueueScopeApprovedWithProvidedEvidence:
      scope.enqueueScopeApprovedWithProvidedEvidence,
    queueAdmissionReadyWithProvidedEvidence:
      readyWithProvidedEvidence && scope.enqueueScopeApprovedWithProvidedEvidence,
    liveWorkerQueueApprovedNow: false,
    liveWorkerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    blockedRuntimeActions,
    nextRuntimeProofMilestone: scope.nextRuntimeProofMilestone,
  }
}

export function buildAiGraphicsInternalBetaQueueAdmissionReadiness(
  input: AiGraphicsInternalBetaQueueAdmissionReadinessInput = {},
): AiGraphicsInternalBetaQueueAdmissionReadiness {
  const sourceRuntimeEnqueueApproval =
    buildAiGraphicsInternalBetaRuntimeEnqueueApproval(input)
  const sourceRuntimeEnqueueScopeAccepted =
    sourceRuntimeEnqueueApproval.status ===
      'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked' &&
    sourceRuntimeEnqueueApproval.booleans.all21RuntimeEnqueueScopesApprovedWithProvidedEvidence
  const queueAdmissionEvidence = normalizeEvidence(input)
  const missingQueueAdmissionPrerequisites = missingPrerequisites(queueAdmissionEvidence)
  const queueAdmissionPrerequisitesSatisfied =
    missingQueueAdmissionPrerequisites.length === 0
  const status = statusFromEvidence({
    sourceAccepted: sourceRuntimeEnqueueScopeAccepted,
    queueAdmissionPrerequisitesSatisfied,
  })
  const readyWithProvidedEvidence =
    status === 'internal_beta_queue_admission_ready_runtime_still_blocked'
  const queueAdmissionPackets =
    sourceRuntimeEnqueueApproval.toolScopes.map((scope) => toPacket(
      scope,
      readyWithProvidedEvidence,
    ))
  const queueAdmissionPacketsReadyWithProvidedEvidence =
    queueAdmissionPackets.filter((packet) => packet.queueAdmissionReadyWithProvidedEvidence).length
  const queueAdmissionCapabilitiesReadyWithProvidedEvidence =
    productFacingCapabilities.filter((capabilityId) => (
      queueAdmissionPackets.some((packet) => (
        packet.queueAdmissionReadyWithProvidedEvidence &&
        packet.capabilityIds.includes(capabilityId)
      ))
    )).length
  const gpuRuntimeTargetedTools =
    queueAdmissionPackets.filter((packet) => packet.gpuRequiredForRuntime).length

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_QUEUE_ADMISSION_READINESS_DECISION,
    sourceRuntimeEnqueueApprovalDecision:
      AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    queueAdmissionPacketsPrepared: queueAdmissionPackets.length as 21,
    queueAdmissionPacketsReadyWithProvidedEvidence,
    queueAdmissionCapabilitiesReadyWithProvidedEvidence,
    liveWorkerQueueApprovedNowTools: 0,
    liveWorkerExecutionApprovedNowTools: 0,
    sourceRuntimeEnqueueApproval,
    sourceRuntimeEnqueueScopeAccepted,
    queueAdmissionPrerequisitesSatisfied,
    queueAdmissionEvidence,
    missingQueueAdmissionPrerequisites,
    requiredQueueAdmissionEvidence,
    allowedQueueAdmissionPreparationActions,
    blockedRuntimeActions,
    queueAdmissionPackets,
    nextMilestones,
    booleans: {
      internalBetaQueueAdmissionReadinessPrepared: true,
      sourceRuntimeEnqueueScopeAccepted,
      queueAdmissionPrerequisitesSatisfied,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21QueueAdmissionPacketsPrepared: true,
      all21QueueAdmissionPacketsReadyWithProvidedEvidence:
        queueAdmissionPacketsReadyWithProvidedEvidence === 21,
      all12CapabilitiesReadyWithProvidedEvidence:
        queueAdmissionCapabilitiesReadyWithProvidedEvidence === 12,
      privateArtifactManifestOnly:
        privateArtifactManifestOnly(queueAdmissionEvidence.privateArtifactManifestRef),
      gpuHeavyToolsTargetGpuRuntime:
        gpuRuntimeTargetedTools === 8 &&
        sourceRuntimeEnqueueApproval.heavyToolsIncorrectlyTargetingCpu === 0,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
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
