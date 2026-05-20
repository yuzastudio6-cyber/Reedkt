import type { StoryTimingPlanningSources } from '../contracts/storytiming-contracts'
import type { CaptionPlanRecord } from '../../types/edit-quality'
import type {
  EditComplexity,
  EditPlanRecord,
  EditPlanSegmentRecord,
  SignatureRouteRecord,
  StoryBeatRecord,
} from '../../types/planning'
import type {
  StrokeMotionBeatRecord,
  StrokeMotionPlanRecord,
  StrokeMotionTimingAnchorRecord,
} from '../../types/stroke-motion'
import type { SFXEventPlanRecord } from '../../types/sfx-director'
import type { TargetPlatform } from '../../types/shared'

const NOW = '2026-05-19T12:00:00.000Z'
const WORKSPACE_ID = 'mock-workspace-signature-timing'
const CHAT_SESSION_ID = 'mock-chat-signature-timing'

type ScenarioSystem = 'stroke_motion' | 'graphic_design' | 'real_motion' | 'all'
type ScenarioTone = 'standard' | 'faith' | 'education' | 'lifestyle'
type ScenarioIssue =
  | 'none'
  | 'stroke_late'
  | 'stroke_caption_overlap'
  | 'graphic_short_read'
  | 'graphic_caption_overlap'
  | 'real_face_block'
  | 'real_sfx_late'
  | 'too_many_overlays'

export interface MockSignatureTimingScenario {
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
  signatureRouteContext: string
  segmentTiming: string
  transcriptStoryContext: string
  inputTimingSources: StoryTimingPlanningSources
  expectedAnchors: string[]
  expectedEvents: string[]
  expectedDependencies: string[]
  expectedConflicts: string[]
  expectedQAChecks: string[]
}

interface ScenarioOptions {
  id: string
  label: string
  description: string
  system: ScenarioSystem
  issue?: ScenarioIssue
  tone?: ScenarioTone
  includeSFX?: boolean
  editComplexity?: EditComplexity
  routeStart?: number
  routeEnd?: number
}

const baseRecord = (id: string) => ({
  id,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {},
})

const timeRange = (startSeconds: number, endSeconds: number) => ({ startSeconds, endSeconds })

const projectIdFor = (slug: string): string => `mock-project-signature-${slug}`
const editPlanIdFor = (slug: string): string => `mock-edit-plan-signature-${slug}`

const createEditPlan = (projectId: string, editPlanId: string, options: ScenarioOptions): EditPlanRecord => ({
  id: editPlanId,
  projectId,
  chatSessionId: CHAT_SESSION_ID,
  intentAnalysisId: `${editPlanId}-intent`,
  sourceClipSequenceId: `${editPlanId}-source-sequence`,
  status: 'approved',
  complexity: options.editComplexity ?? (options.system === 'real_motion' ? 'premium_signature_edit' : 'signature_edit'),
  professionalStandardRequired: true,
  goalSummary: options.label,
  strategySummary: options.description,
  hookPolicy: 'recommended',
  hookRecommendation: 'Open with meaning-led timing and avoid random overlays.',
  approvalStatus: 'approved',
  approvalRequiredBeforeGeneration: true,
  version: 1,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {},
})

const transcriptForTone = (tone: ScenarioTone): string => {
  if (tone === 'faith') return 'Sometimes the pause before the answer carries the meaning.'
  if (tone === 'education') return 'Here are the three steps that make the system clear.'
  if (tone === 'lifestyle') return 'This is where the vacation finally starts to feel real.'
  return 'This changed everything when the idea finally clicked.'
}

