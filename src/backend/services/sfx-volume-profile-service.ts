import type {
  EditQualityLevel,
  SFXEventPlanRecord,
  SFXTargetLayer,
  SFXVolumeProfile,
} from '../../types'

export interface SFXVolumeProfileInput {
  sfxEventPlan?: SFXEventPlanRecord
  targetLayer?: SFXTargetLayer
  videoTone?: string
  editLevel?: EditQualityLevel | string
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
}

function inputText(input: SFXVolumeProfileInput): string {
  return [
    input.videoTone,
    input.editLevel,
    input.sfxEventPlan?.videoTone,
    input.sfxEventPlan?.sceneContext,
    ...(input.userSFXInstructions ?? []),
    ...(input.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

export function chooseVolumeProfileFromTargetLayer(
  targetLayer?: SFXTargetLayer,
  speechPresent?: boolean,
): SFXVolumeProfile {
  if (targetLayer === 'none') return 'none'
  if (targetLayer === 'caption_emphasis') return 'whisper'
  if (targetLayer === 'stroke_motion') return speechPresent ? 'whisper' : 'subtle_polish'
  if (targetLayer === 'graphic_design') return 'subtle_polish'
  if (targetLayer === 'real_motion') return 'premium_soft'
  if (targetLayer === 'title_card' || targetLayer === 'chapter_card') return 'premium_soft'
  if (targetLayer === 'montage_hit') return speechPresent ? 'subtle_polish' : 'standard_social'
  if (targetLayer === 'cta_reveal') return 'subtle_polish'
  if (targetLayer === 'ambient_bridge') return speechPresent ? 'whisper' : 'subtle_polish'
  if (targetLayer === 'transition') return speechPresent ? 'subtle_polish' : 'premium_soft'

  return 'subtle_polish'
}

export function chooseVolumeProfileFromVideoTone(
  input: SFXVolumeProfileInput,
): SFXVolumeProfile | undefined {
  const text = inputText(input)

  if (/no sfx|silent|avoid sfx/.test(text)) return 'none'
  if (/faith|serious|teaching|documentary|emotional|respectful/.test(text)) return 'whisper'
  if (/luxury|real estate|premium|high-end|elegant/.test(text)) return 'premium_soft'
  if (/fitness|high-energy|energetic|hype|transformation/.test(text)) {
    return input.speechPresent ? 'standard_social' : 'impact'
  }
  if (/lifestyle|vacation|travel|social|product demo/.test(text)) return 'standard_social'

  return undefined
}

export function chooseVolumeProfileFromEditLevel(
  input: SFXVolumeProfileInput,
): SFXVolumeProfile | undefined {
  if (input.editLevel === 'basic' && input.speechPresent) return 'whisper'
  if (input.editLevel === 'signature' || input.editLevel === 'premium') {
    return input.speechPresent ? 'subtle_polish' : undefined
  }

  return undefined
}

export function chooseVolumeProfileFromSpeechContext(
  input: SFXVolumeProfileInput,
): SFXVolumeProfile | undefined {
  if (!input.speechPresent) return undefined
  if (input.sfxEventPlan?.targetLayer === 'montage_hit') return 'subtle_polish'
  if (input.sfxEventPlan?.targetLayer === 'ambient_bridge') return 'whisper'

  return undefined
}

export function chooseVolumeProfileFromUseCase(
  eventPlan?: SFXEventPlanRecord,
): SFXVolumeProfile | undefined {
  if (!eventPlan) return undefined
  if (eventPlan.useCase.includes('ambient')) return 'subtle_polish'
  if (eventPlan.useCase.includes('success_chime') || eventPlan.useCase.includes('cta')) return 'subtle_polish'
  if (eventPlan.useCase.includes('stroke')) return 'subtle_polish'
  if (eventPlan.useCase.includes('real_motion')) return 'premium_soft'

  return undefined
}

export function chooseSFXVolumeProfile(input: SFXVolumeProfileInput): SFXVolumeProfile {
  if (input.sfxEventPlan?.volumeProfile && input.sfxEventPlan.volumeProfile !== 'impact') {
    const toneOverride = chooseVolumeProfileFromVideoTone(input)
    return toneOverride ?? input.sfxEventPlan.volumeProfile
  }

  return chooseVolumeProfileFromSpeechContext(input) ??
    chooseVolumeProfileFromVideoTone(input) ??
    chooseVolumeProfileFromUseCase(input.sfxEventPlan) ??
    chooseVolumeProfileFromEditLevel(input) ??
    chooseVolumeProfileFromTargetLayer(input.targetLayer ?? input.sfxEventPlan?.targetLayer, input.speechPresent)
}

export function estimateTargetGainDb(profile: SFXVolumeProfile): number {
  if (profile === 'none') return -96
  if (profile === 'whisper') return -21
  if (profile === 'subtle_polish') return -15
  if (profile === 'premium_soft') return -13
  if (profile === 'standard_social') return -10
  return -6
}

export function createSFXVolumeProfileSummary(input: SFXVolumeProfileInput): string[] {
  const volumeProfile = chooseSFXVolumeProfile(input)

  return [
    `Volume profile: ${volumeProfile}.`,
    `Target gain hint: ${estimateTargetGainDb(volumeProfile)}dB relative planning feel.`,
    input.speechPresent
      ? 'Speech is present, so SFX should stay low and duck under voice.'
      : 'No speech is present, so SFX can be slightly more present when it supports the edit.',
  ]
}
