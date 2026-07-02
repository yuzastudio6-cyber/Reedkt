import type { ProductionToolId, ProductionToolStatus } from '../tool-registry'
import {
  OPERATION_TOOL_SEEDS,
  artifactsCompatible,
} from './capability-index'
import {
  getOperationDefinition,
} from './operation-ontology'
import type {
  ToolCallingOperationDefinition,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolCallingRankingContext,
  ToolCapabilityCard,
} from './tool-capability-card-types'

export interface ToolOperationScore {
  toolId: ProductionToolId
  capabilityMatch: number
  inputOutputCompatibility: number
  qualityScore: number
  reliabilityScore: number
  speedScore: number
  resourceFit: number
  validationStrength: number
  fallbackStrength: number
  userPreferenceFit: number
  finalScore: number
}

export interface RankedToolCandidate {
  toolId: ProductionToolId
  toolCard: ToolCapabilityCard
  score: ToolOperationScore
}

export interface RankToolsForOperationInput {
  operationId: ToolCallingOperationId | string
  candidates: readonly ToolCapabilityCard[]
  context: ToolCallingRankingContext
}

export interface ScoreToolForOperationInput {
  operation: ToolCallingOperationDefinition
  toolCard: ToolCapabilityCard
  context: ToolCallingRankingContext
}

export const DEFAULT_RANKING_WEIGHTS = {
  capabilityMatch: 30,
  inputOutputCompatibility: 15,
  qualityScore: 15,
  reliabilityScore: 10,
  speedScore: 10,
  resourceFit: 10,
  validationStrength: 5,
  fallbackStrength: 3,
  userPreferenceFit: 2,
} as const

type RankingWeights = Record<keyof typeof DEFAULT_RANKING_WEIGHTS, number>

function rankingWeightsForContext(context: ToolCallingRankingContext): RankingWeights {
  if (context.qualityTarget === 'fast') {
    return {
      ...DEFAULT_RANKING_WEIGHTS,
      qualityScore: 10,
      reliabilityScore: 8,
      speedScore: 16,
      resourceFit: 14,
    }
  }

  if (context.qualityTarget === 'high_quality') {
    return {
      ...DEFAULT_RANKING_WEIGHTS,
      qualityScore: 20,
      reliabilityScore: 13,
      speedScore: 6,
      resourceFit: 7,
      validationStrength: 7,
    }
  }

  return DEFAULT_RANKING_WEIGHTS
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score))
}

function hasArtifactCompatibility(
  requestedArtifacts: readonly string[],
  availableArtifacts: readonly string[],
): boolean {
  return requestedArtifacts.length === 0 || requestedArtifacts.some((artifact) => artifactsCompatible(artifact, availableArtifacts))
}

const outputArtifactAliases: Record<string, readonly string[]> = {
  representative_frame: ['image_asset'],
  keyframe_image: ['image_asset'],
  cleaned_audio: ['processed_audio'],
  enhanced_video: ['processed_video'],
  interpolated_video: ['processed_video'],
  ocr_report_json: ['analysis_report', 'json_spec'],
  word_timestamps_json: ['caption_segments_json', 'analysis_report'],
  caption_segments: ['caption_segments_json'],
  opentimelineio_manifest: ['timeline_manifest', 'json_spec'],
}

function hasOutputCompatibility(
  requestedArtifacts: readonly string[],
  availableArtifacts: readonly string[],
): boolean {
  if (requestedArtifacts.length === 0) return true
  const genericReportArtifacts = new Set(['analysis_report', 'qa_report', 'json_spec'])
  const primaryArtifacts = requestedArtifacts.filter((artifact) => !genericReportArtifacts.has(artifact))
  const artifactsToMatch = primaryArtifacts.length > 0 ? primaryArtifacts : requestedArtifacts

  return artifactsToMatch.some((artifact) => {
    if (availableArtifacts.includes(artifact)) return true
    return (outputArtifactAliases[artifact] ?? []).some((alias) => availableArtifacts.includes(alias))
  })
}

function productionStatusReliability(status: ProductionToolStatus): number {
  switch (status) {
    case 'launch_core':
      return 1
    case 'planned':
      return 0.78
    case 'future':
      return 0.48
    case 'needs_license_review':
      return 0.3
    case 'evaluation_only':
      return 0.22
    case 'blocked':
      return 0
    default:
      return 0
  }
}

function statusSortRank(status: ProductionToolStatus): number {
  switch (status) {
    case 'launch_core':
      return 0
    case 'planned':
      return 1
    case 'future':
      return 2
    case 'needs_license_review':
      return 3
    case 'evaluation_only':
      return 4
    case 'blocked':
      return 5
    default:
      return 6
  }
}

function computeCapabilityMatch(operation: ToolCallingOperationDefinition, toolCard: ToolCapabilityCard): number {
  const seedIndex = OPERATION_TOOL_SEEDS[operation.operationId as ToolCallingOperationId]?.indexOf(toolCard.toolId) ?? -1
  if (seedIndex >= 0) return clampScore(1 - seedIndex * 0.06)
  if (toolCard.operations.includes(operation.operationId as ToolCallingOperationId)) return 0.78

  const text = [
    toolCard.displayName,
    ...toolCard.bestFor,
    ...toolCard.notFor,
    ...toolCard.readinessNotes,
  ].join(' ').toLowerCase()
  const operationTokens = operation.operationId.split(/[._]/).filter((token) => token.length > 3)
  const matchedTokens = operationTokens.filter((token) => text.includes(token)).length
  return clampScore(matchedTokens / Math.max(1, operationTokens.length) * 0.6)
}

