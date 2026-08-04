import type {
  MotionStudioAnimaticArtifactDto,
  MotionStudioAnimaticAssemblyReceiptDto,
  MotionStudioAnimaticBindingDto,
  MotionStudioAnimaticWorkspaceDto,
  MotionStudioArtifactPayload,
  UploadedNarrationAuthority,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import type {
  MotionStudioRenderAttemptRow,
  MotionStudioRenderCostAuthority,
  MotionStudioRenderJobRow,
  MotionStudioRenderLeaseRow,
} from '../render/types'

export interface CreateMotionStudioAnimaticAssemblyRepositoryInput {
  production: MotionStudioProductionRow
  approvedSnapshotId: string
  preparedScriptArtifactId: string
  preparedScriptVersionId: string
  preparedScriptContentDigest: string
  narration: UploadedNarrationAuthority
  narrationAuthorityDigest: string
  orderedSceneVersionIds: readonly string[]
  orderedProposalIds: readonly string[]
  voicePayload: MotionStudioArtifactPayload
  storyboardPayload: MotionStudioArtifactPayload
  animaticPayload: MotionStudioArtifactPayload
  inputDigest: string
  actorUserId: string
  createdAt: string
  idempotencyKey: string
  requestHash: string
}

export interface MotionStudioAnimaticRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  createAssembly(input: CreateMotionStudioAnimaticAssemblyRepositoryInput): Promise<MotionStudioAnimaticAssemblyReceiptDto>
  listAssemblies(productionId: string): Promise<MotionStudioAnimaticAssemblyReceiptDto[]>
  readWorkspaceState(productionId: string): Promise<{
    bindings: MotionStudioAnimaticBindingRow[]
    jobs: Map<string, MotionStudioRenderJobRow>
    attempts: Map<string, MotionStudioRenderAttemptRow>
    artifacts: Map<string, MotionStudioAnimaticArtifactRow>
  }>
  createBinding(input: {
    productionId: string
    approvedSnapshotId: string
    animaticArtifactId: string
    animaticVersionId: string
    animaticContentDigest: string
    jobId: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAnimaticBindingRow>
  findExecutionAuthority(bindingId: string, leaseId: string): Promise<MotionStudioAnimaticExecutionAuthority | undefined>
  completeAttempt(input: {
    bindingId: string
    leaseId: string
    credentialHash: string
    privateObjectIdentityHash: string
    artifactSha256: string
    byteLength: number
    audioSampleRateHertz: number
    audioChannelCount: number
    frameEvidence: readonly { frame: number; sha256: string }[]
    runtimeIdentityDigest: string
    attestationDigest: string
    qaEvidenceDigest: string
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAnimaticArtifactRow>
  findArtifact(artifactId: string): Promise<MotionStudioAnimaticArtifactRow | undefined>
}

export interface MotionStudioAnimaticBindingRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  assembly_id: string
  prepared_script_artifact_id: string
  prepared_script_version_id: string
  prepared_script_version_number: number
  prepared_script_content_digest: string
  voice_bible_artifact_id: string
  voice_bible_version_id: string
  voice_bible_version_number: number
  voice_bible_content_digest: string
  storyboard_artifact_id: string
  storyboard_version_id: string
  storyboard_version_number: number
  storyboard_content_digest: string
  animatic_artifact_id: string
  animatic_version_id: string
  animatic_version_number: number
  animatic_content_digest: string
  narration_authority_digest: string
  narration_media_asset_id: string
  narration_checksum_sha256: string
  narration_byte_length: number
  narration_mime_type: 'audio/wav' | 'audio/mpeg' | 'audio/mp3'
  narration_audio_codec: string
  narration_sample_rate_hertz: number
  narration_channel_count: number
  narration_duration_milliseconds: number
  job_id: string
  approved_work_item_id: string
  cost_budget_id: string
  width: number
  height: number
  fps_numerator: 24 | 30
  fps_denominator: 1
  rendered_frame_count: number
  scene_count: number
  scene_bindings_json: readonly Record<string, unknown>[]
  registered_profile_id: 'motion_studio_prepared_script_animatic_v1'
  input_digest: string
  created_by: string
  created_at: string
}

export interface MotionStudioAnimaticArtifactRow {
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
  audio_codec: 'aac'
  audio_sample_rate_hertz: number
  audio_channel_count: number
  width: number
  height: number
  fps_numerator: 24 | 30
  fps_denominator: 1
  rendered_frame_count: number
  frame_evidence_json: readonly { frame: number; sha256: string }[]
  runtime_identity_digest: string
  attestation_digest: string
  qa_evidence_digest: string
  created_at: string
}

export interface MotionStudioAnimaticExecutionAuthority {
  binding: MotionStudioAnimaticBindingRow
  job: MotionStudioRenderJobRow
  attempt: MotionStudioRenderAttemptRow
  lease: MotionStudioRenderLeaseRow
  cost: MotionStudioRenderCostAuthority
  artifact?: MotionStudioAnimaticArtifactRow
}

export function animaticArtifactDto(row: MotionStudioAnimaticArtifactRow): MotionStudioAnimaticArtifactDto {
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
    audioCodec: row.audio_codec,
    audioSampleRateHertz: row.audio_sample_rate_hertz,
    audioChannelCount: row.audio_channel_count,
    width: row.width,
    height: row.height,
    fpsNumerator: row.fps_numerator,
    fpsDenominator: row.fps_denominator,
    renderedFrameCount: row.rendered_frame_count,
    frameEvidence: row.frame_evidence_json,
    runtimeIdentityDigest: row.runtime_identity_digest,
    attestationDigest: row.attestation_digest,
    qaEvidenceDigest: row.qa_evidence_digest,
    createdAt: row.created_at,
    localCandidateOnly: true,
  }
}

export function animaticBindingDto(
  binding: MotionStudioAnimaticBindingRow,
  job: MotionStudioRenderJobRow,
  attempt: MotionStudioRenderAttemptRow | undefined,
  artifact: MotionStudioAnimaticArtifactRow | undefined,
): MotionStudioAnimaticBindingDto {
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
  const reference = (prefix: 'prepared_script' | 'voice_bible' | 'storyboard' | 'animatic') => ({
    artifactId: binding[`${prefix}_artifact_id`],
    versionId: binding[`${prefix}_version_id`],
    versionNumber: binding[`${prefix}_version_number`],
    contentDigest: binding[`${prefix}_content_digest`],
  })
  return {
    id: binding.id,
    productionId: binding.production_id,
    approvedSnapshotId: binding.approved_snapshot_id,
    preparedScript: reference('prepared_script'),
    voiceBible: reference('voice_bible'),
    storyboard: reference('storyboard'),
    animatic: reference('animatic'),
    narrationAuthorityDigest: binding.narration_authority_digest,
    jobId: binding.job_id,
    approvedWorkItemId: binding.approved_work_item_id,
    width: binding.width,
    height: binding.height,
    fpsNumerator: binding.fps_numerator,
    fpsDenominator: binding.fps_denominator,
    renderedFrameCount: binding.rendered_frame_count,
    sceneCount: binding.scene_count,
    status,
    ...(attempt?.failure_category ? { failureCategory: attempt.failure_category } : {}),
    ...(attempt ? { currentAttemptId: attempt.id } : {}),
    ...(artifact ? { artifact: animaticArtifactDto(artifact) } : {}),
    createdAt: binding.created_at,
    localCandidateOnly: true,
  }
}

export function animaticWorkspaceDto(input: {
  productionId: string
  assemblies: readonly MotionStudioAnimaticAssemblyReceiptDto[]
  bindings: readonly MotionStudioAnimaticBindingRow[]
  jobs: ReadonlyMap<string, MotionStudioRenderJobRow>
  attempts: ReadonlyMap<string, MotionStudioRenderAttemptRow>
  artifacts: ReadonlyMap<string, MotionStudioAnimaticArtifactRow>
}): MotionStudioAnimaticWorkspaceDto {
  return {
    productionId: input.productionId,
    assemblies: input.assemblies,
    bindings: input.bindings.map((binding) => {
      const job = input.jobs.get(binding.job_id)
      if (!job) throw new Error('Motion Studio animatic binding lost its durable job authority.')
      return animaticBindingDto(binding, job, input.attempts.get(binding.job_id), input.artifacts.get(binding.id))
    }),
    localCandidateOnly: true,
  }
}
