import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditCreditEstimatePreview,
  SettleCreditReservationRequest,
} from '../../src/types'
import {
  createMockCreditDataStore,
  settleCreditReservation,
} from '../services/mock-credit-data-store'
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
import {
  createMockToolCostEvent,
  insertMockToolCostEvent,
} from '../tool-cost-metering/mock-tool-cost-store'
import {
  creditSettlementRecordSchema,
  settleCreditReservationSchema,
} from '../validation/credit-data-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

const normal = createSettlementScenario('normal', 120)
const normalBefore = balances(normal)
const normalSettled = settleCreditReservation(
  normal.creditDataStore,
  normal.reservationStore,
  normal.estimateStore,
  settleRequest(normal, 'credit-settlement-normal'),
)
assert.equal(normalSettled.status, 'settled')
assert.equal(normalSettled.idempotencyStatus, 'created')
assert.equal(normalSettled.settlement?.actualToolCostCredits, 120)
assert.equal(normalSettled.settlement?.reeditproServiceFeeCredits, 40)
assert.equal(normalSettled.settlement?.finalChargeCredits, 160)
assert.equal(normalSettled.settlement?.releasedCredits, 40)
assert.equal(normalSettled.settlement?.absorbedOverageCredits, 0)
assert.equal(normalSettled.settlement?.outstandingCredits, 0)
assert.equal(normalSettled.walletBalance?.availableCredits, normalBefore.availableCredits + 40)
assert.equal(normalSettled.walletBalance?.reservedCredits, normalBefore.reservedCredits - 200)
assert.equal(normalSettled.walletBalance?.spentCredits, normalBefore.spentCredits + 160)
assert.equal(normalSettled.reservation?.status, 'spent')
assert.equal(normalSettled.reservation?.spentCredits, 160)
assert.equal(normalSettled.reservation?.releasedCredits, 40)
assert.equal(normalSettled.safetyFlags.walletMutated, true)
assert.equal(normalSettled.safetyFlags.reservationMutated, true)
assert.equal(normalSettled.safetyFlags.creditsSpent, true)
assert.equal(normalSettled.safetyFlags.creditsReleased, true)
assert.equal(normalSettled.safetyFlags.ledgerWritten, false)
assert.equal(normalSettled.safetyFlags.providerCalled, false)
assert.equal(normalSettled.safetyFlags.renderOrExportStarted, false)
assert.equal(normalSettled.safetyFlags.exportUnlocked, false)
assert.equal(normalSettled.safetyFlags.checkoutOrTopUpStarted, false)
assert.equal(normalSettled.summary?.userFacingLines.some((line) => line.label === 'Actual tool cost'), true)
assert.equal(normalSettled.summary?.userFacingLines.some((line) => line.label === 'ReEditPro service fee'), true)
assert.equal(normalSettled.summary?.userFacingLines.some((line) => line.label === 'Final charge'), true)
assert.equal(normalSettled.summary?.userFacingLines.some((line) => line.label === 'Returned'), true)
assertLineReconciliation(normalSettled.reservationLineItems, 160, 40)

const duplicate = settleCreditReservation(
  normal.creditDataStore,
  normal.reservationStore,
  normal.estimateStore,
  settleRequest(normal, 'credit-settlement-normal'),
)
assert.equal(duplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicate.settlement?.id, normalSettled.settlement?.id)
assert.deepEqual(balances(normal), {
  availableCredits: normalBefore.availableCredits + 40,
  reservedCredits: normalBefore.reservedCredits - 200,
  spentCredits: normalBefore.spentCredits + 160,
  refundedCredits: normalBefore.refundedCredits,
})

const alreadySettled = settleCreditReservation(
  normal.creditDataStore,
  normal.reservationStore,
  normal.estimateStore,
  settleRequest(normal, 'credit-settlement-normal-new-key'),
)
assert.equal(alreadySettled.status, 'already_settled')
assert.equal(alreadySettled.idempotencyStatus, 'duplicate_returned')

