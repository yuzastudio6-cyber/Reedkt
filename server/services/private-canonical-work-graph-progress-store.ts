import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  canonicalPrivateWorkGraphProgressCheckpointSchema,
  type CanonicalPrivateWorkGraphProgressCheckpoint,
  type CanonicalPrivateWorkGraphProgressCheckpointDraft,
} from '../validation/canonical-private-work-graph-progress-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const CHECKPOINT_RECORD_VERSION = 'private-canonical-work-graph-progress-record-v1' as const
const CHECKPOINT_RECORD_SOURCE = 'private_canonical_work_graph_progress_store' as const
const LATEST_POINTER_VERSION = 'private-canonical-work-graph-progress-latest-v1' as const
const LATEST_POINTER_SOURCE = 'private_canonical_work_graph_progress_latest_pointer' as const
const MAX_CHECKPOINT_BYTES = 64 * 1024
const MAX_POINTER_BYTES = 16 * 1024
const progressLocks = new Map<string, Promise<void>>()

export interface CanonicalWorkGraphProgressStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

interface PersistedWorkGraphProgressCheckpoint {
  recordVersion: typeof CHECKPOINT_RECORD_VERSION
  source: typeof CHECKPOINT_RECORD_SOURCE
  ownerUserId: string
  checkpoint: CanonicalPrivateWorkGraphProgressCheckpoint
  checksumSha256: string
}

interface PersistedLatestWorkGraphProgressPointer {
  recordVersion: typeof LATEST_POINTER_VERSION
  source: typeof LATEST_POINTER_SOURCE
  identity: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    packageRecordId: string
    approvedPlanSnapshotId: string
  }
  checkpointHash: string
  checkpointSequence: number
  updatedAt: string
  checksumSha256: string
}

export async function persistPrivateCanonicalWorkGraphProgress(input: {
  scope: CanonicalWorkGraphProgressStoreScope
  draft: CanonicalPrivateWorkGraphProgressCheckpointDraft
}): Promise<{ checkpoint: CanonicalPrivateWorkGraphProgressCheckpoint; created: boolean }> {
  assertStoreScope(input.scope)
  assertDraftScope(input.scope, input.draft)
  const pointerPath = latestPointerPath(input.scope)
  return withProgressLock(pointerPath, async () => {
    const existing = await readLatestPrivateCanonicalWorkGraphProgress(input.scope)
    if (existing && !isMonotonicAdvance(existing, input.draft)) {
      return { checkpoint: existing, created: false }
    }

    const checkpointWithoutHash = {
      ...input.draft,
      checkpointSequence: (existing?.checkpointSequence ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    const checkpoint = canonicalPrivateWorkGraphProgressCheckpointSchema.parse({
      ...checkpointWithoutHash,
      checkpointHash: sha256AuthorityValue(checkpointWithoutHash),
    })
    assertCheckpointScope(input.scope, checkpoint)

    const record: PersistedWorkGraphProgressCheckpoint = {
      recordVersion: CHECKPOINT_RECORD_VERSION,
      source: CHECKPOINT_RECORD_SOURCE,
      ownerUserId: input.scope.ownerUserId,
      checkpoint,
      checksumSha256: sha256AuthorityValue(checkpoint),
    }
    const recordContent = `${stableAuthorityStringify(record)}\n`
    assertByteCeiling(
      recordContent,
      MAX_CHECKPOINT_BYTES,
      'Canonical work-graph progress checkpoint exceeded its private persistence ceiling.',
    )
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: checkpointRecordPath(input.scope, checkpoint.checkpointHash),
      content: Buffer.from(recordContent, 'utf8'),
    })

    const pointerWithoutChecksum = {
      recordVersion: LATEST_POINTER_VERSION,
      source: LATEST_POINTER_SOURCE,
      identity: pointerIdentity(input.scope),
      checkpointHash: checkpoint.checkpointHash,
      checkpointSequence: checkpoint.checkpointSequence,
      updatedAt: checkpoint.updatedAt,
    }
    const pointer: PersistedLatestWorkGraphProgressPointer = {
      ...pointerWithoutChecksum,
      checksumSha256: sha256AuthorityValue(pointerWithoutChecksum),
    }
    const pointerContent = `${stableAuthorityStringify(pointer)}\n`
    assertByteCeiling(
      pointerContent,
      MAX_POINTER_BYTES,
      'Latest canonical work-graph progress pointer exceeded its private persistence ceiling.',
    )
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: pointerPath,
      content: pointerContent,
    })

    const persisted = await readLatestPrivateCanonicalWorkGraphProgress(input.scope)
    if (!persisted || persisted.checkpointHash !== checkpoint.checkpointHash) {
      throw invalidProgress('Latest canonical work-graph progress pointer did not reopen its exact checkpoint.')
    }
    return { checkpoint: persisted, created: true }
  })
}

