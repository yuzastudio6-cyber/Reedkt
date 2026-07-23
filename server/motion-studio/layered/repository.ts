import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { motionStudioLayerManifestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioProductionRow } from '../commands/types'
import {
  motionStudioRenderBindingRowSchema,
} from '../render/repository'
import type {
  MotionStudioRenderAttemptRow,
  MotionStudioRenderJobRow,
  MotionStudioRenderLeaseRow,
} from '../render/types'
import type {
  MotionStudioLayeredAssemblyRow,
  MotionStudioLayeredCutoutArtifactRow,
  MotionStudioLayeredCutoutCostAuthority,
  MotionStudioLayeredRepository,
} from './types'

const uuid = z.string().uuid()
const stableId = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const jobStatus = z.enum(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled'])
const attemptStatus = z.enum(['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown'])

const productionRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId, owner_id: uuid,
  module_id: z.literal('storytelling'), module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived']),
  current_stage: z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery']),
  workspace_mode: z.enum(['guided', 'studio']),
  default_production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"), record_version: z.number().int().positive(),
  created_at: z.string().min(1), updated_at: z.string().min(1),
}).strict()

export const motionStudioLayeredAssemblyRowSchema = z.object({
  id: uuid, workspace_id: uuid, project_id: uuid, edit_session_id: stableId,
  production_id: uuid, approved_snapshot_id: uuid,
  scene_document_artifact_id: uuid, scene_document_version_id: uuid,
  scene_document_version_number: z.coerce.number().int().positive(),
  scene_document_content_digest: digest, timeline_proposal_id: uuid,
  timeline_proposal_output_digest: digest, cutout_job_id: stableId,
  cutout_approved_work_item_id: uuid, render_job_id: stableId,
  render_approved_work_item_id: uuid, cost_budget_id: stableId, scene_id: stableId,
  semantic_purpose: z.string().min(1).max(120),
  production_mode: z.enum(['layered_first', 'hybrid_directed']),
  source_layer_type: z.enum(['image', 'mask']), width: safeInteger, height: safeInteger,
  fps_numerator: z.union([z.literal(24), z.literal(30)]), fps_denominator: z.literal(1),
  duration_frames: safeInteger.pipe(z.number().min(24).max(450)),
  scene_start_frame: safeInteger, scene_end_frame: safeInteger,
  asset_preparation_profile_id: z.literal('motion_studio_rembg_subject_fixture_v1'),
  registered_profile_id: z.literal('motion_studio_native_layered_scene_v1'),
  layer_manifest_json: motionStudioLayerManifestV1Schema, layer_manifest_digest: digest,
  input_digest: digest, fixture_only: z.literal(true),
  production_license_review_required: z.literal(true), created_by: uuid,
  created_at: z.string().min(1),
}).strict()

export const motionStudioLayeredCutoutArtifactRowSchema = z.object({
  id: uuid, assembly_id: uuid, workspace_id: uuid, project_id: uuid,
  edit_session_id: stableId, production_id: uuid, job_id: stableId, attempt_id: stableId,
  private_object_identity_hash: digest, artifact_sha256: digest, byte_length: safeInteger,
  mime_type: z.literal('image/png'), width: z.literal(128), height: z.literal(128),
  alpha_minimum: z.literal(0), alpha_maximum: z.literal(255),
  alpha_unique_value_count: z.literal(160), foreground_alpha_mean: z.coerce.number().refine((v) => v === 226.802912),
  background_alpha_mean: z.coerce.number().refine((v) => v === 2.492606),
  subject_coverage_verified: z.literal(true), package_name: z.literal('rembg'),
  package_version: z.literal('2.0.76'), onnx_runtime_version: z.literal('1.27.0'),
  model_id: z.literal('u2netp'), model_sha256: digest, model_byte_length: z.coerce.number().pipe(z.literal(4574861)),
  runtime_identity_digest: digest, attestation_digest: digest, qa_evidence_digest: digest,
  execution_duration_milliseconds: z.coerce.number().int().positive().max(300000),
  cpu_quantity: z.coerce.number().positive().max(300), fixture_only: z.literal(true),
  production_license_review_required: z.literal(true), created_at: z.string().min(1),
}).strict()

