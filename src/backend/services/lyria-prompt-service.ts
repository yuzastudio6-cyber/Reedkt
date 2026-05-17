import type {
  LyriaPromptPlanRecord,
  LyriaPromptSegment,
  LyriaPromptValidationWarning,
  MusicContextAnalysisRecord,
  MusicCueRecord,
  MusicCueRole,
  MusicCueSheetRecord,
  MusicGenerationPurpose,
  MusicLanguageContextRecord,
  MusicSceneType,
  ReferenceMusicDNARecord,
} from '../../types'
import { LYRIA_PRO_FUTURE_MODEL_NAME } from '../../types'
import { createMockId, nowIso } from '../mock/mock-database'
import { buildLyriaNegativePrompt } from './lyria-negative-prompt-service'
import { validateLyriaPromptPlan } from './lyria-prompt-validation-service'

export interface BuildLyriaPromptPlanInput {
  cue: MusicCueRecord
  cueSheet?: MusicCueSheetRecord
  musicContextAnalysis?: MusicContextAnalysisRecord
  languageContexts?: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  userInstruction?: string
  avoidInstruction?: string
}

export interface BuildLyriaPromptPlanResult {
  promptPlan: LyriaPromptPlanRecord
  promptSegments: LyriaPromptSegment[]
  warnings: LyriaPromptValidationWarning[]
}

export interface BuildLyriaPromptsForCueSheetInput {
  cueSheet: MusicCueSheetRecord
  cues: MusicCueRecord[]
  musicContextAnalysis?: MusicContextAnalysisRecord
  languageContexts?: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  userInstruction?: string
  avoidInstruction?: string
}

export interface BuildLyriaPromptsForCueSheetResult {
  promptPlans: LyriaPromptPlanRecord[]
  promptSegments: LyriaPromptSegment[]
  validationWarnings: LyriaPromptValidationWarning[]
}

