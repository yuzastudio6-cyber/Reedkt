import type {
  MotionStudioPreviewArtifactDto,
  MotionStudioPreviewBindingDto,
  MotionStudioPreviewWorkspaceDto,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'

export interface MotionStudioRenderBindingRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  scene_document_artifact_id: string
  scene_document_version_id: string
  scene_document_version_number: number
  scene_document_content_digest: string
  timeline_proposal_id: string
  timeline_proposal_output_digest: string
  job_id: string
  approved_work_item_id: string
  cost_budget_id: string
  registered_profile_id: 'motion_studio_scene_preview_v1' | 'motion_studio_native_layered_scene_v1'
  layered_assembly_id: string | null
  scene_id: string
  semantic_purpose: string
  production_mode: 'generative_first' | 'layered_first' | 'native_graphics_first' | 'footage_first' | 'hybrid_directed'
  layer_type: 'image' | 'source_footage' | 'generated_video' | 'text' | 'caption' | 'map' | 'chart' | 'mask' | 'audio' | 'effect'
  width: number
  height: number
  fps_numerator: 24 | 30
  fps_denominator: 1
  duration_frames: number
  scene_start_frame: number
  scene_end_frame: number
  input_digest: string
  created_by: string
  created_at: string
}

export interface MotionStudioRenderArtifactRow {
  id: string
  binding_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  job_id: string
  attempt_id: string
  private_object_identity_hash: string
  artifact_sha256: string
  byte_length: number
  mime_type: 'video/mp4'
  codec: 'h264'
  pixel_format: 'yuv420p'
  color_space: 'bt709'
  width: number
  height: number
  fps_numerator: 24 | 30
  fps_denominator: 1
  duration_frames: number
  scene_start_frame: number
  scene_end_frame: number
  frame_evidence_json: readonly { frame: number; sha256: string }[]
  runtime_identity_digest: string
  attestation_digest: string
  qa_evidence_digest: string
  created_at: string
}

export interface MotionStudioRenderJobRow {
  id: string
  production_id: string
  approved_snapshot_id: string
  approved_work_item_id: string
  cost_budget_id: string
  work_item_type: string
  required_worker_class: string
  status: 'waiting' | 'queued' | 'claimed' | 'running' | 'cancel_requested' | 'reconciliation_required' | 'blocked' | 'succeeded' | 'failed' | 'cancelled'
  maximum_authorized_internal_cost_micros: number
  attempt_count: number
  max_attempts: number
}

export interface MotionStudioRenderAttemptRow {
  id: string
  job_id: string
  attempt_number: number
  status: 'claimed' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown'
  failure_category: string | null
  started_at: string | null
  completed_at: string | null
}

export interface MotionStudioRenderLeaseRow {
  id: string
  job_id: string
  attempt_id: string
  credential_hash_sha256: string
  status: 'active' | 'released' | 'expired'
  expires_at: string
}

export interface MotionStudioRenderCostAuthority {
  estimateItemId: string
  capabilityOrToolId: 'remotion'
  rateCardVersionId: string
  unit: 'render_frame'
  quantity: number
  expectedInternalCostMicros: number
  maximumAuthorizedInternalCostMicros: number
  unitPriceMicros: number
  minimumChargeMicros: number
}

export interface MotionStudioRenderExecutionAuthority {
  binding: MotionStudioRenderBindingRow
  job: MotionStudioRenderJobRow
  attempt: MotionStudioRenderAttemptRow
  lease: MotionStudioRenderLeaseRow
  cost: MotionStudioRenderCostAuthority
  artifact?: MotionStudioRenderArtifactRow
}

