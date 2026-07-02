import type {
  SFXEventPlanRecord,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
} from '../../types/sfx-director'
import type {
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

const findSegmentForTime = (
  segments: StoryTimingSegmentRecord[],
  timeSeconds: number,
): StoryTimingSegmentRecord | undefined =>
  segments.find(
    (segment) =>
      timeSeconds >= segment.outputTimeRange.startSeconds &&
      timeSeconds <= segment.outputTimeRange.endSeconds,
  )

const eventPlanForAlignment = (
  alignment: SFXTimingAlignmentRecord,
  eventPlans: SFXEventPlanRecord[] = [],
): SFXEventPlanRecord | undefined => eventPlans.find((plan) => plan.id === alignment.sfxEventPlanId)

const createSFXAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  input: {
    sourceSystem: 'sfx_alignment' | 'sfx_event' | 'sfx_trim'
    sourceRecordId: string
    sourceTableName: string
    anchorType: 'sfx_hit' | 'sfx_tail'
    label: string
    timeSeconds: number
    endTimeSeconds?: number
    locked?: boolean
    notes: string[]
  },
): TimingAnchorRecord => {
  const segment = findSegmentForTime(segments, input.timeSeconds)

  return {
    id: createMockId('sfx-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: input.sourceSystem,
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: input.sourceSystem,
      sourceRecordId: input.sourceRecordId,
      sourceTableName: input.sourceTableName,
      label: input.label,
    },
    anchorType: input.anchorType,
    anchorLabel: input.label,
    timeSeconds: input.timeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    frameNumber: Math.round(input.timeSeconds * masterTimingMap.frameRate),
    importance: input.anchorType === 'sfx_hit' ? 'high' : 'medium',
    primaryAuthority: 'sfx_hit',
    syncMode: input.anchorType === 'sfx_hit' ? 'frame_locked' : 'loose',
    locked: input.locked ?? false,
    notes: input.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
    },
  }
}

const createSFXEvent = (
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  input: {
    sourceSystem: 'sfx_alignment' | 'sfx_event'
    sourceRecordId: string
    sourceTableName: string
    eventType: 'sfx_start' | 'sfx_hit' | 'sfx_end'
    label: string
    startTimeSeconds: number
    hitTimeSeconds?: number
    endTimeSeconds: number
    locked?: boolean
    notes: string[]
  },
): TimingEventRecord => {
  const time = input.hitTimeSeconds ?? input.startTimeSeconds
  const segment = findSegmentForTime(segments, time)

  return {
    id: createMockId('sfx-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: input.sourceSystem,
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: input.sourceSystem,
      sourceRecordId: input.sourceRecordId,
      sourceTableName: input.sourceTableName,
      label: input.label,
    },
    eventType: input.eventType,
    trackType: 'sfx',
    label: input.label,
    startTimeSeconds: input.startTimeSeconds,
    hitTimeSeconds: input.hitTimeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    durationSeconds: Math.max(0, input.endTimeSeconds - input.startTimeSeconds),
    frameStart: Math.round(input.startTimeSeconds * masterTimingMap.frameRate),
    frameHit: input.hitTimeSeconds === undefined ? undefined : Math.round(input.hitTimeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(input.endTimeSeconds * masterTimingMap.frameRate),
    priority: input.eventType === 'sfx_hit' ? 'high' : 'medium',
    syncMode: input.eventType === 'sfx_hit' ? 'frame_locked' : 'loose',
    canShift: input.locked !== true,
    locked: input.locked ?? false,
    audioLayer: 'sfx',
    notes: input.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
    },
  }
}

