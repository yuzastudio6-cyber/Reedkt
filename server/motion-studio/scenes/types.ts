import type {
  CreateMotionStudioSceneDraftRequest,
  CreateMotionStudioTimelineProposalRequest,
  MotionStudioArtifactKind,
  MotionStudioArtifactPayload,
  MotionStudioSceneDraftReceiptDto,
  MotionStudioTimelineProposalDto,
  MotionStudioVersionReference,
  SceneDocument,
  TimelineProposalOperation,
} from '../../../src/types/motion-studio'
import type { MotionStudioArtifactRow, MotionStudioArtifactVersionRow, MotionStudioProductionRow } from '../commands/types'

export interface MotionStudioApprovedSnapshotRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  snapshot_json: Record<string, unknown>
  snapshot_digest: string
  approved_at: string
}

export interface MotionStudioRecipeVersionRow {
  id: string
  production_id: string
  recipe_artifact_id: string
  artifact_version_id: string
  version_number: number
  definition_version: string
  definition_digest: string
  definition_json: Record<string, unknown>
  compiler_id: string
  compiler_version: string
  compiler_fingerprint: string
  created_at: string
}

export interface MotionStudioRecipeInstantiationRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  scene_id: string
  scene_document_artifact_id: string
  scene_document_version_id: string
  scene_document_digest: string
  recipe_version_id: string
  recipe_definition_version: string
  recipe_definition_digest: string
  recipe_semantic_digest: string
  recipe_input_digest: string
  motion_language_artifact_id: string
  motion_language_version_id: string
  motion_language_digest: string
  motion_language_semantic_digest: string
  narrative_function_artifact_id: string
  narrative_function_version_id: string
  narrative_function_digest: string
  narrative_function_semantic_digest: string
  production_mode: SceneDocument['productionMode']
  input_artifact_digests: string[]
  output_binding_ids: string[]
  approval_status: 'approved'
  immutable: true
  created_at: string
}

export interface MotionStudioTimelineProposalRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  source_scene_document_artifact_id: string
  source_scene_document_version_id: string
  source_scene_document_version_number: number
  source_scene_document_digest: string
  target_timeline_manifest_id: string
  timing_authority_digest: string
  compiler_id: 'motion-studio-scene-compiler'
  compiler_version: string
  input_digest: string
  output_digest: string
  operations_json: TimelineProposalOperation[]
  warnings_json: string[]
  status: 'proposed'
  created_by: string
  created_at: string
}

export interface CreateSceneDraftRepositoryInput {
  production: MotionStudioProductionRow
  request: CreateMotionStudioSceneDraftRequest
  actorUserId: string
  idempotencyKey: string
  requestHash: string
  createdAt: string
  instantiationId: string
  graphPayload: MotionStudioArtifactPayload
  layerPlanPayload: MotionStudioArtifactPayload
  recipePayload: MotionStudioArtifactPayload
  sceneDocumentPayload: MotionStudioArtifactPayload
  motionLanguageVersion: MotionStudioArtifactVersionRow
  narrativeFunctionVersion: MotionStudioArtifactVersionRow
}

export interface PersistTimelineProposalRepositoryInput {
  production: MotionStudioProductionRow
  request: CreateMotionStudioTimelineProposalRequest
  actorUserId: string
  idempotencyKey: string
  requestHash: string
  sourceVersion: MotionStudioArtifactVersionRow
  timingAuthorityDigest: string
  compilerVersion: string
  inputDigest: string
  outputDigest: string
  operations: readonly TimelineProposalOperation[]
  warnings: readonly string[]
}

export interface MotionStudioSceneRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  findSnapshot(production: MotionStudioProductionRow, snapshotId: string): Promise<MotionStudioApprovedSnapshotRow | undefined>
  findLatestSnapshot(production: MotionStudioProductionRow): Promise<MotionStudioApprovedSnapshotRow | undefined>
  findArtifactVersion(productionId: string, versionId: string): Promise<MotionStudioArtifactVersionRow | undefined>
  findRecipeVersions(productionId: string, versionIds: readonly string[]): Promise<MotionStudioRecipeVersionRow[]>
  findRecipeInstantiations(productionId: string, ids: readonly string[]): Promise<MotionStudioRecipeInstantiationRow[]>
  listArtifacts(productionId: string, kinds: readonly MotionStudioArtifactKind[]): Promise<MotionStudioArtifactRow[]>
  findArtifactVersions(productionId: string, versionIds: readonly string[]): Promise<MotionStudioArtifactVersionRow[]>
  listTimelineProposals(productionId: string): Promise<MotionStudioTimelineProposalRow[]>
  createSceneDraft(input: CreateSceneDraftRepositoryInput): Promise<MotionStudioSceneDraftReceiptDto>
  persistTimelineProposal(input: PersistTimelineProposalRepositoryInput): Promise<MotionStudioTimelineProposalRow>
}

export function versionReference(row: MotionStudioArtifactVersionRow): MotionStudioVersionReference {
  return {
    artifactId: row.artifact_id,
    versionId: row.id,
    versionNumber: row.version_number,
    contentDigest: row.content_digest,
  }
}

export function proposalDto(row: MotionStudioTimelineProposalRow): MotionStudioTimelineProposalDto {
  return {
    id: row.id,
    productionId: row.production_id,
    approvedSnapshotId: row.approved_snapshot_id,
    sourceSceneDocument: {
      artifactId: row.source_scene_document_artifact_id,
      versionId: row.source_scene_document_version_id,
      versionNumber: row.source_scene_document_version_number,
      contentDigest: row.source_scene_document_digest,
    },
    targetTimelineManifestId: row.target_timeline_manifest_id,
    compilerId: row.compiler_id,
    compilerVersion: row.compiler_version,
    inputDigest: row.input_digest,
    outputDigest: row.output_digest,
    operations: row.operations_json,
    warnings: row.warnings_json,
    status: row.status,
    createdAt: row.created_at,
    localCandidateOnly: true,
  }
}