export interface MotionStudioRenderRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  readWorkspaceState(productionId: string): Promise<{
    bindings: MotionStudioRenderBindingRow[]
    jobs: Map<string, MotionStudioRenderJobRow>
    attempts: Map<string, MotionStudioRenderAttemptRow>
    artifacts: Map<string, MotionStudioRenderArtifactRow>
  }>
  createBinding(input: {
    productionId: string
    approvedSnapshotId: string
    sceneDocumentArtifactId: string
    sceneDocumentVersionId: string
    sceneDocumentContentDigest: string
    timelineProposalId: string
    jobId: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioRenderBindingRow>
  findExecutionAuthority(bindingId: string, leaseId: string): Promise<MotionStudioRenderExecutionAuthority | undefined>
  completeAttempt(input: {
    bindingId: string
    leaseId: string
    credentialHash: string
    privateObjectIdentityHash: string
    artifactSha256: string
    byteLength: number
    frameEvidence: readonly { frame: number; sha256: string }[]
    runtimeIdentityDigest: string
    attestationDigest: string
    qaEvidenceDigest: string
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioRenderArtifactRow>
  findArtifact(artifactId: string): Promise<MotionStudioRenderArtifactRow | undefined>
}

export function previewArtifactDto(row: MotionStudioRenderArtifactRow): MotionStudioPreviewArtifactDto {
  return {
    id: row.id,
    bindingId: row.binding_id,
    jobId: row.job_id,
    attemptId: row.attempt_id,
    sha256: row.artifact_sha256,
    byteLength: row.byte_length,
    mimeType: row.mime_type,
    codec: row.codec,
    pixelFormat: row.pixel_format,
    colorSpace: row.color_space,
    width: row.width,
    height: row.height,
    fpsNumerator: row.fps_numerator,
    fpsDenominator: row.fps_denominator,
    durationFrames: row.duration_frames,
    sceneStartFrame: row.scene_start_frame,
    sceneEndFrame: row.scene_end_frame,
    frameEvidence: row.frame_evidence_json,
    runtimeIdentityDigest: row.runtime_identity_digest,
    attestationDigest: row.attestation_digest,
    qaEvidenceDigest: row.qa_evidence_digest,
    createdAt: row.created_at,
    localCandidateOnly: true,
  }
}

export function previewBindingDto(
  binding: MotionStudioRenderBindingRow,
  job: MotionStudioRenderJobRow,
  attempt: MotionStudioRenderAttemptRow | undefined,
  artifact: MotionStudioRenderArtifactRow | undefined,
): MotionStudioPreviewBindingDto {
  const status = artifact
    ? 'ready'
    : job.status === 'running' || job.status === 'claimed' || job.status === 'cancel_requested'
      ? 'rendering'
      : job.status === 'reconciliation_required'
        ? 'reconciliation_required'
        : job.status === 'cancelled'
          ? 'cancelled'
          : job.status === 'failed' || job.status === 'blocked' || job.status === 'succeeded' ||
              (job.status === 'queued' && attempt?.status === 'failed')
            ? 'failed'
            : 'queued'
  return {
    id: binding.id,
    productionId: binding.production_id,
    approvedSnapshotId: binding.approved_snapshot_id,
    sceneDocument: {
      artifactId: binding.scene_document_artifact_id,
      versionId: binding.scene_document_version_id,
      versionNumber: binding.scene_document_version_number,
      contentDigest: binding.scene_document_content_digest,
    },
    timelineProposalId: binding.timeline_proposal_id,
    timelineProposalOutputDigest: binding.timeline_proposal_output_digest,
    jobId: binding.job_id,
    approvedWorkItemId: binding.approved_work_item_id,
    compositionProfileId: binding.registered_profile_id,
    ...(binding.layered_assembly_id ? { layeredAssemblyId: binding.layered_assembly_id } : {}),
    width: binding.width,
    height: binding.height,
    fpsNumerator: binding.fps_numerator,
    fpsDenominator: binding.fps_denominator,
    durationFrames: binding.duration_frames,
    sceneStartFrame: binding.scene_start_frame,
    sceneEndFrame: binding.scene_end_frame,
    status,
    ...(attempt?.failure_category ? { failureCategory: attempt.failure_category } : {}),
    ...(attempt ? { currentAttemptId: attempt.id } : {}),
    ...(artifact ? { artifact: previewArtifactDto(artifact) } : {}),
    createdAt: binding.created_at,
    localCandidateOnly: true,
  }
}

export function previewWorkspaceDto(input: {
  productionId: string
  bindings: readonly MotionStudioRenderBindingRow[]
  jobs: ReadonlyMap<string, MotionStudioRenderJobRow>
  attempts: ReadonlyMap<string, MotionStudioRenderAttemptRow>
  artifacts: ReadonlyMap<string, MotionStudioRenderArtifactRow>
}): MotionStudioPreviewWorkspaceDto {
  return {
    productionId: input.productionId,
    bindings: input.bindings.map((binding) => {
      const job = input.jobs.get(binding.job_id)
      if (!job) throw new Error('Motion Studio render binding lost its durable job authority.')
      return previewBindingDto(binding, job, input.attempts.get(binding.job_id), input.artifacts.get(binding.id))
    }),
    localCandidateOnly: true,
  }
}
