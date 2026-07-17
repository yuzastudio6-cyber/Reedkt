import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  removePrivateRegularFileWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  canonicalCloudDispatchOutboxAggregateSchema,
  type CanonicalCloudDispatchOutboxAggregate,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import {
  canonicalPrivatePackageWorkQueueAggregateSchema,
  type CanonicalPrivatePackageWorkQueueAggregate,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  CANONICAL_PRIVATE_PACKAGE_COMPLETION_TRANSACTION_VERSION,
  CANONICAL_PRIVATE_PACKAGE_FAILURE_TRANSACTION_VERSION,
  CANONICAL_PRIVATE_PACKAGE_STATE_TRANSACTION_VERSION,
  CANONICAL_PRIVATE_PACKAGE_TIMEOUT_TRANSACTION_VERSION,
  canonicalPrivatePackageStateTransactionSchema,
  type CanonicalPrivatePackageStateTransaction,
} from '../validation/canonical-private-package-state-transaction-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const MAX_PROJECTION_BYTES = 8 * 1024 * 1024
const MAX_TRANSACTION_BYTES = 26 * 1024 * 1024
const activePackageStateAuthorities = new WeakSet<object>()

export interface CanonicalPrivatePackageStateScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

export interface CanonicalPrivatePackageStatePaths {
  queueRelativePath: string
  outboxRelativePath: string
  transactionRelativePath: string
  lockRelativePath: string
}

export interface CanonicalPrivatePackageStateLockAuthority {
  readonly scope: CanonicalPrivatePackageStateScope
  readonly paths: CanonicalPrivatePackageStatePaths
}

export function assertCanonicalPrivatePackageStateLockAuthority(input: {
  lockAuthority: CanonicalPrivatePackageStateLockAuthority
  scope: CanonicalPrivatePackageStateScope
}): void {
  assertActiveLockAuthority(input.lockAuthority)
  if (
    stableAuthorityStringify(input.lockAuthority.scope) !==
    stableAuthorityStringify(input.scope)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Canonical package-state lock authority does not match the requested scope.',
      503,
    )
  }
}

export interface CanonicalPrivatePackageStateRecoveryEvidence {
  pendingTransactionRecovered: boolean
  queueProjectionReplayed: boolean
  outboxProjectionReplayed: boolean
  transactionHash: string | null
}

export type CanonicalPrivatePackageStateFaultStage =
  | 'after_write_ahead_commit'
  | 'after_queue_projection'

export interface CanonicalPrivatePackageStateTransactionAuthority {
  queueDefinitionHash: string
  queueAggregateHashBefore: string
  queueAggregateHashAfter: string
  outboxAggregateHashBefore: string | null
  outboxAggregateHashAfter: string
  jobId: string
  packageDeliveryAttempt: number
  queueClaimId: string
  queueClaimHash: string
  queueClaimCreatedInTransaction: boolean
  dispatchIntentId: string
  outboxEntryHash: string
}

export interface CanonicalPrivatePackageCompletionTransactionAuthority {
  queueDefinitionHash: string
  queueAggregateHashBefore: string
  queueAggregateHashAfter: string
  outboxAggregateHashBefore: string
  outboxAggregateHashAfter: string
  jobId: string
  packageDeliveryAttempt: number
  queueClaimId: string
  queueClaimHash: string
  dispatchIntentId: string
  workerReceiptHash: string
  completionEvidenceHash: string
  completionOutcomeHash: string
  queueCompletionHash: string
  outboxEntryHashBefore: string
  outboxEntryHashAfter: string
  completionReceiptHash: string
}

export interface CanonicalPrivatePackageFailureTransactionAuthority {
  queueDefinitionHash: string
  queueAggregateHashBefore: string
  queueAggregateHashAfter: string
  outboxAggregateHashBefore: string
  outboxAggregateHashAfter: string
  jobId: string
  packageDeliveryAttempt: number
  queueClaimId: string
  queueClaimHash: string
  dispatchIntentId: string
  workerReceiptHash: string
  failureEvidenceHash: string
  queueReleaseHash: string
  attemptInternalCostEvidenceHash: string
  retryDisposition:
    | 'retry_same_approved_operation'
    | 'fallback_or_user_review_required'
  queueDisposition:
    | 'retry_available'
    | 'attempts_exhausted'
    | 'user_review_required'
  approvedMaxAttempts: number
  remainingAttempts: number
  outboxEntryHashBefore: string
  outboxEntryHashAfter: string
  failureReceiptHash: string
}

export interface CanonicalPrivatePackageTimeoutTransactionAuthority {
  queueDefinitionHash: string
  queueAggregateHashBefore: string
  queueAggregateHashAfter: string
  outboxAggregateHashBefore: string
  outboxAggregateHashAfter: string
  jobId: string
  packageDeliveryAttempt: number
  queueClaimId: string
  queueClaimHash: string
  expiredQueueClaimHash: string
  queueClaimExpiresAt: string
  queueClaimAttemptDeadlineAt: string
  timeoutReconciledAt: string
  dispatchIntentId: string
  controllerReceiptHash: string
  workerReceiptHash: string
  timeoutEvidenceHash: string
  timeoutDetailHash: string
  queueReleaseHash: string
  attemptInternalCostEvidenceHash: string
  retryDisposition:
    | 'retry_same_approved_operation'
    | 'fallback_or_user_review_required'
  queueDisposition:
    | 'retry_available'
    | 'attempts_exhausted'
  approvedMaxAttempts: number
  remainingAttempts: number
  outboxEntryHashBefore: string
  outboxEntryHashAfter: string
  timeoutReceiptHash: string
}

export interface CanonicalPrivatePackageStateTransactionCommitEvidence {
  transactionHash: string
  queueProjectionReplayed: boolean
  outboxProjectionReplayed: boolean
  writeAheadRecordRemoved: true
}

