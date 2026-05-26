import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { EnhancementExecutionMode } from './enhancement-execution-types'

export type EnhancementArtifactType = Extract<ToolArtifact['artifactType'], 'enhanced_video' | 'representative_frame' | 'preview_video' | 'qa_report'>

export function buildEnhancementArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: EnhancementArtifactType
  fileName: string
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `${input.artifactType}-${input.mediaAssetId}-${input.fileName.replace(/[^a-z0-9_-]/gi, '-')}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: input.artifactType,
    storageBucketPurpose: bucketPurpose(input.artifactType),
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'enhancement',
      input.fileName,
    ),
    contentType: input.contentType ?? contentType(input.artifactType),
    metadata: {
      milestone: 'production_runtime_m15d',
      sourceMediaImmutable: true,
      sampleFirst: true,
      noFinalRender: true,
      noModelDownloads: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? (input.artifactType === 'preview_video' || input.artifactType === 'representative_frame'),
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType !== 'preview_video',
  })
}

export async function buildEnhancementArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: EnhancementArtifactType
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<EnhancementExecutionMode, 'production_blocked'>
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildEnhancementArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && input.artifactType === 'qa_report') {
    const localFilePath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.fileName), input.outputDirectory)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, JSON.stringify(input.payload, null, 2), 'utf8')
    return { artifact, localFilePath }
  }
  return { artifact }
}

function bucketPurpose(artifactType: EnhancementArtifactType): ToolArtifact['storageBucketPurpose'] {
  if (artifactType === 'qa_report') return 'qa_artifacts'
  if (artifactType === 'preview_video') return 'previews'
  return 'generated_assets'
}

function contentType(artifactType: EnhancementArtifactType): string {
  if (artifactType === 'representative_frame') return 'image/png'
  if (artifactType === 'enhanced_video' || artifactType === 'preview_video') return 'video/mp4'
  return 'application/json'
}
