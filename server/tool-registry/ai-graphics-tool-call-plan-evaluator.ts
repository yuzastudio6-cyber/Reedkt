import {
  buildAiGraphicsToolCallHandoffCapability,
  buildAiGraphicsToolCallHandoffContract,
  type AiGraphicsToolCallExecutionFlags,
  type AiGraphicsToolCallHandoffTool,
} from './ai-graphics-tool-call-handoff'
import type {
  AiGraphicsCanonicalToolId,
  AiGraphicsCapabilityId,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION =
  'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks'

export type AiGraphicsToolCallPlanDecision =
  | 'planning_metadata_selected'
  | 'execution_request_blocked'
  | 'invalid_capability_blocked'

export interface AiGraphicsToolCallPlanInput {
  capabilityId: AiGraphicsCapabilityId | string
  requestedToolIds?: string[]
  executionRequested?: boolean
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  artifactBoundaryApproved?: boolean
}

export interface AiGraphicsToolCallSelectedTool {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: AiGraphicsToolCallHandoffTool['productionToolId']
  workerType: AiGraphicsToolCallHandoffTool['workerType']
  rankingTier: AiGraphicsToolCallHandoffTool['rankingTier']
  totalScore: number
  runtimeTarget: AiGraphicsToolCallHandoffTool['runtimeTarget']
  gpuRequiredForRuntime: boolean
  canSelectForPlanning: true
  canExecuteNow: false
  blockersBeforeExecution: string[]
  nextProofMilestone: string
}

export interface AiGraphicsToolCallPlanEvaluation {
  decision: AiGraphicsToolCallPlanDecision
  sourceDecision: typeof AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION
  capabilityId: string
  validCapability: boolean
  executionRequested: boolean
  selectedTools: AiGraphicsToolCallSelectedTool[]
  requestedToolsAcceptedForPlanning: AiGraphicsCanonicalToolId[]
  requestedToolsEliminated: string[]
  preferredPlanningTools: AiGraphicsCanonicalToolId[]
  conditionalPlanningTools: AiGraphicsCanonicalToolId[]
  fallbackPlanningTools: AiGraphicsCanonicalToolId[]
  eliminatedTools: AiGraphicsCanonicalToolId[]
  missingProofBeforeExecution: string[]
  missingExecutionGates: string[]
  executionFlags: AiGraphicsToolCallExecutionFlags
}

const requiredExecutionGates = [
  'approved plan snapshot is required before execution',
  'credit reservation is required before execution',
  'artifact boundary approval is required before execution',
  'Tool Route execution approval is required',
  'Worker execution approval is required',
  'runtime-specific proof must be complete before execution',
]

function asSelectedTool(tool: AiGraphicsToolCallHandoffTool): AiGraphicsToolCallSelectedTool {
  return {
    toolId: tool.toolId,
    productionToolId: tool.productionToolId,
    workerType: tool.workerType,
    rankingTier: tool.rankingTier,
    totalScore: tool.totalScore,
    runtimeTarget: tool.runtimeTarget,
    gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
    canSelectForPlanning: true,
    canExecuteNow: false,
    blockersBeforeExecution: [...tool.blockersBeforeExecution],
    nextProofMilestone: tool.nextProofMilestone,
  }
}

function normalizeRequestedTools(input?: string[]): string[] {
  return Array.from(new Set((input ?? []).filter(Boolean)))
}

function buildMissingExecutionGates(input: AiGraphicsToolCallPlanInput): string[] {
  return [
    !input.approvedPlanSnapshotId ? 'approved plan snapshot is missing' : undefined,
    !input.creditReservationId ? 'credit reservation is missing' : undefined,
    input.artifactBoundaryApproved !== true ? 'artifact boundary approval is missing' : undefined,
    ...requiredExecutionGates.slice(3),
  ].filter((gate): gate is string => Boolean(gate))
}

export function evaluateAiGraphicsToolCallPlan(
  input: AiGraphicsToolCallPlanInput,
): AiGraphicsToolCallPlanEvaluation {
  const capability = buildAiGraphicsToolCallHandoffCapability(input.capabilityId as AiGraphicsCapabilityId)
  const contract = buildAiGraphicsToolCallHandoffContract()
  const requested = normalizeRequestedTools(input.requestedToolIds)

  if (!capability) {
    return {
      decision: 'invalid_capability_blocked',
      sourceDecision: AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
      capabilityId: input.capabilityId,
      validCapability: false,
      executionRequested: input.executionRequested === true,
      selectedTools: [],
      requestedToolsAcceptedForPlanning: [],
      requestedToolsEliminated: requested,
      preferredPlanningTools: [],
      conditionalPlanningTools: [],
      fallbackPlanningTools: [],
      eliminatedTools: [],
      missingProofBeforeExecution: ['capability is not part of the AI graphics product-facing selection map'],
      missingExecutionGates: buildMissingExecutionGates(input),
      executionFlags: contract.executionFlags,
    }
  }

  const rankedTools = requested.length > 0
    ? capability.selectedPlanningTools.filter((tool) => requested.includes(tool.toolId))
    : capability.selectedPlanningTools
  const acceptedToolIds = rankedTools.map((tool) => tool.toolId)
  const requestedToolsEliminated = requested.filter((toolId) => !acceptedToolIds.includes(toolId as AiGraphicsCanonicalToolId))

  return {
    decision: input.executionRequested === true ? 'execution_request_blocked' : 'planning_metadata_selected',
    sourceDecision: AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
    capabilityId: capability.capabilityId,
    validCapability: true,
    executionRequested: input.executionRequested === true,
    selectedTools: rankedTools.map(asSelectedTool),
    requestedToolsAcceptedForPlanning: acceptedToolIds,
    requestedToolsEliminated,
    preferredPlanningTools: [...capability.preferredPlanningTools],
    conditionalPlanningTools: [...capability.conditionalPlanningTools],
    fallbackPlanningTools: [...capability.fallbackPlanningTools],
    eliminatedTools: [...capability.eliminatedTools],
    missingProofBeforeExecution: [...capability.missingProofBeforeExecution],
    missingExecutionGates: buildMissingExecutionGates(input),
    executionFlags: capability.executionFlags,
  }
}

export function listAiGraphicsToolCallPlanEvaluations(): AiGraphicsToolCallPlanEvaluation[] {
  return buildAiGraphicsToolCallHandoffContract().capabilities.map((capability) => (
    evaluateAiGraphicsToolCallPlan({ capabilityId: capability.capabilityId })
  ))
}
