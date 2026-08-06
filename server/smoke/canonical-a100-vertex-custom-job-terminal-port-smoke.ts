import assert from 'node:assert/strict'

import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
  canonicalA100VertexCustomJobExecutionRecordSchema,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION,
  assertCanonicalA100VertexCustomJobTerminalRead,
  canonicalA100VertexCustomJobTerminalCostEvidenceSchema,
  createCanonicalA100VertexCustomJobTerminalPort,
  type CanonicalA100VertexCustomJobTerminalCostEvidence,
} from '../services/canonical-a100-vertex-custom-job-terminal-port'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const NOW = '2026-08-06T20:00:00.000Z'
const CREATE_TIME = '2026-08-06T19:55:00.000Z'
const START_TIME = '2026-08-06T19:56:00.000Z'
const END_TIME = '2026-08-06T19:59:00.000Z'

const execution = buildExecutionRecord()
const executionRef = ref(
  execution.executionRecordId,
  execution.executionRecordHash,
)
const observedRequests: Array<Record<string, unknown>> = []
let terminalCostReads = 0

const pending = await createCanonicalA100VertexCustomJobTerminalPort({
  executionRepository: exactExecutionRepository(),
  costEvidenceReadPort: unreachableCostPort(),
  auth: providerJobAuth({
    name: execution.customJobResourceName,
    displayName: execution.displayName,
    state: 'JOB_STATE_RUNNING',
    createTime: CREATE_TIME,
    startTime: START_TIME,
  }, observedRequests),
  now: () => NOW,
}).reread({ executionRef })
assert.equal(pending.disposition, 'pending')
assert.equal(pending.providerState, 'JOB_STATE_RUNNING')
assert.equal(pending.checkbackAllowed, true)
assert.equal(pending.retryAllowedWithoutCanonicalReconciliation, false)
assert.equal(pending.activeA100GpuInstancesAfterObservation, null)
assert.equal(pending.exactVertexPlatformUsageAndAccountEffectivePriceReread,
  false)
assert.equal(observedRequests.length, 1)
assert.equal(
  observedRequests[0]?.url,
  `https://us-central1-aiplatform.googleapis.com/v1/${execution.customJobResourceName}`,
)
assert.equal(observedRequests[0]?.method, 'GET')
assert.equal(observedRequests[0]?.retry, false)
assert.equal(observedRequests[0]?.maxRedirects, 0)

const terminalObservationRef = opaqueRef('vertex-a100-terminal', {
  executionRef,
  provider: {
    name: execution.customJobResourceName,
    displayName: execution.displayName,
    state: 'JOB_STATE_SUCCEEDED',
    createTime: CREATE_TIME,
    startTime: START_TIME,
    endTime: END_TIME,
  },
})
const terminalCostEvidence = buildCostEvidence({
  cloudTerminalObservationRef: terminalObservationRef,
  outcome: 'executed',
})
const terminal = assertCanonicalA100VertexCustomJobTerminalRead(
  await createCanonicalA100VertexCustomJobTerminalPort({
    executionRepository: exactExecutionRepository(),
    costEvidenceReadPort: {
      async rereadUsageAccountPriceAndCost(input) {
        terminalCostReads += 1
        assert.deepEqual(input.executionRef, executionRef)
        assert.deepEqual(input.cloudTerminalObservationRef,
          terminalObservationRef)
        assert.equal(input.terminalOutcome, 'completed')
        return structuredClone(terminalCostEvidence)
      },
    },
    auth: providerJobAuth({
      name: execution.customJobResourceName,
      displayName: execution.displayName,
      state: 'JOB_STATE_SUCCEEDED',
      createTime: CREATE_TIME,
      startTime: START_TIME,
      endTime: END_TIME,
    }),
    now: () => NOW,
  }).reread({ executionRef }),
)
assert.equal(terminal.disposition, 'terminal')
assert.equal(terminal.terminalOutcome, 'completed')
assert.equal(terminal.providerJobTerminalStateReread, true)
assert.equal(terminal.workerStoppedVerified, true)
assert.equal(terminal.activeA100GpuInstancesAfterObservation, 0)
assert.equal(terminal.exactVertexPlatformUsageAndAccountEffectivePriceReread,
  true)
