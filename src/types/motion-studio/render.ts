import type { ID, ISODateString } from '../shared'
import type { MotionStudioDigest, MotionStudioVersionReference } from './shared'

export type MotionStudioPreviewStatus =
  | 'queued'
  | 'rendering'
  | 'failed'
  | 'reconciliation_required'
  | 'cancelled'
  | 'ready'

/**
 * The browser selects existing immutable authority only. Render dimensions,
 * timing, props, cost and worker inputs are always derived by the backend.
 */
export interface CreateMotionStudioPreviewBindingRequest {
  approvedSnapshotId: ID
  sceneDocumentArtifactId: ID
  sceneDocumentVersionId: ID
  sceneDocumentContentDigest: MotionStudioDigest
  timelineProposalId: ID
  jobId: ID
}

export interface ExecuteMotionStudioPreviewRequest {
  bindingId: ID
}

export interface MotionStudioPreviewFrameEvidenceDto {
  frame: number
  sha256: MotionStudioDigest
}

export interface MotionStudioPreviewArtifactDto {
  id: ID
  bindingId: ID
  jobId: ID
  attemptId: ID
  sha256: MotionStudioDigest
  byteLength: number
  mimeType: 'video/mp4'
  codec: 'h264'
  pixelFormat: 'yuv420p'
  colorSpace: 'bt709'
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  durationFrames: number
  sceneStartFrame: number
  sceneEndFrame: number
  frameEvidence: readonly MotionStudioPreviewFrameEvidenceDto[]
  runtimeIdentityDigest: MotionStudioDigest
  attestationDigest: MotionStudioDigest
  qaEvidenceDigest: MotionStudioDigest
  createdAt: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioPreviewBindingDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  sceneDocument: MotionStudioVersionReference
  timelineProposalId: ID
  timelineProposalOutputDigest: MotionStudioDigest
  jobId: ID
  approvedWorkItemId: ID
  compositionProfileId: 'motion_studio_scene_preview_v1' | 'motion_studio_native_layered_scene_v1'
  layeredAssemblyId?: ID
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  durationFrames: number
  sceneStartFrame: number
  sceneEndFrame: number
  status: MotionStudioPreviewStatus
  failureCategory?: string
  currentAttemptId?: ID
  artifact?: MotionStudioPreviewArtifactDto
  createdAt: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioPreviewWorkspaceDto {
  productionId: ID
  bindings: readonly MotionStudioPreviewBindingDto[]
  localCandidateOnly: true
}

export interface MotionStudioPreviewExecutionReceiptDto {
  binding: MotionStudioPreviewBindingDto
  artifact: MotionStudioPreviewArtifactDto
  usage: {
    costEstimateItemId: ID
    meterId: 'render_frame'
    quantity: number
    internalCostMicros: number
  }
  localCandidateOnly: true
}
