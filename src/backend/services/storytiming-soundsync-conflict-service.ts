import type {
  MasterTimingMapRecord,
  MusicDuckingTimingPlanRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import {
  createTimingConflict,
  createTimingConflictResolution,
} from './storytiming-conflict-service'
import {
  alignSFXHitToTimingAnchor,
  createSFXHitTimingConflict,
  createSFXTailSafetyConflict,
} from './storytiming-sfx-hit-service'
import { detectAmbienceMaskedConflict } from './storytiming-ambience-timing-service'

export function createSoundSyncTimingConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: Omit<TimingConflictRecord, 'id' | 'masterTimingMapId' | 'projectId' | 'editPlanId' | 'createdAt' | 'updatedAt' | 'metadata'>,
): TimingConflictRecord {
  return {
    ...conflict,
    id: `mock-soundsync-conflict-${conflict.conflictType}-${conflict.timeRange.startSeconds}`,
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    createdAt: new Date('2026-05-13T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-05-13T12:00:00.000Z').toISOString(),
    metadata: {
      scope: 'soundsync',
    },
  }
}

export function detectMusicDuckingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  duckingPlans: MusicDuckingTimingPlanRecord[],
  duckingEvents: TimingEventRecord[],
): TimingConflictRecord[] {
  return duckingPlans.flatMap((plan) => {
    const duckEvent = duckingEvents.find(
      (event) => event.eventType === 'music_duck_start' && event.sourceRecordId === plan.id,
    )
    const startsLate = plan.duckStartSeconds > plan.speechStartSeconds - 0.15
    const startsTooEarly = plan.speechStartSeconds - plan.duckStartSeconds > 0.8

    if (!startsLate && !startsTooEarly) return []

    return [
      createTimingConflict(
        masterTimingMap,
        'music_ducking_misses_speech',
        startsLate ? 'high' : 'medium',
        {
          startSeconds: plan.duckStartSeconds,
          endSeconds: plan.speechStartSeconds,
        },
        startsLate
          ? `Music ducking for speech at ${plan.speechStartSeconds.toFixed(3)}s starts too late.`
          : `Music ducking for speech at ${plan.speechStartSeconds.toFixed(3)}s starts too early.`,
        'Music ducking should start 150-400ms before speech so voice clarity wins without over-dimming the bed.',
        startsLate ? 'shift_earlier' : 'shift_later',
        duckEvent ? [duckEvent] : [],
      ),
    ]
  })
}

export function detectSFXHitConflicts(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  sfxEvents: TimingEventRecord[],
): TimingConflictRecord[] {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      const anchor = alignSFXHitToTimingAnchor(event, anchors)
      const conflict = createSFXHitTimingConflict(masterTimingMap, event, anchor)
      return conflict ? [conflict] : []
    })
}

export function detectSFXTailSpeechConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  return events
    .filter((event) => event.eventType === 'sfx_end')
    .flatMap((event) => {
      const conflict = createSFXTailSafetyConflict(masterTimingMap, event, events)
      return conflict ? [conflict] : []
    })
}

export function detectMusicSFXDensityConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const hitsBySecond = new Map<number, TimingEventRecord[]>()
  events
    .filter((event) => event.eventType === 'sfx_hit')
    .forEach((event) => {
      const bucket = Math.floor(event.startTimeSeconds)
      hitsBySecond.set(bucket, [...(hitsBySecond.get(bucket) ?? []), event])
    })

  return [...hitsBySecond.entries()]
    .filter(([, hits]) => hits.length >= 3)
    .map(([second, hits]) =>
      createTimingConflict(
        masterTimingMap,
        'too_many_events_same_moment',
        'medium',
        { startSeconds: second, endSeconds: second + 1 },
        `${hits.length} SFX hits land inside one second.`,
        'Dense SFX hits can fight music, speech, and viewer comprehension.',
        'reduce_overlap',
        hits,
      ),
    )
}

export function detectAmbienceMaskingConflicts(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord[] {
  const conflict = detectAmbienceMaskedConflict(masterTimingMap, events)
  return conflict ? [conflict] : []
}

export function detectSoundSyncTimingConflicts(input: {
  masterTimingMap: MasterTimingMapRecord
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  duckingEvents: TimingEventRecord[]
  sfxEvents: TimingEventRecord[]
}): { conflicts: TimingConflictRecord[]; conflictResolutions: TimingConflictResolutionRecord[] } {
  const conflicts = [
    ...detectMusicDuckingConflicts(input.masterTimingMap, input.duckingPlans, input.duckingEvents),
    ...detectSFXHitConflicts(input.masterTimingMap, input.anchors, input.sfxEvents),
    ...detectSFXTailSpeechConflicts(input.masterTimingMap, input.events),
    ...detectMusicSFXDensityConflicts(input.masterTimingMap, input.events),
    ...detectAmbienceMaskingConflicts(input.masterTimingMap, input.events),
  ]

  return {
    conflicts,
    conflictResolutions: conflicts.map((conflict) => createSoundSyncConflictResolution(input.masterTimingMap, conflict)),
  }
}

export function createSoundSyncConflictResolution(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): TimingConflictResolutionRecord {
  return createTimingConflictResolution(masterTimingMap, conflict)
}

export function createSoundSyncConflictSummary(conflicts: TimingConflictRecord[]): string {
  const soundSyncConflicts = conflicts.filter(
    (conflict) =>
      conflict.conflictType === 'music_ducking_misses_speech' ||
      conflict.conflictType === 'sfx_hit_late' ||
      conflict.conflictType === 'sfx_hit_early' ||
      conflict.conflictType === 'sfx_tail_over_speech' ||
      conflict.conflictType === 'too_many_events_same_moment' ||
      conflict.description.toLowerCase().includes('ambience'),
  )

  return soundSyncConflicts.length === 0
    ? 'No SoundSync timing conflicts were detected.'
    : `${soundSyncConflicts.length} SoundSync timing conflict(s) need review.`
}
