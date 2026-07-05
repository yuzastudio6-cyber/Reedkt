import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  buildAiGraphicsToolCallHandoffCapability,
  listAiGraphicsToolCallHandoffTools,
  type AiGraphicsToolCallHandoffTool,
} from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION,
  buildAiGraphicsToolRouteReadinessContract,
} from './ai-graphics-tool-route-readiness'
import {
  AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION,
  buildAiGraphicsWorkerHandoffReadinessContract,
  type AiGraphicsWorkerHandoffEvidence,
} from './ai-graphics-worker-handoff-readiness'
import {
  AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION,
  buildAiGraphicsInternalBetaOwnerApproval,
  type AiGraphicsInternalBetaOwnerApproval,
  type AiGraphicsInternalBetaOwnerApprovalInput,
} from './ai-graphics-internal-beta-owner-approval'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION =
  'ai_graphics_beta_execution_handoff_readiness_contract_prepared_with_fail_closed_runtime'

export type AiGraphicsBetaExecutionHandoffReadinessStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_beta_execution_handoff_ready'

export interface AiGraphicsBetaExecutionHandoffReadinessInput
  extends AiGraphicsInternalBetaOwnerApprovalInput {}

export interface AiGraphicsBetaExecutionHandoffTool {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsToolCallHandoffTool['runtimeTarget']
  gpuRequiredForRuntime: boolean
  ownerApprovedEvidenceReady: boolean
  betaExecutionHandoffReadyWithProvidedEvidence: boolean
  betaExecutionHandoffReadyNow: false
  canExecuteNow: false
  missingEvidenceBeforeHandoff: string[]
  blockedRuntimeActions: string[]
  nextProofMilestone: string
}

export interface AiGraphicsBetaExecutionHandoffCapability {
  capabilityId: AiGraphicsCapabilityId
  selectedPlanningTools: AiGraphicsCanonicalToolId[]
  ownerApprovedHandoffReadyToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  betaExecutionHandoffReadyToolsNow: []
  canReturnPlanningMetadataNow: true
  canExecuteNow: false
  missingEvidenceBeforeHandoff: string[]
}

export interface AiGraphicsBetaExecutionHandoffReadiness {
  decision: typeof AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION
  sourceOwnerApprovalDecision: typeof AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION
  sourceToolRouteReadinessDecision: typeof AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION
  sourceWorkerHandoffReadinessDecision: typeof AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION
  status: AiGraphicsBetaExecutionHandoffReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  ownerApprovedHandoffReadyToolsWithProvidedEvidence: number
  ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence: number
  betaExecutionHandoffReadyNowTools: 0
  betaExecutionHandoffReadyNowCapabilities: 0
  sourceOwnerApprovalAccepted: boolean
  sourceTechnicalEvidenceAccepted: boolean
  routeWorkerHandoffCanConsumeOwnerApprovedEvidence: boolean
  ownerApprovedEvidenceReadyForRouteWorkerHandoff: boolean
  workerHandoffEvidenceInput: Required<AiGraphicsWorkerHandoffEvidence>
  ownerApproval: AiGraphicsInternalBetaOwnerApproval
  tools: AiGraphicsBetaExecutionHandoffTool[]
  capabilities: AiGraphicsBetaExecutionHandoffCapability[]
  missingEvidenceBeforeHandoff: string[]
  requiredRouteWorkerHandoffInputs: string[]
  blockedRuntimeActions: string[]
  booleans: {
    betaExecutionHandoffReadinessContractPrepared: true
    sourceInternalBetaOwnerApprovalAccepted: boolean
    sourceTechnicalEvidenceAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsReadyForBetaExecutionHandoffWithProvidedEvidence: boolean
    all12CapabilitiesReadyForBetaExecutionHandoffWithProvidedEvidence: boolean
    routeWorkerHandoffCanConsumeOwnerApprovedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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

const productFacingCapabilityIds = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capabilityId) => (
  capabilityId !== 'planning_metadata_only' &&
  capabilityId !== 'blocked_or_deferred'
))

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker execution',
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

