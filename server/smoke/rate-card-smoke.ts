import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  REEDITPRO_EDIT_LEVELS,
} from '../../src/types'
import {
  calculateExternalProviderCostMicros,
  calculateInfrastructureRuntimeCostMicros,
  calculateEstimateRangeFromExpectedCost,
  calculateToolCostCredits,
  centsToCreditsCeil,
  createMockToolCostEvent,
  createMockToolCostStore,
  insertMockToolCostEvent,
  microsToCentsCeil,
  normalizeBillableMilliseconds,
  roundBillableMilliseconds,
  summarizeMockToolCostEvents,
  validatePricingSnapshotHasNoSecrets,
  buildPricingSnapshot,
} from '../tool-cost-metering'
import {
  COST_MICROS_PER_CENT,
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
} from '../tool-cost-metering/rate-card'
import {
  createMockCreditDataStore,
  previewCreditSettlement,
} from '../services/mock-credit-data-store'
import {
  createToolCostEventSchema,
  nonNegativeIntegerCentsSchema,
  nonNegativeIntegerMicrosSchema,
  toolCostPricingSnapshotSchema,
  toolRuntimeComputeLevelSchema,
} from '../validation/tool-cost-schemas'
import {
  previewCreditSettlementSchema,
  productEditLevelSchema,
} from '../validation/credit-data-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

assert.equal(TOOL_COST_RATE_CARD.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)
assert.equal(TOOL_COST_RATE_CARD.creditValueCents, 10)
assert.equal(TOOL_COST_RATE_CARD.serviceFeeIncluded, false)
assert.equal(COST_MICROS_PER_CENT, 10_000)
assert.deepEqual(TOOL_COST_RATE_CARD.supportedProductEditLevels, REEDITPRO_EDIT_LEVELS)
assert.equal(TOOL_COST_RATE_CARD.humanManual.supported, false)

assert.equal(unwrap(centsToCreditsCeil(10)), 1)
assert.equal(unwrap(centsToCreditsCeil(11)), 2)
assert.equal(unwrap(centsToCreditsCeil(100)), 10)
assert.equal(unwrap(centsToCreditsCeil(999)), 100)
assert.equal(unwrap(calculateToolCostCredits(999)), 100)

assert.equal(unwrap(microsToCentsCeil(1)), 1)
assert.equal(unwrap(microsToCentsCeil(10_000)), 1)
assert.equal(microsToCentsCeil(-1).ok, false)
assert.equal(microsToCentsCeil(1.2).ok, false)
assert.equal(microsToCentsCeil(Number.NaN).ok, false)
assert.equal(microsToCentsCeil(Number.POSITIVE_INFINITY).ok, false)
assert.equal(centsToCreditsCeil(-1).ok, false)
assert.equal(centsToCreditsCeil(1.2).ok, false)

assert.equal(normalizeBillableMilliseconds(0).ok, false)
assert.equal(normalizeBillableMilliseconds(-1).ok, false)
assert.equal(unwrap(roundBillableMilliseconds(1)), 1_000)
assert.equal(unwrap(roundBillableMilliseconds(1_050)), 1_100)

const runtimeBase = {
  wallTimeMilliseconds: 1_500,
  renderSeconds: 2,
  vcpuCount: 2,
  memoryGib: 4,
  gpuCount: 1,
  tempStorageGibHours: 1,
  outputStorageGibHours: 1,
  networkEgressMib: 8,
}
const economyRuntime = unwrap(calculateInfrastructureRuntimeCostMicros({ ...runtimeBase, computeLevel: 'economy' }))
const standardRuntime = unwrap(calculateInfrastructureRuntimeCostMicros({ ...runtimeBase, computeLevel: 'standard' }))
const premiumRuntime = unwrap(calculateInfrastructureRuntimeCostMicros({ ...runtimeBase, computeLevel: 'premium' }))
assert.ok(standardRuntime.actualInternalCostMicros >= economyRuntime.actualInternalCostMicros)
assert.ok(premiumRuntime.actualInternalCostMicros >= standardRuntime.actualInternalCostMicros)
assert.ok(Number(standardRuntime.breakdownMicros.cpuMicros) > 0)
assert.ok(Number(standardRuntime.breakdownMicros.memoryMicros) > 0)
assert.ok(Number(standardRuntime.breakdownMicros.gpuMicros) > 0)
assert.equal(standardRuntime.billableMilliseconds, 1_500)

