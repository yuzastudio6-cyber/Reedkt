import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalDistributedPrePlanStudyProductionAuthority,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyFailureRequestSchema,
  canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
  canonicalDistributedPrePlanStudyIdentityHash,
  canonicalDistributedPrePlanStudyOutputHash,
  canonicalDistributedPrePlanStudyRecoveryRequestSchema,
  canonicalDistributedPrePlanStudyRequestHash,
  canonicalDistributedPrePlanStudySeedHash,
  canonicalDistributedPrePlanStudyWorkItemHash,
  createCanonicalDistributedPrePlanStudyStatePort,
  type CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudySeed,
  type CanonicalDistributedPrePlanStudyTransactionAdapter,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY,
  createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter,
  createCanonicalDistributedPrePlanStudyRpcContractFixtureCapability,
  type CanonicalDistributedPrePlanStudyRpcClient,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter'
import {
  createInMemoryCanonicalDistributedPrePlanStudyFixture,
  type InMemoryCanonicalDistributedPrePlanStudyFixture,
} from '../distributed-pre-plan-study/in-memory-canonical-distributed-pre-plan-study-fixture'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const baseTime = '2026-07-21T18:00:00.000Z'
const functions = CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.functions
const fixtureByRunId = new Map<string, InMemoryCanonicalDistributedPrePlanStudyFixture>()
const seedBySuffix = new Map<string, CanonicalDistributedPrePlanStudySeed>()
const calls: Array<{
  functionName: string
  parameterNames: string[]
  contractVersion: string
}> = []

for (const suffix of ['complete', 'failure', 'control', 'recovery']) {
  const seed = createSeed(suffix)
  seedBySuffix.set(suffix, seed)
  fixtureByRunId.set(
    seed.runId,
    createInMemoryCanonicalDistributedPrePlanStudyFixture(`rpc-fixture-${suffix}`),
  )
}

const injectedClient: CanonicalDistributedPrePlanStudyRpcClient = {
  async rpc(functionName, parameters) {
    calls.push({
      functionName,
      parameterNames: Object.keys(parameters).sort(),
      contractVersion: parameters.p_contract_version,
    })
    const runId = parameters.p_request.runId
    const fixture = typeof runId === 'string' ? fixtureByRunId.get(runId) : undefined
    if (!fixture) return { data: null, error: { code: 'UNKNOWN_RUN' } }
    const data = await invokeFixture(fixture.adapter, functionName, parameters.p_request)
    return {
      data: functionName === functions.heartbeatAndCheckpoint ? [data] : data,
      error: null,
    }
  },
}

const capability = createCanonicalDistributedPrePlanStudyRpcContractFixtureCapability(
  injectedClient,
)
assert.throws(
  () => createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter({
    client: injectedClient,
    capability: structuredClone(capability),
  }),
  isAtomicityError,
  'Copied capability data must not preserve process authority.',
)
assert.throws(
  () => createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter({
    client: { rpc: injectedClient.rpc.bind(injectedClient) },
    capability,
  }),
  isAtomicityError,
  'A capability must remain bound to its exact injected client.',
)

const adapter = createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter({
  client: injectedClient,
  capability,
})
const port = createCanonicalDistributedPrePlanStudyStatePort(adapter)
assert.throws(
  () => assertCanonicalDistributedPrePlanStudyProductionAuthority(port),
  isAtomicityError,
)