export async function withCanonicalPrivatePackageStateLock<T>(input: {
  scope: CanonicalPrivatePackageStateScope
  operation: (
    authority: CanonicalPrivatePackageStateLockAuthority,
    recovery: CanonicalPrivatePackageStateRecoveryEvidence,
  ) => Promise<T>
}): Promise<T> {
  assertScope(input.scope)
  const paths = canonicalPrivatePackageStatePaths(input.scope)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: paths.lockRelativePath,
    operation: async () => {
      const authority = Object.freeze({
        scope: Object.freeze({ ...input.scope }),
        paths: Object.freeze({ ...paths }),
      })
      activePackageStateAuthorities.add(authority)
      try {
        const recovery = await recoverCanonicalPrivatePackageStateTransaction(authority)
        return await input.operation(authority, recovery)
      } finally {
        activePackageStateAuthorities.delete(authority)
      }
    },
  })
}

export async function commitCanonicalPrivatePackageQueueOutboxTransaction(input: {
  lockAuthority: CanonicalPrivatePackageStateLockAuthority
  transactionId: string
  transactionType: 'package_claim_and_cloud_dispatch_outbox_insert' |
    'legacy_active_claim_cloud_dispatch_outbox_reconciliation'
  authority: CanonicalPrivatePackageStateTransactionAuthority
  afterQueueContent: string
  afterOutboxContent: string
  committedAt: string
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
} | {
  lockAuthority: CanonicalPrivatePackageStateLockAuthority
  transactionId: string
  transactionType: 'worker_completion_reconciliation'
  authority: CanonicalPrivatePackageCompletionTransactionAuthority
  afterQueueContent: string
  afterOutboxContent: string
  committedAt: string
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
} | {
  lockAuthority: CanonicalPrivatePackageStateLockAuthority
  transactionId: string
  transactionType: 'worker_failure_reconciliation'
  authority: CanonicalPrivatePackageFailureTransactionAuthority
  afterQueueContent: string
  afterOutboxContent: string
  committedAt: string
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
} | {
  lockAuthority: CanonicalPrivatePackageStateLockAuthority
  transactionId: string
  transactionType: 'accepted_worker_timeout_reconciliation'
  authority: CanonicalPrivatePackageTimeoutTransactionAuthority
  afterQueueContent: string
  afterOutboxContent: string
  committedAt: string
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
}): Promise<CanonicalPrivatePackageStateTransactionCommitEvidence> {
  assertActiveLockAuthority(input.lockAuthority)
  assertSafeIdentity(input.transactionId, 'package-state transaction identity')
  const committedAt = validTimestamp(input.committedAt, 'package-state transaction commit')
  assertProjectionContent(input.afterQueueContent, 'queue')
  assertProjectionContent(input.afterOutboxContent, 'outbox')
  if (
    (input.transactionType === 'package_claim_and_cloud_dispatch_outbox_insert' ||
      input.transactionType === 'legacy_active_claim_cloud_dispatch_outbox_reconciliation') &&
    (input.transactionType === 'package_claim_and_cloud_dispatch_outbox_insert') !==
      input.authority.queueClaimCreatedInTransaction
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state transaction type does not match its claim authority.',
      409,
    )
  }
  const scope = input.lockAuthority.scope
  const paths = input.lockAuthority.paths
  const beforeQueueContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.queueRelativePath,
  })
  if (beforeQueueContent === undefined) {
    throw new ApiError(
      'JOB_NOT_FOUND',
      'Canonical package queue must exist before a dispatch transaction can commit.',
      404,
    )
  }
  const beforeOutboxContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.outboxRelativePath,
  })
  const pendingTransactionContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.transactionRelativePath,
  })
  if (pendingTransactionContent !== undefined) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Canonical package-state recovery must finish before another transaction commits.',
      503,
    )
  }
  assertProjectionAuthority({
    beforeQueueContent,
    beforeOutboxContent,
    afterQueueContent: input.afterQueueContent,
    afterOutboxContent: input.afterOutboxContent,
    transactionType: input.transactionType,
    authority: input.authority,
  })
  const payload = {
    schemaVersion: input.transactionType === 'worker_completion_reconciliation'
      ? CANONICAL_PRIVATE_PACKAGE_COMPLETION_TRANSACTION_VERSION
      : input.transactionType === 'worker_failure_reconciliation'
        ? CANONICAL_PRIVATE_PACKAGE_FAILURE_TRANSACTION_VERSION
        : input.transactionType === 'accepted_worker_timeout_reconciliation'
          ? CANONICAL_PRIVATE_PACKAGE_TIMEOUT_TRANSACTION_VERSION
          : CANONICAL_PRIVATE_PACKAGE_STATE_TRANSACTION_VERSION,
    source: 'private_canonical_package_queue_outbox_transaction' as const,
    ownerUserId: scope.ownerUserId,
    identity: packageIdentity(scope),
    transactionId: input.transactionId,
    transactionType: input.transactionType,
    authority: input.authority,
    projections: {
      queue: createProjection(beforeQueueContent, input.afterQueueContent),
      outbox: createProjection(beforeOutboxContent, input.afterOutboxContent),
    },
    committedAt,
    boundaries: transactionBoundaries(),
  }
  const transaction = canonicalPrivatePackageStateTransactionSchema.parse({
    ...payload,
    transactionHash: sha256AuthorityValue(payload),
  })
  const transactionContent = `${stableAuthorityStringify(transaction)}\n`
  if (Buffer.byteLength(transactionContent, 'utf8') > MAX_TRANSACTION_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical package-state transaction exceeds its private recovery bound.',
      503,
    )
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.transactionRelativePath,
    content: transactionContent,
  })
  const persistedTransactionContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.transactionRelativePath,
  })
  if (
    persistedTransactionContent === undefined ||
    sha256Text(persistedTransactionContent) !== sha256Text(transactionContent)
  ) throw invalidTransaction('Canonical package-state commit record did not persist exactly.')
  input.faultInjectionForSmoke?.('after_write_ahead_commit')

  const queueProjectionReplayed = await applyProjection({
    scope,
    relativePath: paths.queueRelativePath,
    projection: transaction.projections.queue,
  })
  input.faultInjectionForSmoke?.('after_queue_projection')
  const outboxProjectionReplayed = await applyProjection({
    scope,
    relativePath: paths.outboxRelativePath,
    projection: transaction.projections.outbox,
  })
  await verifyAndRemoveTransactionRecord({
    scope,
    transaction,
    transactionContent,
    paths,
  })
  return {
    transactionHash: transaction.transactionHash,
    queueProjectionReplayed,
    outboxProjectionReplayed,
    writeAheadRecordRemoved: true,
  }
}

