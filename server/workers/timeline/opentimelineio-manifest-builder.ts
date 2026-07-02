import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { OpenTimelineIOStyleManifest } from './timeline-worker-types'

export function buildOpenTimelineIOStyleManifest(input: {
  timelineManifest: TimelineManifest
  mediaReferencePath: string
  fps?: number
}): OpenTimelineIOStyleManifest {
  const rate = input.fps ?? 30
  return {
    OTIO_SCHEMA: 'Timeline.1',
    name: input.timelineManifest.id,
    tracks: [{
      kind: 'Video',
      children: input.timelineManifest.clips.map((clip) => ({
        OTIO_SCHEMA: 'Clip.2',
        name: clip.id,
        source_range: {
          start_time: { value: secondsToFrames(clip.sourceRange.startSeconds, rate), rate },
          duration: { value: secondsToFrames(clip.sourceRange.endSeconds - clip.sourceRange.startSeconds, rate), rate },
        },
        media_reference: {
          OTIO_SCHEMA: 'ExternalReference.1',
          target_url: input.mediaReferencePath,
        },
        metadata: {
          reeditproTimelineRange: rangeJson(clip.timelineRange),
          reeditproMetadata: clip.metadata ?? {},
        },
      })),
    }],
    metadata: {
      source: 'reeditpro_m8_otio_style_manifest',
      packageImportRequired: false,
      note: 'OpenTimelineIO-compatible JSON style only; real package validation is deferred.',
    },
  }
}

export function serializeOpenTimelineIOStyleManifest(manifest: OpenTimelineIOStyleManifest): string {
  return JSON.stringify(manifest, null, 2)
}

function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps)
}

function rangeJson(range: { startSeconds: number; endSeconds: number; startFrame?: number; endFrame?: number }): Record<string, number> {
  return Object.fromEntries(
    Object.entries(range).filter(([, value]) => typeof value === 'number'),
  ) as Record<string, number>
}
