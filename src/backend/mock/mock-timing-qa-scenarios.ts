import type { FullStoryTimingQANextStep } from '../contracts/storytiming-contracts'
import type {
  MasterTimingMapRecord,
  RenderTimingManifestRecord,
  StoryTimingQACheckRecord,
  StoryTimingQARecommendedAction,
  StoryTimingReadinessDecision,
  StoryTimingSourceSystem,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'

const NOW = '2026-05-19T12:00:00.000Z'

export interface MockTimingQAScenario {
  id: string
  label: string
  timingMapSummary: string
  masterTimingMap: MasterTimingMapRecord
  segments: StoryTimingSegmentRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  renderTimingManifest?: RenderTimingManifestRecord
  expectedScores: {
    minOverallScore: number
    maxOverallScore: number
  }
  expectedReadinessDecision: StoryTimingReadinessDecision
  expectedRecommendedActions: StoryTimingQARecommendedAction[]
  expectedNextStep: FullStoryTimingQANextStep
  expectedChatSummary: string
}

type ScenarioIssue =
  | 'none'
  | 'minor_caption_warning'
  | 'caption_too_fast'
  | 'caption_graphic_overlap'
  | 'cut_before_phrase'
  | 'emotional_pause_removed'
  | 'music_ducking_late'
  | 'sfx_hit_late'
  | 'sfx_tail_speech'
  | 'stroke_late'
  | 'graphic_short_read'
  | 'real_face_block'
  | 'too_many_overlays'
  | 'too_many_sfx'
  | 'ambience_masked'
  | 'pacing_rushed'
  | 'pacing_slow'
  | 'manifest_missing_track'
  | 'faith_user_review'
  | 'lake_como_ambience_warning'
  | 'signature_overlay_blocked'

interface ScenarioConfig {
  id: string
  label: string
  issue: ScenarioIssue
  expectedReadinessDecision: StoryTimingReadinessDecision
  expectedRecommendedActions: StoryTimingQARecommendedAction[]
  expectedNextStep: FullStoryTimingQANextStep
  expectedScores: {
    minOverallScore: number
    maxOverallScore: number
  }
  tone?: string
  manifestMissingTrack?: boolean
}

const baseRecord = (id: string) => ({
  id,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {},
})

const mapFor = (config: ScenarioConfig): MasterTimingMapRecord => ({
  ...baseRecord(`timing-qa-map-${config.id}`),
  workspaceId: 'mock-workspace-timing-qa',
  projectId: `mock-project-timing-qa-${config.id}`,
  editPlanId: `mock-edit-plan-timing-qa-${config.id}`,
  version: 1,
  status: config.expectedReadinessDecision === 'ready_for_preview' ? 'approved' : 'planning',
  durationSeconds: 24,
  frameRate: 30,
  timebase: {
    frameRate: 30,
    durationSeconds: 24,
    totalFrames: 720,
    frameRoundingMode: 'round',
    startTimecode: '00:00:00:00',
  },
  editComplexity: config.issue === 'real_face_block' || config.issue === 'signature_overlay_blocked'
    ? 'premium_signature_edit'
    : 'signature_edit',
  primaryTimingAuthority: config.tone === 'faith' ? 'emotional_timing' : 'speech_meaning',
  timingHierarchy: [
    'user_instruction',
    'speech_meaning',
    'story_beat',
    'emotional_timing',
    'caption_readability',
    'visual_comprehension',
    'music_rhythm',
    'sfx_hit',
    'signature_animation',
    'platform_pacing',
  ],
  sourceSystemsIncluded: ['edit_plan', 'caption_plan', 'music_cue', 'sfx_event', 'signature_route', 'render_job', 'qa_report'],
  lockedForGeneration: false,
  summary: config.label,
  notes: ['Mock Timing QA scenario; no media processing, rendering, or provider calls.'],
})

const segmentFor = (map: MasterTimingMapRecord, config: ScenarioConfig): StoryTimingSegmentRecord => ({
  ...baseRecord(`timing-qa-segment-${config.id}`),
  masterTimingMapId: map.id,
  projectId: map.projectId,
  editPlanId: map.editPlanId,
  editPlanSegmentId: `edit-segment-${config.id}`,
  segmentOrder: 1,
  outputTimeRange: { startSeconds: 0, endSeconds: 24 },
  purpose: config.tone === 'faith' ? 'serious emotional timing review' : 'full timing QA scenario',
  primaryAuthority: config.tone === 'faith' ? 'emotional_timing' : 'speech_meaning',
  hasSpeech: true,
  hasMusic: true,
  hasSFX: true,
  hasCaptions: true,
  hasSignatureOverlay: true,
  preserveEmotionalPause: config.tone === 'faith' || config.issue === 'emotional_pause_removed',
  notes: ['Segment provides enough timing surface for full QA.'],
})

const eventFor = (
  map: MasterTimingMapRecord,
  id: string,
  eventType: TimingEventRecord['eventType'],
  trackType: TimingEventRecord['trackType'],
  start: number,
  end = start,
): TimingEventRecord => ({
  ...baseRecord(`timing-qa-event-${map.id}-${id}`),
  masterTimingMapId: map.id,
  projectId: map.projectId,
  editPlanId: map.editPlanId,
  sourceSystem: trackType === 'captions'
    ? 'caption_plan'
    : trackType === 'sfx'
      ? 'sfx_event'
      : trackType === 'music'
        ? 'music_cue'
        : trackType === 'graphic_design'
          ? 'graphic_design'
          : trackType === 'real_motion'
            ? 'real_motion'
            : trackType === 'stroke_motion'
              ? 'stroke_motion'
              : 'edit_plan',
  sourceRecordId: `source-${id}`,
  eventType,
  trackType,
  label: id.replaceAll('-', ' '),
  startTimeSeconds: start,
  hitTimeSeconds: eventType === 'sfx_hit' || eventType === 'stroke_motion_complete' || eventType === 'real_motion_settle'
    ? start
    : undefined,
  endTimeSeconds: end,
  durationSeconds: Math.max(0, end - start),
  frameStart: Math.round(start * 30),
  frameHit: Math.round(start * 30),
  frameEnd: Math.round(end * 30),
  priority: 'high',
  syncMode: 'phrase_locked',
  canShift: true,
  locked: false,
  visibilityLayer: trackType === 'captions' || trackType === 'graphic_design' || trackType === 'real_motion' || trackType === 'stroke_motion'
    ? trackType
    : undefined,
  audioLayer: trackType === 'music' || trackType === 'sfx' ? trackType : undefined,
  notes: ['Mock Timing QA event.'],
})

const eventsFor = (map: MasterTimingMapRecord, config: ScenarioConfig): TimingEventRecord[] => {
  const baseEvents = [
    eventFor(map, 'caption-on', 'caption_on', 'captions', 4, config.issue === 'caption_too_fast' ? 4.6 : 7),
    eventFor(map, 'cut-after-phrase', 'cut', 'cuts', 8),
    eventFor(map, 'music-duck-start', 'music_duck_start', 'music', config.issue === 'music_ducking_late' ? 4.35 : 3.7),
    eventFor(map, 'sfx-hit', 'sfx_hit', 'sfx', config.issue === 'sfx_hit_late' ? 10.4 : 10),
    eventFor(map, 'stroke-complete', 'stroke_motion_complete', 'stroke_motion', config.issue === 'stroke_late' ? 13.2 : 12.7),
    eventFor(map, 'graphic-reveal', 'graphic_reveal', 'graphic_design', 14, config.issue === 'graphic_short_read' ? 14.55 : 17),
    eventFor(map, 'real-motion-settle', 'real_motion_settle', 'real_motion', 18, config.issue === 'real_face_block' ? 22 : 19.2),
  ]

  if (config.issue === 'caption_graphic_overlap' || config.issue === 'signature_overlay_blocked') {
    baseEvents.push(eventFor(map, 'graphic-overlap', 'graphic_reveal', 'graphic_design', 4.2, 6.2))
  }

  if (config.issue === 'too_many_overlays') {
    baseEvents.push(
      eventFor(map, 'extra-graphic', 'graphic_reveal', 'graphic_design', 9, 11),
      eventFor(map, 'extra-real-motion', 'real_motion_settle', 'real_motion', 9, 11),
      eventFor(map, 'extra-stroke', 'stroke_motion_complete', 'stroke_motion', 9, 10),
    )
  }

  if (config.issue === 'too_many_sfx') {
    baseEvents.push(
      eventFor(map, 'sfx-hit-2', 'sfx_hit', 'sfx', 10),
      eventFor(map, 'sfx-hit-3', 'sfx_hit', 'sfx', 10),
      eventFor(map, 'sfx-hit-4', 'sfx_hit', 'sfx', 10),
      eventFor(map, 'sfx-hit-5', 'sfx_hit', 'sfx', 10),
    )
  }

  return baseEvents
}

const conflictFor = (
  map: MasterTimingMapRecord,
  config: ScenarioConfig,
  conflictType: TimingConflictRecord['conflictType'],
  severity: TimingConflictRecord['severity'],
  description: string,
  recommendedAdjustment: TimingConflictRecord['recommendedAdjustment'],
  blocksRender = severity === 'critical',
  requiresUserReview = false,
): TimingConflictRecord => ({
  ...baseRecord(`timing-qa-conflict-${config.id}-${conflictType}`),
  masterTimingMapId: map.id,
  projectId: map.projectId,
  editPlanId: map.editPlanId,
  conflictType,
  severity,
  relatedEventIds: [`timing-qa-event-${map.id}-caption-on`],
  relatedAnchorIds: [],
  sourceSystems: ['qa_report'],
  timeRange: { startSeconds: 4, endSeconds: 7 },
  description,
  whyItMatters: 'Timing QA checks whether the edit remains professional, understandable, emotional, and render-safe.',
  recommendedAdjustment,
  blocksRender,
  requiresUserReview,
  status: requiresUserReview ? 'needs_user_review' : 'open',
})

const conflictsFor = (map: MasterTimingMapRecord, config: ScenarioConfig): TimingConflictRecord[] => {
  switch (config.issue) {
    case 'minor_caption_warning':
      return [conflictFor(map, config, 'caption_too_fast', 'low', 'One caption is slightly tight but preview can continue.', 'extend_duration', false)]
    case 'caption_too_fast':
      return [conflictFor(map, config, 'caption_too_fast', 'high', 'Caption read time is too short.', 'extend_duration', false)]
    case 'caption_graphic_overlap':
      return [conflictFor(map, config, 'caption_overlay_collision', 'high', 'Caption overlaps Graphic Design card.', 'reduce_overlap', false)]
    case 'cut_before_phrase':
      return [conflictFor(map, config, 'cut_before_meaning_complete', 'high', 'Cut happens before phrase meaning completes.', 'shift_later', false)]
    case 'emotional_pause_removed':
      return [conflictFor(map, config, 'emotional_pause_removed', 'critical', 'A protected emotional pause is removed.', 'preserve_pause', true, true)]
    case 'music_ducking_late':
      return [conflictFor(map, config, 'music_ducking_misses_speech', 'high', 'Music ducking starts after speech.', 'shift_earlier', false)]
    case 'sfx_hit_late':
      return [conflictFor(map, config, 'sfx_hit_late', 'high', 'SFX hit lands late.', 'shift_earlier', false)]
    case 'sfx_tail_speech':
      return [conflictFor(map, config, 'sfx_tail_over_speech', 'high', 'SFX tail overlaps important speech.', 'shorten_duration', false)]
    case 'stroke_late':
      return [conflictFor(map, config, 'stroke_motion_late', 'high', 'Stroke Motion completes after phrase meaning.', 'shift_earlier', false)]
    case 'graphic_short_read':
      return [conflictFor(map, config, 'graphic_not_readable_long_enough', 'high', 'Graphic is not readable long enough.', 'extend_duration', false)]
    case 'real_face_block':
      return [conflictFor(map, config, 'real_motion_blocks_face', 'critical', 'Real Motion blocks the speaker face.', 'reduce_overlap', true)]
    case 'too_many_overlays':
      return [conflictFor(map, config, 'too_many_events_same_moment', 'medium', 'Too many overlays compete at the same moment.', 'reduce_overlap', false)]
    case 'too_many_sfx':
      return [conflictFor(map, config, 'too_many_events_same_moment', 'medium', 'Too many SFX hits land in one montage moment.', 'remove_event', false)]
    case 'ambience_masked':
      return [conflictFor(map, config, 'sfx_tail_over_speech', 'medium', 'Ambience may be masked by dense music/SFX.', 'shorten_duration', false)]
    case 'pacing_rushed':
      return [conflictFor(map, config, 'overall_pacing_too_rushed', 'high', 'Overall pacing feels too rushed.', 'extend_duration', false)]
    case 'pacing_slow':
      return [conflictFor(map, config, 'overall_pacing_too_slow', 'high', 'Overall pacing feels too slow.', 'shorten_duration', false)]
    case 'faith_user_review':
      return [conflictFor(map, config, 'emotional_pause_removed', 'medium', 'Emotional pause was shortened for social pacing.', 'preserve_pause', false, true)]
    case 'lake_como_ambience_warning':
      return [conflictFor(map, config, 'sfx_tail_over_speech', 'low', 'Lake Como ambience may be slightly crowded by polish SFX.', 'shorten_duration', false)]
    case 'signature_overlay_blocked':
      return [conflictFor(map, config, 'caption_overlay_collision', 'critical', 'Signature overlay collides with captions.', 'reduce_overlap', true)]
    default:
      return []
  }
}

const qaCheckFor = (
  map: MasterTimingMapRecord,
  config: ScenarioConfig,
  checkType: StoryTimingQACheckRecord['checkType'],
  status: StoryTimingQACheckRecord['status'],
  summary: string,
  score: number,
  blocksRender = false,
  requiresManualReview = false,
): StoryTimingQACheckRecord => ({
  ...baseRecord(`timing-qa-check-${config.id}-${checkType}`),
  masterTimingMapId: map.id,
  projectId: map.projectId,
  editPlanId: map.editPlanId,
  checkType,
  status,
  score,
  relatedEventIds: [],
  relatedAnchorIds: [],
  summary,
  recommendedFix: status === 'passed' ? undefined : 'Use the full Timing QA recommendation for this issue.',
  blocksRender,
  requiresManualReview,
})

const qaChecksFor = (map: MasterTimingMapRecord, config: ScenarioConfig): StoryTimingQACheckRecord[] => {
  const checks = [
    qaCheckFor(map, config, 'caption_sync', 'passed', 'Caption sync passed.', 96),
    qaCheckFor(map, config, 'music_ducking_timing', 'passed', 'Music ducking passed.', 94),
    qaCheckFor(map, config, 'sfx_hit_alignment', 'passed', 'SFX hit alignment passed.', 95),
    qaCheckFor(map, config, 'signature_timing_story_meaning', 'passed', 'Signature timing follows meaning.', 94),
  ]

  if (config.issue === 'minor_caption_warning') checks.push(qaCheckFor(map, config, 'caption_readability_duration', 'warning', 'Caption may be slightly fast.', 82))
  if (config.issue === 'caption_too_fast') checks.push(qaCheckFor(map, config, 'caption_readability_duration', 'requires_adjustment', 'Caption is too fast.', 68))
  if (config.issue === 'emotional_pause_removed' || config.issue === 'faith_user_review') {
    checks.push(qaCheckFor(map, config, 'emotional_pause_preservation', config.issue === 'faith_user_review' ? 'requires_manual_review' : 'failed', 'Emotional pause needs review.', 58, config.issue !== 'faith_user_review', true))
  }
  if (config.issue === 'manifest_missing_track') checks.push(qaCheckFor(map, config, 'render_manifest_integrity', 'requires_adjustment', 'Render manifest is missing a required track.', 66))

  return checks
}

const renderManifestFor = (
  map: MasterTimingMapRecord,
  events: TimingEventRecord[],
  config: ScenarioConfig,
): RenderTimingManifestRecord => {
  const eventTrackTypes = [...new Set(events.map((event) => event.trackType))]
  const trackTypes = config.manifestMissingTrack ? eventTrackTypes.filter((trackType) => trackType !== 'captions') : eventTrackTypes
  const sourceSystemForTrack = (trackType: string): StoryTimingSourceSystem =>
    trackType === 'captions' ? 'caption_plan' : trackType === 'sfx' ? 'sfx_event' : 'edit_plan'
  const tracks = ['source_video', ...trackTypes].map((trackType, index) => ({
    id: `timing-qa-render-track-${config.id}-${trackType}`,
    trackType: trackType as RenderTimingManifestRecord['tracks'][number]['trackType'],
    label: `${trackType} track`,
    layerOrder: index,
    sourceSystem: sourceSystemForTrack(trackType),
    eventIds: events.filter((event) => event.trackType === trackType).map((event) => event.id),
    notes: ['Mock render readiness track.'],
  }))

  return {
    ...baseRecord(`timing-qa-render-manifest-${config.id}`),
    masterTimingMapId: map.id,
    projectId: map.projectId,
    editPlanId: map.editPlanId,
    status: config.expectedReadinessDecision === 'blocked_for_render' ? 'draft' : 'ready_for_worker',
    durationSeconds: map.durationSeconds,
    frameRate: map.frameRate,
    tracks,
    events: events.map((event) => ({
      eventId: event.id,
      eventType: event.eventType,
      trackType: event.trackType,
      startTimeSeconds: event.startTimeSeconds,
      hitTimeSeconds: event.hitTimeSeconds,
      endTimeSeconds: event.endTimeSeconds,
      sourceSystem: event.sourceSystem,
      sourceRecordId: event.sourceRecordId,
      payload: { label: event.label },
    })),
    dependencies: [],
    conflictsResolved: [],
    readyForRender: config.expectedReadinessDecision !== 'blocked_for_render' && !config.manifestMissingTrack,
    workerNotes: ['Mock render readiness only; do not render.'],
  }
}

const makeScenario = (config: ScenarioConfig): MockTimingQAScenario => {
  const masterTimingMap = mapFor(config)
  const segments = [segmentFor(masterTimingMap, config)]
  const events = eventsFor(masterTimingMap, config)
  const conflicts = conflictsFor(masterTimingMap, config)
  const qaChecks = qaChecksFor(masterTimingMap, config)
  const renderTimingManifest = renderManifestFor(masterTimingMap, events, config)

  return {
    id: config.id,
    label: config.label,
    timingMapSummary: masterTimingMap.summary,
    masterTimingMap,
    segments,
    anchors: [],
    events,
    dependencies: [],
    conflicts,
    qaChecks,
    renderTimingManifest,
    expectedScores: config.expectedScores,
    expectedReadinessDecision: config.expectedReadinessDecision,
    expectedRecommendedActions: config.expectedRecommendedActions,
    expectedNextStep: config.expectedNextStep,
    expectedChatSummary: config.label,
  }
}

export const mockTimingQAScenarios: MockTimingQAScenario[] = [
  makeScenario({ id: 'fully_ready_timing_map', label: 'Fully ready timing map', issue: 'none', expectedReadinessDecision: 'ready_for_preview', expectedRecommendedActions: ['approve_timing'], expectedNextStep: 'create_timing_review_ui', expectedScores: { minOverallScore: 90, maxOverallScore: 100 } }),
  makeScenario({ id: 'ready_with_minor_caption_warning', label: 'Ready with minor caption warning', issue: 'minor_caption_warning', expectedReadinessDecision: 'ready_with_warnings', expectedRecommendedActions: ['extend_duration'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 70, maxOverallScore: 95 } }),
  makeScenario({ id: 'caption_too_fast', label: 'Caption too fast', issue: 'caption_too_fast', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['extend_duration'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'caption_overlaps_graphic_design', label: 'Caption overlaps Graphic Design', issue: 'caption_graphic_overlap', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['move_caption'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'cut_before_phrase_completes', label: 'Cut before phrase completes', issue: 'cut_before_phrase', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['shift_event'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'emotional_pause_removed', label: 'Emotional pause removed', issue: 'emotional_pause_removed', expectedReadinessDecision: 'blocked_for_render', expectedRecommendedActions: ['preserve_pause'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 0, maxOverallScore: 65 }, tone: 'faith' }),
  makeScenario({ id: 'music_ducking_starts_late', label: 'Music ducking starts late', issue: 'music_ducking_late', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['adjust_music_ducking'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'sfx_hit_late', label: 'SFX hit late', issue: 'sfx_hit_late', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['adjust_sfx_hit'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'sfx_tail_overlaps_speech', label: 'SFX tail overlaps speech', issue: 'sfx_tail_speech', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['adjust_sfx_hit'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'stroke_motion_completes_late', label: 'Stroke Motion completes late', issue: 'stroke_late', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['shift_event'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'graphic_not_readable_long_enough', label: 'Graphic not readable long enough', issue: 'graphic_short_read', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['extend_duration'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'real_motion_blocks_face', label: 'Real Motion blocks face', issue: 'real_face_block', expectedReadinessDecision: 'blocked_for_render', expectedRecommendedActions: ['move_overlay'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 0, maxOverallScore: 65 } }),
  makeScenario({ id: 'too_many_overlays_same_moment', label: 'Too many overlays at same moment', issue: 'too_many_overlays', expectedReadinessDecision: 'ready_with_warnings', expectedRecommendedActions: ['remove_event'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 70, maxOverallScore: 95 } }),
  makeScenario({ id: 'too_many_sfx_hits_montage', label: 'Too many SFX hits in montage', issue: 'too_many_sfx', expectedReadinessDecision: 'ready_with_warnings', expectedRecommendedActions: ['remove_event'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 70, maxOverallScore: 95 } }),
  makeScenario({ id: 'ambience_masked_by_music_sfx', label: 'Ambience masked by music/SFX', issue: 'ambience_masked', expectedReadinessDecision: 'ready_with_warnings', expectedRecommendedActions: ['adjust_sfx_hit'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 70, maxOverallScore: 95 } }),
  makeScenario({ id: 'overall_pacing_too_rushed', label: 'Overall pacing too rushed', issue: 'pacing_rushed', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['adjust_timing'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'overall_pacing_too_slow', label: 'Overall pacing too slow', issue: 'pacing_slow', expectedReadinessDecision: 'requires_timing_adjustment', expectedRecommendedActions: ['adjust_timing'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 50, maxOverallScore: 85 } }),
  makeScenario({ id: 'render_manifest_missing_required_track', label: 'Render manifest missing required track', issue: 'manifest_missing_track', expectedReadinessDecision: 'blocked_for_render', expectedRecommendedActions: ['adjust_timing'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 0, maxOverallScore: 75 }, manifestMissingTrack: true }),
  makeScenario({ id: 'render_manifest_ready', label: 'Render manifest ready', issue: 'none', expectedReadinessDecision: 'ready_for_preview', expectedRecommendedActions: ['approve_timing'], expectedNextStep: 'create_timing_review_ui', expectedScores: { minOverallScore: 90, maxOverallScore: 100 } }),
  makeScenario({ id: 'faith_serious_timing_needs_user_review', label: 'Faith/serious timing needs user review', issue: 'faith_user_review', expectedReadinessDecision: 'requires_user_review', expectedRecommendedActions: ['preserve_pause'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 60, maxOverallScore: 90 }, tone: 'faith' }),
  makeScenario({ id: 'lake_como_lifestyle_ready_with_ambience_warning', label: 'Lake Como/lifestyle timing ready with ambience warning', issue: 'lake_como_ambience_warning', expectedReadinessDecision: 'ready_with_warnings', expectedRecommendedActions: ['adjust_sfx_hit'], expectedNextStep: 'ready_for_timing_review', expectedScores: { minOverallScore: 70, maxOverallScore: 95 }, tone: 'lifestyle' }),
  makeScenario({ id: 'signature_timing_blocked_by_overlay_collision', label: 'Signature timing blocked by overlay collision', issue: 'signature_overlay_blocked', expectedReadinessDecision: 'blocked_for_render', expectedRecommendedActions: ['move_caption'], expectedNextStep: 'adjust_timing', expectedScores: { minOverallScore: 0, maxOverallScore: 65 } }),
]

export function getMockTimingQAScenarioById(id: string): MockTimingQAScenario | undefined {
  return mockTimingQAScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockTimingQAScenario(): MockTimingQAScenario {
  return mockTimingQAScenarios[0]
}
