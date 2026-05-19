import type {
  StoryTimingPlanningSources,
} from '../contracts/storytiming-contracts'
import type {
  CaptionPlanRecord,
  CutDecisionRecord,
  PacingAnalysisRecord,
  TransitionPlanRecord,
} from '../../types/edit-quality'
import type {
  EditComplexity,
  EditPlanRecord,
  EditPlanSegmentRecord,
  SignatureRouteRecord,
  StoryBeatRecord,
} from '../../types/planning'
import type {
  MusicCueSheetItemRecord,
  MusicMixPlanRecord,
} from '../../types/audio-music'
import type {
  SFXEventPlanRecord,
  SFXTimingAlignmentRecord,
} from '../../types/sfx-director'
import type {
  StrokeMotionBeatRecord,
  StrokeMotionPlanRecord,
  StrokeMotionTimingAnchorRecord,
} from '../../types/stroke-motion'
import type { RenderJobInputRecord } from '../../types/review-render-export'
import type { TargetPlatform } from '../../types/shared'

const NOW = '2026-05-19T12:00:00.000Z'
const WORKSPACE_ID = 'mock-workspace-storytiming'
const CHAT_SESSION_ID = 'mock-chat-storytiming'

export interface MockStoryTimingScenario {
  id: string
  label: string
  description: string
  projectId: string
  editPlanId: string
  chatSessionId?: string
  targetPlatform?: TargetPlatform
  editComplexity?: EditComplexity
  userTimingInstructions: string[]
  avoidTimingInstructions: string[]
  inputTimingSources: StoryTimingPlanningSources
  expectedAnchors: string[]
  expectedEvents: string[]
  expectedDependencies: string[]
  expectedConflicts: string[]
  expectedQAChecks: string[]
  expectedRenderManifestState: 'ready_for_worker' | 'draft'
}

interface ScenarioOptions {
  id: string
  label: string
  description: string
  projectSlug: string
  editComplexity?: EditComplexity
  targetPlatform?: TargetPlatform
  includeSFX?: boolean
  includeStrokeMotion?: boolean
  includeGraphic?: boolean
  includeRealMotion?: boolean
  preservePause?: boolean
  forceCaptionConflict?: boolean
  forceSfxLate?: boolean
  forceMusicDuckLate?: boolean
  renderReady?: boolean
  faithMode?: boolean
  montageMode?: boolean
}

const timeRange = (startSeconds: number, endSeconds: number) => ({ startSeconds, endSeconds })

const baseRecord = (id: string) => ({
  id,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {},
})

const createEditPlan = (projectId: string, editPlanId: string, options: ScenarioOptions): EditPlanRecord => ({
  id: editPlanId,
  projectId,
  chatSessionId: CHAT_SESSION_ID,
  intentAnalysisId: `${editPlanId}-intent`,
  sourceClipSequenceId: `${editPlanId}-source-sequence`,
  status: 'approved',
  complexity: options.editComplexity ?? 'pro_edit',
  professionalStandardRequired: true,
  goalSummary: options.label,
  strategySummary: options.description,
  hookPolicy: 'recommended',
  hookRecommendation: 'Open with a timing-aware teaser and protect speech meaning.',
  approvalStatus: 'approved',
  approvalRequiredBeforeGeneration: true,
  version: 1,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {},
})

