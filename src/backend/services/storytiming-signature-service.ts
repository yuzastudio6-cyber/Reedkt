import type {
  CreateSignatureTimingPlansRequest,
  CreateSignatureTimingPlansResponse,
} from '../contracts/storytiming-contracts'
import type { SignatureRouteRecord } from '../../types/planning'
import type {
  MasterTimingMapRecord,
  SignatureOverlaySafetyRisk,
  SignatureTimingMode,
  SignatureTimingPlanRecord,
  StoryTimingQACheckRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { StrokeMotionPlanRecord } from '../../types/stroke-motion'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import {
  createStrokeMotionSFXSyncDependencies,
  createStrokeMotionTimingAnchors,
  createStrokeMotionTimingEvents,
  createStrokeMotionTimingSummary,
  createStrokeMotionWordSyncDependencies,
  detectStrokeMotionTimingConflicts,
} from './storytiming-stroke-motion-service'
import {
  createGraphicDesignReadabilityDependencies,
  createGraphicDesignTimingAnchors,
  createGraphicDesignTimingEvents,
  createGraphicDesignTimingSummary,
  detectGraphicDesignTimingConflicts,
} from './storytiming-graphic-design-service'
import {
  createRealMotionFaceSafetyDependencies,
  createRealMotionSFXSyncDependencies,
  createRealMotionTimingAnchors,
  createRealMotionTimingEvents,
  createRealMotionTimingSummary,
  detectRealMotionTimingConflicts,
} from './storytiming-real-motion-service'
import {
  createSignatureSFXSyncDependencies,
  createSignatureSFXSyncSummary,
  detectSignatureSFXTimingConflicts,
} from './storytiming-signature-sfx-sync-service'
import {
  createSignatureOverlayConflictSummary,
  detectSignatureOverlayConflicts,
} from './storytiming-signature-overlay-conflict-service'
import {
  createSignatureTimingQASummary,
  runSignatureTimingQA,
} from './storytiming-signature-qa-service'
import { detectRealMotionFaceSafetyRisk } from './storytiming-real-motion-face-safety-service'

const visualSignatureRoutes = (routes: SignatureRouteRecord[] = []): SignatureRouteRecord[] =>
  routes.filter(
    (route) =>
      route.signatureSystem === 'stroke_motion' ||
      route.signatureSystem === 'graphic_design' ||
      route.signatureSystem === 'real_motion',
  )

const findSegmentForRoute = (
  segments: StoryTimingSegmentRecord[] = [],
  route?: SignatureRouteRecord,
): StoryTimingSegmentRecord | undefined =>
  route
    ? segments.find((segment) => segment.editPlanSegmentId === route.editPlanSegmentId) ??
      segments.find(
        (segment) =>
          route.timing.startSeconds >= segment.outputTimeRange.startSeconds &&
          route.timing.startSeconds <= segment.outputTimeRange.endSeconds,
      )
    : undefined

const inferTimingMode = (
  segment: StoryTimingSegmentRecord | undefined,
  route: SignatureRouteRecord | undefined,
  strokePlan?: StrokeMotionPlanRecord,
): SignatureTimingMode => {
  if (route?.signatureSystem === 'stroke_motion' || strokePlan) {
    return segment?.preserveEmotionalPause ? 'emotion_locked' : 'phrase_locked'
  }

  if (segment?.primaryAuthority === 'music_rhythm') {
    return 'music_synced'
  }

  if (segment?.primaryAuthority === 'emotional_timing') {
    return 'emotion_locked'
  }

  if (route?.signatureSystem === 'real_motion') {
    return 'visual_motion_locked'
  }

  if (route?.signatureSystem === 'graphic_design') {
    return segment?.hasSpeech ? 'phrase_locked' : 'story_beat_locked'
  }

  return 'loose_support'
}

const captionRiskForPlan = (
  route: SignatureRouteRecord | undefined,
  events: TimingEventRecord[],
  conflicts: TimingConflictRecord[],
): SignatureOverlaySafetyRisk => {
  const routeEventIds = new Set(events.filter((event) => event.sourceRecordId === route?.id).map((event) => event.id))
  const hasCaptionConflict = conflicts.some(
    (conflict) =>
      (conflict.conflictType === 'caption_overlay_collision' || conflict.conflictType === 'stroke_motion_caption_overlap') &&
      conflict.relatedEventIds.some((eventId) => routeEventIds.has(eventId)),
  )

  if (hasCaptionConflict) return 'caption_overlap'
  return 'none'
}

const planEventIdsForRoute = (route: SignatureRouteRecord, events: TimingEventRecord[]): string[] =>
  events.filter((event) => event.sourceRecordId === route.id).map((event) => event.id)

const planAnchorIdsForRoute = (route: SignatureRouteRecord, anchors: TimingAnchorRecord[]): string[] =>
  anchors.filter((anchor) => anchor.sourceRecordId === route.id).map((anchor) => anchor.id)

const planSFXEventIds = (events: TimingEventRecord[], signatureEvents: TimingEventRecord[]): string[] => {
  const signatureTimes = signatureEvents.map((event) => event.hitTimeSeconds ?? event.startTimeSeconds)
  return events
    .filter((event) => event.eventType === 'sfx_hit')
    .filter((event) => signatureTimes.some((time) => Math.abs((event.hitTimeSeconds ?? event.startTimeSeconds) - time) <= 0.18))
    .map((event) => event.id)
}

export function createSignatureTimingAnchors(
  request: CreateSignatureTimingPlansRequest,
): TimingAnchorRecord[] {
  return [
    ...createStrokeMotionTimingAnchors(
      request.masterTimingMap,
      request.segments,
      request.strokeMotionBeats,
      request.strokeMotionTimingAnchors,
    ),
    ...createGraphicDesignTimingAnchors(
      request.masterTimingMap,
      request.segments,
      request.signatureRoutes,
    ),
    ...createRealMotionTimingAnchors(
      request.masterTimingMap,
      request.segments,
      request.signatureRoutes,
    ),
  ]
}

export function createSignatureTimingEvents(
  request: CreateSignatureTimingPlansRequest,
  anchors: TimingAnchorRecord[],
): TimingEventRecord[] {
  return [
    ...createStrokeMotionTimingEvents(
      request.masterTimingMap,
      request.segments,
      anchors,
      request.strokeMotionBeats,
    ),
    ...createGraphicDesignTimingEvents(
      request.masterTimingMap,
      request.segments,
      anchors,
      request.signatureRoutes,
      request.editComplexity,
    ),
    ...createRealMotionTimingEvents(
      request.masterTimingMap,
      request.segments,
      anchors,
      request.signatureRoutes,
    ),
  ].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.label.localeCompare(b.label))
}

