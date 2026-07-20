import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  canonicalProviderWorkAuthorizationRequestHash,
  resolveCanonicalProviderOperation,
  type CanonicalProviderWorkAuthorization,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { PrivateProviderAttemptCostEvidence } from
  '../tool-cost-metering/private-provider-attempt-cost-evidence'
import {
  CANONICAL_PRIVATE_PROVIDER_DISPATCH_AGGREGATE_VERSION,
  CANONICAL_PRIVATE_PROVIDER_DISPATCH_EVENT_VERSION,
  CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_VERSION,
  CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_VERSION,
  canonicalPrivateProviderDispatchAggregateSchema,
  canonicalPrivateProviderDispatchAttemptSchema,
  canonicalPrivateProviderDispatchEntrySchema,
  canonicalPrivateProviderDispatchGrantSchema,
  canonicalPrivateProviderDispatchTerminalSchema,
  type CanonicalPrivateProviderDispatchAggregate,
  type CanonicalPrivateProviderDispatchEntry,
  type CanonicalPrivateProviderDispatchEvent,
  type CanonicalPrivateProviderDispatchGrant,
  type CanonicalPrivateProviderDispatchTerminal,
  type CanonicalPrivateProviderOutput,
} from '../validation/canonical-private-provider-dispatch-schemas'
import type { CanonicalPrivatePackageWorkQueueClaim } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalPrivatePackageStateLockAuthority,
  withCanonicalPrivatePackageStateLock,
  type CanonicalPrivatePackageStateLockAuthority,
} from './private-canonical-package-state-transaction'
import type { CanonicalPrivatePackageWorkQueueStoreScope } from
  './private-canonical-package-work-queue-store'

const RECORD_VERSION = 'private-canonical-provider-dispatch-record-v1' as const
const RECORD_SOURCE = 'private_canonical_provider_dispatch_store' as const
const CREDENTIAL_DOMAIN = 'reeditpro:canonical-provider-dispatch-credential:v1'
const MAX_RECORD_BYTES = 512 * 1024

interface PersistedEnvelope {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  ownerUserId: string
  aggregate: CanonicalPrivateProviderDispatchAggregate
  checksumSha256: string
}

export interface IssuePrivateCanonicalProviderDispatchGrantInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  authorization: CanonicalProviderWorkAuthorization
  claim: CanonicalPrivatePackageWorkQueueClaim
  secretReferenceName?: string
  credentialSecret: string
  now: string
}

