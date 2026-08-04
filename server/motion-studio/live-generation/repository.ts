import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  motionStudioCurrencyExchangeRateSnapshotSchema,
  motionStudioMs010BExecutionAuthorityV1Schema,
  motionStudioMs010BOwnerAuthorizationV1Schema,
  motionStudioMs010BRetentionPolicyV1Schema,
  motionStudioMs010BStopPolicyV1Schema,
  motionStudioProviderNativeRateSnapshotSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioCurrencyExchangeRateRow,
  MotionStudioLiveExecutionAuthorityRow,
  MotionStudioLiveGenerationRepository,
  MotionStudioLiveOperationRow,
  MotionStudioMs010BAuthorizationRow,
  MotionStudioProviderNativeRateRow,
} from './types'

const uuid = z.string().uuid()
const stableId = z.string().trim().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const iso = z.string().min(1)

const authorizationRowSchema = z.object({
  id: stableId, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid,
  authorization_json: motionStudioMs010BOwnerAuthorizationV1Schema,
  authorization_digest: digest,
  retention_policy_json: motionStudioMs010BRetentionPolicyV1Schema,
  retention_policy_digest: digest,
  stop_policy_json: motionStudioMs010BStopPolicyV1Schema,
  stop_policy_digest: digest,
  combined_maximum_authorized_usd_micros: z.coerce.number().pipe(z.literal(3_000_000)),
  authorized_at: iso, created_by: uuid, created_at: iso,
}).strict()

const nativeRateRowSchema = z.object({
  id: stableId, authorization_id: stableId, provider_route: z.enum(['wan', 'hailuo']),
  currency: z.enum(['CNY', 'USD']), unit: z.enum(['video_second', 'request']),
  unit_price_native_micros: safeInteger, content_digest: digest,
  rate_snapshot_json: motionStudioProviderNativeRateSnapshotSchema,
}).passthrough()

const fxRowSchema = z.object({
  id: stableId, authorization_id: stableId, base_currency: z.literal('CNY'),
  quote_currency: z.literal('USD'), base_amount_micros: safeInteger,
  quote_amount_micros: safeInteger, expires_at: iso, content_digest: digest,
  rate_snapshot_json: motionStudioCurrencyExchangeRateSnapshotSchema,
}).passthrough()

const executionAuthorityRowSchema = z.object({
  id: stableId, authorization_id: stableId, production_id: uuid,
  approved_snapshot_id: uuid, wan_native_rate_snapshot_id: stableId,
  wan_fx_snapshot_id: stableId.nullable(), authority_json: motionStudioMs010BExecutionAuthorityV1Schema,
  authority_digest: digest, expires_at: iso, created_by: uuid, created_at: iso,
}).passthrough()

const operationState = z.enum([
  'created','permit_issued','transport_consumed','submitted','processing',
  'outcome_unknown','completed','failed','qa_rejected','approved','cancelled',
])
const operationRowSchema = z.object({
  id: stableId, execution_authority_id: stableId, authorization_id: stableId,
  workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid,
  operation_kind: z.enum(['gpt_image_generation','gpt_image_edit','wan_image_to_video','hailuo_image_to_video_fallback']),
  provider_route: z.enum(['gpt_image_2','wan','hailuo']),
  provider_adapter_id: z.enum(['openai_gpt_image_2_live_v1','alibaba_wan_2_7_i2v_live_v1','minimax_hailuo_2_3_fast_i2v_live_v1']),
  provider_model_version: stableId, job_id: stableId, cost_budget_id: stableId,
  maximum_authorized_usd_micros: safeInteger, request_digest: digest,
  dependency_operation_id: stableId.nullable(), input_media_asset_version_id: uuid.nullable(),
  fallback_eligibility_id: stableId.nullable(), manual_invocation_id: stableId.nullable(),
  state: operationState, call_count: z.coerce.number().pipe(z.union([z.literal(0),z.literal(1)])),
  reconciliation_required: z.boolean(), external_operation_id_hash: digest.nullable(),
  record_version: z.coerce.number().int().positive(), created_by: uuid,
  created_at: iso, updated_at: iso,
}).strict()

