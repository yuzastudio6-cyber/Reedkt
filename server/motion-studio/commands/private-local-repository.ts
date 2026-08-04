import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import {
  motionStudioArtifactApprovalSchema,
  motionStudioArtifactVersionSchema,
} from '../../../src/lib/motion-studio/contracts'
import {
  motionStudioStorytellingWorkspaceRoute,
} from '../../../src/lib/motion-studio/contracts/storytelling-workflow'
import type {
  ArtifactApproval,
  MotionStudioCommandResult,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import type { ServiceContext } from '../../types'
import { createApprovedSnapshotService } from '../../services/approved-snapshot-service'
import { createInternalEditStateService } from '../../services/internal-edit-state-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import { getRequiredAuthUserId } from '../../services/service-helpers'
import {
  authorizeWorkspaceAccess,
  listAuthenticatedWorkspaceMemberships,
} from '../../services/workspace-access-service'
import { sha256CanonicalJson } from './canonical-json'
import {
  motionStudioApprovalRowSchema,
  motionStudioArtifactRowSchema,
  motionStudioArtifactVersionRowSchema,
  motionStudioCommandResultSchema,
  motionStudioProductionRowSchema,
} from './repository'
import type {
  ApplyMotionStudioCommandRepositoryInput,
  ApproveMotionStudioArtifactRepositoryInput,
  CreateInitialArtifactRepositoryInput,
  CreateMotionStudioProductionRepositoryInput,
  MotionStudioApprovalRow,
  MotionStudioArtifactRow,
  MotionStudioArtifactVersionRow,
  MotionStudioCommandRepository,
  MotionStudioNamedEditRow,
  MotionStudioProductionRow,
} from './types'

const REGISTRY_VERSION =
  'private-motion-studio-command-registry-v1' as const
const REGISTRY_SOURCE =
  'backend_local_private_motion_studio_command_repository' as const
const MAX_REGISTRY_BYTES = 4 * 1024 * 1024
const MAX_PRODUCTIONS = 128
const MAX_ARTIFACTS_PER_PRODUCTION = 128
const MAX_VERSIONS_PER_PRODUCTION = 2_048
const MAX_APPROVALS_PER_PRODUCTION = 1_024
const MAX_RECEIPTS_PER_PRODUCTION = 4_096

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const createProductionReceiptSchema = z.object({
  operation: z.literal('create_production'),
  idempotencyKeyHash: digestSchema,
  requestHash: digestSchema,
  response: z.object({ productionId: z.string().uuid() }).strict(),
  committedAt: z.string().min(1),
}).strict()
const createArtifactReceiptSchema = z.object({
  operation: z.literal('create_artifact'),
  idempotencyKeyHash: digestSchema,
  requestHash: digestSchema,
  response: z.object({
    artifactId: z.string().uuid(),
    artifactVersionId: z.string().uuid(),
  }).strict(),
  committedAt: z.string().min(1),
}).strict()
const applyCommandReceiptSchema = z.object({
  operation: z.literal('apply_command'),
  idempotencyKeyHash: digestSchema,
  requestHash: digestSchema,
  response: motionStudioCommandResultSchema,
  committedAt: z.string().min(1),
}).strict()
const approveArtifactReceiptSchema = z.object({
  operation: z.literal('approve_artifact'),
  idempotencyKeyHash: digestSchema,
  requestHash: digestSchema,
  response: motionStudioArtifactApprovalSchema,
  committedAt: z.string().min(1),
}).strict()
const receiptSchema = z.discriminatedUnion('operation', [
  createProductionReceiptSchema,
  createArtifactReceiptSchema,
  applyCommandReceiptSchema,
  approveArtifactReceiptSchema,
])
const aggregateSchema = z.object({
  production: motionStudioProductionRowSchema,
  artifacts: z.array(motionStudioArtifactRowSchema)
    .max(MAX_ARTIFACTS_PER_PRODUCTION),
  versions: z.array(motionStudioArtifactVersionRowSchema)
    .max(MAX_VERSIONS_PER_PRODUCTION),
  approvals: z.array(motionStudioApprovalRowSchema)
    .max(MAX_APPROVALS_PER_PRODUCTION),
  receipts: z.array(receiptSchema).max(MAX_RECEIPTS_PER_PRODUCTION),
}).strict()
const registrySchema = z.object({
  recordVersion: z.literal(REGISTRY_VERSION),
  source: z.literal(REGISTRY_SOURCE),
  ownerUserId: z.string().min(1).max(160),
  updatedAt: z.string().min(1),
  productions: z.array(aggregateSchema).max(MAX_PRODUCTIONS),
}).strict()
const envelopeSchema = z.object({
  registry: registrySchema,
  checksumSha256: digestSchema,
}).strict()

type PrivateReceipt = z.infer<typeof receiptSchema>
type PrivateAggregate = z.infer<typeof aggregateSchema>
type PrivateRegistry = z.infer<typeof registrySchema>

/**
 * Request-scoped, bearer-only Motion Studio persistence for the isolated local
 * product break-test runtime. It deliberately reuses the saved Project/Named
 * Edit and canonical approval-snapshot authorities while keeping one
 * checksummed single-host registry. It is not a Supabase or production
 * repository and cannot be selected by browser input.
 */
export function createPrivateLocalMotionStudioCommandRepository(
  context: ServiceContext,
): MotionStudioCommandRepository {
  const ownerUserId = requireVerifiedBearerUser(context)

  return {
    async findNamedEdit(projectId, editSessionId) {
      return findExactSavedStorytellingEdit(
        context,
        ownerUserId,
        projectId,
        editSessionId,
      )
    },

    async findProductionForNamedEdit(projectId, editSessionId) {
      const registry = await readRegistry(context, ownerUserId)
      const aggregate = registry.productions.find((candidate) =>
        candidate.production.project_id === projectId
        && candidate.production.edit_session_id === editSessionId)
      if (!aggregate) return undefined
      await assertAggregateAccess(context, ownerUserId, aggregate, 'read')
      return structuredClone(aggregate.production)
    },

    async findProduction(productionId) {
      const registry = await readRegistry(context, ownerUserId)
      const aggregate = findAggregate(registry, productionId)
      if (!aggregate) return undefined
      await assertAggregateAccess(context, ownerUserId, aggregate, 'read')
      return structuredClone(aggregate.production)
    },

    async createProduction(input) {
      assertNamedEditForActor(input, ownerUserId)
      await authorizeWorkspaceAccess(context, input.namedEdit.workspace_id, 'write')
      return mutateRegistry(context, ownerUserId, async (registry) => {
        const replay = replayReceipt(
          registry,
          'create_production',
          input.idempotencyKey,
          input.requestHash,
        )
        if (replay) return structuredClone(replay.response)
        if (registry.productions.some((candidate) =>
          candidate.production.project_id === input.namedEdit.project_id
          && candidate.production.edit_session_id === input.namedEdit.id)) {
          throw conflict(
            'This named edit already owns a Motion Studio production.',
          )
        }
        if (registry.productions.length >= MAX_PRODUCTIONS) {
          throw capacity('Motion Studio production capacity is exhausted.')
        }
        const now = new Date().toISOString()
        const production: MotionStudioProductionRow = {
          id: randomUUID(),
          workspace_id: input.namedEdit.workspace_id,
          project_id: input.namedEdit.project_id,
          edit_session_id: input.namedEdit.id,
          owner_id: ownerUserId,
          module_id: input.request.moduleId,
          module_catalog_version: input.request.moduleCatalogVersion,
          stage_profile_id: 'motion-studio-storytelling-stage-profile-v1',
          status: 'draft',
          current_stage: 'director_brief',
          workspace_mode: 'guided',
          default_production_mode: 'hybrid_directed',
          user_facing_strategy: "Director's Hybrid",
          record_version: 1,
          created_at: now,
          updated_at: now,
        }
        motionStudioProductionRowSchema.parse(production)
        const response = { productionId: production.id }
        registry.productions.push({
          production,
          artifacts: [],
          versions: [],
          approvals: [],
          receipts: [newReceipt(
            'create_production',
            input.idempotencyKey,
            input.requestHash,
            response,
            now,
          )],
        })
        return response
      })
    },

    async findArtifact(productionId, artifactId) {
      const aggregate = await readAccessibleAggregate(
        context,
        ownerUserId,
        productionId,
        'read',
      )
      const artifact = aggregate?.artifacts.find((candidate) =>
        candidate.id === artifactId)
      return artifact ? structuredClone(artifact) : undefined
    },

    async findArtifactsByKind(productionId, kind) {
      const aggregate = await readAccessibleAggregate(
        context,
        ownerUserId,
        productionId,
        'read',
      )
      return structuredClone(
        aggregate?.artifacts.filter((candidate) =>
          candidate.kind === kind && candidate.archived_at === null) ?? [],
      )
    },

    async findArtifactVersion(productionId, artifactId, versionId) {
      const aggregate = await readAccessibleAggregate(
        context,
        ownerUserId,
        productionId,
        'read',
      )
      const version = aggregate?.versions.find((candidate) =>
        candidate.artifact_id === artifactId && candidate.id === versionId)
      return version ? structuredClone(version) : undefined
    },

    async findArtifactVersions(productionId, artifactId, versionIds) {
      const aggregate = await readAccessibleAggregate(
        context,
        ownerUserId,
        productionId,
        'read',
      )
      const requestedIds = new Set(versionIds)
      return structuredClone(
        aggregate?.versions.filter((candidate) =>
          candidate.artifact_id === artifactId
          && requestedIds.has(candidate.id)) ?? [],
      )
    },

    async findLatestApproval(productionId, artifactId) {
      const aggregate = await readAccessibleAggregate(
        context,
        ownerUserId,
        productionId,
        'read',
      )
      const approval = aggregate?.approvals
        .filter((candidate) =>
          candidate.motion_studio_artifact_id === artifactId)
        .sort((left, right) =>
          right.approved_at.localeCompare(left.approved_at))[0]
      return approval ? structuredClone(approval) : undefined
    },

    async createInitialArtifactVersion(input) {
      return createInitialArtifactVersion(
        context,
        ownerUserId,
        input,
      )
    },

    async applyCommand(input) {
      return applyCommand(context, ownerUserId, input)
    },

    async approveArtifact(input) {
      return approveArtifact(context, ownerUserId, input)
    },
  }
}

async function createInitialArtifactVersion(
  context: ServiceContext,
  ownerUserId: string,
  input: CreateInitialArtifactRepositoryInput,
): Promise<{ artifactId: string; artifactVersionId: string }> {
  return mutateRegistry(context, ownerUserId, async (registry) => {
    const aggregate = requireAggregate(registry, input.productionId)
    await assertAggregateAccess(context, ownerUserId, aggregate, 'write')
    const replay = replayAggregateReceipt(
      aggregate,
      'create_artifact',
      input.idempotencyKey,
      input.requestHash,
    )
    if (replay) return structuredClone(replay.response)
    if (aggregate.artifacts.some((candidate) =>
      candidate.kind === input.request.kind
      && candidate.archived_at === null)) {
      throw conflict(
        `This production already has an active ${input.request.kind} artifact.`,
      )
    }
    assertAggregateCapacity(aggregate, 'artifact')
    const now = new Date().toISOString()
    const artifactId = randomUUID()
    const artifactVersionId = randomUUID()
    const contentDigest = sha256CanonicalJson({
      artifactId,
      kind: input.request.kind,
      versionNumber: 1,
      parentVersionId: null,
      payload: input.request.payload,
      provenance: input.provenance,
    })
    const artifact: MotionStudioArtifactRow = {
      id: artifactId,
      workspace_id: aggregate.production.workspace_id,
      project_id: aggregate.production.project_id,
      edit_session_id: aggregate.production.edit_session_id,
      production_id: aggregate.production.id,
      kind: input.request.kind,
      current_draft_version_id: artifactVersionId,
      current_approved_version_id: null,
      record_version: 1,
      created_at: now,
      archived_at: null,
    }
    const version: MotionStudioArtifactVersionRow = {
      id: artifactVersionId,
      workspace_id: aggregate.production.workspace_id,
      project_id: aggregate.production.project_id,
      edit_session_id: aggregate.production.edit_session_id,
      production_id: aggregate.production.id,
      artifact_id: artifactId,
      kind: input.request.kind,
      version_number: 1,
      parent_version_id: null,
      state: input.request.state,
      payload_json: structuredClone(input.request.payload),
      content_digest: contentDigest,
      provenance_json: structuredClone(input.provenance),
      immutable: true,
      created_at: now,
    }
    motionStudioArtifactRowSchema.parse(artifact)
    motionStudioArtifactVersionRowSchema.parse(version)
    motionStudioArtifactVersionSchema.parse(projectVersion(version))
    aggregate.artifacts.push(artifact)
    aggregate.versions.push(version)
    const response = { artifactId, artifactVersionId }
    aggregate.receipts.push(newReceipt(
      'create_artifact',
      input.idempotencyKey,
      input.requestHash,
      response,
      now,
    ))
    touchProduction(aggregate, now)
    return response
  })
}

async function applyCommand(
  context: ServiceContext,
  ownerUserId: string,
  input: ApplyMotionStudioCommandRepositoryInput,
): Promise<MotionStudioCommandResult> {
  return mutateRegistry(context, ownerUserId, async (registry) => {
    const aggregate = requireAggregate(registry, input.production.id)
    await assertAggregateAccess(context, ownerUserId, aggregate, 'write')
    assertInputProduction(aggregate, input.production)
    const replay = replayAggregateReceipt(
      aggregate,
      'apply_command',
      input.idempotencyKey,
      input.requestHash,
    )
    if (replay) return structuredClone(replay.response)
    assertAggregateCapacity(aggregate, 'version')
    const artifact = requireArtifact(aggregate, input.artifact.id)
    const currentVersionId =
      artifact.current_draft_version_id ?? artifact.current_approved_version_id
    const currentVersion = currentVersionId
      ? aggregate.versions.find((candidate) =>
          candidate.artifact_id === artifact.id
          && candidate.id === currentVersionId)
      : undefined
    const requestedBase = aggregate.versions.find((candidate) =>
      candidate.artifact_id === artifact.id
      && candidate.id === input.request.baseVersionId)
    if (
      !currentVersion
      || !requestedBase
      || requestedBase.id !== currentVersion.id
      || requestedBase.content_digest !== input.request.baseVersionDigest
    ) {
      const authoritative = currentVersion ?? requestedBase
      if (!authoritative) {
        throw new ApiError(
          'MOTION_STUDIO_NOT_FOUND',
          'Motion Studio command base version was not found.',
          404,
        )
      }
      const result: MotionStudioCommandResult = {
        status: 'conflict',
        commandId: input.commandId,
        currentVersionId: authoritative.id,
        currentVersionDigest: authoritative.content_digest,
        conflictPaths: ['/baseVersionId', '/baseVersionDigest'],
        message: 'The Motion Studio artifact changed before this command committed.',
      }
      aggregate.receipts.push(newReceipt(
        'apply_command',
        input.idempotencyKey,
        input.requestHash,
        result,
        input.createdAt,
      ))
      return result
    }
    const versionId = randomUUID()
    const versionNumber = requestedBase.version_number + 1
    const contentDigest = sha256CanonicalJson({
      artifactId: artifact.id,
      kind: artifact.kind,
      versionNumber,
      parentVersionId: requestedBase.id,
      payload: input.compiled.payload,
      provenance: input.compiled.provenance,
    })
    const version: MotionStudioArtifactVersionRow = {
      id: versionId,
      workspace_id: aggregate.production.workspace_id,
      project_id: aggregate.production.project_id,
      edit_session_id: aggregate.production.edit_session_id,
      production_id: aggregate.production.id,
      artifact_id: artifact.id,
      kind: artifact.kind,
      version_number: versionNumber,
      parent_version_id: requestedBase.id,
      state: input.compiled.state,
      payload_json: structuredClone(input.compiled.payload),
      content_digest: contentDigest,
      provenance_json: structuredClone(input.compiled.provenance),
      immutable: true,
      created_at: input.createdAt,
    }
    motionStudioArtifactVersionRowSchema.parse(version)
    motionStudioArtifactVersionSchema.parse(projectVersion(version))
    aggregate.versions.push(version)
    artifact.current_draft_version_id = version.id
    artifact.record_version += 1
    const invalidated = artifact.current_approved_version_id
      ? [artifact.current_approved_version_id]
      : []
    const result: MotionStudioCommandResult = {
      status: 'applied',
      commandId: input.commandId,
      newVersionId: version.id,
      newVersionDigest: version.content_digest,
      impact: {
        affectedArtifactVersionIds: [version.id],
        invalidatedArtifactVersionIds: invalidated,
        affectedSceneIds: [],
        affectedJobIds: [],
        newEstimateRequired: true,
        approvalResetRequired: invalidated.length > 0,
        explanation: [
          'A new immutable Motion Studio artifact version was committed.',
          ...(invalidated.length > 0
            ? ['The prior approved artifact requires a new plan and approval cycle.']
            : []),
        ],
      },
    }
    aggregate.receipts.push(newReceipt(
      'apply_command',
      input.idempotencyKey,
      input.requestHash,
      result,
      input.createdAt,
    ))
    touchProduction(aggregate, input.createdAt)
    return result
  })
}

async function approveArtifact(
  context: ServiceContext,
  ownerUserId: string,
  input: ApproveMotionStudioArtifactRepositoryInput,
): Promise<ArtifactApproval> {
  return mutateRegistry(context, ownerUserId, async (registry) => {
    const aggregate = requireAggregate(registry, input.productionId)
    await assertAggregateAccess(context, ownerUserId, aggregate, 'write')
    const replay = replayAggregateReceipt(
      aggregate,
      'approve_artifact',
      input.idempotencyKey,
      input.requestHash,
    )
    if (replay) return structuredClone(replay.response)
    const artifact = requireArtifact(aggregate, input.artifactId)
    const version = aggregate.versions.find((candidate) =>
      candidate.artifact_id === artifact.id
      && candidate.id === input.request.artifactVersionId)
    if (!version) {
      throw new ApiError(
        'MOTION_STUDIO_NOT_FOUND',
        'Motion Studio artifact version was not found.',
        404,
      )
    }
    if (
      version.content_digest !== input.request.artifactContentDigest
      || (
        artifact.current_draft_version_id !== version.id
        && artifact.current_approved_version_id !== version.id
      )
    ) {
      throw conflict(
        'The Motion Studio artifact version changed before approval.',
      )
    }
    await assertApprovedSnapshotAuthority(
      context,
      ownerUserId,
      aggregate.production,
      input.request.approvedSnapshotId,
    )
    assertAggregateCapacity(aggregate, 'approval')
    const now = new Date().toISOString()
    const approvalWithoutDigest = {
      id: randomUUID(),
      workspaceId: aggregate.production.workspace_id,
      projectId: aggregate.production.project_id,
      editSessionId: aggregate.production.edit_session_id,
      productionId: aggregate.production.id,
      artifactId: artifact.id,
      artifactVersion: {
        artifactId: artifact.id,
        versionId: version.id,
        versionNumber: version.version_number,
        contentDigest: version.content_digest,
      },
      approvedSnapshotId: input.request.approvedSnapshotId,
      approvalKind: input.request.approvalKind,
      approvedBy: { actorKind: 'user' as const, actorId: ownerUserId },
      immutable: true as const,
      createdAt: now,
    }
    const approval: ArtifactApproval = {
      ...approvalWithoutDigest,
      approvalDigest: sha256CanonicalJson(approvalWithoutDigest),
    }
    motionStudioArtifactApprovalSchema.parse(approval)
    const row: MotionStudioApprovalRow = {
      id: approval.id,
      workspace_id: approval.workspaceId,
      project_id: approval.projectId,
      edit_session_id: approval.editSessionId,
      approved_snapshot_id: approval.approvedSnapshotId,
      approved_by: ownerUserId,
      approved_at: now,
      motion_studio_production_id: approval.productionId,
      motion_studio_artifact_id: approval.artifactId,
      motion_studio_artifact_version_id:
        approval.artifactVersion.versionId,
      motion_studio_artifact_content_digest:
        approval.artifactVersion.contentDigest,
      motion_studio_approval_kind: approval.approvalKind,
      approval_digest: approval.approvalDigest,
    }
    motionStudioApprovalRowSchema.parse(row)
    aggregate.approvals.push(row)
    artifact.current_approved_version_id = version.id
    artifact.record_version += 1
    aggregate.receipts.push(newReceipt(
      'approve_artifact',
      input.idempotencyKey,
      input.requestHash,
      approval,
      now,
    ))
    touchProduction(aggregate, now)
    return approval
  })
}

async function findExactSavedStorytellingEdit(
  context: ServiceContext,
  ownerUserId: string,
  projectId: string,
  editSessionId: string,
): Promise<MotionStudioNamedEditRow | undefined> {
  const memberships = await listAuthenticatedWorkspaceMemberships(context)
  const editStateService = createInternalEditStateService(context)
  for (const membership of memberships) {
    try {
      const { internalEditState } =
        await editStateService.getInternalEditState(
          membership.workspaceId,
          projectId,
          editSessionId,
        )
      const handoff = internalEditState.handoff
      if (
        internalEditState.userId !== ownerUserId
        || internalEditState.projectId !== projectId
        || internalEditState.editSessionId !== editSessionId
        || handoff.productWorkflow !== 'motion_studio.storytelling'
        || handoff.editorPath
          !== motionStudioStorytellingWorkspaceRoute(projectId, editSessionId)
      ) return undefined
      return {
        id: editSessionId,
        workspace_id: membership.workspaceId,
        project_id: projectId,
        owner_id: ownerUserId,
        status: typeof handoff.archivedAt === 'string' ? 'archived' : 'active',
      }
    } catch (error) {
      if (
        error instanceof ApiError
        && (
          error.code === 'PROJECT_NOT_FOUND'
          || error.code === 'WORKSPACE_ACCESS_DENIED'
        )
      ) continue
      throw error
    }
  }
  return undefined
}

async function assertApprovedSnapshotAuthority(
  context: ServiceContext,
  ownerUserId: string,
  production: MotionStudioProductionRow,
  approvedSnapshotId: string,
): Promise<void> {
  const result = await createApprovedSnapshotService(context)
    .getApprovedSnapshot(approvedSnapshotId)
  const snapshot = result.approvedPlanSnapshot
  const snapshotRecord = asRecord(snapshot)
  const snapshotJson = asRecord(snapshot.snapshotJson)
  const snapshotRecordEditSessionId = readOptionalString(
    snapshotRecord,
    'chatSessionId',
    'editSessionId',
    'edit_session_id',
  )
  const snapshotPayloadEditSessionId = readOptionalString(
    snapshotJson,
    'editSessionId',
    'edit_session_id',
  )
  if (
    snapshot.workspaceId !== production.workspace_id
    || snapshot.projectId !== production.project_id
    || snapshot.approvedByUserId !== ownerUserId
    || (
      snapshotRecordEditSessionId === undefined
      && snapshotPayloadEditSessionId === undefined
    )
    || (
      snapshotRecordEditSessionId !== undefined
      && snapshotRecordEditSessionId !== production.edit_session_id
    )
    || (
      snapshotPayloadEditSessionId !== undefined
      && snapshotPayloadEditSessionId !== production.edit_session_id
    )
  ) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'The approved snapshot does not match this Motion Studio production.',
      409,
    )
  }
}

