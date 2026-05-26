import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { JSONObject } from '../../../src/types/shared'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { CaptionFileBuildResult, CaptionSegment } from './caption-worker-types'

export function buildCaptionExecutionSegmentsArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  captionSegments: CaptionSegment[]
}): ToolArtifact {
  return buildCaptionJsonArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    fileName: 'caption-segments.json',
    metadata: {
      milestone: 'production_runtime_m13',
      captionCount: input.captionSegments.length,
    },
  })
}

export function buildCaptionExecutionFileArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  captionFile: CaptionFileBuildResult
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `caption-exec-${input.captionFile.format}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'caption_segments_json',
    storageBucketPurpose: 'transcripts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'captions',
      `captions.${input.captionFile.format === 'webvtt' ? 'vtt' : input.captionFile.format}`,
    ),
    contentType: contentTypeForCaptionFormat(input.captionFile.format),
    metadata: {
      milestone: 'production_runtime_m13',
      captionFormat: input.captionFile.format,
      representedAsArtifactType: 'caption_segments_json',
    },
    previewAllowed: false,
    sourceOfTruth: true,
  })
}

export function buildCaptionExecutionQaArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  qaResults: QualityGateResult[]
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `caption-exec-qa-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'qa_report',
    storageBucketPurpose: 'qa_artifacts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'captions',
      'caption-qa.json',
    ),
    contentType: 'application/json',
    metadata: {
      milestone: 'production_runtime_m13',
      gateCount: input.qaResults.length,
    },
    previewAllowed: false,
    sourceOfTruth: true,
  })
}

function buildCaptionJsonArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  fileName: string
  metadata: JSONObject
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `caption-exec-segments-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'caption_segments_json',
    storageBucketPurpose: 'transcripts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'captions',
      input.fileName,
    ),
    contentType: 'application/json',
    metadata: input.metadata,
    previewAllowed: false,
    sourceOfTruth: true,
  })
}

function contentTypeForCaptionFormat(format: CaptionFileBuildResult['format']): string {
  if (format === 'srt') return 'application/x-subrip'
  if (format === 'webvtt') return 'text/vtt'
  return 'text/x-ssa'
}