export function canonicalPrivatePackageStatePaths(
  scope: CanonicalPrivatePackageStateScope,
): CanonicalPrivatePackageStatePaths {
  assertScope(scope)
  const tenantHash = sha256Text(`${scope.ownerUserId}\u0000${scope.workspaceId}`).slice(0, 32)
  const packageHash = sha256Text([
    tenantHash,
    scope.projectId,
    scope.editSessionId,
    scope.packageRecordId,
    scope.approvedPlanSnapshotId,
  ].join('\u0000'))
  return {
    queueRelativePath:
      `private-internal/canonical-package-work-queues/v1/${tenantHash}/${packageHash}.json`,
    outboxRelativePath:
      `private-internal/canonical-cloud-dispatch-outboxes/v1/${tenantHash}/${packageHash}.json`,
    transactionRelativePath:
      `private-internal/canonical-package-state-transactions/v1/${tenantHash}/${packageHash}.json`,
    lockRelativePath:
      `private-internal/canonical-package-state-locks/v1/${tenantHash}/${packageHash}.lock`,
  }
}

async function recoverCanonicalPrivatePackageStateTransaction(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
): Promise<CanonicalPrivatePackageStateRecoveryEvidence> {
  assertActiveLockAuthority(lockAuthority)
  const scope = lockAuthority.scope
  const paths = lockAuthority.paths
  const transactionContent = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.transactionRelativePath,
  })
  if (transactionContent === undefined) return noRecoveryEvidence()
  if (Buffer.byteLength(transactionContent, 'utf8') > MAX_TRANSACTION_BYTES) {
    throw invalidTransaction('Canonical package-state transaction exceeds its recovery bound.')
  }
  let raw: unknown
  try {
    raw = JSON.parse(transactionContent)
  } catch {
    throw invalidTransaction('Canonical package-state transaction is not valid JSON.')
  }
  const parsed = canonicalPrivatePackageStateTransactionSchema.safeParse(raw)
  if (!parsed.success) {
    throw invalidTransaction('Canonical package-state transaction shape is invalid.')
  }
  const transaction = parsed.data
  const { transactionHash, ...payload } = transaction
  if (
    transactionHash !== sha256AuthorityValue(payload) ||
    transaction.ownerUserId !== scope.ownerUserId ||
    stableAuthorityStringify(transaction.identity) !==
      stableAuthorityStringify(packageIdentity(scope))
  ) throw invalidTransaction('Canonical package-state transaction integrity is invalid.')
  validateProjection(transaction.projections.queue)
  validateProjection(transaction.projections.outbox)

  const queueProjectionReplayed = await applyProjection({
    scope,
    relativePath: paths.queueRelativePath,
    projection: transaction.projections.queue,
  })
  const outboxProjectionReplayed = await applyProjection({
    scope,
    relativePath: paths.outboxRelativePath,
    projection: transaction.projections.outbox,
  })
  await verifyAndRemoveTransactionRecord({
    scope,
    transaction,
    transactionContent,
    paths,
  })
  return {
    pendingTransactionRecovered: true,
    queueProjectionReplayed,
    outboxProjectionReplayed,
    transactionHash,
  }
}

async function applyProjection(input: {
  scope: CanonicalPrivatePackageStateScope
  relativePath: string
  projection: CanonicalPrivatePackageStateTransaction['projections']['queue'] |
    CanonicalPrivatePackageStateTransaction['projections']['outbox']
}): Promise<boolean> {
  validateProjection(input.projection)
  const current = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.relativePath,
  })
  const currentHash = current === undefined ? null : sha256Text(current)
  if (currentHash === input.projection.afterContentSha256) return false
  if (
    (current !== undefined) !== input.projection.beforeExists ||
    currentHash !== input.projection.beforeContentSha256
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state projection changed outside its committed transaction.',
      409,
    )
  }
  const afterContent = decodeProjection(input.projection)
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.relativePath,
    content: afterContent,
  })
  const persisted = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (persisted === undefined || sha256Text(persisted) !== input.projection.afterContentSha256) {
    throw invalidTransaction('Canonical package-state projection did not persist exactly.')
  }
  return true
}

async function verifyAndRemoveTransactionRecord(input: {
  scope: CanonicalPrivatePackageStateScope
  transaction: CanonicalPrivatePackageStateTransaction
  transactionContent: string
  paths: CanonicalPrivatePackageStatePaths
}): Promise<void> {
  const queue = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.paths.queueRelativePath,
  })
  const outbox = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.paths.outboxRelativePath,
  })
  if (
    queue === undefined || outbox === undefined ||
    sha256Text(queue) !== input.transaction.projections.queue.afterContentSha256 ||
    sha256Text(outbox) !== input.transaction.projections.outbox.afterContentSha256
  ) throw invalidTransaction('Canonical package-state recovery projections are incomplete.')
  const removed = await removePrivateRegularFileWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: input.paths.transactionRelativePath,
    expectedContentSha256: sha256Text(input.transactionContent),
  })
  if (!removed.removed) {
    throw invalidTransaction('Canonical package-state recovery record disappeared before cleanup.')
  }
}

function createProjection(beforeContent: string | undefined, afterContent: string) {
  return {
    beforeExists: beforeContent !== undefined,
    beforeContentSha256: beforeContent === undefined ? null : sha256Text(beforeContent),
    afterContentBase64Url: Buffer.from(afterContent, 'utf8').toString('base64url'),
    afterContentSha256: sha256Text(afterContent),
  }
}

function validateProjection(
  projection: CanonicalPrivatePackageStateTransaction['projections']['queue'] |
    CanonicalPrivatePackageStateTransaction['projections']['outbox'],
): void {
  const content = decodeProjection(projection)
  if (sha256Text(content) !== projection.afterContentSha256) {
    throw invalidTransaction('Canonical package-state recovery projection checksum is invalid.')
  }
}

