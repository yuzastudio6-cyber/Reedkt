import type {
  LyricLanguagePolicy,
  MusicCultureRegion,
  MusicCueRole,
  MusicNeedDecision,
  MusicSceneType,
  MusicSpeechSafety,
  VocalPolicy,
} from '../../types'

export interface MusicPolicyContext {
  userPrompt?: string
  sceneType?: MusicSceneType
  cueRole?: MusicCueRole
  cultureRegion?: MusicCultureRegion
  hasImportantSpeech?: boolean
  dialogueHeavy?: boolean
  montageOnly?: boolean
  ambienceImportant?: boolean
  userRequestedLyrics?: boolean
  userRequestedNoMusic?: boolean
  spokenLanguages?: string[]
}

export function decideVocalPolicy(context: MusicPolicyContext): VocalPolicy {
  if (context.userRequestedLyrics && !context.hasImportantSpeech && !context.dialogueHeavy) {
    return 'user_requested_vocals'
  }

  if (context.hasImportantSpeech || context.dialogueHeavy) {
    return 'instrumental_only'
  }

  if (context.cueRole === 'coming_up_teaser' || context.cueRole === 'outro_resolve') {
    return 'vocal_texture_only'
  }

  if (context.montageOnly || context.cueRole === 'montage_driver' || context.cueRole === 'travel_movement') {
    return 'lyrics_allowed_only_without_speech'
  }

  return 'instrumental_only'
}

export function decideLyricLanguagePolicy(context: MusicPolicyContext): LyricLanguagePolicy {
  const vocalPolicy = decideVocalPolicy(context)

  if (vocalPolicy === 'instrumental_only' || vocalPolicy === 'no_vocals') {
    return 'no_lyrics'
  }

  if (context.hasImportantSpeech || context.dialogueHeavy) {
    return 'no_lyrics'
  }

  if (context.cultureRegion === 'france') {
    return 'french_allowed'
  }

  if (context.cultureRegion === 'italy' || context.cultureRegion === 'european_luxury') {
    return 'italian_allowed'
  }

  if (context.cultureRegion === 'japan') {
    return 'japanese_allowed'
  }

  if (context.cultureRegion === 'latin_america' || context.cultureRegion === 'caribbean' || context.cultureRegion === 'tropical') {
    return 'spanish_allowed'
  }

  return context.userRequestedLyrics ? 'user_specified' : 'no_lyrics'
}

export function decideSpeechSafety(context: MusicPolicyContext): MusicSpeechSafety {
  if (context.hasImportantSpeech || context.dialogueHeavy) {
    return context.ambienceImportant ? 'needs_ducking' : 'safe_under_voice'
  }

  if (context.cueRole === 'coming_up_teaser' || context.cueRole === 'outro_resolve') {
    return 'intro_outro_only'
  }

  if (context.montageOnly || context.cueRole === 'montage_driver' || context.cueRole === 'travel_movement') {
    return 'montage_only'
  }

  return 'safe_under_voice'
}

export function decideDuckingNeed(context: MusicPolicyContext): boolean {
  return Boolean(context.hasImportantSpeech || context.dialogueHeavy || context.ambienceImportant)
}

export function decideAmbienceVsMusic(context: MusicPolicyContext): MusicNeedDecision {
  if (context.userRequestedNoMusic) {
    return 'no_music'
  }

  if (context.ambienceImportant && (context.hasImportantSpeech || context.dialogueHeavy)) {
    return 'music_optional'
  }

  if (context.ambienceImportant && context.sceneType === 'documentary') {
    return 'ambience_only'
  }

  return 'music_needed'
}

export function createMusicAvoidRules(context: MusicPolicyContext): string[] {
  const rules = [
    'Do not copy reference tracks, melodies, lyrics, or copyrighted arrangements.',
    'Do not generate random background music without a cue purpose.',
  ]

  if (context.hasImportantSpeech || context.dialogueHeavy) {
    rules.push('No lyrics, lead vocals, busy melodies, or loud SFX under important speech.')
  }

  if (context.cultureRegion && context.cultureRegion !== 'global' && context.cultureRegion !== 'unknown') {
    rules.push('Use culture-aware style only when supported by user intent, footage, audience, and reference DNA.')
    rules.push('Avoid stereotypes and do not force cultural markers from location alone.')
  }

  if (context.ambienceImportant) {
    rules.push('Preserve useful room tone, place ambience, and natural environmental sound.')
  }

  return rules
}
