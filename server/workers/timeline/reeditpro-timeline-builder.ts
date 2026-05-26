import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { TimelineBuildInput } from './timeline-worker-types'

export function buildReeditproTimelineManifest(input: TimelineBuildInput): TimelineManifest {
  let timelineCursor = 0
  const clips = input.smartCutPlan.keepSegments.map((segment, index) => {
    const duration = segment.endSeconds - segment.startSeconds
    const clip = {
      id: `timeline-clip-${index + 1}`,
      sourceMediaAssetId: input.mediaAssetId,
      sourceRange: { startSeconds: segment.startSeconds, endSeconds: segment.endSeconds },
      timelineRange: { startSeconds: round(timelineCursor), endSeconds: round(timelineCursor + duration) },
      trackId: 'video-main',
      metadata: {
        smartCutDecisionId: segment.decisionId,
        reason: segment.reason,
        protected: segment.protected,
      },
    }
    timelineCursor += duration
    return clip
  })

  return {
    id: `timeline-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedSnapshotId: input.approvedSnapshotId,
    mediaAssetId: input.mediaAssetId,
    version: 'm8-draft-1',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds: round(timelineCursor),
    clips,
    audioLayers: [{
      id: 'audio-source-layer',
      layerType: 'source_audio',
      timelineRange: { startSeconds: 0, endSeconds: round(timelineCursor) },
      artifactIds: [],
      metadata: { sourceMediaAssetId: input.mediaAssetId },
    }],
    captionLayers: (input.captionArtifactIds ?? []).map((artifactId, index) => ({
      id: `caption-layer-${index + 1}`,
      layerType: 'caption_segments',
      timelineRange: { startSeconds: 0, endSeconds: round(timelineCursor) },
      artifactIds: [artifactId],
      metadata: optionalMetadata({
        transcriptArtifactId: input.transcriptArtifactId,
        wordTimestampArtifactId: input.wordTimestampArtifactId,
      }),
    })),
    overlayLayers: [],
    maskLayers: [],
    colorOperations: [],
    renderNotes: [
      'Milestone 8 timeline manifest is edit-decision metadata only.',
      'No render/export is performed by timeline foundation.',
      ...input.smartCutPlan.removeSegments.map((segment) => `Remove candidate ${segment.decisionId}: ${segment.reason}`),
    ],
    sourceReferences: [{
      storageBucketPurpose: 'source_media',
      storageObjectPath: input.sourceStorageObjectPath ?? `workspaces/${input.workspaceId}/projects/${input.projectId}/media/${input.mediaAssetId}/source`,
      sourceOfTruth: true,
    }],
    createdAt: new Date().toISOString(),
  }
}

function round(value: number): number {
  return Number(value.toFixed(3))
}

function optionalMetadata(input: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value === 'string')) as Record<string, string>
}
