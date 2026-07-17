import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
  CanonicalPrivatePackageWorkQueueJobDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION,
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION,
  canonicalPrivatePackageWorkQueueAggregateSchema,
  canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
  type CanonicalPrivatePackageWorkQueueAggregate,
  type CanonicalPrivatePackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueCompletedOutcome,
  type CanonicalPrivatePackageWorkQueueEntry,
  type CanonicalPrivatePackageWorkQueueEvent,
  type CanonicalPrivatePackageWorkQueueRelease,
} from '../validation/canonical-private-package-work-queue-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const STORE_RECORD_VERSION = 'private-canonical-package-work-queue-record-v1' as const
const STORE_RECORD_SOURCE = 'private_canonical_package_work_queue_store' as const
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
const MAX_QUEUE_EVENTS = 8_192
const queueLocks = new Map<string, Promise<void>>()

export interface CanonicalPrivatePackageWorkQueueStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

interface PersistedQueueEnvelope {
  recordVersion: typeof STORE_RECORD_VERSION
  source: typeof STORE_RECORD_SOURCE
  ownerUserId: string
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  checksumSha256: string
}

export type CanonicalPrivatePackageWorkQueueClaimResult =
  | {
      disposition: 'claimed'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry & { activeClaim: CanonicalPrivatePackageWorkQueueClaim }
      claimCredential: string
    }
  | {
      disposition: 'completed'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry
      outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
    }
  | {
      disposition: 'already_leased' | 'dependency_blocked' | 'scheduled_wait' |
        'capability_blocked' | 'attempts_exhausted'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry
    }

export function clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke(): void {
  queueLocks.clear()
}

export async function ensurePrivateCanonicalPackageWorkQueue(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  now?: string
}): Promise<{ aggregate: CanonicalPrivatePackageWorkQueueAggregate; created: boolean }> {
  assertScope(input.scope)
  assertDefinitionScope(input.scope, input.definition)
  const path = canonicalPrivatePackageWorkQueueAggregateRelativePath(input.scope)
  return withQueueLock(path, async () => {
    const existing = await readQueueAggregate(input.scope, input.definition)
    if (existing) return { aggregate: existing, created: false }
    const createdAt = validTimestamp(input.now ?? new Date().toISOString(), 'queue creation')
    const entries = input.definition.jobs.map((definition) => createQueuedEntry(definition, createdAt))
    const queueCreated = createEvent({
      priorEvents: [],
      eventType: 'queue_created',
      at: createdAt,
    })
    const aggregate = finalizeAggregate({
      schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION,
      source: 'private_canonical_package_work_queue_store',
      ownerUserId: input.scope.ownerUserId,
      definitionHash: input.definition.definitionHash,
      identity: { ...input.definition.identity },
      entries,
      events: [queueCreated],
      boundaries: queueBoundaries(),
      createdAt,
      updatedAt: createdAt,
    })
    await persistQueueAggregate(input.scope, aggregate)
    return { aggregate, created: true }
  })
}

export async function readPrivateCanonicalPackageWorkQueue(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
}): Promise<CanonicalPrivatePackageWorkQueueAggregate | undefined> {
  assertScope(input.scope)
  assertDefinitionScope(input.scope, input.definition)
  return readQueueAggregate(input.scope, input.definition)
}

