import type {
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
} from '../../types'
import type {
  CreateSFXTimingAlignmentRequest,
  CreateSFXTimingAlignmentResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

function roundSeconds(value: number): number {
  return Number(Math.max(0, value).toFixed(3))
}

function trimmedDurationSeconds(trimPlan: SFXTrimPlanRecord): number {
  return Math.max(0, trimPlan.trimEndSeconds - trimPlan.trimStartSeconds)
}

export function calculateSFXStartFromHit(
  anchorTimeSeconds: number,
  hitOffsetInsideTrimMs: number,
): number {
  return roundSeconds(anchorTimeSeconds - hitOffsetInsideTrimMs / 1000)
}

export function calculateSFXEndFromHit(
  startTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): number {
  return roundSeconds(startTimeSeconds + trimmedDurationSeconds(trimPlan))
}

export function calculatePreRollMs(trimPlan: SFXTrimPlanRecord): number {
  return Math.max(0, trimPlan.hitOffsetInsideTrimMs)
}

export function calculateTailFromTrim(trimPlan: SFXTrimPlanRecord): number {
  const trimDurationMs = Math.round(trimmedDurationSeconds(trimPlan) * 1000)
  return Math.max(0, trimDurationMs - trimPlan.hitOffsetInsideTrimMs)
}

export function alignHitToAnchor(
  anchorTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): { startTimeSeconds: number; hitTimeSeconds: number; endTimeSeconds: number } {
  const startTimeSeconds = calculateSFXStartFromHit(anchorTimeSeconds, trimPlan.hitOffsetInsideTrimMs)

  return {
    startTimeSeconds,
    hitTimeSeconds: roundSeconds(anchorTimeSeconds),
    endTimeSeconds: calculateSFXEndFromHit(startTimeSeconds, trimPlan),
  }
}

export function alignSFXToMusicBeat(
  anchorTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): ReturnType<typeof alignHitToAnchor> {
  return alignHitToAnchor(anchorTimeSeconds, trimPlan)
}

export function alignSFXToStrokeMotion(
  anchorType: string,
  anchorTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): ReturnType<typeof alignHitToAnchor> {
  if (anchorType === 'stroke_motion_start') {
    const startTimeSeconds = roundSeconds(anchorTimeSeconds)
    return {
      startTimeSeconds,
      hitTimeSeconds: startTimeSeconds,
      endTimeSeconds: calculateSFXEndFromHit(startTimeSeconds, trimPlan),
    }
  }

  return alignHitToAnchor(anchorTimeSeconds, trimPlan)
}

export function alignSFXToRealMotion(
  anchorTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): ReturnType<typeof alignHitToAnchor> {
  return alignHitToAnchor(anchorTimeSeconds, trimPlan)
}

export function alignSFXToGraphicReveal(
  anchorTimeSeconds: number,
  trimPlan: SFXTrimPlanRecord,
): ReturnType<typeof alignHitToAnchor> {
  return alignHitToAnchor(anchorTimeSeconds, trimPlan)
}

function createPlacement(request: CreateSFXTimingAlignmentRequest): {
  startTimeSeconds: number
  hitTimeSeconds: number
  endTimeSeconds: number
} {
  const { sfxEventPlan, sfxTrimPlan } = request

  if (sfxEventPlan.targetLayer === 'stroke_motion') {
    return alignSFXToStrokeMotion(sfxEventPlan.anchorType, sfxEventPlan.anchorTimeSeconds, sfxTrimPlan)
  }

  if (sfxEventPlan.targetLayer === 'ambient_bridge') {
    const startTimeSeconds = roundSeconds(Math.max(0, sfxEventPlan.anchorTimeSeconds - 0.5))
    return {
      startTimeSeconds,
      hitTimeSeconds: roundSeconds(sfxEventPlan.anchorTimeSeconds),
      endTimeSeconds: calculateSFXEndFromHit(startTimeSeconds, sfxTrimPlan),
    }
  }

  if (sfxEventPlan.anchorType === 'music_beat' || sfxEventPlan.anchorType === 'music_downbeat') {
    return alignSFXToMusicBeat(sfxEventPlan.anchorTimeSeconds, sfxTrimPlan)
  }

  if (sfxEventPlan.targetLayer === 'graphic_design') {
    return alignSFXToGraphicReveal(sfxEventPlan.anchorTimeSeconds, sfxTrimPlan)
  }

  if (sfxEventPlan.targetLayer === 'real_motion') {
    return alignSFXToRealMotion(sfxEventPlan.anchorTimeSeconds, sfxTrimPlan)
  }

  return alignHitToAnchor(sfxEventPlan.anchorTimeSeconds, sfxTrimPlan)
}

export function createSFXTimingAlignment(
  db: MockDatabase,
  request: CreateSFXTimingAlignmentRequest,
): ServiceResult<CreateSFXTimingAlignmentResponse> {
  const { sfxEventPlan, sfxTrimPlan } = request
  const placement = createPlacement(request)
  const timingAlignment: SFXTimingAlignmentRecord = {
    id: createMockId('sfx-timing-alignment'),
    projectId: sfxEventPlan.projectId,
    editPlanId: sfxEventPlan.editPlanId,
    sfxEventPlanId: sfxEventPlan.id,
    sfxTrimPlanId: sfxTrimPlan.id,
    anchorType: sfxEventPlan.anchorType,
    anchorTimeSeconds: sfxEventPlan.anchorTimeSeconds,
    startTimeSeconds: placement.startTimeSeconds,
    hitTimeSeconds: placement.hitTimeSeconds,
    endTimeSeconds: placement.endTimeSeconds,
    preRollMs: calculatePreRollMs(sfxTrimPlan),
    tailMs: calculateTailFromTrim(sfxTrimPlan),
    durationNeededMs: Math.round(sfxTrimPlan.neededDurationSeconds * 1000),
    durationGeneratedMs: Math.round(sfxTrimPlan.generatedDurationSeconds * 1000),
    hitOffsetInsideTrimMs: sfxTrimPlan.hitOffsetInsideTrimMs,
    timingPriority: sfxEventPlan.timingPriority,
    frameAccurateRequired: sfxEventPlan.timingPriority === 'frame_accurate' || sfxEventPlan.timingPriority === 'beat_aligned',
    musicBeatAligned: sfxEventPlan.anchorType === 'music_beat' || sfxEventPlan.anchorType === 'music_downbeat',
    speechSafePlacement: sfxEventPlan.mixPriority === 'voice_first' || sfxEventPlan.timingPriority === 'speech_safe',
    notes: [
      'Hit point is aligned to the timing anchor before mix planning.',
      'File start is derived from hit offset inside the trim window.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noAudioProcessing: true },
  }

  return ok({
    sfxTimingAlignment: insertMockRecord(db, 'sfxTimingAlignments', timingAlignment),
  })
}

export function createSFXAlignmentSummary(timingAlignment: SFXTimingAlignmentRecord): string[] {
  return [
    `Anchor: ${timingAlignment.anchorType} at ${timingAlignment.anchorTimeSeconds}s.`,
    `Final placement: start ${timingAlignment.startTimeSeconds}s, hit ${timingAlignment.hitTimeSeconds}s, end ${timingAlignment.endTimeSeconds}s.`,
    `Pre-roll/tail: ${timingAlignment.preRollMs}ms / ${timingAlignment.tailMs}ms.`,
    'The hit point is aligned before frame snapping and mix planning.',
  ]
}
