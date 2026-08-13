import assert from 'node:assert/strict'

import {
  createCanonicalPrivateServiceIdentityFixture,
  type CanonicalLiveGoogleServiceIdentityVerifier,
} from '../security/canonical-service-identity-verifier'
import {
  compileCanonicalProfessionalGpuCloudTaskSpec,
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  type CanonicalProfessionalGpuCloudTaskDispatchResult,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import {
  assertCanonicalProfessionalGpuCloudTaskConsumerResult,
  createCanonicalProfessionalGpuCloudTaskConsumer,
} from '../services/canonical-professional-gpu-cloud-task-consumer-service'
import type {
  CanonicalProfessionalGpuCloudTaskOutboxRecord,
} from '../services/canonical-professional-gpu-cloud-task-outbox-port'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueDurableClaim,
  type CanonicalProfessionalGpuFairQueueDurableTerminal,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import {
  assertCanonicalProfessionalGpuQueueDeliveryConsumption,
  type CanonicalProfessionalGpuQueueDeliveryConsumption,
} from '../services/canonical-professional-gpu-queue-runtime-read-port'
import {
  parseTrackAllSam31AuthenticatedGpuInvocationRequest,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  attempt,
  funding,
} from './canonical-sam3_1-approved-track-all-task-source-repository-smoke'

const audience = 'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app'
const observedAt = '2026-08-04T18:32:00.000Z'
const claim = makeClaim()
const spec = compileCanonicalProfessionalGpuCloudTaskSpec({
  claim,
  runtimeConfig: createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
    targetOrigin: audience,
  }),
  compiledAt: observedAt,
})
const outboxRecord = makeOutboxRecord(spec, makeDispatchResult(spec))
const identity = createCanonicalPrivateServiceIdentityFixture({
  authenticationMechanism: 'google_oidc_id_token',
  subject: 'cloud-tasks-service-account-subject',
  principalEmail: 'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
  audience,
  issuedAt: '2026-08-04T18:31:00.000Z',
  expiresAt: '2026-08-04T19:31:00.000Z',
  verifiedAt: observedAt,
})
const verifier: CanonicalLiveGoogleServiceIdentityVerifier = {
  async verifyAuthorizationHeader(header) {
    assert.equal(header, 'Bearer private-fixture-token')
    return identity
  },
}

const completedHarness = harness('completed')
const completed = await completedHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
})
assert.equal(completed.disposition, 'completed_and_queue_finalized')
assert.equal(completed.queueFinalized, true)
assert.equal(completed.invocationDisposition, 'completed')
assert.equal(completed.unresolvedOutcomeBlocksRetry, false)
assert.equal(completedHarness.counts.invocations, 1)
assert.equal(completedHarness.counts.terminalAttempts, 1)
assert.equal(completedHarness.counts.finalizations, 1)
assert.notEqual(completed.terminalUsageAttemptRef, null)
assert.equal(
  completed.terminalUsageAttemptPersistedBeforeQueueFinalization,
  true,
)
assert.equal(completed.customerCreditsMutated, false)
assert.equal(completed.productionAuthorityGranted, false)

const replay = await completedHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: structuredClone(spec.body),
})
assert.equal(replay.disposition, 'terminal_replay')
assert.equal(replay.queueFinalized, true)
assert.equal(replay.invocationDisposition, null)
assert.equal(completedHarness.counts.invocations, 1)
assert.equal(completedHarness.counts.terminalAttempts, 1)
assert.equal(completedHarness.counts.finalizations, 1)
assert.equal(replay.duplicateDeliveryStartedNewInference, false)

const failedHarness = harness('failed')
const failed = await failedHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
})
assert.equal(failed.disposition, 'failed_and_queue_finalized')
assert.equal(failed.queueFinalized, true)
assert.equal(failedHarness.terminal?.disposition, 'failed_reconciled')