const createSegments = (projectId: string, editPlanId: string, options: ScenarioOptions): EditPlanSegmentRecord[] => [
  {
    id: `${editPlanId}-seg-teaser`,
    editPlanId,
    projectId,
    segmentOrder: 1,
    sourceStartSeconds: 0,
    sourceEndSeconds: 4,
    outputStartSeconds: 0,
    outputEndSeconds: 4,
    transcriptText: options.montageMode ? undefined : 'Coming up, this moment sets the tone.',
    storyBeatId: `${editPlanId}-beat-teaser`,
    segmentPurpose: options.faithMode ? 'quiet opening reflection' : 'coming-up teaser',
    recommendedAction: 'protect the hook and avoid random cuts',
    signatureSystem: 'none',
    signatureReason: 'Keep the opening focused unless a cue is planned.',
    creditImpact: 'low',
    notesForEditor: ['Use the output time range as the base StoryTiming window.'],
    notesForWorker: ['Mock timing only; no rendering.'],
    mustFollowRules: ['Preserve speech meaning.'],
    avoidRules: ['No random SFX.'],
    metadata: {},
  },
  {
    id: `${editPlanId}-seg-dialogue`,
    editPlanId,
    projectId,
    segmentOrder: 2,
    sourceStartSeconds: 4,
    sourceEndSeconds: 13,
    outputStartSeconds: 4,
    outputEndSeconds: 13,
    transcriptText: options.faithMode
      ? 'Sometimes the most important part is the pause before we answer.'
      : 'Lake Como feels effortless when the timing breathes with the dialogue.',
    storyBeatId: `${editPlanId}-beat-dialogue`,
    segmentPurpose: options.faithMode ? 'voice-first teaching' : 'dialogue bed',
    recommendedAction: 'let speech meaning lead timing',
    signatureSystem: options.includeStrokeMotion ? 'stroke_motion' : 'none',
    signatureReason: options.includeStrokeMotion ? 'Stroke Motion completes on the phrase.' : 'No signature overlay needed.',
    creditImpact: options.includeStrokeMotion ? 'medium' : 'low',
    notesForEditor: ['Captions should stay readable under dialogue.'],
    notesForWorker: ['Speech clarity wins.'],
    mustFollowRules: ['Music ducking protects voice.'],
    avoidRules: ['Do not rush the spoken phrase.'],
    metadata: {},
  },
  {
    id: `${editPlanId}-seg-title`,
    editPlanId,
    projectId,
    segmentOrder: 3,
    sourceStartSeconds: 13,
    sourceEndSeconds: 17,
    outputStartSeconds: 13,
    outputEndSeconds: 17,
    transcriptText: undefined,
    storyBeatId: `${editPlanId}-beat-title`,
    segmentPurpose: options.faithMode ? 'chapter title card' : 'chapter/title card',
    recommendedAction: 'land title reveal on a precise hit',
    signatureSystem: options.includeGraphic ? 'graphic_design' : 'none',
    signatureReason: options.includeGraphic ? 'Graphic reveal needs enough read time.' : 'Title can remain simple.',
    creditImpact: options.includeGraphic ? 'medium' : 'low',
    notesForEditor: ['Title reveal is a timing anchor.'],
    notesForWorker: ['Mock title timing only.'],
    mustFollowRules: ['Text-heavy visuals need hold time.'],
    avoidRules: ['Do not hide captions behind title graphics.'],
    metadata: {},
  },
  {
    id: `${editPlanId}-seg-montage`,
    editPlanId,
    projectId,
    segmentOrder: 4,
    sourceStartSeconds: 17,
    sourceEndSeconds: 28,
    outputStartSeconds: 17,
    outputEndSeconds: 28,
    transcriptText: options.montageMode ? undefined : 'The movement gives the audience a second to take it in.',
    storyBeatId: `${editPlanId}-beat-montage`,
    segmentPurpose: options.montageMode ? 'beat-driven montage' : 'boat/movement montage',
    recommendedAction: options.montageMode ? 'let music rhythm lead non-speech timing' : 'balance music rhythm and visual movement',
    signatureSystem: options.includeRealMotion ? 'real_motion' : 'none',
    signatureReason: options.includeRealMotion ? 'Real Motion object settle supports the demonstration.' : 'Source movement carries the beat.',
    creditImpact: options.includeRealMotion ? 'premium' : 'low',
    notesForEditor: ['Music and visual rhythm can lead when speech is absent.'],
    notesForWorker: ['Do not cover faces or important labels.'],
    mustFollowRules: ['Keep SFX tied to a real cue.'],
    avoidRules: ['No chaotic beat cutting.'],
    metadata: {},
  },
  {
    id: `${editPlanId}-seg-outro`,
    editPlanId,
    projectId,
    segmentOrder: 5,
    sourceStartSeconds: 28,
    sourceEndSeconds: 34,
    outputStartSeconds: 28,
    outputEndSeconds: 34,
    transcriptText: 'We close by letting the final thought resolve.',
    storyBeatId: `${editPlanId}-beat-outro`,
    segmentPurpose: 'outro resolve',
    recommendedAction: 'resolve music and captions cleanly',
    signatureSystem: 'none',
    signatureReason: 'No extra visual needed.',
    creditImpact: 'low',
    notesForEditor: ['Let the final line breathe.'],
    notesForWorker: ['End timing should feel resolved.'],
    mustFollowRules: ['Do not cut the final word.'],
    avoidRules: ['Do not add a loud final hit under speech.'],
    metadata: {},
  },
]