const noRelease = createSettlementScenario('no-release', 160)
const noReleaseSettled = settleCreditReservation(
  noRelease.creditDataStore,
  noRelease.reservationStore,
  noRelease.estimateStore,
  settleRequest(noRelease, 'credit-settlement-no-release'),
)
assert.equal(noReleaseSettled.status, 'settled')
assert.equal(noReleaseSettled.settlement?.finalChargeCredits, 200)
assert.equal(noReleaseSettled.settlement?.releasedCredits, 0)
assert.equal(noReleaseSettled.walletBalance?.spentCredits, 200)
assertLineReconciliation(noReleaseSettled.reservationLineItems, 200, 0)

const absorbed = createSettlementScenario('absorbed', 190)
const absorbedSettled = settleCreditReservation(
  absorbed.creditDataStore,
  absorbed.reservationStore,
  absorbed.estimateStore,
  settleRequest(absorbed, 'credit-settlement-absorbed', 'force_absorb_unapproved_overage'),
)
assert.equal(absorbedSettled.status, 'settled_with_absorbed_overage')
assert.equal(absorbedSettled.settlement?.finalChargeCredits, 200)
assert.equal(absorbedSettled.settlement?.absorbedOverageCredits, 30)
assert.equal(absorbedSettled.settlement?.outstandingCredits, 0)
assert.equal(absorbedSettled.walletBalance?.availableCredits, 300)
assert.equal(absorbedSettled.walletBalance?.spentCredits, 200)
assert.equal(absorbedSettled.summary?.userFacingLines.some((line) => line.label === 'ReEditPro absorbed' && line.credits === 30), true)
assert.equal(creditSettlementRecordSchema.safeParse(absorbedSettled.settlement).success, true)

const topUp = createSettlementScenario('top-up', 190)
const topUpBefore = balances(topUp)
const topUpResult = settleCreditReservation(
  topUp.creditDataStore,
  topUp.reservationStore,
  topUp.estimateStore,
  settleRequest(topUp, 'credit-settlement-top-up', 'approved_but_unfunded'),
)
assert.equal(topUpResult.status, 'requires_top_up_before_export')
assert.equal(topUpResult.settlement?.finalChargeCredits, 230)
assert.equal(topUpResult.settlement?.outstandingCredits, 30)
assert.equal(topUpResult.settlement?.releasedCredits, 0)
assert.equal(topUpResult.safetyFlags.walletMutated, false)
assert.equal(topUpResult.safetyFlags.reservationMutated, false)
assert.equal(topUpResult.safetyFlags.exportUnlocked, false)
assert.deepEqual(balances(topUp), topUpBefore)
assert.equal(topUp.reservation.status, 'reserved')
assert.ok(topUpResult.userFacingMessage.includes('Add credits'))

const nonBillable = createSettlementScenario('non-billable', 120, { nonBillableCredits: 25 })
const nonBillableSettled = settleCreditReservation(
  nonBillable.creditDataStore,
  nonBillable.reservationStore,
  nonBillable.estimateStore,
  settleRequest(nonBillable, 'credit-settlement-non-billable'),
)
assert.equal(nonBillableSettled.settlement?.actualToolCostCredits, 120)
assert.equal(nonBillableSettled.summary?.nonBillableAbsorbed?.credits, 25)
assert.equal(nonBillableSettled.summary?.nonBillableAbsorbed?.eventCount, 1)
assert.equal(nonBillableSettled.settlement?.nonBillableToolEventCount, 1)

const invalidServiceFee = createSettlementScenario('invalid-service-fee', 120)
const invalidEvent = createMockToolCostEvent({
  id: 'tool-cost-invalid-service-fee',
  workspaceId: invalidServiceFee.workspaceId,
  projectId: invalidServiceFee.projectId,
  creditEstimateId: invalidServiceFee.preview.estimate.id,
  creditReservationId: invalidServiceFee.reservation.id,
  label: 'Invalid service fee event',
  usageCategory: 'graphic_design',
  actualInternalCostCents: 10,
})
;(invalidEvent as unknown as { serviceFeeIncluded: boolean }).serviceFeeIncluded = true
insertMockToolCostEvent(invalidServiceFee.creditDataStore.toolCostStore, invalidEvent)
const invalidServiceFeeResult = settleCreditReservation(
  invalidServiceFee.creditDataStore,
  invalidServiceFee.reservationStore,
  invalidServiceFee.estimateStore,
  settleRequest(invalidServiceFee, 'credit-settlement-invalid-service-fee'),
)
assert.equal(invalidServiceFeeResult.status, 'invalid_request')
assert.equal(invalidServiceFeeResult.safetyFlags.walletMutated, false)

