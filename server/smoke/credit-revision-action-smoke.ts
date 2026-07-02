import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { CreditReservationRecord, PreviewEditCreditEstimateRequest } from '../../src/types'
import {
  approveCreditRevisionAction,
  cancelCreditRevisionAction,
  chooseLowerCostCreditRevisionOption,
  createMockCreditDataStore,
  type MockCreditDataStore,
} from '../services/mock-credit-data-store'
import {
  buildEditCreditEstimatePreview,
  createMockCreditEstimateStore,
  insertEditCreditEstimatePreview,
  type MockCreditEstimateStore,
} from '../services/mock-credit-estimate-store'
import {
  createMockCreditReservationStore,
  getMockCreditWalletBalance,
  getOrCreateMockCreditWallet,
  grantMockCredits,
  reserveMaxEstimateCredits,
  type MockCreditReservationStore,
} from '../services/mock-credit-reservation-store'
import {
  evaluatePaidToolRuntimeGuard,
  type RuntimeCreditGuardResult,
} from '../services/runtime-credit-guard-service'
import { createMockToolCostEvent, insertMockToolCostEvent } from '../tool-cost-metering'
import type { ProductionToolId } from '../tool-registry'
import {
  approveCreditRevisionActionSchema,
  cancelCreditRevisionActionSchema,
  chooseLowerCostCreditRevisionOptionSchema,
} from '../validation/credit-data-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

const approveScenario = createOverageScenario('approve', 'opentimelineio', 1_000)
const approveBefore = mutationCounts(approveScenario.reservationStore)
const approveResult = approveCreditRevisionAction(
  approveScenario.creditDataStore,
  approveScenario.reservationStore,
  {
    workspaceId: approveScenario.workspaceId,
    projectId: approveScenario.projectId,
    creditRevisionActionId: approveScenario.overage.revisionAction?.id ?? '',
    creditReservationId: approveScenario.reservation.id,
    approvedByUserId: approveScenario.userId,
    idempotencyKey: 'credit-revision-approve-resolution',
    metadata: { smoke: 'approve' },
  },
)
assert.equal(approveResult.status, 'approved')
assert.equal(approveResult.action?.status, 'approved')
assert.equal(approveResult.action?.selectedOptionId, 'approve-and-continue')
assert.equal(approveResult.requiresRuntimeGuardRecheck, true)
assert.equal(approveResult.paidWorkStarted, false)
assert.equal(approveResult.safetyFlags.paidWorkStarted, false)
assert.equal(approveResult.safetyFlags.creditsSpent, false)
assert.equal(approveResult.safetyFlags.ledgerWritten, false)
assert.equal(approveResult.safetyFlags.providerCalled, false)
assert.equal(approveResult.safetyFlags.renderOrExportStarted, false)
assert.equal(approveResult.safetyFlags.supabaseWritten, false)
assert.ok(approveResult.additionalHoldCredits > 0)
assert.equal(
  approveResult.additionalHoldCredits,
  (approveScenario.overage.revisionAction?.newMaximumEstimatedCredits ?? 0) - approveScenario.overage.revisionAction!.approvedMaxCredits,
)
assert.equal(approveResult.reservation?.reservedCredits, approveScenario.overage.revisionAction?.newMaximumEstimatedCredits)
assert.equal(
  sum(approveResult.reservationLineItems.map((line) => line.reservedCredits)),
  approveResult.reservation?.reservedCredits,
)
assert.equal(
  approveResult.reservationLineItems.some((line) =>
    line.usageCategory === 'revision' &&
    line.linePayload?.lineItemRole === 'revised_credit_additional_hold'),
  true,
)
assert.deepEqual(nonAllowedReservationSideEffects(approveScenario.reservationStore), {
  ledgers: 0,
  settlements: 0,
  exports: 0,
  checkouts: 0,
  providers: 0,
  workers: 0,
  renders: 0,
})

