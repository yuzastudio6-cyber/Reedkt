import type {
  MotionStudioGenerationBindingDto,
  MotionStudioGenerationCandidateDto,
  MotionStudioGenerationExecutionReceiptDto,
  MotionStudioGenerationRoutePolicy,
  MotionStudioGenerationShotSpecV1,
  MotionStudioGenerationWorkspaceDto,
  MotionStudioMediaAssetVersionDto,
  MotionStudioProviderOperationDto,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'

export interface MotionStudioGenerationBindingRow {
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
  scene_id: string
  media_kind: 'still_image' | 'video_clip'
  shot_spec_json: MotionStudioGenerationShotSpecV1
  shot_spec_digest: string
  route_policy_json: MotionStudioGenerationRoutePolicy
  route_policy_digest: string
  protocol_simulator_only: true
  local_candidate_only: true
  created_by: string
  created_at: string
}

export interface MotionStudioProviderAttemptRow {
  id: string
  binding_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  job_id: string
  job_attempt_id: string
  worker_lease_id: string
  provider_route: 'gpt_image_2' | 'gemini_omni_flash' | 'wan' | 'hailuo' | 'veo'
  provider_adapter_id: 'motion_studio_protocol_simulator_v1'
  provider_model_version: string
  execution_class: 'protocol_simulator'
  request_digest: string
  external_operation_id_hash: string | null
  status: 'created' | 'submitted' | 'processing' | 'reconciliation_required' | 'completed' | 'failed' | 'cancelled'
  last_event_type: string | null
  last_event_at: string | null
  poll_count: number
  signature_verified_event_count: number
  provider_cost_incurred: false
  record_version: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MotionStudioProviderEventRow {
  id: string
  provider_request_attempt_id: string
  binding_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  job_id: string
  job_attempt_id: string
  event_key_hash: string
  event_source: 'webhook' | 'poll' | 'synchronous'
  event_type: 'submitted' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'outcome_unknown'
  normalized_status: MotionStudioProviderAttemptRow['status']
  verification_kind: 'hmac_sha256' | 'server_poll' | 'synchronous_response'
  signature_verified: boolean
  event_digest: string
  occurred_at: string
  received_at: string
}

export interface MotionStudioMediaAssetRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  asset_kind: 'still_image' | 'video_clip'
  current_version_id: string | null
  current_approved_version_id: string | null
  record_version: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MotionStudioMediaAssetVersionRow {
  id: string
  asset_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  version_number: number
  source_kind: 'protocol_simulator_fixture'
  source_attempt_id: string
  source_live_operation_id?: null
  private_object_identity_hash: string
  sha256: string
  byte_length: number
  media_kind: 'still_image' | 'video_clip'
  mime_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'video/mp4'
  width: number
  height: number
  duration_frames: number | null
  fps_numerator: number | null
  fps_denominator: number | null
  provenance_digest: string
  qa_evidence_digest: string
  qa_status: 'passed'
  final_asset_eligible: false
  protocol_simulator_only: true
  created_at: string
}

export interface MotionStudioLivePrivateMediaAssetVersionRow {
  id: string
  asset_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  version_number: number
  source_kind: 'live_provider_ingest'
  source_attempt_id: null
  source_live_operation_id: string
  private_object_identity_hash: string
  sha256: string
  byte_length: number
  media_kind: 'still_image' | 'video_clip'
  mime_type: 'image/png' | 'video/mp4'
  width: number
  height: number
  duration_frames: number | null
  fps_numerator: number | null
  fps_denominator: number | null
  provenance_digest: string
  qa_evidence_digest: string
  qa_status: 'pending_review'
  final_asset_eligible: false
  protocol_simulator_only: false
  created_at: string
}

export interface MotionStudioLivePrivateCandidateRow {
  id: string
  operation_id: string
  production_id: string
  media_asset_id: string
  media_asset_version_id: string
  technically_complete: true
}

export interface MotionStudioDeterministicPrivateCandidateRow {
  id: string
  production_id: string
  media_asset_id: string
  media_asset_version_id: string
}

export interface MotionStudioDeterministicPrivateMediaAssetVersionRow {
  id: string
  asset_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  version_number: number
  source_kind: 'private_deterministic_render'
  source_attempt_id: null
  source_live_operation_id: null
  private_object_identity_hash: string
  sha256: string
  byte_length: number
  media_kind: 'video_clip'
  mime_type: 'video/mp4'
  width: number
  height: number
  duration_frames: number
  fps_numerator: number
  fps_denominator: number
  provenance_digest: string
  qa_evidence_digest: string
  qa_status: 'passed'
  final_asset_eligible: true
  protocol_simulator_only: false
  created_at: string
}

export interface MotionStudioGenerationCandidateRow {
  id: string
  binding_id: string
  provider_request_attempt_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  job_id: string
  job_attempt_id: string
  media_asset_id: string
  media_asset_version_id: string
  qa_evidence_digest: string
  safety_status: 'passed' | 'review_required' | 'rejected'
  review_status: 'review_needed' | 'rejected'
  reference_adherence_measured: false
  visual_quality_measured: false
  final_asset_eligible: false
  protocol_simulator_only: true
  created_at: string
}

export interface MotionStudioGenerationJobRow {
  id: string
  production_id: string
  approved_snapshot_id: string
  approved_work_item_id: string
  cost_budget_id: string
  work_item_type: string
  required_worker_class: string
  status: MotionStudioGenerationBindingDto['jobStatus']
  maximum_authorized_internal_cost_micros: number
  attempt_count: number
  max_attempts: number
}

export interface MotionStudioGenerationAttemptRow {
  id: string
  job_id: string
  attempt_number: number
  status: 'claimed' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown'
  failure_category: string | null
}

export interface MotionStudioGenerationLeaseRow {
  id: string
  job_id: string
  attempt_id: string
  credential_hash_sha256: string
  status: 'active' | 'released' | 'expired'
  expires_at: string
}

export interface MotionStudioGenerationCostAuthority {
  estimateItemId: string
  capabilityOrToolId: 'motion_studio_protocol_simulator'
  rateCardVersionId: string
  unit: 'cpu_second'
  quantity: number
  maximumAuthorizedInternalCostMicros: number
  unitPriceMicros: number
  minimumChargeMicros: number
}

export interface MotionStudioGenerationExecutionAuthority {
  binding: MotionStudioGenerationBindingRow
  job: MotionStudioGenerationJobRow
  attempt: MotionStudioGenerationAttemptRow
  lease: MotionStudioGenerationLeaseRow
  cost: MotionStudioGenerationCostAuthority
  providerAttempt?: MotionStudioProviderAttemptRow
  candidate?: MotionStudioGenerationCandidateRow
  mediaVersion?: MotionStudioMediaAssetVersionRow
}

export interface MotionStudioGenerationRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  readWorkspaceState(productionId: string): Promise<{
    bindings: MotionStudioGenerationBindingRow[]
    jobs: Map<string, MotionStudioGenerationJobRow>
    attempts: Map<string, MotionStudioGenerationAttemptRow>
    providerAttempts: Map<string, MotionStudioProviderAttemptRow>
    candidates: Map<string, MotionStudioGenerationCandidateRow>
    mediaVersions: Map<string, MotionStudioMediaAssetVersionRow>
  }>
  createBinding(input: {
    productionId: string
    approvedSnapshotId: string
    sceneDocumentArtifactId: string
    sceneDocumentVersionId: string
    sceneDocumentContentDigest: string
    timelineProposalId: string
    jobId: string
    shotSpec: MotionStudioGenerationShotSpecV1
    shotSpecDigest: string
    routePolicy: MotionStudioGenerationRoutePolicy
    routePolicyDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioGenerationBindingRow>
  findExecutionAuthority(bindingId: string, leaseId: string): Promise<MotionStudioGenerationExecutionAuthority | undefined>
  beginProviderAttempt(input: {
    bindingId: string
    leaseId: string
    credentialHash: string
    providerRoute: MotionStudioProviderAttemptRow['provider_route']
    providerModelVersion: string
    requestDigest: string
    externalOperationIdHash: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioProviderAttemptRow>
  recordProviderSignal(input: {
    providerAttemptId: string
    eventKeyHash: string
    eventSource: MotionStudioProviderEventRow['event_source']
    eventType: MotionStudioProviderEventRow['event_type']
    normalizedStatus: MotionStudioProviderAttemptRow['status']
    verificationKind: MotionStudioProviderEventRow['verification_kind']
    signatureVerified: boolean
    eventDigest: string
    occurredAt: string
    actorUserId: string
  }): Promise<{ providerAttempt: MotionStudioProviderAttemptRow; event: MotionStudioProviderEventRow; replayed: boolean }>
  markReconciliationRequired(input: {
    providerAttemptId: string
    leaseId: string
    credentialHash: string
    usage: readonly MotionStudioAttemptUsageLine[]
    evidenceDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<Record<string, unknown>>
  reconcileProviderAttempt(input: {
    providerAttemptId: string
    decision: 'no_side_effect' | 'manual_review'
    evidenceDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{ providerAttempt: MotionStudioProviderAttemptRow; reconciliation: Record<string, unknown>; decision: 'no_side_effect' | 'manual_review' }>
  completeCandidate(input: {
    providerAttemptId: string
    leaseId: string
    credentialHash: string
    mediaAssetId: string
    mediaAssetVersionId: string
    privateObjectIdentityHash: string
    mediaSha256: string
    byteLength: number
    mimeType: MotionStudioMediaAssetVersionRow['mime_type']
    width: number
    height: number
    durationFrames?: number
    fpsNumerator?: number
    fpsDenominator?: number
    provenanceDigest: string
    qaEvidenceDigest: string
    safetyStatus: 'passed' | 'review_required'
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{
    mediaVersion: MotionStudioMediaAssetVersionRow
    candidate: MotionStudioGenerationCandidateRow
  }>
  findMediaAuthority(assetVersionId: string): Promise<
    | {
        source: 'simulator'
        production: MotionStudioProductionRow
        candidate: MotionStudioGenerationCandidateRow
        mediaVersion: MotionStudioMediaAssetVersionRow
      }
    | {
        source: 'live_provider'
        production: MotionStudioProductionRow
        candidate: MotionStudioLivePrivateCandidateRow
        mediaVersion: MotionStudioLivePrivateMediaAssetVersionRow
      }
    | {
        source: 'deterministic_route'
        production: MotionStudioProductionRow
        candidate: MotionStudioDeterministicPrivateCandidateRow
        mediaVersion: MotionStudioDeterministicPrivateMediaAssetVersionRow
      }
    | undefined
  >
  findAttemptUsage(attemptId: string): Promise<MotionStudioAttemptUsageLine | undefined>
}

export function mediaVersionDto(row: MotionStudioMediaAssetVersionRow): MotionStudioMediaAssetVersionDto {
  return {
    assetId: row.asset_id,
    assetVersionId: row.id,
    versionNumber: row.version_number,
    mediaKind: row.media_kind,
    mimeType: row.mime_type,
    sha256: row.sha256,
    byteLength: row.byte_length,
    width: row.width,
    height: row.height,
    ...(row.duration_frames === null ? {} : { durationFrames: row.duration_frames }),
    ...(row.fps_numerator === null ? {} : { frameRate: row.fps_numerator }),
    qaStatus: row.qa_status,
    finalAssetEligible: false,
    protocolSimulatorOnly: true,
    createdAt: row.created_at,
  }
}

export function providerOperationDto(row: MotionStudioProviderAttemptRow): MotionStudioProviderOperationDto {
  return {
    id: row.id,
    bindingId: row.binding_id,
    jobId: row.job_id,
    attemptId: row.job_attempt_id,
    providerRoute: row.provider_route,
    providerAdapterId: row.provider_adapter_id,
    providerModelVersion: row.provider_model_version,
    executionClass: row.execution_class,
    status: row.status,
    requestDigest: row.request_digest,
    ...(row.last_event_type ? { lastEventType: row.last_event_type } : {}),
    ...(row.last_event_at ? { lastEventAt: row.last_event_at } : {}),
    pollCount: row.poll_count,
    signatureVerifiedEventCount: row.signature_verified_event_count,
    providerCostIncurred: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function generationCandidateDto(
  row: MotionStudioGenerationCandidateRow,
  media: MotionStudioMediaAssetVersionRow,
): MotionStudioGenerationCandidateDto {
  return {
    id: row.id,
    bindingId: row.binding_id,
    providerOperationId: row.provider_request_attempt_id,
    media: mediaVersionDto(media),
    qaEvidenceDigest: row.qa_evidence_digest,
    safetyStatus: row.safety_status,
    reviewStatus: row.review_status,
    referenceAdherenceMeasured: false,
    visualQualityMeasured: false,
    finalAssetEligible: false,
    protocolSimulatorOnly: true,
    createdAt: row.created_at,
  }
}

export function generationBindingDto(input: {
  binding: MotionStudioGenerationBindingRow
  job: MotionStudioGenerationJobRow
  attempt?: MotionStudioGenerationAttemptRow
  providerAttempt?: MotionStudioProviderAttemptRow
  candidate?: MotionStudioGenerationCandidateRow
  mediaVersion?: MotionStudioMediaAssetVersionRow
}): MotionStudioGenerationBindingDto {
  const { binding, job, attempt, providerAttempt, candidate, mediaVersion } = input
  const routeIndex = providerAttempt
    ? binding.route_policy_json.candidates.findIndex((item) => item.providerRoute === providerAttempt.provider_route)
    : -1
  const nextRoute = routeIndex >= 0 ? binding.route_policy_json.candidates[routeIndex + 1] : undefined
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
    jobStatus: job.status,
    mediaKind: binding.media_kind,
    shotSpec: binding.shot_spec_json,
    shotSpecDigest: binding.shot_spec_digest,
    routePolicy: binding.route_policy_json,
    routePolicyDigest: binding.route_policy_digest,
    ...(providerAttempt ? { providerOperation: providerOperationDto(providerAttempt) } : {}),
    ...(candidate && mediaVersion ? { candidate: generationCandidateDto(candidate, mediaVersion) } : {}),
    ...(attempt?.failure_category ? { failureCategory: attempt.failure_category } : {}),
    ...(providerAttempt && ['failed', 'cancelled'].includes(providerAttempt.status) && nextRoute ? {
      fallbackRecommendation: {
        providerRoute: nextRoute.providerRoute,
        reason: 'The current route ended without an accepted candidate. A newly approved operation is required.',
        newApprovalRequired: true,
      },
    } : {}),
    createdAt: binding.created_at,
    protocolSimulatorOnly: true,
    localCandidateOnly: true,
  }
}

export function generationWorkspaceDto(input: {
  productionId: string
  bindings: readonly MotionStudioGenerationBindingRow[]
  jobs: ReadonlyMap<string, MotionStudioGenerationJobRow>
  attempts: ReadonlyMap<string, MotionStudioGenerationAttemptRow>
  providerAttempts: ReadonlyMap<string, MotionStudioProviderAttemptRow>
  candidates: ReadonlyMap<string, MotionStudioGenerationCandidateRow>
  mediaVersions: ReadonlyMap<string, MotionStudioMediaAssetVersionRow>
}): MotionStudioGenerationWorkspaceDto {
  return {
    productionId: input.productionId,
    bindings: input.bindings.map((binding) => {
      const job = input.jobs.get(binding.job_id)
      if (!job) throw new Error('Generated-media binding lost its exact durable job authority.')
      const candidate = input.candidates.get(binding.id)
      return generationBindingDto({
        binding,
        job,
        attempt: input.attempts.get(binding.job_id),
        providerAttempt: input.providerAttempts.get(binding.id),
        ...(candidate ? { candidate, mediaVersion: input.mediaVersions.get(candidate.media_asset_version_id) } : {}),
      })
    }),
    realProviderExecutionAuthorized: false,
    localCandidateOnly: true,
  }
}

export function generationExecutionReceipt(input: {
  binding: MotionStudioGenerationBindingDto
  providerOperation: MotionStudioProviderOperationDto
  candidate: MotionStudioGenerationCandidateDto
}): MotionStudioGenerationExecutionReceiptDto {
  return {
    binding: input.binding,
    providerOperation: input.providerOperation,
    candidate: input.candidate,
    localCandidateOnly: true,
  }
}
