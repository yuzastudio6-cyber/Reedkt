import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCloudDispatchOutboxEntryIntegrity,
  finalizeCanonicalCloudDispatchOutboxEntry,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  CANONICAL_CLOUD_DISPATCH_OUTBOX_AGGREGATE_VERSION,
  CANONICAL_CLOUD_DISPATCH_OUTBOX_EVENT_VERSION,
  canonicalCloudDispatchControllerReceiptSchema,
  canonicalCloudDispatchOutboxAggregateSchema,
  canonicalCloudDispatchWorkerCompletionReceiptSchema,
  canonicalCloudDispatchWorkerReceiptSchema,
  type CanonicalCloudDispatchControllerReceipt,
  type CanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchOutboxEvent,
  type CanonicalCloudDispatchWorkerCompletionReceipt,
  type CanonicalCloudDispatchWorkerReceipt,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import {
  assertCanonicalPrivatePackageStateLockAuthority,
  canonicalPrivatePackageStatePaths,
  withCanonicalPrivatePackageStateLock,
  type CanonicalPrivatePackageStateLockAuthority,
} from './private-canonical-package-state-transaction'

const STORE_RECORD_VERSION = 'private-canonical-cloud-dispatch-outbox-record-v1' as const
const STORE_RECORD_SOURCE = 'private_canonical_cloud_dispatch_outbox_store' as const
const MAX_OUTBOX_BYTES = 8 * 1024 * 1024
const MAX_OUTBOX_ENTRIES = 256
const MAX_OUTBOX_EVENTS = 1_024

export interface CanonicalCloudDispatchOutboxStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

interface PersistedOutboxEnvelope {
  recordVersion: typeof STORE_RECORD_VERSION
  source: typeof STORE_RECORD_SOURCE
  ownerUserId: string
  aggregate: CanonicalCloudDispatchOutboxAggregate
  checksumSha256: string
}

export function clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke(): void {
  // Filesystem-backed package locks have no process cache to clear.
}

export function preparePrivateCanonicalCloudDispatchOutboxEntry(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
  aggregate: CanonicalCloudDispatchOutboxAggregate | undefined
  entry: CanonicalCloudDispatchOutboxEntry
  now: string
}): {
  aggregate: CanonicalCloudDispatchOutboxAggregate
  entry: CanonicalCloudDispatchOutboxEntry
  disposition: 'created' | 'exact_replay'
} {
  assertScope(input.scope)
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  assertEntryScope(input.scope, entry)
  const now = validTimestamp(input.now, 'outbox ensure')
  const aggregate = input.aggregate
    ? structuredClone(input.aggregate)
    : createEmptyAggregate(input.scope, now)
  const before = input.aggregate ? structuredClone(input.aggregate) : undefined
  const mutation = applyEnsureEntryMutation(aggregate, entry, now)
  if (!mutation.changed) return { ...mutation.result, aggregate }
  assertAppendOnlyTransition(before, aggregate)
  const finalized = finalizeAggregate({
    ...aggregate,
    revision: aggregate.revision + 1,
    updatedAt: now,
    summary: undefined,
    aggregateHash: undefined,
  })
  return { ...mutation.result, aggregate: finalized }
}