assert.equal(terminal.costReceiptPersistedBeforeSettlement, true)
assert.equal(terminal.customerWalletOrLedgerMutated, false)
assert.equal(terminalCostReads, 1)

for (const [state, outcome] of [
  ['JOB_STATE_FAILED', 'failed'],
  ['JOB_STATE_CANCELLED', 'canceled'],
  ['JOB_STATE_EXPIRED', 'expired'],
] as const) {
  const provider = {
    name: execution.customJobResourceName,
    displayName: execution.displayName,
    state,
    createTime: CREATE_TIME,
    startTime: START_TIME,
    endTime: END_TIME,
  }
  const cloudTerminalObservationRef = opaqueRef('vertex-a100-terminal', {
    executionRef,
    provider,
  })
  const result = await createCanonicalA100VertexCustomJobTerminalPort({
    executionRepository: exactExecutionRepository(),
    costEvidenceReadPort: {
      async rereadUsageAccountPriceAndCost(input) {
        assert.equal(input.terminalOutcome, outcome)
        return buildCostEvidence({
          cloudTerminalObservationRef,
          outcome: 'not_executed',
        })
      },
    },
    auth: providerJobAuth(provider),
    now: () => NOW,
  }).reread({ executionRef })
  assert.equal(result.disposition, 'terminal')
  assert.equal(result.terminalOutcome, outcome)
  assert.equal(result.systemFailureOrUnknownCostChargedToCustomer, false)
}

const staleCostEvidence = buildCostEvidence({
  cloudTerminalObservationRef: terminalObservationRef,
  outcome: 'executed',
  observedAt: '2026-08-06T19:58:00.000Z',
})
const staleCost = await createCanonicalA100VertexCustomJobTerminalPort({
  executionRepository: exactExecutionRepository(),
  costEvidenceReadPort: {
    async rereadUsageAccountPriceAndCost() {
      return staleCostEvidence
    },
  },
  auth: providerJobAuth({
    name: execution.customJobResourceName,
    displayName: execution.displayName,
    state: 'JOB_STATE_SUCCEEDED',
    createTime: CREATE_TIME,
    startTime: START_TIME,
    endTime: END_TIME,
  }),
  now: () => NOW,
}).reread({ executionRef })
assertUnknown(staleCost)

const networkUnknown = await createCanonicalA100VertexCustomJobTerminalPort({
  executionRepository: exactExecutionRepository(),
  costEvidenceReadPort: unreachableCostPort(),
  auth: {
    async request() {
      throw new Error('network result unavailable')
    },
  },
  now: () => NOW,
}).reread({ executionRef })
assertUnknown(networkUnknown)

let providerCalls = 0
const crossedExecution = await createCanonicalA100VertexCustomJobTerminalPort({
  executionRepository: {
    async rereadExecution() {
      return execution
    },
  },
  costEvidenceReadPort: unreachableCostPort(),
  auth: {
    async request() {
      providerCalls += 1
      throw new Error('must not be called')
    },
  },
  now: () => NOW,
}).reread({
  executionRef: ref('another-execution', '1'.repeat(64)),
})
assertUnknown(crossedExecution)
assert.equal(providerCalls, 0)

let getterInvoked = false
const hostile = Object.create(null) as Record<string, unknown>
Object.defineProperty(hostile, 'id', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('must not invoke getter')
  },
})
const hostileResult = await createCanonicalA100VertexCustomJobTerminalPort({
  executionRepository: exactExecutionRepository(),
  costEvidenceReadPort: unreachableCostPort(),
  auth: providerJobAuth({}),
  now: () => NOW,
}).reread({ executionRef: hostile })
assertUnknown(hostileResult)
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-a100-vertex-custom-job-terminal-port',
  checks: {
    canonicalExecutionRereadBeforeProvider: true,
    exactPinnedVertexGetRequest: true,
    pendingCheckbackWithoutCostClaim: true,
    terminalUsagePriceAndCostReread: true,
    workerStoppedAndZeroActiveGpuRequired: true,
    failedCanceledExpiredMapped: true,
    staleCostEvidenceRequiresReconciliation: true,
    unknownProviderOutcomeRetryForbidden: true,
    crossedAndHostileInputFailClosed: true,
    customerWalletQaPublicProductionRemainClosed: true,
  },
}, null, 2))

