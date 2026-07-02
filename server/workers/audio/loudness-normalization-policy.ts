import type { AudioAnalysisSummary, LoudnessNormalizationPlan } from './audio-foundation-types'

export function buildLoudnessNormalizationPlan(input: {
  analysis: AudioAnalysisSummary
  platform?: 'social' | 'web' | 'broadcast' | 'podcast' | 'education' | 'premium' | 'custom'
}): LoudnessNormalizationPlan {
  const targetLufs = input.platform === 'premium' || input.platform === 'podcast' ? -14 : -16
  const truePeakDb = -1
  const current = input.analysis.integratedLufs
  const shouldNormalize = typeof current === 'number'
    ? Math.abs(current - targetLufs) > 1.5
    : true
  const warnings: string[] = []
  if (input.analysis.clippingDetected) warnings.push('Clipping detected; avoid blindly boosting clipped audio.')
  if (typeof current !== 'number') warnings.push('Integrated loudness is unavailable; loudness plan is target metadata until measured.')

  return {
    targetLufs,
    truePeakDb,
    shouldNormalize,
    reason: `Target ${targetLufs} LUFS and ${truePeakDb} dBTP for voice-first online delivery planning.`,
    warnings,
  }
}
