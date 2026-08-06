import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  motionStudioArtifactPayloadSchema,
  motionStudioArtifactVersionSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioArtifactVersionRow, MotionStudioProductionRow } from '../commands/types'
import type {
  MotionStudioApprovedSnapshotRow,
  MotionStudioRecipeInstantiationRow,
  MotionStudioRecipeVersionRow,
  MotionStudioSceneRepository,
  MotionStudioTimelineProposalRow,
} from './types'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const productionRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  owner_id: z.string().uuid(),
  module_id: z.literal('storytelling'),
  module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived']),
  current_stage: z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery']),
  workspace_mode: z.enum(['guided', 'studio']),
  default_production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"),
  record_version: z.number().int().positive(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
}).strict()

const artifactKind = z.enum(MOTION_STUDIO_ARTIFACT_KINDS)

const artifactRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  production_id: z.string().uuid(),
  kind: artifactKind,
  current_draft_version_id: z.string().uuid().nullable(),
  current_approved_version_id: z.string().uuid().nullable(),
  record_version: z.number().int().positive(),
  created_at: z.string().min(1),
  archived_at: z.string().nullable(),
}).strict()

const artifactVersionRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  production_id: z.string().uuid(),
  artifact_id: z.string().uuid(),
  kind: artifactKind,
  version_number: z.number().int().positive(),
  parent_version_id: z.string().uuid().nullable(),
  state: z.enum(['draft', 'in_review', 'approved', 'locked', 'rejected', 'superseded', 'archived']),
  payload_json: motionStudioArtifactPayloadSchema,
  content_digest: digest,
  provenance_json: motionStudioArtifactVersionSchema.shape.provenance,
  immutable: z.literal(true),
  created_at: z.string().min(1),
}).strict()

const snapshotRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  snapshot_json: z.record(z.string(), z.unknown()),
  snapshot_digest: digest,
  approved_at: z.string().min(1),
}).strict()

const recipeVersionRowSchema = z.object({
  id: z.string().uuid(),
  production_id: z.string().uuid(),
  recipe_artifact_id: z.string().uuid(),
  artifact_version_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  definition_version: z.string().min(1),
  definition_digest: digest,
  definition_json: z.record(z.string(), z.unknown()),
  compiler_id: z.string().min(1),
  compiler_version: z.string().min(1),
  compiler_fingerprint: digest,
  created_at: z.string().min(1),
}).strict()

const instantiationRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  production_id: z.string().uuid(),
  scene_id: z.string().min(1),
  scene_document_artifact_id: z.string().uuid(),
  scene_document_version_id: z.string().uuid(),
  scene_document_digest: digest,
  recipe_version_id: z.string().uuid(),
  recipe_definition_version: z.string().min(1),
  recipe_definition_digest: digest,
  recipe_semantic_digest: digest,
  recipe_input_digest: digest,
  motion_language_artifact_id: z.string().uuid(),
  motion_language_version_id: z.string().uuid(),
  motion_language_digest: digest,
  motion_language_semantic_digest: digest,
  narrative_function_artifact_id: z.string().uuid(),
  narrative_function_version_id: z.string().uuid(),
  narrative_function_digest: digest,
  narrative_function_semantic_digest: digest,
  production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  input_artifact_digests: z.array(digest),
  output_binding_ids: z.array(z.string().min(1)),
  approval_status: z.literal('approved'),
  immutable: z.literal(true),
  created_at: z.string().min(1),
}).strict()

const timelineRangeSchema = z.object({
  startSeconds: z.number().finite().nonnegative(),
  endSeconds: z.number().finite().positive(),
  startFrame: z.number().int().nonnegative().optional(),
  endFrame: z.number().int().positive().optional(),
}).strict()
const timelineLayerSchema = z.object({
  id: z.string().min(1),
  layerType: z.string().min(1),
  timelineRange: timelineRangeSchema,
  artifactIds: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
}).strict()
const proposalOperationSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('upsert_layer'),
  targetCollection: z.enum(['audioLayers', 'captionLayers', 'overlayLayers', 'maskLayers']),
  layer: timelineLayerSchema,
}).strict()

const proposalRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  production_id: z.string().uuid(),
  approved_snapshot_id: z.string().uuid(),
  source_scene_document_artifact_id: z.string().uuid(),
  source_scene_document_version_id: z.string().uuid(),
  source_scene_document_version_number: z.number().int().positive(),
  source_scene_document_digest: digest,
  target_timeline_manifest_id: z.string().min(1),
  timing_authority_digest: digest,
  compiler_id: z.literal('motion-studio-scene-compiler'),
  compiler_version: z.string().min(1),
  input_digest: digest,
  output_digest: digest,
  operations_json: z.array(proposalOperationSchema),
  warnings_json: z.array(z.string()),
  status: z.literal('proposed'),
  created_by: z.string().uuid(),
  created_at: z.string().min(1),
}).strict()

