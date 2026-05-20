import type { SignatureRouteRecord } from '../../types/planning'
import type {
  MasterTimingMapRecord,
  RealMotionTimingRole,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'
import {
  createRealMotionFaceSafetyDependency,
  detectRealMotionFaceSafetyRisk,
} from './storytiming-real-motion-face-safety-service'

const eventsOverlap = (a: TimingEventRecord, b: TimingEventRecord): boolean =>
  a.startTimeSeconds < b.endTimeSeconds && b.startTimeSeconds < a.endTimeSeconds

const findSegmentForRoute = (
  segments: StoryTimingSegmentRecord[],
  route: SignatureRouteRecord,
): StoryTimingSegmentRecord | undefined =>
  segments.find((segment) => segment.editPlanSegmentId === route.editPlanSegmentId) ??
  segments.find(
    (segment) =>
      route.timing.startSeconds >= segment.outputTimeRange.startSeconds &&
      route.timing.startSeconds <= segment.outputTimeRange.endSeconds,
  )

const settleTimeForRoute = (route: SignatureRouteRecord): number => {
  const explicitSettle = Number(route.metadata?.settleSeconds)
  if (Number.isFinite(explicitSettle) && explicitSettle > 0) {
    return explicitSettle
  }

  return Math.min(route.timing.endSeconds, route.timing.startSeconds + Math.max(0.65, (route.timing.endSeconds - route.timing.startSeconds) * 0.45))
}

const createRealMotionAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord | undefined,
  route: SignatureRouteRecord,
  input: {
    anchorType: 'real_motion_object_enter' | 'real_motion_object_settle' | 'real_motion_object_exit'
    label: string
    timeSeconds: number
    notes: string[]
  },
): TimingAnchorRecord => ({
  id: createMockId('real-motion-signature-anchor'),
  masterTimingMapId: masterTimingMap.id,
  projectId: masterTimingMap.projectId,
  editPlanId: masterTimingMap.editPlanId,
  segmentId: segment?.id,
  sourceSystem: 'real_motion',
  sourceRecordId: route.id,
  sourceRef: {
    sourceSystem: 'real_motion',
    sourceRecordId: route.id,
    sourceTableName: 'signature_routes',
    label: input.label,
  },
  anchorType: input.anchorType,
  anchorLabel: input.label,
  anchorText: route.reason,
  timeSeconds: input.timeSeconds,
  frameNumber: Math.round(input.timeSeconds * masterTimingMap.frameRate),
  importance: input.anchorType === 'real_motion_object_settle' ? 'high' : 'medium',
  primaryAuthority: input.anchorType === 'real_motion_object_settle' ? 'visual_comprehension' : 'signature_animation',
  syncMode: 'visual_motion_locked',
  locked: false,
  notes: input.notes,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: { mockOnly: true },
})

