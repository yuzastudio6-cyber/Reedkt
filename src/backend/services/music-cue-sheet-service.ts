import type {
  MusicContextAnalysisRecord,
  MusicCueRecord,
  MusicCueRole,
  MusicCueSheetRecord,
  MusicLanguageContextRecord,
  MusicMixPlanRecord,
  MusicSceneType,
  ReferenceMusicDNARecord,
} from '../../types'
import type { MusicDirectorSceneInput } from '../backend-types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { decideDuckingNeed, decideLyricLanguagePolicy, decideSpeechSafety, decideVocalPolicy } from './music-policy-service'
import {
  chooseCultureRegion,
  chooseEnergyArc,
  chooseEnergyLevel,
  chooseGenreFamilies,
  chooseInstrumentation,
  chooseMood,
  chooseStyleFromReferenceDNA,
} from './music-style-selector-service'

export interface CreateMusicCueSheetInput {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContexts: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  sceneDescriptions?: MusicDirectorSceneInput[]
  audioEnvironmentSummary?: string
  userInstructions?: string[]
}

export interface CreateMusicCueSheetResult {
  cueSheet: MusicCueSheetRecord
  cues: MusicCueRecord[]
  mixPlans: MusicMixPlanRecord[]
}

interface CueFactoryInput {
  projectId: string
  editPlanId: string
  musicCueSheetId: string
  cueOrder: number
  sceneType: MusicSceneType
  cueRole: MusicCueRole
  context: MusicContextAnalysisRecord
  languageContext?: MusicLanguageContextRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  scene?: MusicDirectorSceneInput
}

