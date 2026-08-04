import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { MotionStudioAnimaticAssemblyReceiptDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioProductionRow } from '../commands/types'
import type {
  MotionStudioAnimaticArtifactRow,
  MotionStudioAnimaticBindingRow,
  MotionStudioAnimaticRepository,
} from './types'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const uuid = z.string().uuid()
const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const safeInteger = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const jobStatus = z.enum(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled'])
const attemptStatus = z.enum(['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown'])
const versionReference = z.object({
  artifactId: uuid,
  versionId: uuid,
  versionNumber: z.number().int().positive(),
  contentDigest: digest,
}).strict()
const assemblyReceiptSchema = z.object({
  productionId: uuid,
  approvedSnapshotId: uuid,
  preparedScript: versionReference,
  voiceBible: versionReference,
  storyboard: versionReference,
  animatic: versionReference,
  narrationAuthorityDigest: digest,
  localCandidateOnly: z.literal(true),
}).strict()
const productionRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  owner_id: uuid,
  module_id: z.literal('storytelling'), module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived']),
  current_stage: z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery']),
  workspace_mode: z.enum(['guided', 'studio']),
  default_production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"), record_version: z.number().int().positive(),
  created_at: z.string().min(1), updated_at: z.string().min(1),
}).strict()
const bindingRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid, assembly_id: uuid,
  prepared_script_artifact_id: uuid, prepared_script_version_id: uuid,
  prepared_script_version_number: z.number().int().positive(), prepared_script_content_digest: digest,
  voice_bible_artifact_id: uuid, voice_bible_version_id: uuid,
  voice_bible_version_number: z.number().int().positive(), voice_bible_content_digest: digest,
  storyboard_artifact_id: uuid, storyboard_version_id: uuid,
  storyboard_version_number: z.number().int().positive(), storyboard_content_digest: digest,
  animatic_artifact_id: uuid, animatic_version_id: uuid,
  animatic_version_number: z.number().int().positive(), animatic_content_digest: digest,
  narration_authority_digest: digest, narration_media_asset_id: stableId,
  narration_checksum_sha256: digest, narration_byte_length: safeInteger,
  narration_mime_type: z.enum(['audio/wav', 'audio/mpeg', 'audio/mp3']),
  narration_audio_codec: z.string().min(1).max(80), narration_sample_rate_hertz: safeInteger,
  narration_channel_count: z.union([z.literal(1), z.literal(2)]), narration_duration_milliseconds: safeInteger,
  job_id: stableId, approved_work_item_id: uuid, cost_budget_id: stableId,
  width: safeInteger, height: safeInteger, fps_numerator: z.union([z.literal(24), z.literal(30)]),
  fps_denominator: z.literal(1), rendered_frame_count: safeInteger,
  scene_count: z.number().int().min(1).max(8),
  scene_bindings_json: z.array(z.record(z.string(), z.unknown())).min(1).max(8).readonly(),
  registered_profile_id: z.literal('motion_studio_prepared_script_animatic_v1'),
  input_digest: digest, created_by: uuid, created_at: z.string().min(1),
}).strict()
const frameEvidenceSchema = z.object({ frame: safeInteger, sha256: digest }).strict()
const artifactRowSchema = z.object({
  id: uuid, binding_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, production_id: uuid, job_id: stableId, attempt_id: stableId,
  private_object_identity_hash: digest, artifact_sha256: digest, byte_length: safeInteger,
  mime_type: z.literal('video/mp4'), codec: z.literal('h264'), pixel_format: z.literal('yuv420p'),
  color_space: z.literal('bt709'), audio_codec: z.literal('aac'),
  audio_sample_rate_hertz: safeInteger, audio_channel_count: z.union([z.literal(1), z.literal(2)]),
  width: safeInteger, height: safeInteger, fps_numerator: z.union([z.literal(24), z.literal(30)]),
  fps_denominator: z.literal(1), rendered_frame_count: safeInteger,
  frame_evidence_json: z.array(frameEvidenceSchema).length(3).readonly(),
  runtime_identity_digest: digest, attestation_digest: digest, qa_evidence_digest: digest,
  created_at: z.string().min(1),
}).strict()
const jobRowSchema = z.object({
  id: stableId, production_id: uuid, approved_snapshot_id: uuid,
  approved_work_item_id: uuid, cost_budget_id: stableId, work_item_type: stableId,
  required_worker_class: stableId, status: jobStatus,
  maximum_authorized_internal_cost_micros: safeInteger, attempt_count: safeInteger,
  max_attempts: z.number().int().positive(),
}).strict()
const attemptRowSchema = z.object({
  id: stableId, job_id: stableId, attempt_number: z.number().int().positive(), status: attemptStatus,
  failure_category: stableId.nullable(), started_at: z.string().nullable(), completed_at: z.string().nullable(),
}).strict()
const leaseRowSchema = z.object({
  id: uuid, job_id: stableId, attempt_id: stableId, credential_hash_sha256: digest,
  status: z.enum(['active', 'released', 'expired']), expires_at: z.string().min(1),
}).strict()
const costItemRowSchema = z.object({
  id: stableId, capability_or_tool_id: z.literal('remotion'), rate_card_version_id: stableId,
  quantity: z.coerce.number().positive().finite(), unit: z.literal('render_frame'),
  expected_internal_cost_micros: safeInteger, maximum_authorized_internal_cost_micros: safeInteger,
}).strict()
const rateCardRowSchema = z.object({
  id: stableId, unit: z.literal('render_frame'), unit_price_micros: safeInteger,
  minimum_charge_micros: safeInteger, immutable: z.literal(true),
}).strict()
const estimateBindingSchema = z.object({ estimate_item_id: stableId }).strict()
const completionSchema = z.object({ completion: z.record(z.string(), z.unknown()), artifact: artifactRowSchema }).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const ASSEMBLY_SELECT = [
  'production_id', 'approved_snapshot_id',
  'prepared_script_artifact_id', 'prepared_script_version_id', 'prepared_script_version_number', 'prepared_script_content_digest',
  'voice_bible_artifact_id', 'voice_bible_version_id', 'voice_bible_version_number', 'voice_bible_content_digest',
  'storyboard_artifact_id', 'storyboard_version_id', 'storyboard_version_number', 'storyboard_content_digest',
  'animatic_artifact_id', 'animatic_version_id', 'animatic_version_number', 'animatic_content_digest',
  'narration_authority_digest',
].join(',')
const BINDING_SELECT = [
  'id','workspace_id','project_id','edit_session_id','production_id','approved_snapshot_id','assembly_id',
  'prepared_script_artifact_id','prepared_script_version_id','prepared_script_version_number','prepared_script_content_digest',
  'voice_bible_artifact_id','voice_bible_version_id','voice_bible_version_number','voice_bible_content_digest',
  'storyboard_artifact_id','storyboard_version_id','storyboard_version_number','storyboard_content_digest',
  'animatic_artifact_id','animatic_version_id','animatic_version_number','animatic_content_digest',
  'narration_authority_digest','narration_media_asset_id','narration_checksum_sha256','narration_byte_length',
  'narration_mime_type','narration_audio_codec','narration_sample_rate_hertz','narration_channel_count',
  'narration_duration_milliseconds','job_id','approved_work_item_id','cost_budget_id','width','height',
  'fps_numerator','fps_denominator','rendered_frame_count','scene_count','scene_bindings_json',
  'registered_profile_id','input_digest','created_by','created_at',
].join(',')
const ARTIFACT_SELECT = 'id,binding_id,workspace_id,project_id,edit_session_id,production_id,job_id,attempt_id,private_object_identity_hash,artifact_sha256,byte_length,mime_type,codec,pixel_format,color_space,audio_codec,audio_sample_rate_hertz,audio_channel_count,width,height,fps_numerator,fps_denominator,rendered_frame_count,frame_evidence_json,runtime_identity_digest,attestation_digest,qa_evidence_digest,created_at'
const JOB_SELECT = 'id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_type,required_worker_class,status,maximum_authorized_internal_cost_micros,attempt_count,max_attempts'
const ATTEMPT_SELECT = 'id,job_id,attempt_number,status,failure_category,started_at,completed_at'
const LEASE_SELECT = 'id,job_id,attempt_id,credential_hash_sha256,status,expires_at'

