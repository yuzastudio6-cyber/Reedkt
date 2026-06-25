import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
  evaluateAiGraphicsToolCallPlan,
  type AiGraphicsToolCallPlanEvaluation,
} from './ai-graphics-tool-call-plan-evaluator'
import {
  AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
  buildAiGraphicsBetaReadinessGate,
} from './ai-graphics-beta-readiness-gate'

export const AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION =
  'ai_graphics_tool_route_readiness_contract_prepared_with_execution_blocks'

export type AiGraphicsToolRouteReadinessDecision =
  | 'planning_metadata_route_ready'
  | 'execution_route_request_blocked'
  | 'invalid_capability_route_blocked'

export interface AiGraphicsToolRouteReadinessRequest {
  capabilityId: AiGraphicsCapabilityId | string
  requestedToolIds?: string[]
  executionRequested?: boolean
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  artifactBoundaryApproved?: boolean
  routeApprovalRef?: string
  workerApprovalRef?: string
  privateArtifactManifestRef?: string
}

export interface AiGraphicsToolRouteReadinessEvaluation {
  decision: AiGraphicsToolRouteReadinessDecision
  capabilityId: string
  validCapability: boolean
  executionRequested: boolean
  selectedToolIds: AiGraphicsCanonicalToolId[]
  selectedProductionToolIds: string[]
  selectedWorkerTypes: string[]
  selectedRuntimeTargets: string[]
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  acceptedForPlanning: true
  canExecuteNow: false
  missingExecutionGates: string[]
  missingProofBeforeExecution: string[]
  failClosedReason: string | null
}

export interface AiGraphicsToolRouteReadinessContract {
  decision: typeof AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION
  sourcePlanEvaluatorDecision: typeof AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION
  sourceBetaGateDecision: typeof AI_GRAPHICS_BETA_READINESS_GATE_DECISION
  totalTools: 21
  totalCapabilities: 12
  planningMetadataRouteReadyCapabilities: 12
  executionReadyCapabilities: 0
  failClosedExecutionRequests: 12
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  heavyToolsIncorrectlyTargetingCpu: 0
  routeCanReturnPlanningMetadataNow: true
  routeCanExecuteToolsNow: false
  planningRoutes: AiGraphicsToolRouteReadinessEvaluation[]
  executionRequestDryRuns: AiGraphicsToolRouteReadinessEvaluation[]
  requiredRouteInputsBeforeExecution: string[]
  allowedPlanningActions: string[]
  blockedExecutionActions: string[]
}

const requiredRouteInputsBeforeExecution = [
  'approved plan snapshot id',
  'credit reservation id',
  'artifact boundary approval',
  'Tool Route approval reference',
  'Worker approval reference',
  'private artifact manifest reference',
  'runtime proof accepted by beta readiness gate',
  'internal beta owner approval',
]

const allowedPlanningActions = [
  'read canonical AI graphics capability metadata',
  'rank candidate tools with the approved scoring/ranking contract',
  'return planning-only selected tools, production tool ids, worker types, runtime targets, blockers, and next milestones',
  'explain missing proof and runtime blockers',
]

