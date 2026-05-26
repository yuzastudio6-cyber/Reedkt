import type { TranscriptSegment, TranscriptWord } from './speech-worker-types'

export interface NormalizeTranscriptSegmentsOptions {
  mergeBelowSeconds?: number
  splitAboveCharacters?: number
}

export function normalizeTranscriptSegments(
  segments: TranscriptSegment[],
  options: NormalizeTranscriptSegmentsOptions = {},
): TranscriptSegment[] {
  const mergeBelowSeconds = options.mergeBelowSeconds ?? 0.35
  const splitAboveCharacters = options.splitAboveCharacters ?? 160
  const normalized = segments
    .map(normalizeSegment)
    .sort((a, b) => a.startSeconds - b.startSeconds)

  const merged: TranscriptSegment[] = []
  for (const segment of normalized) {
    const previous = merged[merged.length - 1]
    const duration = segment.endSeconds - segment.startSeconds
    const gap = previous ? segment.startSeconds - previous.endSeconds : Number.POSITIVE_INFINITY
    if (previous && duration < mergeBelowSeconds && gap >= 0 && gap <= 0.2) {
      previous.endSeconds = Math.max(previous.endSeconds, segment.endSeconds)
      previous.text = normalizeSpacing(`${previous.text} ${segment.text}`)
      previous.words = [...previous.words, ...segment.words]
      previous.confidence = averageOptional(previous.confidence, segment.confidence)
    } else {
      merged.push({ ...segment, words: [...segment.words] })
    }
  }

  return merged.flatMap((segment) => splitLongSegment(segment, splitAboveCharacters))
}

function normalizeSegment(segment: TranscriptSegment): TranscriptSegment {
  validateTimeRange(segment.startSeconds, segment.endSeconds, segment.segmentId)
  const words = segment.words.map((word) => normalizeWord(word, segment.segmentId))
  return {
    ...segment,
    text: normalizeSpacing(segment.text),
    words,
  }
}

function normalizeWord(word: TranscriptWord, fallbackSegmentId: string): TranscriptWord {
  validateTimeRange(word.startSeconds, word.endSeconds, `${fallbackSegmentId}:${word.word}`)
  return {
    ...word,
    segmentId: word.segmentId || fallbackSegmentId,
    word: normalizeSpacing(word.word),
  }
}

function validateTimeRange(startSeconds: number, endSeconds: number, label: string): void {
  if (startSeconds < 0 || endSeconds < 0) {
    throw new Error(`Transcript timestamp cannot be negative: ${label}`)
  }
  if (endSeconds < startSeconds) {
    throw new Error(`Transcript segment end cannot be before start: ${label}`)
  }
}

function splitLongSegment(segment: TranscriptSegment, splitAboveCharacters: number): TranscriptSegment[] {
  if (segment.text.length <= splitAboveCharacters || segment.words.length < 2) return [segment]

  const midpoint = Math.ceil(segment.words.length / 2)
  const firstWords = segment.words.slice(0, midpoint)
  const secondWords = segment.words.slice(midpoint)

  if (firstWords.length === 0 || secondWords.length === 0) return [segment]

  return [
    buildSegmentFromWords(`${segment.segmentId}-a`, firstWords, segment.confidence),
    buildSegmentFromWords(`${segment.segmentId}-b`, secondWords, segment.confidence),
  ]
}

function buildSegmentFromWords(
  segmentId: string,
  words: TranscriptWord[],
  confidence?: number,
): TranscriptSegment {
  return {
    segmentId,
    startSeconds: words[0]?.startSeconds ?? 0,
    endSeconds: words[words.length - 1]?.endSeconds ?? 0,
    text: normalizeSpacing(words.map((word) => word.word).join(' ')),
    words: words.map((word) => ({ ...word, segmentId })),
    confidence,
  }
}

export function normalizeSpacing(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').trim()
}

function averageOptional(a: number | undefined, b: number | undefined): number | undefined {
  if (typeof a === 'number' && typeof b === 'number') return Number(((a + b) / 2).toFixed(3))
  return a ?? b
}