const createStoryBeats = (projectId: string, editPlanId: string): StoryBeatRecord[] => [
  ['teaser', 1, 'hook', 0, 4],
  ['dialogue', 2, 'setup', 4, 13],
  ['title', 3, 'transition', 13, 17],
  ['montage', 4, 'example', 17, 28],
  ['outro', 5, 'cta', 28, 34],
].map(([key, order, beatType, start, end]) => ({
  id: `${editPlanId}-beat-${key}`,
  storyBeatMapId: `${editPlanId}-beat-map`,
  projectId,
  editPlanId,
  beatOrder: Number(order),
  beatType: beatType as StoryBeatRecord['beatType'],
  status: 'planned',
  label: String(key),
  purpose: `Preserve ${key} meaning and pacing.`,
  timeRange: timeRange(Number(start), Number(end)),
  active: true,
  linkedSegmentIds: [`${editPlanId}-seg-${key}`],
  linkedTranscriptSegmentIds: [],
  metadata: {},
}))

const createCaptionPlan = (projectId: string, editPlanId: string): CaptionPlanRecord => ({
  ...baseRecord(`${editPlanId}-caption-plan`),
  projectId,
  editPlanId,
  captionNeeded: true,
  captionPolicy: 'clean_social',
  captionDensity: 'medium',
  styleIntent: 'clean_social',
  styleSummary: 'Readable captions under speech.',
  readabilityStandard: 'Comfortable read windows with no overlay collision.',
  lineBreakStrategy: 'phrase-aware',
  placementStrategy: 'lower safe zone',
  safeZoneRequired: true,
  avoidFaceOverlap: true,
  avoidVisualOverlayOverlap: true,
  wordEmphasisEnabled: true,
  editableAfterPreview: true,
  animated: true,
})

const createPacing = (projectId: string, editPlanId: string, options: ScenarioOptions): PacingAnalysisRecord[] => [
  {
    ...baseRecord(`${editPlanId}-pacing-dialogue`),
    projectId,
    editPlanId,
    editPlanSegmentId: `${editPlanId}-seg-dialogue`,
    storyBeatId: `${editPlanId}-beat-dialogue`,
    timeRange: options.preservePause ? timeRange(8.6, 9.8) : timeRange(4, 13),
    speakerEnergy: options.faithMode ? 'serious' : 'calm',
    currentPaceSummary: 'Speech has natural cadence.',
    recommendedPaceSummary: options.preservePause
      ? 'Preserve the emotional pause before continuing.'
      : 'Keep the dialogue clean and direct.',
    deadSpaceSeconds: options.preservePause ? 0 : 0.3,
    emotionalPauseSecondsToPreserve: options.preservePause ? 1.2 : 0,
    pauseQuality: options.preservePause ? 'emotional_pause' : 'natural_breath',
    recommendedPacing: options.faithMode ? 'emotional_breathing' : 'natural_clean',
    cutDensity: 'low',
    preserveBreaths: true,
    preserveEmotionalPauses: options.preservePause,
    confidence: 92,
  },
]