function decodeProjection(
  projection: CanonicalPrivatePackageStateTransaction['projections']['queue'] |
    CanonicalPrivatePackageStateTransaction['projections']['outbox'],
): string {
  const bytes = Buffer.from(projection.afterContentBase64Url, 'base64url')
  if (
    bytes.length < 1 || bytes.length > MAX_PROJECTION_BYTES ||
    bytes.toString('base64url') !== projection.afterContentBase64Url
  ) throw invalidTransaction('Canonical package-state recovery projection encoding is invalid.')
  return bytes.toString('utf8')
}

function assertProjectionContent(content: string, label: string): void {
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength < 1 || byteLength > MAX_PROJECTION_BYTES || !content.endsWith('\n')) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      `Canonical package-state ${label} projection exceeds its private bound.`,
      503,
    )
  }
}

function assertProjectionAuthority(input: {
  beforeQueueContent: string
  beforeOutboxContent: string | undefined
  afterQueueContent: string
  afterOutboxContent: string
  transactionType: 'package_claim_and_cloud_dispatch_outbox_insert' |
    'legacy_active_claim_cloud_dispatch_outbox_reconciliation' |
    'worker_completion_reconciliation' |
    'worker_failure_reconciliation' |
    'accepted_worker_timeout_reconciliation'
  authority: CanonicalPrivatePackageStateTransactionAuthority |
    CanonicalPrivatePackageCompletionTransactionAuthority |
    CanonicalPrivatePackageFailureTransactionAuthority |
    CanonicalPrivatePackageTimeoutTransactionAuthority
}): void {
  const beforeQueue = readQueueProjectionEnvelope(input.beforeQueueContent, 'queue before')
  const afterQueue = readQueueProjectionEnvelope(input.afterQueueContent, 'queue after')
  const beforeOutbox = input.beforeOutboxContent === undefined
    ? undefined
    : readOutboxProjectionEnvelope(input.beforeOutboxContent, 'outbox before')
  const afterOutbox = readOutboxProjectionEnvelope(input.afterOutboxContent, 'outbox after')
  if (
    beforeQueue.aggregateHash !== input.authority.queueAggregateHashBefore ||
    afterQueue.aggregateHash !== input.authority.queueAggregateHashAfter ||
    (beforeOutbox?.aggregateHash ?? null) !== input.authority.outboxAggregateHashBefore ||
    afterOutbox.aggregateHash !== input.authority.outboxAggregateHashAfter ||
    beforeQueue.definitionHash !== input.authority.queueDefinitionHash ||
    afterQueue.definitionHash !== input.authority.queueDefinitionHash ||
    afterOutbox.definitionHash !== input.authority.queueDefinitionHash
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state transaction projections do not match their authority.',
      409,
    )
  }
  if (input.transactionType === 'worker_completion_reconciliation') {
    if (!beforeOutbox) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Worker completion reconciliation requires an existing outbox projection.',
        409,
      )
    }
    assertExactCompletionProjectionAuthority({
      beforeQueue: beforeQueue.aggregate,
      afterQueue: afterQueue.aggregate,
      beforeOutbox: beforeOutbox.aggregate,
      afterOutbox: afterOutbox.aggregate,
      authority: input.authority as CanonicalPrivatePackageCompletionTransactionAuthority,
    })
    return
  }
  if (input.transactionType === 'worker_failure_reconciliation') {
    if (!beforeOutbox) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Worker failure reconciliation requires an existing outbox projection.',
        409,
      )
    }
    assertExactFailureProjectionAuthority({
      beforeQueue: beforeQueue.aggregate,
      afterQueue: afterQueue.aggregate,
      beforeOutbox: beforeOutbox.aggregate,
      afterOutbox: afterOutbox.aggregate,
      authority: input.authority as CanonicalPrivatePackageFailureTransactionAuthority,
    })
    return
  }
  if (input.transactionType === 'accepted_worker_timeout_reconciliation') {
    if (!beforeOutbox) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Accepted-worker timeout reconciliation requires an existing outbox projection.',
        409,
      )
    }
    assertExactTimeoutProjectionAuthority({
      beforeQueue: beforeQueue.aggregate,
      afterQueue: afterQueue.aggregate,
      beforeOutbox: beforeOutbox.aggregate,
      afterOutbox: afterOutbox.aggregate,
      authority: input.authority as CanonicalPrivatePackageTimeoutTransactionAuthority,
    })
    return
  }
  assertExactAttemptProjectionAuthority({
    beforeQueue: beforeQueue.aggregate,
    afterQueue: afterQueue.aggregate,
    beforeOutbox: beforeOutbox?.aggregate,
    afterOutbox: afterOutbox.aggregate,
    authority: input.authority as CanonicalPrivatePackageStateTransactionAuthority,
  })
}

function readQueueProjectionEnvelope(
  content: string,
  label: string,
): {
  aggregateHash: string
  definitionHash: string
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
} {
  const aggregate = canonicalPrivatePackageWorkQueueAggregateSchema.safeParse(
    readProjectionEnvelopeAggregate(content, label),
  )
  if (!aggregate.success) {
    throw invalidTransaction(`Canonical package-state ${label} aggregate is invalid.`)
  }
  return {
    aggregateHash: aggregate.data.aggregateHash,
    definitionHash: aggregate.data.definitionHash,
    aggregate: aggregate.data,
  }
}

function readOutboxProjectionEnvelope(
  content: string,
  label: string,
): {
  aggregateHash: string
  definitionHash: string
  aggregate: CanonicalCloudDispatchOutboxAggregate
} {
  const aggregate = canonicalCloudDispatchOutboxAggregateSchema.safeParse(
    readProjectionEnvelopeAggregate(content, label),
  )
  if (!aggregate.success) {
    throw invalidTransaction(`Canonical package-state ${label} aggregate is invalid.`)
  }
  return {
    aggregateHash: aggregate.data.aggregateHash,
    definitionHash: aggregate.data.identity.queueDefinitionHash,
    aggregate: aggregate.data,
  }
}

function readProjectionEnvelopeAggregate(content: string, label: string): unknown {
  let decoded: unknown
  try {
    decoded = JSON.parse(content)
  } catch {
    throw invalidTransaction(`Canonical package-state ${label} projection is not valid JSON.`)
  }
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw invalidTransaction(`Canonical package-state ${label} projection is invalid.`)
  }
  return (decoded as { aggregate?: unknown }).aggregate
}

