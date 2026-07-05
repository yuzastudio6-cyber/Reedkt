import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION,
  buildAiGraphicsBetaExecutionHandoffReadiness,
  type AiGraphicsBetaExecutionHandoffReadiness,
  type AiGraphicsBetaExecutionHandoffReadinessInput,
} from './ai-graphics-beta-execution-handoff-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION =
  'ai_graphics_internal_beta_dry_run_readiness_contract_prepared_with_fail_closed_runtime'

export type AiGraphicsInternalBetaDryRunReadinessStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_metadata_dry_run_ready'

export interface AiGraphicsInternalBetaDryRunReadinessInput
  extends AiGraphicsBetaExecutionHandoffReadinessInput {}

export interface AiGraphicsInternalBetaDryRunToolCase {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  metadataDryRunCasePrepared: true
  ownerApprovedHandoffEvidenceReady: boolean
  metadataDryRunReadyWithProvidedEvidence: boolean
  metadataDryRunReadyNow: false
  canExecuteToolNow: false
  canQueueWorkerNow: false
  canRunRouteNow: false
  expectedBetaDryRunAssertions: string[]
  blockedRuntimeActions: string[]
  nextProofMilestone: string
}

export interface AiGraphicsInternalBetaDryRunCapabilityCase {
  capabilityId: AiGraphicsCapabilityId
  selectedPlanningTools: AiGraphicsCanonicalToolId[]
  metadataDryRunReadyToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  metadataDryRunScenarioPrepared: true
  metadataDryRunReadyWithProvidedEvidence: boolean
  metadataDryRunReadyNow: false
  canExecuteToolsNow: false
  expectedBetaDryRunAssertions: string[]
}

export interface AiGraphicsInternalBetaDryRunReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION
  sourceBetaExecutionHandoffDecision: typeof AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION
  status: AiGraphicsInternalBetaDryRunReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  metadataDryRunToolCasesPrepared: 21
  metadataDryRunCapabilityScenariosPrepared: 12
  metadataDryRunReadyToolsWithProvidedEvidence: number
  metadataDryRunReadyCapabilitiesWithProvidedEvidence: number
  metadataDryRunReadyToolsNow: 0
  metadataDryRunReadyCapabilitiesNow: 0
  sourceOwnerApprovedHandoffAccepted: boolean
  internalBetaMetadataDryRunReadyWithProvidedEvidence: boolean
  internalBetaMetadataDryRunReadyNow: false
  sourceHandoffReadiness: AiGraphicsBetaExecutionHandoffReadiness
  allowedMetadataDryRunActions: string[]
  blockedRuntimeActions: string[]
  toolCases: AiGraphicsInternalBetaDryRunToolCase[]
  capabilityCases: AiGraphicsInternalBetaDryRunCapabilityCase[]
  booleans: {
    internalBetaDryRunReadinessContractPrepared: true
    sourceOwnerApprovedHandoffAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21MetadataDryRunCasesPrepared: true
    all12CapabilityMetadataDryRunScenariosPrepared: true
    all21ToolsReadyForMetadataDryRunWithProvidedEvidence: boolean
    all12CapabilitiesReadyForMetadataDryRunWithProvidedEvidence: boolean
    internalBetaMetadataDryRunReadyWithProvidedEvidence: boolean
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

const allowedMetadataDryRunActions = [
  'read owner-approved AI graphics beta evidence packet',
  'build planning metadata tool selections for each product-facing capability',
  'build Tool Route metadata handoff packets without route execution',
  'build Worker metadata handoff packets without queueing or execution',
  'verify ranking, elimination, fallback, missing-proof, and blocker metadata',
  'return next proof milestones and execution blockers for user or owner review',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue',
  'Worker execution',
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

const expectedToolAssertions = [
  'tool is represented in the 21-tool readiness matrix',
  'tool has productionToolId and workerType mapping',
  'tool has runtimeTarget metadata',
  'tool has ranking/capability metadata',
  'tool remains execution-blocked in the metadata dry-run',
]

const expectedCapabilityAssertions = [
  'capability has selected planning tools',
  'capability uses ranking and elimination metadata',
  'capability has owner-approved handoff-ready tools with provided evidence',
  'capability remains execution-blocked in the metadata dry-run',
]

function statusFromHandoff(
  handoff: AiGraphicsBetaExecutionHandoffReadiness,
): AiGraphicsInternalBetaDryRunReadinessStatus {
  if (handoff.status === 'missing_technical_evidence') return 'missing_technical_evidence'
  if (handoff.status === 'awaiting_owner_approval') return 'awaiting_owner_approval'
  return handoff.ownerApprovedEvidenceReadyForRouteWorkerHandoff
    ? 'owner_approved_metadata_dry_run_ready'
    : 'missing_technical_evidence'
}

export function buildAiGraphicsInternalBetaDryRunReadiness(
  input: AiGraphicsInternalBetaDryRunReadinessInput = {},
): AiGraphicsInternalBetaDryRunReadiness {
  const sourceHandoffReadiness = buildAiGraphicsBetaExecutionHandoffReadiness(input)
  const status = statusFromHandoff(sourceHandoffReadiness)
  const sourceOwnerApprovedHandoffAccepted =
    sourceHandoffReadiness.ownerApprovedEvidenceReadyForRouteWorkerHandoff

  const toolCases = sourceHandoffReadiness.tools.map((tool): AiGraphicsInternalBetaDryRunToolCase => ({
    toolId: tool.toolId,
    productionToolId: tool.productionToolId,
    workerType: tool.workerType,
    runtimeTarget: tool.runtimeTarget,
    metadataDryRunCasePrepared: true,
    ownerApprovedHandoffEvidenceReady: tool.betaExecutionHandoffReadyWithProvidedEvidence,
    metadataDryRunReadyWithProvidedEvidence: tool.betaExecutionHandoffReadyWithProvidedEvidence,
    metadataDryRunReadyNow: false,
    canExecuteToolNow: false,
    canQueueWorkerNow: false,
    canRunRouteNow: false,
    expectedBetaDryRunAssertions: expectedToolAssertions,
    blockedRuntimeActions,
    nextProofMilestone: tool.nextProofMilestone,
  }))

  const capabilityCases = sourceHandoffReadiness.capabilities.map((capability): AiGraphicsInternalBetaDryRunCapabilityCase => {
    const metadataDryRunReadyWithProvidedEvidence =
      capability.ownerApprovedHandoffReadyToolsWithProvidedEvidence.length > 0

    return {
      capabilityId: capability.capabilityId,
      selectedPlanningTools: capability.selectedPlanningTools,
      metadataDryRunReadyToolsWithProvidedEvidence:
        capability.ownerApprovedHandoffReadyToolsWithProvidedEvidence,
      metadataDryRunScenarioPrepared: true,
      metadataDryRunReadyWithProvidedEvidence,
      metadataDryRunReadyNow: false,
      canExecuteToolsNow: false,
      expectedBetaDryRunAssertions: expectedCapabilityAssertions,
    }
  })

  const metadataDryRunReadyToolsWithProvidedEvidence =
    toolCases.filter((tool) => tool.metadataDryRunReadyWithProvidedEvidence).length
  const metadataDryRunReadyCapabilitiesWithProvidedEvidence =
    capabilityCases.filter((capability) => capability.metadataDryRunReadyWithProvidedEvidence).length
  const all21ToolsReadyForMetadataDryRunWithProvidedEvidence =
    metadataDryRunReadyToolsWithProvidedEvidence === 21
  const all12CapabilitiesReadyForMetadataDryRunWithProvidedEvidence =
    metadataDryRunReadyCapabilitiesWithProvidedEvidence === 12
  const internalBetaMetadataDryRunReadyWithProvidedEvidence =
    status === 'owner_approved_metadata_dry_run_ready' &&
    all21ToolsReadyForMetadataDryRunWithProvidedEvidence &&
    all12CapabilitiesReadyForMetadataDryRunWithProvidedEvidence

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION,
    sourceBetaExecutionHandoffDecision: AI_GRAPHICS_BETA_EXECUTION_HANDOFF_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    metadataDryRunToolCasesPrepared: toolCases.length as 21,
    metadataDryRunCapabilityScenariosPrepared: capabilityCases.length as 12,
    metadataDryRunReadyToolsWithProvidedEvidence,
    metadataDryRunReadyCapabilitiesWithProvidedEvidence,
    metadataDryRunReadyToolsNow: 0,
    metadataDryRunReadyCapabilitiesNow: 0,
    sourceOwnerApprovedHandoffAccepted,
    internalBetaMetadataDryRunReadyWithProvidedEvidence,
    internalBetaMetadataDryRunReadyNow: false,
    sourceHandoffReadiness,
    allowedMetadataDryRunActions,
    blockedRuntimeActions,
    toolCases,
    capabilityCases,
    booleans: {
      internalBetaDryRunReadinessContractPrepared: true,
      sourceOwnerApprovedHandoffAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21MetadataDryRunCasesPrepared: true,
      all12CapabilityMetadataDryRunScenariosPrepared: true,
      all21ToolsReadyForMetadataDryRunWithProvidedEvidence,
      all12CapabilitiesReadyForMetadataDryRunWithProvidedEvidence,
      internalBetaMetadataDryRunReadyWithProvidedEvidence,
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