export async function readLatestPrivateCanonicalWorkGraphProgress(
  scope: CanonicalWorkGraphProgressStoreScope,
): Promise<CanonicalPrivateWorkGraphProgressCheckpoint | undefined> {
  assertStoreScope(scope)
  const pointerContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: latestPointerPath(scope),
  })
  if (!pointerContent) return undefined
  assertByteCeiling(
    pointerContent,
    MAX_POINTER_BYTES,
    'Latest canonical work-graph progress pointer exceeded its private persistence ceiling.',
    true,
  )

  const pointerValue = parseStoredJson(
    pointerContent,
    'Latest canonical work-graph progress pointer is not valid JSON.',
  )
  const pointer = pointerValue as Partial<PersistedLatestWorkGraphProgressPointer>
  const pointerWithoutChecksum = {
    recordVersion: pointer.recordVersion,
    source: pointer.source,
    identity: pointer.identity,
    checkpointHash: pointer.checkpointHash,
    checkpointSequence: pointer.checkpointSequence,
    updatedAt: pointer.updatedAt,
  }
  if (
    pointer.recordVersion !== LATEST_POINTER_VERSION ||
    pointer.source !== LATEST_POINTER_SOURCE ||
    stableAuthorityStringify(pointer.identity) !== stableAuthorityStringify(pointerIdentity(scope)) ||
    typeof pointer.checkpointHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(pointer.checkpointHash) ||
    typeof pointer.checkpointSequence !== 'number' ||
    !Number.isSafeInteger(pointer.checkpointSequence) ||
    pointer.checkpointSequence <= 0 ||
    typeof pointer.updatedAt !== 'string' ||
    typeof pointer.checksumSha256 !== 'string' ||
    pointer.checksumSha256 !== sha256AuthorityValue(pointerWithoutChecksum)
  ) {
    throw invalidProgress('Latest canonical work-graph progress pointer integrity is invalid.')
  }

  const checkpointContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: checkpointRecordPath(scope, pointer.checkpointHash),
  })
  if (!checkpointContent) {
    throw invalidProgress('Latest canonical work-graph progress checkpoint target is missing.')
  }
  assertByteCeiling(
    checkpointContent,
    MAX_CHECKPOINT_BYTES,
    'Canonical work-graph progress checkpoint exceeded its private persistence ceiling.',
    true,
  )
  const checkpointValue = parseStoredJson(
    checkpointContent,
    'Canonical work-graph progress checkpoint is not valid JSON.',
  )
  const record = checkpointValue as Partial<PersistedWorkGraphProgressCheckpoint>
  const parsedCheckpoint = canonicalPrivateWorkGraphProgressCheckpointSchema.safeParse(record.checkpoint)
  if (
    record.recordVersion !== CHECKPOINT_RECORD_VERSION ||
    record.source !== CHECKPOINT_RECORD_SOURCE ||
    record.ownerUserId !== scope.ownerUserId ||
    typeof record.checksumSha256 !== 'string' ||
    !parsedCheckpoint.success ||
    record.checksumSha256 !== sha256AuthorityValue(parsedCheckpoint.data)
  ) {
    throw invalidProgress('Canonical work-graph progress checkpoint integrity is invalid.')
  }
  const checkpoint = parsedCheckpoint.data
  const { checkpointHash, ...withoutHash } = checkpoint
  if (
    checkpointHash !== sha256AuthorityValue(withoutHash) ||
    checkpointHash !== pointer.checkpointHash ||
    checkpoint.checkpointSequence !== pointer.checkpointSequence ||
    checkpoint.updatedAt !== pointer.updatedAt
  ) {
    throw invalidProgress('Latest canonical work-graph progress pointer target is inconsistent.')
  }
  assertCheckpointScope(scope, checkpoint)
  return checkpoint
}

