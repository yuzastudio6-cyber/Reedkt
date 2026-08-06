import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import type { MotionStudioProductionRow } from '../commands/types'
import type {
  MotionStudioRenderArtifactRow,
  MotionStudioRenderAttemptRow,
  MotionStudioRenderBindingRow,
  MotionStudioRenderCostAuthority,
  MotionStudioRenderJobRow,
  MotionStudioRenderLeaseRow,
  MotionStudioRenderRepository,
} from './types'

const uuid = z.string().uuid()
const stableId = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const productionStatus = z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived'])
const productionStage = z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery'])
const productionMode = z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed'])
const layerType = z.enum(['image', 'source_footage', 'generated_video', 'text', 'caption', 'map', 'chart', 'mask', 'audio', 'effect'])
const jobStatus = z.enum(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled'])
const attemptStatus = z.enum(['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown'])

const productionRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  owner_id: uuid, module_id: z.literal('storytelling'),
  module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: productionStatus, current_stage: productionStage,
  workspace_mode: z.enum(['guided', 'studio']), default_production_mode: productionMode,
  user_facing_strategy: z.literal("Director's Hybrid"), record_version: z.number().int().positive(),
  created_at: z.string().min(1), updated_at: z.string().min(1),
}).strict()

export const motionStudioRenderBindingRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid,
  scene_document_artifact_id: uuid, scene_document_version_id: uuid,
  scene_document_version_number: safeInteger.pipe(z.number().positive()),
  scene_document_content_digest: digest, timeline_proposal_id: uuid,
  timeline_proposal_output_digest: digest, job_id: stableId,
  approved_work_item_id: uuid, cost_budget_id: stableId,
  registered_profile_id: z.enum(['motion_studio_scene_preview_v1', 'motion_studio_native_layered_scene_v1']),
  layered_assembly_id: uuid.nullable(), scene_id: stableId,
  semantic_purpose: z.string().min(1).max(240), production_mode: productionMode,
  layer_type: layerType, width: safeInteger, height: safeInteger,
  fps_numerator: z.union([z.literal(24), z.literal(30)]), fps_denominator: z.literal(1),
  duration_frames: safeInteger.pipe(z.number().min(24).max(450)),
  scene_start_frame: safeInteger, scene_end_frame: safeInteger,
  input_digest: digest, created_by: uuid, created_at: z.string().min(1),
}).strict()

const frameEvidenceSchema = z.object({ frame: safeInteger, sha256: digest }).strict()
const artifactRowSchema = z.object({
  id: uuid, binding_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, production_id: uuid, job_id: stableId,
  attempt_id: stableId, private_object_identity_hash: digest, artifact_sha256: digest,
  byte_length: safeInteger, mime_type: z.literal('video/mp4'), codec: z.literal('h264'),
  pixel_format: z.literal('yuv420p'), color_space: z.literal('bt709'),
  width: safeInteger, height: safeInteger,
  fps_numerator: z.union([z.literal(24), z.literal(30)]), fps_denominator: z.literal(1),
  duration_frames: safeInteger, scene_start_frame: safeInteger, scene_end_frame: safeInteger,
  frame_evidence_json: z.array(frameEvidenceSchema).length(3).readonly(),
  runtime_identity_digest: digest, attestation_digest: digest, qa_evidence_digest: digest,
  created_at: z.string().min(1),
}).strict()

const jobRowSchema = z.object({
  id: stableId, production_id: uuid, approved_snapshot_id: uuid,
  approved_work_item_id: uuid, cost_budget_id: stableId,
  work_item_type: stableId, required_worker_class: stableId,
  status: jobStatus, maximum_authorized_internal_cost_micros: safeInteger,
  attempt_count: safeInteger, max_attempts: z.number().int().positive(),
}).strict()
const attemptRowSchema = z.object({
  id: stableId, job_id: stableId, attempt_number: z.number().int().positive(),
  status: attemptStatus, failure_category: stableId.nullable(),
  started_at: z.string().nullable(), completed_at: z.string().nullable(),
}).strict()
const leaseRowSchema = z.object({
  id: uuid, job_id: stableId, attempt_id: stableId,
  credential_hash_sha256: digest, status: z.enum(['active', 'released', 'expired']),
  expires_at: z.string().min(1),
}).strict()
const costItemRowSchema = z.object({
  id: stableId, capability_or_tool_id: z.literal('remotion'),
  rate_card_version_id: stableId, quantity: z.coerce.number().positive().finite(),
  unit: z.literal('render_frame'), expected_internal_cost_micros: safeInteger,
  maximum_authorized_internal_cost_micros: safeInteger,
}).strict()
const rateCardRowSchema = z.object({
  id: stableId, unit: z.literal('render_frame'), unit_price_micros: safeInteger,
  minimum_charge_micros: safeInteger, immutable: z.literal(true),
}).strict()
const estimateBindingSchema = z.object({ estimate_item_id: stableId }).strict()
const completionSchema = z.object({
  completion: z.record(z.string(), z.unknown()),
  artifact: artifactRowSchema,
}).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
export const MOTION_STUDIO_RENDER_BINDING_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,scene_document_artifact_id,scene_document_version_id,scene_document_version_number,scene_document_content_digest,timeline_proposal_id,timeline_proposal_output_digest,job_id,approved_work_item_id,cost_budget_id,registered_profile_id,layered_assembly_id,scene_id,semantic_purpose,production_mode,layer_type,width,height,fps_numerator,fps_denominator,duration_frames,scene_start_frame,scene_end_frame,input_digest,created_by,created_at'
const ARTIFACT_SELECT = 'id,binding_id,workspace_id,project_id,edit_session_id,production_id,job_id,attempt_id,private_object_identity_hash,artifact_sha256,byte_length,mime_type,codec,pixel_format,color_space,width,height,fps_numerator,fps_denominator,duration_frames,scene_start_frame,scene_end_frame,frame_evidence_json,runtime_identity_digest,attestation_digest,qa_evidence_digest,created_at'
const JOB_SELECT = 'id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_type,required_worker_class,status,maximum_authorized_internal_cost_micros,attempt_count,max_attempts'
const ATTEMPT_SELECT = 'id,job_id,attempt_number,status,failure_category,started_at,completed_at'
const LEASE_SELECT = 'id,job_id,attempt_id,credential_hash_sha256,status,expires_at'