async function readAccessibleAggregate(
  context: ServiceContext,
  ownerUserId: string,
  productionId: string,
  operation: 'read' | 'write',
): Promise<PrivateAggregate | undefined> {
  const registry = await readRegistry(context, ownerUserId)
  const aggregate = findAggregate(registry, productionId)
  if (!aggregate) return undefined
  await assertAggregateAccess(context, ownerUserId, aggregate, operation)
  return aggregate
}

async function assertAggregateAccess(
  context: ServiceContext,
  ownerUserId: string,
  aggregate: PrivateAggregate,
  operation: 'read' | 'write',
): Promise<void> {
  const access = await authorizeWorkspaceAccess(
    context,
    aggregate.production.workspace_id,
    operation,
  )
  if (
    access.userId !== ownerUserId
    || aggregate.production.owner_id !== ownerUserId
  ) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Motion Studio production access is tenant-bound.',
      403,
    )
  }
}

async function mutateRegistry<T>(
  context: ServiceContext,
  ownerUserId: string,
  operation: (registry: PrivateRegistry) => Promise<T>,
): Promise<T> {
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath: registryLockPath(ownerUserId),
    operation: async () => {
      const registry = await readRegistry(context, ownerUserId)
      const beforeDigest = sha256AuthorityValue(registry)
      const result = await operation(registry)
      if (sha256AuthorityValue(registry) === beforeDigest) return result
      registry.updatedAt = new Date().toISOString()
      await persistRegistry(context, registry)
      return result
    },
  })
}