export async function issuePrivateCanonicalProviderDispatchGrant(
  input: IssuePrivateCanonicalProviderDispatchGrantInput,
): Promise<{
  disposition: 'issued' | 'exact_replay'
  grant: CanonicalPrivateProviderDispatchGrant
  dispatchCredential: string
  aggregate: CanonicalPrivateProviderDispatchAggregate
}> {
  const now = validTimestamp(input.now, 'provider dispatch issuance')
  assertCredentialSecret(input.credentialSecret)
  assertAuthorizationScope(input.scope, input.authorization)
  assertClaimBinding(input.authorization, input.claim, now)
  const profile = resolveCanonicalProviderOperation(input.authorization.operationId)
  const secretReferenceName = normalizeSecretReference(input.secretReferenceName)
  if (
    input.authorization.authorityClass === 'canonical_backend_verified_runtime' &&
    secretReferenceName !== profile.secretLocator.expectedSecretId
  ) {
    throw new ApiError(
      'PROVIDER_ROUTE_BLOCKED',
      'Canonical provider runtime requires the exact server-only secret reference.',
      503,
      { requiredGate: 'canonical_provider_secret_reference_binding' },
    )
  }
  const authorizationRequestHash =
    canonicalProviderWorkAuthorizationRequestHash(input.authorization)
  const grantId = `provider_dispatch_${sha256AuthorityValue({
    authorizationHash: input.authorization.authorityHash,
    queueClaimHash: input.claim.claimHash,
    authorizationRequestHash,
  }).slice(0, 48)}`
  const expiresAt = new Date(Math.min(
    Date.parse(input.authorization.expiresAt),
    Date.parse(input.claim.expiresAt),
  )).toISOString()
  const credential = deriveDispatchCredential({
    credentialSecret: input.credentialSecret,
    grantId,
    authorizationHash: input.authorization.authorityHash,
    claimHash: input.claim.claimHash,
    expiresAt,
  })
  const withoutHash = {
    schemaVersion: CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_VERSION,
    grantId,
    authorizationVersion: input.authorization.schemaVersion,
    authorizationHash: input.authorization.authorityHash,
    authorizationRequestHash,
    ownerUserId: input.authorization.ownerUserId,
    workspaceId: input.authorization.workspaceId,
    projectId: input.authorization.projectId,
    editSessionId: input.authorization.editSessionId,
    approvedPlanSnapshotId: input.authorization.approvedPlanSnapshotId,
    packageRecordId: input.authorization.packageRecordId,
    packageHash: input.authorization.packageHash,
    queueDefinitionHash: input.authorization.queueDefinitionHash,
    queueJobId: input.authorization.queueJobId,
    queueJobDefinitionHash: input.authorization.queueJobDefinitionHash,
    approvedWorkItemId: input.authorization.approvedWorkItemId,
    expectedOutputId: input.authorization.expectedOutputId,
    queueClaimId: input.claim.claimId,
    queueClaimHash: input.claim.claimHash,
    queueClaimDeliveryAttempt: input.claim.deliveryAttempt,
    queueClaimExpiresAt: input.claim.expiresAt,
    operationId: input.authorization.operationId,
    providerBoundaryProfileId: input.authorization.providerBoundaryProfileId,
    providerRouteId: input.authorization.providerRouteId,
    providerModelId: input.authorization.providerModelId,
    sourceRequestId: input.authorization.sourceRequestId,
    sourceRequestDigest: input.authorization.sourceRequestDigest,
    providerRequestPayloadDigest: input.authorization.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.authorization.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.authorization.providerAccountPolicyDigest,
    idempotencyKeyHash: input.authorization.idempotencyKeyHash,
    credentialSha256: sha256Text(credential),
    secretLocator: {
      configurationKey: profile.secretLocator.configurationKey,
      referenceName: secretReferenceName,
      referencePresent: secretReferenceName !== null,
      payloadReadCount: 0 as const,
      payloadPersisted: false as const,
      payloadLogged: false as const,
    },
    executionClass: input.authorization.authorityClass ===
      'private_injected_nonprovider_test'
      ? 'private_injected_nonprovider_test' as const
      : 'canonical_backend_runtime_unreleased' as const,
    providerCallAuthorized: input.authorization.boundaries.providerCallAuthorized,
    maximumProviderRequests: 1 as const,
    maximumRetries: 0 as const,
    maximumFallbacks: 0 as const,
    maximumAuthorizedProviderCostMicros:
      input.authorization.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.authorization.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      input.authorization.maximumAuthorizedTotalInternalCostMicros,
    issuedAt: now,
    expiresAt,
  }
  const grant = canonicalPrivateProviderDispatchGrantSchema.parse({
    ...withoutHash,
    immutableGrantHash: sha256AuthorityValue(withoutHash),
  })

  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => {
      const current = await readAggregate(lockAuthority, input.scope)
      const aggregate = current ?? emptyAggregate(input.scope, input.authorization, now)
      if (
        aggregate.identity.packageHash !== input.authorization.packageHash ||
        aggregate.identity.queueDefinitionHash !==
          input.authorization.queueDefinitionHash
      ) {
        throw conflict(
          'Provider dispatch aggregate does not match the exact package and queue authority.',
        )
      }
      const existing = aggregate.entries.find((entry) =>
        entry.grant.grantId === grant.grantId ||
        entry.grant.idempotencyKeyHash === grant.idempotencyKeyHash)
      if (existing) {
        if (stableAuthorityStringify(existing.grant) !== stableAuthorityStringify(grant)) {
          throw conflict('Provider dispatch idempotency key conflicts with another grant.')
        }
        return {
          disposition: 'exact_replay' as const,
          grant: existing.grant,
          dispatchCredential: credential,
          aggregate,
        }
      }
      if (aggregate.entries.length >= 10) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Canonical provider dispatch attempt capacity was reached.',
          503,
        )
      }
      aggregate.entries.push(finalizeEntry({
        grant,
        state: 'issued',
        terminalHistory: [],
        updatedAt: now,
      }))
      appendEvent(aggregate, {
        eventType: 'grant_issued',
        grantId: grant.grantId,
        at: now,
      })
      const finalized = finalizeAggregate(aggregate, now)
      await persistAggregate(input.scope, finalized)
      return {
        disposition: 'issued' as const,
        grant,
        dispatchCredential: credential,
        aggregate: finalized,
      }
    },
  })
}

