import type {
  MasterTimingMapRecord,
  MusicBeatGridRecord,
  TimingAnchorRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import {
  findNearestDownbeat,
  findNearestMusicBeat,
} from './storytiming-music-beat-grid-service'

const createDependency = (
  masterTimingMap: MasterTimingMapRecord,
  input: {
    fromEventId?: string
    toEventId?: string
    fromAnchorId?: string
    toAnchorId?: string
    dependencyType: TimingDependencyRecord['dependencyType']
    minOffsetSeconds?: number
    maxOffsetSeconds?: number
    reason: string
    required?: boolean
  },
): TimingDependencyRecord => ({
  id: createMockId('soundsync-dependency'),
  masterTimingMapId: masterTimingMap.id,
  projectId: masterTimingMap.projectId,
  editPlanId: masterTimingMap.editPlanId,
  fromEventId: input.fromEventId,
  toEventId: input.toEventId,
  fromAnchorId: input.fromAnchorId,
  toAnchorId: input.toAnchorId,
  dependencyType: input.dependencyType,
  minOffsetSeconds: input.minOffsetSeconds,
  maxOffsetSeconds: input.maxOffsetSeconds,
  required: input.required ?? true,
  reason: input.reason,
  notes: ['Mock SoundSync dependency; source records are not mutated.'],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {},
})

const nearestAnchorAt = (
  anchors: TimingAnchorRecord[],
  anchorTypes: TimingAnchorRecord['anchorType'][],
  timeSeconds: number,
  tolerance = 0.12,
): TimingAnchorRecord | undefined =>
  anchors.find((anchor) => anchorTypes.includes(anchor.anchorType) && Math.abs(anchor.timeSeconds - timeSeconds) <= tolerance)

export function syncSFXToNearestMusicBeat(
  sfxHitEvent: TimingEventRecord,
  beatGrids: MusicBeatGridRecord[],
): number | undefined {
  const timeSeconds = sfxHitEvent.hitTimeSeconds ?? sfxHitEvent.startTimeSeconds
  const grid = beatGrids.find(
    (candidate) => timeSeconds >= candidate.startTimeSeconds && timeSeconds <= candidate.endTimeSeconds,
  )

  return findNearestMusicBeat(grid, timeSeconds)
}

export function syncTransitionToMusicBeat(
  transitionEvent: TimingEventRecord,
  beatGrids: MusicBeatGridRecord[],
): number | undefined {
  const grid = beatGrids.find(
    (candidate) =>
      transitionEvent.startTimeSeconds >= candidate.startTimeSeconds &&
      transitionEvent.startTimeSeconds <= candidate.endTimeSeconds,
  )

  return findNearestDownbeat(grid, transitionEvent.startTimeSeconds)
}

export function syncMontageHitsToMusicBeatGrid(
  sfxEvents: TimingEventRecord[],
  beatGrids: MusicBeatGridRecord[],
): Array<{ eventId: string; beatSeconds: number }> {
  return sfxEvents
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      const beatSeconds = syncSFXToNearestMusicBeat(event, beatGrids)
      return beatSeconds === undefined ? [] : [{ eventId: event.id, beatSeconds }]
    })
}

export function createMusicSFXDependencies(
  masterTimingMap: MasterTimingMapRecord,
  anchors: TimingAnchorRecord[],
  events: TimingEventRecord[],
  beatGrids: MusicBeatGridRecord[],
): TimingDependencyRecord[] {
  const sfxHitDependencies = events
    .filter((event) => event.eventType === 'sfx_hit')
    .flatMap((event) => {
      const hitTime = event.hitTimeSeconds ?? event.startTimeSeconds
      const sfxAnchor = nearestAnchorAt(anchors, ['sfx_hit', 'cut', 'transition_start', 'transition_end'], hitTime, 0.15)
      const beatSeconds = syncSFXToNearestMusicBeat(event, beatGrids)
      const beatAnchor = beatSeconds === undefined
        ? undefined
        : nearestAnchorAt(anchors, ['music_beat', 'music_downbeat'], beatSeconds, 0.08)

      return [
        sfxAnchor
          ? createDependency(masterTimingMap, {
              fromEventId: event.id,
              toAnchorId: sfxAnchor.id,
              dependencyType: 'sync_to_anchor',
              maxOffsetSeconds: 0.08,
              reason: 'SFX hit should land on the planned visual, cut, or SFX anchor.',
            })
          : undefined,
        beatAnchor
          ? createDependency(masterTimingMap, {
              fromEventId: event.id,
              toAnchorId: beatAnchor.id,
              dependencyType: 'sync_to_anchor',
              maxOffsetSeconds: 0.12,
              required: false,
              reason: 'Montage SFX may sync to nearby music beat when speech is not dominant.',
            })
          : undefined,
      ].filter((dependency): dependency is TimingDependencyRecord => Boolean(dependency))
    })

  const transitionDependencies = events
    .filter((event) => event.eventType === 'transition_start' || event.eventType === 'transition_end')
    .flatMap((event) => {
      const downbeatSeconds = syncTransitionToMusicBeat(event, beatGrids)
      const anchor = downbeatSeconds === undefined
        ? undefined
        : nearestAnchorAt(anchors, ['music_downbeat'], downbeatSeconds, 0.08)

      return anchor
        ? [
            createDependency(masterTimingMap, {
              fromEventId: event.id,
              toAnchorId: anchor.id,
              dependencyType: 'sync_to_anchor',
              maxOffsetSeconds: 0.16,
              required: false,
              reason: 'Transitions can snap to downbeats when story meaning is already complete.',
            }),
          ]
        : []
    })

  const duckingDependencies = events
    .filter((event) => event.eventType === 'music_duck_start')
    .flatMap((duck) =>
      events
        .filter((event) => event.eventType === 'caption_on' && Math.abs(event.startTimeSeconds - duck.startTimeSeconds) <= 0.8)
        .map((caption) =>
          createDependency(masterTimingMap, {
            fromEventId: duck.id,
            toEventId: caption.id,
            dependencyType: 'starts_before',
            minOffsetSeconds: -0.4,
            maxOffsetSeconds: -0.15,
            reason: 'Music ducking should begin 150-400ms before speech.',
          }),
        ),
    )

  return [...sfxHitDependencies, ...transitionDependencies, ...duckingDependencies]
}

export function createMusicSFXSyncSummary(dependencies: TimingDependencyRecord[]): string {
  return `${dependencies.length} SoundSync dependency/dependencies connect music, SFX, transitions, and speech safety.`
}