const duplicateApprove = approveCreditRevisionAction(
  approveScenario.creditDataStore,
  approveScenario.reservationStore,
  {
    workspaceId: approveScenario.workspaceId,
    projectId: approveScenario.projectId,
    creditRevisionActionId: approveScenario.overage.revisionAction?.id ?? '',
    creditReservationId: approveScenario.reservation.id,
    approvedByUserId: approveScenario.userId,
    idempotencyKey: 'credit-revision-approve-resolution',
  },
)
assert.equal(duplicateApprove.status, 'already_resolved')
assert.equal(duplicateApprove.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicateApprove.additionalHoldCredits, 0)
assert.equal(mutationCounts(approveScenario.reservationStore).wallets, approveBefore.wallets + 1)
assert.equal(mutationCounts(approveScenario.reservationStore).reservations, approveBefore.reservations + 1)

const readyAfterApproval = evaluatePaidToolRuntimeGuard(guardInput(approveScenario, {
  idempotencyKey: 'runtime-credit-revision-approve',
}))
assert.equal(readyAfterApproval.canStart, true)
assert.equal(readyAfterApproval.status, 'ready')
assert.equal(readyAfterApproval.safetyFlags.workerRun, false)

const insufficientScenario = createOverageScenario('insufficient', 'opentimelineio', 0)
const insufficientBefore = {
  mutations: mutationCounts(insufficientScenario.reservationStore),
  walletBalance: getMockCreditWalletBalance(insufficientScenario.reservationStore, insufficientScenario.walletId),
  reservedCredits: insufficientScenario.reservation.reservedCredits,
  actionStatus: insufficientScenario.overage.revisionAction?.status,
}
const insufficient = approveCreditRevisionAction(
  insufficientScenario.creditDataStore,
  insufficientScenario.reservationStore,
  {
    workspaceId: insufficientScenario.workspaceId,
    projectId: insufficientScenario.projectId,
    creditRevisionActionId: insufficientScenario.overage.revisionAction?.id ?? '',
    creditReservationId: insufficientScenario.reservation.id,
    approvedByUserId: insufficientScenario.userId,
    idempotencyKey: 'credit-revision-insufficient',
  },
)
assert.equal(insufficient.status, 'insufficient_credits')
assert.equal(insufficient.action?.status, 'action_required')
assert.ok(insufficient.requiredTopUpCredits > 0)
assert.deepEqual(mutationCounts(insufficientScenario.reservationStore), insufficientBefore.mutations)
assert.deepEqual(getMockCreditWalletBalance(insufficientScenario.reservationStore, insufficientScenario.walletId), insufficientBefore.walletBalance)
assert.equal(insufficientScenario.reservation.reservedCredits, insufficientBefore.reservedCredits)
assert.equal(insufficientScenario.overage.revisionAction?.status, insufficientBefore.actionStatus)

const lowerScenario = createOverageScenario('lower', 'opentimelineio', 1_000)
const lower = chooseLowerCostCreditRevisionOption(lowerScenario.creditDataStore, {
  workspaceId: lowerScenario.workspaceId,
  projectId: lowerScenario.projectId,
  creditRevisionActionId: lowerScenario.overage.revisionAction?.id ?? '',
  selectedOptionId: 'choose-lower-cost-option',
  selectedByUserId: lowerScenario.userId,
  idempotencyKey: 'credit-revision-lower',
})
assert.equal(lower.status, 'lower_cost_selected')
assert.equal(lower.action?.status, 'lower_cost_selected')
assert.equal(lower.requiresNewEstimateOrPlan, true)
assert.equal(lower.safetyFlags.walletMutated, false)
assert.equal(lower.safetyFlags.reservationMutated, false)
const lowerReplay = chooseLowerCostCreditRevisionOption(lowerScenario.creditDataStore, {
  workspaceId: lowerScenario.workspaceId,
  projectId: lowerScenario.projectId,
  creditRevisionActionId: lowerScenario.overage.revisionAction?.id ?? '',
  selectedOptionId: 'choose-lower-cost-option',
  selectedByUserId: lowerScenario.userId,
  idempotencyKey: 'credit-revision-lower',
})
assert.equal(lowerReplay.status, 'already_resolved')
assert.equal(lowerReplay.idempotencyStatus, 'duplicate_returned')
const lowerGuard = evaluatePaidToolRuntimeGuard(guardInput(lowerScenario, {
  idempotencyKey: 'runtime-credit-revision-lower',
}))
assert.equal(lowerGuard.canStart, false)
assert.equal(lowerGuard.status, 'blocked_credit_revision_resolved')
assert.equal(lowerGuard.revisionAction?.status, 'lower_cost_selected')

