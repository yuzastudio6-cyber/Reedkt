import type {
  ArtifactApproval,
  ApplyMotionStudioCommandRequest,
  ApproveMotionStudioArtifactVersionRequest,
  CreateMotionStudioArtifactVersionRequest,
  CreateMotionStudioProductionRequest,
  MotionStudioActorReference,
  MotionStudioArtifactDto,
  MotionStudioArtifactKind,
  MotionStudioArtifactPayload,
  MotionStudioArtifactVersionDto,
  MotionStudioCommandOperation,
  MotionStudioCommandResult,
  MotionStudioProductionDto,
  MotionStudioProvenance,
} from '../../../src/types/motion-studio'

export interface MotionStudioProductionRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  owner_id: string
  module_id: MotionStudioProductionDto['moduleId']
  module_catalog_version: MotionStudioProductionDto['moduleCatalogVersion']
  stage_profile_id: MotionStudioProductionDto['stageProfileId']
  status: MotionStudioProductionDto['status']
  current_stage: MotionStudioProductionDto['currentStage']
  workspace_mode: MotionStudioProductionDto['workspaceMode']
  default_production_mode: MotionStudioProductionDto['defaultProductionMode']
  user_facing_strategy: "Director's Hybrid"
  record_version: number
  created_at: string
  updated_at: string
}

export interface MotionStudioNamedEditRow {
  id: string
  workspace_id: string
  project_id: string
  owner_id: string
  status: string
}

export interface MotionStudioArtifactRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  kind: MotionStudioArtifactKind
  current_draft_version_id: string | null
  current_approved_version_id: string | null
  record_version: number
  created_at: string
  archived_at: string | null
}

export interface MotionStudioArtifactVersionRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  artifact_id: string
  kind: MotionStudioArtifactKind
  version_number: number
  parent_version_id: string | null
  state: MotionStudioArtifactVersionDto['state']
  payload_json: MotionStudioArtifactPayload
  content_digest: string
  provenance_json: MotionStudioProvenance
  immutable: true
  created_at: string
}

export interface MotionStudioApprovalRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  approved_snapshot_id: string
  approved_by: string
  approved_at: string
  motion_studio_production_id: string
  motion_studio_artifact_id: string
  motion_studio_artifact_version_id: string
  motion_studio_artifact_content_digest: string
  motion_studio_approval_kind: ArtifactApproval['approvalKind']
  approval_digest: string
}

export interface CompileMotionStudioCommandInput {
  production: MotionStudioProductionRow
  artifact: MotionStudioArtifactRow
  baseVersion: MotionStudioArtifactVersionRow
  request: ApplyMotionStudioCommandRequest
  actor: MotionStudioActorReference
  createdAt: string
}

export interface CompiledMotionStudioCommand {
  operations: readonly MotionStudioCommandOperation[]
  payload: MotionStudioArtifactPayload
  provenance: MotionStudioProvenance
  state: 'draft' | 'in_review'
}

export interface ApplyMotionStudioCommandRepositoryInput extends CompileMotionStudioCommandInput {
  commandId: string
  actorUserId: string
  idempotencyKey: string
  requestHash: string
  requestId: string
  compiled: CompiledMotionStudioCommand
}

export interface ApproveMotionStudioArtifactRepositoryInput {
  productionId: string
  artifactId: string
  actorUserId: string
  idempotencyKey: string
  requestHash: string
  requestId: string
  request: ApproveMotionStudioArtifactVersionRequest
}

export interface CreateInitialArtifactRepositoryInput {
  productionId: string
  actorUserId: string
  idempotencyKey: string
  requestHash: string
  request: CreateMotionStudioArtifactVersionRequest
  provenance: MotionStudioProvenance
}

export interface CreateMotionStudioProductionRepositoryInput {
  namedEdit: MotionStudioNamedEditRow
  actorUserId: string
  request: CreateMotionStudioProductionRequest
  idempotencyKey: string
  requestHash: string
}

export interface MotionStudioCommandRepository {
  findNamedEdit(projectId: string, editSessionId: string): Promise<MotionStudioNamedEditRow | undefined>
  findProductionForNamedEdit(projectId: string, editSessionId: string): Promise<MotionStudioProductionRow | undefined>
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  createProduction(input: CreateMotionStudioProductionRepositoryInput): Promise<{ productionId: string }>
  findArtifact(productionId: string, artifactId: string): Promise<MotionStudioArtifactRow | undefined>
  findArtifactsByKind(productionId: string, kind: MotionStudioArtifactKind): Promise<MotionStudioArtifactRow[]>
  findArtifactVersion(productionId: string, artifactId: string, versionId: string): Promise<MotionStudioArtifactVersionRow | undefined>
  findArtifactVersions(productionId: string, artifactId: string, versionIds: readonly string[]): Promise<MotionStudioArtifactVersionRow[]>
  findLatestApproval(productionId: string, artifactId: string): Promise<MotionStudioApprovalRow | undefined>
  createInitialArtifactVersion(input: CreateInitialArtifactRepositoryInput): Promise<{ artifactId: string; artifactVersionId: string }>
  applyCommand(input: ApplyMotionStudioCommandRepositoryInput): Promise<MotionStudioCommandResult>
  approveArtifact(input: ApproveMotionStudioArtifactRepositoryInput): Promise<ArtifactApproval>
}

export interface MotionStudioCommandServiceResult<T> {
  data: T
  warnings: string[]
}

export interface MotionStudioArtifactReadResult {
  artifact: MotionStudioArtifactDto
}
