import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
  createCanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository,
  observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-quota-authority'

const OBSERVED_AT = '2026-08-12T05:30:00.000Z'
let requests = 0
const authority =
  await observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority({
    quotaAuthorityId: 'vertex-a100-serving-quota:smoke-v1',
    quotaAuthorityVersion: 1,
    now: () => new Date(OBSERVED_AT),
    auth: {
      async request(input) {
        requests += 1
        assert.match(input.url, /serviceusage\.googleapis\.com\/v1beta1/u)
        assert.equal(input.params.view, 'FULL')
        assert.equal(input.retry, false)
        return { data: quotaResponse() }
      },
    },
  })

assert.equal(requests, 1)
assert.equal(authority.effectiveLimit, 1)
assert.equal(authority.region, 'us-central1')
assert.equal(authority.servingCapacityGranted, true)
assert.equal(authority.endpointOrGpuJobStarted, false)
assert.equal(authority.walletOrCreditMutationAuthorityGranted, false)
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
    authority,
    '2026-08-12T05:59:59.999Z',
  ),
  authority,
)
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
    authority,
    authority.expiresAt,
  ))
const tampered = structuredClone(authority)
tampered.effectiveLimit = 0 as 1
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(tampered))

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/vertex-a100-serving-quota/v1',
  })
const receipt = await repository.persistCreateOnly({ authority })
const reread = await repository.reread({
  quotaAuthorityRef: receipt.quotaAuthorityRef,
  at: '2026-08-12T05:45:00.000Z',
})
assert.deepEqual(reread, authority)
assert.equal(objects.size, 1)

await assert.rejects(() =>
  observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority({
    quotaAuthorityId: 'vertex-a100-serving-quota:wrong-limit',
    quotaAuthorityVersion: 1,
    auth: {
      async request() {
        const response = quotaResponse()
        response.consumerQuotaLimits[0].quotaBuckets[0].effectiveLimit = '0'
        return { data: response }
      },
    },
  }))
await assert.rejects(() =>
  observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority({
    quotaAuthorityId: 'vertex-a100-serving-quota:wrong-region',
    quotaAuthorityVersion: 1,
    auth: {
      async request() {
        const response = quotaResponse()
        response.consumerQuotaLimits[0].quotaBuckets[0].dimensions.region =
          'us-east1'
        return { data: response }
      },
    },
  }))

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-vertex-a100-serving-quota-authority',
  checks: 18,
  exactLiveServingMetricAndRegionalBucketRequired: true,
  effectiveA10080GbServingLimit: authority.effectiveLimit,
  callerQuotaSelectionEndpointGpuCreditAndProductionAuthority: false,
}))

function quotaResponse() {
  return {
    metric:
      'aiplatform.googleapis.com/custom_model_serving_nvidia_a100_80gb_gpus' as const,
    displayName: 'Custom model serving Nvidia A100 80GB GPUs' as const,
    consumerQuotaLimits: [{
      unit: '1/{project}/{region}',
      isPrecise: true,
      quotaBuckets: [{
        effectiveLimit: '1',
        producerOverride: {
          overrideValue: '1', dimensions: { region: 'us-central1' },
        },
        consumerOverride: {
          overrideValue: '-1', dimensions: { region: 'us-central1' },
        },
        dimensions: { region: 'us-central1' },
      }],
    }],
  }
}

function memoryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body }) {
      const existing = objects.get(objectPath)
      if (existing && !existing.equals(body)) throw new Error('conflict')
      if (!existing) objects.set(objectPath, Buffer.from(body))
      return existing ? 'identical_replay' : 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