const providerCost = unwrap(calculateExternalProviderCostMicros({
  provider: 'mock-provider',
  model: 'mock-model',
  requestCount: 1,
  inputTokens: 1_000,
  outputTokens: 500,
  inputVideoSeconds: 4,
  outputVideoSeconds: 3,
  inputAudioSeconds: 5,
  outputAudioSeconds: 2,
  imageCount: 2,
}))
assert.ok(Number(providerCost.breakdownMicros.requestMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.inputTokenMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.outputTokenMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.inputVideoMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.outputVideoMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.inputAudioMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.outputAudioMicros) > 0)
assert.ok(Number(providerCost.breakdownMicros.imageMicros) > 0)
assert.equal(providerCost.provider, 'mock-provider')
assert.equal(providerCost.model, 'mock-model')

const mediumEstimate = unwrap(calculateEstimateRangeFromExpectedCost({
  expectedInternalCostMicros: 1_234_500,
  riskLevel: 'medium',
  approvedReservationCredits: 200,
  sourceKind: 'external_provider',
  provider: 'mock-provider',
  model: 'mock-model',
}))
const highEstimate = unwrap(calculateEstimateRangeFromExpectedCost({
  expectedInternalCostMicros: 1_234_500,
  riskLevel: 'high',
}))
assert.ok(mediumEstimate.lowInternalCostCents <= mediumEstimate.expectedInternalCostCents)
assert.ok(mediumEstimate.expectedInternalCostCents <= mediumEstimate.highInternalCostCents)
assert.ok(highEstimate.highInternalCostCents > mediumEstimate.highInternalCostCents)
assert.equal(mediumEstimate.expectedCredits, unwrap(centsToCreditsCeil(mediumEstimate.expectedInternalCostCents)))
assert.equal(mediumEstimate.serviceFeeIncluded, false)
assert.equal(mediumEstimate.pricingSnapshot.serviceFeeIncluded, false)
assert.equal(mediumEstimate.canRunWithinApprovedReservation, true)

const store = createMockToolCostStore()
const billableOneCent = createMockToolCostEvent({
  id: 'rate-card-billable-one-cent',
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  creditEstimateId: 'estimate-rate-card-smoke',
  creditReservationId: 'reservation-rate-card-smoke',
  label: 'Billable one cent',
  usageCategory: 'media_analysis',
  actualInternalCostCents: 1,
})
const billableSecondCent = createMockToolCostEvent({
  id: 'rate-card-billable-second-cent',
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  creditEstimateId: 'estimate-rate-card-smoke',
  creditReservationId: 'reservation-rate-card-smoke',
  label: 'Billable second cent',
  usageCategory: 'transcription',
  actualInternalCostCents: 1,
  idempotencyKey: 'rate-card-billable-second-cent',
})
const nonBillableAbsorbed = createMockToolCostEvent({
  id: 'rate-card-non-billable',
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  creditEstimateId: 'estimate-rate-card-smoke',
  creditReservationId: 'reservation-rate-card-smoke',
  label: 'Provider variance absorbed',
  usageCategory: 'graphic_design',
  actualInternalCostCents: 998,
  billableToUser: false,
  nonBillableReason: 'provider_variance_absorbed',
  failureCategory: 'provider_variance_absorbed',
  retryAttempt: 1,
})
for (const event of [billableOneCent, billableSecondCent, nonBillableAbsorbed]) {
  insertMockToolCostEvent(store, event)
  assert.equal(event.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)
  assert.equal(event.pricingSnapshot.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)
  assert.equal(event.serviceFeeIncluded, false)
  assert.equal(event.pricingSnapshot.serviceFeeIncluded, false)
  assert.equal(event.toolCostCredits, event.credits)
}
assert.equal(billableSecondCent.idempotencyKey, 'rate-card-billable-second-cent')
assert.equal(nonBillableAbsorbed.failureCategory, 'provider_variance_absorbed')

const aggregation = summarizeMockToolCostEvents(store.toolCostEvents)
assert.equal(aggregation.actualBillableCostCents, 2)
assert.equal(aggregation.actualBillableCostCredits, 1)
assert.equal(aggregation.nonBillableCostCents, 998)
assert.equal(aggregation.nonBillableCredits, 100)
assert.equal(aggregation.billableEventCount, 2)
assert.equal(aggregation.nonBillableEventCount, 1)
assert.equal(aggregation.byUsageCategory.graphic_design.credits, 0)

