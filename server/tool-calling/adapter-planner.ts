import type {
  ToolCallingArtifactType,
} from './operation-ontology'
import type {
  ToolCallingPipeline,
  ToolCallingPipelineStep,
} from './pipeline-composer'
import {
  getToolAdapterContract,
} from './adapter-registry'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'
import {
  buildWorkerRouteBridgePlansForPipeline,
} from './worker-route-bridge'
import type {
  PendingAdapterContractTool,
  ToolAdapterArtifactRef,
  ToolAdapterPipelinePlan,
  ToolAdapterPlan,
} from './adapter-contract-types'

function artifactRefForStep(
  step: ToolCallingPipelineStep,
  artifactType: ToolCallingArtifactType,
  index: number,
): ToolAdapterArtifactRef {
  return {
    artifactType,
    refId: `${step.stepId}_input_${String(index + 1).padStart(2, '0')}_${artifactType}`,
    source: 'pipeline_expected_input',
  }
}

export function buildAdapterPlanForStep(step: ToolCallingPipelineStep): ToolAdapterPlan {
  const contract = getToolAdapterContract(step.selectedToolId)
  if (!contract) {
    throw new Error(`${step.selectedToolId} selected by ${step.stepId} does not have a planning adapter contract.`)
  }
  if (!contract.supportedOperationIds.includes(step.operationId)) {
    throw new Error(`${contract.adapterId} does not support ${step.operationId}.`)
  }

  return {
    adapterPlanId: `${step.stepId}_${contract.adapterId}`,
    toolId: step.selectedToolId,
    operationId: step.operationId,
    stepId: step.stepId,
    workerType: contract.workerType,
    executionMode: 'planning_only',
    inputArtifactRefs: step.expectedInputArtifacts.map((artifactType, index) =>
      artifactRefForStep(step, artifactType, index),
    ),
    expectedOutputArtifacts: step.expectedOutputArtifacts,
    requiredQualityGates: step.requiredQualityGates,
    fallbackToolIds: step.fallbackToolIds,
    adapterContractId: contract.adapterId,
    commandPlanPreview: {
      previewOnly: true,
      operationSummary: `${step.operationId} planned through ${contract.displayName}.`,
      toolDisplayName: contract.displayName,
      plannedInputArtifactTypes: step.expectedInputArtifacts,
      plannedOutputArtifactTypes: step.expectedOutputArtifacts,
      safetyConstraints: [
        'Metadata-only adapter preview.',
        'Approved snapshot handoff required before any future worker action.',
        'Private artifact references required for future media access.',
      ],
      shellCommandStringsAllowed: false,
      arbitraryArgsAllowed: false,
      directOutputPathWritesAllowed: false,
    },
    executesTools: false,
    mediaProcessingAllowed: false,
  }
}

export function listPendingAdapterContractTools(): PendingAdapterContractTool[] {
  return listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => ({
      externalToolId: result.externalToolId ?? result.inputToolId,
      status: 'pending_adapter_contract_until_production_tool_registry_expansion' as const,
      reason: result.reason,
    }))
    .sort((left, right) => left.externalToolId.localeCompare(right.externalToolId))
}

export function buildAdapterPlanForPipeline(pipeline: ToolCallingPipeline): ToolAdapterPipelinePlan {
  const adapterPlans = pipeline.steps.map(buildAdapterPlanForStep)
  const workerRouteBridgePlans = buildWorkerRouteBridgePlansForPipeline(pipeline)

  return {
    adapterPipelinePlanId: `tool_adapter_pipeline_${pipeline.patternId ?? 'custom'}_${adapterPlans.length}`,
    sourcePatternId: pipeline.patternId,
    adapterPlans,
    workerRouteBridgePlans,
    pendingAdapterContractTools: listPendingAdapterContractTools(),
    planningOnly: true,
    executesTools: false,
    mediaProcessingAllowed: false,
  }
}
