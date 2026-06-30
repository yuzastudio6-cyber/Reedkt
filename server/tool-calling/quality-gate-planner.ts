import {
  getToolQAPolicy,
  isProductionToolId,
} from '../tool-registry'
import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import {
  getOperationDefinition,
} from './operation-ontology'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolCallingMode,
} from './tool-capability-card-types'
import type {
  ToolCallingPipeline,
} from './pipeline-composer'

export interface ToolCallingQualityGateStepPlan {
  stepId: string
  operationId: ToolCallingOperationId
  selectedToolId: ProductionToolId
  gateTypes: readonly QualityGateType[]
}

export interface ToolCallingQualityGatePlan {
  gateTypes: readonly QualityGateType[]
  steps: readonly ToolCallingQualityGateStepPlan[]
}

function uniqueGateTypes(gateTypes: readonly QualityGateType[]): QualityGateType[] {
  return [...new Set(gateTypes)].sort()
}

export function getRequiredQualityGatesForOperation(
  operationId: ToolCallingOperationId | string,
  mode: ToolCallingMode,
): QualityGateType[] {
  const operation = getOperationDefinition(operationId)
  if (!operation) return []

  const gateTypes = [...operation.qualityGateTypes]
  if (mode === 'final_export' && operation.finalExportRequired && !gateTypes.includes('final_delivery')) {
    gateTypes.push('final_delivery')
  }

  return uniqueGateTypes(gateTypes)
}

export function getRequiredQualityGatesForTool(
  toolId: ProductionToolId | string,
  mode: ToolCallingMode,
): QualityGateType[] {
  if (!isProductionToolId(toolId)) return []

  const policy = getToolQAPolicy(toolId)
  if (mode === 'final_export') {
    return uniqueGateTypes(policy.requiredBeforeFinalExport.length > 0 ? policy.requiredBeforeFinalExport : policy.gateTypes)
  }

  if (mode === 'preview' || mode === 'draft') {
    return uniqueGateTypes(policy.requiredBeforePreview.length > 0 ? policy.requiredBeforePreview : policy.gateTypes)
  }

  return uniqueGateTypes(policy.gateTypes)
}

export function buildQualityGatePlan(pipeline: ToolCallingPipeline): ToolCallingQualityGatePlan {
  const steps = pipeline.steps.map((step) => ({
    stepId: step.stepId,
    operationId: step.operationId,
    selectedToolId: step.selectedToolId,
    gateTypes: uniqueGateTypes([
      ...getRequiredQualityGatesForOperation(step.operationId, pipeline.context.mode),
      ...getRequiredQualityGatesForTool(step.selectedToolId, pipeline.context.mode),
    ]),
  }))

  return {
    gateTypes: uniqueGateTypes(steps.flatMap((step) => step.gateTypes)),
    steps,
  }
}
