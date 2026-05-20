import type {
  MasterTimingMapRecord,
  StoryTimingAdjustmentType,
  StoryTimingConflictSeverity,
  StoryTimingConflictType,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TimeRange } from '../../types/shared'
import {
  createTimingConflict,
  createTimingConflictResolution,
} from './storytiming-conflict-service'

const eventsOverlap = (a: TimingEventRecord, b: TimingEventRecord): boolean =>
  a.startTimeSeconds < b.endTimeSeconds && b.startTimeSeconds < a.endTimeSeconds

const eventRange = (event: TimingEventRecord): TimeRange => ({
  startSeconds: event.startTimeSeconds,
  endSeconds: event.endTimeSeconds,
})

const spanRange = (a: TimingEventRecord, b: TimingEventRecord): TimeRange => ({
  startSeconds: Math.max(a.startTimeSeconds, b.startTimeSeconds),
  endSeconds: Math.min(a.endTimeSeconds, b.endTimeSeconds),
})

const signatureEvents = (events: TimingEventRecord[]): TimingEventRecord[] =>
  events.filter(
    (event) =>
      event.trackType === 'stroke_motion' ||
      event.trackType === 'graphic_design' ||
      event.trackType === 'real_motion',
  )

export function createSignatureOverlayConflict(
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
  return createTimingConflict(
    masterTimingMap,
    conflictType,
    severity,
    timeRange,
    description,
    whyItMatters,
    recommendedAdjustment,
    relatedEvents,
    relatedAnchors,
  )
}

export function createSignatureOverlayConflictResolution(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): TimingConflictResolutionRecord {
  return createTimingConflictResolution(masterTimingMap, conflict)
}

export function detectSignatureCaptionConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  const captions = events.filter((event) => event.eventType === 'caption_on')

  return captions.flatMap((caption) =>
    signatureEvents(events)
      .filter((overlay) => eventsOverlap(caption, overlay))
      .map((overlay) =>
        createSignatureOverlayConflict(
          masterTimingMap,
          overlay.trackType === 'stroke_motion' ? 'stroke_motion_caption_overlap' : 'caption_overlay_collision',
          overlay.trackType === 'real_motion' ? 'high' : 'medium',
          spanRange(caption, overlay),
          `Signature overlay "${overlay.label}" overlaps caption "${caption.label}".`,
          'Captions must remain readable as the top layer while signature overlays support the story.',
          'reduce_overlap',
          [caption, overlay],
        ),
      ),
  )
}

export function detectSignatureFaceBlockingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  return events
    .filter(
      (event) =>
        event.trackType === 'real_motion' &&
        (event.notes.some((note) => note.includes('force_face_block') || note.includes('face_blocking')) ||
          event.durationSeconds > 3.2),
    )
    .map((event) =>
      createSignatureOverlayConflict(
        masterTimingMap,
        'real_motion_blocks_face',
        'high',
        eventRange(event),
        `Real Motion "${event.label}" has face-blocking risk.`,
        'Real Motion must stay premium and integrated without covering the speaker face.',
        'reduce_overlap',
        [event],
      ),
    )
}

export function detectSignatureObjectBlockingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  return signatureEvents(events)
    .filter((event) => event.notes.some((note) => note.includes('object_blocking')))
    .map((event) =>
      createSignatureOverlayConflict(
        masterTimingMap,
        event.trackType === 'real_motion' ? 'real_motion_blocks_object' : 'manual_review_needed',
        'medium',
        eventRange(event),
        `Signature overlay "${event.label}" may block an important source object.`,
        'Signature overlays should preserve important footage, product, proof, or hand-gesture context.',
        'reduce_overlap',
        [event],
      ),
    )
}

export function detectTooManySignatureEventsConflict(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  const buckets = new Map<number, TimingEventRecord[]>()
  signatureEvents(events).forEach((event) => {
    const bucket = Math.round(event.startTimeSeconds * 2) / 2
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), event])
  })

  return [...buckets.entries()]
    .filter(([, bucketEvents]) => bucketEvents.length >= 3)
    .map(([bucket, bucketEvents]) =>
      createSignatureOverlayConflict(
        masterTimingMap,
        'too_many_events_same_moment',
        'medium',
        { startSeconds: bucket, endSeconds: bucket + 0.5 },
        `${bucketEvents.length} signature overlay events compete around ${bucket.toFixed(1)}s.`,
        'Too many visual overlays at once can reduce viewer comprehension.',
        'reduce_overlap',
        bucketEvents,
      ),
    )
}

const detectEmotionalPauseOverlayConflicts = (
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[] = [],
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] =>
  anchors
    .filter((anchor) => anchor.anchorType === 'pause' || anchor.anchorType === 'emotional_shift')
    .flatMap((anchor) =>
      signatureEvents(events)
        .filter(
          (event) =>
            event.startTimeSeconds < (anchor.endTimeSeconds ?? anchor.timeSeconds) &&
            anchor.timeSeconds < event.endTimeSeconds,
        )
        .map((event) =>
          createSignatureOverlayConflict(
            masterTimingMap,
            'signature_overlay_during_emotional_pause',
            anchor.importance === 'critical' ? 'high' : 'medium',
            {
              startSeconds: Math.max(event.startTimeSeconds, anchor.timeSeconds),
              endSeconds: Math.min(event.endTimeSeconds, anchor.endTimeSeconds ?? anchor.timeSeconds),
            },
            `Signature overlay "${event.label}" appears during a protected emotional timing moment.`,
            'Faith, serious, and emotional sections should preserve pauses instead of filling them with decoration.',
            'move_to_different_anchor',
            [event],
            [anchor],
          ),
        ),
    )

export function detectSignatureOverlayConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[] = [],
  events: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  return [
    ...detectSignatureCaptionConflicts(masterTimingMap, events),
    ...detectSignatureFaceBlockingConflicts(masterTimingMap, events),
    ...detectSignatureObjectBlockingConflicts(masterTimingMap, events),
    ...detectTooManySignatureEventsConflict(masterTimingMap, events),
    ...detectEmotionalPauseOverlayConflicts(masterTimingMap, anchors, events),
  ]
}

export function createSignatureOverlayConflictSummary(conflicts: TimingConflictRecord[]): string {
  const blockers = conflicts.filter((conflict) => conflict.blocksRender).length
  return `${conflicts.length} signature overlay conflict(s) detected; ${blockers} block render readiness.`
}