const missingEstimate = createSettlementScenario('missing-estimate', 120)
missingEstimate.estimateStore.previews.length = 0
assert.equal(
  settleCreditReservation(missingEstimate.creditDataStore, missingEstimate.reservationStore, missingEstimate.estimateStore, settleRequest(missingEstimate, 'credit-settlement-missing-estimate')).status,
  'estimate_not_found',
)

const inactive = createSettlementScenario('inactive', 120)
inactive.reservation.status = 'partially_spent'
assert.equal(
  settleCreditReservation(inactive.creditDataStore, inactive.reservationStore, inactive.estimateStore, settleRequest(inactive, 'credit-settlement-inactive')).status,
  'reservation_not_active',
)

assert.equal(settleCreditReservationSchema.safeParse(settleRequest(normal, 'schema-valid')).success, true)
assert.equal(settleCreditReservationSchema.safeParse({
  ...settleRequest(normal, 'schema-missing-idempotency'),
  idempotencyKey: '',
}).success, false)
assert.equal(settleCreditReservationSchema.safeParse({
  ...settleRequest(normal, 'schema-invalid-level'),
  productEditLevel: 'standard',
}).success, false)
assert.equal(settleCreditReservationSchema.safeParse({
  ...settleRequest(normal, 'schema-negative-duration'),
  finalVideoDurationSeconds: -1,
}).success, false)
assert.equal(settleCreditReservationSchema.safeParse({
  ...settleRequest(normal, 'schema-secret'),
  metadata: { providerApiKey: 'sk-not-real-but-secret-shaped' },
}).success, false)

assert.deepEqual(nonAllowedSideEffects(normal.reservationStore), {
  ledgers: 0,
  settlements: 0,
  exports: 0,
  checkouts: 0,
  providers: 0,
  workers: 0,
  renders: 0,
})
assert.deepEqual(nonAllowedCreditDataSideEffects(normal.creditDataStore), {
  ledgers: 0,
  exports: 0,
  jobs: 0,
})

const docsText = [
  'README.md',
  'AGENTS.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'credit-ledger-architecture.md',
  'docs/credit-policy.md',
  'docs/credit-reservation-max-estimate.md',
  'docs/runtime-credit-guard.md',
  'docs/credit-revision-action-resolution.md',
  'docs/credit-settlement-finalization.md',
  'package.json',
].map(readRepoFile).join('\n')

for (const phrase of [
  'RP-SETTLEMENT-01',
  'smoke:credit-settlement',
  'final credit settlement',
  'release unused',
  'absorbed overage',
  'no live billing',
  'no Stripe',
  'no Supabase',
  'no provider',
  'no render/export',
  'no checkout/top-up',
]) {
  assert.ok(docsText.includes(phrase), `Docs/package metadata must include ${phrase}.`)
}

console.log('credit settlement smoke passed')

interface SettlementScenario {
  workspaceId: string
  projectId: string
  editPlanId: string
  userId: string
  estimateStore: ReturnType<typeof createMockCreditEstimateStore>
  reservationStore: ReturnType<typeof createMockCreditReservationStore>
  creditDataStore: ReturnType<typeof createMockCreditDataStore>
  preview: EditCreditEstimatePreview
  reservation: CreditReservationRecord
  walletId: string
}

