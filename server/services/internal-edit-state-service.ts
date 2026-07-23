import { createHash } from 'node:crypto'
import {
  isExactMotionStudioStorytellingProductionTuple,
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  motionStudioStorytellingWorkspaceRoute,
} from '../../src/lib/motion-studio/contracts/storytelling-workflow'
import { ApiError } from '../errors/api-error'
import { createMotionStudioCommandService } from '../motion-studio/commands'
import {
  listPrivateRegularFileNamesWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import { createExactEditPreferenceService } from './exact-edit-preference-service'
import { createProjectService } from './project-service'
import { mockWarning, nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

interface SaveInternalEditStateInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  handoff: Record<string, unknown>
  idempotencyKey: string
}

interface MigrateRetainedStorytellingWorkflowInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  expectedHandoffUpdatedAt: string
  idempotencyKey: string
}

interface StorytellingProductionIdentity {
  id: string
  projectId: string
  editSessionId: string
  moduleId: unknown
  moduleCatalogVersion: unknown
  stageProfileId: unknown
  recordVersion: number
  updatedAt: string
}

export interface InternalEditStateStorytellingWorkflowMigrationReceipt {
  recordVersion: 'internal-edit-state-storytelling-workflow-migration-v1'
  sourceHandoffUpdatedAt: string
  migratedHandoffUpdatedAt: string
  productWorkflow: 'motion_studio.storytelling'
  editorPath: string
  productionId: string
  productionRecordVersion: number
  productionUpdatedAt: string
  productionAuthorityHash: string
  requestHash: string
  idempotencyKeyHash: string
  receiptDigest: string
  providerCalled: false
  generationStarted: false
  customerCommercialAuthorityGranted: false
  productionReady: false
}

export interface InternalEditStateServiceDependencies {
  readStorytellingProduction?: (
    projectId: string,
    editSessionId: string,
  ) => Promise<StorytellingProductionIdentity>
}

export interface InternalEditStateRecord {
  recordVersion: 'private-internal-edit-state-v2'
  source: 'frontend_scoped_internal_project_handoff'
  workspaceId: string
  projectId: string
  editSessionId: string
  userId: string
  handoff: Record<string, unknown>
  storytellingWorkflowMigration?: InternalEditStateStorytellingWorkflowMigrationReceipt
  createdAt: string
  updatedAt: string
  mockOnly: true
}

interface PersistedInternalEditStateRecord {
  recordVersion: 'private-internal-edit-state-v2'
  source: 'frontend_scoped_internal_project_handoff'
  persistedAt: string
  internalEditState: InternalEditStateRecord
  recordChecksumSha256: string
}

const internalEditStateRecordsByKey = new Map<string, InternalEditStateRecord>()
const internalEditStateWriteTails = new Map<string, Promise<void>>()

export function clearInternalEditStateMemoryForSmoke(): void {
  internalEditStateRecordsByKey.clear()
  internalEditStateWriteTails.clear()
}