const sceneDraftReceiptSchema = z.object({
  sceneId: z.string().min(1),
  sceneGraph: versionReferenceSchema(),
  layerPlan: versionReferenceSchema(),
  sceneRecipe: versionReferenceSchema(),
  sceneDocument: versionReferenceSchema(),
  recipeInstantiationId: z.string().uuid(),
  localCandidateOnly: z.literal(true),
}).strict()

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const ARTIFACT_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,kind,current_draft_version_id,current_approved_version_id,record_version,created_at,archived_at'
const VERSION_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,artifact_id,kind,version_number,parent_version_id,state,payload_json,content_digest,provenance_json,immutable,created_at'
const PROPOSAL_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,source_scene_document_artifact_id,source_scene_document_version_id,source_scene_document_version_number,source_scene_document_digest,target_timeline_manifest_id,timing_authority_digest,compiler_id,compiler_version,input_digest,output_digest,operations_json,warnings_json,status,created_by,created_at'
const INSTANTIATION_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,scene_id,scene_document_artifact_id,scene_document_version_id,scene_document_digest,recipe_version_id,recipe_definition_version,recipe_definition_digest,recipe_semantic_digest,recipe_input_digest,motion_language_artifact_id,motion_language_version_id,motion_language_digest,motion_language_semantic_digest,narrative_function_artifact_id,narrative_function_version_id,narrative_function_digest,narrative_function_semantic_digest,production_mode,input_artifact_digests,output_binding_ids,approval_status,immutable,created_at'