function createSettlementScenario(
  suffix: string,
  billableToolCredits: number,
  options: { nonBillableCredits?: number } = {},
): SettlementScenario {
  const workspaceId = `workspace-credit-settlement-${suffix}`
  const projectId = `project-credit-settlement-${suffix}`
  const editPlanId = `edit-plan-credit-settlement-${suffix}`
  const userId = `user-credit-settlement-${suffix}`
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  const preview = insertEditCreditEstimatePreview(
    estimateStore,
    createPreview({
      workspaceId,
      projectId,
      editPlanId,
      creditEstimateId: `credit-estimate-settlement-${suffix}`,
    }),
  )
  const wallet = getOrCreateMockCreditWallet(reservationStore, {
    workspaceId,
    userId,
  })
  assert.ok(wallet)
  grantMockCredits(reservationStore, {
    creditWalletId: wallet.id,
    amount: 500,
    sourceType: 'admin',
    userId,
  })
  const reserved = reserveMaxEstimateCredits(reservationStore, estimateStore, {
    workspaceId,
    projectId,
    editPlanId,
    creditWalletId: wallet.id,
    creditEstimateId: preview.estimate.id,
    creditApprovalId: `credit-approval-settlement-${suffix}`,
    approvedByUserId: userId,
    idempotencyKey: `credit-reservation-settlement-${suffix}`,
  })
  assert.equal(reserved.status, 'reserved')
  assert.ok(reserved.reservation)

  insertMockToolCostEvent(creditDataStore.toolCostStore, createMockToolCostEvent({
    id: `tool-cost-settlement-billable-${suffix}`,
    workspaceId,
    projectId,
    creditEstimateId: preview.estimate.id,
    creditReservationId: reserved.reservation.id,
    label: 'Billable final edit tool cost',
    usageCategory: 'graphic_design',
    actualInternalCostCents: billableToolCredits * 10,
    billableToUser: true,
    idempotencyKey: `tool-cost-settlement-billable-${suffix}`,
  }))

  if (options.nonBillableCredits) {
    insertMockToolCostEvent(creditDataStore.toolCostStore, createMockToolCostEvent({
      id: `tool-cost-settlement-nonbillable-${suffix}`,
      workspaceId,
      projectId,
      creditEstimateId: preview.estimate.id,
      creditReservationId: reserved.reservation.id,
      label: 'Non-billable absorbed provider variance',
      usageCategory: 'graphic_design',
      actualInternalCostCents: options.nonBillableCredits * 10,
      billableToUser: false,
      nonBillableReason: 'provider_variance_absorbed',
      idempotencyKey: `tool-cost-settlement-nonbillable-${suffix}`,
    }))
  }

  return {
    workspaceId,
    projectId,
    editPlanId,
    userId,
    estimateStore,
    reservationStore,
    creditDataStore,
    preview,
    reservation: reserved.reservation,
    walletId: wallet.id,
  }
}

function settleRequest(
  scenario: SettlementScenario,
  idempotencyKey: string,
  settlementMode: SettleCreditReservationRequest['settlementMode'] = 'completed_edit',
): SettleCreditReservationRequest {
  return {
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    creditEstimateId: scenario.preview.estimate.id,
    creditReservationId: scenario.reservation.id,
    settledByUserId: scenario.userId,
    settledByAgent: 'credit-settlement-smoke',
    productEditLevel: 'normal',
    finalVideoDurationSeconds: 600,
    settlementMode,
    idempotencyKey,
    metadata: { smoke: true, scenario: scenario.projectId },
  }
}

