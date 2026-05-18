import type {
  ReferenceAdaptationRisk,
  ReferenceAudioBehaviorRecord,
  ReferenceAudioSectionRecord,
  ReferenceMusicDNARecord,
  ReferenceStyleAdaptationPlanRecord,
  ReferenceVideoObservationRecord,
} from '../../types/audio-music'
import { createMockId } from '../mock/mock-database'

const universalBlockedInfluences = [
  'actual song',
  'melody',
  'lyrics',
  'artist style directly',
  'exact cue timing',
  'exact title sequence',
  'copyrighted SFX',
  'shot-for-shot structure',
]

export function createMusicAdaptationRules(params: {
  observation: ReferenceVideoObservationRecord
  sections: ReferenceAudioSectionRecord[]
}) {
  const multiCue = params.sections.length > 3

  return [
    multiCue
      ? 'Use multi-cue planning when the user video has multiple scene modes.'
      : 'Use a single cue only if the user video is simple and voice-first.',
    'Adapt cue role, mood, and energy arc rather than copying songs or timestamps.',
    params.sections.some((section) => section.sectionType === 'dialogue')
      ? 'Use instrumental dialogue beds under speech.'
      : 'Keep music supportive and proportional to the user footage.',
  ]
}

export function createSfxAdaptationRules(params: {
  sections: ReferenceAudioSectionRecord[]
  behaviors: ReferenceAudioBehaviorRecord[]
}) {
  const titleBehavior = params.behaviors.some((behavior) => behavior.behaviorType === 'chapter_hit')

  return [
    titleBehavior
      ? 'Use small original title-card hits only when the user edit has chapter/title cards.'
      : 'Use SFX only where they clarify a transition or visual beat.',
    'Do not copy the reference SFX sound, texture, or exact placement.',
    params.sections.some((section) => section.sectionType === 'transition')
      ? 'Keep transition SFX subtle and voice-safe.'
      : 'Avoid unnecessary transition sounds.',
  ]
}

export function createAmbienceAdaptationRules(params: {
  observation: ReferenceVideoObservationRecord
  behaviors: ReferenceAudioBehaviorRecord[]
}) {
  return [
    params.behaviors.some((behavior) => behavior.behaviorType === 'room_tone_preserved')
      ? 'Preserve useful natural ambience when it supports place and realism.'
      : 'Do not strip ambience automatically.',
    params.observation.ambienceNotes[0] ?? 'Use ambience as source context, not as a generated gimmick.',
    'Use ambient bridges only when scene changes need a smoother audio transition.',
  ]
}

export function createPacingAdaptationRules(params: {
  observation: ReferenceVideoObservationRecord
}) {
  return [
    params.observation.pacingNotes[0] ?? 'Adapt pacing relationship between cuts and music energy.',
    'Use reference pacing as a professional lesson, not an exact edit structure.',
    'User instructions override reference pacing when they conflict.',
  ]
}

export function createLyricsAdaptationRules(params: {
  sections: ReferenceAudioSectionRecord[]
}) {
  return [
    params.sections.some((section) => section.vocalPolicy === 'lyrics_allowed_no_speech')
      ? 'Lyrics or vocal texture may be considered only in no-speech montage sections.'
      : 'Prefer instrumental cues unless the user asks for vocal texture.',
    'Never copy reference lyrics.',
    'Never place lyrics under important dialogue.',
  ]
}

export function createCultureAdaptationRules(params: {
  observation: ReferenceVideoObservationRecord
}) {
  const summary = `${params.observation.summary} ${params.observation.visualStyleNotes.join(' ')}`.toLowerCase()

  if (/paris|french/.test(summary)) {
    return [
      'A French lifestyle reference may suggest elegant indie/electro-lounge mood.',
      'Avoid accordion cliches or French vocals unless the user asks.',
      'Do not copy any French song or artist style.',
    ]
  }

  if (/japan|tokyo|kyoto/.test(summary)) {
    return [
      'A Japan city reference may suggest clean city-pop/electronic energy at a broad mood level.',
      'Avoid stereotyped instrumentation or cultural caricature.',
      'Do not copy any Japanese song, lyric, or artist style.',
    ]
  }

  if (/como|italian|italy|european/.test(summary)) {
    return [
      'A Lake Como or European luxury reference may suggest premium cinematic/lifestyle warmth.',
      'Avoid stereotyped Italian cues unless the user explicitly requests them.',
      'Use culture-aware mood only, not copied songs or melodic signatures.',
    ]
  }

  return [
    'Use location or culture cues broadly and respectfully.',
    'Avoid stereotypes, caricature, and genre assumptions.',
  ]
}

export function createDoNotCopyRules(extraRules: string[] = []) {
  return [
    'Do not copy any track.',
    'Do not copy melody.',
    'Do not copy lyrics.',
    'Do not copy exact cue timing.',
    'Do not copy title card style exactly.',
    'Do not copy copyrighted SFX.',
    'Do not copy shot-for-shot edit structure.',
    'Do not include artist names or track names in prompts.',
    ...extraRules,
  ]
}

export function assessReferenceCopyRisk(params: {
  observation: ReferenceVideoObservationRecord
  behaviors: ReferenceAudioBehaviorRecord[]
}): ReferenceAdaptationRisk {
  const text = `${params.observation.summary} ${params.observation.dialogueNotes.join(' ')} ${params.observation.montageNotes.join(' ')}`.toLowerCase()

  if (/copy|same song|same lyrics|artist|track name/.test(text)) {
    return 'copy_risk'
  }

  if (params.behaviors.some((behavior) => behavior.copyRisk === 'copyright_risk')) {
    return 'copyright_risk'
  }

  if (/culture|french|japan|italian|tropical/.test(text)) {
    return 'medium'
  }

  return 'low'
}

export function createSafeStyleAdaptationPlan(params: {
  referenceDnaId: string
  projectId?: string
  observation: ReferenceVideoObservationRecord
  sections: ReferenceAudioSectionRecord[]
  behaviors: ReferenceAudioBehaviorRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
}): ReferenceStyleAdaptationPlanRecord {
  const doNotCopyRules = createDoNotCopyRules(params.referenceMusicDNA?.doNotCopyRules ?? [])

  return {
    id: createMockId('reference-adaptation-plan'),
    referenceDnaId: params.referenceDnaId,
    projectId: params.projectId ?? params.observation.projectId,
    allowedInfluences: [
      'music mood',
      'cue role',
      'energy arc',
      'pacing relationship',
      'ambience strategy',
      'dialogue bed strategy',
      'title-card SFX category',
      'lyrics-only-in-montage policy',
    ],
    blockedInfluences: universalBlockedInfluences,
    musicAdaptationRules: createMusicAdaptationRules(params),
    sfxAdaptationRules: createSfxAdaptationRules(params),
    ambienceAdaptationRules: createAmbienceAdaptationRules(params),
    pacingAdaptationRules: createPacingAdaptationRules(params),
    lyricsAdaptationRules: createLyricsAdaptationRules(params),
    cultureAdaptationRules: createCultureAdaptationRules(params),
    doNotCopyRules,
    riskLevel: assessReferenceCopyRisk(params),
  }
}