const createCuts = (projectId: string, editPlanId: string, options: ScenarioOptions): CutDecisionRecord[] => [
  {
    ...baseRecord(`${editPlanId}-cut-main`),
    projectId,
    editPlanId,
    editPlanSegmentId: `${editPlanId}-seg-dialogue`,
    cutOrder: 1,
    cutType: options.preservePause ? 'preserve_emotional_pause' : 'j_cut',
    timeRange: options.preservePause ? timeRange(9, 9) : timeRange(13, 13),
    outputTimeRange: options.preservePause ? timeRange(9, 9) : timeRange(13, 13),
    reason: options.preservePause ? 'Mock risky cut inside emotional pause' : 'Clean dialogue-to-title cut',
    preserveContext: !options.preservePause,
    affectsSentence: options.preservePause,
    preserveAudioContinuity: true,
    workerNotes: options.preservePause
      ? ['Deliberate conflict: cut would remove a meaningful pause.']
      : ['Cut lands after phrase meaning resolves.'],
  },
]

const createTransitions = (projectId: string, editPlanId: string): TransitionPlanRecord[] => [
  {
    ...baseRecord(`${editPlanId}-transition-title`),
    projectId,
    editPlanId,
    fromSegmentId: `${editPlanId}-seg-dialogue`,
    toSegmentId: `${editPlanId}-seg-title`,
    transitionOrder: 1,
    transitionType: 'soft_cut',
    transitionPolicy: 'story_matched',
    reason: 'Transition into chapter/title card.',
    musicBeatAligned: true,
    emotionalTone: 'polished',
    durationSeconds: 0.4,
    soundEffectNeeded: true,
    musicSyncPoint: 'downbeat into title',
    sfxHint: 'soft_whoosh',
  },
]

const createMusic = (editPlanId: string, options: ScenarioOptions): {
  musicCues: MusicCueSheetItemRecord[]
  musicMixPlans: MusicMixPlanRecord[]
} => ({
  musicCues: [
    {
      id: `${editPlanId}-cue-dialogue`,
      cueSheetId: `${editPlanId}-cue-sheet`,
      cueOrder: 1,
      cueRole: options.montageMode ? 'montage_drive' : 'dialogue_bed',
      sectionType: options.montageMode ? 'montage' : 'dialogue',
      label: options.montageMode ? 'Beat-driven movement cue' : 'Speech-safe dialogue bed',
      timeRange: timeRange(0, 17),
      mood: options.faithMode ? 'faith_reflective' : 'premium_lifestyle',
      energyLevel: options.montageMode ? 'medium_high' : 'medium_low',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'speech_first',
      genreHints: ['cinematic_lifestyle'],
      ambienceNotes: ['Preserve natural ambience where it carries story.'],
      sfxNotes: ['SFX must remain cue-based.'],
      adaptationNotes: ['Music supports timing but does not override speech.'],
      doNotCopyNotes: ['Do not copy reference music.'],
    },
    {
      id: `${editPlanId}-cue-montage`,
      cueSheetId: `${editPlanId}-cue-sheet`,
      cueOrder: 2,
      cueRole: 'montage_drive',
      sectionType: 'movement',
      label: 'Movement montage cue',
      timeRange: timeRange(17, 28),
      mood: options.faithMode ? 'reflective' : 'cinematic_travel',
      energyLevel: options.montageMode ? 'high' : 'medium',
      vocalPolicy: 'instrumental_only',
      speechSafety: 'duck_under_voice',
      genreHints: ['cinematic_lifestyle'],
      ambienceNotes: ['Let movement breathe.'],
      sfxNotes: ['Title and transition hits only.'],
      adaptationNotes: ['Beat timing may lead non-speech moments.'],
      doNotCopyNotes: ['No direct musical copying.'],
    },
  ],
  musicMixPlans: [
    {
      id: `${editPlanId}-music-mix`,
      projectId: `mock-project-${editPlanId}`,
      cueSheetItemId: `${editPlanId}-cue-dialogue`,
      targetVolumeDb: -18,
      duckingStrategy: 'voice_first_ducking',
      duckingAmountDb: -8,
      duckUnderSpeech: true,
      introFadeSeconds: 0.5,
      outroFadeSeconds: 0.8,
      crossfadeWithPreviousSeconds: 0,
      crossfadeWithNextSeconds: 0.4,
      beatSyncPoints: ['title downbeat at 13.0s'],
      silenceMoments: options.faithMode ? ['preserve silence at 8.6s'] : [],
      ambientBridgeNeeded: !options.faithMode,
      sfxRelationship: 'SFX supports planned title and transition cues.',
      mixNotes: options.forceMusicDuckLate
        ? ['force_music_duck_late', 'Deliberate mock late ducking conflict.']
        : ['Duck before dialogue starts.'],
      status: 'ready',
      createdAt: NOW,
    },
  ],
})