function isMonotonicAdvance(
  existing: CanonicalPrivateWorkGraphProgressCheckpoint,
  draft: CanonicalPrivateWorkGraphProgressCheckpointDraft,
): boolean {
  if (existing.summary.totalJobCount !== draft.summary.totalJobCount) {
    throw invalidProgress('Canonical work-graph progress job total changed for one execution package.')
  }
  if (draft.summary.completedJobCount !== existing.summary.completedJobCount) {
    return draft.summary.completedJobCount > existing.summary.completedJobCount
  }
  const existingResolved = resolvedJobCount(existing.summary)
  const draftResolved = resolvedJobCount(draft.summary)
  if (draftResolved !== existingResolved) return draftResolved > existingResolved
  return draft.runFinished && !existing.runFinished
}

function resolvedJobCount(summary: {
  completedJobCount: number
  capabilityBlockedJobCount: number
  dependencyBlockedJobCount: number
}): number {
  return summary.completedJobCount +
    summary.capabilityBlockedJobCount +
    summary.dependencyBlockedJobCount
}

function assertDraftScope(
  scope: CanonicalWorkGraphProgressStoreScope,
  draft: CanonicalPrivateWorkGraphProgressCheckpointDraft,
): void {
  if (
    draft.schemaVersion !== 'canonical-private-work-graph-progress-checkpoint-v1' ||
    draft.source !== 'canonical_private_work_graph_orchestrator' ||
    stableAuthorityStringify(draft.identity) !== stableAuthorityStringify(checkpointIdentity(scope))
  ) {
    throw invalidProgress('Canonical work-graph progress draft scope is invalid.')
  }
}

function assertCheckpointScope(
  scope: CanonicalWorkGraphProgressStoreScope,
  checkpoint: CanonicalPrivateWorkGraphProgressCheckpoint,
): void {
  if (stableAuthorityStringify(checkpoint.identity) !== stableAuthorityStringify(checkpointIdentity(scope))) {
    throw invalidProgress('Canonical work-graph progress checkpoint scope is invalid.')
  }
}

function assertStoreScope(scope: CanonicalWorkGraphProgressStoreScope): void {
  if (
    !scope.localStorageRoot.trim() ||
    !safeIdentity(scope.ownerUserId) ||
    !safeIdentity(scope.workspaceId) ||
    !safeIdentity(scope.projectId) ||
    !safeIdentity(scope.editSessionId) ||
    !safeIdentity(scope.packageRecordId) ||
    !safeIdentity(scope.approvedPlanSnapshotId)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work-graph progress persistence scope is invalid.', 400)
  }
}

function checkpointIdentity(scope: CanonicalWorkGraphProgressStoreScope) {
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    packageRecordId: scope.packageRecordId,
    approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
  }
}

function pointerIdentity(scope: CanonicalWorkGraphProgressStoreScope) {
  return {
    ownerUserId: scope.ownerUserId,
    ...checkpointIdentity(scope),
  }
}

function checkpointRecordPath(
  scope: CanonicalWorkGraphProgressStoreScope,
  checkpointHash: string,
): string {
  return `${packageProgressRoot(scope)}/checkpoints/${checkpointHash}.json`
}

function latestPointerPath(scope: CanonicalWorkGraphProgressStoreScope): string {
  return `${packageProgressRoot(scope)}/latest.json`
}

function packageProgressRoot(scope: CanonicalWorkGraphProgressStoreScope): string {
  const tenantHash = sha256(`${scope.ownerUserId}\u0000${scope.workspaceId}`).slice(0, 32)
  const packageHash = sha256([
    tenantHash,
    scope.projectId,
    scope.editSessionId,
    scope.packageRecordId,
    scope.approvedPlanSnapshotId,
  ].join('\u0000'))
  return `private-internal/canonical-work-graph-runs/v1/${tenantHash}/package-progress/${packageHash}`
}

function parseStoredJson(content: string, message: string): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidProgress(message)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidProgress(message)
  }
  return value as Record<string, unknown>
}

function assertByteCeiling(
  content: string,
  maximumBytes: number,
  message: string,
  persisted = false,
): void {
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength <= maximumBytes) return
  if (persisted) throw invalidProgress(message)
  throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', message, 503, { byteLength, maximumBytes })
}

async function withProgressLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = progressLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  progressLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (progressLocks.get(key) === tail) progressLocks.delete(key)
  }
}

function invalidProgress(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
