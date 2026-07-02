import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CreditReservationRecord,
  CreditSettlementRecord,
  EvaluateExportCreditGateRequest,
} from '../../src/types'
import {
  createMockCreditDataStore,
  evaluateExportCreditGate,
  insertCreditSettlement,
} from '../services/mock-credit-data-store'
import {
  createMockCreditReservationStore,
} from '../services/mock-credit-reservation-store'
import {
  creditExportLockRecordSchema,
  evaluateExportCreditGateSchema,
} from '../validation/credit-data-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

const settled = createGateScenario('settled', 'settled')
const settledBefore = sideEffects(settled)
const settledGate = evaluateExportCreditGate(
  settled.creditDataStore,
  settled.reservationStore,
  requestFor(settled, 'export-gate-settled'),
)
assert.equal(settledGate.status, 'export_allowed')
assert.equal(settledGate.canExport, true)
assert.equal(settledGate.requiredAction, 'none')
assert.equal(settledGate.userFacingTitle, 'Export ready')
assert.equal(settledGate.safetyFlags.readOnly, true)
assert.equal(settledGate.safetyFlags.mockExportLockWritten, false)
assert.equal(settledGate.safetyFlags.walletMutated, false)
assert.equal(settledGate.safetyFlags.reservationMutated, false)
assert.equal(settledGate.safetyFlags.ledgerWritten, false)
assert.equal(settledGate.safetyFlags.renderOrExportStarted, false)
assert.equal(settledGate.safetyFlags.exportUnlocked, false)
assert.equal(settledGate.safetyFlags.checkoutOrTopUpStarted, false)
assert.deepEqual(sideEffects(settled), settledBefore)

const absorbed = createGateScenario('absorbed', 'settled_with_absorbed_overage')
const absorbedGate = evaluateExportCreditGate(
  absorbed.creditDataStore,
  absorbed.reservationStore,
  requestFor(absorbed, 'export-gate-absorbed'),
)
assert.equal(absorbedGate.status, 'export_allowed')
assert.equal(absorbedGate.canExport, true)
assert.equal(absorbedGate.requiredAction, 'none')
assert.match(absorbedGate.userFacingMessage, /ReEditPro absorbed the extra credits/)
assert.equal(absorbedGate.absorbedOverageCredits, 30)
assert.equal(absorbedGate.safetyFlags.mockExportLockWritten, false)
assert.equal(absorbed.creditDataStore.creditExportLocks.length, 0)

const topUp = createGateScenario('top-up', 'requires_top_up_before_export')
const topUpBefore = sideEffects(topUp)
const topUpGate = evaluateExportCreditGate(
  topUp.creditDataStore,
  topUp.reservationStore,
  requestFor(topUp, 'export-gate-top-up'),
)
assert.equal(topUpGate.status, 'export_locked_top_up_required')
assert.equal(topUpGate.canExport, false)
assert.equal(topUpGate.requiredAction, 'add_credits_to_export')
assert.equal(topUpGate.userFacingTitle, 'Action required: add credits to export')
assert.match(topUpGate.userFacingMessage, /30 approved credits/)
assert.equal(topUpGate.outstandingCredits, 30)
assert.equal(topUpGate.safetyFlags.mockExportLockWritten, true)
assert.equal(topUpGate.safetyFlags.checkoutOrTopUpStarted, false)
assert.equal(topUpGate.safetyFlags.walletMutated, false)
assert.equal(topUpGate.safetyFlags.reservationMutated, false)
assert.equal(topUpGate.safetyFlags.exportUnlocked, false)
assert.equal(topUp.creditDataStore.creditExportLocks.length, 1)
assert.equal(creditExportLockRecordSchema.safeParse(topUpGate.exportLock).success, true)
assert.deepEqual(sideEffects(topUp), {
  ...topUpBefore,
  exportLocks: topUpBefore.exportLocks + 1,
})

