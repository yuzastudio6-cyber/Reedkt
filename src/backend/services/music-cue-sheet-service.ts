import type {
  MusicCueSheetItemRecord,
  MusicCueSheetRecord,
  MusicDirectorGuidanceRecord,
  ReferenceAudioSectionRecord,
  ReferenceMusicDNARecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

function cueItemFromSection(params: {
  cueSheetId: string
  section: ReferenceAudioSectionRecord
  index: number
}): MusicCueSheetItemRecord {
  const { cueSheetId, index, section } = params
  const hasTimeRange = typeof section.startTimeSeconds === 'number' && typeof section.endTimeSeconds === 'number'

  return {
    id: createMockId('music-cue-sheet-item'),
    cueSheetId,
    cueOrder: index + 1,
    cueRole: section.musicRole ?? 'custom',
    sectionType: section.sectionType,
    label: `${section.sectionType.replaceAll('_', ' ')} cue`,
    timeRange: hasTimeRange
      ? {
          startSeconds: section.startTimeSeconds ?? 0,
          endSeconds: section.endTimeSeconds ?? 0,
        }
      : undefined,
    mood: section.musicMood ?? 'premium_lifestyle',
    energyLevel: section.energyLevel ?? 'medium',
    vocalPolicy: section.vocalPolicy ?? 'instrumental_only',
    speechSafety: section.speechSafety ?? 'speech_first',
    genreHints: section.genreHints,
    ambienceNotes: [
      section.ambienceBehavior ?? 'Preserve useful ambience when it supports the edit.',
    ],
    sfxNotes: [
      section.sfxBehavior ?? 'No copied SFX; use original subtle support only if needed.',
    ],
    adaptationNotes: section.adaptationNotes,
    doNotCopyNotes: section.doNotCopyNotes,
  }
}

export function createMusicCueSheet(input: {
  projectId?: string
  editPlanId?: string
  guidance: MusicDirectorGuidanceRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  audioSections?: ReferenceAudioSectionRecord[]
}): MusicCueSheetRecord {
  const cueSheetId = createMockId('music-cue-sheet')
  const sections = input.audioSections ?? input.referenceMusicDNA?.audioSections ?? []
  const fallbackItems: MusicCueSheetItemRecord[] = [
    {
      id: createMockId('music-cue-sheet-item'),
      cueSheetId,
      cueOrder: 1,
      cueRole: input.guidance.recommendedCueStrategy === 'voice_first' ? 'dialogue_bed' : 'brand_bed',
      sectionType: 'dialogue',
      label: 'Voice-first music bed',
      mood: input.guidance.moodTargets[0] ?? 'premium_lifestyle',
      energyLevel: 'low',
      vocalPolicy: input.guidance.vocalPolicy,
      speechSafety: input.guidance.speechSafety,
      genreHints: input.guidance.genreFamilies,
      ambienceNotes: input.guidance.ambiencePriorities,
      sfxNotes: input.guidance.sfxNotes,
      adaptationNotes: input.guidance.adaptationRules,
      doNotCopyNotes: input.guidance.doNotCopyRules,
    },
  ]
  const items = sections.length > 0
    ? sections.map((section, index) => cueItemFromSection({ cueSheetId, section, index }))
    : fallbackItems

  return {
    id: cueSheetId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    referenceDnaId: input.referenceMusicDNA?.id ?? input.guidance.referenceDnaId,
    guidanceId: input.guidance.id,
    summary: `${items.length} mock music cue${items.length === 1 ? '' : 's'} planned from safe reference DNA guidance.`,
    items,
    doNotCopyRules: input.guidance.doNotCopyRules,
    createdAt: nowIso(),
  }
}

export function createReferenceGuidedCueSheet(input: {
  projectId?: string
  editPlanId?: string
  guidance: MusicDirectorGuidanceRecord
  referenceMusicDNA: ReferenceMusicDNARecord
}) {
  return createMusicCueSheet({
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    guidance: input.guidance,
    referenceMusicDNA: input.referenceMusicDNA,
    audioSections: input.referenceMusicDNA.audioSections,
  })
}
