import type {
  MasterTimingMapRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'

const eventTime = (event: TimingEventRecord): number => event.hitTimeSeconds ?? event.startTimeSeconds

const createDependency = (
  masterTimingMap: MasterTimingMapRecord,
  sfxEvent: TimingEventRecord,
  signatureEvent: TimingEventRecord,
  reason: string,
): TimingDependencyRecord => ({
  id: createMockId('signature-sfx-sync-dependency'),
  masterTimingMapId: masterTimingMap.id,
  projectId: masterTimingMap.projectId,
  editPlanId: masterTimingMap.editPlanId,
  fromEventId: sfxEvent.id,
  toEventId: signatureEvent.id,
  dependencyType: 'hit_on_same_frame',
  maxOffsetSeconds: 0.08,
  required: false,
  reason,
  notes: [
    'Signature SFX is supportive only; speech meaning and voice safety win.',
    'Mock dependency only; no SFX generation, audio processing, or mixing occurred.',
  ],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: { mockOnly: true },
})

const nearestSignatureEvent = (
  sfxEvent: TimingEventRecord,
  signatureEvents: TimingEventRecord[],
  eventTypes: TimingEventRecord['eventType'][],
  toleranceSeconds: number,
): TimingEventRecord | undefined => {
  const hit = eventTime(sfxEvent)
  return signatureEvents
    .filter((event) => eventTypes.includes(event.eventType))
    .sort((a, b) => Math.abs(eventTime(a) - hit) - Math.abs(eventTime(b) - hit))
    .find((event) => Math.abs(eventTime(event) - hit) <= toleranceSeconds)
}

export function syncStrokeMotionSFXToMotion(
  masterTimingMap: MasterTimingMapRecord,
  sfxEvents: TimingEventRecord[] = [],
  signatureEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const motionEvent = nearestSignatureEvent(
        sfxEvent,
        signatureEvents.filter((event) => event.trackType === 'stroke_motion'),
        ['stroke_motion_start', 'stroke_motion_complete'],
        0.18,
      )
      return motionEvent
        ? [createDependency(masterTimingMap, sfxEvent, motionEvent, 'Stroke Motion draw/completion SFX should align to the line motion moment.')]
        : []
    })
}

export function syncGraphicDesignSFXToReveal(
  masterTimingMap: MasterTimingMapRecord,
  sfxEvents: TimingEventRecord[] = [],
  signatureEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const revealEvent = nearestSignatureEvent(
        sfxEvent,
        signatureEvents.filter((event) => event.trackType === 'graphic_design'),
        ['graphic_reveal'],
        0.14,
      )
      return revealEvent
        ? [createDependency(masterTimingMap, sfxEvent, revealEvent, 'Graphic Design reveal SFX should hit on the reveal frame.')]
        : []
    })
}

export function syncRealMotionSFXToObjectSettle(
  masterTimingMap: MasterTimingMapRecord,
  sfxEvents: TimingEventRecord[] = [],
  signatureEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const settleEvent = nearestSignatureEvent(
        sfxEvent,
        signatureEvents.filter((event) => event.trackType === 'real_motion'),
        ['real_motion_settle'],
        0.18,
      )
      return settleEvent
        ? [createDependency(masterTimingMap, sfxEvent, settleEvent, 'Real Motion object SFX should hit when the object settles.')]
        : []
    })
}

export function createSignatureSFXSyncDependencies(
  masterTimingMap: MasterTimingMapRecord,
  signatureEvents: TimingEventRecord[] = [],
  sfxEvents: TimingEventRecord[] = [],
): TimingDependencyRecord[] {
  return [
    ...syncStrokeMotionSFXToMotion(masterTimingMap, sfxEvents, signatureEvents),
    ...syncGraphicDesignSFXToReveal(masterTimingMap, sfxEvents, signatureEvents),
    ...syncRealMotionSFXToObjectSettle(masterTimingMap, sfxEvents, signatureEvents),
  ]
}

export function detectSignatureSFXTimingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  signatureEvents: TimingEventRecord[] = [],
  sfxEvents: TimingEventRecord[] = [],
): TimingConflictRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((sfxEvent) => {
      const signatureEvent = nearestSignatureEvent(
        sfxEvent,
        signatureEvents,
        ['stroke_motion_complete', 'graphic_reveal', 'real_motion_settle'],
        0.45,
      )
      const forcedLate = sfxEvent.notes.some((note) => note.includes('force_signature_sfx_late'))

      if (!signatureEvent && !forcedLate) {
        return []
      }

      const delta = signatureEvent ? eventTime(sfxEvent) - eventTime(signatureEvent) : 0.4
      if (!forcedLate && Math.abs(delta) <= 0.18) {
        return []
      }

      return [
        createTimingConflict(
          masterTimingMap,
          delta > 0 ? 'sfx_hit_late' : 'sfx_hit_early',
          Math.abs(delta) > 0.3 ? 'high' : 'medium',
          { startSeconds: eventTime(sfxEvent), endSeconds: eventTime(sfxEvent) },
          `Signature SFX "${sfxEvent.label}" is not aligned to its visual motion moment.`,
          'SFX should reinforce signature movement without landing late, early, or over important speech.',
          delta > 0 ? 'shift_earlier' : 'shift_later',
          signatureEvent ? [sfxEvent, signatureEvent] : [sfxEvent],
        ),
      ]
    })
}

export function createSignatureSFXSyncSummary(dependencies: TimingDependencyRecord[], conflicts: TimingConflictRecord[]): string {
  return `${dependencies.length} signature/SFX sync dependency/dependencies created; ${conflicts.length} signature SFX timing conflict(s) detected.`
}
