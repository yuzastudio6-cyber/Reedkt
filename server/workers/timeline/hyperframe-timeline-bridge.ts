import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { HyperframeTimelineBridge } from './timeline-worker-types'

export function buildHyperframeTimelineBridge(timelineManifest: TimelineManifest): HyperframeTimelineBridge {
  return {
    bridgeType: 'hyperframe_timeline_bridge',
    timelineId: timelineManifest.id,
    clips: timelineManifest.clips.map((clip) => ({
      clipId: clip.id,
      label: String(clip.metadata?.reason ?? clip.id),
      sourceRangeSeconds: [clip.sourceRange.startSeconds, clip.sourceRange.endSeconds],
      timelineRangeSeconds: [clip.timelineRange.startSeconds, clip.timelineRange.endSeconds],
      reviewNotes: ['Future Hyperframe interactive preview consumes this bridge; no frontend runtime is invoked in M8.'],
    })),
    editDecisions: timelineManifest.clips.map((clip) => ({
      clipId: clip.id,
      sourceRange: rangeJson(clip.sourceRange),
      timelineRange: rangeJson(clip.timelineRange),
      metadata: clip.metadata ?? {},
    })),
    reviewNotes: timelineManifest.renderNotes,
  }
}

function rangeJson(range: { startSeconds: number; endSeconds: number; startFrame?: number; endFrame?: number }): Record<string, number> {
  return Object.fromEntries(
    Object.entries(range).filter(([, value]) => typeof value === 'number'),
  ) as Record<string, number>
}