export function createSupabaseMotionStudioAnimaticRepository(client: SupabaseClient): MotionStudioAnimaticRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(
        await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle(),
        productionRowSchema,
        'Motion Studio production',
      ) as MotionStudioProductionRow | undefined
    },
    async createAssembly(input) {
      const response = await client.rpc('assemble_motion_studio_animatic_candidates', {
        target_production_id: input.production.id,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_prepared_script_artifact_id: input.preparedScriptArtifactId,
        target_prepared_script_version_id: input.preparedScriptVersionId,
        target_prepared_script_content_digest: input.preparedScriptContentDigest,
        target_narration_authority_json: input.narration,
        target_narration_authority_digest: input.narrationAuthorityDigest,
        target_ordered_scene_version_ids: input.orderedSceneVersionIds,
        target_ordered_proposal_ids: input.orderedProposalIds,
        target_voice_payload_json: input.voicePayload,
        target_storyboard_payload_json: input.storyboardPayload,
        target_animatic_payload_json: input.animaticPayload,
        target_input_digest: input.inputDigest,
        target_actor_user_id: input.actorUserId,
        target_created_at: input.createdAt,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, assemblyReceiptSchema, 'Motion Studio animatic assembly')
    },
    async listAssemblies(productionId) {
      const rows = readMany(
        await client.from('motion_studio_animatic_assemblies').select(ASSEMBLY_SELECT)
          .eq('production_id', productionId).order('created_at', { ascending: false }).limit(20),
        z.record(z.string(), z.unknown()),
        'Motion Studio animatic assemblies',
      )
      return rows.map(mapAssemblyRow)
    },
    async readWorkspaceState(productionId) {
      const bindings = readMany(
        await client.from('motion_studio_animatic_bindings').select(BINDING_SELECT)
          .eq('production_id', productionId).order('created_at', { ascending: false }),
        bindingRowSchema,
        'Motion Studio animatic bindings',
      ) as MotionStudioAnimaticBindingRow[]
      if (!bindings.length) return { bindings, jobs: new Map(), attempts: new Map(), artifacts: new Map() }
      const jobIds = [...new Set(bindings.map((binding) => binding.job_id))]
      const jobs = readMany(
        await client.from('jobs').select(JOB_SELECT).in('id', jobIds),
        jobRowSchema,
        'Motion Studio animatic jobs',
      )
      const attempts = readMany(
        await client.from('job_attempts').select(ATTEMPT_SELECT).in('job_id', jobIds)
          .order('attempt_number', { ascending: false }),
        attemptRowSchema,
        'Motion Studio animatic attempts',
      )
      const artifacts = readMany(
        await client.from('motion_studio_animatic_artifacts').select(ARTIFACT_SELECT)
          .eq('production_id', productionId),
        artifactRowSchema,
        'Motion Studio animatic artifacts',
      ) as MotionStudioAnimaticArtifactRow[]
      const latestAttempts = new Map<string, z.infer<typeof attemptRowSchema>>()
      for (const attempt of attempts) if (!latestAttempts.has(attempt.job_id)) latestAttempts.set(attempt.job_id, attempt)
      return {
        bindings,
        jobs: new Map(jobs.map((job) => [job.id, job])),
        attempts: latestAttempts,
        artifacts: new Map(artifacts.map((artifact) => [artifact.binding_id, artifact])),
      }
    },
    async createBinding(input) {
      return readRequired(
        await client.rpc('create_motion_studio_animatic_binding', {
          target_production_id: input.productionId,
          target_approved_snapshot_id: input.approvedSnapshotId,
          target_animatic_artifact_id: input.animaticArtifactId,
          target_animatic_version_id: input.animaticVersionId,
          target_animatic_content_digest: input.animaticContentDigest,
          target_job_id: input.jobId,
          target_actor_user_id: input.actorUserId,
          target_idempotency_key: input.idempotencyKey,
          target_request_hash: input.requestHash,
        }),
        bindingRowSchema,
        'Motion Studio animatic binding',
      ) as MotionStudioAnimaticBindingRow
    },
    async findExecutionAuthority(bindingId, leaseId) {
      const binding = readMaybe(
        await client.from('motion_studio_animatic_bindings').select(BINDING_SELECT).eq('id', bindingId).maybeSingle(),
        bindingRowSchema,
        'Motion Studio animatic binding',
      ) as MotionStudioAnimaticBindingRow | undefined
      if (!binding) return undefined
      const job = readRequired(
        await client.from('jobs').select(JOB_SELECT).eq('id', binding.job_id).single(),
        jobRowSchema,
        'Motion Studio animatic job',
      )
      const lease = readRequired(
        await client.from('worker_leases').select(LEASE_SELECT).eq('id', leaseId).eq('job_id', binding.job_id).single(),
        leaseRowSchema,
        'Motion Studio animatic lease',
      )
      const attempt = readRequired(
        await client.from('job_attempts').select(ATTEMPT_SELECT).eq('id', lease.attempt_id).eq('job_id', job.id).single(),
        attemptRowSchema,
        'Motion Studio animatic attempt',
      )
      const cost = await readCostAuthority(client, job.id)
      const artifact = readMaybe(
        await client.from('motion_studio_animatic_artifacts').select(ARTIFACT_SELECT).eq('binding_id', binding.id).maybeSingle(),
        artifactRowSchema,
        'Motion Studio animatic artifact',
      ) as MotionStudioAnimaticArtifactRow | undefined
      return { binding, job, lease, attempt, cost, ...(artifact ? { artifact } : {}) }
    },
    async completeAttempt(input) {
      const result = readRequired(
        await client.rpc('complete_motion_studio_animatic_attempt', {
          target_binding_id: input.bindingId,
          target_lease_id: input.leaseId,
          target_credential_hash: input.credentialHash,
          target_private_object_identity_hash: input.privateObjectIdentityHash,
          target_artifact_sha256: input.artifactSha256,
          target_byte_length: input.byteLength,
          target_audio_sample_rate_hertz: input.audioSampleRateHertz,
          target_audio_channel_count: input.audioChannelCount,
          target_frame_evidence_json: input.frameEvidence,
          target_runtime_identity_digest: input.runtimeIdentityDigest,
          target_attestation_digest: input.attestationDigest,
          target_qa_evidence_digest: input.qaEvidenceDigest,
          target_usage_json: input.usage,
          target_outcome_digest: input.outcomeDigest,
          target_actor_user_id: input.actorUserId,
          target_idempotency_key: input.idempotencyKey,
          target_request_hash: input.requestHash,
        }),
        completionSchema,
        'Motion Studio animatic completion',
      )
      return result.artifact
    },
    async findArtifact(artifactId) {
      return readMaybe(
        await client.from('motion_studio_animatic_artifacts').select(ARTIFACT_SELECT).eq('id', artifactId).maybeSingle(),
        artifactRowSchema,
        'Motion Studio animatic artifact',
      ) as MotionStudioAnimaticArtifactRow | undefined
    },
  }
}

