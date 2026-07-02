import type { SilenceSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { PacingProfile, SegmentKeepDecision, SegmentRemoveDecision } from './smart-cut-worker-types'

export function planSilenceDeadspace(input: {
  silenceSegments: SilenceSegment[]
  pacingProfile: PacingProfile
}): {
  removeSegments: SegmentRemoveDecision[]
  protectedSegments: SegmentKeepDecision[]
  rejectedCandidates: SegmentRemoveDecision[]
  warnings: string[]
} {
  const removeSegments: SegmentRemoveDecision[] = []
  const protectedSegments: SegmentKeepDecision[] = []
  const rejectedCandidates: SegmentRemoveDecision[] = []

  for (const [index, silence] of input.silenceSegments.entries()) {
    const duration = silence.endSeconds - silence.startSeconds
    const candidateId = `silence-deadspace-${index + 1}`
    const isEmotionalPause = silence.confidence !== undefined && silence.confidence < 0.55
    if (isEmotionalPause && input.pacingProfile.emotionalPausePolicy === 'protect') {
      protectedSegments.push({
        decisionId: `protect-${candidateId}`,
        candidateId,
        startSeconds: silence.startSeconds,
        endSeconds: silence.endSeconds,
        score: 0.9,
        confidence: silence.confidence ?? 0.6,
        reason: 'Short or low-confidence silence is protected as possible natural/emotional pause.',
        protected: true,
      })
      continue
    }

    if (duration > input.pacingProfile.maxSilenceSeconds) {
      removeSegments.push({
        decisionId: `remove-${candidateId}`,
        candidateId,
        startSeconds: silence.startSeconds,
        endSeconds: silence.endSeconds,
        score: Number(Math.min(1, duration / Math.max(input.pacingProfile.maxSilenceSeconds * 2, 0.1)).toFixed(3)),
        confidence: silence.confidence ?? 0.72,
        reason: `Long silence exceeds ${input.pacingProfile.profileId} threshold of ${input.pacingProfile.maxSilenceSeconds}s.`,
        risks: ['audio_pop_risk'],
      })
    } else {
      rejectedCandidates.push({
        decisionId: `reject-${candidateId}`,
        candidateId,
        startSeconds: silence.startSeconds,
        endSeconds: silence.endSeconds,
        score: 0.2,
        confidence: silence.confidence ?? 0.65,
        reason: 'Short natural pause is preserved for speech flow.',
        risks: ['emotional_pause'],
        futureOnly: true,
      })
    }
  }

  return {
    removeSegments,
    protectedSegments,
    rejectedCandidates,
    warnings: protectedSegments.length > 0 ? ['Some silence was protected as possible emotional/natural pause.'] : [],
  }
}