const createSegments = (projectId: string, editPlanId: string, options: ScenarioOptions): EditPlanSegmentRecord[] => [
  {
    id: `${editPlanId}-seg-main`,
    editPlanId,
    projectId,
    segmentOrder: 1,
    sourceStartSeconds: 0,
    sourceEndSeconds: 8,
    outputStartSeconds: 0,
    outputEndSeconds: 8,
    transcriptText: transcriptForTone(options.tone ?? 'standard'),
    storyBeatId: `${editPlanId}-beat-main`,
    segmentPurpose: options.tone === 'faith'
      ? 'serious teaching phrase'
      : options.tone === 'education'
        ? 'educational explanation'
        : options.tone === 'lifestyle'
          ? 'lifestyle title moment'
          : 'meaning-led signature moment',
    recommendedAction: 'time visual signature to phrase meaning and viewer comprehension',
    signatureSystem: options.system === 'all' ? 'stroke_motion' : options.system,
    signatureReason: 'Signature visual improves this segment only when timed to meaning.',
    creditImpact: options.system === 'real_motion' ? 'premium' : 'medium',
    notesForEditor: ['Output timing is the base StoryTiming window.'],
    notesForWorker: ['Mock timing only; do not render or call providers.'],
    mustFollowRules: ['Signature animation must land on meaning.'],
    avoidRules: ['No random b-roll, captions, overlays, music, or SFX.'],
    metadata: {},
  },
  {
    id: `${editPlanId}-seg-next`,
    editPlanId,
    projectId,
    segmentOrder: 2,
    sourceStartSeconds: 8,
    sourceEndSeconds: 12,
    outputStartSeconds: 8,
    outputEndSeconds: 12,
    transcriptText: 'Then the edit moves to the next idea.',
    storyBeatId: `${editPlanId}-beat-next`,
    segmentPurpose: 'next idea',
    recommendedAction: 'clear previous overlays before this idea',
    signatureSystem: 'none',
    signatureReason: 'No extra visual needed.',
    creditImpact: 'low',
    notesForEditor: ['Previous overlays should be gone.'],
    notesForWorker: ['Mock timing only.'],
    mustFollowRules: ['Keep transition clean.'],
    avoidRules: ['Do not carry signature overlays into unrelated segment.'],
    metadata: {},
  },
]

const createStoryBeats = (projectId: string, editPlanId: string, options: ScenarioOptions): StoryBeatRecord[] => [
  {
    id: `${editPlanId}-beat-main`,
    storyBeatMapId: `${editPlanId}-beat-map`,
    workspaceId: WORKSPACE_ID,
    projectId,
    editPlanId,
    beatOrder: 1,
    beatType: options.tone === 'education' ? 'explanation' : options.tone === 'faith' ? 'context' : 'transformation',
    status: 'planned',
    label: options.tone === 'faith' ? 'meaningful pause' : 'key phrase',
    purpose: 'Signature timing should support this story beat.',
    timeRange: timeRange(0, 8),
    active: true,
    linkedSegmentIds: [`${editPlanId}-seg-main`],
    linkedTranscriptSegmentIds: [],
    metadata: {},
  },
]

const createCaptionPlan = (projectId: string, editPlanId: string): CaptionPlanRecord => ({
  ...baseRecord(`${editPlanId}-caption-plan`),
  projectId,
  editPlanId,
  captionNeeded: true,
  captionPolicy: 'clean_social',
  captionDensity: 'medium',
  styleIntent: 'clean_social',
  styleSummary: 'Readable captions under speech.',
  readabilityStandard: 'Captions should not collide with signature overlays.',
  lineBreakStrategy: 'phrase-aware',
  placementStrategy: 'lower safe zone',
  safeZoneRequired: true,
  avoidFaceOverlap: true,
  avoidVisualOverlayOverlap: true,
  wordEmphasisEnabled: true,
  editableAfterPreview: true,
  animated: true,
})

const shouldInclude = (options: ScenarioOptions, system: Exclude<ScenarioSystem, 'all'>): boolean =>
  options.system === system || options.system === 'all'

