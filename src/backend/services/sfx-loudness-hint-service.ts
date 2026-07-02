import type { SFXVolumeProfile } from '../../types'
import { estimateTargetGainDb } from './sfx-volume-profile-service'

export function estimateSFXLoudnessHint(volumeProfile: SFXVolumeProfile): string {
  if (volumeProfile === 'none') return 'silent'
  if (volumeProfile === 'whisper') return 'very low relative loudness'
  if (volumeProfile === 'subtle_polish') return 'low relative loudness'
  if (volumeProfile === 'premium_soft') return 'low-medium premium loudness'
  if (volumeProfile === 'standard_social') return 'medium controlled social loudness'
  return 'medium-high impact loudness, only when approved and speech-safe'
}

export function estimateSFXPeakHint(volumeProfile: SFXVolumeProfile): number {
  if (volumeProfile === 'none') return -96
  if (volumeProfile === 'whisper') return -18
  if (volumeProfile === 'subtle_polish') return -12
  if (volumeProfile === 'premium_soft') return -10
  if (volumeProfile === 'standard_social') return -8
  return -4
}

export function createSFXLoudnessSummary(volumeProfile: SFXVolumeProfile): string[] {
  return [
    `Target gain hint: ${estimateTargetGainDb(volumeProfile)}dB relative feel.`,
    `Peak hint: about ${estimateSFXPeakHint(volumeProfile)}dB relative planning ceiling.`,
    estimateSFXLoudnessHint(volumeProfile),
    'These are planning hints only, not final mastering values.',
  ]
}
