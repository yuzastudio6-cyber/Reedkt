import type { CreditReservationRecord } from '../../types'
import type { CreditReservationRuntimeRecord, CreditSpendPurpose } from '../../types/credit-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'
import { checkCreditApprovalGate } from './credit-approval-gate-service'

export interface ReserveCreditsForApprovedEstimateInput {
  workspaceId: string
  projectId: string
  creditWalletId?: string
  creditEstimateId: string
  creditApprovalId?: string
  editPlanId?: string
  requestedByUserId?: string
  purpose: CreditSpendPurpose
  expiresAt?: string
}

export interface CreditReservationRuntimeResult {
  reservation: CreditReservationRecord
  runtimeReservation: CreditReservationRuntimeRecord
  message: string
  warnings: string[]
}

export function createMockCreditReservation(
  db: MockDatabase,
  input: ReserveCreditsForApprovedEstimateInput,
): ServiceResult<CreditReservationRuntimeResult> {
  return reserveCreditsForApprovedEstimate(db, input)
}

export function reserveCreditsForApprovedEstimate(
  db: MockDatabase,
  input: ReserveCreditsForApprovedEstimateInput,
): ServiceResult<CreditReservationRuntimeResult> {
  const estimate = findMockRecord(db, 'creditEstimates', input.creditEstimateId)

  if (!estimate) {
    return fail('CREDIT_ESTIMATE_NOT_FOUND', `Credit estimate ${input.creditEstimateId} was not found.`)
  }

  if (estimate.status !== 'approved') {
    return fail('CREDIT_ESTIMATE_NOT_READY', 'Credit estimate must be approved before reservation.')
  }

  const wallet = input.creditWalletId
    ? findMockRecord(db, 'creditWallets', input.creditWalletId)
    : db.creditWallets.find((candidate) => candidate.workspaceId === input.workspaceId)

  if (!wallet) {
    return fail('CREDIT_WALLET_NOT_FOUND', 'A credit wallet is required before mock reservation.')
  }

  const gateWithoutReservation = checkCreditApprovalGate(db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? estimate.editPlanId,
    creditEstimateId: estimate.id,
    requestedByUserId: input.requestedByUserId,
    purpose: input.purpose,
    estimatedCredits: estimate.totalEstimatedCredits,
    requiresApproval: estimate.totalEstimatedCredits > 0,
  })

  if (
    !gateWithoutReservation.ok &&
    gateWithoutReservation.decision !== 'blocked_reservation_missing'
  ) {
    return fail('GENERATION_NOT_ALLOWED', gateWithoutReservation.message, gateWithoutReservation)
  }

  wallet.cachedAvailableCredits -= estimate.totalEstimatedCredits
  wallet.cachedReservedCredits += estimate.totalEstimatedCredits
  wallet.updatedAt = nowIso()

  const reservation: CreditReservationRecord = {
    id: createMockId('credit-runtime-reservation'),
    creditWalletId: wallet.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: estimate.id,
    creditApprovalId: input.creditApprovalId ?? db.creditApprovals.find((approval) => approval.creditEstimateId === estimate.id)?.id,
    editPlanId: input.editPlanId ?? estimate.editPlanId,
    status: 'reserved',
    reservedCredits: estimate.totalEstimatedCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: `Mock reservation for ${input.purpose}.`,
    idempotencyKey: `mock-runtime-reservation-${estimate.id}-${input.purpose}`,
    reservedAt: nowIso(),
    expiresAt: input.expiresAt,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      backendRequiredForRealReservation: true,
      purpose: input.purpose,
    },
  }

  insertMockRecord(db, 'creditReservations', reservation)

  return ok({
    reservation,
    runtimeReservation: toRuntimeReservation(reservation, input.purpose, input.requestedByUserId),
    message: 'Mock credits reserved after approved plan and estimate checks.',
    warnings: [
      'Mock reservation only; real reservation must be transactional in backend runtime.',
      'No Stripe or payment operation was performed.',
    ],
  })
}

export function validateCreditReservation(
  db: MockDatabase,
  input: {
    creditReservationId: string
    workspaceId: string
    projectId: string
    creditEstimateId?: string
    editPlanId?: string
    purpose: CreditSpendPurpose
    requestedByUserId?: string
    estimatedCredits: number
  },
) {
  return checkCreditApprovalGate(db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requestedByUserId: input.requestedByUserId,
    purpose: input.purpose,
    estimatedCredits: input.estimatedCredits,
    requiresApproval: input.estimatedCredits > 0,
  })
}

export function releaseCreditReservation(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditReservationRecord> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  if (reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', `Only reserved credits can be released. Current status: ${reservation.status}.`)
  }

  const wallet = findMockRecord(db, 'creditWallets', reservation.creditWalletId)
  if (wallet) {
    wallet.cachedAvailableCredits += reservation.reservedCredits
    wallet.cachedReservedCredits = Math.max(0, wallet.cachedReservedCredits - reservation.reservedCredits)
    wallet.updatedAt = nowIso()
  }

  reservation.status = 'released'
  reservation.releasedCredits = reservation.reservedCredits
  reservation.releasedAt = nowIso()
  reservation.updatedAt = nowIso()

  return ok(reservation)
}

export function expireCreditReservation(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditReservationRecord> {
  const release = releaseCreditReservation(db, creditReservationId)

  if (!release.ok) return release

  release.data.status = 'expired'
  release.data.updatedAt = nowIso()
  return ok(release.data)
}

export function createCreditReservationSummary(result: CreditReservationRuntimeResult): string {
  return `${result.reservation.reservedCredits} credit(s) reserved for project ${result.reservation.projectId}.`
}

function toRuntimeReservation(
  reservation: CreditReservationRecord,
  purpose: CreditSpendPurpose,
  requestedByUserId?: string,
): CreditReservationRuntimeRecord {
  return {
    id: reservation.id,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    editPlanId: reservation.editPlanId,
    creditEstimateId: reservation.creditEstimateId,
    requestedByUserId,
    purpose,
    creditsReserved: reservation.reservedCredits,
    status: normalizeReservationStatus(reservation.status),
    expiresAt: reservation.expiresAt,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    mockOnly: true,
  }
}

function normalizeReservationStatus(status: CreditReservationRecord['status']): CreditReservationRuntimeRecord['status'] {
  if (status === 'partially_spent' || status === 'cancelled') return 'failed'
  return status
}
