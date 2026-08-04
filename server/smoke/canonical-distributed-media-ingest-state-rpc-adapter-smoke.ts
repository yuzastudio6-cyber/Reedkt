import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalDistributedMediaIngestProductionAuthority,
  canonicalDistributedMediaIngestCancellationRequestSchema,
  canonicalDistributedMediaIngestClaimRequestSchema,
  canonicalDistributedMediaIngestCompletionRequestSchema,
  canonicalDistributedMediaIngestEnqueueRequestSchema,
  canonicalDistributedMediaIngestFailureRequestSchema,
  canonicalDistributedMediaIngestProgressRequestSchema,
  canonicalDistributedMediaIngestRequestHash,
  canonicalDistributedMediaIngestTimeoutRequestSchema,
  createCanonicalDistributedMediaIngestStatePort,
  type CanonicalDistributedMediaIngestMutationResponse,
  type CanonicalDistributedMediaIngestSeed,
  type CanonicalDistributedMediaIngestTransactionAdapter,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-port'
import {
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY,
  createCanonicalDistributedMediaIngestRpcContractFixtureAdapter,
  createCanonicalDistributedMediaIngestRpcContractFixtureCapability,
  type CanonicalDistributedMediaIngestRpcClient,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-rpc-adapter'
import {
  createInMemoryCanonicalDistributedMediaIngestFixture,
  type CanonicalDistributedMediaIngestFixture,
} from '../distributed-media-ingest/in-memory-canonical-distributed-media-ingest-fixture'
import { createCanonicalDistributedLargeMediaFinalizationSeed } from '../services/canonical-distributed-large-media-finalization-contract-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { UploadFinalizationCandidate } from '../services/upload-service'

const baseTime = '2026-07-20T12:00:00.000Z'
const functions = CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.functions
const fixtureByJobId = new Map<string, CanonicalDistributedMediaIngestFixture>()
const seedBySuffix = new Map<string, CanonicalDistributedMediaIngestSeed>()
const calls: Array<{
  functionName: string
  parameterNames: string[]
  contractVersion: string
}> = []

for (const suffix of ['complete', 'failure', 'cancel', 'timeout']) {
  const seed = createSeed(suffix)
  seedBySuffix.set(suffix, seed)
  fixtureByJobId.set(seed.jobId, createInMemoryCanonicalDistributedMediaIngestFixture(seed))
}

const injectedClient: CanonicalDistributedMediaIngestRpcClient = {
  async rpc(functionName, parameters) {
    calls.push({
      functionName,
      parameterNames: Object.keys(parameters).sort(),
      contractVersion: parameters.p_contract_version,
    })
    const jobId = parameters.p_request.jobId
    const fixture = typeof jobId === 'string' ? fixtureByJobId.get(jobId) : undefined
    if (!fixture) return { data: null, error: { code: 'UNKNOWN_JOB' } }
    const data = await invokeFixture(fixture.adapter, functionName, parameters.p_request)
    return {
      data: functionName === functions.recordProgress ? [data] : data,
      error: null,
    }
  },
}

const capability = createCanonicalDistributedMediaIngestRpcContractFixtureCapability(
  injectedClient,
)
assert.throws(
  () => createCanonicalDistributedMediaIngestRpcContractFixtureAdapter({
    client: injectedClient,
    capability: structuredClone(capability),
  }),
  isAtomicityError,
  'Copied capability data must not preserve process authority.',
)
assert.throws(
  () => createCanonicalDistributedMediaIngestRpcContractFixtureAdapter({
    client: { rpc: injectedClient.rpc.bind(injectedClient) },
    capability,
  }),
  isAtomicityError,
  'A capability must remain bound to its exact injected client.',
)

const adapter = createCanonicalDistributedMediaIngestRpcContractFixtureAdapter({
  capability,
  client: injectedClient,
})
const port = createCanonicalDistributedMediaIngestStatePort(adapter)
assert.throws(
  () => assertCanonicalDistributedMediaIngestProductionAuthority(port),
  isAtomicityError,
)

const completionSeed = seedFor('complete')
const completionEnqueue = enqueueRequest(
  completionSeed,
  'idem-rpc-media-complete-enqueue-0001',
  baseTime,
)
const enqueued = await port.enqueue(completionEnqueue)
const enqueueReplay = await port.enqueue(completionEnqueue)
assert.equal(enqueued.idempotencyStatus, 'inserted')
assert.equal(enqueueReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(enqueueReplay.response, enqueued.response)

const started = await port.claimAndStart(claimRequest(
  completionSeed,
  'idem-rpc-media-complete-claim-0001',
  plus(baseTime, 1_000),
))
let completionAttempt = requiredAttempt(started.response)
for (const [index, phase] of ([
  'hashing',
  'hash_complete',
  'probe_complete',
  'canonical_commit_ready',
] as const satisfies readonly ProgressPhase[]).entries()) {
  const progress = await port.recordProgress(progressRequest({
    seed: completionSeed,
    attempt: completionAttempt,
    key: `idem-rpc-media-complete-progress-${index + 1}-0001`,
    phase,
    verifiedByteOffset: phase === 'hashing'
      ? 8 * 1024 ** 2
      : completionSeed.identity.expectedSizeBytes,
    at: plus(baseTime, 2_000 + index * 1_000),
  }))
  completionAttempt = requiredAttempt(progress.response)
}
const completionRequestValue = completionRequest({
  seed: completionSeed,
  attempt: completionAttempt,
  key: 'idem-rpc-media-complete-terminal-0001',
  at: plus(baseTime, 7_000),
})
const completed = await port.reconcileCompletion(completionRequestValue)
const completionReplay = await port.reconcileCompletion(completionRequestValue)
assert.equal(completed.response.job.state, 'completed')
assert.equal(completionReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(completionReplay.response, completed.response)
assert.equal(
  completed.response.attempt?.terminal?.completionResult?.privateCreateOnlyReadbackVerified,
  true,
)
assert.equal(
  completed.response.attempt?.terminal?.terminalCost
    .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
  false,
)

const failureSeed = seedFor('failure')
await port.enqueue(enqueueRequest(
  failureSeed,
  'idem-rpc-media-failure-enqueue-0001',
  baseTime,
))
const failureStarted = await port.claimAndStart(claimRequest(
  failureSeed,
  'idem-rpc-media-failure-claim-0001',
  plus(baseTime, 1_000),
))
const failed = await port.reconcileFailure(failureRequest({
  seed: failureSeed,
  attempt: requiredAttempt(failureStarted.response),
  key: 'idem-rpc-media-failure-terminal-0001',
  at: plus(baseTime, 2_000),
}))
assert.equal(failed.response.job.state, 'retry_available')
assert.equal(failed.response.attempt?.terminal?.automaticRetryStarted, false)
assert.ok((failed.response.attempt?.terminal?.terminalCost.actualInternalCostMicros ?? 0) > 0)

const cancellationSeed = seedFor('cancel')
await port.enqueue(enqueueRequest(
  cancellationSeed,
  'idem-rpc-media-cancel-enqueue-0001',
  baseTime,
))
const cancelled = await port.requestCancellation(cancellationRequest(
  cancellationSeed,
  'idem-rpc-media-cancel-terminal-0001',
  plus(baseTime, 1_000),
))
assert.equal(cancelled.response.job.state, 'cancelled')
assert.equal(cancelled.response.attempt, null)

const timeoutSeed = seedFor('timeout')
await port.enqueue(enqueueRequest(
  timeoutSeed,
  'idem-rpc-media-timeout-enqueue-0001',
  baseTime,
))
const timeoutStarted = await port.claimAndStart(claimRequest(
  timeoutSeed,
  'idem-rpc-media-timeout-claim-0001',
  plus(baseTime, 1_000),
))
const timedOut = await port.finalizeExpiredAttempt(timeoutRequest(
  timeoutSeed,
  'idem-rpc-media-timeout-terminal-0001',
  plus(baseTime, 6 * 60_000),
))
assert.equal(timeoutStarted.response.job.state, 'running')
assert.equal(timedOut.response.expiredAttemptReconciled, true)
assert.equal(timedOut.response.job.state, 'retry_available')
assert.equal(timedOut.response.attempt?.terminal?.terminalCost.outcome, 'timeout')

const requiredFunctions = Object.values(functions).sort()
assert.deepEqual([...new Set(calls.map((call) => call.functionName))].sort(), requiredFunctions)
assert.ok(calls.every((call) => (
  call.parameterNames.join(',') === 'p_contract_version,p_request'
)))
assert.ok(calls.every((call) => (
  call.contractVersion === 'canonical-distributed-media-ingest-state-port-v1'
)))
assert.equal(adapter.descriptor.implementationClass, 'database_transaction_adapter')
assert.equal(adapter.descriptor.databaseBackend, 'none')
assert.equal(adapter.descriptor.distributedDatabaseTransactionVerified, false)
assert.equal(adapter.descriptor.liveSupabaseOrPostgresCallPerformed, false)
assert.equal(adapter.descriptor.cloudDispatchVerified, false)
assert.equal(adapter.descriptor.liveGcsObjectBytesRead, false)
assert.equal(adapter.descriptor.productionAuthority, false)

await verifyValidResponseSubstitutionIsRejected()
await verifySanitizedRpcFailure()

const adapterSource = await readFile(new URL(
  '../distributed-media-ingest/canonical-distributed-media-ingest-state-rpc-adapter.ts',
  import.meta.url,
), 'utf8')
for (const forbiddenActivationBoundary of [
  'createClient(',
  '@supabase/supabase-js',
  'SUPABASE_SERVICE_ROLE_KEY',
  'fetch(',
  'node:child_process',
  'automaticTransportRetryAllowed: true',
]) {
  assert.ok(!adapterSource.includes(forbiddenActivationBoundary))
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'canonical-distributed-media-ingest-rpc-adapter-smoke-v1',
  status: 'server_only_rpc_transport_contract_verified_live_database_and_worker_blocked',
  registryHash: CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.registryHash,
  functionCount: requiredFunctions.length,
  rpcCallCount: calls.length,
  checks: [
    'process_branded_contract_fixture_capability_required',
    'capability_is_bound_to_the_exact_injected_client',
    'fixed_seven_function_server_only_registry',
    'one_rpc_call_per_port_invocation_without_hidden_retry',
    'exact_contract_version_and_parameter_envelope',
    'lost_enqueue_and_completion_responses_replay_exactly',
    'single_row_rpc_array_is_normalized',
    'completion_failure_and_timeout_retain_internal_cost_only',
    'valid_but_wrong_response_lineage_is_rejected',
    'rpc_errors_are_sanitized_without_raw_database_detail',
    'no_client_constructor_secret_fetch_child_process_or_activation_path',
    'database_dispatch_gcs_and_production_authority_remain_false',
  ],
  boundaries: {
    liveSupabaseOrPostgresCallPerformed: false,
    databaseSchemaOrSqlCreated: false,
    remoteMutationPerformed: false,
    cloudDispatchPerformed: false,
    liveGcsObjectBytesRead: false,
    automaticRetryStarted: false,
    customerCommercialAuthorityIncluded: false,
    productionAuthority: false,
  },
}, null, 2))

async function invokeFixture(
  adapterValue: CanonicalDistributedMediaIngestTransactionAdapter,
  functionName: string,
  request: Record<string, unknown>,
): Promise<unknown> {
  if (functionName === functions.enqueue) {
    return adapterValue.enqueue(canonicalDistributedMediaIngestEnqueueRequestSchema.parse(request))
  }
  if (functionName === functions.claimAndStart) {
    return adapterValue.claimAndStart(canonicalDistributedMediaIngestClaimRequestSchema.parse(request))
  }
  if (functionName === functions.recordProgress) {
    return adapterValue.recordProgress(canonicalDistributedMediaIngestProgressRequestSchema.parse(request))
  }
  if (functionName === functions.reconcileCompletion) {
    return adapterValue.reconcileCompletion(canonicalDistributedMediaIngestCompletionRequestSchema.parse(request))
  }
  if (functionName === functions.reconcileFailure) {
    return adapterValue.reconcileFailure(canonicalDistributedMediaIngestFailureRequestSchema.parse(request))
  }
  if (functionName === functions.requestCancellation) {
    return adapterValue.requestCancellation(canonicalDistributedMediaIngestCancellationRequestSchema.parse(request))
  }
  if (functionName === functions.finalizeExpiredAttempt) {
    return adapterValue.finalizeExpiredAttempt(canonicalDistributedMediaIngestTimeoutRequestSchema.parse(request))
  }
  throw new Error('Unexpected media-ingest RPC function in controlled fixture.')
}

async function verifyValidResponseSubstitutionIsRejected(): Promise<void> {
  const requestedSeed = createSeed('lineage-requested')
  const substitutedSeed = createSeed('lineage-substituted')
  const substitutedFixture = createInMemoryCanonicalDistributedMediaIngestFixture(substitutedSeed)
  const substitutedResponse = await substitutedFixture.adapter.enqueue(enqueueRequest(
    substitutedSeed,
    'idem-rpc-media-lineage-substituted-0001',
    baseTime,
  ))
  const substitutionClient: CanonicalDistributedMediaIngestRpcClient = {
    async rpc() {
      return { data: substitutedResponse, error: null }
    },
  }
  const substitutionAdapter = createCanonicalDistributedMediaIngestRpcContractFixtureAdapter({
    client: substitutionClient,
    capability: createCanonicalDistributedMediaIngestRpcContractFixtureCapability(
      substitutionClient,
    ),
  })
  const substitutionPort = createCanonicalDistributedMediaIngestStatePort(substitutionAdapter)
  await assert.rejects(
    substitutionPort.enqueue(enqueueRequest(
      requestedSeed,
      'idem-rpc-media-lineage-requested-0001',
      baseTime,
    )),
    isAtomicityError,
  )
}

async function verifySanitizedRpcFailure(): Promise<void> {
  const sensitiveSentinel = 'secret-database-detail-must-not-escape'
  const errorClient: CanonicalDistributedMediaIngestRpcClient = {
    async rpc() {
      return {
        data: null,
        error: { code: 'P0001', status: 409, message: sensitiveSentinel },
      }
    },
  }
  const errorAdapter = createCanonicalDistributedMediaIngestRpcContractFixtureAdapter({
    client: errorClient,
    capability: createCanonicalDistributedMediaIngestRpcContractFixtureCapability(errorClient),
  })
  const errorPort = createCanonicalDistributedMediaIngestStatePort(errorAdapter)
  let sanitizedError: ApiError | null = null
  try {
    await errorPort.enqueue(enqueueRequest(
      createSeed('sanitized-error'),
      'idem-rpc-media-sanitized-error-0001',
      baseTime,
    ))
  } catch (error) {
    assert.ok(error instanceof ApiError)
    sanitizedError = error
  }
  assert.ok(sanitizedError)
  assert.equal(sanitizedError.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')
  assert.ok(!JSON.stringify(sanitizedError).includes(sensitiveSentinel))
}

type ProgressPhase = 'hashing' | 'hash_complete' | 'probe_complete' |
  'canonical_commit_ready'

function createSeed(suffix: string): CanonicalDistributedMediaIngestSeed {
  return createCanonicalDistributedLargeMediaFinalizationSeed(candidate(suffix))
}

function seedFor(suffix: string): CanonicalDistributedMediaIngestSeed {
  const seed = seedBySuffix.get(suffix)
  assert.ok(seed)
  return seed
}

function candidate(suffix: string): UploadFinalizationCandidate {
  return {
    uploadIntentId: `upload_rpc_${suffix}`,
    ownerUserId: 'user_rpc_media_ingest',
    workspaceId: 'workspace_rpc_media_ingest',
    projectId: 'project_rpc_media_ingest',
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
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    failureCategory: 'reeditpro_error_absorbed' as const,
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

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
