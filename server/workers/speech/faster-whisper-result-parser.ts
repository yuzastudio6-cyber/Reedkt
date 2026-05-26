import { normalizeTranscriptSegments } from './transcript-segment-normalizer'
import type { TranscriptSegment, TranscriptWord } from './speech-worker-types'

export interface ParsedFasterWhisperResult {
  language?: string
  languageConfidence?: number
  segments: TranscriptSegment[]
  words: TranscriptWord[]
  confidence: number
}

export function parseFasterWhisperExecutionJsonOutput(output: string): Record<string, unknown> {
  return JSON.parse(output) as Record<string, unknown>
}

export function normalizeFasterWhisperExecutionResult(output: string | Record<string, unknown>): ParsedFasterWhisperResult {
  const parsed = typeof output === 'string' ? parseFasterWhisperExecutionJsonOutput(output) : output
  const segments = normalizeRawSegments(parsed)
  const words = segments.flatMap((segment) => segment.words)
  const confidences = [
    ...segments.map((segment) => segment.confidence),
    ...words.map((word) => word.confidence),
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  return {
    language: stringValue(parsed.language),
    languageConfidence: numberValue(parsed.language_probability) ?? numberValue(parsed.languageConfidence),
    segments,
    words,
    confidence: confidences.length > 0
      ? Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(3))
      : segments.length > 0 ? 0.75 : 0,
  }
}

function normalizeRawSegments(parsed: Record<string, unknown>): TranscriptSegment[] {
  const rawSegments = Array.isArray(parsed.segments) ? parsed.segments : []
  const segments = rawSegments.map((item, index) => {
    const record = item as Record<string, unknown>
    const segmentId = stringValue(record.id) ?? `fw-exec-segment-${index + 1}`
    const startSeconds = numberValue(record.start) ?? numberValue(record.startSeconds) ?? 0
    const endSeconds = numberValue(record.end) ?? numberValue(record.endSeconds) ?? startSeconds
    const text = stringValue(record.text) ?? ''

    if (startSeconds < 0 || endSeconds < 0) {
      throw new Error('faster-whisper segment timestamps must not be negative.')
    }
    if (endSeconds < startSeconds) {
      throw new Error('faster-whisper segment end timestamp must be after start timestamp.')
    }

    const words = Array.isArray(record.words)
      ? record.words.map((word, wordIndex): TranscriptWord => {
        const wordRecord = word as Record<string, unknown>
        const wordStart = numberValue(wordRecord.start) ?? numberValue(wordRecord.startSeconds) ?? startSeconds
        const wordEnd = numberValue(wordRecord.end) ?? numberValue(wordRecord.endSeconds) ?? wordStart
        if (wordStart < 0 || wordEnd < 0) throw new Error('faster-whisper word timestamps must not be negative.')
        if (wordEnd < wordStart) throw new Error('faster-whisper word end timestamp must be after start timestamp.')
        return {
          word: stringValue(wordRecord.word) ?? stringValue(wordRecord.text) ?? `word-${wordIndex + 1}`,
          startSeconds: wordStart,
          endSeconds: wordEnd,
          confidence: numberValue(wordRecord.probability) ?? numberValue(wordRecord.confidence),
          segmentId,
        }
      })
      : wordsFromText(text, startSeconds, endSeconds, segmentId)

    return {
      segmentId,
      startSeconds,
      endSeconds,
      text,
      words,
      confidence: numberValue(record.confidence) ?? numberValue(record.avg_logprob) ?? numberValue(record.probability),
    }
  })

  return normalizeTranscriptSegments(segments)
}

function wordsFromText(text: string, startSeconds: number, endSeconds: number, segmentId: string): TranscriptWord[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  const duration = Math.max(0.01, endSeconds - startSeconds)
  return tokens.map((word, index) => ({
    word,
    startSeconds: Number((startSeconds + (duration / tokens.length) * index).toFixed(3)),
    endSeconds: Number((startSeconds + (duration / tokens.length) * (index + 1)).toFixed(3)),
    segmentId,
  }))
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