const createSFX = (projectId: string, editPlanId: string, options: ScenarioOptions): {
  sfxEventPlans: SFXEventPlanRecord[]
  sfxTimingAlignments: SFXTimingAlignmentRecord[]
} => {
  if (!options.includeSFX) {
    return { sfxEventPlans: [], sfxTimingAlignments: [] }
  }

  const sfxEventPlan: SFXEventPlanRecord = {
    ...baseRecord(`${editPlanId}-sfx-title`),
    projectId,
    editPlanId,
    editPlanSegmentId: `${editPlanId}-seg-title`,
    targetLayer: 'chapter_card',
    useCase: options.faithMode ? 'ambient_soft_bridge' : 'chapter_title',
    decisionState: options.faithMode ? 'optional' : 'needed',
    sourceFootagePolicy: 'edit_layer_only_default',
    reason: options.faithMode ? 'Use whisper-soft support only if needed.' : 'Title card needs a precise soft hit.',
    sceneContext: 'Chapter/title reveal',
    videoTone: options.faithMode ? 'serious reflective' : 'premium lifestyle',
    editLevel: 'pro',
    anchorType: 'chapter_card_reveal',
    anchorTimeSeconds: 13.2,
    startTimeSeconds: 12.95,
    hitTimeSeconds: options.forceSfxLate ? 13.55 : 13.2,
    endTimeSeconds: 13.9,
    timingPriority: 'frame_accurate',
    volumeProfile: options.faithMode ? 'whisper' : 'subtle_polish',
    mixPriority: 'voice_first',
    creditImpact: 'low',
    requiresApproval: true,
    userVisibleSummary: options.faithMode ? 'whisper-soft chapter support' : 'soft chapter title hit',
    avoidRules: ['Do not overpower speech.'],
    mustFollowRules: ['Land on the title reveal.'],
    status: 'approved',
    notes: options.forceSfxLate ? ['force_sfx_hit_late'] : ['SFX is tied to title reveal.'],
  }

  return {
    sfxEventPlans: [sfxEventPlan],
    sfxTimingAlignments: [],
  }
}

const createSignatureRoutes = (projectId: string, editPlanId: string, options: ScenarioOptions): SignatureRouteRecord[] => {
  const routes: SignatureRouteRecord[] = []
  if (options.includeGraphic || options.forceCaptionConflict) {
    routes.push({
      id: `${editPlanId}-graphic-route`,
      projectId,
      editPlanId,
      editPlanSegmentId: options.forceCaptionConflict ? `${editPlanId}-seg-dialogue` : `${editPlanId}-seg-title`,
      signatureSystem: 'graphic_design',
      requirement: 'recommended',
      reason: options.forceCaptionConflict ? 'Deliberate caption overlap graphic' : 'Chapter card reveal',
      timing: options.forceCaptionConflict ? timeRange(4.1, 7.2) : timeRange(13, 16.2),
      creditImpact: 'medium',
      optional: false,
      approvalNeeded: true,
      workerTarget: 'graphic_design_worker',
      status: 'draft',
      metadata: {},
    })
  }

  if (options.includeRealMotion) {
    routes.push({
      id: `${editPlanId}-real-motion-route`,
      projectId,
      editPlanId,
      editPlanSegmentId: `${editPlanId}-seg-montage`,
      signatureSystem: 'real_motion',
      requirement: 'recommended',
      reason: 'Real Motion object demonstration',
      timing: timeRange(17.2, options.renderReady ? 18.4 : 20.6),
      creditImpact: 'premium',
      optional: false,
      approvalNeeded: true,
      workerTarget: 'real_motion_worker',
      status: 'draft',
      metadata: {},
    })
  }

  return routes
}

