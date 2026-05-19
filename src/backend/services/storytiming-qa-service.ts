import type {
  MasterTimingMapRecord,
  StoryTimingQACheckRecord,
  StoryTimingQACheckStatus,
  StoryTimingQACheckType,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TimeRange } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

interface QACheckInput {
  masterTimingMap: MasterTimingMapRecord
  checkType: StoryTimingQACheckType
  status: StoryTimingQACheckStatus
  summary: string
  score?: number
  timeRange?: TimeRange
  relatedEventIds?: string[]
  relatedAnchorIds?: string[]
  recommendedFix?: string
  blocksRender?: boolean
  requiresManualReview?: boolean
}

const createQACheck = (input: QACheckInput): StoryTimingQACheckRecord => ({
  id: createMockId('storytiming-qa'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  checkType: input.checkType,
  status: input.status,
  score: input.score,
  timeRange: input.timeRange,
  relatedEventIds: input.relatedEventIds ?? [],
  relatedAnchorIds: input.relatedAnchorIds ?? [],
  summary: input.summary,
  recommendedFix: input.recommendedFix,
  blocksRender: input.blocksRender ?? false,
  requiresManualReview: input.requiresManualReview ?? false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {},
})

const checkFromConflict = (
  masterTimingMap: MasterTimingMapRecord,
  type: StoryTimingQACheckType,
  conflicts: TimingConflictRecord[],
  summary: string,
  recommendedFix: string,
): StoryTimingQACheckRecord => {
  const matching = conflicts.filter((conflict) => {
    if (type === 'caption_overlay_collision') {
      return conflict.conflictType === 'caption_overlay_collision'
    }
    if (type === 'music_ducking_timing') {
      return conflict.conflictType === 'music_ducking_misses_speech'
    }
    if (type === 'sfx_hit_alignment') {
      return conflict.conflictType === 'sfx_hit_late' || conflict.conflictType === 'sfx_hit_early'
    }
    if (type === 'emotional_pause_preservation') {
      return conflict.conflictType === 'emotional_pause_removed'
    }
    if (type === 'stroke_motion_word_sync') {
      return conflict.conflictType === 'stroke_motion_late'
    }
    if (type === 'real_motion_face_safety') {
      return conflict.conflictType === 'real_motion_blocks_face'
    }
    return false
  })
  const hasBlocker = matching.some((conflict) => conflict.blocksRender)

  return createQACheck({
    masterTimingMap,
    checkType: type,
    status: matching.length === 0 ? 'passed' : hasBlocker ? 'failed' : 'warning',
    summary: matching.length === 0 ? summary : `${summary} ${matching.length} issue(s) need attention.`,
    score: matching.length === 0 ? 96 : hasBlocker ? 58 : 78,
    timeRange: matching[0]?.timeRange,
    relatedEventIds: matching.flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: matching.flatMap((conflict) => conflict.relatedAnchorIds),
    recommendedFix: matching.length === 0 ? undefined : recommendedFix,
    blocksRender: hasBlocker,
    requiresManualReview: matching.some((conflict) => conflict.requiresUserReview),
  })
}

export function checkCaptionSync(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const captionEvents = events.filter((event) => event.trackType === 'captions')
  return createQACheck({
    masterTimingMap,
    checkType: 'caption_sync',
    status: captionEvents.length > 0 ? 'passed' : 'warning',
    summary: captionEvents.length > 0
      ? 'Caption timing follows speech-bearing segment windows.'
      : 'No caption events were available for sync QA.',
    score: captionEvents.length > 0 ? 94 : 72,
  })
}

export function checkCaptionReadabilityDuration(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const matching = conflicts.filter((conflict) => conflict.conflictType === 'caption_too_fast')
  return createQACheck({
    masterTimingMap,
    checkType: 'caption_readability_duration',
    status: matching.length === 0 ? 'passed' : 'requires_adjustment',
    summary: matching.length === 0
      ? 'Caption read windows are long enough for mock review.'
      : 'One or more captions need a longer read window.',
    score: matching.length === 0 ? 95 : 70,
    relatedEventIds: matching.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: matching.length === 0 ? undefined : 'Extend the caption window or split the line.',
    blocksRender: matching.some((conflict) => conflict.blocksRender),
  })
}

export function checkCaptionOverlayCollision(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  return checkFromConflict(
    masterTimingMap,
    'caption_overlay_collision',
    conflicts,
    'Caption overlay collision check completed.',
    'Shift the overlay later or move the caption to a safe zone.',
  )
}

export function checkSpeechCutIntegrity(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const riskyCuts = events.filter((event) => event.eventType === 'cut' && event.priority === 'critical')
  return createQACheck({
    masterTimingMap,
    checkType: 'speech_cut_integrity',
    status: riskyCuts.length === 0 ? 'passed' : 'requires_manual_review',
    summary: riskyCuts.length === 0
      ? 'No cuts are marked as sentence-risk in the mock timing map.'
      : 'A critical cut may affect sentence meaning and needs review.',
    score: riskyCuts.length === 0 ? 95 : 65,
    relatedEventIds: riskyCuts.map((event) => event.id),
    recommendedFix: riskyCuts.length === 0 ? undefined : 'Review the cut against transcript meaning before approval.',
    requiresManualReview: riskyCuts.length > 0,
  })
}

export function checkEmotionalPausePreservation(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  return checkFromConflict(
    masterTimingMap,
    'emotional_pause_preservation',
    conflicts,
    'Emotional pause preservation check completed.',
    'Preserve the pause or ask the user before cutting it.',
  )
}

export function checkMusicBeatAlignment(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
): StoryTimingQACheckRecord {
  const musicAnchors = anchors.filter((anchor) => anchor.primaryAuthority === 'music_rhythm')
  return createQACheck({
    masterTimingMap,
    checkType: 'music_beat_alignment',
    status: musicAnchors.length > 0 ? 'passed' : 'warning',
    summary: musicAnchors.length > 0
      ? 'Music timing anchors are available for beat-aware sections.'
      : 'No music anchors were available; beat alignment stays loose.',
    score: musicAnchors.length > 0 ? 92 : 74,
    relatedAnchorIds: musicAnchors.map((anchor) => anchor.id),
  })
}

export function checkMusicDuckingTiming(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  return checkFromConflict(
    masterTimingMap,
    'music_ducking_timing',
    conflicts,
    'Music ducking timing protects speech in the mock map.',
    'Move ducking earlier so it begins before speech.',
  )
}

export function checkSFXHitAlignment(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  return checkFromConflict(
    masterTimingMap,
    'sfx_hit_alignment',
    conflicts,
    'SFX hit alignment check completed.',
    'Shift the SFX hit to the approved anchor.',
  )
}

export function checkSFXTailSafety(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const longSfx = events.filter((event) => event.eventType === 'sfx_end' && event.startTimeSeconds > masterTimingMap.durationSeconds)
  return createQACheck({
    masterTimingMap,
    checkType: 'sfx_tail_safety',
    status: longSfx.length === 0 ? 'passed' : 'warning',
    summary: longSfx.length === 0
      ? 'SFX tails end within the planned timeline.'
      : 'One or more SFX tails extend beyond the timing map duration.',
    score: longSfx.length === 0 ? 96 : 72,
    relatedEventIds: longSfx.map((event) => event.id),
    recommendedFix: longSfx.length === 0 ? undefined : 'Trim the SFX tail before render readiness.',
  })
}

export function checkTransitionTiming(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const transitionConflicts = conflicts.filter((conflict) => conflict.conflictType === 'transition_cuts_story_beat')
  return createQACheck({
    masterTimingMap,
    checkType: 'transition_timing',
    status: transitionConflicts.length === 0 ? 'passed' : 'requires_adjustment',
    summary: transitionConflicts.length === 0
      ? 'Transition timing does not cut story beats in the mock map.'
      : 'A transition may cut a story beat too early.',
    score: transitionConflicts.length === 0 ? 94 : 68,
    relatedEventIds: transitionConflicts.flatMap((conflict) => conflict.relatedEventIds),
  })
}

export function checkStrokeMotionWordSync(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  return checkFromConflict(
    masterTimingMap,
    'stroke_motion_word_sync',
    conflicts,
    'Stroke Motion word/phrase sync check completed.',
    'Shorten or shift the animation so it lands on phrase meaning.',
  )
}

export function checkGraphicReadabilityTime(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const shortGraphics = events.filter((event) => event.trackType === 'graphic_design' && event.durationSeconds < 1.2)
  return createQACheck({
    masterTimingMap,
    checkType: 'graphic_readability_time',
    status: shortGraphics.length === 0 ? 'passed' : 'warning',
    summary: shortGraphics.length === 0
      ? 'Graphic Design overlays have acceptable mock hold time.'
      : 'A Graphic Design reveal needs more hold time.',
    score: shortGraphics.length === 0 ? 94 : 74,
    relatedEventIds: shortGraphics.map((event) => event.id),
  })
}

export function checkRealMotionEntryExitTiming(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion')
  return createQACheck({
    masterTimingMap,
    checkType: 'real_motion_entry_exit_timing',
    status: realMotionEvents.length > 0 ? 'passed' : 'warning',
    summary: realMotionEvents.length > 0
      ? 'Real Motion enter/settle events are present where requested.'
      : 'No Real Motion timing events were created.',
    score: realMotionEvents.length > 0 ? 92 : 78,
    relatedEventIds: realMotionEvents.map((event) => event.id),
  })
}

export function checkOverallRhythm(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const pacingConflicts = conflicts.filter((conflict) => conflict.conflictType.startsWith('overall_') || conflict.conflictType === 'too_many_events_same_moment')
  return createQACheck({
    masterTimingMap,
    checkType: 'overall_rhythm',
    status: pacingConflicts.length === 0 ? 'passed' : 'warning',
    summary: pacingConflicts.length === 0
      ? 'Overall event density is acceptable for mock timing review.'
      : 'Some timeline moments are crowded and need timing relief.',
    score: pacingConflicts.length === 0 ? 93 : 76,
    relatedEventIds: pacingConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: pacingConflicts.length === 0 ? undefined : 'Spread decorative events away from speech and caption beats.',
  })
}

export function createStoryTimingQAChecks(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord[] {
  return [
    checkCaptionSync(masterTimingMap, events),
    checkCaptionReadabilityDuration(masterTimingMap, conflicts),
    checkCaptionOverlayCollision(masterTimingMap, conflicts),
    checkSpeechCutIntegrity(masterTimingMap, events),
    checkEmotionalPausePreservation(masterTimingMap, conflicts),
    checkMusicBeatAlignment(masterTimingMap, anchors),
    checkMusicDuckingTiming(masterTimingMap, conflicts),
    checkSFXHitAlignment(masterTimingMap, conflicts),
    checkSFXTailSafety(masterTimingMap, events),
    checkTransitionTiming(masterTimingMap, conflicts),
    checkStrokeMotionWordSync(masterTimingMap, conflicts),
    checkGraphicReadabilityTime(masterTimingMap, events),
    checkRealMotionEntryExitTiming(masterTimingMap, events),
    checkOverallRhythm(masterTimingMap, conflicts),
    createQACheck({
      masterTimingMap,
      checkType: 'render_manifest_integrity',
      status: conflicts.some((conflict) => conflict.blocksRender) ? 'requires_adjustment' : 'passed',
      summary: conflicts.some((conflict) => conflict.blocksRender)
        ? 'Render timing manifest should wait until blocking conflicts are resolved.'
        : 'Timing map is ready to prepare a mock render manifest.',
      score: conflicts.some((conflict) => conflict.blocksRender) ? 62 : 95,
      blocksRender: conflicts.some((conflict) => conflict.blocksRender),
    }),
  ]
}

export function runStoryTimingQA(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
  conflicts: TimingConflictRecord[],
): ServiceResult<{
  qaChecks: StoryTimingQACheckRecord[]
  blockingCheckIds: string[]
  warnings: string[]
}> {
  const qaChecks = createStoryTimingQAChecks(masterTimingMap, anchors, events, conflicts)
  const blockingCheckIds = qaChecks.filter((check) => check.blocksRender).map((check) => check.id)
  const warnings = blockingCheckIds.length > 0
    ? ['Timing QA found blocking checks that prevent render readiness.']
    : []

  return ok({ qaChecks, blockingCheckIds, warnings }, warnings)
}

export function createStoryTimingQASummary(qaChecks: StoryTimingQACheckRecord[]): string {
  const failed = qaChecks.filter((check) => check.status === 'failed' || check.blocksRender).length

  return `${qaChecks.length} timing QA checks created; ${failed} require adjustment before render readiness.`
}