const cancelScenario = createOverageScenario('cancel', 'opentimelineio', 1_000)
const cancel = cancelCreditRevisionAction(cancelScenario.creditDataStore, {
  workspaceId: cancelScenario.workspaceId,
  projectId: cancelScenario.projectId,
  creditRevisionActionId: cancelScenario.overage.revisionAction?.id ?? '',
  cancelledByUserId: cancelScenario.userId,
  cancellationReason: 'Smoke user cancelled extra work.',
  idempotencyKey: 'credit-revision-cancel',
})
assert.equal(cancel.status, 'cancelled')
assert.equal(cancel.action?.status, 'cancelled')
assert.equal(cancel.extraWorkCancelled, true)
assert.equal(cancel.reservation, null)
assert.equal(cancel.safetyFlags.creditsReserved, false)
const cancelGuard = evaluatePaidToolRuntimeGuard(guardInput(cancelScenario, {
  idempotencyKey: 'runtime-credit-revision-cancel',
}))
assert.equal(cancelGuard.canStart, false)
assert.equal(cancelGuard.status, 'blocked_credit_revision_resolved')
assert.equal(cancelGuard.revisionAction?.status, 'cancelled')

const invalidOption = chooseLowerCostCreditRevisionOption(createOverageScenario('invalid-option', 'opentimelineio', 100).creditDataStore, {
  workspaceId: 'workspace-credit-revision-invalid-option',
  projectId: 'project-credit-revision-invalid-option',
  creditRevisionActionId: 'missing-action',
  selectedOptionId: 'missing-option',
  selectedByUserId: 'credit-revision-user',
  idempotencyKey: 'credit-revision-invalid-option',
})
assert.equal(invalidOption.status, 'action_not_found')

const mismatch = approveCreditRevisionAction(approveScenario.creditDataStore, approveScenario.reservationStore, {
  workspaceId: 'wrong-workspace',
  projectId: approveScenario.projectId,
  creditRevisionActionId: approveScenario.overage.revisionAction?.id ?? '',
  creditReservationId: approveScenario.reservation.id,
  approvedByUserId: approveScenario.userId,
  idempotencyKey: 'credit-revision-mismatch',
})
assert.equal(mismatch.status, 'invalid_request')

const inactiveScenario = createOverageScenario('inactive', 'opentimelineio', 1_000)
inactiveScenario.reservation.status = 'partially_spent'
const inactive = approveCreditRevisionAction(inactiveScenario.creditDataStore, inactiveScenario.reservationStore, {
  workspaceId: inactiveScenario.workspaceId,
  projectId: inactiveScenario.projectId,
  creditRevisionActionId: inactiveScenario.overage.revisionAction?.id ?? '',
  creditReservationId: inactiveScenario.reservation.id,
  approvedByUserId: inactiveScenario.userId,
  idempotencyKey: 'credit-revision-inactive',
})
assert.equal(inactive.status, 'inactive_reservation')
assert.equal(inactive.action?.status, 'action_required')

const missingReservationScenario = createOverageScenario('missing-reservation', 'opentimelineio', 1_000)
missingReservationScenario.reservationStore.creditReservations.length = 0
const missingReservation = approveCreditRevisionAction(missingReservationScenario.creditDataStore, missingReservationScenario.reservationStore, {
  workspaceId: missingReservationScenario.workspaceId,
  projectId: missingReservationScenario.projectId,
  creditRevisionActionId: missingReservationScenario.overage.revisionAction?.id ?? '',
  creditReservationId: missingReservationScenario.reservation.id,
  approvedByUserId: missingReservationScenario.userId,
  idempotencyKey: 'credit-revision-missing-reservation',
})
assert.equal(missingReservation.status, 'reservation_not_found')