export function preparePrivateCanonicalCloudDispatchCompletion(input: {
  aggregate: CanonicalCloudDispatchOutboxAggregate
  dispatchIntentId: string
  completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
  now: string
}): {
  aggregate: CanonicalCloudDispatchOutboxAggregate
  entry: CanonicalCloudDispatchOutboxEntry & {
    completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
  }
  disposition: 'reconciled' | 'exact_replay'
} {
  const now = validTimestamp(input.now, 'worker completion reconciliation')
  const aggregate = structuredClone(input.aggregate)
  const before = structuredClone(aggregate)
  const entry = requiredEntry(aggregate, input.dispatchIntentId)
  const completionReceipt = canonicalCloudDispatchWorkerCompletionReceiptSchema.parse(
    input.completionReceipt,
  )
  if (entry.completionReceipt) {
    if (
      entry.completionReceipt.receiptHash !== completionReceipt.receiptHash ||
      entry.completionReceipt.completionEvidenceHash !==
        completionReceipt.completionEvidenceHash ||
      entry.completionReceipt.queueCompletionHash !==
        completionReceipt.queueCompletionHash
    ) {
      throw idempotencyConflict(
        'Worker completion replay does not match the reconciled outbox result.',
      )
    }
    return {
      aggregate,
      entry: entry as CanonicalCloudDispatchOutboxEntry & {
        completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
      },
      disposition: 'exact_replay',
    }
  }
  if (entry.state !== 'worker_identity_accepted' || !entry.workerReceipt) {
    throw invalidOutbox(
      'Worker completion reconciliation requires accepted worker identity.',
    )
  }
  const updated = finalizeCanonicalCloudDispatchOutboxEntry({
    ...withoutEntryHashes(entry),
    state: 'worker_completion_reconciled',
    completionReceipt,
    updatedAt: now,
  })
  replaceEntry(aggregate, updated)
  appendEvent(aggregate, updated, 'worker_completion_reconciled', now)
  assertAppendOnlyTransition(before, aggregate)
  const finalized = finalizeAggregate({
    ...aggregate,
    revision: aggregate.revision + 1,
    updatedAt: now,
    summary: undefined,
    aggregateHash: undefined,
  })
  const finalizedEntry = requiredEntry(finalized, input.dispatchIntentId)
  if (!finalizedEntry.completionReceipt) {
    throw invalidOutbox('Worker completion receipt did not finalize exactly.')
  }
  return {
    aggregate: finalized,
    entry: finalizedEntry as CanonicalCloudDispatchOutboxEntry & {
      completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
    },
    disposition: 'reconciled',
  }
}

export async function acceptPrivateCanonicalCloudDispatchController(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
  dispatchIntentId: string
  now: string
  buildReceipt: (
    entry: CanonicalCloudDispatchOutboxEntry,
  ) => CanonicalCloudDispatchControllerReceipt
  validateCurrentEntry: (
    entry: CanonicalCloudDispatchOutboxEntry,
    lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  ) => Promise<void>
}): Promise<{
  aggregate: CanonicalCloudDispatchOutboxAggregate
  entry: CanonicalCloudDispatchOutboxEntry
  receipt: CanonicalCloudDispatchControllerReceipt
  disposition: 'accepted' | 'exact_replay'
}> {
  const now = validTimestamp(input.now, 'controller acceptance')
  return mutateOutbox<{
    entry: CanonicalCloudDispatchOutboxEntry
    receipt: CanonicalCloudDispatchControllerReceipt
    disposition: 'accepted' | 'exact_replay'
  }>(input.scope, now, async (aggregate, lockAuthority) => {
    const entry = requiredEntry(aggregate, input.dispatchIntentId)
    await input.validateCurrentEntry(entry, lockAuthority)
    const requestedReceipt = canonicalCloudDispatchControllerReceiptSchema.parse(
      input.buildReceipt(entry),
    )
    if (entry.controllerReceipt) {
      if (
        requestedReceipt.requestBindingHash !== entry.controllerReceipt.requestBindingHash ||
        requestedReceipt.cloudRunJobRequestHash !==
          entry.controllerReceipt.cloudRunJobRequestHash
      ) {
        throw idempotencyConflict(
          'Controller redelivery does not match the accepted outbox request.',
        )
      }
      return {
        changed: false,
        result: {
          entry,
          receipt: entry.controllerReceipt,
          disposition: 'exact_replay' as const,
        },
      }
    }
    if (entry.state !== 'pending_controller_delivery') {
      throw invalidOutbox('Controller acceptance state is invalid.')
    }
    const updated = finalizeCanonicalCloudDispatchOutboxEntry({
      ...withoutEntryHashes(entry),
      state: 'controller_identity_accepted',
      controllerReceipt: requestedReceipt,
      updatedAt: now,
    })
    replaceEntry(aggregate, updated)
    appendEvent(aggregate, updated, 'controller_identity_accepted', now)
    return {
      changed: true,
      result: {
        entry: updated,
        receipt: requestedReceipt,
        disposition: 'accepted' as const,
      },
    }
  })
}

