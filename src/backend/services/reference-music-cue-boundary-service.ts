import type {
  MusicCueRole,
  MusicEnergyLevel,
  MusicGenreFamily,
  MusicMood,
  MusicSpeechSafety,
  ReferenceAudioSectionRecord,
  ReferenceAudioSectionType,
  ReferenceVideoCategory,
  ReferenceVideoObservationRecord,
  VocalPolicy,
} from '../../types/audio-music'
import { createMockId } from '../mock/mock-database'

type SectionSeed = {
  sectionType: ReferenceAudioSectionType
  sceneSummary: string
}

function defaultSectionSeeds(category: ReferenceVideoCategory): SectionSeed[] {
  if (category === 'luxury_travel' || category === 'lifestyle_vacation' || category === 'travel_vlog') {
    return [
      { sectionType: 'coming_up_teaser', sceneSummary: 'Coming-up teaser with stronger energy and quick promise of the trip.' },
      { sectionType: 'intro', sceneSummary: 'Scenic arrival and premium location setup.' },
      { sectionType: 'dialogue', sceneSummary: 'Casual dialogue and personality moments that need voice-first music.' },
      { sectionType: 'movement', sceneSummary: 'Boat, walking, driving, or travel motion montage.' },
      { sectionType: 'food_social', sceneSummary: 'Warm social food, friends, and casual lifestyle section.' },
      { sectionType: 'outro', sceneSummary: 'Soft travel resolve and emotional/casual ending.' },
    ]
  }

  if (category === 'faith_teaching' || category === 'talking_head' || category === 'education') {
    return [
      { sectionType: 'intro', sceneSummary: 'Calm opening context.' },
      { sectionType: 'dialogue', sceneSummary: 'Voice-first teaching or explanation.' },
      { sectionType: 'chapter_title', sceneSummary: 'Small chapter/title punctuation if helpful.' },
      { sectionType: 'outro', sceneSummary: 'Gentle resolve without distracting vocals.' },
    ]
  }

  if (category === 'fitness_social') {
    return [
      { sectionType: 'intro', sceneSummary: 'Fast setup.' },
      { sectionType: 'movement', sceneSummary: 'High-energy movement montage.' },
      { sectionType: 'transition', sceneSummary: 'Beat-driven transitions.' },
      { sectionType: 'outro', sceneSummary: 'Confident finish.' },
    ]
  }

  return [
    { sectionType: 'intro', sceneSummary: 'Opening setup.' },
    { sectionType: 'dialogue', sceneSummary: 'Voice-first informational section.' },
    { sectionType: 'montage', sceneSummary: 'Visual montage section.' },
    { sectionType: 'outro', sceneSummary: 'Ending resolve.' },
  ]
}

function sectionTypeFromText(text: string): ReferenceAudioSectionType {
  const normalized = text.toLowerCase()

  if (/coming.?up|teaser|preview/.test(normalized)) return 'coming_up_teaser'
  if (/chapter|title/.test(normalized)) return 'chapter_title'
  if (/dialogue|voice|talk|teaching|speech/.test(normalized)) return 'dialogue'
  if (/boat|movement|travel|drive|walk|motion/.test(normalized)) return 'movement'
  if (/food|social|friends|meal/.test(normalized)) return 'food_social'
  if (/ambient|ambience|room tone|natural sound/.test(normalized)) return 'ambience_only'
  if (/transition|crossfade|whoosh/.test(normalized)) return 'transition'
  if (/outro|ending|resolve|close/.test(normalized)) return 'outro'
  if (/montage|b-roll|broll/.test(normalized)) return 'montage'
  if (/intro|arrival|opening|setup/.test(normalized)) return 'intro'

  return 'custom'
}

export function classifyReferenceAudioSection(sectionText: string): ReferenceAudioSectionType {
  return sectionTypeFromText(sectionText)
}

function roleForSection(sectionType: ReferenceAudioSectionType): MusicCueRole {
  const roles: Record<ReferenceAudioSectionType, MusicCueRole> = {
    ambience_only: 'ambient_bridge',
    chapter_title: 'chapter_punctuation',
    coming_up_teaser: 'teaser',
    custom: 'custom',
    dialogue: 'dialogue_bed',
    food_social: 'warm_social',
    intro: 'intro_arrival',
    montage: 'montage_drive',
    movement: 'montage_drive',
    outro: 'outro_resolve',
    transition: 'chapter_punctuation',
  }

  return roles[sectionType]
}

function moodForSection(sectionType: ReferenceAudioSectionType, category: ReferenceVideoCategory): MusicMood {
  if (category === 'faith_teaching') return 'faith_reflective'
  if (category === 'education') return 'educational_clean'
  if (category === 'documentary') return 'documentary_neutral'
  if (category === 'product_demo' || category === 'ad') return 'corporate_polished'

  const moods: Partial<Record<ReferenceAudioSectionType, MusicMood>> = {
    coming_up_teaser: 'energetic',
    food_social: 'warm_social',
    intro: 'premium_lifestyle',
    movement: 'cinematic_travel',
    outro: 'reflective',
  }

  return moods[sectionType] ?? 'premium_lifestyle'
}

