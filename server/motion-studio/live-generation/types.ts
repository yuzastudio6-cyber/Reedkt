import type {
  MotionStudioCurrencyExchangeRateSnapshot,
  MotionStudioDeterministicRouteAcceptanceDto,
  MotionStudioDeterministicRouteCandidateV1,
  MotionStudioDeterministicRouteReviewV1,
  MotionStudioMs010BExecutionAuthorityV1,
  MotionStudioMs010BFallbackEligibilityV1,
  MotionStudioMs010BOwnerAuthorizationV1,
  MotionStudioMs010BRetentionPolicyV1,
  MotionStudioMs010BStopPolicyV1,
  MotionStudioProviderNativeRateSnapshot,
  MotionStudioLiveGenerationWorkspaceDto,
  ReviewMotionStudioLiveCandidateRequest,
} from '../../../src/types/motion-studio'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'

export type MotionStudioLiveOperationKind =
  | 'gpt_image_generation'
  | 'gpt_image_edit'
  | 'wan_image_to_video'
  | 'hailuo_image_to_video_fallback'

export type MotionStudioLiveOperationState =
  | 'created'
  | 'permit_issued'
  | 'transport_consumed'
  | 'submitted'
  | 'processing'
  | 'outcome_unknown'
  | 'completed'
  | 'failed'
  | 'qa_rejected'
  | 'approved'
  | 'cancelled'

export type MotionStudioLiveFollowupCallPurpose =
  | 'status_query'
  | 'file_retrieve'
  | 'media_download'

export type MotionStudioLiveFollowupResultStatus =
  | 'processing'
  | 'download_ready'
  | 'media_received'
  | 'failed'
  | 'cancelled'
  | 'outcome_unknown'
  | 'unrecognized_response'

export interface MotionStudioMs010BAuthorizationRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  authorization_json: MotionStudioMs010BOwnerAuthorizationV1
  authorization_digest: string
  retention_policy_json: MotionStudioMs010BRetentionPolicyV1
  retention_policy_digest: string
  stop_policy_json: MotionStudioMs010BStopPolicyV1
  stop_policy_digest: string
  combined_maximum_authorized_usd_micros: 3_000_000
  authorized_at: string
  created_by: string
  created_at: string
}

export interface MotionStudioProviderNativeRateRow {
  id: string
  authorization_id: string
  provider_route: 'wan' | 'hailuo'
  currency: 'CNY' | 'USD'
  unit: 'video_second' | 'request'
  unit_price_native_micros: number
  content_digest: string
  rate_snapshot_json: MotionStudioProviderNativeRateSnapshot
}

export interface MotionStudioCurrencyExchangeRateRow {
  id: string
  authorization_id: string
  base_currency: 'CNY'
  quote_currency: 'USD'
  base_amount_micros: number
  quote_amount_micros: number
  expires_at: string
  content_digest: string
  rate_snapshot_json: MotionStudioCurrencyExchangeRateSnapshot
}

export interface MotionStudioLiveExecutionAuthorityRow {
  id: string
  authorization_id: string
  production_id: string
  approved_snapshot_id: string
  wan_native_rate_snapshot_id: string
  wan_fx_snapshot_id: string | null
  authority_json: MotionStudioMs010BExecutionAuthorityV1
  authority_digest: string
  expires_at: string
  created_by: string
  created_at: string
}

