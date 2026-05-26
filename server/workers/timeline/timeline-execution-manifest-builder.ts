import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { TimelineExecutionInput } from './timeline-execution-types'

export function buildTimelineExecutionManifest(input: TimelineExecutionInput): TimelineManifest {
  let timelineCursor = 0
  const clips = input.executionPlan.keepSegments.map((segment, index) => {
    const durationSeconds = round(segment.endSeconds - segment.startSeconds)
    const clip = {
      id: `m14-timeline-clip-${index + 1}`,
      sourceMediaAssetId: input.mediaAssetId,
      sourceRange: { startSeconds: segment.startSeconds, endSeconds: segment.endSeconds },
      timelineRange: { startSeconds: round(timelineCursor), endSeconds: round(timelineCursor + durationSeconds) },
      trackId: 'video-main',
      metadata: {
        milestone: 'production_runtime_m14',
        smartCutDecisionId: segment.decisionId,
        smartCutExecutionPlanId: input.executionPlan.executionPlanId,
        reason: segment.reason,
        protected: segment.protected,
        previewOnly: true,
      },
    }
    timelineCursor += durationSeconds
    return clip
  })
  const durationSeconds = round(timelineCursor)

  return {
    id: `timeline-execution-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? 'edit-plan-not-set',
    approvedSnapshotId: input.approvedSnapshotId ?? 'approved-snapshot-not-set',
    mediaAssetId: input.mediaAssetId,
    version: 'm14-execution-1',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds,
    clips,
    audioLayers: [{
      id: 'audio-source-placeholder',
      layerType: 'source_audio_placeholder',
      timelineRange: { startSeconds: 0, endSeconds: durationSeconds },
      artifactIds: [],
      metadata: {
        milestone: 'production_runtime_m14',
        audioCleanupExecuted: false,
      },
    }],
    captionLayers: (input.captionArtifactIds ?? []).map((artifactId, index) => ({
      id: `caption-layer-${index + 1}`,
      layerType: 'caption_segments',
      timelineRange: { startSeconds: 0, endSeconds: durationSeconds },
      artifactIds: [artifactId],
      metadata: {
        transcriptArtifactIds: input.transcriptArtifactIds ?? [],
      },
    })),
    overlayLayers: [],
    maskLayers: [],
    colorOperations: [],
    renderNotes: [
      'Milestone 14 timeline execution manifest is preview/edit metadata only.',
      'No final export, full Remotion render, evaluation-only video runtime, color, mask, or audio cleanup execution is performed.',
      ...input.executionPlan.removeSegments.map((segment) => `Remove ${segment.decisionId}: ${segment.reason}`),
      ...input.executionPlan.warnings,
    ],
    sourceReferences: [{
      storageBucketPurpose: input.proxyVideoArtifactId ? 'proxy_media' : 'source_media',
      storageObjectPath: input.sourceStorageObjectPath ?? `workspaces/${input.workspaceId}/projects/${input.projectId}/media/${input.mediaAssetId}/source-or-proxy`,
      sourceOfTruth: !input.proxyVideoArtifactId,
    }],
    createdAt: new Date().toISOString(),
  }
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