export async function acceptPrivateCanonicalCloudDispatchWorker(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
  dispatchIntentId: string
  now: string
  buildReceipt: (
    entry: CanonicalCloudDispatchOutboxEntry,
  ) => CanonicalCloudDispatchWorkerReceipt
  validateCurrentEntry: (
    entry: CanonicalCloudDispatchOutboxEntry,
    lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  ) => Promise<void>
}): Promise<{
  aggregate: CanonicalCloudDispatchOutboxAggregate
  entry: CanonicalCloudDispatchOutboxEntry
  receipt: CanonicalCloudDispatchWorkerReceipt
  disposition: 'accepted' | 'exact_replay'
}> {
  const now = validTimestamp(input.now, 'worker receiver acceptance')
  return mutateOutbox<{
    entry: CanonicalCloudDispatchOutboxEntry
    receipt: CanonicalCloudDispatchWorkerReceipt
    disposition: 'accepted' | 'exact_replay'
  }>(input.scope, now, async (aggregate, lockAuthority) => {
    const entry = requiredEntry(aggregate, input.dispatchIntentId)
    await input.validateCurrentEntry(entry, lockAuthority)
    if (!entry.controllerReceipt) {
      throw invalidOutbox('Worker receiver requires an accepted controller receipt.')
    }
    const requestedReceipt = canonicalCloudDispatchWorkerReceiptSchema.parse(
      input.buildReceipt(entry),
    )
    if (entry.workerReceipt) {
      if (
        requestedReceipt.requestBindingHash !== entry.workerReceipt.requestBindingHash ||
        requestedReceipt.controllerReceiptHash !==
          entry.workerReceipt.controllerReceiptHash
      ) {
        throw idempotencyConflict('Worker redelivery does not match the accepted outbox request.')
      }
      return {
        changed: false,
        result: {
          entry,
          receipt: entry.workerReceipt,
          disposition: 'exact_replay' as const,
        },
      }
    }
    if (entry.state !== 'controller_identity_accepted') {
      throw invalidOutbox('Worker receiver acceptance state is invalid.')
    }
    const updated = finalizeCanonicalCloudDispatchOutboxEntry({
      ...withoutEntryHashes(entry),
      state: 'worker_identity_accepted',
      workerReceipt: requestedReceipt,
      updatedAt: now,
    })
    replaceEntry(aggregate, updated)
    appendEvent(aggregate, updated, 'worker_identity_accepted', now)
    return {
      changed: true,
      result: {
        entry: updated,
        receipt: requestedReceipt,
        disposition: 'accepted' as const,
      },
    }
  })
}

export async function readPrivateCanonicalCloudDispatchOutbox(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
}): Promise<CanonicalCloudDispatchOutboxAggregate | undefined> {
  assertScope(input.scope)
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) =>
      readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
        lockAuthority,
        input.scope,
      ),
  })
}

export function canonicalCloudDispatchOutboxAggregateRelativePath(
  scope: CanonicalCloudDispatchOutboxStoreScope,
): string {
  assertScope(scope)
  return canonicalPrivatePackageStatePaths(scope).outboxRelativePath
}

function applyEnsureEntryMutation(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  entry: CanonicalCloudDispatchOutboxEntry,
  now: string,
) {
  assertAggregateAuthorityMatchesEntry(aggregate, entry)
  const existing = aggregate.entries.find((candidate) =>
    candidate.immutable.dispatchIntentId === entry.immutable.dispatchIntentId)
  if (existing) {
    if (
      existing.immutableEntryHash !== entry.immutableEntryHash ||
      stableAuthorityStringify(existing.immutable) !== stableAuthorityStringify(entry.immutable)
    ) {
      throw idempotencyConflict(
        'Cloud dispatch outbox intent already exists with another immutable attempt.',
      )
    }
    return {
      changed: false,
      result: { entry: existing, disposition: 'exact_replay' as const },
    }
  }
  if (
    aggregate.entries.length >= MAX_OUTBOX_ENTRIES ||
    aggregate.events.length >= MAX_OUTBOX_EVENTS
  ) throw capacityExceeded()
  if (aggregate.entries.some((candidate) =>
    candidate.immutable.jobId === entry.immutable.jobId &&
    candidate.immutable.packageDeliveryAttempt === entry.immutable.packageDeliveryAttempt)) {
    throw idempotencyConflict('Package attempt is already bound to another outbox intent.')
  }
  aggregate.entries.push(entry)
  appendEvent(aggregate, entry, 'outbox_entry_created', now)
  return {
    changed: true,
    result: { entry, disposition: 'created' as const },
  }
}