export function createSignatureTimingDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  signatureEvents: TimingEventRecord[],
  sfxEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return [
    ...createStrokeMotionWordSyncDependencies(masterTimingMap, anchors, signatureEvents),
    ...createStrokeMotionSFXSyncDependencies(masterTimingMap, signatureEvents, sfxEvents),
    ...createGraphicDesignReadabilityDependencies(masterTimingMap, signatureEvents),
    ...createRealMotionFaceSafetyDependencies(masterTimingMap, signatureEvents),
    ...createRealMotionSFXSyncDependencies(masterTimingMap, signatureEvents, sfxEvents),
    ...createSignatureSFXSyncDependencies(masterTimingMap, signatureEvents, sfxEvents),
  ]
}

export function createSignatureTimingPlans(input: {
  masterTimingMap: MasterTimingMapRecord
  segments: StoryTimingSegmentRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  strokeMotionPlans?: StrokeMotionPlanRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  sfxEvents: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}): SignatureTimingPlanRecord[] {
  const routePlans = visualSignatureRoutes(input.signatureRoutes).map((route) => {
    const segment = findSegmentForRoute(input.segments, route)
    const routeEvents = input.events.filter((event) => event.sourceRecordId === route.id)
    const faceSafetyRisk = route.signatureSystem === 'real_motion'
      ? detectRealMotionFaceSafetyRisk(route, routeEvents[0])
      : undefined

    return {
      id: createMockId('signature-timing-plan'),
      masterTimingMapId: input.masterTimingMap.id,
      projectId: input.masterTimingMap.projectId,
      editPlanId: input.masterTimingMap.editPlanId,
      signatureRouteId: route.id,
      editPlanSegmentId: route.editPlanSegmentId,
      signatureSystem: route.signatureSystem,
      timingMode: inferTimingMode(segment, route),
      sourceAnchorIds: planAnchorIdsForRoute(route, input.anchors),
      outputEventIds: planEventIdsForRoute(route, input.events),
      sfxEventIds: planSFXEventIds(input.sfxEvents, routeEvents),
      captionConflictRisk: captionRiskForPlan(route, input.events, input.conflicts),
      faceSafetyRisk,
      summary: `${route.signatureSystem} timing follows ${inferTimingMode(segment, route).replaceAll('_', ' ')} for ${route.reason}.`,
      notes: [
        'Mock signature timing plan only; no generation request or render work was created.',
        route.reason,
      ],
      createdAt: nowIso(),
    } satisfies SignatureTimingPlanRecord
  })

  const routeIds = new Set(routePlans.map((plan) => plan.signatureRouteId).filter(Boolean))
  const strokePlansWithoutRoute = (input.strokeMotionPlans ?? []).filter(
    (plan) => !plan.signatureRouteId || !routeIds.has(plan.signatureRouteId),
  )
  const strokePlans = strokePlansWithoutRoute.map((plan) => {
    const segment = input.segments.find((candidate) => candidate.editPlanSegmentId === plan.editPlanSegmentId)
    const strokeEvents = input.events.filter((event) => event.sourceSystem === 'stroke_motion')
    const strokeAnchors = input.anchors.filter((anchor) => anchor.sourceSystem === 'stroke_motion')

    return {
      id: createMockId('signature-timing-plan'),
      masterTimingMapId: input.masterTimingMap.id,
      projectId: input.masterTimingMap.projectId,
      editPlanId: input.masterTimingMap.editPlanId,
      signatureRouteId: plan.signatureRouteId,
      editPlanSegmentId: plan.editPlanSegmentId,
      signatureSystem: 'stroke_motion',
      timingMode: inferTimingMode(segment, undefined, plan),
      sourceAnchorIds: strokeAnchors.map((anchor) => anchor.id),
      outputEventIds: strokeEvents.map((event) => event.id),
      sfxEventIds: planSFXEventIds(input.sfxEvents, strokeEvents),
      captionConflictRisk: input.conflicts.some((conflict) => conflict.conflictType === 'stroke_motion_caption_overlap')
        ? 'caption_overlap'
        : 'none',
      summary: `Stroke Motion timing follows ${inferTimingMode(segment, undefined, plan).replaceAll('_', ' ')} for ${plan.storySummary}.`,
      notes: [
        'Mock signature timing plan created from Stroke Motion plan records without replacing Stroke Motion source timing.',
        plan.timingStrategy ?? 'Phrase and story timing guide Stroke Motion.',
      ],
      createdAt: nowIso(),
    } satisfies SignatureTimingPlanRecord
  })

  return [...routePlans, ...strokePlans]
}