const duplicateTopUpGate = evaluateExportCreditGate(
  topUp.creditDataStore,
  topUp.reservationStore,
  requestFor(topUp, 'export-gate-top-up'),
)
assert.equal(duplicateTopUpGate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicateTopUpGate.exportLock?.id, topUpGate.exportLock?.id)
assert.equal(topUp.creditDataStore.creditExportLocks.length, 1)

const readOnlyTopUpGate = evaluateExportCreditGate(
  topUp.creditDataStore,
  topUp.reservationStore,
  requestFor(topUp, 'export-gate-top-up-read-only'),
  { createLock: false },
)
assert.equal(readOnlyTopUpGate.status, 'export_locked_top_up_required')
assert.equal(readOnlyTopUpGate.idempotencyStatus, 'not_created')
assert.equal(readOnlyTopUpGate.exportLock, null)
assert.equal(topUp.creditDataStore.creditExportLocks.length, 1)

const missingSettlement = createGateScenario('missing-settlement')
const missingSettlementGate = evaluateExportCreditGate(
  missingSettlement.creditDataStore,
  missingSettlement.reservationStore,
  {
    workspaceId: missingSettlement.workspaceId,
    projectId: missingSettlement.projectId,
    creditReservationId: missingSettlement.reservation.id,
    idempotencyKey: 'export-gate-missing-settlement',
  },
)
assert.equal(missingSettlementGate.status, 'settlement_required')
assert.equal(missingSettlementGate.canExport, false)
assert.equal(missingSettlementGate.requiredAction, 'settle_edit_first')
assert.equal(missingSettlementGate.userFacingTitle, 'Settlement required before export')

for (const status of ['draft', 'previewed', 'pending'] as const) {
  const scenario = createGateScenario(status, status)
  const gate = evaluateExportCreditGate(
    scenario.creditDataStore,
    scenario.reservationStore,
    requestFor(scenario, `export-gate-${status}`),
  )
  assert.equal(gate.status, 'settlement_required')
  assert.equal(gate.canExport, false)
  assert.equal(gate.requiredAction, 'settle_edit_first')
}

const revised = createGateScenario('revised', 'requires_revised_estimate')
const revisedGate = evaluateExportCreditGate(
  revised.creditDataStore,
  revised.reservationStore,
  requestFor(revised, 'export-gate-revised'),
)
assert.equal(revisedGate.status, 'revised_estimate_required')
assert.equal(revisedGate.requiredAction, 'resolve_revised_estimate')
assert.equal(revisedGate.userFacingTitle, 'Action required: revised credit estimate needed')

for (const status of ['failed', 'cancelled'] as const) {
  const scenario = createGateScenario(status, status)
  const gate = evaluateExportCreditGate(
    scenario.creditDataStore,
    scenario.reservationStore,
    requestFor(scenario, `export-gate-${status}`),
  )
  assert.equal(gate.status, 'settlement_failed')
  assert.equal(gate.canExport, false)
  assert.equal(gate.requiredAction, 'contact_support')
}

const missingReservation = createGateScenario('missing-reservation', 'settled')
missingReservation.reservationStore.creditReservations.length = 0
const missingReservationGate = evaluateExportCreditGate(
  missingReservation.creditDataStore,
  missingReservation.reservationStore,
  requestFor(missingReservation, 'export-gate-missing-reservation'),
)
assert.equal(missingReservationGate.status, 'reservation_not_found')
assert.equal(missingReservationGate.canExport, false)

const explicitMissingSettlementGate = evaluateExportCreditGate(
  missingSettlement.creditDataStore,
  missingSettlement.reservationStore,
  {
    ...requestFor(missingSettlement, 'export-gate-explicit-missing-settlement'),
    creditSettlementId: 'credit_settlement_missing',
  },
)
assert.equal(explicitMissingSettlementGate.status, 'settlement_not_found')

const crossScope = createGateScenario('cross-scope', 'settled')
const crossScopeGate = evaluateExportCreditGate(
  crossScope.creditDataStore,
  crossScope.reservationStore,
  {
    ...requestFor(crossScope, 'export-gate-cross-scope'),
    projectId: 'project-other',
  },
)
assert.equal(crossScopeGate.status, 'invalid_request')
assert.equal(crossScopeGate.canExport, false)

