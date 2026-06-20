import type {
  ProductionToolId,
} from '../tool-registry'
import {
  buildFallbackPlanForPipeline,
} from './fallback-planner'
import type {
  PipelineFallbackPlan,
} from './fallback-planner'
import {
  buildQualityGatePlan,
} from './quality-gate-planner'
import type {
  ToolCallingQualityGatePlan,
} from './quality-gate-planner'
import {
  composePipelineForOperations,
  getPatternOperations,
} from './pipeline-composer'
import type {
  PipelinePatternId,
  ToolCallingPipeline,
} from './pipeline-composer'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolCallingMediaContext,
  ToolCallingMode,
  ToolCallingQualityTarget,
  ToolCallingRankingContext,
} from './tool-capability-card-types'

export interface BuildToolCallingPlanRequest {
  projectId: string
  mode: ToolCallingMode
  qualityTarget: ToolCallingQualityTarget
  requestedPatternId?: PipelinePatternId
  requestedOperations?: readonly ToolCallingOperationId[]
  userPreferenceTags?: readonly string[]
  mediaContext?: ToolCallingMediaContext
}

export interface ToolCallingPlanDiagnostics {
  sourceRegistry: 'server/tool-registry'
  sourceQAPolicy: 'server/tool-registry/tool-qa-policy.ts'
  sourceFallbackPolicy: 'server/tool-registry/tool-fallback-policy.ts'
  planningOnly: true
  executesTools: false
  operationCount: number
  pipelineStepCount: number
  selectedToolCount: number
  fallbackToolCount: number
  qualityGateCount: number
  warnings: readonly string[]
}

export interface ToolCallingPlan {
  planId: string
  mode: ToolCallingMode
  qualityTarget: ToolCallingQualityTarget
  operations: readonly ToolCallingOperationId[]
  pipeline: ToolCallingPipeline
  selectedTools: readonly ProductionToolId[]
  fallbackPlan: PipelineFallbackPlan
  qualityGatePlan: ToolCallingQualityGatePlan
  diagnostics: ToolCallingPlanDiagnostics
  executesTools: false
}

function stableHash(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function uniqueOperations(
  patternId?: PipelinePatternId,
  requestedOperations: readonly ToolCallingOperationId[] = [],
): ToolCallingOperationId[] {
  const baseOperations = patternId ? getPatternOperations(patternId) : []
  return [...new Set([...baseOperations, ...requestedOperations])]
}

function buildRankingContext(request: BuildToolCallingPlanRequest): ToolCallingRankingContext {
  return {
    mode: request.mode,
    qualityTarget: request.qualityTarget,
    userPreferenceTags: request.userPreferenceTags,
    mediaContext: request.mediaContext,
  }
}

export function buildToolCallingPlan(request: BuildToolCallingPlanRequest): ToolCallingPlan {
  const operations = uniqueOperations(request.requestedPatternId, request.requestedOperations)
  if (operations.length === 0) {
    throw new Error('Tool-calling plan requires requestedPatternId or requestedOperations.')
  }

  const context = buildRankingContext(request)
  const pipeline = composePipelineForOperations(operations, context, request.requestedPatternId)
  const selectedTools = [...new Set(pipeline.steps.map((step) => step.selectedToolId))].sort()
  const fallbackPlan = buildFallbackPlanForPipeline(pipeline)
  const qualityGatePlan = buildQualityGatePlan(pipeline)
  const fallbackToolCount = new Set(fallbackPlan.tools.flatMap((toolPlan) => toolPlan.fallbackToolIds)).size
  const planKey = [
    request.projectId,
    request.mode,
    request.qualityTarget,
    request.requestedPatternId ?? 'custom',
    operations.join(','),
    request.userPreferenceTags?.join(',') ?? 'no_tags',
  ].join('|')

  return {
    planId: `tool_calling_plan_${stableHash(planKey)}`,
    mode: request.mode,
    qualityTarget: request.qualityTarget,
    operations,
    pipeline,
    selectedTools,
    fallbackPlan,
    qualityGatePlan,
    diagnostics: {
      sourceRegistry: 'server/tool-registry',
      sourceQAPolicy: 'server/tool-registry/tool-qa-policy.ts',
      sourceFallbackPolicy: 'server/tool-registry/tool-fallback-policy.ts',
      planningOnly: true,
      executesTools: false,
      operationCount: operations.length,
      pipelineStepCount: pipeline.steps.length,
      selectedToolCount: selectedTools.length,
      fallbackToolCount,
      qualityGateCount: qualityGatePlan.gateTypes.length,
      warnings: [],
    },
    executesTools: false,
  }
}
