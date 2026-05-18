import type {
  MusicDirectorGuidanceRecord,
  MusicGenreFamily,
  MusicMood,
  ReferenceAudioSectionRecord,
  ReferenceMusicDNARecord,
  ReferenceStyleAdaptationPlanRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}

function userDisablesMusic(userInstructions = '') {
  return /no music|remove music|voice only|no soundtrack/i.test(userInstructions)
}

export function createMusicDirectorGuidance(input: {
  projectId?: string
  userInstructions?: string
  referenceMusicDNA?: ReferenceMusicDNARecord
  adaptationPlan?: ReferenceStyleAdaptationPlanRecord
  audioSections?: ReferenceAudioSectionRecord[]
}): MusicDirectorGuidanceRecord {
  const sections = input.audioSections ?? input.referenceMusicDNA?.audioSections ?? []
  const cueRoles = unique(sections.flatMap((section) => section.musicRole ? [section.musicRole] : []))
  const moodTargets = unique(sections.flatMap((section) => section.musicMood ? [section.musicMood] : [])) as MusicMood[]
  const genreFamilies = unique(sections.flatMap((section) => section.genreHints)) as MusicGenreFamily[]
  const hasDialogue = sections.some((section) => section.sectionType === 'dialogue')
  const hasMontage = sections.some((section) => section.sectionType === 'montage' || section.sectionType === 'movement')
  const disabledByUser = userDisablesMusic(input.userInstructions)
  const recommendedCueStrategy = disabledByUser
    ? 'voice_first'
    : sections.length > 3 || hasMontage
      ? 'multi_cue'
      : hasDialogue
        ? 'voice_first'
        : 'single_cue'

  return {
    id: createMockId('music-director-guidance'),
    projectId: input.projectId,
    referenceDnaId: input.referenceMusicDNA?.id ?? input.adaptationPlan?.referenceDnaId,
    summary: disabledByUser
      ? 'User instructions request voice-first/no-music handling; reference DNA may inform ambience only.'
      : 'Reference DNA can guide cue roles, mood, energy, ambience, and ducking without copying the reference.',
    recommendedCueStrategy,
    cueRoles: disabledByUser ? ['none'] : cueRoles.length ? cueRoles : ['dialogue_bed'],
    moodTargets: moodTargets.length ? moodTargets : ['premium_lifestyle'],
    genreFamilies: genreFamilies.length ? genreFamilies : ['cinematic_lifestyle'],
    vocalPolicy: hasDialogue ? 'no_vocals_under_dialogue' : hasMontage ? 'lyrics_allowed_no_speech' : 'instrumental_only',
    speechSafety: hasDialogue ? 'duck_under_voice' : 'speech_first',
    ambiencePriorities: [
      'Preserve useful source ambience.',
      ...(input.referenceMusicDNA?.ambienceBehavior ?? []),
    ],
    sfxNotes: [
      'Use SFX categories only; do not copy exact reference effects.',
      ...(input.referenceMusicDNA?.sfxBehavior ?? []),
    ],
    userInstructionPriority: 'User instruction wins over reference DNA.',
    adaptationRules: input.adaptationPlan
      ? [
          ...input.adaptationPlan.musicAdaptationRules,
          ...input.adaptationPlan.ambienceAdaptationRules,
          ...input.adaptationPlan.lyricsAdaptationRules,
        ]
      : input.referenceMusicDNA?.adaptationRules ?? [],
    doNotCopyRules: input.adaptationPlan?.doNotCopyRules ?? input.referenceMusicDNA?.doNotCopyRules ?? [],
    createdAt: nowIso(),
  }
}