export function createMusicCueSheet(
  db: MockDatabase,
  input: CreateMusicCueSheetInput,
): ServiceResult<CreateMusicCueSheetResult> {
  const { musicContextAnalysis } = input
  const cueSheet: MusicCueSheetRecord = {
    id: createMockId('music-cue-sheet'),
    projectId: musicContextAnalysis.projectId,
    editPlanId: musicContextAnalysis.editPlanId,
    musicContextAnalysisId: musicContextAnalysis.id,
    cueCountDecision: musicContextAnalysis.musicCueCountDecision,
    summary: createCueSheetSummary(input),
    overallMood: chooseMood({
      userPrompt: musicContextAnalysis.userMusicInstructions.join(' '),
      settingSummary: musicContextAnalysis.settingSummary,
      sceneType: musicContextAnalysis.primarySceneType,
    }),
    overallEnergyArc: musicContextAnalysis.musicCueCountDecision === 'multi_cue' ? 'rise_and_resolve' : 'flat',
    usesMultipleCues: musicContextAnalysis.musicCueCountDecision === 'multi_cue',
    lyricsAllowedSomewhere: shouldAllowLyricsSomewhere(musicContextAnalysis),
    dialogueSafeRequired: musicContextAnalysis.dialogueHeavy || musicContextAnalysis.speechPresence !== 'none',
    referenceDnaUsed: Boolean(input.referenceMusicDNA),
    approvalRequired: true,
    status: 'awaiting_approval',
    notes: [
      'Music plan created. Next required action: create Lyria Pro prompt plan and credit estimate.',
      'No music generation has started.',
      chooseStyleFromReferenceDNA({
        referenceSummary: input.referenceMusicDNA?.summary,
        settingSummary: musicContextAnalysis.settingSummary,
      }),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  insertMockRecord(db, 'musicCueSheets', cueSheet)

  const cues = createMusicCuesFromContext({
    musicContextAnalysis,
    languageContexts: input.languageContexts,
    referenceMusicDNA: input.referenceMusicDNA,
    sceneDescriptions: input.sceneDescriptions,
    musicCueSheetId: cueSheet.id,
  })

  cues.forEach((cue) => insertMockRecord(db, 'musicCues', cue))

  const mixPlans = cues.map((cue) => createMusicMixPlanForCue(cue, cueSheet.id, musicContextAnalysis))
  mixPlans.forEach((mixPlan) => insertMockRecord(db, 'musicMixPlans', mixPlan))

  return ok({ cueSheet, cues, mixPlans })
}

export function createMusicCuesFromContext(input: {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContexts: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  sceneDescriptions?: MusicDirectorSceneInput[]
  musicCueSheetId: string
}): MusicCueRecord[] {
  const context = input.musicContextAnalysis

  if (context.musicNeedDecision === 'no_music') {
    return [
      createBaseCue({
        projectId: context.projectId,
        editPlanId: context.editPlanId,
        musicCueSheetId: input.musicCueSheetId,
        cueOrder: 1,
        cueRole: 'no_music',
        sceneType: context.primarySceneType,
        context,
        languageContext: input.languageContexts[0],
        referenceMusicDNA: input.referenceMusicDNA,
      }),
    ]
  }

  if (context.musicCueCountDecision === 'multi_cue') {
    return createLifestyleVacationMultiCuePlan({
      musicContextAnalysis: context,
      languageContexts: input.languageContexts,
      referenceMusicDNA: input.referenceMusicDNA,
      sceneDescriptions: input.sceneDescriptions,
      musicCueSheetId: input.musicCueSheetId,
    })
  }

  return createSingleCuePlan({
    musicContextAnalysis: context,
    languageContexts: input.languageContexts,
    referenceMusicDNA: input.referenceMusicDNA,
    sceneDescriptions: input.sceneDescriptions,
    musicCueSheetId: input.musicCueSheetId,
  })
}

export function createSingleCuePlan(input: {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContexts: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  sceneDescriptions?: MusicDirectorSceneInput[]
  musicCueSheetId: string
}): MusicCueRecord[] {
  const context = input.musicContextAnalysis
  const primaryScene = context.primarySceneType

  if (context.musicNeedDecision === 'ambience_only') {
    return [
      createBaseCue({
        projectId: context.projectId,
        editPlanId: context.editPlanId,
        musicCueSheetId: input.musicCueSheetId,
        cueOrder: 1,
        cueRole: 'ambient_only',
        sceneType: primaryScene,
        context,
        languageContext: input.languageContexts[0],
        referenceMusicDNA: input.referenceMusicDNA,
      }),
    ]
  }

  if (context.dialogueHeavy || context.speechPresence !== 'none') {
    return [
      createDialogueBedCue({
        projectId: context.projectId,
        editPlanId: context.editPlanId,
        musicCueSheetId: input.musicCueSheetId,
        cueOrder: 1,
        sceneType: primaryScene === 'custom' ? 'dialogue' : primaryScene,
        cueRole: 'dialogue_bed',
        context,
        languageContext: input.languageContexts[0],
        referenceMusicDNA: input.referenceMusicDNA,
      }),
    ]
  }

  return [
    createMontageCue({
      projectId: context.projectId,
      editPlanId: context.editPlanId,
      musicCueSheetId: input.musicCueSheetId,
      cueOrder: 1,
      sceneType: primaryScene,
      cueRole: primaryScene === 'real_estate' ? 'premium_polish' : 'subtle_bed',
      context,
      languageContext: input.languageContexts[0],
      referenceMusicDNA: input.referenceMusicDNA,
    }),
  ]
}

export function createLifestyleVacationMultiCuePlan(input: {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContexts: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  sceneDescriptions?: MusicDirectorSceneInput[]
  musicCueSheetId: string
}): MusicCueRecord[] {
  const context = input.musicContextAnalysis
  const scenes = input.sceneDescriptions ?? []
  const cues: MusicCueRecord[] = []
  let order = 1

  if (hasScene(context, scenes, 'coming_up_teaser') || hasText(context, 'teaser hook coming-up coming up')) {
    cues.push(createBaseCue({
      projectId: context.projectId,
      editPlanId: context.editPlanId,
      musicCueSheetId: input.musicCueSheetId,
      cueOrder: order,
      cueRole: 'coming_up_teaser',
      sceneType: 'coming_up_teaser',
      context,
      languageContext: input.languageContexts[0],
      referenceMusicDNA: input.referenceMusicDNA,
      scene: scenes.find((scene) => scene.sceneType === 'coming_up_teaser'),
    }))
    order += 1
  }

  if (context.dialogueHeavy || context.speechPresence !== 'none' || hasScene(context, scenes, 'dialogue')) {
    cues.push(createDialogueBedCue({
      projectId: context.projectId,
      editPlanId: context.editPlanId,
      musicCueSheetId: input.musicCueSheetId,
      cueOrder: order,
      cueRole: 'dialogue_bed',
      sceneType: 'dialogue',
      context,
      languageContext: input.languageContexts[0],
      referenceMusicDNA: input.referenceMusicDNA,
      scene: scenes.find((scene) => scene.sceneType === 'dialogue' || scene.hasSpeech),
    }))
    order += 1
  }

  if (context.montageSectionsDetected || hasScene(context, scenes, 'travel_montage') || hasScene(context, scenes, 'boat_movement')) {
    cues.push(createMontageCue({
      projectId: context.projectId,
      editPlanId: context.editPlanId,
      musicCueSheetId: input.musicCueSheetId,
      cueOrder: order,
      cueRole: hasScene(context, scenes, 'boat_movement') ? 'travel_movement' : 'montage_driver',
      sceneType: hasScene(context, scenes, 'boat_movement') ? 'boat_movement' : 'travel_montage',
      context,
      languageContext: input.languageContexts[0],
      referenceMusicDNA: input.referenceMusicDNA,
      scene: scenes.find((scene) => scene.sceneType === 'boat_movement' || scene.sceneType === 'travel_montage' || scene.isMontage),
    }))
    order += 1
  }

  if (hasScene(context, scenes, 'food_social') || hasText(context, 'food restaurant social friends dinner')) {
    cues.push(createMontageCue({
      projectId: context.projectId,
      editPlanId: context.editPlanId,
      musicCueSheetId: input.musicCueSheetId,
      cueOrder: order,
      cueRole: 'food_social_warmth',
      sceneType: 'food_social',
      context,
      languageContext: input.languageContexts[0],
      referenceMusicDNA: input.referenceMusicDNA,
      scene: scenes.find((scene) => scene.sceneType === 'food_social'),
    }))
    order += 1
  }

  cues.push(createOutroResolveCue({
    projectId: context.projectId,
    editPlanId: context.editPlanId,
    musicCueSheetId: input.musicCueSheetId,
    cueOrder: order,
    cueRole: 'outro_resolve',
    sceneType: 'outro',
    context,
    languageContext: input.languageContexts[0],
    referenceMusicDNA: input.referenceMusicDNA,
    scene: scenes.find((scene) => scene.sceneType === 'outro'),
  }))

  return cues
}

export function createDialogueBedCue(input: CueFactoryInput): MusicCueRecord {
  return createBaseCue({
    ...input,
    cueRole: 'dialogue_bed',
    sceneType: input.sceneType,
  })
}

export function createMontageCue(input: CueFactoryInput): MusicCueRecord {
  return createBaseCue(input)
}

export function createOutroResolveCue(input: CueFactoryInput): MusicCueRecord {
  return createBaseCue({
    ...input,
    cueRole: 'outro_resolve',
    sceneType: 'outro',
  })
}

export function createCueTimingPlan(cueOrder: number, cueRole: MusicCueRole): {
  startTimeSeconds: number
  endTimeSeconds: number
  targetDurationSeconds: number
} {
  const durations: Record<MusicCueRole, number> = {
    no_music: 0,
    ambient_only: 30,
    subtle_bed: 45,
    dialogue_bed: 60,
    intro_hook: 12,
    coming_up_teaser: 12,
    montage_driver: 45,
    travel_movement: 45,
    chapter_transition: 8,
    emotional_support: 45,
    premium_polish: 45,
    comedic_accent: 8,
    food_social_warmth: 35,
    sales_momentum: 35,
    outro_resolve: 20,
    custom: 30,
  }
  const targetDurationSeconds = durations[cueRole] ?? 30
  const startTimeSeconds = cueOrder === 1 ? 0 : Math.max(0, (cueOrder - 1) * 35)

  return {
    startTimeSeconds,
    endTimeSeconds: startTimeSeconds + targetDurationSeconds,
    targetDurationSeconds,
  }
}

function createBaseCue(input: CueFactoryInput): MusicCueRecord {
  const hasImportantSpeech = input.scene?.hasSpeech ?? input.context.dialogueHeavy
  const montageOnly = input.scene?.isMontage ?? ['travel_montage', 'boat_movement', 'coming_up_teaser', 'outro'].includes(input.sceneType)
  const cultureRegion = input.languageContext?.cultureRegion ?? chooseCultureRegion({
    userPrompt: input.context.userMusicInstructions.join(' '),
    settingSummary: input.context.settingSummary,
    sceneType: input.sceneType,
  })
  const timing = createCueTimingPlan(input.cueOrder, input.cueRole)
  const policyContext = {
    userPrompt: input.context.userMusicInstructions.join(' '),
    sceneType: input.sceneType,
    cueRole: input.cueRole,
    cultureRegion,
    hasImportantSpeech,
    dialogueHeavy: input.context.dialogueHeavy,
    montageOnly,
    ambienceImportant: input.context.ambienceImportant,
    userRequestedLyrics: hasText(input.context, 'lyrics vocals song'),
    spokenLanguages: input.context.spokenLanguages,
  }
  const mood = input.cueRole === 'food_social_warmth' ? 'warm' : chooseMood({
    userPrompt: input.context.userMusicInstructions.join(' '),
    settingSummary: input.context.settingSummary,
    sceneType: input.sceneType,
    cultureRegion,
    hasImportantSpeech,
  })

  return {
    id: createMockId('music-cue'),
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    musicCueSheetId: input.musicCueSheetId,
    editPlanSegmentId: input.scene?.id,
    cueOrder: input.cueOrder,
    cueRole: input.cueRole,
    sceneType: input.sceneType,
    startTimeSeconds: input.scene?.startTimeSeconds ?? timing.startTimeSeconds,
    endTimeSeconds: input.scene?.endTimeSeconds ?? timing.endTimeSeconds,
    targetDurationSeconds: timing.targetDurationSeconds,
    mood,
    genreFamilies: chooseGenreFamilies({
      userPrompt: input.context.userMusicInstructions.join(' '),
      settingSummary: input.context.settingSummary,
      referenceSummary: input.referenceMusicDNA?.summary,
      sceneType: input.sceneType,
      cultureRegion,
      hasImportantSpeech,
    }),
    energyLevel: chooseEnergyLevel({ sceneType: input.sceneType, hasImportantSpeech }),
    energyArc: chooseEnergyArc({ sceneType: input.sceneType, hasImportantSpeech }),
    cultureRegion,
    vocalPolicy: decideVocalPolicy(policyContext),
    lyricLanguagePolicy: decideLyricLanguagePolicy(policyContext),
    speechSafety: decideSpeechSafety(policyContext),
    instrumentation: chooseInstrumentation({
      userPrompt: input.context.userMusicInstructions.join(' '),
      settingSummary: input.context.settingSummary,
      sceneType: input.sceneType,
      cultureRegion,
      hasImportantSpeech,
    }),
    bpmTarget: chooseBpmTarget(input.sceneType),
    keyTarget: input.sceneType === 'outro' ? 'C major' : undefined,
    referenceInfluence: input.referenceMusicDNA ? 'moderate_style_dna' : 'none',
    promptGoal: createPromptGoal(input.cueRole, input.sceneType),
    negativePromptGoals: [
      'no copied reference music',
      'no copyrighted melody or lyric imitation',
      ...(hasImportantSpeech ? ['no lyrics under speech', 'no busy lead melody'] : []),
    ],
    duckingRequired: decideDuckingNeed(policyContext),
    loopableNeeded: input.cueRole === 'dialogue_bed' || input.cueRole === 'food_social_warmth',
    creditImpact: input.cueRole === 'travel_movement' || input.cueRole === 'montage_driver' ? 'medium' : 'low',
    requiresApproval: true,
    status: 'awaiting_approval',
    notes: [
      'Cue is planning-only and ready for a future Lyria Pro prompt builder.',
      input.referenceMusicDNA ? 'Reference DNA used as style structure only; do not copy the track.' : 'No reference music DNA used.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

function createMusicMixPlanForCue(
  cue: MusicCueRecord,
  musicCueSheetId: string,
  context: MusicContextAnalysisRecord,
): MusicMixPlanRecord {
  const voiceFirst = cue.speechSafety === 'safe_under_voice' || cue.speechSafety === 'needs_ducking'

  return {
    id: createMockId('music-mix-plan'),
    projectId: cue.projectId,
    editPlanId: cue.editPlanId,
    musicCueSheetId,
    musicCueId: cue.id,
    volumeDbTarget: voiceFirst ? -24 : -16,
    duckingStrategy: voiceFirst ? 'voice_first' : 'beat_sensitive',
    duckingAmountDb: voiceFirst ? 8 : 3,
    duckUnderSpeech: voiceFirst,
    introFadeSeconds: cue.cueOrder === 1 ? 0.5 : 1,
    outroFadeSeconds: cue.cueRole === 'outro_resolve' ? 2 : 1,
    crossfadeWithPreviousCue: cue.cueOrder === 1 ? 0 : 1,
    crossfadeWithNextCue: cue.cueRole === 'outro_resolve' ? 0 : 1,
    beatSyncPoints: cue.energyLevel === 'medium' || cue.energyLevel === 'medium_high'
      ? [{ startSeconds: cue.startTimeSeconds ?? 0, endSeconds: (cue.startTimeSeconds ?? 0) + 0.5 }]
      : [],
    silenceMoments: context.dialogueHeavy ? [{ startSeconds: cue.startTimeSeconds ?? 0, endSeconds: (cue.startTimeSeconds ?? 0) + 1 }] : [],
    ambientBridgeNeeded: context.ambienceImportant,
    sfxRelationship: 'Use SFX only when it improves transition, title, motion, or ambience continuity.',
    mixNotes: [
      voiceFirst ? 'Keep the voice forward and duck music under speech.' : 'Let music drive no-speech montage sections.',
      context.ambienceImportant ? 'Preserve useful ambience and do not over-clean the scene.' : 'Use clean fades between cues.',
    ],
    status: 'planned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

function createCueSheetSummary(input: CreateMusicCueSheetInput): string {
  const { musicContextAnalysis } = input

  if (musicContextAnalysis.musicNeedDecision === 'no_music') {
    return 'No music recommended because the user or context calls for a music-free edit.'
  }

  if (musicContextAnalysis.musicCueCountDecision === 'multi_cue') {
    return 'Multi-cue SoundSync plan with scene-specific music roles, voice-safe dialogue beds, montage movement, ambience preservation, and approval before generation.'
  }

  return 'Single-cue SoundSync plan focused on voice-safe, professional music support before any generation.'
}

function shouldAllowLyricsSomewhere(context: MusicContextAnalysisRecord): boolean {
  return context.musicCueCountDecision === 'multi_cue' && context.montageSectionsDetected && !context.dialogueHeavy
}

function hasScene(
  context: MusicContextAnalysisRecord,
  scenes: MusicDirectorSceneInput[],
  sceneType: MusicSceneType,
): boolean {
  return context.detectedSceneTypes.includes(sceneType) || scenes.some((scene) => scene.sceneType === sceneType)
}

function hasText(context: MusicContextAnalysisRecord, terms: string): boolean {
  const haystack = [
    context.videoTopic,
    context.settingSummary,
    context.userMusicInstructions.join(' '),
    context.avoidMusicInstructions.join(' '),
  ].join(' ').toLowerCase()

  return terms.split(' ').some((term) => haystack.includes(term))
}

function createPromptGoal(cueRole: MusicCueRole, sceneType: MusicSceneType): string {
  if (cueRole === 'dialogue_bed') {
    return 'Plan a voice-first instrumental bed with room for speech and natural ambience.'
  }

  if (cueRole === 'travel_movement' || cueRole === 'montage_driver') {
    return 'Plan a music-driven montage cue that supports motion, story beats, and premium pacing without copying reference music.'
  }

  if (cueRole === 'food_social_warmth') {
    return 'Plan warm social support that leaves room for laughter, table dialogue, and ambience.'
  }

  if (cueRole === 'outro_resolve') {
    return 'Plan a soft musical resolve for the closing moment.'
  }

  if (sceneType === 'real_estate') {
    return 'Plan a premium background bed for a polished walkthrough.'
  }

  return 'Plan scene-specific music support before future Lyria Pro prompt creation.'
}

function chooseBpmTarget(sceneType: MusicSceneType): number | undefined {
  if (sceneType === 'fitness') {
    return 124
  }

  if (sceneType === 'coming_up_teaser') {
    return 112
  }

  if (sceneType === 'travel_montage' || sceneType === 'boat_movement') {
    return 96
  }

  if (sceneType === 'dialogue' || sceneType === 'talking_head') {
    return 82
  }

  return undefined
}
