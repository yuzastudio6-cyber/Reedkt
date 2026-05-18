import type {
  ReferenceAudioBehaviorRecord,
  ReferenceAudioSectionRecord,
  ReferenceMusicDNARecord,
  ReferenceSceneSectionRecord,
  ReferenceStyleAdaptationPlanRecord,
  ReferenceVideoCategory,
  ReferenceVideoObservationRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'
import { detectReferenceAudioBehaviors } from './reference-audio-behavior-service'
import {
  createReferenceAudioSections,
  summarizeReferenceCueStructure,
} from './reference-music-cue-boundary-service'
import {
  createDoNotCopyRules,
  createSafeStyleAdaptationPlan,
} from './reference-style-adaptation-service'

export function createReferenceVideoObservation(input: {
  projectId?: string
  referenceAssetId?: string
  referenceUrl?: string
  category: ReferenceVideoCategory
  title?: string
  summary: string
  durationSeconds?: number
  visualObservations?: string[]
  audioObservations?: string[]
  transcriptSummary?: string
  visualStyleNotes?: string[]
  pacingNotes?: string[]
  chapterStructureNotes?: string[]
  ambienceNotes?: string[]
  dialogueNotes?: string[]
  montageNotes?: string[]
}): ReferenceVideoObservationRecord {
  return {
    id: createMockId('reference-observation'),
    projectId: input.projectId,
    referenceAssetId: input.referenceAssetId,
    referenceUrl: input.referenceUrl,
    category: input.category,
    title: input.title,
    summary: input.summary,
    durationSeconds: input.durationSeconds,
    visualStyleNotes: [
      ...(input.visualStyleNotes ?? []),
      ...(input.visualObservations ?? []),
    ],
    pacingNotes: input.pacingNotes ?? ['Pacing is inferred from mock observations only.'],
    chapterStructureNotes: input.chapterStructureNotes ?? [],
    ambienceNotes: input.ambienceNotes ?? (input.audioObservations?.filter((note) => /ambience|ambient|room|natural/i.test(note)) ?? []),
    dialogueNotes: [
      ...(input.dialogueNotes ?? []),
      ...(input.transcriptSummary ? [`Transcript summary: ${input.transcriptSummary}`] : []),
    ],
    montageNotes: input.montageNotes ?? (input.audioObservations?.filter((note) => /montage|music|cue|energy/i.test(note)) ?? []),
    createdAt: nowIso(),
  }
}

export function createReferenceSceneSections(observation: ReferenceVideoObservationRecord): ReferenceSceneSectionRecord[] {
  const notes = [
    ...observation.chapterStructureNotes,
    ...observation.visualStyleNotes,
    ...observation.montageNotes,
  ]
  const fallback = [
    'Opening setup and reference style introduction.',
    'Dialogue or personality section.',
    'Montage or scenic section.',
    'Outro resolve.',
  ]
  const seeds = notes.length > 0 ? notes.slice(0, 6) : fallback

  return seeds.map((note, index) => ({
    id: createMockId('reference-scene-section'),
    referenceObservationId: observation.id,
    sectionOrder: index + 1,
    sectionType: /title|chapter/i.test(note)
      ? 'chapter_title'
      : /dialogue|voice|talk/i.test(note)
        ? 'dialogue'
        : /outro|resolve|ending/i.test(note)
          ? 'outro'
          : /montage|boat|movement|travel/i.test(note)
            ? 'movement'
            : 'intro',
    label: `Reference scene ${index + 1}`,
    sceneSummary: note,
    visualNotes: [note],
    pacingNotes: observation.pacingNotes.slice(0, 2),
    audioExpectation: 'Use as style DNA only; do not copy exact music or edit timing.',
  }))
}

export function createReferenceStyleSummary(params: {
  observation: ReferenceVideoObservationRecord
  sections: ReferenceAudioSectionRecord[]
}) {
  const sectionSummary = params.sections
    .map((section) => section.sectionType.replaceAll('_', ' '))
    .join(', ')

  return `${params.observation.summary} Audio style uses ${sectionSummary || 'mock-observed cue sections'} as professional reference DNA only.`
}

export function createReferenceDoNotCopyRules(extraRules: string[] = []) {
  return createDoNotCopyRules(extraRules)
}

export function createReferenceAdaptationPlan(params: {
  referenceDnaId: string
  observation: ReferenceVideoObservationRecord
  sections: ReferenceAudioSectionRecord[]
  behaviors: ReferenceAudioBehaviorRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
}): ReferenceStyleAdaptationPlanRecord {
  return createSafeStyleAdaptationPlan(params)
}

function collectBehaviorDescriptions(
  behaviors: ReferenceAudioBehaviorRecord[],
  pattern: RegExp,
) {
  return behaviors
    .filter((behavior) => pattern.test(behavior.behaviorType))
    .map((behavior) => behavior.description)
}

export function createReferenceVideoDNA(input: {
  observation: ReferenceVideoObservationRecord
  audioSections?: ReferenceAudioSectionRecord[]
  audioBehaviors?: ReferenceAudioBehaviorRecord[]
  adaptationPlan?: ReferenceStyleAdaptationPlanRecord
}): ReferenceMusicDNARecord {
  const referenceDnaId = input.audioSections?.[0]?.referenceDnaId ?? createMockId('reference-music-dna')
  const audioSections = input.audioSections ?? createReferenceAudioSections({
    referenceDnaId,
    observation: input.observation,
  })
  const audioBehaviors = input.audioBehaviors ?? detectReferenceAudioBehaviors({
    referenceDnaId,
    observation: input.observation,
    sections: audioSections,
  })
  const adaptationPlan = input.adaptationPlan ?? createReferenceAdaptationPlan({
    referenceDnaId,
    observation: input.observation,
    sections: audioSections,
    behaviors: audioBehaviors,
  })
  const doNotCopyRules = createReferenceDoNotCopyRules(adaptationPlan.doNotCopyRules)
  const cueBoundarySummary = summarizeReferenceCueStructure(audioSections)

  return {
    id: referenceDnaId,
    observationId: input.observation.id,
    projectId: input.observation.projectId,
    referenceAssetId: input.observation.referenceAssetId,
    referenceUrl: input.observation.referenceUrl,
    category: input.observation.category,
    title: input.observation.title,
    styleSummary: createReferenceStyleSummary({ observation: input.observation, sections: audioSections }),
    sceneMusicMapSummary: 'Reference sections map scene purpose to music role without copying exact cue timing.',
    cueBoundarySummary,
    musicCueBehavior: collectBehaviorDescriptions(audioBehaviors, /music_/),
    sfxBehavior: collectBehaviorDescriptions(audioBehaviors, /sfx|chapter_hit/),
    ambienceBehavior: collectBehaviorDescriptions(audioBehaviors, /ambient|room_tone/),
    chapterTitleAudioBehavior: collectBehaviorDescriptions(audioBehaviors, /chapter/),
    pacingMusicRelationship: [
      ...input.observation.pacingNotes,
      'Music energy follows scene function, not copied timestamps.',
    ],
    lyricsVsInstrumentalBehavior: [
      ...collectBehaviorDescriptions(audioBehaviors, /lyrics/),
      'Instrumental or very light texture is preferred under dialogue.',
    ],
    dialogueDuckingBehavior: collectBehaviorDescriptions(audioBehaviors, /duck/),
    adaptationRules: [
      ...adaptationPlan.musicAdaptationRules,
      ...adaptationPlan.sfxAdaptationRules,
      ...adaptationPlan.ambienceAdaptationRules,
      ...adaptationPlan.lyricsAdaptationRules,
    ],
    doNotCopyRules,
    safeMusicDirectorGuidance: [
      'Use reference DNA as a professional style guide only.',
      'Plan cue roles, mood, energy, ambience, and ducking for the user video.',
      'User instructions override reference DNA.',
    ],
    safeLyriaPromptGuidance: [
      'Style DNA only.',
      'Do not imitate or copy any existing song.',
      'Do not include artist names, track names, copied lyrics, or exact timestamps.',
    ],
    visualStyleNotes: input.observation.visualStyleNotes,
    pacingNotes: input.observation.pacingNotes,
    audioSections,
    audioBehaviors,
    createdAt: nowIso(),
  }
}