const createSignatureRoutes = (projectId: string, editPlanId: string, options: ScenarioOptions): SignatureRouteRecord[] => {
  const start = options.routeStart ?? (options.issue === 'graphic_caption_overlap' || options.issue === 'stroke_caption_overlap' ? 1.2 : 4.4)
  const end = options.routeEnd ?? (options.issue === 'graphic_short_read' ? start + 0.6 : start + 2.2)
  const routes: SignatureRouteRecord[] = []

  if (shouldInclude(options, 'stroke_motion')) {
    routes.push({
      id: `${editPlanId}-route-stroke`,
      projectId,
      editPlanId,
      editPlanSegmentId: `${editPlanId}-seg-main`,
      signatureSystem: 'stroke_motion',
      requirement: 'recommended',
      reason: 'Stroke Motion phrase line',
      timing: timeRange(start, options.issue === 'stroke_late' ? 6.8 : 5.8),
      creditImpact: 'medium',
      optional: false,
      approvalNeeded: true,
      workerTarget: 'stroke_motion_story_agent',
      status: 'draft',
      metadata: {},
    })
  }

  if (shouldInclude(options, 'graphic_design')) {
    routes.push({
      id: `${editPlanId}-route-graphic`,
      projectId,
      editPlanId,
      editPlanSegmentId: `${editPlanId}-seg-main`,
      signatureSystem: 'graphic_design',
      requirement: 'recommended',
      reason: options.tone === 'education' ? 'Three step VisualExplain card' : 'Chapter card reveal',
      timing: timeRange(start, end),
      creditImpact: 'medium',
      optional: false,
      approvalNeeded: true,
      workerTarget: 'graphic_design_worker',
      status: 'draft',
      metadata: {
        listItemLabels: options.tone === 'education' ? ['Step one', 'Step two', 'Step three'] : [],
        forceShortReadable: options.issue === 'graphic_short_read',
      },
    })
  }

  if (shouldInclude(options, 'real_motion')) {
    routes.push({
      id: `${editPlanId}-route-real-motion`,
      projectId,
      editPlanId,
      editPlanSegmentId: `${editPlanId}-seg-main`,
      signatureSystem: 'real_motion',
      requirement: 'recommended',
      reason: 'Real Motion object demonstration',
      timing: timeRange(start, end + 0.8),
      creditImpact: 'premium',
      optional: false,
      approvalNeeded: true,
      workerTarget: 'real_motion_worker',
      status: 'draft',
      metadata: {
        settleSeconds: options.issue === 'real_sfx_late' ? 5.2 : start + 0.75,
        faceSafetyRisk: options.issue === 'real_face_block' || options.issue === 'too_many_overlays' ? 'face_blocking' : 'none',
        faceSafePlacement: options.issue !== 'real_face_block' && options.issue !== 'too_many_overlays',
      },
    })
  }

  return routes
}

const createStrokeMotion = (projectId: string, editPlanId: string, options: ScenarioOptions): {
  strokeMotionPlans: StrokeMotionPlanRecord[]
  strokeMotionBeats: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors: StrokeMotionTimingAnchorRecord[]
} => {
  if (!shouldInclude(options, 'stroke_motion')) {
    return { strokeMotionPlans: [], strokeMotionBeats: [], strokeMotionTimingAnchors: [] }
  }

  const planId = `${editPlanId}-stroke-plan`
  const start = options.issue === 'stroke_caption_overlap' ? 1.2 : 4.4
  const end = options.issue === 'stroke_late' ? 6.8 : 5.8

  return {
    strokeMotionPlans: [{
      ...baseRecord(planId),
      workspaceId: WORKSPACE_ID,
      projectId,
      editPlanId,
      editPlanSegmentId: `${editPlanId}-seg-main`,
      signatureRouteId: `${editPlanId}-route-stroke`,
      status: 'approved',
      understandingMode: options.tone === 'faith' ? 'source_reading_mode' : 'spoken_story_mode',
      sourceTextType: options.tone === 'faith' ? 'scripture' : 'spoken_story',
      spokenTranscriptExcerpt: transcriptForTone(options.tone ?? 'standard'),
      storySummary: 'A line completes on the key phrase meaning.',
      meaningExpansionSummary: 'Meaning is understood before animation timing.',
      animationGoal: 'Complete the line on phrase end.',
      styleLevel: options.tone === 'faith' ? 'faith_respectful' : 'premium_subtle',
      timingStrategy: options.tone === 'faith' ? 'emotion_locked phrase timing' : 'phrase_locked',
      continuousLineStrategy: true,
      transparentOverlayRequired: true,
      approvalRequired: true,
      generationStatus: 'planned',
      workerNotes: options.issue === 'stroke_late' ? 'force_stroke_motion_late' : 'Mock Stroke Motion timing.',
      mustFollowRules: ['Complete on phrase meaning.'],
      avoidRules: ['Do not cover captions or rush the story.'],
      planPayload: {},
    }],
    strokeMotionBeats: [{
      ...baseRecord(`${editPlanId}-stroke-beat`),
      strokeMotionPlanId: planId,
      workspaceId: WORKSPACE_ID,
      projectId,
      editPlanSegmentId: `${editPlanId}-seg-main`,
      storyBeatId: `${editPlanId}-beat-main`,
      beatOrder: 1,
      storyBeatLabel: 'key phrase line',
      meaning: 'The line completes when the spoken meaning resolves.',
      visualAction: 'Draw and complete a single connected line.',
      startTimeSeconds: start,
      endTimeSeconds: end,
      matchedWords: 'this changed everything',
      timingAnchorLabel: 'phrase end',
      sfxHint: options.includeSFX ? 'soft_draw' : 'none',
      creditImpact: 'medium',
      workerNotes: options.issue === 'stroke_late' ? 'force_stroke_motion_late' : 'Complete on phrase end.',
      mustFollowRules: ['Phrase locked.'],
      avoidRules: ['Do not continue into next idea.'],
      beatPayload: {},
      renderStatus: 'planned',
    }],
    strokeMotionTimingAnchors: [{
      ...baseRecord(`${editPlanId}-stroke-anchor`),
      strokeMotionPlanId: planId,
      strokeMotionBeatId: `${editPlanId}-stroke-beat`,
      workspaceId: WORKSPACE_ID,
      projectId,
      anchorType: options.tone === 'faith' ? 'emotional_shift' : 'phrase',
      anchorLabel: options.tone === 'faith' ? 'emotional phrase resolve' : 'phrase end',
      matchedText: 'this changed everything',
      startTimeSeconds: 5.2,
      endTimeSeconds: 5.8,
      confidence: 'high',
      anchorPayload: {},
    }],
  }
}