export async function claimPrivateCanonicalPackageWorkQueueJob(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  workerIdentity: string
  workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
  now: string
  leaseDurationMs: number
}): Promise<CanonicalPrivatePackageWorkQueueClaimResult> {
  const now = validTimestamp(input.now, 'queue claim')
  assertWorkerIdentity(input.workerIdentity)
  assertLeaseDuration(input.leaseDurationMs)
  return mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    if (entry.definition.workerType !== input.workerType) {
      throw new ApiError(
        'WORKER_CLAIM_CONFLICT',
        'Canonical queue worker type does not match immutable resource placement.',
        409,
      )
    }
    if (entry.state === 'completed') {
      return {
        disposition: 'completed' as const,
        entry,
        outcome: entry.completion!.outcome,
      }
    }
    if (entry.state === 'leased') {
      return { disposition: 'already_leased' as const, entry }
    }
    if (entry.deliveryAttemptCount >= entry.definition.maxAttempts) {
      return { disposition: 'attempts_exhausted' as const, entry }
    }
    if (!entry.definition.privateExecutionReady) {
      return { disposition: 'capability_blocked' as const, entry }
    }
    if (Date.parse(entry.definition.scheduledFor) > Date.parse(now)) {
      return { disposition: 'scheduled_wait' as const, entry }
    }
    const completedJobIds = new Set(aggregate.entries
      .filter((candidate) => candidate.state === 'completed')
      .map((candidate) => candidate.definition.jobId))
    if (entry.definition.dependencyJobIds.some((dependencyJobId) =>
      !completedJobIds.has(dependencyJobId))) {
      return { disposition: 'dependency_blocked' as const, entry }
    }

    const claimCredential = randomBytes(32).toString('base64url')
    const claimId = `queue_claim_${randomUUID()}`
    const deliveryAttempt = entry.deliveryAttemptCount + 1
    const attemptDeadlineAt = new Date(
      Date.parse(now) + entry.definition.attemptTimeoutSeconds * 1_000,
    ).toISOString()
    const expiresAt = new Date(Math.min(
      Date.parse(now) + input.leaseDurationMs,
      Date.parse(attemptDeadlineAt),
    )).toISOString()
    const claimWithoutHash = {
      claimId,
      credentialSha256: sha256Text(claimCredential),
      workerIdentityHash: sha256AuthorityValue({
        domain: 'reeditpro:canonical-private-package-work-queue-worker:v1',
        workerIdentity: input.workerIdentity,
      }),
      workerType: entry.definition.workerType,
      resourceClassId: entry.definition.resourceClassId,
      placementHash: entry.definition.placementHash,
      deliveryAttempt,
      claimedAt: now,
      heartbeatAt: now,
      heartbeatCount: 0,
      expiresAt,
      attemptDeadlineAt,
    }
    const claim: CanonicalPrivatePackageWorkQueueClaim = {
      ...claimWithoutHash,
      claimHash: sha256AuthorityValue(claimWithoutHash),
    }
    entry.state = 'leased'
    entry.deliveryAttemptCount = deliveryAttempt
    entry.activeClaim = claim
    entry.completion = undefined
    entry.lastRelease = undefined
    touchEntry(entry, now)
    appendEvent(aggregate, {
      eventType: 'job_claimed',
      jobId: entry.definition.jobId,
      claimId,
      at: now,
    })
    return {
      disposition: 'claimed' as const,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        activeClaim: CanonicalPrivatePackageWorkQueueClaim
      },
      claimCredential,
    }
  })
}

export async function heartbeatPrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  now: string
  leaseDurationMs: number
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue heartbeat')
  assertLeaseDuration(input.leaseDurationMs)
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    const claim = requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    const expiresAtMs = Math.min(
      Date.parse(now) + input.leaseDurationMs,
      Date.parse(claim.attemptDeadlineAt),
    )
    if (expiresAtMs <= Date.parse(now)) {
      throw workerLeaseExpired()
    }
    const withoutHash = {
      ...claim,
      heartbeatAt: now,
      heartbeatCount: claim.heartbeatCount + 1,
      expiresAt: new Date(expiresAtMs).toISOString(),
    } as Omit<CanonicalPrivatePackageWorkQueueClaim, 'claimHash'> & { claimHash?: string }
    delete withoutHash.claimHash
    entry.activeClaim = {
      ...withoutHash,
      claimHash: sha256AuthorityValue(withoutHash),
    }
    touchEntry(entry, now)
    return { disposition: 'heartbeat' as const }
  })
  return result.aggregate
}

