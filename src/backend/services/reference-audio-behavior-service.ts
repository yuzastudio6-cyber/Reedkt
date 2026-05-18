import type {
  ReferenceAudioBehaviorRecord,
  ReferenceAudioSectionRecord,
  ReferenceVideoObservationRecord,
} from '../../types/audio-music'
import { createMockId } from '../mock/mock-database'

function behavior(params: Omit<ReferenceAudioBehaviorRecord, 'id'>): ReferenceAudioBehaviorRecord {
  return {
    id: createMockId('reference-audio-behavior'),
    ...params,
  }
}

export function detectDialogueDuckingBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  return params.sections
    .filter((section) => section.sectionType === 'dialogue')
    .map((section) =>
      behavior({
        referenceDnaId: params.referenceDnaId,
        sectionId: section.id,
        behaviorType: 'music_duck_under_voice',
        description: 'Music stays instrumental and ducks under casual dialogue.',
        whyItWorks: 'Speech remains clear while the edit keeps a premium audio bed.',
        adaptationRule: 'Use voice-first ducking for user dialogue; do not place lyrics under important speech.',
        copyRisk: 'low',
      }),
    )
}

export function detectLyricsVsInstrumentalBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  const behaviors: ReferenceAudioBehaviorRecord[] = []

  params.sections.forEach((section) => {
    if (section.vocalPolicy === 'lyrics_allowed_no_speech') {
      behaviors.push(
        behavior({
          referenceDnaId: params.referenceDnaId,
          sectionId: section.id,
          behaviorType: 'lyrics_enter',
          description: 'Lyrics or vocal texture may appear only during montage/no-speech sections.',
          whyItWorks: 'Vocals can add lifestyle energy when they do not compete with dialogue.',
          adaptationRule: 'Allow only newly generated, non-copied vocal texture for no-speech montage cues.',
          copyRisk: 'copyright_risk',
        }),
      )
    }

    if (section.sectionType === 'dialogue') {
      behaviors.push(
        behavior({
          referenceDnaId: params.referenceDnaId,
          sectionId: section.id,
          behaviorType: 'lyrics_exit',
          description: 'Lyrics leave before dialogue or important speech.',
          whyItWorks: 'The viewer can understand personality and story without musical clutter.',
          adaptationRule: 'Switch to instrumental bed before speech begins.',
          copyRisk: 'low',
        }),
      )
    }
  })

  return behaviors
}

export function detectSfxBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  return params.sections
    .filter((section) => section.sectionType === 'chapter_title' || section.sectionType === 'transition' || section.sectionType === 'coming_up_teaser')
    .map((section) =>
      behavior({
        referenceDnaId: params.referenceDnaId,
        sectionId: section.id,
        behaviorType: section.sectionType === 'chapter_title' ? 'chapter_hit' : 'sfx_whoosh',
        description: 'Small transition or title-card punctuation supports structure.',
        whyItWorks: 'A restrained sound cue helps the viewer register a new chapter without feeling overproduced.',
        adaptationRule: 'Use a category-level light hit/whoosh idea only; never copy the reference sound effect.',
        copyRisk: 'copyright_risk',
      }),
    )
}

export function detectAmbienceBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
  observation: ReferenceVideoObservationRecord
}): ReferenceAudioBehaviorRecord[] {
  const scenicSections = params.sections.filter((section) =>
    section.sectionType === 'intro' ||
    section.sectionType === 'ambience_only' ||
    section.sectionType === 'food_social' ||
    section.sectionType === 'movement',
  )

  return scenicSections.map((section) =>
    behavior({
      referenceDnaId: params.referenceDnaId,
      sectionId: section.id,
      behaviorType: section.sectionType === 'movement' ? 'ambient_bridge' : 'room_tone_preserved',
      description: params.observation.ambienceNotes[0] ?? 'Natural ambience remains part of the style.',
      whyItWorks: 'Location sound makes lifestyle footage feel lived-in instead of sterile.',
      adaptationRule: 'Preserve useful source ambience and bridge scene changes softly.',
      copyRisk: 'low',
    }),
  )
}

export function detectChapterTitleAudioBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  return params.sections
    .filter((section) => section.sectionType === 'chapter_title')
    .map((section) =>
      behavior({
        referenceDnaId: params.referenceDnaId,
        sectionId: section.id,
        behaviorType: 'chapter_hit',
        description: 'Chapter/title card receives a small audio hit.',
        whyItWorks: 'The audio hit creates structure without requiring a copied title sequence.',
        adaptationRule: 'Create an original, restrained title-card hit if the user edit has chapter cards.',
        copyRisk: 'medium',
      }),
    )
}

export function detectOutroResolveBehavior(params: {
  referenceDnaId: string
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  return params.sections
    .filter((section) => section.sectionType === 'outro')
    .map((section) =>
      behavior({
        referenceDnaId: params.referenceDnaId,
        sectionId: section.id,
        behaviorType: 'outro_resolve',
        description: 'Music resolves softly or casually at the end.',
        whyItWorks: 'The ending feels complete without a hard stop.',
        adaptationRule: 'Resolve the user edit with a new soft ending cue or ambience-led close.',
        copyRisk: 'low',
      }),
    )
}

export function detectReferenceAudioBehaviors(params: {
  referenceDnaId: string
  observation: ReferenceVideoObservationRecord
  sections: ReferenceAudioSectionRecord[]
}): ReferenceAudioBehaviorRecord[] {
  const musicStarts = params.sections.slice(0, 1).map((section) =>
    behavior({
      referenceDnaId: params.referenceDnaId,
      sectionId: section.id,
      behaviorType: 'music_start',
      description: 'Music begins as an editorial cue, often before or during the teaser/setup.',
      whyItWorks: 'The viewer feels the edit style immediately.',
      adaptationRule: 'Start a new original cue where the user footage needs energy, not at copied timestamps.',
      copyRisk: 'copy_risk',
    }),
  )
  const movementRise = params.sections
    .filter((section) => section.sectionType === 'movement' || section.sectionType === 'montage')
    .map((section) =>
      behavior({
        referenceDnaId: params.referenceDnaId,
        sectionId: section.id,
        behaviorType: 'music_rise',
        description: 'Music rises during travel/movement montage.',
        whyItWorks: 'Energy follows visual motion and keeps the sequence from feeling flat.',
        adaptationRule: 'Raise energy for movement only when the user edit has a matching montage section.',
        copyRisk: 'low',
      }),
    )

  return [
    ...musicStarts,
    ...movementRise,
    ...detectDialogueDuckingBehavior(params),
    ...detectLyricsVsInstrumentalBehavior(params),
    ...detectSfxBehavior(params),
    ...detectAmbienceBehavior(params),
    ...detectChapterTitleAudioBehavior(params),
    ...detectOutroResolveBehavior(params),
  ]
}
