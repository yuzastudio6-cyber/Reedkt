import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CreditReservationRecord,
  CreditRevisionActionRecord,
  CreditSettlementRecord,
} from '../../src/types'
import { CREDIT_RETAIL_VALUE_CENTS } from '../../src/types/credit-policy'
import {
  createCreditRevisionActionRecord,
  createMockCreditDataStore,
  insertCreditRevisionAction,
  insertCreditSettlement,
} from '../services/mock-credit-data-store'
import {
  buildEditCreditEstimatePreview,
  createMockCreditEstimateStore,
  insertEditCreditEstimatePreview,
} from '../services/mock-credit-estimate-store'
import {
  createMockCreditReservationStore,
  getMockCreditWalletBalance,
  getOrCreateMockCreditWallet,
  grantMockCredits,
} from '../services/mock-credit-reservation-store'
import {
  completeMockCreditTopUp,
  createMockCreditTopUpIntent,
  listCreditGrantsForWallet,
  listCreditPacks,
  MOCK_CREDIT_PACKS,
  suggestCreditTopUp,
} from '../services/mock-credit-purchase-store'
import {
  completeMockCreditTopUpSchema,
  createMockCreditTopUpSchema,
  suggestCreditTopUpSchema,
} from '../validation/credit-purchase-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

const packs = listCreditPacks()
assert.deepEqual(
  packs.map((pack) => [pack.credits, pack.priceCents]),
  [
    [100, 1_000],
    [250, 2_500],
    [500, 5_000],
    [1_000, 10_000],
    [2_500, 25_000],
  ],
)
for (const pack of packs) {
  assert.equal(pack.currency, 'USD')
  assert.equal(pack.isActive, true)
  assert.equal(pack.retailValueCents, pack.credits * CREDIT_RETAIL_VALUE_CENTS)
  assert.equal(pack.priceCents, pack.retailValueCents)
  assert.equal(pack.metadata.unlimitedEditing, false)
}
assert.equal(MOCK_CREDIT_PACKS.length, 5)

const reservationStore = createMockCreditReservationStore()
const wallet = getOrCreateMockCreditWallet(reservationStore, {
  workspaceId: 'workspace-credit-purchase',
  userId: 'user-credit-purchase',
})
assert.ok(wallet)
assert.deepEqual(getMockCreditWalletBalance(reservationStore, wallet.id), {
  creditWalletId: wallet.id,
  workspaceId: wallet.workspaceId,
  userId: wallet.userId,
  walletType: wallet.walletType,
  availableCredits: 0,
  reservedCredits: 0,
  spentCredits: 0,
  refundedCredits: 0,
})

const createRequest = {
  workspaceId: wallet.workspaceId,
  userId: wallet.userId ?? 'user-credit-purchase',
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  topUpReason: 'manual_wallet_top_up',
  idempotencyKey: 'credit-purchase-create-100',
  metadata: { scenario: 'create-intent' },
} as const
assert.equal(createMockCreditTopUpSchema.safeParse(createRequest).success, true)
const created = createMockCreditTopUpIntent(reservationStore, createRequest)
assert.equal(created.status, 'created')
assert.equal(created.creditsAdded, 0)
assert.equal(created.priceCents, 1_000)
assert.equal(created.topUpIntent?.checkoutProvider, 'mock')
assert.equal(created.topUpIntent?.mockOnly, true)
assert.equal(created.safetyFlags.mockTopUpIntentWritten, true)
assert.equal(created.safetyFlags.walletMutated, false)
assert.equal(created.safetyFlags.checkoutSessionCreated, false)
assert.equal(created.safetyFlags.paymentProviderCalled, false)
assert.equal(created.safetyFlags.stripeCalled, false)

const duplicateCreate = createMockCreditTopUpIntent(reservationStore, createRequest)
assert.equal(duplicateCreate.status, 'already_created')
assert.equal(duplicateCreate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicateCreate.topUpIntent?.id, created.topUpIntent?.id)
assert.equal(getMockCreditWalletBalance(reservationStore, wallet.id)?.availableCredits, 0)