const jobRowSchema = z.object({
  id: stableId, production_id: uuid, approved_snapshot_id: uuid,
  approved_work_item_id: uuid, cost_budget_id: stableId, work_item_type: stableId,
  required_worker_class: stableId, status: jobStatus,
  maximum_authorized_internal_cost_micros: safeInteger,
  attempt_count: safeInteger, max_attempts: z.number().int().positive(),
}).strict()
const attemptRowSchema = z.object({
  id: stableId, job_id: stableId, attempt_number: z.number().int().positive(),
  status: attemptStatus, failure_category: stableId.nullable(),
  started_at: z.string().nullable(), completed_at: z.string().nullable(),
}).strict()
const leaseRowSchema = z.object({
  id: uuid, job_id: stableId, attempt_id: stableId, credential_hash_sha256: digest,
  status: z.enum(['active', 'released', 'expired']), expires_at: z.string().min(1),
}).strict()
const costItemRowSchema = z.object({
  id: stableId, capability_or_tool_id: z.literal('rembg'), rate_card_version_id: stableId,
  quantity: z.coerce.number().positive().max(300), unit: z.literal('cpu_second'),
  maximum_authorized_internal_cost_micros: safeInteger,
}).strict()
const rateCardRowSchema = z.object({
  id: stableId, unit: z.literal('cpu_second'), unit_price_micros: safeInteger,
  minimum_charge_micros: safeInteger, immutable: z.literal(true),
}).strict()
const completionSchema = z.object({
  completion: z.record(z.string(), z.unknown()), artifact: motionStudioLayeredCutoutArtifactRowSchema,
}).strict()
const assemblyResponseSchema = z.object({
  assembly: motionStudioLayeredAssemblyRowSchema,
  binding: motionStudioRenderBindingRowSchema,
}).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
export const MOTION_STUDIO_LAYERED_ASSEMBLY_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,scene_document_artifact_id,scene_document_version_id,scene_document_version_number,scene_document_content_digest,timeline_proposal_id,timeline_proposal_output_digest,cutout_job_id,cutout_approved_work_item_id,render_job_id,render_approved_work_item_id,cost_budget_id,scene_id,semantic_purpose,production_mode,source_layer_type,width,height,fps_numerator,fps_denominator,duration_frames,scene_start_frame,scene_end_frame,asset_preparation_profile_id,registered_profile_id,layer_manifest_json,layer_manifest_digest,input_digest,fixture_only,production_license_review_required,created_by,created_at'
export const MOTION_STUDIO_LAYERED_CUTOUT_SELECT = 'id,assembly_id,workspace_id,project_id,edit_session_id,production_id,job_id,attempt_id,private_object_identity_hash,artifact_sha256,byte_length,mime_type,width,height,alpha_minimum,alpha_maximum,alpha_unique_value_count,foreground_alpha_mean,background_alpha_mean,subject_coverage_verified,package_name,package_version,onnx_runtime_version,model_id,model_sha256,model_byte_length,runtime_identity_digest,attestation_digest,qa_evidence_digest,execution_duration_milliseconds,cpu_quantity,fixture_only,production_license_review_required,created_at'
const JOB_SELECT = 'id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_type,required_worker_class,status,maximum_authorized_internal_cost_micros,attempt_count,max_attempts'
const ATTEMPT_SELECT = 'id,job_id,attempt_number,status,failure_category,started_at,completed_at'
const LEASE_SELECT = 'id,job_id,attempt_id,credential_hash_sha256,status,expires_at'