export function createInternalEditStateService(
  context: ServiceContext,
  dependencies: InternalEditStateServiceDependencies = {},
) {
  return {
    async saveInternalEditState(input: SaveInternalEditStateInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const userId = access.userId
      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for internal edit state saves.', 400)
      }

      assertInternalEditStateHandoffSafe(input)
      await assertInternalEditStateProjectOwnedByCurrentUser(context, input.projectId, access.workspaceId)
      // This registry is explicitly private/mock-only. A local-test identity may
      // persist source and Brief lineage without pretending the separately
      // gated transactional Exact Edit Preference authority is available.
      // Verified bearer-authenticated runtimes still require that authority and
      // therefore fail closed if initialization cannot complete.
      const exactEditPreferenceInitialization = context.auth?.isMockUser
        ? { created: false, deferred: true }
        : await initializeExactEditPreferences(
            context,
            access.workspaceId,
            input.projectId,
            input.editSessionId,
            userId,
          )
      const stateKey = internalEditStateMemoryKey(userId, access.workspaceId, input.projectId, input.editSessionId)
      return withInternalEditStateWriteLock(stateKey, async () => {
        const existing = internalEditStateRecordsByKey.get(stateKey) ??
          await loadInternalEditStateRecord({
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            userId,
            workspaceId: access.workspaceId,
            localStorageRoot: context.env.localStorageRoot,
          })
        if (existing) {
          assertInternalEditStateWriteAllowed(existing, userId, input.workspaceId)
          const ordering = compareHandoffSourceRevision(input.handoff, existing.handoff)
          if (ordering < 0) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'A newer internal edit state is already stored for this edit.', 409)
          }
          if (ordering === 0) {
            if (canonicalPayloadHash(input.handoff) !== canonicalPayloadHash(existing.handoff)) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'Internal edit state reused a source revision with different content.', 409)
            }
            return {
              internalEditState: existing,
              warnings: [mockWarning('Internal edit state idempotent save')],
            }
          }
          if (isRetainedLegacyMotionStudioStorytellingMigrationCandidate(asWorkflowHandoff(existing.handoff))) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'A retained Storytelling record must use the exact production-verified workflow migration boundary before it can change.',
              409,
            )
          }
          if (
            existing.storytellingWorkflowMigration &&
            (input.handoff as { productWorkflow?: unknown }).productWorkflow !== 'motion_studio.storytelling'
          ) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'A migrated Storytelling workflow cannot be downgraded by the generic edit-state writer.', 409)
          }
        }
        const now = nowIso()
        const internalEditState: InternalEditStateRecord = {
          recordVersion: 'private-internal-edit-state-v2',
          source: 'frontend_scoped_internal_project_handoff',
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          userId,
          handoff: input.handoff,
          ...(existing?.storytellingWorkflowMigration
            ? { storytellingWorkflowMigration: existing.storytellingWorkflowMigration }
            : {}),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          mockOnly: true,
        }

        await persistInternalEditStateRecord({
          internalEditState,
          localStorageRoot: context.env.localStorageRoot,
        })
        internalEditStateRecordsByKey.set(stateKey, internalEditState)

        return {
          internalEditState,
          warnings: [
            mockWarning('Internal edit state save'),
            ...(exactEditPreferenceInitialization.created
              ? ['Exact Edit Preferences were initialized server-side from saved workspace defaults for this edit.']
              : []),
            ...(exactEditPreferenceInitialization.deferred
              ? ['Exact Edit Preference database initialization remains gated; this private local edit-state record does not claim transactional preference persistence.']
              : []),
            'Internal edit state was persisted for signed-in internal testing only. Public delivery, external beta, production, and billing require approved release evidence gates.',
          ],
        }
      })
    },

    async migrateRetainedStorytellingWorkflow(input: MigrateRetainedStorytellingWorkflowInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (!input.idempotencyKey?.trim()) {
        throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for Storytelling workflow migration.', 400)
      }
      if (!isValidIsoTimestamp(input.expectedHandoffUpdatedAt)) {
        throw new ApiError('VALIDATION_FAILED', 'Storytelling workflow migration requires the exact saved handoff revision.', 400)
      }
      await assertInternalEditStateProjectOwnedByCurrentUser(context, input.projectId, access.workspaceId)
      const stateKey = internalEditStateMemoryKey(
        access.userId,
        access.workspaceId,
        input.projectId,
        input.editSessionId,
      )

      return withInternalEditStateWriteLock(stateKey, async () => {
        const existing = internalEditStateRecordsByKey.get(stateKey) ??
          await loadInternalEditStateRecord({
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            userId: access.userId,
            workspaceId: access.workspaceId,
            localStorageRoot: context.env.localStorageRoot,
          })
        if (!existing) {
          throw new ApiError('PROJECT_NOT_FOUND', 'The retained Storytelling edit was not found.', 404)
        }
        assertInternalEditStateWriteAllowed(existing, access.userId, access.workspaceId)
        const production = await readStorytellingProduction(
          context,
          dependencies,
          input.projectId,
          input.editSessionId,
        )
        const migrated = projectRetainedLegacyStorytellingWorkflowMigration({
          existing,
          expectedHandoffUpdatedAt: input.expectedHandoffUpdatedAt,
          idempotencyKey: input.idempotencyKey,
          now: nowIso(),
          production,
        })
        await persistInternalEditStateRecord({
          internalEditState: migrated.internalEditState,
          localStorageRoot: context.env.localStorageRoot,
        })
        internalEditStateRecordsByKey.set(stateKey, migrated.internalEditState)
        const reread = await loadInternalEditStateRecord({
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          userId: access.userId,
          workspaceId: access.workspaceId,
          localStorageRoot: context.env.localStorageRoot,
        })
        if (
          !reread ||
          canonicalPayloadHash(reread.handoff) !== canonicalPayloadHash(migrated.internalEditState.handoff) ||
          reread.storytellingWorkflowMigration?.receiptDigest !== migrated.receipt.receiptDigest
        ) {
          throw new ApiError('INTERNAL_ERROR', 'The migrated Storytelling workflow could not be re-read exactly.', 500, undefined, { internal: true })
        }
        return {
          internalEditState: reread,
          migrationReceipt: reread.storytellingWorkflowMigration,
          warnings: [
            mockWarning('Retained Storytelling workflow migration'),
            'The migration only persisted the explicit workflow discriminator after exact production revalidation. It started no provider, generation, billing, render, or delivery work.',
          ],
        }
      })
    },

    async getInternalEditState(workspaceId: string, projectId: string, editSessionId?: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      await assertInternalEditStateProjectOwnedByCurrentUser(context, projectId, access.workspaceId)
      const userId = access.userId
      const cached = getCachedInternalEditState(userId, access.workspaceId, projectId, editSessionId)
      const internalEditState = cached ??
        await loadInternalEditStateRecord({
          projectId,
          editSessionId,
          userId,
          workspaceId: access.workspaceId,
          localStorageRoot: context.env.localStorageRoot,
        })
      if (!internalEditState) {
        throw new ApiError('PROJECT_NOT_FOUND', 'Internal edit state was not found for this project.', 404)
      }
      if (internalEditState.userId !== userId) {
        throw new ApiError('PROJECT_NOT_FOUND', 'Internal edit state was not found for this user.', 404)
      }
      assertInternalEditStateReadAllowed(internalEditState, userId, access.workspaceId)
      internalEditStateRecordsByKey.set(internalEditStateMemoryKey(
        userId,
        access.workspaceId,
        internalEditState.projectId,
        internalEditState.editSessionId,
      ), internalEditState)
      return {
        internalEditState,
        warnings: [mockWarning('Internal edit state read')],
      }
    },

    async listInternalEditStates(workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      const userId = access.userId
      const records = await listInternalEditStateRecords({
        localStorageRoot: context.env.localStorageRoot,
        userId,
        workspaceId: access.workspaceId,
      })
      for (const record of records) {
        internalEditStateRecordsByKey.set(internalEditStateMemoryKey(
          userId,
          access.workspaceId,
          record.projectId,
          record.editSessionId,
        ), record)
      }
      const authorizedRecords: InternalEditStateRecord[] = []
      for (const record of records) {
        assertInternalEditStateReadAllowed(record, userId, access.workspaceId)
        try {
          await assertInternalEditStateProjectOwnedByCurrentUser(context, record.projectId, access.workspaceId)
          authorizedRecords.push(record)
        } catch (error) {
          if (error instanceof ApiError && error.code === 'PROJECT_NOT_FOUND') continue
          throw error
        }
      }
      const internalEditStates = authorizedRecords.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

      return {
        internalEditStates,
        warnings: [
          mockWarning('Internal edit state list'),
          'Internal edit state listing uses private internal-test registry metadata only.',
        ],
      }
    },
  }
}