export function createSignatureTimingSummary(input: {
  signatureTimingPlans: SignatureTimingPlanRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
}): string[] {
  const strokeSummary = createStrokeMotionTimingSummary(
    input.events.filter((event) => event.trackType === 'stroke_motion'),
    input.dependencies.filter((dependency) => dependency.reason.includes('Stroke Motion')),
  )
  const graphicSummary = createGraphicDesignTimingSummary(
    input.events.filter((event) => event.trackType === 'graphic_design'),
    input.dependencies.filter((dependency) => dependency.reason.includes('Graphic Design')),
  )
  const realMotionSummary = createRealMotionTimingSummary(
    input.events.filter((event) => event.trackType === 'real_motion'),
    input.dependencies.filter((dependency) => dependency.reason.includes('Real Motion')),
  )
  const sfxSummary = createSignatureSFXSyncSummary(
    input.dependencies.filter((dependency) => dependency.reason.toLowerCase().includes('sfx')),
    input.conflicts.filter((conflict) => conflict.conflictType === 'sfx_hit_late' || conflict.conflictType === 'sfx_hit_early'),
  )
  const overlaySummary = createSignatureOverlayConflictSummary(input.conflicts)
  const qaSummary = createSignatureTimingQASummary(input.qaChecks)

  return [
    `${input.signatureTimingPlans.length} signature timing plan(s) connect Stroke Motion, Graphic Design, and Real Motion to StoryTiming.`,
    strokeSummary,
    graphicSummary,
    realMotionSummary,
    sfxSummary,
    overlaySummary,
    qaSummary,
  ]
}

