import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { safeJoinStoragePath } from '../media/media-path-safety'
import type { JSONObject } from '../../../src/types/shared'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { CaptionSegment } from '../captions'
import type {
  SpeechModelInfo,
  TranscriptArtifactPayload,
  WordTimestampArtifactPayload,
} from './speech-worker-types'

export function buildSpeechExecutionTranscriptArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  transcript: TranscriptArtifactPayload
  modelInfo: SpeechModelInfo
}): ToolArtifact {
  return buildSpeechJsonArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'transcript_json',
    fileName: 'transcript.json',
    metadata: {
      milestone: 'production_runtime_m13',
      modelInfo: modelInfoMetadata(input.modelInfo),
      ...(input.transcript.language ? { language: input.transcript.language } : {}),
      segmentCount: input.transcript.segments.length,
    },
  })
}

export function buildSpeechExecutionWordTimestampArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  wordTimestamps: WordTimestampArtifactPayload
  modelInfo: SpeechModelInfo
}): ToolArtifact {
  return buildSpeechJsonArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'word_timestamps_json',
    fileName: 'word-timestamps.json',
    metadata: {
      milestone: 'production_runtime_m13',
      modelInfo: modelInfoMetadata(input.modelInfo),
      wordCount: input.wordTimestamps.words.length,
    },
  })
}

function modelInfoMetadata(modelInfo: SpeechModelInfo): JSONObject {
  return {
    toolId: modelInfo.toolId,
    ...(modelInfo.modelName ? { modelName: modelInfo.modelName } : {}),
    ...(modelInfo.modelVersion ? { modelVersion: modelInfo.modelVersion } : {}),
    ...(modelInfo.modelWeightManifestId ? { modelWeightManifestId: modelInfo.modelWeightManifestId } : {}),
    ...(modelInfo.localModelReference ? { localModelReference: modelInfo.localModelReference } : {}),
  }
}

export function buildSpeechExecutionCaptionSegmentsArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  captionSegments: CaptionSegment[]
}): ToolArtifact {
  return buildSpeechJsonArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'caption_segments_json',
    fileName: 'caption-segments.json',
    metadata: {
      milestone: 'production_runtime_m13',
      captionCount: input.captionSegments.length,
    },
  })
}

export function buildSpeechExecutionQaArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  qaResults: QualityGateResult[]
}): ToolArtifact {
  return buildSpeechJsonArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'qa_report',
    fileName: 'speech-caption-qa.json',
    metadata: {
      milestone: 'production_runtime_m13',
      gateCount: input.qaResults.length,
    },
  })
}

function buildSpeechJsonArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  artifactType: 'transcript_json' | 'word_timestamps_json' | 'caption_segments_json' | 'qa_report'
  fileName: string
  metadata: JSONObject
}): ToolArtifact {
  return buildMediaArtifactRecord({
    id: `speech-exec-${input.artifactType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: input.artifactType,
    storageBucketPurpose: input.artifactType === 'qa_report' ? 'qa_artifacts' : 'transcripts',
    storageObjectPath: safeJoinStoragePath(
      'workspaces',
      input.workspaceId,
      'projects',
      input.projectId,
      'media',
      input.mediaAssetId,
      'speech-caption',
      input.fileName,
    ),
    contentType: 'application/json',
    metadata: input.metadata,
    previewAllowed: false,
    sourceOfTruth: true,
  })
}
