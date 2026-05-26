import path from 'node:path'
import { assertSourceNotOverwritten } from '../media/media-path-safety'
import type { SmartCutPlan } from './smart-cut-worker-types'
import type {
  SmartCutExecutionPlan,
  SmartCutExecutionValidationResult,
  SmartCutTimelineExecutionInput,
} from './smart-cut-execution-types'

export function validateSmartCutPlanForExecution(input: {
  plan: SmartCutPlan
  executionInput?: SmartCutTimelineExecutionInput
}): SmartCutExecutionValidationResult {
  const issues: SmartCutExecutionValidationResult['issues'] = []
  const { plan, executionInput } = input

  if (executionInput?.allowFinalExport === true) {
    issues.push(blocking('allow_final_export', 'Final export is blocked in Milestone 14.'))
  }

  if (executionInput?.sourceVideoLocalPath && executionInput.outputDirectory) {
    const candidatePreviewPath = path.join(executionInput.outputDirectory, `${plan.id}-preview.mp4`)
    try {
      assertSourceNotOverwritten(executionInput.sourceVideoLocalPath, candidatePreviewPath)
    } catch {
      issues.push(blocking('source_overwrite_risk', 'Preview output must not overwrite source media.'))
    }
  }

  for (const segment of [...plan.keepSegments, ...plan.removeSegments]) {
    if (segment.startSeconds < 0) issues.push(blocking('negative_timestamp', `${segment.decisionId} starts before zero.`))
    if (segment.endSeconds <= segment.startSeconds) issues.push(blocking('end_before_start', `${segment.decisionId} must end after it starts.`))
    if (segment.endSeconds > plan.sourceDurationSeconds + 0.01) {
      issues.push(blocking('source_bounds_exceeded', `${segment.decisionId} exceeds source duration.`))
    }
  }

  issues.push(...overlapIssues(plan.keepSegments, 'overlapping_keep_segments'))
  issues.push(...overlapIssues(plan.removeSegments, 'overlapping_remove_segments'))

  for (const keep of plan.keepSegments) {
    for (const remove of plan.removeSegments) {
      if (rangesOverlap(keep, remove)) {
        issues.push(blocking('overlapping_keep_remove_segments', `${keep.decisionId} overlaps removal ${remove.decisionId}.`))
      }
    }
  }

  for (const protectedSegment of plan.protectedSegments) {
    if (plan.removeSegments.some((remove) => rangesOverlap(protectedSegment, remove))) {
      issues.push(blocking('protected_segment_removed', `${protectedSegment.decisionId} is protected but overlaps a removal.`))
    }
  }

  if (plan.cutBoundaries.some((boundary) => boundary.risks.includes('mid_word'))) {
    issues.push(blocking('mid_word_cut', 'Cut boundaries with mid-word risk must be adjusted before execution.'))
  }

  const words = executionInput?.wordTimestamps ?? []
  for (const boundaryTime of plan.removeSegments.flatMap((remove) => [remove.startSeconds, remove.endSeconds])) {
    if (words.some((word) => boundaryTime > word.startSeconds + 0.001 && boundaryTime < word.endSeconds - 0.001)) {
      issues.push(blocking('mid_word_cut', `Cut at ${boundaryTime.toFixed(3)}s lands inside a word timestamp.`))
    }
    if (words.some((word) => Math.abs(boundaryTime - word.startSeconds) < 0.012 || Math.abs(boundaryTime - word.endSeconds) < 0.012)) {
      issues.push(warning('word_boundary_padding', `Cut at ${boundaryTime.toFixed(3)}s is close to a word boundary and may need padding.`))
    }
  }

  if (plan.removeSegments.some((remove) => remove.risks.includes('emotional_pause')) && plan.aggressiveness !== 'aggressive') {
    issues.push(blocking('emotional_pause_removed', 'Emotional pauses are protected unless an aggressive approved intent allows removal.'))
  }

  const repeatedIds = new Set(plan.segmentCandidates.flatMap((candidate) => candidate.evidence.repeatedTakeCandidateIds))
  for (const repeatedId of repeatedIds) {
    const repeatedCandidates = plan.segmentCandidates.filter((candidate) => candidate.evidence.repeatedTakeCandidateIds.includes(repeatedId))
    const everyVersionRemoved = repeatedCandidates.length > 0 && repeatedCandidates.every((candidate) =>
      plan.removeSegments.some((remove) => remove.candidateId === candidate.candidateId || rangesOverlap(remove, candidate)),
    )
    if (everyVersionRemoved) {
      issues.push(blocking('repeated_take_no_keeper', `${repeatedId} would remove every repeated-take version.`))
    }
  }

  if (plan.keepSegments.length === 0) {
    issues.push(blocking('zero_duration_timeline', 'Smart cut execution requires at least one kept segment.'))
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

export function validateSmartCutExecutionPlan(input: {
  executionPlan: SmartCutExecutionPlan
  executionInput?: SmartCutTimelineExecutionInput
}): SmartCutExecutionValidationResult {
  const issues: SmartCutExecutionValidationResult['issues'] = []
  const { executionPlan, executionInput } = input

  if (executionPlan.finalExportAllowed) {
    issues.push(blocking('final_export_allowed', 'Execution plan must keep finalExportAllowed false in M14.'))
  }
  if (executionPlan.targetDurationSeconds <= 0) {
    issues.push(blocking('zero_duration_timeline', 'Execution plan target duration must be greater than zero.'))
  }
  if (executionInput?.allowFinalExport === true) {
    issues.push(blocking('allow_final_export', 'Final export is blocked in Milestone 14.'))
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

function overlapIssues(
  ranges: Array<{ startSeconds: number; endSeconds: number; decisionId: string }>,
  code: string,
): SmartCutExecutionValidationResult['issues'] {
  const issues: SmartCutExecutionValidationResult['issues'] = []
  const sorted = [...ranges].sort((a, b) => a.startSeconds - b.startSeconds)
  for (let index = 1; index < sorted.length; index += 1) {
    if (rangesOverlap(sorted[index - 1], sorted[index])) {
      issues.push(blocking(code, `${sorted[index - 1].decisionId} overlaps ${sorted[index].decisionId}.`))
    }
  }
  return issues
}

function rangesOverlap(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function blocking(code: string, message: string): SmartCutExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): SmartCutExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