export async function consumePrivateCanonicalProviderDispatchGrant(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  grantId: string
  dispatchCredential: string
  credentialSecret: string
  workerIdentity: string
  providerRequestStarted: boolean
  now: string
}): Promise<{
  disposition: 'consumed' | 'exact_replay'
  entry: CanonicalPrivateProviderDispatchEntry & {
    attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
  }
  aggregate: CanonicalPrivateProviderDispatchAggregate
}> {
  const now = validTimestamp(input.now, 'provider dispatch consumption')
  assertCredentialSecret(input.credentialSecret)
  const workerIdentity = safeIdentity(input.workerIdentity, 'provider worker identity')
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => {
      const aggregate = await requiredAggregate(lockAuthority, input.scope)
      const entry = requiredEntry(aggregate, input.grantId)
      verifyDispatchCredential({
        grant: entry.grant,
        credentialSecret: input.credentialSecret,
        candidate: input.dispatchCredential,
      })
      if (Date.parse(entry.grant.expiresAt) <= Date.parse(now)) {
        throw new ApiError('WORKER_LEASE_EXPIRED', 'Provider dispatch grant expired.', 409)
      }
      if (entry.attempt) {
        if (
          entry.attempt.workerIdentityHash !== workerIdentityHash(workerIdentity) ||
          entry.attempt.providerRequestStarted !== input.providerRequestStarted
        ) throw conflict('Consumed provider dispatch replay changed worker or request state.')
        return {
          disposition: 'exact_replay' as const,
          entry: entry as CanonicalPrivateProviderDispatchEntry & {
            attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
          },
          aggregate,
        }
      }
      if (entry.state !== 'issued') {
        throw conflict('Provider dispatch grant is not available for consumption.')
      }
      if (input.providerRequestStarted && !entry.grant.providerCallAuthorized) {
        throw new ApiError(
          'REAL_PROVIDER_CALLS_DISABLED',
          'Injected provider-dispatch proof cannot start a provider request.',
          403,
        )
      }
      const attemptWithoutHash = {
        dispatchAttemptId: `provider_attempt_${sha256AuthorityValue({
          grantId: entry.grant.grantId,
          claimHash: entry.grant.queueClaimHash,
          deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
        }).slice(0, 48)}`,
        grantId: entry.grant.grantId,
        authorizationHash: entry.grant.authorizationHash,
        queueClaimId: entry.grant.queueClaimId,
        queueClaimHash: entry.grant.queueClaimHash,
        queueClaimDeliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
        workerIdentityHash: workerIdentityHash(workerIdentity),
        consumedAt: now,
        consumptionCount: 1 as const,
        providerRequestStarted: input.providerRequestStarted,
        plaintextDispatchCredentialPersisted: false as const,
      }
      entry.attempt = canonicalPrivateProviderDispatchAttemptSchema.parse({
        ...attemptWithoutHash,
        attemptHash: sha256AuthorityValue(attemptWithoutHash),
      })
      entry.state = 'consumed'
      entry.updatedAt = now
      replaceEntryHash(entry)
      appendEvent(aggregate, {
        eventType: 'dispatch_consumed',
        grantId: entry.grant.grantId,
        dispatchAttemptId: entry.attempt.dispatchAttemptId,
        at: now,
      })
      const finalized = finalizeAggregate(aggregate, now)
      await persistAggregate(input.scope, finalized)
      return {
        disposition: 'consumed' as const,
        entry: requiredEntry(finalized, input.grantId) as
          CanonicalPrivateProviderDispatchEntry & {
            attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
          },
        aggregate: finalized,
      }
    },
  })
}