const completeRequest = {
  workspaceId: wallet.workspaceId,
  userId: wallet.userId ?? 'user-credit-purchase',
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  topUpReason: 'manual_wallet_top_up',
  idempotencyKey: 'credit-purchase-complete-100',
  metadata: { scenario: 'complete-top-up' },
} as const
assert.equal(completeMockCreditTopUpSchema.safeParse(completeRequest).success, true)
const beforeCompleteCounts = sideEffects(reservationStore)
const completed = completeMockCreditTopUp(reservationStore, completeRequest)
assert.equal(completed.status, 'completed')
assert.equal(completed.idempotencyStatus, 'created')
assert.equal(completed.creditsAdded, 100)
assert.equal(completed.priceCents, 1_000)
assert.equal(completed.walletBalance?.availableCredits, 100)
assert.equal(completed.walletBalance?.reservedCredits, 0)
assert.equal(completed.walletBalance?.spentCredits, 0)
assert.equal(completed.walletBalance?.refundedCredits, 0)
assert.equal(completed.creditGrant?.sourceType, 'purchased')
assert.equal(completed.creditGrant?.status, 'active')
assert.equal(completed.creditGrant?.originalAmount, 100)
assert.equal(completed.creditGrant?.remainingAmount, 100)
assert.equal(completed.creditGrant?.purchaseAmountCents, 1_000)
assert.equal(completed.creditGrant?.retailValueCents, 1_000)
assert.equal(completed.creditGrant?.billingProvider, 'mock')
assert.equal(completed.creditGrant?.billingPaymentId, completed.topUpIntent?.id)
assert.equal(completed.creditGrant?.metadata?.mockOnly, true)
assert.equal(completed.safetyFlags.mockCreditGrantWritten, true)
assert.equal(completed.safetyFlags.walletMutated, true)
assert.equal(completed.safetyFlags.creditsAdded, true)
assert.equal(completed.safetyFlags.creditsReserved, false)
assert.equal(completed.safetyFlags.creditsSpent, false)
assert.equal(completed.safetyFlags.ledgerWritten, false)
assert.equal(completed.safetyFlags.productionWalletMutated, false)
assert.equal(completed.safetyFlags.checkoutSessionCreated, false)
assert.equal(completed.safetyFlags.paymentProviderCalled, false)
assert.equal(completed.safetyFlags.providerCalled, false)
assert.equal(completed.safetyFlags.renderOrExportStarted, false)
assert.equal(completed.safetyFlags.exportUnlocked, false)
assert.equal(completed.safetyFlags.supabaseWritten, false)
assert.equal(completed.userFacingTitle, 'Credits added')
assert.match(completed.userFacingMessage, /100 credits were added/)
assert.deepEqual(sideEffects(reservationStore), {
  ...beforeCompleteCounts,
  walletMutations: beforeCompleteCounts.walletMutations + 1,
  checkoutOrTopUpRecords: beforeCompleteCounts.checkoutOrTopUpRecords + 1,
  creditGrants: beforeCompleteCounts.creditGrants + 1,
  creditTopUpIntents: beforeCompleteCounts.creditTopUpIntents + 1,
})

const duplicateComplete = completeMockCreditTopUp(reservationStore, completeRequest)
assert.equal(duplicateComplete.status, 'already_completed')
assert.equal(duplicateComplete.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicateComplete.topUpIntent?.id, completed.topUpIntent?.id)
assert.equal(duplicateComplete.creditGrant?.id, completed.creditGrant?.id)
assert.equal(getMockCreditWalletBalance(reservationStore, wallet.id)?.availableCredits, 100)
assert.equal(listCreditGrantsForWallet(reservationStore, wallet.id).length, 1)

const secondTopUp = completeMockCreditTopUp(reservationStore, {
  ...completeRequest,
  idempotencyKey: 'credit-purchase-complete-100-second',
})
assert.equal(secondTopUp.status, 'completed')
assert.equal(getMockCreditWalletBalance(reservationStore, wallet.id)?.availableCredits, 200)
assert.equal(listCreditGrantsForWallet(reservationStore, wallet.id).length, 2)

const estimateStores = estimateSuggestionScenario()
const estimateSuggestion = suggestCreditTopUp(
  estimateStores.reservationStore,
  estimateStores.estimateStore,
  estimateStores.creditDataStore,
  {
    workspaceId: estimateStores.workspaceId,
    userId: estimateStores.userId,
    creditWalletId: estimateStores.wallet.id,
    topUpReason: 'insufficient_credits_for_estimate',
    relatedProjectId: estimateStores.projectId,
    relatedCreditEstimateId: estimateStores.creditEstimateId,
  },
)
assert.equal(estimateSuggestion.suggestion.requiredTopUpCredits, 50)
assert.equal(estimateSuggestion.suggestion.recommendedPackId, 'credits_100_usd_10')
assert.equal(estimateSuggestion.suggestion.recommendedCredits, 100)
assert.equal(estimateSuggestion.suggestion.nextSuggestedAction, 'retry_estimate_reservation')
assert.match(estimateSuggestion.suggestion.warnings.join('\n'), /reservation was not retried/)

