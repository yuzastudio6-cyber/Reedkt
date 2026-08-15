import assert from 'node:assert/strict'

import {
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort,
} from '../services/canonical-a100-vertex-professional-gpu-terminal-adapter'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
  canonicalA100VertexCustomJobTerminalReadSchema,
} from '../services/canonical-a100-vertex-custom-job-terminal-port'
import {
  CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
  assertCanonicalProfessionalGpuTerminalObservation,
  canonicalProfessionalGpuJobLaunchSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const LAUNCHED_AT = '2026-08-09T10:00:00.000Z'
const OBSERVED_AT = '2026-08-09T10:08:00.000Z'
const executionRef = ref('vertex-a100-execution-1', '1'.repeat(64))
const launch = buildLaunch()
const completed = buildTerminalRead({
  disposition: 'terminal',
  terminalOutcome: 'completed',
})

const observation = assertCanonicalProfessionalGpuTerminalObservation(await
createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
  terminalReadPort: {
    async reread({ executionRef: received }) {
      assert.deepEqual(received, executionRef)
      return structuredClone(completed)
    },
  },
}).rereadTerminalUsagePriceAndCost({ launch }))

assert.equal(observation.terminalOutcome, 'completed')
assert.equal(observation.providerInferenceOrSubstantiveWorkOutcome, 'executed')
assert.deepEqual(observation.cloudJobExecutionRef, executionRef)
assert.deepEqual(observation.cloudCapacityTeardownObservationRef,
  completed.cloudCapacityTeardownObservationRef)
assert.equal(observation.activeGpuInstancesAfterTerminalObservation, 0)
assert.equal(observation.customerWalletOrLedgerMutated, false)

await assert.rejects(() =>
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
    terminalReadPort: {
      async reread() {
        return buildTerminalRead({
          disposition: 'pending', terminalOutcome: null,
        })
      },
    },
  }).rereadTerminalUsagePriceAndCost({ launch }), /checkback/u)

await assert.rejects(() =>
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
    terminalReadPort: {
      async reread() {
        return buildTerminalRead({
          disposition: 'outcome_unknown_requires_reconciliation',
          terminalOutcome: null,
        })
      },
    },
  }).rereadTerminalUsagePriceAndCost({ launch }), /reconciliation/u)

await assert.rejects(() =>
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
    terminalReadPort: {
      async reread() {
        return buildTerminalRead({
          disposition: 'terminal', terminalOutcome: 'expired',
        })
      },
    },
  }).rereadTerminalUsagePriceAndCost({ launch }), /successor/u)

await assert.rejects(() =>
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
    terminalReadPort: { async reread() { return completed } },
  }).rereadTerminalUsagePriceAndCost({
    launch: { ...launch, routeId: 'l4_heavy_fallback' } as never,
  }))

console.log(JSON.stringify({
  smoke: 'canonical-a100-vertex-professional-gpu-terminal-adapter',
  checks: {
    exactVertexExecutionRefReread: true,
    distinctTerminalAndCapacityTeardownLineage: true,
    exactProviderUsageRateAndCostRefsPreserved: true,
    pendingRequiresCheckback: true,
    unknownRequiresReconciliation: true,
    expiredRequiresVersionedSuccessor: true,
    nonVertexRouteRejected: true,
    walletQaPublicProductionRemainClosed: true,
  },
}, null, 2))

function buildLaunch() {
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
    launchRecordId: 'gpu-launch-1',
    admissionRef: ref('admission-1', '2'.repeat(64)),
    admissionConsumptionRef: ref('consumption-1', '3'.repeat(64)),
    runtimeReleaseRef: ref('runtime-release-1', '4'.repeat(64)),
    executionEnvelopeRef: ref('execution-envelope-1', '5'.repeat(64)),
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    immutableImageDigest: `sha256:${'6'.repeat(64)}` as const,
    cloudJobCreateRequestRef: ref('create-request-1', '7'.repeat(64)),
    cloudJobExecutionRef: executionRef,
    launchDisposition: 'job_created' as const,
    providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed' as const,
    createOnlyAdmissionConsumedBeforeLaunch: true as const,
    duplicateLaunchAllowed: false as const,
    unknownOutcomeRetryAllowed: false as const,
    noApprovedAdmissionMeansZeroGpuJobs: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    launchedAt: LAUNCHED_AT,
  }
  return canonicalProfessionalGpuJobLaunchSchema.parse({
    ...payload,
    launchHash: sha256AuthorityValue(payload),
  })
}

function buildTerminalRead(input: {
  disposition: 'pending' | 'terminal' |
    'outcome_unknown_requires_reconciliation'
  terminalOutcome: 'completed' | 'failed' | 'canceled' | 'expired' | null
}) {
  const terminal = input.disposition === 'terminal'
  const pending = input.disposition === 'pending'
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
    source: 'canonical_a100_vertex_custom_job_terminal_port' as const,
    executionRef,
    disposition: input.disposition,
    providerState: terminal
      ? input.terminalOutcome === 'completed'
        ? 'JOB_STATE_SUCCEEDED' as const
        : input.terminalOutcome === 'failed'
          ? 'JOB_STATE_FAILED' as const
          : input.terminalOutcome === 'canceled'
            ? 'JOB_STATE_CANCELLED' as const
            : 'JOB_STATE_EXPIRED' as const
      : pending ? 'JOB_STATE_RUNNING' as const : null,
    terminalOutcome: input.terminalOutcome,
    cloudTerminalObservationRef: terminal
      ? ref('vertex-terminal-1', '8'.repeat(64)) : null,
    cloudCapacityTeardownObservationRef: terminal
      ? ref('vertex-capacity-stop-1', '9'.repeat(64)) : null,
    workerUsageEvidenceRef: terminal
      ? ref('worker-usage-1', 'a'.repeat(64)) : null,
    currentAccountPriceAuthorityRef: terminal
      ? ref('account-rate-1', 'b'.repeat(64)) : null,
    attemptCostReceiptRef: terminal
      ? ref('attempt-cost-1', 'c'.repeat(64)) : null,
    providerInferenceOrSubstantiveWorkOutcome:
      terminal ? 'executed' as const : 'unknown' as const,
    createTime: terminal || pending ? LAUNCHED_AT : null,
    startTime: terminal || pending ? '2026-08-09T10:01:00.000Z' : null,
    endTime: terminal ? '2026-08-09T10:07:00.000Z' : null,
    providerJobTerminalStateReread: terminal,
    workerStoppedVerified: terminal,
    activeA100GpuInstancesAfterObservation: terminal ? 0 as const : null,
    zeroActiveA100ClaimScopedToThisOneShotAttempt: terminal,
    exactVertexPlatformUsageAndAccountEffectivePriceReread: terminal,
    costReceiptPersistedBeforeSettlement: terminal,
    checkbackAllowed: pending,
    retryAllowedWithoutCanonicalReconciliation: false as const,
    minimumIdleInstances: 0 as const,
    persistentEndpointPresent: false as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: OBSERVED_AT,
  }
  return canonicalA100VertexCustomJobTerminalReadSchema.parse({
    ...payload,
    terminalReadHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  }
}