const scaleZeroHarness = harness('not_executed_scale_from_zero_trigger')
const scaleZero = await scaleZeroHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
})
assert.equal(
  scaleZero.disposition,
  'known_not_executed_and_queue_finalized',
)
assert.equal(scaleZero.queueFinalized, true)
assert.equal(scaleZero.automaticNewExecutionAttemptAllowed, false)
assert.equal(scaleZeroHarness.terminal?.disposition, 'failed_reconciled')

const unknownHarness = harness('outcome_unknown_requires_reconciliation')
const unknown = await unknownHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
})
assert.equal(unknown.disposition, 'unknown_outcome_requires_reconciliation')
assert.equal(unknown.queueFinalized, false)
assert.equal(unknown.queueTerminalRef, null)
assert.equal(unknown.unresolvedOutcomeBlocksRetry, true)
assert.equal(unknownHarness.counts.invocations, 1)
assert.equal(unknownHarness.counts.terminalAttempts, 0)
assert.equal(unknownHarness.counts.finalizations, 0)

const wrongIdentity = createCanonicalPrivateServiceIdentityFixture({
  authenticationMechanism: 'google_oidc_id_token',
  subject: 'wrong-service-account-subject',
  principalEmail: 'wrong@reeditpro.iam.gserviceaccount.com',
  audience,
  issuedAt: '2026-08-04T18:31:00.000Z',
  expiresAt: '2026-08-04T19:31:00.000Z',
  verifiedAt: observedAt,
})
const wrongIdentityHarness = harness('completed', {
  async verifyAuthorizationHeader() { return wrongIdentity },
})
await assert.rejects(() => wrongIdentityHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
}), /identity differs/u)
assert.equal(wrongIdentityHarness.counts.invocations, 0)

const substitutedHarness = harness('completed', verifier, {
  ...spec.body,
  claimHash: 'f'.repeat(64),
  bodyDigestSha256: 'f'.repeat(64),
})
await assert.rejects(() => substitutedHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: spec.body,
}), /not exactly reread/u)
assert.equal(substitutedHarness.counts.invocations, 0)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'claimId', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('getter must not execute')
  },
})
await assert.rejects(() => completedHarness.consumer.consumeOne({
  authorizationHeader: 'Bearer private-fixture-token',
  body: hostile,
}))
assert.equal(getterInvoked, false)

assert.throws(() => assertCanonicalProfessionalGpuCloudTaskConsumerResult({
  ...completed,
  customerCreditsMutated: true,
}))

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-cloud-task-consumer',
  checks: 52,
  privateOidcIdentityRequired: true,
  exactTaskOutboxClaimFundingAttemptAndInvocationReread: true,
  terminalUsageAttemptPersistedBeforeQueueFinalization: true,
  completedAndFailedQueueTerminalReconciliation: true,
  scaleZeroKnownNotExecutedFailsCurrentAttemptClosed: true,
  unknownOutcomeBlocksRetryAndTerminal: true,
  duplicateDeliveryStartedNewInference: false,
  automaticNewExecutionAttemptAllowed: false,
  callerExecutionMaterialAccepted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

type InvocationDisposition =
  | 'completed'
  | 'failed'
  | 'not_executed_scale_from_zero_trigger'
  | 'outcome_unknown_requires_reconciliation'

