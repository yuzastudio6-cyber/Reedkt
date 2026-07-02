import type {
  MasterTimingMapRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { createTimingConflict } from './storytiming-conflict-service'

export function createAmbiencePreservationAnchors(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingAnchorRecord[] {
  return events
    .filter((event) => event.notes.some((note) => note.toLowerCase().includes('ambience')))
    .map((event) => ({
      id: createMockId('ambience-anchor'),
      masterTimingMapId: masterTimingMap.id,
      projectId: masterTimingMap.projectId,
      editPlanId: masterTimingMap.editPlanId,
      segmentId: event.segmentId,
      sourceSystem: event.sourceSystem,
      sourceRecordId: event.sourceRecordId,
      sourceRef: event.sourceRef,
      anchorType: 'manual',
      anchorLabel: `Preserve ambience near ${event.label}`,
      timeSeconds: event.startTimeSeconds,
      endTimeSeconds: event.endTimeSeconds,
      frameNumber: event.frameStart,
      importance: 'medium',
      primaryAuthority: 'visual_comprehension',
      syncMode: 'loose',
      locked: false,
      notes: ['Ambience preservation marker for food/social, travel, luxury, or natural sound scenes.'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        scope: 'ambience_preservation',
      },
    }))
}

export function validateAmbienceBridgeTiming(
  events: TimingEventRecord[],
): boolean {
  const ambienceEvents = events.filter((event) => event.notes.some((note) => note.toLowerCase().includes('ambience')))
  const denseSfx = events.filter((event) => event.trackType === 'sfx').length
  return ambienceEvents.length === 0 || denseSfx <= 4
}

export function detectAmbienceMaskedConflict(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
): TimingConflictRecord | undefined {
  if (validateAmbienceBridgeTiming(events) && !events.some((event) => event.notes.some((note) => note.includes('force_ambience_masked')))) {
    return undefined
  }

  const ambienceEvent = events.find((event) => event.notes.some((note) => note.toLowerCase().includes('ambience'))) ?? events[0]
  if (!ambienceEvent) return undefined

  return createTimingConflict(
    masterTimingMap,
    'manual_review_needed',
    'medium',
    {
      startSeconds: ambienceEvent.startTimeSeconds,
      endSeconds: Math.max(ambienceEvent.endTimeSeconds, ambienceEvent.startTimeSeconds + 1),
    },
    'Music/SFX density may mask important source ambience.',
    'Food, social, travel, and luxury scenes often need natural ambience to preserve place and texture.',
    'reduce_overlap',
    [ambienceEvent],
  )
}

export function createAmbienceTimingSummary(conflict: TimingConflictRecord | undefined): string {
  return conflict
    ? 'Ambience preservation needs review because music/SFX density may be too high.'
    : 'Ambience timing is preserved in the mock SoundSync pass.'
}
