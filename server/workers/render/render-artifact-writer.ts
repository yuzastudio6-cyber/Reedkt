import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { FinalRenderExecutionMode } from './render-execution-types'

export type RenderArtifactType = Extract<ToolArtifact['artifactType'], 'render_manifest' | 'preview_video' | 'final_export' | 'qa_report'>

export function buildRenderArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: RenderArtifactType
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
      'final-render',
      input.fileName,
    ),
    contentType: input.contentType ?? contentType(input.artifactType),
    metadata: {
      milestone: 'production_runtime_m16a',
      privateUntilDeliveryPolicy: input.artifactType === 'final_export',
      sourceMediaImmutable: true,
      noSignedUrls: true,
      noRevideo: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? input.artifactType === 'preview_video',
    sourceOfTruth: input.sourceOfTruth ?? (input.artifactType === 'final_export' || input.artifactType === 'render_manifest'),
  })
}

export async function buildRenderArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: RenderArtifactType
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<FinalRenderExecutionMode, 'production_blocked'>
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildRenderArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && (input.artifactType === 'qa_report' || input.artifactType === 'render_manifest')) {
    const localFilePath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.fileName), input.outputDirectory)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, JSON.stringify(input.payload, null, 2), 'utf8')
    return { artifact, localFilePath }
  }
  return { artifact }
}

function bucketPurpose(artifactType: RenderArtifactType): ToolArtifact['storageBucketPurpose'] {
  if (artifactType === 'qa_report') return 'qa_artifacts'
  if (artifactType === 'preview_video') return 'previews'
  if (artifactType === 'final_export') return 'final_exports'
  return 'generated_assets'
}

function contentType(artifactType: RenderArtifactType): string {
  if (artifactType === 'render_manifest' || artifactType === 'qa_report') return 'application/json'
  return 'video/mp4'
}
