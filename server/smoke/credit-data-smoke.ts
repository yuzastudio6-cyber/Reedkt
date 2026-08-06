import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

import type { CreditSettlementRecord } from '../../src/types'
import {
  CREDIT_SETTLEMENT_STATUSES,
  REEDITPRO_EDIT_LEVELS,
} from '../../src/types'
import {
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import {
  buildEditCreditCostSummary,
  createCreditRevisionActionRecord,
  createMockCreditDataStore,
  insertCreditSettlement,
  previewCreditSettlement,
  upsertCreditRevisionActionByIdempotencyKey,
  upsertCreditSettlementByIdempotencyKey,
} from '../services/mock-credit-data-store'
import {
  createMockToolCostEvent,
  insertMockToolCostEvent,
} from '../tool-cost-metering/mock-tool-cost-store'
import {
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_COST_METERING_RATE_CARD,
  TOOL_OWNER_COST_EVENT_POLICY,
} from '../tool-cost-metering/rate-card'
import {
  creditSettlementRecordSchema,
  nonNegativeIntegerCentsSchema,
  nonNegativeIntegerCreditSchema,
  productEditLevelSchema,
  secretSafeJsonObjectSchema,
} from '../validation/credit-data-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

const workspaceId = 'workspace-credit-data-smoke'
const projectId = 'project-credit-data-smoke'
const creditEstimateId = 'credit-estimate-credit-data-smoke'
const creditReservationId = 'credit-reservation-credit-data-smoke'
const store = createMockCreditDataStore()

const events = [
  createMockToolCostEvent({
    id: 'tool-cost-transcription',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Transcription pass',
    usageCategory: 'transcription',
    lineItemType: 'transcript',
    actualInternalCostCents: 120,
  }),
  createMockToolCostEvent({
    id: 'tool-cost-media-analysis',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Media analysis',
    usageCategory: 'media_analysis',
    lineItemType: 'media_analysis',
    actualInternalCostCents: 250,
  }),
  createMockToolCostEvent({
    id: 'tool-cost-captions',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Captions',
    usageCategory: 'captions',
    lineItemType: 'captions',
    actualInternalCostCents: 100,
  }),
  createMockToolCostEvent({
    id: 'tool-cost-stroke-motion',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Stroke Motion',
    usageCategory: 'stroke_motion',
    lineItemType: 'stroke_motion',
    actualInternalCostCents: 440,
  }),
  createMockToolCostEvent({
    id: 'tool-cost-rendering',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Rendering/export',
    usageCategory: 'rendering',
    lineItemType: 'final_export',
    actualInternalCostCents: 300,
  }),
  createMockToolCostEvent({
    id: 'tool-cost-provider-variance',
    workspaceId,
    projectId,
    creditEstimateId,
    creditReservationId,
    label: 'Provider variance absorbed',
    usageCategory: 'graphic_design',
    lineItemType: 'graphic_design',
    actualInternalCostCents: 500,
    billableToUser: false,
    nonBillableReason: 'provider_variance_absorbed',
  }),
]

events.forEach((event) => insertMockToolCostEvent(store.toolCostStore, event))
assert.equal(events.every((event) => event.serviceFeeIncluded === false), true)
assert.equal(TOOL_OWNER_COST_EVENT_POLICY.serviceFeeIncluded, false)
assert.equal(TOOL_COST_METERING_RATE_CARD.every((entry) => entry.serviceFeeIncluded === false), true)

const beforePreviewCounts = {
  settlements: store.creditSettlements.length,
  revisions: store.creditRevisionActions.length,
  wallets: store.walletMutationRecords.length,
  reservations: store.reservationMutationRecords.length,
  ledgers: store.ledgerMutationRecords.length,
  exports: store.exportUnlockRecords.length,
  jobs: store.jobEnqueueRecords.length,
}

const preview = previewCreditSettlement(store, {
  workspaceId,
  projectId,
  editPlanId: 'edit-plan-credit-data-smoke',
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'normal',
  finalVideoDurationSeconds: 240,
  reservedCredits: 200,
  toolCostEventIds: events.map((event) => event.id),
  idempotencyKey: 'preview-credit-data-smoke',
})

assert.equal(preview.settlement.status, 'previewed')
assert.equal(preview.settlement.actualToolCostCredits, 121)
assert.equal(preview.settlement.reeditproServiceFeeCredits, 30)
assert.equal(preview.settlement.finalChargeCredits, 151)
assert.equal(preview.settlement.releasedCredits, 49)
assert.equal(preview.settlement.nonBillableToolEventCount, 1)
assert.equal(preview.summary.nonBillableAbsorbed?.credits, 50)
assert.equal(preview.summary.byUsageCategory.graphic_design.nonBillableEventCount, 1)
assert.equal(preview.summary.byUsageCategory.graphic_design.credits, 0)

assert.deepEqual({
  settlements: store.creditSettlements.length,
  revisions: store.creditRevisionActions.length,
  wallets: store.walletMutationRecords.length,
  reservations: store.reservationMutationRecords.length,
  ledgers: store.ledgerMutationRecords.length,
  exports: store.exportUnlockRecords.length,
  jobs: store.jobEnqueueRecords.length,
}, beforePreviewCounts, 'Settlement preview must be read-only and not mutate store arrays.')

const receiptLabels = preview.summary.userFacingLines.map((line) => line.label)
for (const label of [
  'Transcription',
  'Media analysis',
  'Captions',
  'Stroke Motion',
  'Graphic Design',
  'Real Motion',
  'SoundSync',
  'Rendering/export',
  'Other tools',
  'Actual tool cost',
  'ReEditPro service fee',
  'Final charge',
  'Reserved',
  'Returned',
]) {
  assert.ok(receiptLabels.includes(label), `Receipt lines must include ${label}.`)
}

const topUpPreview = previewCreditSettlement(store, {
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'premium',
  finalVideoDurationSeconds: 240,
  reservedCredits: 10,
  toolCostEventIds: events.map((event) => event.id),
  idempotencyKey: 'preview-top-up-credit-data-smoke',
})
assert.equal(topUpPreview.settlement.status, 'requires_top_up_before_export')
assert.equal(topUpPreview.requiredActionType, 'top_up_before_export')
assert.ok(topUpPreview.settlement.outstandingCredits > 0)

const revisedPreview = previewCreditSettlement(store, {
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'ultra_premium',
  finalVideoDurationSeconds: 3600,
  reservedCredits: 2000,
  toolCostEventIds: events.map((event) => event.id),
  idempotencyKey: 'preview-revised-credit-data-smoke',
})
assert.equal(revisedPreview.settlement.status, 'requires_revised_estimate')
assert.equal(revisedPreview.requiredActionType, 'revised_estimate')

function settlement(overrides: Partial<CreditSettlementRecord>): CreditSettlementRecord {
  return {
    ...preview.settlement,
    id: `settlement-${overrides.status ?? 'base'}`,
    status: 'settled',
    settlementReason: 'edit_completed',
    finalChargeCredits: preview.settlement.actualToolCostCredits + preview.settlement.reeditproServiceFeeCredits,
    releasedCredits: 0,
    absorbedOverageCredits: 0,
    outstandingCredits: 0,
    receiptPayload: { smoke: true },
    metadata: { smoke: true },
    settledAt: '2026-06-27T00:00:00.000Z',
    ...overrides,
  }
}

insertCreditSettlement(store, settlement({ status: 'settled' }))
insertCreditSettlement(store, settlement({
  id: 'settlement-requires-revised',
  status: 'requires_revised_estimate',
  settlementReason: 'projected_overage',
}))
insertCreditSettlement(store, settlement({
  id: 'settlement-requires-top-up',
  status: 'requires_top_up_before_export',
  settlementReason: 'approved_but_unfunded',
  outstandingCredits: 12,
}))
insertCreditSettlement(store, settlement({
  id: 'settlement-absorbed-overage',
  status: 'settled_with_absorbed_overage',
  settlementReason: 'provider_variance_absorbed',
  absorbedOverageCredits: 25,
}))
for (const status of ['settled', 'requires_revised_estimate', 'requires_top_up_before_export', 'settled_with_absorbed_overage']) {
  assert.ok(store.creditSettlements.some((record) => record.status === status))
}

const idempotentSettlement = settlement({
  id: 'settlement-idempotent-one',
  idempotencyKey: 'settlement-idempotency-smoke',
})
const firstSettlement = upsertCreditSettlementByIdempotencyKey(store, idempotentSettlement)
const secondSettlement = upsertCreditSettlementByIdempotencyKey(store, {
  ...idempotentSettlement,
  id: 'settlement-idempotent-two',
})
assert.equal(firstSettlement.id, secondSettlement.id)
assert.equal(store.creditSettlements.filter((record) => record.idempotencyKey === 'settlement-idempotency-smoke').length, 1)

const revisionAction = createCreditRevisionActionRecord({
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'normal',
  pauseReason: 'projected_overage',
  approvedMaxCredits: 100,
  usedOrCommittedCredits: 95,
  additionalLowCredits: 5,
  additionalExpectedCredits: 12,
  additionalHighCredits: 20,
  newMaximumEstimatedCredits: 120,
  reasonSummary: 'Projected tool cost increased during planning.',
  idempotencyKey: 'revision-action-idempotency-smoke',
})
assert.equal(revisionAction.status, 'action_required')
assert.equal(revisionAction.actionRequiredTitle, 'Action required: revised credit estimate needed')
assert.equal(revisionAction.actionRequiredMessage, REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.explanation)
assert.deepEqual(revisionAction.userOptions.map((option) => option.label), [
  'Approve & Continue',
  'Choose Lower-Cost Option',
  'Cancel Extra Work',
])
const firstRevision = upsertCreditRevisionActionByIdempotencyKey(store, revisionAction)
const secondRevision = upsertCreditRevisionActionByIdempotencyKey(store, {
  ...revisionAction,
  id: 'revision-action-second',
})
assert.equal(firstRevision.id, secondRevision.id)
assert.equal(store.creditRevisionActions.filter((record) => record.idempotencyKey === 'revision-action-idempotency-smoke').length, 1)

const exportTopUpAction = createCreditRevisionActionRecord({
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'premium',
  pauseReason: 'export_top_up_required',
  approvedMaxCredits: 100,
  usedOrCommittedCredits: 120,
  additionalLowCredits: 20,
  additionalExpectedCredits: 20,
  additionalHighCredits: 20,
  newMaximumEstimatedCredits: 120,
  reasonSummary: 'Approved final charge is not fully funded.',
  idempotencyKey: 'export-top-up-action-smoke',
})
assert.equal(exportTopUpAction.actionRequiredTitle, 'Action required: add credits to export')
assert.ok(exportTopUpAction.userOptions.some((option) => option.action === 'add_credits_and_unlock_export'))

assert.equal(nonNegativeIntegerCreditSchema.safeParse(-1).success, false)
assert.equal(nonNegativeIntegerCreditSchema.safeParse(1.2).success, false)
assert.equal(nonNegativeIntegerCentsSchema.safeParse(-1).success, false)
assert.equal(nonNegativeIntegerCentsSchema.safeParse(1.2).success, false)
for (const editLevel of REEDITPRO_EDIT_LEVELS) {
  assert.equal(productEditLevelSchema.safeParse(editLevel).success, true)
}
for (const invalidLevel of ['basic', 'pro', 'economy', 'standard']) {
  assert.equal(productEditLevelSchema.safeParse(invalidLevel).success, false)
}
assert.equal(productEditLevelSchema.safeParse('premium').success, true, 'premium is canonical as a product edit level.')

const secretMetadata = secretSafeJsonObjectSchema.safeParse({ providerApiKey: 'sk-not-a-real-key-but-secret-shaped' })
assert.equal(secretMetadata.success, false)

const invalidFinalCharge = creditSettlementRecordSchema.safeParse({
  ...preview.settlement,
  id: 'invalid-final-charge-smoke',
  status: 'settled',
  finalChargeCredits: preview.settlement.finalChargeCredits + 1,
})
assert.equal(invalidFinalCharge.success, false)

const summaryForAbsorbed = buildEditCreditCostSummary(
  settlement({ id: 'summary-absorbed', status: 'settled_with_absorbed_overage', absorbedOverageCredits: 8 }),
  events,
)
assert.ok(summaryForAbsorbed.userFacingLines.some((line) => line.label === 'ReEditPro absorbed'))

assert.ok(CREDIT_SETTLEMENT_STATUSES.includes('settled'))
assert.equal(preview.settlement.creditPolicyVersion, REEDITPRO_CREDIT_POLICY_VERSION)
assert.equal(preview.settlement.serviceFeePolicyVersion, REEDITPRO_SERVICE_FEE_POLICY_VERSION)
assert.equal(preview.settlement.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)

const docsText = [
  'README.md',
  'credit-ledger-architecture.md',
  'docs/credit-policy.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'package.json',
].map(readRepoFile).join('\n')

for (const term of [
  'RP-CREDITDATA-01',
  'CreditSettlementRecord',
  'CreditRevisionActionRecord',
  'EditCreditCostSummary',
  'smoke:credit-data',
  'no live billing',
  'no wallet mutation',
]) {
  assert.ok(docsText.includes(term), `Status docs/package metadata must include ${term}.`)
}

assert.equal(
  JSON.parse(readRepoFile('package.json')).scripts?.['smoke:credit-data'],
  'tsx server/smoke/credit-data-smoke.ts',
)

// Ensure Zod itself is available to route schemas without importing route code in browser contexts.
assert.equal(typeof z.object, 'function')

console.log('credit-data-smoke passed')
