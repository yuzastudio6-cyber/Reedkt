import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  EditCreditEstimatePreview,
  ReserveMaxEstimateCreditsRequest,
} from '../../src/types'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { prepareMockCreditRuntimeScenario } from '../../src/backend/mock/mock-credit-runtime-scenarios'
import {
  approveCreditEstimate,
  createCreditWallet,
  grantWeeklyBonusCredits,
  reserveCredits,
} from '../../src/backend/services/credit-service'
import { unwrapServiceResult } from '../../src/backend/service-result'
import {
  createMockCreditEstimateStore,
  insertEditCreditEstimatePreview,
} from '../services/mock-credit-estimate-store'
import {
  createMockCreditReservationStore,
  getMockCreditWalletBalance,
  getOrCreateMockCreditWallet,
  grantMockCredits,
  reserveMaxEstimateCredits,
} from '../services/mock-credit-reservation-store'
import { reserveMaxEstimateCreditsSchema } from '../validation/credit-reservation-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

const workspaceId = 'workspace-credit-reservation-smoke'
const projectId = 'project-credit-reservation-smoke'
const editPlanId = 'edit-plan-credit-reservation-smoke'
const approvedByUserId = 'user-credit-reservation-smoke'
const estimateStore = createMockCreditEstimateStore()
const reservationStore = createMockCreditReservationStore()
const preview = insertEditCreditEstimatePreview(estimateStore, createPreview('credit-estimate-max-hold'))
const wallet = getOrCreateMockCreditWallet(reservationStore, {
  workspaceId,
  userId: approvedByUserId,
})

assert.ok(wallet, 'Smoke setup should create a mock wallet.')
grantMockCredits(reservationStore, {
  creditWalletId: wallet.id,
  amount: 250,
  sourceType: 'admin',
  userId: approvedByUserId,
})

const validRequest: ReserveMaxEstimateCreditsRequest = {
  workspaceId,
  projectId,
  editPlanId,
  creditWalletId: wallet.id,
  creditEstimateId: preview.estimate.id,
  creditApprovalId: 'credit-approval-reservation-smoke',
  approvedByUserId,
  idempotencyKey: 'credit-reservation-smoke-max-hold',
  metadata: { scenario: 'max-hold' },
}

assert.equal(reserveMaxEstimateCreditsSchema.safeParse(validRequest).success, true)
assert.equal(reserveMaxEstimateCreditsSchema.safeParse({
  ...validRequest,
  idempotencyKey: 'secret-rejection',
  metadata: { apiKey: 'should-not-pass' },
}).success, false)

const beforeReserveMutationCounts = mutationCounts(reservationStore)
const reserved = reserveMaxEstimateCredits(reservationStore, estimateStore, validRequest)

assert.equal(reserved.status, 'reserved')
assert.equal(reserved.idempotencyStatus, 'created')
assert.equal(reserved.requiredHoldCredits, 200)
assert.equal(reserved.reservation?.reservedCredits, 200)
assert.equal(reserved.availableCreditsBeforeReservation, 250)
assert.equal(reserved.availableCreditsAfterReservation, 50)
assert.equal(reserved.reservedCreditsAfterReservation, 200)
assert.equal(reserved.requiredTopUpCredits, 0)
assert.equal(reserved.safetyFlags.requiredHoldUsesMaximumEstimate, true)
assert.equal(reserved.safetyFlags.walletMutated, true)
assert.equal(reserved.safetyFlags.reservationMutated, true)
assert.equal(reserved.safetyFlags.creditsSpent, false)
assert.equal(reserved.safetyFlags.ledgerWritten, false)
assert.equal(reserved.safetyFlags.settlementExecuted, false)
assert.equal(reserved.safetyFlags.providerCalled, false)
assert.equal(reserved.safetyFlags.workerRun, false)
assert.equal(reserved.safetyFlags.renderOrExportStarted, false)
assert.equal(reserved.safetyFlags.checkoutOrTopUpStarted, false)
assert.equal(reserved.safetyFlags.supabaseWritten, false)
assert.equal(reserved.reservationLineItems.length, 2)
assert.equal(sum(reserved.reservationLineItems.map((line) => line.reservedCredits)), 200)
assert.equal(
  reserved.reservationLineItems.find((line) => line.usageCategory === 'graphic_design')?.reservedCredits,
  160,
)
assert.equal(
  reserved.reservationLineItems.find((line) => line.usageCategory === 'admin')?.reservedCredits,
  40,
)
assert.deepEqual(nonReservationSideEffects(reservationStore), {
  ledgers: 0,
  settlements: 0,
  exports: 0,
  checkouts: 0,
  providers: 0,
  workers: 0,
  renders: 0,
})

