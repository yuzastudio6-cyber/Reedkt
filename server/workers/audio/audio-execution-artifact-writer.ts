import { buildAudioArtifactRecord } from './audio-artifact-builder'
import { writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { AudioExecutionMode } from './audio-execution-types'

export function buildAudioExecutionArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'audio_analysis_json' | 'cleaned_audio' | 'separated_audio_stem' | 'qa_report'>
  fileName: string
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): ToolArtifact {
  return buildAudioArtifactRecord({
    ...input,
    metadata: {
      milestone: 'production_runtime_m15a',
      sourceAudioImmutable: true,
      noFinalMux: true,
      ...(input.metadata ?? {}),
    },
  })
}

export async function buildAudioExecutionArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'audio_analysis_json' | 'cleaned_audio' | 'separated_audio_stem' | 'qa_report'>
  fileName: string
  payload?: unknown
  outputDirectory?: string
  mode: Exclude<AudioExecutionMode, 'production_blocked'>
  contentType?: string
  sourceOfTruth?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): Promise<{ artifact: ToolArtifact; localFilePath?: string }> {
  const artifact = buildAudioExecutionArtifactRecord(input)
  if (input.mode === 'local_dev' && input.outputDirectory && input.payload !== undefined && input.contentType !== 'audio/wav') {
    const localFilePath = await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.outputDirectory,
      relativePath: input.fileName,
      content: JSON.stringify(input.payload, null, 2),
    })
    return { artifact, localFilePath }
  }
  return { artifact }
}
