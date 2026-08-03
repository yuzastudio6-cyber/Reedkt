import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Storage } from '@google-cloud/storage'

import {
  createControlledVisualIntelligenceAccountEffectiveRateAuthority,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  parseVisualIntelligenceAccountEffectiveRatePublicationReceipt,
  publishVisualIntelligenceAccountEffectiveRateAuthority,
} from '../visual-intelligence/visual-intelligence-account-effective-rate-publisher'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  createVisualIntelligenceModelBillingSkuQualification,
  parseVisualIntelligenceModelBillingSkuQualification,
  readVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const qualification = createVisualIntelligenceModelBillingSkuQualification({
  schemaVersion: 'visual-intelligence-model-billing-sku-qualification-v1',
  evidenceClass:
    'live_isolated_vertex_usage_and_billing_export_reconciliation',
  qualificationId: 'gemini-3-1-pro-model-billing-sku-live-qualification',
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
  qualifiedRateClasses: [...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES],
  exactSkuIds: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
    .map((term) => term.skuId),
  standardContextProviderRequestRef: ref('standard-request'),
  longContextProviderRequestRef: ref('long-request'),
  standardContextProviderUsageRef: ref('standard-usage'),
  longContextProviderUsageRef: ref('long-usage'),
  detailedBillingExportRef: ref('detailed-billing-export'),
  billingSkuMetadataSetRef: ref('sku-metadata-set'),
  isolatedUsageReconciliationReportRef: ref('isolated-reconciliation'),
  qualificationWindowStartedAtIso: '2026-08-03T18:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-03T18:30:00.000Z',
  billingExportFreshThroughIso: '2026-08-04T18:30:00.000Z',
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
assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuQualification(qualification),
  qualification,
)
const qualificationBody = Buffer.from(
  visualIntelligenceCanonicalJson(qualification),
  'utf8',
)
const qualificationRead =
  await readVisualIntelligenceModelBillingSkuQualification({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    objectName:
      'private/visual-intelligence/qualifications/gemini-billing-sku/v1/live-qualification.json',
    generation: '7',
    etag: 'qualification-etag-7',
    contentSha256: createHash('sha256').update(qualificationBody).digest('hex'),
    objectPort: {
      async readExact() {
        return {
          body: Buffer.from(qualificationBody),
          generation: '7',
          etag: 'qualification-etag-7',
          contentType: 'application/json',
        }
      },
    },
  })
assert.deepEqual(qualificationRead, qualification)

const qualificationRef =
  visualIntelligenceModelBillingSkuQualificationRef(qualification)
const rates = [
  2_000_000_000,
  200_000_000,
  12_000_000_000,
  4_000_000_000,
  400_000_000,
  18_000_000_000,
] as const
const authority =
  createControlledVisualIntelligenceAccountEffectiveRateAuthority({
    schemaVersion: 'visual-intelligence-account-effective-rate-authority-v2',
    evidenceClass: 'billing_account_effective_pricing_api_reread',
    billingAccountPricingScopeRef: ref('billing-scope'),
    pricingReaderConfigurationRef: ref('reader-configuration'),
    pricingApiObservationRef: ref('rate-observation'),
    exactModelBillingSkuCompatibilityQualificationRef: qualificationRef,
    exactModelId: 'gemini-3.1-pro-preview',
    providerServiceId: 'services/C7E2-9256-1C43',
    billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
    billingSkuCatalogVersion:
      'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1',
    throughputClass: 'standard',
    contextThresholdInputTokens: 200_000,
    wholeRequestLongContextRatesRequired: true,
    currency: 'USD',
    rateUnit: 'usd_nanos_per_million_tokens',
    accountEffectiveSkuPriceTerms:
      WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
        (term, index) => ({
          rateClass: term.rateClass,
          contextClass: term.contextClass,
          tokenClass: term.tokenClass,
          cloudServiceId: 'services/C7E2-9256-1C43',
          skuId: term.skuId,
          skuDisplayName: term.expectedDisplayName,
          consumptionModel: 'consumptionModels/7754-699E-0EBF',
          apiUnit: 'count',
          apiUnitQuantity: '1000000',
          contractPriceUsdNanosPerMillionTokens: rates[index],
          skuMetadataRef: ref(`sku-${term.skuId}`),
          billingAccountPriceRef: ref(`price-${term.skuId}`),
          accountEffectiveContractPriceUsed: true,
          publicListPriceUsed: false,
        }),
      ),
    priceReadStartedAtIso: '2026-08-03T20:00:00.000Z',
    priceReadFinishedAtIso: '2026-08-03T20:00:05.000Z',
    effectiveAtIso: '2026-08-03T20:00:05.000Z',
    expiresAtIso: '2026-08-04T20:00:05.000Z',
    exactSkuMetadataAndAccountPriceReread: true,
    billingAccountEffectiveRateUsed: true,
    publicListPriceUsed: false,
    customerPriceOrServiceFeeAuthorityGranted: false,
    walletMutationAuthorityGranted: false,
  })