export function createSFXTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  sfxEventPlans: SFXEventPlanRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
  sfxTrimPlans: SFXTrimPlanRecord[] = [],
): TimingAnchorRecord[] {
  const alignedAnchors = sfxTimingAlignments.flatMap((alignment) => {
    const eventPlan = eventPlanForAlignment(alignment, sfxEventPlans)
    return [
      createSFXAnchor(masterTimingMap, segments, {
        sourceSystem: 'sfx_alignment',
        sourceRecordId: alignment.id,
        sourceTableName: 'sfx_timing_alignments',
        anchorType: 'sfx_hit',
        label: `${eventPlan?.userVisibleSummary ?? alignment.anchorType} SFX hit`,
        timeSeconds: alignment.hitTimeSeconds,
        endTimeSeconds: alignment.endTimeSeconds,
        locked: alignment.frameAccurateRequired,
        notes: alignment.notes,
      }),
      createSFXAnchor(masterTimingMap, segments, {
        sourceSystem: 'sfx_alignment',
        sourceRecordId: alignment.id,
        sourceTableName: 'sfx_timing_alignments',
        anchorType: 'sfx_tail',
        label: `${eventPlan?.userVisibleSummary ?? alignment.anchorType} SFX tail`,
        timeSeconds: alignment.endTimeSeconds,
        endTimeSeconds: alignment.endTimeSeconds + alignment.tailMs / 1000,
        notes: alignment.notes,
      }),
    ]
  })

  const fallbackAnchors = sfxEventPlans
    .filter((eventPlan) => !sfxTimingAlignments.some((alignment) => alignment.sfxEventPlanId === eventPlan.id))
    .map((eventPlan) =>
      createSFXAnchor(masterTimingMap, segments, {
        sourceSystem: 'sfx_event',
        sourceRecordId: eventPlan.id,
        sourceTableName: 'sfx_event_plans',
        anchorType: 'sfx_hit',
        label: eventPlan.userVisibleSummary,
        timeSeconds: eventPlan.hitTimeSeconds ?? eventPlan.anchorTimeSeconds,
        endTimeSeconds: eventPlan.endTimeSeconds,
        notes: [
          'SFX timing alignment was missing; fallback event-plan anchor used.',
          ...eventPlan.notes,
        ],
      }),
    )

  const trimTailAnchors = sfxTrimPlans.map((trimPlan) =>
    createSFXAnchor(masterTimingMap, segments, {
      sourceSystem: 'sfx_trim',
      sourceRecordId: trimPlan.id,
      sourceTableName: 'sfx_trim_plans',
      anchorType: 'sfx_tail',
      label: `SFX trim tail ${trimPlan.tailMs}ms`,
      timeSeconds: trimPlan.trimEndSeconds,
      endTimeSeconds: trimPlan.trimEndSeconds + trimPlan.tailMs / 1000,
      notes: [trimPlan.reason, ...trimPlan.notes],
    }),
  )

  return [...alignedAnchors, ...fallbackAnchors, ...trimTailAnchors]
}