export async function recordPrivateCanonicalProviderDispatchTerminal(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  grantId: string
  state: CanonicalPrivateProviderDispatchTerminal['state']
  providerRequestCount: 0 | 1
  providerResponseUsageDigest: string | null
  sanitizedFailureCode: string | null
  privateOutput: CanonicalPrivateProviderOutput | null
  costEvidence: PrivateProviderAttemptCostEvidence
  now: string
}): Promise<{
  disposition: 'recorded' | 'exact_replay'
  terminal: CanonicalPrivateProviderDispatchTerminal
  entry: CanonicalPrivateProviderDispatchEntry
  aggregate: CanonicalPrivateProviderDispatchAggregate
}> {
  const now = validTimestamp(input.now, 'provider dispatch terminal')
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => {
      const aggregate = await requiredAggregate(lockAuthority, input.scope)
      const entry = requiredEntry(aggregate, input.grantId)
      const attempt = entry.attempt
      if (!attempt) throw conflict('Provider dispatch terminal requires one consumed grant.')
      assertCostEvidenceBinding(entry, input.costEvidence)
      const prior = entry.terminalHistory.at(-1)
      const reconciling = input.state.startsWith('unknown_reconciled_')
      if (
        (reconciling && prior?.state !== 'unknown_reconciliation_required') ||
        (!reconciling && prior !== undefined)
      ) {
        const exact = entry.terminalHistory.find((terminal) =>
          terminal.state === input.state &&
          terminal.costEvidenceHash === input.costEvidence.evidenceHash)
        if (!exact) throw conflict('Provider dispatch terminal conflicts with existing outcome.')
        return {
          disposition: 'exact_replay' as const,
          terminal: exact,
          entry,
          aggregate,
        }
      }
      if (reconciling && input.costEvidence.priorUnknownCostEvidenceHash !==
        prior?.costEvidenceHash) {
        throw conflict('Provider unknown-outcome cost reconciliation lost prior evidence.')
      }
      const terminalWithoutHash = {
        schemaVersion: CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_VERSION,
        sequence: reconciling ? 2 as const : 1 as const,
        terminalId: `provider_terminal_${sha256AuthorityValue({
          attemptHash: attempt.attemptHash,
          state: input.state,
          costEvidenceHash: input.costEvidence.evidenceHash,
          priorTerminalHash: prior?.terminalHash ?? null,
        }).slice(0, 48)}`,
        dispatchAttemptId: attempt.dispatchAttemptId,
        state: input.state,
        providerRequestCount: input.providerRequestCount,
        retryCount: 0 as const,
        fallbackCount: 0 as const,
        dispatchConsumptionCount: 1 as const,
        unknownOutcomeReconciled:
          input.state !== 'unknown_reconciliation_required',
        providerResponseUsageDigest: input.providerResponseUsageDigest,
        sanitizedFailureCode: input.sanitizedFailureCode,
        privateOutput: input.privateOutput,
        costEvidenceHash: input.costEvidence.evidenceHash,
        providerCostMicros:
          input.costEvidence.reconciliation.providerCostMicros,
        infrastructureCostMicros:
          input.costEvidence.reconciliation.infrastructureCostMicros,
        totalInternalProductionCostMicros:
          input.costEvidence.reconciliation.totalInternalProductionCostMicros,
        priorTerminalHash: prior?.terminalHash ?? null,
        completedAt: now,
      }
      const terminal = canonicalPrivateProviderDispatchTerminalSchema.parse({
        ...terminalWithoutHash,
        terminalHash: sha256AuthorityValue(terminalWithoutHash),
      })
      entry.terminalHistory.push(terminal)
      entry.state = terminal.state
      entry.updatedAt = now
      replaceEntryHash(entry)
      appendEvent(aggregate, {
        eventType: reconciling
          ? 'unknown_outcome_reconciled'
          : 'attempt_terminal',
        grantId: entry.grant.grantId,
        dispatchAttemptId: attempt.dispatchAttemptId,
        terminalId: terminal.terminalId,
        at: now,
      })
      const finalized = finalizeAggregate(aggregate, now)
      await persistAggregate(input.scope, finalized)
      return {
        disposition: 'recorded' as const,
        terminal,
        entry: requiredEntry(finalized, input.grantId),
        aggregate: finalized,
      }
    },
  })
}

export async function readPrivateCanonicalProviderDispatchAggregate(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
}): Promise<CanonicalPrivateProviderDispatchAggregate | undefined> {
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => readAggregate(lockAuthority, input.scope),
  })
}

export function canonicalPrivateProviderDispatchAggregateRelativePath(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): string {
  const tenantHash = sha256Text(`${scope.ownerUserId}\u0000${scope.workspaceId}`).slice(0, 32)
  const packageHash = sha256Text([
    tenantHash,
    scope.projectId,
    scope.editSessionId,
    scope.packageRecordId,
    scope.approvedPlanSnapshotId,
  ].join('\u0000'))
  return `private-internal/canonical-provider-dispatch/v1/${tenantHash}/${packageHash}.json`
}

function emptyAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  authorization: CanonicalProviderWorkAuthorization,
  now: string,
): CanonicalPrivateProviderDispatchAggregate {
  return finalizeAggregate({
    schemaVersion: CANONICAL_PRIVATE_PROVIDER_DISPATCH_AGGREGATE_VERSION,
    source: 'private_canonical_provider_dispatch_store',
    ownerUserId: scope.ownerUserId,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: scope.packageRecordId,
      approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
      packageHash: authorization.packageHash,
      queueDefinitionHash: authorization.queueDefinitionHash,
    },
    entries: [],
    events: [],
    boundaries: dispatchBoundaries(),
    createdAt: now,
    updatedAt: now,
    aggregateHash: '0'.repeat(64),
  }, now)
}

function finalizeAggregate(
  aggregate: CanonicalPrivateProviderDispatchAggregate,
  now: string,
): CanonicalPrivateProviderDispatchAggregate {
  const payload = {
    ...aggregate,
    entries: aggregate.entries.map((entry) => finalizeEntry(entry)),
    updatedAt: now,
  } as Omit<CanonicalPrivateProviderDispatchAggregate, 'aggregateHash'> & {
    aggregateHash?: string
  }
  delete payload.aggregateHash
  const parsed = canonicalPrivateProviderDispatchAggregateSchema.parse({
    ...payload,
    aggregateHash: sha256AuthorityValue(payload),
  })
  assertAggregateIntegrity(parsed)
  return parsed
}

function finalizeEntry(
  input: Omit<CanonicalPrivateProviderDispatchEntry, 'entryHash'> & {
    entryHash?: string
  },
): CanonicalPrivateProviderDispatchEntry {
  const payload = { ...input }
  delete payload.entryHash
  return canonicalPrivateProviderDispatchEntrySchema.parse({
    ...payload,
    entryHash: sha256AuthorityValue(payload),
  })
}

function replaceEntryHash(entry: CanonicalPrivateProviderDispatchEntry): void {
  const payload = { ...entry } as Partial<CanonicalPrivateProviderDispatchEntry>
  delete payload.entryHash
  entry.entryHash = sha256AuthorityValue(payload)
}

function appendEvent(
  aggregate: CanonicalPrivateProviderDispatchAggregate,
  input: Omit<CanonicalPrivateProviderDispatchEvent,
    'schemaVersion' | 'sequence' | 'previousEventHash' | 'eventHash'>,
): void {
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PROVIDER_DISPATCH_EVENT_VERSION,
    sequence: aggregate.events.length + 1,
    ...input,
    previousEventHash: aggregate.events.at(-1)?.eventHash ?? null,
  }
  aggregate.events.push({
    ...payload,
    eventHash: sha256AuthorityValue(payload),
  })
}

async function requiredAggregate(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): Promise<CanonicalPrivateProviderDispatchAggregate> {
  const aggregate = await readAggregate(lockAuthority, scope)
  if (!aggregate) throw new ApiError('JOB_NOT_FOUND', 'Provider dispatch authority was not found.', 404)
  return aggregate
}

async function readAggregate(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): Promise<CanonicalPrivateProviderDispatchAggregate | undefined> {
  assertCanonicalPrivatePackageStateLockAuthority({ lockAuthority, scope })
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivateProviderDispatchAggregateRelativePath(scope),
  })
  if (content === undefined) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_RECORD_BYTES) {
    throw invalidStore('Provider dispatch aggregate exceeds its byte boundary.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(content)
  } catch {
    throw invalidStore('Provider dispatch aggregate is not valid JSON.')
  }
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw invalidStore('Provider dispatch envelope is invalid.')
  }
  const envelope = decoded as Partial<PersistedEnvelope>
  if (
    envelope.recordVersion !== RECORD_VERSION || envelope.source !== RECORD_SOURCE ||
    envelope.ownerUserId !== scope.ownerUserId || !envelope.aggregate ||
    envelope.checksumSha256 !== sha256AuthorityValue(envelope.aggregate)
  ) throw invalidStore('Provider dispatch envelope integrity is invalid.')
  const aggregate = canonicalPrivateProviderDispatchAggregateSchema.parse(envelope.aggregate)
  assertAggregateScope(scope, aggregate)
  assertAggregateIntegrity(aggregate)
  return aggregate
}

