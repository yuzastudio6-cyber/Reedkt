import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import {
  canonicalDistributedMediaIngestCancellationRequestSchema,
  canonicalDistributedMediaIngestClaimRequestSchema,
  canonicalDistributedMediaIngestCompletionRequestSchema,
  canonicalDistributedMediaIngestEnqueueRequestSchema,
  canonicalDistributedMediaIngestFailureRequestSchema,
  canonicalDistributedMediaIngestProgressRequestSchema,
  canonicalDistributedMediaIngestRequestHash,
  canonicalDistributedMediaIngestTimeoutRequestSchema,
  createCanonicalDistributedMediaIngestStatePort,
  assertCanonicalDistributedMediaIngestProductionAuthority,
  type CanonicalDistributedMediaIngestMutationResponse,
  type CanonicalDistributedMediaIngestSeed,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-port'
import {
  createCanonicalDistributedMediaIngestLocalHttpClient,
  assertCanonicalDistributedMediaIngestLocalHttpClientIsNotProduction,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-local-supabase-http-rpc-client'
import {
  createCanonicalDistributedMediaIngestLocalPostgresAdapter,
  createCanonicalDistributedMediaIngestLocalPostgresCapability,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-rpc-adapter'
import {
  registerCanonicalDistributedMediaIngestSource,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-source-registration'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalDistributedLargeMediaFinalizationSeed,
} from '../services/canonical-distributed-large-media-finalization-contract-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { UploadFinalizationCandidate } from '../services/upload-service'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const clientA = createCanonicalDistributedMediaIngestLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
  localInternalSigningSecret: jwtSecret,
})
const clientB = createCanonicalDistributedMediaIngestLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerB, jwtSecret),
  localInternalSigningSecret: jwtSecret,
})
const unsignedClient = createCanonicalDistributedMediaIngestLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
  localInternalSigningSecret: hash('browser-has-no-server-media-ingest-signing-authority'),
})

function portFor(client: typeof clientA) {
  const capability = createCanonicalDistributedMediaIngestLocalPostgresCapability({
    client,
    endpointOrigin,
  })
  return createCanonicalDistributedMediaIngestStatePort(
    createCanonicalDistributedMediaIngestLocalPostgresAdapter({ client, capability }),
  )
}

const portA = portFor(clientA)
const portB = portFor(clientB)
assert.equal(portA.descriptor.databaseBackend, 'postgres')
assert.equal(portA.descriptor.liveSupabaseOrPostgresCallPerformed, true)
assert.equal(portA.descriptor.serializableTransactionSemanticsExercised, true)
assert.equal(portA.descriptor.durableResponseReplaySemanticsExercised, true)
assert.equal(portA.descriptor.progressCheckpointResumeSemanticsExercised, true)
assert.equal(portA.descriptor.terminalExclusivitySemanticsExercised, true)
assert.equal(portA.descriptor.distributedDatabaseTransactionVerified, false)
assert.equal(portA.descriptor.multiReplicaDurabilityVerified, false)
assert.equal(portA.descriptor.cloudDispatchVerified, false)
assert.equal(portA.descriptor.liveGcsObjectBytesRead, false)
assert.equal(portA.descriptor.productionAuthority, false)
assert.throws(
  () => assertCanonicalDistributedMediaIngestLocalHttpClientIsNotProduction(clientA),
  isAtomicityError,
)
assert.throws(
  () => assertCanonicalDistributedMediaIngestProductionAuthority(portA),
  isAtomicityError,
)

const base = '2026-07-22T12:00:00.000Z'
const unsignedSeed = createSeed('unsigned')
await assert.rejects(
  () => registerCanonicalDistributedMediaIngestSource({
    client: unsignedClient,
    seed: unsignedSeed,
    requestedAt: base,
  }),
  isAtomicityError,
)

const completeSeed = createSeed('complete')
const registrations = await Promise.all([
  registerCanonicalDistributedMediaIngestSource({
    client: clientA,
    seed: completeSeed,
    requestedAt: base,
  }),
  registerCanonicalDistributedMediaIngestSource({
    client: clientA,
    seed: completeSeed,
    requestedAt: base,
  }),
])
assert.deepEqual(
  registrations.map((receipt) => receipt.disposition).sort(),
  ['idempotent_replay', 'inserted'],
)
assert.equal(registrations[0]?.transaction.transactionId, registrations[1]?.transaction.transactionId)
await assert.rejects(
  () => registerCanonicalDistributedMediaIngestSource({
    client: clientA,
    seed: completeSeed,
    requestedAt: plus(base, 1),
  }),
  isAtomicityError,
)

