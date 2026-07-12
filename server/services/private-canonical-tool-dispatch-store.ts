import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION,
  canonicalPrivateToolDispatchAggregateSchema,
  persistedCanonicalPrivateToolDispatchAggregateSchema,
  type CanonicalPrivateToolDispatchAggregate,
  type CanonicalPrivateToolDispatchRecord,
} from '../validation/canonical-private-tool-dispatch-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

export const MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_GRANTS = 4_096
export const MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_IDEMPOTENCY_RECORDS = 8_192
export const MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS = 16_384

const MAX_DISPATCH_AGGREGATE_BYTES = 16 * 1024 * 1024
const dispatchScopeLocks = new Map<string, Promise<void>>()

export interface CanonicalPrivateToolDispatchStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

type PersistedCanonicalPrivateToolDispatchAggregate = {
  recordVersion: typeof CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION
  source: 'private_single_host_canonical_tool_dispatch_store'
  aggregate: CanonicalPrivateToolDispatchAggregate
  checksumSha256: string
}

export function clearPrivateCanonicalToolDispatchProcessStateForSmoke(): void {
  dispatchScopeLocks.clear()
}

export async function readPrivateCanonicalToolDispatchAggregate(
  scope: CanonicalPrivateToolDispatchStoreScope,
): Promise<CanonicalPrivateToolDispatchAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivateToolDispatchAggregatePath(scope.ownerUserId, scope.workspaceId),
  })
  if (!content) return undefined
  return parsePersistedAggregate(content, scope)
}

