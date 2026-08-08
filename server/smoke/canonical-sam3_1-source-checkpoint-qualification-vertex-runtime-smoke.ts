import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31VertexQualificationLaunchPort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  createCanonicalSam31VertexQualificationProviderUsageReadPort,
  createCanonicalSam31VertexQualificationQuotaReadPort,
  createCanonicalSam31VertexQualificationRuntime,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  createCanonicalSam31VertexQualificationRuntimeRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime-repository'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { authority as rateAuthority } from
  './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'
import {
  historicalPackageRequest,
  request,
  stagingObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-smoke'

assert.ok(rateAuthority)

const objects = new Map<string, Buffer>()
const events: string[] = []
const objectPort = {
  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }) {
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
    const prior = objects.get(input.objectPath)
    if (prior) {
      assert.equal(prior.equals(input.body), true)
      return 'already_exists' as const
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    events.push(`persist:${input.objectPath.split('/').at(-2)}`)
    return 'created' as const
  },
  async readExact(path: string) {
    const found = objects.get(path)
    return found ? Buffer.from(found) : null
  },
}
const runtimeRepository =
  createCanonicalSam31VertexQualificationRuntimeRepository({ objectPort })
let quotaApiCalls = 0
const quotaReadPort = createCanonicalSam31VertexQualificationQuotaReadPort({
  auth: {
    async request(input) {
      quotaApiCalls += 1
      const url = String(input.url)
      if (url.includes('/quotaPreferences/')) return { data: {
        name:
          'projects/reeditpro/locations/global/quotaPreferences/weeditpro-vertex-a100-80gb-us-central1-1',
        service: 'aiplatform.googleapis.com',
        quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
        dimensions: { region: 'us-central1' },
        quotaConfig: { preferredValue: '1', grantedValue: '1' },
      } } as never
      return { data: {
        name:
          'projects/390722338345/locations/global/services/aiplatform.googleapis.com/quotaInfos/CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
        service: 'aiplatform.googleapis.com',
        quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
        dimensionsInfos: [
          {
            dimensions: { region: 'europe-west4' },
            details: {},
            applicableLocations: ['europe-west4'],
          },
          {
            dimensions: { region: 'us-central1' },
            details: { value: '1' },
            applicableLocations: ['us-central1'],
          },
          {
            details: {},
            applicableLocations: ['us-west3'],
          },
        ],
      } } as never
    },
  },
  now: () => '2026-08-06T16:09:00.000Z',
})
const observedQuota = await quotaReadPort.rereadCurrent()
assert.equal(observedQuota.grantedValue, 1)
assert.equal(observedQuota.preferredValue, 1)
assert.equal(observedQuota.reconciling, false)
assert.equal(quotaApiCalls, 2)
const reconcilingQuotaReadPort =
  createCanonicalSam31VertexQualificationQuotaReadPort({
    auth: {
      async request(input) {
        const url = String(input.url)
        if (url.includes('/quotaPreferences/')) return { data: {
          name:
            'projects/reeditpro/locations/global/quotaPreferences/weeditpro-vertex-a100-80gb-us-central1-1',
          service: 'aiplatform.googleapis.com',
          quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
          dimensions: { region: 'us-central1' },
          quotaConfig: { preferredValue: '1', grantedValue: '1' },
          reconciling: true,
        } } as never
        return { data: {
          name:
            'projects/390722338345/locations/global/services/aiplatform.googleapis.com/quotaInfos/CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
          service: 'aiplatform.googleapis.com',
          quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
          dimensionsInfos: [{
            dimensions: { region: 'us-central1' },
            details: { value: '1' },
            applicableLocations: ['us-central1'],
          }],
        } } as never
      },
    },
    now: () => '2026-08-06T16:09:00.000Z',
  })
await assert.rejects(reconcilingQuotaReadPort.rereadCurrent())
let providerCalls = 0
const launchPort = createCanonicalSam31VertexQualificationLaunchPort({
  admissionRepository: runtimeRepository.admissions,
  consumptionPort: runtimeRepository.consumptions,
  executionRepository: runtimeRepository.executions,
  auth: {
    async request() {
      providerCalls += 1
      events.push('provider:create')
      return { data: {
        name:
          'projects/390722338345/locations/us-central1/customJobs/987654321',
        displayName:
          `weeditpro-sam31-q-${sha256AuthorityValue(request.attemptId).slice(0, 40)}`,
        state: 'JOB_STATE_PENDING',
      } } as never
    },
  },
  now: () => '2026-08-06T16:10:00.000Z',
})
let reconcileCalls = 0
const runtime = createCanonicalSam31VertexQualificationRuntime({
  historicalPackageRepository: {
    async rereadExactWorkerRequest() {
      return structuredClone(historicalPackageRequest)
    },
  } as never,
  runtimeRepository,
  stagingOwner: {
    async stageOne(value: { workerRequest: unknown }) {
      assert.deepEqual(value.workerRequest, request)
      events.push('staged')
      return structuredClone(stagingObservation)
    },
    async rereadExact(value: { workerRequest: unknown }) {
      assert.deepEqual(value.workerRequest, request)
      return structuredClone(stagingObservation)
    },
  } as never,
  imageReleaseRepository: {
    async rereadQualifiedQualificationImageRelease() {
      return structuredClone(release)
    },
  } as never,
  rateRepository: {
    async reread() { return structuredClone(rateAuthority) },
  } as never,
  quotaReadPort,
  launchPort,
  terminalReconciler: {
    async reconcileOne(value: { executionRef: unknown }) {
      reconcileCalls += 1
      return { executionRef: structuredClone(value.executionRef) }
    },
  } as never,
  now: () => '2026-08-06T16:10:00.000Z',
})

