import type { MusicCueSheetItemRecord, MusicEnergyLevel } from '../../types/audio-music'
import type {
  MasterTimingMapRecord,
  MusicBeatGridRecord,
  TimingAnchorRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

const inferBpmFromEnergy = (energyLevel: MusicEnergyLevel): number => {
  if (energyLevel === 'low' || energyLevel === 'medium_low') return 80
  if (energyLevel === 'medium_high' || energyLevel === 'high') return 128
  return 104
}

const createBeatTimes = (start: number, end: number, bpm: number): number[] => {
  const interval = 60 / bpm
  const times: number[] = []

  for (let time = start; time <= end + 0.001; time += interval) {
    times.push(Number(time.toFixed(3)))
  }

  return times
}

const createBeatAnchor = (
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  timeSeconds: number,
  anchorType: TimingAnchorRecord['anchorType'],
  label: string,
  locked = false,
): TimingAnchorRecord => ({
  id: createMockId('music-beat-anchor'),
  masterTimingMapId: masterTimingMap.id,
  projectId: masterTimingMap.projectId,
  editPlanId: masterTimingMap.editPlanId,
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
  importance: anchorType === 'music_downbeat' || anchorType === 'music_drop' ? 'high' : 'medium',
  primaryAuthority: 'music_rhythm',
  syncMode: 'beat_locked',
  locked,
  notes: [
    'Mock beat-grid anchor. No real beat detection has run.',
    ...cue.adaptationNotes,
  ],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {
    mockOnly: true,
    cueRole: cue.cueRole,
    energyLevel: cue.energyLevel,
  },
})

export function createMockMusicBeatGrid(
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  bpm?: number,
): MusicBeatGridRecord {
  const start = cue.timeRange?.startSeconds ?? 0
  const end = cue.timeRange?.endSeconds ?? Math.min(masterTimingMap.durationSeconds, start + 8)
  const resolvedBpm = bpm ?? inferBpmFromEnergy(cue.energyLevel)
  const beatTimesSeconds = createBeatTimes(start, end, resolvedBpm)
  const downbeatTimesSeconds = beatTimesSeconds.filter((_, index) => index % 4 === 0)
  const midpoint = Number((start + (end - start) * 0.55).toFixed(3))

  return {
    id: createMockId('music-beat-grid'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    musicCueId: cue.id,
    bpm: resolvedBpm,
    startTimeSeconds: start,
    endTimeSeconds: end,
    beatTimesSeconds,
    downbeatTimesSeconds,
    dropTimesSeconds: cue.cueRole === 'montage_drive' || cue.label.toLowerCase().includes('drop') ? [midpoint] : [],
    resolveTimesSeconds: cue.cueRole === 'outro_resolve' ? [Math.max(start, Number((end - 0.5).toFixed(3)))] : [],
    confidence: bpm === undefined ? 'mock_estimate' : 'medium',
    mockOnly: true,
    notes: [
      bpm === undefined
        ? `BPM inferred from ${cue.energyLevel} cue energy; no real beat detection occurred.`
        : 'BPM supplied by mock scenario input; no real beat detection occurred.',
    ],
    createdAt: nowIso(),
  }
}

export function createBeatAnchorsFromMusicCue(
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  beatGrid: MusicBeatGridRecord,
): TimingAnchorRecord[] {
  return beatGrid.beatTimesSeconds
    .filter((_, index) => index % 2 === 0)
    .map((timeSeconds) =>
      createBeatAnchor(masterTimingMap, cue, timeSeconds, 'music_beat', `${cue.label} beat ${timeSeconds.toFixed(3)}s`),
    )
}

export function createDownbeatAnchorsFromMusicCue(
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  beatGrid: MusicBeatGridRecord,
): TimingAnchorRecord[] {
  return beatGrid.downbeatTimesSeconds.map((timeSeconds) =>
    createBeatAnchor(masterTimingMap, cue, timeSeconds, 'music_downbeat', `${cue.label} downbeat ${timeSeconds.toFixed(3)}s`, true),
  )
}

export function createMusicDropAnchors(
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  beatGrid: MusicBeatGridRecord,
): TimingAnchorRecord[] {
  return beatGrid.dropTimesSeconds.map((timeSeconds) =>
    createBeatAnchor(masterTimingMap, cue, timeSeconds, 'music_drop', `${cue.label} drop`, true),
  )
}

export function createMusicResolveAnchors(
  masterTimingMap: MasterTimingMapRecord,
  cue: MusicCueSheetItemRecord,
  beatGrid: MusicBeatGridRecord,
): TimingAnchorRecord[] {
  return beatGrid.resolveTimesSeconds.map((timeSeconds) =>
    createBeatAnchor(masterTimingMap, cue, timeSeconds, 'music_resolve', `${cue.label} resolve`, true),
  )
}

export function findNearestMusicBeat(
  beatGrid: MusicBeatGridRecord | undefined,
  timeSeconds: number,
): number | undefined {
  return beatGrid?.beatTimesSeconds.reduce<number | undefined>((nearest, candidate) => {
    if (nearest === undefined) return candidate
    return Math.abs(candidate - timeSeconds) < Math.abs(nearest - timeSeconds) ? candidate : nearest
  }, undefined)
}

export function findNearestDownbeat(
  beatGrid: MusicBeatGridRecord | undefined,
  timeSeconds: number,
): number | undefined {
  return beatGrid?.downbeatTimesSeconds.reduce<number | undefined>((nearest, candidate) => {
    if (nearest === undefined) return candidate
    return Math.abs(candidate - timeSeconds) < Math.abs(nearest - timeSeconds) ? candidate : nearest
  }, undefined)
}

export function createMusicBeatGridSummary(beatGrids: MusicBeatGridRecord[]): string {
  if (beatGrids.length === 0) {
    return 'No mock music beat grids were needed.'
  }

  return `${beatGrids.length} mock beat grid(s) created; all beat grids are estimates unless scenario BPM was supplied.`
}
