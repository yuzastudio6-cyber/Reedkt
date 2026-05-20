import type { EditComplexity, SignatureRouteRecord } from '../../types/planning'
import type {
  GraphicDesignTimingRole,
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'
import { estimateGraphicReadabilityDuration } from './storytiming-signature-readability-service'

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

const createGraphicAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord | undefined,
  route: SignatureRouteRecord,
  input: {
    anchorType: 'graphic_reveal' | 'graphic_hide'
    label: string
    timeSeconds: number
    notes: string[]
  },
): TimingAnchorRecord => ({
  id: createMockId('graphic-signature-anchor'),
  masterTimingMapId: masterTimingMap.id,
  projectId: masterTimingMap.projectId,
  editPlanId: masterTimingMap.editPlanId,
  segmentId: segment?.id,
  sourceSystem: 'graphic_design',
  sourceRecordId: route.id,
  sourceRef: {
    sourceSystem: 'graphic_design',
    sourceRecordId: route.id,
    sourceTableName: 'signature_routes',
    label: input.label,
  },
  anchorType: input.anchorType,
  anchorLabel: input.label,
  anchorText: route.reason,
  timeSeconds: input.timeSeconds,
  frameNumber: Math.round(input.timeSeconds * masterTimingMap.frameRate),
  importance: input.anchorType === 'graphic_reveal' ? 'high' : 'medium',
  primaryAuthority: 'visual_comprehension',
  syncMode: 'phrase_locked',
  locked: false,
  notes: input.notes,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: { mockOnly: true },
})

const createGraphicEvent = (
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord | undefined,
  anchors: TimingAnchorRecord[],
  route: SignatureRouteRecord,
  input: {
    role: GraphicDesignTimingRole
    eventType: 'graphic_reveal' | 'graphic_hide'
    label: string
    startTimeSeconds: number
    endTimeSeconds: number
    notes: string[]
  },
): TimingEventRecord => {
  const anchor = anchors.find(
    (candidate) =>
      candidate.sourceSystem === 'graphic_design' &&
      candidate.sourceRecordId === route.id &&
      Math.abs(candidate.timeSeconds - input.startTimeSeconds) <= 0.2,
  )

  return {
    id: createMockId('graphic-signature-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    anchorId: anchor?.id,
    sourceSystem: 'graphic_design',
    sourceRecordId: route.id,
    sourceRef: {
      sourceSystem: 'graphic_design',
      sourceRecordId: route.id,
      sourceTableName: 'signature_routes',
      label: input.label,
    },
    eventType: input.eventType,
    trackType: 'graphic_design',
    label: input.label,
    startTimeSeconds: input.startTimeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    durationSeconds: Math.max(0, input.endTimeSeconds - input.startTimeSeconds),
    frameStart: Math.round(input.startTimeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(input.endTimeSeconds * masterTimingMap.frameRate),
    priority: input.role === 'hide' ? 'medium' : 'high',
    syncMode: input.role === 'hide' ? 'loose' : 'phrase_locked',
    canShift: true,
    locked: false,
    visibilityLayer: `graphic_design_${input.role}`,
    signatureSystem: 'graphic_design',
    notes: [...input.notes, `graphic_timing_role:${input.role}`],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }
}

const listItemLabelsForRoute = (route: SignatureRouteRecord): string[] => {
  const values = route.metadata?.listItemLabels
  return Array.isArray(values) ? values.map(String) : []
}

export function createGraphicDesignTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
): TimingAnchorRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'graphic_design')
    .flatMap((route) => {
      const segment = findSegmentForRoute(segments, route)
      return [
        createGraphicAnchor(masterTimingMap, segment, route, {
          anchorType: 'graphic_reveal',
          label: `${route.reason} reveal`,
          timeSeconds: route.timing.startSeconds,
          notes: ['Graphic reveal should start when the idea is introduced.'],
        }),
        createGraphicAnchor(masterTimingMap, segment, route, {
          anchorType: 'graphic_hide',
          label: `${route.reason} hide`,
          timeSeconds: route.timing.endSeconds,
          notes: ['Graphic hide should happen before the next idea becomes crowded.'],
        }),
      ]
    })
}

export function createGraphicDesignRevealEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
  editComplexity: EditComplexity = 'pro_edit',
): TimingEventRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'graphic_design')
    .flatMap((route) => {
      const segment = findSegmentForRoute(segments, route)
      const listItems = listItemLabelsForRoute(route)
      const minReadableDuration = estimateGraphicReadabilityDuration(route.reason, editComplexity)
      const forceShortReadable = route.metadata?.forceShortReadable === true
      const baseReveal = createGraphicEvent(masterTimingMap, segment, anchors, route, {
        role: route.reason.toLowerCase().includes('callout') ? 'callout' : 'card_reveal',
        eventType: 'graphic_reveal',
        label: route.reason,
        startTimeSeconds: route.timing.startSeconds,
        endTimeSeconds: forceShortReadable
          ? route.timing.endSeconds
          : Math.max(route.timing.endSeconds, route.timing.startSeconds + minReadableDuration),
        notes: [
          'Graphic Design reveal follows the concept introduction.',
          `min_readable_duration:${minReadableDuration.toFixed(2)}`,
        ],
      })

      const listEvents = listItems.map((label, index) => {
        const start = route.timing.startSeconds + 0.35 + index * 0.55
        return createGraphicEvent(masterTimingMap, segment, anchors, route, {
          role: 'list_item_reveal',
          eventType: 'graphic_reveal',
          label: `${label} list item reveal`,
          startTimeSeconds: start,
          endTimeSeconds: Math.min(route.timing.endSeconds, start + 1.4),
          notes: ['List item reveal should follow the matching spoken step phrase.'],
        })
      })

      return [baseReveal, ...listEvents]
    })
}

