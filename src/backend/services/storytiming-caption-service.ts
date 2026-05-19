import type { CaptionPlanRecord } from '../../types/edit-quality'
import type {
  CaptionTimingMode,
  CaptionTimingPlanRecord,
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TargetPlatform } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import {
  estimateCaptionReadabilityDuration,
  getCaptionReadabilityRisk,
} from './storytiming-caption-readability-service'

export interface CaptionTimingContext {
  captionPlans?: CaptionPlanRecord[]
  targetPlatform?: TargetPlatform
  userTimingInstructions?: string[]
}

const findSegment = (
  segments: StoryTimingSegmentRecord[],
  segmentId: string | undefined,
): StoryTimingSegmentRecord | undefined => segments.find((segment) => segment.id === segmentId)

export function chooseCaptionTimingMode(
  captionPlan: CaptionPlanRecord | undefined,
  context: CaptionTimingContext = {},
): CaptionTimingMode {
  const instructions = (context.userTimingInstructions ?? []).join(' ').toLowerCase()

  if (captionPlan?.captionNeeded === false || captionPlan?.captionPolicy === 'none') {
    return 'none'
  }

  if (captionPlan?.captionDensity === 'word_by_word' || instructions.includes('karaoke')) {
    return 'karaoke_word_by_word'
  }

  if (captionPlan?.wordEmphasisEnabled || captionPlan?.styleIntent === 'emphasis_words') {
    return 'word_emphasis'
  }

  if (captionPlan?.captionDensity === 'low' || captionPlan?.styleIntent === 'premium_subtle') {
    return 'minimal'
  }

  return 'phrase_based'
}

