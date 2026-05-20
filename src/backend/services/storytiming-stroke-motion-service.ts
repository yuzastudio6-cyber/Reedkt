import type {
  StrokeMotionBeatRecord,
  StrokeMotionTimingAnchorRecord,
  StrokeMotionTimingAnchorType,
} from '../../types/stroke-motion'
import type {
  MasterTimingMapRecord,
  StoryTimingAnchorType,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'

const pointRange = (seconds: number) => ({ startSeconds: seconds, endSeconds: seconds })

const eventsOverlap = (a: TimingEventRecord, b: TimingEventRecord): boolean =>
  a.startTimeSeconds < b.endTimeSeconds && b.startTimeSeconds < a.endTimeSeconds

const findSegmentForTime = (
  segments: StoryTimingSegmentRecord[],
  timeSeconds: number,
): StoryTimingSegmentRecord | undefined =>
  segments.find(
    (segment) =>
      timeSeconds >= segment.outputTimeRange.startSeconds &&
      timeSeconds <= segment.outputTimeRange.endSeconds,
  )

const mapStrokeAnchorType = (anchorType: StrokeMotionTimingAnchorType): StoryTimingAnchorType => {
  if (anchorType === 'scene_cut') return 'scene_change'
  if (anchorType === 'manual') return 'manual'
  return anchorType
}

const createAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  input: {
    sourceRecordId?: string
    sourceTableName: string
    anchorType: StoryTimingAnchorType
    anchorLabel: string
    anchorText?: string
    timeSeconds: number
    endTimeSeconds?: number
    notes: string[]
  },
): TimingAnchorRecord => {
  const segment = findSegmentForTime(segments, input.timeSeconds)

  return {
    id: createMockId('stroke-signature-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: 'stroke_motion',
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: 'stroke_motion',
      sourceRecordId: input.sourceRecordId,
      sourceTableName: input.sourceTableName,
      label: input.anchorLabel,
    },
    anchorType: input.anchorType,
    anchorLabel: input.anchorLabel,
    anchorText: input.anchorText,
    timeSeconds: input.timeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    frameNumber: Math.round(input.timeSeconds * masterTimingMap.frameRate),
    importance: input.anchorType === 'stroke_motion_completion' ? 'high' : 'medium',
    primaryAuthority: input.anchorType === 'emotional_shift' ? 'emotional_timing' : 'signature_animation',
    syncMode: input.anchorType === 'word'
      ? 'word_locked'
      : input.anchorType === 'phrase'
        ? 'phrase_locked'
        : input.anchorType === 'emotional_shift'
          ? 'emotion_locked'
          : 'visual_motion_locked',
    locked: false,
    notes: input.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

const createEvent = (
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  anchors: TimingAnchorRecord[],
  input: {
    sourceRecordId?: string
    eventType: 'stroke_motion_start' | 'stroke_motion_beat' | 'stroke_motion_complete'
    label: string
    startTimeSeconds: number
    hitTimeSeconds?: number
    endTimeSeconds: number
    notes: string[]
  },
): TimingEventRecord => {
  const time = input.hitTimeSeconds ?? input.startTimeSeconds
  const segment = findSegmentForTime(segments, time)
  const anchor = anchors.find(
    (candidate) =>
      candidate.sourceSystem === 'stroke_motion' &&
      candidate.sourceRecordId === input.sourceRecordId &&
      Math.abs(candidate.timeSeconds - time) <= 0.2,
  )

  return {
    id: createMockId('stroke-signature-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    anchorId: anchor?.id,
    sourceSystem: 'stroke_motion',
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: 'stroke_motion',
      sourceRecordId: input.sourceRecordId,
      sourceTableName: 'stroke_motion_beats',
      label: input.label,
    },
    eventType: input.eventType,
    trackType: 'stroke_motion',
    label: input.label,
    startTimeSeconds: input.startTimeSeconds,
    hitTimeSeconds: input.hitTimeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    durationSeconds: Math.max(0, input.endTimeSeconds - input.startTimeSeconds),
    frameStart: Math.round(input.startTimeSeconds * masterTimingMap.frameRate),
    frameHit: input.hitTimeSeconds === undefined ? undefined : Math.round(input.hitTimeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(input.endTimeSeconds * masterTimingMap.frameRate),
    priority: input.eventType === 'stroke_motion_complete' ? 'high' : 'medium',
    syncMode: input.eventType === 'stroke_motion_complete' ? 'phrase_locked' : 'visual_motion_locked',
    canShift: true,
    locked: false,
    visibilityLayer: 'stroke_motion',
    signatureSystem: 'stroke_motion',
    notes: input.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

const nearestAnchor = (
  anchors: TimingAnchorRecord[],
  event: TimingEventRecord,
  anchorTypes: StoryTimingAnchorType[],
  toleranceSeconds: number,
): TimingAnchorRecord | undefined => {
  const time = event.hitTimeSeconds ?? event.startTimeSeconds
  return anchors
    .filter((anchor) => anchorTypes.includes(anchor.anchorType))
    .sort((a, b) => Math.abs(a.timeSeconds - time) - Math.abs(b.timeSeconds - time))
    .find((anchor) => Math.abs(anchor.timeSeconds - time) <= toleranceSeconds)
}

export function createStrokeMotionTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  strokeMotionBeats: StrokeMotionBeatRecord[] = [],
  strokeMotionTimingAnchors: StrokeMotionTimingAnchorRecord[] = [],
): TimingAnchorRecord[] {
  const beatAnchors = strokeMotionBeats.flatMap((beat) => {
    const anchors: TimingAnchorRecord[] = []
    if (beat.startTimeSeconds !== undefined) {
      anchors.push(createAnchor(masterTimingMap, segments, {
        sourceRecordId: beat.id,
        sourceTableName: 'stroke_motion_beats',
        anchorType: 'stroke_motion_start',
        anchorLabel: `${beat.storyBeatLabel} starts`,
        anchorText: beat.matchedWords,
        timeSeconds: beat.startTimeSeconds,
        notes: [beat.meaning, 'Stroke Motion starts on the story beat or slightly before key phrase meaning.'],
      }))
    }

    if (beat.endTimeSeconds !== undefined) {
      anchors.push(createAnchor(masterTimingMap, segments, {
        sourceRecordId: beat.id,
        sourceTableName: 'stroke_motion_beats',
        anchorType: 'stroke_motion_completion',
        anchorLabel: `${beat.storyBeatLabel} completes`,
        anchorText: beat.matchedWords,
        timeSeconds: beat.endTimeSeconds,
        notes: [beat.visualAction, 'Stroke Motion completion should land on phrase meaning.'],
      }))
    }

    return anchors
  })

  const sourceAnchors = strokeMotionTimingAnchors
    .filter((anchor) => anchor.startTimeSeconds !== undefined || anchor.endTimeSeconds !== undefined)
    .map((anchor) => createAnchor(masterTimingMap, segments, {
      sourceRecordId: anchor.id,
      sourceTableName: 'stroke_motion_timing_anchors',
      anchorType: mapStrokeAnchorType(anchor.anchorType),
      anchorLabel: anchor.anchorLabel ?? anchor.anchorType,
      anchorText: anchor.matchedText,
      timeSeconds: anchor.endTimeSeconds ?? anchor.startTimeSeconds ?? 0,
      endTimeSeconds: anchor.endTimeSeconds,
      notes: [anchor.manualNote ?? 'Existing Stroke Motion timing anchor connected to StoryTiming.'],
    }))

  return [...beatAnchors, ...sourceAnchors]
}

export function createStrokeMotionBeatEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  strokeMotionBeats: StrokeMotionBeatRecord[] = [],
): TimingEventRecord[] {
  return strokeMotionBeats
    .filter((beat) => beat.startTimeSeconds !== undefined || beat.endTimeSeconds !== undefined)
    .map((beat) => {
      const start = beat.startTimeSeconds ?? Math.max(0, (beat.endTimeSeconds ?? 0) - 1)
      const end = beat.endTimeSeconds ?? start + 1
      return createEvent(masterTimingMap, segments, anchors, {
        sourceRecordId: beat.id,
        eventType: 'stroke_motion_beat',
        label: `${beat.storyBeatLabel} Stroke Motion beat`,
        startTimeSeconds: start,
        hitTimeSeconds: end,
        endTimeSeconds: end,
        notes: [beat.meaning, beat.visualAction, beat.workerNotes ?? ''],
      })
    })
}

export function createStrokeMotionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  strokeMotionBeats: StrokeMotionBeatRecord[] = [],
): TimingEventRecord[] {
  return strokeMotionBeats
    .filter((beat) => beat.startTimeSeconds !== undefined || beat.endTimeSeconds !== undefined)
    .flatMap((beat) => {
      const start = beat.startTimeSeconds ?? Math.max(0, (beat.endTimeSeconds ?? 0) - 1)
      const end = beat.endTimeSeconds ?? start + 1
      const baseNotes = [beat.meaning, beat.visualAction, beat.workerNotes ?? ''].filter(Boolean)

      return [
        createEvent(masterTimingMap, segments, anchors, {
          sourceRecordId: beat.id,
          eventType: 'stroke_motion_start',
          label: `${beat.storyBeatLabel} Stroke Motion starts`,
          startTimeSeconds: start,
          endTimeSeconds: start,
          notes: [...baseNotes, 'Start on story beat or slightly before key phrase.'],
        }),
        createEvent(masterTimingMap, segments, anchors, {
          sourceRecordId: beat.id,
          eventType: 'stroke_motion_beat',
          label: `${beat.storyBeatLabel} Stroke Motion beat`,
          startTimeSeconds: start,
          hitTimeSeconds: end,
          endTimeSeconds: end,
          notes: baseNotes,
        }),
        createEvent(masterTimingMap, segments, anchors, {
          sourceRecordId: beat.id,
          eventType: 'stroke_motion_complete',
          label: `${beat.storyBeatLabel} Stroke Motion completes`,
          startTimeSeconds: end,
          hitTimeSeconds: end,
          endTimeSeconds: end,
          notes: [...baseNotes, 'Completion should land on key word, phrase end, or story resolution.'],
        }),
      ]
    })
}

export function createStrokeMotionWordSyncDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[] = [],
  events: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return events
    .filter((event) => event.eventType === 'stroke_motion_beat' || event.eventType === 'stroke_motion_complete')
    .flatMap((event) => {
      const anchor = nearestAnchor(
        anchors,
        event,
        event.eventType === 'stroke_motion_complete'
          ? ['stroke_motion_completion', 'phrase', 'word']
          : ['phrase', 'word', 'emotional_shift'],
        event.eventType === 'stroke_motion_complete' ? 0.35 : 0.5,
      )

      return anchor
        ? [{
            id: createMockId('stroke-word-sync-dependency'),
            masterTimingMapId: masterTimingMap.id,
            projectId: masterTimingMap.projectId,
            editPlanId: masterTimingMap.editPlanId,
            fromEventId: event.id,
            toAnchorId: anchor.id,
            dependencyType: 'sync_to_anchor',
            maxOffsetSeconds: event.eventType === 'stroke_motion_complete' ? 0.25 : 0.4,
            required: true,
            reason: event.eventType === 'stroke_motion_complete'
              ? 'Stroke Motion completion should land on word or phrase meaning.'
              : 'Stroke Motion beat should move with the speaker phrase.',
            notes: ['Mock dependency; existing Stroke Motion timing records remain source-owned.'],
            createdAt: nowIso(),
            updatedAt: nowIso(),
            metadata: { mockOnly: true },
          }]
        : []
    })
}

export function createStrokeMotionSFXSyncDependencies(
  masterTimingMap: MasterTimingMapRecord,
  strokeMotionEvents: TimingEventRecord[] = [],
  sfxEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  const motionMoments = strokeMotionEvents.filter(
    (event) => event.eventType === 'stroke_motion_start' || event.eventType === 'stroke_motion_complete',
  )

  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const hit = sfxEvent.hitTimeSeconds ?? sfxEvent.startTimeSeconds
      const motionEvent = motionMoments.find(
        (event) => Math.abs((event.hitTimeSeconds ?? event.startTimeSeconds) - hit) <= 0.18,
      )

      return motionEvent
        ? [{
            id: createMockId('stroke-sfx-sync-dependency'),
            masterTimingMapId: masterTimingMap.id,
            projectId: masterTimingMap.projectId,
            editPlanId: masterTimingMap.editPlanId,
            fromEventId: sfxEvent.id,
            toEventId: motionEvent.id,
            dependencyType: 'hit_on_same_frame',
            maxOffsetSeconds: 0.08,
            required: false,
            reason: 'Stroke Motion SFX should align with draw movement or completion only when useful.',
            notes: ['SFX remains subtle and voice-safe; it must not override speech meaning.'],
            createdAt: nowIso(),
            updatedAt: nowIso(),
            metadata: { mockOnly: true },
          }]
        : []
    })
}

