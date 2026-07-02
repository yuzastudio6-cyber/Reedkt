import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../tool-registry'
import type {
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import {
  findToolsForOperation,
  getOperationDefinition,
} from './capability-index'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import {
  rankToolsForOperation,
} from './tool-ranking-engine'
import type {
  ToolCallingRankingContext,
} from './tool-capability-card-types'
import {
  getRequiredQualityGatesForOperation,
  getRequiredQualityGatesForTool,
} from './quality-gate-planner'

export type PipelinePatternId =
  | 'raw_footage_to_social_short'
  | 'captioned_talking_head'
  | 'smart_cut_basic'
  | 'final_export_validation'

export const INITIAL_PIPELINE_PATTERN_IDS = [
  'raw_footage_to_social_short',
  'captioned_talking_head',
  'smart_cut_basic',
  'final_export_validation',
] as const satisfies readonly PipelinePatternId[]

export const PIPELINE_PATTERNS: Record<PipelinePatternId, readonly ToolCallingOperationId[]> = {
  raw_footage_to_social_short: [
    'media.inspect',
    'media.proxy.create',
    'media.audio.extract',
    'video.scene.detect',
    'video.frame.sample',
    'video.blur.score',
    'video.safe_zone.detect',
    'audio.transcribe',
    'caption.generate',
    'caption.align',
    'caption.style',
    'timeline.smart_cut',
    'timeline.validate',
    'render.preview',
  ],
  captioned_talking_head: [
    'media.inspect',
    'media.audio.extract',
    'audio.transcribe',
    'audio.word_align',
    'caption.generate',
    'caption.align',
    'caption.style',
    'caption.burn_in',
    'video.safe_zone.detect',
    'render.preview',
  ],
  smart_cut_basic: [
    'media.inspect',
    'video.scene.detect',
    'audio.transcribe',
    'timeline.smart_cut',
    'timeline.validate',
    'timeline.to_otio',
    'render.preview',
  ],
  final_export_validation: [
    'timeline.validate',
    'audio.loudness.normalize',
    'render.compose',
    'export.mux',
    'export.validate',
    'qa.final_delivery',
  ],
}

export interface ToolCallingPipelineStep {
  stepId: string
  operationId: ToolCallingOperationId
  candidateToolIds: readonly ProductionToolId[]
  rankedToolIds: readonly ProductionToolId[]
  selectedToolId: ProductionToolId
  fallbackToolIds: readonly ProductionToolId[]
  requiredQualityGates: readonly QualityGateType[]
  expectedInputArtifacts: readonly ToolCallingArtifactType[]
  expectedOutputArtifacts: readonly ToolCallingArtifactType[]
  executionMode: 'planning_only'
  workerType?: ProductionRegistryWorkerType
}

export interface ToolCallingPipeline {
  patternId?: PipelinePatternId
  context: ToolCallingRankingContext
  steps: readonly ToolCallingPipelineStep[]
}

function uniqueOperationIds(operations: readonly ToolCallingOperationId[]): ToolCallingOperationId[] {
  return [...new Set(operations)]
}

function stepIdFor(patternId: PipelinePatternId | 'custom', operationId: ToolCallingOperationId, index: number): string {
  return `${patternId}_${String(index + 1).padStart(2, '0')}_${operationId.replaceAll('.', '_')}`
}

export function getPatternOperations(patternId: PipelinePatternId): ToolCallingOperationId[] {
  return [...PIPELINE_PATTERNS[patternId]]
}

export function composePipelineForPattern(
  patternId: PipelinePatternId,
  context: ToolCallingRankingContext,
): ToolCallingPipeline {
  return composePipelineForOperations(PIPELINE_PATTERNS[patternId], context, patternId)
}

export function composePipelineForOperations(
  operations: readonly ToolCallingOperationId[],
  context: ToolCallingRankingContext,
  patternId?: PipelinePatternId,
): ToolCallingPipeline {
  const resolvedOperations = uniqueOperationIds(operations)
  const steps = resolvedOperations.map((operationId, index) => {
    const operation = getOperationDefinition(operationId)
    if (!operation) {
      throw new Error(`Unknown tool-calling operation: ${operationId}`)
    }

    const candidates = findToolsForOperation(operationId)
    if (candidates.length === 0) {
      throw new Error(`No production registry tools can plan operation: ${operationId}`)
    }

    const rankedCandidates = rankToolsForOperation({ operationId, candidates, context })
    const selectedCandidate = rankedCandidates[0]
    if (!selectedCandidate) {
      throw new Error(`No ranked production registry tools can plan operation: ${operationId}`)
    }

    return {
      stepId: stepIdFor(patternId ?? 'custom', operationId, index),
      operationId,
      candidateToolIds: candidates.map((candidate) => candidate.toolId),
      rankedToolIds: rankedCandidates.map((candidate) => candidate.toolId),
      selectedToolId: selectedCandidate.toolId,
      fallbackToolIds: selectedCandidate.toolCard.fallbackToolIds,
      requiredQualityGates: [
        ...new Set([
          ...getRequiredQualityGatesForOperation(operationId, context.mode),
          ...getRequiredQualityGatesForTool(selectedCandidate.toolId, context.mode),
        ]),
      ].sort(),
      expectedInputArtifacts: operation.inputArtifactTypes,
      expectedOutputArtifacts: operation.outputArtifactTypes,
      executionMode: 'planning_only' as const,
      workerType: selectedCandidate.toolCard.resourceProfile.workerType,
    }
  })

  return {
    patternId,
    context,
    steps,
  }
}