const revisedStores = revisedSuggestionScenario()
const revisedSuggestion = suggestCreditTopUp(
  revisedStores.reservationStore,
  revisedStores.estimateStore,
  revisedStores.creditDataStore,
  {
    workspaceId: revisedStores.workspaceId,
    userId: revisedStores.userId,
    creditWalletId: revisedStores.wallet.id,
    topUpReason: 'revised_credit_additional_hold',
    relatedProjectId: revisedStores.projectId,
    relatedCreditReservationId: revisedStores.reservation.id,
    relatedCreditRevisionActionId: revisedStores.action.id,
  },
)
assert.equal(revisedSuggestion.suggestion.requiredTopUpCredits, 50)
assert.equal(revisedSuggestion.suggestion.recommendedPackId, 'credits_100_usd_10')
assert.equal(revisedSuggestion.suggestion.nextSuggestedAction, 'retry_revised_credit_approval')
assert.match(revisedSuggestion.suggestion.warnings.join('\n'), /approval was not retried/)

const exportStores = exportSuggestionScenario()
const exportSuggestion = suggestCreditTopUp(
  exportStores.reservationStore,
  exportStores.estimateStore,
  exportStores.creditDataStore,
  {
    workspaceId: exportStores.workspaceId,
    userId: exportStores.userId,
    creditWalletId: exportStores.wallet.id,
    topUpReason: 'export_top_up_required',
    relatedProjectId: exportStores.projectId,
    relatedCreditReservationId: exportStores.reservation.id,
    relatedCreditSettlementId: exportStores.settlement.id,
  },
)
assert.equal(exportSuggestion.suggestion.requiredTopUpCredits, 30)
assert.equal(exportSuggestion.suggestion.recommendedPackId, 'credits_100_usd_10')
assert.equal(exportSuggestion.suggestion.nextSuggestedAction, 'retry_export_gate')
assert.match(exportSuggestion.suggestion.warnings.join('\n'), /export gate was not retried or unlocked/)

const exportCompletion = completeMockCreditTopUp(exportStores.reservationStore, {
  workspaceId: exportStores.workspaceId,
  userId: exportStores.userId,
  creditWalletId: exportStores.wallet.id,
  creditPackId: 'credits_100_usd_10',
  topUpReason: 'export_top_up_required',
  relatedProjectId: exportStores.projectId,
  relatedCreditReservationId: exportStores.reservation.id,
  relatedCreditSettlementId: exportStores.settlement.id,
  idempotencyKey: 'credit-purchase-export-complete',
})
assert.equal(exportCompletion.status, 'completed')
assert.equal(exportCompletion.nextSuggestedAction, 'retry_export_gate')
assert.equal(exportCompletion.userFacingTitle, 'Credits added. Export can be checked again.')
assert.match(exportCompletion.userFacingMessage, /Recheck the export gate/)
assert.equal(exportCompletion.safetyFlags.exportUnlocked, false)
assert.equal(exportCompletion.safetyFlags.renderOrExportStarted, false)

assert.equal(createMockCreditTopUpSchema.safeParse({
  ...createRequest,
  idempotencyKey: '',
}).success, false)
assert.equal(createMockCreditTopUpSchema.safeParse({
  ...createRequest,
  idempotencyKey: 'credit-purchase-custom',
  customCredits: 10,
}).success, false)
assert.equal(createMockCreditTopUpSchema.safeParse({
  ...createRequest,
  idempotencyKey: 'credit-purchase-secret',
  metadata: { providerApiKey: 'not-real-secret-shaped' },
}).success, false)
assert.equal(createMockCreditTopUpSchema.safeParse({
  ...createRequest,
  idempotencyKey: 'credit-purchase-stripe',
  metadata: { billingProvider: 'stripe' },
}).success, false)
assert.equal(suggestCreditTopUpSchema.safeParse({
  workspaceId: wallet.workspaceId,
  creditWalletId: wallet.id,
  topUpReason: 'manual_wallet_top_up',
  requestedCredits: -1,
}).success, false)
assert.equal(completeMockCreditTopUpSchema.safeParse({
  ...completeRequest,
  idempotencyKey: 'credit-purchase-negative-custom',
  customCredits: -100,
}).success, false)