const permitRowSchema = z.object({
  id: uuid, operation_id: stableId, job_id: stableId, job_attempt_id: stableId,
  worker_lease_id: uuid, credential_binding_digest: digest, request_digest: digest,
  permit_digest: digest, state: z.enum(['issued','consumed','expired']),
  issued_at: iso, expires_at: iso, consumed_at: iso.nullable(),
}).passthrough()

const followupCallRowSchema = z.object({
  id: uuid, operation_id: stableId, job_id: stableId, job_attempt_id: stableId,
  worker_lease_id: uuid, call_purpose: z.enum(['status_query','file_retrieve','media_download']),
  call_sequence: z.coerce.number().int().positive().max(20),
  credential_binding_digest: digest, request_digest: digest, permit_digest: digest,
  state: z.enum(['consumed','recorded','outcome_unknown']),
  result_status: z.enum([
    'processing','download_ready','media_received','failed','cancelled',
    'outcome_unknown','unrecognized_response',
  ]).nullable(),
  response_digest: digest.nullable(), consumed_at: iso, expires_at: iso,
  completed_at: iso.nullable(),
}).passthrough()

const providerEventRowSchema = z.object({
  id: uuid, operation_id: stableId, event_sequence: z.coerce.number().int().positive(),
  event_source: z.enum(['synchronous','poll','download','reconciliation']),
  normalized_status: z.enum(['submitted','processing','outcome_unknown','completed','failed','cancelled']),
  event_digest: digest, response_digest: digest, external_operation_id_hash: digest.nullable(),
  provider_cost_incurred: z.boolean(), occurred_at: iso, received_at: iso,
}).passthrough()

const candidateRowSchema = z.object({
  id: uuid, operation_id: stableId, production_id: uuid, approved_snapshot_id: uuid,
  job_id: stableId, job_attempt_id: stableId, media_asset_id: uuid, media_asset_version_id: uuid,
  technically_complete: z.literal(true), safety_status: z.enum(['passed','review_required']),
  qa_evidence_digest: digest, review_status: z.literal('review_needed'), created_at: iso,
}).passthrough()

const candidateReviewRowSchema = z.object({
  id: uuid, candidate_id: uuid, operation_id: stableId, job_attempt_id: stableId,
  decision: z.enum(['approved','rejected']),
  rejection_category: z.enum(['reference_adherence','continuity','visual_artifact','intent_alignment','safety']).nullable(),
  qa_evidence_artifact_id: uuid, qa_evidence_version_id: uuid,
  qa_evidence_content_digest: digest, review_digest: digest,
  reviewed_by: uuid, reviewed_at: iso,
}).passthrough()

const permitResponseSchema = z.object({ operationId: stableId, permit: permitRowSchema }).strict()
const consumeResponseSchema = z.object({
  status: z.literal('transport_consumed'), operationId: stableId, permitId: uuid,
  callCount: z.literal(1), automaticRetryAllowed: z.literal(false),
}).strict()
const eventResponseSchema = z.object({
  operation: operationRowSchema, event: providerEventRowSchema, blindRetryAllowed: z.literal(false),
}).strict()
const consumeFollowupResponseSchema = z.object({
  followupCall: followupCallRowSchema, maximumNetworkCalls: z.literal(1),
  automaticRetryAllowed: z.literal(false), automaticLoopAllowed: z.literal(false),
}).strict()
const followupResultResponseSchema = z.object({
  operation: operationRowSchema, followupCall: followupCallRowSchema,
  event: providerEventRowSchema, automaticRetryAllowed: z.literal(false),
  automaticLoopAllowed: z.literal(false),
}).strict()
const candidateResponseSchema = z.object({
  candidate: candidateRowSchema, reviewRequired: z.literal(true),
}).passthrough()
const recoveredCandidateResponseSchema = z.object({
  candidate: candidateRowSchema,
  reviewRequired: z.literal(true),
  recovery: z.object({
    status: z.literal('completed'),
    providerCallMade: z.literal(false),
    networkCallCount: z.literal(0),
    providerDownloadMade: z.literal(false),
    providerResubmissionAllowed: z.literal(false),
    automaticRetryAllowed: z.literal(false),
    attemptCount: z.literal(1),
    providerSourceMediaSha256: digest,
    recoveryEvidenceDigest: digest,
  }).strict(),
}).strict()
const terminalAttemptResponseSchema = z.object({
  operation: operationRowSchema,
  completion: z.record(z.string(), z.unknown()),
  automaticRetryAllowed: z.literal(false),
}).strict()
const reconciliationResponseSchema = z.object({
  operation: operationRowSchema,
  reconciliation: z.record(z.string(), z.unknown()),
  automaticRetryAllowed: z.literal(false),
}).strict()
const reviewResponseSchema = z.object({
  operation: operationRowSchema, review: candidateReviewRowSchema,
  fallbackEligibility: z.record(z.string(), z.unknown()).optional(),
  automaticFallbackSubmitted: z.literal(false),
}).strict()

const browserReviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionCategory: z.enum([
    'reference_adherence', 'continuity', 'visual_artifact', 'intent_alignment', 'safety',
  ]).optional(),
  reviewedAt: iso,
}).strict()
const browserMediaSchema = z.object({
  candidateId: uuid,
  assetVersionId: uuid,
  mediaKind: z.enum(['still_image', 'video_clip']),
  mimeType: z.enum(['image/png', 'video/mp4']),
  sha256: digest,
  byteLength: safeInteger,
  width: safeInteger,
  height: safeInteger,
  durationFrames: safeInteger.optional(),
  fpsNumerator: safeInteger.optional(),
  fpsDenominator: safeInteger.optional(),
  technicalQaStatus: z.literal('passed'),
  technicalQaEvidenceDigest: digest,
  automatedSafetyStatus: z.enum(['passed', 'review_required']),
  review: browserReviewSchema.optional(),
  finalAssetEligible: z.boolean(),
  privateProjectAsset: z.literal(true),
}).strict()
const browserOperationSchema = z.object({
  operationKind: z.enum([
    'gpt_image_generation', 'gpt_image_edit', 'wan_image_to_video', 'hailuo_image_to_video_fallback',
  ]),
  state: z.enum([
    'waiting','blocked','created','permit_issued','transport_consumed','submitted','processing',
    'outcome_unknown','completed','failed','qa_rejected','approved','cancelled',
  ]),
  callCount: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
  reconciliationRequired: z.boolean(),
  manualActionRequired: z.boolean(),
  updatedAt: iso,
  candidate: browserMediaSchema.optional(),
  fallbackState: z.enum(['not_applicable', 'locked', 'eligible_manual', 'invoked', 'not_used']),
}).strict()
const browserWorkspaceSchema = z.object({
  productionId: uuid,
  evidenceClass: z.literal('real_provider'),
  persistenceClass: z.literal('local_canonical_evidence'),
  operations: z.array(browserOperationSchema).max(4).readonly(),
  realProviderEvidence: z.literal(true),
  simulatorOnly: z.literal(false),
  browserProviderTransportAllowed: z.literal(false),
  internalCostExposed: z.literal(false),
}).strict()
const deterministicRouteAcceptanceSchema = browserMediaSchema.extend({
  mediaKind: z.literal('video_clip'),
  mimeType: z.literal('video/mp4'),
  review: z.object({ decision: z.literal('approved'), reviewedAt: iso }).strict(),
  finalAssetEligible: z.literal(true),
  routeProfileId: z.literal('motion_studio_deterministic_route_draw_v1'),
  routePresetId: z.literal('abstract_three_district_route_v1'),
  replacementKind: z.literal('gpt_image_then_remotion'),
  replacedWorkItemKeys: z.array(stableId).length(2).readonly(),
  providerSubmissionMade: z.literal(false),
  newProviderCostIncurred: z.literal(false),
  baseSnapshotMutated: z.literal(false),
  baseWorkItemsMutated: z.literal(false),
  acceptedAt: iso,
}).strict()
const ownerReviewResponseSchema = z.object({
  review: candidateReviewRowSchema,
  workspace: browserWorkspaceSchema,
  automaticFallbackSubmitted: z.literal(false),
}).strict()

