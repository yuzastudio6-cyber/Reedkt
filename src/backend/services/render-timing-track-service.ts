import type {
  RenderTimingTrack,
  StoryTimingSourceSystem,
  StoryTimingTrackType,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId } from '../mock/mock-database'
import { layerKindForTrack, sortVisualLayers } from './render-timing-layer-order-service'

const TRACK_LABELS: Record<StoryTimingTrackType, string> = {
  captions: 'Captions',
  cta: 'CTA',
  cuts: 'Cuts',
  graphic_design: 'Graphic Design',
  manual: 'Manual markers',
  music: 'Music',
  output_video: 'Output video',
  qa_markers: 'QA markers',
  real_motion: 'Real Motion',
  render_markers: 'Render markers',
  sfx: 'SFX',
  source_video: 'Source video',
  story_beats: 'Story beats',
  stroke_motion: 'Stroke Motion',
  transcript: 'Transcript',
  transitions: 'Transitions',
}

const DEFAULT_TRACK_ORDER: StoryTimingTrackType[] = [
  'source_video',
  'output_video',
  'cuts',
  'transitions',
  'real_motion',
  'graphic_design',
  'stroke_motion',
  'captions',
  'cta',
  'music',
  'sfx',
  'story_beats',
  'qa_markers',
  'render_markers',
  'manual',
]

function sourceSystemForTrack(trackType: StoryTimingTrackType): StoryTimingSourceSystem {
  if (trackType === 'captions') return 'caption_plan'
  if (trackType === 'cuts') return 'cut_decision'
  if (trackType === 'transitions') return 'transition_plan'
  if (trackType === 'music') return 'music_cue'
  if (trackType === 'sfx') return 'sfx_alignment'
  if (trackType === 'stroke_motion') return 'stroke_motion'
  if (trackType === 'graphic_design') return 'graphic_design'
  if (trackType === 'real_motion') return 'real_motion'
  if (trackType === 'qa_markers') return 'qa_report'
  if (trackType === 'render_markers') return 'render_job'
  return 'edit_plan'
}

function createTrack(
  trackType: StoryTimingTrackType,
  eventIds: string[],
  layerOrder: number,
): RenderTimingTrack {
  const label = TRACK_LABELS[trackType]
  const kind = layerKindForTrack(trackType)

  return {
    id: createMockId('render-timing-track'),
    trackType,
    label,
    layerOrder,
    sourceSystem: sourceSystemForTrack(trackType),
    eventIds,
    notes: [
      trackType === 'source_video'
        ? 'Source video track is a mock placeholder; no media is decoded.'
        : `${label} ${kind} timing is derived from StoryTiming events.`,
    ],
  }
}

function eventsByTrack(events: TimingEventRecord[]): Map<StoryTimingTrackType, string[]> {
  const map = new Map<StoryTimingTrackType, string[]>()
  events.forEach((event) => {
    map.set(event.trackType, [...(map.get(event.trackType) ?? []), event.id])
  })
  return map
}

function createTracksForTypes(
  trackTypes: StoryTimingTrackType[],
  eventIdsByTrack: Map<StoryTimingTrackType, string[]>,
): RenderTimingTrack[] {
  return trackTypes
    .filter((trackType) => trackType === 'source_video' || trackType === 'output_video' || eventIdsByTrack.has(trackType))
    .map((trackType) => createTrack(trackType, eventIdsByTrack.get(trackType) ?? [], DEFAULT_TRACK_ORDER.indexOf(trackType)))
}

export function createVideoTracks(events: TimingEventRecord[] = []): RenderTimingTrack[] {
  return createTracksForTypes(['source_video', 'output_video', 'cuts', 'transitions'], eventsByTrack(events))
}

export function createAudioTracks(events: TimingEventRecord[] = []): RenderTimingTrack[] {
  return createTracksForTypes(['music', 'sfx'], eventsByTrack(events))
}

export function createOverlayTracks(events: TimingEventRecord[] = []): RenderTimingTrack[] {
  return createTracksForTypes(['real_motion', 'graphic_design', 'stroke_motion', 'cta'], eventsByTrack(events))
}

export function createCaptionTracks(events: TimingEventRecord[] = []): RenderTimingTrack[] {
  return createTracksForTypes(['captions'], eventsByTrack(events))
}

export function createMarkerTracks(events: TimingEventRecord[] = []): RenderTimingTrack[] {
  return createTracksForTypes(['story_beats', 'qa_markers', 'render_markers', 'manual'], eventsByTrack(events))
}

export function sortRenderTimingTracks(tracks: RenderTimingTrack[]): RenderTimingTrack[] {
  return sortVisualLayers(tracks).map((track, index) => ({
    ...track,
    layerOrder: index,
  }))
}

export function createRenderTimingTracks(input: {
  events: TimingEventRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  omitTrackTypes?: StoryTimingTrackType[]
  layerOrderOverrides?: Partial<Record<StoryTimingTrackType, number>>
}): RenderTimingTrack[] {
  const eventIdsByTrack = eventsByTrack(input.events)
  ;(input.requiredTrackTypes ?? []).forEach((trackType) => {
    eventIdsByTrack.set(trackType, eventIdsByTrack.get(trackType) ?? [])
  })

  const omitted = new Set(input.omitTrackTypes ?? [])
  const trackTypes = DEFAULT_TRACK_ORDER.filter((trackType) =>
    !omitted.has(trackType) &&
    (trackType === 'source_video' || trackType === 'output_video' || eventIdsByTrack.has(trackType)),
  )
  const tracks = trackTypes.map((trackType) =>
    createTrack(trackType, eventIdsByTrack.get(trackType) ?? [], input.layerOrderOverrides?.[trackType] ?? DEFAULT_TRACK_ORDER.indexOf(trackType)),
  )

  return input.layerOrderOverrides ? tracks : sortRenderTimingTracks(tracks)
}

export function createTrackSummary(tracks: RenderTimingTrack[]): string {
  return `${tracks.length} render timing track(s): ${tracks.map((track) => track.label).join(', ')}.`
}