const missingWallet = completeMockCreditTopUp(createMockCreditReservationStore(), completeRequest)
assert.equal(missingWallet.status, 'wallet_not_found')
assert.equal(missingWallet.safetyFlags.walletMutated, false)

const invalidPack = completeMockCreditTopUp(reservationStore, {
  ...completeRequest,
  creditPackId: 'credits_missing',
  idempotencyKey: 'credit-purchase-invalid-pack',
})
assert.equal(invalidPack.status, 'pack_not_found')
assert.equal(invalidPack.safetyFlags.walletMutated, false)

const packageJson = readRepoFile('package.json')
assert.match(packageJson, /"smoke:credit-purchase"/)

const docs = [
  readRepoFile('docs/credit-top-up-purchased-grants.md'),
  readRepoFile('docs/credit-policy.md'),
  readRepoFile('docs/credit-export-lock.md'),
  readRepoFile('mock-vs-real-status.md'),
].join('\n')
for (const phrase of [
  'purchased credits',
  'mock-only',
  'no Stripe/payment',
  'no production wallet mutation',
  'retry reservation, revised-credit approval, or export gate',
]) {
  assert.match(docs, new RegExp(escapeRegExp(phrase), 'i'))
}

console.log('credit purchase smoke passed')

function estimateSuggestionScenario() {
  const workspaceId = 'workspace-credit-purchase-estimate'
  const projectId = 'project-credit-purchase-estimate'
  const userId = 'user-credit-purchase-estimate'
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  const wallet = getOrCreateMockCreditWallet(reservationStore, { workspaceId, userId })
  assert.ok(wallet)
  grantMockCredits(reservationStore, {
    creditWalletId: wallet.id,
    amount: 150,
    sourceType: 'admin',
    userId,
  })
  const preview = insertEditCreditEstimatePreview(estimateStore, buildEditCreditEstimatePreview({
    workspaceId,
    projectId,
    editPlanId: 'edit-plan-credit-purchase-estimate',
    productEditLevel: 'normal',
    finalVideoDurationSeconds: 120,
    plannedToolIds: ['opentimelineio'],
    toolUsageInputs: {
      opentimelineio: {
        toolId: 'opentimelineio',
        actualInternalCostCents: 120,
      },
    },
    availableCreditsSnapshot: 150,
    idempotencyKey: 'credit-purchase-estimate-preview',
  }))
  preview.summary.requiredHoldCredits = 200
  preview.summary.requiredTopUpCredits = 50
  preview.summary.canProceedToReservation = false
  preview.summary.readinessStatus = 'needs_top_up'
  preview.topUpSummary.requiredHoldCredits = 200
  preview.topUpSummary.requiredTopUpCredits = 50
  preview.topUpSummary.canProceedToReservation = false
  preview.topUpSummary.readinessStatus = 'needs_top_up'
  return { workspaceId, projectId, userId, estimateStore, reservationStore, creditDataStore, wallet, creditEstimateId: preview.estimate.id }
}

function revisedSuggestionScenario() {
  const workspaceId = 'workspace-credit-purchase-revised'
  const projectId = 'project-credit-purchase-revised'
  const userId = 'user-credit-purchase-revised'
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  const wallet = getOrCreateMockCreditWallet(reservationStore, { workspaceId, userId })
  assert.ok(wallet)
  grantMockCredits(reservationStore, {
    creditWalletId: wallet.id,
    amount: 30,
    sourceType: 'admin',
    userId,
  })
  const reservation = reservationRecord('revised', workspaceId, projectId, wallet.id, 120)
  reservationStore.creditReservations.push(reservation)
  const action = insertCreditRevisionAction(creditDataStore, createCreditRevisionActionRecord({
    workspaceId,
    projectId,
    creditEstimateId: reservation.creditEstimateId,
    creditReservationId: reservation.id,
    editComputeLevel: 'normal',
    pauseReason: 'projected_overage',
    approvedMaxCredits: 120,
    usedOrCommittedCredits: 120,
    additionalLowCredits: 20,
    additionalExpectedCredits: 50,
    additionalHighCredits: 80,
    newMaximumEstimatedCredits: 200,
    reasonSummary: 'Projected overage for smoke.',
    idempotencyKey: 'credit-purchase-revised-action',
  })) as CreditRevisionActionRecord
  return { workspaceId, projectId, userId, estimateStore, reservationStore, creditDataStore, wallet, reservation, action }
}

