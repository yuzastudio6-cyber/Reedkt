import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { RemotionCompositionManifest } from './timeline-worker-types'

export function buildRemotionCompositionManifest(input: {
  timelineManifest: TimelineManifest
  fps?: number
  canvas?: { width: number; height: number }
  captionArtifactIds?: string[]
}): RemotionCompositionManifest {
  const fps = input.fps ?? 30
  const canvas = input.canvas ?? { width: 1080, height: 1920 }
  return {
    manifestType: 'remotion_composition_manifest',
    compositionId: `remotion-${input.timelineManifest.id}`,
    durationInFrames: Math.ceil(input.timelineManifest.durationSeconds * fps),
    fps,
    canvas,
    clips: input.timelineManifest.clips.map((clip) => ({
      clipId: clip.id,
      fromFrame: Math.round(clip.timelineRange.startSeconds * fps),
      durationInFrames: Math.round((clip.timelineRange.endSeconds - clip.timelineRange.startSeconds) * fps),
      sourceRange: rangeJson(clip.sourceRange),
      sourceMediaAssetId: clip.sourceMediaAssetId,
    })),
    captionArtifactIds: input.captionArtifactIds ?? [],
    renderNotes: [
      'Remotion manifest metadata only; no render is performed in Milestone 8.',
      ...input.timelineManifest.renderNotes,
    ],
  }
}

function rangeJson(range: { startSeconds: number; endSeconds: number; startFrame?: number; endFrame?: number }): Record<string, number> {
  return Object.fromEntries(
    Object.entries(range).filter(([, value]) => typeof value === 'number'),
  ) as Record<string, number>
}
