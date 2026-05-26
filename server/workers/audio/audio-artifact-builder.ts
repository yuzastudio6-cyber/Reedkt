import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { buildAudioStoragePath } from './audio-storage-policy'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export function buildAudioArtifactRecord(input: {
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
  return buildMediaArtifactRecord({
    id: `${input.artifactType}-${input.mediaAssetId}-${input.fileName.replace(/[^a-z0-9_-]/gi, '-')}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: input.artifactType,
    storageBucketPurpose: input.artifactType === 'qa_report' ? 'qa_artifacts' : 'analysis_artifacts',
    storageObjectPath: buildAudioStoragePath(input),
    contentType: input.contentType ?? contentType(input.artifactType),
    metadata: {
      milestone: 'production_runtime_m9',
      sourceAudioImmutable: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? false,
    sourceOfTruth: input.sourceOfTruth ?? true,
  })
}

export function buildAudioFoundationArtifacts(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  includeCleanedAudio?: boolean
  includeSeparatedStem?: boolean
}): ToolArtifact[] {
  return [
    buildAudioArtifactRecord({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'audio_analysis_json',
      fileName: 'audio-analysis.json',
      contentType: 'application/json',
      sourceOfTruth: true,
    }),
    ...(input.includeCleanedAudio ? [buildAudioArtifactRecord({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'cleaned_audio',
      fileName: 'cleaned-audio.wav',
      contentType: 'audio/wav',
      sourceOfTruth: true,
    })] : []),
    ...(input.includeSeparatedStem ? [buildAudioArtifactRecord({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'separated_audio_stem',
      fileName: 'vocals-stem.wav',
      contentType: 'audio/wav',
      sourceOfTruth: true,
    })] : []),
    buildAudioArtifactRecord({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'qa_report',
      fileName: 'audio-qa.json',
      contentType: 'application/json',
      sourceOfTruth: false,
    }),
  ]
}

function contentType(artifactType: ToolArtifact['artifactType']): string {
  if (artifactType === 'cleaned_audio' || artifactType === 'separated_audio_stem') return 'audio/wav'
  return 'application/json'
}
