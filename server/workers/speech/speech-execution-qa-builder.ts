import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { TranscriptSegment, TranscriptWord } from './speech-worker-types'

type SpeechQaIssue = {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'blocking'
}

export function buildSpeechExecutionQaResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  transcriptSegments: TranscriptSegment[]
  words: TranscriptWord[]
  confidence?: number
}): QualityGateResult[] {
  const transcriptIssues = validateTimedItems([
    ...input.transcriptSegments.map((segment) => ({
      id: segment.segmentId,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      label: 'segment',
    })),
    ...input.words.map((word, index) => ({
      id: `${word.segmentId}-word-${index}`,
      startSeconds: word.startSeconds,
      endSeconds: word.endSeconds,
      label: 'word',
    })),
  ])
  if ((input.confidence ?? 1) < 0.6) {
    transcriptIssues.push({
      code: 'transcript_low_confidence',
      message: 'Transcript confidence is below the preferred threshold.',
      severity: 'warning',
    })
  }

  return [
    buildGate({
      ...input,
      gateType: 'transcript_alignment',
      issues: transcriptIssues,
      score: Math.max(0, 1 - transcriptIssues.length * 0.15),
      threshold: 0.75,
    }),
  ]
}

function validateTimedItems(items: Array<{ id: string; startSeconds: number; endSeconds: number; label: string }>): SpeechQaIssue[] {
  return items.flatMap((item) => {
    if (item.startSeconds < 0 || item.endSeconds < 0) {
      return [{
        code: `${item.label}_negative_timestamp`,
        message: `${item.id} has a negative timestamp.`,
        severity: 'blocking' as const,
      }]
    }
    if (item.endSeconds < item.startSeconds) {
      return [{
        code: `${item.label}_end_before_start`,
        message: `${item.id} ends before it starts.`,
        severity: 'blocking' as const,
      }]
    }
    return []
  })
}

function buildGate(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  gateType: 'transcript_alignment'
  issues: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error' | 'blocking' }>
  score: number
  threshold: number
}): QualityGateResult {
  const blocking = input.issues.some((issue) => issue.severity === 'blocking')
  return {
    id: `speech-exec-gate-${input.gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'speech-caption-execution-dry-run',
    recipeId: 'speech_caption_execution',
    gateType: input.gateType,
    status: blocking ? 'blocked' : input.score >= input.threshold ? 'passed' : 'warning',
    score: input.score,
    threshold: input.threshold,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: input.issues,
    recommendations: input.issues.length > 0
      ? [{ action: 'Review transcript timing before preview/export.', reason: 'M13 speech execution QA found timing or confidence issues.', priority: 'normal' }]
      : [{ action: 'Gate passed.', reason: 'Transcript timing is valid for M13 execution.', priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking || input.score < input.threshold,
    humanReviewRequired: input.issues.length > 0,
  }
}
