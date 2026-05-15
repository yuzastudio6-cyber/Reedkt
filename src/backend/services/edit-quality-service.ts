import type {
  AmbientSoundPlanRecord,
  AudioEnvironmentAnalysisRecord,
  CaptionPlanRecord,
  CutDecisionRecord,
  EditQualityCheckRecord,
  EditQualityProfileRecord,
  MusicPlanRecord,
  PacingAnalysisRecord,
  SoundEffectPlanRecord,
  TransitionPlanRecord,
} from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createEditQualityProfile(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<EditQualityProfileRecord> {
  const editPlan = findMockRecord(db, 'editPlans', editPlanId)

  if (!editPlan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Edit plan ${editPlanId} was not found.`)
  }

  const profile: EditQualityProfileRecord = {
    id: createMockId('edit-quality-profile'),
    projectId,
    editPlanId,
    editComplexity: editPlan.complexity,
    qualityLevel: editPlan.complexity === 'basic_edit' ? 'basic' : 'signature',
    professionalStandard: 'clean_professional',
    professionalStandardRequired: true,
    generationBudgetLevel: editPlan.complexity === 'basic_edit' ? 'low' : 'balanced',
    pacingStyle: 'natural_clean',
    pacingStrategy: 'Remove dead space while preserving emotional or meaning-carrying pauses.',
    transitionPolicy: 'only_when_needed',
    musicPolicy: 'only_if_appropriate',
    sfxPolicy: 'minimal',
    audioCleanupPolicy: 'voice_leveling',
    captionPolicy: 'basic_readable',
    signaturePolicy: 'allow_if_useful',
    captionStrategy: 'Readable captions with face and overlay safe zones.',
    audioStrategy: 'Voice-first mix with natural room tone preserved when useful.',
    signatureUsageBoundary: 'Signature systems are routed per segment and never forced by video type.',
    qualityGoal: 'Professional clean edit, even for Basic.',
    userInstructionSummary: editPlan.goalSummary,
    workerNotes: 'Edit level controls complexity and cost, not quality.',
    notes: ['Basic Edit is professional lower-compute editing, not low-quality editing.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'editQualityProfiles', profile))
}

export function createPacingAnalysis(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<PacingAnalysisRecord[]> {
  const analyses = db.editPlanSegments
    .filter((segment) => segment.editPlanId === editPlanId)
    .map((segment) =>
      insertMockRecord(db, 'pacingAnalysis', {
        id: createMockId('pacing-analysis'),
        projectId,
        editPlanId,
        editPlanSegmentId: segment.id,
        sourceClipId: segment.sourceClipId,
        storyBeatId: segment.storyBeatId,
        timeRange: {
          startSeconds: segment.outputStartSeconds,
          endSeconds: segment.outputEndSeconds,
        },
        speakerEnergy: 'medium',
        currentPaceSummary: 'Raw source timing needs clean professional tightening.',
        recommendedPaceSummary: 'Natural clean pacing with meaningful pauses preserved.',
        deadSpaceSeconds: 1,
        emotionalPauseSecondsToPreserve: 0.5,
        pauseQuality: 'natural_breath',
        recommendedPacing: 'natural_clean',
        cutDensity: 'medium',
        preserveBreaths: true,
        preserveEmotionalPauses: true,
        confidence: 90,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { mockOnly: true },
      }),
    )

  return ok(analyses)
}

export function createCutDecisions(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<CutDecisionRecord[]> {
  const cuts = db.editPlanSegments
    .filter((segment) => segment.editPlanId === editPlanId)
    .map((segment, index) =>
      insertMockRecord(db, 'cutDecisions', {
        id: createMockId('cut-decision'),
        projectId,
        editPlanId,
        editPlanSegmentId: segment.id,
        sourceClipId: segment.sourceClipId,
        cutOrder: index + 1,
        cutType: index === 0 ? 'preserve_emotional_pause' : 'tighten_pause',
        timeRange: {
          startSeconds: segment.outputStartSeconds,
          endSeconds: segment.outputEndSeconds,
        },
        outputTimeRange: {
          startSeconds: segment.outputStartSeconds,
          endSeconds: segment.outputEndSeconds,
        },
        reason: 'Professional editing includes knowing when to cut and when to preserve context.',
        preserveContext: true,
        affectsSentence: false,
        preserveAudioContinuity: true,
        workerNotes: ['Do not remove pauses that carry meaning.'],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { mockOnly: true },
      }),
    )

  return ok(cuts)
}

export function createTransitionPlans(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<TransitionPlanRecord[]> {
  const segments = db.editPlanSegments.filter((segment) => segment.editPlanId === editPlanId)
  const transitions = segments.slice(0, -1).map((segment, index) =>
    insertMockRecord(db, 'transitionPlans', {
      id: createMockId('transition-plan'),
      projectId,
      editPlanId,
      fromSegmentId: segment.id,
      toSegmentId: segments[index + 1]?.id,
      transitionOrder: index + 1,
      transitionType: 'hard_cut',
      transitionPolicy: 'only_when_needed',
      reason: 'Use context-based transitions, not random effects.',
      musicBeatAligned: false,
      emotionalTone: 'premium clean',
      durationSeconds: 0.25,
      soundEffectNeeded: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    }),
  )

  return ok(transitions)
}

export function createAudioEnvironmentAnalysis(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<AudioEnvironmentAnalysisRecord[]> {
  const analyses = db.mediaAssets
    .filter((asset) => asset.projectId === projectId)
    .map((asset) =>
      insertMockRecord(db, 'audioEnvironmentAnalysis', {
        id: createMockId('audio-environment'),
        projectId,
        mediaAssetId: asset.id,
        editPlanId,
        timeRange: {
          startSeconds: 0,
          endSeconds: asset.durationSeconds ?? 8,
        },
        environmentType: 'home_interior',
        roomTone: 'home_interior',
        ambientEnvironment: 'natural property walkthrough ambience',
        backgroundNoise: ['low_room_tone'],
        noiseSeverity: 'low',
        reverbLevel: 'low',
        echoDetected: false,
        humDetected: false,
        windDetected: false,
        trafficDetected: false,
        voiceClarityScore: 88,
        recommendedCleanup: 'voice_leveling',
        preserveNaturalAmbience: true,
        cleanupRecommendations: ['Level voice gently; do not strip useful ambience.'],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { mockOnly: true },
      }),
    )

  return ok(analyses)
}

export function createAmbientSoundPlan(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<AmbientSoundPlanRecord> {
  const plan: AmbientSoundPlanRecord = {
    id: createMockId('ambient-sound-plan'),
    projectId,
    editPlanId,
    ambientNeeded: true,
    ambientSoundType: 'home_interior',
    sourceOrGenerated: 'source',
    mixLevel: 'low',
    preserveNaturalRoomTone: true,
    bridgeSceneChanges: true,
    reductionStrategy: 'Smooth source ambience without making the edit feel sterile.',
    notes: ['Do not remove all ambience automatically.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'ambientSoundPlans', plan))
}

export function createMusicPlan(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<MusicPlanRecord> {
  const plan: MusicPlanRecord = {
    id: createMockId('music-plan'),
    projectId,
    editPlanId,
    musicNeeded: true,
    role: 'subtle_bed',
    mood: 'premium calm',
    musicEnergy: 'medium_low',
    energyCurve: 'gentle lift into the closing exterior.',
    musicStartStrategy: 'Fade in after the first visual context.',
    musicEndStrategy: 'Resolve before final CTA/export.',
    duckingStrategy: 'Voice-first ducking under speech.',
    duckingStrategyType: 'voice_first',
    startTiming: 'after hook context',
    beatSyncNeeded: false,
    referenceMusicInfluence: 'subtle premium real-estate bed',
    licenseSource: 'mock',
    beatChangeNotes: ['Never overpower the speaker.'],
    status: 'completed',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'musicPlans', plan))
}

export function createSoundEffectPlan(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<SoundEffectPlanRecord> {
  const plan: SoundEffectPlanRecord = {
    id: createMockId('sfx-plan'),
    projectId,
    editPlanId,
    sfxNeeded: false,
    sfxType: 'none',
    volumeLevel: 'low',
    avoidOverpoweringVoice: true,
    strategy: 'Minimal or no SFX for Basic/Pro unless the story needs it.',
    effects: [],
    avoidRules: ['Avoid loud SFX under speech.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'soundEffectPlans', plan))
}

export function createCaptionPlan(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<CaptionPlanRecord> {
  const plan: CaptionPlanRecord = {
    id: createMockId('caption-plan'),
    projectId,
    editPlanId,
    captionNeeded: true,
    captionPolicy: 'basic_readable',
    captionDensity: 'medium',
    styleIntent: 'basic_readable',
    styleSummary: 'Clean, readable captions.',
    readabilityStandard: 'Readable on mobile and desktop previews.',
    lineBreakStrategy: 'Phrase-based lines.',
    placementStrategy: 'Avoid faces, important objects, and generated overlays.',
    safeZoneRequired: true,
    avoidFaceOverlap: true,
    avoidVisualOverlayOverlap: true,
    wordEmphasisEnabled: false,
    editableAfterPreview: true,
    animated: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'captionPlans', plan))
}

export function createEditQualityChecks(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): ServiceResult<EditQualityCheckRecord[]> {
  const checks: EditQualityCheckRecord[] = [
    'speech_clarity',
    'cut_smoothness',
    'caption_readability',
    'music_balance',
    'sfx_balance',
    'transition_quality',
    'professional_standard',
  ].map((checkType) => ({
    id: createMockId('edit-quality-check'),
    projectId,
    editPlanId,
    checkType: checkType as EditQualityCheckRecord['checkType'],
    status: 'passed',
    score: 92,
    summary: 'Mock edit-quality check passed.',
    blocker: false,
    requiresRetry: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }))

  checks.forEach((check) => insertMockRecord(db, 'editQualityChecks', check))
  return ok(checks)
}
