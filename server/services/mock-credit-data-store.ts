import type {
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CreditRevisionActionResolutionResponse,
  CreditRevisionActionResolutionStatus,
  CreditRevisionActionRecord,
  CreditRevisionPauseReason,
  CreditRevisionUserOption,
  CreditReservationLineItemRecord,
  CreditReservationRecord,
  CreditReservationWalletBalance,
  CreditSettlementRecord,
  CreditSettlementMode,
  EditCreditCostSummary,
  EditCreditCostSummaryLine,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  JSONObject,
  SettleCreditReservationRequest,
  SettleCreditReservationResponse,
  SettleCreditReservationStatus,
} from '../../src/types'
import {
  calculateReEditProFinalChargeCredits,
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY,
  REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import { creditRevisionActionRecordSchema, creditSettlementRecordSchema } from '../validation/credit-data-schemas'
import { createMockId, nowIso } from './service-helpers'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import { summarizeMockToolCostEvents } from '../tool-cost-metering/cost-math'
import {
  reserveAdditionalCreditsForRevisionAction,
  getCreditReservation,
  listCreditReservationLineItems,
  getMockCreditWalletBalance,
  type MockCreditReservationStore,
  type ReserveAdditionalCreditsForRevisionActionResult,
} from './mock-credit-reservation-store'
import {
  getEditCreditEstimatePreview,
  type MockCreditEstimateStore,
} from './mock-credit-estimate-store'
import {
  createMockToolCostStore,
  listMockToolCostEventsByIds,
  listMockToolCostEventsForProject,
  type MockToolCostStore,
} from '../tool-cost-metering/mock-tool-cost-store'
import type { MockToolCostEvent } from '../tool-cost-metering/types'

export interface MockCreditDataStore {
  creditSettlements: CreditSettlementRecord[]
  creditRevisionActions: CreditRevisionActionRecord[]
  toolCostStore: MockToolCostStore
  walletMutationRecords: unknown[]
  reservationMutationRecords: unknown[]
  ledgerMutationRecords: unknown[]
  exportUnlockRecords: unknown[]
  jobEnqueueRecords: unknown[]
}

export interface CreateCreditRevisionActionInput {
  workspaceId: string
  projectId: string
  editPlanId?: string | null
  chatSessionId?: string | null
  jobBatchId?: string | null
  jobId?: string | null
  creditEstimateId: string
  creditReservationId: string
  previousCreditEstimateId?: string | null
  revisedCreditEstimateId?: string | null
  editComputeLevel: CreditRevisionActionRecord['editComputeLevel']
  status?: CreditRevisionActionRecord['status']
  pauseReason: CreditRevisionPauseReason
  approvedMaxCredits: number
  usedOrCommittedCredits: number
  additionalLowCredits: number
  additionalExpectedCredits: number
  additionalHighCredits: number
  newMaximumEstimatedCredits: number
  reasonSummary: string
  selectedOptionId?: string | null
  resolvedByUserId?: string | null
  resolvedAt?: string | null
  idempotencyKey: string
  metadata?: JSONObject
  expiresAt?: string | null
}

export function createMockCreditDataStore(
  toolCostEvents: MockToolCostEvent[] = [],
): MockCreditDataStore {
  return {
    creditSettlements: [],
    creditRevisionActions: [],
    toolCostStore: createMockToolCostStore(toolCostEvents),
    walletMutationRecords: [],
    reservationMutationRecords: [],
    ledgerMutationRecords: [],
    exportUnlockRecords: [],
    jobEnqueueRecords: [],
  }
}

export function insertCreditSettlement(
  store: MockCreditDataStore,
  settlement: CreditSettlementRecord,
): CreditSettlementRecord {
  const validated = creditSettlementRecordSchema.parse(settlement) as CreditSettlementRecord
  store.creditSettlements.push(validated)
  return validated
}

export function getCreditSettlement(
  store: MockCreditDataStore,
  id: string,
): CreditSettlementRecord | undefined {
  return store.creditSettlements.find((settlement) => settlement.id === id)
}

export function listCreditSettlementsForProject(
  store: MockCreditDataStore,
  projectId: string,
): CreditSettlementRecord[] {
  return store.creditSettlements.filter((settlement) => settlement.projectId === projectId)
}

export function getCreditSettlementForReservation(
  store: MockCreditDataStore,
  creditReservationId: string,
): CreditSettlementRecord | undefined {
  return store.creditSettlements.find((settlement) =>
    settlement.creditReservationId === creditReservationId &&
    settlement.status !== 'previewed')
}

export function upsertCreditSettlementByIdempotencyKey(
  store: MockCreditDataStore,
  settlement: CreditSettlementRecord,
): CreditSettlementRecord {
  const existing = store.creditSettlements.find((record) =>
    record.workspaceId === settlement.workspaceId &&
    record.idempotencyKey === settlement.idempotencyKey)
  if (existing) return existing
  return insertCreditSettlement(store, settlement)
}

export function insertCreditRevisionAction(
  store: MockCreditDataStore,
  action: CreditRevisionActionRecord,
): CreditRevisionActionRecord {
  const validated = creditRevisionActionRecordSchema.parse(action) as CreditRevisionActionRecord
  store.creditRevisionActions.push(validated)
  return validated
}

export function getCreditRevisionAction(
  store: MockCreditDataStore,
  id: string,
): CreditRevisionActionRecord | undefined {
  return store.creditRevisionActions.find((action) => action.id === id)
}

export function getCreditRevisionActionByIdempotencyKey(
  store: MockCreditDataStore,
  workspaceId: string,
  idempotencyKey: string,
): CreditRevisionActionRecord | undefined {
  return store.creditRevisionActions.find((action) =>
    action.workspaceId === workspaceId &&
    action.idempotencyKey === idempotencyKey)
}

export function listCreditRevisionActionsForProject(
  store: MockCreditDataStore,
  projectId: string,
): CreditRevisionActionRecord[] {
  return store.creditRevisionActions.filter((action) => action.projectId === projectId)
}

export function upsertCreditRevisionActionByIdempotencyKey(
  store: MockCreditDataStore,
  action: CreditRevisionActionRecord,
): CreditRevisionActionRecord {
  const existing = store.creditRevisionActions.find((record) =>
    record.workspaceId === action.workspaceId &&
    record.idempotencyKey === action.idempotencyKey)
  if (existing) return existing
  return insertCreditRevisionAction(store, action)
}

export function createCreditRevisionActionRecord(
  input: CreateCreditRevisionActionInput,
): CreditRevisionActionRecord {
  const copy = input.pauseReason === 'export_top_up_required'
    ? createExportTopUpCopy()
    : createRevisedEstimateCopy()

  return {
    id: createMockId('credit_revision_action'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? null,
    chatSessionId: input.chatSessionId ?? null,
    jobBatchId: input.jobBatchId ?? null,
    jobId: input.jobId ?? null,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    previousCreditEstimateId: input.previousCreditEstimateId ?? null,
    revisedCreditEstimateId: input.revisedCreditEstimateId ?? null,
    editComputeLevel: input.editComputeLevel,
    status: input.status ?? 'action_required',
    pauseReason: input.pauseReason,
    approvedMaxCredits: input.approvedMaxCredits,
    usedOrCommittedCredits: input.usedOrCommittedCredits,
    additionalLowCredits: input.additionalLowCredits,
    additionalExpectedCredits: input.additionalExpectedCredits,
    additionalHighCredits: input.additionalHighCredits,
    newMaximumEstimatedCredits: input.newMaximumEstimatedCredits,
    reasonSummary: input.reasonSummary,
    actionRequiredTitle: copy.title,
    actionRequiredMessage: copy.message,
    userOptions: copy.options,
    selectedOptionId: input.selectedOptionId ?? null,
    resolvedByUserId: input.resolvedByUserId ?? null,
    resolvedAt: input.resolvedAt ?? null,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata ?? { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    expiresAt: input.expiresAt ?? null,
  }
}

export function approveCreditRevisionAction(
  store: MockCreditDataStore,
  reservationStore: MockCreditReservationStore,
  input: ApproveCreditRevisionActionRequest,
): CreditRevisionActionResolutionResponse {
  const action = getCreditRevisionAction(store, input.creditRevisionActionId)
  const validation = validateResolvableAction(action, input.workspaceId, input.projectId, 'approve-and-continue')
  if (!validation.ok) return actionResolutionResponse(validation.status, action ?? null, null, [], null, 0, 0, 'not_created', validation.message, validation.warnings)

  const duplicate = duplicateResolution(action as CreditRevisionActionRecord, input.idempotencyKey)
  if (duplicate) {
    return actionResolutionResponse('already_resolved', duplicate, null, [], null, 0, 0, 'duplicate_returned', 'This revised-credit action was already resolved with this idempotency key.', [
      'Duplicate resolution request returned the existing action; no additional mock hold occurred.',
    ], { requiresRuntimeGuardRecheck: duplicate.status === 'approved' })
  }
  const state = validateActionRequired(action as CreditRevisionActionRecord)
  if (!state.ok) return actionResolutionResponse(state.status, action as CreditRevisionActionRecord, null, [], null, 0, 0, 'not_created', state.message, state.warnings)

  if ((action as CreditRevisionActionRecord).creditReservationId !== input.creditReservationId) {
    return actionResolutionResponse('invalid_request', action as CreditRevisionActionRecord, null, [], null, 0, 0, 'not_created', 'Credit reservation does not match the revised-credit action.', [
      'No mock wallet, reservation, or revision action mutation occurred.',
    ])
  }

  const hold = reserveAdditionalCreditsForRevisionAction(reservationStore, {
    action: action as CreditRevisionActionRecord,
    creditReservationId: input.creditReservationId,
    requestedByUserId: input.approvedByUserId,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
  })
  if (hold.status === 'insufficient_credits' || hold.status === 'reservation_not_found' || hold.status === 'inactive_reservation' || hold.status === 'wallet_not_found' || hold.status === 'invalid_request') {
    return actionResolutionFromHold(hold, hold.status, action as CreditRevisionActionRecord, hold.userFacingMessage, [
      ...hold.warnings,
      'The revised-credit action remains action_required until the user can approve a funded additional hold or choose another option.',
    ])
  }

  const resolved = resolveAction(action as CreditRevisionActionRecord, {
    status: 'approved',
    selectedOptionId: 'approve-and-continue',
    resolvedByUserId: input.approvedByUserId,
    resolutionIdempotencyKey: input.idempotencyKey,
    resolutionMetadata: {
      ...(input.metadata ?? {}),
      additionalHoldCredits: hold.additionalHoldCredits,
      requiredTopUpCredits: hold.requiredTopUpCredits,
      reservationId: hold.reservation?.id ?? input.creditReservationId,
      reservationReservedCredits: hold.reservation?.reservedCredits ?? 0,
    },
  })

  return actionResolutionFromHold(hold, 'approved', resolved, 'Revised credit action approved. Paid work has not started; rerun the runtime guard to continue.', [
    ...hold.warnings,
    'Approve & Continue only resolves the mock action and increases the mock hold when needed.',
    'Paid work may continue only after a later explicit runtime guard evaluation passes.',
  ], {
    requiresRuntimeGuardRecheck: true,
    idempotencyStatus: hold.idempotencyStatus === 'created' || hold.idempotencyStatus === 'duplicate_returned'
      ? hold.idempotencyStatus
      : 'created',
  })
}

export function chooseLowerCostCreditRevisionOption(
  store: MockCreditDataStore,
  input: ChooseLowerCostCreditRevisionOptionRequest,
): CreditRevisionActionResolutionResponse {
  const action = getCreditRevisionAction(store, input.creditRevisionActionId)
  const validation = validateResolvableAction(action, input.workspaceId, input.projectId, input.selectedOptionId)
  if (!validation.ok) return actionResolutionResponse(validation.status, action ?? null, null, [], null, 0, 0, 'not_created', validation.message, validation.warnings)

  const selectedOption = (action as CreditRevisionActionRecord).userOptions.find((option) => option.id === input.selectedOptionId)
  if (selectedOption?.action !== 'choose_lower_cost_option') {
    return actionResolutionResponse('invalid_request', action as CreditRevisionActionRecord, null, [], null, 0, 0, 'not_created', 'Selected option is not a lower-cost option for this revised-credit action.', [
      'No mock wallet, reservation, worker, provider, or render mutation occurred.',
    ])
  }

  const duplicate = duplicateResolution(action as CreditRevisionActionRecord, input.idempotencyKey)
  if (duplicate) {
    return actionResolutionResponse('already_resolved', duplicate, null, [], null, 0, 0, 'duplicate_returned', 'This revised-credit action was already resolved with this idempotency key.', [
      'Duplicate lower-cost resolution request returned the existing action.',
    ], { requiresNewEstimateOrPlan: true })
  }
  const state = validateActionRequired(action as CreditRevisionActionRecord)
  if (!state.ok) return actionResolutionResponse(state.status, action as CreditRevisionActionRecord, null, [], null, 0, 0, 'not_created', state.message, state.warnings)

  const resolved = resolveAction(action as CreditRevisionActionRecord, {
    status: 'lower_cost_selected',
    selectedOptionId: input.selectedOptionId,
    resolvedByUserId: input.selectedByUserId,
    resolutionIdempotencyKey: input.idempotencyKey,
    resolutionMetadata: input.metadata ?? {},
  })

  return actionResolutionResponse('lower_cost_selected', resolved, null, [], null, 0, 0, 'created', 'Lower-cost option selected. Build a new lower-cost plan or estimate before paid work continues.', [
    'No additional credits were reserved.',
    'The original paid tool does not automatically resume after choosing a lower-cost option.',
  ], { requiresNewEstimateOrPlan: true })
}

export function cancelCreditRevisionAction(
  store: MockCreditDataStore,
  input: CancelCreditRevisionActionRequest,
): CreditRevisionActionResolutionResponse {
  const action = getCreditRevisionAction(store, input.creditRevisionActionId)
  const validation = validateResolvableAction(action, input.workspaceId, input.projectId, 'cancel-extra-work')
  if (!validation.ok) return actionResolutionResponse(validation.status, action ?? null, null, [], null, 0, 0, 'not_created', validation.message, validation.warnings)

  const duplicate = duplicateResolution(action as CreditRevisionActionRecord, input.idempotencyKey)
  if (duplicate) {
    return actionResolutionResponse('already_resolved', duplicate, null, [], null, 0, 0, 'duplicate_returned', 'This revised-credit action was already resolved with this idempotency key.', [
      'Duplicate cancellation request returned the existing action.',
    ], { extraWorkCancelled: true })
  }
  const state = validateActionRequired(action as CreditRevisionActionRecord)
  if (!state.ok) return actionResolutionResponse(state.status, action as CreditRevisionActionRecord, null, [], null, 0, 0, 'not_created', state.message, state.warnings)

  const resolved = resolveAction(action as CreditRevisionActionRecord, {
    status: 'cancelled',
    selectedOptionId: 'cancel-extra-work',
    resolvedByUserId: input.cancelledByUserId,
    resolutionIdempotencyKey: input.idempotencyKey,
    resolutionMetadata: {
      ...(input.metadata ?? {}),
      cancellationReason: input.cancellationReason ?? null,
    },
  })

  return actionResolutionResponse('cancelled', resolved, null, [], null, 0, 0, 'created', 'Extra over-budget work was cancelled in mock state.', [
    'Existing mock reservation remains unchanged.',
    'No spend, refund, release, settlement, worker, provider, render/export, checkout/top-up, or export unlock occurred.',
  ], { extraWorkCancelled: true })
}

export function previewCreditSettlement(
  store: MockCreditDataStore,
  request: PreviewCreditSettlementRequest,
): PreviewCreditSettlementResponse {
  const events = request.toolCostEventIds?.length
    ? listMockToolCostEventsByIds(store.toolCostStore, request.toolCostEventIds)
    : listMockToolCostEventsForProject(store.toolCostStore, request.projectId)
  const aggregation = summarizeMockToolCostEvents(events)
  const finalCharge = calculateReEditProFinalChargeCredits({
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    durationSeconds: request.finalVideoDurationSeconds,
    editLevel: request.editComputeLevel,
  })
  const customEstimateRequired = finalCharge.finalChargeCredits === null || finalCharge.serviceFeeCredits === null
  const reeditproServiceFeeCredits = finalCharge.serviceFeeCredits ?? 0
  const finalChargeCredits = finalCharge.finalChargeCredits ?? aggregation.actualBillableCostCredits
  const outstandingCredits = customEstimateRequired
    ? 0
    : Math.max(0, finalChargeCredits - request.reservedCredits)
  const releasedCredits = customEstimateRequired
    ? 0
    : Math.max(0, request.reservedCredits - finalChargeCredits)

  const status: CreditSettlementRecord['status'] = customEstimateRequired
    ? 'requires_revised_estimate'
    : outstandingCredits > 0
      ? 'requires_top_up_before_export'
      : 'previewed'
  const settlementReason: CreditSettlementRecord['settlementReason'] = customEstimateRequired
    ? 'projected_overage'
    : outstandingCredits > 0
      ? 'approved_but_unfunded'
      : 'edit_completed'

  const settlement: CreditSettlementRecord = {
    id: createMockId('credit_settlement_preview'),
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editPlanId: request.editPlanId ?? null,
    chatSessionId: null,
    jobBatchId: null,
    creditWalletId: null,
    creditEstimateId: request.creditEstimateId,
    creditReservationId: request.creditReservationId,
    creditApprovalId: null,
    editComputeLevel: request.editComputeLevel,
    finalVideoDurationSeconds: request.finalVideoDurationSeconds,
    status,
    settlementReason,
    reservedCredits: request.reservedCredits,
    actualToolCostCents: aggregation.actualBillableCostCents,
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    reeditproServiceFeeCredits,
    finalChargeCredits,
    releasedCredits,
    absorbedOverageCredits: 0,
    outstandingCredits,
    billableToolEventCount: aggregation.billableEventCount,
    nonBillableToolEventCount: aggregation.nonBillableEventCount,
    toolCostEventIds: events.map((event) => event.id),
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
    serviceFeePolicyVersion: REEDITPRO_SERVICE_FEE_POLICY_VERSION,
    idempotencyKey: request.idempotencyKey,
    settlementPayload: {
      previewOnly: true,
      noWalletMutation: true,
      noReservationMutation: true,
      noLedgerWrite: true,
      noExportUnlock: true,
    },
    receiptPayload: {},
    metadata: {
      mockOnly: true,
      readOnlyPreview: true,
      customEstimateRequired,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    settledAt: null,
    failedAt: null,
  }
  const summary = buildEditCreditCostSummary(settlement, events)
  settlement.receiptPayload = asJsonObject({
    userFacingLines: summary.userFacingLines.map((line): JSONObject => ({
      label: line.label,
      credits: line.credits,
      ...(line.description ? { description: line.description } : {}),
    })),
    warnings: summary.warnings,
  })

  return {
    settlement,
    summary,
    requiresAction: status === 'requires_revised_estimate' || status === 'requires_top_up_before_export',
    requiredActionType: status === 'requires_revised_estimate'
      ? 'revised_estimate'
      : status === 'requires_top_up_before_export'
        ? 'top_up_before_export'
        : 'none',
    warnings: [
      'Settlement preview is read-only; no wallet, reservation, ledger, job, export, Stripe, or provider mutation occurred.',
      ...(customEstimateRequired ? ['Custom duration requires a revised estimate before paid continuation.'] : []),
      ...(outstandingCredits > 0 ? ['Outstanding credits must be addressed before export in a later milestone.'] : []),
    ],
  }
}

export function settleCreditReservation(
  store: MockCreditDataStore,
  reservationStore: MockCreditReservationStore,
  estimateStore: MockCreditEstimateStore,
  request: SettleCreditReservationRequest,
): SettleCreditReservationResponse {
  const existingByIdempotency = store.creditSettlements.find((settlement) =>
    settlement.workspaceId === request.workspaceId &&
    settlement.idempotencyKey === request.idempotencyKey)
  if (existingByIdempotency) {
    return settlementResponse(
      resolveSettlementResponseStatus(existingByIdempotency.status),
      existingByIdempotency,
      getCreditReservation(reservationStore, existingByIdempotency.creditReservationId) ?? null,
      existingByIdempotency.creditReservationId
        ? listCreditReservationLineItems(reservationStore, existingByIdempotency.creditReservationId)
        : [],
      walletBalanceForReservation(reservationStore, getCreditReservation(reservationStore, existingByIdempotency.creditReservationId)),
      buildEditCreditCostSummary(existingByIdempotency, settlementContextEvents(store, request)),
      'duplicate_returned',
      userFacingCopy(existingByIdempotency).title,
      userFacingCopy(existingByIdempotency).message,
      false,
      false,
      [
        'Duplicate settlement idempotency key returned the existing mock settlement.',
        'No second mock wallet, reservation, ledger, export, provider, worker, render, checkout, or top-up mutation occurred.',
      ],
    )
  }

  const preview = getEditCreditEstimatePreview(estimateStore, request.creditEstimateId)
  if (!preview) {
    return blockedSettlementResponse('estimate_not_found', 'Credit estimate was not found.', [
      'No mock settlement, wallet, reservation, ledger, export, provider, worker, render, checkout, or top-up mutation occurred.',
    ])
  }

  const reservation = getCreditReservation(reservationStore, request.creditReservationId)
  if (!reservation) {
    return blockedSettlementResponse('reservation_not_found', 'Credit reservation was not found.', [
      'No mock settlement, wallet, reservation, ledger, export, provider, worker, render, checkout, or top-up mutation occurred.',
    ])
  }

  const existingForReservation = getCreditSettlementForReservation(store, request.creditReservationId)
  if (existingForReservation) {
    return settlementResponse(
      'already_settled',
      existingForReservation,
      reservation,
      listCreditReservationLineItems(reservationStore, reservation.id),
      walletBalanceForReservation(reservationStore, reservation),
      buildEditCreditCostSummary(existingForReservation, settlementContextEvents(store, request)),
      'duplicate_returned',
      'Final credit charge already settled',
      'This mock reservation already has a final settlement; no second spend or release occurred.',
      false,
      false,
      [
        'A reservation cannot be settled twice in RP-SETTLEMENT-01.',
        'No additional mock wallet or reservation mutation occurred.',
      ],
    )
  }

  if (!reservationMatchesRequest(reservation, request)) {
    return blockedSettlementResponse('invalid_request', 'Credit reservation scope does not match the settlement request.', [
      'Reservation must match workspace, project, estimate, and optional edit plan.',
    ], reservation)
  }

  if (reservation.status !== 'reserved') {
    return blockedSettlementResponse('reservation_not_active', 'Only active reserved mock reservations can be settled.', [
      `Reservation status ${reservation.status} is not active for final mock settlement.`,
    ], reservation)
  }

  const wallet = reservationStore.creditWallets.find((candidate) => candidate.id === reservation.creditWalletId) ?? null
  if (!wallet) {
    return blockedSettlementResponse('invalid_request', 'Credit wallet was not found for the reservation.', [
      'No mock settlement, wallet, reservation, ledger, export, provider, worker, render, checkout, or top-up mutation occurred.',
    ], reservation)
  }

  if (wallet.cachedReservedCredits < reservation.reservedCredits) {
    return blockedSettlementResponse('invalid_request', 'Mock wallet reserved balance is lower than the reservation hold.', [
      'Settlement was blocked instead of creating a negative reserved balance.',
    ], reservation, walletToBalance(wallet))
  }

  const events = settlementContextEvents(store, request)
  const invalidServiceFeeEvent = events.find((event) =>
    (event as { serviceFeeIncluded?: unknown }).serviceFeeIncluded !== false)
  if (invalidServiceFeeEvent) {
    return blockedSettlementResponse('invalid_request', 'Tool-cost event includes a service fee, which settlement cannot accept.', [
      `Invalid tool-cost event: ${invalidServiceFeeEvent.id}.`,
      'Tool owners must report actual internal tool cost only.',
    ], reservation, walletToBalance(wallet))
  }

  if (request.settlementMode === 'preview_only') {
    const previewResult = previewCreditSettlement(store, {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editPlanId: request.editPlanId ?? null,
      creditEstimateId: request.creditEstimateId,
      creditReservationId: request.creditReservationId,
      editComputeLevel: request.productEditLevel,
      finalVideoDurationSeconds: request.finalVideoDurationSeconds,
      reservedCredits: reservation.reservedCredits,
      toolCostEventIds: events.map((event) => event.id),
      idempotencyKey: request.idempotencyKey,
    })
    return settlementResponse(
      'previewed',
      previewResult.settlement,
      reservation,
      listCreditReservationLineItems(reservationStore, reservation.id),
      walletToBalance(wallet),
      previewResult.summary,
      'not_created',
      'Final credit charge previewed',
      'Settlement preview is read-only; no credits were spent or released.',
      false,
      false,
      previewResult.warnings,
    )
  }

  const aggregation = summarizeMockToolCostEvents(events)
  const finalCharge = calculateReEditProFinalChargeCredits({
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    durationSeconds: request.finalVideoDurationSeconds,
    editLevel: request.productEditLevel,
  })
  if (finalCharge.finalChargeCredits === null || finalCharge.serviceFeeCredits === null) {
    return blockedSettlementResponse('invalid_request', 'Final duration requires a custom credit settlement before mock spend/release.', [
      '60+ minute custom-estimate settlement is blocked in RP-SETTLEMENT-01 unless a future approved custom settlement exists.',
      'No mock wallet or reservation mutation occurred.',
    ], reservation, walletToBalance(wallet))
  }

  const computedFinalChargeCredits = finalCharge.finalChargeCredits
  const outcome = settlementOutcome(request.settlementMode, computedFinalChargeCredits, reservation.reservedCredits)
  const createdAt = nowIso()
  const settlement: CreditSettlementRecord = {
    id: createMockId('credit_settlement'),
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editPlanId: request.editPlanId ?? null,
    chatSessionId: null,
    jobBatchId: null,
    creditWalletId: wallet.id,
    creditEstimateId: request.creditEstimateId,
    creditReservationId: request.creditReservationId,
    creditApprovalId: reservation.creditApprovalId ?? null,
    editComputeLevel: request.productEditLevel,
    finalVideoDurationSeconds: request.finalVideoDurationSeconds,
    status: outcome.settlementStatus,
    settlementReason: outcome.reason,
    reservedCredits: reservation.reservedCredits,
    actualToolCostCents: aggregation.actualBillableCostCents,
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    reeditproServiceFeeCredits: finalCharge.serviceFeeCredits,
    finalChargeCredits: outcome.userFinalChargeCredits,
    releasedCredits: outcome.releasedCredits,
    absorbedOverageCredits: outcome.absorbedOverageCredits,
    outstandingCredits: outcome.outstandingCredits,
    billableToolEventCount: aggregation.billableEventCount,
    nonBillableToolEventCount: aggregation.nonBillableEventCount,
    toolCostEventIds: events.map((event) => event.id),
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
    serviceFeePolicyVersion: REEDITPRO_SERVICE_FEE_POLICY_VERSION,
    idempotencyKey: request.idempotencyKey,
    settlementPayload: asJsonObject({
      milestone: 'RP-SETTLEMENT-01',
      settlementMode: request.settlementMode,
      computedFinalChargeCredits,
      userFinalChargeCredits: outcome.userFinalChargeCredits,
      lineItemSettlementAllocationMode: outcome.mutatesReservation ? 'proportional_mock' : 'not_mutated',
      settledByUserId: request.settledByUserId ?? null,
      settledByAgent: request.settledByAgent ?? null,
      noProductionLedgerWrite: true,
      noExportUnlock: true,
      noCheckoutOrTopUp: true,
    }),
    receiptPayload: {},
    metadata: asJsonObject({
      ...(request.metadata ?? {}),
      mockOnly: true,
      milestone: 'RP-SETTLEMENT-01',
      serviceFeeIncludedInToolCosts: false,
      productionPersistence: false,
    }),
    createdAt,
    updatedAt: createdAt,
    settledAt: outcome.mutatesReservation ? createdAt : null,
    failedAt: null,
  }
  const summary = buildEditCreditCostSummary(settlement, events)
  settlement.receiptPayload = asJsonObject({
    userFacingLines: summary.userFacingLines.map((line): JSONObject => ({
      label: line.label,
      credits: line.credits,
      ...(line.description ? { description: line.description } : {}),
    })),
    warnings: summary.warnings,
    nonBillableAbsorbed: summary.nonBillableAbsorbed ?? null,
    computedFinalChargeCredits,
  })

  creditSettlementRecordSchema.parse(settlement)

  let lineItems = listCreditReservationLineItems(reservationStore, reservation.id)
  let walletMutated = false
  let reservationMutated = false
  if (outcome.mutatesReservation) {
    lineItems = applyMockSettlementToReservationLines(lineItems, {
      finalChargeCredits: outcome.userFinalChargeCredits,
      serviceFeeCredits: settlement.reeditproServiceFeeCredits,
    })
    const spentAt = nowIso()
    wallet.cachedReservedCredits -= reservation.reservedCredits
    wallet.cachedSpentCredits += outcome.userFinalChargeCredits
    wallet.cachedAvailableCredits += outcome.releasedCredits
    wallet.lastCalculatedAt = spentAt
    wallet.updatedAt = spentAt

    reservation.status = 'spent'
    reservation.spentCredits = outcome.userFinalChargeCredits
    reservation.releasedCredits = outcome.releasedCredits
    reservation.spentAt = spentAt
    reservation.releasedAt = outcome.releasedCredits > 0 ? spentAt : reservation.releasedAt
    reservation.updatedAt = spentAt
    reservation.metadata = {
      ...(reservation.metadata ?? {}),
      milestone: 'RP-SETTLEMENT-01',
      creditSettlementId: settlement.id,
      finalChargeCredits: outcome.userFinalChargeCredits,
      releasedCredits: outcome.releasedCredits,
      absorbedOverageCredits: outcome.absorbedOverageCredits,
      lineItemSettlementAllocationMode: 'proportional_mock',
      noLedgerWrite: true,
      noExportUnlock: true,
      noCheckoutOrTopUp: true,
    }
    walletMutated = true
    reservationMutated = true
    reservationStore.walletMutationRecords.push({
      mutation: 'mock_final_credit_settlement_wallet_updated',
      walletId: wallet.id,
      creditReservationId: reservation.id,
      creditSettlementId: settlement.id,
      finalChargeCredits: outcome.userFinalChargeCredits,
      releasedCredits: outcome.releasedCredits,
      createdAt: spentAt,
    })
    reservationStore.reservationMutationRecords.push({
      mutation: 'mock_credit_reservation_settled',
      creditReservationId: reservation.id,
      creditSettlementId: settlement.id,
      finalChargeCredits: outcome.userFinalChargeCredits,
      releasedCredits: outcome.releasedCredits,
      absorbedOverageCredits: outcome.absorbedOverageCredits,
      createdAt: spentAt,
    })
  }

  insertCreditSettlement(store, settlement)
  const copy = userFacingCopy(settlement)
  return settlementResponse(
    outcome.responseStatus,
    settlement,
    reservation,
    lineItems,
    walletToBalance(wallet),
    summary,
    'created',
    copy.title,
    copy.message,
    walletMutated,
    reservationMutated,
    [
      ...(outcome.mutatesReservation ? ['Reservation line items use lineItemSettlementAllocationMode = proportional_mock.'] : []),
      'RP-SETTLEMENT-01 is mock-only; no live billing, Stripe/payment, Supabase write, production wallet mutation, production ledger write, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
    ],
  )
}

export function buildEditCreditCostSummary(
  settlement: CreditSettlementRecord,
  events: readonly MockToolCostEvent[],
): EditCreditCostSummary {
  const aggregation = summarizeMockToolCostEvents(events)
  const lines: EditCreditCostSummaryLine[] = [
    receiptLine('Transcription', categoryCredits(aggregation.byUsageCategory, ['transcription', 'transcript'])),
    receiptLine('Media analysis', categoryCredits(aggregation.byUsageCategory, ['media_analysis'])),
    receiptLine('Captions', categoryCredits(aggregation.byUsageCategory, ['captions'])),
    receiptLine('Stroke Motion', categoryCredits(aggregation.byUsageCategory, ['stroke_motion'])),
    receiptLine('Graphic Design', categoryCredits(aggregation.byUsageCategory, ['graphic_design'])),
    receiptLine('Real Motion', categoryCredits(aggregation.byUsageCategory, ['real_motion'])),
    receiptLine('SoundSync', categoryCredits(aggregation.byUsageCategory, ['soundsync'])),
    receiptLine('Rendering/export', categoryCredits(aggregation.byUsageCategory, ['rendering', 'render_export'])),
    receiptLine('Other tools', categoryCredits(aggregation.byUsageCategory, ['other', 'basic_edit', 'pro_edit', 'signature_edit', 'premium_signature_edit', 'revision', 'admin'])),
    receiptLine('Actual tool cost', settlement.actualToolCostCredits, 'Tool owner cost only; ReEditPro service fee is separate.'),
    receiptLine('ReEditPro service fee', settlement.reeditproServiceFeeCredits),
    receiptLine('Final charge', settlement.finalChargeCredits),
    receiptLine('Reserved', settlement.reservedCredits),
    receiptLine('Returned', settlement.releasedCredits),
  ]

  if (settlement.absorbedOverageCredits > 0) {
    lines.push(receiptLine('ReEditPro absorbed', settlement.absorbedOverageCredits))
  }
  if (settlement.outstandingCredits > 0) {
    lines.push(receiptLine('Outstanding credits', settlement.outstandingCredits))
  }

  return {
    workspaceId: settlement.workspaceId,
    projectId: settlement.projectId,
    editPlanId: settlement.editPlanId,
    creditEstimateId: settlement.creditEstimateId,
    creditReservationId: settlement.creditReservationId,
    creditSettlementId: settlement.id,
    editComputeLevel: settlement.editComputeLevel,
    finalVideoDurationSeconds: settlement.finalVideoDurationSeconds,
    reservedCredits: settlement.reservedCredits,
    actualToolCostCents: settlement.actualToolCostCents,
    actualToolCostCredits: settlement.actualToolCostCredits,
    reeditproServiceFeeCredits: settlement.reeditproServiceFeeCredits,
    finalChargeCredits: settlement.finalChargeCredits,
    releasedCredits: settlement.releasedCredits,
    absorbedOverageCredits: settlement.absorbedOverageCredits,
    outstandingCredits: settlement.outstandingCredits,
    byUsageCategory: aggregation.byUsageCategory,
    nonBillableAbsorbed: aggregation.nonBillableEventCount > 0
      ? {
          eventCount: aggregation.nonBillableEventCount,
          actualInternalCostCents: aggregation.nonBillableCostCents,
          credits: aggregation.nonBillableCredits,
          reasons: aggregation.nonBillableReasons,
        }
      : undefined,
    userFacingLines: lines,
    warnings: [
      'Mock receipt summary only; no live billing, wallet mutation, reservation spend/release/refund, ledger write, or export unlock occurred.',
      ...(settlement.outstandingCredits > 0 ? ['Outstanding credits are informational only in this milestone.'] : []),
    ],
  }
}

function settlementContextEvents(
  store: MockCreditDataStore,
  request: Pick<SettleCreditReservationRequest, 'workspaceId' | 'projectId' | 'creditEstimateId' | 'creditReservationId' | 'toolCostEventIds'>,
): MockToolCostEvent[] {
  const sourceEvents = request.toolCostEventIds?.length
    ? listMockToolCostEventsByIds(store.toolCostStore, request.toolCostEventIds)
    : listMockToolCostEventsForProject(store.toolCostStore, request.projectId)
  return sourceEvents.filter((event) =>
    event.workspaceId === request.workspaceId &&
    event.projectId === request.projectId &&
    event.creditEstimateId === request.creditEstimateId &&
    event.creditReservationId === request.creditReservationId)
}

function reservationMatchesRequest(
  reservation: CreditReservationRecord,
  request: SettleCreditReservationRequest,
): boolean {
  return reservation.workspaceId === request.workspaceId &&
    reservation.projectId === request.projectId &&
    reservation.creditEstimateId === request.creditEstimateId &&
    reservation.id === request.creditReservationId &&
    (!request.editPlanId || reservation.editPlanId === request.editPlanId)
}

function settlementOutcome(
  mode: CreditSettlementMode,
  computedFinalChargeCredits: number,
  reservedCredits: number,
): {
  responseStatus: Extract<SettleCreditReservationStatus, 'settled' | 'settled_with_absorbed_overage' | 'requires_top_up_before_export'>
  settlementStatus: Extract<CreditSettlementRecord['status'], 'settled' | 'settled_with_absorbed_overage' | 'requires_top_up_before_export'>
  reason: CreditSettlementRecord['settlementReason']
  userFinalChargeCredits: number
  releasedCredits: number
  absorbedOverageCredits: number
  outstandingCredits: number
  mutatesReservation: boolean
} {
  if (computedFinalChargeCredits <= reservedCredits) {
    return {
      responseStatus: 'settled',
      settlementStatus: 'settled',
      reason: 'edit_completed',
      userFinalChargeCredits: computedFinalChargeCredits,
      releasedCredits: reservedCredits - computedFinalChargeCredits,
      absorbedOverageCredits: 0,
      outstandingCredits: 0,
      mutatesReservation: true,
    }
  }

  if (mode === 'approved_but_unfunded') {
    return {
      responseStatus: 'requires_top_up_before_export',
      settlementStatus: 'requires_top_up_before_export',
      reason: 'approved_but_unfunded',
      userFinalChargeCredits: computedFinalChargeCredits,
      releasedCredits: 0,
      absorbedOverageCredits: 0,
      outstandingCredits: computedFinalChargeCredits - reservedCredits,
      mutatesReservation: false,
    }
  }

  return {
    responseStatus: 'settled_with_absorbed_overage',
    settlementStatus: 'settled_with_absorbed_overage',
    reason: mode === 'force_absorb_unapproved_overage'
      ? 'reeditpro_failed_to_pause_absorbed'
      : 'reeditpro_failed_to_pause_absorbed',
    userFinalChargeCredits: reservedCredits,
    releasedCredits: 0,
    absorbedOverageCredits: computedFinalChargeCredits - reservedCredits,
    outstandingCredits: 0,
    mutatesReservation: true,
  }
}

function applyMockSettlementToReservationLines(
  lineItems: CreditReservationLineItemRecord[],
  input: {
    finalChargeCredits: number
    serviceFeeCredits: number
  },
): CreditReservationLineItemRecord[] {
  const updatedAt = nowIso()
  for (const line of lineItems) {
    line.spentCredits = 0
    line.releasedCredits = 0
  }

  let remainingSpend = input.finalChargeCredits
  const serviceLines = lineItems.filter(isServiceFeeReservationLine)
  let serviceFeeRemaining = Math.min(input.serviceFeeCredits, remainingSpend)
  for (const line of serviceLines) {
    const capacity = line.reservedCredits - line.spentCredits - line.refundedCredits
    const spend = Math.max(0, Math.min(capacity, serviceFeeRemaining))
    line.spentCredits += spend
    serviceFeeRemaining -= spend
    remainingSpend -= spend
  }

  const toolLines = lineItems.filter((line) => !isServiceFeeReservationLine(line))
  allocateProportionalSpend(toolLines.length > 0 ? toolLines : lineItems, Math.max(0, remainingSpend))

  for (const line of lineItems) {
    line.releasedCredits = Math.max(0, line.reservedCredits - line.spentCredits - line.refundedCredits)
    line.updatedAt = updatedAt
    line.linePayload = {
      ...(line.linePayload ?? {}),
      settlementAllocationMode: 'proportional_mock',
      settledSpentCredits: line.spentCredits,
      settledReleasedCredits: line.releasedCredits,
      noLedgerWrite: true,
    }
    line.metadata = {
      ...(line.metadata ?? {}),
      milestone: 'RP-SETTLEMENT-01',
      settledInMockState: true,
    }
  }
  return lineItems
}

function allocateProportionalSpend(
  lineItems: CreditReservationLineItemRecord[],
  spendCredits: number,
): void {
  if (spendCredits <= 0 || lineItems.length === 0) return
  const capacities = lineItems.map((line) => Math.max(0, line.reservedCredits - line.spentCredits - line.refundedCredits))
  const totalCapacity = capacities.reduce((total, value) => total + value, 0)
  if (totalCapacity <= 0) return

  const allocations = capacities.map((capacity) =>
    Math.min(capacity, Math.floor((spendCredits * capacity) / totalCapacity)))
  let allocated = allocations.reduce((total, value) => total + value, 0)
  let remainder = Math.min(spendCredits, totalCapacity) - allocated

  for (let index = 0; remainder > 0 && index < lineItems.length; index += 1) {
    const available = capacities[index] - allocations[index]
    if (available <= 0) continue
    const extra = Math.min(available, remainder)
    allocations[index] += extra
    allocated += extra
    remainder -= extra
  }

  lineItems.forEach((line, index) => {
    line.spentCredits += allocations[index]
  })
}

function isServiceFeeReservationLine(line: CreditReservationLineItemRecord): boolean {
  const payload = line.linePayload
  return payload?.lineItemRole === 'reeditpro_service_fee' || line.usageCategory === 'admin'
}

function resolveSettlementResponseStatus(status: CreditSettlementRecord['status']): SettleCreditReservationStatus {
  if (status === 'previewed') return 'previewed'
  if (status === 'settled') return 'settled'
  if (status === 'settled_with_absorbed_overage') return 'settled_with_absorbed_overage'
  if (status === 'requires_top_up_before_export') return 'requires_top_up_before_export'
  return 'invalid_request'
}

function settlementResponse(
  status: SettleCreditReservationStatus,
  settlement: CreditSettlementRecord | null,
  reservation: CreditReservationRecord | null,
  reservationLineItems: CreditReservationLineItemRecord[],
  walletBalance: CreditReservationWalletBalance | null,
  summary: EditCreditCostSummary | undefined,
  idempotencyStatus: SettleCreditReservationResponse['idempotencyStatus'],
  userFacingTitle: string,
  userFacingMessage: string,
  walletMutated: boolean,
  reservationMutated: boolean,
  warnings: string[],
): SettleCreditReservationResponse {
  return {
    status,
    settlement,
    reservation,
    reservationLineItems,
    walletBalance,
    summary,
    idempotencyStatus,
    userFacingTitle,
    userFacingMessage,
    safetyFlags: {
      mockOnly: true,
      walletMutated,
      reservationMutated,
      creditsSpent: walletMutated && (settlement?.finalChargeCredits ?? 0) > 0,
      creditsReleased: walletMutated && (settlement?.releasedCredits ?? 0) > 0,
      creditsRefunded: false,
      ledgerWritten: false,
      productionWalletMutated: false,
      productionSettlementWritten: false,
      providerCalled: false,
      workerRun: false,
      renderOrExportStarted: false,
      exportUnlocked: false,
      checkoutOrTopUpStarted: false,
      supabaseWritten: false,
      serviceFeeIncludedInToolCosts: false,
    },
    warnings: [
      ...warnings,
      'Settlement route/service is mock-only and does not wire live billing, Stripe/payment, Supabase persistence, production ledger writes, provider calls, render/export, checkout/top-up, or export unlock.',
    ],
  }
}

function blockedSettlementResponse(
  status: Exclude<SettleCreditReservationStatus, 'previewed' | 'settled' | 'settled_with_absorbed_overage' | 'requires_top_up_before_export' | 'already_settled'>,
  userFacingMessage: string,
  warnings: string[],
  reservation: CreditReservationRecord | null = null,
  walletBalance: CreditReservationWalletBalance | null = null,
): SettleCreditReservationResponse {
  return settlementResponse(
    status,
    null,
    reservation,
    [],
    walletBalance,
    undefined,
    'not_created',
    'Final credit charge not settled',
    userFacingMessage,
    false,
    false,
    warnings,
  )
}

function userFacingCopy(settlement: CreditSettlementRecord): {
  title: string
  message: string
} {
  if (settlement.status === 'settled_with_absorbed_overage') {
    return {
      title: 'Final credit charge settled',
      message: `This edit cost more to process than your approved maximum, but you were not charged above your approved hold. ReEditPro absorbed ${settlement.absorbedOverageCredits} credits.`,
    }
  }
  if (settlement.status === 'requires_top_up_before_export') {
    return {
      title: 'Action required: add credits to export',
      message: `Your edit is ready, but ${settlement.outstandingCredits} approved credits are still needed before export. Add credits to unlock export in a later milestone.`,
    }
  }
  if (settlement.status === 'previewed') {
    return {
      title: 'Final credit charge previewed',
      message: 'Settlement preview is read-only; no credits were spent or released.',
    }
  }
  return {
    title: 'Final credit charge settled',
    message: `Your edit used ${settlement.finalChargeCredits} credits. ${settlement.releasedCredits} unused reserved credits were returned. Final charge includes actual billable tool usage plus the ReEditPro service/edit fee.`,
  }
}

function walletBalanceForReservation(
  reservationStore: MockCreditReservationStore,
  reservation: CreditReservationRecord | undefined,
): CreditReservationWalletBalance | null {
  return reservation ? getMockCreditWalletBalance(reservationStore, reservation.creditWalletId) : null
}

function walletToBalance(wallet: MockCreditReservationStore['creditWallets'][number]): CreditReservationWalletBalance {
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

function validateResolvableAction(
  action: CreditRevisionActionRecord | undefined,
  workspaceId: string,
  projectId: string,
  optionId: string,
): {
  ok: true
} | {
  ok: false
  status: CreditRevisionActionResolutionStatus
  message: string
  warnings: string[]
} {
  if (!action) {
    return {
      ok: false,
      status: 'action_not_found',
      message: 'Credit revision action was not found.',
      warnings: ['No mock wallet, reservation, action, worker, provider, or render mutation occurred.'],
    }
  }
  if (action.workspaceId !== workspaceId || action.projectId !== projectId) {
    return {
      ok: false,
      status: 'invalid_request',
      message: 'Credit revision action scope does not match workspace or project.',
      warnings: ['No mock wallet, reservation, action, worker, provider, or render mutation occurred.'],
    }
  }
  if (!action.userOptions.some((option) => option.id === optionId)) {
    return {
      ok: false,
      status: 'invalid_request',
      message: 'Selected option is not available for this revised-credit action.',
      warnings: ['No mock wallet, reservation, action, worker, provider, or render mutation occurred.'],
    }
  }
  return { ok: true }
}

function validateActionRequired(action: CreditRevisionActionRecord): {
  ok: true
} | {
  ok: false
  status: CreditRevisionActionResolutionStatus
  message: string
  warnings: string[]
} {
  if (action.status === 'action_required') return { ok: true }
  const resolved = action.status === 'approved' ||
    action.status === 'lower_cost_selected' ||
    action.status === 'cancelled' ||
    action.status === 'resolved'
  return {
    ok: false,
    status: resolved ? 'already_resolved' : 'invalid_action_state',
    message: resolved
      ? `Credit revision action is already resolved with status ${action.status}.`
      : `Credit revision action status ${action.status} cannot be resolved by this route.`,
    warnings: ['No additional mock wallet, reservation, worker, provider, or render mutation occurred.'],
  }
}

function duplicateResolution(
  action: CreditRevisionActionRecord,
  idempotencyKey: string,
): CreditRevisionActionRecord | null {
  const metadata = action.metadata
  return metadata?.resolutionIdempotencyKey === idempotencyKey &&
    action.resolvedAt &&
    (action.status === 'approved' || action.status === 'lower_cost_selected' || action.status === 'cancelled')
    ? action
    : null
}

function resolveAction(
  action: CreditRevisionActionRecord,
  input: {
    status: Extract<CreditRevisionActionRecord['status'], 'approved' | 'lower_cost_selected' | 'cancelled'>
    selectedOptionId: string
    resolvedByUserId: string
    resolutionIdempotencyKey: string
    resolutionMetadata: JSONObject
  },
): CreditRevisionActionRecord {
  const resolvedAt = nowIso()
  action.status = input.status
  action.selectedOptionId = input.selectedOptionId
  action.resolvedByUserId = input.resolvedByUserId
  action.resolvedAt = resolvedAt
  action.updatedAt = resolvedAt
  action.metadata = {
    ...(action.metadata ?? {}),
    ...input.resolutionMetadata,
    milestone: 'RP-CREDITREVISION-01',
    resolutionIdempotencyKey: input.resolutionIdempotencyKey,
    resolvedStatus: input.status,
    paidWorkStarted: false,
    requiresRuntimeGuardRecheck: input.status === 'approved',
    requiresNewEstimateOrPlan: input.status === 'lower_cost_selected',
    extraWorkCancelled: input.status === 'cancelled',
    noSpend: true,
    noSettlement: true,
    noProviderCall: true,
    noRenderOrExport: true,
  }
  return creditRevisionActionRecordSchema.parse(action) as CreditRevisionActionRecord
}

function actionResolutionFromHold(
  hold: ReserveAdditionalCreditsForRevisionActionResult,
  status: CreditRevisionActionResolutionStatus,
  action: CreditRevisionActionRecord,
  userFacingMessage: string,
  warnings: string[],
  options: {
    requiresRuntimeGuardRecheck?: boolean
    idempotencyStatus?: CreditRevisionActionResolutionResponse['idempotencyStatus']
  } = {},
): CreditRevisionActionResolutionResponse {
  return actionResolutionResponse(
    status,
    action,
    hold.reservation,
    hold.reservationLineItems,
    hold.walletBalance,
    hold.additionalHoldCredits,
    hold.requiredTopUpCredits,
    options.idempotencyStatus ?? hold.idempotencyStatus,
    userFacingMessage,
    warnings,
    {
      requiresRuntimeGuardRecheck: options.requiresRuntimeGuardRecheck ?? false,
      walletMutated: hold.walletMutated,
      reservationMutated: hold.reservationMutated,
      creditsReserved: hold.walletMutated && hold.reservationMutated,
    },
  )
}

function actionResolutionResponse(
  status: CreditRevisionActionResolutionStatus,
  action: CreditRevisionActionRecord | null,
  reservation: CreditRevisionActionResolutionResponse['reservation'],
  reservationLineItems: CreditRevisionActionResolutionResponse['reservationLineItems'],
  walletBalance: CreditRevisionActionResolutionResponse['walletBalance'],
  additionalHoldCredits: number,
  requiredTopUpCredits: number,
  idempotencyStatus: CreditRevisionActionResolutionResponse['idempotencyStatus'],
  userFacingMessage: string,
  warnings: string[],
  options: {
    requiresRuntimeGuardRecheck?: boolean
    requiresNewEstimateOrPlan?: boolean
    extraWorkCancelled?: boolean
    walletMutated?: boolean
    reservationMutated?: boolean
    creditsReserved?: boolean
  } = {},
): CreditRevisionActionResolutionResponse {
  return {
    status,
    action,
    reservation,
    reservationLineItems,
    walletBalance,
    additionalHoldCredits,
    requiredTopUpCredits,
    idempotencyStatus,
    requiresRuntimeGuardRecheck: options.requiresRuntimeGuardRecheck ?? false,
    requiresNewEstimateOrPlan: options.requiresNewEstimateOrPlan ?? false,
    extraWorkCancelled: options.extraWorkCancelled ?? false,
    paidWorkStarted: false,
    userFacingMessage,
    safetyFlags: {
      mockOnly: true,
      paidWorkStarted: false,
      walletMutated: options.walletMutated ?? false,
      reservationMutated: options.reservationMutated ?? false,
      creditsReserved: options.creditsReserved ?? false,
      creditsSpent: false,
      creditsReleased: false,
      creditsRefunded: false,
      ledgerWritten: false,
      settlementExecuted: false,
      providerCalled: false,
      workerRun: false,
      renderOrExportStarted: false,
      exportUnlocked: false,
      checkoutOrTopUpStarted: false,
      supabaseWritten: false,
      serviceFeeIncludedInToolCosts: false,
    },
    warnings: [
      ...warnings,
      'RP-CREDITREVISION-01 is mock-only; no live billing, Stripe/payment, Supabase write, production wallet mutation, ledger write, settlement, spend/release/refund, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
    ],
  }
}

function createRevisedEstimateCopy(): {
  title: string
  message: string
  options: CreditRevisionUserOption[]
} {
  return {
    title: REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.title,
    message: REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.explanation,
    options: [
      { id: 'approve-and-continue', label: 'Approve & Continue', action: 'approve_and_continue' },
      { id: 'choose-lower-cost-option', label: 'Choose Lower-Cost Option', action: 'choose_lower_cost_option' },
      { id: 'cancel-extra-work', label: 'Cancel Extra Work', action: 'cancel_extra_work' },
    ],
  }
}

function createExportTopUpCopy(): {
  title: string
  message: string
  options: CreditRevisionUserOption[]
} {
  return {
    title: REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY.title,
    message: 'This export is ready, but the approved final charge is not fully funded. Add credits before export unlocks in a later runtime milestone.',
    options: [
      { id: 'add-credits-and-unlock-export', label: 'Add Credits & Unlock Export', action: 'add_credits_and_unlock_export' },
      { id: 'choose-lower-cost-option', label: 'Choose Lower-Cost Option', action: 'choose_lower_cost_option' },
      { id: 'cancel-extra-work', label: 'Cancel Extra Work', action: 'cancel_extra_work' },
    ],
  }
}

function receiptLine(label: string, credits: number, description?: string): EditCreditCostSummaryLine {
  return description ? { label, credits, description } : { label, credits }
}

function categoryCredits(
  byUsageCategory: EditCreditCostSummary['byUsageCategory'],
  keys: readonly string[],
): number {
  return keys.reduce((sum, key) => sum + (byUsageCategory[key]?.credits ?? 0), 0)
}

function asJsonObject(value: Record<string, unknown>): JSONObject {
  return value as JSONObject
}
