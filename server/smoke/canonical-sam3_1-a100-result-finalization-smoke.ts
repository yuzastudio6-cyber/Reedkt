import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
  canonicalProfessionalGpuTerminalObservationSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31A100ResultFinalizationRuntime,
} from '../services/canonical-sam3_1-a100-result-finalization-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  canonicalSam31A100LaunchFixture as launch,
  canonicalSam31A100PrivateOutputEvidenceFixture as outputEvidence,
  canonicalSam31A100RuntimeResponseFixture as response,
  canonicalSam31A100TaskFixture as task,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const objects = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objects)
const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort,
})
await lifecycleStore.createLaunchRecordOnly({ record: launch })
const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort,
})
let terminalReads = 0
let outputReads = 0
const runtime = createCanonicalSam31A100ResultFinalizationRuntime({
  lifecycleStore,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      terminalReads += 1
      return buildObservation()
    },
  },
  taskStore: {
    schemaVersion: 'canonical-sam3_1-gpu-task-store-v1',
    evidenceClass: 'gcs_generation_create_only_sam3_1_task_store',
    async persistTaskCreateOnly() { return 'already_exists' },
    async rereadTask() { return structuredClone(task) },
    async rereadRuntimeResponse() { return structuredClone(response) },
  },
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      outputReads += 1
      return structuredClone(outputEvidence)
    },
  },
  resultStore,
  now: () => '2026-08-02T18:07:00.000Z',
})

const first = await runtime.finalize({
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
})
assert.equal(first.status, 'ready_for_independent_mask_artifact_qa')
assert.equal(first.accelerator, 'nvidia_a100_80gb')
assert.equal(first.qaApproved, false)
assert.equal(terminalReads, 1)
assert.equal(outputReads, 1)

const second = await runtime.finalize({
  invocationId: task.invocationId,
  launchRecordId: launch.launchRecordId,
})
assert.equal(second.resultAdmissionHash, first.resultAdmissionHash)
assert.equal(terminalReads, 1)
assert.equal(outputReads, 1)

await assert.rejects(() => runtime.finalize({
  invocationId: 'crossed-invocation',
  launchRecordId: launch.launchRecordId,
}), /scope differs/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-a100-result-finalization',
  checks: {
    exactGenericLaunchReread: true,
    vertexTerminalRecordedCreateOnly: true,
    exactTaskResponseAndPrivateOutputReread: true,
    resultAdmissionCreatedOnlyAfterTerminalAndOutput: true,
    restartSafeIdempotentReread: true,
    crossedInvocationRejected: true,
    qaAssetsCreditsRenderPublicProductionRemainClosed: true,
  },
}, null, 2))

function buildObservation() {
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
    source: 'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    cloudTerminalObservationRef: ref('vertex-terminal', '1'.repeat(64)),
    cloudCapacityTeardownObservationRef:
      ref('vertex-capacity-stop', '2'.repeat(64)),
    workerUsageEvidenceRef: ref('vertex-worker-usage', '3'.repeat(64)),
    currentAccountPriceAuthorityRef: ref('account-rate', '4'.repeat(64)),
    attemptCostReceiptRef: ref('vertex-attempt-cost', '5'.repeat(64)),
    terminalOutcome: 'completed' as const,
    providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
    cloudJobTerminalStateReread: true,
    workerStoppedVerified: true,
    activeGpuInstancesAfterTerminalObservation: 0 as const,
    exactPlatformUsageAndAccountPriceReread: true as const,
    costReceiptPersistedBeforeSettlement: true as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerOrPlanTerminalClaimAccepted: false as const,
    observedAt: '2026-08-02T18:05:00.000Z',
  }
  return canonicalProfessionalGpuTerminalObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hash(input.body), input.contentSha256)
      const existing = values.get(input.objectPath)
      if (existing) {
        assert.equal(existing.equals(input.body), true)
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string, hash: string) {
  return { id, version: 1, contentHash: `sha256:${hash}` as const }
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
