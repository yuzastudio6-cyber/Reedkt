import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingSkuQualificationRepository,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification-repository'
import {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  createVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const memory = memoryStorage()
const repository =
  createVisualIntelligenceModelBillingSkuQualificationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: memory.api as unknown as Storage,
  })
const qualification = fixtureQualification()
const expectedRef =
  visualIntelligenceModelBillingSkuQualificationRef(qualification)
const first = await repository.persistCreateOnly(qualification)

assert.deepEqual(first.qualificationRef, expectedRef)
assert.equal(first.createOnlyPersisted, true)
assert.equal(first.exactRereadVerified, true)
assert.match(first.persistenceReceiptRef.contentHash,
  /^sha256:[a-f0-9]{64}$/u)
assert.deepEqual(await repository.readExact(expectedRef), qualification)
assert.equal(memory.saveCount(), 1)

const replay = await repository.persistCreateOnly(qualification)
assert.deepEqual(replay.qualificationRef, expectedRef)
assert.deepEqual(replay.persistenceReceiptRef, first.persistenceReceiptRef)
assert.equal(memory.saveCount(), 2)
assert.deepEqual(await repository.readExact(expectedRef), qualification)

const restarted =
  createVisualIntelligenceModelBillingSkuQualificationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: memory.api as unknown as Storage,
  })
assert.deepEqual(await restarted.readExact(expectedRef), qualification)
assert.equal(await restarted.readExact(ref('missing-qualification')), null)

const crossedRef = structuredClone(expectedRef)
crossedRef.id = 'crossed-qualification'
await assert.rejects(() => restarted.readExact(crossedRef), /changed/u)

memory.tamperBySuffix(expectedRef.contentHash.slice(7), (body) => {
  const parsed = JSON.parse(body.toString('utf8')) as Record<string, unknown>
  parsed.productionReleaseAuthorityGranted = true
  return Buffer.from(JSON.stringify(parsed), 'utf8')
})
await assert.rejects(() => restarted.readExact(expectedRef))
await assert.rejects(() => restarted.persistCreateOnly(qualification),
  /metadata is invalid|exact reread failed/u)

assert.throws(() =>
  createVisualIntelligenceModelBillingSkuQualificationRepository({
    projectId: 'reeditpro',
    bucketName: '../unsafe',
  }), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-qualification-repository',
  checks: 20,
  status: 'passed',
  createOnlyPersistence: true,
  restartRereadVerified: true,
  exactQualificationIdentity: true,
  providerCallMadeByRepository: false,
  billingExportQueriedByRepository: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function fixtureQualification() {
  return createVisualIntelligenceModelBillingSkuQualification({
    schemaVersion: 'visual-intelligence-model-billing-sku-qualification-v1',
    evidenceClass:
      'live_isolated_vertex_usage_and_billing_export_reconciliation',
    qualificationId: 'vi-model-sku-qualified-fixture',
    qualificationVersion: 1,
    exactModelId: 'gemini-3.1-pro-preview',
    vertexLocation: 'global',
    throughputClass: 'standard',
    providerServiceId: 'services/C7E2-9256-1C43',
    billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
    billingSkuCatalogVersion:
      'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1',
    contextThresholdInputTokens: 200_000,
    wholeRequestLongContextRatesRequired: true,
    qualifiedRateClasses: [
      ...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
    ],
    exactSkuIds:
      WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map((term) =>
        term.skuId),
    standardContextProviderRequestRef: ref('standard-request-set'),
    longContextProviderRequestRef: ref('long-request-set'),
    standardContextProviderUsageRef: ref('standard-usage-set'),
    longContextProviderUsageRef: ref('long-usage-set'),
    detailedBillingExportRef: ref('detailed-billing-export'),
    billingSkuMetadataSetRef: ref('billing-sku-metadata'),
    isolatedUsageReconciliationReportRef: ref('usage-reconciliation'),
    qualificationWindowStartedAtIso: '2026-08-08T10:00:00.000Z',
    qualificationWindowFinishedAtIso: '2026-08-08T10:10:00.000Z',
    billingExportFreshThroughIso: '2026-08-08T11:00:00.000Z',
    liveGeminiStandardContextRequestExecuted: true,
    liveGeminiLongContextRequestExecuted: true,
    exactReturnedModelIdVerified: true,
    exactProviderUsageMetadataReread: true,
    isolatedBillingWindowVerified: true,
    noOtherModelOrSkuTrafficInObservationWindow: true,
    detailedBillingExportExactReread: true,
    exactStandardAndLongSkuMappingVerified: true,
    publicListPriceUsed: false,
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
  const requireObject = (name: string, generation?: string) => {
    const stored = objects.get(name)
    if (!stored || generation && generation !== stored.generation) {
      throw Object.assign(new Error('Not found.'), { code: 404 })
    }
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
                  throw new Error('Expected create-only write.')
                }
                if (objects.has(name)) throw Object.assign(
                  new Error('Exists.'), { code: 412 },
                )
                objects.set(name, {
                  body: Buffer.from(body),
                  generation: '1',
                  etag: 'etag-qualification-1',
                  contentType: saveOptions.contentType,
                })
              },
              async getMetadata() {
                const stored = requireObject(name, options?.generation)
                return [{
                  generation: stored.generation,
                  etag: stored.etag,
                  contentType: stored.contentType,
                  size: String(stored.body.byteLength),
                }]
              },
              async download() {
                return [Buffer.from(requireObject(
                  name, options?.generation,
                ).body)]
              },
            }
          },
        }
      },
    },
    saveCount: () => saves,
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
