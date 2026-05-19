import type {
  CaptionTimingPlanRecord,
  MasterTimingMapRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import {
  createTimingConflict,
  createTimingConflictResolution,
} from './storytiming-conflict-service'

const overlaps = (caption: CaptionTimingPlanRecord, event: TimingEventRecord): boolean =>
  caption.startTimeSeconds < event.endTimeSeconds && event.startTimeSeconds < caption.endTimeSeconds

export function createCaptionTimingConflict(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlan: CaptionTimingPlanRecord,
  overlayEvent: TimingEventRecord,
): TimingConflictRecord {
  return createTimingConflict(
    masterTimingMap,
    'caption_overlay_collision',
    overlayEvent.trackType === 'real_motion' ? 'high' : 'medium',
    {
      startSeconds: Math.min(captionTimingPlan.startTimeSeconds, overlayEvent.startTimeSeconds),
      endSeconds: Math.max(captionTimingPlan.endTimeSeconds, overlayEvent.endTimeSeconds),
    },
    `Caption "${captionTimingPlan.captionText}" overlaps ${overlayEvent.label}.`,
    'Captions must remain readable and should not collide with overlays, faces, or important visual objects.',
    'reduce_overlap',
    [overlayEvent],
  )
}

export function createCaptionConflictResolution(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): TimingConflictResolutionRecord {
  return createTimingConflictResolution(masterTimingMap, {
    ...conflict,
    recommendedAdjustment: conflict.severity === 'high' ? 'shift_later' : 'reduce_overlap',
  })
}

export function detectCaptionGraphicConflict(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const graphicEvents = events.filter((event) => event.trackType === 'graphic_design')
  return captionTimingPlans.flatMap((plan) =>
    graphicEvents
      .filter((event) => overlaps(plan, event))
      .map((event) => createCaptionTimingConflict(masterTimingMap, plan, event)),
  )
}

export function detectCaptionRealMotionConflict(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const realMotionEvents = events.filter((event) => event.trackType === 'real_motion')
  return captionTimingPlans.flatMap((plan) =>
    realMotionEvents
      .filter((event) => overlaps(plan, event))
      .map((event) => createCaptionTimingConflict(masterTimingMap, plan, event)),
  )
}

export function detectCaptionSignatureOverlayConflict(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const signatureEvents = events.filter((event) =>
    event.trackType === 'stroke_motion' ||
    event.trackType === 'graphic_design' ||
    event.trackType === 'real_motion',
  )

  return captionTimingPlans.flatMap((plan) =>
    signatureEvents
      .filter((event) => overlaps(plan, event))
      .map((event) => createCaptionTimingConflict(masterTimingMap, plan, event)),
  )
}

export function detectCaptionFaceSafetyConflict(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
): TimingConflictRecord[] {
  return captionTimingPlans
    .filter((plan) => plan.readabilityRisk === 'overlaps_face')
    .map((plan) =>
      createTimingConflict(
        masterTimingMap,
        'caption_overlay_collision',
        'high',
        {
          startSeconds: plan.startTimeSeconds,
          endSeconds: plan.endTimeSeconds,
        },
        `Caption "${plan.captionText}" has a face-safety placement risk.`,
        'Captions must not cover faces when trust, emotion, or teaching clarity matters.',
        'move_to_different_anchor',
      ),
    )
}

export function detectCaptionReadabilityConflicts(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
): TimingConflictRecord[] {
  return captionTimingPlans.flatMap((plan) => {
    if (plan.readabilityRisk === 'too_fast' || plan.readabilityRisk === 'too_many_words') {
      return [
        createTimingConflict(
          masterTimingMap,
          'caption_too_fast',
          'medium',
          {
            startSeconds: plan.startTimeSeconds,
            endSeconds: plan.endTimeSeconds,
          },
          `Caption "${plan.captionText}" is too dense or fast to read.`,
          'Caption timing must protect viewer comprehension.',
          'extend_duration',
        ),
      ]
    }

    if (plan.readabilityRisk === 'lags_speech') {
      return [
        createTimingConflict(
          masterTimingMap,
          'caption_too_late',
          'medium',
          {
            startSeconds: plan.startTimeSeconds,
            endSeconds: plan.endTimeSeconds,
          },
          `Caption "${plan.captionText}" lags behind its inferred speech anchor.`,
          'Captions should appear close to the spoken words.',
          'shift_earlier',
        ),
      ]
    }

    return []
  })
}

export function detectCaptionOverlayConflicts(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
  events: TimingEventRecord[],
): {
  conflicts: TimingConflictRecord[]
  conflictResolutions: TimingConflictResolutionRecord[]
} {
  const byKey = new Map<string, TimingConflictRecord>()
  const conflicts = [
    ...detectCaptionReadabilityConflicts(masterTimingMap, captionTimingPlans),
    ...detectCaptionGraphicConflict(masterTimingMap, captionTimingPlans, events),
    ...detectCaptionRealMotionConflict(masterTimingMap, captionTimingPlans, events),
    ...detectCaptionSignatureOverlayConflict(masterTimingMap, captionTimingPlans, events),
    ...detectCaptionFaceSafetyConflict(masterTimingMap, captionTimingPlans),
  ]

  conflicts.forEach((conflict) => {
    const key = `${conflict.description}:${conflict.timeRange.startSeconds}:${conflict.timeRange.endSeconds}`
    byKey.set(key, conflict)
  })

  const dedupedConflicts = [...byKey.values()]
  return {
    conflicts: dedupedConflicts,
    conflictResolutions: dedupedConflicts.map((conflict) => createCaptionConflictResolution(masterTimingMap, conflict)),
  }
}

export function createCaptionConflictSummary(conflicts: TimingConflictRecord[]): string {
  return `${conflicts.length} caption overlay conflict(s) detected.`
}
