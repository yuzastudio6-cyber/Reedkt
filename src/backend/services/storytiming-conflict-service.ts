import type {
  MasterTimingMapRecord,
  StoryTimingAdjustmentType,
  StoryTimingConflictSeverity,
  StoryTimingConflictType,
  StoryTimingSourceSystem,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TimeRange } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

const eventsOverlap = (a: TimingEventRecord, b: TimingEventRecord): boolean =>
  a.startTimeSeconds < b.endTimeSeconds && b.startTimeSeconds < a.endTimeSeconds

const pointRange = (seconds: number): TimeRange => ({
  startSeconds: seconds,
  endSeconds: seconds,
})

const spanRange = (a: TimingEventRecord, b: TimingEventRecord): TimeRange => ({
  startSeconds: Math.min(a.startTimeSeconds, b.startTimeSeconds),
  endSeconds: Math.max(a.endTimeSeconds, b.endTimeSeconds),
})

export function createTimingConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflictType: StoryTimingConflictType,
  severity: StoryTimingConflictSeverity,
  timeRange: TimeRange,
  description: string,
  whyItMatters: string,
  recommendedAdjustment: StoryTimingAdjustmentType,
  relatedEvents: TimingEventRecord[] = [],
  relatedAnchors: TimingAnchorRecord[] = [],
): TimingConflictRecord {
  const sourceSystems = Array.from(
    new Set<StoryTimingSourceSystem>([
      ...relatedEvents.map((event) => event.sourceSystem),
      ...relatedAnchors.map((anchor) => anchor.sourceSystem),
    ]),
  )

  return {
    id: createMockId('timing-conflict'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    conflictType,
    severity,
    relatedEventIds: relatedEvents.map((event) => event.id),
    relatedAnchorIds: relatedAnchors.map((anchor) => anchor.id),
    sourceSystems,
    timeRange,
    description,
    whyItMatters,
    recommendedAdjustment,
    blocksRender: severity === 'critical' || severity === 'high',
    requiresUserReview: severity === 'critical',
    status: severity === 'critical' ? 'needs_user_review' : 'open',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {},
  }
}

export function createTimingConflictResolution(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): TimingConflictResolutionRecord {
  const shift =
    conflict.recommendedAdjustment === 'shift_earlier'
      ? -0.25
      : conflict.recommendedAdjustment === 'shift_later'
        ? 0.4
        : undefined

  return {
    id: createMockId('timing-conflict-resolution'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    timingConflictId: conflict.id,
    adjustmentType: conflict.recommendedAdjustment,
    affectedEventIds: conflict.relatedEventIds,
    affectedAnchorIds: conflict.relatedAnchorIds,
    timeShiftSeconds: shift,
    newTimeRange: shift === undefined
      ? undefined
      : {
          startSeconds: Math.max(0, conflict.timeRange.startSeconds + shift),
          endSeconds: Math.max(0, conflict.timeRange.endSeconds + shift),
        },
    reason: conflict.description,
    approved: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {},
  }
}

export function detectCaptionConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const captions = events.filter((event) => event.eventType === 'caption_on')
  const overlays = events.filter((event) => event.trackType === 'graphic_design' || event.trackType === 'real_motion')
  const shortCaptions = captions.filter((caption) => caption.durationSeconds > 0 && caption.durationSeconds < 1.1)

  return [
    ...captions.flatMap((caption) =>
      overlays
        .filter((overlay) => eventsOverlap(caption, overlay))
        .map((overlay) =>
          createTimingConflict(
            masterTimingMap,
            'caption_overlay_collision',
            overlay.trackType === 'real_motion' ? 'high' : 'medium',
            spanRange(caption, overlay),
            `Caption "${caption.label}" overlaps ${overlay.label}.`,
            'Captions must remain readable and should not collide with overlays or face-safe objects.',
            'reduce_overlap',
            [caption, overlay],
          ),
        ),
    ),
    ...shortCaptions.map((caption) =>
      createTimingConflict(
        masterTimingMap,
        'caption_too_fast',
        'medium',
        { startSeconds: caption.startTimeSeconds, endSeconds: caption.endTimeSeconds },
        `Caption "${caption.label}" has a very short read window.`,
        'Caption timing must protect viewer comprehension.',
        'extend_duration',
        [caption],
      ),
    ),
  ]
}

export function detectCutTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const cuts = events.filter((event) => event.eventType === 'cut')
  const pauses = anchors.filter((anchor) => anchor.anchorType === 'pause')

  return cuts.flatMap((cut) =>
    pauses
      .filter((pause) => cut.startTimeSeconds >= pause.timeSeconds && cut.startTimeSeconds <= (pause.endTimeSeconds ?? pause.timeSeconds))
      .map((pause) =>
        createTimingConflict(
          masterTimingMap,
          'emotional_pause_removed',
          'critical',
          { startSeconds: pause.timeSeconds, endSeconds: pause.endTimeSeconds ?? pause.timeSeconds },
          `Cut "${cut.label}" lands inside a protected emotional pause.`,
          'Meaningful pauses should not be removed just to improve pace.',
          'preserve_pause',
          [cut],
          [pause],
        ),
      ),
  )
}