export function createSupabaseMotionStudioSceneRepository(client: SupabaseClient): MotionStudioSceneRepository {
  return {
    async findProduction(productionId) {
      const response = await client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle()
      return parseMaybe(response, productionRowSchema, 'Motion Studio production') as MotionStudioProductionRow | undefined
    },
    async findSnapshot(production, snapshotId) {
      const response = await client.from('approved_plan_snapshots')
        .select('id,workspace_id,project_id,edit_session_id,snapshot_json,snapshot_digest,approved_at')
        .eq('id', snapshotId)
        .eq('workspace_id', production.workspace_id)
        .eq('project_id', production.project_id)
        .eq('edit_session_id', production.edit_session_id)
        .maybeSingle()
      return parseMaybe(response, snapshotRowSchema, 'Approved snapshot') as MotionStudioApprovedSnapshotRow | undefined
    },
    async findLatestSnapshot(production) {
      const response = await client.from('approved_plan_snapshots')
        .select('id,workspace_id,project_id,edit_session_id,snapshot_json,snapshot_digest,approved_at')
        .eq('workspace_id', production.workspace_id)
        .eq('project_id', production.project_id)
        .eq('edit_session_id', production.edit_session_id)
        .order('approved_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return parseMaybe(response, snapshotRowSchema, 'Latest approved snapshot') as MotionStudioApprovedSnapshotRow | undefined
    },
    async findArtifactVersion(productionId, versionId) {
      const response = await client.from('motion_studio_artifact_versions').select(VERSION_SELECT)
        .eq('production_id', productionId).eq('id', versionId).maybeSingle()
      return parseMaybe(response, artifactVersionRowSchema, 'Motion Studio artifact version') as MotionStudioArtifactVersionRow | undefined
    },
    async findRecipeVersions(productionId, versionIds) {
      if (!versionIds.length) return []
      const response = await client.from('motion_studio_scene_recipe_versions')
        .select('id,production_id,recipe_artifact_id,artifact_version_id,version_number,definition_version,definition_digest,definition_json,compiler_id,compiler_version,compiler_fingerprint,created_at')
        .eq('production_id', productionId).in('id', [...versionIds])
      return parseArray(response, recipeVersionRowSchema, 'Scene Recipe versions') as MotionStudioRecipeVersionRow[]
    },
    async findRecipeInstantiations(productionId, ids) {
      if (!ids.length) return []
      const response = await client.from('motion_studio_recipe_instantiations').select(INSTANTIATION_SELECT)
        .eq('production_id', productionId).in('id', [...ids])
      return parseArray(response, instantiationRowSchema, 'Scene Recipe instantiations') as MotionStudioRecipeInstantiationRow[]
    },
    async listArtifacts(productionId, kinds) {
      if (!kinds.length) return []
      const response = await client.from('motion_studio_artifacts').select(ARTIFACT_SELECT)
        .eq('production_id', productionId).in('kind', [...kinds]).is('archived_at', null)
        .order('created_at', { ascending: true })
      return parseArray(response, artifactRowSchema, 'Motion Studio scene artifacts')
    },
    async findArtifactVersions(productionId, versionIds) {
      if (!versionIds.length) return []
      const response = await client.from('motion_studio_artifact_versions').select(VERSION_SELECT)
        .eq('production_id', productionId).in('id', [...versionIds])
      return parseArray(response, artifactVersionRowSchema, 'Motion Studio scene artifact versions') as MotionStudioArtifactVersionRow[]
    },
    async listTimelineProposals(productionId) {
      const response = await client.from('motion_studio_timeline_proposals').select(PROPOSAL_SELECT)
        .eq('production_id', productionId).order('created_at', { ascending: false }).limit(50)
      return parseArray(response, proposalRowSchema, 'Motion Studio timeline proposals') as MotionStudioTimelineProposalRow[]
    },
    async createSceneDraft(input) {
      const response = await client.rpc('create_motion_studio_scene_draft', {
        target_production_id: input.production.id,
        target_approved_snapshot_id: input.request.approvedSnapshotId,
        target_graph_payload_json: input.graphPayload,
        target_layer_plan_payload_json: input.layerPlanPayload,
        target_recipe_payload_json: input.recipePayload,
        target_scene_document_payload_json: input.sceneDocumentPayload,
        target_instantiation_id: input.instantiationId,
        target_motion_language_version_id: input.motionLanguageVersion.id,
        target_narrative_function_version_id: input.narrativeFunctionVersion.id,
        target_actor_user_id: input.actorUserId,
        target_created_at: input.createdAt,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return parseRequired(response, sceneDraftReceiptSchema, 'Motion Studio scene draft creation')
    },
    async persistTimelineProposal(input) {
      const response = await client.rpc('create_motion_studio_timeline_proposal', {
        target_production_id: input.production.id,
        target_approved_snapshot_id: input.request.approvedSnapshotId,
        target_scene_document_artifact_id: input.sourceVersion.artifact_id,
        target_scene_document_version_id: input.sourceVersion.id,
        target_scene_document_digest: input.sourceVersion.content_digest,
        target_timeline_manifest_id: input.request.targetTimelineManifestId,
        target_timing_authority_digest: input.timingAuthorityDigest,
        target_compiler_version: input.compilerVersion,
        target_input_digest: input.inputDigest,
        target_output_digest: input.outputDigest,
        target_operations_json: input.operations,
        target_warnings_json: input.warnings,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return parseRequired(response, proposalRowSchema, 'Motion Studio timeline proposal') as MotionStudioTimelineProposalRow
    },
  }
}

function versionReferenceSchema() {
  return z.object({
    artifactId: z.string().uuid(),
    versionId: z.string().uuid(),
    versionNumber: z.number().int().positive(),
    contentDigest: digest,
  }).strict()
}

function parseMaybe<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T | undefined {
  if (response.error) throw mapDatabaseError(response.error, `${label} read`)
  if (response.data === null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function parseArray<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T[] {
  if (response.error) throw mapDatabaseError(response.error, `${label} read`)
  const parsed = z.array(schema).safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function parseRequired<T>(response: { data: unknown; error: PostgrestError | null }, schema: z.ZodType<T>, label: string): T {
  if (response.error) throw mapDatabaseError(response.error, label)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function invalidDatabaseResponse(label: string): ApiError {
  return new ApiError('INTERNAL_ERROR', `${label} returned an invalid server record.`, 500, undefined, { internal: true })
}

function mapDatabaseError(error: PostgrestError, operation: string): ApiError {
  if (error.code === 'P0002') return new ApiError('MOTION_STUDIO_NOT_FOUND', `${operation} target was not found.`, 404)
  if (error.code === '42501') return new ApiError('WORKSPACE_ACCESS_DENIED', `${operation} is not allowed for this actor.`, 403)
  if (error.code === '40001' || error.code === '23505') return new ApiError('MOTION_STUDIO_CONFLICT', `${operation} conflicted with current authority.`, 409)
  if (error.code === '23514' || error.code === '23503' || error.code === '55000') return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', `${operation} is blocked by an exact authority requirement.`, 409)
  if (error.code === '22023') return new ApiError('VALIDATION_FAILED', `${operation} input was rejected.`, 400)
  return new ApiError('INTERNAL_ERROR', `${operation} failed.`, 500, undefined, { cause: { source: 'postgrest', code: error.code }, internal: true })
}
