import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SAM3_1_QUALIFICATION_A100_RATE_OWNER_VERSION,
  type CanonicalSam31QualificationA100RateOwner,
} from '../services/canonical-sam3_1-qualification-a100-rate-owner'
import {
  createCanonicalSam31QualificationA100StateRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-a100-runtime'
import {
  CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION,
  type CanonicalSam31QualificationPackageRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_RUNTIME_VERSION,
  createCanonicalSam31GcpSourceCheckpointQualificationRuntime,
  createCanonicalSam31SourceCheckpointQualificationRuntime,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-runtime'
import { canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import {
  attemptId,
  mount,
  rate,
  workerRequest,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase-smoke'

const objectStore = memoryObjectPort()
const statePort = createCanonicalSam31QualificationA100StateRepository({
  objectPort: objectStore.port,
  prefix: 'private/test/sam31/runtime-state',
})
let packagePersistCalls = 0
let stageCalls = 0
let batchCalls = 0
let resultOwnerCalls = 0
let terminalOwnerCalls = 0
let liveRateCalls = 0

const workerRequestRef = Object.freeze({
  id: workerRequest.qualificationId,
  version: 1,
  contentHash: `sha256:${workerRequest.requestHash}` as const,
})
const packageRepository: CanonicalSam31QualificationPackageRepository = {
  schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION,
  evidenceClass: 'private_create_only_exact_reread',
  async persistQualificationPackageCreateOnly(input) {
    packagePersistCalls += 1
    assert.deepEqual(input.workerRequest, workerRequest)
    assert.deepEqual(input.ingestReceipt, canonicalIngest)
    assert.equal(input.preparedAt, '2026-08-04T18:00:00.000Z')
    return {
      disposition: 'created',
      workerRequestRef,
      packageRef: ref('sam31-source-checkpoint-runtime-package'),
      modelOrGpuRuntimeStarted: false,
      customerCreditsMutated: false,
      productionAuthorityGranted: false,
    }
  },
  async rereadExactWorkerRequest() {
    return structuredClone(workerRequest)
  },
  async rereadExactSources() {
    throw new Error('controlled source read should remain behind staging owner')
  },
}
const rateOwner: CanonicalSam31QualificationA100RateOwner = {
  schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_A100_RATE_OWNER_VERSION,
  evidenceClass:
    'billing_api_observation_create_only_repository_exact_reread',
  async rereadCurrentAccountEffectiveA100Rate() {
    return structuredClone(rate)
  },
  async rereadExactApprovedRate() {
    return structuredClone(rate)
  },
}
const runtime = createCanonicalSam31SourceCheckpointQualificationRuntime({
  foundationReadPort: {
    async rereadCurrentFoundation() {
      return null
    },
  },
  qualificationPackageRepository: packageRepository,
  qualificationImageReleaseReadPort: {
    async rereadQualifiedQualificationImageRelease() {
      throw new Error('controlled release read should remain fail closed')
    },
  },
  stagingOwner: {
    async stageOne(input) {
      stageCalls += 1
      assert.equal(input.attemptId, attemptId)
      assert.deepEqual(input.workerRequest, workerRequest)
      return structuredClone(mount)
    },
    async rereadExactAttemptMount() {
      return structuredClone(mount)
    },
  },
  statePort,
  rateOwner,
  batchTransport: {
    async request() {
      batchCalls += 1
      throw new Error('controlled Batch transport must not be reached')
    },
  },
  resultOwner: {
    async rereadAndPersist() {
      resultOwnerCalls += 1
      throw new Error('controlled result owner must not be reached')
    },
  },
  terminalEvidenceOwner: {
    async rereadAndPersist() {
      terminalOwnerCalls += 1
      throw new Error('controlled terminal owner must not be reached')
    },
  },
  now: () => '2026-08-04T18:00:00.000Z',
})

assert.equal(
  runtime.schemaVersion,
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_RUNTIME_VERSION,
)
assert.equal(runtime.evidenceClass,
  'private_ordered_fail_closed_qualification_composition')
assert.equal(packagePersistCalls, 0)
assert.equal(stageCalls, 0)
assert.equal(batchCalls, 0)

const staged = await runtime.prepareAndStage({
  attemptId,
  workerRequest,
  ingestReceipt: canonicalIngest,
  preparedAt: '2026-08-04T18:00:00.000Z',
})
assert.equal(staged.status, 'staged_not_dispatched')
assert.equal(staged.packageDisposition, 'created')
assert.equal(staged.attemptId, attemptId)
assert.equal(staged.workerRequestRef.contentHash,
  `sha256:${workerRequest.requestHash}`)
assert.equal(staged.mountObservation.attemptId, attemptId)
assert.equal(staged.gpuJobStarted, false)
assert.equal(staged.modelOrCheckpointDownloadedToDeveloperMachine, false)
assert.equal(staged.sourceCheckpointQualificationGranted, false)
assert.equal(staged.runtimeReleaseGranted, false)
assert.equal(staged.customerCreditsMutated, false)
assert.equal(staged.productionReady, false)
assert.equal(packagePersistCalls, 1)
assert.equal(stageCalls, 1)
assert.equal(batchCalls, 0)

await assert.rejects(runtime.prepareAndStage({
  attemptId,
  workerRequest,
  ingestReceipt: canonicalIngest,
  preparedAt: '2026-08-04T18:00:00.000Z',
  injectedBucket: 'caller-bucket',
} as never))
assert.equal(packagePersistCalls, 1)
assert.equal(stageCalls, 1)

await assert.rejects(runtime.admitAndStart({
  attemptId,
  qualificationImageSupplyChainReleaseRef: ref('qualification-image-release'),
  workerRequestRef,
}))
assert.equal(batchCalls, 0)
await assert.rejects(runtime.reconcileOne({ attemptId }))
await assert.rejects(runtime.finalizeSucceededAttempt({ attemptId }))
assert.equal(resultOwnerCalls, 0)
assert.equal(terminalOwnerCalls, 0)

assert.throws(() => createCanonicalSam31SourceCheckpointQualificationRuntime({
  foundationReadPort: { async rereadCurrentFoundation() { return null } },
  qualificationPackageRepository: packageRepository,
  qualificationImageReleaseReadPort: {
    async rereadQualifiedQualificationImageRelease() { return null },
  },
  stagingOwner: {
    async stageOne() { return mount },
    async rereadExactAttemptMount() { return mount },
  },
  statePort,
  rateOwner,
  batchTransport: { async request() { throw new Error('controlled') } },
  resultOwner: {} as never,
  terminalEvidenceOwner: {
    async rereadAndPersist() { throw new Error('controlled') },
  },
}))

const gcpRuntime =
  createCanonicalSam31GcpSourceCheckpointQualificationRuntime({
    liveRateReadPort: {
      async readCurrentRouteRate() {
        liveRateCalls += 1
        throw new Error('controlled live rate read')
      },
    },
  })
assert.equal(
  gcpRuntime.schemaVersion,
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_RUNTIME_VERSION,
)
assert.equal(liveRateCalls, 0)

console.log(JSON.stringify({
  qualificationRuntimeVersion: runtime.schemaVersion,
  orderedCompositionMounted: true,
  packagePersistCalls,
  stageCalls,
  batchCalls,
  resultOwnerCalls,
  terminalOwnerCalls,
  gcpConstructionNetworkCalls: liveRateCalls,
  missingFoundationRejectedBeforeBatch: true,
  missingTerminalLifecycleRejectedBeforeResultRead: true,
  callerCloudCoordinateAccepted: false,
  developerMachineModelInstallPerformed: false,
  sourceCheckpointQualificationGranted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryObjectPort(): {
  readonly records: Map<string, Buffer>
  readonly port: CanonicalCreateOnlyJsonObjectPort
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const existing = records.get(input.objectPath)
        if (existing) {
          if (digest(existing) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const value = records.get(objectPath)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