assert.equal(evaluateExportCreditGateSchema.safeParse(requestFor(settled, 'schema-valid')).success, true)
assert.equal(evaluateExportCreditGateSchema.safeParse({
  ...requestFor(settled, 'schema-missing-idempotency'),
  idempotencyKey: '',
}).success, false)
assert.equal(evaluateExportCreditGateSchema.safeParse({
  ...requestFor(settled, 'schema-secret'),
  metadata: { providerApiKey: 'sk-not-real-but-secret-shaped' },
}).success, false)

const packageJson = readRepoFile('package.json')
assert.match(packageJson, /"smoke:credit-export-lock"/)

const docs = [
  readRepoFile('docs/credit-export-lock.md'),
  readRepoFile('docs/credit-settlement-finalization.md'),
  readRepoFile('mock-vs-real-status.md'),
].join('\n')
for (const phrase of [
  'Action required: add credits to export',
  'settled_with_absorbed_overage',
  'requires_top_up_before_export',
  'no checkout/top-up',
  'no render/export execution',
  'no production wallet mutation',
]) {
  assert.match(docs, new RegExp(escapeRegExp(phrase)))
}

console.log('credit export lock smoke passed')

interface GateScenario {
  workspaceId: string
  projectId: string
  creditDataStore: ReturnType<typeof createMockCreditDataStore>
  reservationStore: ReturnType<typeof createMockCreditReservationStore>
  reservation: CreditReservationRecord
  settlement?: CreditSettlementRecord
}

function createGateScenario(
  suffix: string,
  status?: CreditSettlementRecord['status'],
): GateScenario {
  const workspaceId = `workspace-export-lock-${suffix}`
  const projectId = `project-export-lock-${suffix}`
  const createdAt = '2026-07-01T00:00:00.000Z'
  const creditDataStore = createMockCreditDataStore()
  const reservationStore = createMockCreditReservationStore()
  const reservation: CreditReservationRecord = {
    id: `credit_reservation_${suffix}`,
    creditWalletId: `credit_wallet_${suffix}`,
    workspaceId,
    projectId,
    creditEstimateId: `credit_estimate_${suffix}`,
    creditApprovalId: `credit_approval_${suffix}`,
    editPlanId: `edit_plan_${suffix}`,
    status: status === 'settled' || status === 'settled_with_absorbed_overage' ? 'spent' : 'reserved',
    reservedCredits: 200,
    spentCredits: status === 'settled' || status === 'settled_with_absorbed_overage' ? 160 : 0,
    releasedCredits: status === 'settled' ? 40 : 0,
    refundedCredits: 0,
    reservationReason: 'Mock export lock smoke reservation.',
    idempotencyKey: `reserve-${suffix}`,
    reservedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      milestone: 'RP-EXPORTLOCK-01',
    },
  }
  reservationStore.creditReservations.push(reservation)

  let settlement: CreditSettlementRecord | undefined
  if (status) {
    settlement = settlementRecord(suffix, reservation, status)
    insertCreditSettlement(creditDataStore, settlement)
  }

  return {
    workspaceId,
    projectId,
    creditDataStore,
    reservationStore,
    reservation,
    settlement,
  }
}