const createStrokeMotion = (projectId: string, editPlanId: string, options: ScenarioOptions): {
  strokeMotionPlans: StrokeMotionPlanRecord[]
  strokeMotionBeats: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors: StrokeMotionTimingAnchorRecord[]
} => {
  if (!options.includeStrokeMotion) {
    return {
      strokeMotionPlans: [],
      strokeMotionBeats: [],
      strokeMotionTimingAnchors: [],
    }
  }

  const planId = `${editPlanId}-stroke-plan`
  return {
    strokeMotionPlans: [
      {
        ...baseRecord(planId),
        workspaceId: WORKSPACE_ID,
        projectId,
        editPlanId,
        editPlanSegmentId: `${editPlanId}-seg-dialogue`,
        status: 'approved',
        understandingMode: 'spoken_story_mode',
        sourceTextType: options.faithMode ? 'lesson' : 'spoken_story',
        spokenTranscriptExcerpt: 'the timing breathes with the dialogue',
        storySummary: 'Draw the meaning of the phrase.',
        meaningExpansionSummary: 'Timing follows spoken meaning.',
        animationGoal: 'Complete the stroke on the phrase end.',
        styleLevel: options.faithMode ? 'faith_respectful' : 'premium_subtle',
        timingStrategy: 'phrase_locked',
        continuousLineStrategy: true,
        transparentOverlayRequired: true,
        approvalRequired: true,
        generationStatus: 'planned',
        workerNotes: 'Mock Stroke Motion timing only.',
        mustFollowRules: ['Complete on phrase meaning.'],
        avoidRules: ['Do not distract from speaker.'],
        planPayload: {},
      },
    ],
    strokeMotionBeats: [
      {
        ...baseRecord(`${editPlanId}-stroke-beat`),
        strokeMotionPlanId: planId,
        workspaceId: WORKSPACE_ID,
        projectId,
        editPlanSegmentId: `${editPlanId}-seg-dialogue`,
        storyBeatId: `${editPlanId}-beat-dialogue`,
        beatOrder: 1,
        storyBeatLabel: 'phrase meaning',
        meaning: 'Visual line completes the spoken thought.',
        visualAction: 'line completes under final phrase',
        startTimeSeconds: 7.8,
        endTimeSeconds: options.renderReady ? 8.9 : 9.4,
        matchedWords: 'timing breathes with the dialogue',
        timingAnchorLabel: 'phrase end',
        sfxHint: 'soft_draw',
        creditImpact: 'medium',
        workerNotes: 'Complete on phrase end.',
        mustFollowRules: ['Phrase locked.'],
        avoidRules: ['Do not continue after the phrase.'],
        beatPayload: {},
        renderStatus: 'planned',
      },
    ],
    strokeMotionTimingAnchors: [
      {
        ...baseRecord(`${editPlanId}-stroke-anchor`),
        strokeMotionPlanId: planId,
        strokeMotionBeatId: `${editPlanId}-stroke-beat`,
        workspaceId: WORKSPACE_ID,
        projectId,
        anchorType: 'phrase',
        anchorLabel: 'phrase end',
        matchedText: 'with the dialogue',
        startTimeSeconds: 8.2,
        endTimeSeconds: 8.9,
        confidence: 'high',
        anchorPayload: {},
      },
    ],
  }
}

const createRenderInputs = (projectId: string, editPlanId: string): RenderJobInputRecord[] => [
  {
    id: `${editPlanId}-render-input-source`,
    renderJobId: `${editPlanId}-render-job`,
    workspaceId: WORKSPACE_ID,
    projectId,
    inputType: 'source_video',
    editPlanSegmentId: `${editPlanId}-seg-dialogue`,
    sourceStartSeconds: 4,
    sourceEndSeconds: 13,
    timelineStartSeconds: 4,
    timelineEndSeconds: 13,
    layerName: 'source-video',
    zIndex: 0,
    inputPayload: {},
    createdAt: NOW,
  },
]