export async function completePrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
  now: string
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue completion')
  const outcome = canonicalPrivatePackageWorkQueueCompletedOutcomeSchema.parse(input.outcome)
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    if (entry.state === 'completed') {
      if (
        entry.completion!.claimId !== input.claimId ||
        !constantTimeHashEquals(
          entry.completion!.credentialSha256,
          sha256Text(input.claimCredential),
        )
      ) throw workerLeaseExpired()
      if (stableAuthorityStringify(entry.completion!.outcome) !== stableAuthorityStringify(outcome)) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical queue completion already has different bytes.', 409)
      }
      return { disposition: 'completed_replay' as const }
    }
    requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    assertOutcomeMatchesDefinition(outcome, entry.definition)
    const completionWithoutHash = {
      claimId: input.claimId,
      credentialSha256: sha256Text(input.claimCredential),
      outcome,
      completedAt: now,
    }
    entry.state = 'completed'
    entry.activeClaim = undefined
    entry.completion = {
      ...completionWithoutHash,
      completionHash: sha256AuthorityValue(completionWithoutHash),
    }
    entry.lastRelease = undefined
    touchEntry(entry, now)
    appendEvent(aggregate, {
      eventType: 'job_completed',
      jobId: entry.definition.jobId,
      claimId: input.claimId,
      at: now,
    })
    return { disposition: 'completed' as const }
  })
  return result.aggregate
}

export async function releasePrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  reason: Exclude<CanonicalPrivatePackageWorkQueueRelease['reason'], 'expired_claim_recovered'>
  now: string
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue release')
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    if (entry.state === 'queued' && entry.lastRelease?.claimId === input.claimId) {
      if (
        entry.lastRelease.reason !== input.reason ||
        !constantTimeHashEquals(
          entry.lastRelease.credentialSha256,
          sha256Text(input.claimCredential),
        )
      ) throw workerLeaseExpired()
      return { disposition: 'release_replay' as const }
    }
    requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    releaseEntry(entry, input.claimId, sha256Text(input.claimCredential), input.reason, now)
    appendEvent(aggregate, {
      eventType: 'claim_released',
      jobId: entry.definition.jobId,
      claimId: input.claimId,
      at: now,
    })
    return { disposition: 'released' as const }
  })
  return result.aggregate
}

export function canonicalPrivatePackageWorkQueueAggregateRelativePath(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): string {
  assertScope(scope)
  const tenantHash = sha256Text(`${scope.ownerUserId}\u0000${scope.workspaceId}`).slice(0, 32)
  const packageHash = sha256Text([
    tenantHash,
    scope.projectId,
    scope.editSessionId,
    scope.packageRecordId,
    scope.approvedPlanSnapshotId,
  ].join('\u0000'))
  return `private-internal/canonical-package-work-queues/v1/${tenantHash}/${packageHash}.json`
}

async function mutateQueue<T extends { disposition: string }>(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  now: string,
  mutation: (aggregate: CanonicalPrivatePackageWorkQueueAggregate) => T,
): Promise<T & { aggregate: CanonicalPrivatePackageWorkQueueAggregate }> {
  assertScope(scope)
  assertDefinitionScope(scope, definition)
  const path = canonicalPrivatePackageWorkQueueAggregateRelativePath(scope)
  return withQueueLock(path, async () => {
    const current = await readQueueAggregate(scope, definition)
    if (!current) throw invalidQueue('Canonical package work queue has not been created.')
    const before = structuredClone(current)
    const value = mutation(current)
    assertCompletedEntriesImmutable(before, current)
    if (stableAuthorityStringify(before) === stableAuthorityStringify(current)) {
      return { ...value, aggregate: current }
    }
    const aggregate = finalizeAggregate({
      ...current,
      updatedAt: now,
      aggregateHash: undefined,
      summary: undefined,
    })
    await persistQueueAggregate(scope, aggregate)
    return { ...value, aggregate }
  })
}

