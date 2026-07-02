import type { AudioAnalysisSummary, CleanupStrength, VoiceCondition } from './audio-foundation-types'

export function classifyVoiceCondition(analysis: AudioAnalysisSummary): VoiceCondition {
  if (analysis.speechPresence === 'absent') return 'clean_voice'
  if (analysis.clippingDetected) return 'clipping'
  if (analysis.musicSpeechOverlap) return 'music_under_voice'
  if (typeof analysis.noiseLevel === 'number' && analysis.noiseLevel >= 0.7) return 'heavy_noise'
  if (typeof analysis.noiseLevel === 'number' && analysis.noiseLevel >= 0.25) return 'mild_noise'
  if (analysis.speechPresence === 'unknown') return 'unknown'
  return 'clean_voice'
}

export function chooseVoiceCleanupStrength(input: {
  analysis: AudioAnalysisSummary
  approvedDirectiveSummary?: string
}): {
  condition: VoiceCondition
  cleanupStrength: CleanupStrength
  naturalnessRisk: 'low' | 'medium' | 'high'
  reasons: string[]
} {
  const condition = classifyVoiceCondition(input.analysis)
  const wantsStrongCleanup = input.approvedDirectiveSummary?.toLowerCase().includes('heavy noise') === true

  if (condition === 'clipping') {
    return {
      condition,
      cleanupStrength: 'light',
      naturalnessRisk: 'high',
      reasons: ['Clipping is not fixed by aggressive denoise; plan loudness/declip review and protect naturalness.'],
    }
  }

  if (condition === 'heavy_noise') {
    return {
      condition,
      cleanupStrength: wantsStrongCleanup ? 'medium' : 'light',
      naturalnessRisk: wantsStrongCleanup ? 'high' : 'medium',
      reasons: ['Heavy noise detected; start gentle and escalate only after audio naturalness QA.'],
    }
  }

  if (condition === 'mild_noise' || condition === 'music_under_voice') {
    return {
      condition,
      cleanupStrength: 'light',
      naturalnessRisk: 'low',
      reasons: ['Mild noise/music-under-voice should start with light cleanup or ducking.'],
    }
  }

  if (condition === 'unknown') {
    return {
      condition,
      cleanupStrength: 'none',
      naturalnessRisk: 'medium',
      reasons: ['Voice condition is unknown; do not apply cleanup until analysis confidence improves.'],
    }
  }

  return {
    condition,
    cleanupStrength: 'none',
    naturalnessRisk: 'low',
    reasons: ['Voice appears clean or absent; no voice cleanup planned by default.'],
  }
}
