import { randomUUID } from 'node:crypto'

import type {
  ApplyMotionStudioCommandRequest,
  ApproveMotionStudioArtifactVersionRequest,
  CreateMotionStudioArtifactVersionRequest,
  CreateMotionStudioProductionRequest,
  MotionStudioActorKind,
  MotionStudioArtifactDto,
  MotionStudioArtifactKind,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { assertMotionStudioArtifactPayloadScope, compileMotionStudioCommand } from './compiler'
import { sha256CanonicalJson } from './canonical-json'
import {
  createSupabaseMotionStudioCommandRepository,
  mapMotionStudioApprovalRow,
  mapMotionStudioArtifactVersionRow,
  mapMotionStudioProductionRow,
} from './repository'
import type { MotionStudioArtifactVersionRow, MotionStudioCommandRepository, MotionStudioProductionRow } from './types'

const LOCAL_WARNING = 'Motion Studio command APIs are a local canonical candidate; remote Supabase, providers, jobs, rendering, billing, and customer pricing remain disabled.'

export class MotionStudioCommandService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioCommandRepository

  constructor(context: ServiceContext, repository?: MotionStudioCommandRepository) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioCommandRepository(ensureAdminClient(context))
  }

  async createProduction(projectId: string, editSessionId: string, request: CreateMotionStudioProductionRequest, idempotencyKey: string) {
    const namedEdit = await this.repository.findNamedEdit(projectId, editSessionId)
    if (!namedEdit) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'The named edit was not found in this project.', 404)
    if (namedEdit.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Only the named edit owner can enable Motion Studio in the current canonical model.', 403)
    }
    if (namedEdit.status === 'archived') throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived named edits cannot enable Motion Studio.', 409)
    const existing = await this.repository.findProductionForNamedEdit(projectId, editSessionId)
    if (existing) {
      this.assertOwner(existing)
      if (existing.module_id !== request.moduleId || existing.module_catalog_version !== request.moduleCatalogVersion) {
        throw new ApiError('MOTION_STUDIO_CONFLICT', 'This named edit already owns a different immutable Motion Studio module production.', 409)
      }
      return { data: { production: mapMotionStudioProductionRow(existing) }, warnings: [LOCAL_WARNING] }
    }
    const hash = computeRequestHash('POST', `/v1/projects/${projectId}/edit-sessions/${editSessionId}/motion-studio`, request)
    await this.repository.createProduction(editSessionId, this.actorUserId, request, idempotencyKey, hash)
    const production = await this.repository.findProductionForNamedEdit(projectId, editSessionId)
    if (!production) throw new ApiError('INTERNAL_ERROR', 'Created Motion Studio production could not be read back.', 500, undefined, { internal: true })
    this.assertOwner(production)
    return { data: { production: mapMotionStudioProductionRow(production) }, warnings: [LOCAL_WARNING] }
  }

  async getProduction(projectId: string, editSessionId: string) {
    const production = await this.repository.findProductionForNamedEdit(projectId, editSessionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio is not enabled for this named edit.', 404)
    this.assertOwner(production)
    return { data: { production: mapMotionStudioProductionRow(production) }, warnings: [LOCAL_WARNING] }
  }

  async getProductionById(productionId: string) {
    const production = await this.requireOwnedProduction(productionId)
    return { data: { production: mapMotionStudioProductionRow(production) }, warnings: [LOCAL_WARNING] }
  }

  /** Server-only ownership scope for consumers that must not trust a caller's workspace ID. */
  async getProductionScopeById(productionId: string) {
    const production = await this.requireOwnedProduction(productionId)
    return {
      workspaceId: production.workspace_id,
      projectId: production.project_id,
      editSessionId: production.edit_session_id,
      productionId: production.id,
    } as const
  }

  async createInitialArtifactVersion(productionId: string, request: CreateMotionStudioArtifactVersionRequest, idempotencyKey: string) {
    const production = await this.requireOwnedProduction(productionId)
    assertMotionStudioArtifactPayloadScope(request.payload, production)
    const createdAt = new Date().toISOString()
    const provenance = {
      ...request.provenance,
      createdBy: { actorKind: 'user' as const, actorId: this.actorUserId },
      createdAt,
    }
    const hash = computeRequestHash('POST', `/v1/motion-studio/productions/${productionId}/artifact-versions`, request)
    const receipt = await this.repository.createInitialArtifactVersion({
      productionId,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: hash,
      request,
      provenance,
    })
    const artifact = await this.readArtifact(production, receipt.artifactId)
    return { data: artifact, warnings: [LOCAL_WARNING] }
  }

  async getArtifact(productionId: string, artifactId: string) {
    const production = await this.requireOwnedProduction(productionId)
    return { data: await this.readArtifact(production, artifactId), warnings: [LOCAL_WARNING] }
  }

  async getArtifactByKind(productionId: string, kind: MotionStudioArtifactKind) {
    const production = await this.requireOwnedProduction(productionId)
    const artifacts = await this.repository.findArtifactsByKind(productionId, kind)
    if (artifacts.length === 0) {
      throw new ApiError('MOTION_STUDIO_NOT_FOUND', `Motion Studio ${kind} artifact was not found.`, 404)
    }
    if (artifacts.length !== 1) {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        `Motion Studio ${kind} authority is ambiguous for this production.`,
        409,
      )
    }
    return { data: await this.readArtifact(production, artifacts[0]!.id), warnings: [LOCAL_WARNING] }
  }

  async applyCommand(
    productionId: string,
    artifactId: string,
    request: ApplyMotionStudioCommandRequest,
    idempotencyKey: string,
    actorKind: Extract<MotionStudioActorKind, 'user' | 'director'> = 'user',
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const artifact = await this.repository.findArtifact(productionId, artifactId)
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio artifact was not found.', 404)

    const requestedBase = await this.repository.findArtifactVersion(productionId, artifactId, request.baseVersionId)
    const currentVersionId = artifact.current_draft_version_id ?? artifact.current_approved_version_id
    const currentBase = currentVersionId
      ? await this.repository.findArtifactVersion(productionId, artifactId, currentVersionId)
      : undefined
    const compileBase = requestedBase ?? currentBase
    if (!compileBase) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio command base version was not found.', 404)

    const createdAt = new Date().toISOString()
    const actor = {
      actorKind,
      actorId: actorKind === 'user' ? this.actorUserId : `director:${this.actorUserId}`,
    } as const
    const compiled = compileMotionStudioCommand({ production, artifact, baseVersion: compileBase, request, actor, createdAt })
    const hash = computeRequestHash('POST', `/v1/motion-studio/productions/${productionId}/artifacts/${artifactId}/commands`, {
      ...request,
      actorKind,
    })
    const result = await this.repository.applyCommand({
      production,
      artifact,
      baseVersion: compileBase,
      request,
      actor,
      createdAt,
      commandId: `mscmd-${randomUUID()}`,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: hash,
      requestId: this.context.requestId,
      compiled,
    })
    return { data: { result, localCandidateOnly: true as const }, warnings: [LOCAL_WARNING] }
  }

  async approveArtifact(
    productionId: string,
    artifactId: string,
    request: ApproveMotionStudioArtifactVersionRequest,
    idempotencyKey: string,
  ) {
    await this.requireOwnedProduction(productionId)
    const artifact = await this.repository.findArtifact(productionId, artifactId)
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio artifact was not found.', 404)
    const hash = computeRequestHash('POST', `/v1/motion-studio/productions/${productionId}/artifacts/${artifactId}/approvals`, request)
    const approval = await this.repository.approveArtifact({
      productionId,
      artifactId,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: hash,
      requestId: this.context.requestId,
      request,
    })
    return { data: { approval, artifact: (await this.readArtifact(await this.requireOwnedProduction(productionId), artifactId)).artifact }, warnings: [LOCAL_WARNING] }
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    this.assertOwner(production)
    return production
  }

  private assertOwner(production: MotionStudioProductionRow): void {
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Motion Studio production access is owner-private in the current canonical model.', 403)
    }
    if (production.status === 'archived') throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived Motion Studio productions are immutable.', 409)
  }

  private async readArtifact(production: MotionStudioProductionRow, artifactId: string): Promise<{ artifact: MotionStudioArtifactDto }> {
    const artifact = await this.repository.findArtifact(production.id, artifactId)
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio artifact was not found.', 404)
    const ids = [artifact.current_draft_version_id, artifact.current_approved_version_id].filter((value): value is string => Boolean(value))
    const versions = await this.repository.findArtifactVersions(production.id, artifact.id, ids)
    const byId = new Map(versions.map((version) => [version.id, version]))
    const currentDraft = artifact.current_draft_version_id ? byId.get(artifact.current_draft_version_id) : undefined
    const currentApproved = artifact.current_approved_version_id ? byId.get(artifact.current_approved_version_id) : undefined
    const approvalRow = await this.repository.findLatestApproval(production.id, artifact.id)
    const approvalVersion = approvalRow
      ? await this.repository.findArtifactVersion(production.id, artifact.id, approvalRow.motion_studio_artifact_version_id)
      : undefined
    const latestApproval = approvalRow && approvalVersion
      ? { ...mapMotionStudioApprovalRow(approvalRow), artifactVersion: versionReference(approvalVersion) }
      : undefined

    return {
      artifact: {
        id: artifact.id,
        productionId: artifact.production_id,
        kind: artifact.kind,
        ...(currentDraft ? { currentDraftVersion: versionReference(currentDraft), currentDraft: mapMotionStudioArtifactVersionRow(currentDraft) } : {}),
        ...(currentApproved ? { currentApprovedVersion: versionReference(currentApproved), currentApproved: mapMotionStudioArtifactVersionRow(currentApproved) } : {}),
        ...(latestApproval ? { latestApproval } : {}),
        recordVersion: artifact.record_version,
        createdAt: artifact.created_at,
        ...(artifact.archived_at ? { archivedAt: artifact.archived_at } : {}),
        localCandidateOnly: true,
      },
    }
  }
}

export function createMotionStudioCommandService(context: ServiceContext): MotionStudioCommandService {
  return new MotionStudioCommandService(context)
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Motion Studio database commands require a verified bearer identity.', 401)
  }
  return userId
}

function computeRequestHash(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function versionReference(version: MotionStudioArtifactVersionRow) {
  return {
    artifactId: version.artifact_id,
    versionId: version.id,
    versionNumber: version.version_number,
    contentDigest: version.content_digest,
  }
}