const duplicate = reserveMaxEstimateCredits(reservationStore, estimateStore, validRequest)
assert.equal(duplicate.status, 'already_reserved')
assert.equal(duplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicate.reservation?.id, reserved.reservation?.id)
assert.equal(getMockCreditWalletBalance(reservationStore, wallet.id)?.availableCredits, 50)
assert.deepEqual(mutationCounts(reservationStore), {
  ...beforeReserveMutationCounts,
  wallets: beforeReserveMutationCounts.wallets + 1,
  reservations: beforeReserveMutationCounts.reservations + 1,
})

const insufficientStore = createMockCreditReservationStore()
const insufficientWallet = getOrCreateMockCreditWallet(insufficientStore, {
  workspaceId,
  userId: approvedByUserId,
})
assert.ok(insufficientWallet)
grantMockCredits(insufficientStore, {
  creditWalletId: insufficientWallet.id,
  amount: 50,
  sourceType: 'admin',
})
const insufficientBefore = mutationCounts(insufficientStore)
const insufficient = reserveMaxEstimateCredits(insufficientStore, estimateStore, {
  ...validRequest,
  creditWalletId: insufficientWallet.id,
  idempotencyKey: 'credit-reservation-smoke-insufficient',
})
assert.equal(insufficient.status, 'insufficient_credits')
assert.equal(insufficient.requiredHoldCredits, 200)
assert.equal(insufficient.requiredTopUpCredits, 150)
assert.equal(insufficient.safetyFlags.walletMutated, false)
assert.equal(insufficient.safetyFlags.reservationMutated, false)
assert.equal(getMockCreditWalletBalance(insufficientStore, insufficientWallet.id)?.availableCredits, 50)
assert.deepEqual(mutationCounts(insufficientStore), insufficientBefore)

const notFound = reserveMaxEstimateCredits(reservationStore, estimateStore, {
  ...validRequest,
  creditEstimateId: 'missing-estimate',
  idempotencyKey: 'credit-reservation-smoke-missing',
})
assert.equal(notFound.status, 'estimate_not_found')
assert.equal(notFound.safetyFlags.walletMutated, false)

const notApprovedPreview = insertEditCreditEstimatePreview(estimateStore, createPreview('credit-estimate-not-approved'))
const notApproved = reserveMaxEstimateCredits(reservationStore, estimateStore, {
  ...validRequest,
  creditEstimateId: notApprovedPreview.estimate.id,
  creditApprovalId: undefined,
  idempotencyKey: 'credit-reservation-smoke-not-approved',
})
assert.equal(notApproved.status, 'estimate_not_approved')
assert.equal(notApproved.safetyFlags.reservationMutated, false)

const expiredPreview = insertEditCreditEstimatePreview(estimateStore, createPreview('credit-estimate-expired', {
  expiresAt: '2020-01-01T00:00:00.000Z',
}))
const expired = reserveMaxEstimateCredits(reservationStore, estimateStore, {
  ...validRequest,
  creditEstimateId: expiredPreview.estimate.id,
  idempotencyKey: 'credit-reservation-smoke-expired',
})
assert.equal(expired.status, 'estimate_expired')

const blockedPreview = insertEditCreditEstimatePreview(estimateStore, createPreview('credit-estimate-custom-blocked', {
  readinessStatus: 'custom_estimate_required',
  canProceedToReservation: false,
  customEstimateRequired: true,
}))
const blocked = reserveMaxEstimateCredits(reservationStore, estimateStore, {
  ...validRequest,
  creditEstimateId: blockedPreview.estimate.id,
  idempotencyKey: 'credit-reservation-smoke-custom-blocked',
})
assert.equal(blocked.status, 'invalid_request')
assert.ok(blocked.warnings.some((warning) => warning.includes('Readiness status')))

