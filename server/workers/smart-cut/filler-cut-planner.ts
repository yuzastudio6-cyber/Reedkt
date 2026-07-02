import type { SpeechFillerSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { TranscriptWord } from '../speech'
import type { SegmentRemoveDecision } from './smart-cut-worker-types'

const fillerWords = new Set(['um', 'uh', 'erm', 'like', 'you know', 'sort of', 'kind of', 'i mean'])

export function planFillerCuts(input: {
  fillerSegments: SpeechFillerSegment[]
  wordTimestamps: TranscriptWord[]
}): {
  removeSegments: SegmentRemoveDecision[]
  rejectedCandidates: SegmentRemoveDecision[]
} {
  const removeSegments: SegmentRemoveDecision[] = []
  const rejectedCandidates: SegmentRemoveDecision[] = []

  for (const [index, filler] of input.fillerSegments.entries()) {
    const overlappingWords = input.wordTimestamps.filter((word) => rangesOverlap(word, filler))
    const onlyFiller = overlappingWords.length > 0 &&
      overlappingWords.every((word) => fillerWords.has(normalizeWord(word.word)))
    const duration = filler.endSeconds - filler.startSeconds
    const decision: SegmentRemoveDecision = {
      decisionId: `${onlyFiller ? 'remove' : 'reject'}-filler-${index + 1}`,
      candidateId: `filler-${index + 1}`,
      startSeconds: filler.startSeconds,
      endSeconds: filler.endSeconds,
      score: onlyFiller ? 0.72 : 0.24,
      confidence: filler.confidence,
      reason: onlyFiller && duration <= 0.9
        ? 'Filler-only region can be proposed for future removal.'
        : 'Embedded filler is left as future smart edit candidate to avoid cutting normal speech.',
      risks: onlyFiller ? ['audio_pop_risk'] : ['mid_sentence', 'speaker_cutoff'],
      futureOnly: !onlyFiller || duration > 0.9,
    }
    if (onlyFiller && duration <= 0.9) removeSegments.push(decision)
    else rejectedCandidates.push(decision)
  }

  return { removeSegments, rejectedCandidates }
}

function rangesOverlap(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
}
