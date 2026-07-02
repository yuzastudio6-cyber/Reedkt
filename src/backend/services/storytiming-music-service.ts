import type { MusicCueSheetItemRecord } from '../../types/audio-music'
import type {
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

const findSegmentForTime = (
  segments: StoryTimingSegmentRecord[],
  timeSeconds: number,
): StoryTimingSegmentRecord | undefined =>
  segments.find(
    (segment) =>
      timeSeconds >= segment.outputTimeRange.startSeconds &&
      timeSeconds <= segment.outputTimeRange.endSeconds,
  )

const createMusicAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  segments: StoryTimingSegmentRecord[],
  timeSeconds: number,
  anchorType: TimingAnchorRecord['anchorType'],
  label: string,
  locked = false,
): TimingAnchorRecord => {
  const segment = findSegmentForTime(segments, timeSeconds)

  return {
    id: createMockId('music-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: 'music_cue',
    sourceRecordId: cue.id,
    sourceRef: {
      sourceSystem: 'music_cue',
      sourceRecordId: cue.id,
      sourceTableName: 'music_cue_sheet_items',
      label,
    },
    anchorType,
    anchorLabel: label,
    anchorText: cue.label,
    timeSeconds,
    frameNumber: Math.round(timeSeconds * masterTimingMap.frameRate),
    importance: anchorType === 'music_drop' || anchorType === 'music_resolve' ? 'high' : 'medium',
    primaryAuthority: segment?.hasSpeech ? 'speech_meaning' : 'music_rhythm',
    syncMode: segment?.hasSpeech ? 'loose' : 'beat_locked',
    locked,
    notes: [
      `Music cue role: ${cue.cueRole}.`,
      ...cue.adaptationNotes,
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      cueRole: cue.cueRole,
      energyLevel: cue.energyLevel,
      speechSafety: cue.speechSafety,
    },
  }
}

const createMusicEvent = (
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  segments: StoryTimingSegmentRecord[],
  timeSeconds: number,
  eventType: TimingEventRecord['eventType'],
  label: string,
): TimingEventRecord => {
  const segment = findSegmentForTime(segments, timeSeconds)

  return {
    id: createMockId('music-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: 'music_cue',
    sourceRecordId: cue.id,
    sourceRef: {
      sourceSystem: 'music_cue',
      sourceRecordId: cue.id,
      sourceTableName: 'music_cue_sheet_items',
      label,
    },
    eventType,
    trackType: 'music',
    label,
    startTimeSeconds: timeSeconds,
    endTimeSeconds: timeSeconds,
    durationSeconds: 0,
    frameStart: Math.round(timeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(timeSeconds * masterTimingMap.frameRate),
    priority: segment?.hasSpeech ? 'medium' : 'high',
    syncMode: segment?.hasSpeech ? 'loose' : 'beat_locked',
    canShift: true,
    locked: false,
    audioLayer: 'music',
    notes: [
      `Music cue timing is mock-local and source-linked to ${cue.label}.`,
      ...cue.adaptationNotes,
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      cueRole: cue.cueRole,
      speechSafety: cue.speechSafety,
    },
  }
}

export function createMusicCueStartEndEvents(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingEventRecord[] {
  return musicCues
    .filter((cue) => cue.timeRange)
    .flatMap((cue) => [
      createMusicEvent(masterTimingMap, cue, segments, cue.timeRange?.startSeconds ?? 0, 'music_cue_start', `${cue.label} music cue starts`),
      createMusicEvent(masterTimingMap, cue, segments, cue.timeRange?.endSeconds ?? 0, 'music_cue_end', `${cue.label} music cue ends`),
    ])
}

export function createMusicEnergyArcAnchors(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return musicCues
    .filter((cue) => cue.timeRange)
    .flatMap((cue) => {
      const start = cue.timeRange?.startSeconds ?? 0
      const end = cue.timeRange?.endSeconds ?? start
      const midpoint = Number((start + (end - start) * 0.55).toFixed(3))
      const anchors = [
        createMusicAnchor(masterTimingMap, cue, segments, start, 'music_beat', `${cue.label} cue start`, cue.cueRole === 'chapter_punctuation'),
      ]

      if (cue.cueRole === 'montage_drive' || cue.energyLevel === 'medium_high' || cue.energyLevel === 'high') {
        anchors.push(createMusicAnchor(masterTimingMap, cue, segments, midpoint, 'music_drop', `${cue.label} music drop`, true))
      }

      return anchors
    })
}

export function createMusicResolveAnchors(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return musicCues
    .filter((cue) => cue.timeRange && (cue.cueRole === 'outro_resolve' || cue.label.toLowerCase().includes('resolve')))
    .map((cue) =>
      createMusicAnchor(
        masterTimingMap,
        cue,
        segments,
        Math.max(cue.timeRange?.startSeconds ?? 0, (cue.timeRange?.endSeconds ?? 0) - 0.5),
        'music_resolve',
        `${cue.label} music resolve`,
        true,
      ),
    )
}

export function createMusicTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return [
    ...createMusicEnergyArcAnchors(masterTimingMap, musicCues, segments),
    ...createMusicResolveAnchors(masterTimingMap, musicCues, segments),
  ]
}

export function createMusicTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingEventRecord[] {
  return createMusicCueStartEndEvents(masterTimingMap, musicCues, segments)
}

export function createMusicTimingSummary(musicEvents: TimingEventRecord[], musicAnchors: TimingAnchorRecord[]): string {
  return `${musicEvents.length} music cue event(s) and ${musicAnchors.length} music timing anchor(s) are connected to StoryTiming.`
}