function assertExactAttemptProjectionAuthority(input: {
  beforeQueue: CanonicalPrivatePackageWorkQueueAggregate
  afterQueue: CanonicalPrivatePackageWorkQueueAggregate
  beforeOutbox: CanonicalCloudDispatchOutboxAggregate | undefined
  afterOutbox: CanonicalCloudDispatchOutboxAggregate
  authority: CanonicalPrivatePackageStateTransactionAuthority
}): void {
  const beforeQueueEntry = input.beforeQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const afterQueueEntry = input.afterQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const beforeClaim = beforeQueueEntry?.activeClaim
  const afterClaim = afterQueueEntry?.activeClaim
  const afterOutboxEntries = input.afterOutbox.entries.filter((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const beforeOutboxEntry = input.beforeOutbox?.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const afterOutboxEntry = afterOutboxEntries[0]
  if (
    !afterClaim ||
    afterClaim.deliveryAttempt !== input.authority.packageDeliveryAttempt ||
    afterClaim.claimId !== input.authority.queueClaimId ||
    afterClaim.claimHash !== input.authority.queueClaimHash ||
    (input.authority.queueClaimCreatedInTransaction
      ? beforeClaim?.claimId === input.authority.queueClaimId
      : !beforeClaim || beforeClaim.claimId !== input.authority.queueClaimId ||
        beforeClaim.claimHash !== input.authority.queueClaimHash) ||
    beforeOutboxEntry !== undefined ||
    afterOutboxEntries.length !== 1 ||
    !afterOutboxEntry ||
    afterOutboxEntry.entryHash !== input.authority.outboxEntryHash ||
    afterOutboxEntry.immutable.jobId !== input.authority.jobId ||
    afterOutboxEntry.immutable.packageDeliveryAttempt !==
      input.authority.packageDeliveryAttempt ||
    afterOutboxEntry.immutable.queueClaimId !== input.authority.queueClaimId ||
    afterOutboxEntry.immutable.queueClaimHash !== input.authority.queueClaimHash
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state projections do not contain the exact committed attempt.',
      409,
    )
  }
}

function assertExactCompletionProjectionAuthority(input: {
  beforeQueue: CanonicalPrivatePackageWorkQueueAggregate
  afterQueue: CanonicalPrivatePackageWorkQueueAggregate
  beforeOutbox: CanonicalCloudDispatchOutboxAggregate
  afterOutbox: CanonicalCloudDispatchOutboxAggregate
  authority: CanonicalPrivatePackageCompletionTransactionAuthority
}): void {
  const beforeQueueEntry = input.beforeQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const afterQueueEntry = input.afterQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const beforeClaim = beforeQueueEntry?.activeClaim
  const completion = afterQueueEntry?.completion
  const beforeOutboxEntry = input.beforeOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const afterOutboxEntry = input.afterOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const completionReceipt = afterOutboxEntry?.completionReceipt
  const queueEvent = input.afterQueue.events.at(-1)
  const outboxEvent = input.afterOutbox.events.at(-1)
  if (
    beforeQueueEntry?.state !== 'leased' || !beforeClaim ||
    beforeClaim.claimId !== input.authority.queueClaimId ||
    beforeClaim.claimHash !== input.authority.queueClaimHash ||
    beforeClaim.deliveryAttempt !== input.authority.packageDeliveryAttempt ||
    afterQueueEntry?.state !== 'completed' || !completion ||
    afterQueueEntry.activeClaim !== undefined ||
    afterQueueEntry.deliveryAttemptCount !== input.authority.packageDeliveryAttempt ||
    completion.claimId !== input.authority.queueClaimId ||
    completion.credentialSha256 !== beforeClaim.credentialSha256 ||
    completion.completionHash !== input.authority.queueCompletionHash ||
    sha256AuthorityValue(completion.outcome) !== input.authority.completionOutcomeHash ||
    beforeOutboxEntry?.state !== 'worker_identity_accepted' ||
    !beforeOutboxEntry.workerReceipt || beforeOutboxEntry.completionReceipt !== undefined ||
    beforeOutboxEntry.entryHash !== input.authority.outboxEntryHashBefore ||
    beforeOutboxEntry.workerReceipt.receiptHash !== input.authority.workerReceiptHash ||
    beforeOutboxEntry.immutable.queueClaimId !== input.authority.queueClaimId ||
    beforeOutboxEntry.immutable.queueClaimHash !== input.authority.queueClaimHash ||
    beforeOutboxEntry.immutable.packageDeliveryAttempt !==
      input.authority.packageDeliveryAttempt ||
    afterOutboxEntry?.state !== 'worker_completion_reconciled' ||
    afterOutboxEntry.entryHash !== input.authority.outboxEntryHashAfter ||
    stableAuthorityStringify(afterOutboxEntry.immutable) !==
      stableAuthorityStringify(beforeOutboxEntry.immutable) ||
    stableAuthorityStringify(afterOutboxEntry.controllerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.controllerReceipt) ||
    stableAuthorityStringify(afterOutboxEntry.workerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.workerReceipt) ||
    !completionReceipt ||
    completionReceipt.receiptHash !== input.authority.completionReceiptHash ||
    completionReceipt.workerReceiptHash !== input.authority.workerReceiptHash ||
    completionReceipt.completionEvidenceHash !== input.authority.completionEvidenceHash ||
    completionReceipt.completionOutcomeHash !== input.authority.completionOutcomeHash ||
    completionReceipt.queueCompletionHash !== input.authority.queueCompletionHash ||
    input.afterQueue.events.length !== input.beforeQueue.events.length + 1 ||
    stableAuthorityStringify(input.afterQueue.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeQueue.events) ||
    queueEvent?.eventType !== 'job_completed' ||
    queueEvent.jobId !== input.authority.jobId ||
    queueEvent.claimId !== input.authority.queueClaimId ||
    input.afterOutbox.events.length !== input.beforeOutbox.events.length + 1 ||
    stableAuthorityStringify(input.afterOutbox.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeOutbox.events) ||
    outboxEvent?.eventType !== 'worker_completion_reconciled' ||
    outboxEvent.dispatchIntentId !== input.authority.dispatchIntentId ||
    outboxEvent.jobId !== input.authority.jobId ||
    outboxEvent.packageDeliveryAttempt !== input.authority.packageDeliveryAttempt ||
    stableAuthorityStringify(input.afterQueue.entries.filter((entry) =>
      entry.definition.jobId !== input.authority.jobId)) !==
      stableAuthorityStringify(input.beforeQueue.entries.filter((entry) =>
        entry.definition.jobId !== input.authority.jobId)) ||
    stableAuthorityStringify(input.afterOutbox.entries.filter((entry) =>
      entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId)) !==
      stableAuthorityStringify(input.beforeOutbox.entries.filter((entry) =>
        entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId))
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state projections do not contain one exact worker completion reconciliation.',
      409,
    )
  }
}