const createSFX = (projectId: string, editPlanId: string, options: ScenarioOptions): SFXEventPlanRecord[] => {
  if (!options.includeSFX) return []

  const anchorTimeSeconds = options.issue === 'real_sfx_late' ? 5.2 : options.system === 'graphic_design' ? 4.4 : 5.8
  const useCase = options.system === 'real_motion'
    ? 'real_motion_object_settle'
    : options.system === 'graphic_design'
      ? 'graphic_card_reveal'
      : 'stroke_circle_complete'

  return [{
    ...baseRecord(`${editPlanId}-sfx-signature-hit`),
    projectId,
    editPlanId,
    editPlanSegmentId: `${editPlanId}-seg-main`,
    targetLayer: options.system === 'real_motion' ? 'real_motion' : options.system === 'graphic_design' ? 'graphic_design' : 'stroke_motion',
    useCase,
    decisionState: options.tone === 'faith' ? 'optional' : 'needed',
    sourceFootagePolicy: 'edit_layer_only_default',
    reason: 'Subtle SFX supports the signature timing moment.',
    sceneContext: 'Signature animation timing scenario.',
    videoTone: options.tone ?? 'standard',
    editLevel: 'signature',
    signatureSystem: options.system === 'all' ? 'stroke_motion' : options.system,
    anchorType: options.system === 'real_motion' ? 'real_motion_object_settle' : options.system === 'graphic_design' ? 'graphic_reveal' : 'stroke_motion_completion',
    anchorTimeSeconds,
    startTimeSeconds: Math.max(0, anchorTimeSeconds - 0.2),
    hitTimeSeconds: options.issue === 'real_sfx_late' ? anchorTimeSeconds + 0.55 : anchorTimeSeconds,
    endTimeSeconds: anchorTimeSeconds + 0.55,
    timingPriority: 'frame_accurate',
    volumeProfile: options.tone === 'faith' ? 'whisper' : 'subtle_polish',
    mixPriority: 'voice_first',
    creditImpact: 'low',
    requiresApproval: true,
    userVisibleSummary: 'subtle signature timing hit',
    avoidRules: ['Do not cover voice.'],
    mustFollowRules: ['Land on the signature visual moment.'],
    status: 'approved',
    notes: options.issue === 'real_sfx_late' ? ['force_signature_sfx_late'] : ['Signature SFX is subtle and optional.'],
  }]
}

