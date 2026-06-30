import type {
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditGrantRecord,
  CreditRevisionActionRecord,
  CreditReservationLineItemRecord,
  CreditReservationRecord,
  CreditReservationWalletBalance,
  CreditSourceType,
  CreditWalletRecord,
  EditCreditEstimatePreview,
  JSONObject,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
  ReserveMaxEstimateCreditsSafetyFlags,
  ReserveMaxEstimateCreditsStatus,
} from '../../src/types'
import { getEditCreditEstimatePreview, type MockCreditEstimateStore } from './mock-credit-estimate-store'
import { createMockId, nowIso } from './service-helpers'

export interface MockCreditReservationStore {
  creditWallets: CreditWalletRecord[]
  creditGrants: CreditGrantRecord[]
  creditReservations: CreditReservationRecord[]
  creditReservationLineItems: CreditReservationLineItemRecord[]
  walletMutationRecords: unknown[]
  reservationMutationRecords: unknown[]
  ledgerMutationRecords: unknown[]
  settlementMutationRecords: unknown[]
  exportUnlockRecords: unknown[]
  checkoutOrTopUpRecords: unknown[]
  providerCallRecords: unknown[]
  workerRunRecords: unknown[]
  renderExportRecords: unknown[]
}

export interface GetOrCreateMockCreditWalletInput {
  workspaceId: string
  userId?: string
  creditWalletId?: string
  walletType?: CreditWalletRecord['walletType']
}

export interface GrantMockCreditsInput {
  creditWalletId: string
  amount: number
  sourceType?: CreditSourceType
  userId?: string
  grantReason?: string
}

export type ReserveAdditionalCreditsForRevisionActionStatus =
  | 'reserved'
  | 'already_reserved'
  | 'no_additional_hold_required'
  | 'insufficient_credits'
  | 'reservation_not_found'
  | 'inactive_reservation'
  | 'wallet_not_found'
  | 'invalid_request'

export interface ReserveAdditionalCreditsForRevisionActionInput {
  action: CreditRevisionActionRecord
  creditReservationId: string
  requestedByUserId: string
  idempotencyKey: string
  metadata?: JSONObject
}

export interface ReserveAdditionalCreditsForRevisionActionResult {
  status: ReserveAdditionalCreditsForRevisionActionStatus
  reservation: CreditReservationRecord | null
  reservationLineItems: CreditReservationLineItemRecord[]
  wallet: CreditWalletRecord | null
  walletBalance: CreditReservationWalletBalance | null
  additionalHoldCredits: number
  availableCreditsBeforeReservation: number
  availableCreditsAfterReservation: number
  reservedCreditsAfterReservation: number
  requiredTopUpCredits: number
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  walletMutated: boolean
  reservationMutated: boolean
  userFacingMessage: string
  warnings: string[]
}

export function createMockCreditReservationStore(): MockCreditReservationStore {
  return {
    creditWallets: [],
    creditGrants: [],
    creditReservations: [],
    creditReservationLineItems: [],
    walletMutationRecords: [],
    reservationMutationRecords: [],
    ledgerMutationRecords: [],
    settlementMutationRecords: [],
    exportUnlockRecords: [],
    checkoutOrTopUpRecords: [],
    providerCallRecords: [],
    workerRunRecords: [],
    renderExportRecords: [],
  }
}

export function getOrCreateMockCreditWallet(
  store: MockCreditReservationStore,
  input: GetOrCreateMockCreditWalletInput,
): CreditWalletRecord | undefined {
  if (input.creditWalletId) {
    return store.creditWallets.find((wallet) =>
      wallet.id === input.creditWalletId &&
      wallet.workspaceId === input.workspaceId)
  }

  const existing = store.creditWallets.find((wallet) =>
    wallet.workspaceId === input.workspaceId &&
    (!input.userId || wallet.userId === input.userId))
  if (existing) return existing

  const createdAt = nowIso()
  const wallet: CreditWalletRecord = {
    id: createMockId('credit_wallet'),
    workspaceId: input.workspaceId,
    userId: input.userId,
    walletType: input.walletType ?? 'personal',
    name: 'Mock ReEditPro credit wallet',
    currencyCode: 'CREDITS',
    cachedAvailableCredits: 0,
    cachedReservedCredits: 0,
    cachedSpentCredits: 0,
    cachedRefundedCredits: 0,
    lastCalculatedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      milestone: 'RP-RESERVATION-01',
      productionPersistence: false,
    },
  }
  store.creditWallets.push(wallet)
  store.walletMutationRecords.push({
    mutation: 'mock_wallet_created',
    walletId: wallet.id,
    workspaceId: wallet.workspaceId,
    createdAt,
  })
  return wallet
}

