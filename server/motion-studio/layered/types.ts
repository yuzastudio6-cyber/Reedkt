import type {
  MotionStudioLayeredAssemblyDto,
  MotionStudioLayeredCutoutArtifactDto,
  MotionStudioLayerManifestV1,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import type {
  MotionStudioRenderBindingRow,
  MotionStudioRenderJobRow,
  MotionStudioRenderAttemptRow,
  MotionStudioRenderLeaseRow,
} from '../render/types'

export interface MotionStudioLayeredAssemblyRow {
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
  cutout_job_id: string
  cutout_approved_work_item_id: string
  render_job_id: string
  render_approved_work_item_id: string
  cost_budget_id: string
  scene_id: string
  semantic_purpose: string
  production_mode: 'layered_first' | 'hybrid_directed'
  source_layer_type: 'image' | 'mask'
  width: number
  height: number
  fps_numerator: 24 | 30
  fps_denominator: 1
  duration_frames: number
  scene_start_frame: number
  scene_end_frame: number
  asset_preparation_profile_id: 'motion_studio_rembg_subject_fixture_v1'
  registered_profile_id: 'motion_studio_native_layered_scene_v1'
  layer_manifest_json: MotionStudioLayerManifestV1
  layer_manifest_digest: string
  input_digest: string
  fixture_only: true
  production_license_review_required: true
  created_by: string
  created_at: string
}

export interface MotionStudioLayeredCutoutArtifactRow {
  id: string
  assembly_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  job_id: string
  attempt_id: string
  private_object_identity_hash: string
  artifact_sha256: string
  byte_length: number
  mime_type: 'image/png'
  width: 128
  height: 128
  alpha_minimum: 0
  alpha_maximum: 255
  alpha_unique_value_count: 160
  foreground_alpha_mean: 226.802912
  background_alpha_mean: 2.492606
  subject_coverage_verified: true
  package_name: 'rembg'
  package_version: '2.0.76'
  onnx_runtime_version: '1.27.0'
  model_id: 'u2netp'
  model_sha256: string
  model_byte_length: 4574861
  runtime_identity_digest: string
  attestation_digest: string
  qa_evidence_digest: string
  execution_duration_milliseconds: number
  cpu_quantity: number
  fixture_only: true
  production_license_review_required: true
  created_at: string
}

export interface MotionStudioLayeredCutoutCostAuthority {
  estimateItemId: string
  capabilityOrToolId: 'rembg'
  rateCardVersionId: string
  unit: 'cpu_second'
  quantity: number
  maximumAuthorizedInternalCostMicros: number
  unitPriceMicros: number
  minimumChargeMicros: number
}

export interface MotionStudioLayeredCutoutExecutionAuthority {
  assembly: MotionStudioLayeredAssemblyRow
  job: MotionStudioRenderJobRow
  attempt: MotionStudioRenderAttemptRow
  lease: MotionStudioRenderLeaseRow
  cost: MotionStudioLayeredCutoutCostAuthority
  artifact?: MotionStudioLayeredCutoutArtifactRow
}

export interface MotionStudioLayeredRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  listAssemblies(productionId: string): Promise<MotionStudioLayeredAssemblyRow[]>
  listCutoutArtifacts(productionId: string): Promise<MotionStudioLayeredCutoutArtifactRow[]>
  findAssembly(assemblyId: string): Promise<MotionStudioLayeredAssemblyRow | undefined>
  findCutoutForAssembly(assemblyId: string): Promise<MotionStudioLayeredCutoutArtifactRow | undefined>
  createAssembly(input: {
    productionId: string
    approvedSnapshotId: string
    sceneDocumentArtifactId: string
    sceneDocumentVersionId: string
    sceneDocumentContentDigest: string
    timelineProposalId: string
    cutoutJobId: string
    renderJobId: string
    layerManifest: MotionStudioLayerManifestV1
    layerManifestDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{ assembly: MotionStudioLayeredAssemblyRow; binding: MotionStudioRenderBindingRow }>
  findCutoutExecutionAuthority(assemblyId: string, leaseId: string): Promise<MotionStudioLayeredCutoutExecutionAuthority | undefined>
  completeCutout(input: {
    assemblyId: string
    leaseId: string
    credentialHash: string
    privateObjectIdentityHash: string
    artifactSha256: string
    byteLength: number
    runtimeIdentityDigest: string
    attestationDigest: string
    qaEvidenceDigest: string
    executionDurationMilliseconds: number
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioLayeredCutoutArtifactRow>
  findCutoutArtifact(artifactId: string): Promise<MotionStudioLayeredCutoutArtifactRow | undefined>
}

export function layeredCutoutArtifactDto(
  row: MotionStudioLayeredCutoutArtifactRow,
): MotionStudioLayeredCutoutArtifactDto {
  return {
    id: row.id,
    assemblyId: row.assembly_id,
    jobId: row.job_id,
    attemptId: row.attempt_id,
    sha256: row.artifact_sha256,
    byteLength: row.byte_length,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    alphaMinimum: row.alpha_minimum,
    alphaMaximum: row.alpha_maximum,
    alphaUniqueValueCount: row.alpha_unique_value_count,
    foregroundAlphaMean: row.foreground_alpha_mean,
    backgroundAlphaMean: row.background_alpha_mean,
    subjectCoverageVerified: row.subject_coverage_verified,
    modelId: row.model_id,
    modelSha256: row.model_sha256,
    executionDurationMilliseconds: row.execution_duration_milliseconds,
    qaEvidenceDigest: row.qa_evidence_digest,
    createdAt: row.created_at,
    fixtureOnly: true,
    productionLicenseReviewRequired: true,
    localCandidateOnly: true,
  }
}

export function layeredAssemblyBaseDto(row: MotionStudioLayeredAssemblyRow): Pick<
  MotionStudioLayeredAssemblyDto,
  'id' | 'productionId' | 'approvedSnapshotId' | 'sceneDocument' |
  'timelineProposalId' | 'timelineProposalOutputDigest' | 'cutoutJobId' |
  'renderJobId' | 'layerManifest' | 'layerManifestDigest' | 'createdAt' |
  'fixtureOnly' | 'localCandidateOnly'
> {
  return {
    id: row.id,
    productionId: row.production_id,
    approvedSnapshotId: row.approved_snapshot_id,
    sceneDocument: {
      artifactId: row.scene_document_artifact_id,
      versionId: row.scene_document_version_id,
      versionNumber: row.scene_document_version_number,
      contentDigest: row.scene_document_content_digest,
    },
    timelineProposalId: row.timeline_proposal_id,
    timelineProposalOutputDigest: row.timeline_proposal_output_digest,
    cutoutJobId: row.cutout_job_id,
    renderJobId: row.render_job_id,
    layerManifest: row.layer_manifest_json,
    layerManifestDigest: row.layer_manifest_digest,
    createdAt: row.created_at,
    fixtureOnly: true,
    localCandidateOnly: true,
  }
}
