import type { TranscriptWord } from '../speech'
import type { CutBoundary, CutRisk } from './smart-cut-worker-types'

export function evaluateSpeechCutBoundary(input: {
  boundaryId: string
  timeSeconds: number
  words: TranscriptWord[]
  aggressiveIntent?: boolean
}): CutBoundary {
  const risks: CutRisk[] = []
  const insideWord = input.words.find((word) => input.timeSeconds > word.startSeconds && input.timeSeconds < word.endSeconds)
  if (insideWord) risks.push('mid_word')

  const nearWord = input.words.find((word) => Math.abs(input.timeSeconds - word.startSeconds) < 0.08 || Math.abs(input.timeSeconds - word.endSeconds) < 0.08)
  if (nearWord) risks.push('audio_pop_risk')

  const adjusted = insideWord
    ? nearestWordBoundary(input.timeSeconds, insideWord)
    : input.timeSeconds

  const sentenceRisk = !input.aggressiveIntent && isLikelyMidSentence(adjusted, input.words)
  if (sentenceRisk) risks.push('mid_sentence')

  return {
    boundaryId: input.boundaryId,
    sourceTimeSeconds: round(input.timeSeconds),
    adjustedTimeSeconds: round(adjusted),
    paddingBeforeSeconds: insideWord || nearWord ? 0.06 : 0.03,
    paddingAfterSeconds: insideWord || nearWord ? 0.08 : 0.03,
    risks: risks.length > 0 ? risks : ['none'],
    safe: !risks.includes('mid_word') && !risks.includes('speaker_cutoff'),
    reason: risks.includes('mid_word')
      ? 'Cut point was inside a word and must be shifted to a word boundary.'
      : 'Cut point is aligned to available word boundary evidence.',
  }
}

export function isMidWordCut(timeSeconds: number, words: TranscriptWord[]): boolean {
  return words.some((word) => timeSeconds > word.startSeconds && timeSeconds < word.endSeconds)
}

function nearestWordBoundary(timeSeconds: number, word: TranscriptWord): number {
  return Math.abs(timeSeconds - word.startSeconds) <= Math.abs(timeSeconds - word.endSeconds)
    ? word.startSeconds
    : word.endSeconds
}

function isLikelyMidSentence(timeSeconds: number, words: TranscriptWord[]): boolean {
  const previous = [...words].reverse().find((word) => word.endSeconds <= timeSeconds)
  if (!previous) return false
  return !/[.!?]$/.test(previous.word.trim())
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