const missingWallet = reserveMaxEstimateCredits(reservationStore, estimateStore, {
  ...validRequest,
  creditWalletId: 'missing-wallet',
  idempotencyKey: 'credit-reservation-smoke-wallet-missing',
})
assert.equal(missingWallet.status, 'wallet_not_found')
assert.equal(missingWallet.safetyFlags.walletMutated, false)

const runtimeScenario = prepareMockCreditRuntimeScenario()
assert.equal(
  runtimeScenario.reservation?.reservedCredits,
  runtimeScenario.creditEstimate?.maximumEstimatedCredits,
  'Runtime mock reservation must reserve maximumEstimatedCredits.',
)

const db = createMockDatabase()
const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({}, db))
const legacyWallet = unwrapServiceResult(createCreditWallet(db, planningState.project.workspaceId, MOCK_USER_ID))
unwrapServiceResult(grantWeeklyBonusCredits(db, legacyWallet.id, 100))
const approval = unwrapServiceResult(approveCreditEstimate(db, {
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  creditEstimateId: planningState.creditEstimate.id,
  approvedByUserId: MOCK_USER_ID,
}))
const ledgerBeforeLegacyReservation = db.creditLedgerEntries.length
const legacyReservation = unwrapServiceResult(reserveCredits(db, {
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  creditWalletId: legacyWallet.id,
  creditEstimateId: planningState.creditEstimate.id,
  creditApprovalId: approval.id,
}))
assert.equal(legacyReservation.reservedCredits, planningState.creditEstimate.maximumEstimatedCredits)
assert.equal(
  db.creditLedgerEntries.length,
  ledgerBeforeLegacyReservation,
  'Legacy mock reservation must not add a reservation ledger entry.',
)

const docsText = [
  'docs/credit-reservation-max-estimate.md',
  'docs/credit-policy.md',
  'docs/edit-credit-estimate-preview.md',
  'credit-ledger-architecture.md',
  'package.json',
].map(readRepoFile).join('\n')

for (const phrase of [
  'RP-RESERVATION-01',
  'maximumEstimatedCredits',
  'requiredHoldCredits',
  'not totalEstimatedCredits',
  'no live billing',
  'no Stripe',
  'no Supabase',
  'no provider',
  'no render/export',
  'no checkout/top-up',
  'smoke:credit-reservation',
]) {
  assert.ok(docsText.includes(phrase), `Docs/package metadata must include: ${phrase}`)
}

console.log('RP-RESERVATION-01 credit reservation smoke passed.')

