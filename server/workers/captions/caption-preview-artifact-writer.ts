import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export function buildCaptionPreviewArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  localFilePath?: string
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `caption-preview-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'preview_video',
    storageBucketPurpose: 'previews',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'previews',
      'caption-preview.mp4',
    ),
    contentType: 'video/mp4',
    metadata: {
      milestone: 'production_runtime_m13',
      previewType: 'caption_preview',
      ...(input.localFilePath ? { localFilePath: input.localFilePath } : {}),
      finalExport: false,
      renderer: 'ffmpeg_libass',
    },
    previewAllowed: true,
    sourceOfTruth: false,
  })
}