async function readRegistry(
  context: ServiceContext,
  ownerUserId: string,
): Promise<PrivateRegistry> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath: registryPath(ownerUserId),
  })
  if (content === undefined) {
    return {
      recordVersion: REGISTRY_VERSION,
      source: REGISTRY_SOURCE,
      ownerUserId,
      updatedAt: new Date(0).toISOString(),
      productions: [],
    }
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_REGISTRY_BYTES) {
    throw invalidStoredRegistry(
      'Motion Studio private registry exceeded its size ceiling.',
    )
  }
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    throw invalidStoredRegistry(
      'Motion Studio private registry is not valid JSON.',
    )
  }
  const parsed = envelopeSchema.safeParse(raw)
  if (!parsed.success) {
    throw invalidStoredRegistry(
      'Motion Studio private registry shape is invalid.',
    )
  }
  if (
    parsed.data.checksumSha256
      !== sha256AuthorityValue(parsed.data.registry)
    || parsed.data.registry.ownerUserId !== ownerUserId
  ) {
    throw invalidStoredRegistry(
      'Motion Studio private registry authority is invalid.',
    )
  }
  return parsed.data.registry
}

async function persistRegistry(
  context: ServiceContext,
  registry: PrivateRegistry,
): Promise<void> {
  const parsed = registrySchema.parse(registry)
  const envelope = {
    registry: parsed,
    checksumSha256: sha256AuthorityValue(parsed),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_REGISTRY_BYTES) {
    throw capacity('Motion Studio private registry exceeded its size ceiling.')
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath: registryPath(registry.ownerUserId),
    content,
  })
  const reread = await readRegistry(context, registry.ownerUserId)
  if (sha256AuthorityValue(reread) !== sha256AuthorityValue(parsed)) {
    throw invalidStoredRegistry(
      'Motion Studio private registry failed exact readback.',
    )
  }
}

