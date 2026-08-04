import type {
  CreateMotionStudioAudioMixBindingRequest,
  MotionStudioAudioMixBindingDto,
  MotionStudioAudioMixWorkspaceDto,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import type {
  MotionStudioPrivateMixQualityReport,
  MotionStudioPrivateMixRuntimeResult,
} from './private-mix-runtime'
import type { VerifiedMotionStudioUploadedAudioInput } from './private-upload-input'

export interface MotionStudioAudioAuthorityRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  mix_plan_version_id: string
  mix_plan_content_digest: string
  timing_authority_digest: string
  created_by: string
  immutable: true
}

export interface MotionStudioAudioMixBindingRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  source_audio_authority_id: string
  source_approved_snapshot_id: string
  execution_approved_snapshot_id: string
  mix_plan_version_id: string
  mix_plan_content_digest: string
  timing_authority_digest: string
  job_id: string
  approved_work_item_id: string
  cost_budget_id: string
  profile_id: 'motion_studio_storytelling_speech_safe_mix_v1'
  fps: 24 | 30
  duration_frames: number
  sample_count_per_channel: number
  verified_inputs_json: readonly Omit<VerifiedMotionStudioUploadedAudioInput, 'bytes'>[]
  input_digest: string
  created_by: string
  created_at: string
  immutable: true
}

export interface MotionStudioAudioMixArtifactRow {
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
  mime_type: 'audio/wav'
  codec: 'pcm_s16le'
  sample_rate_hertz: 48_000
  channel_count: 2
  sample_count_per_channel: number
  duration_frames: number
  fps: 24 | 30
  integrated_lufs: number
  loudness_range_lu: number
  true_peak_dbfs: number
  sample_peak_dbfs: number
  speech_priority_ratio: number
  quality_json: MotionStudioPrivateMixQualityReport
  qa_evidence_digest: string
  runtime_identity_digest: string
  normalization_attestation_digest: string
  measurement_attestation_digest: string
  probe_attestation_digest: string
  input_evidence_digest: string
  created_at: string
  immutable: true
}

export interface MotionStudioAudioMixJobRow {
  id: string
  production_id: string
  approved_snapshot_id: string
  approved_work_item_id: string
  cost_budget_id: string
  work_item_type: 'mix_motion_studio_storytelling_audio'
  required_worker_class: 'motion_studio_audio_mix_worker'
  status: 'waiting' | 'queued' | 'claimed' | 'running' | 'cancel_requested' |
    'reconciliation_required' | 'blocked' | 'succeeded' | 'failed' | 'cancelled'
  maximum_authorized_internal_cost_micros: number
  attempt_count: number
  max_attempts: number
}

export interface MotionStudioAudioMixAttemptRow {
  id: string
  job_id: string
  attempt_number: number
  status: 'claimed' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown'
  failure_category: string | null
  started_at: string | null
  completed_at: string | null
}

export interface MotionStudioAudioMixLeaseRow {
  id: string
  job_id: string
  attempt_id: string
  credential_hash_sha256: string
  status: 'active' | 'released' | 'expired'
  expires_at: string
}

export interface MotionStudioAudioMixCostAuthority {
  estimateItemId: string
  capabilityOrToolId: 'ffmpeg'
  rateCardVersionId: string
  unit: 'cpu_second'
  quantity: number
  maximumAuthorizedInternalCostMicros: number
  unitPriceMicros: number
  minimumChargeMicros: number
}

export interface MotionStudioAudioMixExecutionAuthority {
  binding: MotionStudioAudioMixBindingRow
  job: MotionStudioAudioMixJobRow
  attempt: MotionStudioAudioMixAttemptRow
  lease: MotionStudioAudioMixLeaseRow
  cost: MotionStudioAudioMixCostAuthority
  artifact?: MotionStudioAudioMixArtifactRow
  usage?: MotionStudioAttemptUsageLine
}

export interface MotionStudioAudioMixRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  findAudioAuthority(productionId: string, audioAuthorityId: string): Promise<MotionStudioAudioAuthorityRow | undefined>
  createBinding(input: {
    productionId: string
    request: CreateMotionStudioAudioMixBindingRequest
    verifiedInputs: readonly Omit<VerifiedMotionStudioUploadedAudioInput, 'bytes'>[]
    inputDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAudioMixBindingRow>
  readWorkspace(productionId: string): Promise<MotionStudioAudioMixWorkspaceDto>
  findExecutionAuthority(bindingId: string, leaseId: string): Promise<MotionStudioAudioMixExecutionAuthority | undefined>
  completeAttempt(input: {
    bindingId: string
    leaseId: string
    credentialHash: string
    privateObjectIdentityHash: string
    result: MotionStudioPrivateMixRuntimeResult
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAudioMixArtifactRow>
  findArtifact(artifactId: string): Promise<MotionStudioAudioMixArtifactRow | undefined>
  bindingDto(input: {
    binding: MotionStudioAudioMixBindingRow
    job: MotionStudioAudioMixJobRow
    attempt?: MotionStudioAudioMixAttemptRow
    artifact?: MotionStudioAudioMixArtifactRow
  }): MotionStudioAudioMixBindingDto
}