const createRealMotionEvent = (
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord | undefined,
  anchors: TimingAnchorRecord[],
  route: SignatureRouteRecord,
  input: {
    role: RealMotionTimingRole
    eventType: 'real_motion_enter' | 'real_motion_move' | 'real_motion_settle' | 'real_motion_exit'
    label: string
    startTimeSeconds: number
    hitTimeSeconds?: number
    endTimeSeconds: number
    notes: string[]
  },
): TimingEventRecord => {
  const time = input.hitTimeSeconds ?? input.startTimeSeconds
  const anchor = anchors.find(
    (candidate) =>
      candidate.sourceSystem === 'real_motion' &&
      candidate.sourceRecordId === route.id &&
      Math.abs(candidate.timeSeconds - time) <= 0.2,
  )

  return {
    id: createMockId('real-motion-signature-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    anchorId: anchor?.id,
    sourceSystem: 'real_motion',
    sourceRecordId: route.id,
    sourceRef: {
      sourceSystem: 'real_motion',
      sourceRecordId: route.id,
      sourceTableName: 'signature_routes',
      label: input.label,
    },
    eventType: input.eventType,
    trackType: 'real_motion',
    label: input.label,
    startTimeSeconds: input.startTimeSeconds,
    hitTimeSeconds: input.hitTimeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    durationSeconds: Math.max(0, input.endTimeSeconds - input.startTimeSeconds),
    frameStart: Math.round(input.startTimeSeconds * masterTimingMap.frameRate),
    frameHit: input.hitTimeSeconds === undefined ? undefined : Math.round(input.hitTimeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(input.endTimeSeconds * masterTimingMap.frameRate),
    priority: input.eventType === 'real_motion_settle' ? 'high' : 'medium',
    syncMode: 'visual_motion_locked',
    canShift: true,
    locked: false,
    visibilityLayer: `real_motion_${input.role}`,
    signatureSystem: 'real_motion',
    notes: [...input.notes, `real_motion_timing_role:${input.role}`],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

export function createRealMotionTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
): TimingAnchorRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'real_motion')
    .flatMap((route) => {
      const segment = findSegmentForRoute(segments, route)
      const settleSeconds = settleTimeForRoute(route)
      return [
        createRealMotionAnchor(masterTimingMap, segment, route, {
          anchorType: 'real_motion_object_enter',
          label: `${route.reason} object enters`,
          timeSeconds: route.timing.startSeconds,
          notes: ['Real Motion enters after the object, place, or concept is introduced.'],
        }),
        createRealMotionAnchor(masterTimingMap, segment, route, {
          anchorType: 'real_motion_object_settle',
          label: `${route.reason} object settles`,
          timeSeconds: settleSeconds,
          notes: ['Real Motion settles when viewer attention should focus on the object.'],
        }),
        createRealMotionAnchor(masterTimingMap, segment, route, {
          anchorType: 'real_motion_object_exit',
          label: `${route.reason} object exits`,
          timeSeconds: route.timing.endSeconds,
          notes: ['Real Motion exits before it distracts from the next idea.'],
        }),
      ]
    })
}

export function createRealMotionEnterMoveSettleEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
): TimingEventRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'real_motion')
    .flatMap((route) => {
      const segment = findSegmentForRoute(segments, route)
      const settleSeconds = settleTimeForRoute(route)
      return [
        createRealMotionEvent(masterTimingMap, segment, anchors, route, {
          role: 'object_enter',
          eventType: 'real_motion_enter',
          label: `${route.reason} enters`,
          startTimeSeconds: route.timing.startSeconds,
          hitTimeSeconds: route.timing.startSeconds,
          endTimeSeconds: route.timing.startSeconds,
          notes: ['Object enters when mentioned, not as random decoration.'],
        }),
        createRealMotionEvent(masterTimingMap, segment, anchors, route, {
          role: 'object_move',
          eventType: 'real_motion_move',
          label: `${route.reason} moves/scales`,
          startTimeSeconds: route.timing.startSeconds,
          hitTimeSeconds: settleSeconds,
          endTimeSeconds: settleSeconds,
          notes: ['Object movement and scale should follow meaning and remain integrated in the base footage.'],
        }),
        createRealMotionEvent(masterTimingMap, segment, anchors, route, {
          role: 'object_settle',
          eventType: 'real_motion_settle',
          label: `${route.reason} settles`,
          startTimeSeconds: settleSeconds,
          hitTimeSeconds: settleSeconds,
          endTimeSeconds: Math.min(route.timing.endSeconds, settleSeconds + 1.2),
          notes: ['Settle moment can receive subtle object movement SFX when useful.'],
        }),
        createRealMotionEvent(masterTimingMap, segment, anchors, route, {
          role: 'object_exit',
          eventType: 'real_motion_exit',
          label: `${route.reason} exits`,
          startTimeSeconds: route.timing.endSeconds,
          hitTimeSeconds: route.timing.endSeconds,
          endTimeSeconds: route.timing.endSeconds,
          notes: ['Exit before the overlay distracts from the next idea.'],
        }),
      ]
    })
}

export function createRealMotionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
): TimingEventRecord[] {
  return createRealMotionEnterMoveSettleEvents(masterTimingMap, segments, anchors, signatureRoutes)
}

export function createRealMotionFaceSafetyDependencies(
  masterTimingMap: MasterTimingMapRecord,
  realMotionEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return realMotionEvents
    .filter((event) => event.trackType === 'real_motion')
    .map((event) => createRealMotionFaceSafetyDependency(masterTimingMap, event))
}