function mapAssemblyRow(input: Record<string, unknown>): MotionStudioAnimaticAssemblyReceiptDto {
  return assemblyReceiptSchema.parse({
    productionId: input.production_id,
    approvedSnapshotId: input.approved_snapshot_id,
    preparedScript: referenceFromRow(input, 'prepared_script'),
    voiceBible: referenceFromRow(input, 'voice_bible'),
    storyboard: referenceFromRow(input, 'storyboard'),
    animatic: referenceFromRow(input, 'animatic'),
    narrationAuthorityDigest: input.narration_authority_digest,
    localCandidateOnly: true,
  })
}

function referenceFromRow(row: Record<string, unknown>, prefix: string) {
  return {
    artifactId: row[`${prefix}_artifact_id`], versionId: row[`${prefix}_version_id`],
    versionNumber: row[`${prefix}_version_number`], contentDigest: row[`${prefix}_content_digest`],
  }
}

async function readCostAuthority(client: SupabaseClient, jobId: string) {
  const bindings = readMany(
    await client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id', jobId),
    estimateBindingSchema,
    'Motion Studio animatic cost bindings',
  )
  if (bindings.length !== 1) throw invalidDatabase('Motion Studio animatic requires one exact render-frame cost item.')
  const item = readRequired(
    await client.from('production_cost_estimate_items')
      .select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,expected_internal_cost_micros,maximum_authorized_internal_cost_micros')
      .eq('id', bindings[0]!.estimate_item_id).single(),
    costItemRowSchema,
    'Motion Studio animatic cost item',
  )
  const card = readRequired(
    await client.from('provider_rate_card_versions')
      .select('id,unit,unit_price_micros,minimum_charge_micros,immutable').eq('id', item.rate_card_version_id).single(),
    rateCardRowSchema,
    'Motion Studio animatic rate card',
  )
  return {
    estimateItemId: item.id,
    capabilityOrToolId: item.capability_or_tool_id,
    rateCardVersionId: item.rate_card_version_id,
    unit: item.unit,
    quantity: item.quantity,
    expectedInternalCostMicros: item.expected_internal_cost_micros,
    maximumAuthorizedInternalCostMicros: item.maximum_authorized_internal_cost_micros,
    unitPriceMicros: card.unit_price_micros,
    minimumChargeMicros: card.minimum_charge_micros,
  }
}