export function buildLyriaPromptPlan(input: BuildLyriaPromptPlanInput): BuildLyriaPromptPlanResult {
  const { cue } = input
  const promptPlanId = createMockId('lyria-prompt-plan')
  const durationSeconds = getCueDuration(cue)
  const promptSegments = buildTimestampedStructure(cue, promptPlanId, durationSeconds)
  const prompt = buildLyriaPromptFromCue({ ...input, promptSegments, durationSeconds })
  const negativePrompt = buildLyriaNegativePrompt({
    cue,
    referenceMusicDNA: input.referenceMusicDNA,
    userAvoidInstructions: [input.avoidInstruction ?? ''].filter(Boolean),
  })
  const instrumentalOnly = shouldForceInstrumental(cue)
  const lyricsAllowed = !instrumentalOnly && cueAllowsVocalsOrLyrics(cue)
  const promptPlan: LyriaPromptPlanRecord = {
    id: promptPlanId,
    projectId: cue.projectId,
    editPlanId: cue.editPlanId,
    musicCueSheetId: cue.musicCueSheetId,
    musicCueId: cue.id,
    generationPurpose: chooseGenerationPurpose(cue),
    modelName: LYRIA_PRO_FUTURE_MODEL_NAME,
    providerName: 'Lyria Pro',
    prompt,
    negativePrompt,
    durationSeconds,
    outputFormat: 'wav',
    instrumentalOnly,
    lyricsAllowed,
    targetLanguage: getTargetLanguage(cue, input.languageContexts),
    timestampedStructure: promptSegments,
    styleConstraints: buildPromptStyleConstraints(cue),
    timingConstraints: buildPromptTimingConstraints(cue, promptSegments),
    speechSafetyInstructions: buildSpeechSafetyInstructions(cue),
    cultureContextInstructions: buildCultureContextInstructions(cue, input.languageContexts),
    qualityInstructions: buildPromptQualityInstructions(cue, input.referenceMusicDNA),
    status: 'planned',
    notes: [
      'Mock Lyria Pro prompt plan only. No generation request is created.',
      input.referenceMusicDNA ? 'Reference DNA used for adaptation rules only; do not copy reference music.' : 'No reference music DNA used.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
  const warnings = validateLyriaPromptPlan({
    promptPlan,
    cue,
    cueSheet: input.cueSheet,
    musicContextAnalysis: input.musicContextAnalysis,
    languageContexts: input.languageContexts,
    referenceMusicDNA: input.referenceMusicDNA,
    userInstruction: input.userInstruction,
    avoidInstruction: input.avoidInstruction,
  })

  return {
    promptPlan,
    promptSegments,
    warnings,
  }
}

export function buildLyriaPromptFromCue(input: BuildLyriaPromptPlanInput & {
  promptSegments?: LyriaPromptSegment[]
  durationSeconds?: number
}): string {
  const { cue, referenceMusicDNA } = input
  const durationSeconds = input.durationSeconds ?? getCueDuration(cue)
  const genreText = cue.genreFamilies.map(formatToken).join(', ')
  const instrumentation = cue.instrumentation.length ? cue.instrumentation.join(', ') : 'tasteful minimal instrumentation'
  const timingText = (input.promptSegments ?? buildTimestampedStructure(cue, 'preview-plan', durationSeconds))
    .map((segment) => `${formatTime(segment.startTimeSeconds)}-${formatTime(segment.endTimeSeconds)}: ${segment.purpose}`)
    .join('; ')

  return [
    `Create a ${durationSeconds}-second ${genreText} cue for ${describeScene(cue.sceneType)}.`,
    buildCuePromptGoal(cue),
    `Role: ${formatToken(cue.cueRole)}. Mood: ${formatToken(cue.mood)}. Energy: ${formatToken(cue.energyLevel)} with a ${formatToken(cue.energyArc)} arc.`,
    `Instrumentation: ${instrumentation}.`,
    shouldForceInstrumental(cue) ? buildInstrumentalPrompt(cue) : buildLyricsAllowedPrompt(cue, input.languageContexts),
    buildSpeechSafePrompt(cue),
    buildCultureAwarePrompt(cue, input.languageContexts),
    referenceMusicDNA ? 'Use reference DNA only for structure and pacing. Do not imitate or copy any existing song.' : 'Do not imitate or copy any existing song.',
    `Timing shape: ${timingText}.`,
    cue.loopableNeeded ? 'Make the cue loopable with clean loop points and no obvious seam.' : 'End naturally with a clean musical resolve.',
    input.userInstruction ? `User instruction: ${input.userInstruction}.` : '',
  ].filter(Boolean).join(' ')
}

export function buildLyriaPromptsForCueSheet(input: BuildLyriaPromptsForCueSheetInput): BuildLyriaPromptsForCueSheetResult {
  const promptPlans: LyriaPromptPlanRecord[] = []
  const promptSegments: LyriaPromptSegment[] = []
  const validationWarnings: LyriaPromptValidationWarning[] = []

  input.cues.forEach((cue) => {
    if (!isMusicGenerationCue(cue)) {
      validationWarnings.push({
        code: 'not_aligned_with_cue_role',
        message: `${formatToken(cue.cueRole)} cue should not create a Lyria Pro generation prompt.`,
        severity: 'low',
        recommendation: 'Keep this cue as planning-only and do not create a generation request.',
      })
      return
    }

    const result = buildLyriaPromptPlan({
      cue,
      cueSheet: input.cueSheet,
      musicContextAnalysis: input.musicContextAnalysis,
      languageContexts: input.languageContexts,
      referenceMusicDNA: input.referenceMusicDNA,
      userInstruction: input.userInstruction,
      avoidInstruction: input.avoidInstruction,
    })
    promptPlans.push(result.promptPlan)
    promptSegments.push(...result.promptSegments)
    validationWarnings.push(...result.warnings)
  })

  return {
    promptPlans,
    promptSegments,
    validationWarnings,
  }
}

export function buildTimestampedStructure(
  cue: MusicCueRecord,
  lyriaPromptPlanId: string,
  durationSeconds: number = getCueDuration(cue),
): LyriaPromptSegment[] {
  if (cue.cueRole === 'dialogue_bed') {
    return [
      createSegment(cue, lyriaPromptPlanId, 1, 0, Math.min(8, durationSeconds), 'minimal intro with soft pad', 'No lyrics, no vocal texture.', 'Fade in gently under voice.'),
      createSegment(cue, lyriaPromptPlanId, 2, Math.min(8, durationSeconds), Math.max(Math.min(8, durationSeconds), durationSeconds - 10), 'stable low-energy bed under spoken voice', 'No lyrics, no lead vocal, no vocal chops.', 'Maintain clean ducking space.'),
      createSegment(cue, lyriaPromptPlanId, 3, Math.max(0, durationSeconds - 10), durationSeconds, 'gentle resolve with no sudden ending', 'No lyrics.', 'Resolve softly without pulling focus.'),
    ]
  }

  if (cue.cueRole === 'outro_resolve') {
    return [
      createSegment(cue, lyriaPromptPlanId, 1, 0, round(durationSeconds * 0.35), 'soft closing setup', lyricInstructionForCue(cue), 'Enter cleanly from previous cue.'),
      createSegment(cue, lyriaPromptPlanId, 2, round(durationSeconds * 0.35), round(durationSeconds * 0.8), 'warm emotional settle', lyricInstructionForCue(cue), 'Reduce motion and prepare final resolve.'),
      createSegment(cue, lyriaPromptPlanId, 3, round(durationSeconds * 0.8), durationSeconds, 'soft resolve for ending', lyricInstructionForCue(cue), 'End cleanly with no abrupt cutoff.'),
    ]
  }

  if (durationSeconds <= 25) {
    return [
      createSegment(cue, lyriaPromptPlanId, 1, 0, round(durationSeconds * 0.25), 'quick intro hook', lyricInstructionForCue(cue), 'Start immediately but stay polished.'),
      createSegment(cue, lyriaPromptPlanId, 2, round(durationSeconds * 0.25), round(durationSeconds * 0.75), 'main cue movement', lyricInstructionForCue(cue), 'Support fast pacing and transitions.'),
      createSegment(cue, lyriaPromptPlanId, 3, round(durationSeconds * 0.75), durationSeconds, 'short resolve or handoff', lyricInstructionForCue(cue), 'Resolve cleanly into the next scene.'),
    ]
  }

  return [
    createSegment(cue, lyriaPromptPlanId, 1, 0, round(durationSeconds * 0.25), 'soft intro, establish mood', lyricInstructionForCue(cue), 'Build gently from silence or ambience.'),
    createSegment(cue, lyriaPromptPlanId, 2, round(durationSeconds * 0.25), round(durationSeconds * 0.67), 'main groove with tasteful movement', lyricInstructionForCue(cue), 'Open into the primary cue identity.'),
    createSegment(cue, lyriaPromptPlanId, 3, round(durationSeconds * 0.67), round(durationSeconds * 0.9), 'slight lift for montage or scene emphasis', lyricInstructionForCue(cue), 'Lift without an aggressive drop.'),
    createSegment(cue, lyriaPromptPlanId, 4, round(durationSeconds * 0.9), durationSeconds, 'soft resolve for transition', lyricInstructionForCue(cue), 'Resolve softly for edit handoff.'),
  ]
}

export function buildInstrumentalPrompt(cue: MusicCueRecord): string {
  return [
    'Instrumental-only.',
    'No lyrics, no lead vocal, and no vocal chops.',
    cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking'
      ? 'Avoid busy melodies and leave midrange space for dialogue.'
      : 'Keep melody tasteful and supportive.',
  ].join(' ')
}

export function buildLyricsAllowedPrompt(cue: MusicCueRecord, languageContexts: MusicLanguageContextRecord[] = []): string {
  const language = getTargetLanguage(cue, languageContexts) ?? 'the scene language policy'

  if (cue.vocalPolicy === 'vocal_texture_only') {
    return `Light vocal texture is allowed only in no-speech moments. Use ${language} context only if it supports the scene. No full lyrics under important speech.`
  }

  if (cue.vocalPolicy === 'lyrics_allowed_only_without_speech' || cue.vocalPolicy === 'intro_outro_vocals_only') {
    return `Lyrics or soft hook vocals are allowed only where there is no important speech. Language policy: ${language}. Do not imitate existing lyrics.`
  }

  return `Vocals may be present only if they do not compete with speech. Language policy: ${language}. Keep vocal writing original.`
}

export function buildCultureAwarePrompt(cue: MusicCueRecord, languageContexts: MusicLanguageContextRecord[] = []): string {
  const notes = languageContexts.flatMap((context) => context.cultureStyleNotes)

  if (cue.cultureRegion === 'france') {
    return 'Use modern French lifestyle influence only if it supports the scene: French indie pop, electro-lounge, modern chanson-inspired pop, or stylish cafe ambience. Avoid accordion cliche unless explicitly requested.'
  }

  if (cue.cultureRegion === 'italy' || cue.cultureRegion === 'european_luxury') {
    return 'Use elegant European luxury travel influence: Italian-inspired pop, warm acoustic guitar, soft cinematic piano, and tasteful lounge. Avoid cliche tourist music.'
  }

  if (cue.cultureRegion === 'japan') {
    return 'Use tasteful Japan city-vlog influence only if supported by the scene: city-pop inspired harmony, jazzy hip-hop, lo-fi, or clean electronic. Avoid overdone stereotypes.'
  }

  if (cue.cultureRegion === 'tropical' || cue.cultureRegion === 'latin_america' || cue.cultureRegion === 'caribbean') {
    return 'Use tropical, Latin, Caribbean, Afrobeats, dancehall, reggaeton, or acoustic summer influence only when it fits the actual scene and audience. Avoid forced cultural styling.'
  }

  return notes.length
    ? `Use culture context carefully: ${notes.join(' ')}`
    : 'Use a globally appropriate modern music direction without forcing cultural style from location alone.'
}

export function buildSpeechSafePrompt(cue: MusicCueRecord): string {
  if (cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking' || cue.duckingRequired) {
    return 'Designed to sit under spoken voice with clean ducking room, controlled low-to-medium energy, no aggressive drums, no harsh lead melodies, and space for dialogue clarity.'
  }

  if (cue.speechSafety === 'montage_only') {
    return 'Designed for no-speech montage sections; do not place vocals under important dialogue.'
  }

  if (cue.speechSafety === 'intro_outro_only') {
    return 'Designed for intro or outro use only; avoid using vocals under important speech.'
  }

  return 'Keep the mix clean and edit-friendly.'
}

export function buildCuePromptGoal(cue: MusicCueRecord): string {
  if (cue.cueRole === 'dialogue_bed') {
    return 'Create a premium background bed for spoken narration or dialogue.'
  }

  if (cue.cueRole === 'coming_up_teaser') {
    return 'Create a stylish teaser cue that feels premium, energetic, and quick without overpowering the edit.'
  }

  if (cue.cueRole === 'travel_movement' || cue.cueRole === 'montage_driver') {
    return 'Create a montage cue that supports movement, travel pacing, and story beats.'
  }

  if (cue.cueRole === 'food_social_warmth') {
    return 'Create warm, relaxed support for food, friends, laughter, table ambience, and social movement.'
  }

  if (cue.cueRole === 'outro_resolve') {
    return 'Create a soft closing cue that resolves gently.'
  }

  return cue.promptGoal
}

export function buildPromptQualityInstructions(cue: MusicCueRecord, referenceMusicDNA?: ReferenceMusicDNARecord): string[] {
  return [
    'Create polished, premium, edit-ready music.',
    'Avoid generic stock music feel.',
    'Avoid muddy low end, harsh highs, clipping, and obvious generation artifacts.',
    cue.loopableNeeded ? 'Make loop points clean and natural.' : 'Resolve the ending cleanly.',
    referenceMusicDNA ? 'Match reference DNA only at the level of structure, pacing, and role; do not copy music.' : 'Keep the cue original.',
  ]
}

export function buildPromptStyleConstraints(cue: MusicCueRecord): string[] {
  return [
    `Cue role: ${cue.cueRole}.`,
    `Scene type: ${cue.sceneType}.`,
    `Mood: ${cue.mood}.`,
    `Genres: ${cue.genreFamilies.join(', ')}.`,
    `Energy: ${cue.energyLevel}.`,
    `Instrumentation: ${cue.instrumentation.join(', ')}.`,
    `Vocal policy: ${cue.vocalPolicy}.`,
  ]
}

export function buildPromptTimingConstraints(cue: MusicCueRecord, segments: LyriaPromptSegment[]): string[] {
  return [
    `Duration target: ${getCueDuration(cue)} seconds.`,
    `Energy arc: ${cue.energyArc}.`,
    cue.loopableNeeded ? 'Loopable cue requested.' : 'Natural ending requested.',
    ...segments.map((segment) => `${formatTime(segment.startTimeSeconds)}-${formatTime(segment.endTimeSeconds)} ${segment.purpose}.`),
  ]
}

function buildSpeechSafetyInstructions(cue: MusicCueRecord): string[] {
  return [
    `Speech safety: ${cue.speechSafety}.`,
    cue.duckingRequired ? 'Leave room for ducking under voice.' : 'No ducking requirement identified.',
    shouldForceInstrumental(cue) ? 'Keep the prompt instrumental-only.' : 'Vocals may appear only where policy allows.',
  ]
}

function buildCultureContextInstructions(cue: MusicCueRecord, languageContexts: MusicLanguageContextRecord[] = []): string[] {
  return [
    `Culture region: ${cue.cultureRegion}.`,
    buildCultureAwarePrompt(cue, languageContexts),
  ]
}

function createSegment(
  cue: MusicCueRecord,
  lyriaPromptPlanId: string,
  segmentOrder: number,
  startTimeSeconds: number,
  endTimeSeconds: number,
  purpose: string,
  lyricInstruction: string,
  transitionInstruction: string,
): LyriaPromptSegment {
  return {
    id: createMockId('lyria-prompt-segment'),
    lyriaPromptPlanId,
    segmentOrder,
    startTimeSeconds,
    endTimeSeconds,
    purpose,
    energy: cue.energyLevel,
    instrumentation: cue.instrumentation,
    lyricInstruction,
    transitionInstruction,
    promptText: `${purpose}. ${lyricInstruction} ${transitionInstruction}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

function isMusicGenerationCue(cue: MusicCueRecord): boolean {
  return cue.cueRole !== 'no_music' && cue.cueRole !== 'ambient_only' && getCueDuration(cue) > 0
}

function shouldForceInstrumental(cue: MusicCueRecord): boolean {
  return cue.vocalPolicy === 'no_vocals'
    || cue.vocalPolicy === 'instrumental_only'
    || cue.speechSafety === 'safe_under_voice'
    || cue.speechSafety === 'needs_ducking'
    || cue.duckingRequired
}

function cueAllowsVocalsOrLyrics(cue: MusicCueRecord): boolean {
  return [
    'vocal_texture_only',
    'vocal_chops_only',
    'soft_hook_vocals',
    'full_lyrical_song',
    'lyrics_allowed_only_without_speech',
    'intro_outro_vocals_only',
    'user_requested_vocals',
  ].includes(cue.vocalPolicy)
}

function chooseGenerationPurpose(cue: MusicCueRecord): MusicGenerationPurpose {
  const rolePurpose: Partial<Record<MusicCueRole, MusicGenerationPurpose>> = {
    dialogue_bed: 'dialogue_bed',
    intro_hook: 'intro_music',
    coming_up_teaser: 'intro_music',
    montage_driver: 'montage_song',
    travel_movement: 'montage_song',
    outro_resolve: 'outro_resolve',
  }

  return rolePurpose[cue.cueRole] ?? 'music_cue'
}

function getCueDuration(cue: MusicCueRecord): number {
  if (cue.targetDurationSeconds > 0) {
    return cue.targetDurationSeconds
  }

  if (cue.startTimeSeconds !== undefined && cue.endTimeSeconds !== undefined && cue.endTimeSeconds > cue.startTimeSeconds) {
    return round(cue.endTimeSeconds - cue.startTimeSeconds)
  }

  return 30
}

function getTargetLanguage(cue: MusicCueRecord, languageContexts: MusicLanguageContextRecord[] = []): string | undefined {
  if (cue.lyricLanguagePolicy === 'no_lyrics') {
    return undefined
  }

  const matchingContext = languageContexts.find((context) => context.cultureRegion === cue.cultureRegion) ?? languageContexts[0]

  if (cue.lyricLanguagePolicy === 'same_as_spoken_language') {
    return matchingContext?.spokenLanguage
  }

  if (cue.lyricLanguagePolicy === 'match_location_context') {
    return matchingContext?.allowedLyricLanguages[0] ?? matchingContext?.spokenLanguage
  }

  return cue.lyricLanguagePolicy.replace('_allowed', '').replace('_only', '')
}

function lyricInstructionForCue(cue: MusicCueRecord): string {
  if (shouldForceInstrumental(cue)) {
    return 'No lyrics, no lead vocal, no vocal chops.'
  }

  if (cue.vocalPolicy === 'vocal_texture_only') {
    return 'Airy vocal texture allowed only in no-speech moments.'
  }

  return 'Lyrics or vocals only where no important speech is present.'
}

function describeScene(sceneType: MusicSceneType): string {
  const sceneLabels: Partial<Record<MusicSceneType, string>> = {
    dialogue: 'a dialogue or spoken narration section',
    talking_head: 'a talking-head video',
    faith_reflective: 'a serious faith teaching video',
    real_estate: 'a premium real estate walkthrough',
    travel_montage: 'a travel montage',
    boat_movement: 'a boat and movement montage',
    food_social: 'a warm food and social scene',
    fitness: 'a high-energy fitness social edit',
    product_demo: 'a clean SaaS or product demo',
    coming_up_teaser: 'a coming-up teaser',
    outro: 'a closing outro moment',
  }

  return sceneLabels[sceneType] ?? `a ${formatToken(sceneType)} scene`
}

function formatToken(value: string): string {
  return value.replaceAll('_', ' ')
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
