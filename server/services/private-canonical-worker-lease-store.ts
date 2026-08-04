import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  CANONICAL_WORKER_LEASE_AGGREGATE_VERSION,
  canonicalWorkerLeaseAggregateSchema,
  persistedCanonicalWorkerLeaseAggregateSchema,
  type CanonicalWorkerLeaseAggregate,
  type CanonicalWorkerLeaseRecord,
} from '../validation/canonical-worker-lease-authority-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

export const MAX_CANONICAL_WORKER_LEASE_RECORDS = 2_000
export const MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS = 4_096
export const MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS = 10_000

const MAX_CANONICAL_WORKER_LEASE_AGGREGATE_BYTES = 8 * 1024 * 1024
const leaseScopeLocks = new Map<string, Promise<void>>()

export type CanonicalWorkerLeaseStoreScope = {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

type PersistedCanonicalWorkerLeaseAggregate = {
  recordVersion: typeof CANONICAL_WORKER_LEASE_AGGREGATE_VERSION
  source: 'private_single_host_canonical_worker_lease_store'
  aggregate: CanonicalWorkerLeaseAggregate
  checksumSha256: string
}

export function clearPrivateCanonicalWorkerLeaseProcessStateForSmoke(): void {
  leaseScopeLocks.clear()
}

export async function readPrivateCanonicalWorkerLeaseAggregate(
  scope: CanonicalWorkerLeaseStoreScope,
): Promise<CanonicalWorkerLeaseAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalWorkerLeaseAggregatePath(scope.ownerUserId, scope.workspaceId),
  })
  if (!content) return undefined
  return parsePersistedAggregate(content, scope)
}

