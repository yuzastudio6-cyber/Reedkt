import type {
  MusicContextAnalysisRecord,
  MusicCueCountDecision,
  MusicLanguageContextRecord,
  MusicNeedDecision,
  LyricLanguagePolicy,
  MusicSceneType,
  MusicSpeechPresence,
  TargetPlatform,
} from '../../types'
import type { MusicDirectorPlanningInput, MusicDirectorPlanningResult } from '../backend-types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'
import { createMusicCueSheet } from './music-cue-sheet-service'
import { decideAmbienceVsMusic } from './music-policy-service'
import { createLakeComoReferenceMusicDNA, createReferenceMusicDNAFromSummary } from './music-reference-dna-service'
import { chooseCultureRegion } from './music-style-selector-service'

export function analyzeVideoMusicContext(
  db: MockDatabase,
  input: MusicDirectorPlanningInput,
): ServiceResult<MusicContextAnalysisRecord> {
  const detectedSceneTypes = detectSceneTypes(input)
  const speechPresence = detectSpeechPresence(input)
  const dialogueHeavy = speechPresence === 'dialogue' || speechPresence === 'teaching' || speechPresence === 'podcast_style'
  const montageSectionsDetected = detectedSceneTypes.some((scene) =>
    ['travel_montage', 'boat_movement', 'coming_up_teaser', 'fitness', 'food_social'].includes(scene),
  )
  const cultureRegion = chooseCultureRegion({
    userPrompt: input.userPrompt,
    settingSummary: input.settingSummary,
    referenceSummary: input.referenceSummary,
    sceneType: detectedSceneTypes[0],
  })
  const musicNeedDecision = decideMusicNeed(input)
  const musicCueCountDecision = decideMusicCueCount(input, musicNeedDecision)
  const locationHints = [
    input.settingSummary,
    ...((input.sceneDescriptions ?? []).map((scene) => scene.locationHint).filter(Boolean) as string[]),
  ].filter((hint): hint is string => Boolean(hint))

  const analysis: MusicContextAnalysisRecord = {
    id: createMockId('music-context-analysis'),
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    chatSessionId: input.chatSessionId,
    referenceAssetId: input.referenceAssetId,
    primarySceneType: detectedSceneTypes[0] ?? 'custom',
    detectedSceneTypes,
    videoTopic: input.videoType ?? summarizeTopic(input.userPrompt),
    settingSummary: input.settingSummary ?? summarizeSetting(input),
    locationHints,
    cultureRegions: [cultureRegion],
    spokenLanguages: input.spokenLanguages?.length ? input.spokenLanguages : ['english'],
    audience: input.audience ?? 'General ReeditPro project viewers.',
    platform: input.targetPlatform ?? inferPlatform(input.userPrompt),
    musicNeedDecision,
    musicCueCountDecision,
    speechPresence,
    dialogueHeavy,
    montageSectionsDetected,
    ambienceImportant: isAmbienceImportant(input),
    referenceMusicInfluence: input.referenceSummary ? 'moderate_style_dna' : 'none',
    userMusicInstructions: input.userMusicInstructions?.length ? input.userMusicInstructions : [input.userPrompt],
    avoidMusicInstructions: [
      ...(input.avoidMusicInstructions ?? []),
      'Do not copy reference music.',
      'Do not allow lyrics under important speech by default.',
    ],
    confidence: 88,
    notes: [
      'Mock SoundSync Music Director analysis only; no generation request is created.',
      `Music need decision: ${musicNeedDecision}.`,
      `Cue count decision: ${musicCueCountDecision}.`,
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'musicContextAnalyses', analysis))
}

export function createMusicLanguageContext(
  db: MockDatabase,
  input: MusicDirectorPlanningInput,
  musicContextAnalysis: MusicContextAnalysisRecord,
): ServiceResult<MusicLanguageContextRecord> {
  const cultureRegion = musicContextAnalysis.cultureRegions[0] ?? 'global'
  const speechIsImportant = musicContextAnalysis.speechPresence !== 'none'
  const lyricPolicy: LyricLanguagePolicy = speechIsImportant
    ? 'no_lyrics'
    : cultureRegion === 'france'
      ? 'french_allowed'
      : cultureRegion === 'italy' || cultureRegion === 'european_luxury'
        ? 'italian_allowed'
        : cultureRegion === 'japan'
          ? 'japanese_allowed'
          : cultureRegion === 'tropical' || cultureRegion === 'latin_america'
            ? 'spanish_allowed'
            : 'no_lyrics'

  const languageContext: MusicLanguageContextRecord = {
    id: createMockId('music-language-context'),
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    musicContextAnalysisId: musicContextAnalysis.id,
    spokenLanguage: musicContextAnalysis.spokenLanguages[0] ?? 'english',
    visualLocation: input.settingSummary ?? musicContextAnalysis.settingSummary,
    cultureRegion,
    recommendedLyricLanguagePolicy: lyricPolicy,
    allowedLyricLanguages: lyricPolicy === 'no_lyrics' ? [] : [lyricPolicy.replace('_allowed', '')],
    avoidLanguages: [],
    cultureStyleNotes: [
      'Use language and culture cues only when supported by setting, user intent, audience, and reference DNA.',
      `Recommended culture region: ${cultureRegion}.`,
    ],
    stereotypeAvoidanceNotes: [
      'Do not force cultural music based on location alone.',
      'Avoid lazy stereotypes and do not copy reference music.',
    ],
    confidence: 84,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'musicLanguageContexts', languageContext))
}

