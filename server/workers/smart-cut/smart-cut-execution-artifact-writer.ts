import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export async function buildSmartCutExecutionArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'timeline_manifest' | 'opentimelineio_manifest' | 'qa_report'>
  fileName: string
  payload: unknown
  outputDirectory?: string
  mode: 'dry_run' | 'local_dev' | 'container_ready' | 'production_ready'
  sourceOfTruth?: boolean
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const storageObjectPath = safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    'smart-cut-execution',
    input.fileName,
  )
  const artifact = buildMediaArtifactRecord({
    id: `${input.artifactType}-${input.mediaAssetId}-${input.fileName.replace(/[^a-z0-9_-]/gi, '-')}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: input.artifactType,
    storageBucketPurpose: input.artifactType === 'qa_report' ? 'qa_artifacts' : 'analysis_artifacts',
    storageObjectPath,
    contentType: 'application/json',
    metadata: {
      milestone: 'production_runtime_m14',
      noFinalExport: true,
      executionOnly: true,
    },
    previewAllowed: false,
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType === 'timeline_manifest',
  })

  if (input.mode === 'local_dev' && input.outputDirectory) {
    const localFilePath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.fileName), input.outputDirectory)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, JSON.stringify(input.payload, null, 2), 'utf8')
    return { artifact, localFilePath }
  }

  return { artifact }
}

export function buildSmartCutPreviewArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  previewLocalPath?: string
}): ToolArtifact {
  const storageObjectPath = safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    'previews',
    'smart-cut-proxy-preview.mp4',
  )

  return buildMediaArtifactRecord({
    id: `preview_video-${input.mediaAssetId}-smart-cut-proxy-preview`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'preview_video',
    storageBucketPurpose: 'previews',
    storageObjectPath,
    contentType: 'video/mp4',
    metadata: {
      milestone: 'production_runtime_m14',
      previewType: 'smart_cut_proxy_preview',
      localPathPresent: Boolean(input.previewLocalPath),
      finalExport: false,
    },
    previewAllowed: true,
    sourceOfTruth: false,
  })
}