function replayReceipt<
  TOperation extends PrivateReceipt['operation'],
>(
  registry: PrivateRegistry,
  operation: TOperation,
  idempotencyKey: string,
  requestHash: string,
): Extract<PrivateReceipt, { operation: TOperation }> | undefined {
  const keyHash = hashIdempotencyKey(idempotencyKey)
  const receipts = registry.productions.flatMap((aggregate) =>
    aggregate.receipts)
  const existing = receipts.find((receipt) =>
    receipt.idempotencyKeyHash === keyHash)
  if (!existing) return undefined
  if (
    existing.operation !== operation
    || existing.requestHash !== requestHash
  ) throw idempotencyConflict()
  return existing as Extract<PrivateReceipt, { operation: TOperation }>
}

function replayAggregateReceipt<
  TOperation extends PrivateReceipt['operation'],
>(
  aggregate: PrivateAggregate,
  operation: TOperation,
  idempotencyKey: string,
  requestHash: string,
): Extract<PrivateReceipt, { operation: TOperation }> | undefined {
  const keyHash = hashIdempotencyKey(idempotencyKey)
  const existing = aggregate.receipts.find((receipt) =>
    receipt.idempotencyKeyHash === keyHash)
  if (!existing) return undefined
  if (
    existing.operation !== operation
    || existing.requestHash !== requestHash
  ) throw idempotencyConflict()
  return existing as Extract<PrivateReceipt, { operation: TOperation }>
}

