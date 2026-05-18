import type {
  GeneratedMusicTrackRecord,
  MusicCueRole,
  MusicCueSheetItemRecord,
  MusicEnergyLevel,
  MusicGenreFamily,
  MusicMood,
  MusicQARecommendedAction,
  MusicQAStatus,
  MusicSpeechSafety,
  ReferenceAudioSectionType,
  VocalPolicy,
} from '../../types/audio-music'

const createdAt = '2026-05-17T00:00:00.000Z'

export type MockMusicQAScenario = {
  id: string
  label: string
  cue: MusicCueSheetItemRecord
  mockGeneratedTrack: GeneratedMusicTrackRecord
  userInstructions?: string
  useLakeComoReference?: boolean
  expectedQAResult: MusicQAStatus
  expectedMixPlan: string
  expectedRecommendedAction: MusicQARecommendedAction
}

function createCue(params: {
  id: string
  order: number
  label: string
  cueRole: MusicCueRole
  sectionType: ReferenceAudioSectionType
  mood?: MusicMood
  energyLevel?: MusicEnergyLevel
  vocalPolicy?: VocalPolicy
  speechSafety?: MusicSpeechSafety
  genreHints?: MusicGenreFamily[]
  ambienceNotes?: string[]
}): MusicCueSheetItemRecord {
  return {
    id: params.id,
    cueSheetId: 'mock-music-qa-cue-sheet',
    cueOrder: params.order,
    cueRole: params.cueRole,
    sectionType: params.sectionType,
    label: params.label,
    mood: params.mood ?? 'premium_lifestyle',
    energyLevel: params.energyLevel ?? 'medium',
    vocalPolicy: params.vocalPolicy ?? 'instrumental_only',
    speechSafety: params.speechSafety ?? 'speech_first',
    genreHints: params.genreHints ?? ['cinematic_lifestyle'],
    ambienceNotes: params.ambienceNotes ?? [],
    sfxNotes: ['Use original support SFX only if needed.'],
    adaptationNotes: ['Use professional music behavior; do not copy references.'],
    doNotCopyNotes: ['Do not copy melody, lyrics, track names, or exact cue timing.'],
  }
}

function createTrack(params: {
  id: string
  title: string
  cue: MusicCueSheetItemRecord
  durationSeconds?: number
  vocalHint?: GeneratedMusicTrackRecord['vocalHint']
  lyricLanguageHint?: string
  energyHint?: MusicEnergyLevel
  moodHint?: MusicMood
  genreHints?: MusicGenreFamily[]
  instrumentHints?: string[]
  bassIntensity?: GeneratedMusicTrackRecord['bassIntensity']
  artifactHint?: GeneratedMusicTrackRecord['artifactHint']
  loopHint?: GeneratedMusicTrackRecord['loopHint']
  endingHint?: GeneratedMusicTrackRecord['endingHint']
  hasSpeechInScene?: boolean
  userInstructionTags?: string[]
  provenance?: GeneratedMusicTrackRecord['provenance']
  reuseStatus?: GeneratedMusicTrackRecord['reuseStatus']
  referenceDnaId?: string
}): GeneratedMusicTrackRecord {
  return {
    id: params.id,
    projectId: 'mock-music-qa-project',
    cueSheetItemId: params.cue.id,
    promptPlanId: `prompt-${params.id}`,
    referenceDnaId: params.referenceDnaId,
    title: params.title,
    cueRole: params.cue.cueRole,
    sectionType: params.cue.sectionType,
    durationSeconds: params.durationSeconds ?? 24,
    provenance: params.provenance ?? 'mock_generated',
    reuseStatus: params.reuseStatus ?? 'project_only',
    vocalHint: params.vocalHint ?? 'none',
    lyricLanguageHint: params.lyricLanguageHint,
    energyHint: params.energyHint ?? params.cue.energyLevel,
    moodHint: params.moodHint ?? params.cue.mood,
    genreHints: params.genreHints ?? params.cue.genreHints,
    instrumentHints: params.instrumentHints ?? ['soft synth bed', 'warm piano'],
    bassIntensity: params.bassIntensity ?? 'low',
    artifactHint: params.artifactHint ?? 'none',
    loopHint: params.loopHint ?? 'clean',
    endingHint: params.endingHint ?? 'clean_resolve',
    hasSpeechInScene: params.hasSpeechInScene ?? params.cue.sectionType === 'dialogue',
    userInstructionTags: params.userInstructionTags ?? [],
    createdAt,
  }
}