async function readQueueAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): Promise<CanonicalPrivatePackageWorkQueueAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivatePackageWorkQueueAggregateRelativePath(scope),
  })
  if (!content) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_AGGREGATE_BYTES) {
    throw invalidQueue('Canonical package work-queue record exceeds its private bound.')
  }
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidQueue('Canonical package work-queue record is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidQueue('Canonical package work-queue record is invalid.')
  }
  const envelope = value as Partial<PersistedQueueEnvelope>
  const parsed = canonicalPrivatePackageWorkQueueAggregateSchema.safeParse(envelope.aggregate)
  if (
    envelope.recordVersion !== STORE_RECORD_VERSION ||
    envelope.source !== STORE_RECORD_SOURCE ||
    envelope.ownerUserId !== scope.ownerUserId ||
    typeof envelope.checksumSha256 !== 'string' ||
    !parsed.success ||
    envelope.checksumSha256 !== sha256AuthorityValue(parsed.data)
  ) throw invalidQueue('Canonical package work-queue persistence integrity is invalid.')
  assertAggregateIntegrity(parsed.data, definition, scope)
  return parsed.data
}

async function persistQueueAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
): Promise<void> {
  const envelope: PersistedQueueEnvelope = {
    recordVersion: STORE_RECORD_VERSION,
    source: STORE_RECORD_SOURCE,
    ownerUserId: scope.ownerUserId,
    aggregate,
    checksumSha256: sha256AuthorityValue(aggregate),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_AGGREGATE_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical package work queue exceeded its bounded private persistence capacity.',
      503,
    )
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivatePackageWorkQueueAggregateRelativePath(scope),
    content,
  })
}

function finalizeAggregate(input: Omit<CanonicalPrivatePackageWorkQueueAggregate, 'summary' | 'aggregateHash'> & {
  summary?: undefined
  aggregateHash?: undefined
}): CanonicalPrivatePackageWorkQueueAggregate {
  const entries = input.entries.map((entry) => finalizeEntry(entry))
  const summary = {
    totalJobCount: entries.length,
    queuedJobCount: entries.filter((entry) => entry.state === 'queued').length,
    leasedJobCount: entries.filter((entry) => entry.state === 'leased').length,
    completedJobCount: entries.filter((entry) => entry.state === 'completed').length,
    totalDeliveryAttemptCount: entries.reduce((total, entry) => total + entry.deliveryAttemptCount, 0),
    expiredClaimRecoveryCount: entries.reduce((total, entry) =>
      total + entry.expiredClaimRecoveryCount, 0),
    releasedClaimCount: input.events.filter((event) => event.eventType === 'claim_released').length,
    eventCount: input.events.length,
  }
  const payload = { ...input, entries, summary }
  return canonicalPrivatePackageWorkQueueAggregateSchema.parse({
    ...payload,
    aggregateHash: sha256AuthorityValue(payload),
  })
}

function finalizeEntry(
  input: Omit<CanonicalPrivatePackageWorkQueueEntry, 'entryHash'> & { entryHash?: string },
): CanonicalPrivatePackageWorkQueueEntry {
  const payload = { ...input }
  delete payload.entryHash
  return {
    ...payload,
    entryHash: sha256AuthorityValue(payload),
  }
}

function createQueuedEntry(
  definition: CanonicalPrivatePackageWorkQueueJobDefinition,
  now: string,
): CanonicalPrivatePackageWorkQueueEntry {
  return finalizeEntry({
    definition,
    state: 'queued',
    deliveryAttemptCount: 0,
    expiredClaimRecoveryCount: 0,
    updatedAt: now,
  })
}

function touchEntry(entry: CanonicalPrivatePackageWorkQueueEntry, now: string): void {
  entry.updatedAt = now
  entry.entryHash = ''
}

function expireClaims(aggregate: CanonicalPrivatePackageWorkQueueAggregate, now: string): void {
  const nowMs = Date.parse(now)
  for (const entry of aggregate.entries) {
    const claim = entry.activeClaim
    if (entry.state !== 'leased' || !claim || Date.parse(claim.expiresAt) > nowMs) continue
    entry.expiredClaimRecoveryCount += 1
    releaseEntry(
      entry,
      claim.claimId,
      claim.credentialSha256,
      'expired_claim_recovered',
      now,
    )
    appendEvent(aggregate, {
      eventType: 'expired_claim_recovered',
      jobId: entry.definition.jobId,
      claimId: claim.claimId,
      at: now,
    })
  }
}