function newReceipt<
  TOperation extends PrivateReceipt['operation'],
>(
  operation: TOperation,
  idempotencyKey: string,
  requestHash: string,
  response: Extract<
    PrivateReceipt,
    { operation: TOperation }
  >['response'],
  committedAt: string,
): Extract<PrivateReceipt, { operation: TOperation }> {
  return {
    operation,
    idempotencyKeyHash: hashIdempotencyKey(idempotencyKey),
    requestHash,
    response,
    committedAt,
  } as Extract<PrivateReceipt, { operation: TOperation }>
}

function hashIdempotencyKey(idempotencyKey: string): string {
  return sha256CanonicalJson({ idempotencyKey })
}

function registryPath(ownerUserId: string): string {
  const ownerHash = sha256CanonicalJson({ ownerUserId }).slice(0, 32)
  return `private-internal/motion-studio-command-repository/v1/${ownerHash}/registry.json`
}

function registryLockPath(ownerUserId: string): string {
  const ownerHash = sha256CanonicalJson({ ownerUserId }).slice(0, 32)
  return `private-internal/motion-studio-command-repository/v1/${ownerHash}/registry.lock`
}

function requireVerifiedBearerUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError(
      'AUTH_INVALID',
      'Private Motion Studio commands require a verified bearer identity.',
      401,
    )
  }
  return userId
}