export function createSupabaseMotionStudioLiveGenerationRepository(
  client: SupabaseClient,
): MotionStudioLiveGenerationRepository {
  return {
    async getWorkspace(input) {
      return readRequired(await client.rpc('get_motion_studio_live_generation_workspace', {
        target_production_id: input.productionId,
        target_actor_user_id: input.actorUserId,
      }), browserWorkspaceSchema, 'browser-safe live generation workspace')
    },
    async getDeterministicAcceptance(input) {
      return readOptional(await client.rpc('get_motion_studio_deterministic_route_acceptance', {
        target_production_id: input.productionId,
        target_actor_user_id: input.actorUserId,
      }), deterministicRouteAcceptanceSchema, 'deterministic route acceptance')
    },
    async acceptDeterministicRoute(input) {
      return readRequired(await client.rpc('accept_motion_studio_deterministic_route_candidate', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_candidate_json: input.candidate,
        target_review_json: input.review,
        target_reviewed_at: input.reviewedAt,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), deterministicRouteAcceptanceSchema, 'deterministic route acceptance')
    },
    async createAuthorization(input) {
      return readRequired(await client.rpc('create_motion_studio_ms010b_authorization', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_authorization_json: input.authorization,
        target_retention_policy_json: input.retentionPolicy,
        target_stop_policy_json: input.stopPolicy,
        target_actor_user_id: input.actorUserId,
      }), authorizationRowSchema, 'MS-010B owner authorization') as MotionStudioMs010BAuthorizationRow
    },
    async createProviderNativeRate(input) {
      return readRequired(await client.rpc('create_motion_studio_provider_native_rate_snapshot', {
        target_authorization_id: input.authorizationId,
        target_rate_snapshot_json: input.rate,
        target_actor_user_id: input.actorUserId,
      }), nativeRateRowSchema, 'provider-native rate snapshot') as MotionStudioProviderNativeRateRow
    },
    async createCurrencyExchangeRate(input) {
      return readRequired(await client.rpc('create_motion_studio_currency_exchange_rate_snapshot', {
        target_authorization_id: input.authorizationId,
        target_fx_snapshot_json: input.rate,
        target_actor_user_id: input.actorUserId,
      }), fxRowSchema, 'currency exchange-rate snapshot') as MotionStudioCurrencyExchangeRateRow
    },
    async createExecutionAuthority(input) {
      return readRequired(await client.rpc('create_motion_studio_ms010b_execution_authority', {
        target_authorization_id: input.authorizationId,
        target_wan_native_rate_snapshot_id: input.wanNativeRateSnapshotId,
        target_wan_fx_snapshot_id: input.wanFxSnapshotId,
        target_authority_json: input.authority,
        target_actor_user_id: input.actorUserId,
      }), executionAuthorityRowSchema, 'MS-010B execution authority') as MotionStudioLiveExecutionAuthorityRow
    },
    async createOperation(input) {
      return readRequired(await client.rpc('create_motion_studio_live_operation', {
        target_execution_authority_id: input.executionAuthorityId,
        target_operation_id: input.operationId,
        target_operation_kind: input.operationKind,
        target_job_id: input.jobId,
        target_request_digest: input.requestDigest,
        target_dependency_operation_id: input.dependencyOperationId ?? null,
        target_input_media_asset_version_id: input.inputMediaAssetVersionId ?? null,
        target_fallback_eligibility_id: input.fallbackEligibilityId ?? null,
        target_manual_invocation_id: input.manualInvocationId ?? null,
        target_actor_user_id: input.actorUserId,
      }), operationRowSchema, 'live provider operation') as MotionStudioLiveOperationRow
    },
    async issuePermit(input) {
      return readRequired(await client.rpc('issue_motion_studio_live_transport_permit', {
        target_operation_id: input.operationId,
        target_permit_id: input.permitId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_credential_binding_digest: input.credentialBindingDigest,
        target_permit_digest: input.permitDigest,
        target_expires_at: input.expiresAt,
        target_actor_user_id: input.actorUserId,
      }), permitResponseSchema, 'single-use live transport permit')
    },
    async consumePermit(input) {
      return readRequired(await client.rpc('consume_motion_studio_live_transport_permit', {
        target_permit_id: input.permitId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_request_digest: input.requestDigest,
        target_actor_user_id: input.actorUserId,
      }), consumeResponseSchema, 'single-use live transport permit consumption')
    },
    async consumeFollowupCall(input) {
      return readRequired(await client.rpc('consume_motion_studio_live_followup_call', {
        target_operation_id: input.operationId,
        target_call_id: input.callId,
        target_call_purpose: input.callPurpose,
        target_call_sequence: input.callSequence,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_credential_binding_digest: input.credentialBindingDigest,
        target_request_digest: input.requestDigest,
        target_permit_digest: input.permitDigest,
        target_expires_at: input.expiresAt,
        target_actor_user_id: input.actorUserId,
      }), consumeFollowupResponseSchema, 'bounded live follow-up call consumption')
    },
    async recordFollowupCallResult(input) {
      return readRequired(await client.rpc('record_motion_studio_live_followup_result', {
        target_call_id: input.callId,
        target_credential_hash: input.credentialHash,
        target_result_status: input.resultStatus,
        target_event_digest: input.eventDigest,
        target_response_digest: input.responseDigest,
        target_occurred_at: input.occurredAt,
        target_actor_user_id: input.actorUserId,
      }), followupResultResponseSchema, 'sanitized live follow-up call result')
    },
    async recordProviderEvent(input) {
      return readRequired(await client.rpc('record_motion_studio_live_provider_event', {
        target_operation_id: input.operationId,
        target_event_source: input.eventSource,
        target_normalized_status: input.normalizedStatus,
        target_event_digest: input.eventDigest,
        target_response_digest: input.responseDigest,
        target_external_operation_id_hash: input.externalOperationIdHash ?? null,
        target_provider_cost_incurred: input.providerCostIncurred,
        target_occurred_at: input.occurredAt,
        target_actor_user_id: input.actorUserId,
      }), eventResponseSchema, 'sanitized live provider event')
    },
    async completeCandidate(input) {
      return readRequired(await client.rpc('complete_motion_studio_live_candidate', {
        target_operation_id: input.operationId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_media_asset_id: input.mediaAssetId,
        target_media_asset_version_id: input.mediaAssetVersionId,
        target_private_object_identity_hash: input.privateObjectIdentityHash,
        target_media_sha256: input.mediaSha256,
        target_byte_length: input.byteLength,
        target_mime_type: input.mimeType,
        target_width: input.width,
        target_height: input.height,
        target_duration_frames: input.durationFrames ?? null,
        target_fps_numerator: input.fpsNumerator ?? null,
        target_fps_denominator: input.fpsDenominator ?? null,
        target_provenance_digest: input.provenanceDigest,
        target_qa_evidence_digest: input.qaEvidenceDigest,
        target_safety_status: input.safetyStatus,
        target_usage_json: input.usage.map(toUsageRow),
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), candidateResponseSchema, 'technically complete live candidate')
    },
    async recoverCandidate(input) {
      return readRequired(await client.rpc('recover_motion_studio_live_media_candidate', {
        target_operation_id: input.operationId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_provider_source_media_sha256: input.providerSourceMediaSha256,
        target_ready_response_digest: input.readyResponseDigest,
        target_failed_download_response_digest: input.failedDownloadResponseDigest,
        target_media_asset_id: input.mediaAssetId,
        target_media_asset_version_id: input.mediaAssetVersionId,
        target_private_object_identity_hash: input.privateObjectIdentityHash,
        target_media_sha256: input.mediaSha256,
        target_byte_length: input.byteLength,
        target_mime_type: input.mimeType,
        target_width: input.width,
        target_height: input.height,
        target_duration_frames: input.durationFrames,
        target_fps_numerator: input.fpsNumerator,
        target_fps_denominator: input.fpsDenominator,
        target_provenance_digest: input.provenanceDigest,
        target_qa_evidence_digest: input.qaEvidenceDigest,
        target_safety_status: input.safetyStatus,
        target_usage_json: input.usage.map(toUsageRow),
        target_recovery_evidence_digest: input.recoveryEvidenceDigest,
        target_outcome_digest: input.outcomeDigest,
        target_occurred_at: input.occurredAt,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), recoveredCandidateResponseSchema, 'recovered technically complete live candidate')
    },
    async finishAttempt(input) {
      return readRequired(await client.rpc('finish_motion_studio_live_operation_attempt', {
        target_operation_id: input.operationId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_outcome: input.outcome,
        target_failure_category: input.failureCategory ?? null,
        target_usage_json: input.usage.map(toUsageRow),
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), terminalAttemptResponseSchema, 'terminal live operation attempt')
    },
    async reconcileAttempt(input) {
      return readRequired(await client.rpc('reconcile_motion_studio_live_operation_attempt', {
        target_operation_id: input.operationId,
        target_decision: input.decision,
        target_usage_json: input.usage.map(toUsageRow),
        target_evidence_digest: input.evidenceDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), reconciliationResponseSchema, 'live operation attempt reconciliation')
    },
    async reviewCandidate(input) {
      return readRequired(await client.rpc('review_motion_studio_live_candidate', {
        target_candidate_id: input.candidateId,
        target_decision: input.decision,
        target_rejection_category: input.rejectionCategory ?? null,
        target_qa_evidence_artifact_id: input.qaEvidenceArtifactId,
        target_qa_evidence_version_id: input.qaEvidenceVersionId,
        target_qa_evidence_content_digest: input.qaEvidenceContentDigest,
        target_review_digest: input.reviewDigest,
        target_fallback_eligibility_json: input.fallbackEligibility ?? null,
        target_actor_user_id: input.actorUserId,
      }), reviewResponseSchema, 'live candidate review')
    },
    async reviewCandidateByOwner(input) {
      return readRequired(await client.rpc('review_motion_studio_live_candidate_by_owner', {
        target_candidate_id: input.candidateId,
        target_human_review_json: input.review,
        target_reviewed_at: input.reviewedAt,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), ownerReviewResponseSchema, 'owner-authored live candidate review')
    },
  }
}

function toUsageRow(line: {
  costEstimateItemId: string
  meterId: string
  quantity: number
  internalCostMicros: number
  evidenceClass: string
  evidenceDigest: string
}) {
  return {
    costEstimateItemId: line.costEstimateItemId,
    meterId: line.meterId,
    quantity: line.quantity,
    internalCostMicros: line.internalCostMicros,
    evidenceClass: line.evidenceClass,
    evidenceDigest: line.evidenceDigest,
  }
}

function readRequired<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T {
  if (response.error) throw databaseError(label, response.error)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    throw new ApiError('INTERNAL_ERROR', `${label} returned an invalid sanitized record.`, 500, undefined, {
      internal: true,
    })
  }
  return parsed.data
}

function readOptional<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T | undefined {
  if (response.error) throw databaseError(label, response.error)
  if (response.data === null || response.data === undefined) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    throw new ApiError('INTERNAL_ERROR', `${label} returned an invalid sanitized record.`, 500, undefined, {
      internal: true,
    })
  }
  return parsed.data
}

function databaseError(label: string, error: PostgrestError): ApiError {
  const status = error.code === '42501' ? 403
    : error.code === 'P0002' ? 404
      : ['22023','23514'].includes(error.code) ? 400
        : ['23503','23505','55000'].includes(error.code) ? 409 : 500
  return new ApiError(
    status === 403 ? 'WORKSPACE_ACCESS_DENIED'
      : status === 404 ? 'MOTION_STUDIO_NOT_FOUND'
        : status === 400 ? 'VALIDATION_FAILED'
          : status === 409 ? 'MOTION_STUDIO_CONFLICT' : 'INTERNAL_ERROR',
    `${label} could not be persisted.`,
    status,
  )
}
