import type {
  MusicCultureRegion,
  MusicEnergyArc,
  MusicEnergyLevel,
  MusicGenreFamily,
  MusicMood,
  MusicSceneType,
  MusicStyleTaxonomyRecord,
} from '../../types'
import { nowIso } from '../mock/mock-database'

export interface MusicStyleContext {
  userPrompt?: string
  settingSummary?: string
  sceneType?: MusicSceneType
  cultureRegion?: MusicCultureRegion
  moodHint?: MusicMood
  referenceSummary?: string
  hasImportantSpeech?: boolean
}

export function chooseCultureRegion(context: MusicStyleContext): MusicCultureRegion {
  const text = normalize([context.userPrompt, context.settingSummary, context.referenceSummary].join(' '))

  if (text.includes('paris') || text.includes('france') || text.includes('french')) {
    return 'france'
  }

  if (text.includes('lake como') || text.includes('italy') || text.includes('italian') || text.includes('villa') || text.includes('european luxury')) {
    return 'european_luxury'
  }

  if (text.includes('japan') || text.includes('tokyo') || text.includes('kyoto')) {
    return 'japan'
  }

  if (text.includes('beach') || text.includes('tropical') || text.includes('island')) {
    return 'tropical'
  }

  if (text.includes('latin') || text.includes('caribbean') || text.includes('reggaeton')) {
    return 'latin_america'
  }

  return context.cultureRegion ?? 'global'
}

export function chooseGenreFamilies(context: MusicStyleContext): MusicGenreFamily[] {
  const text = normalize([context.userPrompt, context.settingSummary, context.referenceSummary].join(' '))
  const cultureRegion = context.cultureRegion ?? chooseCultureRegion(context)

  if (context.sceneType === 'faith_reflective' || text.includes('bible') || text.includes('faith')) {
    return ['faith_reflective', 'ambient', 'acoustic']
  }

  if (context.sceneType === 'real_estate' || text.includes('real estate')) {
    return ['cinematic', 'luxury_lounge', 'ambient']
  }

  if (context.sceneType === 'fitness') {
    return ['pop', 'electronic', 'house']
  }

  if (context.sceneType === 'product_demo' || text.includes('saas')) {
    return ['corporate', 'ambient', 'electronic']
  }

  if (context.sceneType === 'food_social') {
    return ['acoustic', 'jazz', 'luxury_lounge', 'lifestyle_vlog']
  }

  if (cultureRegion === 'france') {
    return ['french_pop', 'indie_pop', 'electronic', 'lifestyle_vlog']
  }

  if (cultureRegion === 'italy' || cultureRegion === 'european_luxury') {
    return ['italian_inspired_pop', 'luxury_lounge', 'cinematic', 'travel_vlog']
  }

  if (cultureRegion === 'japan') {
    return ['lofi_hip_hop', 'jazz', 'electronic']
  }

  if (cultureRegion === 'tropical') {
    return ['tropical_house', 'afrobeat', 'latin', 'dancehall']
  }

  if (context.sceneType === 'talking_head' || context.sceneType === 'dialogue' || context.hasImportantSpeech) {
    return ['ambient', 'cinematic', 'corporate']
  }

  return ['cinematic', 'pop', 'ambient']
}

export function chooseMood(context: MusicStyleContext): MusicMood {
  const text = normalize([context.userPrompt, context.settingSummary].join(' '))

  if (text.includes('faith') || text.includes('bible') || text.includes('serious')) {
    return 'inspirational'
  }

  if (text.includes('luxury') || context.sceneType === 'real_estate') {
    return 'premium'
  }

  if (context.sceneType === 'fitness') {
    return 'energetic'
  }

  if (context.sceneType === 'food_social') {
    return 'warm'
  }

  if (context.sceneType === 'coming_up_teaser') {
    return 'stylish'
  }

  if (context.sceneType === 'outro') {
    return 'warm'
  }

  return context.moodHint ?? 'calm'
}

export function chooseEnergyLevel(context: MusicStyleContext): MusicEnergyLevel {
  if (context.hasImportantSpeech || context.sceneType === 'talking_head' || context.sceneType === 'dialogue') {
    return 'low'
  }

  if (context.sceneType === 'fitness' || context.sceneType === 'coming_up_teaser') {
    return 'medium_high'
  }

  if (context.sceneType === 'travel_montage' || context.sceneType === 'boat_movement') {
    return 'medium'
  }

  if (context.sceneType === 'outro' || context.sceneType === 'faith_reflective') {
    return 'low'
  }

  return 'medium_low'
}