async function initializeExactEditPreferences(
  context: ServiceContext,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
  ownerUserId: string,
): Promise<{ created: boolean; deferred: false }> {
  const exactEditPreferenceService = createExactEditPreferenceService(context)
  const current = await exactEditPreferenceService.getCurrent(workspaceId, projectId, editSessionId)
  if (current.preferenceRecord) return { created: false, deferred: false }

  const initialized = await exactEditPreferenceService.initialize({
    workspaceId,
    projectId,
    editSessionId,
    idempotencyKey: exactEditPreferenceInitializationKey({
      ownerUserId,
      workspaceId,
      projectId,
      editSessionId,
    }),
  })
  return { created: initialized.created, deferred: false }
}

function exactEditPreferenceInitializationKey(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
  return `internal-edit-create-exact-preferences:${digest}`
}

async function persistInternalEditStateRecord(input: {
  internalEditState: InternalEditStateRecord
  localStorageRoot: string
}): Promise<void> {
  assertInternalEditStateRecordSafe(input.internalEditState)
  const objectPath = internalEditStateObjectRelativePath(
    input.internalEditState.userId,
    input.internalEditState.workspaceId,
    input.internalEditState.projectId,
    input.internalEditState.editSessionId,
  )
  const recordWithoutChecksum = {
    recordVersion: 'private-internal-edit-state-v2' as const,
    source: 'frontend_scoped_internal_project_handoff' as const,
    persistedAt: nowIso(),
    internalEditState: input.internalEditState,
  }
  const persistedRecord: PersistedInternalEditStateRecord = {
    ...recordWithoutChecksum,
    recordChecksumSha256: checksumInternalEditStateRecord(recordWithoutChecksum),
  }
  const content = `${JSON.stringify(persistedRecord, null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: objectPath,
    content,
  })
}

async function loadInternalEditStateRecord(input: {
  projectId: string
  editSessionId?: string
  userId: string
  workspaceId: string
  localStorageRoot: string
}): Promise<InternalEditStateRecord | undefined> {
  if (!input.editSessionId) {
    const records = await listInternalEditStateRecords({
      localStorageRoot: input.localStorageRoot,
      userId: input.userId,
      workspaceId: input.workspaceId,
    })
    return records
      .filter((record) => record.projectId === input.projectId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  }

  const objectPath = internalEditStateObjectRelativePath(
    input.userId,
    input.workspaceId,
    input.projectId,
    input.editSessionId,
  )
  const localContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: objectPath,
  })
  if (localContent) return parseInternalEditStateRecord(
    localContent,
    input.userId,
    input.workspaceId,
    input.projectId,
    input.editSessionId,
  )

  return undefined
}

async function listInternalEditStateRecords(input: {
  localStorageRoot: string
  userId: string
  workspaceId: string
}): Promise<InternalEditStateRecord[]> {
  const registryDirectory = internalEditStateRegistryDirectoryRelativePath(input.userId, input.workspaceId)
  const fileNames = await listPrivateRegularFileNamesWithinRoot({
    rootPath: input.localStorageRoot,
    relativeDirectoryPath: registryDirectory,
  })

  const records: InternalEditStateRecord[] = []
  for (const fileName of fileNames) {
    if (!fileName.endsWith('.json')) continue
    const content = await readPrivateTextFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: `${registryDirectory}/${fileName}`,
    })
    if (!content) continue
    records.push(parseInternalEditStateRecord(content, input.userId, input.workspaceId))
  }
  return records
}

function parseInternalEditStateRecord(
  content: string,
  expectedUserId: string,
  expectedWorkspaceId: string,
  expectedProjectId?: string,
  expectedEditSessionId?: string,
): InternalEditStateRecord {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry record is not valid JSON.', 400)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry record is not an object.', 400)
  }

  const record = parsed as Partial<PersistedInternalEditStateRecord>
  if (
    record.recordVersion !== 'private-internal-edit-state-v2' ||
    record.source !== 'frontend_scoped_internal_project_handoff' ||
    !record.internalEditState ||
    typeof record.recordChecksumSha256 !== 'string'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry record has an unsupported shape.', 400)
  }
  const expectedChecksum = checksumInternalEditStateRecord({
    recordVersion: record.recordVersion,
    source: record.source,
    persistedAt: record.persistedAt ?? '',
    internalEditState: record.internalEditState,
  })
  if (record.recordChecksumSha256 !== expectedChecksum) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry checksum is invalid.', 400)
  }
  assertInternalEditStateReadAllowed(record.internalEditState, expectedUserId, expectedWorkspaceId)
  if (expectedProjectId && record.internalEditState.projectId !== expectedProjectId) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry project ID does not match the requested project.', 400)
  }
  if (expectedEditSessionId && record.internalEditState.editSessionId !== expectedEditSessionId) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry edit session ID does not match the requested edit.', 400)
  }
  assertInternalEditStateRecordSafe(record.internalEditState)
  return record.internalEditState
}

function assertInternalEditStateHandoffSafe(
  input: SaveInternalEditStateInput,
  options: { allowRetainedLegacyMigrationCandidate?: boolean } = {},
): void {
  const handoff = input.handoff as {
    workspaceId?: unknown
    projectId?: unknown
    editSessionId?: unknown
    editorPath?: unknown
    productWorkflow?: unknown
    persistence?: unknown
    updatedAt?: unknown
  }
  if (
    handoff.workspaceId !== input.workspaceId ||
    handoff.projectId !== input.projectId ||
    handoff.editSessionId !== input.editSessionId ||
    !isValidIsoTimestamp(handoff.updatedAt)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state handoff must match the project and edit session.', 400)
  }
  if (handoff.persistence !== 'browser_local_internal_testing') {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state only accepts browser local internal-testing handoff records.', 400)
  }
  if (
    handoff.productWorkflow !== undefined &&
    handoff.productWorkflow !== 'video_edit' &&
    handoff.productWorkflow !== 'motion_studio.storytelling'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state contains an unsupported product workflow.', 400)
  }
  const routeMatchesWorkflow = typeof handoff.editorPath === 'string' && internalEditPathMatchesProductWorkflow({
    editSessionId: input.editSessionId,
    editorPath: handoff.editorPath,
    productWorkflow: handoff.productWorkflow,
    projectId: input.projectId,
  })
  const retainedLegacyCandidate = options.allowRetainedLegacyMigrationCandidate === true &&
    isRetainedLegacyMotionStudioStorytellingMigrationCandidate(asWorkflowHandoff(input.handoff))
  if (!routeMatchesWorkflow && !retainedLegacyCandidate) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state route does not match its product workflow.', 400)
  }
  const unsafePaths = findUnsafeInternalEditStatePaths(input.handoff)
  if (unsafePaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state contains unsafe secret, signed URL, public artifact, blob URL, or data URL fields.', 400, {
      unsafePaths,
    })
  }
}

function internalEditPathMatchesProductWorkflow(input: {
  editSessionId: string
  editorPath: string
  productWorkflow: unknown
  projectId: string
}): boolean {
  const isMotionStudioStorytelling = input.productWorkflow === 'motion_studio.storytelling'
  const basePath = isMotionStudioStorytelling
    ? `/motion-studio/storytelling/projects/${encodeURIComponent(input.projectId)}/edits/${encodeURIComponent(input.editSessionId)}`
    : `/projects/${encodeURIComponent(input.projectId)}/edits/${encodeURIComponent(input.editSessionId)}`

  return isMotionStudioStorytelling
    ? input.editorPath === basePath
    : input.editorPath === basePath || input.editorPath.startsWith(`${basePath}?`)
}

function compareHandoffSourceRevision(
  incomingHandoff: Record<string, unknown>,
  existingHandoff: Record<string, unknown>,
): number {
  const incoming = requiredHandoffUpdatedAt(incomingHandoff)
  const existing = requiredHandoffUpdatedAt(existingHandoff)
  return incoming.localeCompare(existing)
}

function requiredHandoffUpdatedAt(handoff: Record<string, unknown>): string {
  const value = handoff.updatedAt
  if (!isValidIsoTimestamp(value)) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state requires a valid handoff updatedAt source revision.', 400)
  }
  return value
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
}

function canonicalPayloadHash(value: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function assertInternalEditStateRecordSafe(record: InternalEditStateRecord): void {
  if (
    record.recordVersion !== 'private-internal-edit-state-v2' ||
    record.source !== 'frontend_scoped_internal_project_handoff' ||
    !record.workspaceId.trim() ||
    !record.projectId.trim() ||
    !record.editSessionId.trim() ||
    !record.userId.trim() ||
    record.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state registry metadata is incomplete.', 400)
  }
  assertInternalEditStateHandoffSafe({
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    idempotencyKey: 'registry-validation',
    handoff: record.handoff,
  }, {
    allowRetainedLegacyMigrationCandidate: !record.storytellingWorkflowMigration,
  })
  if (record.storytellingWorkflowMigration) {
    assertStorytellingWorkflowMigrationReceipt(record)
  }
}

export function projectRetainedLegacyStorytellingWorkflowMigration(input: {
  existing: InternalEditStateRecord
  expectedHandoffUpdatedAt: string
  idempotencyKey: string
  now: string
  production: StorytellingProductionIdentity
}): {
  internalEditState: InternalEditStateRecord
  receipt: InternalEditStateStorytellingWorkflowMigrationReceipt
} {
  const requestHash = canonicalPayloadHash({
    workspaceId: input.existing.workspaceId,
    projectId: input.existing.projectId,
    editSessionId: input.existing.editSessionId,
    expectedHandoffUpdatedAt: input.expectedHandoffUpdatedAt,
  })
  const idempotencyKeyHash = sha256(input.idempotencyKey)
  const existingReceipt = input.existing.storytellingWorkflowMigration
  if (existingReceipt) {
    if (
      existingReceipt.requestHash !== requestHash ||
      existingReceipt.idempotencyKeyHash !== idempotencyKeyHash ||
      existingReceipt.sourceHandoffUpdatedAt !== input.expectedHandoffUpdatedAt
    ) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Storytelling workflow migration replay did not match the committed request.', 409)
    }
    if (
      existingReceipt.productionId !== input.production.id ||
      !isExactMotionStudioStorytellingProductionTuple(input.existing, input.production)
    ) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Storytelling workflow migration production authority changed after commit.', 409)
    }
    assertInternalEditStateRecordSafe(input.existing)
    return { internalEditState: input.existing, receipt: existingReceipt }
  }

  const handoff = asWorkflowHandoff(input.existing.handoff)
  if (!isRetainedLegacyMotionStudioStorytellingMigrationCandidate(handoff)) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Only an exact retained pre-discriminator Storytelling record may use this migration.', 409)
  }
  if (handoff.updatedAt !== input.expectedHandoffUpdatedAt) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'The retained Storytelling record changed before migration.', 409)
  }
  if (!isExactMotionStudioStorytellingProductionTuple(handoff, input.production)) {
    throw new ApiError('VALIDATION_FAILED', 'The canonical Storytelling production did not match the retained Project and Named Edit.', 400)
  }

  const migratedHandoffUpdatedAt = nextServerTimestamp(input.expectedHandoffUpdatedAt, input.now)
  const editorPath = motionStudioStorytellingWorkspaceRoute(
    input.existing.projectId,
    input.existing.editSessionId,
  )
  const migratedHandoff: Record<string, unknown> = {
    ...input.existing.handoff,
    productWorkflow: 'motion_studio.storytelling',
    editorPath,
    updatedAt: migratedHandoffUpdatedAt,
  }
  const receiptWithoutDigest = {
    recordVersion: 'internal-edit-state-storytelling-workflow-migration-v1' as const,
    sourceHandoffUpdatedAt: input.expectedHandoffUpdatedAt,
    migratedHandoffUpdatedAt,
    productWorkflow: 'motion_studio.storytelling' as const,
    editorPath,
    productionId: input.production.id,
    productionRecordVersion: input.production.recordVersion,
    productionUpdatedAt: input.production.updatedAt,
    productionAuthorityHash: canonicalPayloadHash({
      productionId: input.production.id,
      projectId: input.production.projectId,
      editSessionId: input.production.editSessionId,
      moduleId: input.production.moduleId,
      moduleCatalogVersion: input.production.moduleCatalogVersion,
      stageProfileId: input.production.stageProfileId,
      recordVersion: input.production.recordVersion,
      updatedAt: input.production.updatedAt,
    }),
    requestHash,
    idempotencyKeyHash,
    providerCalled: false as const,
    generationStarted: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
  }
  const receipt: InternalEditStateStorytellingWorkflowMigrationReceipt = {
    ...receiptWithoutDigest,
    receiptDigest: canonicalPayloadHash(receiptWithoutDigest),
  }
  const internalEditState: InternalEditStateRecord = {
    ...input.existing,
    handoff: migratedHandoff,
    storytellingWorkflowMigration: receipt,
    updatedAt: migratedHandoffUpdatedAt,
  }
  assertInternalEditStateRecordSafe(internalEditState)
  return { internalEditState, receipt }
}

async function readStorytellingProduction(
  context: ServiceContext,
  dependencies: InternalEditStateServiceDependencies,
  projectId: string,
  editSessionId: string,
): Promise<StorytellingProductionIdentity> {
  if (dependencies.readStorytellingProduction) {
    return dependencies.readStorytellingProduction(projectId, editSessionId)
  }
  const result = await createMotionStudioCommandService(context).getProduction(projectId, editSessionId)
  return result.data.production
}

function asWorkflowHandoff(value: Record<string, unknown>): {
  editorPath: unknown
  editSessionId: string
  productWorkflow?: unknown
  projectId: string
  updatedAt?: unknown
} {
  return value as {
    editorPath: unknown
    editSessionId: string
    productWorkflow?: unknown
    projectId: string
    updatedAt?: unknown
  }
}

function nextServerTimestamp(previous: string, now: string): string {
  if (!isValidIsoTimestamp(previous) || !isValidIsoTimestamp(now)) {
    throw new ApiError('VALIDATION_FAILED', 'Storytelling workflow migration timestamps are invalid.', 400)
  }
  return new Date(Math.max(Date.parse(now), Date.parse(previous) + 1)).toISOString()
}

function assertStorytellingWorkflowMigrationReceipt(record: InternalEditStateRecord): void {
  const receipt = record.storytellingWorkflowMigration
  const handoff = asWorkflowHandoff(record.handoff)
  if (
    !receipt ||
    receipt.recordVersion !== 'internal-edit-state-storytelling-workflow-migration-v1' ||
    receipt.productWorkflow !== 'motion_studio.storytelling' ||
    handoff.productWorkflow !== receipt.productWorkflow ||
    handoff.editorPath !== receipt.editorPath ||
    handoff.updatedAt !== receipt.migratedHandoffUpdatedAt ||
    record.updatedAt !== receipt.migratedHandoffUpdatedAt ||
    receipt.editorPath !== motionStudioStorytellingWorkspaceRoute(record.projectId, record.editSessionId) ||
    receipt.requestHash !== canonicalPayloadHash({
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      editSessionId: record.editSessionId,
      expectedHandoffUpdatedAt: receipt.sourceHandoffUpdatedAt,
    }) ||
    !receipt.productionId.trim() ||
    receipt.providerCalled !== false ||
    receipt.generationStarted !== false ||
    receipt.customerCommercialAuthorityGranted !== false ||
    receipt.productionReady !== false ||
    !isValidIsoTimestamp(receipt.sourceHandoffUpdatedAt) ||
    !isValidIsoTimestamp(receipt.migratedHandoffUpdatedAt) ||
    !isValidIsoTimestamp(receipt.productionUpdatedAt) ||
    !Number.isSafeInteger(receipt.productionRecordVersion) ||
    receipt.productionRecordVersion < 1 ||
    Date.parse(receipt.migratedHandoffUpdatedAt) <= Date.parse(receipt.sourceHandoffUpdatedAt) ||
    !/^[a-f0-9]{64}$/u.test(receipt.requestHash) ||
    !/^[a-f0-9]{64}$/u.test(receipt.idempotencyKeyHash) ||
    !/^[a-f0-9]{64}$/u.test(receipt.productionAuthorityHash) ||
    receipt.receiptDigest !== canonicalPayloadHash({
      ...receipt,
      receiptDigest: undefined,
    })
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Storytelling workflow migration receipt is invalid.', 400)
  }
}

function assertInternalEditStateReadAllowed(
  record: InternalEditStateRecord,
  userId: string,
  workspaceId: string,
): void {
  if (record.userId !== userId || record.workspaceId !== workspaceId) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Internal edit state was not found in this workspace.', 404)
  }
}

function assertInternalEditStateWriteAllowed(
  existing: InternalEditStateRecord,
  userId: string,
  workspaceId: string,
): void {
  if (existing.userId !== userId) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Internal edit state was not found for this user.', 404)
  }
  if (existing.workspaceId !== workspaceId) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state workspace cannot be changed after creation.', 400)
  }
}

async function assertInternalEditStateProjectOwnedByCurrentUser(
  context: ServiceContext,
  projectId: string,
  workspaceId: string,
): Promise<void> {
  const result = await createProjectService(context).getProject(projectId, workspaceId)
  const projectWorkspaceId = getProjectWorkspaceId(result.project)
  if (projectWorkspaceId !== workspaceId) {
    throw new ApiError('VALIDATION_FAILED', 'Internal edit state workspace must match the owned project workspace.', 400, {
      projectId,
      workspaceId,
      projectWorkspaceId,
    })
  }
}

function getProjectWorkspaceId(project: unknown): string | undefined {
  if (!project || typeof project !== 'object') return undefined
  const record = project as { workspaceId?: unknown; workspace_id?: unknown }
  if (typeof record.workspaceId === 'string') return record.workspaceId
  if (typeof record.workspace_id === 'string') return record.workspace_id
  return undefined
}

function findUnsafeInternalEditStatePaths(value: unknown, path = '$'): string[] {
  const unsafe: string[] = []
  if (typeof value === 'string') {
    if (isUnsafeInternalEditStateString(value)) unsafe.push(path)
    return unsafe
  }
  if (!value || typeof value !== 'object') return unsafe
  if (Array.isArray(value)) {
    value.forEach((item, index) => unsafe.push(...findUnsafeInternalEditStatePaths(item, `${path}[${index}]`)))
    return unsafe
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (isUnsafeInternalEditStateKey(key) && nested !== null && nested !== undefined && nested !== '') {
      unsafe.push(`${path}.${key}`)
    }
    unsafe.push(...findUnsafeInternalEditStatePaths(nested, `${path}.${key}`))
  }
  return unsafe
}

function isUnsafeInternalEditStateKey(key: string): boolean {
  return /(password|secret|service_role|api[_-]?key|access[_-]?token|refresh[_-]?token|credential|signed[_-]?url|public[_-]?url)$/i.test(key)
}

function isUnsafeInternalEditStateString(value: string): boolean {
  return /x-goog-signature=|x-amz-signature=|supabase_service_role|service_role|sk-[a-z0-9]|eyJ[a-zA-Z0-9_-]{20,}|^blob:|^data:/i.test(value)
}

export function internalEditStateRegistryDirectoryRelativePath(userId: string, workspaceId: string): string {
  return [
    'projects',
    'private-internal-edit-state-registry-v2',
    `user-${sha256(userId)}`,
    `workspace-${sha256(workspaceId)}`,
  ].join('/')
}

function getCachedInternalEditState(
  userId: string,
  workspaceId: string,
  projectId: string,
  editSessionId?: string,
): InternalEditStateRecord | undefined {
  if (editSessionId) {
    return internalEditStateRecordsByKey.get(internalEditStateMemoryKey(userId, workspaceId, projectId, editSessionId))
  }
  return [...internalEditStateRecordsByKey.values()]
    .filter((record) =>
      record.userId === userId && record.workspaceId === workspaceId && record.projectId === projectId,
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
}

export function internalEditStateObjectRelativePath(
  userId: string,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): string {
  return `${internalEditStateRegistryDirectoryRelativePath(userId, workspaceId)}/project-${sha256(projectId)}--edit-${sha256(editSessionId)}.json`
}

function internalEditStateMemoryKey(
  userId: string,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): string {
  return `${userId}\u0000${workspaceId}\u0000${projectId}\u0000${editSessionId}`
}

async function withInternalEditStateWriteLock<T>(
  stateKey: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = internalEditStateWriteTails.get(stateKey) ?? Promise.resolve()
  let release!: () => void
  const currentLock = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => currentLock)
  internalEditStateWriteTails.set(stateKey, tail)
  await previous.catch(() => undefined)

  try {
    return await operation()
  } finally {
    release()
    if (internalEditStateWriteTails.get(stateKey) === tail) {
      internalEditStateWriteTails.delete(stateKey)
    }
  }
}

function checksumInternalEditStateRecord(
  value: Omit<PersistedInternalEditStateRecord, 'recordChecksumSha256'>,
): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