const expiredScenario = createOverageScenario('expired-action', 'opentimelineio', 1_000)
expiredScenario.overage.revisionAction!.status = 'expired'
const invalidState = approveCreditRevisionAction(expiredScenario.creditDataStore, expiredScenario.reservationStore, {
  workspaceId: expiredScenario.workspaceId,
  projectId: expiredScenario.projectId,
  creditRevisionActionId: expiredScenario.overage.revisionAction?.id ?? '',
  creditReservationId: expiredScenario.reservation.id,
  approvedByUserId: expiredScenario.userId,
  idempotencyKey: 'credit-revision-expired',
})
assert.equal(invalidState.status, 'invalid_action_state')

assert.equal(approveCreditRevisionActionSchema.safeParse({
  workspaceId: approveScenario.workspaceId,
  projectId: approveScenario.projectId,
  creditRevisionActionId: approveScenario.overage.revisionAction?.id,
  creditReservationId: approveScenario.reservation.id,
  approvedByUserId: approveScenario.userId,
  idempotencyKey: 'schema-approve',
  metadata: { apiKey: 'blocked' },
}).success, false)
assert.equal(chooseLowerCostCreditRevisionOptionSchema.safeParse({
  workspaceId: lowerScenario.workspaceId,
  projectId: lowerScenario.projectId,
  creditRevisionActionId: lowerScenario.overage.revisionAction?.id,
  selectedOptionId: 'choose-lower-cost-option',
  selectedByUserId: lowerScenario.userId,
  idempotencyKey: 'schema-lower',
}).success, true)
assert.equal(cancelCreditRevisionActionSchema.safeParse({
  workspaceId: cancelScenario.workspaceId,
  projectId: cancelScenario.projectId,
  creditRevisionActionId: cancelScenario.overage.revisionAction?.id,
  cancelledByUserId: cancelScenario.userId,
  cancellationReason: 'cancel',
  idempotencyKey: 'schema-cancel',
}).success, true)

const docsText = [
  'docs/credit-revision-action-resolution.md',
  'docs/runtime-credit-guard.md',
  'docs/credit-policy.md',
  'docs/credit-reservation-max-estimate.md',
  'docs/edit-credit-estimate-preview.md',
  'credit-ledger-architecture.md',
  'README.md',
  'AGENTS.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'package.json',
].map((path) => readFileSync(repoFile(path), 'utf8')).join('\n')

for (const phrase of [
  'RP-CREDITREVISION-01',
  'Approve & Continue',
  'Choose Lower-Cost Option',
  'Cancel Extra Work',
  'revised_credit_additional_hold',
  'smoke:credit-revision-action',
  'no live billing',
  'no provider call',
  'no render/export',
  'serviceFeeIncluded = false',
]) {
  assert.ok(docsText.includes(phrase), `Missing credit revision docs/package phrase: ${phrase}`)
}

console.log('credit-revision-action smoke passed')

interface RevisionScenario {
  workspaceId: string
  projectId: string
  editPlanId: string
  userId: string
  walletId: string
  productEditLevel: 'normal'
  durationSeconds: number
  reservation: CreditReservationRecord
  estimateStore: MockCreditEstimateStore
  reservationStore: MockCreditReservationStore
  creditDataStore: MockCreditDataStore
  overage: RuntimeCreditGuardResult
}

