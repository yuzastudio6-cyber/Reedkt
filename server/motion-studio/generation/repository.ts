import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  motionStudioGenerationRoutePolicySchema,
  motionStudioGenerationShotSpecV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioProductionRow } from '../commands/types'
import type {
  MotionStudioGenerationAttemptRow,
  MotionStudioGenerationBindingRow,
  MotionStudioGenerationCandidateRow,
  MotionStudioGenerationCostAuthority,
  MotionStudioGenerationJobRow,
  MotionStudioGenerationLeaseRow,
  MotionStudioGenerationRepository,
  MotionStudioDeterministicPrivateCandidateRow,
  MotionStudioDeterministicPrivateMediaAssetVersionRow,
  MotionStudioLivePrivateCandidateRow,
  MotionStudioLivePrivateMediaAssetVersionRow,
  MotionStudioMediaAssetVersionRow,
  MotionStudioProviderAttemptRow,
  MotionStudioProviderEventRow,
} from './types'

const uuid = z.string().uuid()
const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const iso = z.string().min(1)

const productionRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId, owner_id: uuid,
  module_id: z.literal('storytelling'), module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived']),
  current_stage: z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery']),
  workspace_mode: z.enum(['guided', 'studio']),
  default_production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"), record_version: z.number().int().positive(),
  created_at: iso, updated_at: iso,
}).strict()

export const generationBindingRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid, scene_document_artifact_id: uuid,
  scene_document_version_id: uuid, scene_document_version_number: z.coerce.number().int().positive(),
  scene_document_content_digest: digest, timeline_proposal_id: uuid,
  timeline_proposal_output_digest: digest, job_id: stableId, approved_work_item_id: uuid,
  cost_budget_id: stableId,
  scene_id: stableId, media_kind: z.enum(['still_image', 'video_clip']),
  shot_spec_json: motionStudioGenerationShotSpecV1Schema,
  shot_spec_digest: digest, route_policy_json: motionStudioGenerationRoutePolicySchema,
  route_policy_digest: digest, protocol_simulator_only: z.literal(true),
  local_candidate_only: z.literal(true), created_by: uuid, created_at: iso,
}).strict()

export const providerAttemptRowSchema = z.object({
  id: uuid, binding_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, production_id: uuid, job_id: stableId,
  job_attempt_id: stableId, worker_lease_id: uuid,
  provider_route: z.enum(['gpt_image_2', 'gemini_omni_flash', 'wan', 'hailuo', 'veo']),
  provider_adapter_id: z.literal('motion_studio_protocol_simulator_v1'),
  provider_model_version: z.string().min(1).max(160), execution_class: z.literal('protocol_simulator'),
  request_digest: digest, external_operation_id_hash: digest.nullable(),
  status: z.enum(['created', 'submitted', 'processing', 'reconciliation_required', 'completed', 'failed', 'cancelled']),
  last_event_type: z.string().nullable(), last_event_at: iso.nullable(),
  poll_count: safeInteger, signature_verified_event_count: safeInteger,
  provider_cost_incurred: z.literal(false), record_version: z.coerce.number().int().positive(),
  created_by: uuid, created_at: iso, updated_at: iso,
}).strict()

export const providerEventRowSchema = z.object({
  id: uuid, provider_request_attempt_id: uuid, binding_id: uuid,
  workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, job_id: stableId, job_attempt_id: stableId,
  event_key_hash: digest,
  event_source: z.enum(['webhook', 'poll', 'synchronous']),
  event_type: z.enum(['submitted', 'processing', 'completed', 'failed', 'cancelled', 'outcome_unknown']),
  normalized_status: z.enum(['submitted', 'processing', 'reconciliation_required', 'completed', 'failed', 'cancelled']),
  verification_kind: z.enum(['hmac_sha256', 'server_poll', 'synchronous_response']),
  signature_verified: z.boolean(), event_digest: digest, occurred_at: iso, received_at: iso,
}).strict()