function assertNamedEditForActor(
  input: CreateMotionStudioProductionRepositoryInput,
  ownerUserId: string,
): void {
  if (
    input.namedEdit.owner_id !== ownerUserId
    || input.actorUserId !== ownerUserId
    || input.namedEdit.status === 'archived'
  ) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'The saved named edit is unavailable for Motion Studio creation.',
      403,
    )
  }
}

function findAggregate(
  registry: PrivateRegistry,
  productionId: string,
): PrivateAggregate | undefined {
  return registry.productions.find((candidate) =>
    candidate.production.id === productionId)
}

function requireAggregate(
  registry: PrivateRegistry,
  productionId: string,
): PrivateAggregate {
  const aggregate = findAggregate(registry, productionId)
  if (!aggregate) {
    throw new ApiError(
      'MOTION_STUDIO_NOT_FOUND',
      'Motion Studio production was not found.',
      404,
    )
  }
  return aggregate
}

function requireArtifact(
  aggregate: PrivateAggregate,
  artifactId: string,
): MotionStudioArtifactRow {
  const artifact = aggregate.artifacts.find((candidate) =>
    candidate.id === artifactId)
  if (!artifact) {
    throw new ApiError(
      'MOTION_STUDIO_NOT_FOUND',
      'Motion Studio artifact was not found.',
      404,
    )
  }
  return artifact
}