export function decideMusicNeed(input: MusicDirectorPlanningInput): MusicNeedDecision {
  const text = normalize(input)

  if (mentionsNoMusic(input)) {
    return 'no_music'
  }

  if (text.includes('ambience only') || text.includes('natural sound only')) {
    return 'ambience_only'
  }

  if (text.includes('vacation') || text.includes('travel') || text.includes('lifestyle') || text.includes('fitness') || text.includes('real estate')) {
    return 'music_needed'
  }

  if (text.includes('product demo') || text.includes('saas') || text.includes('ad') || text.includes('sales')) {
    return 'music_needed'
  }

  if (text.includes('faith') || text.includes('bible') || text.includes('teaching') || text.includes('talking head') || text.includes('interview')) {
    return decideAmbienceVsMusic({
      sceneType: text.includes('faith') ? 'faith_reflective' : 'talking_head',
      hasImportantSpeech: true,
      dialogueHeavy: true,
      ambienceImportant: isAmbienceImportant(input),
    })
  }

  if (text.includes('simple clean') || text.includes('clean edit')) {
    return 'music_optional'
  }

  return 'music_optional'
}

export function decideMusicCueCount(
  input: MusicDirectorPlanningInput,
  musicNeedDecision: MusicNeedDecision = decideMusicNeed(input),
): MusicCueCountDecision {
  const text = normalize(input)

  if (musicNeedDecision === 'no_music' || musicNeedDecision === 'ambience_only') {
    return 'ambience_only'
  }

  if (text.includes('simple clean') || text.includes('talking head') || text.includes('interview')) {
    return 'single_cue'
  }

  if (text.includes('chapter') || text.includes('long-form') || text.includes('long form')) {
    return 'multi_cue'
  }

  if (
    text.includes('vacation')
    || text.includes('travel')
    || text.includes('lifestyle')
    || text.includes('montage')
    || text.includes('boat')
    || text.includes('food')
    || (input.sceneDescriptions ?? []).filter((scene) => scene.isMontage || scene.sceneType).length >= 3
  ) {
    return 'multi_cue'
  }

  return 'single_cue'
}

export function createMusicDirectorPlan(
  db: MockDatabase,
  input: MusicDirectorPlanningInput,
): ServiceResult<MusicDirectorPlanningResult> {
  const analysisResult = analyzeVideoMusicContext(db, input)

  if (!analysisResult.ok) {
    return analysisResult
  }

  const languageResult = createMusicLanguageContext(db, input, analysisResult.data)

  if (!languageResult.ok) {
    return languageResult
  }

  const referenceResult = input.referenceSummary
    ? isLakeComoLike(input)
      ? createLakeComoReferenceMusicDNA(db, input.projectId, input.referenceAssetId)
      : createReferenceMusicDNAFromSummary(db, {
          projectId: input.projectId,
          referenceAssetId: input.referenceAssetId,
          summary: input.referenceSummary,
        })
    : undefined

  if (referenceResult && !referenceResult.ok) {
    return fail('UNKNOWN_ERROR', 'Reference Music DNA could not be created.', referenceResult.error)
  }

  const referenceMusicDNA = referenceResult?.ok ? referenceResult.data : undefined

  const cueSheetResult = createMusicCueSheet(db, {
    musicContextAnalysis: analysisResult.data,
    languageContexts: [languageResult.data],
    referenceMusicDNA,
    sceneDescriptions: input.sceneDescriptions,
    audioEnvironmentSummary: input.audioEnvironmentSummary,
    userInstructions: input.userMusicInstructions,
  })

  if (!cueSheetResult.ok) {
    return cueSheetResult
  }

  const result: MusicDirectorPlanningResult = {
    musicContextAnalysis: analysisResult.data,
    languageContexts: [languageResult.data],
    referenceMusicDNA,
    cueSheet: cueSheetResult.data.cueSheet,
    cues: cueSheetResult.data.cues,
    mixPlans: cueSheetResult.data.mixPlans,
    nextStep: 'create_lyria_prompt_plan',
    warnings: [
      'Music plan created. Next required action: create Lyria Pro prompt plan and credit estimate.',
      'No Lyria Pro prompt builder ran in RP-AUDIO-04.',
      'No generation request, generated asset, or provider call was created.',
    ],
  }

  return ok(result, result.warnings)
}

