import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  buildAiGraphicsToolCallHandoffContract,
  listAiGraphicsToolCallHandoffTools,
  type AiGraphicsToolCallHandoffTool,
} from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION,
  buildAiGraphicsToolRouteReadinessContract,
} from './ai-graphics-tool-route-readiness'
import {
  AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from './ai-graphics-beta-readiness-gate'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION =
  'ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks'

export interface AiGraphicsWorkerHandoffEvidence {
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  artifactBoundaryApproved?: boolean
  privateArtifactManifestRef?: string
  routeApprovalRef?: string
  workerApprovalRef?: string
  workerQueueTransportReady?: boolean
  workerIdempotencyKeyReady?: boolean
  nativeGpuRuntimeProofPassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  modelWeightManifestsApproved?: boolean
  modelWeightManifestReviewPacketAccepted?: boolean
  internalBetaOwnerApprovalGranted?: boolean
}

export interface AiGraphicsWorkerHandoffToolPacket {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsToolCallHandoffTool['runtimeTarget']
  workItemKind: string
  requiresApprovedSnapshot: true
  requiresCreditReservation: true
  requiresPrivateArtifactManifest: true
  requiresIdempotencyKey: true
  requiresWorkerApproval: true
  gpuRequiredForRuntime: boolean
  modelWeightsRequired: boolean
  canQueueWorkerNow: false
  canExecuteWorkerNow: false
  cpuFallbackAllowedForHeavyTool: false
  blockedReasons: string[]
  nextProofMilestone: string
}

export interface AiGraphicsWorkerHandoffReadinessContract {
  decision: typeof AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION
  sourceToolRouteReadinessDecision: typeof AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION
  sourceBetaGateDecision: typeof AI_GRAPHICS_BETA_READINESS_GATE_DECISION
  totalTools: 21
  totalCapabilities: 12
  workerHandoffPacketsPrepared: 21
  workerQueueReadyTools: 0
  workerExecutableTools: 0
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  heavyToolsIncorrectlyTargetingCpu: 0
  routeCanReturnPlanningMetadataNow: true
  workerHandoffCanPreparePacketsNow: true
  workerCanExecuteToolsNow: false
  evidence: Required<AiGraphicsWorkerHandoffEvidence>
  requiredWorkerInputsBeforeQueue: string[]
  blockedWorkerActions: string[]
  toolPackets: AiGraphicsWorkerHandoffToolPacket[]
  globalBlockers: string[]
}

const defaultEvidence: Required<AiGraphicsWorkerHandoffEvidence> = {
  approvedPlanSnapshotId: '',
  creditReservationId: '',
  artifactBoundaryApproved: false,
  privateArtifactManifestRef: '',
  routeApprovalRef: '',
  workerApprovalRef: '',
  workerQueueTransportReady: false,
  workerIdempotencyKeyReady: false,
  nativeGpuRuntimeProofPassed: false,
  browserCanvasWebglSandboxPassed: false,
  modelWeightManifestsApproved: false,
  modelWeightManifestReviewPacketAccepted: false,
  internalBetaOwnerApprovalGranted: false,
}

const requiredWorkerInputsBeforeQueue = [
  'approved plan snapshot id',
  'credit reservation id',
  'artifact boundary approval',
  'private artifact manifest reference',
  'Tool Route approval reference',
  'Worker approval reference',
  'idempotency key',
  'worker queue or transport readiness',
  'runtime proof accepted by beta readiness gate',
  'internal beta owner approval',
]

const blockedWorkerActions = [
  'worker queue enqueue',
  'worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta unlock',
  'external beta unlock',
  'production unlock',
]

function normalizeEvidence(
  evidence: AiGraphicsWorkerHandoffEvidence = {},
): Required<AiGraphicsWorkerHandoffEvidence> {
  return {
    ...defaultEvidence,
    ...evidence,
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

function isUuidRef(ref: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)
}

function approvedPlanSnapshotRefAccepted(ref: string): boolean {
  return isUuidRef(ref) || /^approved_snapshot_[a-z0-9_]+$/i.test(ref)
}

function creditReservationRefAccepted(ref: string): boolean {
  return isUuidRef(ref) || /^credit_reservation_[a-z0-9_]+$/i.test(ref)
}

function workItemKindForTool(tool: AiGraphicsToolCallHandoffTool): string {
  if (tool.gpuRequiredForRuntime) return 'ai_graphics_gpu_model_worker_job'
  if (tool.runtimeTarget === 'node_cpu_static') return 'ai_graphics_cpu_static_worker_job'
  if (tool.runtimeTarget === 'browser_chart_runtime_later') return 'ai_graphics_browser_chart_worker_job'
  if (tool.runtimeTarget === 'browser_animation_runtime_later') return 'ai_graphics_browser_animation_worker_job'
  if (tool.runtimeTarget === 'browser_canvas_webgl_runtime_later') return 'ai_graphics_browser_canvas_webgl_worker_job'
  return 'ai_graphics_planning_metadata_worker_packet'
}

function buildGlobalBlockers(evidence: Required<AiGraphicsWorkerHandoffEvidence>): string[] {
  return [
    !evidence.approvedPlanSnapshotId ? 'approved plan snapshot id is missing' : undefined,
    evidence.approvedPlanSnapshotId && !approvedPlanSnapshotRefAccepted(evidence.approvedPlanSnapshotId)
      ? 'approved plan snapshot id must be a UUID or explicit approved_snapshot_* fixture ref'
      : undefined,
    !evidence.creditReservationId ? 'credit reservation id is missing' : undefined,
    evidence.creditReservationId && !creditReservationRefAccepted(evidence.creditReservationId)
      ? 'credit reservation id must be a UUID or explicit credit_reservation_* fixture ref'
      : undefined,
    !evidence.artifactBoundaryApproved ? 'artifact boundary approval is missing' : undefined,
    !evidence.privateArtifactManifestRef ? 'private artifact manifest reference is missing' : undefined,
    evidence.privateArtifactManifestRef && !privateArtifactManifestOnly(evidence.privateArtifactManifestRef)
      ? 'private artifact manifest reference must use a private-only scheme'
      : undefined,
    !evidence.routeApprovalRef ? 'Tool Route approval reference is missing' : undefined,
    !evidence.workerApprovalRef ? 'Worker approval reference is missing' : undefined,
    !evidence.workerIdempotencyKeyReady ? 'worker idempotency key is not ready' : undefined,
    !evidence.workerQueueTransportReady ? 'worker queue or transport is not ready' : undefined,
    !evidence.internalBetaOwnerApprovalGranted ? 'internal beta owner approval is not granted' : undefined,
  ].filter((blocker): blocker is string => Boolean(blocker))
}

function asBetaReadinessEvidence(
  evidence: Required<AiGraphicsWorkerHandoffEvidence>,
): Required<AiGraphicsBetaReadinessEvidence> {
  return {
    approvedPlanSnapshotGatePassed: approvedPlanSnapshotRefAccepted(evidence.approvedPlanSnapshotId),
    creditReservationGatePassed: creditReservationRefAccepted(evidence.creditReservationId),
    artifactBoundaryGatePassed: evidence.artifactBoundaryApproved,
    toolRouteGatePassed: Boolean(evidence.routeApprovalRef),
    workerGatePassed: Boolean(evidence.workerApprovalRef),
    browserCanvasWebglSandboxPassed: evidence.browserCanvasWebglSandboxPassed,
    nativeGpuRuntimeProofPassed: evidence.nativeGpuRuntimeProofPassed,
    modelWeightManifestsApproved: evidence.modelWeightManifestsApproved,
    modelWeightManifestReviewPacketAccepted: evidence.modelWeightManifestReviewPacketAccepted,
    internalBetaOwnerApprovalGranted: evidence.internalBetaOwnerApprovalGranted,
  }
}

function buildRuntimeBlockers(
  tool: AiGraphicsToolCallHandoffTool,
  evidence: Required<AiGraphicsWorkerHandoffEvidence>,
): string[] {
  const blockers: string[] = []

  if (tool.gpuRequiredForRuntime && !evidence.nativeGpuRuntimeProofPassed) {
    blockers.push(`${tool.toolId} requires native NVIDIA GPU runtime proof before worker execution.`)
  }

  if (tool.gpuRequiredForRuntime && !tool.runtimeTarget.includes('nvidia_l4')) {
    blockers.push(`${tool.toolId} is GPU-heavy but is not targeted to the native NVIDIA L4 runtime.`)
  }

  if (
    (tool.runtimeTarget === 'browser_chart_runtime_later' ||
      tool.runtimeTarget === 'browser_animation_runtime_later' ||
      tool.runtimeTarget === 'browser_canvas_webgl_runtime_later') &&
    !evidence.browserCanvasWebglSandboxPassed
  ) {
    blockers.push(`${tool.toolId} requires approved browser/canvas/WebGL sandbox proof before worker execution.`)
  }

  if (
    ['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background'].includes(tool.toolId) &&
    !evidence.modelWeightManifestsApproved
  ) {
    blockers.push(`${tool.toolId} requires reviewed model-weight manifests before worker execution.`)
  }

  return blockers
}

function modelWeightsRequiredForTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return ['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background'].includes(toolId)
}

function asToolPacket(
  tool: AiGraphicsToolCallHandoffTool,
  evidence: Required<AiGraphicsWorkerHandoffEvidence>,
  globalBlockers: string[],
): AiGraphicsWorkerHandoffToolPacket {
  const blockedReasons = Array.from(new Set([
    ...globalBlockers,
    ...tool.blockersBeforeExecution,
    ...buildRuntimeBlockers(tool, evidence),
  ]))

  return {
    toolId: tool.toolId,
    productionToolId: tool.productionToolId,
    workerType: tool.workerType,
    runtimeTarget: tool.runtimeTarget,
    workItemKind: workItemKindForTool(tool),
    requiresApprovedSnapshot: true,
    requiresCreditReservation: true,
    requiresPrivateArtifactManifest: true,
    requiresIdempotencyKey: true,
    requiresWorkerApproval: true,
    gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
    modelWeightsRequired: modelWeightsRequiredForTool(tool.toolId),
    canQueueWorkerNow: false,
    canExecuteWorkerNow: false,
    cpuFallbackAllowedForHeavyTool: false,
    blockedReasons,
    nextProofMilestone: tool.nextProofMilestone,
  }
}

export function buildAiGraphicsWorkerHandoffReadinessContract(
  evidenceInput: AiGraphicsWorkerHandoffEvidence = {},
): AiGraphicsWorkerHandoffReadinessContract {
  const evidence = normalizeEvidence(evidenceInput)
  const globalBlockers = buildGlobalBlockers(evidence)
  const routeReadiness = buildAiGraphicsToolRouteReadinessContract()
  const betaGate = buildAiGraphicsBetaReadinessGate(asBetaReadinessEvidence(evidence))
  const handoff = buildAiGraphicsToolCallHandoffContract()
  const toolPackets = listAiGraphicsToolCallHandoffTools().map((tool) => asToolPacket(tool, evidence, [
    ...globalBlockers,
    ...betaGate.globalBlockers,
  ]))

  return {
    decision: AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION,
    sourceToolRouteReadinessDecision: routeReadiness.decision,
    sourceBetaGateDecision: betaGate.decision,
    totalTools: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    totalCapabilities: handoff.allCapabilitiesCovered,
    workerHandoffPacketsPrepared: toolPackets.length as 21,
    workerQueueReadyTools: 0,
    workerExecutableTools: 0,
    gpuRuntimeTargetedTools: betaGate.gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: betaGate.heavyToolsIncorrectlyTargetingCpu,
    routeCanReturnPlanningMetadataNow: true,
    workerHandoffCanPreparePacketsNow: true,
    workerCanExecuteToolsNow: false,
    evidence,
    requiredWorkerInputsBeforeQueue,
    blockedWorkerActions,
    toolPackets,
    globalBlockers: Array.from(new Set(toolPackets.flatMap((packet) => packet.blockedReasons))),
  }
}