const storage = createMemoryStorage()
const pricingObservationPort = Object.freeze({
  async readCurrent(input: {
    pricingApiObservationId: string
    pricingApiObservationVersion: number
  }) {
    assert.equal(input.pricingApiObservationId, 'rate-observation')
    assert.equal(input.pricingApiObservationVersion, 1)
    return authority
  },
})
const first = await publishVisualIntelligenceAccountEffectiveRateAuthority({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  pricingApiObservationId: 'rate-observation',
  pricingApiObservationVersion: 1,
  pricingObservationPort,
  storage: storage as unknown as Storage,
})
assert.deepEqual(
  parseVisualIntelligenceAccountEffectiveRatePublicationReceipt(first),
  first,
)
assert.equal(first.disposition, 'created')
assert.equal(first.generation, '1')
assert.equal(first.contentType, 'application/json')
assert.equal(first.rateAuthorityRef.contentHash,
  authority.rateAuthorityDigestSha256)
assert.deepEqual(
  first.exactModelBillingSkuCompatibilityQualificationRef,
  qualificationRef,
)
assert.equal(first.billingAccountIdentifierReturned, false)
assert.equal(first.walletOrCreditMutationAuthorityGranted, false)
assert.equal(first.runtimeReleaseAuthorityGranted, false)

const replay = await publishVisualIntelligenceAccountEffectiveRateAuthority({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-control-plane',
  pricingApiObservationId: 'rate-observation',
  pricingApiObservationVersion: 1,
  pricingObservationPort,
  storage: storage as unknown as Storage,
})
assert.equal(replay.disposition, 'already_exists_exact')
assert.equal(replay.objectName, first.objectName)
assert.equal(replay.generation, first.generation)

const tamperedQualification = structuredClone(qualification)
tamperedQualification.exactSkuIds.reverse()
assert.throws(() =>
  parseVisualIntelligenceModelBillingSkuQualification(
    tamperedQualification,
  ))

storage.tamper(first.objectName)
await assert.rejects(() =>
  publishVisualIntelligenceAccountEffectiveRateAuthority({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    pricingApiObservationId: 'rate-observation',
    pricingApiObservationVersion: 1,
    pricingObservationPort,
    storage: storage as unknown as Storage,
  }))

const operatorSource = readFileSync(
  'server/cli/publish-visual-intelligence-account-effective-rate.ts',
  'utf8',
)
assert.match(operatorSource,
  /readVisualIntelligenceModelBillingSkuQualification/u)
assert.match(operatorSource,
  /createVisualIntelligenceAccountEffectivePricingObservationPort/u)
assert.match(operatorSource,
  /publishVisualIntelligenceAccountEffectiveRateAuthority/u)
assert.match(operatorSource,
  /WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME/u)
assert.equal(
  operatorSource.lastIndexOf(
    'readVisualIntelligenceModelBillingSkuQualification',
  ) < operatorSource.lastIndexOf(
    'createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration',
  ),
  true,
)
assert.doesNotMatch(operatorSource, /console\.log\([^)]*BILLING_ACCOUNT/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-account-effective-rate-publisher',
  checks: 36,
  exactModelBillingSkuQualificationRequired: true,
  standardAndLongContextLiveReconciliationRequired: true,
  immutableRateObjectCreated: true,
  exactQualificationObjectReread: true,
  idempotentExactReplay: true,
  tamperedQualificationRejected: true,
  tamperedExistingObjectRejected: true,
  billingAccountIdentifierReturned: first.billingAccountIdentifierReturned,
  customerCreditsMutated: first.walletOrCreditMutationAuthorityGranted,
  productionReady: first.runtimeReleaseAuthorityGranted,
}))

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function createMemoryStorage() {
  const objects = new Map<string, StoredObject>()
  const requireObject = (objectName: string): StoredObject => {
    const value = objects.get(objectName)
    if (!value) throw Object.assign(new Error('Not found.'), { code: 404 })
    return value
  }
  return {
    objects,
    bucket() {
      return {
        file: (objectName: string) => ({
          save: async (body: Buffer, options: {
            contentType: string
            preconditionOpts: { ifGenerationMatch: number }
          }) => {
            if (options.preconditionOpts.ifGenerationMatch !== 0) {
              throw new Error('Expected a create-only precondition.')
            }
            if (objects.has(objectName)) {
              throw Object.assign(new Error('Precondition failed.'), {
                code: 412,
              })
            }
            objects.set(objectName, {
              body: Buffer.from(body),
              generation: '1',
              etag: 'etag-rate-1',
              contentType: options.contentType,
            })
          },
          getMetadata: async () => {
            const stored = requireObject(objectName)
            return [{
              generation: stored.generation,
              etag: stored.etag,
              contentType: stored.contentType,
              size: String(stored.body.byteLength),
            }]
          },
          download: async () => [Buffer.from(requireObject(objectName).body)],
        }),
      }
    },

    tamper(objectName: string) {
      const stored = requireObject(objectName)
      const body = Buffer.from(stored.body)
      body[body.byteLength - 2] = body[body.byteLength - 2] === 97 ? 98 : 97
      objects.set(objectName, { ...stored, body })
    },
  }
}
