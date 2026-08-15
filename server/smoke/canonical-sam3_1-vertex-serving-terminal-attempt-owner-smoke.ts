import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31CurrentVertexCustomerCallStart,
  assertCanonicalSam31CurrentVertexCustomerInvocationAttempt,
  assertCanonicalSam31CurrentVertexCustomerInvocationResult,
} from '../services/canonical-sam3_1-current-vertex-serving-invocation-service'
import {
  assertCanonicalSam31VertexServingTerminalAttemptRecord,
  createCanonicalSam31VertexServingTerminalAttemptOwner,
} from '../services/canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  attempt as fundedAttempt,
  funding,
} from './canonical-sam3_1-approved-track-all-task-source-repository-smoke'

const invocationId = fundedAttempt.idempotencyKey
const consumedAt = '2026-08-04T18:30:00.000Z'
const startedAt = '2026-08-04T18:30:01.000Z'
const completedAt = '2026-08-04T18:31:01.000Z'
const recordedAt = '2026-08-04T18:32:00.000Z'

const endpointAttemptPayload = {
  schemaVersion:
    'canonical-sam3_1-current-vertex-customer-invocation-attempt-v1' as const,
  source:
    'canonical_server_sam31_current_vertex_customer_invocation_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  invocationId,
  operationId: CANONICAL_SAM3_1_OPERATION_ID,
  routeId: 'a100_80gb_heavy_primary' as const,
  endpointResourceName: CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  currentCustomerDispatchReadinessRef: ref('current-readiness'),
  currentEndpointRouteRef: ref('current-endpoint-route', 2),
  endpointCapacityObservationRef: ref('current-capacity'),
  a100ServingQuotaObservationRef: ref('current-a100-quota'),
  runtimeReleaseRef: ref('current-runtime-release'),
  rateAuthorityRef: ref('current-serving-rate'),
  taskRecordRef: ref('current-task-record'),
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  fundedReservationRef: funding.fundedReservationRef,
  dispatchAdmissionDigestSha256: sha256AuthorityValue('dispatch-admission'),
  requestBodyDigestSha256: sha256AuthorityValue('request-body'),
  predictUrlDigestSha256: sha256AuthorityValue('predict-url'),
  attemptState:
    'funded_dispatch_admission_consumed_before_current_endpoint_call' as const,
  createOnlySingleUseConsumption: true as const,
  automaticRetryAllowed: false as const,
  callerEndpointModelStoragePathUrlBytesOrPriceAccepted: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  consumedAt,
}
const endpointAttempt =
  assertCanonicalSam31CurrentVertexCustomerInvocationAttempt({
    ...endpointAttemptPayload,
    attemptHash: sha256AuthorityValue(endpointAttemptPayload),
  })
const callStartPayload = {
  schemaVersion:
    'canonical-sam3_1-current-vertex-customer-call-start-v1' as const,
  source:
    'canonical_server_sam31_current_vertex_customer_invocation_owner' as const,
  invocationId,
  attemptRef: ref(invocationId, 1, endpointAttempt.attemptHash),
  requestBodyDigestSha256: endpointAttempt.requestBodyDigestSha256,
  predictUrlDigestSha256: endpointAttempt.predictUrlDigestSha256,
  callStartState: 'current_vertex_provider_call_started' as const,
  createOnlyCallStart: true as const,
  automaticRetryAllowed: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  startedAt,
}
const callStart = assertCanonicalSam31CurrentVertexCustomerCallStart({
  ...callStartPayload,
  callStartHash: sha256AuthorityValue(callStartPayload),
})

const completedResult = result('completed', 'executed')
const completedHarness = harness(completedResult)
const completed = await completedHarness.owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
})
assert.deepEqual(
  assertCanonicalSam31VertexServingTerminalAttemptRecord(completed),
  completed,
)
assert.equal(completed.attempt.terminalOutcome, 'completed')
assert.equal(completed.attempt.activeRequestMilliseconds, 60_000)
assert.equal(completed.attempt.approvedReservedToolCostCredits, 40)
assert.equal(completed.workerSuppliedBillableDurationReplicaCountOrPriceAccepted,
  false)
assert.equal(completedHarness.creates, 1)

const replay = await completedHarness.owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
})
assert.equal(replay.recordHash, completed.recordHash)
assert.equal(completedHarness.creates, 1)

const failed = await harness(result('failed', 'executed')).owner
  .recordTerminalAttempt({
    invocationId,
    executionAttemptRef: fundedAttempt.executionAttemptRef,
    recordedAt,
  })
assert.equal(failed.attempt.terminalOutcome, 'weeditpro_failed')
assert.equal(failed.attempt.providerInferenceOrSubstantiveWorkOutcome,
  'executed')

const notExecuted = await harness(result(
  'not_executed_scale_from_zero_trigger',
  'not_executed',
)).owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
})
assert.equal(notExecuted.attempt.terminalOutcome, 'canceled')
assert.equal(notExecuted.attempt.providerInferenceOrSubstantiveWorkOutcome,
  'not_executed')