function exportSuggestionScenario() {
  const workspaceId = 'workspace-credit-purchase-export'
  const projectId = 'project-credit-purchase-export'
  const userId = 'user-credit-purchase-export'
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  const wallet = getOrCreateMockCreditWallet(reservationStore, { workspaceId, userId })
  assert.ok(wallet)
  const reservation = reservationRecord('export', workspaceId, projectId, wallet.id, 200)
  reservationStore.creditReservations.push(reservation)
  const settlement = settlementRecord('export', reservation)
  insertCreditSettlement(creditDataStore, settlement)
  return { workspaceId, projectId, userId, estimateStore, reservationStore, creditDataStore, wallet, reservation, settlement }
}

function reservationRecord(
  suffix: string,
  workspaceId: string,
  projectId: string,
  creditWalletId: string,
  reservedCredits: number,
): CreditReservationRecord {
  const createdAt = '2026-07-01T00:00:00.000Z'
  return {
    id: `credit_reservation_purchase_${suffix}`,
    creditWalletId,
    workspaceId,
    projectId,
    creditEstimateId: `credit_estimate_purchase_${suffix}`,
    creditApprovalId: `credit_approval_purchase_${suffix}`,
    editPlanId: `edit_plan_purchase_${suffix}`,
    status: 'reserved',
    reservedCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock credit purchase smoke reservation.',
    idempotencyKey: `reservation-purchase-${suffix}`,
    reservedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      milestone: 'RP-CREDITPURCHASE-01',
    },
  }
}

function settlementRecord(
  suffix: string,
  reservation: CreditReservationRecord,
): CreditSettlementRecord {
  const createdAt = '2026-07-01T00:00:00.000Z'
  return {
    id: `credit_settlement_purchase_${suffix}`,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    editPlanId: reservation.editPlanId ?? null,
    chatSessionId: null,
    jobBatchId: null,
    creditWalletId: reservation.creditWalletId,
    creditEstimateId: reservation.creditEstimateId,
    creditReservationId: reservation.id,
    creditApprovalId: reservation.creditApprovalId ?? null,
    editComputeLevel: 'normal',
    finalVideoDurationSeconds: 60,
    status: 'requires_top_up_before_export',
    settlementReason: 'approved_but_unfunded',
    reservedCredits: 200,
    actualToolCostCents: 1_900,
    actualToolCostCredits: 190,
    reeditproServiceFeeCredits: 40,
    finalChargeCredits: 230,
    releasedCredits: 0,
    absorbedOverageCredits: 0,
    outstandingCredits: 30,
    billableToolEventCount: 1,
    nonBillableToolEventCount: 0,
    toolCostEventIds: [],
    rateCardVersion: 'tool-metering-v1-2026-06-26',
    creditPolicyVersion: 'rp-creditpolicy-01',
    serviceFeePolicyVersion: 'rp-creditpolicy-01-service-fee',
    idempotencyKey: `settlement-purchase-${suffix}`,
    settlementPayload: {
      computedFinalChargeCredits: 230,
      noExportUnlock: true,
      noCheckoutOrTopUp: true,
    },
    receiptPayload: {
      userFacingLines: [],
    },
    metadata: {
      mockOnly: true,
      milestone: 'RP-SETTLEMENT-01',
    },
    createdAt,
    updatedAt: createdAt,
    settledAt: null,
    failedAt: null,
  }
}

function sideEffects(store: ReturnType<typeof createMockCreditReservationStore>) {
  return {
    walletMutations: store.walletMutationRecords.length,
    reservationMutations: store.reservationMutationRecords.length,
    ledgerMutations: store.ledgerMutationRecords.length,
    settlementMutations: store.settlementMutationRecords.length,
    exportUnlocks: store.exportUnlockRecords.length,
    checkoutOrTopUpRecords: store.checkoutOrTopUpRecords.length,
    providerCalls: store.providerCallRecords.length,
    workerRuns: store.workerRunRecords.length,
    renderExports: store.renderExportRecords.length,
    creditGrants: store.creditGrants.length,
    creditTopUpIntents: store.creditTopUpIntents.length,
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
