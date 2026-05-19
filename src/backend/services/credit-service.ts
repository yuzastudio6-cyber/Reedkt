import type {
  CreditApprovalRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditGrantRecord,
  CreditLedgerEntryRecord,
  CreditRefundRecord,
  CreditReservationRecord,
  CreditWalletRecord,
} from '../../types'
import type {
  ApproveCreditEstimateRequest,
  CreateCreditEstimateRequest,
  ReserveCreditsRequest,
} from '../contracts/credit-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createCreditWallet(
  db: MockDatabase,
  workspaceId: string,
  userId: string,
): ServiceResult<CreditWalletRecord> {
  const wallet: CreditWalletRecord = {
    id: createMockId('credit-wallet'),
    workspaceId,
    userId,
    walletType: 'personal',
    name: 'Mock Personal Reedit Credits',
    currencyCode: 'CREDITS',
    cachedAvailableCredits: 0,
    cachedReservedCredits: 0,
    cachedSpentCredits: 0,
    cachedRefundedCredits: 0,
    lastCalculatedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      subscriptionIsSoftwareAccess: true,
      creditsPayForUsage: true,
    },
  }

  return ok(insertMockRecord(db, 'creditWallets', wallet))
}

export function grantWeeklyBonusCredits(
  db: MockDatabase,
  creditWalletId: string,
  amount = 100,
): ServiceResult<CreditGrantRecord> {
  const wallet = findMockRecord(db, 'creditWallets', creditWalletId)

  if (!wallet) {
    return fail('CREDIT_WALLET_NOT_FOUND', `Credit wallet ${creditWalletId} was not found.`)
  }

  wallet.cachedAvailableCredits += amount
  wallet.updatedAt = nowIso()

  const grant: CreditGrantRecord = {
    id: createMockId('credit-grant'),
    creditWalletId,
    workspaceId: wallet.workspaceId,
    userId: wallet.userId,
    sourceType: 'weekly_bonus',
    status: 'active',
    originalAmount: amount,
    remainingAmount: amount,
    retailValueCents: 500,
    grantReason: 'Mock weekly Personal plan bonus credits.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  insertLedgerEntry(db, {
    creditWalletId,
    workspaceId: wallet.workspaceId,
    userId: wallet.userId,
    entryType: 'weekly_bonus_grant',
    amount,
    balanceAfter: wallet.cachedAvailableCredits,
    description: 'Mock weekly bonus credit grant.',
  })

  return ok(insertMockRecord(db, 'creditGrants', grant))
}

