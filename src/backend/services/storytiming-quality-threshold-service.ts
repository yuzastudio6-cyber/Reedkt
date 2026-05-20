import type { EditComplexity } from '../../types/planning'
import type { TargetPlatform } from '../../types/shared'

export interface StoryTimingQAThresholds {
  previewReadyScore: number
  warningScore: number
  adjustmentScore: number
  overlaySafetyMinimum: number
  emotionalTimingMinimum: number
  renderManifestMinimum: number
}

export function getTimingQAThresholdsForEditComplexity(editComplexity?: EditComplexity): StoryTimingQAThresholds {
  if (editComplexity === 'premium_signature_edit') {
    return {
      previewReadyScore: 92,
      warningScore: 82,
      adjustmentScore: 70,
      overlaySafetyMinimum: 86,
      emotionalTimingMinimum: 84,
      renderManifestMinimum: 90,
    }
  }

  if (editComplexity === 'signature_edit') {
    return {
      previewReadyScore: 90,
      warningScore: 80,
      adjustmentScore: 70,
      overlaySafetyMinimum: 82,
      emotionalTimingMinimum: 82,
      renderManifestMinimum: 88,
    }
  }

  return {
    previewReadyScore: 88,
    warningScore: 78,
    adjustmentScore: 70,
    overlaySafetyMinimum: 78,
    emotionalTimingMinimum: 80,
    renderManifestMinimum: 86,
  }
}

export function getTimingQAThresholdsForVideoTone(videoTone?: string): Partial<StoryTimingQAThresholds> {
  const tone = videoTone?.toLowerCase() ?? ''

  if (tone.includes('faith') || tone.includes('serious') || tone.includes('teaching')) {
    return {
      emotionalTimingMinimum: 90,
      previewReadyScore: 90,
    }
  }

  if (tone.includes('luxury') || tone.includes('real estate') || tone.includes('lifestyle')) {
    return {
      overlaySafetyMinimum: 84,
      previewReadyScore: 90,
    }
  }

  if (tone.includes('fitness') || tone.includes('montage') || tone.includes('social')) {
    return {
      warningScore: 76,
      adjustmentScore: 68,
    }
  }

  return {}
}

export function getTimingQAThresholdsForPlatform(platform?: TargetPlatform): Partial<StoryTimingQAThresholds> {
  if (platform === 'instagram' || platform === 'tiktok_reels_shorts') {
    return {
      warningScore: 76,
      adjustmentScore: 68,
    }
  }

  return {}
}

export function mergeTimingQAThresholds(
  base: StoryTimingQAThresholds,
  ...overrides: Partial<StoryTimingQAThresholds>[]
): StoryTimingQAThresholds {
  return overrides.reduce<StoryTimingQAThresholds>(
    (current, override) => ({
      previewReadyScore: override.previewReadyScore ?? current.previewReadyScore,
      warningScore: override.warningScore ?? current.warningScore,
      adjustmentScore: override.adjustmentScore ?? current.adjustmentScore,
      overlaySafetyMinimum: override.overlaySafetyMinimum ?? current.overlaySafetyMinimum,
      emotionalTimingMinimum: override.emotionalTimingMinimum ?? current.emotionalTimingMinimum,
      renderManifestMinimum: override.renderManifestMinimum ?? current.renderManifestMinimum,
    }),
    base,
  )
}
