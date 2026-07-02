import type {
  CreateStoryTimingPlanRequest,
  CreateStoryTimingPlanResponse,
  StoryTimingPlannerNextStep,
  StoryTimingPlanningSources,
} from '../contracts/storytiming-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import type {
  MasterTimingMapRecord,
  SoundSyncTimingIntegrationRecord,
  StoryTimingAuthority,
  StoryTimingSourceSystem,
  SoundSyncTimingRisk,
} from '../../types/storytiming'
import {
  STORYTIMING_DEFAULT_AUTHORITY_HIERARCHY,
} from '../../types/storytiming'
import { createStoryTimingSegments } from './storytiming-segment-service'
import { createTimingAnchors } from './storytiming-anchor-service'
import { createTimingEvents } from './storytiming-event-service'
import { createTimingDependencies } from './storytiming-dependency-service'
import { createTranscriptTimingAnchors } from './storytiming-transcript-anchor-service'
import {
  createCaptionTimingEvents,
  createCaptionTimingPlans,
} from './storytiming-caption-service'
import {
  createCutAnchors,
  createCutMeaningConflicts,
  createCutTimingEvents,
  createCutTimingPlans,
} from './storytiming-cut-service'
import { detectCaptionOverlayConflicts } from './storytiming-caption-conflict-service'
import { runCaptionCutTimingQA } from './storytiming-caption-cut-qa-service'
import {
  createMusicTimingAnchors,
  createMusicTimingEvents,
} from './storytiming-music-service'
import {
  createBeatAnchorsFromMusicCue,
  createDownbeatAnchorsFromMusicCue,
  createMockMusicBeatGrid,
  createMusicDropAnchors,
  createMusicResolveAnchors,
} from './storytiming-music-beat-grid-service'
import {
  createMusicDuckingEvents,
  createMusicDuckingTimingPlans,
} from './storytiming-music-ducking-service'
import {
  createSFXTimingAnchors,
  createSFXTimingEvents,
} from './storytiming-sfx-integration-service'
import { createMusicSFXDependencies } from './storytiming-music-sfx-sync-service'
import { detectSoundSyncTimingConflicts } from './storytiming-soundsync-conflict-service'
import { runSoundSyncTimingQA } from './storytiming-soundsync-qa-service'
import {
  createTimingConflictResolution,
  detectTimingConflicts,
} from './storytiming-conflict-service'
import { runStoryTimingQA } from './storytiming-qa-service'
import { createRenderTimingManifest } from './storytiming-render-manifest-service'
import { createStoryTimingChatSummary } from './storytiming-chat-summary-service'
import { choosePrimaryTimingAuthority } from './storytiming-authority-service'
import { extractTimingSourcesFromMockDatabase } from './storytiming-source-extraction-service'

const DEFAULT_FRAME_RATE = 30

const sourceSystemsFromSources = (sources: StoryTimingPlanningSources): StoryTimingSourceSystem[] => {
  const systems: StoryTimingSourceSystem[] = []
  if (sources.editPlanSegments.length > 0) systems.push('edit_plan')
  if ((sources.storyBeats?.length ?? 0) > 0) systems.push('story_beat')
  if ((sources.pacingAnalysis?.length ?? 0) > 0) systems.push('pacing_analysis')
  if ((sources.cutDecisions?.length ?? 0) > 0) systems.push('cut_decision')
  if ((sources.transitionPlans?.length ?? 0) > 0) systems.push('transition_plan')
  if ((sources.captionPlans?.length ?? 0) > 0) systems.push('caption_plan')
  if ((sources.signatureRoutes?.length ?? 0) > 0) systems.push('signature_route')
  if ((sources.strokeMotionPlans?.length ?? 0) > 0) systems.push('stroke_motion')
  if ((sources.musicCues?.length ?? 0) > 0) systems.push('music_cue')
  if ((sources.musicMixPlans?.length ?? 0) > 0) systems.push('music_mix')
  if ((sources.sfxEventPlans?.length ?? 0) > 0) systems.push('sfx_event')
  if ((sources.sfxTrimPlans?.length ?? 0) > 0) systems.push('sfx_trim')
  if ((sources.sfxTimingAlignments?.length ?? 0) > 0) systems.push('sfx_alignment')
  if ((sources.sfxMixPlans?.length ?? 0) > 0) systems.push('sfx_mix')
  if ((sources.renderJobInputs?.length ?? 0) > 0) systems.push('render_job')
  if ((sources.qaReports?.length ?? 0) > 0) systems.push('qa_report')
  return systems
}