const createSources = (options: ScenarioOptions): StoryTimingPlanningSources => {
  const projectId = projectIdFor(options.id)
  const editPlanId = editPlanIdFor(options.id)
  const stroke = createStrokeMotion(projectId, editPlanId, options)

  return {
    editPlan: createEditPlan(projectId, editPlanId, options),
    editPlanSegments: createSegments(projectId, editPlanId, options),
    storyBeats: createStoryBeats(projectId, editPlanId, options),
    pacingAnalysis: [],
    cutDecisions: [],
    transitionPlans: [],
    captionPlans: [createCaptionPlan(projectId, editPlanId)],
    musicCues: [],
    musicMixPlans: [],
    sfxEventPlans: createSFX(projectId, editPlanId, options),
    sfxTrimPlans: [],
    sfxTimingAlignments: [],
    sfxMixPlans: [],
    strokeMotionPlans: stroke.strokeMotionPlans,
    strokeMotionBeats: stroke.strokeMotionBeats,
    strokeMotionTimingAnchors: stroke.strokeMotionTimingAnchors,
    signatureRoutes: createSignatureRoutes(projectId, editPlanId, options),
    renderJobInputs: [],
    qaReports: [],
  }
}

const expectedConflictsFor = (issue: ScenarioIssue = 'none'): string[] => {
  if (issue === 'stroke_late') return ['stroke_motion_late']
  if (issue === 'stroke_caption_overlap') return ['stroke_motion_caption_overlap']
  if (issue === 'graphic_short_read') return ['graphic_not_readable_long_enough']
  if (issue === 'graphic_caption_overlap') return ['caption_overlay_collision']
  if (issue === 'real_face_block') return ['real_motion_blocks_face']
  if (issue === 'real_sfx_late') return ['sfx_hit_late']
  if (issue === 'too_many_overlays') return ['too_many_events_same_moment']
  return []
}

const makeScenario = (options: ScenarioOptions): MockSignatureTimingScenario => {
  const projectId = projectIdFor(options.id)
  const editPlanId = editPlanIdFor(options.id)

  return {
    id: options.id,
    label: options.label,
    description: options.description,
    projectId,
    editPlanId,
    chatSessionId: CHAT_SESSION_ID,
    targetPlatform: 'instagram',
    editComplexity: options.editComplexity ?? (options.system === 'real_motion' ? 'premium_signature_edit' : 'signature_edit'),
    userTimingInstructions: [
      'Signature animations must land on meaning.',
      options.tone === 'faith'
        ? 'Respect emotional pauses and keep SFX minimal.'
        : options.tone === 'education'
          ? 'Prioritize readability and step-by-step comprehension.'
          : 'Keep signature timing polished and speech-safe.',
    ],
    avoidTimingInstructions: [
      'Do not create random animation timing.',
      'Do not let overlays cover captions, faces, or important source objects.',
    ],
    signatureRouteContext: `${options.system} route context for ${options.label}.`,
    segmentTiming: 'Main signature segment runs 0.000s-8.000s; next idea starts at 8.000s.',
    transcriptStoryContext: transcriptForTone(options.tone ?? 'standard'),
    inputTimingSources: createSources(options),
    expectedAnchors: ['signature reveal/start anchor', 'phrase or story beat anchor', 'completion/settle/hide anchor'],
    expectedEvents: ['signature start/reveal/enter event', 'signature beat/settle event', 'signature complete/hide/exit event'],
    expectedDependencies: ['phrase sync dependency', 'readability or face safety dependency', 'optional SFX sync dependency'],
    expectedConflicts: expectedConflictsFor(options.issue),
    expectedQAChecks: [
      'stroke_motion_word_sync',
      'stroke_motion_completion_timing',
      'graphic_readability_time',
      'graphic_reveal_timing',
      'real_motion_entry_exit_timing',
      'real_motion_face_safety',
      'signature_overlay_collisions',
      'signature_sfx_sync',
      'signature_timing_story_meaning',
    ],
  }
}