async function persistAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  aggregate: CanonicalPrivateProviderDispatchAggregate,
): Promise<void> {
  assertAggregateScope(scope, aggregate)
  assertAggregateIntegrity(aggregate)
  const envelope: PersistedEnvelope = {
    recordVersion: RECORD_VERSION,
    source: RECORD_SOURCE,
    ownerUserId: scope.ownerUserId,
    aggregate,
    checksumSha256: sha256AuthorityValue(aggregate),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_RECORD_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Provider dispatch aggregate exceeds its safe capacity.',
      503,
    )
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivateProviderDispatchAggregateRelativePath(scope),
    content,
  })
}

function assertAggregateIntegrity(
  aggregate: CanonicalPrivateProviderDispatchAggregate,
): void {
  const { aggregateHash, ...payload } = aggregate
  if (aggregateHash !== sha256AuthorityValue(payload)) {
    throw invalidStore('Provider dispatch aggregate hash is invalid.')
  }
  for (const entry of aggregate.entries) {
    const { entryHash, ...entryPayload } = entry
    const { immutableGrantHash, ...grantPayload } = entry.grant
    if (
      entryHash !== sha256AuthorityValue(entryPayload) ||
      immutableGrantHash !== sha256AuthorityValue(grantPayload)
    ) throw invalidStore('Provider dispatch entry or grant hash is invalid.')
    if (entry.attempt) {
      const { attemptHash, ...attemptPayload } = entry.attempt
      if (attemptHash !== sha256AuthorityValue(attemptPayload)) {
        throw invalidStore('Provider dispatch attempt hash is invalid.')
      }
    }
    for (const terminal of entry.terminalHistory) {
      const { terminalHash, ...terminalPayload } = terminal
      if (terminalHash !== sha256AuthorityValue(terminalPayload)) {
        throw invalidStore('Provider dispatch terminal hash is invalid.')
      }
    }
  }
  for (const event of aggregate.events) {
    const { eventHash, ...eventPayload } = event
    if (eventHash !== sha256AuthorityValue(eventPayload)) {
      throw invalidStore('Provider dispatch event hash is invalid.')
    }
  }
}

function assertAggregateScope(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  aggregate: CanonicalPrivateProviderDispatchAggregate,
): void {
  if (
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.identity.workspaceId !== scope.workspaceId ||
    aggregate.identity.projectId !== scope.projectId ||
    aggregate.identity.editSessionId !== scope.editSessionId ||
    aggregate.identity.packageRecordId !== scope.packageRecordId ||
    aggregate.identity.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId
  ) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Provider dispatch scope changed.', 403)
}

function assertAuthorizationScope(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  authorization: CanonicalProviderWorkAuthorization,
): void {
  if (
    authorization.ownerUserId !== scope.ownerUserId ||
    authorization.workspaceId !== scope.workspaceId ||
    authorization.projectId !== scope.projectId ||
    authorization.editSessionId !== scope.editSessionId ||
    authorization.packageRecordId !== scope.packageRecordId ||
    authorization.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId
  ) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Provider authorization scope changed.', 403)
}

function assertClaimBinding(
  authorization: CanonicalProviderWorkAuthorization,
  claim: CanonicalPrivatePackageWorkQueueClaim,
  now: string,
): void {
  if (
    claim.deliveryAttempt < 1 || claim.deliveryAttempt > 10 ||
    Date.parse(claim.expiresAt) <= Date.parse(now) ||
    Date.parse(claim.attemptDeadlineAt) < Date.parse(claim.expiresAt) ||
    authorization.queueJobDefinitionHash.length !== 64
  ) throw new ApiError('WORKER_LEASE_EXPIRED', 'Provider queue claim is invalid or expired.', 409)
}

function assertCostEvidenceBinding(
  entry: CanonicalPrivateProviderDispatchEntry,
  evidence: PrivateProviderAttemptCostEvidence,
): void {
  const attempt = entry.attempt
  if (
    !attempt || evidence.authorityHash !== entry.grant.authorizationHash ||
    evidence.identity.workspaceId !== entry.grant.workspaceId ||
    evidence.identity.projectId !== entry.grant.projectId ||
    evidence.identity.editSessionId !== entry.grant.editSessionId ||
    evidence.identity.approvedPlanSnapshotId !== entry.grant.approvedPlanSnapshotId ||
    evidence.identity.packageRecordId !== entry.grant.packageRecordId ||
    evidence.identity.approvedWorkItemId !== entry.grant.approvedWorkItemId ||
    evidence.identity.jobId !== entry.grant.queueJobId ||
    evidence.identity.claimId !== entry.grant.queueClaimId ||
    evidence.identity.deliveryAttempt !== entry.grant.queueClaimDeliveryAttempt ||
    evidence.identity.dispatchAttemptId !== attempt.dispatchAttemptId ||
    evidence.identity.providerOperationId !== entry.grant.operationId ||
    evidence.identity.providerRouteId !== entry.grant.providerRouteId ||
    evidence.identity.providerModelId !== entry.grant.providerModelId
  ) throw conflict('Provider attempt cost evidence changed dispatch lineage.')
}