export function createSignatureTimingIntegration(
  request: CreateSignatureTimingPlansRequest,
): ServiceResult<CreateSignatureTimingPlansResponse> {
  const signatureAnchors = createSignatureTimingAnchors(request)
  const allAnchors = [...request.transcriptAnchors, ...signatureAnchors]
  const signatureEvents = createSignatureTimingEvents(request, allAnchors)
  const signatureDependencies = createSignatureTimingDependencies(
    request.masterTimingMap,
    allAnchors,
    signatureEvents,
    request.sfxEvents,
  )

  const signatureConflicts = [
    ...detectStrokeMotionTimingConflicts(
      request.masterTimingMap,
      allAnchors,
      signatureEvents,
      request.captionEvents,
    ),
    ...detectGraphicDesignTimingConflicts(
      request.masterTimingMap,
      request.segments,
      signatureEvents,
      request.captionEvents,
      request.editComplexity,
    ),
    ...detectRealMotionTimingConflicts(
      request.masterTimingMap,
      request.segments,
      request.signatureRoutes,
      signatureEvents,
      request.captionEvents,
    ),
    ...detectSignatureSFXTimingConflicts(
      request.masterTimingMap,
      signatureEvents,
      request.sfxEvents,
    ),
    ...detectSignatureOverlayConflicts(
      request.masterTimingMap,
      allAnchors,
      [...request.captionEvents, ...signatureEvents],
    ),
  ]
  const signatureTimingPlans = createSignatureTimingPlans({
    masterTimingMap: request.masterTimingMap,
    segments: request.segments,
    signatureRoutes: request.signatureRoutes,
    strokeMotionPlans: request.strokeMotionPlans,
    anchors: signatureAnchors,
    events: signatureEvents,
    sfxEvents: request.sfxEvents,
    conflicts: signatureConflicts,
  })

  const qaResult = runSignatureTimingQA({
    masterTimingMap: request.masterTimingMap,
    signatureTimingPlans,
    events: signatureEvents,
    dependencies: signatureDependencies,
    conflicts: signatureConflicts,
  })
  if (!qaResult.ok) return qaResult

  const warnings = [
    signatureTimingPlans.length === 0
      ? 'No visual signature timing records were available; StoryTiming continued without signature overlays.'
      : '',
    ...qaResult.data.warnings,
  ].filter(Boolean)

  const chatSummary = createSignatureTimingSummary({
    signatureTimingPlans,
    events: signatureEvents,
    dependencies: signatureDependencies,
    conflicts: signatureConflicts,
    qaChecks: qaResult.data.qaChecks,
  })

  return ok({
    signatureTimingPlans,
    anchors: signatureAnchors,
    events: signatureEvents,
    dependencies: signatureDependencies,
    conflicts: signatureConflicts,
    qaChecks: qaResult.data.qaChecks,
    chatSummary,
    warnings,
  }, warnings)
}