export const generationCandidateRowSchema = z.object({
  id: uuid, binding_id: uuid, provider_request_attempt_id: uuid,
  workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, job_id: stableId, job_attempt_id: stableId,
  media_asset_id: uuid, media_asset_version_id: uuid, qa_evidence_digest: digest,
  safety_status: z.enum(['passed', 'review_required', 'rejected']),
  review_status: z.enum(['review_needed', 'rejected']),
  reference_adherence_measured: z.literal(false), visual_quality_measured: z.literal(false),
  final_asset_eligible: z.literal(false), protocol_simulator_only: z.literal(true), created_at: iso,
}).strict()

export const mediaAssetVersionRowSchema = z.object({
  id: uuid, asset_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, version_number: z.coerce.number().int().positive(),
  source_kind: z.literal('protocol_simulator_fixture'), source_attempt_id: uuid,
  source_live_operation_id: z.null().optional(),
  private_object_identity_hash: digest, sha256: digest,
  byte_length: safeInteger.pipe(z.number().positive()), media_kind: z.enum(['still_image', 'video_clip']),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp', 'video/mp4']),
  width: z.coerce.number().int().positive().max(3840), height: z.coerce.number().int().positive().max(3840),
  duration_frames: z.coerce.number().int().positive().nullable(),
  fps_numerator: z.coerce.number().int().positive().nullable(), fps_denominator: z.coerce.number().int().positive().nullable(),
  provenance_digest: digest, qa_evidence_digest: digest, qa_status: z.literal('passed'),
  final_asset_eligible: z.literal(false), protocol_simulator_only: z.literal(true), created_at: iso,
}).strict()

const livePrivateMediaAssetVersionRowSchema = z.object({
  id: uuid, asset_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, version_number: z.coerce.number().int().positive(),
  source_kind: z.literal('live_provider_ingest'), source_attempt_id: z.null(),
  source_live_operation_id: stableId, private_object_identity_hash: digest, sha256: digest,
  byte_length: safeInteger.pipe(z.number().positive()), media_kind: z.enum(['still_image', 'video_clip']),
  mime_type: z.enum(['image/png', 'video/mp4']), width: z.coerce.number().int().positive().max(3840),
  height: z.coerce.number().int().positive().max(3840),
  duration_frames: z.coerce.number().int().positive().nullable(),
  fps_numerator: z.coerce.number().int().positive().nullable(),
  fps_denominator: z.coerce.number().int().positive().nullable(),
  provenance_digest: digest, qa_evidence_digest: digest, qa_status: z.literal('pending_review'),
  final_asset_eligible: z.literal(false), protocol_simulator_only: z.literal(false), created_at: iso,
}).strict()

const livePrivateCandidateRowSchema = z.object({
  id: uuid, operation_id: stableId, production_id: uuid, media_asset_id: uuid,
  media_asset_version_id: uuid, technically_complete: z.literal(true),
}).strict()

const deterministicPrivateMediaAssetVersionRowSchema = z.object({
  id: uuid, asset_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, version_number: z.coerce.number().int().positive(),
  source_kind: z.literal('private_deterministic_render'), source_attempt_id: z.null(),
  source_live_operation_id: z.null(), private_object_identity_hash: digest, sha256: digest,
  byte_length: safeInteger.pipe(z.number().positive()), media_kind: z.literal('video_clip'),
  mime_type: z.literal('video/mp4'), width: z.coerce.number().int().positive().max(3840),
  height: z.coerce.number().int().positive().max(3840),
  duration_frames: z.coerce.number().int().positive(),
  fps_numerator: z.coerce.number().int().positive(), fps_denominator: z.coerce.number().int().positive(),
  provenance_digest: digest, qa_evidence_digest: digest, qa_status: z.literal('passed'),
  final_asset_eligible: z.literal(true), protocol_simulator_only: z.literal(false), created_at: iso,
}).strict()

const deterministicPrivateCandidateRowSchema = z.object({
  id: uuid, production_id: uuid, media_asset_id: uuid, media_asset_version_id: uuid,
}).strict()

