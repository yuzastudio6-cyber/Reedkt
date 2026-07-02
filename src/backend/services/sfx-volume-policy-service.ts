import type {
  SFXMixPriority,
  SFXTargetLayer,
  SFXVolumeProfile,
} from '../../types'

export interface SFXVolumePolicyInput {
  targetLayer?: SFXTargetLayer
  videoType?: string
  videoTone?: string
  editComplexity?: string
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
}

function volumeText(input: SFXVolumePolicyInput): string {
  return [input.videoType, input.videoTone, input.editComplexity].join(' ').toLowerCase()
}

export function recommendSFXVolumeProfile(input: SFXVolumePolicyInput): SFXVolumeProfile {
  const text = volumeText(input)

  if (input.targetLayer === 'none') return 'none'
  if (/faith|serious|teaching|documentary|emotional/.test(text)) return 'whisper'
  if (/luxury|real estate|premium/.test(text)) return 'premium_soft'
  if (/fitness|high-energy|energetic/.test(text)) return input.speechPresent ? 'standard_social' : 'impact'
  if (input.targetLayer === 'stroke_motion' || input.targetLayer === 'graphic_design') return 'subtle_polish'
  if (input.targetLayer === 'real_motion') return 'premium_soft'
  if (input.targetLayer === 'title_card' || input.targetLayer === 'chapter_card') return 'premium_soft'
  if (input.targetLayer === 'montage_hit') return input.speechPresent ? 'subtle_polish' : 'standard_social'
  if (input.targetLayer === 'ambient_bridge') return 'subtle_polish'

  return 'subtle_polish'
}

export function recommendSFXMixPriority(input: SFXVolumePolicyInput): SFXMixPriority {
  if (input.speechPresent) return 'voice_first'
  if (input.ambienceImportant && input.targetLayer === 'ambient_bridge') return 'ambience_first'
  if (input.musicPresent && input.targetLayer === 'montage_hit') return 'music_support'
  if (input.targetLayer === 'stroke_motion' || input.targetLayer === 'real_motion') return 'signature_sync'
  if (input.targetLayer === 'none') return 'low_priority'

  return 'effect_moment'
}

export function recommendTargetGainDbHint(input: SFXVolumePolicyInput): number {
  const profile = recommendSFXVolumeProfile(input)

  if (profile === 'none') return -96
  if (profile === 'whisper') return -30
  if (profile === 'subtle_polish') return -24
  if (profile === 'premium_soft') return -22
  if (profile === 'standard_social') return -18
  return -14
}

export function shouldDuckUnderVoice(input: SFXVolumePolicyInput): boolean {
  return input.speechPresent !== false
}

export function shouldDuckUnderMusic(input: SFXVolumePolicyInput): boolean {
  return Boolean(input.musicPresent) && input.targetLayer !== 'montage_hit'
}

export function createSFXVolumeGuidance(input: SFXVolumePolicyInput): string[] {
  return [
    `Use ${recommendSFXVolumeProfile(input)} volume profile.`,
    shouldDuckUnderVoice(input)
      ? 'Duck under voice and keep speech clarity first.'
      : 'No speech is present, so the cue may be slightly more audible if it supports the edit.',
    shouldDuckUnderMusic(input)
      ? 'Keep SFX under music except for a brief hit point.'
      : 'Avoid duplicating music hits unless the edit intentionally asks for a beat accent.',
  ]
}