function releaseEntry(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  claimId: string,
  credentialSha256: string,
  reason: CanonicalPrivatePackageWorkQueueRelease['reason'],
  now: string,
): void {
  const releaseWithoutHash = { claimId, credentialSha256, reason, releasedAt: now }
  entry.state = 'queued'
  entry.activeClaim = undefined
  entry.completion = undefined
  entry.lastRelease = {
    ...releaseWithoutHash,
    releaseHash: sha256AuthorityValue(releaseWithoutHash),
  }
  touchEntry(entry, now)
}

function appendEvent(
  aggregate: Pick<CanonicalPrivatePackageWorkQueueAggregate, 'events'>,
  input: {
    eventType: CanonicalPrivatePackageWorkQueueEvent['eventType']
    jobId?: string
    claimId?: string
    at: string
  },
): void {
  if (aggregate.events.length >= MAX_QUEUE_EVENTS) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical package work-queue event capacity is exhausted.',
      503,
    )
  }
  aggregate.events.push(createEvent({ priorEvents: aggregate.events, ...input }))
}

function createEvent(input: {
  priorEvents: CanonicalPrivatePackageWorkQueueEvent[]
  eventType: CanonicalPrivatePackageWorkQueueEvent['eventType']
  jobId?: string
  claimId?: string
  at: string
}): CanonicalPrivatePackageWorkQueueEvent {
  const withoutHash = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION,
    sequence: input.priorEvents.length + 1,
    eventType: input.eventType,
    ...(input.jobId ? { jobId: input.jobId } : {}),
    ...(input.claimId ? { claimId: input.claimId } : {}),
    at: input.at,
    previousEventHash: input.priorEvents.at(-1)?.eventHash ?? null,
  }
  return { ...withoutHash, eventHash: sha256AuthorityValue(withoutHash) }
}

function requireActiveClaim(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  claimId: string,
  claimCredential: string,
  now: string,
): CanonicalPrivatePackageWorkQueueClaim {
  const claim = entry.activeClaim
  if (
    entry.state !== 'leased' || !claim || claim.claimId !== claimId ||
    Date.parse(claim.expiresAt) <= Date.parse(now) ||
    !constantTimeHashEquals(claim.credentialSha256, sha256Text(claimCredential))
  ) throw workerLeaseExpired()
  return claim
}

function requiredEntry(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  jobId: string,
): CanonicalPrivatePackageWorkQueueEntry {
  const entry = aggregate.entries.find((candidate) => candidate.definition.jobId === jobId)
  if (!entry) throw new ApiError('JOB_NOT_FOUND', 'Canonical package work-queue job was not found.', 404)
  return entry
}

function assertAggregateIntegrity(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): void {
  const { aggregateHash, ...aggregatePayload } = aggregate
  if (
    aggregateHash !== sha256AuthorityValue(aggregatePayload) ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.definitionHash !== definition.definitionHash ||
    stableAuthorityStringify(aggregate.identity) !== stableAuthorityStringify(definition.identity) ||
    aggregate.entries.length !== definition.jobs.length ||
    aggregate.entries.some((entry, index) => {
      const { entryHash, ...entryPayload } = entry
      return entryHash !== sha256AuthorityValue(entryPayload) ||
        stableAuthorityStringify(entry.definition) !== stableAuthorityStringify(definition.jobs[index]) ||
        !nestedHashesValid(entry)
    }) ||
    aggregate.events.some((event) => {
      const { eventHash, ...eventPayload } = event
      return eventHash !== sha256AuthorityValue(eventPayload)
    })
  ) throw invalidQueue('Canonical package work-queue authority or hash lineage is invalid.')
}