const inferDuration = (sources: StoryTimingPlanningSources): number => {
  const segmentEnds = sources.editPlanSegments.map((segment) => segment.outputEndSeconds)
  const storyBeatEnds = (sources.storyBeats ?? []).map((beat) => beat.timeRange?.endSeconds ?? 0)
  const musicEnds = (sources.musicCues ?? []).map((cue) => cue.timeRange?.endSeconds ?? 0)
  const sfxEnds = [
    ...(sources.sfxEventPlans ?? []).map((eventPlan) => eventPlan.endTimeSeconds ?? eventPlan.anchorTimeSeconds),
    ...(sources.sfxTimingAlignments ?? []).map((alignment) => alignment.endTimeSeconds),
  ]
  const renderEnds = (sources.renderJobInputs ?? []).map((input) => input.timelineEndSeconds ?? 0)
  return Math.max(1, ...segmentEnds, ...storyBeatEnds, ...musicEnds, ...sfxEnds, ...renderEnds)
}

const chooseMapAuthority = (request: CreateStoryTimingPlanRequest): StoryTimingAuthority =>
  choosePrimaryTimingAuthority({
    label: request.sources.editPlan?.goalSummary,
    purpose: [
      request.sources.editPlan?.strategySummary,
      ...(request.userTimingInstructions ?? []),
      ...(request.avoidTimingInstructions ?? []),
    ].join(' '),
    hasSpeech: request.sources.editPlanSegments.some((segment) => Boolean(segment.transcriptText)),
    hasMusic: (request.sources.musicCues?.length ?? 0) > 0 || (request.sources.musicMixPlans?.length ?? 0) > 0,
    preserveEmotionalPause: (request.sources.pacingAnalysis ?? []).some((analysis) => analysis.preserveEmotionalPauses),
    signatureFocused: (request.sources.signatureRoutes?.length ?? 0) > 0,
    targetPlatform: request.targetPlatform,
  })

export function createMasterTimingMap(
  request: CreateStoryTimingPlanRequest,
): ServiceResult<{ masterTimingMap: MasterTimingMapRecord; warnings: string[] }> {
  const durationSeconds = inferDuration(request.sources)
  const primaryTimingAuthority = chooseMapAuthority(request)
  const warnings = request.sources.editPlanSegments.length === 0
    ? ['Master timing map was created without edit plan segments; downstream timing will be sparse.']
    : []

  const masterTimingMap: MasterTimingMapRecord = {
    id: createMockId('master-timing-map'),
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editPlanId: request.editPlanId,
    chatSessionId: request.chatSessionId ?? request.sources.editPlan?.chatSessionId,
    version: 1,
    status: 'planning',
    durationSeconds,
    frameRate: DEFAULT_FRAME_RATE,
    timebase: {
      frameRate: DEFAULT_FRAME_RATE,
      durationSeconds,
      totalFrames: Math.ceil(durationSeconds * DEFAULT_FRAME_RATE),
      frameRoundingMode: 'round',
      startTimecode: '00:00:00:00',
    },
    editComplexity: request.editComplexity ?? request.sources.editPlan?.complexity,
    primaryTimingAuthority,
    timingHierarchy: STORYTIMING_DEFAULT_AUTHORITY_HIERARCHY,
    sourceSystemsIncluded: sourceSystemsFromSources(request.sources),
    lockedForGeneration: false,
    summary: request.sources.editPlan?.goalSummary ?? 'Mock StoryTiming map',
    notes: [
      'Mock StoryTiming planner consolidated existing distributed timing records.',
      'No source timing records were deleted, replaced, rendered, or sent to providers.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      targetPlatform: request.targetPlatform ?? 'custom',
      userTimingInstructions: request.userTimingInstructions ?? [],
      avoidTimingInstructions: request.avoidTimingInstructions ?? [],
    },
  }

  return ok({ masterTimingMap, warnings }, warnings)
}