export const mockSignatureTimingScenarios: MockSignatureTimingScenario[] = [
  makeScenario({ id: 'stroke_motion_story_beat_sync', label: 'Stroke Motion story beat sync', description: 'Stroke Motion starts on story beat and completes on phrase meaning.', system: 'stroke_motion' }),
  makeScenario({ id: 'stroke_motion_line_draw_sfx_sync', label: 'Stroke Motion line draw with SFX sync', description: 'Stroke Motion completion has a subtle draw/completion SFX dependency.', system: 'stroke_motion', includeSFX: true }),
  makeScenario({ id: 'stroke_motion_completion_late_conflict', label: 'Stroke Motion completion late conflict', description: 'Stroke Motion completes after phrase meaning and should shift earlier.', system: 'stroke_motion', issue: 'stroke_late' }),
  makeScenario({ id: 'stroke_motion_overlaps_caption_conflict', label: 'Stroke Motion overlaps caption conflict', description: 'Stroke Motion overlaps the caption lane and creates a readability conflict.', system: 'stroke_motion', issue: 'stroke_caption_overlap' }),
  makeScenario({ id: 'graphic_card_reveal_after_concept', label: 'Graphic Design card reveal after concept', description: 'Graphic card reveals after the idea is introduced and holds long enough to read.', system: 'graphic_design' }),
  makeScenario({ id: 'graphic_list_item_reveal_with_speech', label: 'Graphic Design list item reveal with speech', description: 'Educational list items reveal with spoken steps.', system: 'graphic_design', tone: 'education' }),
  makeScenario({ id: 'graphic_not_readable_long_enough_conflict', label: 'Graphic not readable long enough conflict', description: 'Graphic reveal is deliberately too short for readability.', system: 'graphic_design', issue: 'graphic_short_read' }),
  makeScenario({ id: 'graphic_overlaps_caption_conflict', label: 'Graphic overlaps caption conflict', description: 'Graphic reveal overlaps caption timing and should move or resize.', system: 'graphic_design', issue: 'graphic_caption_overlap' }),
  makeScenario({ id: 'real_motion_object_enters_on_mention', label: 'Real Motion object enters on mention', description: 'Real Motion object enters when the concept is introduced.', system: 'real_motion' }),
  makeScenario({ id: 'real_motion_object_settles_key_phrase', label: 'Real Motion object settles on key phrase', description: 'Real Motion object settles on the visual focus phrase.', system: 'real_motion', includeSFX: true }),
  makeScenario({ id: 'real_motion_blocks_face_conflict', label: 'Real Motion blocks face conflict', description: 'Real Motion route metadata deliberately marks face blocking risk.', system: 'real_motion', issue: 'real_face_block' }),
  makeScenario({ id: 'real_motion_sfx_hit_late_conflict', label: 'Real Motion SFX hit late conflict', description: 'Real Motion settle SFX lands late and should shift earlier.', system: 'real_motion', includeSFX: true, issue: 'real_sfx_late' }),
  makeScenario({ id: 'faith_restrained_stroke_motion_timing', label: 'Faith/serious restrained Stroke Motion timing', description: 'Faith timing keeps Stroke Motion restrained and emotional timing ahead of SFX.', system: 'stroke_motion', tone: 'faith', includeSFX: true }),
  makeScenario({ id: 'educational_visualexplain_timing', label: 'Educational VisualExplain timing', description: 'Education timing prioritizes readable step reveals and comprehension.', system: 'graphic_design', tone: 'education' }),
  makeScenario({ id: 'lifestyle_vacation_title_graphic_timing', label: 'Lifestyle/vacation title/graphic timing', description: 'Lifestyle title graphic lands after spoken setup and holds for polish.', system: 'graphic_design', tone: 'lifestyle' }),
  makeScenario({ id: 'too_many_overlays_same_moment_conflict', label: 'Too many overlays at same moment conflict', description: 'Stroke Motion, Graphic Design, and Real Motion compete at the same moment.', system: 'all', includeSFX: true, issue: 'too_many_overlays', routeStart: 4.4, routeEnd: 6.2 }),
]

export function getMockSignatureTimingScenarioById(id: string): MockSignatureTimingScenario | undefined {
  return mockSignatureTimingScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSignatureTimingScenario(): MockSignatureTimingScenario {
  return mockSignatureTimingScenarios[0]
}
