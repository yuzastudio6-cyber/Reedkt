import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'

export function buildTrackBSyntheticTimelineManifest(input: {
  workspaceId?: string
  projectId?: string
  approvedSnapshotId?: string
  editPlanId?: string
  mediaAssetId?: string
  timelineId?: string
  fps?: number
} = {}): TimelineManifest {
  const fps = input.fps ?? 30
  const workspaceId = input.workspaceId ?? 'workspace-trackb-synthetic-rehearsal'
  const projectId = input.projectId ?? 'project-trackb-synthetic-rehearsal'
  const approvedSnapshotId = input.approvedSnapshotId ?? 'approved-snapshot-trackb-synthetic-rehearsal'
  const mediaAssetId = input.mediaAssetId ?? 'synthetic-media-asset-trackb-rehearsal'

  return {
    id: input.timelineId ?? 'timeline-trackb-synthetic-rehearsal',
    workspaceId,
    projectId,
    editPlanId: input.editPlanId ?? 'edit-plan-trackb-synthetic-rehearsal',
    approvedSnapshotId,
    mediaAssetId,
    version: 'trackb-synthetic-v1',
    timelineFormat: 'reeditpro_timeline',
    durationSeconds: 2,
    clips: [
      {
        id: 'synthetic-clip-001',
        sourceMediaAssetId: mediaAssetId,
        sourceRange: {
          startSeconds: 0,
          endSeconds: 2,
          startFrame: 0,
          endFrame: 2 * fps,
        },
        timelineRange: {
          startSeconds: 0,
          endSeconds: 2,
          startFrame: 0,
          endFrame: 2 * fps,
        },
        trackId: 'synthetic-video-track-001',
        metadata: {
          reason: 'Track B bounded synthetic timeline rehearsal; no user media is read.',
          syntheticOnly: true,
        },
      },
    ],
    audioLayers: [],
    captionLayers: [],
    overlayLayers: [],
    maskLayers: [],
    colorOperations: [],
    renderNotes: [
      'Track B synthetic timeline rehearsal only.',
      'No renderer, browser capture, user media, artifact write, Supabase/GCS write, beta, or production scope is enabled.',
    ],
    sourceReferences: [
      {
        storageBucketPurpose: 'worker_temp',
        storageObjectPath: 'synthetic://trackb/no-user-media/timeline-rehearsal',
        sourceOfTruth: false,
      },
    ],
    createdAt: new Date().toISOString(),
  }
}
