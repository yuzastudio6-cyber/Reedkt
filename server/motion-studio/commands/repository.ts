import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  motionStudioArtifactApprovalSchema,
  motionStudioArtifactPayloadSchema,
  motionStudioArtifactVersionSchema,
} from '../../../src/lib/motion-studio/contracts'
import type { ArtifactApproval, MotionStudioCommandResult } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioApprovalRow,
  MotionStudioArtifactVersionRow,
  MotionStudioCommandRepository,
  MotionStudioProductionRow,
} from './types'

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

const artifactRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  production_id: z.string().uuid(),
  kind: z.enum(MOTION_STUDIO_ARTIFACT_KINDS),
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
  kind: artifactRowSchema.shape.kind,
  version_number: z.number().int().positive(),
  parent_version_id: z.string().uuid().nullable(),
  state: z.enum(['draft', 'in_review', 'approved', 'locked', 'rejected', 'superseded', 'archived']),
  payload_json: motionStudioArtifactPayloadSchema,
  content_digest: z.string().regex(/^[a-f0-9]{64}$/),
  provenance_json: motionStudioArtifactVersionSchema.shape.provenance,
  immutable: z.literal(true),
  created_at: z.string().min(1),
}).strict()

const approvalRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  edit_session_id: z.string().min(1),
  approved_snapshot_id: z.string().uuid(),
  approved_by: z.string().uuid(),
  approved_at: z.string().min(1),
  motion_studio_production_id: z.string().uuid(),
  motion_studio_artifact_id: z.string().uuid(),
  motion_studio_artifact_version_id: z.string().uuid(),
  motion_studio_artifact_content_digest: z.string().regex(/^[a-f0-9]{64}$/),
  motion_studio_approval_kind: z.enum(['stage_artifact', 'expensive_work', 'picture_lock', 'delivery']),
  approval_digest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

const namedEditRowSchema = z.object({
  id: z.string().min(1),
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  status: z.string().min(1),
}).strict()

const commandResultSchema: z.ZodType<MotionStudioCommandResult> = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('applied'),
    commandId: z.string().min(1),
    newVersionId: z.string().uuid(),
    newVersionDigest: z.string().regex(/^[a-f0-9]{64}$/),
    impact: z.object({
      affectedArtifactVersionIds: z.array(z.string().min(1)),
      invalidatedArtifactVersionIds: z.array(z.string().min(1)),
      affectedSceneIds: z.array(z.string().min(1)),
      affectedJobIds: z.array(z.string().min(1)),
      newEstimateRequired: z.boolean(),
      approvalResetRequired: z.boolean(),
      explanation: z.array(z.string().min(1)),
    }).strict(),
  }).strict(),
  z.object({
    status: z.enum(['conflict', 'locked', 'rejected']),
    commandId: z.string().min(1),
    currentVersionId: z.string().uuid(),
    currentVersionDigest: z.string().regex(/^[a-f0-9]{64}$/),
    conflictPaths: z.array(z.string()),
    message: z.string().min(1),
  }).strict(),
])

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const ARTIFACT_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,kind,current_draft_version_id,current_approved_version_id,record_version,created_at,archived_at'
const VERSION_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,artifact_id,kind,version_number,parent_version_id,state,payload_json,content_digest,provenance_json,immutable,created_at'
const APPROVAL_SELECT = 'id,workspace_id,project_id,edit_session_id,approved_snapshot_id,approved_by,approved_at,motion_studio_production_id,motion_studio_artifact_id,motion_studio_artifact_version_id,motion_studio_artifact_content_digest,motion_studio_approval_kind,approval_digest'

