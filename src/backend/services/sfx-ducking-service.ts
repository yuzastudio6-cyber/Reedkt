import type {
  DuckingStrategy,
  SFXDuckingIntensity,
  SFXEventPlanRecord,
  SFXVolumeProfile,
} from '../../types'

export interface SFXDuckingInput {
  sfxEventPlan?: SFXEventPlanRecord
  volumeProfile?: SFXVolumeProfile
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
}

function isLongLayer(eventPlan?: SFXEventPlanRecord): boolean {
  return eventPlan?.targetLayer === 'ambient_bridge' ||
    eventPlan?.targetLayer === 'transition' ||
    eventPlan?.targetLayer === 'real_motion'
}

export function shouldDuckSFXUnderVoice(input: SFXDuckingInput): boolean {
  return input.volumeProfile !== 'none' && input.speechPresent !== false
}

export function shouldDuckSFXUnderMusic(input: SFXDuckingInput): boolean {
  if (!input.musicPresent || input.volumeProfile === 'none') return false
  if (input.sfxEventPlan?.targetLayer === 'montage_hit') return false
  if (input.sfxEventPlan?.targetLayer === 'cta_reveal' || input.sfxEventPlan?.targetLayer === 'title_card') {
    return Boolean(input.speechPresent)
  }

  return isLongLayer(input.sfxEventPlan)
}

export function chooseSFXDuckingIntensity(input: SFXDuckingInput): SFXDuckingIntensity {
  if (input.volumeProfile === 'none') return 'none'
  if (input.speechPresent) return input.sfxEventPlan?.targetLayer === 'ambient_bridge' ? 'voice_first' : 'strong'
  if (input.musicPresent && isLongLayer(input.sfxEventPlan)) return 'medium'
  if (input.ambienceImportant) return 'light'

  return 'none'
}

export function chooseDuckingStrategy(input: SFXDuckingInput): DuckingStrategy {
  const intensity = chooseSFXDuckingIntensity(input)
  if (intensity === 'voice_first') return 'voice_first'
  if (intensity === 'strong') return 'strong'
  if (intensity === 'medium') return 'medium'
  if (intensity === 'light') return 'light'
  return 'none'
}

export function createVoiceFirstDuckingGuidance(input: SFXDuckingInput): string[] {
  if (!shouldDuckSFXUnderVoice(input)) return ['Voice ducking is not required for this mock context.']

  return [
    'Duck SFX under voice and keep spoken meaning first.',
    'Sidechain to voice in future mix workers.',
    'Do not let SFX mask important dialogue or teaching.',
  ]
}

export function createMusicDuckingGuidance(input: SFXDuckingInput): string[] {
  if (!input.musicPresent) return ['No music bed is present in this mock context.']
  if (!shouldDuckSFXUnderMusic(input)) {
    return ['SFX may briefly sit above music only at the planned hit point.']
  }

  return [
    'Duck longer SFX under music after the hit point.',
    'Avoid sustained SFX loudness over the music bed.',
  ]
}

export function createAmbienceProtectionGuidance(input: SFXDuckingInput): string[] {
  if (!input.ambienceImportant) return ['No special ambience protection is required.']

  return [
    'Protect source ambience and keep SFX restrained.',
    'Use room/reverb matching so the cue does not feel detached.',
  ]
}

export function createSFXDuckingSummary(input: SFXDuckingInput): string[] {
  return [
    `Ducking intensity: ${chooseSFXDuckingIntensity(input)}.`,
    shouldDuckSFXUnderVoice(input) ? 'Duck under voice.' : 'Voice ducking not required.',
    shouldDuckSFXUnderMusic(input) ? 'Duck under music after the hit.' : 'Music ducking is optional or not needed.',
  ]
}
