import type {
  SFXEQProfile,
  SFXEventPlanRecord,
  SFXReverbProfile,
  SFXStereoWidthProfile,
  SFXVolumeProfile,
} from '../../types'

export interface SFXToneGuidanceInput {
  sfxEventPlan?: SFXEventPlanRecord
  volumeProfile?: SFXVolumeProfile
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
}

function toneText(input: SFXToneGuidanceInput): string {
  return [
    input.videoTone,
    input.sfxEventPlan?.videoTone,
    input.sfxEventPlan?.sceneContext,
  ].join(' ').toLowerCase()
}

export function chooseSFXEQProfile(input: SFXToneGuidanceInput): SFXEQProfile {
  const text = toneText(input)

  if (input.volumeProfile === 'none') return 'none'
  if (input.speechPresent) return 'voice_safe'
  if (input.sfxEventPlan?.targetLayer === 'real_motion') return 'room_matched'
  if (/faith|serious|teaching|documentary|emotional/.test(text)) return 'warm_respectful'
  if (/luxury|premium|real estate|elegant/.test(text)) return 'premium_smooth'
  if (/fitness|high-energy|social/.test(text)) return 'tight_social'
  if (input.sfxEventPlan?.targetLayer === 'stroke_motion') return 'soften_harsh_highs'

  return 'soften_harsh_highs'
}

export function chooseSFXStereoWidthProfile(input: SFXToneGuidanceInput): SFXStereoWidthProfile {
  if (input.volumeProfile === 'none') return 'mono_center'
  if (input.speechPresent) return 'narrow'
  if (input.sfxEventPlan?.targetLayer === 'real_motion') return 'visual_positioned'
  if (input.sfxEventPlan?.targetLayer === 'stroke_motion') return 'narrow'
  if (input.sfxEventPlan?.targetLayer === 'montage_hit') return 'moderate'
  if (/montage|travel|vacation/.test(toneText(input))) return 'wide'

  return 'moderate'
}

export function chooseSFXReverbProfile(input: SFXToneGuidanceInput): SFXReverbProfile {
  const text = toneText(input)

  if (input.volumeProfile === 'none') return 'dry'
  if (input.sfxEventPlan?.targetLayer === 'real_motion' || input.ambienceImportant) return 'room_matched'
  if (/faith|serious|teaching|documentary|emotional/.test(text)) return 'warm_subtle'
  if (/luxury|premium|real estate|elegant/.test(text)) return 'premium_smooth'
  if (/outdoor|vacation|travel/.test(text)) return 'natural_air'
  if (/fitness|high-energy|social/.test(text)) return 'tight_social'
  if (input.speechPresent) return 'small_room'

  return 'dry'
}

export function createRoomMatchGuidance(input: SFXToneGuidanceInput): string {
  if (input.sfxEventPlan?.targetLayer === 'real_motion') {
    return 'Room match required: keep object movement plausible in the source scene.'
  }

  if (input.ambienceImportant) {
    return 'Room match important: preserve source ambience and avoid detached synthetic sounds.'
  }

  return 'Room match light: edit-layer polish can be clean, but should not feel detached.'
}

export function createReverbMatchGuidance(input: SFXToneGuidanceInput): string {
  const profile = chooseSFXReverbProfile(input)

  if (profile === 'room_matched') return 'Use natural room-matched reverb; avoid huge cinematic space.'
  if (profile === 'premium_smooth') return 'Use smooth premium space with no harsh tail.'
  if (profile === 'warm_subtle') return 'Use warm restrained space; avoid dramatic reverb.'
  if (profile === 'tight_social') return 'Use short tight reverb or dry hits.'
  if (profile === 'natural_air') return 'Use light natural air appropriate to travel/outdoor ambience.'
  if (profile === 'small_room') return 'Use subtle small-room space and protect dialogue.'

  return 'Keep the cue dry or nearly dry.'
}

export function createEQGuidance(input: SFXToneGuidanceInput): string[] {
  const profile = chooseSFXEQProfile(input)

  if (profile === 'none') return ['No EQ needed because no audible SFX is planned.']
  if (profile === 'voice_safe') return ['Soften harsh highs.', 'Avoid midrange masking around dialogue.']
  if (profile === 'premium_smooth') return ['Smooth highs.', 'Avoid cheap brightness and sharp transients.']
  if (profile === 'warm_respectful') return ['Keep tone warm and restrained.', 'Avoid sharp highs and hype-style hits.']
  if (profile === 'tight_social') return ['Allow controlled transient clarity.', 'Avoid distortion or clipping risk.']
  if (profile === 'room_matched') return ['Match object material and room tone.', 'Avoid exaggerated low-end impact.']

  return ['Soften harsh highs and keep the cue polished.']
}

export function createStereoWidthGuidance(input: SFXToneGuidanceInput): string {
  const profile = chooseSFXStereoWidthProfile(input)

  if (profile === 'mono_center') return 'Keep centered or silent.'
  if (profile === 'narrow') return 'Use narrow stereo width to protect dialogue and focus.'
  if (profile === 'visual_positioned') return 'Position width around the visual object when known.'
  if (profile === 'wide') return 'Moderate-wide stereo is acceptable for no-speech montage or travel moments.'

  return 'Use moderate stereo width.'
}

export function createSFXToneGuidanceSummary(input: SFXToneGuidanceInput): string[] {
  return [
    `EQ profile: ${chooseSFXEQProfile(input)}.`,
    `Stereo width: ${chooseSFXStereoWidthProfile(input)}.`,
    `Reverb profile: ${chooseSFXReverbProfile(input)}.`,
    createRoomMatchGuidance(input),
  ]
}
