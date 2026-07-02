import type { TranscriptSegment, TranscriptWord } from '../speech'
import { normalizeSpacing } from '../speech'
import type { CaptionSegment, CaptionSegmentBuilderOptions } from './caption-worker-types'

export function buildCaptionSegmentsFromTranscript(
  segments: TranscriptSegment[],
  options: CaptionSegmentBuilderOptions = {},
): CaptionSegment[] {
  const words = segments.flatMap((segment) => segment.words)
  return buildCaptionSegmentsFromWords(words, options)
}

export function buildCaptionSegmentsFromWords(
  words: TranscriptWord[],
  options: CaptionSegmentBuilderOptions = {},
): CaptionSegment[] {
  const maxWords = options.maxWordsPerCaption ?? 7
  const maxCharactersPerLine = options.maxCharactersPerLine ?? 32
  const maxLines = options.maxLines ?? 2
  const minDuration = options.minDurationSeconds ?? 0.4
  const maxDuration = options.maxDurationSeconds ?? 5
  const captions: CaptionSegment[] = []
  let chunk: TranscriptWord[] = []

  for (const word of words) {
    const candidate = [...chunk, word]
    const candidateText = normalizeSpacing(candidate.map((item) => item.word).join(' '))
    const candidateDuration = (candidate.at(-1)?.endSeconds ?? word.endSeconds) - (candidate[0]?.startSeconds ?? word.startSeconds)
    const sentenceBoundary = /[.!?]$/.test(word.word)
    const tooManyWords = candidate.length > maxWords
    const tooLong = candidateText.length > maxCharactersPerLine * maxLines
    const tooLongDuration = candidateDuration > maxDuration

    if (chunk.length > 0 && (tooManyWords || tooLong || tooLongDuration)) {
      captions.push(buildCaption(chunk, captions.length, options, maxCharactersPerLine, maxLines, minDuration))
      chunk = [word]
      continue
    }

    chunk = candidate

    if (sentenceBoundary && candidateDuration >= minDuration) {
      captions.push(buildCaption(chunk, captions.length, options, maxCharactersPerLine, maxLines, minDuration))
      chunk = []
    }
  }

  if (chunk.length > 0) {
    captions.push(buildCaption(chunk, captions.length, options, maxCharactersPerLine, maxLines, minDuration))
  }

  return mergeVeryShortCaptions(captions, minDuration, maxDuration, maxCharactersPerLine, maxLines, options)
}

function buildCaption(
  words: TranscriptWord[],
  index: number,
  options: CaptionSegmentBuilderOptions,
  maxCharactersPerLine: number,
  maxLines: number,
  minDuration: number,
): CaptionSegment {
  const startSeconds = words[0]?.startSeconds ?? 0
  const naturalEnd = words.at(-1)?.endSeconds ?? startSeconds
  const endSeconds = Math.max(naturalEnd, startSeconds + Math.min(minDuration, 0.6))
  const text = normalizeSpacing(words.map((word) => word.word).join(' '))
  return {
    captionId: `caption-${index + 1}`,
    startSeconds,
    endSeconds,
    text,
    lines: splitCaptionLines(text, maxCharactersPerLine, maxLines),
    words,
    styleHints: {
      presetId: options.presetId ?? 'clean_subtitle',
      placement: options.placement ?? 'bottom_safe',
      emphasisWords: [],
    },
  }
}

function mergeVeryShortCaptions(
  captions: CaptionSegment[],
  minDuration: number,
  maxDuration: number,
  maxCharactersPerLine: number,
  maxLines: number,
  options: CaptionSegmentBuilderOptions,
): CaptionSegment[] {
  const merged: CaptionSegment[] = []
  for (const caption of captions) {
    const previous = merged[merged.length - 1]
    const duration = caption.endSeconds - caption.startSeconds
    if (previous && duration < minDuration && caption.endSeconds - previous.startSeconds <= maxDuration) {
      const words = [...previous.words, ...caption.words]
      merged[merged.length - 1] = buildCaption(words, merged.length - 1, options, maxCharactersPerLine, maxLines, minDuration)
    } else {
      merged.push(caption)
    }
  }

  return merged.map((caption, index) => ({ ...caption, captionId: `caption-${index + 1}` }))
}

function splitCaptionLines(text: string, maxCharactersPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxCharactersPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines

  const compacted = lines.slice(0, maxLines - 1)
  compacted.push(lines.slice(maxLines - 1).join(' '))
  return compacted
}
