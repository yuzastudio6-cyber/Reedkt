import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { SpeechModelInfo, TranscriptSegment, TranscriptWord, WordTimestampArtifactPayload } from './speech-worker-types'

export function flattenTranscriptWords(segments: TranscriptSegment[]): TranscriptWord[] {
  return segments.flatMap((segment) => segment.words.map((word) => ({
    ...word,
    segmentId: word.segmentId || segment.segmentId,
  })))
}

export function buildWordTimestampPayload(input: {
  segments: TranscriptSegment[]
  sourceAudioArtifactId: string
  modelInfo: SpeechModelInfo
}): WordTimestampArtifactPayload {
  return {
    words: flattenTranscriptWords(input.segments),
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo: input.modelInfo,
  }
}

export function buildWordTimestampArtifactRecord(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceAudioArtifactId: string
  segments: TranscriptSegment[]
  modelInfo: SpeechModelInfo
}): ToolArtifact {
  const payload = buildWordTimestampPayload(input)
  return buildMediaArtifactRecord({
    id: `word-timestamps-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'word_timestamps_json',
    storageBucketPurpose: 'transcripts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'transcripts',
      'word-timestamps.json',
    ),
    contentType: 'application/json',
    metadata: {
      milestone: 'production_runtime_m7',
      sourceAudioArtifactId: input.sourceAudioArtifactId,
      wordCount: payload.words.length,
    },
    previewAllowed: false,
    sourceOfTruth: true,
  })
}
