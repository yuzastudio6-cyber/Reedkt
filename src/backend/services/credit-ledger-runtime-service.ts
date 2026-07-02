import type { CreditLedgerEntryRecord, CreditRefundRecord, CreditReservationRecord } from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export interface CreditLedgerRuntimeResult {
  reservation?: CreditReservationRecord
  ledgerEntry?: CreditLedgerEntryRecord
  refund?: CreditRefundRecord
  message: string
  warnings: string[]
}

export function spendReservedCreditsMock(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditLedgerRuntimeResult> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  if (reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', `Reserved credits are required before spend. Current status: ${reservation.status}.`)
  }

  const wallet = findMockRecord(db, 'creditWallets', reservation.creditWalletId)
  if (wallet) {
    wallet.cachedReservedCredits = Math.max(0, wallet.cachedReservedCredits - reservation.reservedCredits)
    wallet.cachedSpentCredits += reservation.reservedCredits
    wallet.updatedAt = nowIso()
  }

  reservation.status = 'spent'
  reservation.spentCredits = reservation.reservedCredits
  reservation.spentAt = nowIso()
  reservation.updatedAt = nowIso()

  const ledgerEntry = createCreditLedgerEntryMock(db, {
    reservation,
    entryType: 'spend',
    amount: -reservation.reservedCredits,
    description: 'Mock spend after successful job/provider result.',
  })

  return ok({
    reservation,
    ledgerEntry,
    message: 'Mock reserved credits spent after successful work.',
    warnings: ['Mock ledger entry only; real spend must be transactional and backend-only.'],
  })
}

export function releaseReservedCreditsMock(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditLedgerRuntimeResult> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  if (reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', `Only reserved credits can be released. Current status: ${reservation.status}.`)
  }

  const wallet = findMockRecord(db, 'creditWallets', reservation.creditWalletId)
  if (wallet) {
    wallet.cachedReservedCredits = Math.max(0, wallet.cachedReservedCredits - reservation.reservedCredits)
    wallet.cachedAvailableCredits += reservation.reservedCredits
    wallet.updatedAt = nowIso()
  }

  reservation.status = 'released'
  reservation.releasedCredits = reservation.reservedCredits
  reservation.releasedAt = nowIso()
  reservation.updatedAt = nowIso()

  const ledgerEntry = createCreditLedgerEntryMock(db, {
    reservation,
    entryType: 'reservation_release',
    amount: reservation.reservedCredits,
    description: 'Mock release after cancelled or blocked work.',
  })

  return ok({
    reservation,
    ledgerEntry,
    message: 'Mock reserved credits released.',
    warnings: ['Mock release only; real release must be backend-only and idempotent.'],
  })
}

export function refundCreditsForFailedJobMock(
  db: MockDatabase,
  creditReservationId: string,
  refundAmount?: number,
): ServiceResult<CreditLedgerRuntimeResult> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  const amount = refundAmount ?? Math.max(reservation.spentCredits, reservation.reservedCredits)
  const wallet = findMockRecord(db, 'creditWallets', reservation.creditWalletId)
  if (wallet) {
    wallet.cachedRefundedCredits += amount
    wallet.cachedAvailableCredits += amount
    wallet.cachedReservedCredits = Math.max(0, wallet.cachedReservedCredits - reservation.reservedCredits)
    wallet.updatedAt = nowIso()
  }

  reservation.status = 'refunded'
  reservation.refundedCredits += amount
  reservation.updatedAt = nowIso()

  const ledgerEntry = createCreditLedgerEntryMock(db, {
    reservation,
    entryType: 'failed_generation_refund',
    amount,
    description: 'Mock refund after ReeditPro-side failed job.',
  })
  const refund: CreditRefundRecord = {
    id: createMockId('credit-runtime-refund'),
    creditWalletId: reservation.creditWalletId,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    creditReservationId: reservation.id,
    creditEstimateId: reservation.creditEstimateId,
    editPlanId: reservation.editPlanId,
    status: 'completed',
    refundAmount: amount,
    refundReason: 'reeditpro_generation_failed',
    failureCausedByReeditpro: true,
    completedAt: nowIso(),
    ledgerEntryId: ledgerEntry.id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  insertMockRecord(db, 'creditRefunds', refund)

  return ok({
    reservation,
    ledgerEntry,
    refund,
    message: 'Mock refund created for failed job.',
    warnings: ['No Stripe or payment refund happened; this is credit-ledger mock metadata only.'],
  })
}

export function createCreditLedgerEntryMock(
  db: MockDatabase,
  input: {
    reservation: CreditReservationRecord
    entryType: CreditLedgerEntryRecord['entryType']
    amount: number
    description: string
  },
): CreditLedgerEntryRecord {
  const wallet = findMockRecord(db, 'creditWallets', input.reservation.creditWalletId)
  return insertMockRecord(db, 'creditLedgerEntries', {
    id: createMockId('credit-runtime-ledger-entry'),
    creditWalletId: input.reservation.creditWalletId,
    workspaceId: input.reservation.workspaceId,
    userId: wallet?.userId,
    entryType: input.entryType,
    amount: input.amount,
    balanceAfter: wallet?.cachedAvailableCredits,
    relatedProjectId: input.reservation.projectId,
    relatedEditPlanId: input.reservation.editPlanId,
    relatedReservationId: input.reservation.id,
    relatedEstimateId: input.reservation.creditEstimateId,
    idempotencyKey: `mock-ledger-${input.entryType}-${input.reservation.id}`,
    description: input.description,
    metadata: {
      mockOnly: true,
      futureRequiresBackendTransaction: true,
    },
    createdAt: nowIso(),
  })
}

export function createCreditLedgerRuntimeSummary(result: CreditLedgerRuntimeResult): string {
  if (result.ledgerEntry) {
    return `${result.ledgerEntry.entryType} ledger entry recorded for ${Math.abs(result.ledgerEntry.amount)} credit(s).`
  }

  return result.message
}