export async function mutatePrivateCanonicalToolDispatchAggregate<T>(input: {
  scope: CanonicalPrivateToolDispatchStoreScope
  now: string
  mutation: (
    aggregate: CanonicalPrivateToolDispatchAggregate,
  ) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
}): Promise<T> {
  const lockKey = dispatchScopeHash(input.scope.ownerUserId, input.scope.workspaceId)
  return withProcessLock(dispatchScopeLocks, lockKey, async () => {
    const existing = await readPrivateCanonicalToolDispatchAggregate(input.scope)
    const aggregate = existing ?? createAggregate(input.scope, input.now)
    const before = existing ? structuredClone(existing) : undefined
    const mutationResult = await input.mutation(aggregate)
    if (!mutationResult.changed) return mutationResult.result

    assertAppendOnlyMutation(before, aggregate)
    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertAggregateValid(aggregate, input.scope)
    const persisted: PersistedCanonicalPrivateToolDispatchAggregate = {
      recordVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION,
      source: 'private_single_host_canonical_tool_dispatch_store',
      aggregate,
      checksumSha256: sha256AuthorityValue(aggregate),
    }
    const content = `${JSON.stringify(persisted)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_DISPATCH_AGGREGATE_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'Private canonical tool-dispatch authority reached its safe byte capacity.',
        503,
        { byteLength, maxBytes: MAX_DISPATCH_AGGREGATE_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: canonicalPrivateToolDispatchAggregatePath(
        input.scope.ownerUserId,
        input.scope.workspaceId,
      ),
      content,
    })
    return mutationResult.result
  })
}

export async function revokeUnconsumedSnapshotDispatchesForCancellation(input: {
  scope: CanonicalPrivateToolDispatchStoreScope
  snapshotId: string
  projectId: string
  editSessionId: string
  now: string
}): Promise<{
  dispatchRecordCount: number
  revokedDispatchCount: number
  expiredDispatchCount: number
  deniedDispatchCount: number
}> {
  return mutatePrivateCanonicalToolDispatchAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const grants = aggregate.grants.filter((grant) =>
        grant.binding.approvedPlanSnapshotId === input.snapshotId)
      if (grants.some((grant) =>
        grant.binding.projectId !== input.projectId ||
        grant.binding.editSessionId !== input.editSessionId ||
        grant.status === 'consumed')) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Cancellation cannot revoke a consumed dispatch grant or a grant whose scope changed.',
          409,
          { requiredGate: 'canonical_consumed_dispatch_cancellation_and_compensation' },
        )
      }
      const transitionCount = grants.filter((grant) => grant.status === 'authorized').length
      if (aggregate.auditEvents.length + transitionCount > MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private canonical tool-dispatch cancellation audit capacity was reached.',
          503,
        )
      }
      let changed = false
      for (const grant of grants) {
        if (grant.status !== 'authorized') continue
        const expired = Date.parse(grant.expiresAt) <= Date.parse(input.now)
        if (expired) {
          grant.status = 'expired'
          grant.expiredAt = input.now
        } else {
          grant.status = 'revoked'
          grant.revokedAt = input.now
        }
        aggregate.auditEvents.push({
          id: `tool_dispatch_audit_${randomUUID()}`,
          eventType: expired ? 'expired' : 'revoked',
          grantId: grant.id,
          jobId: grant.binding.jobId,
          approvedWorkItemId: grant.binding.approvedWorkItemId,
          expectedAssetId: grant.binding.expectedAssetId,
          canonicalToolId: grant.binding.canonicalToolId,
          operationId: grant.binding.operationId,
          leaseId: grant.binding.leaseId,
          leaseAttemptNumber: grant.binding.leaseAttemptNumber,
          createdAt: input.now,
        })
        changed = true
      }
      return {
        result: {
          dispatchRecordCount: grants.length,
          revokedDispatchCount: grants.filter((grant) => grant.status === 'revoked').length,
          expiredDispatchCount: grants.filter((grant) => grant.status === 'expired').length,
          deniedDispatchCount: grants.filter((grant) => grant.status === 'denied').length,
        },
        changed,
      }
    },
  })
}

export async function reconcileSnapshotDispatchesForCompensation(input: {
  scope: CanonicalPrivateToolDispatchStoreScope
  snapshotId: string
  projectId: string
  editSessionId: string
  now: string
}): Promise<{
  dispatchRecordCount: number
  revokedDispatchCount: number
  expiredDispatchCount: number
  deniedDispatchCount: number
  consumedDispatchCount: number
}> {
  return mutatePrivateCanonicalToolDispatchAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const grants = aggregate.grants.filter((grant) =>
        grant.binding.approvedPlanSnapshotId === input.snapshotId)
      if (grants.some((grant) =>
        grant.binding.projectId !== input.projectId ||
        grant.binding.editSessionId !== input.editSessionId)) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Post-dispatch compensation cannot reconcile a dispatch grant whose scope changed.',
          409,
        )
      }
      const transitionCount = grants.filter((grant) => grant.status === 'authorized').length
      if (aggregate.auditEvents.length + transitionCount > MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private canonical tool-dispatch compensation audit capacity was reached.',
          503,
        )
      }
      let changed = false
      for (const grant of grants) {
        if (grant.status !== 'authorized') continue
        const expired = Date.parse(grant.expiresAt) <= Date.parse(input.now)
        if (expired) {
          grant.status = 'expired'
          grant.expiredAt = input.now
        } else {
          grant.status = 'revoked'
          grant.revokedAt = input.now
        }
        aggregate.auditEvents.push({
          id: `tool_dispatch_audit_${randomUUID()}`,
          eventType: expired ? 'expired' : 'revoked',
          grantId: grant.id,
          jobId: grant.binding.jobId,
          approvedWorkItemId: grant.binding.approvedWorkItemId,
          expectedAssetId: grant.binding.expectedAssetId,
          canonicalToolId: grant.binding.canonicalToolId,
          operationId: grant.binding.operationId,
          leaseId: grant.binding.leaseId,
          leaseAttemptNumber: grant.binding.leaseAttemptNumber,
          createdAt: input.now,
        })
        changed = true
      }
      return {
        result: {
          dispatchRecordCount: grants.length,
          revokedDispatchCount: grants.filter((grant) => grant.status === 'revoked').length,
          expiredDispatchCount: grants.filter((grant) => grant.status === 'expired').length,
          deniedDispatchCount: grants.filter((grant) => grant.status === 'denied').length,
          consumedDispatchCount: grants.filter((grant) => grant.status === 'consumed').length,
        },
        changed,
      }
    },
  })
}

export function canonicalPrivateToolDispatchImmutableHash(
  record: Omit<CanonicalPrivateToolDispatchRecord, 'immutableGrantHash'>,
): string {
  return sha256AuthorityValue(immutableGrantState(record))
}

export function canonicalPrivateToolDispatchBindingHash(
  record: Pick<CanonicalPrivateToolDispatchRecord, 'binding'>,
): string {
  return sha256AuthorityValue({
    workspaceId: record.binding.workspaceId,
    projectId: record.binding.projectId,
    editSessionId: record.binding.editSessionId,
    approvedPlanSnapshotId: record.binding.approvedPlanSnapshotId,
    leaseId: record.binding.leaseId,
    leaseAttemptNumber: record.binding.leaseAttemptNumber,
    leaseImmutableHash: record.binding.leaseImmutableHash,
    jobId: record.binding.jobId,
    approvedWorkItemId: record.binding.approvedWorkItemId,
    expectedAssetId: record.binding.expectedAssetId,
    canonicalToolId: record.binding.canonicalToolId,
    operationId: record.binding.operationId,
    leaseDependencyAuthority: record.binding.leaseDependencyAuthority,
    leaseExecutionFenceState: record.binding.leaseExecutionFenceState,
    reservationId: record.binding.reservationId,
  })
}

function createAggregate(
  scope: CanonicalPrivateToolDispatchStoreScope,
  now: string,
): CanonicalPrivateToolDispatchAggregate {
  return {
    schemaVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION,
    source: 'private_single_host_canonical_tool_dispatch_authority',
    workspaceId: scope.workspaceId,
    ownerUserId: scope.ownerUserId,
    revision: 0,
    grants: [],
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parsePersistedAggregate(
  content: string,
  scope: CanonicalPrivateToolDispatchStoreScope,
): CanonicalPrivateToolDispatchAggregate {
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    throw invalidDispatchStore('Private canonical tool-dispatch aggregate is not valid JSON.')
  }
  const parsed = persistedCanonicalPrivateToolDispatchAggregateSchema.safeParse(raw)
  if (!parsed.success) {
    throw invalidDispatchStore('Private canonical tool-dispatch aggregate has an unsupported record shape.')
  }
  if (parsed.data.checksumSha256 !== sha256AuthorityValue(parsed.data.aggregate)) {
    throw invalidDispatchStore('Private canonical tool-dispatch aggregate checksum is invalid.')
  }
  assertAggregateValid(parsed.data.aggregate, scope)
  return parsed.data.aggregate
}

function assertAppendOnlyMutation(
  before: CanonicalPrivateToolDispatchAggregate | undefined,
  after: CanonicalPrivateToolDispatchAggregate,
): void {
  if (!before) return
  if (
    after.schemaVersion !== before.schemaVersion ||
    after.source !== before.source ||
    after.workspaceId !== before.workspaceId ||
    after.ownerUserId !== before.ownerUserId ||
    after.revision !== before.revision ||
    after.createdAt !== before.createdAt ||
    after.grants.length < before.grants.length ||
    after.idempotencyRecords.length < before.idempotencyRecords.length ||
    after.auditEvents.length < before.auditEvents.length ||
    stableAuthorityStringify(after.grants.slice(0, before.grants.length).map((record) => record.id)) !==
      stableAuthorityStringify(before.grants.map((record) => record.id)) ||
    stableAuthorityStringify(after.idempotencyRecords.slice(0, before.idempotencyRecords.length)) !==
      stableAuthorityStringify(before.idempotencyRecords) ||
    stableAuthorityStringify(after.auditEvents.slice(0, before.auditEvents.length)) !==
      stableAuthorityStringify(before.auditEvents)
  ) {
    throw invalidDispatchStore('Canonical tool-dispatch append-only records or tenant scope changed.')
  }
  for (const previousRecord of before.grants) {
    const currentRecord = after.grants.find((record) => record.id === previousRecord.id)
    if (!currentRecord) throw invalidDispatchStore('Canonical tool-dispatch grant was removed.')
    assertGrantTransition(previousRecord, currentRecord)
  }
}

function assertGrantTransition(
  previous: CanonicalPrivateToolDispatchRecord,
  current: CanonicalPrivateToolDispatchRecord,
): void {
  if (
    previous.immutableGrantHash !== current.immutableGrantHash ||
    stableAuthorityStringify(immutableGrantState(previous)) !==
      stableAuthorityStringify(immutableGrantState(current))
  ) {
    throw invalidDispatchStore('Canonical tool-dispatch immutable binding or decision changed.')
  }
  if (previous.status !== 'authorized') {
    if (stableAuthorityStringify(previous) !== stableAuthorityStringify(current)) {
      throw invalidDispatchStore('A terminal or denied dispatch grant cannot be changed.')
    }
    return
  }
  if (current.status === 'authorized') {
    if (stableAuthorityStringify(previous) !== stableAuthorityStringify(current)) {
      throw invalidDispatchStore('An active dispatch grant cannot be mutated in place.')
    }
    return
  }
  if (current.status === 'consumed') {
    if (
      current.consumedAt === undefined ||
      current.expiredAt !== undefined ||
      current.revokedAt !== undefined ||
      Date.parse(current.consumedAt) < Date.parse(current.issuedAt) ||
      Date.parse(current.consumedAt) > Date.parse(current.expiresAt)
    ) {
      throw invalidDispatchStore('Canonical tool-dispatch consumption transition is invalid.')
    }
    return
  }
  if (current.status === 'revoked') {
    if (
      current.revokedAt === undefined ||
      current.consumedAt !== undefined ||
      current.expiredAt !== undefined ||
      Date.parse(current.revokedAt) < Date.parse(current.issuedAt) ||
      Date.parse(current.revokedAt) > Date.parse(current.expiresAt)
    ) {
      throw invalidDispatchStore('Canonical tool-dispatch revocation transition is invalid.')
    }
    return
  }
  if (
    current.status !== 'expired' ||
    current.expiredAt === undefined ||
    current.consumedAt !== undefined ||
    current.revokedAt !== undefined ||
    Date.parse(current.expiredAt) < Date.parse(current.expiresAt)
  ) {
    throw invalidDispatchStore('Canonical tool-dispatch expiry transition is invalid.')
  }
}

function immutableGrantState(
  record: Omit<CanonicalPrivateToolDispatchRecord, 'immutableGrantHash'> |
    CanonicalPrivateToolDispatchRecord,
) {
  return {
    schemaVersion: record.schemaVersion,
    id: record.id,
    initialDecision: record.credentialHashSha256 ? 'authorized' : 'denied',
    binding: record.binding,
    authorityRevision: record.authorityRevision,
    canonicalHashes: record.canonicalHashes,
    toolOperationSpecHash: record.toolOperationSpecHash,
    runtimeEvidenceAuthorityHash: record.runtimeEvidenceAuthorityHash,
    runtimeEvidenceRecordHash: record.runtimeEvidenceRecordHash,
    privateRuntimeAuthorityHash: record.privateRuntimeAuthorityHash,
    privateRuntimeImageIdentityHash: record.privateRuntimeImageIdentityHash,
    specPrivateInternalReady: record.specPrivateInternalReady,
    runtimePrivateInternalReady: record.runtimePrivateInternalReady,
    specProductReady: record.specProductReady,
    runtimeProductReady: record.runtimeProductReady,
    exactOperationApproved: record.exactOperationApproved,
    offlineExecutionOnly: record.offlineExecutionOnly,
    decisionRequestHash: record.decisionRequestHash,
    credentialHashSha256: record.credentialHashSha256,
    blockers: record.blockers,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
  }
}

function assertAggregateValid(
  aggregate: CanonicalPrivateToolDispatchAggregate,
  scope: CanonicalPrivateToolDispatchStoreScope,
): void {
  const parsed = canonicalPrivateToolDispatchAggregateSchema.safeParse(aggregate)
  if (
    !parsed.success ||
    aggregate.workspaceId !== scope.workspaceId ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.grants.length > MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_GRANTS ||
    aggregate.idempotencyRecords.length > MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_IDEMPOTENCY_RECORDS ||
    aggregate.auditEvents.length > MAX_CANONICAL_PRIVATE_TOOL_DISPATCH_AUDIT_EVENTS
  ) {
    throw invalidDispatchStore('Private canonical tool-dispatch aggregate scope, shape, or capacity is invalid.')
  }
  assertUnique(aggregate.grants.map((record) => record.id), 'grant IDs')
  assertUnique(
    aggregate.idempotencyRecords.map((record) => `${record.operation}\u0000${record.keyHash}`),
    'operation-scoped idempotency key hashes',
  )
  assertUnique(aggregate.auditEvents.map((event) => event.id), 'audit event IDs')

  for (const record of aggregate.grants) {
    const { immutableGrantHash, ...recordWithoutHash } = record
    if (immutableGrantHash !== canonicalPrivateToolDispatchImmutableHash(recordWithoutHash)) {
      throw invalidDispatchStore('Canonical tool-dispatch immutable grant hash is invalid.')
    }
    if (record.binding.workspaceId !== aggregate.workspaceId) {
      throw invalidDispatchStore('Canonical tool-dispatch grant is outside its tenant aggregate.')
    }
    if (
      record.binding.leaseExecutionFenceState !== 'not_started' ||
      record.binding.leaseDependencyAuthority.liveRuntimeEligible !== false ||
      (
        record.binding.leaseDependencyAuthority.state === 'not_required_for_root_job' &&
        (
          record.binding.leaseDependencyAuthority.selectedArtifactCount !== 0 ||
          record.binding.leaseDependencyAuthority.selectedArtifactsHash !== sha256AuthorityValue([])
        )
      ) ||
      (
        record.binding.leaseDependencyAuthority.state === 'private_test_dependencies_verified' &&
        record.binding.leaseDependencyAuthority.selectedArtifactCount === 0
      )
    ) {
      throw invalidDispatchStore('Canonical tool-dispatch lease dependency or execution-fence binding is invalid.')
    }
  }
  for (const record of aggregate.idempotencyRecords) {
    if (!aggregate.grants.some((grant) => grant.id === record.grantId)) {
      throw invalidDispatchStore('Canonical tool-dispatch idempotency lineage is invalid.')
    }
  }
  for (const event of aggregate.auditEvents) {
    const grant = aggregate.grants.find((candidate) => candidate.id === event.grantId)
    if (
      !grant ||
      event.jobId !== grant.binding.jobId ||
      event.approvedWorkItemId !== grant.binding.approvedWorkItemId ||
      event.expectedAssetId !== grant.binding.expectedAssetId ||
      event.canonicalToolId !== grant.binding.canonicalToolId ||
      event.operationId !== grant.binding.operationId ||
      event.leaseId !== grant.binding.leaseId ||
      event.leaseAttemptNumber !== grant.binding.leaseAttemptNumber
    ) {
      throw invalidDispatchStore('Canonical tool-dispatch audit lineage is invalid.')
    }
  }
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw invalidDispatchStore(`Private canonical tool-dispatch aggregate contains duplicate ${label}.`)
  }
}

function canonicalPrivateToolDispatchAggregatePath(ownerUserId: string, workspaceId: string): string {
  return [
    'canonical-tool-dispatch',
    'private-single-host-v1',
    dispatchScopeHash(ownerUserId, workspaceId),
    'aggregate.json',
  ].join('/')
}

function dispatchScopeHash(ownerUserId: string, workspaceId: string): string {
  return sha256AuthorityValue({ ownerUserId, workspaceId })
}

async function withProcessLock<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolveGate) => { release = resolveGate })
  const tail = previous.catch(() => undefined).then(() => gate)
  locks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await action()
  } finally {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  }
}

function invalidDispatchStore(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
