import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'

import {
  createVisualIntelligenceGcsProviderTrafficGuard,
  parseVisualIntelligenceProviderTrafficGuardLease,
  parseVisualIntelligenceProviderTrafficGuardReleaseReceipt,
  visualIntelligenceProviderTrafficGuardReleaseReceiptRef,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'

let now = new Date('2026-08-08T10:00:00.000Z')
const storage = createMemoryStorage()
const guard = createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  storage: storage as unknown as Storage,
  now: () => new Date(now),
})

const ordinary = await guard.acquire({
  mode: 'ordinary_visual_intelligence_request',
  ownerId: 'visual-intelligence-request-1',
  requestedLeaseTtlMs: 10 * 60 * 1_000,
})
assert.equal(ordinary.status, 'acquired')
assert.ok(ordinary.status === 'acquired')
assert.deepEqual(parseVisualIntelligenceProviderTrafficGuardLease(
  ordinary.lease,
), ordinary.lease)
assert.equal(ordinary.lease.mode, 'ordinary_visual_intelligence_request')
assert.equal(ordinary.lease.createOnlySingletonPreconditionUsed, true)
assert.equal(ordinary.lease.exactGenerationEtagAndCanonicalJsonReread, true)
assert.equal(ordinary.lease.providerCallMadeByGuard, false)
assert.equal(ordinary.lease.providerDispatchAuthorityGranted, false)

const qualificationBlocked = await guard.acquire({
  mode: 'model_billing_sku_qualification',
  ownerId: 'model-sku-qualification-blocked',
  requestedLeaseTtlMs: 60 * 60 * 1_000,
})
assert.deepEqual(qualificationBlocked, { status: 'occupied' })

now = new Date('2026-08-08T10:05:00.000Z')
const ordinaryRelease = await guard.release(ordinary.lease)
assert.deepEqual(
  parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(ordinaryRelease),
  ordinaryRelease,
)
assert.deepEqual(
  visualIntelligenceProviderTrafficGuardReleaseReceiptRef(ordinaryRelease),
  ordinaryRelease.releaseReceiptRef,
)
assert.equal(ordinaryRelease.guardHeldContinuouslyUntilRelease, true)
assert.equal(ordinaryRelease.singletonGuardBodyRereadBeforeRelease, true)
assert.equal(
  ordinaryRelease.singletonGuardDeletedWithExactGenerationPrecondition,
  true,
)
assert.equal(ordinaryRelease.immutableReleaseReceiptCreateOnlyPersisted, true)
assert.equal(ordinaryRelease.immutableReleaseReceiptExactReread, true)
assert.equal(ordinaryRelease.providerCallMadeByGuard, false)
assert.equal(ordinaryRelease.productionReleaseAuthorityGranted, false)
assert.deepEqual(
  await guard.readExactReleaseReceipt(ordinaryRelease.releaseReceiptRef),
  ordinaryRelease,
)
assert.equal(await guard.readExactReleaseReceipt({
  id: 'missing-release',
  version: 1,
  contentHash: `sha256:${'0'.repeat(64)}`,
}), null)

const qualification = await guard.acquire({
  mode: 'model_billing_sku_qualification',
  ownerId: 'model-sku-qualification-accepted',
  requestedLeaseTtlMs: 60 * 60 * 1_000,
})
assert.equal(qualification.status, 'acquired')
assert.ok(qualification.status === 'acquired')
assert.equal(qualification.lease.mode, 'model_billing_sku_qualification')

const ordinaryBlocked = await guard.acquire({
  mode: 'ordinary_visual_intelligence_request',
  ownerId: 'visual-intelligence-request-blocked',
  requestedLeaseTtlMs: 10 * 60 * 1_000,
})
assert.deepEqual(ordinaryBlocked, { status: 'occupied' })

now = new Date('2026-08-08T10:10:00.000Z')
const qualificationRelease = await guard.release(qualification.lease)
assert.equal(qualificationRelease.mode, 'model_billing_sku_qualification')
assert.equal(qualificationRelease.ownerId,
  'model-sku-qualification-accepted')

const tamperedLease = structuredClone(qualification.lease)
tamperedLease.ownerId = 'tampered-owner'
assert.throws(() =>
  parseVisualIntelligenceProviderTrafficGuardLease(tamperedLease), /invalid/u)

