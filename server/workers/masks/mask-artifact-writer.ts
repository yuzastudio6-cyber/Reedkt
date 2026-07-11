import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { MaskExecutionMode } from './mask-execution-types'

export type MaskArtifactType = Extract<ToolArtifact['artifactType'], 'mask_image' | 'mask_sequence' | 'rgba_cutout' | 'qa_report' | 'preview_video' | 'render_manifest'>

export function buildMaskArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: MaskArtifactType
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
      'masks',
      input.fileName,
    ),
    contentType: input.contentType ?? contentType(input.artifactType),
    metadata: {
      milestone: 'production_runtime_m15c',
      sourceMediaImmutable: true,
      noFinalRender: true,
      noModelDownloads: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? input.artifactType === 'preview_video',
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType !== 'preview_video',
  })
}

export async function buildMaskArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: MaskArtifactType
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<MaskExecutionMode, 'production_blocked'>
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildMaskArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && input.artifactType !== 'preview_video') {
    const localFilePath = await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.outputDirectory,
      relativePath: input.fileName,
      content: JSON.stringify(input.payload, null, 2),
    })
    return { artifact, localFilePath }
  }
  return { artifact }
}

function bucketPurpose(artifactType: MaskArtifactType): ToolArtifact['storageBucketPurpose'] {
  if (artifactType === 'qa_report') return 'qa_artifacts'
  if (artifactType === 'preview_video') return 'previews'
  if (artifactType === 'render_manifest') return 'generated_assets'
  return 'masks'
}

function contentType(artifactType: MaskArtifactType): string {
  if (artifactType === 'mask_image' || artifactType === 'rgba_cutout') return 'image/png'
  if (artifactType === 'preview_video') return 'video/mp4'
  return 'application/json'
}
