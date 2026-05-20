import type {
  RenderTimingLayerKind,
  RenderTimingTrack,
  StoryTimingTrackType,
} from '../../types/storytiming'

export interface RenderLayerOrderItem {
  trackType: StoryTimingTrackType
  layerKind: RenderTimingLayerKind
  layerOrder: number
  label: string
  notes: string[]
}

export const VISUAL_LAYER_ORDER: StoryTimingTrackType[] = [
  'source_video',
  'cuts',
  'transitions',
  'real_motion',
  'graphic_design',
  'stroke_motion',
  'captions',
  'cta',
  'qa_markers',
  'render_markers',
  'manual',
]

export const AUDIO_LAYER_ORDER: StoryTimingTrackType[] = [
  'source_video',
  'music',
  'sfx',
]

export function layerKindForTrack(trackType: StoryTimingTrackType): RenderTimingLayerKind {
  if (trackType === 'captions') return 'caption'
  if (trackType === 'music' || trackType === 'sfx') return 'audio'
  if (trackType === 'transitions') return 'transition'
  if (trackType === 'stroke_motion' || trackType === 'graphic_design' || trackType === 'real_motion' || trackType === 'cta') return 'overlay'
  if (trackType === 'qa_markers') return 'qa'
  if (trackType === 'render_markers' || trackType === 'manual' || trackType === 'story_beats') return 'marker'
  if (trackType === 'cuts') return 'effect'
  return 'video'
}

function orderForTrack(trackType: StoryTimingTrackType): number {
  const visualIndex = VISUAL_LAYER_ORDER.indexOf(trackType)
  if (visualIndex >= 0) return visualIndex
  const audioIndex = AUDIO_LAYER_ORDER.indexOf(trackType)
  if (audioIndex >= 0) return 50 + audioIndex
  return 90
}

export function createRenderLayerOrder(tracks: RenderTimingTrack[]): RenderLayerOrderItem[] {
  return sortVisualLayers(tracks).map((track) => ({
    trackType: track.trackType,
    layerKind: layerKindForTrack(track.trackType),
    layerOrder: track.layerOrder,
    label: track.label,
    notes: [
      track.trackType === 'captions'
        ? 'Captions should remain visible above most overlays unless a safety adjustment moves them.'
        : `${track.label} follows the StoryTiming manifest layer order.`,
    ],
  }))
}

export function sortVisualLayers<T extends { trackType: StoryTimingTrackType; layerOrder?: number }>(tracks: T[]): T[] {
  return [...tracks].sort((a, b) => orderForTrack(a.trackType) - orderForTrack(b.trackType))
}

export function sortAudioLayers<T extends { trackType: StoryTimingTrackType; layerOrder?: number }>(tracks: T[]): T[] {
  return [...tracks].sort((a, b) => AUDIO_LAYER_ORDER.indexOf(a.trackType) - AUDIO_LAYER_ORDER.indexOf(b.trackType))
}

export function detectLayerOrderConflicts(tracks: RenderTimingTrack[]): string[] {
  const captionTrack = tracks.find((track) => track.trackType === 'captions')
  if (!captionTrack) return []

  return tracks
    .filter((track) =>
      ['real_motion', 'graphic_design', 'stroke_motion', 'cta'].includes(track.trackType) &&
      track.layerOrder >= captionTrack.layerOrder,
    )
    .map((track) => `${track.label} is ordered above captions; captions should stay readable.`)
}

export function createLayerOrderSummary(tracks: RenderTimingTrack[]): string {
  const conflicts = detectLayerOrderConflicts(tracks)
  if (conflicts.length > 0) {
    return `Layer order needs review: ${conflicts[0]}`
  }

  return `Layer order is mock-safe across ${tracks.length} render track(s).`
}