const createSources = (options: ScenarioOptions): StoryTimingPlanningSources => {
  const projectId = `mock-project-${options.projectSlug}`
  const editPlanId = `mock-edit-plan-${options.projectSlug}`
  const music = createMusic(editPlanId, options)
  const sfx = createSFX(projectId, editPlanId, options)
  const stroke = createStrokeMotion(projectId, editPlanId, options)

  return {
    editPlan: createEditPlan(projectId, editPlanId, options),
    editPlanSegments: createSegments(projectId, editPlanId, options),
    storyBeats: createStoryBeats(projectId, editPlanId),
    pacingAnalysis: createPacing(projectId, editPlanId, options),
    cutDecisions: createCuts(projectId, editPlanId, options),
    transitionPlans: createTransitions(projectId, editPlanId),
    captionPlans: [createCaptionPlan(projectId, editPlanId)],
    musicCues: music.musicCues,
    musicMixPlans: music.musicMixPlans,
    sfxEventPlans: sfx.sfxEventPlans,
    sfxTrimPlans: [],
    sfxTimingAlignments: sfx.sfxTimingAlignments,
    sfxMixPlans: [],
    strokeMotionPlans: stroke.strokeMotionPlans,
    strokeMotionBeats: stroke.strokeMotionBeats,
    strokeMotionTimingAnchors: stroke.strokeMotionTimingAnchors,
    signatureRoutes: createSignatureRoutes(projectId, editPlanId, options),
    renderJobInputs: options.renderReady ? createRenderInputs(projectId, editPlanId) : [],
    qaReports: [],
  }
}

const makeScenario = (options: ScenarioOptions): MockStoryTimingScenario => {
  const projectId = `mock-project-${options.projectSlug}`
  const editPlanId = `mock-edit-plan-${options.projectSlug}`
  const sources = createSources(options)
  const expectedConflicts = [
    options.forceCaptionConflict ? 'caption_overlay_collision' : '',
    options.forceSfxLate ? 'sfx_hit_late' : '',
    options.forceMusicDuckLate ? 'music_ducking_misses_speech' : '',
    options.preservePause ? 'emotional_pause_removed' : '',
    options.includeRealMotion && !options.renderReady ? 'real_motion_blocks_face' : '',
  ].filter(Boolean)

  return {
    id: options.id,
    label: options.label,
    description: options.description,
    projectId,
    editPlanId,
    chatSessionId: CHAT_SESSION_ID,
    targetPlatform: options.targetPlatform ?? 'instagram',
    editComplexity: options.editComplexity ?? 'pro_edit',
    userTimingInstructions: [
      'Protect speech meaning and caption readability.',
      options.montageMode ? 'Let music lead only in non-speech montage sections.' : 'Keep timing natural.',
    ],
    avoidTimingInstructions: [
      'Avoid random decorative SFX.',
      'Do not let music or overlays cover speech.',
    ],
    inputTimingSources: sources,
    expectedAnchors: ['story beat anchors', 'edit segment anchors', 'music anchors'],
    expectedEvents: ['caption events', 'cut events', 'music events', 'render markers'],
    expectedDependencies: ['caption overlay safety', 'music ducking', 'transition story beat safety'],
    expectedConflicts,
    expectedQAChecks: ['caption_sync', 'music_ducking_timing', 'sfx_hit_alignment', 'render_manifest_integrity'],
    expectedRenderManifestState: expectedConflicts.length === 0 ? 'ready_for_worker' : 'draft',
  }
}