const jobRowSchema = z.object({
  id: stableId, production_id: uuid, approved_snapshot_id: uuid,
  approved_work_item_id: uuid, cost_budget_id: stableId, work_item_type: stableId,
  required_worker_class: stableId,
  status: z.enum(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled']),
  maximum_authorized_internal_cost_micros: safeInteger, attempt_count: safeInteger,
  max_attempts: z.coerce.number().int().positive(),
}).strict()
const attemptRowSchema = z.object({
  id: stableId, job_id: stableId,
  attempt_number: z.coerce.number().int().positive(),
  status: z.enum(['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown']),
  failure_category: stableId.nullable(),
}).strict()
const leaseRowSchema = z.object({
  id: uuid, job_id: stableId, attempt_id: stableId, credential_hash_sha256: digest,
  status: z.enum(['active', 'released', 'expired']), expires_at: iso,
}).strict()
const costItemRowSchema = z.object({
  id: stableId, capability_or_tool_id: z.literal('motion_studio_protocol_simulator'),
  rate_card_version_id: stableId, quantity: z.coerce.number().positive().max(300),
  unit: z.literal('cpu_second'), maximum_authorized_internal_cost_micros: safeInteger,
}).strict()
const rateCardRowSchema = z.object({
  id: stableId, unit: z.literal('cpu_second'), unit_price_micros: safeInteger,
  minimum_charge_micros: safeInteger, immutable: z.literal(true),
}).strict()
const attemptUsageRowSchema = z.object({
  cost_estimate_item_id: stableId,
  meter_id: z.literal('cpu_second'),
  quantity: z.coerce.number().nonnegative().max(300),
  internal_cost_micros: safeInteger,
  evidence_class: z.literal('infrastructure_metered'),
  evidence_digest: digest,
}).strict()

const bindingResponseSchema = z.object({ binding: generationBindingRowSchema }).strict()
const providerAttemptResponseSchema = z.object({ providerAttempt: providerAttemptRowSchema }).strict()
const providerSignalResponseSchema = z.object({
  providerAttempt: providerAttemptRowSchema, event: providerEventRowSchema, replayed: z.boolean(),
}).strict()
const generationReconciliationResponseSchema = z.object({
  providerAttempt: providerAttemptRowSchema,
  reconciliation: z.record(z.string(), z.unknown()),
  decision: z.enum(['no_side_effect', 'manual_review']),
}).strict()
const candidateResponseSchema = z.object({
  completion: z.record(z.string(), z.unknown()),
  asset: z.record(z.string(), z.unknown()),
  mediaVersion: mediaAssetVersionRowSchema,
  candidate: generationCandidateRowSchema,
}).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const BINDING_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,scene_document_artifact_id,scene_document_version_id,scene_document_version_number,scene_document_content_digest,timeline_proposal_id,timeline_proposal_output_digest,job_id,approved_work_item_id,cost_budget_id,scene_id,media_kind,shot_spec_json,shot_spec_digest,route_policy_json,route_policy_digest,protocol_simulator_only,local_candidate_only,created_by,created_at'
const PROVIDER_SELECT = 'id,binding_id,workspace_id,project_id,edit_session_id,production_id,job_id,job_attempt_id,worker_lease_id,provider_route,provider_adapter_id,provider_model_version,execution_class,request_digest,external_operation_id_hash,status,last_event_type,last_event_at,poll_count,signature_verified_event_count,provider_cost_incurred,record_version,created_by,created_at,updated_at'
const CANDIDATE_SELECT = 'id,binding_id,provider_request_attempt_id,workspace_id,project_id,edit_session_id,production_id,job_id,job_attempt_id,media_asset_id,media_asset_version_id,qa_evidence_digest,safety_status,review_status,reference_adherence_measured,visual_quality_measured,final_asset_eligible,protocol_simulator_only,created_at'
const MEDIA_VERSION_SELECT = 'id,asset_id,workspace_id,project_id,edit_session_id,version_number,source_kind,source_attempt_id,private_object_identity_hash,sha256,byte_length,media_kind,mime_type,width,height,duration_frames,fps_numerator,fps_denominator,provenance_digest,qa_evidence_digest,qa_status,final_asset_eligible,protocol_simulator_only,created_at'
const LIVE_MEDIA_VERSION_SELECT = 'id,asset_id,workspace_id,project_id,edit_session_id,version_number,source_kind,source_attempt_id,source_live_operation_id,private_object_identity_hash,sha256,byte_length,media_kind,mime_type,width,height,duration_frames,fps_numerator,fps_denominator,provenance_digest,qa_evidence_digest,qa_status,final_asset_eligible,protocol_simulator_only,created_at'
const LIVE_PRIVATE_CANDIDATE_SELECT = 'id,operation_id,production_id,media_asset_id,media_asset_version_id,technically_complete'
const DETERMINISTIC_PRIVATE_CANDIDATE_SELECT = 'id,production_id,media_asset_id,media_asset_version_id'
const JOB_SELECT = 'id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_type,required_worker_class,status,maximum_authorized_internal_cost_micros,attempt_count,max_attempts'
const ATTEMPT_SELECT = 'id,job_id,attempt_number,status,failure_category'
const LEASE_SELECT = 'id,job_id,attempt_id,credential_hash_sha256,status,expires_at'

export function createSupabaseMotionStudioGenerationRepository(client: SupabaseClient): MotionStudioGenerationRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle(), productionRowSchema, 'Motion Studio production') as MotionStudioProductionRow | undefined
    },
    async readWorkspaceState(productionId) {
      const bindings = readMany(await client.from('motion_studio_generation_bindings').select(BINDING_SELECT).eq('production_id', productionId).order('created_at', { ascending: false }), generationBindingRowSchema, 'generation bindings') as MotionStudioGenerationBindingRow[]
      if (!bindings.length) return {
        bindings, jobs: new Map(), attempts: new Map(), providerAttempts: new Map(),
        candidates: new Map(), mediaVersions: new Map(),
      }
      const jobIds = bindings.map((binding) => binding.job_id)
      const [jobs, attempts, providerAttempts, candidates] = await Promise.all([
        Promise.resolve(readMany(await client.from('jobs').select(JOB_SELECT).in('id', jobIds), jobRowSchema, 'generation jobs') as MotionStudioGenerationJobRow[]),
        Promise.resolve(readMany(await client.from('job_attempts').select(ATTEMPT_SELECT).in('job_id', jobIds).order('attempt_number', { ascending: true }), attemptRowSchema, 'generation attempts') as MotionStudioGenerationAttemptRow[]),
        Promise.resolve(readMany(await client.from('provider_request_attempts').select(PROVIDER_SELECT).eq('production_id', productionId).order('created_at', { ascending: true }), providerAttemptRowSchema, 'provider attempts') as MotionStudioProviderAttemptRow[]),
        Promise.resolve(readMany(await client.from('motion_studio_generation_candidates').select(CANDIDATE_SELECT).eq('production_id', productionId), generationCandidateRowSchema, 'generation candidates') as MotionStudioGenerationCandidateRow[]),
      ])
      const mediaVersions = candidates.length
        ? readMany(await client.from('media_asset_versions').select(MEDIA_VERSION_SELECT).in('id', candidates.map((candidate) => candidate.media_asset_version_id)), mediaAssetVersionRowSchema, 'generation media versions') as MotionStudioMediaAssetVersionRow[]
        : []
      const attemptsById = new Map(attempts.map((row) => [row.id, row]))
      const latestAttempts = new Map<string, MotionStudioGenerationAttemptRow>()
      for (const row of attempts) latestAttempts.set(row.job_id, row)
      const latestProviderAttempts = new Map<string, MotionStudioProviderAttemptRow>()
      for (const row of providerAttempts) {
        const prior = latestProviderAttempts.get(row.binding_id)
        const priorNumber = prior ? attemptsById.get(prior.job_attempt_id)?.attempt_number ?? 0 : 0
        const nextNumber = attemptsById.get(row.job_attempt_id)?.attempt_number ?? 0
        if (!prior || nextNumber >= priorNumber) latestProviderAttempts.set(row.binding_id, row)
      }
      return {
        bindings,
        jobs: new Map(jobs.map((row) => [row.id, row])),
        attempts: latestAttempts,
        providerAttempts: latestProviderAttempts,
        candidates: new Map(candidates.map((row) => [row.binding_id, row])),
        mediaVersions: new Map(mediaVersions.map((row) => [row.id, row])),
      }
    },
    async createBinding(input) {
      const response = await client.rpc('create_motion_studio_generation_binding', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_scene_document_artifact_id: input.sceneDocumentArtifactId,
        target_scene_document_version_id: input.sceneDocumentVersionId,
        target_scene_document_content_digest: input.sceneDocumentContentDigest,
        target_timeline_proposal_id: input.timelineProposalId,
        target_job_id: input.jobId,
        target_shot_spec_json: input.shotSpec,
        target_shot_spec_digest: input.shotSpecDigest,
        target_route_policy_json: input.routePolicy,
        target_route_policy_digest: input.routePolicyDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, bindingResponseSchema, 'generation binding').binding as MotionStudioGenerationBindingRow
    },
    async findExecutionAuthority(bindingId, leaseId) {
      const binding = readMaybe(await client.from('motion_studio_generation_bindings').select(BINDING_SELECT).eq('id', bindingId).maybeSingle(), generationBindingRowSchema, 'generation binding') as MotionStudioGenerationBindingRow | undefined
      if (!binding) return undefined
      const job = readRequired(await client.from('jobs').select(JOB_SELECT).eq('id', binding.job_id).single(), jobRowSchema, 'generation job') as MotionStudioGenerationJobRow
      const lease = readRequired(await client.from('worker_leases').select(LEASE_SELECT).eq('id', leaseId).eq('job_id', job.id).single(), leaseRowSchema, 'generation lease') as MotionStudioGenerationLeaseRow
      const attempt = readRequired(await client.from('job_attempts').select(ATTEMPT_SELECT).eq('id', lease.attempt_id).eq('job_id', job.id).single(), attemptRowSchema, 'generation attempt') as MotionStudioGenerationAttemptRow
      const cost = await readGenerationCostAuthority(client, job.id)
      const providerAttempt = readMaybe(await client.from('provider_request_attempts').select(PROVIDER_SELECT).eq('binding_id', binding.id).eq('job_attempt_id', attempt.id).maybeSingle(), providerAttemptRowSchema, 'provider attempt') as MotionStudioProviderAttemptRow | undefined
      const candidate = readMaybe(await client.from('motion_studio_generation_candidates').select(CANDIDATE_SELECT).eq('binding_id', binding.id).maybeSingle(), generationCandidateRowSchema, 'generation candidate') as MotionStudioGenerationCandidateRow | undefined
      const mediaVersion = candidate
        ? readMaybe(await client.from('media_asset_versions').select(MEDIA_VERSION_SELECT).eq('id', candidate.media_asset_version_id).maybeSingle(), mediaAssetVersionRowSchema, 'generation media version') as MotionStudioMediaAssetVersionRow | undefined
        : undefined
      return { binding, job, attempt, lease, cost, ...(providerAttempt ? { providerAttempt } : {}), ...(candidate ? { candidate } : {}), ...(mediaVersion ? { mediaVersion } : {}) }
    },
    async beginProviderAttempt(input) {
      const response = await client.rpc('begin_motion_studio_provider_attempt', {
        target_binding_id: input.bindingId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_provider_route: input.providerRoute,
        target_provider_model_version: input.providerModelVersion,
        target_request_digest: input.requestDigest,
        target_external_operation_id_hash: input.externalOperationIdHash,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, providerAttemptResponseSchema, 'provider attempt').providerAttempt as MotionStudioProviderAttemptRow
    },
    async recordProviderSignal(input) {
      const response = await client.rpc('record_motion_studio_provider_signal', {
        target_provider_request_attempt_id: input.providerAttemptId,
        target_event_key_hash: input.eventKeyHash,
        target_event_source: input.eventSource,
        target_event_type: input.eventType,
        target_normalized_status: input.normalizedStatus,
        target_verification_kind: input.verificationKind,
        target_signature_verified: input.signatureVerified,
        target_event_digest: input.eventDigest,
        target_occurred_at: input.occurredAt,
        target_actor_user_id: input.actorUserId,
      })
      return readRequired(response, providerSignalResponseSchema, 'provider signal') as {
        providerAttempt: MotionStudioProviderAttemptRow
        event: MotionStudioProviderEventRow
        replayed: boolean
      }
    },
    async markReconciliationRequired(input) {
      const response = await client.rpc('mark_motion_studio_generation_reconciliation_required', {
        target_provider_request_attempt_id: input.providerAttemptId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_usage_json: input.usage,
        target_evidence_digest: input.evidenceDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, z.record(z.string(), z.unknown()), 'generation uncertainty marker')
    },
    async reconcileProviderAttempt(input) {
      const response = await client.rpc('reconcile_motion_studio_generation_attempt', {
        target_provider_request_attempt_id: input.providerAttemptId,
        target_decision: input.decision,
        target_evidence_digest: input.evidenceDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, generationReconciliationResponseSchema, 'generation attempt reconciliation')
    },
    async completeCandidate(input) {
      const response = await client.rpc('complete_motion_studio_generation_candidate', {
        target_provider_request_attempt_id: input.providerAttemptId,
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
        target_usage_json: input.usage,
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      const parsed = readRequired(response, candidateResponseSchema, 'generation candidate completion')
      return {
        mediaVersion: parsed.mediaVersion as MotionStudioMediaAssetVersionRow,
        candidate: parsed.candidate as MotionStudioGenerationCandidateRow,
      }
    },
    async findMediaAuthority(assetVersionId) {
      const source = readMaybe(
        await client.from('media_asset_versions').select('source_kind').eq('id', assetVersionId).maybeSingle(),
        z.object({ source_kind: z.enum(['protocol_simulator_fixture', 'live_provider_ingest', 'private_deterministic_render']) }).strict(),
        'private generated-media source',
      )
      if (!source) return undefined
      if (source.source_kind === 'private_deterministic_render') {
        const mediaVersion = readMaybe(
          await client.from('media_asset_versions').select(LIVE_MEDIA_VERSION_SELECT).eq('id', assetVersionId).maybeSingle(),
          deterministicPrivateMediaAssetVersionRowSchema,
          'deterministic route media version',
        ) as MotionStudioDeterministicPrivateMediaAssetVersionRow | undefined
        if (!mediaVersion) return undefined
        const candidate = readMaybe(
          await client.from('motion_studio_deterministic_route_candidates')
            .select(DETERMINISTIC_PRIVATE_CANDIDATE_SELECT)
            .eq('media_asset_version_id', mediaVersion.id).maybeSingle(),
          deterministicPrivateCandidateRowSchema,
          'deterministic route candidate',
        ) as MotionStudioDeterministicPrivateCandidateRow | undefined
        if (!candidate || candidate.media_asset_id !== mediaVersion.asset_id) return undefined
        const production = readMaybe(
          await client.from('motion_studio_productions').select(PRODUCTION_SELECT)
            .eq('id', candidate.production_id).maybeSingle(),
          productionRowSchema,
          'deterministic route production',
        ) as MotionStudioProductionRow | undefined
        return production ? { source: 'deterministic_route', production, candidate, mediaVersion } : undefined
      }
      if (source.source_kind === 'live_provider_ingest') {
        const mediaVersion = readMaybe(
          await client.from('media_asset_versions').select(LIVE_MEDIA_VERSION_SELECT).eq('id', assetVersionId).maybeSingle(),
          livePrivateMediaAssetVersionRowSchema,
          'live generated-media version',
        ) as MotionStudioLivePrivateMediaAssetVersionRow | undefined
        if (!mediaVersion) return undefined
        const candidate = readMaybe(
          await client.from('motion_studio_live_candidates').select(LIVE_PRIVATE_CANDIDATE_SELECT)
            .eq('media_asset_version_id', mediaVersion.id).maybeSingle(),
          livePrivateCandidateRowSchema,
          'live generated-media candidate',
        ) as MotionStudioLivePrivateCandidateRow | undefined
        if (!candidate || candidate.media_asset_id !== mediaVersion.asset_id || candidate.operation_id !== mediaVersion.source_live_operation_id) return undefined
        const production = readMaybe(
          await client.from('motion_studio_productions').select(PRODUCTION_SELECT)
            .eq('id', candidate.production_id).maybeSingle(),
          productionRowSchema,
          'live generated-media production',
        ) as MotionStudioProductionRow | undefined
        return production ? { source: 'live_provider', production, candidate, mediaVersion } : undefined
      }
      const mediaVersion = readMaybe(
        await client.from('media_asset_versions').select(MEDIA_VERSION_SELECT).eq('id', assetVersionId).maybeSingle(),
        mediaAssetVersionRowSchema,
        'generation media version',
      ) as MotionStudioMediaAssetVersionRow | undefined
      if (!mediaVersion) return undefined
      const candidate = readMaybe(
        await client.from('motion_studio_generation_candidates').select(CANDIDATE_SELECT)
          .eq('media_asset_version_id', mediaVersion.id).maybeSingle(),
        generationCandidateRowSchema,
        'generation media candidate',
      ) as MotionStudioGenerationCandidateRow | undefined
      if (!candidate) return undefined
      const production = readMaybe(
        await client.from('motion_studio_productions').select(PRODUCTION_SELECT)
          .eq('id', candidate.production_id).maybeSingle(),
        productionRowSchema,
        'generation media production',
      ) as MotionStudioProductionRow | undefined
      return production ? { source: 'simulator', production, candidate, mediaVersion } : undefined
    },
    async findAttemptUsage(attemptId) {
      const row = readMaybe(
        await client.from('production_usage_events')
          .select('cost_estimate_item_id,meter_id,quantity,internal_cost_micros,evidence_class,evidence_digest')
          .eq('attempt_id', attemptId).eq('meter_id', 'cpu_second').maybeSingle(),
        attemptUsageRowSchema,
        'generation attempt usage',
      )
      return row ? {
        costEstimateItemId: row.cost_estimate_item_id,
        meterId: row.meter_id,
        quantity: row.quantity,
        internalCostMicros: row.internal_cost_micros,
        evidenceClass: row.evidence_class,
        evidenceDigest: row.evidence_digest,
      } : undefined
    },
  }
}

async function readGenerationCostAuthority(client: SupabaseClient, jobId: string): Promise<MotionStudioGenerationCostAuthority> {
  const bindings = readMany(await client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id', jobId), z.object({ estimate_item_id: stableId }).strict(), 'generation cost bindings')
  const items = bindings.length
    ? readMany(await client.from('production_cost_estimate_items').select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,maximum_authorized_internal_cost_micros').in('id', bindings.map((item) => item.estimate_item_id)).eq('capability_or_tool_id', 'motion_studio_protocol_simulator').eq('unit', 'cpu_second'), costItemRowSchema, 'generation simulator cost item')
    : []
  if (items.length !== 1) throw invalidDatabase('generation simulator cost authority')
  const item = items[0]!
  const rate = readRequired(await client.from('provider_rate_card_versions').select('id,unit,unit_price_micros,minimum_charge_micros,immutable').eq('id', item.rate_card_version_id).single(), rateCardRowSchema, 'generation simulator rate card')
  return {
    estimateItemId: item.id,
    capabilityOrToolId: 'motion_studio_protocol_simulator',
    rateCardVersionId: item.rate_card_version_id,
    unit: 'cpu_second',
    quantity: item.quantity,
    maximumAuthorizedInternalCostMicros: item.maximum_authorized_internal_cost_micros,
    unitPriceMicros: rate.unit_price_micros,
    minimumChargeMicros: rate.minimum_charge_micros,
  }
}

function readRequired<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T {
  if (response.error) throw mapDatabaseError(response.error)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}
function readMaybe<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T | undefined {
  if (response.error) throw mapDatabaseError(response.error)
  if (response.data == null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}
function readMany<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T[] {
  if (response.error) throw mapDatabaseError(response.error)
  const parsed = z.array(schema).safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}
function mapDatabaseError(error: PostgrestError): ApiError {
  if (error.code === '42501') return new ApiError('WORKSPACE_ACCESS_DENIED', error.message, 403)
  if (error.code === 'P0002') return new ApiError('MOTION_STUDIO_NOT_FOUND', error.message, 404)
  if (['22023', '23503', '23505', '23514', '40001', '55000'].includes(error.code)) {
    return new ApiError('MOTION_STUDIO_CONFLICT', error.message, 409, { databaseCode: error.code })
  }
  return new ApiError('INTERNAL_ERROR', 'Motion Studio generated-media persistence failed.', 500, undefined, {
    cause: { source: 'postgrest', code: error.code }, internal: true,
  })
}
function invalidDatabase(label: string, details?: unknown): ApiError {
  return new ApiError('INTERNAL_ERROR', `${label} returned an invalid canonical record.`, 500, undefined, { cause: details, internal: true })
}