export function createMusicPlanningSummary(plan: MusicDirectorPlanningResult): string {
  return [
    'Music plan created.',
    `Need: ${plan.musicContextAnalysis.musicNeedDecision}.`,
    `Cue strategy: ${plan.musicContextAnalysis.musicCueCountDecision}.`,
    `Cue count: ${plan.cues.length}.`,
    `Lyrics allowed somewhere: ${plan.cueSheet.lyricsAllowedSomewhere ? 'yes, only where speech-safe' : 'no'}.`,
    'Next required action: create Lyria Pro prompt plan and credit estimate.',
  ].join(' ')
}

function detectSceneTypes(input: MusicDirectorPlanningInput): MusicSceneType[] {
  const explicitScenes = (input.sceneDescriptions ?? [])
    .map((scene) => scene.sceneType)
    .filter(Boolean) as MusicSceneType[]
  const text = normalize(input)
  const detected = new Set<MusicSceneType>(explicitScenes)

  if (text.includes('talking head')) detected.add('talking_head')
  if (text.includes('dialogue') || text.includes('conversation')) detected.add('dialogue')
  if (text.includes('narration') || text.includes('voiceover')) detected.add('narration')
  if (text.includes('lifestyle')) detected.add('lifestyle')
  if (text.includes('vacation')) detected.add('vacation')
  if (text.includes('montage')) detected.add('travel_montage')
  if (text.includes('teaser') || text.includes('hook')) detected.add('coming_up_teaser')
  if (text.includes('food') || text.includes('restaurant') || text.includes('friends')) detected.add('food_social')
  if (text.includes('boat')) detected.add('boat_movement')
  if (text.includes('city') || text.includes('paris') || text.includes('tokyo')) detected.add('city_walk')
  if (text.includes('real estate') || text.includes('walkthrough')) detected.add('real_estate')
  if (text.includes('product') || text.includes('saas')) detected.add('product_demo')
  if (text.includes('education') || text.includes('teaching')) detected.add('education')
  if (text.includes('faith') || text.includes('bible')) detected.add('faith_reflective')
  if (text.includes('fitness') || text.includes('workout')) detected.add('fitness')
  if (text.includes('outro') || text.includes('closing')) detected.add('outro')

  return detected.size ? [...detected] : ['custom']
}

function detectSpeechPresence(input: MusicDirectorPlanningInput): MusicSpeechPresence {
  const text = normalize(input)
  const scenes = input.sceneDescriptions ?? []
  const speechScenes = scenes.filter((scene) => scene.hasSpeech).length
  const montageScenes = scenes.filter((scene) => scene.isMontage).length

  if (text.includes('no speech') || text.includes('silent montage')) {
    return 'none'
  }

  if (text.includes('podcast')) {
    return 'podcast_style'
  }

  if (text.includes('teaching') || text.includes('bible') || text.includes('course')) {
    return 'teaching'
  }

  if (speechScenes > 0 && montageScenes > 0) {
    return 'mixed_speech_and_montage'
  }

  if (speechScenes > 0 || text.includes('dialogue') || text.includes('talking') || text.includes('interview')) {
    return 'dialogue'
  }

  if (text.includes('voiceover') || text.includes('narration')) {
    return 'narration'
  }

  return 'unknown'
}

function inferPlatform(prompt: string): TargetPlatform {
  const text = prompt.toLowerCase()

  if (text.includes('youtube')) return 'youtube'
  if (text.includes('instagram')) return 'instagram'
  if (text.includes('linkedin')) return 'linkedin'
  if (text.includes('website')) return 'website'

  return 'tiktok_reels_shorts'
}

function summarizeTopic(prompt: string): string {
  return prompt.length > 160 ? `${prompt.slice(0, 157)}...` : prompt
}

function summarizeSetting(input: MusicDirectorPlanningInput): string {
  return input.sceneDescriptions?.map((scene) => scene.locationHint ?? scene.summary).join('; ') ?? 'Setting unknown.'
}

function isAmbienceImportant(input: MusicDirectorPlanningInput): boolean {
  const text = normalize(input)

  return text.includes('ambience')
    || text.includes('natural sound')
    || text.includes('boat')
    || text.includes('restaurant')
    || text.includes('real estate')
    || text.includes('walkthrough')
    || text.includes('documentary')
}

function mentionsNoMusic(input: MusicDirectorPlanningInput): boolean {
  const text = normalize(input)
  const avoidText = (input.avoidMusicInstructions ?? []).join(' ').toLowerCase()

  return text.includes('no music') || text.includes('without music') || avoidText.includes('no music')
}

function isLakeComoLike(input: MusicDirectorPlanningInput): boolean {
  const text = normalize(input)
  return text.includes('lake como') || (text.includes('italy') && text.includes('boat'))
}

function normalize(input: MusicDirectorPlanningInput): string {
  return [
    input.userPrompt,
    input.transcriptSummary,
    input.videoType,
    input.settingSummary,
    input.referenceSummary,
    input.audioEnvironmentSummary,
    input.editQualitySummary,
    input.userMusicInstructions?.join(' '),
    input.avoidMusicInstructions?.join(' '),
    input.sceneDescriptions?.map((scene) => `${scene.sceneType ?? ''} ${scene.summary} ${scene.locationHint ?? ''}`).join(' '),
    input.sourceClipSummaries?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