function createPreview(
  creditEstimateId: string,
  overrides: {
    readinessStatus?: EditCreditEstimatePreview['summary']['readinessStatus']
    canProceedToReservation?: boolean
    customEstimateRequired?: boolean
    expiresAt?: string
  } = {},
): EditCreditEstimatePreview {
  const createdAt = '2026-06-29T12:00:00.000Z'
  const lineItems = createEstimateLineItems(creditEstimateId, createdAt)
  const estimate: CreditEstimateRecord = {
    id: creditEstimateId,
    workspaceId,
    projectId,
    editPlanId,
    status: 'ready',
    totalEstimatedCredits: 140,
    minimumEstimatedCredits: 100,
    maximumEstimatedCredits: 200,
    availableCreditsSnapshot: 250,
    reservedCreditsSnapshot: 0,
    weeklyBonusCreditsSnapshot: 0,
    estimateReason: 'credit_reservation_smoke',
    estimatePayload: {
      milestone: 'RP-ESTIMATE-01',
      estimateOnly: true,
      topUpSummary: {
        requiredHoldCredits: 200,
      },
    },
    expiresAt: overrides.expiresAt,
    createdByAgent: 'credit-reservation-smoke',
    lineItems,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      noWalletMutation: true,
      noReservationMutation: true,
    },
  }
  const readinessStatus = overrides.readinessStatus ?? 'ready_for_reservation'
  const canProceedToReservation = overrides.canProceedToReservation ?? true
  const customEstimateRequired = overrides.customEstimateRequired ?? false
  return {
    estimate,
    summary: {
      workspaceId,
      projectId,
      editPlanId,
      productEditLevel: 'premium',
      finalVideoDurationSeconds: 240,
      plannedToolCount: 1,
      lowToolCostCredits: 70,
      expectedToolCostCredits: 110,
      highToolCostCredits: 160,
      lowServiceFeeCredits: 30,
      expectedServiceFeeCredits: 30,
      highServiceFeeCredits: 40,
      minimumEstimatedCredits: 100,
      totalEstimatedCredits: 140,
      maximumEstimatedCredits: 200,
      requiredHoldCredits: 200,
      requiredTopUpCredits: 0,
      canProceedToReservation,
      customEstimateRequired,
      readinessStatus,
      userFacingLines: [
        {
          label: 'Required hold',
          credits: 200,
          description: 'Future reservation would hold the high estimate, not the expected estimate.',
        },
      ],
    },
    toolEstimates: [],
    serviceFeeEstimate: {
      lowToolCostCredits: 70,
      expectedToolCostCredits: 110,
      highToolCostCredits: 160,
      lowServiceFeeCredits: 30,
      expectedServiceFeeCredits: 30,
      highServiceFeeCredits: 40,
      customEstimateRequired,
      durationBucket: 'under_5_min',
      creditPolicyVersion: 'credit-policy-smoke',
      serviceFeePolicyVersion: 'service-fee-smoke',
      finalChargeFormula: 'actual tool cost + ReEditPro service fee',
    },
    topUpSummary: {
      availableCreditsSnapshot: 250,
      reservedCreditsSnapshot: 0,
      weeklyBonusCreditsSnapshot: 0,
      requiredHoldCredits: 200,
      requiredTopUpCredits: 0,
      canProceedToReservation,
      readinessStatus,
    },
    lowerCostOptions: [],
    safetyFlags: {
      estimateOnly: true,
      creditsReservedOrSpent: false,
      walletMutated: false,
      reservationMutated: false,
      ledgerWritten: false,
      providerCalled: false,
      workerRun: false,
      renderOrExportStarted: false,
      supabaseWritten: false,
      serviceFeeIncludedInToolCosts: false,
    },
    idempotencyStatus: 'created',
    warnings: ['Mock estimate preview for credit reservation smoke.'],
  }
}

function createEstimateLineItems(
  creditEstimateId: string,
  createdAt: string,
): CreditEstimateLineItemRecord[] {
  return [
    {
      id: `${creditEstimateId}-tool-line`,
      creditEstimateId,
      workspaceId,
      projectId,
      editPlanId,
      lineItemType: 'graphic_design',
      usageCategory: 'graphic_design',
      label: 'Visual polish',
      estimatedCredits: 110,
      isOptional: false,
      isPremium: true,
      requiresUserApproval: true,
      linePayload: {
        lineItemRole: 'production_tool_estimate',
        toolId: 'visual-polish-smoke',
        expectedCredits: 110,
        highCredits: 160,
        serviceFeeIncluded: false,
      },
      createdAt,
    },
    {
      id: `${creditEstimateId}-service-fee-line`,
      creditEstimateId,
      workspaceId,
      projectId,
      editPlanId,
      lineItemType: 'other',
      usageCategory: 'admin',
      label: 'ReEditPro service/edit fee',
      estimatedCredits: 30,
      isOptional: false,
      isPremium: true,
      requiresUserApproval: true,
      linePayload: {
        lineItemRole: 'reeditpro_service_fee',
        serviceFeeIncluded: true,
        toolCostsIncludeServiceFee: false,
        serviceFeeEstimate: {
          expectedServiceFeeCredits: 30,
          highServiceFeeCredits: 40,
        },
      },
      createdAt,
    },
  ]
}

function mutationCounts(store: ReturnType<typeof createMockCreditReservationStore>) {
  return {
    wallets: store.walletMutationRecords.length,
    reservations: store.reservationMutationRecords.length,
  }
}

function nonReservationSideEffects(store: ReturnType<typeof createMockCreditReservationStore>) {
  return {
    ledgers: store.ledgerMutationRecords.length,
    settlements: store.settlementMutationRecords.length,
    exports: store.exportUnlockRecords.length,
    checkouts: store.checkoutOrTopUpRecords.length,
    providers: store.providerCallRecords.length,
    workers: store.workerRunRecords.length,
    renders: store.renderExportRecords.length,
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
