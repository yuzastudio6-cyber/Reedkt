import type { AudioAnalysisSummary, MusicSpeechOverlapFinding } from './audio-foundation-types'

export function evaluateMusicSpeechOverlap(input: {
  analysis: AudioAnalysisSummary
  explicitOverlapRanges?: Array<{ startSeconds: number; endSeconds: number }>
}): MusicSpeechOverlapFinding {
  const overlapDetected = input.analysis.musicSpeechOverlap || (input.explicitOverlapRanges?.length ?? 0) > 0
  const confidence = input.explicitOverlapRanges?.length ? 0.86 : input.analysis.advancedAnalysisRan ? 0.72 : 0.48
  const warnings: string[] = []
  if (!input.analysis.advancedAnalysisRan) warnings.push('Music/speech overlap uses placeholder evidence; do not claim beat/source separation analysis ran.')

  return {
    overlapDetected,
    confidence,
    ranges: input.explicitOverlapRanges ?? (overlapDetected ? [{ startSeconds: 0, endSeconds: input.analysis.durationSeconds }] : []),
    recommendation: overlapDetected
      ? confidence >= 0.75 ? 'duck_music' : 'needs_more_analysis'
      : input.analysis.musicDetected ? 'leave_music' : 'leave_music',
    warnings,
  }
}