export interface MotionStudioLiveOperationRow {
  id: string
  execution_authority_id: string
  authorization_id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  operation_kind: MotionStudioLiveOperationKind
  provider_route: 'gpt_image_2' | 'wan' | 'hailuo'
  provider_adapter_id:
    | 'openai_gpt_image_2_live_v1'
    | 'alibaba_wan_2_7_i2v_live_v1'
    | 'minimax_hailuo_2_3_fast_i2v_live_v1'
  provider_model_version: string
  job_id: string
  cost_budget_id: string
  maximum_authorized_usd_micros: number
  request_digest: string
  dependency_operation_id: string | null
  input_media_asset_version_id: string | null
  fallback_eligibility_id: string | null
  manual_invocation_id: string | null
  state: MotionStudioLiveOperationState
  call_count: 0 | 1
  reconciliation_required: boolean
  external_operation_id_hash: string | null
  record_version: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MotionStudioLiveTransportPermitRow {
  id: string
  operation_id: string
  job_id: string
  job_attempt_id: string
  worker_lease_id: string
  credential_binding_digest: string
  request_digest: string
  permit_digest: string
  state: 'issued' | 'consumed' | 'expired'
  issued_at: string
  expires_at: string
  consumed_at: string | null
}

export interface MotionStudioLiveFollowupCallRow {
  id: string
  operation_id: string
  job_id: string
  job_attempt_id: string
  worker_lease_id: string
  call_purpose: MotionStudioLiveFollowupCallPurpose
  call_sequence: number
  credential_binding_digest: string
  request_digest: string
  permit_digest: string
  state: 'consumed' | 'recorded' | 'outcome_unknown'
  result_status: MotionStudioLiveFollowupResultStatus | null
  response_digest: string | null
  consumed_at: string
  expires_at: string
  completed_at: string | null
}

export interface MotionStudioLiveProviderEventRow {
  id: string
  operation_id: string
  event_sequence: number
  event_source: 'synchronous' | 'poll' | 'download' | 'reconciliation'
  normalized_status: 'submitted' | 'processing' | 'outcome_unknown' | 'completed' | 'failed' | 'cancelled'
  event_digest: string
  response_digest: string
  external_operation_id_hash: string | null
  provider_cost_incurred: boolean
  occurred_at: string
  received_at: string
}

export interface MotionStudioLiveCandidateRow {
  id: string
  operation_id: string
  production_id: string
  approved_snapshot_id: string
  job_id: string
  job_attempt_id: string
  media_asset_id: string
  media_asset_version_id: string
  technically_complete: true
  safety_status: 'passed' | 'review_required'
  qa_evidence_digest: string
  review_status: 'review_needed'
  created_at: string
}

export interface MotionStudioLiveCandidateReviewRow {
  id: string
  candidate_id: string
  operation_id: string
  job_attempt_id: string
  decision: 'approved' | 'rejected'
  rejection_category: 'reference_adherence' | 'continuity' | 'visual_artifact' | 'intent_alignment' | 'safety' | null
  qa_evidence_artifact_id: string
  qa_evidence_version_id: string
  qa_evidence_content_digest: string
  review_digest: string
  reviewed_by: string
  reviewed_at: string
}

export interface MotionStudioLiveGenerationRepository {
  getWorkspace(input: {
    productionId: string
    actorUserId: string
  }): Promise<MotionStudioLiveGenerationWorkspaceDto>
  getDeterministicAcceptance(input: {
    productionId: string
    actorUserId: string
  }): Promise<MotionStudioDeterministicRouteAcceptanceDto | undefined>
  acceptDeterministicRoute(input: {
    productionId: string
    approvedSnapshotId: string
    candidate: MotionStudioDeterministicRouteCandidateV1
    review: MotionStudioDeterministicRouteReviewV1
    reviewedAt: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioDeterministicRouteAcceptanceDto>
  createAuthorization(input: {
    productionId: string
    approvedSnapshotId: string
    authorization: MotionStudioMs010BOwnerAuthorizationV1
    retentionPolicy: MotionStudioMs010BRetentionPolicyV1
    stopPolicy: MotionStudioMs010BStopPolicyV1
    actorUserId: string
  }): Promise<MotionStudioMs010BAuthorizationRow>
  createProviderNativeRate(input: {
    authorizationId: string
    rate: MotionStudioProviderNativeRateSnapshot
    actorUserId: string
  }): Promise<MotionStudioProviderNativeRateRow>
  createCurrencyExchangeRate(input: {
    authorizationId: string
    rate: MotionStudioCurrencyExchangeRateSnapshot
    actorUserId: string
  }): Promise<MotionStudioCurrencyExchangeRateRow>
  createExecutionAuthority(input: {
    authorizationId: string
    wanNativeRateSnapshotId: string
    wanFxSnapshotId: string | null
    authority: MotionStudioMs010BExecutionAuthorityV1
    actorUserId: string
  }): Promise<MotionStudioLiveExecutionAuthorityRow>
  createOperation(input: {
    executionAuthorityId: string
    operationId: string
    operationKind: MotionStudioLiveOperationKind
    jobId: string
    requestDigest: string
    dependencyOperationId?: string
    inputMediaAssetVersionId?: string
    fallbackEligibilityId?: string
    manualInvocationId?: string
    actorUserId: string
  }): Promise<MotionStudioLiveOperationRow>
  issuePermit(input: {
    operationId: string
    permitId: string
    leaseId: string
    credentialHash: string
    credentialBindingDigest: string
    permitDigest: string
    expiresAt: string
    actorUserId: string
  }): Promise<{ operationId: string; permit: MotionStudioLiveTransportPermitRow }>
  consumePermit(input: {
    permitId: string
    leaseId: string
    credentialHash: string
    requestDigest: string
    actorUserId: string
  }): Promise<{ status: 'transport_consumed'; operationId: string; permitId: string; callCount: 1; automaticRetryAllowed: false }>
  consumeFollowupCall(input: {
    operationId: string
    callId: string
    callPurpose: MotionStudioLiveFollowupCallPurpose
    callSequence: number
    leaseId: string
    credentialHash: string
    credentialBindingDigest: string
    requestDigest: string
    permitDigest: string
    expiresAt: string
    actorUserId: string
  }): Promise<{
    followupCall: MotionStudioLiveFollowupCallRow
    maximumNetworkCalls: 1
    automaticRetryAllowed: false
    automaticLoopAllowed: false
  }>
  recordFollowupCallResult(input: {
    callId: string
    credentialHash: string
    resultStatus: MotionStudioLiveFollowupResultStatus
    eventDigest: string
    responseDigest: string
    occurredAt: string
    actorUserId: string
  }): Promise<{
    operation: MotionStudioLiveOperationRow
    followupCall: MotionStudioLiveFollowupCallRow
    event: MotionStudioLiveProviderEventRow
    automaticRetryAllowed: false
    automaticLoopAllowed: false
  }>
  recordProviderEvent(input: {
    operationId: string
    eventSource: MotionStudioLiveProviderEventRow['event_source']
    normalizedStatus: MotionStudioLiveProviderEventRow['normalized_status']
    eventDigest: string
    responseDigest: string
    externalOperationIdHash?: string
    providerCostIncurred: boolean
    occurredAt: string
    actorUserId: string
  }): Promise<{ operation: MotionStudioLiveOperationRow; event: MotionStudioLiveProviderEventRow; blindRetryAllowed: false }>
  completeCandidate(input: {
    operationId: string
    leaseId: string
    credentialHash: string
    mediaAssetId: string
    mediaAssetVersionId: string
    privateObjectIdentityHash: string
    mediaSha256: string
    byteLength: number
    mimeType: 'image/png' | 'video/mp4'
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
  }): Promise<{ candidate: MotionStudioLiveCandidateRow; reviewRequired: true }>
  recoverCandidate(input: {
    operationId: string
    leaseId: string
    credentialHash: string
    providerSourceMediaSha256: string
    readyResponseDigest: string
    failedDownloadResponseDigest: string
    mediaAssetId: string
    mediaAssetVersionId: string
    privateObjectIdentityHash: string
    mediaSha256: string
    byteLength: number
    mimeType: 'video/mp4'
    width: number
    height: number
    durationFrames: number
    fpsNumerator: number
    fpsDenominator: number
    provenanceDigest: string
    qaEvidenceDigest: string
    safetyStatus: 'passed' | 'review_required'
    usage: readonly MotionStudioAttemptUsageLine[]
    recoveryEvidenceDigest: string
    outcomeDigest: string
    occurredAt: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{
    candidate: MotionStudioLiveCandidateRow
    reviewRequired: true
    recovery: {
      status: 'completed'
      providerCallMade: false
      networkCallCount: 0
      providerDownloadMade: false
      providerResubmissionAllowed: false
      automaticRetryAllowed: false
      attemptCount: 1
      providerSourceMediaSha256: string
      recoveryEvidenceDigest: string
    }
  }>
  finishAttempt(input: {
    operationId: string
    leaseId: string
    credentialHash: string
    outcome: 'failed' | 'cancelled'
    failureCategory?: string
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{
    operation: MotionStudioLiveOperationRow
    completion: Record<string, unknown>
    automaticRetryAllowed: false
  }>
  reconcileAttempt(input: {
    operationId: string
    decision: 'no_side_effect' | 'side_effect_observed' | 'manual_review'
    usage: readonly MotionStudioAttemptUsageLine[]
    evidenceDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{
    operation: MotionStudioLiveOperationRow
    reconciliation: Record<string, unknown>
    automaticRetryAllowed: false
  }>
  reviewCandidate(input: {
    candidateId: string
    decision: 'approved' | 'rejected'
    rejectionCategory?: 'reference_adherence' | 'continuity' | 'visual_artifact' | 'intent_alignment' | 'safety'
    qaEvidenceArtifactId: string
    qaEvidenceVersionId: string
    qaEvidenceContentDigest: string
    reviewDigest: string
    fallbackEligibility?: MotionStudioMs010BFallbackEligibilityV1
    actorUserId: string
  }): Promise<{
    operation: MotionStudioLiveOperationRow
    review: MotionStudioLiveCandidateReviewRow
    fallbackEligibility?: Record<string, unknown>
    automaticFallbackSubmitted: false
  }>
  reviewCandidateByOwner(input: {
    candidateId: string
    review: ReviewMotionStudioLiveCandidateRequest
    reviewedAt: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{
    review: MotionStudioLiveCandidateReviewRow
    workspace: MotionStudioLiveGenerationWorkspaceDto
    automaticFallbackSubmitted: false
  }>
}