const enqueue = enqueueRequest(completeSeed, 'local-media-complete-enqueue-0001', base)
const enqueues = await Promise.all([portA.enqueue(enqueue), portA.enqueue(enqueue)])
assert.deepEqual(
  enqueues.map((result) => result.idempotencyStatus).sort(),
  ['exact_replay', 'inserted'],
)
assert.deepEqual(enqueues[0]?.response, enqueues[1]?.response)
await assert.rejects(
  () => portB.enqueue(enqueue),
  isAtomicityError,
)
await assert.rejects(
  () => portA.enqueue(enqueueRequest(
    completeSeed,
    'local-media-complete-enqueue-0001',
    plus(base, 1),
  )),
  isAtomicityError,
)

const claimRequestValue = claimRequest(
  completeSeed,
  'local-media-complete-claim-0001',
  plus(base, 1_000),
)
const claims = await Promise.all([
  portA.claimAndStart(claimRequestValue),
  portA.claimAndStart(claimRequestValue),
])
assert.deepEqual(
  claims.map((result) => result.idempotencyStatus).sort(),
  ['exact_replay', 'inserted'],
)
assert.deepEqual(claims[0]?.response, claims[1]?.response)
let attempt = requiredAttempt(required(claims[0]).response)
const progressCases: Array<{ phase: ProgressPhase; offset: number; at: number }> = [
  { phase: 'hashing', offset: completeSeed.identity.expectedSizeBytes / 2, at: 2_000 },
  { phase: 'hash_complete', offset: completeSeed.identity.expectedSizeBytes, at: 3_000 },
  { phase: 'probe_complete', offset: completeSeed.identity.expectedSizeBytes, at: 4_000 },
  { phase: 'canonical_commit_ready', offset: completeSeed.identity.expectedSizeBytes, at: 5_000 },
]
for (const [index, progress] of progressCases.entries()) {
  const result = await portA.recordProgress(progressRequest({
    seed: completeSeed,
    attempt,
    key: `local-media-complete-progress-${index + 1}-0001`,
    phase: progress.phase,
    verifiedByteOffset: progress.offset,
    at: plus(base, progress.at),
  }))
  attempt = requiredAttempt(result.response)
}
const completion = completionRequest({
  seed: completeSeed,
  attempt,
  key: 'local-media-complete-terminal-0001',
  at: plus(base, 6_000),
})
const completed = await portA.reconcileCompletion(completion)
assert.equal(completed.response.job.state, 'completed')
assert.equal(completed.response.attempt?.terminal?.terminalKind, 'completion')
assert.equal(
  completed.response.attempt?.terminal?.terminalCost
    .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
  false,
)
assert.equal(completed.response.boundaries.productionAuthority, false)
assert.equal(completed.response.boundaries.cloudCallPerformed, false)
const restartedPortA = portFor(createCanonicalDistributedMediaIngestLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
  localInternalSigningSecret: jwtSecret,
}))
const completionReplay = await restartedPortA.reconcileCompletion(completion)
assert.equal(completionReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(completionReplay.response, completed.response)

const terminalRaceSeed = createSeed('terminal_race')
await registerSeed(terminalRaceSeed, plus(base, 40_000))
await portA.enqueue(enqueueRequest(
  terminalRaceSeed,
  'local-media-terminal-race-enqueue-0001',
  plus(base, 40_000),
))
const competingClaims = await Promise.allSettled([
  portA.claimAndStart(claimRequest(
    terminalRaceSeed,
    'local-media-terminal-race-claim-a-0001',
    plus(base, 41_000),
  )),
  portA.claimAndStart(claimRequest(
    terminalRaceSeed,
    'local-media-terminal-race-claim-b-0001',
    plus(base, 41_000),
  )),
])
assert.equal(competingClaims.filter((result) => result.status === 'fulfilled').length, 1)
assert.equal(competingClaims.filter((result) => result.status === 'rejected').length, 1)
const rejectedClaim = competingClaims.find((result) => result.status === 'rejected')
assert.ok(rejectedClaim?.status === 'rejected' && isAtomicityError(rejectedClaim.reason))
const acceptedClaim = competingClaims.find((result) => result.status === 'fulfilled')
assert.ok(acceptedClaim?.status === 'fulfilled')
let terminalRaceAttempt = requiredAttempt(acceptedClaim.value.response)
for (const [index, progress] of progressCases.entries()) {
  const result = await portA.recordProgress(progressRequest({
    seed: terminalRaceSeed,
    attempt: terminalRaceAttempt,
    key: `local-media-terminal-race-progress-${index + 1}-0001`,
    phase: progress.phase,
    verifiedByteOffset: progress.offset,
    at: plus(base, 42_000 + (index * 1_000)),
  }))
  terminalRaceAttempt = requiredAttempt(result.response)
}
const terminalRaceCompletion = completionRequest({
  seed: terminalRaceSeed,
  attempt: terminalRaceAttempt,
  key: 'local-media-terminal-race-completion-0001',
  at: plus(base, 46_000),
})
const terminalRaceFailure = failureRequest({
  seed: terminalRaceSeed,
  attempt: terminalRaceAttempt,
  key: 'local-media-terminal-race-failure-0001',
  at: plus(base, 46_000),
  category: 'reeditpro_error_absorbed',
})
const terminalRace = await Promise.allSettled([
  portA.reconcileCompletion(terminalRaceCompletion),
  portA.reconcileFailure(terminalRaceFailure),
])
assert.equal(terminalRace.filter((result) => result.status === 'fulfilled').length, 1)
assert.equal(terminalRace.filter((result) => result.status === 'rejected').length, 1)
const rejectedTerminal = terminalRace.find((result) => result.status === 'rejected')
assert.ok(rejectedTerminal?.status === 'rejected' && isAtomicityError(rejectedTerminal.reason))
const acceptedTerminal = terminalRace.find((result) => result.status === 'fulfilled')
assert.ok(acceptedTerminal?.status === 'fulfilled')
const terminalKind = acceptedTerminal.value.response.attempt?.terminal?.terminalKind
assert.ok(terminalKind === 'completion' || terminalKind === 'failure')
const terminalRaceReplay = terminalKind === 'completion'
  ? await restartedPortA.reconcileCompletion(terminalRaceCompletion)
  : await restartedPortA.reconcileFailure(terminalRaceFailure)
assert.equal(terminalRaceReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(terminalRaceReplay.response, acceptedTerminal.value.response)

const retrySeed = createSeed('retry')
await registerSeed(retrySeed, plus(base, 10_000))
await portA.enqueue(enqueueRequest(retrySeed, 'local-media-retry-enqueue-0001', plus(base, 10_000)))
const retryClaimOne = await portA.claimAndStart(claimRequest(
  retrySeed,
  'local-media-retry-claim-0001',
  plus(base, 11_000),
))
const retryAttemptOne = requiredAttempt(retryClaimOne.response)
const retryProgress = await portA.recordProgress(progressRequest({
  seed: retrySeed,
  attempt: retryAttemptOne,
  key: 'local-media-retry-progress-0001',
  phase: 'hashing',
  verifiedByteOffset: retrySeed.identity.expectedSizeBytes / 4,
  at: plus(base, 12_000),
}))
const retryFailed = await portA.reconcileFailure(failureRequest({
  seed: retrySeed,
  attempt: requiredAttempt(retryProgress.response),
  key: 'local-media-retry-failure-0001',
  at: plus(base, 13_000),
  category: 'reeditpro_error_absorbed',
}))
assert.equal(retryFailed.response.job.state, 'retry_available')
assert.ok((retryFailed.response.attempt?.terminal?.terminalCost.actualInternalCostMicros ?? 0) > 0)
const retryClaimTwo = await portA.claimAndStart(claimRequest(
  retrySeed,
  'local-media-retry-claim-0002',
  plus(base, 14_000),
))
assert.equal(
  retryClaimTwo.response.attempt?.attemptStart.resumeOffsetBytes,
  retrySeed.identity.expectedSizeBytes / 4,
)
assert.equal(
  retryClaimTwo.response.attempt?.attemptStart.resumeCheckpointHash,
  retryFailed.response.job.latestDurableCheckpoint?.checkpointHash,
)

const timeoutSeed = createSeed('timeout')
await registerSeed(timeoutSeed, plus(base, 20_000))
await portA.enqueue(enqueueRequest(timeoutSeed, 'local-media-timeout-enqueue-0001', plus(base, 20_000)))
const timeoutClaim = await portA.claimAndStart(claimRequest(
  timeoutSeed,
  'local-media-timeout-claim-0001',
  plus(base, 21_000),
))
const timeoutProgress = await portA.recordProgress(progressRequest({
  seed: timeoutSeed,
  attempt: requiredAttempt(timeoutClaim.response),
  key: 'local-media-timeout-progress-0001',
  phase: 'hashing',
  verifiedByteOffset: timeoutSeed.identity.expectedSizeBytes / 4,
  at: plus(base, 22_000),
}))
const earlyTimeout = await portA.finalizeExpiredAttempt(timeoutRequest(
  timeoutSeed,
  'local-media-timeout-early-0001',
  plus(base, 60_000),
))
assert.equal(earlyTimeout.response.expiredAttemptReconciled, false)
assert.equal(earlyTimeout.response.transaction, null)
const expiredTimeoutRequest = timeoutRequest(
  timeoutSeed,
  'local-media-timeout-terminal-0001',
  plus(base, 323_000),
)
const expiredTimeout = await portA.finalizeExpiredAttempt(expiredTimeoutRequest)
assert.equal(expiredTimeout.response.expiredAttemptReconciled, true)
assert.equal(expiredTimeout.response.job.state, 'retry_available')
assert.equal(expiredTimeout.response.attempt?.state, 'timed_out')
assert.equal(
  expiredTimeout.response.attempt?.terminal?.terminalAt,
  timeoutProgress.response.attempt?.leaseExpiresAt,
)
const expiredTimeoutReplay = await restartedPortA.finalizeExpiredAttempt(expiredTimeoutRequest)
assert.equal(expiredTimeoutReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(expiredTimeoutReplay.response, expiredTimeout.response)
await assert.rejects(
  () => portB.finalizeExpiredAttempt(expiredTimeoutRequest),
  isAtomicityError,
)

const cancelledSeed = createSeed('cancelled')
await registerSeed(cancelledSeed, plus(base, 30_000))
await portA.enqueue(enqueueRequest(
  cancelledSeed,
  'local-media-cancelled-enqueue-0001',
  plus(base, 30_000),
))
const cancelled = await portA.requestCancellation(cancellationRequest(
  cancelledSeed,
  'local-media-cancelled-request-0001',
  plus(base, 31_000),
))
assert.equal(cancelled.response.job.state, 'cancelled')
assert.equal(cancelled.response.attempt, null)

console.log(JSON.stringify({
  status: 'passed',
  schemaVersion: 'canonical-distributed-media-ingest-local-postgres-proof-v1',
  sourceRegistrationVerified: true,
  sevenOperationRegistryPreserved: true,
  concurrentExactReplayVerified: true,
  concurrentDifferentKeyClaimDenialVerified: true,
  completionFailureTerminalRaceVerified: true,
  restartReplayVerified: true,
  monotonicCheckpointAndResumeVerified: true,
  terminalCostRetentionVerified: true,
  expiredLeaseRecoveryVerified: true,
  tenantIsolationVerified: true,
  tenantAuthorizationBeforeReplayVerified: true,
  localPostgresCallPerformed: true,
  multiReplicaDurabilityVerified: false,
  cloudDispatchVerified: false,
  liveGcsObjectRead: false,
  customerCommercialAuthorityIncluded: false,
  productionAuthority: false,
}, null, 2))

type ProgressPhase = 'hashing' | 'hash_complete' | 'probe_complete' |
  'canonical_commit_ready'

async function registerSeed(seed: CanonicalDistributedMediaIngestSeed, at: string) {
  return registerCanonicalDistributedMediaIngestSource({
    client: clientA,
    seed,
    requestedAt: at,
  })
}

function createSeed(suffix: string): CanonicalDistributedMediaIngestSeed {
  return createCanonicalDistributedLargeMediaFinalizationSeed(candidate(suffix))
}

function candidate(suffix: string): UploadFinalizationCandidate {
  return {
    uploadIntentId: `upload_local_media_${suffix}`,
    ownerUserId: ownerA,
    workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectId: 'aaaaaaaa-1000-4000-8000-000000000001',
    uploadPurpose: 'source_media',
    expectedSizeBytes: 64 * 1024 ** 2,
    status: 'signed',
    storageMode: 'gcs',
    backgroundFinalizationRequired: true,
    authorityFingerprint: hash(`upload-authority:${suffix}`),
  }
}

function enqueueRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    requestedAt: at,
  }
  return canonicalDistributedMediaIngestEnqueueRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('enqueue', payload),
  })
}

function claimRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const safetyReserveBytes = Math.max(
    seed.policy.minimumHeadroomBytes,
    Math.ceil(seed.identity.expectedSizeBytes * 0.1),
  )
  const requiredAvailableBytes = seed.identity.expectedSizeBytes + safetyReserveBytes
  const capacityPayload = {
    policyId: 'large_media_worker_capacity_v1' as const,
    expectedSourceBytes: seed.identity.expectedSizeBytes,
    sourceStagingBytes: seed.identity.expectedSizeBytes,
    safetyReserveBytes,
    requiredAvailableBytes,
    observedAvailableBytes: requiredAvailableBytes,
    reservationIdentityHash: hash(`capacity:${seed.seedHash}`),
    byteTraversalAuthorized: true as const,
  }
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    workerIdentityEvidenceHash: workerHash(seed),
    workerReceiptHash: workerReceiptHash(seed),
    capacityAdmission: {
      ...capacityPayload,
      evidenceHash: sha256AuthorityValue({
        domain: 'canonical_distributed_media_ingest_capacity_admission_v1',
        ingestIdentityHash: seed.identity.identityHash,
        ...capacityPayload,
      }),
    },
    sourceObjectIdentityEvidenceHash: sourceObjectHash(seed),
    acceptedAt: at,
  }
  return canonicalDistributedMediaIngestClaimRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('claim_and_start', payload),
  })
}

function progressRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  phase: ProgressPhase
  verifiedByteOffset: number
  at: string
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    phase: input.phase,
    verifiedByteOffset: input.verifiedByteOffset,
    continuationStateObjectIdentityHash: hash(`continuation:${input.key}`),
    checkpointEvidenceHash: hash(`checkpoint:${input.key}`),
    heartbeatAt: input.at,
  }
  return canonicalDistributedMediaIngestProgressRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('record_progress', payload),
  })
}

function completionRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  at: string
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    mediaAssetId: `media_${input.seed.identity.uploadIntentId}`,
    storageObjectRecordId: `storage_${input.seed.identity.uploadIntentId}`,
    sizeBytes: input.seed.identity.expectedSizeBytes,
    checksumSha256: hash(`bytes:${input.seed.seedHash}`),
    sourceMetadataHash: hash(`probe:${input.seed.seedHash}`),
    generationIdentityHash: sourceObjectHash(input.seed),
    canonicalOutcomeHash: hash(`outcome:${input.seed.seedHash}`),
    completedAt: input.at,
  }
  return canonicalDistributedMediaIngestCompletionRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('reconcile_completion', payload),
  })
}

function failureRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  at: string
  category: 'reeditpro_error_absorbed' | 'unknown' | 'source_changed' |
    'validation_error' | 'cancelled'
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    failureCategory: input.category,
    sanitizedFailureCode: 'INGEST_RUNTIME_FAILED',
    failureEvidenceHash: hash(`failure:${input.key}`),
    failedAt: input.at,
  }
  return canonicalDistributedMediaIngestFailureRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('reconcile_failure', payload),
  })
}

function cancellationRequest(
  seed: CanonicalDistributedMediaIngestSeed,
  key: string,
  at: string,
) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    cancellationEvidenceHash: hash(`cancel:${key}`),
    requestedAt: at,
  }
  return canonicalDistributedMediaIngestCancellationRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('request_cancellation', payload),
  })
}

function timeoutRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    observedAt: at,
  }
  return canonicalDistributedMediaIngestTimeoutRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('finalize_expired_attempt', payload),
  })
}

function requiredAttempt(response: CanonicalDistributedMediaIngestMutationResponse) {
  assert.ok(response.attempt)
  return response.attempt
}

function controllerHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`controller:${seed.identity.workspaceId}`)
}

function workerHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`worker:${seed.policy.workerClass}:${seed.policy.region}`)
}

function workerReceiptHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`worker-receipt:${seed.seedHash}`)
}

function sourceObjectHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`source-object:${seed.identity.uploadAuthorityFingerprint}`)
}

function hash(value: string): string {
  return sha256AuthorityValue({ fixture: value })
}

function plus(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString()
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated', exp: now + 900, iat: now, role: 'authenticated', sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`media_ingest_local_postgres_environment_missing:${name}`)
  return value
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