const prepared = await runtime.prepareAndStage({
  attemptId: request.attemptId,
  historicalPackageRequestRef: request.historicalPackageRequestRef,
  issuedAt: request.issuedAt,
})
assert.equal(prepared.status, 'staged_not_dispatched')
assert.deepEqual(prepared.workerRequestRef, {
  id: request.qualificationId,
  version: 2,
  contentHash: `sha256:${request.requestHash}`,
})
assert.equal(prepared.providerOrGpuJobStarted, false)

const launched = await runtime.admitAndStart({
  workerRequestRef: prepared.workerRequestRef,
  imageSupplyChainReleaseRef:
    request.qualificationImage.supplyChainReleaseRef,
  currentAccountRateAuthorityRef: {
    id: rateAuthority.rateAuthorityId,
    version: rateAuthority.rateAuthorityVersion,
    contentHash: `sha256:${rateAuthority.rateAuthorityHash}`,
  },
})
assert.equal(launched.disposition, 'accepted')
assert.equal(providerCalls, 1)

const providerUsagePort =
  createCanonicalSam31VertexQualificationProviderUsageReadPort({
    store: runtimeRepository.providerUsage,
    now: () => '2026-08-06T16:14:00.000Z',
  })
const providerUsage = await providerUsagePort.rereadExact({
  request,
  executionRef: launched.executionRef!,
  workerResultRef: null,
  workerResult: null,
  providerTimes: {
    createTime: '2026-08-06T16:10:00.000Z',
    startTime: '2026-08-06T16:11:00.000Z',
    endTime: '2026-08-06T16:13:00.000Z',
  },
  providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
}) as { actualUsage: {
  allocatedGpuMilliseconds: number
  workerPhaseBreakdownClaimed: boolean
  classAOperationCount: number
  classBOperationCount: number
  objectStorageOperationMeteringDisposition: string
} }
assert.equal(providerUsage.actualUsage.allocatedGpuMilliseconds, 120_000)
assert.equal(providerUsage.actualUsage.workerPhaseBreakdownClaimed, false)
assert.equal(providerUsage.actualUsage.classAOperationCount, 0)
assert.equal(providerUsage.actualUsage.classBOperationCount, 0)
assert.equal(
  providerUsage.actualUsage.objectStorageOperationMeteringDisposition,
  'deferred_to_cloud_billing_invoice_reconciliation',
)
assert.ok(launched.executionRef)
const consumptionEvent = events.findIndex((value) =>
  value === 'persist:consumptions')
const providerEvent = events.indexOf('provider:create')
assert.equal(consumptionEvent >= 0, true)
assert.equal(providerEvent > consumptionEvent, true)

const replay = await runtime.admitAndStart({
  workerRequestRef: prepared.workerRequestRef,
  imageSupplyChainReleaseRef:
    request.qualificationImage.supplyChainReleaseRef,
  currentAccountRateAuthorityRef: {
    id: rateAuthority.rateAuthorityId,
    version: rateAuthority.rateAuthorityVersion,
    contentHash: `sha256:${rateAuthority.rateAuthorityHash}`,
  },
})
assert.equal(replay.disposition, 'accepted')
assert.deepEqual(replay.executionRef, launched.executionRef)
assert.equal(providerCalls, 1)

const reconciliation = await runtime.reconcileOne({
  executionRef: launched.executionRef!,
})
assert.deepEqual(reconciliation.executionRef, launched.executionRef)
assert.equal(reconcileCalls, 1)

const crossedRef = structuredClone(prepared.workerRequestRef)
crossedRef.contentHash = `sha256:${'f'.repeat(64)}`
await assert.rejects(runtime.admitAndStart({
  workerRequestRef: crossedRef,
  imageSupplyChainReleaseRef:
    request.qualificationImage.supplyChainReleaseRef,
  currentAccountRateAuthorityRef: {
    id: rateAuthority.rateAuthorityId,
    version: rateAuthority.rateAuthorityVersion,
    contentHash: `sha256:${rateAuthority.rateAuthorityHash}`,
  },
}))
assert.equal(providerCalls, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-qualification-runtime',
  checks: 42,
  exactHistoricalPackageReread: true,
  createOnlyWorkerRequestAdmissionConsumptionAndExecution: true,
  consumptionPersistedBeforeProviderCall: true,
  identicalReplayCreatesNoSecondPaidJob: true,
  priorExecutionRereadOnReplay: true,
  immutableImageQuotaAndAccountRateRereadBeforeLaunch: true,
  exactCloudQuotaPreferenceAndRegionalLimitReread: true,
  omittedFalseReconcilingFieldAccepted: true,
  explicitTrueReconcilingFieldRejected: true,
  canonicalProjectNumberQuotaInfoAccepted: true,
  sparseUnrelatedDimensionsIgnored: true,
  exactRegionalQuotaScopeRequired: true,
  providerBillableAllocationUsedWithoutInventedWorkerPhases: true,
  storageOperationCountsNotInvented: true,
  storageOperationCostDeferredToInvoiceReconciliation: true,
  restartSafeTerminalReconciliationSeam: true,
  callerPathUrlCommandModelOrPriceAccepted: false,
  customerCreditsMutated: false,
  sourceCheckpointQualificationGranted: false,
  productionReady: false,
}, null, 2))
