import type { MotionStudioAudioReviewSummaryDto } from './audio-review'
import type { MotionStudioAudioCandidateReviewSummaryDto } from './audio-candidate-review'

export type MotionStudioAudioMixStemRole = 'narration' | 'music' | 'foley' | 'exact_sfx'

export interface MotionStudioAudioMixInputSelection {
  role: MotionStudioAudioMixStemRole
  stemId: string
  mediaAssetId: string
  checksumSha256: string
  startFrame: number
  endFrame: number
  cueAuthorityId: string
  cueReason: string
  rightsEvidenceId: string
}

export interface CreateMotionStudioAudioMixBindingRequest {
  audioAuthorityId: string
  sourceApprovedSnapshotId: string
  executionApprovedSnapshotId: string
  mixPlanVersionId: string
  mixPlanContentDigest: string
  jobId: string
  fps: 24 | 30
  durationFrames: number
  inputs: readonly MotionStudioAudioMixInputSelection[]
}

export interface ExecuteMotionStudioAudioMixRequest {
  bindingId: string
}

export type MotionStudioAudioMixState =
  | 'queued'
  | 'in_progress'
  | 'resumable'
  | 'reconciliation_required'
  | 'blocked'
  | 'failed'
  | 'cancelled'
  | 'ready_for_private_review'

export interface MotionStudioAudioMixInputSummaryDto {
  role: MotionStudioAudioMixStemRole
  stemId: string
  mediaAssetId: string
  checksumSha256: string
  startFrame: number
  endFrame: number
  cueAuthorityId: string
  cueReason: string
  rightsEvidenceId: string
  mimeType: 'audio/wav'
  audioCodec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 1 | 2
  sampleCountPerChannel: number
}

export interface MotionStudioAudioMixQualityDto {
  integratedLufs: number
  loudnessRangeLu: number
  truePeakDbfs: number
  samplePeakDbfs: number
  speechPriorityRatio: number
  gateResults: readonly {
    gate: 'file_integrity' | 'format' | 'duration_sync' | 'integrated_loudness' |
      'true_peak' | 'sample_clipping' | 'cue_timing' | 'speech_priority' |
      'rights_provenance'
    result: 'passed'
    blocking: true
  }[]
  qaEvidenceDigest: string
}

export interface MotionStudioAudioMixArtifactDto {
  artifactId: string
  sha256: string
  byteLength: number
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 2
  sampleCountPerChannel: number
  durationFrames: number
  fps: 24 | 30
  quality: MotionStudioAudioMixQualityDto
  privateReviewOnly: true
  contentPath: string
}

export interface MotionStudioAudioMixBindingDto {
  bindingId: string
  productionId: string
  audioAuthorityId: string
  sourceApprovedSnapshotId: string
  executionApprovedSnapshotId: string
  mixPlanVersionId: string
  mixPlanContentDigest: string
  jobId: string
  profileId: 'motion_studio_storytelling_speech_safe_mix_v1'
  state: MotionStudioAudioMixState
  fps: 24 | 30
  durationFrames: number
  sampleCountPerChannel: number
  inputs: readonly MotionStudioAudioMixInputSummaryDto[]
  attemptCount: number
  latestAttemptNumber?: number
  providerCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
  artifact?: MotionStudioAudioMixArtifactDto
  createdAt: string
}

export interface MotionStudioAudioMixWorkspaceDto {
  productionId: string
  state: 'empty' | 'active' | 'ready_for_private_review' | 'attention_required'
  bindings: readonly MotionStudioAudioMixBindingDto[]
  candidateReviews?: readonly MotionStudioAudioCandidateReviewSummaryDto[]
  acceptanceReview?: MotionStudioAudioReviewSummaryDto
  warning: string
}

export interface MotionStudioAudioMixExecutionReceiptDto {
  binding: MotionStudioAudioMixBindingDto
  artifact: MotionStudioAudioMixArtifactDto
  usage: {
    costEstimateItemId: string
    meterId: 'cpu_second'
    quantity: number
    internalCostMicros: number
  }
  privateReviewOnly: true
}
