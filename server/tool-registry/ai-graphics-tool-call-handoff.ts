import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_READINESS_DECISION,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsCapabilitySelections,
  listAiGraphicsToolCallReadiness,
  selectAiGraphicsPlanningToolsForCapability,
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsToolCallReadinessRecord,
} from './ai-graphics-tool-call-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION =
  'ai_graphics_tool_call_handoff_contract_prepared_with_execution_blocks'

export type AiGraphicsToolCallOwnerRoute = 'AI_TOOLS_CREATIVE_GRAPHICS'

export interface AiGraphicsToolCallExecutionFlags {
  agentCanSelectForPlanning: true
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  modelWeightsApprovedNow: false
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  artifactBoundaryApprovalRequired: true
  runtimeReadyNow: false
  internalBetaReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
}

export interface AiGraphicsToolCallHandoffTool {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  capabilities: AiGraphicsCapabilityId[]
  rankingTier: AiGraphicsToolCallReadinessRecord['rankingTier']
  totalScore: number
  runtimeTarget: AiGraphicsToolCallReadinessRecord['runtimeTarget']
  gpuRequiredForRuntime: boolean
  canSelectForPlanning: true
  canExecuteNow: false
  blockersBeforeExecution: string[]
  nextProofMilestone: string
}

export interface AiGraphicsToolCallHandoffCapability {
  capabilityId: AiGraphicsCapabilityId
  ownerRoute: AiGraphicsToolCallOwnerRoute
  selectedPlanningTools: AiGraphicsToolCallHandoffTool[]
  preferredPlanningTools: AiGraphicsCanonicalToolId[]
  conditionalPlanningTools: AiGraphicsCanonicalToolId[]
  fallbackPlanningTools: AiGraphicsCanonicalToolId[]
  eliminatedTools: AiGraphicsCanonicalToolId[]
  missingProofBeforeExecution: string[]
  executionFlags: AiGraphicsToolCallExecutionFlags
}

export interface AiGraphicsToolCallHandoffContract {
  decision: typeof AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION
  sourceDecision: typeof AI_GRAPHICS_TOOL_CALL_READINESS_DECISION
  ownerRoute: AiGraphicsToolCallOwnerRoute
  allToolsCovered: 21
  allCapabilitiesCovered: 12
  productionToolMappings: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  capabilities: AiGraphicsToolCallHandoffCapability[]
  tools: AiGraphicsToolCallHandoffTool[]
  executionFlags: AiGraphicsToolCallExecutionFlags
  handoffRequirements: string[]
}

const executionFlags: AiGraphicsToolCallExecutionFlags = {
  agentCanSelectForPlanning: true,
  agentCanExecuteToolsNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  browserWebglCanvasRuntimeApprovedNow: false,
  gpuRuntimeApprovedNow: false,
  modelWeightsApprovedNow: false,
  approvedPlanSnapshotRequired: true,
  creditReservationRequired: true,
  artifactBoundaryApprovalRequired: true,
  runtimeReadyNow: false,
  internalBetaReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}

const handoffRequirements = [
  'approved plan snapshot with explicit AI graphics capability selection',
  'credit reservation and user approval before any Worker or Tool Route execution',
  'Tool Route approval must consume productionToolId, workerType, runtimeTarget, and blockersBeforeExecution',
  'Worker handoff must use private artifact manifests and must not use raw chat prompts as execution input',
  'GPU/model tools require native NVIDIA L4 runtime proof and reviewed model manifests before execution',
  'browser/canvas/WebGL tools require approved sandbox or worker runtime proof before execution',
  'public artifact and signed URL creation remain blocked until artifact-boundary approval',
]

function asHandoffTool(readiness: AiGraphicsToolCallReadinessRecord): AiGraphicsToolCallHandoffTool {
  if (!readiness.productionToolId) {
    throw new Error(`AI graphics tool is missing production mapping: ${readiness.toolId}`)
  }

  const productionProfile = getAiGraphicsMappedProductionProfile(readiness.toolId)
  if (!productionProfile) {
    throw new Error(`AI graphics mapped production profile is missing: ${readiness.toolId}`)
  }

  return {
    toolId: readiness.toolId,
    productionToolId: readiness.productionToolId,
    workerType: productionProfile.workerType,
    capabilities: [...readiness.capabilities],
    rankingTier: readiness.rankingTier,
    totalScore: readiness.rankingScore.totalScore,
    runtimeTarget: readiness.runtimeTarget,
    gpuRequiredForRuntime: readiness.gpuRequiredForRuntime,
    canSelectForPlanning: true,
    canExecuteNow: false,
    blockersBeforeExecution: [...readiness.blockersBeforeExecution],
    nextProofMilestone: readiness.nextProofMilestone,
  }
}

export function listAiGraphicsToolCallHandoffTools(): AiGraphicsToolCallHandoffTool[] {
  return listAiGraphicsToolCallReadiness().map(asHandoffTool)
}

export function buildAiGraphicsToolCallHandoffCapability(
  capabilityId: AiGraphicsCapabilityId,
): AiGraphicsToolCallHandoffCapability | undefined {
  const selection = listAiGraphicsCapabilitySelections().find((record) => record.capabilityId === capabilityId)
  if (!selection) return undefined

  return {
    capabilityId,
    ownerRoute: 'AI_TOOLS_CREATIVE_GRAPHICS',
    selectedPlanningTools: selectAiGraphicsPlanningToolsForCapability(capabilityId).map(asHandoffTool),
    preferredPlanningTools: [...selection.preferredPlanningTools],
    conditionalPlanningTools: [...selection.conditionalPlanningTools],
    fallbackPlanningTools: [...selection.fallbackPlanningTools],
    eliminatedTools: [...selection.eliminatedTools],
    missingProofBeforeExecution: [...selection.requiredProofBeforeExecution],
    executionFlags,
  }
}

export function buildAiGraphicsToolCallHandoffContract(): AiGraphicsToolCallHandoffContract {
  const tools = listAiGraphicsToolCallHandoffTools()
  const capabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .map((capabilityId) => buildAiGraphicsToolCallHandoffCapability(capabilityId))
    .filter((capability): capability is AiGraphicsToolCallHandoffCapability => Boolean(capability))
  const gpuRuntimeTargetedTools = tools
    .filter((tool) => tool.gpuRequiredForRuntime)
    .map((tool) => tool.toolId)

  return {
    decision: AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
    sourceDecision: AI_GRAPHICS_TOOL_CALL_READINESS_DECISION,
    ownerRoute: 'AI_TOOLS_CREATIVE_GRAPHICS',
    allToolsCovered: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    allCapabilitiesCovered: capabilities.length as 12,
    productionToolMappings: tools.length as 21,
    gpuRuntimeTargetedTools,
    capabilities,
    tools,
    executionFlags,
    handoffRequirements,
  }
}

export function selectAiGraphicsToolCallHandoffForCapability(
  capabilityId: AiGraphicsCapabilityId | string,
): AiGraphicsToolCallHandoffCapability | undefined {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.includes(capabilityId as AiGraphicsCapabilityId)
    ? buildAiGraphicsToolCallHandoffCapability(capabilityId as AiGraphicsCapabilityId)
    : undefined
}