await assert.rejects(() => harness(result(
  'outcome_unknown_requires_reconciliation',
  'unknown',
)).owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
}), /unresolved provider outcome/u)

await assert.rejects(() => harness(completedResult, {
  ...fundedAttempt,
  idempotencyKey: 'crossed-invocation-id',
}).owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
}), /lineage differ/u)

const tamperedHarness = harness(completedResult)
await tamperedHarness.owner.recordTerminalAttempt({
  invocationId,
  executionAttemptRef: fundedAttempt.executionAttemptRef,
  recordedAt,
})
const path = [...tamperedHarness.objects.keys()][0]
assert.ok(path)
const tampered = JSON.parse(tamperedHarness.objects.get(path)!.toString('utf8'))
tampered.customerCreditsMutated = true
tamperedHarness.objects.set(path, Buffer.from(JSON.stringify(tampered)))
await assert.rejects(() => tamperedHarness.owner.rereadTerminalAttempt({
  executionAttemptRef: fundedAttempt.executionAttemptRef,
}))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'invocationId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return invocationId
  },
})
await assert.rejects(() => completedHarness.owner.recordTerminalAttempt(
  hostile as never,
))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-terminal-attempt-owner',
  checks: 26,
  exactFundingInvocationStartResultAndTerminalReread: true,
  completedAttemptPersisted: true,
  failedExecutedAttemptPersistedForWeEditProAbsorption: true,
  knownNotExecutedAttemptPersisted: true,
  unresolvedProviderOutcomeAccepted: false,
  identicalReplayCreatedSecondRecord: false,
  workerSuppliedBillableDurationReplicaCountOrPriceAccepted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function result(
  disposition:
    | 'completed'
    | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation',
  providerOutcome: 'executed' | 'not_executed' | 'unknown',
) {
  const executed = disposition === 'completed' || disposition === 'failed'
  const notExecuted = disposition === 'not_executed_scale_from_zero_trigger'
  const unknown = disposition === 'outcome_unknown_requires_reconciliation'
  const payload = {
    schemaVersion:
      'canonical-sam3_1-current-vertex-customer-invocation-result-v1' as const,
    source:
      'canonical_server_sam31_current_vertex_customer_invocation_owner' as const,
    evidenceClass: 'canonical_private_exact_response_reread' as const,
    invocationId,
    attemptRef: callStart.attemptRef,
    callStartRef: ref(invocationId, 1, callStart.callStartHash),
    executionAttemptRef: fundedAttempt.executionAttemptRef,
    disposition,
    runtimeStatus: executed ? disposition as 'completed' | 'failed' : null,
    runtimeResponseRef: executed ? ref('runtime-response') : null,
    uploadedObjectCount: executed ? 3 : null,
    uploadedByteLength: executed ? 12_000 : null,
    terminalEvidenceMode: executed
      ? 'provider_prediction_and_private_response' as const
      : notExecuted
        ? 'vertex_scale_zero_429_before_inference' as const
        : 'none_unknown' as const,
    providerCallStarted: true as const,
    providerOutcome,
    providerRoundTripDurationMilliseconds: unknown ? null : 60_000,
    exactPrivateRuntimeResponseReread: executed,
    exactVertexPredictionWrapperReread: executed,
    automaticRetryAllowed: false as const,
    knownNotExecutedMayEnterNewServerOwnedAttemptAfterReconciliation:
      notExecuted,
    unresolvedOutcomeBlocksRetry: unknown,
    canonicalServingWindowUsageCostAndCreditSettlementPending: true as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: completedAt,
  }
  return assertCanonicalSam31CurrentVertexCustomerInvocationResult({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function harness(
  terminal: ReturnType<typeof result>,
  attemptStart = fundedAttempt,
) {
  const objects = new Map<string, Buffer>()
  let creates = 0
  const objectPort: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly(input) {
      if (objects.has(input.objectPath)) return 'already_exists'
      creates += 1
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = objects.get(path)
      return body ? Buffer.from(body) : null
    },
  }
  const owner = createCanonicalSam31VertexServingTerminalAttemptOwner({
    fundedStartAuthorityStore: {
      async rereadFundedAttemptByExecutionAttemptRef() {
        return {
          approvedFunding: structuredClone(funding),
          attemptStart: structuredClone(attemptStart),
          fundedStartRecordHash: sha256AuthorityValue({
            funding,
            attempt: attemptStart,
          }),
          executionIndexHash: sha256AuthorityValue(
            attemptStart.executionAttemptRef,
          ),
        }
      },
    },
    invocationRepository: {
      async rereadAttempt() { return structuredClone(endpointAttempt) },
      async rereadCallStart() { return structuredClone(callStart) },
      async rereadTerminal() { return structuredClone(terminal) },
    },
    objectPort,
  })
  return {
    owner,
    objects,
    get creates() { return creates },
  }
}

function ref(
  id: string,
  version = 1,
  digest: string = sha256AuthorityValue(id),
) {
  return {
    id,
    version,
    contentHash: `sha256:${digest}` as const,
  }
}