function settlementRecord(
  suffix: string,
  reservation: CreditReservationRecord,
  status: CreditSettlementRecord['status'],
): CreditSettlementRecord {
  const createdAt = '2026-07-01T00:00:00.000Z'
  const values = settlementValues(status)
  return {
    id: `credit_settlement_${suffix}`,
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
    status,
    settlementReason: status === 'requires_top_up_before_export'
      ? 'approved_but_unfunded'
      : status === 'settled_with_absorbed_overage'
        ? 'reeditpro_failed_to_pause_absorbed'
        : 'edit_completed',
    reservedCredits: 200,
    actualToolCostCents: values.actualToolCostCredits * 10,
    actualToolCostCredits: values.actualToolCostCredits,
    reeditproServiceFeeCredits: values.reeditproServiceFeeCredits,
    finalChargeCredits: values.finalChargeCredits,
    releasedCredits: values.releasedCredits,
    absorbedOverageCredits: values.absorbedOverageCredits,
    outstandingCredits: values.outstandingCredits,
    billableToolEventCount: values.actualToolCostCredits > 0 ? 1 : 0,
    nonBillableToolEventCount: 0,
    toolCostEventIds: [],
    rateCardVersion: 'tool-metering-v1-2026-06-26',
    creditPolicyVersion: 'rp-creditpolicy-01',
    serviceFeePolicyVersion: 'rp-creditpolicy-01-service-fee',
    idempotencyKey: `settle-${suffix}`,
    settlementPayload: {
      computedFinalChargeCredits: values.actualToolCostCredits + values.reeditproServiceFeeCredits,
      noExportUnlock: true,
      noCheckoutOrTopUp: true,
    },
    receiptPayload: {
      userFacingLines: [],
    },
    metadata: {
      mockOnly: true,
      milestone: 'RP-SETTLEMENT-01',
      productionPersistence: false,
    },
    createdAt,
    updatedAt: createdAt,
    settledAt: status === 'settled' || status === 'settled_with_absorbed_overage' ? createdAt : null,
    failedAt: status === 'failed' ? createdAt : null,
  }
}

function settlementValues(status: CreditSettlementRecord['status']) {
  if (status === 'settled') {
    return {
      actualToolCostCredits: 120,
      reeditproServiceFeeCredits: 40,
      finalChargeCredits: 160,
      releasedCredits: 40,
      absorbedOverageCredits: 0,
      outstandingCredits: 0,
    }
  }
  if (status === 'settled_with_absorbed_overage') {
    return {
      actualToolCostCredits: 190,
      reeditproServiceFeeCredits: 40,
      finalChargeCredits: 200,
      releasedCredits: 0,
      absorbedOverageCredits: 30,
      outstandingCredits: 0,
    }
  }
  if (status === 'requires_top_up_before_export') {
    return {
      actualToolCostCredits: 190,
      reeditproServiceFeeCredits: 40,
      finalChargeCredits: 230,
      releasedCredits: 0,
      absorbedOverageCredits: 0,
      outstandingCredits: 30,
    }
  }
  return {
    actualToolCostCredits: 0,
    reeditproServiceFeeCredits: 0,
    finalChargeCredits: 0,
    releasedCredits: 0,
    absorbedOverageCredits: 0,
    outstandingCredits: 0,
  }
}

function requestFor(scenario: GateScenario, idempotencyKey: string): EvaluateExportCreditGateRequest {
  return {
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    editPlanId: scenario.reservation.editPlanId ?? null,
    creditReservationId: scenario.reservation.id,
    creditSettlementId: scenario.settlement?.id ?? null,
    requestedByUserId: 'user-export-lock-smoke',
    idempotencyKey,
    metadata: {
      smoke: 'credit-export-lock',
    },
  }
}

function sideEffects(scenario: GateScenario) {
  return {
    exportLocks: scenario.creditDataStore.creditExportLocks.length,
    creditStoreWalletMutations: scenario.creditDataStore.walletMutationRecords.length,
    creditStoreReservationMutations: scenario.creditDataStore.reservationMutationRecords.length,
    creditStoreLedgerMutations: scenario.creditDataStore.ledgerMutationRecords.length,
    creditStoreExportUnlocks: scenario.creditDataStore.exportUnlockRecords.length,
    reservationWalletMutations: scenario.reservationStore.walletMutationRecords.length,
    reservationMutations: scenario.reservationStore.reservationMutationRecords.length,
    reservationLedgerMutations: scenario.reservationStore.ledgerMutationRecords.length,
    reservationExportUnlocks: scenario.reservationStore.exportUnlockRecords.length,
    checkoutOrTopUpRecords: scenario.reservationStore.checkoutOrTopUpRecords.length,
    providerCallRecords: scenario.reservationStore.providerCallRecords.length,
    renderExportRecords: scenario.reservationStore.renderExportRecords.length,
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
