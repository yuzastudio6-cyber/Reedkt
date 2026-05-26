import type { RepeatedTakeCandidate, SpeechFillerSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { TranscriptSegment } from '../speech'
import type { SegmentKeepDecision, SegmentRemoveDecision } from './smart-cut-worker-types'

export function planRepeatedTakeSelection(input: {
  repeatedTakeCandidates: RepeatedTakeCandidate[]
  transcriptSegments: TranscriptSegment[]
  fillerSegments: SpeechFillerSegment[]
}): {
  keepSegments: SegmentKeepDecision[]
  removeSegments: SegmentRemoveDecision[]
  warnings: string[]
} {
  const keepSegments: SegmentKeepDecision[] = []
  const removeSegments: SegmentRemoveDecision[] = []

  for (const candidate of input.repeatedTakeCandidates) {
    const ranked = candidate.ranges
      .map((range, index) => ({
        range,
        index,
        score: scoreTake(range, input.transcriptSegments, input.fillerSegments),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)

    const keeper = ranked[0]
    if (!keeper) continue

    keepSegments.push({
      decisionId: `keep-repeat-${candidate.candidateId}-${keeper.index + 1}`,
      candidateId: candidate.candidateId,
      startSeconds: keeper.range.startSeconds,
      endSeconds: keeper.range.endSeconds,
      score: Number(keeper.score.toFixed(3)),
      confidence: candidate.confidence,
      reason: 'Best repeated take retained by confidence, completeness, filler count, and timing.',
      protected: true,
    })

    for (const rejected of ranked.slice(1)) {
      removeSegments.push({
        decisionId: `reject-repeat-${candidate.candidateId}-${rejected.index + 1}`,
        candidateId: candidate.candidateId,
        startSeconds: rejected.range.startSeconds,
        endSeconds: rejected.range.endSeconds,
        score: Number(Math.max(0.1, 1 - rejected.score).toFixed(3)),
        confidence: candidate.confidence,
        reason: 'Lower-ranked repeated take is a removal candidate, but at least one version is kept.',
        risks: ['meaning_loss', 'audio_pop_risk'],
      })
    }
  }

  return {
    keepSegments,
    removeSegments,
    warnings: input.repeatedTakeCandidates.length > 0 ? ['Repeated-take planner keeps at least one version of every repeated phrase.'] : [],
  }
}

function scoreTake(
  range: { startSeconds: number; endSeconds: number },
  transcriptSegments: TranscriptSegment[],
  fillerSegments: SpeechFillerSegment[],
): number {
  const overlappingSegments = transcriptSegments.filter((segment) => overlaps(segment, range))
  const textLength = overlappingSegments.map((segment) => segment.text).join(' ').length
  const confidence = average(overlappingSegments.map((segment) => segment.confidence ?? 0.75))
  const fillerCount = fillerSegments.filter((filler) => overlaps(filler, range)).length
  const duration = range.endSeconds - range.startSeconds
  return Math.max(0, Math.min(1, confidence * 0.48 + Math.min(textLength / 120, 0.32) + Math.min(duration / 8, 0.18) - fillerCount * 0.12))
}

function overlaps(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function average(values: number[]): number {
  if (values.length === 0) return 0.65
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
