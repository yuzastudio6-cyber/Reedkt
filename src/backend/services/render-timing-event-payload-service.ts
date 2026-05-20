import type {
  RenderTimingAssetRequirement,
  RenderTimingManifestEvent,
  StoryTimingEventType,
  StoryTimingTrackType,
  TimingEventRecord,
} from '../../types/storytiming'
import type { JSONObject } from '../../types/shared'

export function assetRequirementForTrack(trackType: StoryTimingTrackType): RenderTimingAssetRequirement {
  if (trackType === 'source_video' || trackType === 'output_video') return 'source_media_required'
  if (trackType === 'captions') return 'caption_asset_generated'
  if (trackType === 'music') return 'music_asset_required'
  if (trackType === 'sfx') return 'sfx_asset_required'
  if (trackType === 'stroke_motion' || trackType === 'graphic_design' || trackType === 'real_motion') return 'generated_asset_required'
  if (trackType === 'cta') return 'overlay_asset_required'
  return 'no_asset_required'
}

function basePayload(event: TimingEventRecord, workerNote: string): JSONObject {
  return {
    label: event.label,
    trackType: event.trackType,
    sourceSystem: event.sourceSystem,
    sourceRecordId: event.sourceRecordId ?? '',
    assetRequirement: assetRequirementForTrack(event.trackType),
    canShift: event.canShift,
    locked: event.locked,
    visibilityLayer: event.visibilityLayer ?? '',
    audioLayer: event.audioLayer ?? '',
    workerNote,
    mockOnly: true,
  }
}

export function createCutRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Apply cut timing from StoryTiming only; do not reinterpret speech meaning.')
}

export function createCaptionRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Caption timing must remain readable and above most overlays.')
}

export function createMusicRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Music cue and ducking timing must protect dialogue.')
}

export function createSFXRenderPayload(event: TimingEventRecord): JSONObject {
  return {
    ...basePayload(event, 'SFX hit/tail timing must stay subtle and voice-safe.'),
    hitTimeSeconds: event.hitTimeSeconds ?? event.startTimeSeconds,
  }
}

export function createStrokeMotionRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Stroke Motion timing should land on phrase meaning and completion anchors.')
}

export function createGraphicDesignRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Graphic Design timing should preserve readability and caption safety.')
}

export function createRealMotionRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Real Motion timing must remain face-safe and object-safe.')
}

export function createTransitionRenderPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'Transition timing must not cut important words or story beats.')
}

export function createQAMarkerPayload(event: TimingEventRecord): JSONObject {
  return basePayload(event, 'QA markers are mock-only and should not appear in final export.')
}

export function createRenderEventPayload(event: TimingEventRecord): JSONObject {
  if (event.trackType === 'cuts') return createCutRenderPayload(event)
  if (event.trackType === 'captions') return createCaptionRenderPayload(event)
  if (event.trackType === 'music') return createMusicRenderPayload(event)
  if (event.trackType === 'sfx') return createSFXRenderPayload(event)
  if (event.trackType === 'stroke_motion') return createStrokeMotionRenderPayload(event)
  if (event.trackType === 'graphic_design') return createGraphicDesignRenderPayload(event)
  if (event.trackType === 'real_motion') return createRealMotionRenderPayload(event)
  if (event.trackType === 'transitions') return createTransitionRenderPayload(event)
  if (event.trackType === 'qa_markers' || event.trackType === 'render_markers' || event.trackType === 'manual') return createQAMarkerPayload(event)
  return basePayload(event, 'Use StoryTiming event timing exactly as provided.')
}

export function createRenderManifestEvents(events: TimingEventRecord[]): RenderTimingManifestEvent[] {
  return events.map((event) => ({
    eventId: event.id,
    eventType: event.eventType as StoryTimingEventType,
    trackType: event.trackType,
    startTimeSeconds: event.startTimeSeconds,
    hitTimeSeconds: event.hitTimeSeconds,
    endTimeSeconds: event.endTimeSeconds,
    sourceSystem: event.sourceSystem,
    sourceRecordId: event.sourceRecordId,
    payload: createRenderEventPayload(event),
  }))
}
