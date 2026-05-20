import type {
  MasterTimingMapRecord,
  RenderTimingManifestEvent,
  RenderTimingManifestRecord,
  RenderTimingManifestStatus,
  RenderTimingTrack,
  StoryTimingQACheckRecord,
  StoryTimingSourceSystem,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { JSONObject } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

const TRACK_LABELS: Record<StoryTimingTrackType, string> = {
  source_video: 'Source video',
  output_video: 'Output video',
  transcript: 'Transcript',
  story_beats: 'Story beats',
  cuts: 'Cuts',
  transitions: 'Transitions',
  captions: 'Captions',
  music: 'Music',
  sfx: 'SFX',
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design',
  real_motion: 'Real Motion',
  cta: 'CTA',
  render_markers: 'Render markers',
  qa_markers: 'QA markers',
  manual: 'Manual markers',
}

const TRACK_ORDER: StoryTimingTrackType[] = [
  'source_video',
  'cuts',
  'transitions',
  'captions',
  'music',
  'sfx',
  'stroke_motion',
  'graphic_design',
  'real_motion',
  'cta',
  'qa_markers',
  'render_markers',
]

const defaultSourceSystemForTrack = (trackType: StoryTimingTrackType): StoryTimingSourceSystem => {
  if (trackType === 'captions') return 'caption_plan'
  if (trackType === 'music') return 'music_cue'
  if (trackType === 'sfx') return 'sfx_alignment'
  if (trackType === 'stroke_motion') return 'stroke_motion'
  if (trackType === 'graphic_design') return 'graphic_design'
  if (trackType === 'real_motion') return 'real_motion'
  if (trackType === 'cuts') return 'cut_decision'
  if (trackType === 'transitions') return 'transition_plan'
  if (trackType === 'qa_markers') return 'qa_report'
  if (trackType === 'render_markers') return 'render_job'
  return 'edit_plan'
}

export function createRenderTimingTracks(events: TimingEventRecord[]): RenderTimingTrack[] {
  const eventIdsByTrack = new Map<StoryTimingTrackType, string[]>()
  events.forEach((event) => {
    eventIdsByTrack.set(event.trackType, [...(eventIdsByTrack.get(event.trackType) ?? []), event.id])
  })

  return TRACK_ORDER.filter((trackType) => trackType === 'source_video' || eventIdsByTrack.has(trackType)).map((trackType, index) => ({
    id: createMockId('render-timing-track'),
    trackType,
    label: TRACK_LABELS[trackType],
    layerOrder: index,
    sourceSystem: defaultSourceSystemForTrack(trackType),
    eventIds: eventIdsByTrack.get(trackType) ?? [],
    notes: trackType === 'source_video'
      ? ['Source video track is a mock placeholder for future render workers.']
      : [`${TRACK_LABELS[trackType]} timing comes from StoryTiming events.`],
  }))
}

export function createRenderTimingManifestEvents(events: TimingEventRecord[]): RenderTimingManifestEvent[] {
  return events.map((event) => {
    const payload: JSONObject = {
      label: event.label,
      canShift: event.canShift,
      locked: event.locked,
      notes: event.notes,
    }

    if (event.visibilityLayer) {
      payload.visibilityLayer = event.visibilityLayer
    }

    if (event.audioLayer) {
      payload.audioLayer = event.audioLayer
    }

    return {
      eventId: event.id,
      eventType: event.eventType,
      trackType: event.trackType,
      startTimeSeconds: event.startTimeSeconds,
      hitTimeSeconds: event.hitTimeSeconds,
      endTimeSeconds: event.endTimeSeconds,
      sourceSystem: event.sourceSystem,
      sourceRecordId: event.sourceRecordId,
      payload,
    }
  })
}

export function validateRenderTimingManifestReadiness(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): {
  readyForRender: boolean
  status: RenderTimingManifestStatus
  blockingConflictIds: string[]
  blockingCheckIds: string[]
  warnings: string[]
} {
  const blockingConflictIds = conflicts.filter((conflict) => conflict.blocksRender).map((conflict) => conflict.id)
  const blockingCheckIds = qaChecks.filter((check) => check.blocksRender).map((check) => check.id)
  const readyForRender = blockingConflictIds.length === 0 && blockingCheckIds.length === 0
  const warnings = readyForRender
    ? []
    : ['Render timing manifest remains draft until blocking timing conflicts and QA checks are resolved.']

  return {
    readyForRender,
    status: readyForRender ? 'ready_for_worker' : 'draft',
    blockingConflictIds,
    blockingCheckIds,
    warnings,
  }
}

export function createRenderTimingManifest(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
  dependencies: TimingDependencyRecord[],
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): ServiceResult<{
  renderTimingManifest: RenderTimingManifestRecord
  readyForRender: boolean
  blockingConflictIds: string[]
  warnings: string[]
}> {
  const readiness = validateRenderTimingManifestReadiness(conflicts, qaChecks)
  const renderTimingManifest: RenderTimingManifestRecord = {
    id: createMockId('render-timing-manifest'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    status: readiness.status,
    durationSeconds: masterTimingMap.durationSeconds,
    frameRate: masterTimingMap.frameRate,
    tracks: createRenderTimingTracks(events),
    events: createRenderTimingManifestEvents(events),
    dependencies: dependencies.map((dependency) => dependency.id),
    conflictsResolved: conflicts.filter((conflict) => !conflict.blocksRender).map((conflict) => conflict.id),
    readyForRender: readiness.readyForRender,
    workerNotes: [
      'Mock render timing manifest only; no renderer, media processor, or worker is invoked.',
      readiness.readyForRender
        ? 'Manifest is timing-safe for future worker planning.'
        : 'Resolve blocking timing checks before worker readiness.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      blockingConflictIds: readiness.blockingConflictIds,
      blockingCheckIds: readiness.blockingCheckIds,
    },
  }

  return ok(
    {
      renderTimingManifest,
      readyForRender: readiness.readyForRender,
      blockingConflictIds: readiness.blockingConflictIds,
      warnings: readiness.warnings,
    },
    readiness.warnings,
  )
}

export function createRenderTimingManifestFromTimingMap(
  masterTimingMap: MasterTimingMapRecord,
  events: TimingEventRecord[],
  dependencies: TimingDependencyRecord[],
): ServiceResult<{ renderTimingManifest: RenderTimingManifestRecord }> {
  const manifestResult = createRenderTimingManifest(masterTimingMap, events, dependencies)
  if (!manifestResult.ok) {
    return manifestResult
  }

  return ok({ renderTimingManifest: manifestResult.data.renderTimingManifest }, manifestResult.warnings)
}

export function createRenderTimingManifestSummary(renderTimingManifest: RenderTimingManifestRecord): string {
  return `${renderTimingManifest.status} manifest with ${renderTimingManifest.tracks.length} tracks and ${renderTimingManifest.events.length} timed events.`
}

export {
  buildRenderTimingManifest,
  buildRenderTimingManifestFromMockDatabase,
  buildRenderTimingManifestFromTimingMap,
  createRenderTimingManifestSummary as createWorkerReadyRenderTimingManifestSummary,
} from './render-timing-manifest-builder-service'
