import type { SfxDensityPlan } from './audio-foundation-types'

export function buildSfxDensityPlan(input: {
  requestedDensity?: 'none' | 'light' | 'medium' | 'heavy'
  style?: string
} = {}): SfxDensityPlan {
  const maxByDensity = {
    none: 0,
    light: 4,
    medium: 8,
    heavy: 10,
  } as const
  const density = input.requestedDensity ?? 'light'
  const warnings = density === 'heavy'
    ? ['Heavy SFX density is capped; random whooshes/impacts are not allowed.']
    : ['SFX cues must connect to timeline, caption, or visual events.']

  return {
    maxSfxPerMinute: maxByDensity[density],
    randomSfxAllowed: false,
    allowedCueTypes: density === 'none' ? [] : ['transition', 'caption_emphasis', 'visual_reveal', 'card_reveal'],
    warnings,
  }
}