function assertExactFailureProjectionAuthority(input: {
  beforeQueue: CanonicalPrivatePackageWorkQueueAggregate
  afterQueue: CanonicalPrivatePackageWorkQueueAggregate
  beforeOutbox: CanonicalCloudDispatchOutboxAggregate
  afterOutbox: CanonicalCloudDispatchOutboxAggregate
  authority: CanonicalPrivatePackageFailureTransactionAuthority
}): void {
  const beforeQueueEntry = input.beforeQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const afterQueueEntry = input.afterQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const beforeClaim = beforeQueueEntry?.activeClaim
  const release = afterQueueEntry?.lastRelease
  const dispatchFailure = release?.dispatchFailure
  const beforeOutboxEntry = input.beforeOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const afterOutboxEntry = input.afterOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const failureReceipt = afterOutboxEntry?.failureReceipt
  const queueEvent = input.afterQueue.events.at(-1)
  const outboxEvent = input.afterOutbox.events.at(-1)
  const expectedReleaseReason = input.authority.queueDisposition === 'user_review_required'
    ? 'unexpected_execution_failure'
    : 'approved_attempt_failure'
  if (
    beforeQueueEntry?.state !== 'leased' || !beforeClaim ||
    beforeClaim.claimId !== input.authority.queueClaimId ||
    beforeClaim.claimHash !== input.authority.queueClaimHash ||
    beforeClaim.deliveryAttempt !== input.authority.packageDeliveryAttempt ||
    beforeQueueEntry.deliveryAttemptCount !== input.authority.packageDeliveryAttempt ||
    afterQueueEntry?.state !== 'queued' ||
    afterQueueEntry.activeClaim !== undefined ||
    afterQueueEntry.completion !== undefined ||
    afterQueueEntry.deliveryAttemptCount !== input.authority.packageDeliveryAttempt ||
    !release || !dispatchFailure ||
    release.claimId !== input.authority.queueClaimId ||
    release.credentialSha256 !== beforeClaim.credentialSha256 ||
    release.reason !== expectedReleaseReason ||
    release.releaseHash !== input.authority.queueReleaseHash ||
    dispatchFailure.queueClaimHash !== input.authority.queueClaimHash ||
    dispatchFailure.workerReceiptHash !== input.authority.workerReceiptHash ||
    dispatchFailure.failureEvidenceHash !== input.authority.failureEvidenceHash ||
    dispatchFailure.attemptInternalCostEvidenceHash !==
      input.authority.attemptInternalCostEvidenceHash ||
    dispatchFailure.retryDisposition !== input.authority.retryDisposition ||
    dispatchFailure.queueDisposition !== input.authority.queueDisposition ||
    dispatchFailure.approvedMaxAttempts !== input.authority.approvedMaxAttempts ||
    dispatchFailure.remainingAttempts !== input.authority.remainingAttempts ||
    dispatchFailure.approvedMaxAttempts !== afterQueueEntry.definition.maxAttempts ||
    dispatchFailure.remainingAttempts !== Math.max(
      0,
      afterQueueEntry.definition.maxAttempts - afterQueueEntry.deliveryAttemptCount,
    ) ||
    beforeOutboxEntry?.state !== 'worker_identity_accepted' ||
    !beforeOutboxEntry.workerReceipt ||
    beforeOutboxEntry.completionReceipt !== undefined ||
    beforeOutboxEntry.failureReceipt !== undefined ||
    beforeOutboxEntry.entryHash !== input.authority.outboxEntryHashBefore ||
    beforeOutboxEntry.workerReceipt.receiptHash !== input.authority.workerReceiptHash ||
    beforeOutboxEntry.immutable.queueClaimId !== input.authority.queueClaimId ||
    beforeOutboxEntry.immutable.queueClaimHash !== input.authority.queueClaimHash ||
    beforeOutboxEntry.immutable.packageDeliveryAttempt !==
      input.authority.packageDeliveryAttempt ||
    afterOutboxEntry?.state !== 'worker_failure_reconciled' ||
    afterOutboxEntry.entryHash !== input.authority.outboxEntryHashAfter ||
    stableAuthorityStringify(afterOutboxEntry.immutable) !==
      stableAuthorityStringify(beforeOutboxEntry.immutable) ||
    stableAuthorityStringify(afterOutboxEntry.controllerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.controllerReceipt) ||
    stableAuthorityStringify(afterOutboxEntry.workerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.workerReceipt) ||
    afterOutboxEntry.completionReceipt !== undefined ||
    !failureReceipt ||
    failureReceipt.receiptHash !== input.authority.failureReceiptHash ||
    failureReceipt.workerReceiptHash !== input.authority.workerReceiptHash ||
    failureReceipt.failureEvidenceHash !== input.authority.failureEvidenceHash ||
    failureReceipt.queueReleaseHash !== input.authority.queueReleaseHash ||
    failureReceipt.attemptInternalCostEvidenceHash !==
      input.authority.attemptInternalCostEvidenceHash ||
    failureReceipt.retryDisposition !== input.authority.retryDisposition ||
    failureReceipt.queueDisposition !== input.authority.queueDisposition ||
    failureReceipt.approvedMaxAttempts !== input.authority.approvedMaxAttempts ||
    failureReceipt.remainingAttempts !== input.authority.remainingAttempts ||
    input.afterQueue.events.length !== input.beforeQueue.events.length + 1 ||
    stableAuthorityStringify(input.afterQueue.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeQueue.events) ||
    queueEvent?.eventType !== 'claim_released' ||
    queueEvent.jobId !== input.authority.jobId ||
    queueEvent.claimId !== input.authority.queueClaimId ||
    input.afterOutbox.events.length !== input.beforeOutbox.events.length + 1 ||
    stableAuthorityStringify(input.afterOutbox.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeOutbox.events) ||
    outboxEvent?.eventType !== 'worker_failure_reconciled' ||
    outboxEvent.dispatchIntentId !== input.authority.dispatchIntentId ||
    outboxEvent.jobId !== input.authority.jobId ||
    outboxEvent.packageDeliveryAttempt !== input.authority.packageDeliveryAttempt ||
    stableAuthorityStringify(input.afterQueue.entries.filter((entry) =>
      entry.definition.jobId !== input.authority.jobId)) !==
      stableAuthorityStringify(input.beforeQueue.entries.filter((entry) =>
        entry.definition.jobId !== input.authority.jobId)) ||
    stableAuthorityStringify(input.afterOutbox.entries.filter((entry) =>
      entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId)) !==
      stableAuthorityStringify(input.beforeOutbox.entries.filter((entry) =>
        entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId))
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state projections do not contain one exact worker failure reconciliation.',
      409,
    )
  }
}