function buildExecutionRecord() {
  const payload = {
    schemaVersion:
      CANONICAL_A100_VERTEX_CUSTOM_JOB_EXECUTION_RECORD_VERSION,
    source: 'canonical_a100_vertex_custom_job_launch_port' as const,
    executionRecordId: 'vertex-a100-execution.0123456789abcdef',
    authorityRef: ref('authority-1', '1'.repeat(64)),
    releaseRef: ref('release-1', '2'.repeat(64)),
    consumptionRef: ref('consumption-1', '3'.repeat(64)),
    customJobCreateRequestRef: ref('create-request-1', '4'.repeat(64)),
    customJobResourceName:
      'projects/reeditpro/locations/us-central1/customJobs/12345',
    displayName: 'weeditpro-sam31-a100-attempt-1',
    initialState: 'JOB_STATE_QUEUED' as const,
    providerResponseDigestSha256: '5'.repeat(64),
    createResponsePersistedAndExactReread: true as const,
    terminalStateClaimed: false as const,
    customerCreditsMutated: false as const,
    persistedAt: CREATE_TIME,
  }
  return canonicalA100VertexCustomJobExecutionRecordSchema.parse({
    ...payload,
    executionRecordHash: sha256AuthorityValue(payload),
  })
}

function buildCostEvidence(input: {
  cloudTerminalObservationRef: ReturnType<typeof ref>
  outcome: 'executed' | 'not_executed'
  observedAt?: string
}): CanonicalA100VertexCustomJobTerminalCostEvidence {
  const payload = {
    schemaVersion:
      CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION,
    source:
      'canonical_server_a100_vertex_usage_account_price_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    executionRef,
    cloudTerminalObservationRef: input.cloudTerminalObservationRef,
    workerUsageEvidenceRef: ref('worker-usage-1', '6'.repeat(64)),
    currentAccountPriceAuthorityRef: ref('account-price-1', '7'.repeat(64)),
    attemptCostReceiptRef: ref('attempt-cost-1', '8'.repeat(64)),
    providerInferenceOrSubstantiveWorkOutcome: input.outcome,
    exactVertexPlatformUsageReread: true as const,
    exactBillingAccountEffectivePriceReread: true as const,
    attemptCostReceiptPersistedBeforeSettlement: true as const,
    activeA100GpuInstancesAfterObservation: 0 as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerWorkerPriceUsageOrCostClaimAccepted: false as const,
    observedAt: input.observedAt ?? NOW,
  }
  return canonicalA100VertexCustomJobTerminalCostEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function exactExecutionRepository() {
  return {
    async rereadExecution() {
      return structuredClone(execution)
    },
  }
}

function unreachableCostPort() {
  return {
    async rereadUsageAccountPriceAndCost(): Promise<never> {
      throw new Error('cost port must not be called')
    },
  }
}

function providerJobAuth(
  provider: Record<string, unknown>,
  requests?: Array<Record<string, unknown>>,
) {
  return {
    async request(request: Record<string, unknown>) {
      requests?.push(structuredClone(request))
      return { data: structuredClone(provider) } as never
    },
  }
}

function assertUnknown(value: {
  disposition: string
  retryAllowedWithoutCanonicalReconciliation: boolean
  checkbackAllowed: boolean
  customerWalletOrLedgerMutated: boolean
}) {
  assert.equal(value.disposition, 'outcome_unknown_requires_reconciliation')
  assert.equal(value.retryAllowedWithoutCanonicalReconciliation, false)
  assert.equal(value.checkbackAllowed, false)
  assert.equal(value.customerWalletOrLedgerMutated, false)
}

function opaqueRef(id: string, value: unknown) {
  return ref(`${id}.${sha256AuthorityValue(value).slice(0, 32)}`,
    sha256AuthorityValue(value))
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  }
}