export function createRealMotionSFXSyncDependencies(
  masterTimingMap: MasterTimingMapRecord,
  realMotionEvents: TimingEventRecord[] = [],
  sfxEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  const settleEvents = realMotionEvents.filter((event) => event.eventType === 'real_motion_settle')

  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const hit = sfxEvent.hitTimeSeconds ?? sfxEvent.startTimeSeconds
      const settleEvent = settleEvents.find((event) => Math.abs((event.hitTimeSeconds ?? event.startTimeSeconds) - hit) <= 0.18)

      return settleEvent
        ? [{
            id: createMockId('real-motion-sfx-sync-dependency'),
            masterTimingMapId: masterTimingMap.id,
            projectId: masterTimingMap.projectId,
            editPlanId: masterTimingMap.editPlanId,
            fromEventId: sfxEvent.id,
            toEventId: settleEvent.id,
            dependencyType: 'hit_on_same_frame',
            maxOffsetSeconds: 0.08,
            required: false,
            reason: 'Real Motion object SFX should land when the object settles.',
            notes: ['SFX must stay subtle and voice-safe.'],
            createdAt: nowIso(),
            updatedAt: nowIso(),
            metadata: { mockOnly: true },
          }]
        : []
    })
}

export function detectRealMotionTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
  events: TimingEventRecord[] = [],
  captionEvents: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion')
  const routeById = new Map(signatureRoutes.map((route) => [route.id, route]))
  const conflicts: TimingConflictRecord[] = []

  realMotionEvents.forEach((event) => {
    const route = event.sourceRecordId ? routeById.get(event.sourceRecordId) : undefined
    const segment = segments.find((candidate) => candidate.id === event.segmentId)
    const risk = detectRealMotionFaceSafetyRisk(route, event)

    if (event.eventType === 'real_motion_enter' && segment && event.startTimeSeconds < segment.outputTimeRange.startSeconds - 0.15) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'real_motion_enters_too_early',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Real Motion "${event.label}" enters before the concept is introduced.`,
        'Real Motion should enter when the object, place, or concept is introduced.',
        'shift_later',
        [event],
      ))
    }

    if (event.eventType === 'real_motion_settle' && segment?.hasSpeech && event.startTimeSeconds > segment.outputTimeRange.startSeconds + 2.2) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'real_motion_settles_late',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Real Motion "${event.label}" settles after the speaker needs attention on it.`,
        'The object should settle while the concept is still active in viewer comprehension.',
        'shift_earlier',
        [event],
      ))
    }

    if (risk === 'face_blocking' || event.notes.some((note) => note.includes('force_face_block'))) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'real_motion_blocks_face',
        'high',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Real Motion "${event.label}" may block the speaker face.`,
        'Real Motion is premium, but face and trust cues remain protected.',
        'reduce_overlap',
        [event],
      ))
    }

    if (event.notes.some((note) => note.includes('object_blocking'))) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'real_motion_blocks_object',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Real Motion "${event.label}" may block an important source object.`,
        'Real Motion should support proof and demonstrations without covering the source evidence.',
        'reduce_overlap',
        [event],
      ))
    }
  })

  const captionCollisions = realMotionEvents.flatMap((realMotion) =>
    captionEvents
      .filter((caption) => caption.eventType === 'caption_on' && eventsOverlap(realMotion, caption))
      .map((caption) => createTimingConflict(
        masterTimingMap,
        'caption_overlay_collision',
        'high',
        {
          startSeconds: Math.max(realMotion.startTimeSeconds, caption.startTimeSeconds),
          endSeconds: Math.min(realMotion.endTimeSeconds, caption.endTimeSeconds),
        },
        `Real Motion "${realMotion.label}" overlaps caption "${caption.label}".`,
        'Captions remain top layer and must stay readable around realistic overlays.',
        'reduce_overlap',
        [realMotion, caption],
      )),
  )

  return [...conflicts, ...captionCollisions]
}

export function createRealMotionTimingSummary(events: TimingEventRecord[], dependencies: TimingDependencyRecord[]): string {
  const enter = events.filter((event) => event.eventType === 'real_motion_enter').length
  const settle = events.filter((event) => event.eventType === 'real_motion_settle').length
  return `${enter} Real Motion enter event(s), ${settle} settle event(s), and ${dependencies.length} face/SFX dependency/dependencies were created.`
}