const blockedExecutionActions = [
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

function routeDecisionForEvaluation(
  evaluation: AiGraphicsToolCallPlanEvaluation,
): AiGraphicsToolRouteReadinessDecision {
  if (!evaluation.validCapability) return 'invalid_capability_route_blocked'
  if (evaluation.executionRequested) return 'execution_route_request_blocked'
  return 'planning_metadata_route_ready'
}

function asRouteEvaluation(
  evaluation: AiGraphicsToolCallPlanEvaluation,
  betaGlobalBlockers: string[],
): AiGraphicsToolRouteReadinessEvaluation {
  const selectedRuntimeTargets = evaluation.selectedTools.map((tool) => tool.runtimeTarget)
  const selectedToolIds = evaluation.selectedTools.map((tool) => tool.toolId)
  const missingExecutionGates = Array.from(new Set([
    ...evaluation.missingExecutionGates,
    ...betaGlobalBlockers,
  ]))
  const failClosedReason = evaluation.executionRequested
    ? 'execution request is fail-closed until approved snapshot, credit, artifact, Tool Route, Worker, runtime, model-weight, and beta-owner gates pass'
    : null

  return {
    decision: routeDecisionForEvaluation(evaluation),
    capabilityId: evaluation.capabilityId,
    validCapability: evaluation.validCapability,
    executionRequested: evaluation.executionRequested,
    selectedToolIds,
    selectedProductionToolIds: evaluation.selectedTools.map((tool) => tool.productionToolId),
    selectedWorkerTypes: Array.from(new Set(evaluation.selectedTools.map((tool) => tool.workerType))),
    selectedRuntimeTargets: Array.from(new Set(selectedRuntimeTargets)),
    gpuRuntimeTargetedTools: evaluation.selectedTools
      .filter((tool) => tool.gpuRequiredForRuntime)
      .map((tool) => tool.toolId),
    acceptedForPlanning: true,
    canExecuteNow: false,
    missingExecutionGates,
    missingProofBeforeExecution: Array.from(new Set(evaluation.missingProofBeforeExecution)),
    failClosedReason,
  }
}

export function evaluateAiGraphicsToolRouteReadiness(
  input: AiGraphicsToolRouteReadinessRequest,
): AiGraphicsToolRouteReadinessEvaluation {
  const betaGate = buildAiGraphicsBetaReadinessGate()
  const evaluation = evaluateAiGraphicsToolCallPlan({
    capabilityId: input.capabilityId,
    requestedToolIds: input.requestedToolIds,
    executionRequested: input.executionRequested,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    artifactBoundaryApproved: input.artifactBoundaryApproved,
  })

  const additionalRouteGates = [
    !input.routeApprovalRef ? 'Tool Route approval reference is missing' : undefined,
    !input.workerApprovalRef ? 'Worker approval reference is missing' : undefined,
    !input.privateArtifactManifestRef ? 'private artifact manifest reference is missing' : undefined,
  ].filter((gate): gate is string => Boolean(gate))

  return asRouteEvaluation(evaluation, [
    ...betaGate.globalBlockers,
    ...additionalRouteGates,
  ])
}

export function buildAiGraphicsToolRouteReadinessContract(): AiGraphicsToolRouteReadinessContract {
  const betaGate = buildAiGraphicsBetaReadinessGate()
  const planningRoutes = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.map((capabilityId) => (
    asRouteEvaluation(evaluateAiGraphicsToolCallPlan({ capabilityId }), betaGate.globalBlockers)
  ))
  const executionRequestDryRuns = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.map((capabilityId) => (
    evaluateAiGraphicsToolRouteReadiness({ capabilityId, executionRequested: true })
  ))

  return {
    decision: AI_GRAPHICS_TOOL_ROUTE_READINESS_DECISION,
    sourcePlanEvaluatorDecision: AI_GRAPHICS_TOOL_CALL_PLAN_EVALUATOR_DECISION,
    sourceBetaGateDecision: AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
    totalTools: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    totalCapabilities: planningRoutes.length as 12,
    planningMetadataRouteReadyCapabilities: planningRoutes.filter((route) => route.decision === 'planning_metadata_route_ready').length as 12,
    executionReadyCapabilities: 0,
    failClosedExecutionRequests: executionRequestDryRuns.filter((route) => route.decision === 'execution_route_request_blocked').length as 12,
    gpuRuntimeTargetedTools: betaGate.gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: betaGate.heavyToolsIncorrectlyTargetingCpu,
    routeCanReturnPlanningMetadataNow: true,
    routeCanExecuteToolsNow: false,
    planningRoutes,
    executionRequestDryRuns,
    requiredRouteInputsBeforeExecution,
    allowedPlanningActions,
    blockedExecutionActions,
  }
}