export function detectStrokeMotionTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[] = [],
  events: TimingEventRecord[] = [],
  captionEvents: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  const strokeEvents = events.filter((event) => event.trackType === 'stroke_motion')
  const lateCompletions = strokeEvents
    .filter((event) => event.eventType === 'stroke_motion_complete')
    .flatMap((event) => {
      const phraseAnchor = nearestAnchor(anchors, event, ['phrase', 'word'], 0.9)
      const delta = phraseAnchor ? (event.hitTimeSeconds ?? event.startTimeSeconds) - phraseAnchor.timeSeconds : 0
      const forcedLate = event.notes.some((note) => note.includes('force_stroke_motion_late'))

      return forcedLate || (phraseAnchor && delta > 0.25)
        ? [createTimingConflict(
            masterTimingMap,
            'stroke_motion_late',
            'medium',
            pointRange(event.hitTimeSeconds ?? event.startTimeSeconds),
            `Stroke Motion completion "${event.label}" lands after the phrase meaning.`,
            'Signature animation should land on meaning before the viewer moves on.',
            'shift_earlier',
            [event],
            phraseAnchor ? [phraseAnchor] : [],
          )]
        : []
    })

  const tooFast = strokeEvents
    .filter((event) => event.eventType === 'stroke_motion_beat' && event.durationSeconds > 0 && event.durationSeconds < 0.55)
    .map((event) => createTimingConflict(
      masterTimingMap,
      'stroke_motion_too_fast',
      'medium',
      { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
      `Stroke Motion beat "${event.label}" is too fast to understand.`,
      'Stroke Motion should be fast, but not so fast that the story becomes unclear.',
      'extend_duration',
      [event],
    ))

  const captionOverlaps = strokeEvents
    .filter((event) => event.eventType === 'stroke_motion_beat')
    .flatMap((event) =>
      captionEvents
        .filter((caption) => caption.eventType === 'caption_on' && eventsOverlap(event, caption))
        .map((caption) => createTimingConflict(
          masterTimingMap,
          'stroke_motion_caption_overlap',
          'medium',
          {
            startSeconds: Math.max(event.startTimeSeconds, caption.startTimeSeconds),
            endSeconds: Math.min(event.endTimeSeconds, caption.endTimeSeconds),
          },
          `Stroke Motion "${event.label}" overlaps caption "${caption.label}".`,
          'Stroke Motion should not cover captions or faces when readability matters.',
          'reduce_overlap',
          [event, caption],
        )),
    )

  return [...lateCompletions, ...tooFast, ...captionOverlaps]
}

export function createStrokeMotionTimingSummary(events: TimingEventRecord[], dependencies: TimingDependencyRecord[]): string {
  const completions = events.filter((event) => event.eventType === 'stroke_motion_complete').length
  return `${events.length} Stroke Motion timing event(s) created, including ${completions} completion point(s), with ${dependencies.length} word/SFX sync dependency/dependencies.`
}