const requiredRouteWorkerHandoffInputs = [
  'owner-approved all-21 beta evidence bundle',
  'approved plan snapshot reference',
  'credit reservation reference',
  'artifact boundary approval',
  'Tool Route approval reference',
  'Worker approval reference',
  'private artifact manifest reference',
  'worker queue or transport readiness',
  'idempotency key policy',
]

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildStatus(
  ownerApproval: AiGraphicsInternalBetaOwnerApproval,
): AiGraphicsBetaExecutionHandoffReadinessStatus {
  if (!ownerApproval.technicalEvidenceReadyForOwnerGate) return 'missing_technical_evidence'
  if (!ownerApproval.ownerApprovalRecordAccepted) return 'awaiting_owner_approval'
  return ownerApproval.all21BetaEvidenceReadyAfterOwnerApproval
    ? 'owner_approved_beta_execution_handoff_ready'
    : 'missing_technical_evidence'
}

function buildWorkerEvidenceInput(
  ownerApproval: AiGraphicsInternalBetaOwnerApproval,
  ownerApprovedEvidenceReady: boolean,
): Required<AiGraphicsWorkerHandoffEvidence> {
  const evidence = ownerApproval.approvedEvidenceBundle.evidence

  return {
    approvedPlanSnapshotId: ownerApprovedEvidenceReady
      ? 'approved_snapshot_ai_graphics_owner_approved_beta_evidence_fixture'
      : '',
    creditReservationId: ownerApprovedEvidenceReady
      ? 'credit_reservation_ai_graphics_owner_approved_beta_evidence_fixture'
      : '',
    artifactBoundaryApproved: ownerApprovedEvidenceReady,
    privateArtifactManifestRef: ownerApprovedEvidenceReady
      ? 'private://ai-graphics/internal-beta/owner-approved-artifact-manifest.json'
      : '',
    routeApprovalRef: ownerApprovedEvidenceReady
      ? 'AI_GRAPHICS_OWNER_APPROVED_ROUTE_HANDOFF_EVIDENCE'
      : '',
    workerApprovalRef: ownerApprovedEvidenceReady
      ? 'AI_GRAPHICS_OWNER_APPROVED_WORKER_HANDOFF_EVIDENCE'
      : '',
    workerQueueTransportReady: ownerApprovedEvidenceReady,
    workerIdempotencyKeyReady: ownerApprovedEvidenceReady,
    nativeGpuRuntimeProofPassed: evidence.nativeGpuRuntimeProofPassed,
    browserCanvasWebglSandboxPassed: evidence.browserCanvasWebglSandboxPassed,
    modelWeightManifestsApproved: evidence.modelWeightManifestsApproved,
    modelWeightManifestReviewPacketAccepted: evidence.modelWeightManifestReviewPacketAccepted,
    internalBetaOwnerApprovalGranted: ownerApproval.ownerApprovalRecordAccepted,
  }
}

