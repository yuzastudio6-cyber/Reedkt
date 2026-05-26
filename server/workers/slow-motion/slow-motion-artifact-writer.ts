import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { SlowMotionExecutionMode } from './slow-motion-execution-types'

export type SlowMotionArtifactType = Extract<ToolArtifact['artifactType'], 'interpolated_video' | 'preview_video' | 'qa_report'>

export function buildSlowMotionArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: SlowMotionArtifactType
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
    storageBucketPurpose: input.artifactType === 'qa_report' ? 'qa_artifacts' : input.artifactType === 'preview_video' ? 'previews' : 'generated_assets',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'slow-motion',
      input.fileName,
    ),
    contentType: input.contentType ?? (input.artifactType === 'qa_report' ? 'application/json' : 'video/mp4'),
    metadata: {
      milestone: 'production_runtime_m15d',
      sourceMediaImmutable: true,
      selectedClipOnly: true,
      noFinalRender: true,
      noModelDownloads: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? input.artifactType === 'preview_video',
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType !== 'preview_video',
  })
}

export async function buildSlowMotionArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: SlowMotionArtifactType
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<SlowMotionExecutionMode, 'production_blocked'>
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildSlowMotionArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && input.artifactType === 'qa_report') {
    const localFilePath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.fileName), input.outputDirectory)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, JSON.stringify(input.payload, null, 2), 'utf8')
    return { artifact, localFilePath }
  }
  return { artifact }
}
