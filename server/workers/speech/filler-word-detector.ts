import type { SpeechFillerSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { TranscriptSegment } from './speech-worker-types'

const fillerPhrases = [
  'um',
  'uh',
  'erm',
  'like',
  'you know',
  'sort of',
  'kind of',
  'i mean',
]

export function detectFillerSegments(segments: TranscriptSegment[]): SpeechFillerSegment[] {
  const fillers: SpeechFillerSegment[] = []

  for (const segment of segments) {
    for (const word of segment.words) {
      const normalized = stripPunctuation(word.word.toLowerCase())
      if (fillerPhrases.includes(normalized)) {
        fillers.push({
          startSeconds: word.startSeconds,
          endSeconds: word.endSeconds,
          label: normalized,
          confidence: word.confidence ?? 0.75,
        })
      }
    }

    const segmentText = segment.text.toLowerCase()
    for (const phrase of fillerPhrases.filter((item) => item.includes(' '))) {
      if (segmentText.includes(phrase)) {
        fillers.push({
          startSeconds: segment.startSeconds,
          endSeconds: Math.min(segment.endSeconds, segment.startSeconds + 1),
          label: phrase,
          confidence: segment.confidence ?? 0.65,
        })
      }
    }
  }

  return dedupeFillers(fillers)
}

function stripPunctuation(value: string): string {
  return value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
}

function dedupeFillers(fillers: SpeechFillerSegment[]): SpeechFillerSegment[] {
  const seen = new Set<string>()
  return fillers.filter((filler) => {
    const key = `${filler.label}:${filler.startSeconds.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