export function buildAiGraphicsBetaExecutionHandoffReadiness(
  input: AiGraphicsBetaExecutionHandoffReadinessInput = {},
): AiGraphicsBetaExecutionHandoffReadiness {
  const ownerApproval = buildAiGraphicsInternalBetaOwnerApproval(input)
  const status = buildStatus(ownerApproval)
  const ownerApprovedEvidenceReady = status === 'owner_approved_beta_execution_handoff_ready'
  const workerHandoffEvidenceInput = buildWorkerEvidenceInput(ownerApproval, ownerApprovedEvidenceReady)
  const routeReadiness = buildAiGraphicsToolRouteReadinessContract()
  const workerHandoffReadiness = buildAiGraphicsWorkerHandoffReadinessContract(workerHandoffEvidenceInput)
  const betaToolReadiness = ownerApproval.betaToolCallReadinessAfterOwnerApproval
  const missingEvidenceBeforeHandoff = unique([
    ...ownerApproval.missingTechnicalEvidenceBeforeOwnerApproval,
    ...ownerApproval.missingOwnerApprovalEvidence,
    ...(!ownerApprovedEvidenceReady ? ['owner_approved_all21_beta_evidence_ready'] : []),
  ])

  const tools = listAiGraphicsToolCallHandoffTools().map((tool): AiGraphicsBetaExecutionHandoffTool => {
    const betaTool = betaToolReadiness.tools.find((record) => record.toolId === tool.toolId)
    const betaExecutionHandoffReadyWithProvidedEvidence =
      ownerApprovedEvidenceReady &&
      betaTool?.betaToolCallableWithProvidedEvidence === true

    return {
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.workerType,
      runtimeTarget: tool.runtimeTarget,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      ownerApprovedEvidenceReady: betaTool?.betaEvidenceReadyForTool === true,
      betaExecutionHandoffReadyWithProvidedEvidence,
      betaExecutionHandoffReadyNow: false,
      canExecuteNow: false,
      missingEvidenceBeforeHandoff: betaExecutionHandoffReadyWithProvidedEvidence
        ? []
        : unique([
          ...missingEvidenceBeforeHandoff,
          ...(betaTool?.missingEvidenceBeforeBetaToolCall ?? []),
        ]),
      blockedRuntimeActions,
      nextProofMilestone: tool.nextProofMilestone,
    }
  })

  const capabilities = productFacingCapabilityIds.map((capabilityId): AiGraphicsBetaExecutionHandoffCapability => {
    const handoffCapability = buildAiGraphicsToolCallHandoffCapability(capabilityId)
    const selectedPlanningTools = handoffCapability?.selectedPlanningTools.map((tool) => tool.toolId) ?? []
    const ownerApprovedHandoffReadyToolsWithProvidedEvidence = selectedPlanningTools.filter((toolId) => (
      tools.find((tool) => tool.toolId === toolId)?.betaExecutionHandoffReadyWithProvidedEvidence === true
    ))

    return {
      capabilityId,
      selectedPlanningTools,
      ownerApprovedHandoffReadyToolsWithProvidedEvidence,
      betaExecutionHandoffReadyToolsNow: [],
      canReturnPlanningMetadataNow: true,
      canExecuteNow: false,
      missingEvidenceBeforeHandoff: ownerApprovedHandoffReadyToolsWithProvidedEvidence.length > 0
        ? []
        : missingEvidenceBeforeHandoff,
    }
  })

  const ownerApprovedHandoffReadyToolsWithProvidedEvidence =
    tools.filter((tool) => tool.betaExecutionHandoffReadyWithProvidedEvidence).length
  const ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence =
    capabilities.filter((capability) => (
      capability.ownerApprovedHandoffReadyToolsWithProvidedEvidence.length > 0
    )).length
  const all21ToolsReadyForBetaExecutionHandoffWithProvidedEvidence =
    ownerApprovedHandoffReadyToolsWithProvidedEvidence === 21
  const all12CapabilitiesReadyForBetaExecutionHandoffWithProvidedEvidence =
    ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence === 12

  return {
    decision: AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION,
    sourceOwnerApprovalDecision: AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION,
    sourceToolRouteReadinessDecision: routeReadiness.decision,
    sourceWorkerHandoffReadinessDecision: workerHandoffReadiness.decision,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    ownerApprovedHandoffReadyToolsWithProvidedEvidence,
    ownerApprovedHandoffReadyCapabilitiesWithProvidedEvidence,
    betaExecutionHandoffReadyNowTools: 0,
    betaExecutionHandoffReadyNowCapabilities: 0,
    sourceOwnerApprovalAccepted: ownerApproval.ownerApprovalRecordAccepted,
    sourceTechnicalEvidenceAccepted: ownerApproval.technicalEvidenceReadyForOwnerGate,
    routeWorkerHandoffCanConsumeOwnerApprovedEvidence: ownerApprovedEvidenceReady,
    ownerApprovedEvidenceReadyForRouteWorkerHandoff: ownerApprovedEvidenceReady,
    workerHandoffEvidenceInput,
    ownerApproval,
    tools,
    capabilities,
    missingEvidenceBeforeHandoff,
    requiredRouteWorkerHandoffInputs,
    blockedRuntimeActions,
    booleans: {
      betaExecutionHandoffReadinessContractPrepared: true,
      sourceInternalBetaOwnerApprovalAccepted: ownerApproval.ownerApprovalRecordAccepted,
      sourceTechnicalEvidenceAccepted: ownerApproval.technicalEvidenceReadyForOwnerGate,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsReadyForBetaExecutionHandoffWithProvidedEvidence,
      all12CapabilitiesReadyForBetaExecutionHandoffWithProvidedEvidence,
      routeWorkerHandoffCanConsumeOwnerApprovedEvidence: ownerApprovedEvidenceReady,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