function deriveDispatchCredential(input: {
  credentialSecret: string
  grantId: string
  authorizationHash: string
  claimHash: string
  expiresAt: string
}): string {
  return createHmac('sha256', input.credentialSecret)
    .update(stableAuthorityStringify({
      domain: CREDENTIAL_DOMAIN,
      grantId: input.grantId,
      authorizationHash: input.authorizationHash,
      claimHash: input.claimHash,
      expiresAt: input.expiresAt,
    }))
    .digest('base64url')
}

function verifyDispatchCredential(input: {
  grant: CanonicalPrivateProviderDispatchGrant
  credentialSecret: string
  candidate: string
}): void {
  const expected = deriveDispatchCredential({
    credentialSecret: input.credentialSecret,
    grantId: input.grant.grantId,
    authorizationHash: input.grant.authorizationHash,
    claimHash: input.grant.queueClaimHash,
    expiresAt: input.grant.expiresAt,
  })
  const candidateHash = Buffer.from(sha256Text(input.candidate), 'hex')
  const expectedHash = Buffer.from(input.grant.credentialSha256, 'hex')
  const candidateBytes = Buffer.from(input.candidate, 'utf8')
  const expectedBytes = Buffer.from(expected, 'utf8')
  if (
    candidateHash.length !== expectedHash.length ||
    !timingSafeEqual(candidateHash, expectedHash) ||
    candidateBytes.length !== expectedBytes.length ||
    !timingSafeEqual(candidateBytes, expectedBytes)
  ) throw new ApiError('WORKER_LEASE_EXPIRED', 'Provider dispatch credential is invalid.', 409)
}

function workerIdentityHash(workerIdentity: string): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-worker-identity:v1',
    workerIdentity,
  })
}

function normalizeSecretReference(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null
  const normalized = safeIdentity(value, 'provider secret reference')
  if (/^(sk-|AIza|eyJ)[A-Za-z0-9._-]+/u.test(normalized) || normalized.length > 120) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Provider dispatch accepts a symbolic secret ID, never a secret value.',
      400,
    )
  }
  return normalized
}

function safeIdentity(value: string, label: string): string {
  const normalized = value.trim()
  if (
    normalized.length < 1 || normalized.length > 240 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(normalized) ||
    normalized.includes('..')
  ) throw new ApiError('VALIDATION_FAILED', `${label} is invalid.`, 400)
  return normalized
}

function assertCredentialSecret(value: string): void {
  if (value.length < 32 || value.length > 512) {
    throw new ApiError('INTERNAL_SERVICE_AUTH_INVALID', 'Provider dispatch signing secret is unavailable.', 503)
  }
}

function requiredEntry(
  aggregate: CanonicalPrivateProviderDispatchAggregate,
  grantId: string,
): CanonicalPrivateProviderDispatchEntry {
  const entry = aggregate.entries.find((candidate) => candidate.grant.grantId === grantId)
  if (!entry) throw new ApiError('JOB_NOT_FOUND', 'Provider dispatch grant was not found.', 404)
  return entry
}

function dispatchBoundaries() {
  return {
    privateLocalPersistence: true as const,
    tenantPackageAndClaimScoped: true as const,
    checksumProtected: true as const,
    oneUseDispatch: true as const,
    toolDispatchUsed: false as const,
    rawCredentialPersisted: false as const,
    rawProviderRequestPersisted: false as const,
    secretPayloadReadCount: 0 as const,
    providerTransportActivated: false as const,
    cloudMutationAuthorized: false as const,
    customerCommercialAuthority: false as const,
    distributedTransactionProven: false as const,
    productionAuthority: false as const,
  }
}

function validTimestamp(value: string, label: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new ApiError('VALIDATION_FAILED', `${label} timestamp is invalid.`, 400)
  }
  return value
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function invalidStore(message: string): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, {
    requiredGate: 'canonical_private_provider_dispatch_store_integrity',
  })
}
