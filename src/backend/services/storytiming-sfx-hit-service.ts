import type {
  MasterTimingMapRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createTimingConflict } from './storytiming-conflict-service'

const pointRange = (seconds: number) => ({ startSeconds: seconds, endSeconds: seconds })

const speechEventsNear = (
  sfxEnd: TimingEventRecord,
  events: TimingEventRecord[],
): TimingEventRecord[] =>
  events.filter(
    (event) =>
      (event.trackType === 'captions' || event.eventType === 'caption_on') &&
      event.startTimeSeconds <= sfxEnd.startTimeSeconds &&
      event.endTimeSeconds >= sfxEnd.startTimeSeconds - 0.3,
  )

export function alignSFXHitToTimingAnchor(
  sfxHitEvent: TimingEventRecord,
  anchors: TimingAnchorRecord[],
): TimingAnchorRecord | undefined {
  const hitSeconds = sfxHitEvent.hitTimeSeconds ?? sfxHitEvent.startTimeSeconds

  return anchors
    .filter((anchor) => anchor.anchorType === 'sfx_hit' || anchor.anchorType === 'cut' || anchor.anchorType === 'music_downbeat')
    .reduce<TimingAnchorRecord | undefined>((nearest, anchor) => {
      if (nearest === undefined) return anchor
      return Math.abs(anchor.timeSeconds - hitSeconds) < Math.abs(nearest.timeSeconds - hitSeconds) ? anchor : nearest
    }, undefined)
}

export function validateSFXHitTiming(
  sfxHitEvent: TimingEventRecord,
  anchor: TimingAnchorRecord | undefined,
): { ok: boolean; deltaSeconds: number } {
  const hitSeconds = sfxHitEvent.hitTimeSeconds ?? sfxHitEvent.startTimeSeconds
  const deltaSeconds = anchor === undefined ? 0 : Number((hitSeconds - anchor.timeSeconds).toFixed(3))
  return {
    ok: anchor === undefined || Math.abs(deltaSeconds) <= 0.08,
    deltaSeconds,
  }
}

export function validateSFXTailSafety(
  sfxEndEvent: TimingEventRecord,
  events: TimingEventRecord[],
): { ok: boolean; speechEvents: TimingEventRecord[] } {
  const speechEvents = speechEventsNear(sfxEndEvent, events)
  return {
    ok: speechEvents.length === 0,
    speechEvents,
  }
}

export function createSFXHitTimingConflict(
  masterTimingMap: MasterTimingMapRecord,
  sfxHitEvent: TimingEventRecord,
  anchor: TimingAnchorRecord | undefined,
): TimingConflictRecord | undefined {
  if (sfxHitEvent.notes.some((note) => note.includes('force_sfx_hit_late'))) {
    return createTimingConflict(
      masterTimingMap,
      'sfx_hit_late',
      'high',
      pointRange(sfxHitEvent.hitTimeSeconds ?? sfxHitEvent.startTimeSeconds),
      `SFX hit "${sfxHitEvent.label}" lands late in this mock SoundSync scenario.`,
      'SFX should reinforce the intended visual, cut, or musical beat at the planned frame.',
      'shift_earlier',
      [sfxHitEvent],
      anchor ? [anchor] : [],
    )
  }

  const validation = validateSFXHitTiming(sfxHitEvent, anchor)
  if (validation.ok || anchor === undefined) return undefined

  return createTimingConflict(
    masterTimingMap,
    validation.deltaSeconds > 0 ? 'sfx_hit_late' : 'sfx_hit_early',
    Math.abs(validation.deltaSeconds) > 0.18 ? 'high' : 'medium',
    pointRange(sfxHitEvent.hitTimeSeconds ?? sfxHitEvent.startTimeSeconds),
    `SFX hit "${sfxHitEvent.label}" is ${Math.abs(validation.deltaSeconds).toFixed(3)}s from its timing anchor.`,
    'SFX timing should be frame-aware, especially on cuts, title reveals, and downbeats.',
    validation.deltaSeconds > 0 ? 'shift_earlier' : 'shift_later',
    [sfxHitEvent],
    [anchor],
  )
}

export function createSFXTailSafetyConflict(
  masterTimingMap: MasterTimingMapRecord,
  sfxEndEvent: TimingEventRecord,
  events: TimingEventRecord[],
): TimingConflictRecord | undefined {
  if (!sfxEndEvent.notes.some((note) => note.includes('force_sfx_tail_over_speech'))) {
    const validation = validateSFXTailSafety(sfxEndEvent, events)
    if (validation.ok) return undefined
  }

  return createTimingConflict(
    masterTimingMap,
    'sfx_tail_over_speech',
    'high',
    {
      startSeconds: Math.max(0, sfxEndEvent.startTimeSeconds - 0.3),
      endSeconds: sfxEndEvent.startTimeSeconds,
    },
    `SFX tail "${sfxEndEvent.label}" risks covering speech.`,
    'SFX tails should not cover important words unless intentionally subtle and approved.',
    'shorten_duration',
    [sfxEndEvent],
  )
}

export function createSFXHitTimingSummary(conflicts: TimingConflictRecord[]): string {
  const sfxConflicts = conflicts.filter(
    (conflict) =>
      conflict.conflictType === 'sfx_hit_late' ||
      conflict.conflictType === 'sfx_hit_early' ||
      conflict.conflictType === 'sfx_tail_over_speech',
  )

  return sfxConflicts.length === 0
    ? 'SFX hits and tails are voice-safe in the mock SoundSync timing pass.'
    : `${sfxConflicts.length} SFX hit/tail timing issue(s) need review.`
}
