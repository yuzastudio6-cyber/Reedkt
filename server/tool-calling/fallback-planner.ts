import {
  getFallbackChainsForTool,
  isProductionToolId,
} from '../tool-registry'
import type {
  ProductionFallbackChain,
  ProductionToolId,
} from '../tool-registry'
import {
  getToolCapabilityCard,
} from './capability-index'
import type {
  ToolCallingPipeline,
} from './pipeline-composer'

export interface ToolFallbackPlan {
  toolId: ProductionToolId
  fallbackToolIds: readonly ProductionToolId[]
  fallbackChains: readonly ProductionFallbackChain[]
}

export interface PipelineFallbackStepPlan {
  stepId: string
  selectedToolId: ProductionToolId
  fallbackToolIds: readonly ProductionToolId[]
  fallbackChains: readonly ProductionFallbackChain[]
}

export interface PipelineFallbackPlan {
  tools: readonly ToolFallbackPlan[]
  steps: readonly PipelineFallbackStepPlan[]
}

export function buildFallbackPlanForTool(toolId: ProductionToolId | string): ToolFallbackPlan {
  if (!isProductionToolId(toolId)) {
    return {
      toolId: 'ffmpeg',
      fallbackToolIds: [],
      fallbackChains: [],
    }
  }

  const card = getToolCapabilityCard(toolId)
  return {
    toolId,
    fallbackToolIds: card?.fallbackToolIds ?? [],
    fallbackChains: getFallbackChainsForTool(toolId),
  }
}

export function buildFallbackPlanForPipeline(pipeline: ToolCallingPipeline): PipelineFallbackPlan {
  const toolIds = [...new Set(pipeline.steps.map((step) => step.selectedToolId))]
  const tools = toolIds.map(buildFallbackPlanForTool)
  const planByToolId = new Map(tools.map((plan) => [plan.toolId, plan]))

  return {
    tools,
    steps: pipeline.steps.map((step) => {
      const toolPlan = planByToolId.get(step.selectedToolId)
      return {
        stepId: step.stepId,
        selectedToolId: step.selectedToolId,
        fallbackToolIds: toolPlan?.fallbackToolIds ?? [],
        fallbackChains: toolPlan?.fallbackChains ?? [],
      }
    }),
  }
}
