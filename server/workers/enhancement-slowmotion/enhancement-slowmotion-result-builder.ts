import type { EnhancementExecutionResult } from '../enhancement'
import type { SlowMotionExecutionResult } from '../slow-motion'
import type { EnhancementSlowMotionExecutionMode, EnhancementSlowMotionPipelineResult } from './enhancement-slowmotion-pipeline-types'

export function buildEnhancementSlowMotionPipelineResult(input: {
  mode: EnhancementSlowMotionExecutionMode
  enhancementResult?: EnhancementExecutionResult
  slowMotionResult?: SlowMotionExecutionResult
}): EnhancementSlowMotionPipelineResult {
  const enhancedArtifacts = input.enhancementResult?.enhancedArtifacts ?? []
  const interpolatedArtifacts = input.slowMotionResult?.interpolatedArtifacts ?? []
  const previewArtifacts = [
    ...(input.enhancementResult?.previewArtifacts ?? []),
    ...(input.slowMotionResult?.previewArtifacts ?? []),
  ]
  const qaResults = [
    ...(input.enhancementResult?.qaResults ?? []),
    ...(input.slowMotionResult?.qaResults ?? []),
  ]
  const childStatuses = [input.enhancementResult?.status, input.slowMotionResult?.status].filter(Boolean)
  const blocked = childStatuses.includes('blocked') || qaResults.some((gate) => gate.blocking)
  const status = blocked
    ? 'blocked'
    : input.mode === 'container_ready'
      ? 'container_ready'
      : input.mode === 'dry_run'
        ? 'dry_run'
        : 'partial'

  return {
    mode: input.mode,
    status,
    enhancementResult: input.enhancementResult,
    slowMotionResult: input.slowMotionResult,
    enhancementTaskPlan: input.enhancementResult?.enhancementTaskPlan,
    slowMotionTaskPlan: input.slowMotionResult?.slowMotionTaskPlan,
    enhancedArtifacts,
    interpolatedArtifacts,
    previewArtifacts,
    qaResults,
    fallbackDecisions: [
      ...(input.enhancementResult?.fallbackDecisions ?? []),
      ...(input.slowMotionResult?.fallbackDecisions ?? []),
    ],
    skippedReasons: [
      ...(input.enhancementResult?.skippedReasons ?? []),
      ...(input.slowMotionResult?.skippedReasons ?? []),
    ],
    warnings: [
      ...(input.enhancementResult?.warnings ?? []),
      ...(input.slowMotionResult?.warnings ?? []),
      'M15D pipeline is sample/preview metadata only and blocks final render/export.',
    ],
    blocksPreview: Boolean(input.enhancementResult?.blocksPreview || input.slowMotionResult?.blocksPreview),
    blocksFinalExport: true,
  }
}