export function createCaptionTimingPlanFromCaptionPlan(input: {
  masterTimingMap: MasterTimingMapRecord
  segments: StoryTimingSegmentRecord[]
  transcriptAnchor: TimingAnchorRecord
  captionPlan?: CaptionPlanRecord
  context?: CaptionTimingContext
  overlayEventIds?: string[]
}): CaptionTimingPlanRecord {
  const segment = findSegment(input.segments, input.transcriptAnchor.segmentId)
  const captionText = input.transcriptAnchor.anchorText ?? input.transcriptAnchor.anchorLabel
  const instructions = input.context?.userTimingInstructions?.join(' ').toLowerCase() ?? ''
  const startTimeSeconds = Math.max(
    segment?.outputTimeRange.startSeconds ?? 0,
    input.transcriptAnchor.timeSeconds + (instructions.includes('force_caption_lag') ? 0.5 : -0.02),
  )
  const estimatedDuration = estimateCaptionReadabilityDuration(captionText)
  const anchorEnd = input.transcriptAnchor.endTimeSeconds ?? startTimeSeconds + estimatedDuration
  const endTimeSeconds = Math.min(
    segment?.outputTimeRange.endSeconds ?? input.masterTimingMap.durationSeconds,
    instructions.includes('force_caption_too_fast')
      ? startTimeSeconds + 0.8
      : Math.max(anchorEnd + 0.2, startTimeSeconds + estimatedDuration),
  )
  const emphasisWordAnchors = input.transcriptAnchor.anchorType === 'phrase'
    ? []
    : [input.transcriptAnchor.id]

  return {
    id: createMockId('caption-timing-plan'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    segmentId: segment?.id,
    captionPlanId: input.captionPlan?.id,
    timingMode: chooseCaptionTimingMode(input.captionPlan, input.context),
    captionText,
    transcriptText: segment?.notes.join(' '),
    startTimeSeconds,
    endTimeSeconds,
    emphasisWordAnchors,
    readabilityRisk: getCaptionReadabilityRisk({
      captionText,
      startTimeSeconds,
      endTimeSeconds,
      speechStartSeconds: input.transcriptAnchor.timeSeconds,
    }),
    safeZoneRequired: input.captionPlan?.safeZoneRequired ?? true,
    avoidOverlayIds: input.overlayEventIds ?? [],
    notes: [
      'Caption timing is mock inferred from transcript phrase timing.',
      'No real transcript alignment has run.',
    ],
    createdAt: nowIso(),
  }
}

export function createCaptionTimingPlans(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  transcriptAnchors: TimingAnchorRecord[],
  context: CaptionTimingContext = {},
  overlayEvents: TimingEventRecord[] = [],
): ServiceResult<{ captionTimingPlans: CaptionTimingPlanRecord[]; warnings: string[] }> {
  const captionPlan = context.captionPlans?.find((plan) => plan.captionNeeded !== false)
  const phraseAnchors = transcriptAnchors.filter((anchor) => anchor.anchorType === 'phrase')
  const overlayEventIds = overlayEvents
    .filter((event) => event.trackType === 'graphic_design' || event.trackType === 'real_motion' || event.trackType === 'stroke_motion')
    .map((event) => event.id)
  const captionTimingPlans = phraseAnchors.map((anchor) =>
    createCaptionTimingPlanFromCaptionPlan({
      masterTimingMap,
      segments,
      transcriptAnchor: anchor,
      captionPlan,
      context,
      overlayEventIds,
    }),
  )
  const warnings = captionTimingPlans.length === 0
    ? ['No phrase transcript anchors were available for caption timing plans.']
    : []

  return ok({ captionTimingPlans, warnings }, warnings)
}

const createCaptionEvent = (input: {
  masterTimingMap: MasterTimingMapRecord
  plan: CaptionTimingPlanRecord
  eventType: 'caption_on' | 'caption_off' | 'caption_emphasis'
  label: string
  startTimeSeconds: number
  endTimeSeconds: number
  anchorId?: string
}): TimingEventRecord => ({
  id: createMockId('caption-event'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  segmentId: input.plan.segmentId,
  anchorId: input.anchorId,
  sourceSystem: 'caption_plan',
  sourceRecordId: input.plan.captionPlanId,
  sourceRef: {
    sourceSystem: 'caption_plan',
    sourceRecordId: input.plan.captionPlanId,
    sourceTableName: 'caption_timing_plans',
    label: input.label,
  },
  eventType: input.eventType,
  trackType: 'captions',
  label: input.label,
  startTimeSeconds: input.startTimeSeconds,
  hitTimeSeconds: input.eventType === 'caption_emphasis' ? input.startTimeSeconds : undefined,
  endTimeSeconds: input.endTimeSeconds,
  durationSeconds: Math.max(0, input.endTimeSeconds - input.startTimeSeconds),
  frameStart: Math.round(input.startTimeSeconds * input.masterTimingMap.frameRate),
  frameHit: input.eventType === 'caption_emphasis' ? Math.round(input.startTimeSeconds * input.masterTimingMap.frameRate) : undefined,
  frameEnd: Math.round(input.endTimeSeconds * input.masterTimingMap.frameRate),
  priority: input.eventType === 'caption_emphasis' ? 'medium' : 'high',
  syncMode: input.eventType === 'caption_emphasis' ? 'word_locked' : 'phrase_locked',
  canShift: true,
  locked: false,
  visibilityLayer: 'captions',
  notes: [
    `Caption timing mode: ${input.plan.timingMode}.`,
    input.plan.readabilityRisk === 'none' ? 'Readability risk: none.' : `Readability risk: ${input.plan.readabilityRisk}.`,
  ],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {
    captionTimingPlanId: input.plan.id,
    captionText: input.plan.captionText,
  },
})

export function createCaptionOnOffEvents(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
): TimingEventRecord[] {
  return captionTimingPlans.flatMap((plan) => [
    createCaptionEvent({
      masterTimingMap,
      plan,
      eventType: 'caption_on',
      label: `Caption on: ${plan.captionText}`,
      startTimeSeconds: plan.startTimeSeconds,
      endTimeSeconds: plan.endTimeSeconds,
    }),
    createCaptionEvent({
      masterTimingMap,
      plan,
      eventType: 'caption_off',
      label: `Caption off: ${plan.captionText}`,
      startTimeSeconds: plan.endTimeSeconds,
      endTimeSeconds: plan.endTimeSeconds,
    }),
  ])
}

export function createCaptionEmphasisEvents(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  transcriptAnchors: TimingAnchorRecord[],
): TimingEventRecord[] {
  const wordAnchorsById = new Map(transcriptAnchors.map((anchor) => [anchor.id, anchor]))

  return captionTimingPlans.flatMap((plan) =>
    transcriptAnchors
      .filter(
        (anchor) =>
          anchor.anchorType === 'word' &&
          anchor.segmentId === plan.segmentId &&
          anchor.timeSeconds >= plan.startTimeSeconds &&
          anchor.timeSeconds <= plan.endTimeSeconds,
      )
      .slice(0, plan.timingMode === 'karaoke_word_by_word' ? 8 : 2)
      .map((anchor) =>
        createCaptionEvent({
          masterTimingMap,
          plan: {
            ...plan,
            emphasisWordAnchors: [...plan.emphasisWordAnchors, anchor.id],
          },
          eventType: 'caption_emphasis',
          label: `Emphasis: ${anchor.anchorText ?? anchor.anchorLabel}`,
          startTimeSeconds: anchor.timeSeconds,
          endTimeSeconds: Math.min(plan.endTimeSeconds, anchor.timeSeconds + 0.35),
          anchorId: wordAnchorsById.get(anchor.id)?.id,
        }),
      ),
  )
}

export function createCaptionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  transcriptAnchors: TimingAnchorRecord[],
): TimingEventRecord[] {
  return [
    ...createCaptionOnOffEvents(masterTimingMap, captionTimingPlans),
    ...createCaptionEmphasisEvents(masterTimingMap, captionTimingPlans, transcriptAnchors),
  ].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
}

export function createCaptionTimingSummary(captionTimingPlans: CaptionTimingPlanRecord[]): string {
  const risky = captionTimingPlans.filter((plan) => plan.readabilityRisk !== 'none').length

  return `${captionTimingPlans.length} caption timing plan(s) created with ${risky} readability risk(s).`
}