const creditDataStore = createMockCreditDataStore(store.toolCostEvents)
const beforePreviewCounts = {
  settlements: creditDataStore.creditSettlements.length,
  revisions: creditDataStore.creditRevisionActions.length,
  wallets: creditDataStore.walletMutationRecords.length,
  reservations: creditDataStore.reservationMutationRecords.length,
  ledgers: creditDataStore.ledgerMutationRecords.length,
}
const preview = previewCreditSettlement(creditDataStore, {
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  creditEstimateId: 'estimate-rate-card-smoke',
  creditReservationId: 'reservation-rate-card-smoke',
  editComputeLevel: 'normal',
  finalVideoDurationSeconds: 240,
  reservedCredits: 40,
  toolCostEventIds: store.toolCostEvents.map((event) => event.id),
  idempotencyKey: 'rate-card-preview-smoke',
})
assert.equal(preview.settlement.actualToolCostCents, 2)
assert.equal(preview.settlement.actualToolCostCredits, 1)
assert.equal(preview.settlement.reeditproServiceFeeCredits, 30)
assert.equal(preview.settlement.finalChargeCredits, 31)
assert.equal(preview.summary.nonBillableAbsorbed?.actualInternalCostCents, 998)
assert.equal(preview.summary.nonBillableAbsorbed?.credits, 100)
assert.deepEqual({
  settlements: creditDataStore.creditSettlements.length,
  revisions: creditDataStore.creditRevisionActions.length,
  wallets: creditDataStore.walletMutationRecords.length,
  reservations: creditDataStore.reservationMutationRecords.length,
  ledgers: creditDataStore.ledgerMutationRecords.length,
}, beforePreviewCounts)

for (const editLevel of REEDITPRO_EDIT_LEVELS) {
  assert.equal(productEditLevelSchema.safeParse(editLevel).success, true)
}
for (const invalidProductLevel of ['basic', 'pro', 'economy', 'standard']) {
  assert.equal(productEditLevelSchema.safeParse(invalidProductLevel).success, false)
}
assert.equal(productEditLevelSchema.safeParse('premium').success, true)
assert.equal(toolRuntimeComputeLevelSchema.safeParse('premium').success, true)
assert.equal(toolRuntimeComputeLevelSchema.safeParse('ultra_premium').success, false)
assert.equal(previewCreditSettlementSchema.safeParse({
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  creditEstimateId: 'estimate-rate-card-smoke',
  creditReservationId: 'reservation-rate-card-smoke',
  editComputeLevel: 'economy',
  finalVideoDurationSeconds: 240,
  reservedCredits: 40,
  idempotencyKey: 'invalid-runtime-level-as-product-level',
}).success, false)

assert.equal(nonNegativeIntegerMicrosSchema.safeParse(-1).success, false)
assert.equal(nonNegativeIntegerMicrosSchema.safeParse(1.2).success, false)
assert.equal(nonNegativeIntegerCentsSchema.safeParse(-1).success, false)
assert.equal(nonNegativeIntegerCentsSchema.safeParse(1.2).success, false)
assert.equal(createToolCostEventSchema.safeParse({
  id: 'rate-card-schema-event',
  workspaceId: 'workspace-rate-card-smoke',
  projectId: 'project-rate-card-smoke',
  label: 'Schema event',
  usageCategory: 'media_analysis',
  actualInternalCostCents: 1,
  metadata: { token: 'secret-like-value' },
}).success, false)

const secretSnapshot = buildPricingSnapshot({
  sourceKind: 'external_provider',
  provider: 'mock-provider',
  model: 'mock-model',
  pricingUnits: { apiKey: 'sk-not-a-real-key-but-secret-shaped' },
})
assert.equal(secretSnapshot.ok, false)
assert.equal(validatePricingSnapshotHasNoSecrets({
  ...providerCost.pricingSnapshot,
  providerCredential: 'secret-like-value',
}).ok, false)
assert.equal(toolCostPricingSnapshotSchema.safeParse(providerCost.pricingSnapshot).success, true)
assert.equal(toolCostPricingSnapshotSchema.safeParse({
  ...providerCost.pricingSnapshot,
  pricingUnits: { signedUrl: 'https://example.invalid/signed' },
}).success, false)

const docsText = [
  'README.md',
  'AGENTS.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'credit-ledger-architecture.md',
  'docs/credit-policy.md',
  'docs/edit-level-credit-policy.md',
  'docs/rate-card-cost-math.md',
  'package.json',
].map(readRepoFile).join('\n')

for (const term of [
  'RP-RATECARD-01',
  'mock-safe rate card',
  'serviceFeeIncluded = false',
  'actual internal tool cost',
  'ReEditPro service fee',
  'smoke:rate-card',
  'smoke:tool-cost-metering',
  'no live billing',
]) {
  assert.ok(docsText.includes(term), `Docs/package metadata must include: ${term}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:rate-card'], 'tsx server/smoke/rate-card-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:tool-cost-metering'], 'tsx server/smoke/rate-card-smoke.ts')

console.log('rate-card-smoke passed')