export function createSFXStartHitEndEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  sfxEventPlans: SFXEventPlanRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
): TimingEventRecord[] {
  const alignedEvents = sfxTimingAlignments.flatMap((alignment) => {
    const eventPlan = eventPlanForAlignment(alignment, sfxEventPlans)
    const label = eventPlan?.userVisibleSummary ?? `${alignment.anchorType} SFX`
    const notes = [
      ...alignment.notes,
      eventPlan?.mixPriority === 'voice_first' ? 'voice_first_sfx' : '',
    ].filter(Boolean)

    return [
      createSFXEvent(masterTimingMap, segments, {
        sourceSystem: 'sfx_alignment',
        sourceRecordId: alignment.id,
        sourceTableName: 'sfx_timing_alignments',
        eventType: 'sfx_start',
        label: `${label} starts`,
        startTimeSeconds: alignment.startTimeSeconds,
        endTimeSeconds: alignment.startTimeSeconds,
        notes,
      }),
      createSFXEvent(masterTimingMap, segments, {
        sourceSystem: 'sfx_alignment',
        sourceRecordId: alignment.id,
        sourceTableName: 'sfx_timing_alignments',
        eventType: 'sfx_hit',
        label: `${label} hit`,
        startTimeSeconds: alignment.hitTimeSeconds,
        hitTimeSeconds: alignment.hitTimeSeconds,
        endTimeSeconds: alignment.hitTimeSeconds,
        locked: alignment.frameAccurateRequired,
        notes,
      }),
      createSFXEvent(masterTimingMap, segments, {
        sourceSystem: 'sfx_alignment',
        sourceRecordId: alignment.id,
        sourceTableName: 'sfx_timing_alignments',
        eventType: 'sfx_end',
        label: `${label} ends`,
        startTimeSeconds: alignment.endTimeSeconds,
        endTimeSeconds: alignment.endTimeSeconds,
        notes,
      }),
    ]
  })

  const fallbackEvents = sfxEventPlans
    .filter((eventPlan) => !sfxTimingAlignments.some((alignment) => alignment.sfxEventPlanId === eventPlan.id))
    .flatMap((eventPlan) => {
      const hit = eventPlan.hitTimeSeconds ?? eventPlan.anchorTimeSeconds
      const start = eventPlan.startTimeSeconds ?? Math.max(0, hit - 0.25)
      const end = eventPlan.endTimeSeconds ?? hit + 0.55

      return [
        createSFXEvent(masterTimingMap, segments, {
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_start',
          label: `${eventPlan.userVisibleSummary} starts`,
          startTimeSeconds: start,
          endTimeSeconds: start,
          notes: ['Fallback from SFX event plan because no timing alignment was available.', ...eventPlan.notes],
        }),
        createSFXEvent(masterTimingMap, segments, {
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_hit',
          label: `${eventPlan.userVisibleSummary} hit`,
          startTimeSeconds: hit,
          hitTimeSeconds: hit,
          endTimeSeconds: hit,
          notes: ['Fallback from SFX event plan because no timing alignment was available.', ...eventPlan.notes],
        }),
        createSFXEvent(masterTimingMap, segments, {
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_end',
          label: `${eventPlan.userVisibleSummary} ends`,
          startTimeSeconds: end,
          endTimeSeconds: end,
          notes: ['Fallback from SFX event plan because no timing alignment was available.', ...eventPlan.notes],
        }),
      ]
    })

  return [...alignedEvents, ...fallbackEvents]
}

export function createSFXTailEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
): TimingEventRecord[] {
  return sfxTimingAlignments.map((alignment) =>
    createSFXEvent(masterTimingMap, segments, {
      sourceSystem: 'sfx_alignment',
      sourceRecordId: alignment.id,
      sourceTableName: 'sfx_timing_alignments',
      eventType: 'sfx_end',
      label: `${alignment.anchorType} SFX tail safety marker`,
      startTimeSeconds: alignment.endTimeSeconds,
      endTimeSeconds: alignment.endTimeSeconds,
      notes: ['Tail safety marker; no real audio processing occurred.', ...alignment.notes],
    }),
  )
}

export function createSFXTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  sfxEventPlans: SFXEventPlanRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
): TimingEventRecord[] {
  return createSFXStartHitEndEvents(masterTimingMap, segments, sfxEventPlans, sfxTimingAlignments)
}

export function createSFXTimingDependencies(
  masterTimingMap: MasterTimingMapRecord,
  sfxAnchors: TimingAnchorRecord[],
  sfxEvents: TimingEventRecord[],
): TimingDependencyRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      const anchor = sfxAnchors.find(
        (candidate) =>
          candidate.anchorType === 'sfx_hit' &&
          Math.abs(candidate.timeSeconds - (event.hitTimeSeconds ?? event.startTimeSeconds)) <= 0.12,
      )

      return anchor
        ? [{
            id: createMockId('sfx-dependency'),
            masterTimingMapId: masterTimingMap.id,
            projectId: masterTimingMap.projectId,
            editPlanId: masterTimingMap.editPlanId,
            fromEventId: event.id,
            toAnchorId: anchor.id,
            dependencyType: 'sync_to_anchor',
            maxOffsetSeconds: 0.08,
            required: true,
            reason: 'SFX hit should align to the SoundSync timing anchor.',
            notes: ['Mock dependency; source SFX timing records remain unchanged.'],
            createdAt: nowIso(),
            updatedAt: nowIso(),
            metadata: {},
          }]
        : []
    })
}

export function createSFXTimingSummary(sfxEvents: TimingEventRecord[], sfxAnchors: TimingAnchorRecord[]): string {
  return `${sfxEvents.length} SFX timing event(s) and ${sfxAnchors.length} SFX anchor(s) were connected to StoryTiming.`
}