function createPreview(input: {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditEstimateId: string
}): EditCreditEstimatePreview {
  const createdAt = '2026-07-01T00:00:00.000Z'
  const estimate: CreditEstimateRecord = {
    id: input.creditEstimateId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    status: 'approved',
    totalEstimatedCredits: 150,
    minimumEstimatedCredits: 100,
    maximumEstimatedCredits: 200,
    estimateReason: 'Mock settlement smoke estimate.',
    estimatePayload: {
      mockOnly: true,
      requiredHoldCredits: 200,
    },
    approvedAt: createdAt,
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt,
    updatedAt: createdAt,
    lineItems: createEstimateLineItems(input, createdAt),
    metadata: {
      mockOnly: true,
    },
  }
  return {
    estimate,
    summary: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      productEditLevel: 'normal',
      finalVideoDurationSeconds: 600,
      plannedToolCount: 1,
      lowToolCostCredits: 80,
      expectedToolCostCredits: 110,
      highToolCostCredits: 160,
      lowServiceFeeCredits: 40,
      expectedServiceFeeCredits: 40,
      highServiceFeeCredits: 40,
      minimumEstimatedCredits: 120,
      totalEstimatedCredits: 150,
      maximumEstimatedCredits: 200,
      requiredHoldCredits: 200,
      requiredTopUpCredits: 0,
      canProceedToReservation: true,
      customEstimateRequired: false,
      readinessStatus: 'ready_for_reservation',
      userFacingLines: [
        {
          label: 'Required hold',
          credits: 200,
          description: 'Mock settlement holds maximumEstimatedCredits.',
        },
      ],
    },
    toolEstimates: [],
    serviceFeeEstimate: {
      lowToolCostCredits: 80,
      expectedToolCostCredits: 110,
      highToolCostCredits: 160,
      lowServiceFeeCredits: 40,
      expectedServiceFeeCredits: 40,
      highServiceFeeCredits: 40,
      customEstimateRequired: false,
      durationBucket: '5_10_min',
      creditPolicyVersion: 'rp-creditpolicy-01',
      serviceFeePolicyVersion: 'rp-creditpolicy-01-service-fee',
      finalChargeFormula: 'actual_billable_tool_cost_credits + reeditpro_service_fee_credits',
    },
    topUpSummary: {
      availableCreditsSnapshot: 500,
      reservedCreditsSnapshot: 0,
      weeklyBonusCreditsSnapshot: 0,
      requiredHoldCredits: 200,
      requiredTopUpCredits: 0,
      canProceedToReservation: true,
      readinessStatus: 'ready_for_reservation',
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
    warnings: ['Mock estimate preview for credit settlement smoke.'],
  }
}

function createEstimateLineItems(
  input: {
    workspaceId: string
    projectId: string
    editPlanId: string
    creditEstimateId: string
  },
  createdAt: string,
): CreditEstimateLineItemRecord[] {
  return [
    {
      id: `${input.creditEstimateId}-tool-line`,
      creditEstimateId: input.creditEstimateId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      lineItemType: 'graphic_design',
      usageCategory: 'graphic_design',
      label: 'Visual polish',
      estimatedCredits: 110,
      isOptional: false,
      isPremium: false,
      requiresUserApproval: true,
      linePayload: {
        lineItemRole: 'production_tool_estimate',
        toolId: 'visual-polish-settlement-smoke',
        expectedCredits: 110,
        highCredits: 160,
        serviceFeeIncluded: false,
      },
      createdAt,
    },
    {
      id: `${input.creditEstimateId}-service-fee-line`,
      creditEstimateId: input.creditEstimateId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      lineItemType: 'other',
      usageCategory: 'admin',
      label: 'ReEditPro service/edit fee',
      estimatedCredits: 40,
      isOptional: false,
      isPremium: false,
      requiresUserApproval: true,
      linePayload: {
        lineItemRole: 'reeditpro_service_fee',
        serviceFeeIncluded: true,
        toolCostsIncludeServiceFee: false,
        serviceFeeEstimate: {
          expectedServiceFeeCredits: 40,
          highServiceFeeCredits: 40,
        },
      },
      createdAt,
    },
  ]
}

function balances(scenario: SettlementScenario) {
  const balance = getMockCreditWalletBalance(scenario.reservationStore, scenario.walletId)
  assert.ok(balance)
  return {
    availableCredits: balance.availableCredits,
    reservedCredits: balance.reservedCredits,
    spentCredits: balance.spentCredits,
    refundedCredits: balance.refundedCredits,
  }
}

function assertLineReconciliation(
  lineItems: readonly { reservedCredits: number; spentCredits: number; releasedCredits: number; refundedCredits: number }[],
  spentCredits: number,
  releasedCredits: number,
): void {
  assert.equal(sum(lineItems.map((line) => line.spentCredits)), spentCredits)
  assert.equal(sum(lineItems.map((line) => line.releasedCredits)), releasedCredits)
  for (const line of lineItems) {
    assert.ok(line.spentCredits + line.releasedCredits + line.refundedCredits <= line.reservedCredits)
  }
}

function nonAllowedSideEffects(store: ReturnType<typeof createMockCreditReservationStore>) {
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

function nonAllowedCreditDataSideEffects(store: ReturnType<typeof createMockCreditDataStore>) {
  return {
    ledgers: store.ledgerMutationRecords.length,
    exports: store.exportUnlockRecords.length,
    jobs: store.jobEnqueueRecords.length,
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
