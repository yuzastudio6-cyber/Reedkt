import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'
import {
  reconcileVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceBillingQualificationLabel,
  type VisualIntelligenceBillingExportObservation,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-reconciliation'
import {
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-qualification'

const qualificationId = 'weeditpro-gemini31-model-sku-reconciliation-smoke-v1'
const livePayload = {
  schemaVersion: 'visual-intelligence-model-billing-sku-live-execution-v1',
  evidenceClass:
    'live_isolated_vertex_usage_pending_billing_export_reconciliation',
  qualificationId,
  exactModelId: 'gemini-3.1-pro-preview',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  standardContextProviderRequestRef: ref('standard-request'),
  longContextProviderRequestRef: ref('long-request'),
  standardContextProviderUsageRef: ref('standard-usage'),
  longContextProviderUsageRef: ref('long-usage'),
  qualificationWindowStartedAtIso: '2026-08-12T12:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-12T12:10:00.000Z',
  liveGeminiStandardContextRequestExecuted: true,
  liveGeminiLongContextRequestExecuted: true,
  exactReturnedModelIdVerified: true,
  exactProviderUsageMetadataReread: true,
  billingExportReconciliationPending: true,
  maximumInternalQualificationCostUsdMicros: 10_000_000,
  automaticProviderRetryAllowed: false,
  publicListPriceUsedForSettlement: false,
  customerCreditsMutated: false,
  customerPricingAuthorityGranted: false,
  productionReleaseAuthorityGranted: false,
} as const
const liveExecution =
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt({
    ...livePayload,
    executionDigestSha256: visualIntelligenceDigest(livePayload),
  })
const exactLabel = visualIntelligenceBillingQualificationLabel(qualificationId)
const terms = WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
const observation: VisualIntelligenceBillingExportObservation = {
  detailedBillingTableId:
    'gcp_billing_export_resource_v1_000000_000000_000000',
  pricingTableId: 'cloud_pricing_export',
  billingExportFreshThroughIso: '2026-08-12T13:00:00.000Z',
  detailedUsageRows: [
    usageRow(terms[0], 'standard'),
    usageRow(terms[2], 'standard'),
    usageRow(terms[3], 'long'),
    usageRow(terms[5], 'long'),
  ],
  skuMetadataRows: terms.map((term) => ({
    exportTimeIso: '2026-08-12T13:00:00.000Z',
    pricingAsOfTimeIso: '2026-08-12T00:00:00.000Z',
    serviceId: 'services/C7E2-9256-1C43' as const,
    skuId: term.skuId,
    skuDescription: term.expectedDisplayName,
    consumptionModel: 'consumptionModels/7754-699E-0EBF' as const,
  })),
  queryCacheUsed: false,
  publicListPriceUsed: false,
  billingAccountIdentifierReturned: false,
}

const objectPort = memoryObjectPort()
const qualification =
  await reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: { async readExact() { return observation } },
    objectPort,
  })

assert.equal(qualification.qualificationId, qualificationId)
assert.deepEqual(
  qualification.exactSkuIds,
  terms.map((term) => term.skuId),
)
assert.equal(qualification.detailedBillingExportExactReread, true)
assert.equal(qualification.exactStandardAndLongSkuMappingVerified, true)
assert.equal(qualification.publicListPriceUsed, false)
assert.equal(qualification.walletOrCreditMutationAuthorityGranted, false)
assert.equal(objectPort.objects.size, 4)

const replay = await reconcileVisualIntelligenceModelBillingSkuQualification({
  liveExecution,
  billingExportPort: { async readExact() { return observation } },
  objectPort,
})
assert.deepEqual(replay, qualification)
assert.equal(objectPort.objects.size, 4)

await assert.rejects(
  reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: {
      async readExact() {
        const value = structuredClone(observation)
        value.detailedUsageRows[0].qualificationLabel = 'wrong-label'
        return value
      },
    },
    objectPort: memoryObjectPort(),
  }),
  /did not exactly reconcile/u,
)
await assert.rejects(
  reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: {
      async readExact() {
        const value = structuredClone(observation)
        value.detailedUsageRows[0].skuId = terms[1].skuId
        return value
      },
    },
    objectPort: memoryObjectPort(),
  }),
  /did not exactly reconcile/u,
)
await assert.rejects(
  reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: {
      async readExact() {
        const value = structuredClone(observation)
        value.skuMetadataRows.reverse()
        return value
      },
    },
    objectPort: memoryObjectPort(),
  }),
  /did not exactly reconcile/u,
)
await assert.rejects(
  reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: {
      async readExact() {
        const value = structuredClone(observation)
        value.billingExportFreshThroughIso = '2026-08-12T12:09:59.000Z'
        return value
      },
    },
    objectPort: memoryObjectPort(),
  }),
  /did not exactly reconcile/u,
)

process.stdout.write(`${JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-reconciliation',
  exactLiveExecutionBound: true,
  exactStandardAndLongSkuMappingVerified: true,
  allSixSkuMetadataRowsVerified: true,
  unrelatedOrMislabeledUsageRejected: true,
  staleBillingExportRejected: true,
  immutableCreateOnlyPersistenceVerified: true,
  publicListPriceUsed: false,
  customerCreditsMutated: false,
  productionReady: false,
})}\n`)

function usageRow(
  term: typeof terms[number],
  context: 'standard' | 'long',
) {
  return {
    exportTimeIso: '2026-08-12T13:00:00.000Z',
    usageStartTimeIso: '2026-08-12T12:00:00.000Z',
    usageEndTimeIso: '2026-08-12T13:00:00.000Z',
    projectId: 'reeditpro' as const,
    serviceId: 'services/C7E2-9256-1C43' as const,
    skuId: term.skuId,
    skuDescription: term.expectedDisplayName,
    costType: 'regular' as const,
    currency: 'USD' as const,
    usageAmount: '1',
    usageUnit: 'count',
    usageAmountInPricingUnits: '1',
    pricingUnit: 'count',
    consumptionModel: 'consumptionModels/7754-699E-0EBF' as const,
    capabilityLabel: 'visual-intelligence',
    operationLabel: 'billing-sku-qualification',
    contextLabel: context,
    qualificationLabel: exactLabel,
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort & {
  objects: Map<string, Buffer>
} {
  const objects = new Map<string, Buffer>()
  return {
    objects,
    async createOnly(input) {
      const prior = objects.get(input.objectPath)
      if (prior && !prior.equals(input.body)) {
        throw new Error('controlled create-only collision')
      }
      if (!prior) objects.set(input.objectPath, Buffer.from(input.body))
      return prior ? 'already_exists' : 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