const mergeWarnings = (...warnings: string[][]): string[] => warnings.flat().filter(Boolean)

const sortEvents = <T extends { startTimeSeconds: number; label: string }>(events: T[]): T[] =>
  [...events].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.label.localeCompare(b.label))

const dedupeConflicts = <T extends { description: string; timeRange: { startSeconds: number; endSeconds: number } }>(conflicts: T[]): T[] => {
  const byKey = new Map<string, T>()
  conflicts.forEach((conflict) => {
    byKey.set(`${conflict.description}:${conflict.timeRange.startSeconds}:${conflict.timeRange.endSeconds}`, conflict)
  })
  return [...byKey.values()]
}

const chooseNextStep = (input: {
  hasBlockingConflicts: boolean
  hasManualReview: boolean
  readyForRender: boolean
}): StoryTimingPlannerNextStep => {
  if (input.hasBlockingConflicts) {
    return 'resolve_timing_conflicts'
  }

  if (input.hasManualReview) {
    return 'await_user_review'
  }

  return input.readyForRender ? 'review_timing_map' : 'create_render_manifest'
}

const createSoundSyncTimingIntegration = (
  masterTimingMap: MasterTimingMapRecord,
  sources: StoryTimingPlanningSources,
  risks: SoundSyncTimingRisk[],
): SoundSyncTimingIntegrationRecord => {
  const hasSpeech = sources.editPlanSegments.some((segment) => Boolean(segment.transcriptText))
  const hasMontageCue = (sources.musicCues ?? []).some((cue) => cue.cueRole === 'montage_drive')
  const ambienceImportant = [
    ...(sources.musicCues ?? []).flatMap((cue) => cue.ambienceNotes),
    ...(sources.sfxMixPlans ?? []).flatMap((mixPlan) => mixPlan.ambienceImportant ? ['ambience important'] : []),
  ].length > 0

  return {
    id: createMockId('soundsync-integration'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    musicCueIds: (sources.musicCues ?? []).map((cue) => cue.id),
    sfxEventPlanIds: (sources.sfxEventPlans ?? []).map((eventPlan) => eventPlan.id),
    timingMode: hasSpeech
      ? 'voice_first'
      : hasMontageCue
        ? 'beat_driven'
        : ambienceImportant
          ? 'ambience_preserving'
          : 'subtle_support',
    risks: risks.length > 0 ? risks : ['none'],
    summary: 'Mock SoundSync timing integration connected music cues, beat grids, ducking, SFX hits, and ambience timing to StoryTiming.',
    createdAt: nowIso(),
  }
}

const soundSyncRisksFromConflicts = (conflicts: { conflictType: string; description: string }[]): SoundSyncTimingRisk[] => {
  const risks = new Set<SoundSyncTimingRisk>()
  conflicts.forEach((conflict) => {
    if (conflict.conflictType === 'music_ducking_misses_speech') risks.add('music_duck_late')
    if (conflict.conflictType === 'sfx_hit_late') risks.add('sfx_hit_late')
    if (conflict.conflictType === 'sfx_hit_early') risks.add('sfx_hit_early')
    if (conflict.conflictType === 'sfx_tail_over_speech') risks.add('sfx_tail_over_speech')
    if (conflict.conflictType === 'too_many_events_same_moment') risks.add('too_many_hits')
    if (conflict.description.toLowerCase().includes('ambience')) risks.add('ambience_masked')
  })

  return [...risks]
}

export function createStoryTimingPlan(
  request: CreateStoryTimingPlanRequest,
): ServiceResult<CreateStoryTimingPlanResponse> {
  const mapResult = createMasterTimingMap(request)
  if (!mapResult.ok) return mapResult
  const { masterTimingMap } = mapResult.data

  const segmentResult = createStoryTimingSegments(masterTimingMap, request.sources.editPlanSegments, {
    storyBeats: request.sources.storyBeats,
    pacingAnalysis: request.sources.pacingAnalysis,
    captionPlans: request.sources.captionPlans,
    musicCues: request.sources.musicCues,
    sfxEventPlans: request.sources.sfxEventPlans,
    signatureRoutes: request.sources.signatureRoutes,
  })
  if (!segmentResult.ok) return segmentResult

  const transcriptAnchorResult = createTranscriptTimingAnchors(
    masterTimingMap,
    segmentResult.data.segments,
    request.sources.editPlanSegments,
    request.sources.pacingAnalysis,
  )
  if (!transcriptAnchorResult.ok) return transcriptAnchorResult

  const cutPlanResult = createCutTimingPlans(
    masterTimingMap,
    segmentResult.data.segments,
    transcriptAnchorResult.data.transcriptAnchors,
    request.sources.cutDecisions,
    request.sources.pacingAnalysis,
    request.sources.storyBeats,
  )
  if (!cutPlanResult.ok) return cutPlanResult

  const cutAnchors = createCutAnchors(masterTimingMap, cutPlanResult.data.cutTimingPlans)
  const cutEvents = createCutTimingEvents(masterTimingMap, cutPlanResult.data.cutTimingPlans)

  const anchorResult = createTimingAnchors(masterTimingMap, segmentResult.data.segments, {
    editPlanSegments: request.sources.editPlanSegments,
    storyBeats: request.sources.storyBeats,
    pacingAnalysis: request.sources.pacingAnalysis,
    transitionPlans: request.sources.transitionPlans,
    strokeMotionBeats: request.sources.strokeMotionBeats,
    strokeMotionTimingAnchors: request.sources.strokeMotionTimingAnchors,
  })
  if (!anchorResult.ok) return anchorResult

  const beatGrids = (request.sources.musicCues ?? [])
    .filter((cue) => cue.timeRange)
    .map((cue) => createMockMusicBeatGrid(masterTimingMap, cue))
  const beatAnchors = beatGrids.flatMap((beatGrid) => {
    const cue = request.sources.musicCues?.find((candidate) => candidate.id === beatGrid.musicCueId)
    return cue
      ? [
          ...createBeatAnchorsFromMusicCue(masterTimingMap, cue, beatGrid),
          ...createDownbeatAnchorsFromMusicCue(masterTimingMap, cue, beatGrid),
          ...createMusicDropAnchors(masterTimingMap, cue, beatGrid),
          ...createMusicResolveAnchors(masterTimingMap, cue, beatGrid),
        ]
      : []
  })
  const musicAnchors = [
    ...createMusicTimingAnchors(masterTimingMap, request.sources.musicCues, segmentResult.data.segments),
    ...beatAnchors,
  ]
  const sfxAnchors = createSFXTimingAnchors(
    masterTimingMap,
    segmentResult.data.segments,
    request.sources.sfxEventPlans,
    request.sources.sfxTimingAlignments,
    request.sources.sfxTrimPlans,
  )

  const preCaptionAnchors = [
    ...anchorResult.data.anchors,
    ...transcriptAnchorResult.data.transcriptAnchors,
    ...cutAnchors,
    ...musicAnchors,
    ...sfxAnchors,
  ]

  const eventResult = createTimingEvents(masterTimingMap, segmentResult.data.segments, preCaptionAnchors, {
    transitionPlans: request.sources.transitionPlans,
    strokeMotionBeats: request.sources.strokeMotionBeats,
    signatureRoutes: request.sources.signatureRoutes,
    renderJobInputs: request.sources.renderJobInputs,
    qaReports: request.sources.qaReports,
  })
  if (!eventResult.ok) return eventResult

  const musicEvents = createMusicTimingEvents(
    masterTimingMap,
    request.sources.musicCues,
    segmentResult.data.segments,
  )
  const duckingPlans = createMusicDuckingTimingPlans(
    masterTimingMap,
    segmentResult.data.segments,
    request.sources.musicCues,
    request.sources.musicMixPlans,
  )
  const duckingEvents = createMusicDuckingEvents(masterTimingMap, duckingPlans)
  const sfxEvents = createSFXTimingEvents(
    masterTimingMap,
    segmentResult.data.segments,
    request.sources.sfxEventPlans,
    request.sources.sfxTimingAlignments,
  )

  const captionPlanResult = createCaptionTimingPlans(
    masterTimingMap,
    segmentResult.data.segments,
    transcriptAnchorResult.data.transcriptAnchors,
    {
      captionPlans: request.sources.captionPlans,
      targetPlatform: request.targetPlatform,
      userTimingInstructions: request.userTimingInstructions,
    },
    eventResult.data.events,
  )
  if (!captionPlanResult.ok) return captionPlanResult

  const captionEvents = createCaptionTimingEvents(
    masterTimingMap,
    captionPlanResult.data.captionTimingPlans,
    transcriptAnchorResult.data.transcriptAnchors,
  )
  const anchors = preCaptionAnchors
  const events = sortEvents([
    ...captionEvents,
    ...cutEvents,
    ...musicEvents,
    ...duckingEvents,
    ...sfxEvents,
    ...eventResult.data.events,
  ])

  const dependencyResult = createTimingDependencies(masterTimingMap, anchors, events)
  if (!dependencyResult.ok) return dependencyResult
  const soundSyncDependencies = createMusicSFXDependencies(masterTimingMap, anchors, events, beatGrids)
  const dependencies = [
    ...dependencyResult.data.dependencies,
    ...soundSyncDependencies,
  ]

  const conflictResult = detectTimingConflicts(masterTimingMap, anchors, events)
  if (!conflictResult.ok) return conflictResult

  const captionConflictResult = detectCaptionOverlayConflicts(
    masterTimingMap,
    captionPlanResult.data.captionTimingPlans,
    events,
  )
  const cutMeaningConflicts = createCutMeaningConflicts(
    masterTimingMap,
    cutPlanResult.data.cutTimingPlans,
    cutEvents,
    transcriptAnchorResult.data.transcriptAnchors,
  )
  const soundSyncConflictResult = detectSoundSyncTimingConflicts({
    masterTimingMap,
    anchors,
    events,
    duckingPlans,
    duckingEvents,
    sfxEvents,
  })
  const conflicts = dedupeConflicts([
    ...conflictResult.data.conflicts,
    ...captionConflictResult.conflicts,
    ...cutMeaningConflicts,
    ...soundSyncConflictResult.conflicts,
  ])
  const conflictResolutions = [
    ...conflictResult.data.conflictResolutions,
    ...captionConflictResult.conflictResolutions,
    ...cutMeaningConflicts.map((conflict) => createTimingConflictResolution(masterTimingMap, conflict)),
    ...soundSyncConflictResult.conflictResolutions,
  ]
  const soundSyncTimingIntegration = createSoundSyncTimingIntegration(
    masterTimingMap,
    request.sources,
    soundSyncRisksFromConflicts(conflicts),
  )

  const captionCutQAResult = runCaptionCutTimingQA({
    masterTimingMap,
    transcriptAnchors: transcriptAnchorResult.data.transcriptAnchors,
    captionTimingPlans: captionPlanResult.data.captionTimingPlans,
    captionEvents,
    cutTimingPlans: cutPlanResult.data.cutTimingPlans,
    cutEvents,
    conflicts,
  })
  if (!captionCutQAResult.ok) return captionCutQAResult

  const qaResult = runStoryTimingQA(
    masterTimingMap,
    anchors,
    events,
    conflicts,
  )
  if (!qaResult.ok) return qaResult
  const soundSyncQAResult = runSoundSyncTimingQA({
    masterTimingMap,
    beatGrids,
    duckingPlans,
    events,
    conflicts,
  })
  if (!soundSyncQAResult.ok) return soundSyncQAResult
  const qaChecks = [
    ...captionCutQAResult.data.qaChecks,
    ...soundSyncQAResult.data.qaChecks,
    ...qaResult.data.qaChecks,
  ]

  const manifestResult = createRenderTimingManifest(
    masterTimingMap,
    events,
    dependencies,
    conflicts,
    qaChecks,
  )
  if (!manifestResult.ok) return manifestResult

  const chatSummary = createStoryTimingChatSummary({
    masterTimingMap,
    events,
    conflicts,
    qaChecks,
    renderTimingManifest: manifestResult.data.renderTimingManifest,
  })
  const nextStep = chooseNextStep({
    hasBlockingConflicts: conflicts.some((conflict) => conflict.blocksRender),
    hasManualReview: conflicts.some((conflict) => conflict.requiresUserReview),
    readyForRender: manifestResult.data.renderTimingManifest.readyForRender,
  })
  const warnings = mergeWarnings(
    mapResult.data.warnings,
    segmentResult.data.warnings,
    transcriptAnchorResult.data.warnings,
    cutPlanResult.data.warnings,
    anchorResult.data.warnings,
    eventResult.data.warnings,
    captionPlanResult.data.warnings,
    dependencyResult.data.warnings,
    conflictResult.data.warnings,
    captionCutQAResult.data.warnings,
    soundSyncQAResult.data.warnings,
    qaResult.data.warnings,
    manifestResult.data.warnings,
  )

  return ok({
    masterTimingMap,
    segments: segmentResult.data.segments,
    transcriptAnchors: transcriptAnchorResult.data.transcriptAnchors,
    captionTimingPlans: captionPlanResult.data.captionTimingPlans,
    captionEvents,
    cutTimingPlans: cutPlanResult.data.cutTimingPlans,
    cutEvents,
    pauseAnchors: transcriptAnchorResult.data.transcriptAnchors.filter((anchor) => anchor.anchorType === 'pause' || anchor.anchorType === 'breath'),
    musicAnchors,
    musicEvents,
    beatGrids,
    duckingPlans,
    duckingEvents,
    sfxAnchors,
    sfxEvents,
    soundSyncTimingIntegration,
    anchors,
    events,
    dependencies,
    conflicts,
    conflictResolutions,
    qaChecks,
    renderTimingManifest: manifestResult.data.renderTimingManifest,
    chatSummary,
    nextStep,
    warnings,
  }, warnings)
}

export function createStoryTimingPlanFromEditPlan(
  db: MockDatabase,
  input: Omit<CreateStoryTimingPlanRequest, 'sources'>,
): ServiceResult<CreateStoryTimingPlanResponse> {
  const sources = extractTimingSourcesFromMockDatabase(db, input.projectId, input.editPlanId)

  return createStoryTimingPlan({
    ...input,
    sources,
  })
}

export function createStoryTimingPlanningSummary(output: CreateStoryTimingPlanResponse): string {
  return [
    `${output.segments.length} segments`,
    `${output.anchors.length} anchors`,
    `${output.events.length} events`,
    `${output.dependencies.length} dependencies`,
    `${output.conflicts.length} conflicts`,
    `${output.qaChecks.length} QA checks`,
  ].join(', ')
}

export function createStoryTimingUserVisibleSummary(output: CreateStoryTimingPlanResponse): string {
  const conflictText = output.conflicts.length === 0
    ? 'No timing conflicts need user review.'
    : `${output.conflicts.length} timing issue(s) need review.`

  return `${output.masterTimingMap.summary}: ${createStoryTimingPlanningSummary(output)}. ${conflictText}`
}
