import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedPackageStateProductionAuthority,
  canonicalDistributedPackageStateRequestHash,
  createCanonicalDistributedPackageStateContractBoundary,
  type CanonicalDistributedPackageFixtureSeed,
  type CanonicalDistributedPackageMutationResponse,
} from '../distributed-package-state/canonical-distributed-package-state-port'
import {
  CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY,
  createCanonicalDistributedPackageStateRpcContractFixtureAdapter,
  createCanonicalDistributedPackageStateRpcContractFixtureCapability,
  type CanonicalDistributedPackageStateRpcClient,
} from '../distributed-package-state/canonical-distributed-package-state-rpc-adapter'
import {
  createInMemoryCanonicalDistributedPackageStateFixture,
} from '../distributed-package-state/in-memory-canonical-distributed-package-state-fixture'

const seed = createSeed()
const fixture = createInMemoryCanonicalDistributedPackageStateFixture(seed)
const calls: Array<{
  functionName: string
  parameterNames: string[]
  contractVersion: string
}> = []
const functions = CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY.functions
const functionDispatch = new Map<string, (request: unknown) => Promise<unknown>>([
  [functions.claimAndEnqueue, fixture.adapter.claimAndEnqueue.bind(fixture.adapter)],
  [functions.acceptController, fixture.adapter.acceptController.bind(fixture.adapter)],
  [functions.acceptWorkerAndStart, fixture.adapter.acceptWorkerAndStart.bind(fixture.adapter)],
  [functions.heartbeatWorker, fixture.adapter.heartbeatWorker.bind(fixture.adapter)],
  [functions.reconcileCompletion, fixture.adapter.reconcileCompletion.bind(fixture.adapter)],
  [functions.reconcileFailure, fixture.adapter.reconcileFailure.bind(fixture.adapter)],
  [functions.finalizeExpiredTimeouts, fixture.adapter.finalizeExpiredTimeouts.bind(fixture.adapter)],
])

const injectedClient: CanonicalDistributedPackageStateRpcClient = {
  async rpc(functionName, parameters) {
    calls.push({
      functionName,
      parameterNames: Object.keys(parameters).sort(),
      contractVersion: parameters.p_contract_version,
    })
    const operation = functionDispatch.get(functionName)
    if (!operation) return { data: null, error: { code: 'UNKNOWN_RPC' } }
    const data = await operation(parameters.p_request)
    return {
      data: functionName === functions.heartbeatWorker ? [data] : data,
      error: null,
    }
  },
}

const capability = createCanonicalDistributedPackageStateRpcContractFixtureCapability(
  injectedClient,
)
assert.throws(
  () => createCanonicalDistributedPackageStateRpcContractFixtureAdapter({
    client: injectedClient,
    capability: structuredClone(capability),
  }),
  (error: unknown) => error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
)
assert.throws(
  () => createCanonicalDistributedPackageStateRpcContractFixtureAdapter({
    client: { rpc: injectedClient.rpc.bind(injectedClient) },
    capability,
  }),
  (error: unknown) => error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
)

const adapter = createCanonicalDistributedPackageStateRpcContractFixtureAdapter({
  client: injectedClient,
  capability,
})
const port = createCanonicalDistributedPackageStateContractBoundary(adapter)
assert.throws(
  () => assertCanonicalDistributedPackageStateProductionAuthority(port),
  (error: unknown) => error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
)