async function mutateOutbox<T extends object>(
  scope: CanonicalCloudDispatchOutboxStoreScope,
  now: string,
  mutation: (
    aggregate: CanonicalCloudDispatchOutboxAggregate,
    lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  ) => { changed: boolean; result: T } | Promise<{ changed: boolean; result: T }>,
): Promise<T & { aggregate: CanonicalCloudDispatchOutboxAggregate }> {
  assertScope(scope)
  return withCanonicalPrivatePackageStateLock({
    scope,
    operation: async (lockAuthority) => {
      const existing =
        await readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
          lockAuthority,
          scope,
        )
      const aggregate = existing ?? createEmptyAggregate(scope, now)
      const before = existing ? structuredClone(existing) : undefined
      const mutationResult = await mutation(aggregate, lockAuthority)
      if (!mutationResult.changed) return { ...mutationResult.result, aggregate }
      assertAppendOnlyTransition(before, aggregate)
      const finalized = finalizeAggregate({
        ...aggregate,
        revision: aggregate.revision + 1,
        updatedAt: now,
        summary: undefined,
        aggregateHash: undefined,
      })
      await persistOutbox(scope, finalized)
      return { ...mutationResult.result, aggregate: finalized }
    },
  })
}

function createEmptyAggregate(
  scope: CanonicalCloudDispatchOutboxStoreScope,
  now: string,
): CanonicalCloudDispatchOutboxAggregate {
  return finalizeAggregate({
    schemaVersion: CANONICAL_CLOUD_DISPATCH_OUTBOX_AGGREGATE_VERSION,
    source: 'private_single_host_canonical_cloud_dispatch_outbox_store',
    ownerUserId: scope.ownerUserId,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: scope.packageRecordId,
      approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
      queueDefinitionHash: '0'.repeat(64),
      handoffManifestHash: '0'.repeat(64),
    },
    revision: 0,
    entries: [],
    events: [],
    boundaries: outboxBoundaries(),
    createdAt: now,
    updatedAt: now,
  })
}

function assertAggregateAuthorityMatchesEntry(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  entry: CanonicalCloudDispatchOutboxEntry,
): void {
  const empty = aggregate.entries.length === 0 &&
    aggregate.identity.queueDefinitionHash === '0'.repeat(64) &&
    aggregate.identity.handoffManifestHash === '0'.repeat(64)
  if (empty) {
    aggregate.identity.queueDefinitionHash = entry.immutable.queueDefinitionHash
    aggregate.identity.handoffManifestHash = entry.immutable.handoffManifestHash
    return
  }
  if (
    aggregate.identity.queueDefinitionHash !== entry.immutable.queueDefinitionHash ||
    aggregate.identity.handoffManifestHash !== entry.immutable.handoffManifestHash
  ) throw invalidOutbox('Cloud dispatch outbox package authority changed.')
}

export async function readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  scope: CanonicalCloudDispatchOutboxStoreScope,
): Promise<CanonicalCloudDispatchOutboxAggregate | undefined> {
  assertCanonicalPrivatePackageStateLockAuthority({ lockAuthority, scope })
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalCloudDispatchOutboxAggregateRelativePath(scope),
  })
  if (!content) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_OUTBOX_BYTES) throw capacityExceeded()
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    throw invalidOutbox('Cloud dispatch outbox record is not valid JSON.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalidOutbox('Cloud dispatch outbox record shape is invalid.')
  }
  const envelope = raw as Partial<PersistedOutboxEnvelope>
  const parsed = canonicalCloudDispatchOutboxAggregateSchema.safeParse(envelope.aggregate)
  if (
    envelope.recordVersion !== STORE_RECORD_VERSION ||
    envelope.source !== STORE_RECORD_SOURCE ||
    envelope.ownerUserId !== scope.ownerUserId ||
    typeof envelope.checksumSha256 !== 'string' ||
    !parsed.success ||
    envelope.checksumSha256 !== sha256AuthorityValue(parsed.data)
  ) throw invalidOutbox('Cloud dispatch outbox persistence integrity is invalid.')
  assertAggregateIntegrity(parsed.data, scope)
  return parsed.data
}

async function persistOutbox(
  scope: CanonicalCloudDispatchOutboxStoreScope,
  aggregate: CanonicalCloudDispatchOutboxAggregate,
): Promise<void> {
  const content = serializePrivateCanonicalCloudDispatchOutboxAggregate({ scope, aggregate })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalCloudDispatchOutboxAggregateRelativePath(scope),
    content,
  })
}

export function serializePrivateCanonicalCloudDispatchOutboxAggregate(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
  aggregate: CanonicalCloudDispatchOutboxAggregate
}): string {
  const envelope: PersistedOutboxEnvelope = {
    recordVersion: STORE_RECORD_VERSION,
    source: STORE_RECORD_SOURCE,
    ownerUserId: input.scope.ownerUserId,
    aggregate: input.aggregate,
    checksumSha256: sha256AuthorityValue(input.aggregate),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_OUTBOX_BYTES) throw capacityExceeded()
  return content
}