function harness(
  disposition: InvocationDisposition,
  identityVerifier: CanonicalLiveGoogleServiceIdentityVerifier = verifier,
  deliveryBody: typeof spec.body = spec.body,
) {
  const counts = { invocations: 0, terminalAttempts: 0, finalizations: 0 }
  let terminal: CanonicalProfessionalGpuFairQueueDurableTerminal | null = null
  let terminalAttempt: ReturnType<typeof terminalUsageRecord> | null = null
  const queueAdapter = queueTransactionAdapter(counts, (value) => {
    terminal = value
  })
  const invocationRuntime: CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort = {
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-invocation-runtime-v1',
    currentDedicatedEndpointInvocation: true,
    historicalCloudJobCustomerDispatchUsed: false,
    routeOwnsGpuPlacementOrPricing: false,
    currentA100CustomerDispatchReadinessRereadRequired: true,
    rawProviderInvocationPortExposed: false,
    async invokeApprovedTrackAllWork(input) {
      counts.invocations += 1
      const request = parseTrackAllSam31AuthenticatedGpuInvocationRequest(
        input.request,
      )
      assert.equal(input.authenticatedOwnerUserId, funding.scope.ownerUserId)
      assert.equal(input.workspaceId, funding.scope.workspaceId)
      assert.equal(input.idempotencyKey, attempt.idempotencyKey)
      return invocationResult(request, disposition)
    },
  }
  const consumer = createCanonicalProfessionalGpuCloudTaskConsumer({
    identityVerifier,
    expectedAudience: audience,
    queueRuntimeReadPort: {
      async readDeliveryConsumption() {
        return delivery(terminal, deliveryBody)
      },
    },
    fundedStartAuthorityStore: {
      async rereadFundedAttemptByExecutionAttemptRef() {
        return {
          approvedFunding: structuredClone(funding),
          attemptStart: structuredClone(attempt),
          fundedStartRecordHash: sha256AuthorityValue({ funding, attempt }),
          executionIndexHash: sha256AuthorityValue(attempt.executionAttemptRef),
        }
      },
    },
    invocationRuntime,
    terminalAttemptOwner: {
      async recordTerminalAttempt(input) {
        counts.terminalAttempts += 1
        assert.equal(input.invocationId, attempt.idempotencyKey)
        assert.deepEqual(input.executionAttemptRef, attempt.executionAttemptRef)
        terminalAttempt = terminalUsageRecord(disposition)
        return terminalAttempt as never
      },
      async rereadTerminalAttempt() {
        return terminalAttempt as never
      },
    },
    queueTransactionAdapter: queueAdapter,
    now: () => observedAt,
  })
  return {
    consumer,
    counts,
    get terminal() { return terminal },
  }
}

function terminalUsageRecord(disposition: InvocationDisposition) {
  return {
    executionAttemptRef: attempt.executionAttemptRef,
    endpointInvocationResultRef:
      ref(`consumer-endpoint-result-${disposition}`),
    recordHash: sha256AuthorityValue({
      domain: 'consumer_terminal_usage_attempt',
      disposition,
    }),
  }
}