function energyForSection(sectionType: ReferenceAudioSectionType): MusicEnergyLevel {
  const energy: Record<ReferenceAudioSectionType, MusicEnergyLevel> = {
    ambience_only: 'low',
    chapter_title: 'medium_low',
    coming_up_teaser: 'medium_high',
    custom: 'medium',
    dialogue: 'low',
    food_social: 'medium',
    intro: 'medium_low',
    montage: 'medium_high',
    movement: 'medium_high',
    outro: 'medium_low',
    transition: 'medium',
  }

  return energy[sectionType]
}

function vocalPolicyForSection(sectionType: ReferenceAudioSectionType): VocalPolicy {
  if (sectionType === 'dialogue') return 'no_vocals_under_dialogue'
  if (sectionType === 'montage' || sectionType === 'movement') return 'lyrics_allowed_no_speech'
  if (sectionType === 'food_social') return 'light_vocal_texture'
  return 'instrumental_only'
}

function speechSafetyForSection(sectionType: ReferenceAudioSectionType): MusicSpeechSafety {
  if (sectionType === 'dialogue') return 'duck_under_voice'
  if (sectionType === 'montage' || sectionType === 'movement') return 'montage_only_vocals'
  return 'speech_first'
}

function genreHintsForCategory(category: ReferenceVideoCategory): MusicGenreFamily[] {
  const hints: Partial<Record<ReferenceVideoCategory, MusicGenreFamily[]>> = {
    ad: ['corporate_clean'],
    documentary: ['documentary_minimal', 'ambient_cinematic'],
    faith_teaching: ['faith_reflective_instrumental'],
    fitness_social: ['fitness_electronic'],
    food_social: ['food_warm_social', 'acoustic_warm'],
    luxury_travel: ['cinematic_lifestyle', 'european_lounge', 'ambient_cinematic'],
    product_demo: ['corporate_clean', 'electro_lounge'],
    real_estate: ['cinematic_lifestyle', 'ambient_cinematic'],
    travel_vlog: ['cinematic_lifestyle', 'indie_pop'],
  }

  return hints[category] ?? ['cinematic_lifestyle']
}

export function createReferenceAudioSections(params: {
  referenceDnaId: string
  observation: ReferenceVideoObservationRecord
  sectionSummaries?: string[]
}): ReferenceAudioSectionRecord[] {
  const seeds = params.sectionSummaries?.length
    ? params.sectionSummaries.map((summary) => ({
        sectionType: classifyReferenceAudioSection(summary),
        sceneSummary: summary,
      }))
    : defaultSectionSeeds(params.observation.category)
  const approximateSectionDuration = params.observation.durationSeconds
    ? Math.round(params.observation.durationSeconds / seeds.length)
    : undefined

  return seeds.map((seed, index) => {
    const startTimeSeconds = approximateSectionDuration === undefined ? undefined : index * approximateSectionDuration
    const endTimeSeconds = approximateSectionDuration === undefined ? undefined : Math.min((index + 1) * approximateSectionDuration, params.observation.durationSeconds ?? 0)

    return {
      id: createMockId('reference-audio-section'),
      referenceDnaId: params.referenceDnaId,
      sectionOrder: index + 1,
      sectionType: seed.sectionType,
      startTimeSeconds,
      endTimeSeconds,
      sceneSummary: seed.sceneSummary,
      musicRole: roleForSection(seed.sectionType),
      musicMood: moodForSection(seed.sectionType, params.observation.category),
      energyLevel: energyForSection(seed.sectionType),
      vocalPolicy: vocalPolicyForSection(seed.sectionType),
      speechSafety: speechSafetyForSection(seed.sectionType),
      genreHints: genreHintsForCategory(params.observation.category),
      ambienceBehavior: seed.sectionType === 'ambience_only' || seed.sectionType === 'intro'
        ? 'Preserve natural ambience as part of the professional feel.'
        : 'Keep ambience present when it supports location and realism.',
      sfxBehavior: seed.sectionType === 'chapter_title' || seed.sectionType === 'transition'
        ? 'Use a small category-level hit/whoosh idea only; do not copy the reference SFX.'
        : 'SFX remain subtle and supportive.',
      transitionBehavior: 'Observe transition feel only, never exact timing.',
      adaptationNotes: [
        'Use this section as a style cue, not as an exact structural copy.',
        seed.sectionType === 'dialogue' ? 'Use instrumental/ducked music under speech.' : 'Adapt energy and mood to the user footage.',
      ],
      doNotCopyNotes: [
        'Do not copy exact cue timing.',
        'Do not copy the reference song, melody, lyrics, title sequence, or SFX.',
      ],
    }
  })
}

export function detectReferenceCueBoundaries(params: {
  referenceDnaId: string
  observation: ReferenceVideoObservationRecord
  sectionSummaries?: string[]
}) {
  return createReferenceAudioSections(params)
}

export function summarizeReferenceCueStructure(sections: ReferenceAudioSectionRecord[]) {
  if (sections.length === 0) {
    return 'No reference cue sections detected from mock observations.'
  }

  return sections
    .map((section) => `${section.sectionOrder}. ${section.sectionType.replaceAll('_', ' ')} (${section.musicRole ?? 'no music role'})`)
    .join(' -> ')
}