function assertExactTimeoutProjectionAuthority(input: {
  beforeQueue: CanonicalPrivatePackageWorkQueueAggregate
  afterQueue: CanonicalPrivatePackageWorkQueueAggregate
  beforeOutbox: CanonicalCloudDispatchOutboxAggregate
  afterOutbox: CanonicalCloudDispatchOutboxAggregate
  authority: CanonicalPrivatePackageTimeoutTransactionAuthority
}): void {
  const beforeQueueEntry = input.beforeQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const afterQueueEntry = input.afterQueue.entries.find((entry) =>
    entry.definition.jobId === input.authority.jobId)
  const beforeClaim = beforeQueueEntry?.activeClaim
  const release = afterQueueEntry?.lastRelease
  const dispatchTimeout = release?.dispatchTimeout
  const beforeOutboxEntry = input.beforeOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const afterOutboxEntry = input.afterOutbox.entries.find((entry) =>
    entry.immutable.dispatchIntentId === input.authority.dispatchIntentId)
  const timeoutReceipt = afterOutboxEntry?.timeoutReceipt
  const queueEvent = input.afterQueue.events.at(-1)
  const outboxEvent = input.afterOutbox.events.at(-1)
  if (
    beforeQueueEntry?.state !== 'leased' || !beforeClaim ||
    beforeClaim.claimId !== input.authority.queueClaimId ||
    beforeClaim.claimHash !== input.authority.expiredQueueClaimHash ||
    beforeClaim.deliveryAttempt !== input.authority.packageDeliveryAttempt ||
    beforeClaim.expiresAt !== input.authority.queueClaimExpiresAt ||
    beforeClaim.attemptDeadlineAt !== input.authority.queueClaimAttemptDeadlineAt ||
    Date.parse(input.authority.timeoutReconciledAt) <
      Date.parse(beforeClaim.expiresAt) ||
    beforeQueueEntry.deliveryAttemptCount !== input.authority.packageDeliveryAttempt ||
    afterQueueEntry?.state !== 'queued' ||
    afterQueueEntry.activeClaim !== undefined ||
    afterQueueEntry.completion !== undefined ||
    afterQueueEntry.deliveryAttemptCount !== input.authority.packageDeliveryAttempt ||
    afterQueueEntry.expiredClaimRecoveryCount !==
      beforeQueueEntry.expiredClaimRecoveryCount + 1 ||
    !release || !dispatchTimeout ||
    release.claimId !== input.authority.queueClaimId ||
    release.credentialSha256 !== beforeClaim.credentialSha256 ||
    release.reason !== 'expired_claim_recovered' ||
    release.releasedAt !== input.authority.timeoutReconciledAt ||
    release.releaseHash !== input.authority.queueReleaseHash ||
    release.dispatchFailure !== undefined ||
    dispatchTimeout.queueClaimHash !== input.authority.queueClaimHash ||
    dispatchTimeout.expiredQueueClaimHash !== input.authority.expiredQueueClaimHash ||
    dispatchTimeout.controllerReceiptHash !== input.authority.controllerReceiptHash ||
    dispatchTimeout.workerReceiptHash !== input.authority.workerReceiptHash ||
    dispatchTimeout.timeoutEvidenceHash !== input.authority.timeoutEvidenceHash ||
    dispatchTimeout.timeoutDetailHash !== input.authority.timeoutDetailHash ||
    dispatchTimeout.queueClaimExpiresAt !== input.authority.queueClaimExpiresAt ||
    dispatchTimeout.queueClaimAttemptDeadlineAt !==
      input.authority.queueClaimAttemptDeadlineAt ||
    dispatchTimeout.attemptInternalCostEvidenceHash !==
      input.authority.attemptInternalCostEvidenceHash ||
    dispatchTimeout.retryDisposition !== input.authority.retryDisposition ||
    dispatchTimeout.queueDisposition !== input.authority.queueDisposition ||
    dispatchTimeout.approvedMaxAttempts !== input.authority.approvedMaxAttempts ||
    dispatchTimeout.remainingAttempts !== input.authority.remainingAttempts ||
    dispatchTimeout.approvedMaxAttempts !== afterQueueEntry.definition.maxAttempts ||
    dispatchTimeout.remainingAttempts !== Math.max(
      0,
      afterQueueEntry.definition.maxAttempts - afterQueueEntry.deliveryAttemptCount,
    ) ||
    beforeOutboxEntry?.state !== 'worker_identity_accepted' ||
    !beforeOutboxEntry.controllerReceipt || !beforeOutboxEntry.workerReceipt ||
    beforeOutboxEntry.completionReceipt !== undefined ||
    beforeOutboxEntry.failureReceipt !== undefined ||
    beforeOutboxEntry.timeoutReceipt !== undefined ||
    beforeOutboxEntry.entryHash !== input.authority.outboxEntryHashBefore ||
    beforeOutboxEntry.controllerReceipt.receiptHash !==
      input.authority.controllerReceiptHash ||
    beforeOutboxEntry.workerReceipt.receiptHash !== input.authority.workerReceiptHash ||
    beforeOutboxEntry.immutable.queueClaimId !== input.authority.queueClaimId ||
    beforeOutboxEntry.immutable.queueClaimHash !== input.authority.queueClaimHash ||
    beforeOutboxEntry.immutable.packageDeliveryAttempt !==
      input.authority.packageDeliveryAttempt ||
    afterOutboxEntry?.state !== 'worker_timeout_reconciled' ||
    afterOutboxEntry.entryHash !== input.authority.outboxEntryHashAfter ||
    stableAuthorityStringify(afterOutboxEntry.immutable) !==
      stableAuthorityStringify(beforeOutboxEntry.immutable) ||
    stableAuthorityStringify(afterOutboxEntry.controllerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.controllerReceipt) ||
    stableAuthorityStringify(afterOutboxEntry.workerReceipt) !==
      stableAuthorityStringify(beforeOutboxEntry.workerReceipt) ||
    afterOutboxEntry.completionReceipt !== undefined ||
    afterOutboxEntry.failureReceipt !== undefined ||
    !timeoutReceipt ||
    timeoutReceipt.receiptHash !== input.authority.timeoutReceiptHash ||
    timeoutReceipt.controllerReceiptHash !== input.authority.controllerReceiptHash ||
    timeoutReceipt.workerReceiptHash !== input.authority.workerReceiptHash ||
    timeoutReceipt.timeoutEvidenceHash !== input.authority.timeoutEvidenceHash ||
    timeoutReceipt.timeoutDetailHash !== input.authority.timeoutDetailHash ||
    timeoutReceipt.queueReleaseHash !== input.authority.queueReleaseHash ||
    timeoutReceipt.expiredQueueClaimHash !== input.authority.expiredQueueClaimHash ||
    timeoutReceipt.attemptInternalCostEvidenceHash !==
      input.authority.attemptInternalCostEvidenceHash ||
    timeoutReceipt.retryDisposition !== input.authority.retryDisposition ||
    timeoutReceipt.queueDisposition !== input.authority.queueDisposition ||
    timeoutReceipt.approvedMaxAttempts !== input.authority.approvedMaxAttempts ||
    timeoutReceipt.remainingAttempts !== input.authority.remainingAttempts ||
    timeoutReceipt.timedOutAt !== input.authority.timeoutReconciledAt ||
    input.afterQueue.events.length !== input.beforeQueue.events.length + 1 ||
    stableAuthorityStringify(input.afterQueue.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeQueue.events) ||
    queueEvent?.eventType !== 'expired_claim_recovered' ||
    queueEvent.jobId !== input.authority.jobId ||
    queueEvent.claimId !== input.authority.queueClaimId ||
    input.afterOutbox.events.length !== input.beforeOutbox.events.length + 1 ||
    stableAuthorityStringify(input.afterOutbox.events.slice(0, -1)) !==
      stableAuthorityStringify(input.beforeOutbox.events) ||
    outboxEvent?.eventType !== 'worker_timeout_reconciled' ||
    outboxEvent.dispatchIntentId !== input.authority.dispatchIntentId ||
    outboxEvent.jobId !== input.authority.jobId ||
    outboxEvent.packageDeliveryAttempt !== input.authority.packageDeliveryAttempt ||
    stableAuthorityStringify(input.afterQueue.entries.filter((entry) =>
      entry.definition.jobId !== input.authority.jobId)) !==
      stableAuthorityStringify(input.beforeQueue.entries.filter((entry) =>
        entry.definition.jobId !== input.authority.jobId)) ||
    stableAuthorityStringify(input.afterOutbox.entries.filter((entry) =>
      entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId)) !==
      stableAuthorityStringify(input.beforeOutbox.entries.filter((entry) =>
        entry.immutable.dispatchIntentId !== input.authority.dispatchIntentId))
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical package-state projections do not contain one exact accepted-worker timeout reconciliation.',
      409,
    )
  }
}

