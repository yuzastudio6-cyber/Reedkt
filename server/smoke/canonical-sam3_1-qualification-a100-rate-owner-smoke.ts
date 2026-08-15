import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalSam31QualificationA100RateOwner,
} from '../services/canonical-sam3_1-qualification-a100-rate-owner'
import { a100 } from
  './canonical-professional-tool-gpu-cost-authority-smoke'

const observedAt = '2026-08-02T16:00:01.000Z'
const objects = new Map<string, Buffer>()
let liveReadCount = 0
const repository = createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/sam31/a100-qualification-rates/v1',
})
const owner = createCanonicalSam31QualificationA100RateOwner({
  liveRateReadPort: {
    async readCurrentRouteRate(input) {
      liveReadCount += 1
      assert.deepEqual(input, {
        routeId: 'a100_80gb_heavy_primary',
        region: 'us-central1',
        currency: 'USD',
      })
      return rawObservation()
    },
  },
  repository,
})

const current = await owner.rereadCurrentAccountEffectiveA100Rate({
  routeId: 'a100_80gb_heavy_primary',
  region: 'us-central1',
  at: observedAt,
}) as typeof a100
assert.equal(current.rateAuthorityId,
  'sam31-source-checkpoint-qualification-a100-current-rate')
assert.equal(current.routeId, 'a100_80gb_heavy_primary')
assert.equal(current.accelerator, 'nvidia_a100_80gb')
assert.equal(current.machineType, 'a2-ultragpu-1g')
assert.equal(current.pricingModel,
  'bundled_accelerator_optimized_machine')
assert.equal(current.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(current.walletOrCreditMutationAuthorityGranted, false)
assert.equal(current.actualAttemptCostStillRequiresPlatformUsageAndBillingReread,
  true)
assert.equal(liveReadCount, 1)
assert.equal(objects.size, 1)

const rateAuthorityRef = {
  id: current.rateAuthorityId,
  version: current.rateAuthorityVersion,
  contentHash: `sha256:${current.rateAuthorityHash}` as const,
}
const exact = await owner.rereadExactApprovedRate({
  rateAuthorityRef,
  at: '2026-08-02T16:10:00.000Z',
}) as typeof a100
assert.deepEqual(exact, current)
assert.notEqual(exact, current)
assert.equal(liveReadCount, 1)

const replay = await owner.rereadCurrentAccountEffectiveA100Rate({
  routeId: 'a100_80gb_heavy_primary',
  region: 'us-central1',
  at: observedAt,
})
assert.deepEqual(replay, current)
assert.equal(liveReadCount, 2)
assert.equal(objects.size, 1)

await assert.rejects(owner.rereadCurrentAccountEffectiveA100Rate({
  routeId: 'l4_heavy_fallback' as never,
  region: 'us-central1',
  at: observedAt,
}))
await assert.rejects(owner.rereadExactApprovedRate({
  rateAuthorityRef: {
    ...rateAuthorityRef,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
  at: '2026-08-02T16:10:00.000Z',
}))
await assert.rejects(owner.rereadExactApprovedRate({
  rateAuthorityRef,
  at: current.expiresAt,
}))

const tamperedOwner = createCanonicalSam31QualificationA100RateOwner({
  liveRateReadPort: {
    async readCurrentRouteRate() {
      return { ...rawObservation(), pricingReadDigestSha256: 'f'.repeat(64) }
    },
  },
  repository: createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/sam31/a100-tampered-rates/v1',
  }),
})
await assert.rejects(tamperedOwner.rereadCurrentAccountEffectiveA100Rate({
  routeId: 'a100_80gb_heavy_primary',
  region: 'us-central1',
  at: observedAt,
}))

const source = readFileSync(new URL(
  '../services/canonical-sam3_1-qualification-a100-rate-owner.ts',
  import.meta.url,
), 'utf8')
assert.match(source, /billing_api_observation_create_only_repository_exact_reread/u)
assert.match(source, /persistCurrentRateAuthorityCreateOnly/u)
assert.match(source, /rereadExactApprovedRate/u)
assert.doesNotMatch(source, /serviceFee|walletMutation|customerCreditPrice/u)
assert.doesNotMatch(source, /batchTransport|gpuJob|providerCall/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-a100-rate-owner',
  checks: 31,
  liveBillingApiObservationCount: liveReadCount,
  immutableRateRecords: objects.size,
  accountEffectiveA100RatePersistedAndReread: true,
  terminalCostUsesExactAdmissionRateRef: true,
  actualUsageAndBillingRereadStillRequired: true,
  serviceFeeIncluded: false,
  customerCreditsMutated: false,
  gpuJobStarted: false,
  productionReady: false,
}))

function rawObservation() {
  return {
    sourceClass: a100.sourceClass,
    billingAccountPricingScopeRef: a100.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: a100.pricingReaderConfigurationRef,
    routeId: a100.routeId,
    region: a100.region,
    currency: a100.currency,
    components: a100.components,
    priceRecordSetRef: a100.priceRecordSetRef,
    pricingReadStartedAt: a100.pricingReadStartedAt,
    pricingReadFinishedAt: a100.pricingReadFinishedAt,
    pricingReadDigestSha256: a100.pricingReadDigestSha256,
  }
}

function memoryObjectPort(
  records: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const prior = records.get(input.objectPath)
      if (prior) {
        if (digest(prior) !== input.contentSha256) {
          throw new Error('controlled rate create-only collision')
        }
        return 'already_exists'
      }
      assert.equal(digest(input.body), input.contentSha256)
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = records.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
