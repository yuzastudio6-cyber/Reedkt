import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createControlledVisualIntelligenceProviderTrafficIsolationAuthority,
  visualIntelligenceProviderTrafficIsolationAuthorityRef,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository,
} from '../visual-intelligence/visual-intelligence-provider-traffic-isolation-authority-repository'

const storage = memoryStorage()
const repository =
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: storage.api as unknown as Storage,
  })
const authority = fixtureAuthority()
const expectedRef =
  visualIntelligenceProviderTrafficIsolationAuthorityRef(authority)
const first = await repository.persistCreateOnly(authority)

assert.deepEqual(first.authorityRef, expectedRef)
assert.equal(first.createOnlyPersisted, true)
assert.equal(first.exactRereadVerified, true)
assert.match(first.persistenceReceiptRef.contentHash,
  /^sha256:[a-f0-9]{64}$/u)
assert.deepEqual(await repository.readExact(expectedRef), authority)
assert.equal(storage.createOnlySaveCount(), 1)

const replay = await repository.persistCreateOnly(authority)
assert.deepEqual(replay.authorityRef, expectedRef)
assert.equal(replay.createOnlyPersisted, true)
assert.equal(replay.exactRereadVerified, true)
assert.deepEqual(replay.persistenceReceiptRef, first.persistenceReceiptRef)
assert.equal(storage.createOnlySaveCount(), 2)
assert.deepEqual(await repository.readExact(expectedRef), authority)

assert.equal(await repository.readExact(ref('missing-authority')), null)

const tamperedRef = structuredClone(expectedRef)
tamperedRef.id = 'wrong-authority-id'
await assert.rejects(() => repository.readExact(tamperedRef), /changed/u)

storage.tamperBySuffix(expectedRef.contentHash.slice(7), (body) => {
  const parsed = JSON.parse(body.toString('utf8')) as Record<string, unknown>
  parsed.observedProviderRequestCount = 5
  return Buffer.from(JSON.stringify(parsed), 'utf8')
})
await assert.rejects(() => repository.readExact(expectedRef))

const conflictStorage = memoryStorage()
const conflictRepository =
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: conflictStorage.api as unknown as Storage,
  })
await conflictRepository.persistCreateOnly(authority)
conflictStorage.tamperBySuffix(expectedRef.contentHash.slice(7), () =>
  Buffer.from('{"conflict":true}', 'utf8'))
await assert.rejects(() => conflictRepository.persistCreateOnly(authority),
  /metadata is invalid|not JSON|exact reread failed/u)

assert.throws(() =>
  createVisualIntelligenceProviderTrafficIsolationAuthorityRepository({
    projectId: 'reeditpro',
    bucketName: '../unsafe',
  }), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-provider-traffic-isolation-authority-repository',
  checks: 20,
  status: 'passed',
  createOnlyPersistence: true,
  exactGenerationReread: true,
  providerCallMadeByRepository: false,
  productionReady: false,
}))

function fixtureAuthority() {
  return createControlledVisualIntelligenceProviderTrafficIsolationAuthority({
    schemaVersion:
      'visual-intelligence-provider-traffic-isolation-authority-v1',
    authorityId: 'vi-provider-isolation-authority-repository-fixture',
    authorityVersion: 1,
    evidenceClass:
      'exclusive_provider_guard_plus_exact_cloud_audit_window_reread',
    projectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    exactModelId: 'gemini-3.1-pro-preview',
    vertexLocation: 'global',
    throughputClass: 'standard',
    qualificationWindowStartedAtIso: '2026-08-08T10:00:00.000Z',
    qualificationWindowFinishedAtIso: '2026-08-08T10:10:00.000Z',
    standardContextEvidenceRef: ref('standard-context'),
    longContextEvidenceRef: ref('long-context'),
    exactOrderedProviderRequestRefs: [
      ref('standard-warmup-request'),
      ref('standard-measured-request'),
      ref('long-warmup-request'),
      ref('long-measured-request'),
    ],
    providerGuardLeaseRef: ref('guard-lease'),
    providerGuardReleaseReceiptRef: ref('guard-release'),
    cloudAuditWindowObservationRef: ref('audit-window'),
    canonicalProviderRouteRegistryRef: ref('provider-route-registry'),
    observedProviderRequestCount: 4,
    guardHeldForWholeQualificationWindow: true,
    allCanonicalVisualIntelligenceProviderRoutesRequireGuard: true,
    nonCanonicalDirectProviderRouteAllowedByServiceAccount: false,
    exactCloudAuditWindowReread: true,
    sameSkuConcurrentTrafficObserved: false,
    noOtherModelOrSkuTrafficInObservationWindow: true,
    callerAuthoredIsolationClaimAccepted: false,
    providerCallMadeByAuthorityReader: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function memoryStorage() {
  const objects = new Map<string, StoredObject>()
  let saves = 0
  const requireObject = (name: string) => {
    const stored = objects.get(name)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    api: {
      bucket() {
        return {
          file(name: string, options?: { generation?: string }) {
            return {
              async save(body: Buffer, saveOptions: {
                contentType: string
                preconditionOpts: { ifGenerationMatch: number }
              }) {
                saves += 1
                if (saveOptions.preconditionOpts.ifGenerationMatch !== 0) {
                  throw new Error('Expected create-only persistence.')
                }
                if (objects.has(name)) {
                  throw Object.assign(new Error('Exists.'), { code: 412 })
                }
                objects.set(name, {
                  body: Buffer.from(body),
                  generation: '1',
                  etag: 'etag-authority-1',
                  contentType: saveOptions.contentType,
                })
              },
              async getMetadata() {
                const stored = requireObject(name)
                if (options?.generation
                  && options.generation !== stored.generation) {
                  throw Object.assign(new Error('Not found.'), { code: 404 })
                }
                return [{
                  generation: stored.generation,
                  etag: stored.etag,
                  contentType: stored.contentType,
                  size: String(stored.body.byteLength),
                }]
              },
              async download() {
                const stored = requireObject(name)
                if (options?.generation
                  && options.generation !== stored.generation) {
                  throw Object.assign(new Error('Not found.'), { code: 404 })
                }
                return [Buffer.from(stored.body)]
              },
            }
          },
        }
      },
    },
    createOnlySaveCount: () => saves,
    tamperBySuffix(suffix: string, mutate: (body: Buffer) => Buffer) {
      const match = [...objects.entries()].find(([name]) =>
        name.endsWith(`${suffix}.json`))
      assert.ok(match)
      match[1].body = mutate(Buffer.from(match[1].body))
    },
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}
