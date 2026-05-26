import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ColorExecutionMode } from './color-execution-types'

export function buildColorArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'color_analysis_json' | 'color_grade_recipe' | 'graded_preview' | 'qa_report'>
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
    storageBucketPurpose: input.artifactType === 'qa_report' ? 'qa_artifacts' : 'analysis_artifacts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'color',
      input.fileName,
    ),
    contentType: input.contentType ?? contentType(input.artifactType),
    metadata: {
      milestone: 'production_runtime_m15b',
      sourceMediaImmutable: true,
      noFinalExport: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? input.artifactType === 'graded_preview',
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType !== 'graded_preview',
  })
}

export async function buildColorArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'color_analysis_json' | 'color_grade_recipe' | 'graded_preview' | 'qa_report'>
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<ColorExecutionMode, 'production_blocked'>
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildColorArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && input.artifactType !== 'graded_preview') {
    const localFilePath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.fileName), input.outputDirectory)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, JSON.stringify(input.payload, null, 2), 'utf8')
    return { artifact, localFilePath }
  }
  return { artifact }
}

function contentType(artifactType: ToolArtifact['artifactType']): string {
  if (artifactType === 'graded_preview') return 'video/mp4'
  return 'application/json'
}