const baseTime = '2026-07-17T00:00:00.000Z'
const firstClaimRequest = claimRequest('job_rpc_1', 'idem-rpc-claim-job-0001', baseTime)
const firstClaim = await port.claimAndEnqueue(firstClaimRequest)
const firstClaimReplay = await port.claimAndEnqueue(firstClaimRequest)
assert.equal(firstClaim.idempotencyStatus, 'inserted')
assert.equal(firstClaimReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(firstClaimReplay.response, firstClaim.response)
const firstDispatch = firstClaim.response.attempt.dispatchIntentId
await port.acceptController(controllerRequest(
  firstDispatch,
  'idem-rpc-controller-job-001',
  plus(baseTime, 1_000),
))
await port.acceptWorkerAndStart(workerRequest(
  firstDispatch,
  'idem-rpc-worker-job-00001',
  plus(baseTime, 2_000),
))
await port.heartbeatWorker(heartbeatRequest(
  firstDispatch,
  'idem-rpc-heartbeat-job-001',
  plus(baseTime, 5_000),
))
const completion = await port.reconcileCompletion(completionRequest(
  firstDispatch,
  'idem-rpc-completion-job-01',
  plus(baseTime, 8_000),
))
assert.equal(completion.response.job.state, 'completed')
assert.equal(
  completion.response.attempt.terminal?.terminalCost
    .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
  false,
)

const secondClaim = await port.claimAndEnqueue(claimRequest(
  'job_rpc_2',
  'idem-rpc-claim-job-0002',
  baseTime,
))
const secondDispatch = secondClaim.response.attempt.dispatchIntentId
await port.acceptController(controllerRequest(
  secondDispatch,
  'idem-rpc-controller-job-002',
  plus(baseTime, 1_000),
))
await port.acceptWorkerAndStart(workerRequest(
  secondDispatch,
  'idem-rpc-worker-job-00002',
  plus(baseTime, 2_000),
))
const timeoutRequest = withIdempotency('finalize_expired_timeouts',
  'idem-rpc-timeout-sweep-0001', {
    packageRecordId: seed.identity.packageRecordId,
    controllerIdentityEvidenceHash: controllerHash(),
    observedAt: plus(baseTime, 11_000),
  })
const timeout = await port.finalizeExpiredTimeouts(timeoutRequest)
const timeoutReplay = await port.finalizeExpiredTimeouts(timeoutRequest)
assert.equal(timeout.response.reconciledCount, 1)
assert.equal(timeout.response.outcomes[0]?.dispatchIntentId, secondDispatch)
assert.equal(timeoutReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(timeoutReplay.response, timeout.response)

const thirdClaim = await port.claimAndEnqueue(claimRequest(
  'job_rpc_3',
  'idem-rpc-claim-job-0003',
  baseTime,
))
const thirdDispatch = thirdClaim.response.attempt.dispatchIntentId
await port.acceptController(controllerRequest(
  thirdDispatch,
  'idem-rpc-controller-job-003',
  plus(baseTime, 1_000),
))
await port.acceptWorkerAndStart(workerRequest(
  thirdDispatch,
  'idem-rpc-worker-job-00003',
  plus(baseTime, 2_000),
))
const failure = await port.reconcileFailure(failureRequest(
  thirdDispatch,
  'idem-rpc-failure-job-0001',
  plus(baseTime, 3_000),
))
assert.equal(failure.response.job.state, 'blocked')
assert.equal(failure.response.attempt.terminal?.failureCategory, 'validation_error')

const requiredFunctions = Object.values(functions).sort()
assert.deepEqual([...new Set(calls.map((call) => call.functionName))].sort(), requiredFunctions)
assert.ok(calls.every((call) =>
  call.parameterNames.join(',') === 'p_contract_version,p_request'))
assert.ok(calls.every((call) =>
  call.contractVersion === 'canonical-distributed-package-state-port-v1'))
assert.equal(adapter.descriptor.implementationClass, 'database_transaction_adapter')
assert.equal(adapter.descriptor.databaseBackend, 'none')
assert.equal(adapter.descriptor.distributedDatabaseTransactionVerified, false)
assert.equal(adapter.descriptor.liveSupabaseOrPostgresCallPerformed, false)
assert.equal(adapter.descriptor.productionAuthority, false)

const sensitiveSentinel = 'secret-database-detail-must-not-escape'
const errorClient: CanonicalDistributedPackageStateRpcClient = {
  async rpc() {
    return {
      data: null,
      error: { code: 'P0001', status: 409, message: sensitiveSentinel },
    }
  },
}
const errorAdapter = createCanonicalDistributedPackageStateRpcContractFixtureAdapter({
  capability: createCanonicalDistributedPackageStateRpcContractFixtureCapability(errorClient),
  client: errorClient,
})
const errorPort = createCanonicalDistributedPackageStateContractBoundary(errorAdapter)
let sanitizedError: ApiError | null = null
try {
  await errorPort.claimAndEnqueue(claimRequest(
    'job_rpc_1',
    'idem-rpc-sanitized-error-01',
    plus(baseTime, 1),
  ))
} catch (error) {
  assert.ok(error instanceof ApiError)
  sanitizedError = error
}
assert.ok(sanitizedError)
assert.equal(sanitizedError.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')
assert.ok(!JSON.stringify(sanitizedError).includes(sensitiveSentinel))

const adapterSource = await readFile(new URL(
  '../distributed-package-state/canonical-distributed-package-state-rpc-adapter.ts',
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
  schemaVersion: 'canonical-distributed-package-state-rpc-adapter-smoke-v1',
  status: 'server_only_rpc_transport_contract_verified_live_database_still_blocked',
  registryHash: CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY.registryHash,
  functionCount: requiredFunctions.length,
  rpcCallCount: calls.length,
  checks: [
    'process_branded_contract_fixture_capability_required',
    'copied_capability_loses_authority',
    'capability_is_bound_to_the_exact_injected_client',
    'exact_seven_function_registry',
    'one_rpc_call_per_port_invocation_without_hidden_retry',
    'fixed_contract_version_and_parameter_envelope',
    'lost_mutation_and_timeout_responses_replay_exactly',
    'single_row_rpc_array_is_normalized',
    'completion_and_timeout_cost_remain_internal_only',
    'rpc_errors_are_sanitized_without_raw_database_detail',
    'no_client_constructor_secret_fetch_child_process_or_activation_path',
    'database_distributed_cloud_and_production_authority_remain_false',
  ],
  boundaries: {
    liveSupabaseOrPostgresCallPerformed: false,
    databaseSchemaOrSqlCreated: false,
    remoteMutationPerformed: false,
    automaticRetryStarted: false,
    customerCommercialAuthorityIncluded: false,
    productionAuthority: false,
  },
}, null, 2))

function createSeed(): CanonicalDistributedPackageFixtureSeed {
  const identityPayload = {
    ownerUserId: 'owner_rpc',
    workspaceId: 'workspace_rpc',
    projectId: 'project_rpc',
    editSessionId: 'edit_rpc',
    packageRecordId: 'package_rpc',
    approvedPlanSnapshotId: 'snapshot_rpc',
    approvedCreditReservationId: 'reservation_rpc',
    packageHash: hash('package'),
    snapshotHash: hash('snapshot'),
    queueDefinitionHash: hash('queue'),
    handoffManifestHash: hash('manifest'),
  }
  return {
    identity: {
      ...identityPayload,
      identityHash: sha256AuthorityValue({
        domain: 'canonical_distributed_package_identity_v1',
        ...identityPayload,
      }),
    },
    jobs: [1, 2, 3].map((jobNumber) => ({
      jobId: `job_rpc_${jobNumber}`,
      approvedWorkItemId: `work_rpc_${jobNumber}`,
      workItemKey: `work_key_rpc_${jobNumber}`,
      required: true,
      dependencyJobIds: [],
      maxAttempts: 1,
      leaseDurationMs: 10_000,
      attemptDeadlineDurationMs: 60_000,
      queueJobDefinitionHash: hash(`job-${jobNumber}-definition`),
      manifestEntryHash: hash(`job-${jobNumber}-manifest`),
      dispatchBindingHash: hash(`job-${jobNumber}-dispatch`),
      meteringProfile: {
        toolId: 'deepfilternet' as const,
        operationId: 'tool.deepfilternet.enhance_voice.v1' as const,
        workloadProfileId: 'deepfilternet_cpu_4vcpu_4gib_v1' as const,
        vcpuCount: 4 as const,
        memoryGib: 4 as const,
        gpuCount: 0 as const,
      },
    })),
  }
}

function claimRequest(jobId: string, key: string, requestedAt: string) {
  return withIdempotency('claim_and_enqueue', key, {
    packageRecordId: seed.identity.packageRecordId,
    jobId,
    controllerIdentityEvidenceHash: controllerHash(),
    requestedAt,
  })
}

function controllerRequest(dispatchIntentId: string, key: string, acceptedAt: string) {
  return withIdempotency('accept_controller', key, {
    packageRecordId: seed.identity.packageRecordId,
    dispatchIntentId,
    controllerIdentityEvidenceHash: controllerHash(),
    controllerRequestBindingHash: hash(`${dispatchIntentId}:controller-request`),
    controllerReceiptHash: controllerReceiptHash(dispatchIntentId),
    acceptedAt,
  })
}

function workerRequest(dispatchIntentId: string, key: string, acceptedAt: string) {
  return withIdempotency('accept_worker_and_start', key, {
    packageRecordId: seed.identity.packageRecordId,
    dispatchIntentId,
    controllerReceiptHash: controllerReceiptHash(dispatchIntentId),
    workerIdentityEvidenceHash: workerHash(),
    workerRequestBindingHash: hash(`${dispatchIntentId}:worker-request`),
    workerReceiptHash: workerReceiptHash(dispatchIntentId),
    acceptedAt,
  })
}

function heartbeatRequest(dispatchIntentId: string, key: string, heartbeatAt: string) {
  return withIdempotency('heartbeat_worker', key, {
    packageRecordId: seed.identity.packageRecordId,
    dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(),
    workerReceiptHash: workerReceiptHash(dispatchIntentId),
    heartbeatAt,
  })
}

function completionRequest(dispatchIntentId: string, key: string, completedAt: string) {
  return withIdempotency('reconcile_completion', key, {
    packageRecordId: seed.identity.packageRecordId,
    dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(),
    workerReceiptHash: workerReceiptHash(dispatchIntentId),
    completionEvidenceHash: hash(`${dispatchIntentId}:completion`),
    linkedCanonicalOutcomeHash: hash(`${dispatchIntentId}:outcome`),
    outputByteLength: 4_096,
    completedAt,
  })
}

function failureRequest(dispatchIntentId: string, key: string, failedAt: string) {
  return withIdempotency('reconcile_failure', key, {
    packageRecordId: seed.identity.packageRecordId,
    dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(),
    workerReceiptHash: workerReceiptHash(dispatchIntentId),
    failureEvidenceHash: hash(`${dispatchIntentId}:failure`),
    failureCategory: 'validation_error' as const,
    failedAt,
  })
}

function withIdempotency<
  TOperation extends CanonicalDistributedPackageMutationResponse['operation'] |
    'finalize_expired_timeouts',
  TRequest extends Record<string, unknown>,
>(operation: TOperation, idempotencyKey: string, request: TRequest) {
  return {
    ...request,
    idempotencyKey,
    requestHash: canonicalDistributedPackageStateRequestHash({ operation, request }),
  }
}

function controllerHash(): string {
  return hash(`${seed.identity.packageRecordId}:controller`)
}

function workerHash(): string {
  return hash(`${seed.identity.packageRecordId}:worker`)
}

function controllerReceiptHash(dispatchIntentId: string): string {
  return hash(`${dispatchIntentId}:controller-receipt`)
}

function workerReceiptHash(dispatchIntentId: string): string {
  return hash(`${dispatchIntentId}:worker-receipt`)
}

function plus(timestamp: string, milliseconds: number): string {
  return new Date(Date.parse(timestamp) + milliseconds).toISOString()
}

function hash(value: string): string {
  return sha256AuthorityValue({
    domain: 'canonical_distributed_package_state_rpc_adapter_smoke_v1',
    value,
  })
}