export function createSupabaseMotionStudioRenderRepository(client: SupabaseClient): MotionStudioRenderRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(
        await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle(),
        productionRowSchema,
        'Motion Studio production',
      ) as MotionStudioProductionRow | undefined
    },
    async readWorkspaceState(productionId) {
      const bindings = readMany(
        await client.from('motion_studio_render_bindings').select(MOTION_STUDIO_RENDER_BINDING_SELECT)
          .eq('production_id', productionId).order('created_at', { ascending: false }),
        motionStudioRenderBindingRowSchema,
        'Motion Studio preview bindings',
      ) as MotionStudioRenderBindingRow[]
      if (!bindings.length) return { bindings, jobs: new Map(), attempts: new Map(), artifacts: new Map() }
      const jobIds = [...new Set(bindings.map((binding) => binding.job_id))]
      const jobs = readMany(
        await client.from('jobs').select(JOB_SELECT).in('id', jobIds),
        jobRowSchema,
        'Motion Studio preview jobs',
      ) as MotionStudioRenderJobRow[]
      const attempts = readMany(
        await client.from('job_attempts').select(ATTEMPT_SELECT).in('job_id', jobIds)
          .order('attempt_number', { ascending: false }),
        attemptRowSchema,
        'Motion Studio preview attempts',
      ) as MotionStudioRenderAttemptRow[]
      const artifacts = readMany(
        await client.from('motion_studio_render_artifacts').select(ARTIFACT_SELECT)
          .eq('production_id', productionId),
        artifactRowSchema,
        'Motion Studio preview artifacts',
      ) as MotionStudioRenderArtifactRow[]
      const latestAttempts = new Map<string, MotionStudioRenderAttemptRow>()
      for (const attempt of attempts) if (!latestAttempts.has(attempt.job_id)) latestAttempts.set(attempt.job_id, attempt)
      return {
        bindings,
        jobs: new Map(jobs.map((job) => [job.id, job])),
        attempts: latestAttempts,
        artifacts: new Map(artifacts.map((artifact) => [artifact.binding_id, artifact])),
      }
    },
    async createBinding(input) {
      const response = await client.rpc('create_motion_studio_render_binding', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_scene_document_artifact_id: input.sceneDocumentArtifactId,
        target_scene_document_version_id: input.sceneDocumentVersionId,
        target_scene_document_content_digest: input.sceneDocumentContentDigest,
        target_timeline_proposal_id: input.timelineProposalId,
        target_job_id: input.jobId,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, motionStudioRenderBindingRowSchema, 'Motion Studio preview binding') as MotionStudioRenderBindingRow
    },
    async findExecutionAuthority(bindingId, leaseId) {
      const binding = readMaybe(
        await client.from('motion_studio_render_bindings').select(MOTION_STUDIO_RENDER_BINDING_SELECT).eq('id', bindingId).maybeSingle(),
        motionStudioRenderBindingRowSchema,
        'Motion Studio preview binding',
      ) as MotionStudioRenderBindingRow | undefined
      if (!binding) return undefined
      const job = readRequired(
        await client.from('jobs').select(JOB_SELECT).eq('id', binding.job_id).single(),
        jobRowSchema,
        'Motion Studio preview job',
      ) as MotionStudioRenderJobRow
      const lease = readRequired(
        await client.from('worker_leases').select(LEASE_SELECT).eq('id', leaseId).eq('job_id', binding.job_id).single(),
        leaseRowSchema,
        'Motion Studio preview lease',
      ) as MotionStudioRenderLeaseRow
      const attempt = readRequired(
        await client.from('job_attempts').select(ATTEMPT_SELECT).eq('id', lease.attempt_id).eq('job_id', job.id).single(),
        attemptRowSchema,
        'Motion Studio preview attempt',
      ) as MotionStudioRenderAttemptRow
      const cost = await readCostAuthority(client, job.id)
      const artifact = readMaybe(
        await client.from('motion_studio_render_artifacts').select(ARTIFACT_SELECT).eq('binding_id', binding.id).maybeSingle(),
        artifactRowSchema,
        'Motion Studio preview artifact',
      ) as MotionStudioRenderArtifactRow | undefined
      return { binding, job, attempt, lease, cost, ...(artifact ? { artifact } : {}) }
    },
    async completeAttempt(input) {
      const response = await client.rpc('complete_motion_studio_render_attempt', {
        target_binding_id: input.bindingId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_private_object_identity_hash: input.privateObjectIdentityHash,
        target_artifact_sha256: input.artifactSha256,
        target_byte_length: input.byteLength,
        target_frame_evidence_json: input.frameEvidence,
        target_runtime_identity_digest: input.runtimeIdentityDigest,
        target_attestation_digest: input.attestationDigest,
        target_qa_evidence_digest: input.qaEvidenceDigest,
        target_usage_json: input.usage,
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, completionSchema, 'Motion Studio preview completion').artifact as MotionStudioRenderArtifactRow
    },
    async findArtifact(artifactId) {
      return readMaybe(
        await client.from('motion_studio_render_artifacts').select(ARTIFACT_SELECT).eq('id', artifactId).maybeSingle(),
        artifactRowSchema,
        'Motion Studio preview artifact',
      ) as MotionStudioRenderArtifactRow | undefined
    },
  }
}