export function grantMockCredits(
  store: MockCreditReservationStore,
  input: GrantMockCreditsInput,
): CreditGrantRecord {
  const wallet = store.creditWallets.find((candidate) => candidate.id === input.creditWalletId)
  if (!wallet) throw new Error(`Credit wallet ${input.creditWalletId} was not found.`)
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Mock credit grant amount must be a positive integer.')
  }

  const createdAt = nowIso()
  wallet.cachedAvailableCredits += input.amount
  wallet.lastCalculatedAt = createdAt
  wallet.updatedAt = createdAt

  const grant: CreditGrantRecord = {
    id: createMockId('credit_grant'),
    creditWalletId: wallet.id,
    workspaceId: wallet.workspaceId,
    userId: input.userId ?? wallet.userId,
    sourceType: input.sourceType ?? 'admin',
    status: 'active',
    originalAmount: input.amount,
    remainingAmount: input.amount,
    grantReason: input.grantReason ?? 'Mock credits granted for RP-RESERVATION-01 smoke coverage.',
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      noLedgerWrite: true,
      noStripePayment: true,
    },
  }
  store.creditGrants.push(grant)
  store.walletMutationRecords.push({
    mutation: 'mock_credits_granted',
    walletId: wallet.id,
    amount: input.amount,
    createdAt,
  })
  return grant
}

export function getMockCreditWalletBalance(
  store: MockCreditReservationStore,
  creditWalletId: string,
): CreditReservationWalletBalance | null {
  const wallet = store.creditWallets.find((candidate) => candidate.id === creditWalletId)
  return wallet ? toWalletBalance(wallet) : null
}

export function getCreditReservation(
  store: MockCreditReservationStore,
  creditReservationId: string,
): CreditReservationRecord | undefined {
  return store.creditReservations.find((reservation) => reservation.id === creditReservationId)
}

export function listCreditReservationsForProject(
  store: MockCreditReservationStore,
  projectId: string,
): CreditReservationRecord[] {
  return store.creditReservations.filter((reservation) => reservation.projectId === projectId)
}

export function listCreditReservationsForEstimate(
  store: MockCreditReservationStore,
  creditEstimateId: string,
): CreditReservationRecord[] {
  return store.creditReservations.filter((reservation) => reservation.creditEstimateId === creditEstimateId)
}

export function listCreditReservationLineItems(
  store: MockCreditReservationStore,
  creditReservationId: string,
): CreditReservationLineItemRecord[] {
  return store.creditReservationLineItems.filter((lineItem) =>
    lineItem.creditReservationId === creditReservationId)
}

export function upsertCreditReservationByIdempotencyKey(
  store: MockCreditReservationStore,
  reservation: CreditReservationRecord,
  lineItems: CreditReservationLineItemRecord[],
): {
  reservation: CreditReservationRecord
  lineItems: CreditReservationLineItemRecord[]
  idempotencyStatus: 'created' | 'duplicate_returned'
} {
  const existing = store.creditReservations.find((candidate) =>
    candidate.workspaceId === reservation.workspaceId &&
    candidate.idempotencyKey === reservation.idempotencyKey)
  if (existing) {
    return {
      reservation: existing,
      lineItems: listCreditReservationLineItems(store, existing.id),
      idempotencyStatus: 'duplicate_returned',
    }
  }

  store.creditReservations.push(reservation)
  store.creditReservationLineItems.push(...lineItems)
  return { reservation, lineItems, idempotencyStatus: 'created' }
}