const dialogueCue = createCue({
  id: 'music-qa-cue-dialogue-safe',
  order: 1,
  label: 'Dialogue bed',
  cueRole: 'dialogue_bed',
  sectionType: 'dialogue',
  mood: 'premium_lifestyle',
  energyLevel: 'low',
  vocalPolicy: 'no_vocals_under_dialogue',
  speechSafety: 'duck_under_voice',
})

const lakeMontageCue = createCue({
  id: 'music-qa-cue-lake-montage',
  order: 2,
  label: 'Lake Como movement montage',
  cueRole: 'montage_drive',
  sectionType: 'movement',
  mood: 'cinematic_travel',
  energyLevel: 'medium_high',
  vocalPolicy: 'lyrics_allowed_no_speech',
  speechSafety: 'montage_only_vocals',
  genreHints: ['cinematic_lifestyle', 'european_lounge'],
})

const foodSocialCue = createCue({
  id: 'music-qa-cue-food-social',
  order: 3,
  label: 'Food/social warmth',
  cueRole: 'warm_social',
  sectionType: 'food_social',
  mood: 'warm_social',
  energyLevel: 'medium',
  vocalPolicy: 'light_vocal_texture',
  speechSafety: 'speech_first',
  ambienceNotes: ['Preserve restaurant and friend ambience.'],
  genreHints: ['food_warm_social', 'acoustic_warm'],
})