async function readCostAuthority(client: SupabaseClient, jobId: string): Promise<MotionStudioRenderCostAuthority> {
  const bindings = readMany(
    await client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id', jobId),
    estimateBindingSchema,
    'Motion Studio preview cost bindings',
  )
  const items = bindings.length ? readMany(
    await client.from('production_cost_estimate_items')
      .select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,expected_internal_cost_micros,maximum_authorized_internal_cost_micros')
      .in('id', bindings.map((binding) => binding.estimate_item_id))
      .eq('capability_or_tool_id', 'remotion').eq('unit', 'render_frame'),
    costItemRowSchema,
    'Motion Studio preview cost item',
  ) : []
  if (items.length !== 1) throw invalidDatabase('Motion Studio preview cost authority')
  const item = items[0]
  const rate = readRequired(
    await client.from('provider_rate_card_versions')
      .select('id,unit,unit_price_micros,minimum_charge_micros,immutable')
      .eq('id', item.rate_card_version_id).single(),
    rateCardRowSchema,
    'Motion Studio preview rate card',
  )
  return {
    estimateItemId: item.id,
    capabilityOrToolId: item.capability_or_tool_id,
    rateCardVersionId: item.rate_card_version_id,
    unit: item.unit,
    quantity: item.quantity,
    expectedInternalCostMicros: item.expected_internal_cost_micros,
    maximumAuthorizedInternalCostMicros: item.maximum_authorized_internal_cost_micros,
    unitPriceMicros: rate.unit_price_micros,
    minimumChargeMicros: rate.minimum_charge_micros,
  }
}

function readRequired<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T {
  if (response.error) throw mapDatabaseError(response.error)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}

function readMaybe<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T | undefined {
  if (response.error) throw mapDatabaseError(response.error)
  if (response.data == null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}

function readMany<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T[] {
  if (response.error) throw mapDatabaseError(response.error)
  const parsed = z.array(schema).safeParse(response.data)
  if (!parsed.success) throw invalidDatabase(label, parsed.error.flatten())
  return parsed.data
}

function mapDatabaseError(error: PostgrestError): ApiError {
  if (error.code === '42501') return new ApiError('WORKSPACE_ACCESS_DENIED', error.message, 403)
  if (error.code === 'P0002') return new ApiError('MOTION_STUDIO_NOT_FOUND', error.message, 404)
  if (['23503', '23505', '23514', '40001', '55000'].includes(error.code)) {
    return new ApiError('MOTION_STUDIO_CONFLICT', error.message, 409, { databaseCode: error.code })
  }
  return new ApiError('INTERNAL_ERROR', 'Motion Studio render persistence failed.', 500, undefined, {
    cause: { source: 'postgrest', code: error.code },
    internal: true,
  })
}

function invalidDatabase(label: string, details?: unknown): ApiError {
  return new ApiError('INTERNAL_ERROR', `${label} returned an invalid canonical record.`, 500, undefined, {
    cause: details,
    internal: true,
  })
}
