import type {
  ReferenceAdaptationRisk,
  ReferenceVideoCategory,
} from '../../types/audio-music'

export type MockReferenceVideoScenario = {
  id: string
  label: string
  category: ReferenceVideoCategory
  summary: string
  durationSeconds?: number
  visualStyleNotes: string[]
  pacingNotes: string[]
  likelyAudioSections: string[]
  likelyMusicBehavior: string[]
  likelySfxBehavior: string[]
  ambienceBehavior: string[]
  lyricsInstrumentalBehavior: string[]
  adaptationRules: string[]
  doNotCopyRules: string[]
  riskLevel: ReferenceAdaptationRisk
}

const baseDoNotCopyRules = [
  'Do not copy any track.',
  'Do not copy melody.',
  'Do not copy lyrics.',
  'Do not copy exact cue timing.',
  'Do not copy title card style exactly.',
  'Do not copy copyrighted SFX.',
]

export const mockReferenceVideoScenarios: MockReferenceVideoScenario[] = [
  {
    id: 'lake-como-luxury-lifestyle-vacation',
    label: 'Lake Como / luxury lifestyle vacation',
    category: 'luxury_travel',
    summary:
      'Luxury lifestyle vacation vlog with Lake Como / European travel feeling, cinematic visuals, friends, casual dialogue, coming-up teaser, chapter/title cards, boat/lake/villa/food/social scenes, natural ambience, montage sections, and soft travel resolve.',
    durationSeconds: 480,
    visualStyleNotes: [
      'Premium but casual European luxury travel feeling.',
      'Cinematic lake, villa, boat, food, and friend/group personality visuals.',
      'Chapter/title-card moments separate location or story phases.',
    ],
    pacingNotes: [
      'Not one single track for the whole edit.',
      'Music starts strong for teaser, relaxes for scenic/dialogue, rises during movement, and resolves softly in outro.',
      'Scene changes feel guided by music energy without copying exact timing.',
    ],
    likelyAudioSections: [
      'coming-up teaser with stronger music',
      'arrival / scenic setup with premium cinematic lifestyle mood',
      'dialogue sections with instrumental dialogue bed',
      'boat movement montage with rising energy',
      'villa/lake scenic section with ambience preserved',
      'food/social warmth section with playful warmth',
      'outro travel resolve',
    ],
    likelyMusicBehavior: [
      'multiple music cues',
      'instrumental under dialogue',
      'music rises during travel movement',
      'music relaxes during scenic/dialogue sections',
      'outro resolves softly',
    ],
    likelySfxBehavior: [
      'small chapter/title-card audio hit',
      'subtle transition whoosh if useful',
    ],
    ambienceBehavior: [
      'natural lake/boat/villa ambience preserved',
      'ambience is not stripped away',
      'ambient bridge can smooth scenic transitions',
    ],
    lyricsInstrumentalBehavior: [
      'lyrics or vocal texture only in montage/no-speech sections',
      'no lyrics under important dialogue',
    ],
    adaptationRules: [
      'Use premium European luxury travel feel.',
      'Use multi-cue planning if the user video has multiple scene modes.',
      'Preserve ambience.',
      'Use dialogue bed under speech.',
      'Allow light vocal texture only in no-speech montage.',
      'Use small SFX for chapter/title cards if helpful.',
    ],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'medium',
  },
  {
    id: 'paris-lifestyle-vlog',
    label: 'Paris lifestyle vlog',
    category: 'travel_vlog',
    summary: 'Elegant Paris lifestyle vlog with street walks, cafe moments, boutique details, personality dialogue, and light montage.',
    durationSeconds: 360,
    visualStyleNotes: ['Soft city texture.', 'Cafe and street lifestyle details.', 'Casual personality moments.'],
    pacingNotes: ['Gentle montage rhythm.', 'Dialogue breathes between scenic inserts.'],
    likelyAudioSections: ['intro street setup', 'dialogue', 'city montage', 'food/social cafe warmth', 'outro'],
    likelyMusicBehavior: ['French indie-pop / electro-lounge influence may work for montage scenes.'],
    likelySfxBehavior: ['minimal title hits only if chapter cards exist'],
    ambienceBehavior: ['preserve cafe and street ambience softly'],
    lyricsInstrumentalBehavior: ['avoid French vocals under dialogue', 'vocal texture only in montage if user approves'],
    adaptationRules: ['Use elegant city lifestyle mood.', 'Avoid accordion cliche unless user asks.'],
    doNotCopyRules: [...baseDoNotCopyRules, 'Do not copy any French song.'],
    riskLevel: 'stereotype_risk',
  },
  {
    id: 'japan-city-vlog',
    label: 'Japan city vlog',
    category: 'travel_vlog',
    summary: 'Japan city vlog with transit, night streets, food stops, quiet reflection, and energetic city montage.',
    durationSeconds: 420,
    visualStyleNotes: ['Clean city detail.', 'Neon/night motion.', 'Quiet reflective travel pauses.'],
    pacingNotes: ['Alternate calm observation and city movement.'],
    likelyAudioSections: ['intro', 'dialogue', 'movement montage', 'food/social', 'outro resolve'],
    likelyMusicBehavior: ['broad city-pop/electronic influence for montage only'],
    likelySfxBehavior: ['subtle transit/title punctuation'],
    ambienceBehavior: ['preserve station, street, and restaurant ambience carefully'],
    lyricsInstrumentalBehavior: ['instrumental under dialogue', 'avoid copied vocals'],
    adaptationRules: ['Use broad modern city energy.', 'Avoid stereotyped instrumentation or cultural caricature.'],
    doNotCopyRules: [...baseDoNotCopyRules, 'Do not copy any Japanese song, lyric, or artist style.'],
    riskLevel: 'stereotype_risk',
  },
  {
    id: 'tropical-beach-vacation',
    label: 'Tropical beach vacation',
    category: 'lifestyle_vacation',
    summary: 'Warm tropical vacation edit with beach ambience, movement montage, food/social scenes, and soft sunset ending.',
    durationSeconds: 390,
    visualStyleNotes: ['Warm beach color.', 'Water, sunset, friends, and relaxed travel details.'],
    pacingNotes: ['Montage rises around movement and relaxes at sunset.'],
    likelyAudioSections: ['intro', 'ambience only scenic setup', 'movement montage', 'food/social', 'outro'],
    likelyMusicBehavior: ['warm lifestyle groove without copying island music tropes'],
    likelySfxBehavior: ['minimal whooshes'],
    ambienceBehavior: ['preserve ocean and outdoor ambience'],
    lyricsInstrumentalBehavior: ['lyrics only in no-speech montage if suitable'],
    adaptationRules: ['Keep warm relaxed vacation feel.', 'Avoid cultural stereotypes.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'medium',
  },
  {
    id: 'real-estate-luxury-tour',
    label: 'Real estate luxury tour',
    category: 'real_estate',
    summary: 'Luxury property tour with elegant walkthrough, room transitions, exterior proof, and voiceover details.',
    durationSeconds: 300,
    visualStyleNotes: ['Smooth premium property pacing.', 'Architecture and detail shots.'],
    pacingNotes: ['Slow confidence with clean transitions.'],
    likelyAudioSections: ['intro', 'dialogue', 'ambience only', 'movement montage', 'outro'],
    likelyMusicBehavior: ['subtle premium bed, never distracting from property voiceover'],
    likelySfxBehavior: ['soft transition whooshes only when useful'],
    ambienceBehavior: ['preserve quiet room tone and walkthrough ambience'],
    lyricsInstrumentalBehavior: ['instrumental only'],
    adaptationRules: ['Use elegant low-energy music bed.', 'Keep property ambience clean.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'low',
  },
  {
    id: 'fitness-social-edit',
    label: 'Fitness social edit',
    category: 'fitness_social',
    summary: 'Energetic fitness short with quick setup, movement montage, beat hits, and confident outro.',
    durationSeconds: 90,
    visualStyleNotes: ['High-energy movement.', 'Fast social pacing.'],
    pacingNotes: ['Beat-driven movement and transitions.'],
    likelyAudioSections: ['intro', 'movement montage', 'transition', 'outro'],
    likelyMusicBehavior: ['high-energy electronic cue for movement'],
    likelySfxBehavior: ['beat hits and whooshes, not copied'],
    ambienceBehavior: ['gym ambience low under music'],
    lyricsInstrumentalBehavior: ['avoid lyrics if coach speech appears'],
    adaptationRules: ['Use beat energy to support movement.', 'Keep speech clear if present.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'medium',
  },
  {
    id: 'product-launch-ad',
    label: 'Product launch ad',
    category: 'ad',
    summary: 'Polished product launch ad with problem, reveal, feature montage, and CTA.',
    durationSeconds: 120,
    visualStyleNotes: ['Premium product callouts.', 'Clean brand-forward structure.'],
    pacingNotes: ['Clear reveal and CTA timing.'],
    likelyAudioSections: ['intro', 'chapter title', 'montage', 'outro'],
    likelyMusicBehavior: ['corporate-polished momentum cue'],
    likelySfxBehavior: ['small product reveal hit'],
    ambienceBehavior: ['ambience secondary to brand polish'],
    lyricsInstrumentalBehavior: ['instrumental preferred'],
    adaptationRules: ['Use brand-safe energy and product clarity.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'low',
  },
  {
    id: 'faith-teaching-video',
    label: 'Faith teaching video',
    category: 'faith_teaching',
    summary: 'Faith teaching reference with reflective voice-first tone, subtle instrumental bed, and minimal SFX.',
    durationSeconds: 600,
    visualStyleNotes: ['Respectful teaching focus.', 'Simple chapter structure.'],
    pacingNotes: ['Speech-first pacing with room for pauses.'],
    likelyAudioSections: ['intro', 'dialogue', 'chapter title', 'outro'],
    likelyMusicBehavior: ['subtle reflective instrumental bed'],
    likelySfxBehavior: ['no heavy SFX'],
    ambienceBehavior: ['preserve room tone lightly'],
    lyricsInstrumentalBehavior: ['no lyrics under teaching'],
    adaptationRules: ['Voice-first reflective instrumental.', 'Avoid manipulative dramatic music.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'low',
  },
  {
    id: 'food-social-vlog',
    label: 'Food/social vlog',
    category: 'food_social',
    summary: 'Warm food/social vlog with friends, restaurant ambience, short dialogue, and playful montage.',
    durationSeconds: 260,
    visualStyleNotes: ['Food details and social warmth.', 'Casual personality.'],
    pacingNotes: ['Warm montage balanced with dialogue moments.'],
    likelyAudioSections: ['intro', 'dialogue', 'food/social', 'montage', 'outro'],
    likelyMusicBehavior: ['warm playful cue with instrumental dialogue bed'],
    likelySfxBehavior: ['subtle pops only if graphic cards appear'],
    ambienceBehavior: ['preserve restaurant/social ambience without clutter'],
    lyricsInstrumentalBehavior: ['light vocal texture only during no-speech food montage'],
    adaptationRules: ['Keep warmth and human ambience.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'low',
  },
  {
    id: 'documentary-travel-story',
    label: 'Documentary travel story',
    category: 'documentary',
    summary: 'Documentary travel story with narration, location ambience, evidence-like chapter structure, and restrained music.',
    durationSeconds: 720,
    visualStyleNotes: ['Documentary-neutral travel visuals.', 'Chaptered story sections.'],
    pacingNotes: ['Measured pacing with narration clarity.'],
    likelyAudioSections: ['intro', 'dialogue', 'ambience only', 'chapter title', 'outro'],
    likelyMusicBehavior: ['minimal documentary bed and ambience-led transitions'],
    likelySfxBehavior: ['restrained chapter hit only if appropriate'],
    ambienceBehavior: ['location ambience supports credibility'],
    lyricsInstrumentalBehavior: ['instrumental only'],
    adaptationRules: ['Keep tone neutral and factual.', 'Do not sensationalize.'],
    doNotCopyRules: baseDoNotCopyRules,
    riskLevel: 'medium',
  },
]

export function getMockReferenceVideoScenarioById(id: string) {
  return mockReferenceVideoScenarios.find((scenario) => scenario.id === id)
}

export function getLakeComoReferenceScenario() {
  return mockReferenceVideoScenarios[0]
}