export function createSupabaseMotionStudioCommandRepository(client: SupabaseClient): MotionStudioCommandRepository {
  return {
    async findNamedEdit(projectId, editSessionId) {
      const response = await client.from('edit_sessions').select('id,workspace_id,project_id,owner_id,status')
        .eq('project_id', projectId).eq('id', editSessionId).maybeSingle()
      return parseMaybe(response, namedEditRowSchema, 'Named edit')
    },
    async findProductionForNamedEdit(projectId, editSessionId) {
      const response = await client.from('motion_studio_productions').select(PRODUCTION_SELECT)
        .eq('project_id', projectId).eq('edit_session_id', editSessionId).maybeSingle()
      return parseMaybe(response, productionRowSchema, 'Motion Studio production')
    },
    async findProduction(productionId) {
      const response = await client.from('motion_studio_productions').select(PRODUCTION_SELECT)
        .eq('id', productionId).maybeSingle()
      return parseMaybe(response, productionRowSchema, 'Motion Studio production')
    },
    async createProduction(editSessionId, actorUserId, request, idempotencyKey, requestHash) {
      const response = await client.rpc('create_motion_studio_module_production', {
        target_edit_session_id: editSessionId,
        target_actor_user_id: actorUserId,
        target_module_id: request.moduleId,
        target_module_catalog_version: request.moduleCatalogVersion,
        target_idempotency_key: idempotencyKey,
        target_request_hash: requestHash,
      })
      const schema = z.object({ productionId: z.string().uuid() }).passthrough()
      return parseRequired(response, schema, 'Motion Studio production creation')
    },
    async findArtifact(productionId, artifactId) {
      const response = await client.from('motion_studio_artifacts').select(ARTIFACT_SELECT)
        .eq('production_id', productionId).eq('id', artifactId).maybeSingle()
      return parseMaybe(response, artifactRowSchema, 'Motion Studio artifact')
    },
    async findArtifactsByKind(productionId, kind) {
      const response = await client.from('motion_studio_artifacts').select(ARTIFACT_SELECT)
        .eq('production_id', productionId).eq('kind', kind).is('archived_at', null)
        .order('created_at', { ascending: true }).limit(2)
      if (response.error) throw mapDatabaseError(response.error, 'Motion Studio artifact-kind read')
      const parsed = z.array(artifactRowSchema).safeParse(response.data)
      if (!parsed.success) throw invalidDatabaseResponse('Motion Studio artifacts by kind')
      return parsed.data
    },
    async findArtifactVersion(productionId, artifactId, versionId) {
      const response = await client.from('motion_studio_artifact_versions').select(VERSION_SELECT)
        .eq('production_id', productionId).eq('artifact_id', artifactId).eq('id', versionId).maybeSingle()
      return parseMaybe(response, artifactVersionRowSchema, 'Motion Studio artifact version')
    },
    async findArtifactVersions(productionId, artifactId, versionIds) {
      if (versionIds.length === 0) return []
      const response = await client.from('motion_studio_artifact_versions').select(VERSION_SELECT)
        .eq('production_id', productionId).eq('artifact_id', artifactId).in('id', [...versionIds])
      if (response.error) throw mapDatabaseError(response.error, 'Motion Studio artifact version read')
      const parsed = z.array(artifactVersionRowSchema).safeParse(response.data)
      if (!parsed.success) throw invalidDatabaseResponse('Motion Studio artifact versions')
      return parsed.data
    },
    async findLatestApproval(productionId, artifactId) {
      const response = await client.from('approval_records').select(APPROVAL_SELECT)
        .eq('approval_type', 'motion_studio_artifact')
        .eq('motion_studio_production_id', productionId)
        .eq('motion_studio_artifact_id', artifactId)
        .order('approved_at', { ascending: false }).limit(1).maybeSingle()
      return parseMaybe(response, approvalRowSchema, 'Motion Studio approval')
    },
    async createInitialArtifactVersion(input) {
      const response = await client.rpc('create_motion_studio_artifact_version', {
        target_production_id: input.productionId,
        target_artifact_id: null,
        target_kind: input.request.kind,
        target_expected_current_draft_version_id: null,
        target_parent_version_id: null,
        target_state: input.request.state,
        target_payload_json: input.request.payload,
        target_provenance_json: input.provenance,
        target_dependencies_json: input.request.dependencies,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      const schema = z.object({ artifactId: z.string().uuid(), artifactVersionId: z.string().uuid() }).passthrough()
      return parseRequired(response, schema, 'Motion Studio artifact creation')
    },
    async applyCommand(input) {
      const response = await client.rpc('apply_motion_studio_command', {
        target_command_id: input.commandId,
        target_production_id: input.production.id,
        target_artifact_id: input.artifact.id,
        target_base_version_id: input.request.baseVersionId,
        target_base_version_digest: input.request.baseVersionDigest,
        target_operations_json: input.compiled.operations,
        target_result_payload_json: input.compiled.payload,
        target_result_provenance_json: input.compiled.provenance,
        target_result_state: input.compiled.state,
        target_reason: input.request.reason,
        target_actor_type: input.actor.actorKind,
        target_actor_id: input.actor.actorId,
        target_actor_user_id: input.actorUserId,
        target_created_at: input.createdAt,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
        target_request_id: input.requestId,
      })
      return parseRequired(response, commandResultSchema, 'Motion Studio command')
    },
    async approveArtifact(input) {
      const response = await client.rpc('approve_motion_studio_artifact_version', {
        target_production_id: input.productionId,
        target_artifact_id: input.artifactId,
        target_artifact_version_id: input.request.artifactVersionId,
        target_artifact_content_digest: input.request.artifactContentDigest,
        target_approved_snapshot_id: input.request.approvedSnapshotId,
        target_approval_kind: input.request.approvalKind,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
        target_request_id: input.requestId,
      })
      return parseRequired(response, motionStudioArtifactApprovalSchema, 'Motion Studio approval') as ArtifactApproval
    },
  }
}

export function mapMotionStudioProductionRow(row: MotionStudioProductionRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    moduleId: row.module_id,
    moduleCatalogVersion: row.module_catalog_version,
    stageProfileId: row.stage_profile_id,
    status: row.status,
    currentStage: row.current_stage,
    workspaceMode: row.workspace_mode,
    defaultProductionMode: row.default_production_mode,
    userFacingStrategy: row.user_facing_strategy,
    recordVersion: row.record_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    localCandidateOnly: true as const,
  }
}

export function mapMotionStudioArtifactVersionRow(row: MotionStudioArtifactVersionRow) {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    productionId: row.production_id,
    kind: row.kind,
    versionNumber: row.version_number,
    ...(row.parent_version_id ? { parentVersionId: row.parent_version_id } : {}),
    state: row.state,
    payload: row.payload_json,
    contentDigest: row.content_digest,
    immutable: true as const,
    provenance: row.provenance_json,
    createdAt: row.created_at,
  }
}

export function mapMotionStudioApprovalRow(row: MotionStudioApprovalRow): ArtifactApproval {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    productionId: row.motion_studio_production_id,
    artifactId: row.motion_studio_artifact_id,
    artifactVersion: {
      artifactId: row.motion_studio_artifact_id,
      versionId: row.motion_studio_artifact_version_id,
      versionNumber: 1,
      contentDigest: row.motion_studio_artifact_content_digest,
    },
    approvedSnapshotId: row.approved_snapshot_id,
    approvalKind: row.motion_studio_approval_kind,
    approvedBy: { actorKind: 'user', actorId: row.approved_by },
    approvalDigest: row.approval_digest,
    immutable: true,
    createdAt: row.approved_at,
  }
}

function parseMaybe<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T | undefined {
  if (response.error) throw mapDatabaseError(response.error, `${label} read`)
  if (response.data === null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function parseRequired<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T {
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
  return new ApiError('INTERNAL_ERROR', `${operation} failed.`, 500, undefined, {
    cause: { source: 'postgrest', code: error.code },
    internal: true,
  })
}