export function createSupabaseMotionStudioLayeredRepository(client: SupabaseClient): MotionStudioLayeredRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle(), productionRowSchema, 'Motion Studio production') as MotionStudioProductionRow | undefined
    },
    async listAssemblies(productionId) {
      return readMany(await client.from('motion_studio_layered_assemblies').select(MOTION_STUDIO_LAYERED_ASSEMBLY_SELECT).eq('production_id', productionId).order('created_at', { ascending: false }), motionStudioLayeredAssemblyRowSchema, 'Motion Studio layered assemblies') as MotionStudioLayeredAssemblyRow[]
    },
    async listCutoutArtifacts(productionId) {
      return readMany(await client.from('motion_studio_layered_cutout_artifacts').select(MOTION_STUDIO_LAYERED_CUTOUT_SELECT).eq('production_id', productionId), motionStudioLayeredCutoutArtifactRowSchema, 'Motion Studio layered cutouts') as MotionStudioLayeredCutoutArtifactRow[]
    },
    async findAssembly(assemblyId) {
      return readMaybe(
        await client.from('motion_studio_layered_assemblies').select(MOTION_STUDIO_LAYERED_ASSEMBLY_SELECT).eq('id', assemblyId).maybeSingle(),
        motionStudioLayeredAssemblyRowSchema,
        'Motion Studio layered assembly',
      ) as MotionStudioLayeredAssemblyRow | undefined
    },
    async findCutoutForAssembly(assemblyId) {
      return readMaybe(
        await client.from('motion_studio_layered_cutout_artifacts').select(MOTION_STUDIO_LAYERED_CUTOUT_SELECT).eq('assembly_id', assemblyId).maybeSingle(),
        motionStudioLayeredCutoutArtifactRowSchema,
        'Motion Studio layered cutout artifact',
      ) as MotionStudioLayeredCutoutArtifactRow | undefined
    },
    async createAssembly(input) {
      return readRequired(await client.rpc('create_motion_studio_layered_assembly', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_scene_document_artifact_id: input.sceneDocumentArtifactId,
        target_scene_document_version_id: input.sceneDocumentVersionId,
        target_scene_document_content_digest: input.sceneDocumentContentDigest,
        target_timeline_proposal_id: input.timelineProposalId,
        target_cutout_job_id: input.cutoutJobId,
        target_render_job_id: input.renderJobId,
        target_layer_manifest_json: input.layerManifest,
        target_layer_manifest_digest: input.layerManifestDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }), assemblyResponseSchema, 'Motion Studio layered assembly')
    },
    async findCutoutExecutionAuthority(assemblyId, leaseId) {
      const assembly = readMaybe(await client.from('motion_studio_layered_assemblies').select(MOTION_STUDIO_LAYERED_ASSEMBLY_SELECT).eq('id', assemblyId).maybeSingle(), motionStudioLayeredAssemblyRowSchema, 'Motion Studio layered assembly') as MotionStudioLayeredAssemblyRow | undefined
      if (!assembly) return undefined
      const job = readRequired(await client.from('jobs').select(JOB_SELECT).eq('id', assembly.cutout_job_id).single(), jobRowSchema, 'Motion Studio layered cutout job') as MotionStudioRenderJobRow
      const lease = readRequired(await client.from('worker_leases').select(LEASE_SELECT).eq('id', leaseId).eq('job_id', job.id).single(), leaseRowSchema, 'Motion Studio layered cutout lease') as MotionStudioRenderLeaseRow
      const attempt = readRequired(await client.from('job_attempts').select(ATTEMPT_SELECT).eq('id', lease.attempt_id).eq('job_id', job.id).single(), attemptRowSchema, 'Motion Studio layered cutout attempt') as MotionStudioRenderAttemptRow
      const cost = await readCutoutCostAuthority(client, job.id)
      const artifact = readMaybe(await client.from('motion_studio_layered_cutout_artifacts').select(MOTION_STUDIO_LAYERED_CUTOUT_SELECT).eq('assembly_id', assembly.id).maybeSingle(), motionStudioLayeredCutoutArtifactRowSchema, 'Motion Studio layered cutout artifact') as MotionStudioLayeredCutoutArtifactRow | undefined
      return { assembly, job, attempt, lease, cost, ...(artifact ? { artifact } : {}) }
    },
    async completeCutout(input) {
      const response = await client.rpc('complete_motion_studio_layered_cutout_attempt', {
        target_assembly_id: input.assemblyId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_private_object_identity_hash: input.privateObjectIdentityHash,
        target_artifact_sha256: input.artifactSha256,
        target_byte_length: input.byteLength,
        target_runtime_identity_digest: input.runtimeIdentityDigest,
        target_attestation_digest: input.attestationDigest,
        target_qa_evidence_digest: input.qaEvidenceDigest,
        target_execution_duration_milliseconds: input.executionDurationMilliseconds,
        target_usage_json: input.usage,
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, completionSchema, 'Motion Studio layered cutout completion').artifact as MotionStudioLayeredCutoutArtifactRow
    },
    async findCutoutArtifact(artifactId) {
      return readMaybe(await client.from('motion_studio_layered_cutout_artifacts').select(MOTION_STUDIO_LAYERED_CUTOUT_SELECT).eq('id', artifactId).maybeSingle(), motionStudioLayeredCutoutArtifactRowSchema, 'Motion Studio layered cutout artifact') as MotionStudioLayeredCutoutArtifactRow | undefined
    },
  }
}

async function readCutoutCostAuthority(client: SupabaseClient, jobId: string): Promise<MotionStudioLayeredCutoutCostAuthority> {
  const bindings = readMany(await client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id', jobId), z.object({ estimate_item_id: stableId }).strict(), 'Motion Studio cutout cost bindings')
  const items = bindings.length ? readMany(await client.from('production_cost_estimate_items').select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,maximum_authorized_internal_cost_micros').in('id', bindings.map((item) => item.estimate_item_id)).eq('capability_or_tool_id', 'rembg').eq('unit', 'cpu_second'), costItemRowSchema, 'Motion Studio cutout cost item') : []
  if (items.length !== 1) throw invalidDatabase('Motion Studio cutout cost authority')
  const item = items[0]!
  const rate = readRequired(await client.from('provider_rate_card_versions').select('id,unit,unit_price_micros,minimum_charge_micros,immutable').eq('id', item.rate_card_version_id).single(), rateCardRowSchema, 'Motion Studio cutout rate card')
  return {
    estimateItemId: item.id, capabilityOrToolId: 'rembg', rateCardVersionId: item.rate_card_version_id,
    unit: 'cpu_second', quantity: item.quantity,
    maximumAuthorizedInternalCostMicros: item.maximum_authorized_internal_cost_micros,
    unitPriceMicros: rate.unit_price_micros, minimumChargeMicros: rate.minimum_charge_micros,
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
  if (['23503', '23505', '23514', '40001', '55000'].includes(error.code)) return new ApiError('MOTION_STUDIO_CONFLICT', error.message, 409, { databaseCode: error.code })
  return new ApiError('INTERNAL_ERROR', 'Motion Studio layered persistence failed.', 500, undefined, { cause: { source: 'postgrest', code: error.code }, internal: true })
}
function invalidDatabase(label: string, details?: unknown): ApiError {
  return new ApiError('INTERNAL_ERROR', `${label} returned an invalid canonical record.`, 500, undefined, { cause: details, internal: true })
}