const completionSeed = seedFor('complete')
const completionEnqueue = enqueueRequest(
  completionSeed,
  'idem-rpc-study-complete-enqueue-0001',
  baseTime,
)
const enqueued = await port.enqueue(completionEnqueue)
const enqueueReplay = await port.enqueue(completionEnqueue)
assert.equal(enqueued.idempotencyStatus, 'inserted')
assert.equal(enqueueReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(enqueueReplay.response, enqueued.response)

const completionClaimRequest = claimRequest(
  completionSeed,
  'idem-rpc-study-complete-claim-0001',
  plus(baseTime, 1_000),
)
const claimed = await port.claimAndStart(completionClaimRequest)
const claimReplay = await port.claimAndStart(completionClaimRequest)
assert.ok(claimed.transientLeaseCredential)
assert.equal(claimReplay.idempotencyStatus, 'exact_replay')
assert.equal(claimReplay.transientLeaseCredential, claimed.transientLeaseCredential)
assert.deepEqual(claimReplay.response, claimed.response)
const heartbeated = await port.heartbeatAndCheckpoint(heartbeatRequest({
  seed: completionSeed,
  claim: claimed.response,
  leaseCredential: required(claimed.transientLeaseCredential),
  key: 'idem-rpc-study-complete-heartbeat-0001',
  at: plus(baseTime, 2_000),
}))
assert.equal(heartbeated.response.workItem?.latestCheckpoint?.checkpointSequence, 1)

const completionRequestValue = completionRequest({
  seed: completionSeed,
  claim: heartbeated.response,
  leaseCredential: required(claimed.transientLeaseCredential),
  key: 'idem-rpc-study-complete-terminal-0001',
  completedAt: plus(baseTime, 3_000),
})
const completed = await port.complete(completionRequestValue)
const completionReplay = await port.complete(completionRequestValue)
assert.equal(completed.response.run.state, 'completed')
assert.equal(completionReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(completionReplay.response, completed.response)
assert.equal(
  completed.response.attempt?.terminal?.costEvidence.customerPriceCalculated,
  false,
)

const failureSeed = seedFor('failure')
await port.enqueue(enqueueRequest(
  failureSeed,
  'idem-rpc-study-failure-enqueue-0001',
  baseTime,
))
const failureClaim = await port.claimAndStart(claimRequest(
  failureSeed,
  'idem-rpc-study-failure-claim-0001',
  plus(baseTime, 1_000),
))
const failed = await port.fail(failureRequest({
  seed: failureSeed,
  claim: failureClaim.response,
  leaseCredential: required(failureClaim.transientLeaseCredential),
  key: 'idem-rpc-study-failure-terminal-0001',
  failedAt: plus(baseTime, 2_000),
}))
assert.equal(failed.response.workItem?.state, 'retry_wait')
assert.equal(failed.response.attempt?.terminal?.automaticRetryStarted, false)
assert.ok(BigInt(
  failed.response.attempt?.terminal?.costEvidence.totalInternalCostMicros ?? '0',
) > 0n)

const controlSeed = seedFor('control')
const controlEnqueue = await port.enqueue(enqueueRequest(
  controlSeed,
  'idem-rpc-study-control-enqueue-0001',
  baseTime,
))
const paused = await port.control(controlRequest({
  seed: controlSeed,
  key: 'idem-rpc-study-control-pause-0001',
  action: 'pause',
  expectedRevision: controlEnqueue.response.run.revision,
  at: plus(baseTime, 1_000),
}))
const resumed = await port.control(controlRequest({
  seed: controlSeed,
  key: 'idem-rpc-study-control-resume-0001',
  action: 'resume',
  expectedRevision: paused.response.run.revision,
  at: plus(baseTime, 2_000),
}))
const cancelled = await port.control(controlRequest({
  seed: controlSeed,
  key: 'idem-rpc-study-control-cancel-0001',
  action: 'cancel',
  expectedRevision: resumed.response.run.revision,
  at: plus(baseTime, 3_000),
}))
assert.equal(paused.response.run.state, 'paused')
assert.equal(resumed.response.run.state, 'queued')
assert.equal(cancelled.response.run.state, 'cancelled')

const recoverySeed = seedFor('recovery')
await port.enqueue(enqueueRequest(
  recoverySeed,
  'idem-rpc-study-recovery-enqueue-0001',
  baseTime,
))
await port.claimAndStart(claimRequest(
  recoverySeed,
  'idem-rpc-study-recovery-claim-0001',
  plus(baseTime, 1_000),
))
const recovered = await port.recoverExpiredLease(recoveryRequest(
  recoverySeed,
  'idem-rpc-study-recovery-terminal-0001',
  plus(baseTime, 62_000),
))
const recoveryReplay = await port.recoverExpiredLease(recoveryRequest(
  recoverySeed,
  'idem-rpc-study-recovery-terminal-0001',
  plus(baseTime, 62_000),
))
assert.equal(recovered.response.expiredAttemptRecovered, true)
assert.equal(recovered.response.run.state, 'running')
assert.equal(recovered.response.workItem?.state, 'retry_wait')
assert.equal(recovered.response.attempt?.terminal?.terminalKind, 'timeout')
assert.equal(recoveryReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(recoveryReplay.response, recovered.response)

const requiredFunctions = Object.values(functions).sort()
assert.deepEqual([...new Set(calls.map((call) => call.functionName))].sort(), requiredFunctions)
assert.ok(calls.every((call) => (
  call.parameterNames.join(',') === 'p_contract_version,p_request'
)))
assert.ok(calls.every((call) => (
  call.contractVersion === 'canonical-distributed-pre-plan-study-state-port-v1'
)))
assert.equal(adapter.descriptor.implementationClass, 'database_transaction_adapter')
assert.equal(adapter.descriptor.databaseBackend, 'none')
assert.equal(adapter.descriptor.distributedDatabaseTransactionVerified, false)
assert.equal(adapter.descriptor.multiReplicaDurabilityVerified, false)
assert.equal(adapter.descriptor.authenticatedWorkerDispatchVerified, false)
assert.equal(adapter.descriptor.livePrivateObjectReadVerified, false)
assert.equal(adapter.descriptor.liveSupabaseOrPostgresCallPerformed, false)
assert.equal(adapter.descriptor.productionAuthority, false)

await verifyValidResponseSubstitutionIsRejected(completed)
await verifySanitizedRpcFailure()

const adapterSource = await readFile(new URL(
  '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter.ts',
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
  schemaVersion: 'canonical-distributed-pre-plan-study-rpc-adapter-smoke-v1',
  status: 'server_only_rpc_transport_contract_verified_live_database_and_worker_blocked',
  registryHash: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.registryHash,
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
    'claim_only_transient_digest_bound_lease_credential',
    'heartbeat_checkpoint_and_terminal_internal_cost_are_preserved',
    'failure_pause_resume_cancel_and_expired_lease_recovery_pass',
    'request_and_tenant_response_substitution_is_rejected',
    'database_errors_are_sanitized',
    'no_live_client_secret_sql_provider_worker_cloud_or_commercial_activation',
    'v1_adapter_cannot_self_promote_to_production',
  ],
}, null, 2))

async function invokeFixture(
  fixture: CanonicalDistributedPrePlanStudyTransactionAdapter,
  functionName: string,
  request: Record<string, unknown>,
) {
  if (functionName === functions.enqueue) return fixture.enqueue(request as never)
  if (functionName === functions.claimAndStart) return fixture.claimAndStart(request as never)
  if (functionName === functions.heartbeatAndCheckpoint) {
    return fixture.heartbeatAndCheckpoint(request as never)
  }
  if (functionName === functions.complete) return fixture.complete(request as never)
  if (functionName === functions.fail) return fixture.fail(request as never)
  if (functionName === functions.control) return fixture.control(request as never)
  if (functionName === functions.recoverExpiredLease) {
    return fixture.recoverExpiredLease(request as never)
  }
  throw new Error('Unexpected RPC function.')
}

function createSeed(suffix: string): CanonicalDistributedPrePlanStudySeed {
  const identityWithoutHash = {
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    ownerUserId: `owner-${suffix}`,
    workspaceId: `workspace-${suffix}`,
    editReferenceId: `reference-${suffix}`,
    studySessionId: `study-${suffix}`,
    sourceAssetId: `source-asset-${suffix}`,
    sourceStorageObjectId: `source-object-${suffix}`,
    sourceStorageObjectIdentityHash: hash(`source-object-identity-${suffix}`),
    sourceChecksumSha256: hash(`source-checksum-${suffix}`),
    sourceSizeBytes: 50 * 1024 ** 3,
    sourceDurationMilliseconds: 6 * 60 * 60 * 1_000,
    sourceMimeType: 'video/mp4',
  }
  const identity = {
    ...identityWithoutHash,
    identityHash: canonicalDistributedPrePlanStudyIdentityHash(identityWithoutHash),
  }
  const workItemPayload = {
    workItemId: `study-work-${suffix}-1`,
    sequence: 1,
    stageId: 'stage-deterministic',
    dependencyWorkItemIds: [] as string[],
    required: true,
    weightBasisPoints: 10_000,
    executionKind: 'deterministic_tool' as const,
    workerClass: 'media_worker' as const,
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    profileId: 'approved-deterministic-study-v1',
    modelId: null,
    maximumAttempts: 2,
    leaseDurationMs: 60_000,
    attemptDeadlineDurationMs: 5 * 60_000,
    resourceEnvelope: {
      vcpuCount: 2,
      memoryGib: 8,
      gpuCount: 0,
      temporaryStorageGib: 200,
    },
    providerRateCardSnapshotDigestSha256: hash('provider-rate-deterministic'),
    infrastructureRateCardSnapshotDigestSha256: hash('infra-rate-deterministic'),
    maximumAuthorizedInternalCostMicrosPerAttempt: '1000000',
    inputBindingHash: hash(`input-binding-${suffix}`),
  }
  const seedWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-seed-v1' as const,
    runId: `study-run-${suffix}`,
    planId: `study-plan-${suffix}`,
    planVersion: 'v1',
    planDigestSha256: hash(`study-plan-${suffix}`),
    identity,
    studyUsageApprovalId: `study-usage-approval-${suffix}`,
    studyUsageApprovalDigestSha256: hash(`study-usage-approval-${suffix}`),
    internalCostBudgetId: `study-cost-budget-${suffix}`,
    maximumAuthorizedInternalCostMicros: '2000000',
    currency: 'USD' as const,
    wholeStudyTimeoutApplied: false as const,
    browserSessionRequiredForCompletion: false as const,
    workItems: [{
      ...workItemPayload,
      workItemHash: canonicalDistributedPrePlanStudyWorkItemHash(workItemPayload),
    }],
  }
  return {
    ...seedWithoutHash,
    seedHash: canonicalDistributedPrePlanStudySeedHash(seedWithoutHash),
  }
}

function enqueueRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse(withHash('enqueue', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    seed,
    controllerIdentityEvidenceHash: hash('controller'),
    requestedAt: at,
  }))
}

function claimRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyClaimRequestSchema.parse(withHash('claim_and_start', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    workerClass: 'media_worker',
    workerIdentityEvidenceHash: hash('worker-media'),
    workerReceiptHash: hash('worker-receipt-media'),
    capacityAdmissionEvidenceHash: hash('capacity-media'),
    acceptedAt: at,
  }))
}

function heartbeatRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  at: string
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyHeartbeatRequestSchema.parse(withHash(
    'heartbeat_and_checkpoint',
    {
      runId: input.seed.runId,
      studyIdentityHash: input.seed.identity.identityHash,
      idempotencyKey: input.key,
      attemptId: attempt.attemptId,
      leaseCredential: input.leaseCredential,
      workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
      workerReceiptHash: attempt.workerReceiptHash,
      checkpoint: {
        checkpointSequence: 1,
        progressBasisPoints: 5_000,
        progressEvidenceHash: hash(`progress-${input.key}`),
        privateCheckpointObjectId: 'checkpoint-object-1',
        privateCheckpointObjectIdentityHash: hash(`checkpoint-object-${input.key}`),
        checkpointPayloadDigestSha256: hash(`checkpoint-payload-${input.key}`),
      },
      heartbeatAt: input.at,
    },
  ))
}

function completionRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  completedAt: string
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  const outputPayload = {
    outputId: `study-output-${attempt.attemptId}`,
    outputKind: 'private-study-evidence',
    storageObjectId: `private-object-${attempt.attemptId}`,
    storageObjectIdentityHash: hash(`object-identity-${attempt.attemptId}`),
    checksumSha256: hash(`output-checksum-${attempt.attemptId}`),
    byteLength: 4096,
    mimeType: 'application/json',
    lineageHash: hash(`output-lineage-${attempt.attemptId}`),
    privateCreateOnlyReadbackVerified: true as const,
    providerUrlPersisted: false as const,
    localPathPersisted: false as const,
  }
  return canonicalDistributedPrePlanStudyCompletionRequestSchema.parse(withHash('complete', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.leaseCredential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    outputs: [{
      ...outputPayload,
      outputHash: canonicalDistributedPrePlanStudyOutputHash(outputPayload),
    }],
    costEvidence: costEvidence(input.seed, input.claim, input.completedAt),
    completionEvidenceHash: hash(`completion-${input.key}`),
    completedAt: input.completedAt,
  }))
}

function failureRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  failedAt: string
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyFailureRequestSchema.parse(withHash('fail', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.leaseCredential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    costEvidence: costEvidence(input.seed, input.claim, input.failedAt),
    failureCategory: 'validation_error',
    sanitizedFailureCode: 'STUDY_OUTPUT_INVALID',
    failureEvidenceHash: hash(`failure-${input.key}`),
    failedAt: input.failedAt,
  }))
}

function controlRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  key: string
  action: 'pause' | 'resume' | 'cancel'
  expectedRevision: number
  at: string
}) {
  return canonicalDistributedPrePlanStudyControlRequestSchema.parse(withHash('control', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    action: input.action,
    expectedRunRevision: input.expectedRevision,
    controllerIdentityEvidenceHash: hash('controller'),
    requestedAt: input.at,
  }))
}

function recoveryRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyRecoveryRequestSchema.parse(withHash(
    'recover_expired_lease',
    {
      runId: seed.runId,
      studyIdentityHash: seed.identity.identityHash,
      idempotencyKey: key,
      controllerIdentityEvidenceHash: hash('controller'),
      observedAt: at,
    },
  ))
}

function costEvidence(
  seed: CanonicalDistributedPrePlanStudySeed,
  claim: CanonicalDistributedPrePlanStudyMutationResponse,
  finishedAt: string,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const attempt = required(claim.attempt?.attemptStart)
  const workItem = required(seed.workItems.find(
    (candidate) => candidate.workItemId === attempt.workItemId,
  ))
  const payload = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: 'final' as const,
    attemptId: attempt.attemptId,
    attemptStartHash: attempt.attemptStartHash,
    startedAt: attempt.startedAt,
    finishedAt,
    approvedUsageEstimateId: seed.studyUsageApprovalId,
    internalCostBudgetId: seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros:
      workItem.maximumAuthorizedInternalCostMicrosPerAttempt,
    providerUsageEvidenceDigestSha256: hash(`provider-usage-${attempt.attemptId}`),
    providerRateCardSnapshotDigestSha256:
      workItem.providerRateCardSnapshotDigestSha256,
    providerCostMicros: '0',
    infrastructureUsageEvidenceDigestSha256: hash(`infra-usage-${attempt.attemptId}`),
    infrastructureRateCardSnapshotDigestSha256:
      workItem.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '800',
    totalInternalCostMicros: '800',
    usageEventIds: [`usage-${attempt.attemptId}`],
    internalCostRecordIds: [`cost-${attempt.attemptId}`],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...payload,
    evidenceHash: canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(payload),
  }
}

async function verifyValidResponseSubstitutionIsRejected(
  completed: Awaited<ReturnType<typeof port.complete>>,
): Promise<void> {
  const seed = createSeed('substitution')
  const key = 'idem-rpc-study-substitution-enqueue-0001'
  const request = enqueueRequest(seed, key, baseTime)
  const client: CanonicalDistributedPrePlanStudyRpcClient = {
    async rpc() {
      return { data: completed, error: null }
    },
  }
  const localCapability = createCanonicalDistributedPrePlanStudyRpcContractFixtureCapability(
    client,
  )
  const localPort = createCanonicalDistributedPrePlanStudyStatePort(
    createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter({
      client,
      capability: localCapability,
    }),
  )
  await assert.rejects(() => localPort.enqueue(request), isAtomicityError)
}

async function verifySanitizedRpcFailure(): Promise<void> {
  const seed = createSeed('rpc-failure')
  const client: CanonicalDistributedPrePlanStudyRpcClient = {
    async rpc() {
      return {
        data: null,
        error: {
          code: '40001',
          status: 409,
          message: '/private/path?token=secret-value',
        },
      }
    },
  }
  const localCapability = createCanonicalDistributedPrePlanStudyRpcContractFixtureCapability(
    client,
  )
  const localPort = createCanonicalDistributedPrePlanStudyStatePort(
    createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter({
      client,
      capability: localCapability,
    }),
  )
  await assert.rejects(
    () => localPort.enqueue(enqueueRequest(
      seed,
      'idem-rpc-study-error-enqueue-0001',
      baseTime,
    )),
    (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')
      assert.equal(JSON.stringify(error.details).includes('secret-value'), false)
      assert.equal(JSON.stringify(error.details).includes('/private/path'), false)
      return true
    },
  )
}

function seedFor(suffix: string): CanonicalDistributedPrePlanStudySeed {
  const seed = seedBySuffix.get(suffix)
  assert.ok(seed)
  return seed
}

function withHash<T extends {
  runId: string
  studyIdentityHash: string
  idempotencyKey: string
}>(operation: string, payload: T): T & { requestHash: string } {
  const draft = { ...payload, requestHash: hash('request-placeholder') }
  return {
    ...payload,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, draft),
  }
}

function hash(value: unknown): string {
  return sha256AuthorityValue({ domain: 'pre_plan_study_rpc_fixture_v1', value })
}

function plus(timestamp: string, milliseconds: number): string {
  return new Date(Date.parse(timestamp) + milliseconds).toISOString()
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