export function createCreditEstimate(
  db: MockDatabase,
  input: CreateCreditEstimateRequest,
): ServiceResult<CreditEstimateRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)

  if (!editPlan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Edit plan ${input.editPlanId} was not found.`)
  }

  const totalEstimatedCredits = editPlan.complexity === 'basic_edit' ? 18 : 42
  const estimate: CreditEstimateRecord = {
    id: createMockId('credit-estimate'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    status: 'shown_to_user',
    totalEstimatedCredits,
    minimumEstimatedCredits: Math.max(1, totalEstimatedCredits - 4),
    maximumEstimatedCredits: totalEstimatedCredits + 8,
    availableCreditsSnapshot: db.creditWallets[0]?.cachedAvailableCredits ?? 0,
    reservedCreditsSnapshot: db.creditWallets[0]?.cachedReservedCredits ?? 0,
    weeklyBonusCreditsSnapshot: 100,
    estimateReason: 'Mock estimate created after planning and before generation.',
    estimatePayload: {
      approvalRequiredBeforeReservation: true,
    },
    shownToUserAt: nowIso(),
    createdByAgent: 'mock_credit_estimation_agent',
    lineItems: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  insertMockRecord(db, 'creditEstimates', estimate)
  const lineItems = createCreditEstimateLineItems(db, estimate.id, input.workspaceId, input.projectId, input.editPlanId)

  if (lineItems.ok) {
    estimate.lineItems = lineItems.data
  }

  return ok(estimate)
}

export function createCreditEstimateLineItems(
  db: MockDatabase,
  creditEstimateId: string,
  workspaceId: string,
  projectId: string,
  editPlanId?: string,
): ServiceResult<CreditEstimateLineItemRecord[]> {
  const lineItems: CreditEstimateLineItemRecord[] = [
    {
      id: createMockId('credit-line-item'),
      creditEstimateId,
      workspaceId,
      projectId,
      editPlanId,
      lineItemType: 'basic_edit_cleanup',
      usageCategory: 'basic_edit',
      label: 'Professional edit cleanup',
      description: 'Basic clean editing remains professional quality.',
      estimatedCredits: 10,
      isOptional: false,
      isPremium: false,
      requiresUserApproval: true,
      createdAt: nowIso(),
    },
    {
      id: createMockId('credit-line-item'),
      creditEstimateId,
      workspaceId,
      projectId,
      editPlanId,
      lineItemType: 'render_preview',
      usageCategory: 'rendering',
      label: 'Preview render placeholder',
      description: 'Mock render job placeholder after approval and reservation.',
      estimatedCredits: 8,
      isOptional: false,
      isPremium: false,
      requiresUserApproval: true,
      createdAt: nowIso(),
    },
  ]

  lineItems.forEach((lineItem) => insertMockRecord(db, 'creditEstimateLineItems', lineItem))
  return ok(lineItems)
}

export function approveCreditEstimate(
  db: MockDatabase,
  input: ApproveCreditEstimateRequest,
): ServiceResult<CreditApprovalRecord> {
  const estimate = findMockRecord(db, 'creditEstimates', input.creditEstimateId)

  if (!estimate) {
    return fail('CREDIT_ESTIMATE_NOT_FOUND', `Credit estimate ${input.creditEstimateId} was not found.`)
  }

  if (estimate.status !== 'shown_to_user' && estimate.status !== 'ready') {
    return fail('CREDIT_ESTIMATE_NOT_READY', 'Credit estimate must be shown or ready before approval.')
  }

  estimate.status = 'approved'
  estimate.approvedAt = nowIso()
  estimate.updatedAt = nowIso()

  const approval: CreditApprovalRecord = {
    id: createMockId('credit-approval'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: input.creditEstimateId,
    editPlanId: estimate.editPlanId,
    status: 'approved',
    approvedBy: input.approvedByUserId,
    approvedAt: nowIso(),
    approvalNote: 'Mock approval captured in chat.',
    approvalPayload: { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'creditApprovals', approval))
}

export function reserveCredits(
  db: MockDatabase,
  input: ReserveCreditsRequest,
): ServiceResult<CreditReservationRecord> {
  const wallet = findMockRecord(db, 'creditWallets', input.creditWalletId)
  const estimate = findMockRecord(db, 'creditEstimates', input.creditEstimateId)
  const approval = findMockRecord(db, 'creditApprovals', input.creditApprovalId)

  if (!wallet) {
    return fail('CREDIT_WALLET_NOT_FOUND', `Credit wallet ${input.creditWalletId} was not found.`)
  }

  if (!estimate) {
    return fail('CREDIT_ESTIMATE_NOT_FOUND', `Credit estimate ${input.creditEstimateId} was not found.`)
  }

  if (!approval || approval.status !== 'approved') {
    return fail('CREDIT_APPROVAL_NOT_FOUND', 'Approved credit approval is required before reservation.')
  }

  wallet.cachedAvailableCredits -= estimate.totalEstimatedCredits
  wallet.cachedReservedCredits += estimate.totalEstimatedCredits
  wallet.updatedAt = nowIso()

  const reservation: CreditReservationRecord = {
    id: createMockId('credit-reservation'),
    creditWalletId: wallet.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: estimate.chatSessionId,
    creditEstimateId: estimate.id,
    creditApprovalId: approval.id,
    editPlanId: estimate.editPlanId,
    status: 'reserved',
    reservedCredits: estimate.totalEstimatedCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock reservation after plan and credit approval.',
    idempotencyKey: `mock-reservation-${estimate.id}`,
    reservedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { generationMayQueueAfterReservation: true },
  }

  insertLedgerEntry(db, {
    creditWalletId: wallet.id,
    workspaceId: wallet.workspaceId,
    userId: wallet.userId,
    entryType: 'reservation',
    amount: estimate.totalEstimatedCredits,
    balanceAfter: wallet.cachedAvailableCredits,
    relatedProjectId: input.projectId,
    relatedEditPlanId: estimate.editPlanId,
    relatedReservationId: reservation.id,
    relatedEstimateId: estimate.id,
    description: 'Mock credit reservation.',
  })

  return ok(insertMockRecord(db, 'creditReservations', reservation))
}

export function assertCreditsReservedForMusicGeneration(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditReservationRecord> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', 'Music generation requires an existing credit reservation.')
  }

  if (reservation.status !== 'reserved') {
    return fail(
      'CREDITS_NOT_RESERVED',
      'Music generation requires credits to be reserved before the worker can run.',
      { reservationStatus: reservation.status },
    )
  }

  return ok(reservation)
}

export function assertCreditsReservedForSFXGeneration(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditReservationRecord> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', 'SFX generation requires an existing credit reservation.')
  }

  if (reservation.status !== 'reserved') {
    return fail(
      'CREDITS_NOT_RESERVED',
      'SFX generation requires credits to be reserved before the worker can run.',
      { reservationStatus: reservation.status },
    )
  }

  return ok(reservation)
}

export function markCreditsSpent(
  db: MockDatabase,
  creditReservationId: string,
): ServiceResult<CreditReservationRecord> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  reservation.status = 'spent'
  reservation.spentCredits = reservation.reservedCredits
  reservation.spentAt = nowIso()
  reservation.updatedAt = nowIso()

  return ok(reservation)
}

export function refundCredits(
  db: MockDatabase,
  creditReservationId: string,
  refundAmount: number,
): ServiceResult<CreditRefundRecord> {
  const reservation = findMockRecord(db, 'creditReservations', creditReservationId)

  if (!reservation) {
    return fail('CREDITS_NOT_RESERVED', `Credit reservation ${creditReservationId} was not found.`)
  }

  reservation.status = 'refunded'
  reservation.refundedCredits += refundAmount
  reservation.updatedAt = nowIso()

  return ok({
    id: createMockId('credit-refund'),
    creditWalletId: reservation.creditWalletId,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    creditReservationId,
    creditEstimateId: reservation.creditEstimateId,
    editPlanId: reservation.editPlanId,
    status: 'completed',
    refundAmount,
    refundReason: 'reeditpro_generation_failed',
    failureCausedByReeditpro: true,
    completedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  })
}

function insertLedgerEntry(
  db: MockDatabase,
  input: Omit<CreditLedgerEntryRecord, 'id' | 'createdAt'>,
): CreditLedgerEntryRecord {
  const entry: CreditLedgerEntryRecord = {
    id: createMockId('credit-ledger-entry'),
    createdAt: nowIso(),
    ...input,
  }

  return insertMockRecord(db, 'creditLedgerEntries', entry)
}