function finalizeAggregate(
  input: Omit<CanonicalCloudDispatchOutboxAggregate, 'summary' | 'aggregateHash'> & {
    summary?: undefined
    aggregateHash?: undefined
  },
): CanonicalCloudDispatchOutboxAggregate {
  const summary = {
    totalEntryCount: input.entries.length,
    pendingControllerDeliveryCount: input.entries.filter((entry) =>
      entry.state === 'pending_controller_delivery').length,
    controllerIdentityAcceptedCount: input.entries.filter((entry) =>
      entry.controllerReceipt !== undefined).length,
    workerIdentityAcceptedCount: input.entries.filter((entry) =>
      entry.workerReceipt !== undefined).length,
    workerCompletionReconciledCount: input.entries.filter((entry) =>
      entry.completionReceipt !== undefined).length,
    eventCount: input.events.length,
  }
  const payload = { ...input, summary }
  return canonicalCloudDispatchOutboxAggregateSchema.parse({
    ...payload,
    aggregateHash: sha256AuthorityValue(payload),
  })
}

function appendEvent(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  entry: CanonicalCloudDispatchOutboxEntry,
  eventType: CanonicalCloudDispatchOutboxEvent['eventType'],
  at: string,
): void {
  if (aggregate.events.length >= MAX_OUTBOX_EVENTS) throw capacityExceeded()
  const payload = {
    schemaVersion: CANONICAL_CLOUD_DISPATCH_OUTBOX_EVENT_VERSION,
    sequence: aggregate.events.length + 1,
    eventType,
    dispatchIntentId: entry.immutable.dispatchIntentId,
    jobId: entry.immutable.jobId,
    packageDeliveryAttempt: entry.immutable.packageDeliveryAttempt,
    at,
    previousEventHash: aggregate.events.at(-1)?.eventHash ?? null,
  }
  aggregate.events.push({ ...payload, eventHash: sha256AuthorityValue(payload) })
}

function assertAggregateIntegrity(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  scope: CanonicalCloudDispatchOutboxStoreScope,
): void {
  const { aggregateHash, ...payload } = aggregate
  if (
    aggregateHash !== sha256AuthorityValue(payload) ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.identity.workspaceId !== scope.workspaceId ||
    aggregate.identity.projectId !== scope.projectId ||
    aggregate.identity.editSessionId !== scope.editSessionId ||
    aggregate.identity.packageRecordId !== scope.packageRecordId ||
    aggregate.identity.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId ||
    aggregate.entries.length > MAX_OUTBOX_ENTRIES ||
    aggregate.events.length > MAX_OUTBOX_EVENTS
  ) throw invalidOutbox('Cloud dispatch outbox aggregate scope or integrity is invalid.')
  for (const entry of aggregate.entries) assertCanonicalCloudDispatchOutboxEntryIntegrity(entry)
  for (const event of aggregate.events) {
    const { eventHash, ...eventPayload } = event
    if (eventHash !== sha256AuthorityValue(eventPayload)) {
      throw invalidOutbox('Cloud dispatch outbox event integrity is invalid.')
    }
  }
}

function assertAppendOnlyTransition(
  before: CanonicalCloudDispatchOutboxAggregate | undefined,
  after: CanonicalCloudDispatchOutboxAggregate,
): void {
  if (!before) return
  if (
    before.ownerUserId !== after.ownerUserId ||
    before.createdAt !== after.createdAt ||
    before.revision !== after.revision ||
    stableAuthorityStringify(before.identity) !== stableAuthorityStringify(after.identity) ||
    before.entries.length > after.entries.length ||
    before.events.length > after.events.length ||
    stableAuthorityStringify(before.events) !==
      stableAuthorityStringify(after.events.slice(0, before.events.length))
  ) throw invalidOutbox('Cloud dispatch outbox append-only history changed.')
  for (const previous of before.entries) {
    const current = after.entries.find((entry) =>
      entry.immutable.dispatchIntentId === previous.immutable.dispatchIntentId)
    if (!current || previous.immutableEntryHash !== current.immutableEntryHash) {
      throw invalidOutbox('Cloud dispatch outbox immutable attempt changed or disappeared.')
    }
    if (previous.state === 'worker_completion_reconciled' &&
      stableAuthorityStringify(previous) !== stableAuthorityStringify(current)) {
      throw invalidOutbox('Terminal worker completion reconciliation cannot change.')
    }
    if (previous.controllerReceipt &&
      stableAuthorityStringify(previous.controllerReceipt) !==
        stableAuthorityStringify(current.controllerReceipt)) {
      throw invalidOutbox('Accepted controller receipt cannot change.')
    }
    if (previous.workerReceipt &&
      stableAuthorityStringify(previous.workerReceipt) !==
        stableAuthorityStringify(current.workerReceipt)) {
      throw invalidOutbox('Accepted worker receipt cannot change.')
    }
    if (previous.completionReceipt &&
      stableAuthorityStringify(previous.completionReceipt) !==
        stableAuthorityStringify(current.completionReceipt)) {
      throw invalidOutbox('Reconciled worker completion receipt cannot change.')
    }
  }
}

