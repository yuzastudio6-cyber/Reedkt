import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export async function buildTimelineArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'timeline_manifest' | 'opentimelineio_manifest' | 'qa_report'>
  fileName: string
  payload: unknown
  outputRoot?: string
  mode: 'dry_run' | 'local_dev'
  sourceOfTruth?: boolean
}): Promise<{
  artifact: ToolArtifact
  localFilePath?: string
}> {
  const storageObjectPath = safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    'timeline',
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
      milestone: 'production_runtime_m8',
      noFinalExport: true,
    },
    previewAllowed: false,
    sourceOfTruth: input.sourceOfTruth ?? input.artifactType === 'timeline_manifest',
  })

  if (input.mode === 'local_dev' && input.outputRoot) {
    const localFilePath = await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.outputRoot,
      relativePath: input.fileName,
      content: JSON.stringify(input.payload, null, 2),
    })
    return { artifact, localFilePath }
  }

  return { artifact }
}