function assertActiveLockAuthority(authority: CanonicalPrivatePackageStateLockAuthority): void {
  if (!activePackageStateAuthorities.has(authority)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Canonical package-state mutation requires its active server-owned lock authority.',
      503,
    )
  }
}

function packageIdentity(scope: CanonicalPrivatePackageStateScope) {
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    packageRecordId: scope.packageRecordId,
    approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
  }
}

function transactionBoundaries() {
  return {
    privateLocalPersistence: true as const,
    singleHostOnly: true as const,
    cooperativeCrossProcessLockRequired: true as const,
    atomicWriteAheadCommitPoint: true as const,
    queueAndOutboxCrashRecoveryRequired: true as const,
    callerSelectedProjectionPathsAllowed: false as const,
    plaintextClaimCredentialPersisted: false as const,
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: false as const,
    distributedDatabaseTransactionVerified: false as const,
    productionAuthority: false as const,
  }
}

function noRecoveryEvidence(): CanonicalPrivatePackageStateRecoveryEvidence {
  return {
    pendingTransactionRecovered: false,
    queueProjectionReplayed: false,
    outboxProjectionReplayed: false,
    transactionHash: null,
  }
}

function assertScope(scope: CanonicalPrivatePackageStateScope): void {
  if (!scope.localStorageRoot.trim()) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical package-state root is required.', 400)
  }
  for (const value of [
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
    scope.packageRecordId,
    scope.approvedPlanSnapshotId,
  ]) assertSafeIdentity(value, 'package-state scope')
}

function assertSafeIdentity(value: string, label: string): void {
  if (
    value.length < 1 || value.length > 240 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(value) || value.includes('..')
  ) throw new ApiError('VALIDATION_FAILED', `Canonical ${label} is invalid.`, 400)
}

function validTimestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new ApiError('VALIDATION_FAILED', `Canonical ${label} timestamp is invalid.`, 400)
  }
  return value
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalidTransaction(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