function assertInputProduction(
  aggregate: PrivateAggregate,
  production: MotionStudioProductionRow,
): void {
  if (
    aggregate.production.id !== production.id
    || aggregate.production.workspace_id !== production.workspace_id
    || aggregate.production.project_id !== production.project_id
    || aggregate.production.edit_session_id !== production.edit_session_id
    || aggregate.production.owner_id !== production.owner_id
    || aggregate.production.module_id !== production.module_id
    || aggregate.production.module_catalog_version
      !== production.module_catalog_version
    || aggregate.production.stage_profile_id !== production.stage_profile_id
  ) {
    throw conflict(
      'Motion Studio production identity changed before the command committed.',
    )
  }
}

function assertAggregateCapacity(
  aggregate: PrivateAggregate,
  kind: 'artifact' | 'version' | 'approval',
): void {
  if (
    (kind === 'artifact'
      && aggregate.artifacts.length >= MAX_ARTIFACTS_PER_PRODUCTION)
    || (kind === 'version'
      && aggregate.versions.length >= MAX_VERSIONS_PER_PRODUCTION)
    || (kind === 'approval'
      && aggregate.approvals.length >= MAX_APPROVALS_PER_PRODUCTION)
    || aggregate.receipts.length >= MAX_RECEIPTS_PER_PRODUCTION
  ) {
    throw capacity(
      `Motion Studio ${kind} persistence capacity is exhausted.`,
    )
  }
}