export function reserveMaxEstimateCredits(
  store: MockCreditReservationStore,
  estimateStore: MockCreditEstimateStore,
  input: ReserveMaxEstimateCreditsRequest,
): ReserveMaxEstimateCreditsResponse {
  const preview = getEditCreditEstimatePreview(estimateStore, input.creditEstimateId)
  if (!preview) {
    return blockedResponse('estimate_not_found', input, null, 0, 'Credit estimate was not found.', [
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const estimate = preview.estimate
  const requiredHoldResult = resolveRequiredHoldCredits(preview)

  if (estimate.workspaceId !== input.workspaceId || estimate.projectId !== input.projectId) {
    return blockedResponse('invalid_request', input, null, requiredHoldResult.requiredHoldCredits, 'Credit estimate scope does not match the reservation request.', [
      'Reservation scope must match workspace and project.',
    ])
  }

  if (input.editPlanId && estimate.editPlanId !== input.editPlanId) {
    return blockedResponse('invalid_request', input, null, requiredHoldResult.requiredHoldCredits, 'Credit estimate edit plan does not match the reservation request.', [
      'Reservation scope must match the approved edit plan.',
    ])
  }

  if (estimate.status === 'expired' || isExpired(estimate.expiresAt)) {
    return blockedResponse('estimate_expired', input, null, requiredHoldResult.requiredHoldCredits, 'Credit estimate is expired.', [
      'Create a fresh estimate before reserving mock credits.',
    ])
  }

  if (estimate.status !== 'approved' && !input.creditApprovalId) {
    return blockedResponse('estimate_not_approved', input, null, requiredHoldResult.requiredHoldCredits, 'Credit estimate is not approved.', [
      'Mock reservation requires a creditApprovalId or an estimate already marked approved.',
    ])
  }

  if (!requiredHoldResult.ok) {
    return blockedResponse('invalid_request', input, null, requiredHoldResult.requiredHoldCredits, requiredHoldResult.message, requiredHoldResult.warnings)
  }

  if (!preview.summary.canProceedToReservation || preview.summary.readinessStatus !== 'ready_for_reservation') {
    return blockedResponse('invalid_request', input, null, requiredHoldResult.requiredHoldCredits, 'Credit estimate is not ready for reservation.', [
      `Readiness status: ${preview.summary.readinessStatus}.`,
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const wallet = findReservationWallet(store, input)
  const availableBefore = wallet?.cachedAvailableCredits ?? 0

  if (!wallet) {
    return blockedResponse('wallet_not_found', input, null, requiredHoldResult.requiredHoldCredits, 'Credit wallet was not found.', [
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const duplicate = store.creditReservations.find((reservation) =>
    reservation.workspaceId === input.workspaceId &&
    reservation.idempotencyKey === input.idempotencyKey)
  if (duplicate) {
    return reservedResponse('already_reserved', input, wallet, duplicate, listCreditReservationLineItems(store, duplicate.id), requiredHoldResult.requiredHoldCredits, availableBefore, 'duplicate_returned', [
      'Duplicate idempotency key returned the existing mock reservation; no second hold occurred.',
    ])
  }

  const existingForEstimate = store.creditReservations.find((reservation) =>
    reservation.workspaceId === input.workspaceId &&
    reservation.projectId === input.projectId &&
    reservation.creditWalletId === wallet.id &&
    reservation.creditEstimateId === estimate.id &&
    reservation.status === 'reserved')
  if (existingForEstimate) {
    return reservedResponse('already_reserved', input, wallet, existingForEstimate, listCreditReservationLineItems(store, existingForEstimate.id), requiredHoldResult.requiredHoldCredits, availableBefore, 'duplicate_returned', [
      'An active mock reservation already exists for this estimate and wallet; no second hold occurred.',
    ])
  }

  if (availableBefore < requiredHoldResult.requiredHoldCredits) {
    return blockedResponse('insufficient_credits', input, wallet, requiredHoldResult.requiredHoldCredits, 'Available credits are lower than the maximum estimate hold.', [
      'Reservation requires maximumEstimatedCredits, not totalEstimatedCredits.',
      'No checkout, top-up, wallet purchase, or export unlock occurred.',
    ])
  }

  const createdAt = nowIso()
  wallet.cachedAvailableCredits -= requiredHoldResult.requiredHoldCredits
  wallet.cachedReservedCredits += requiredHoldResult.requiredHoldCredits
  wallet.lastCalculatedAt = createdAt
  wallet.updatedAt = createdAt

  const reservation: CreditReservationRecord = {
    id: createMockId('credit_reservation'),
    creditWalletId: wallet.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId ?? estimate.chatSessionId,
    creditEstimateId: estimate.id,
    creditApprovalId: input.creditApprovalId,
    editPlanId: input.editPlanId ?? estimate.editPlanId,
    status: 'reserved',
    reservedCredits: requiredHoldResult.requiredHoldCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock max-estimate hold before paid work.',
    idempotencyKey: input.idempotencyKey,
    reservedAt: createdAt,
    expiresAt: input.expiresAt,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      milestone: 'RP-RESERVATION-01',
      requiredHoldCredits: requiredHoldResult.requiredHoldCredits,
      maximumEstimatedCredits: estimate.maximumEstimatedCredits ?? 0,
      totalEstimatedCredits: estimate.totalEstimatedCredits,
      reserveMaximumEstimateOnly: true,
      noLedgerWrite: true,
      noSettlement: true,
      noProviderCall: true,
      noRenderOrExport: true,
      requestMetadata: input.metadata ?? {},
    },
  }
  const lineItems = buildReservationLineItemsFromEstimate({
    estimate,
    reservation,
    requiredHoldCredits: requiredHoldResult.requiredHoldCredits,
    createdAt,
  })
  const upserted = upsertCreditReservationByIdempotencyKey(store, reservation, lineItems)
  store.walletMutationRecords.push({
    mutation: 'mock_max_estimate_reserved',
    walletId: wallet.id,
    creditEstimateId: estimate.id,
    requiredHoldCredits: requiredHoldResult.requiredHoldCredits,
    createdAt,
  })
  store.reservationMutationRecords.push({
    mutation: 'mock_credit_reservation_created',
    creditReservationId: upserted.reservation.id,
    creditEstimateId: estimate.id,
    requiredHoldCredits: requiredHoldResult.requiredHoldCredits,
    createdAt,
  })

  return reservedResponse('reserved', input, wallet, upserted.reservation, upserted.lineItems, requiredHoldResult.requiredHoldCredits, availableBefore, upserted.idempotencyStatus, [
    'RP-RESERVATION-01 reserved the maximum estimate in mock wallet state only.',
    'No live billing, Stripe/payment, Supabase write, production wallet mutation, ledger write, settlement, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
  ])
}

export function reserveAdditionalCreditsForRevisionAction(
  store: MockCreditReservationStore,
  input: ReserveAdditionalCreditsForRevisionActionInput,
): ReserveAdditionalCreditsForRevisionActionResult {
  const action = input.action
  const reservation = getCreditReservation(store, input.creditReservationId)
  const requestedHold = Math.max(0, action.newMaximumEstimatedCredits - (reservation?.reservedCredits ?? action.approvedMaxCredits))
  if (!reservation) {
    return additionalHoldResponse('reservation_not_found', null, null, [], requestedHold, 0, 'Credit reservation was not found.', [
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const lineItems = listCreditReservationLineItems(store, reservation.id)
  const wallet = store.creditWallets.find((candidate) => candidate.id === reservation.creditWalletId) ?? null
  const availableBefore = wallet?.cachedAvailableCredits ?? 0
  const additionalHoldCredits = Math.max(0, action.newMaximumEstimatedCredits - reservation.reservedCredits)

  if (
    reservation.workspaceId !== action.workspaceId ||
    reservation.projectId !== action.projectId ||
    reservation.creditEstimateId !== action.creditEstimateId ||
    reservation.id !== action.creditReservationId
  ) {
    return additionalHoldResponse('invalid_request', reservation, wallet, lineItems, additionalHoldCredits, availableBefore, 'Credit revision action scope does not match the reservation.', [
      'Additional hold requires matching workspace, project, estimate, and reservation.',
    ])
  }

  if (reservation.status !== 'reserved') {
    return additionalHoldResponse('inactive_reservation', reservation, wallet, lineItems, additionalHoldCredits, availableBefore, 'Only active reserved mock reservations can receive additional hold credits.', [
      `Reservation status ${reservation.status} is not active for new paid work.`,
    ])
  }

  if (!wallet) {
    return additionalHoldResponse('wallet_not_found', reservation, null, lineItems, additionalHoldCredits, 0, 'Credit wallet was not found.', [
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const duplicateLine = lineItems.find((lineItem) => {
    const payload = asRecord(lineItem.linePayload)
    return payload?.creditRevisionActionId === action.id &&
      payload?.resolutionIdempotencyKey === input.idempotencyKey
  })
  if (duplicateLine) {
    return additionalHoldResponse('already_reserved', reservation, wallet, lineItems, duplicateLine.reservedCredits, availableBefore, 'Additional mock credits were already reserved for this revised-credit approval.', [
      'Duplicate idempotency key returned the existing mock additional-hold line; no second hold occurred.',
    ], 'duplicate_returned')
  }

  if (additionalHoldCredits === 0) {
    return additionalHoldResponse('no_additional_hold_required', reservation, wallet, lineItems, 0, availableBefore, 'No additional credits are required because the reservation already covers the revised maximum.', [
      'Revision action can be approved without changing the mock wallet or reservation.',
    ])
  }

  if (availableBefore < additionalHoldCredits) {
    return additionalHoldResponse('insufficient_credits', reservation, wallet, lineItems, additionalHoldCredits, availableBefore, 'Available credits are lower than the additional revised-credit hold.', [
      'No checkout, top-up, wallet purchase, settlement, or export unlock occurred.',
      'No mock wallet or reservation mutation occurred.',
    ])
  }

  const createdAt = nowIso()
  wallet.cachedAvailableCredits -= additionalHoldCredits
  wallet.cachedReservedCredits += additionalHoldCredits
  wallet.lastCalculatedAt = createdAt
  wallet.updatedAt = createdAt

  reservation.reservedCredits += additionalHoldCredits
  reservation.updatedAt = createdAt
  reservation.metadata = {
    ...(reservation.metadata ?? {}),
    milestone: 'RP-CREDITREVISION-01',
    revisedCreditAdditionalHoldApplied: true,
    latestCreditRevisionActionId: action.id,
    latestAdditionalHoldCredits: additionalHoldCredits,
    revisedMaximumEstimatedCredits: action.newMaximumEstimatedCredits,
    noSpend: true,
    noSettlement: true,
    noProviderCall: true,
    noRenderOrExport: true,
  }

  const lineItem: CreditReservationLineItemRecord = {
    id: createMockId('credit_reservation_line_item'),
    creditReservationId: reservation.id,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    usageCategory: 'revision',
    reservedCredits: additionalHoldCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    linePayload: {
      milestone: 'RP-CREDITREVISION-01',
      lineItemRole: 'revised_credit_additional_hold',
      creditRevisionActionId: action.id,
      resolutionIdempotencyKey: input.idempotencyKey,
      previousReservedCredits: reservation.reservedCredits - additionalHoldCredits,
      additionalHoldCredits,
      newMaximumEstimatedCredits: action.newMaximumEstimatedCredits,
      approvedMaxCredits: action.approvedMaxCredits,
      additionalHighCredits: action.additionalHighCredits,
      requestedByUserId: input.requestedByUserId,
      requestMetadata: input.metadata ?? {},
      serviceFeeIncludedInToolCosts: false,
      noLedgerWrite: true,
      noSpend: true,
      noSettlement: true,
    },
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      noSpend: true,
      noSettlement: true,
    },
  }
  store.creditReservationLineItems.push(lineItem)
  store.walletMutationRecords.push({
    mutation: 'mock_revised_credit_additional_hold_reserved',
    walletId: wallet.id,
    creditReservationId: reservation.id,
    creditRevisionActionId: action.id,
    additionalHoldCredits,
    createdAt,
  })
  store.reservationMutationRecords.push({
    mutation: 'mock_credit_reservation_increased_for_revision',
    creditReservationId: reservation.id,
    creditRevisionActionId: action.id,
    additionalHoldCredits,
    revisedMaximumEstimatedCredits: action.newMaximumEstimatedCredits,
    createdAt,
  })

  return additionalHoldResponse('reserved', reservation, wallet, [...lineItems, lineItem], additionalHoldCredits, availableBefore, 'Additional revised-credit hold was reserved in mock state.', [
    'RP-CREDITREVISION-01 increased only local mock wallet/reservation state.',
    'No live billing, Stripe/payment, Supabase write, production wallet mutation, ledger write, settlement, spend/release/refund, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
  ], 'created')
}

export function buildReservationLineItemsFromEstimate(input: {
  estimate: CreditEstimateRecord
  reservation: CreditReservationRecord
  requiredHoldCredits: number
  createdAt?: string
}): CreditReservationLineItemRecord[] {
  const createdAt = input.createdAt ?? nowIso()
  const estimateLines = input.estimate.lineItems ?? []
  const baseLines = estimateLines.length > 0
    ? estimateLines.map((line) => reservationLineFromEstimateLine(line, input.reservation, createdAt))
    : [fallbackReservationLine(input.estimate, input.reservation, input.requiredHoldCredits, createdAt)]

  const heldCredits = sum(baseLines.map((line) => line.reservedCredits))
  const reconciliationDelta = input.requiredHoldCredits - heldCredits
  if (reconciliationDelta !== 0 && baseLines.length > 0) {
    const targetIndex = findServiceFeeLineIndex(baseLines)
    const target = baseLines[targetIndex >= 0 ? targetIndex : baseLines.length - 1]
    target.reservedCredits += reconciliationDelta
    target.linePayload = {
      ...(target.linePayload ?? {}),
      maxHoldReconciliationDeltaCredits: reconciliationDelta,
      reconciledRequiredHoldCredits: input.requiredHoldCredits,
    }
  }

  return baseLines
}

function reservationLineFromEstimateLine(
  line: CreditEstimateLineItemRecord,
  reservation: CreditReservationRecord,
  createdAt: string,
): CreditReservationLineItemRecord {
  const highCredits = resolveLineHighCredits(line)
  return {
    id: createMockId('credit_reservation_line_item'),
    creditReservationId: reservation.id,
    creditEstimateLineItemId: line.id,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    usageCategory: line.usageCategory,
    reservedCredits: highCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    linePayload: {
      ...(line.linePayload ?? {}),
      milestone: 'RP-RESERVATION-01',
      reservationHoldBasis: 'high_estimate_line_item',
      sourceEstimatedCredits: line.estimatedCredits,
      reservedHighCredits: highCredits,
      serviceFeeIncludedInToolCosts: false,
      noLedgerWrite: true,
    },
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      noSpend: true,
      noSettlement: true,
    },
  }
}

function fallbackReservationLine(
  estimate: CreditEstimateRecord,
  reservation: CreditReservationRecord,
  requiredHoldCredits: number,
  createdAt: string,
): CreditReservationLineItemRecord {
  return {
    id: createMockId('credit_reservation_line_item'),
    creditReservationId: reservation.id,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    usageCategory: 'other',
    reservedCredits: requiredHoldCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    linePayload: {
      milestone: 'RP-RESERVATION-01',
      reservationHoldBasis: 'maximum_estimate_without_line_items',
      creditEstimateId: estimate.id,
      requiredHoldCredits,
      noLedgerWrite: true,
    },
    createdAt,
    updatedAt: createdAt,
    metadata: {
      mockOnly: true,
      noSpend: true,
      noSettlement: true,
    },
  }
}

function resolveRequiredHoldCredits(preview: EditCreditEstimatePreview): {
  ok: boolean
  requiredHoldCredits: number
  message: string
  warnings: string[]
} {
  const estimateMaximum = preview.estimate.maximumEstimatedCredits
  const summaryMaximum = preview.summary.maximumEstimatedCredits
  const summaryHold = preview.summary.requiredHoldCredits
  if (!isNonNegativeInteger(estimateMaximum) || estimateMaximum <= 0) {
    return {
      ok: false,
      requiredHoldCredits: 0,
      message: 'Credit estimate is missing a positive maximumEstimatedCredits value.',
      warnings: ['Reservation blocked instead of falling back to totalEstimatedCredits.'],
    }
  }
  if (estimateMaximum !== summaryMaximum || estimateMaximum !== summaryHold) {
    return {
      ok: false,
      requiredHoldCredits: estimateMaximum,
      message: 'Credit estimate maximum and required hold values do not match.',
      warnings: ['Reservation requires maximumEstimatedCredits, summary.maximumEstimatedCredits, and summary.requiredHoldCredits to match.'],
    }
  }
  return {
    ok: true,
    requiredHoldCredits: estimateMaximum,
    message: 'Required hold uses maximumEstimatedCredits.',
    warnings: [],
  }
}

function blockedResponse(
  status: Exclude<ReserveMaxEstimateCreditsStatus, 'reserved' | 'already_reserved'>,
  input: ReserveMaxEstimateCreditsRequest,
  wallet: CreditWalletRecord | null,
  requiredHoldCredits: number,
  userFacingMessage: string,
  warnings: string[],
): ReserveMaxEstimateCreditsResponse {
  const balance = wallet ? toWalletBalance(wallet) : null
  const availableCredits = balance?.availableCredits ?? 0
  return {
    status,
    reservation: null,
    reservationLineItems: [],
    creditWallet: wallet,
    walletBalance: balance,
    requiredHoldCredits,
    availableCreditsBeforeReservation: availableCredits,
    availableCreditsAfterReservation: availableCredits,
    reservedCreditsAfterReservation: balance?.reservedCredits ?? 0,
    requiredTopUpCredits: Math.max(0, requiredHoldCredits - availableCredits),
    idempotencyStatus: 'not_created',
    userFacingMessage,
    safetyFlags: safetyFlags(false),
    warnings: [
      ...warnings,
      'RP-RESERVATION-01 mock reservation path made no live billing/payment/provider/persistence/render/export/top-up side effect.',
      `Idempotency key: ${input.idempotencyKey}.`,
    ],
  }
}

function reservedResponse(
  status: 'reserved' | 'already_reserved',
  input: ReserveMaxEstimateCreditsRequest,
  wallet: CreditWalletRecord,
  reservation: CreditReservationRecord,
  reservationLineItems: CreditReservationLineItemRecord[],
  requiredHoldCredits: number,
  availableCreditsBeforeReservation: number,
  idempotencyStatus: 'created' | 'duplicate_returned',
  warnings: string[],
): ReserveMaxEstimateCreditsResponse {
  return {
    status,
    reservation,
    reservationLineItems,
    creditWallet: wallet,
    walletBalance: toWalletBalance(wallet),
    requiredHoldCredits,
    availableCreditsBeforeReservation,
    availableCreditsAfterReservation: wallet.cachedAvailableCredits,
    reservedCreditsAfterReservation: wallet.cachedReservedCredits,
    requiredTopUpCredits: 0,
    idempotencyStatus,
    userFacingMessage: status === 'reserved'
      ? 'Maximum estimate credits are reserved in mock state.'
      : 'A mock reservation already exists; no additional credits were reserved.',
    safetyFlags: safetyFlags(status === 'reserved' && idempotencyStatus === 'created'),
    warnings: [
      ...warnings,
      `Idempotency key: ${input.idempotencyKey}.`,
    ],
  }
}

function additionalHoldResponse(
  status: ReserveAdditionalCreditsForRevisionActionStatus,
  reservation: CreditReservationRecord | null,
  wallet: CreditWalletRecord | null,
  reservationLineItems: CreditReservationLineItemRecord[],
  additionalHoldCredits: number,
  availableCreditsBeforeReservation: number,
  userFacingMessage: string,
  warnings: string[],
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created' = 'not_created',
): ReserveAdditionalCreditsForRevisionActionResult {
  const balance = wallet ? toWalletBalance(wallet) : null
  const mutated = status === 'reserved' && idempotencyStatus === 'created'
  return {
    status,
    reservation,
    reservationLineItems,
    wallet,
    walletBalance: balance,
    additionalHoldCredits,
    availableCreditsBeforeReservation,
    availableCreditsAfterReservation: balance?.availableCredits ?? availableCreditsBeforeReservation,
    reservedCreditsAfterReservation: balance?.reservedCredits ?? 0,
    requiredTopUpCredits: status === 'insufficient_credits'
      ? Math.max(0, additionalHoldCredits - availableCreditsBeforeReservation)
      : 0,
    idempotencyStatus,
    walletMutated: mutated,
    reservationMutated: mutated,
    userFacingMessage,
    warnings: [
      ...warnings,
      'Additional hold path is mock-only and does not spend, release, refund, settle, unlock export, call providers, run workers, render/export, checkout/top-up, or write Supabase.',
    ],
  }
}

function safetyFlags(mutated: boolean): ReserveMaxEstimateCreditsSafetyFlags {
  return {
    mockOnly: true,
    requiredHoldUsesMaximumEstimate: true,
    walletMutated: mutated,
    reservationMutated: mutated,
    creditsReserved: mutated,
    creditsSpent: false,
    ledgerWritten: false,
    settlementExecuted: false,
    providerCalled: false,
    workerRun: false,
    renderOrExportStarted: false,
    exportUnlocked: false,
    checkoutOrTopUpStarted: false,
    supabaseWritten: false,
    serviceFeeIncludedInToolCosts: false,
  }
}

function toWalletBalance(wallet: CreditWalletRecord): CreditReservationWalletBalance {
  return {
    creditWalletId: wallet.id,
    workspaceId: wallet.workspaceId,
    userId: wallet.userId,
    walletType: wallet.walletType,
    availableCredits: wallet.cachedAvailableCredits,
    reservedCredits: wallet.cachedReservedCredits,
    spentCredits: wallet.cachedSpentCredits,
    refundedCredits: wallet.cachedRefundedCredits,
  }
}

function findReservationWallet(
  store: MockCreditReservationStore,
  input: ReserveMaxEstimateCreditsRequest,
): CreditWalletRecord | undefined {
  if (input.creditWalletId) {
    return store.creditWallets.find((wallet) =>
      wallet.id === input.creditWalletId &&
      wallet.workspaceId === input.workspaceId)
  }

  return store.creditWallets.find((wallet) =>
    wallet.workspaceId === input.workspaceId &&
    (!input.approvedByUserId || wallet.userId === input.approvedByUserId))
}

function resolveLineHighCredits(line: CreditEstimateLineItemRecord): number {
  const payload = asRecord(line.linePayload)
  const directHighCredits = payload ? payload.highCredits : undefined
  if (isNonNegativeInteger(directHighCredits)) return directHighCredits

  const serviceFeeEstimate = asRecord(payload?.serviceFeeEstimate)
  const highServiceFeeCredits = serviceFeeEstimate ? serviceFeeEstimate.highServiceFeeCredits : undefined
  if (isNonNegativeInteger(highServiceFeeCredits)) return highServiceFeeCredits

  return line.estimatedCredits
}

function findServiceFeeLineIndex(lines: CreditReservationLineItemRecord[]): number {
  return lines.findIndex((line) => {
    const payload = asRecord(line.linePayload)
    return payload?.lineItemRole === 'reeditpro_service_fee' || line.usageCategory === 'admin'
  })
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  const timestamp = Date.parse(expiresAt)
  return Number.isNaN(timestamp) || timestamp <= Date.now()
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function asRecord(value: unknown): JSONObject | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JSONObject
    : undefined
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