function computeQualityScore(operation: ToolCallingOperationDefinition, toolCard: ToolCapabilityCard): number {
  const gateMatches = operation.qualityGateTypes.filter((gateType) => toolCard.validators.includes(gateType)).length
  const gateScore = operation.qualityGateTypes.length === 0
    ? 0.7
    : gateMatches / operation.qualityGateTypes.length
  const launchBonus = toolCard.qualityProfile.launchCore ? 0.15 : 0
  const modelReviewPenalty = toolCard.qualityProfile.modelWeightsRequired ? 0.12 : 0
  return clampScore(gateScore + launchBonus - modelReviewPenalty)
}

function computeSpeedScore(toolCard: ToolCapabilityCard): number {
  if (toolCard.resourceProfile.workerType === 'frontend_preview_only') return 0.95
  if (toolCard.resourceProfile.workerType === 'planning_only') return 0.9
  if (!toolCard.resourceProfile.gpuRequired && toolCard.resourceProfile.cpuAllowed) return 0.82
  if (toolCard.resourceProfile.gpuRequired) return 0.55
  return 0.65
}

function computeResourceFit(toolCard: ToolCapabilityCard, context: ToolCallingRankingContext): number {
  if (context.requireCpuOnly && toolCard.resourceProfile.gpuRequired) return 0
  if (context.allowGpu === false && toolCard.resourceProfile.gpuRequired) return 0.1

  let score = 0.72
  if (context.preferredWorkerType && toolCard.resourceProfile.workerType === context.preferredWorkerType) score += 0.24
  if (!context.preferredWorkerType && toolCard.resourceProfile.workerType !== 'planning_only') score += 0.08
  if (context.mode === 'analysis' && toolCard.resourceProfile.workerType === 'cpu_analysis_worker') score += 0.15
  if (context.mode === 'preview' && toolCard.resourceProfile.workerType === 'frontend_preview_only') score += 0.12
  if (context.mode === 'final_export' && toolCard.resourceProfile.workerType === 'render_worker') score += 0.12
  return clampScore(score)
}

function computeUserPreferenceFit(toolCard: ToolCapabilityCard, context: ToolCallingRankingContext): number {
  const tags = context.userPreferenceTags ?? []
  if (tags.length === 0) return 0.5

  const searchableText = [
    toolCard.displayName,
    ...toolCard.bestFor,
    ...toolCard.notFor,
    ...toolCard.readinessNotes,
  ].join(' ').toLowerCase()

  const matches = tags.filter((tag) => searchableText.includes(tag.toLowerCase())).length
  return clampScore(matches / tags.length)
}

export function scoreToolForOperation(input: ScoreToolForOperationInput): ToolOperationScore {
  const { operation, toolCard, context } = input
  const weights = rankingWeightsForContext(context)
  const inputCompatible = hasArtifactCompatibility(operation.inputArtifactTypes, toolCard.inputArtifacts)
  const outputCompatible = hasOutputCompatibility(operation.outputArtifactTypes, toolCard.outputArtifacts)
  const inputOutputCompatibility = (inputCompatible ? 0.5 : 0) + (outputCompatible ? 0.5 : 0)
  const validationStrength = operation.qualityGateTypes.length === 0
    ? 0.5
    : operation.qualityGateTypes.filter((gateType) => toolCard.validators.includes(gateType)).length / operation.qualityGateTypes.length
  const fallbackStrength = clampScore(toolCard.fallbackToolIds.length / 4)

  const dimensions = {
    capabilityMatch: computeCapabilityMatch(operation, toolCard),
    inputOutputCompatibility,
    qualityScore: computeQualityScore(operation, toolCard),
    reliabilityScore: productionStatusReliability(toolCard.qualityProfile.productionStatus),
    speedScore: computeSpeedScore(toolCard),
    resourceFit: computeResourceFit(toolCard, context),
    validationStrength,
    fallbackStrength,
    userPreferenceFit: computeUserPreferenceFit(toolCard, context),
  }

  const weightedScore = Object.entries(dimensions).reduce((total, [key, value]) => {
    const weight = weights[key as keyof typeof weights]
    return total + value * weight
  }, 0)

  return {
    toolId: toolCard.toolId,
    ...dimensions,
    finalScore: Number(weightedScore.toFixed(4)),
  }
}

export function rankToolsForOperation(input: RankToolsForOperationInput): RankedToolCandidate[] {
  const operation = getOperationDefinition(input.operationId)
  if (!operation) return []

  return input.candidates
    .map((toolCard) => ({
      toolId: toolCard.toolId,
      toolCard,
      score: scoreToolForOperation({ operation, toolCard, context: input.context }),
    }))
    .sort((left, right) => {
      const scoreDelta = right.score.finalScore - left.score.finalScore
      if (scoreDelta !== 0) return scoreDelta

      if (left.toolCard.qualityProfile.launchCore !== right.toolCard.qualityProfile.launchCore) {
        return left.toolCard.qualityProfile.launchCore ? -1 : 1
      }

      const statusDelta = statusSortRank(left.toolCard.qualityProfile.productionStatus) -
        statusSortRank(right.toolCard.qualityProfile.productionStatus)
      if (statusDelta !== 0) return statusDelta

      const preferredWorkerType = input.context.preferredWorkerType
      if (preferredWorkerType) {
        const leftPreferred = left.toolCard.resourceProfile.workerType === preferredWorkerType
        const rightPreferred = right.toolCard.resourceProfile.workerType === preferredWorkerType
        if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1
      }

      return left.toolId.localeCompare(right.toolId)
    })
}
