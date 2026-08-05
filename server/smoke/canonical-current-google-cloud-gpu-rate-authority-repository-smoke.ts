import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  a100,
  l4Fallback,
} from './canonical-professional-tool-gpu-cost-authority-smoke'

const publishedAt = '2026-08-02T16:00:01.000Z'
const readAt = '2026-08-02T16:10:00.000Z'
const objects = new Map<string, Buffer>()
const repository =
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/canonical-gpu/account-effective-rates/v1',
  })

const primary = await repository.persistCurrentRateAuthorityCreateOnly({
  authority: a100,
  publishedAt,
})
const fallback = await repository.persistCurrentRateAuthorityCreateOnly({
  authority: l4Fallback,
  publishedAt,
})
assert.equal(primary.disposition, 'created')
assert.equal(fallback.disposition, 'created')
assert.equal(primary.providerOrGpuJobStarted, false)
assert.equal(primary.walletOrCreditMutationAuthorityGranted, false)
assert.equal((await repository.persistCurrentRateAuthorityCreateOnly({
  authority: a100,
  publishedAt,
})).disposition, 'identical_replay')
assert.equal(objects.size, 2)

const primaryRead = await repository.rereadApprovedCurrentRate({
  rateAuthorityRef: primary.rateAuthorityRef,
  routeId: 'a100_80gb_heavy_primary',
  at: readAt,
})
assert.deepEqual(primaryRead, a100)
assert.notEqual(primaryRead, a100)
const fallbackRead = await repository.rereadApprovedCurrentRate({
  rateAuthorityRef: fallback.rateAuthorityRef,
  routeId: 'l4_heavy_fallback',
  at: readAt,
})
assert.deepEqual(fallbackRead, l4Fallback)

await assert.rejects(repository.rereadApprovedCurrentRate({
  rateAuthorityRef: primary.rateAuthorityRef,
  routeId: 'l4_heavy_fallback',
  at: readAt,
}), /exact_scope_mismatch/u)
await assert.rejects(repository.rereadApprovedCurrentRate({
  rateAuthorityRef: primary.rateAuthorityRef,
  routeId: 'a100_80gb_heavy_primary',
  at: a100.expiresAt,
}), /invalid/u)
assert.equal(await repository.rereadApprovedCurrentRate({
  rateAuthorityRef: {
    id: 'missing-rate-authority',
    version: 1,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
  routeId: 'a100_80gb_heavy_primary',
  at: readAt,
}), null)

let getterInvoked = false
const hostile = Object.defineProperty(
  { authority: a100, publishedAt },
  'authority',
  {
    enumerable: true,
    get() {
      getterInvoked = true
      return a100
    },
  },
)
await assert.rejects(
  repository.persistCurrentRateAuthorityCreateOnly(hostile),
)
assert.equal(getterInvoked, false)

await assert.rejects(repository.persistCurrentRateAuthorityCreateOnly({
  authority: a100,
  publishedAt: '2026-08-02T16:00:02.000Z',
}), /collision/u)

const firstPath = [...objects.keys()][0]
const canonicalBytes = objects.get(firstPath)
assert.ok(canonicalBytes)
const tampered = JSON.parse(canonicalBytes.toString('utf8')) as
  Record<string, unknown>
tampered.productionAuthorityGranted = true
objects.set(firstPath, Buffer.from(JSON.stringify(tampered), 'utf8'))
await assert.rejects(repository.rereadApprovedCurrentRate({
  rateAuthorityRef: primary.rateAuthorityRef,
  routeId: 'a100_80gb_heavy_primary',
  at: readAt,
}))

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-gpu-rate-authority-repository',
  checks: 27,
  a100AndL4RateAuthoritiesPersistedCreateOnly: true,
  identicalReplayAccepted: true,
  exactReferenceRouteAndValidityWindowReread: true,
  crossRouteAndExpiredAuthorityRejected: true,
  hostileAccessorRejectedWithoutInvocation: true,
  createOnlyCollisionRejected: true,
  tamperedRecordRejected: true,
  accountEffectiveSkuRegionCurrencyTierAndPricePreserved: true,
  publicListPriceAccepted: false,
  callerPriceOrServiceFeeAccepted: false,
  providerOrGpuJobStarted: false,
  walletOrCustomerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