export function detectMusicTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const duckStarts = events.filter((event) => event.eventType === 'music_duck_start')
  const captions = events.filter((event) => event.eventType === 'caption_on')

  return captions.flatMap((caption) =>
    duckStarts
      .filter((duck) => Math.abs(duck.startTimeSeconds - caption.startTimeSeconds) <= 0.6 && duck.startTimeSeconds > caption.startTimeSeconds)
      .map((duck) =>
        createTimingConflict(
          masterTimingMap,
          'music_ducking_misses_speech',
          'high',
          spanRange(caption, duck),
          `Music ducking starts after speech begins for "${caption.label}".`,
          'Music should duck before speech so voice clarity wins.',
          'shift_earlier',
          [caption, duck],
        ),
      ),
  )
}

export function detectSFXTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  return events
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      if (event.notes.some((note) => note.includes('force_sfx_hit_late'))) {
        return [
          createTimingConflict(
            masterTimingMap,
            'sfx_hit_late',
            'high',
            pointRange(event.hitTimeSeconds ?? event.startTimeSeconds),
            `SFX hit "${event.label}" is deliberately late in this mock scenario.`,
            'SFX should reinforce the visual/story cue at the intended frame.',
            'shift_earlier',
            [event],
          ),
        ]
      }

      const anchor = anchors.find((candidate) => candidate.anchorType === 'sfx_hit' && candidate.sourceRecordId === event.sourceRecordId)
      const delta = anchor ? (event.hitTimeSeconds ?? event.startTimeSeconds) - anchor.timeSeconds : 0

      if (!anchor || Math.abs(delta) <= 0.08) {
        return []
      }

      return [
        createTimingConflict(
          masterTimingMap,
          delta > 0 ? 'sfx_hit_late' : 'sfx_hit_early',
          Math.abs(delta) > 0.25 ? 'high' : 'medium',
          pointRange(event.hitTimeSeconds ?? event.startTimeSeconds),
          `SFX hit "${event.label}" is ${Math.abs(delta).toFixed(2)}s away from its anchor.`,
          'SFX should reinforce the visual/story cue at the intended frame.',
          delta > 0 ? 'shift_earlier' : 'shift_later',
          [event],
          [anchor],
        ),
      ]
    })
}

export function detectSignatureTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  return events
    .filter((event) => event.eventType === 'stroke_motion_complete')
    .flatMap((event) => {
      const phraseAnchor = anchors.find((anchor) => anchor.anchorType === 'phrase' && Math.abs(anchor.timeSeconds - event.startTimeSeconds) <= 0.7)
      const delta = phraseAnchor ? event.startTimeSeconds - phraseAnchor.timeSeconds : 0

      if (!phraseAnchor || delta <= 0.25) {
        return []
      }

      return [
        createTimingConflict(
          masterTimingMap,
          'stroke_motion_late',
          'medium',
          pointRange(event.startTimeSeconds),
          `Stroke Motion completion "${event.label}" lands after the phrase anchor.`,
          'Signature animation should land on meaning, not lag behind it.',
          'shift_earlier',
          [event],
          [phraseAnchor],
        ),
      ]
    })
}

export function detectOverlayConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion' && event.durationSeconds > 2)

  return realMotionEvents.map((event) =>
    createTimingConflict(
      masterTimingMap,
      'real_motion_blocks_face',
      'high',
      { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
      `Real Motion event "${event.label}" holds for a long window.`,
      'Real Motion must stay face-safe and should not block speech comprehension.',
      'reduce_overlap',
      [event],
    ),
  )
}

export function detectPacingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const buckets = new Map<number, TimingEventRecord[]>()
  events.forEach((event) => {
    const bucket = Math.round(event.startTimeSeconds * 2) / 2
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), event])
  })

  return [...buckets.entries()]
    .filter(([, bucketEvents]) => bucketEvents.length >= 5)
    .map(([bucket, bucketEvents]) =>
      createTimingConflict(
        masterTimingMap,
        'too_many_events_same_moment',
        'medium',
        { startSeconds: bucket, endSeconds: bucket + 0.5 },
        `${bucketEvents.length} timing events occur around ${bucket.toFixed(1)}s.`,
        'Dense timing can make the edit feel chaotic or unreadable.',
        'reduce_overlap',
        bucketEvents,
      ),
    )
}

export function detectTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
): ServiceResult<{
  conflicts: TimingConflictRecord[]
  conflictResolutions: TimingConflictResolutionRecord[]
  warnings: string[]
}> {
  const conflicts = [
    ...detectCaptionConflicts(masterTimingMap, events),
    ...detectCutTimingConflicts(masterTimingMap, anchors, events),
    ...detectMusicTimingConflicts(masterTimingMap, events),
    ...detectSFXTimingConflicts(masterTimingMap, anchors, events),
    ...detectSignatureTimingConflicts(masterTimingMap, anchors, events),
    ...detectOverlayConflicts(masterTimingMap, events),
    ...detectPacingConflicts(masterTimingMap, events),
  ]
  const conflictResolutions = conflicts.map((conflict) => createTimingConflictResolution(masterTimingMap, conflict))
  const warnings = conflicts.some((conflict) => conflict.blocksRender)
    ? ['Blocking timing conflicts need review before render planning can continue.']
    : []

  return ok({ conflicts, conflictResolutions, warnings }, warnings)
}

export function createTimingConflictSummary(conflicts: TimingConflictRecord[]): string {
  const blockers = conflicts.filter((conflict) => conflict.blocksRender).length

  return `${conflicts.length} timing conflicts detected; ${blockers} block render readiness.`
}