export function chooseEnergyArc(context: MusicStyleContext): MusicEnergyArc {
  if (context.sceneType === 'coming_up_teaser') {
    return 'teaser_peak_then_drop'
  }

  if (context.sceneType === 'travel_montage' || context.sceneType === 'boat_movement' || context.sceneType === 'fitness') {
    return 'montage_drive'
  }

  if (context.sceneType === 'outro') {
    return 'soft_resolve'
  }

  if (context.sceneType === 'chapter_transition') {
    return 'chapter_hit'
  }

  if (context.sceneType === 'faith_reflective') {
    return 'emotional_swell'
  }

  return context.hasImportantSpeech ? 'flat' : 'gentle_build'
}

export function chooseInstrumentation(context: MusicStyleContext): string[] {
  const genreFamilies = chooseGenreFamilies(context)

  if (genreFamilies.includes('faith_reflective')) {
    return ['soft piano', 'warm pads', 'gentle acoustic guitar', 'subtle strings']
  }

  if (genreFamilies.includes('french_pop')) {
    return ['warm guitar', 'soft bass', 'tasteful electro-lounge rhythm', 'airy vocal texture']
  }

  if (genreFamilies.includes('italian_inspired_pop') || genreFamilies.includes('luxury_lounge')) {
    return ['warm acoustic guitar', 'gentle piano', 'brushed drums', 'elegant bass']
  }

  if (context.sceneType === 'dialogue' || context.hasImportantSpeech) {
    return ['soft piano', 'warm pads', 'subtle pulse']
  }

  if (context.sceneType === 'fitness') {
    return ['punchy drums', 'bright synths', 'driving bass', 'short risers']
  }

  if (context.sceneType === 'food_social') {
    return ['muted guitar', 'light percussion', 'soft piano', 'warm bass']
  }

  return ['soft drums', 'warm keys', 'subtle bass', 'light texture']
}

export function chooseStyleFromReferenceDNA(context: MusicStyleContext): string {
  if (!context.referenceSummary) {
    return 'No reference DNA used.'
  }

  return 'Use reference structure, cue energy, ambience relationship, and pacing DNA only; do not copy any track, melody, lyrics, or arrangement.'
}

export function createStyleTaxonomyExamples(): MusicStyleTaxonomyRecord[] {
  return [
    createTaxonomy('french_lifestyle_pop', 'french_pop', 'French Lifestyle Pop', 'france', ['stylish', 'relaxed', 'premium']),
    createTaxonomy('italian_luxury_travel', 'italian_inspired_pop', 'Italian Luxury Travel', 'european_luxury', ['luxury', 'warm', 'premium']),
    createTaxonomy('instrumental_dialogue_bed', 'ambient', 'Instrumental Dialogue Bed', undefined, ['calm', 'clean', 'premium']),
    createTaxonomy('cinematic_premium_real_estate', 'cinematic', 'Cinematic Premium Real Estate', undefined, ['luxury', 'calm', 'premium']),
    createTaxonomy('faith_reflective', 'faith_reflective', 'Faith Reflective', undefined, ['hopeful', 'emotional', 'inspirational']),
    createTaxonomy('high_energy_social', 'pop', 'High-Energy Social', undefined, ['energetic', 'playful', 'stylish']),
    createTaxonomy('food_social_warmth', 'jazz', 'Food/Social Warmth', undefined, ['warm', 'playful', 'relaxed']),
  ]
}

function createTaxonomy(
  key: string,
  genreFamily: MusicGenreFamily,
  displayName: string,
  cultureRegion: MusicCultureRegion | undefined,
  commonMoods: MusicMood[],
): MusicStyleTaxonomyRecord {
  return {
    id: `mock-style-${key}`,
    taxonomyKey: key,
    genreFamily,
    displayName,
    description: `${displayName} mock taxonomy entry for SoundSync planning.`,
    commonMoods,
    commonInstruments: ['contextual instrumentation', 'voice-safe arrangement'],
    goodForSceneTypes: ['custom'],
    avoidForSceneTypes: ['dialogue'],
    speechSafetyDefault: 'needs_ducking',
    cultureRegion,
    examplePromptPhrases: ['mock planning phrase only'],
    avoidPromptPhrases: ['do not copy existing songs', 'avoid stereotypes'],
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

function normalize(value: string): string {
  return value.toLowerCase()
}