export const mockStoryTimingScenarios: MockStoryTimingScenario[] = [
  makeScenario({
    id: 'lake_como_lifestyle_timing',
    label: 'Lake Como lifestyle vacation timing',
    description: 'Lifestyle/vacation edit with dialogue, title hit, movement montage, ambience, and outro resolve.',
    projectSlug: 'lake-como',
    includeSFX: true,
    includeGraphic: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'simple_talking_head_clean_edit',
    label: 'Simple talking-head clean edit',
    description: 'Speech-first clean edit with professional caption and music ducking timing.',
    projectSlug: 'talking-head',
    renderReady: true,
  }),
  makeScenario({
    id: 'faith_bible_teaching_timing',
    label: 'Faith/Bible teaching timing',
    description: 'Voice-first teaching with subtle music and preserved emotional pause.',
    projectSlug: 'faith-teaching',
    faithMode: true,
    includeSFX: true,
    preservePause: true,
  }),
  makeScenario({
    id: 'real_estate_luxury_walkthrough_timing',
    label: 'Real estate luxury walkthrough timing',
    description: 'Smooth pacing and viewer comprehension lead a luxury walkthrough.',
    projectSlug: 'real-estate',
    includeGraphic: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'fitness_high_energy_beat_timing',
    label: 'Fitness high-energy beat timing',
    description: 'Beat-driven non-speech sections with speech-safe captions.',
    projectSlug: 'fitness',
    montageMode: true,
    includeSFX: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'product_demo_saas_explanation_timing',
    label: 'Product demo / SaaS explanation timing',
    description: 'Caption readability and visual comprehension lead a product explanation.',
    projectSlug: 'saas-demo',
    includeGraphic: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'stroke_motion_story_timing',
    label: 'Stroke Motion story timing',
    description: 'Stroke Motion start/completion is phrase-locked to speech meaning.',
    projectSlug: 'stroke-motion',
    includeStrokeMotion: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'signature_storytiming_full_stack',
    label: 'Signature StoryTiming full stack',
    description: 'Stroke Motion, Graphic Design, Real Motion, and SFX are coordinated against speech/story anchors.',
    projectSlug: 'signature-full-stack',
    editComplexity: 'signature_edit',
    includeStrokeMotion: true,
    includeGraphic: true,
    includeRealMotion: true,
    includeSFX: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'graphic_design_visualexplain_timing',
    label: 'Graphic Design / VisualExplain timing',
    description: 'Graphic reveal gets enough hold time and avoids caption collision.',
    projectSlug: 'graphic-design',
    includeGraphic: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'real_motion_object_demonstration_timing',
    label: 'Real Motion object demonstration timing',
    description: 'Real Motion object enters and settles in a face-safe timing window.',
    projectSlug: 'real-motion',
    includeRealMotion: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'multi_cue_music_sfx_montage_timing',
    label: 'Multi-cue music + SFX montage timing',
    description: 'Music and SFX cues support a movement montage without overriding speech.',
    projectSlug: 'music-sfx-montage',
    includeSFX: true,
    montageMode: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'caption_conflict_with_overlay',
    label: 'Caption conflict with overlay',
    description: 'Deliberate graphic/caption overlap for conflict detection.',
    projectSlug: 'caption-conflict',
    forceCaptionConflict: true,
  }),
  makeScenario({
    id: 'sfx_hit_late_conflict',
    label: 'SFX hit late conflict',
    description: 'Deliberate late SFX hit for alignment QA.',
    projectSlug: 'sfx-late',
    includeSFX: true,
    forceSfxLate: true,
  }),
  makeScenario({
    id: 'music_ducking_misses_speech_conflict',
    label: 'Music ducking misses speech conflict',
    description: 'Deliberate late ducking for speech safety QA.',
    projectSlug: 'music-duck-conflict',
    forceMusicDuckLate: true,
  }),
  makeScenario({
    id: 'emotional_pause_removed_conflict',
    label: 'Emotional pause removed conflict',
    description: 'Deliberate cut inside a protected emotional pause.',
    projectSlug: 'pause-conflict',
    faithMode: true,
    preservePause: true,
  }),
  makeScenario({
    id: 'render_manifest_ready_case',
    label: 'Render manifest ready case',
    description: 'No blocking conflicts; manifest can be marked ready for worker planning.',
    projectSlug: 'render-ready',
    includeSFX: true,
    includeGraphic: true,
    renderReady: true,
  }),
  makeScenario({
    id: 'render_manifest_blocked_case',
    label: 'Render manifest blocked case',
    description: 'Blocking conflicts keep the manifest in draft status.',
    projectSlug: 'render-blocked',
    includeRealMotion: true,
    forceCaptionConflict: true,
  }),
]

export function getMockStoryTimingScenarioById(id: string): MockStoryTimingScenario | undefined {
  return mockStoryTimingScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockStoryTimingScenario(): MockStoryTimingScenario {
  return mockStoryTimingScenarios[0]
}
