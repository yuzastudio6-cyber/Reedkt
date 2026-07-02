import type {
  LyriaPromptValidationWarningCode,
  LyricLanguagePolicy,
  MusicCueRecord,
  MusicCultureRegion,
  MusicGenreFamily,
  MusicSceneType,
  VocalPolicy,
} from '../../types'

export interface MockLyriaPromptScenario {
  id: string
  title: string
  cueInput: Pick<
    MusicCueRecord,
    | 'cueRole'
    | 'sceneType'
    | 'targetDurationSeconds'
    | 'mood'
    | 'genreFamilies'
    | 'energyLevel'
    | 'energyArc'
    | 'cultureRegion'
    | 'vocalPolicy'
    | 'lyricLanguagePolicy'
    | 'speechSafety'
    | 'instrumentation'
    | 'duckingRequired'
    | 'loopableNeeded'
  >
  expectedPromptDirection: string
  expectedNegativePrompt: string
  expectedValidationWarnings: LyriaPromptValidationWarningCode[]
}

export const mockLyriaPromptScenarios: MockLyriaPromptScenario[] = [
  createScenario({
    id: 'lake-como-italian-luxury-travel',
    title: 'Lake Como / Italian luxury travel',
    sceneType: 'boat_movement',
    cultureRegion: 'european_luxury',
    genres: ['italian_inspired_pop', 'luxury_lounge', 'cinematic'],
    vocalPolicy: 'vocal_texture_only',
    expectedPromptDirection:
      '45-second elegant European luxury travel montage with warm acoustic guitar, soft brushed drums, piano sparkle, and no copied reference music.',
    expectedNegativePrompt:
      'No cliche tourist music, no copied reference track, no aggressive EDM drop, no abrupt ending.',
    warnings: [],
  }),
  createScenario({
    id: 'paris-lifestyle-french-montage',
    title: 'Paris lifestyle vlog with French montage cue',
    sceneType: 'city_walk',
    cultureRegion: 'france',
    genres: ['french_pop', 'indie_pop', 'electronic'],
    vocalPolicy: 'vocal_texture_only',
    expectedPromptDirection:
      '35-second French indie-pop inspired montage cue with tasteful electro-lounge rhythm and airy vocal texture only in no-speech moments.',
    expectedNegativePrompt:
      'No accordion cliche unless requested, no tourist-postcard pastiche, no copied song.',
    warnings: [],
  }),
  createScenario({
    id: 'simple-talking-head-dialogue-bed',
    title: 'Simple talking-head dialogue bed',
    sceneType: 'talking_head',
    cultureRegion: 'global',
    genres: ['ambient', 'cinematic', 'corporate'],
    vocalPolicy: 'instrumental_only',
    expectedPromptDirection:
      '60-second instrumental-only background bed for spoken voice with soft pads, subtle pulse, and clean ducking space.',
    expectedNegativePrompt:
      'No lyrics, no lead vocal, no vocal chops, no busy melody, no overpowering bass.',
    warnings: [],
    speechSafe: true,
  }),
  createScenario({
    id: 'faith-bible-teaching-subtle-bed',
    title: 'Faith / Bible teaching subtle music',
    sceneType: 'faith_reflective',
    cultureRegion: 'global',
    genres: ['faith_reflective', 'ambient', 'acoustic'],
    vocalPolicy: 'instrumental_only',
    expectedPromptDirection:
      '70-second reflective instrumental bed for serious faith teaching, calm and respectful without distracting rhythm.',
    expectedNegativePrompt:
      'No lyrics, no vocals, no manipulative drama, no distracting drums under teaching.',
    warnings: [],
    speechSafe: true,
  }),
  createScenario({
    id: 'real-estate-premium-walkthrough',
    title: 'Real estate premium walkthrough',
    sceneType: 'real_estate',
    cultureRegion: 'global',
    genres: ['cinematic', 'luxury_lounge', 'ambient'],
    vocalPolicy: 'instrumental_only',
    expectedPromptDirection:
      '60-second premium instrumental walkthrough bed with piano, warm pads, and subtle pulse under voiceover.',
    expectedNegativePrompt:
      'No lyrics under voice, no busy melody, no generic stock music feel, no harsh drums.',
    warnings: [],
    speechSafe: true,
  }),
  createScenario({
    id: 'fitness-high-energy-social',
    title: 'Fitness high-energy social',
    sceneType: 'fitness',
    cultureRegion: 'global',
    genres: ['electronic', 'house', 'hip_hop'],
    vocalPolicy: 'lyrics_allowed_only_without_speech',
    expectedPromptDirection:
      '30-second high-energy fitness social cue with punchy rhythm, modern electronic movement, and no lyrics under speech.',
    expectedNegativePrompt:
      'No muddy bass, no harsh distortion, no overly aggressive drop unless requested.',
    warnings: [],
  }),
  createScenario({
    id: 'saas-product-demo-clean-corporate',
    title: 'Product demo / SaaS clean corporate',
    sceneType: 'product_demo',
    cultureRegion: 'global',
    genres: ['corporate', 'ambient', 'electronic'],
    vocalPolicy: 'instrumental_only',
    expectedPromptDirection:
      '45-second clean modern instrumental bed for founder voiceover and software screen walkthrough.',
    expectedNegativePrompt:
      'No corporate jingle, no vocals, no busy melody, no stock music feel.',
    warnings: [],
    speechSafe: true,
  }),
  createScenario({
    id: 'food-social-warm-lifestyle',
    title: 'Food/social warm lifestyle',
    sceneType: 'food_social',
    cultureRegion: 'global',
    genres: ['acoustic', 'jazz', 'luxury_lounge'],
    vocalPolicy: 'instrumental_only',
    expectedPromptDirection:
      '35-second warm social cue for food, friends, laughter, table ambience, and relaxed lifestyle pacing.',
    expectedNegativePrompt:
      'No lyrics under table conversation, no comedy SFX unless requested, no overpowering bass.',
    warnings: [],
    speechSafe: true,
  }),
]