export const mockMusicQAScenarios: MockMusicQAScenario[] = [
  {
    id: 'dialogue-bed-no-vocals-pass',
    label: 'Dialogue bed with no vocals - pass',
    cue: dialogueCue,
    mockGeneratedTrack: createTrack({
      id: 'mock-track-dialogue-safe',
      title: 'Soft instrumental dialogue bed',
      cue: dialogueCue,
      energyHint: 'low',
      hasSpeechInScene: true,
    }),
    expectedQAResult: 'passed',
    expectedMixPlan: 'Voice-first ducking at low level.',
    expectedRecommendedAction: 'use_track',
  },
  {
    id: 'dialogue-bed-with-lyrics-fail',
    label: 'Dialogue bed with lyrics - fail/regenerate without vocals',
    cue: dialogueCue,
    mockGeneratedTrack: createTrack({
      id: 'mock-track-dialogue-lyrics',
      title: 'Dialogue bed with lyrics',
      cue: dialogueCue,
      vocalHint: 'lyrics',
      lyricLanguageHint: 'english',
      hasSpeechInScene: true,
      userInstructionTags: ['instrumental_only'],
    }),
    userInstructions: 'Keep this section instrumental under dialogue.',
    expectedQAResult: 'failed',
    expectedMixPlan: 'Reject for dialogue and regenerate without vocals.',
    expectedRecommendedAction: 'regenerate_without_vocals',
  },
  {
    id: 'lake-como-montage-vocal-texture-pass',
    label: 'Lake Como montage with light vocal texture - pass if no speech',
    cue: lakeMontageCue,
    useLakeComoReference: true,
    mockGeneratedTrack: createTrack({
      id: 'mock-track-lake-montage-vocal-texture',
      title: 'Lake Como original montage vocal texture',
      cue: lakeMontageCue,
      vocalHint: 'vocal_texture',
      energyHint: 'medium_high',
      moodHint: 'cinematic_travel',
      hasSpeechInScene: false,
      referenceDnaId: 'mock-lake-como-reference',
    }),
    expectedQAResult: 'passed',
    expectedMixPlan: 'Montage can be louder with beat sync and no dialogue ducking.',
    expectedRecommendedAction: 'use_track',
  },
  {
    id: 'paris-lifestyle-french-vocal-texture-pass',
    label: 'Paris lifestyle montage with French vocal texture - pass if no speech',
    cue: createCue({
      id: 'music-qa-cue-paris-montage',
      order: 4,
      label: 'Paris lifestyle montage',
      cueRole: 'montage_drive',
      sectionType: 'montage',
      mood: 'premium_lifestyle',
      energyLevel: 'medium',
      vocalPolicy: 'lyrics_allowed_no_speech',
      speechSafety: 'montage_only_vocals',
      genreHints: ['indie_pop', 'electro_lounge'],
    }),
    mockGeneratedTrack: createTrack({
      id: 'mock-track-paris-vocal-texture',
      title: 'Elegant Paris electro lounge vocal texture',
      cue: createCue({
        id: 'music-qa-cue-paris-montage-track',
        order: 4,
        label: 'Paris lifestyle montage',
        cueRole: 'montage_drive',
        sectionType: 'montage',
        mood: 'premium_lifestyle',
        energyLevel: 'medium',
        vocalPolicy: 'lyrics_allowed_no_speech',
        speechSafety: 'montage_only_vocals',
        genreHints: ['indie_pop', 'electro_lounge'],
      }),
      vocalHint: 'vocal_texture',
      lyricLanguageHint: 'french',
      hasSpeechInScene: false,
      genreHints: ['indie_pop', 'electro_lounge'],
    }),
    expectedQAResult: 'passed',
    expectedMixPlan: 'Montage mix with no speech conflict.',
    expectedRecommendedAction: 'use_track',
  },
  {
    id: 'faith-teaching-dramatic-drums-fail',
    label: 'Faith teaching with dramatic drums - fail/regenerate lower energy',
    cue: createCue({
      id: 'music-qa-cue-faith-teaching',
      order: 5,
      label: 'Faith teaching bed',
      cueRole: 'dialogue_bed',
      sectionType: 'dialogue',
      mood: 'faith_reflective',
      energyLevel: 'low',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'duck_under_voice',
      genreHints: ['faith_reflective_instrumental'],
    }),
    mockGeneratedTrack: createTrack({
      id: 'mock-track-faith-dramatic-drums',
      title: 'Dramatic drum-heavy teaching bed',
      cue: createCue({
        id: 'music-qa-cue-faith-teaching-track',
        order: 5,
        label: 'Faith teaching bed',
        cueRole: 'dialogue_bed',
        sectionType: 'dialogue',
        mood: 'faith_reflective',
        energyLevel: 'low',
        vocalPolicy: 'instrumental_only',
        speechSafety: 'duck_under_voice',
        genreHints: ['faith_reflective_instrumental'],
      }),
      energyHint: 'high',
      moodHint: 'energetic',
      instrumentHints: ['big drums', 'cinematic impacts'],
      bassIntensity: 'high',
      hasSpeechInScene: true,
      userInstructionTags: ['faith_teaching', 'lower energy'],
    }),
    userInstructions: 'Keep the teaching respectful, subtle, and instrumental.',
    expectedQAResult: 'failed',
    expectedMixPlan: 'Regenerate lower energy before mix.',
    expectedRecommendedAction: 'regenerate_lower_energy',
  },
  {
    id: 'fitness-cue-too-soft-warning',
    label: 'Fitness cue too soft - warning/regenerate higher energy',
    cue: createCue({
      id: 'music-qa-cue-fitness',
      order: 6,
      label: 'Fitness movement cue',
      cueRole: 'montage_drive',
      sectionType: 'movement',
      mood: 'energetic',
      energyLevel: 'high',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'not_applicable',
      genreHints: ['fitness_electronic'],
    }),
    mockGeneratedTrack: createTrack({
      id: 'mock-track-fitness-too-soft',
      title: 'Soft fitness cue',
      cue: createCue({
        id: 'music-qa-cue-fitness-track',
        order: 6,
        label: 'Fitness movement cue',
        cueRole: 'montage_drive',
        sectionType: 'movement',
        mood: 'energetic',
        energyLevel: 'high',
        vocalPolicy: 'instrumental_only',
        speechSafety: 'not_applicable',
        genreHints: ['fitness_electronic'],
      }),
      energyHint: 'low',
      moodHint: 'energetic',
      hasSpeechInScene: false,
      userInstructionTags: ['fitness_social'],
    }),
    expectedQAResult: 'warning',
    expectedMixPlan: 'Can preview, but should be replaced or regenerated for stronger movement energy.',
    expectedRecommendedAction: 'use_with_mix_adjustment',
  },
  {
    id: 'food-social-too-loud-over-ambience',
    label: 'Food/social cue too loud over ambience - mix adjustment',
    cue: foodSocialCue,
    mockGeneratedTrack: createTrack({
      id: 'mock-track-food-too-loud',
      title: 'Warm social cue too loud',
      cue: foodSocialCue,
      energyHint: 'medium_high',
      moodHint: 'warm_social',
      bassIntensity: 'medium',
      hasSpeechInScene: false,
      userInstructionTags: ['preserve_ambience'],
    }),
    expectedQAResult: 'warning',
    expectedMixPlan: 'Lower cue and preserve restaurant/social ambience.',
    expectedRecommendedAction: 'use_with_mix_adjustment',
  },
  {
    id: 'outro-abrupt-ending-adjust',
    label: 'Outro with abrupt ending - mix adjustment or regenerate',
    cue: createCue({
      id: 'music-qa-cue-outro',
      order: 8,
      label: 'Outro resolve',
      cueRole: 'outro_resolve',
      sectionType: 'outro',
      mood: 'reflective',
      energyLevel: 'medium_low',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'speech_first',
    }),
    mockGeneratedTrack: createTrack({
      id: 'mock-track-outro-abrupt',
      title: 'Reflective outro with abrupt ending',
      cue: createCue({
        id: 'music-qa-cue-outro-track',
        order: 8,
        label: 'Outro resolve',
        cueRole: 'outro_resolve',
        sectionType: 'outro',
        mood: 'reflective',
        energyLevel: 'medium_low',
        vocalPolicy: 'instrumental_only',
        speechSafety: 'speech_first',
      }),
      endingHint: 'abrupt',
      energyHint: 'medium_low',
      moodHint: 'reflective',
      hasSpeechInScene: false,
    }),
    expectedQAResult: 'warning',
    expectedMixPlan: 'Add soft fade/resolve; regenerate only if fade cannot fix it.',
    expectedRecommendedAction: 'use_with_mix_adjustment',
  },
  {
    id: 'audio-artifacts-regenerate',
    label: 'Track has audio artifacts - regenerate',
    cue: lakeMontageCue,
    mockGeneratedTrack: createTrack({
      id: 'mock-track-artifacts',
      title: 'Artifact-heavy montage cue',
      cue: lakeMontageCue,
      artifactHint: 'severe',
      loopHint: 'bad_loop',
      hasSpeechInScene: false,
    }),
    expectedQAResult: 'failed',
    expectedMixPlan: 'Do not mix; regenerate before preview.',
    expectedRecommendedAction: 'regenerate',
  },
  {
    id: 'library-candidate-terms-review',
    label: 'Track fits well and becomes library candidate',
    cue: createCue({
      id: 'music-qa-cue-library-candidate',
      order: 10,
      label: 'Reusable premium bed',
      cueRole: 'brand_bed',
      sectionType: 'intro',
      mood: 'corporate_polished',
      energyLevel: 'medium',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'speech_first',
      genreHints: ['corporate_clean', 'electro_lounge'],
    }),
    mockGeneratedTrack: createTrack({
      id: 'mock-track-library-candidate',
      title: 'Reusable polished instrumental brand bed',
      cue: createCue({
        id: 'music-qa-cue-library-candidate-track',
        order: 10,
        label: 'Reusable premium bed',
        cueRole: 'brand_bed',
        sectionType: 'intro',
        mood: 'corporate_polished',
        energyLevel: 'medium',
        vocalPolicy: 'instrumental_only',
        speechSafety: 'speech_first',
        genreHints: ['corporate_clean', 'electro_lounge'],
      }),
      reuseStatus: 'terms_review_required',
      moodHint: 'corporate_polished',
      genreHints: ['corporate_clean', 'electro_lounge'],
      hasSpeechInScene: false,
    }),
    expectedQAResult: 'passed',
    expectedMixPlan: 'Ready; terms review required before reusable library promotion.',
    expectedRecommendedAction: 'use_track',
  },
]

export function getMockMusicQAScenarioById(id: string) {
  return mockMusicQAScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockMusicQAScenario() {
  return mockMusicQAScenarios[0]
}