export function createGraphicDesignHideEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
): TimingEventRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'graphic_design')
    .map((route) => {
      const segment = findSegmentForRoute(segments, route)
      return createGraphicEvent(masterTimingMap, segment, anchors, route, {
        role: 'hide',
        eventType: 'graphic_hide',
        label: `${route.reason} hides`,
        startTimeSeconds: route.timing.endSeconds,
        endTimeSeconds: route.timing.endSeconds,
        notes: ['Graphic hides before the next idea becomes crowded.'],
      })
    })
}

export function createGraphicDesignTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
  signatureRoutes: SignatureRouteRecord[] = [],
  editComplexity: EditComplexity = 'pro_edit',
): TimingEventRecord[] {
  return [
    ...createGraphicDesignRevealEvents(masterTimingMap, segments, anchors, signatureRoutes, editComplexity),
    ...createGraphicDesignHideEvents(masterTimingMap, segments, anchors, signatureRoutes),
  ]
}

export function createGraphicDesignReadabilityDependencies(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[] = [],
  editComplexity: EditComplexity = 'pro_edit',
): TimingDependencyRecord[] {
  return events
    .filter((event) => event.trackType === 'graphic_design' && event.eventType === 'graphic_reveal')
    .map((event) => ({
      id: createMockId('graphic-readability-dependency'),
      masterTimingMapId: masterTimingMap.id,
      projectId: masterTimingMap.projectId,
      editPlanId: masterTimingMap.editPlanId,
      fromEventId: event.id,
      dependencyType: 'ends_after',
      minOffsetSeconds: estimateGraphicReadabilityDuration(event.label, editComplexity),
      required: true,
      reason: 'Graphic Design overlays must remain visible long enough to read.',
      notes: ['Readability and comprehension outrank decoration.'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    }))
}

export function detectGraphicDesignTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  events: TimingEventRecord[] = [],
  captionEvents: TimingEventRecord[] = [],
  editComplexity: EditComplexity = 'pro_edit',
): TimingConflictRecord[] {
  const graphicReveals = events.filter((event) => event.trackType === 'graphic_design' && event.eventType === 'graphic_reveal')
  const revealTimingConflicts = graphicReveals.flatMap((event) => {
    const segment = segments.find((candidate) => candidate.id === event.segmentId)
    const conflicts: TimingConflictRecord[] = []
    const forcedEarly = event.notes.some((note) => note.includes('force_graphic_reveal_early'))
    const forcedLate = event.notes.some((note) => note.includes('force_graphic_reveal_late'))

    if (forcedEarly || (segment && event.startTimeSeconds < segment.outputTimeRange.startSeconds - 0.15)) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'graphic_reveal_too_early',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Graphic "${event.label}" reveals before the idea is introduced.`,
        'VisualExplain should appear with the concept, not before context exists.',
        'shift_later',
        [event],
      ))
    }

    if (forcedLate || (segment?.hasSpeech && event.startTimeSeconds > segment.outputTimeRange.startSeconds + 1.6)) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'graphic_reveal_too_late',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Graphic "${event.label}" reveals after the spoken concept has moved on.`,
        'Educational and explainer graphics should support the idea while it is being introduced.',
        'shift_earlier',
        [event],
      ))
    }

    if (event.durationSeconds > 0 && event.durationSeconds < estimateGraphicReadabilityDuration(event.label, editComplexity)) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'graphic_not_readable_long_enough',
        'medium',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Graphic "${event.label}" does not stay up long enough to read.`,
        'Graphic Design should prioritize viewer comprehension and readable hierarchy.',
        'extend_duration',
        [event],
      ))
    }

    if (segment && event.endTimeSeconds > segment.outputTimeRange.endSeconds + 0.3) {
      conflicts.push(createTimingConflict(
        masterTimingMap,
        'graphic_stays_after_topic',
        'low',
        { startSeconds: event.startTimeSeconds, endSeconds: event.endTimeSeconds },
        `Graphic "${event.label}" stays after the segment topic changes.`,
        'Graphics should exit before the next idea becomes visually crowded.',
        'shorten_duration',
        [event],
      ))
    }

    return conflicts
  })

  const captionCollisions = graphicReveals.flatMap((graphic) =>
    captionEvents
      .filter((caption) => caption.eventType === 'caption_on' && eventsOverlap(graphic, caption))
      .map((caption) => createTimingConflict(
        masterTimingMap,
        'caption_overlay_collision',
        'medium',
        {
          startSeconds: Math.max(graphic.startTimeSeconds, caption.startTimeSeconds),
          endSeconds: Math.min(graphic.endTimeSeconds, caption.endTimeSeconds),
        },
        `Graphic "${graphic.label}" overlaps caption "${caption.label}".`,
        'Captions must stay above graphics and remain readable.',
        'reduce_overlap',
        [graphic, caption],
      )),
  )

  return [...revealTimingConflicts, ...captionCollisions]
}

export function createGraphicDesignTimingSummary(events: TimingEventRecord[], dependencies: TimingDependencyRecord[]): string {
  const reveals = events.filter((event) => event.eventType === 'graphic_reveal').length
  const hides = events.filter((event) => event.eventType === 'graphic_hide').length
  return `${reveals} Graphic Design reveal event(s), ${hides} hide event(s), and ${dependencies.length} readability dependency/dependencies were created.`
}
