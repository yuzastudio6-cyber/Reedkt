import { stat } from 'node:fs/promises'
import path from 'node:path'
import type { JSONObject } from '../../../src/types/shared'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { assertNoSignedUrlOrRawUrl, assertNoPathTraversal } from './media-path-safety'
import type { MediaFoundationArtifactSummary } from './media-worker-types'

export interface BuildMediaArtifactRecordInput {
  id?: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolRunId?: string
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  contentType?: string
  sizeBytes?: number
  checksum?: string
  metadata?: JSONObject
  previewAllowed?: boolean
  sourceOfTruth?: boolean
  createdAt?: string
  expiresAt?: string
}

export function buildMediaArtifactRecord(input: BuildMediaArtifactRecordInput): ToolArtifact {
  assertNoSignedUrlOrRawUrl(input.storageObjectPath, 'storageObjectPath')
  assertNoPathTraversal(input.storageObjectPath, 'storageObjectPath')

  return {
    id: input.id ?? buildArtifactId(input.artifactType, input.storageObjectPath),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolRunId: input.toolRunId,
    artifactType: input.artifactType,
    storageBucketPurpose: input.storageBucketPurpose,
    storageObjectPath: input.storageObjectPath,
    contentType: input.contentType ?? contentTypeForArtifact(input.artifactType),
    sizeBytes: input.sizeBytes,
    checksum: input.checksum,
    createdAt: input.createdAt ?? new Date().toISOString(),
    expiresAt: input.expiresAt,
    isPrivate: true,
    metadata: input.metadata ?? {},
    previewAllowed: input.previewAllowed ?? (
      input.artifactType === 'proxy_video' ||
      input.artifactType === 'representative_frame'
    ),
    sourceOfTruth: input.sourceOfTruth ?? true,
  }
}

export async function buildMediaArtifactSummaryFromLocalFile(input: {
  artifactId?: string
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  localFilePath: string
  contentType?: string
  timeSeconds?: number
  frameNumber?: number
}): Promise<MediaFoundationArtifactSummary> {
  assertNoSignedUrlOrRawUrl(input.storageObjectPath, 'storageObjectPath')
  assertNoPathTraversal(input.storageObjectPath, 'storageObjectPath')
  const localStat = await stat(input.localFilePath)
  return {
    artifactId: input.artifactId ?? buildArtifactId(input.artifactType, input.storageObjectPath),
    artifactType: input.artifactType,
    storageBucketPurpose: input.storageBucketPurpose,
    storageObjectPath: input.storageObjectPath,
    localFilePath: input.localFilePath,
    contentType: input.contentType ?? contentTypeForArtifact(input.artifactType),
    sizeBytes: localStat.size,
    timeSeconds: input.timeSeconds,
    frameNumber: input.frameNumber,
    sourceOfTruth: true,
    isPrivate: true,
  }
}

export function buildArtifactRecordsFromSummaries(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  summaries: MediaFoundationArtifactSummary[]
}): ToolArtifact[] {
  return input.summaries.map((summary) => buildMediaArtifactRecord({
    id: summary.artifactId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: summary.artifactType,
    storageBucketPurpose: summary.storageBucketPurpose,
    storageObjectPath: summary.storageObjectPath,
    contentType: summary.contentType,
    sizeBytes: summary.sizeBytes,
    checksum: summary.checksum,
    metadata: metadataFromSummary(summary),
    previewAllowed: summary.artifactType === 'proxy_video' || summary.artifactType === 'representative_frame',
    sourceOfTruth: true,
  }))
}

export function contentTypeForArtifact(artifactType: ToolArtifactType): string {
  switch (artifactType) {
    case 'proxy_video':
      return 'video/mp4'
    case 'extracted_audio':
      return 'audio/wav'
    case 'keyframe_image':
    case 'representative_frame':
      return 'image/jpeg'
    case 'scene_report_json':
    case 'visual_analysis_json':
    case 'audio_analysis_json':
      return 'application/json'
    default:
      return 'application/octet-stream'
  }
}

function buildArtifactId(artifactType: ToolArtifactType, storageObjectPath: string): string {
  const basename = path.basename(storageObjectPath).replace(/[^a-zA-Z0-9_-]/g, '-')
  return `media-${artifactType}-${basename}`.slice(0, 120)
}

function metadataFromSummary(summary: MediaFoundationArtifactSummary): JSONObject {
  const metadata: JSONObject = {
    milestone: 'production_runtime_m6',
    source: 'media_analysis_foundation',
  }
  if (typeof summary.timeSeconds === 'number') metadata.timeSeconds = summary.timeSeconds
  if (typeof summary.frameNumber === 'number') metadata.frameNumber = summary.frameNumber
  if (typeof summary.width === 'number') metadata.width = summary.width
  if (typeof summary.height === 'number') metadata.height = summary.height
  return metadata
}
