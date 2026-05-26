import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { TranscriptArtifactPayload, TranscriptSegment, SpeechModelInfo, SpeechFoundationIssue } from './speech-worker-types'

export interface BuildTranscriptPayloadInput {
  language?: string
  languageConfidence?: number
  segments: TranscriptSegment[]
  sourceAudioArtifactId: string
  modelInfo: SpeechModelInfo
  confidence?: number
  issues?: SpeechFoundationIssue[]
}

export interface BuildTranscriptArtifactInput extends BuildTranscriptPayloadInput {
  workspaceId: string
  projectId: string
  mediaAssetId: string
}

export function buildTranscriptPayload(input: BuildTranscriptPayloadInput): TranscriptArtifactPayload {
  return {
    language: input.language,
    languageConfidence: input.languageConfidence,
    segments: input.segments,
    fullText: input.segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim(),
    durationSeconds: input.segments.at(-1)?.endSeconds ?? 0,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo: input.modelInfo,
    confidence: input.confidence ?? averageConfidence(input.segments),
    issues: input.issues ?? [],
  }
}

export function buildTranscriptArtifactRecord(input: BuildTranscriptArtifactInput): ToolArtifact {
  const payload = buildTranscriptPayload(input)
  return buildMediaArtifactRecord({
    id: `transcript-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'transcript_json',
    storageBucketPurpose: 'transcripts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'transcripts',
      'transcript.json',
    ),
    contentType: 'application/json',
    metadata: {
      milestone: 'production_runtime_m7',
      sourceAudioArtifactId: input.sourceAudioArtifactId,
      language: input.language ?? 'unknown',
      segmentCount: input.segments.length,
      confidence: payload.confidence,
    },
    previewAllowed: false,
    sourceOfTruth: true,
  })
}

function averageConfidence(segments: TranscriptSegment[]): number {
  const confidences = segments
    .map((segment) => segment.confidence)
    .filter((value): value is number => typeof value === 'number')
  if (confidences.length === 0) return 0
  return Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(3))
}