function withoutEntryHashes(
  entry: CanonicalCloudDispatchOutboxEntry,
): Omit<CanonicalCloudDispatchOutboxEntry, 'immutableEntryHash' | 'entryHash'> {
  const clone = structuredClone(entry) as Partial<CanonicalCloudDispatchOutboxEntry>
  delete clone.immutableEntryHash
  delete clone.entryHash
  return clone as Omit<CanonicalCloudDispatchOutboxEntry, 'immutableEntryHash' | 'entryHash'>
}

function replaceEntry(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  entry: CanonicalCloudDispatchOutboxEntry,
): void {
  const index = aggregate.entries.findIndex((candidate) =>
    candidate.immutable.dispatchIntentId === entry.immutable.dispatchIntentId)
  if (index < 0) throw invalidOutbox('Cloud dispatch outbox entry was not found.')
  aggregate.entries[index] = entry
}

function requiredEntry(
  aggregate: CanonicalCloudDispatchOutboxAggregate,
  dispatchIntentId: string,
): CanonicalCloudDispatchOutboxEntry {
  const entry = aggregate.entries.find((candidate) =>
    candidate.immutable.dispatchIntentId === dispatchIntentId)
  if (!entry) throw new ApiError('JOB_NOT_FOUND', 'Cloud dispatch outbox intent was not found.', 404)
  return entry
}

function assertEntryScope(
  scope: CanonicalCloudDispatchOutboxStoreScope,
  entry: CanonicalCloudDispatchOutboxEntry,
): void {
  const identity = entry.immutable
  if (
    identity.workspaceId !== scope.workspaceId ||
    identity.projectId !== scope.projectId ||
    identity.editSessionId !== scope.editSessionId ||
    identity.packageRecordId !== scope.packageRecordId ||
    identity.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId
  ) throw invalidOutbox('Cloud dispatch outbox entry is outside its tenant/package scope.')
}

function assertScope(scope: CanonicalCloudDispatchOutboxStoreScope): void {
  if (
    !scope.localStorageRoot.trim() ||
    [
      scope.ownerUserId,
      scope.workspaceId,
      scope.projectId,
      scope.editSessionId,
      scope.packageRecordId,
      scope.approvedPlanSnapshotId,
    ].some((value) => !safeIdentity(value))
  ) throw new ApiError('VALIDATION_FAILED', 'Cloud dispatch outbox scope is invalid.', 400)
}

function safeIdentity(value: string): boolean {
  return value.length > 0 && value.length <= 240 &&
    /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(value) && !value.includes('..')
}

function validTimestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new ApiError('VALIDATION_FAILED', `Canonical ${label} timestamp is invalid.`, 400)
  }
  return value
}

function outboxBoundaries() {
  return {
    privateLocalPersistence: true as const,
    tenantPackageAndAttemptScoped: true as const,
    checksumProtected: true as const,
    atomicAggregateReplacement: true as const,
    hostRestartRecovery: true as const,
    opaqueHashOnlyHandoffPersistence: true as const,
    rawMediaPromptPathSignedUrlOrCredentialPersisted: false as const,
    packageQueueOwnsApprovedAttempts: true as const,
    crossProcessAtomicClaimProven: true as const,
    distributedOutboxTransactionVerified: false as const,
    liveGoogleOidcAndIamVerified: false as const,
    cloudTaskCreated: false as const,
    cloudRunJobExecuted: false as const,
    workerExecutionAuthorized: false as const,
    cloudDispatchAuthorized: false as const,
    productionAuthority: false as const,
  }
}

function invalidOutbox(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function idempotencyConflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function capacityExceeded(): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CAPACITY_EXCEEDED',
    'Cloud dispatch outbox reached its bounded private persistence capacity.',
    503,
  )
}