function nestedHashesValid(entry: CanonicalPrivatePackageWorkQueueEntry): boolean {
  if (entry.activeClaim) {
    const { claimHash, ...payload } = entry.activeClaim
    if (claimHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.completion) {
    const { completionHash, ...payload } = entry.completion
    if (completionHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.lastRelease) {
    const { releaseHash, ...payload } = entry.lastRelease
    if (releaseHash !== sha256AuthorityValue(payload)) return false
  }
  return true
}

function assertCompletedEntriesImmutable(
  before: CanonicalPrivatePackageWorkQueueAggregate,
  after: CanonicalPrivatePackageWorkQueueAggregate,
): void {
  for (const prior of before.entries.filter((entry) => entry.state === 'completed')) {
    const current = after.entries.find((entry) => entry.definition.jobId === prior.definition.jobId)
    if (!current || stableAuthorityStringify(current) !== stableAuthorityStringify(prior)) {
      throw invalidQueue('Canonical package work-queue completion is immutable.')
    }
  }
  if (
    after.events.length < before.events.length ||
    before.events.some((event, index) =>
      stableAuthorityStringify(event) !== stableAuthorityStringify(after.events[index]))
  ) throw invalidQueue('Canonical package work-queue event history is append-only.')
}

function assertOutcomeMatchesDefinition(
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome,
  definition: CanonicalPrivatePackageWorkQueueJobDefinition,
): void {
  if (
    outcome.jobId !== definition.jobId ||
    outcome.approvedWorkItemId !== definition.approvedWorkItemId ||
    outcome.workItemKey !== definition.workItemKey ||
    outcome.required !== definition.required ||
    stableAuthorityStringify(outcome.dependencyJobIds) !==
      stableAuthorityStringify(definition.dependencyJobIds)
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical queue completion does not match job authority.', 409)
}

function assertDefinitionScope(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): void {
  if (
    definition.identity.workspaceId !== scope.workspaceId ||
    definition.identity.projectId !== scope.projectId ||
    definition.identity.editSessionId !== scope.editSessionId ||
    definition.identity.packageRecordId !== scope.packageRecordId ||
    definition.identity.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue scope is invalid.', 400)
}

function assertScope(scope: CanonicalPrivatePackageWorkQueueStoreScope): void {
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
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue persistence scope is invalid.', 400)
}

function assertWorkerIdentity(value: string): void {
  const normalized = value.trim()
  if (!normalized || normalized.length > 240) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue worker identity is invalid.', 400)
  }
}

function assertLeaseDuration(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 86_400_000) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue lease duration is invalid.', 400)
  }
}

function validTimestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new ApiError('VALIDATION_FAILED', `Canonical ${label} timestamp is invalid.`, 400)
  }
  return value
}

function safeIdentity(value: string): boolean {
  return value.length > 0 && value.length <= 240 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) && !value.includes('..')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function constantTimeHashEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'hex')
  const rightBytes = Buffer.from(right, 'hex')
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

function queueBoundaries() {
  return {
    privateLocalPersistence: true as const,
    tenantAndPackageScoped: true as const,
    checksumProtected: true as const,
    atomicAggregateReplacement: true as const,
    hostRestartClaimRecovery: true as const,
    completedJobsAreTerminal: true as const,
    plaintextClaimCredentialsPersisted: false as const,
    claimCredentialDigestsPersisted: true as const,
    browserClaimAllowed: false as const,
    crossProcessAtomicClaimProven: false as const,
    distributedTransactionProven: false as const,
    cloudServiceIdentityVerified: false as const,
    cloudDispatchAuthorized: false as const,
    productionAuthority: false as const,
  }
}

async function withQueueLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = queueLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const tail = previous.catch(() => undefined).then(() => current)
  queueLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (queueLocks.get(key) === tail) queueLocks.delete(key)
  }
}

function invalidQueue(message: string): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}

function workerLeaseExpired(): ApiError {
  return new ApiError(
    'WORKER_LEASE_EXPIRED',
    'Canonical package work-queue claim is unavailable, expired, or invalid.',
    409,
  )
}
