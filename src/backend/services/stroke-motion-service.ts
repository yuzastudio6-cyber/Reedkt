import type {
  StrokeMotionBeatRecord,
  StrokeMotionCharacterRecord,
  StrokeMotionGenerationSpecRecord,
  StrokeMotionMeaningExpansionRecord,
  StrokeMotionPlanRecord,
  StrokeMotionStoryboardFrameRecord,
  StrokeMotionSymbolRecord,
  StrokeMotionTimingAnchorRecord,
  StrokeMotionTransitionRecord,
  StrokeMotionUnderstandingMode,
} from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { mockStrokeMotionWorkerNotes } from '../mock/mock-service-data'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function detectStrokeMotionUnderstandingMode(prompt: string): StrokeMotionUnderstandingMode {
  const normalizedPrompt = prompt.toLowerCase()
  return normalizedPrompt.includes('source reading') || normalizedPrompt.includes('joseph') ? 'source_reading_mode' : 'spoken_story_mode'
}

export function createMeaningExpansion(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionMeaningExpansionRecord> {
  const plan = findMockRecord(db, 'strokeMotionPlans', strokeMotionPlanId)

  if (!plan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Stroke Motion plan ${strokeMotionPlanId} was not found.`)
  }

  const expansion: StrokeMotionMeaningExpansionRecord = {
    id: createMockId('stroke-meaning-expansion'),
    strokeMotionPlanId,
    workspaceId,
    projectId,
    sourceTextType: 'scripture',
    sourceReference: 'Joseph and Mary sample passage',
    sourceExcerpt: 'Mock source-reading example only.',
    plainLanguageSummary: 'Joseph misunderstands, receives a symbolic message, and restores trust respectfully.',
    expandedStoryBeats: [
      { order: 1, meaning: 'relationship and promise' },
      { order: 2, meaning: 'misunderstanding and tension' },
      { order: 3, meaning: 'symbolic divine message' },
      { order: 4, meaning: 'restoration and protection' },
    ],
    interpretationNotes: 'Sample only; Stroke Motion source reading applies to all story types, not only Bible content.',
    confidence: 'high',
    requiresUserConfirmation: false,
    mustFollowRules: [...mockStrokeMotionWorkerNotes],
    avoidRules: ['Do not use literal divine imagery.'],
    createdByAgent: 'mock_stroke_motion_story_agent',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { sourceReadingRequiresMeaningExpansion: true },
  }

  return ok(insertMockRecord(db, 'strokeMotionMeaningExpansions', expansion))
}

export function createStrokeMotionPlan(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    chatSessionId?: string
    editPlanId: string
    mode?: StrokeMotionUnderstandingMode
  },
): ServiceResult<StrokeMotionPlanRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)

  if (!editPlan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Edit plan ${input.editPlanId} was not found.`)
  }

  const plan: StrokeMotionPlanRecord = {
    id: createMockId('stroke-motion-plan'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    status: 'awaiting_approval',
    understandingMode: input.mode ?? 'source_reading_mode',
    sourceTextType: input.mode === 'spoken_story_mode' ? 'spoken_story' : 'scripture',
    sourceReference: 'Mock Joseph/Mary source-reading sample',
    sourceExcerpt: 'Mock-only source text excerpt.',
    storySummary: 'A respectful symbolic story that can be understood without words.',
    meaningExpansionSummary: 'Relationship, tension, message, restoration.',
    animationGoal: 'Use a continuous stroke line to clarify the emotional/story movement.',
    styleLevel: 'faith_respectful',
    transitionStrategy: 'connected_story_line',
    timingStrategy: 'word-level timing where available; otherwise phrase anchors.',
    continuousLineStrategy: true,
    transparentOverlayRequired: true,
    approvalRequired: true,
    generationStatus: 'awaiting_approval',
    workerNotes: mockStrokeMotionWorkerNotes.join(' '),
    mustFollowRules: [...mockStrokeMotionWorkerNotes],
    avoidRules: ['Do not hard-code Stroke Motion to Bible content only.'],
    planPayload: {
      sampleOnly: true,
      appliesBeyondBibleContent: true,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'strokeMotionPlans', plan))
}

export function createStrokeMotionBeats(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionBeatRecord[]> {
  const labels = ['Relationship line', 'Tension crack', 'Symbolic message', 'Restored connection']
  const beats = labels.map((label, index) =>
    insertMockRecord(db, 'strokeMotionBeats', {
      id: createMockId('stroke-motion-beat'),
      strokeMotionPlanId,
      workspaceId,
      projectId,
      beatOrder: index + 1,
      storyBeatLabel: label,
      meaning: label,
      visualAction: 'Draw a simple symbolic line that communicates the beat.',
      motionPath: 'continuous_line',
      transitionIn: index === 0 ? 'draw_on' : 'morph',
      transitionOut: 'path_follow',
      startTimeSeconds: index * 2,
      endTimeSeconds: index * 2 + 2,
      timingAnchorLabel: label,
      sfxHint: 'soft_draw',
      creditImpact: 'medium',
      workerNotes: 'Keep the visual understandable without words.',
      mustFollowRules: [...mockStrokeMotionWorkerNotes],
      avoidRules: ['Avoid literal blame framing.'],
      beatPayload: { mockOnly: true },
      renderStatus: 'planned',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    }),
  )

  return ok(beats)
}

export function createStrokeMotionCharacters(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionCharacterRecord[]> {
  const characters: StrokeMotionCharacterRecord[] = [
    {
      id: createMockId('stroke-character'),
      strokeMotionPlanId,
      workspaceId,
      projectId,
      characterKey: 'mary',
      displayName: 'Mary',
      role: 'main_subject',
      description: 'Respectfully represented without guilt framing.',
      visualStyle: 'simple symbolic figure',
      emotionState: 'vulnerable and dignified',
      isSymbolic: true,
      characterPayload: { mockOnly: true },
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    },
    {
      id: createMockId('stroke-character'),
      strokeMotionPlanId,
      workspaceId,
      projectId,
      characterKey: 'joseph',
      displayName: 'Joseph',
      role: 'secondary_subject',
      description: 'Misunderstanding shown respectfully.',
      visualStyle: 'simple symbolic figure',
      emotionState: 'concerned then restored',
      isSymbolic: true,
      characterPayload: { mockOnly: true },
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    },
  ]

  characters.forEach((character) => insertMockRecord(db, 'strokeMotionCharacters', character))
  return ok(characters)
}

export function createStrokeMotionSymbols(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionSymbolRecord[]> {
  const symbols: StrokeMotionSymbolRecord[] = ['connection_line', 'broken_line', 'message', 'light'].map((symbolType) => ({
    id: createMockId('stroke-symbol'),
    strokeMotionPlanId,
    workspaceId,
    projectId,
    symbolKey: symbolType,
    symbolType: symbolType as StrokeMotionSymbolRecord['symbolType'],
    label: symbolType.replaceAll('_', ' '),
    meaning: 'Symbolic source-reading visual.',
    visualStyle: 'minimal line art',
    usageNotes: 'Support meaning without literalizing divine presence.',
    symbolPayload: { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }))

  symbols.forEach((symbol) => insertMockRecord(db, 'strokeMotionSymbols', symbol))
  return ok(symbols)
}

export function createStrokeMotionTransitions(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionTransitionRecord[]> {
  const transitions: StrokeMotionTransitionRecord[] = ['draw_on', 'line_to_crack', 'path_to_light'].map((transitionType, index) => ({
    id: createMockId('stroke-transition'),
    strokeMotionPlanId,
    workspaceId,
    projectId,
    transitionOrder: index + 1,
    transitionType: transitionType as StrokeMotionTransitionRecord['transitionType'],
    transitionDescription: 'Continuous line transition between source-reading beats.',
    motionPath: 'connected_story_line',
    durationSeconds: 0.5,
    timingNotes: 'Align to phrase-level anchor.',
    sfxHint: 'soft_draw',
    workerNotes: 'Keep transition subtle and respectful.',
    transitionPayload: { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }))

  transitions.forEach((transition) => insertMockRecord(db, 'strokeMotionTransitions', transition))
  return ok(transitions)
}

export function createStrokeMotionTimingAnchors(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionTimingAnchorRecord[]> {
  const anchors = db.strokeMotionBeats
    .filter((beat) => beat.strokeMotionPlanId === strokeMotionPlanId)
    .map((beat) =>
      insertMockRecord(db, 'strokeMotionTimingAnchors', {
        id: createMockId('stroke-timing-anchor'),
        strokeMotionPlanId,
        strokeMotionBeatId: beat.id,
        workspaceId,
        projectId,
        anchorType: 'phrase',
        anchorLabel: beat.storyBeatLabel,
        matchedText: beat.meaning,
        startTimeSeconds: beat.startTimeSeconds,
        endTimeSeconds: beat.endTimeSeconds,
        confidence: 'high',
        anchorPayload: { mockOnly: true },
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { mockOnly: true },
      }),
    )

  return ok(anchors)
}

export function createStrokeMotionStoryboardFrames(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionStoryboardFrameRecord[]> {
  const frames = db.strokeMotionBeats
    .filter((beat) => beat.strokeMotionPlanId === strokeMotionPlanId)
    .map((beat) =>
      insertMockRecord(db, 'strokeMotionStoryboardFrames', {
        id: createMockId('stroke-frame'),
        strokeMotionPlanId,
        strokeMotionBeatId: beat.id,
        workspaceId,
        projectId,
        frameOrder: beat.beatOrder,
        title: beat.storyBeatLabel,
        description: beat.visualAction,
        visualComposition: 'Transparent overlay line art over approved edit segment.',
        cameraOrOverlayPosition: 'face-safe lower-third area',
        expectedViewerUnderstanding: beat.meaning,
        framePayload: { mockOnly: true },
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { mockOnly: true },
      }),
    )

  return ok(frames)
}

export function createStrokeMotionGenerationSpec(
  db: MockDatabase,
  strokeMotionPlanId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<StrokeMotionGenerationSpecRecord> {
  const spec: StrokeMotionGenerationSpecRecord = {
    id: createMockId('stroke-generation-spec'),
    strokeMotionPlanId,
    workspaceId,
    projectId,
    preferredOutputFormat: 'svg',
    transparentBackgroundRequired: true,
    wordLevelTimingRequired: true,
    deterministicRendererPreferred: true,
    suggestedRenderer: 'svg_renderer',
    durationSeconds: 8,
    width: 1080,
    height: 1920,
    frameRate: 30,
    styleConstraints: {
      cleanLineArt: true,
      transparentOverlay: true,
    },
    timingConstraints: {
      wordLevelTimingPreferred: true,
    },
    prompt: 'Generate a transparent Stroke Motion overlay spec from approved beats.',
    negativePrompt: 'No literal divine figure, no blame framing.',
    workerNotes: mockStrokeMotionWorkerNotes.join(' '),
    specPayload: {
      noRealProviderCall: true,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'strokeMotionGenerationSpecs', spec))
}