function createScenario(input: {
  id: string
  title: string
  sceneType: MusicSceneType
  cultureRegion: MusicCultureRegion
  genres: MusicGenreFamily[]
  vocalPolicy: VocalPolicy
  expectedPromptDirection: string
  expectedNegativePrompt: string
  warnings: LyriaPromptValidationWarningCode[]
  speechSafe?: boolean
}): MockLyriaPromptScenario {
  return {
    id: input.id,
    title: input.title,
    cueInput: {
      cueRole: input.sceneType === 'food_social'
        ? 'food_social_warmth'
        : input.sceneType === 'fitness'
          ? 'montage_driver'
          : input.speechSafe
            ? 'dialogue_bed'
            : 'travel_movement',
      sceneType: input.sceneType,
      targetDurationSeconds: input.sceneType === 'faith_reflective' ? 70 : input.sceneType === 'fitness' ? 30 : input.sceneType === 'city_walk' ? 35 : input.sceneType === 'food_social' ? 35 : 45,
      mood: input.sceneType === 'fitness' ? 'energetic' : input.sceneType === 'faith_reflective' ? 'calm' : input.sceneType === 'food_social' ? 'warm' : 'premium',
      genreFamilies: input.genres,
      energyLevel: input.sceneType === 'fitness' ? 'high' : input.speechSafe ? 'low' : 'medium',
      energyArc: input.sceneType === 'fitness' ? 'beat_drop' : input.speechSafe ? 'flat' : 'gentle_build',
      cultureRegion: input.cultureRegion,
      vocalPolicy: input.vocalPolicy,
      lyricLanguagePolicy: input.vocalPolicy === 'instrumental_only' ? 'no_lyrics' : chooseLyricLanguagePolicy(input.cultureRegion),
      speechSafety: input.speechSafe ? 'safe_under_voice' : 'montage_only',
      instrumentation: input.sceneType === 'fitness' ? ['punchy drums', 'energetic bass', 'modern synths'] : ['soft piano', 'warm pads', 'tasteful rhythm'],
      duckingRequired: Boolean(input.speechSafe),
      loopableNeeded: input.speechSafe ?? false,
    },
    expectedPromptDirection: input.expectedPromptDirection,
    expectedNegativePrompt: input.expectedNegativePrompt,
    expectedValidationWarnings: input.warnings,
  }
}

function chooseLyricLanguagePolicy(cultureRegion: MusicCultureRegion): LyricLanguagePolicy {
  if (cultureRegion === 'france') return 'french_allowed'
  if (cultureRegion === 'italy' || cultureRegion === 'european_luxury') return 'italian_allowed'
  if (cultureRegion === 'japan') return 'japanese_allowed'
  if (cultureRegion === 'latin_america' || cultureRegion === 'caribbean' || cultureRegion === 'tropical') return 'spanish_allowed'
  return 'user_specified'
}