function createOverageScenario(
  label: string,
  toolId: ProductionToolId,
  extraAvailableCredits: number,
): RevisionScenario {
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  const workspaceId = `workspace-credit-revision-${label}`
  const projectId = `project-credit-revision-${label}`
  const editPlanId = `edit-plan-credit-revision-${label}`
  const userId = `user-credit-revision-${label}`
  const productEditLevel = 'normal' as const
  const durationSeconds = 30
  const request: PreviewEditCreditEstimateRequest = {
    workspaceId,
    projectId,
    editPlanId,
    productEditLevel,
    finalVideoDurationSeconds: durationSeconds,
    plannedToolIds: [toolId],
    idempotencyKey: `estimate-credit-revision-${label}`,
    metadata: { smoke: 'credit-revision-action' },
  }
  const preview = insertEditCreditEstimatePreview(estimateStore, buildEditCreditEstimatePreview(request))
  preview.estimate.status = 'approved'
  const wallet = getOrCreateMockCreditWallet(reservationStore, {
    workspaceId,
    userId,
  })
  assert.ok(wallet)
  grantMockCredits(reservationStore, {
    creditWalletId: wallet.id,
    amount: preview.summary.requiredHoldCredits + extraAvailableCredits,
    sourceType: 'admin',
    userId,
  })
  const reserved = reserveMaxEstimateCredits(reservationStore, estimateStore, {
    workspaceId,
    projectId,
    editPlanId,
    creditWalletId: wallet.id,
    creditEstimateId: preview.estimate.id,
    creditApprovalId: `credit-approval-credit-revision-${label}`,
    approvedByUserId: userId,
    idempotencyKey: `reservation-credit-revision-${label}`,
  })
  assert.equal(reserved.status, 'reserved')
  assert.ok(reserved.reservation)
  const scenario = {
    workspaceId,
    projectId,
    editPlanId,
    userId,
    walletId: wallet.id,
    productEditLevel,
    durationSeconds,
    reservation: reserved.reservation,
    estimateStore,
    reservationStore,
    creditDataStore,
    overage: undefined as unknown as RuntimeCreditGuardResult,
  }
  insertExistingBillableEvent(scenario, reserved.reservation.reservedCredits)
  const overage = evaluatePaidToolRuntimeGuard(guardInput(scenario, {
    idempotencyKey: `runtime-credit-revision-${label}`,
  }))
  assert.equal(overage.canStart, false)
  assert.equal(overage.status, 'paused_projected_overage')
  assert.equal(overage.revisionAction?.status, 'action_required')
  scenario.overage = overage
  return scenario
}

function guardInput(
  scenario: Omit<RevisionScenario, 'overage'>,
  overrides: Partial<Parameters<typeof evaluatePaidToolRuntimeGuard>[0]>,
): Parameters<typeof evaluatePaidToolRuntimeGuard>[0] {
  return {
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    approvedPlanSnapshotId: `approved-credit-revision-${scenario.projectId}`,
    toolId: 'opentimelineio',
    productEditLevel: scenario.productEditLevel,
    estimatedFinalVideoDurationSeconds: scenario.durationSeconds,
    creditEstimateId: scenario.reservation.creditEstimateId,
    creditReservationId: scenario.reservation.id,
    idempotencyKey: 'runtime-credit-revision-default',
    estimateStatus: 'approved',
    estimateStore: scenario.estimateStore,
    reservationStore: scenario.reservationStore,
    creditDataStore: scenario.creditDataStore,
    ...overrides,
  }
}

function insertExistingBillableEvent(
  scenario: Omit<RevisionScenario, 'overage'>,
  credits: number,
): void {
  insertMockToolCostEvent(scenario.creditDataStore.toolCostStore, createMockToolCostEvent({
    id: `toolcost-credit-revision-${scenario.projectId}`,
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    creditEstimateId: scenario.reservation.creditEstimateId,
    creditReservationId: scenario.reservation.id,
    label: 'Existing billable credit revision smoke cost',
    usageCategory: 'media_analysis',
    actualInternalCostCents: credits * 10,
    billableToUser: true,
    idempotencyKey: `toolcost-credit-revision-${scenario.projectId}`,
  }))
}

function mutationCounts(store: MockCreditReservationStore) {
  return {
    wallets: store.walletMutationRecords.length,
    reservations: store.reservationMutationRecords.length,
  }
}

function nonAllowedReservationSideEffects(store: MockCreditReservationStore) {
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