export async function mutatePrivateCanonicalWorkerLeaseAggregate<T>(input: {
  scope: CanonicalWorkerLeaseStoreScope
  now: string
  mutation: (
    aggregate: CanonicalWorkerLeaseAggregate,
  ) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
}): Promise<T> {
  const lockKey = canonicalWorkerLeaseScopeHash(input.scope.ownerUserId, input.scope.workspaceId)
  return withProcessLock(leaseScopeLocks, lockKey, async () => {
    const existing = await readPrivateCanonicalWorkerLeaseAggregate(input.scope)
    const aggregate = existing ?? createCanonicalWorkerLeaseAggregate(input.scope, input.now)
    const beforeMutation = existing ? structuredClone(existing) : undefined
    const mutationResult = await input.mutation(aggregate)
    if (!mutationResult.changed) return mutationResult.result

    assertAppendOnlyLeaseMutation(beforeMutation, aggregate)
    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertCanonicalWorkerLeaseAggregateValid(aggregate, input.scope)
    const persisted: PersistedCanonicalWorkerLeaseAggregate = {
      recordVersion: CANONICAL_WORKER_LEASE_AGGREGATE_VERSION,
      source: 'private_single_host_canonical_worker_lease_store',
      aggregate,
      checksumSha256: sha256AuthorityValue(aggregate),
    }
    const content = `${JSON.stringify(persisted)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_CANONICAL_WORKER_LEASE_AGGREGATE_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'Private canonical worker-lease authority reached its safe byte capacity.',
        503,
        { byteLength, maxBytes: MAX_CANONICAL_WORKER_LEASE_AGGREGATE_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: canonicalWorkerLeaseAggregatePath(input.scope.ownerUserId, input.scope.workspaceId),
      content,
    })
    return mutationResult.result
  })
}

export async function releaseNeverStartedSnapshotLeasesForCancellation(input: {
  scope: CanonicalWorkerLeaseStoreScope
  snapshotId: string
  projectId: string
  editSessionId: string
  now: string
}): Promise<{
  leaseRecordCount: number
  releasedLeaseCount: number
  expiredLeaseCount: number
}> {
  return mutatePrivateCanonicalWorkerLeaseAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const leases = aggregate.leases.filter((lease) =>
        lease.approvedPlanSnapshotId === input.snapshotId)
      if (leases.some((lease) =>
        lease.projectId !== input.projectId ||
        lease.editSessionId !== input.editSessionId ||
        lease.executionFence.state !== 'not_started')) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Cancellation cannot release a lease whose execution fence started or whose scope changed.',
          409,
          { requiredGate: 'canonical_started_execution_cancellation_and_compensation' },
        )
      }
      const activeTransitionCount = leases.filter((lease) => lease.status === 'active').length
      if (aggregate.auditEvents.length + activeTransitionCount > MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private canonical worker-lease cancellation audit capacity was reached.',
          503,
        )
      }
      let releasedTransitionCount = 0
      let expiredTransitionCount = 0
      for (const lease of leases) {
        if (lease.status !== 'active') continue
        const expired = Date.parse(lease.expiresAt) <= Date.parse(input.now)
        if (expired) {
          lease.status = 'expired'
          lease.expiredAt = input.now
          expiredTransitionCount += 1
        } else {
          lease.status = 'released'
          lease.releasedAt = input.now
          releasedTransitionCount += 1
        }
        aggregate.auditEvents.push({
          id: `canonical_worker_lease_audit_${randomUUID()}`,
          eventType: expired ? 'expired' : 'released',
          leaseId: lease.id,
          workspaceId: lease.workspaceId,
          projectId: lease.projectId,
          editSessionId: lease.editSessionId,
          jobId: lease.jobId,
          attemptNumber: lease.attemptNumber,
          createdAt: input.now,
        })
      }
      return {
        result: {
          leaseRecordCount: leases.length,
          releasedLeaseCount: leases.filter((lease) => lease.status === 'released').length,
          expiredLeaseCount: leases.filter((lease) => lease.status === 'expired').length,
        },
        changed: releasedTransitionCount + expiredTransitionCount > 0,
      }
    },
  })
}

export async function reconcileSnapshotLeasesForCompensation(input: {
  scope: CanonicalWorkerLeaseStoreScope
  snapshotId: string
  projectId: string
  editSessionId: string
  now: string
}): Promise<{
  leaseRecordCount: number
  releasedLeaseCount: number
  expiredLeaseCount: number
  notStartedFenceCount: number
  failedFenceCount: number
  completedFenceCount: number
  inFlightStartedFenceCount: 0
}> {
  return mutatePrivateCanonicalWorkerLeaseAggregate({
    scope: input.scope,
    now: input.now,
    mutation: (aggregate) => {
      const leases = aggregate.leases.filter((lease) =>
        lease.approvedPlanSnapshotId === input.snapshotId)
      if (leases.some((lease) =>
        lease.projectId !== input.projectId ||
        lease.editSessionId !== input.editSessionId)) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Post-dispatch compensation cannot reconcile a worker lease whose scope changed.',
          409,
        )
      }
      const inFlightStartedFenceCount = leases.filter((lease) =>
        lease.executionFence.state === 'started').length
      if (inFlightStartedFenceCount > 0) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Post-dispatch compensation requires every worker execution fence to be quiescent.',
          409,
          {
            requiredGate: 'canonical_inflight_execution_quiescence_and_compensation',
            inFlightStartedFenceCount,
          },
        )
      }
      const activeTransitionCount = leases.filter((lease) => lease.status === 'active').length
      if (aggregate.auditEvents.length + activeTransitionCount > MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private canonical worker-lease compensation audit capacity was reached.',
          503,
        )
      }
      let changed = false
      for (const lease of leases) {
        if (lease.status !== 'active') continue
        const expired = Date.parse(lease.expiresAt) <= Date.parse(input.now)
        if (expired) {
          lease.status = 'expired'
          lease.expiredAt = input.now
        } else {
          lease.status = 'released'
          lease.releasedAt = input.now
        }
        aggregate.auditEvents.push({
          id: `canonical_worker_lease_audit_${randomUUID()}`,
          eventType: expired ? 'expired' : 'released',
          leaseId: lease.id,
          workspaceId: lease.workspaceId,
          projectId: lease.projectId,
          editSessionId: lease.editSessionId,
          jobId: lease.jobId,
          attemptNumber: lease.attemptNumber,
          createdAt: input.now,
        })
        changed = true
      }
      return {
        result: {
          leaseRecordCount: leases.length,
          releasedLeaseCount: leases.filter((lease) => lease.status === 'released').length,
          expiredLeaseCount: leases.filter((lease) => lease.status === 'expired').length,
          notStartedFenceCount: leases.filter((lease) =>
            lease.executionFence.state === 'not_started').length,
          failedFenceCount: leases.filter((lease) =>
            lease.executionFence.state === 'failed').length,
          completedFenceCount: leases.filter((lease) =>
            lease.executionFence.state === 'completed').length,
          inFlightStartedFenceCount: 0 as const,
        },
        changed,
      }
    },
  })
}

function assertAppendOnlyLeaseMutation(
  before: CanonicalWorkerLeaseAggregate | undefined,
  after: CanonicalWorkerLeaseAggregate,
): void {
  if (!before) return
  if (
    after.schemaVersion !== before.schemaVersion ||
    after.source !== before.source ||
    after.workspaceId !== before.workspaceId ||
    after.ownerUserId !== before.ownerUserId ||
    after.revision !== before.revision ||
    after.createdAt !== before.createdAt ||
    after.leases.length < before.leases.length ||
    after.idempotencyRecords.length < before.idempotencyRecords.length ||
    after.auditEvents.length < before.auditEvents.length ||
    stableAuthorityStringify(after.leases.slice(0, before.leases.length).map((lease) => lease.id)) !==
      stableAuthorityStringify(before.leases.map((lease) => lease.id)) ||
    stableAuthorityStringify(after.idempotencyRecords.slice(0, before.idempotencyRecords.length)) !==
      stableAuthorityStringify(before.idempotencyRecords) ||
    stableAuthorityStringify(after.auditEvents.slice(0, before.auditEvents.length)) !==
      stableAuthorityStringify(before.auditEvents)
  ) {
    throw invalidLeaseStore('Canonical worker-lease authority append-only records or scope were modified.')
  }
  for (const previousLease of before.leases) {
    const currentLease = after.leases.find((lease) => lease.id === previousLease.id)
    if (!currentLease) throw invalidLeaseStore('Canonical worker lease was removed from append-only authority.')
    assertLeaseStateTransition(previousLease, currentLease)
  }
}

function assertLeaseStateTransition(
  previous: CanonicalWorkerLeaseRecord,
  current: CanonicalWorkerLeaseRecord,
): void {
  const immutablePrevious = immutableLeaseState(previous)
  const immutableCurrent = immutableLeaseState(current)
  if (stableAuthorityStringify(immutablePrevious) !== stableAuthorityStringify(immutableCurrent)) {
    throw invalidLeaseStore('Canonical worker lease immutable tenant, credential, or authority lineage changed.')
  }
  assertExecutionFenceTransition(previous, current)
  if (previous.status !== 'active') {
    if (stableAuthorityStringify(previous) !== stableAuthorityStringify(current)) {
      throw invalidLeaseStore('A terminal canonical worker lease cannot be changed or reactivated.')
    }
    return
  }
  if (current.status === 'active') {
    if (
      current.releasedAt !== undefined ||
      current.expiredAt !== undefined ||
      Date.parse(current.heartbeatAt) < Date.parse(previous.heartbeatAt) ||
      Date.parse(current.expiresAt) < Date.parse(previous.expiresAt)
    ) {
      throw invalidLeaseStore('Canonical worker lease heartbeat cannot shorten or corrupt an active lease.')
    }
    return
  }
  if (current.status === 'released') {
    if (
      (previous.executionFence.state === 'started' && current.executionFence.state !== 'failed') ||
      current.releasedAt === undefined ||
      current.expiredAt !== undefined ||
      current.heartbeatAt !== previous.heartbeatAt ||
      current.expiresAt !== previous.expiresAt
    ) {
      throw invalidLeaseStore('Canonical worker lease release transition is invalid.')
    }
    return
  }
  if (
    current.status !== 'expired' ||
    current.expiredAt === undefined ||
    current.releasedAt !== undefined ||
    current.heartbeatAt !== previous.heartbeatAt ||
    current.expiresAt !== previous.expiresAt ||
    Date.parse(current.expiredAt) < Date.parse(current.expiresAt)
  ) {
    throw invalidLeaseStore('Canonical worker lease expiry transition is invalid.')
  }
}

function immutableLeaseState(lease: CanonicalWorkerLeaseRecord) {
  return {
    schemaVersion: lease.schemaVersion,
    id: lease.id,
    workspaceId: lease.workspaceId,
    projectId: lease.projectId,
    editSessionId: lease.editSessionId,
    jobId: lease.jobId,
    approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
    reservationId: lease.reservationId,
    workerIdentity: lease.workerIdentity,
    attemptNumber: lease.attemptNumber,
    claimRequestHash: lease.claimRequestHash,
    credentialHashSha256: lease.credentialHashSha256,
    authorityRevisionAtClaim: lease.authorityRevisionAtClaim,
    canonicalHashes: lease.canonicalHashes,
    dependencyAuthority: lease.dependencyAuthority,
    immutableLeaseHash: lease.immutableLeaseHash,
    issuedAt: lease.issuedAt,
    attemptDeadlineAt: lease.attemptDeadlineAt,
    initialExpiresAt: lease.initialExpiresAt,
  }
}

export function canonicalWorkerLeaseImmutableHash(
  lease: Omit<CanonicalWorkerLeaseRecord, 'immutableLeaseHash'>,
): string {
  return sha256AuthorityValue({
    schemaVersion: lease.schemaVersion,
    id: lease.id,
    workspaceId: lease.workspaceId,
    projectId: lease.projectId,
    editSessionId: lease.editSessionId,
    jobId: lease.jobId,
    approvedPlanSnapshotId: lease.approvedPlanSnapshotId,
    reservationId: lease.reservationId,
    workerIdentity: lease.workerIdentity,
    attemptNumber: lease.attemptNumber,
    claimRequestHash: lease.claimRequestHash,
    credentialHashSha256: lease.credentialHashSha256,
    authorityRevisionAtClaim: lease.authorityRevisionAtClaim,
    canonicalHashes: lease.canonicalHashes,
    dependencyAuthority: lease.dependencyAuthority,
    issuedAt: lease.issuedAt,
    attemptDeadlineAt: lease.attemptDeadlineAt,
    initialExpiresAt: lease.initialExpiresAt,
  })
}

export function canonicalWorkerLeaseFailureEvidenceHash(input: {
  lease: Pick<
    CanonicalWorkerLeaseRecord,
    | 'id'
    | 'workspaceId'
    | 'projectId'
    | 'editSessionId'
    | 'jobId'
    | 'approvedPlanSnapshotId'
    | 'attemptNumber'
    | 'immutableLeaseHash'
  >
  fence: {
    executionAttemptId: string
    runnerClass: string
    startedAt: string
    failureCategory: string
    failureCode: string
    recoveryPolicy: string
    failedAt: string
  }
}): string {
  return sha256AuthorityValue({
    domain: 'canonical_worker_execution_failure_evidence_v1',
    lease: {
      id: input.lease.id,
      workspaceId: input.lease.workspaceId,
      projectId: input.lease.projectId,
      editSessionId: input.lease.editSessionId,
      jobId: input.lease.jobId,
      approvedPlanSnapshotId: input.lease.approvedPlanSnapshotId,
      attemptNumber: input.lease.attemptNumber,
      immutableLeaseHash: input.lease.immutableLeaseHash,
    },
    fence: {
      executionAttemptId: input.fence.executionAttemptId,
      runnerClass: input.fence.runnerClass,
      startedAt: input.fence.startedAt,
      failureCategory: input.fence.failureCategory,
      failureCode: input.fence.failureCode,
      recoveryPolicy: input.fence.recoveryPolicy,
      failedAt: input.fence.failedAt,
    },
  })
}

function assertExecutionFenceTransition(
  previous: CanonicalWorkerLeaseRecord,
  current: CanonicalWorkerLeaseRecord,
): void {
  const before = previous.executionFence
  const after = current.executionFence
  if (before.state === 'completed' || before.state === 'failed') {
    if (stableAuthorityStringify(before) !== stableAuthorityStringify(after)) {
      throw invalidLeaseStore('A terminal worker execution fence is immutable.')
    }
    return
  }
  if (before.state === 'started') {
    if (after.state === 'started') {
      if (stableAuthorityStringify(before) !== stableAuthorityStringify(after)) {
        throw invalidLeaseStore('A started worker execution fence cannot change before completion.')
      }
      return
    }
    if (after.state === 'failed') {
      const failureEvidenceHash = after.failureEvidenceHash
      if (
        after.executionAttemptId !== before.executionAttemptId ||
        after.runnerClass !== before.runnerClass ||
        after.startedAt !== before.startedAt ||
        !after.failureCategory ||
        !after.failureCode ||
        !after.recoveryPolicy ||
        !after.failedAt ||
        !failureEvidenceHash ||
        Date.parse(after.failedAt) < Date.parse(before.startedAt!) ||
        failureEvidenceHash !== canonicalWorkerLeaseFailureEvidenceHash({
          lease: current,
          fence: failureHashFence(after),
        })
      ) {
        throw invalidLeaseStore('Worker execution-fence failure transition is invalid.')
      }
      return
    }
    if (
      after.state !== 'completed' ||
      after.executionAttemptId !== before.executionAttemptId ||
      after.runnerClass !== before.runnerClass ||
      after.startedAt !== before.startedAt ||
      !after.commitAuthorizedAt ||
      !after.completedAt ||
      Date.parse(after.commitAuthorizedAt) < Date.parse(before.startedAt!) ||
      Date.parse(after.completedAt) < Date.parse(after.commitAuthorizedAt)
    ) {
      throw invalidLeaseStore('Worker execution-fence completion transition is invalid.')
    }
    return
  }
  if (after.state === 'not_started') return
  if (
    after.state !== 'started' ||
    !after.executionAttemptId ||
    !after.runnerClass ||
    !after.startedAt ||
    Date.parse(after.startedAt) < Date.parse(previous.issuedAt) ||
    Date.parse(after.startedAt) > Date.parse(previous.attemptDeadlineAt)
  ) {
    throw invalidLeaseStore('Worker execution-fence start transition is invalid.')
  }
}

function createCanonicalWorkerLeaseAggregate(
  scope: CanonicalWorkerLeaseStoreScope,
  now: string,
): CanonicalWorkerLeaseAggregate {
  return {
    schemaVersion: CANONICAL_WORKER_LEASE_AGGREGATE_VERSION,
    source: 'private_single_host_canonical_worker_lease_authority',
    workspaceId: scope.workspaceId,
    ownerUserId: scope.ownerUserId,
    revision: 0,
    leases: [],
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parsePersistedAggregate(
  content: string,
  scope: CanonicalWorkerLeaseStoreScope,
): CanonicalWorkerLeaseAggregate {
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    throw invalidLeaseStore('Private canonical worker-lease aggregate is not valid JSON.')
  }
  const parsed = persistedCanonicalWorkerLeaseAggregateSchema.safeParse(raw)
  if (!parsed.success) {
    throw invalidLeaseStore('Private canonical worker-lease aggregate has an unsupported record shape.')
  }
  if (parsed.data.checksumSha256 !== sha256AuthorityValue(parsed.data.aggregate)) {
    throw invalidLeaseStore('Private canonical worker-lease aggregate checksum is invalid.')
  }
  assertCanonicalWorkerLeaseAggregateValid(parsed.data.aggregate, scope)
  return parsed.data.aggregate
}

function assertCanonicalWorkerLeaseAggregateValid(
  aggregate: CanonicalWorkerLeaseAggregate,
  scope: CanonicalWorkerLeaseStoreScope,
): void {
  const parsed = canonicalWorkerLeaseAggregateSchema.safeParse(aggregate)
  if (
    !parsed.success ||
    aggregate.workspaceId !== scope.workspaceId ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.leases.length > MAX_CANONICAL_WORKER_LEASE_RECORDS ||
    aggregate.idempotencyRecords.length > MAX_CANONICAL_WORKER_LEASE_IDEMPOTENCY_RECORDS ||
    aggregate.auditEvents.length > MAX_CANONICAL_WORKER_LEASE_AUDIT_EVENTS
  ) {
    throw invalidLeaseStore('Private canonical worker-lease aggregate scope, shape, or capacity is invalid.')
  }
  assertUnique(aggregate.leases.map((lease) => lease.id), 'lease IDs')
  assertUnique(
    aggregate.idempotencyRecords.map((record) => `${record.operation}\u0000${record.keyHash}`),
    'operation-scoped idempotency keys',
  )
  assertUnique(aggregate.auditEvents.map((event) => event.id), 'audit event IDs')

  const attemptsByJob = new Map<string, number[]>()
  for (const lease of aggregate.leases) {
    if (lease.workspaceId !== aggregate.workspaceId) {
      throw invalidLeaseStore('Canonical worker lease is outside the aggregate tenant scope.')
    }
    const { immutableLeaseHash, ...leaseWithoutHash } = lease
    if (immutableLeaseHash !== canonicalWorkerLeaseImmutableHash(leaseWithoutHash)) {
      throw invalidLeaseStore('Canonical worker lease immutable hash is invalid.')
    }
    if (lease.executionFence.state === 'failed') {
      if (
        lease.executionFence.failureEvidenceHash !== canonicalWorkerLeaseFailureEvidenceHash({
          lease,
          fence: failureHashFence(lease.executionFence),
        })
      ) {
        throw invalidLeaseStore('Canonical worker lease failure-evidence hash is invalid.')
      }
    }
    const { authorityHash, ...dependencyAuthorityWithoutHash } = lease.dependencyAuthority
    if (authorityHash !== sha256AuthorityValue(dependencyAuthorityWithoutHash)) {
      throw invalidLeaseStore('Canonical worker lease dependency-authority hash is invalid.')
    }
    const attempts = attemptsByJob.get(lease.jobId) ?? []
    attempts.push(lease.attemptNumber)
    attemptsByJob.set(lease.jobId, attempts)
  }
  for (const attempts of attemptsByJob.values()) {
    attempts.sort((left, right) => left - right)
    if (attempts.some((attempt, index) => attempt !== index + 1)) {
      throw invalidLeaseStore('Canonical worker lease attempt sequence is invalid.')
    }
  }
  const activeJobIds = aggregate.leases.filter((lease) => lease.status === 'active').map((lease) => lease.jobId)
  assertUnique(activeJobIds, 'active job lease ownership')

  for (const record of aggregate.idempotencyRecords) {
    const lease = aggregate.leases.find((candidate) => candidate.id === record.leaseId)
    if (
      !lease ||
      (record.operation === 'release' && record.responseStatus !== 'released') ||
      (record.operation !== 'release' && record.responseStatus !== 'active')
    ) {
      throw invalidLeaseStore('Canonical worker lease idempotency lineage is invalid.')
    }
  }
  for (const event of aggregate.auditEvents) {
    const lease = aggregate.leases.find((candidate) => candidate.id === event.leaseId)
    if (
      !lease ||
      event.workspaceId !== lease.workspaceId ||
      event.projectId !== lease.projectId ||
      event.editSessionId !== lease.editSessionId ||
      event.jobId !== lease.jobId ||
      event.attemptNumber !== lease.attemptNumber
    ) {
      throw invalidLeaseStore('Canonical worker lease audit lineage is invalid.')
    }
  }
  for (const lease of aggregate.leases.filter((candidate) =>
    candidate.executionFence.state === 'failed')) {
    const failureEvents = aggregate.auditEvents.filter((event) =>
      event.leaseId === lease.id && event.eventType === 'execution_failed')
    if (failureEvents.length !== 1) {
      throw invalidLeaseStore('A failed canonical worker execution requires one immutable failure audit event.')
    }
  }
}

function failureHashFence(
  fence: CanonicalWorkerLeaseRecord['executionFence'],
) {
  if (
    fence.state !== 'failed' ||
    !fence.executionAttemptId ||
    !fence.runnerClass ||
    !fence.startedAt ||
    !fence.failureCategory ||
    !fence.failureCode ||
    !fence.recoveryPolicy ||
    !fence.failedAt
  ) {
    throw invalidLeaseStore('Canonical worker lease failure-evidence fields are incomplete.')
  }
  return {
    executionAttemptId: fence.executionAttemptId,
    runnerClass: fence.runnerClass,
    startedAt: fence.startedAt,
    failureCategory: fence.failureCategory,
    failureCode: fence.failureCode,
    recoveryPolicy: fence.recoveryPolicy,
    failedAt: fence.failedAt,
  }
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw invalidLeaseStore(`Private canonical worker-lease aggregate contains duplicate ${label}.`)
  }
}

function canonicalWorkerLeaseAggregatePath(ownerUserId: string, workspaceId: string): string {
  return [
    'canonical-worker-leases',
    'private-single-host-v1',
    canonicalWorkerLeaseScopeHash(ownerUserId, workspaceId),
    'aggregate.json',
  ].join('/')
}

function canonicalWorkerLeaseScopeHash(ownerUserId: string, workspaceId: string): string {
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
  const tail = previous.then(() => gate)
  locks.set(key, tail)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  }
}

function invalidLeaseStore(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