const tamperedRelease = structuredClone(qualificationRelease)
tamperedRelease.walletOrCreditMutationAuthorityGranted = true as false
assert.throws(() =>
  parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(tamperedRelease))

await assert.rejects(() => guard.acquire({
  mode: 'ordinary_visual_intelligence_request',
  ownerId: 'invalid-ttl-request',
  requestedLeaseTtlMs: 16 * 60 * 1_000,
}), /TTL is invalid/u)

const expiring = await guard.acquire({
  mode: 'ordinary_visual_intelligence_request',
  ownerId: 'expiring-request',
  requestedLeaseTtlMs: 60_000,
})
assert.ok(expiring.status === 'acquired')
now = new Date('2026-08-08T10:12:00.000Z')
await assert.rejects(() => guard.release(expiring.lease), /lease expired/u)

const reclaimed = await guard.acquire({
  mode: 'model_billing_sku_qualification',
  ownerId: 'reclaimed-after-expiry',
  requestedLeaseTtlMs: 60 * 60 * 1_000,
})
assert.equal(reclaimed.status, 'acquired')
assert.ok(reclaimed.status === 'acquired')
assert.notEqual(reclaimed.lease.generation, expiring.lease.generation)

storage.tamperGuardBody()
now = new Date('2026-08-08T10:13:00.000Z')
await assert.rejects(() => guard.release(reclaimed.lease),
  /record is not JSON|changed before release/u)

assert.throws(() => createVisualIntelligenceGcsProviderTrafficGuard({
  projectId: 'reeditpro',
  bucketName: 'INVALID_BUCKET',
}))

console.log(JSON.stringify({
  smoke: 'visual-intelligence-provider-traffic-guard',
  checks: 34,
  status: 'passed',
  ordinaryBlocksQualification: true,
  qualificationBlocksOrdinary: true,
  expiredLeaseReclaimed: true,
  releaseReceiptCreateOnlyPersisted: true,
  providerCalled: false,
  productionReady: false,
}))

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function createMemoryStorage() {
  const objects = new Map<string, StoredObject>()
  let nextGeneration = 1
  const guardObject =
    'private/visual-intelligence/qualifications/gemini-billing-sku/v1/provider-traffic-guard.json'
  const requireObject = (name: string): StoredObject => {
    const stored = objects.get(name)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    bucket() {
      return {
        file: (name: string, options?: { generation?: string }) => ({
          save: async (body: Buffer, saveOptions: {
            contentType: string
            preconditionOpts: { ifGenerationMatch: number }
          }) => {
            assert.equal(saveOptions.preconditionOpts.ifGenerationMatch, 0)
            if (objects.has(name)) {
              throw Object.assign(new Error('Precondition failed.'), {
                code: 412,
              })
            }
            const generation = String(nextGeneration++)
            objects.set(name, {
              body: Buffer.from(body),
              generation,
              etag: `etag-${generation}`,
              contentType: saveOptions.contentType,
            })
          },
          getMetadata: async () => {
            const stored = requireObject(name)
            if (options?.generation
              && options.generation !== stored.generation) {
              throw Object.assign(new Error('Generation not found.'), {
                code: 404,
              })
            }
            return [{
              generation: stored.generation,
              etag: stored.etag,
              contentType: stored.contentType,
              size: String(stored.body.byteLength),
            }]
          },
          download: async () => {
            const stored = requireObject(name)
            if (options?.generation
              && options.generation !== stored.generation) {
              throw Object.assign(new Error('Generation not found.'), {
                code: 404,
              })
            }
            return [Buffer.from(stored.body)]
          },
          delete: async (deleteOptions: { ifGenerationMatch: string }) => {
            const stored = requireObject(name)
            if (deleteOptions.ifGenerationMatch !== stored.generation) {
              throw Object.assign(new Error('Precondition failed.'), {
                code: 412,
              })
            }
            objects.delete(name)
          },
        }),
      }
    },
    tamperGuardBody() {
      const stored = requireObject(guardObject)
      const body = Buffer.from(stored.body)
      body[body.byteLength - 2] = body[body.byteLength - 2] === 97 ? 98 : 97
      objects.set(guardObject, { ...stored, body })
    },
  }
}