function touchProduction(
  aggregate: PrivateAggregate,
  timestamp: string,
): void {
  aggregate.production.record_version += 1
  aggregate.production.updated_at = timestamp
}

function projectVersion(
  row: MotionStudioArtifactVersionRow,
): Record<string, unknown> {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    productionId: row.production_id,
    artifactId: row.artifact_id,
    kind: row.kind,
    versionNumber: row.version_number,
    ...(row.parent_version_id
      ? { parentVersionId: row.parent_version_id }
      : {}),
    state: row.state,
    payload: row.payload_json,
    contentDigest: row.content_digest,
    immutable: row.immutable,
    provenance: row.provenance_json,
    createdAt: row.created_at,
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function readOptionalString(
  record: Record<string, unknown> | undefined,
  ...keys: string[]
): string | undefined {
  if (!record) return undefined
  for (const key of keys) {
    if (typeof record[key] === 'string') return record[key]
  }
  return undefined
}

function conflict(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_CONFLICT', message, 409)
}

function idempotencyConflict(): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'This Motion Studio idempotency key is already bound to another request.',
    409,
  )
}

function capacity(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CAPACITY_EXCEEDED',
    message,
    503,
  )
}

function invalidStoredRegistry(message: string): ApiError {
  return new ApiError(
    'INTERNAL_ERROR',
    message,
    500,
    undefined,
    { internal: true },
  )
}