function readMaybe<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T | undefined {
  if (response.error) throw databaseError(label, response.error)
  if (response.data === null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(`${label} returned an invalid record.`, parsed.error.flatten())
  return parsed.data
}

function readMany<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T[] {
  if (response.error) throw databaseError(label, response.error)
  const parsed = z.array(schema).safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(`${label} returned invalid rows.`, parsed.error.flatten())
  return parsed.data
}

function readRequired<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T {
  const value = readMaybe(response, schema, label)
  if (value === undefined) throw invalidDatabase(`${label} returned no record.`)
  return value
}

function databaseError(label: string, error: PostgrestError): ApiError {
  if (error.code === 'P0002') return new ApiError('MOTION_STUDIO_NOT_FOUND', `${label} was not found.`, 404)
  if (error.code === '42501') return new ApiError('WORKSPACE_ACCESS_DENIED', `${label} is not allowed for this actor.`, 403)
  if (error.code === '40001' || error.code === '23505' || error.code === '55P03') return new ApiError('MOTION_STUDIO_CONFLICT', `${label} conflicted with current authority.`, 409)
  if (error.code === '23514' || error.code === '23503' || error.code === '55000') return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', `${label} is blocked by exact authority.`, 409)
  if (error.code === '22023') return new ApiError('VALIDATION_FAILED', `${label} input was rejected.`, 400)
  return invalidDatabase(`${label} persistence failed.`, { databaseCode: error.code })
}

function invalidDatabase(message: string, cause?: unknown): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, undefined, { cause, internal: true })
}
