import type { RepeatedTakeCandidate } from '../../../src/backend/contracts/media-analysis-report'
import type { TranscriptSegment } from './speech-worker-types'

export function detectRepeatedTakeCandidates(segments: TranscriptSegment[]): RepeatedTakeCandidate[] {
  const candidates: RepeatedTakeCandidate[] = []

  for (let index = 0; index < segments.length - 1; index += 1) {
    const current = segments[index]
    if (!current) continue

    for (let compareIndex = index + 1; compareIndex < Math.min(segments.length, index + 4); compareIndex += 1) {
      const next = segments[compareIndex]
      if (!next) continue

      const similarity = phraseSimilarity(current.text, next.text)
      if (similarity >= 0.72) {
        candidates.push({
          candidateId: `repeat-${current.segmentId}-${next.segmentId}`,
          ranges: [
            { startSeconds: current.startSeconds, endSeconds: current.endSeconds },
            { startSeconds: next.startSeconds, endSeconds: next.endSeconds },
          ],
          reason: 'Deterministic transcript similarity suggests a repeated take candidate. No cut is applied in Milestone 7.',
          confidence: Number(similarity.toFixed(3)),
        })
      }
    }
  }

  return candidates
}

function phraseSimilarity(a: string, b: string): number {
  const aTokens = tokenSet(a)
  const bTokens = tokenSet(b)
  if (aTokens.size === 0 || bTokens.size === 0) return 0

  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length
  const union = new Set([...aTokens, ...bTokens]).size
  return intersection / union
}

function tokenSet(value: string): Set<string> {
  return new Set(value.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2))
}