function delivery(
  terminal: CanonicalProfessionalGpuFairQueueDurableTerminal | null,
  body: typeof spec.body,
): CanonicalProfessionalGpuQueueDeliveryConsumption {
  const record = body === spec.body
    ? outboxRecord
    : {
      ...outboxRecord,
      cloudTaskSpec: {
        ...outboxRecord.cloudTaskSpec,
        body,
      },
    }
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-queue-delivery-consumption-v2' as const,
    source: 'canonical_postgres_professional_gpu_queue_read_owner' as const,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    queueEntryStatus: terminal?.disposition ?? 'dispatched' as const,
    claim,
    outboxRecord: record,
    terminal,
    exactClaimCreatedTaskAndTerminalReread: true as const,
    browserOrCallerExecutionMaterialAccepted: false as const,
    customerCreditsMutated: false as const,
    productionAuthorityGranted: false as const,
    observedAt,
  }
  if (body !== spec.body) return payload as never
  return assertCanonicalProfessionalGpuQueueDeliveryConsumption({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function queueTransactionAdapter(
  counts: { terminalAttempts: number; finalizations: number },
  setTerminal: (terminal: CanonicalProfessionalGpuFairQueueDurableTerminal) => void,
): CanonicalProfessionalGpuFairQueueTransactionAdapter {
  const unsupported = async () => { throw new Error('unsupported operation') }
  return {
    adapterId: 'private-consumer-smoke-postgres-adapter',
    databaseBackend: 'postgres',
    browserOrFrontendClientAllowed: false,
    automaticTransportRetryAllowed: false,
    sharedDurableTransactionPerformed: true,
    multiReplicaDurabilityVerified: true,
    cloudTasksDispatchVerified: false,
    productionAuthority: false,
    enqueue: unsupported,
    claim: unsupported,
    markDispatched: unsupported,
    recoverExpiredDispatchLeases: unsupported,
    async finalize(untrusted) {
      assert.equal(
        counts.terminalAttempts,
        1,
        'terminal usage attempt must exist before queue finalization',
      )
      counts.finalizations += 1
      const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
        untrusted,
        'finalize',
      )
      if (request.operation !== 'finalize') throw new Error('wrong operation')
      const terminalPayload = {
        schemaVersion:
          'canonical-professional-gpu-fair-queue-durable-terminal-v1' as const,
        source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
        queueId: request.queueId,
        runtimeRegion: request.runtimeRegion,
        queueEntryRef: ref(request.queueEntryId),
        executionAttemptRef: request.executionAttemptRef,
        claimRef: request.claimRef,
        terminalEvidenceRef: request.terminalEvidenceRef,
        disposition: request.disposition,
        terminalAt: request.terminalAt,
        automaticRetryStarted: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
      }
      const terminal = {
        ...terminalPayload,
        terminalHash: sha256AuthorityValue(terminalPayload),
      }
      setTerminal(terminal)
      const resultPayload = {
        schemaVersion:
          'canonical-professional-gpu-fair-queue-transaction-result-v1' as const,
        source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
        operation: 'finalize' as const,
        requestId: request.requestId,
        requestDigestSha256: request.requestDigestSha256,
        queueId: request.queueId,
        runtimeRegion: request.runtimeRegion,
        disposition: 'finalized' as const,
        queueEntryRef: ref(request.queueEntryId),
        claims: [],
        terminal,
        queuedCount: 0,
        activeCount: 0,
        requeuedBeforeDispatchCount: 0,
        reconciliationRequiredCount: 0,
        transactionRevision: counts.finalizations,
        transactionCommittedAt: request.terminalAt,
        sharedDurablePostgresTransactionPerformed: true as const,
        workspaceRoundRobinFairnessApplied: true as const,
        maximumActiveAttemptsPerWorkspace: 2 as const,
        cloudTasksDispatchStartedByQueueTransaction: false as const,
        cpuSubstantiveFallbackAllowed: false as const,
        automaticQualityReductionAllowed: false as const,
        silentAdditionalCreditApprovalAllowed: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
      }
      return {
        ...resultPayload,
        resultDigestSha256: sha256AuthorityValue(resultPayload),
      }
    },
  }
}

function invocationResult(
  request: ReturnType<
    typeof parseTrackAllSam31AuthenticatedGpuInvocationRequest
  >,
  disposition: InvocationDisposition,
) {
  const executed = disposition === 'completed' || disposition === 'failed'
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-invocation-result-v2' as const,
    requestRef: {
      id: request.requestId,
      version: 1,
      contentHash: `sha256:${request.requestDigestSha256}` as const,
    },
    workspaceId: funding.scope.workspaceId,
    approvedSnapshotId: funding.approvedSnapshotRef.id,
    workItemKey: funding.approvedWorkItem.workItemKey,
    fundedDispatchAdmissionRef: claim.queueEntry.fundedDispatchAdmissionRef,
    prelaunchAuthorizationRef: ref('consumer-prelaunch'),
    fixedTaskPreparationBridgeRef: ref('consumer-fixed-task-bridge'),
    endpointInvocationAttemptRef: ref('consumer-endpoint-attempt'),
    endpointCallStartRef: ref('consumer-endpoint-call-start'),
    endpointInvocationResultRef: ref(`consumer-endpoint-result-${disposition}`),
    executionAttemptRef: attempt.executionAttemptRef,
    runtimeResponseRef: executed ? ref('consumer-runtime-response') : null,
    invocationDisposition: disposition,
    providerOutcome: executed
      ? 'executed' as const
      : disposition === 'not_executed_scale_from_zero_trigger'
        ? 'not_executed' as const
        : 'unknown' as const,
    runtimeStatus: executed ? disposition : null,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    userTriggeredScaleFromZero: true as const,
    currentDedicatedEndpointInvocation: true as const,
    historicalCloudJobCustomerDispatchUsed: false as const,
    currentEndpointReadinessRereadBeforeInvocation: true as const,
    approvedSourceMaterialRereadByCanonicalServer: true as const,
    fundedPricingReservationAndAttemptRereadBeforeInvocation: true as const,
    accountEffectiveServingRateRereadBeforeInvocation: true as const,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry:
      disposition === 'outcome_unknown_requires_reconciliation',
    canonicalServingWindowUsageCostAndCreditSettlementPending: true as const,
    callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function makeClaim(): CanonicalProfessionalGpuFairQueueDurableClaim {
  const queueEntry = {
    queueEntryId: 'gpuq-consumer-sam31-1',
    ownerUserId: funding.scope.ownerUserId,
    workspaceId: funding.scope.workspaceId,
    projectId: funding.scope.projectId,
    routeId: 'a100_80gb_heavy_primary' as const,
    approvedSnapshotRef: funding.approvedSnapshotRef,
    approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
    fundedDispatchAdmissionRef: ref('consumer-funded-admission'),
    executionAttemptRef: attempt.executionAttemptRef,
    userTriggerRecordRef: attempt.userTriggerRecordRef,
    enqueuedAt: attempt.triggeredAt,
    enqueueOrdinal: 1,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-fair-queue-durable-claim-v1' as const,
    source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1' as const,
    queueEntry,
    scheduleRef: ref('consumer-schedule'),
    claimId: 'gpu-claim-consumer-sam31-1',
    claimedAt: observedAt,
    dispatchLeaseExpiresAt: '2026-08-04T18:37:00.000Z',
    externalDispatchOutcome: 'not_started' as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    automaticRetryAllowed: false as const,
  }
  return { ...payload, claimHash: sha256AuthorityValue(payload) }
}

function makeDispatchResult(
  taskSpec: ReturnType<typeof compileCanonicalProfessionalGpuCloudTaskSpec>,
): CanonicalProfessionalGpuCloudTaskDispatchResult {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-dispatch-result-v1' as const,
    source: 'canonical_google_cloud_tasks_dispatch_port' as const,
    cloudTaskSpecRef: {
      id: taskSpec.cloudTaskName,
      version: 1,
      contentHash: `sha256:${taskSpec.specDigestSha256}` as const,
    },
    cloudTaskRef: ref(taskSpec.cloudTaskName),
    disposition: 'task_created' as const,
    providerOutcome: 'created' as const,
    exactTaskRereadAfterAlreadyExists: false,
    automaticCreateRetryStarted: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function makeOutboxRecord(
  taskSpec: ReturnType<typeof compileCanonicalProfessionalGpuCloudTaskSpec>,
  dispatchResult: CanonicalProfessionalGpuCloudTaskDispatchResult,
): CanonicalProfessionalGpuCloudTaskOutboxRecord {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-outbox-record-v1' as const,
    source:
      'canonical_postgres_professional_gpu_cloud_task_outbox_owner' as const,
    outboxId: `gpu-task-outbox:${claim.claimHash}`,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    queueEntryId: claim.queueEntry.queueEntryId,
    claimRef: {
      id: claim.claimId,
      version: 1,
      contentHash: `sha256:${claim.claimHash}` as const,
    },
    cloudTaskSpec: taskSpec,
    status: 'created' as const,
    createLeaseId: 'gpu-task-create-lease-consumer-smoke',
    createLeaseExpiresAt: '2026-08-04T18:37:00.000Z',
    dispatchResult,
    externalCreateOutcome: 'created' as const,
    databaseRecordPersistedBeforeCloudTasksCreate: true as const,
    automaticCreateRetryAllowed: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    createdAt: observedAt,
    updatedAt: observedAt,
  }
  return { ...payload, recordHash: sha256AuthorityValue(payload) }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}
