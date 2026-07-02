import type { MusicCueRecord, MusicCultureRegion, MusicGenreFamily, ReferenceMusicDNARecord } from '../../types'

export interface LyriaNegativePromptInput {
  cue: MusicCueRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  userAvoidInstructions?: string[]
}

export function buildLyriaNegativePrompt(input: LyriaNegativePromptInput): string {
  return uniqueStrings([
    ...buildReferenceCopyAvoidancePrompt(input.referenceMusicDNA),
    ...buildSpeechSafetyNegativePrompt(input.cue),
    ...buildCultureStereotypeNegativePrompt(input.cue.cultureRegion),
    ...input.cue.negativePromptGoals,
    ...buildGenreSpecificNegativePrompt(input.cue.genreFamilies),
    ...buildArtifactAvoidancePrompt(),
    ...(input.userAvoidInstructions ?? []),
  ]).join(' ')
}

export function buildSpeechSafetyNegativePrompt(cue: MusicCueRecord): string[] {
  const rules = [
    'No unwanted lyrics.',
    'No distracting lead melody.',
    'No harsh drums.',
    'No overpowering bass.',
  ]

  if (cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking' || cue.duckingRequired) {
    rules.push('No vocals under speech.')
    rules.push('No lead vocal, vocal chops, or busy midrange elements that compete with dialogue.')
  }

  if (cue.vocalPolicy === 'instrumental_only' || cue.vocalPolicy === 'no_vocals') {
    rules.push('No vocals, no lyrics, and no vocal hooks.')
  }

  return rules
}

export function buildCultureStereotypeNegativePrompt(cultureRegion: MusicCultureRegion): string[] {
  if (cultureRegion === 'france') {
    return [
      'No cultural stereotypes.',
      'No accordion cliche unless explicitly requested.',
      'No tourist-postcard French pastiche.',
    ]
  }

  if (cultureRegion === 'italy' || cultureRegion === 'european_luxury') {
    return [
      'No cultural stereotypes.',
      'No cliche tourist music.',
      'No exaggerated mandolin or opera-style treatment unless explicitly requested.',
    ]
  }

  if (cultureRegion === 'japan') {
    return [
      'No cultural stereotypes.',
      'No overdone parody of Japanese music.',
      'No gimmicky traditional instrument use unless the scene clearly supports it.',
    ]
  }

  if (cultureRegion === 'tropical' || cultureRegion === 'latin_america' || cultureRegion === 'caribbean') {
    return [
      'No cultural stereotypes.',
      'No forced tropical party cliche.',
      'No genre tokenism disconnected from the actual scene.',
    ]
  }

  return ['No cultural stereotypes.']
}

export function buildReferenceCopyAvoidancePrompt(referenceMusicDNA?: ReferenceMusicDNARecord): string[] {
  if (!referenceMusicDNA) {
    return ['Do not imitate or copy any existing song.']
  }

  return [
    'Do not imitate or copy any existing song.',
    'Do not copy reference tracks, melodies, lyrics, chord progressions, hooks, or distinctive arrangements.',
    ...referenceMusicDNA.doNotCopyRules,
  ]
}

export function buildGenreSpecificNegativePrompt(genreFamilies: MusicGenreFamily[]): string[] {
  const rules: string[] = []

  if (genreFamilies.includes('electronic') || genreFamilies.includes('house') || genreFamilies.includes('tropical_house')) {
    rules.push('No aggressive EDM drop unless explicitly requested.')
    rules.push('No harsh synths or brittle high-frequency percussion.')
  }

  if (genreFamilies.includes('hip_hop') || genreFamilies.includes('trap')) {
    rules.push('No muddy 808 bass.')
    rules.push('No explicit lyrical style.')
  }

  if (genreFamilies.includes('corporate')) {
    rules.push('No generic stock music feel.')
    rules.push('No overly cheerful corporate jingle.')
  }

  if (genreFamilies.includes('faith_reflective')) {
    rules.push('No manipulative drama.')
    rules.push('No distracting rhythm under teaching.')
  }

  return rules
}

export function buildArtifactAvoidancePrompt(): string[] {
  return [
    'No distorted or low-quality audio.',
    'No abrupt ending.',
    'No muddy mix.',
    'No obvious generation artifacts.',
    'No clipping.',
  ]
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
