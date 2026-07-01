import type {
  CompleteMockCreditTopUpRequest,
  CompleteMockCreditTopUpResponse,
  CreateMockCreditTopUpRequest,
  CreateMockCreditTopUpResponse,
  CreditGrantRecord,
  CreditPackDefinition,
  CreditReservationWalletBalance,
  CreditTopUpReason,
  JSONObject,
  MockCreditTopUpIntent,
  MockCreditTopUpNextAction,
  MockCreditTopUpResponseStatus,
  MockCreditTopUpSafetyFlags,
  SuggestCreditTopUpRequest,
  SuggestCreditTopUpResponse,
} from '../../src/types'
import { CREDIT_RETAIL_VALUE_CENTS } from '../../src/types/credit-policy'
import { getCreditRevisionAction, getCreditSettlement, getCreditSettlementForReservation, type MockCreditDataStore } from './mock-credit-data-store'
import { getEditCreditEstimatePreview, type MockCreditEstimateStore } from './mock-credit-estimate-store'
import {
  getCreditReservation,
  getMockCreditWalletBalance,
  grantMockCredits,
  type MockCreditReservationStore,
} from './mock-credit-reservation-store'
import { createMockId, nowIso } from './service-helpers'

const MILESTONE = 'RP-CREDITPURCHASE-01'

export const MOCK_CREDIT_PACKS: readonly CreditPackDefinition[] = [
  creditPack('credits_100_usd_10', '100 credits', 100),
  creditPack('credits_250_usd_25', '250 credits', 250),
  creditPack('credits_500_usd_50', '500 credits', 500),
  creditPack('credits_1000_usd_100', '1,000 credits', 1_000),
  creditPack('credits_2500_usd_250', '2,500 credits', 2_500),
] as const

export function listCreditPacks(): CreditPackDefinition[] {
  return MOCK_CREDIT_PACKS.map((pack) => ({ ...pack, metadata: { ...pack.metadata } }))
}

export function listCreditGrantsForWallet(
  store: MockCreditReservationStore,
  creditWalletId: string,
): CreditGrantRecord[] {
  return store.creditGrants.filter((grant) => grant.creditWalletId === creditWalletId)
}

export function createMockCreditTopUpIntent(
  store: MockCreditReservationStore,
  request: CreateMockCreditTopUpRequest,
): CreateMockCreditTopUpResponse {
  const duplicate = findIntentByIdempotency(store, request.workspaceId, request.idempotencyKey)
  if (duplicate) {
    return createResponse(
      duplicate.status === 'completed' ? 'already_completed' : 'already_created',
      duplicate,
      null,
      getMockCreditWalletBalance(store, duplicate.creditWalletId),
      0,
      duplicate.priceCents,
      nextActionForReason(duplicate.topUpReason),
      'duplicate_returned',
      false,
      false,
      ['Duplicate mock top-up idempotency key returned the existing intent; no wallet or grant mutation occurred.'],
    )
  }

  const wallet = findWallet(store, request.workspaceId, request.creditWalletId)
  if (!wallet) return blockedCreateResponse('wallet_not_found', request, 'Credit wallet was not found.')

  const resolvedPack = resolveRequestedPack(request.creditPackId, request.customCredits)
  if (!resolvedPack.ok) return blockedCreateResponse(resolvedPack.status, request, resolvedPack.message, resolvedPack.warnings)

  const createdAt = nowIso()
  const intent: MockCreditTopUpIntent = {
    id: createMockId('credit_top_up_intent'),
    workspaceId: request.workspaceId,
    userId: request.userId,
    creditWalletId: wallet.id,
    creditPackId: resolvedPack.pack.id,
    credits: resolvedPack.pack.credits,
    priceCents: resolvedPack.pack.priceCents,
    currency: 'USD',
    status: 'created',
    topUpReason: request.topUpReason,
    mockOnly: true,
    checkoutProvider: 'mock',
    checkoutUrl: null,
    relatedProjectId: request.relatedProjectId ?? null,
    relatedCreditEstimateId: request.relatedCreditEstimateId ?? null,
    relatedCreditReservationId: request.relatedCreditReservationId ?? null,
    relatedCreditSettlementId: request.relatedCreditSettlementId ?? null,
    relatedCreditRevisionActionId: request.relatedCreditRevisionActionId ?? null,
    idempotencyKey: request.idempotencyKey,
    metadata: asJsonObject({
      ...(request.metadata ?? {}),
      mockOnly: true,
      milestone: MILESTONE,
      noStripePayment: true,
      noRealCheckout: true,
      noProductionPersistence: true,
      unlimitedEditing: false,
    }),
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  }
  store.creditTopUpIntents.push(intent)
  store.checkoutOrTopUpRecords.push({
    mutation: 'mock_credit_top_up_intent_created',
    topUpIntentId: intent.id,
    creditWalletId: wallet.id,
    credits: intent.credits,
    createdAt,
    mockOnly: true,
  })

  return createResponse(
    'created',
    intent,
    null,
    getMockCreditWalletBalance(store, wallet.id),
    0,
    intent.priceCents,
    nextActionForReason(request.topUpReason),
    'created',
    true,
    false,
    [
      'Created a local mock credit top-up intent only.',
      'No live billing, Stripe/payment, real checkout session, provider call, render/export, export unlock, Supabase write, production wallet mutation, or ledger write occurred.',
    ],
  )
}

export function completeMockCreditTopUp(
  store: MockCreditReservationStore,
  request: CompleteMockCreditTopUpRequest,
): CompleteMockCreditTopUpResponse {
  const duplicate = findIntentByIdempotency(store, request.workspaceId, request.idempotencyKey)
  if (duplicate?.status === 'completed') {
    const grant = findGrantForIntent(store, duplicate.id)
    return completeResponse(
      'already_completed',
      duplicate,
      grant,
      getMockCreditWalletBalance(store, duplicate.creditWalletId),
      duplicate.credits,
      duplicate.priceCents,
      nextActionForReason(duplicate.topUpReason),
      'duplicate_returned',
      false,
      false,
      ['Duplicate mock top-up completion returned the existing intent and grant; credits were not added again.'],
    )
  }

  const existingIntent = request.topUpIntentId
    ? store.creditTopUpIntents.find((intent) =>
      intent.id === request.topUpIntentId &&
      intent.workspaceId === request.workspaceId &&
      intent.creditWalletId === request.creditWalletId)
    : duplicate
  if (request.topUpIntentId && !existingIntent) {
    return blockedCompleteResponse('invalid_request', request, 'Mock top-up intent was not found.')
  }
  if (existingIntent?.status === 'completed') {
    const grant = findGrantForIntent(store, existingIntent.id)
    return completeResponse(
      'already_completed',
      existingIntent,
      grant,
      getMockCreditWalletBalance(store, existingIntent.creditWalletId),
      existingIntent.credits,
      existingIntent.priceCents,
      nextActionForReason(existingIntent.topUpReason),
      'duplicate_returned',
      false,
      false,
      ['Mock top-up intent was already completed; no duplicate grant was created.'],
    )
  }

  const wallet = findWallet(store, request.workspaceId, request.creditWalletId)
  if (!wallet) return blockedCompleteResponse('wallet_not_found', request, 'Credit wallet was not found.')

  const resolvedPack = existingIntent
    ? { ok: true as const, pack: packForIntent(existingIntent) }
    : resolveRequestedPack(request.creditPackId, request.customCredits)
  if (!resolvedPack.ok) return blockedCompleteResponse(resolvedPack.status, request, resolvedPack.message, resolvedPack.warnings)

  const completedAt = nowIso()
  const intent = existingIntent ?? {
    id: createMockId('credit_top_up_intent'),
    workspaceId: request.workspaceId,
    userId: request.userId,
    creditWalletId: wallet.id,
    creditPackId: resolvedPack.pack.id,
    credits: resolvedPack.pack.credits,
    priceCents: resolvedPack.pack.priceCents,
    currency: 'USD' as const,
    status: 'created' as const,
    topUpReason: request.topUpReason,
    mockOnly: true as const,
    checkoutProvider: 'mock' as const,
    checkoutUrl: null,
    relatedProjectId: request.relatedProjectId ?? null,
    relatedCreditEstimateId: request.relatedCreditEstimateId ?? null,
    relatedCreditReservationId: request.relatedCreditReservationId ?? null,
    relatedCreditSettlementId: request.relatedCreditSettlementId ?? null,
    relatedCreditRevisionActionId: request.relatedCreditRevisionActionId ?? null,
    idempotencyKey: request.idempotencyKey,
    metadata: asJsonObject({
      ...(request.metadata ?? {}),
      mockOnly: true,
      milestone: MILESTONE,
      noStripePayment: true,
      noRealCheckout: true,
      noProductionPersistence: true,
      unlimitedEditing: false,
    }),
    createdAt: completedAt,
    updatedAt: completedAt,
    completedAt: null,
  } satisfies MockCreditTopUpIntent

  if (!existingIntent) store.creditTopUpIntents.push(intent)

  intent.status = 'completed'
  intent.updatedAt = completedAt
  intent.completedAt = completedAt
  intent.metadata = asJsonObject({
    ...(intent.metadata ?? {}),
    completedByMockTopUp: true,
    completionIdempotencyKey: request.idempotencyKey,
  })

  const grant = grantMockCredits(store, {
    creditWalletId: wallet.id,
    amount: intent.credits,
    sourceType: 'purchased',
    userId: request.userId,
    grantReason: 'Mock purchased credits added for RP-CREDITPURCHASE-01.',
    retailValueCents: intent.credits * CREDIT_RETAIL_VALUE_CENTS,
    purchaseAmountCents: intent.priceCents,
    billingProvider: 'mock',
    billingPaymentId: intent.id,
    metadata: asJsonObject({
      mockOnly: true,
      milestone: MILESTONE,
      topUpIntentId: intent.id,
      idempotencyKey: request.idempotencyKey,
      topUpReason: intent.topUpReason,
      creditPackId: intent.creditPackId ?? null,
      noLedgerWrite: true,
      noStripePayment: true,
      noRealCheckout: true,
      noExportUnlock: true,
    }),
  })
  store.checkoutOrTopUpRecords.push({
    mutation: 'mock_credit_top_up_completed',
    topUpIntentId: intent.id,
    creditGrantId: grant.id,
    creditWalletId: wallet.id,
    credits: intent.credits,
    createdAt: completedAt,
    mockOnly: true,
  })

  return completeResponse(
    'completed',
    intent,
    grant,
    getMockCreditWalletBalance(store, wallet.id),
    intent.credits,
    intent.priceCents,
    nextActionForReason(intent.topUpReason),
    'created',
    !existingIntent,
    true,
    [
      'Purchased credits were added to the local mock wallet only.',
      'No live billing, Stripe/payment, real checkout session, provider call, render/export, export unlock, Supabase write, production wallet mutation, or ledger write occurred.',
    ],
  )
}

export function suggestCreditTopUp(
  reservationStore: MockCreditReservationStore,
  estimateStore: MockCreditEstimateStore,
  creditDataStore: MockCreditDataStore,
  request: SuggestCreditTopUpRequest,
): SuggestCreditTopUpResponse {
  const walletBalance = getMockCreditWalletBalance(reservationStore, request.creditWalletId)
  const context = resolveRequiredTopUpCredits(reservationStore, estimateStore, creditDataStore, request, walletBalance)
  const pack = recommendedPack(context.requiredTopUpCredits)
  const warnings = [
    ...context.warnings,
    ...(context.requiredTopUpCredits > 0 && !pack.coversRequired ? ['Largest mock credit pack does not fully cover the suggested top-up; multiple pack purchases may be needed.'] : []),
    'Suggestion only; no credits were purchased, granted, reserved, spent, released, retried, or unlocked.',
  ]
  return {
    suggestion: {
      requiredTopUpCredits: context.requiredTopUpCredits,
      recommendedPackId: pack.pack?.id,
      recommendedCredits: pack.pack?.credits ?? 0,
      recommendedPriceCents: pack.pack?.priceCents ?? 0,
      reason: request.topUpReason,
      nextSuggestedAction: nextActionForReason(request.topUpReason),
      warnings,
    },
    walletBalance,
    safetyFlags: safetyFlags(false, false, false),
    warnings,
  }
}

function creditPack(id: string, label: string, credits: number): CreditPackDefinition {
  return {
    id,
    label,
    credits,
    priceCents: credits * CREDIT_RETAIL_VALUE_CENTS,
    currency: 'USD',
    retailValueCents: credits * CREDIT_RETAIL_VALUE_CENTS,
    isActive: true,
    metadata: {
      mockOnly: true,
      milestone: MILESTONE,
      unlimitedEditing: false,
      subscriptionIncluded: false,
    },
  }
}

function resolveRequestedPack(creditPackId?: string, customCredits?: number):
  | { ok: true; pack: CreditPackDefinition }
  | { ok: false; status: MockCreditTopUpResponseStatus; message: string; warnings: string[] } {
  if (customCredits !== undefined) {
    return {
      ok: false,
      status: 'invalid_request',
      message: 'Custom credit top-ups are not supported in RP-CREDITPURCHASE-01; choose a fixed pack.',
      warnings: ['customCredits is reserved for a later milestone and was rejected.'],
    }
  }
  if (!creditPackId) {
    return {
      ok: false,
      status: 'invalid_request',
      message: 'A creditPackId is required for mock credit top-up.',
      warnings: ['Pack-only top-up is required in RP-CREDITPURCHASE-01.'],
    }
  }
  const pack = MOCK_CREDIT_PACKS.find((candidate) => candidate.id === creditPackId)
  if (!pack) {
    return {
      ok: false,
      status: 'pack_not_found',
      message: 'Credit pack was not found.',
      warnings: ['No mock wallet or grant mutation occurred.'],
    }
  }
  if (!pack.isActive) {
    return {
      ok: false,
      status: 'pack_not_found',
      message: 'Credit pack is inactive.',
      warnings: ['Inactive mock credit packs cannot be purchased.'],
    }
  }
  return { ok: true, pack }
}

function packForIntent(intent: MockCreditTopUpIntent): CreditPackDefinition {
  return {
    id: intent.creditPackId ?? 'mock_completed_top_up',
    label: `${intent.credits} credits`,
    credits: intent.credits,
    priceCents: intent.priceCents,
    currency: 'USD',
    retailValueCents: intent.credits * CREDIT_RETAIL_VALUE_CENTS,
    isActive: true,
    metadata: {
      mockOnly: true,
      milestone: MILESTONE,
      fromTopUpIntentId: intent.id,
      unlimitedEditing: false,
    },
  }
}

function findWallet(store: MockCreditReservationStore, workspaceId: string, creditWalletId: string) {
  return store.creditWallets.find((wallet) => wallet.id === creditWalletId && wallet.workspaceId === workspaceId) ?? null
}

function findIntentByIdempotency(
  store: MockCreditReservationStore,
  workspaceId: string,
  idempotencyKey: string,
): MockCreditTopUpIntent | undefined {
  return store.creditTopUpIntents.find((intent) =>
    intent.workspaceId === workspaceId &&
    intent.idempotencyKey === idempotencyKey)
}

function findGrantForIntent(
  store: MockCreditReservationStore,
  topUpIntentId: string,
): CreditGrantRecord | null {
  return store.creditGrants.find((grant) =>
    grant.billingProvider === 'mock' &&
    grant.billingPaymentId === topUpIntentId) ?? null
}

function resolveRequiredTopUpCredits(
  reservationStore: MockCreditReservationStore,
  estimateStore: MockCreditEstimateStore,
  creditDataStore: MockCreditDataStore,
  request: SuggestCreditTopUpRequest,
  walletBalance: CreditReservationWalletBalance | null,
): { requiredTopUpCredits: number; warnings: string[] } {
  if (!walletBalance) {
    return {
      requiredTopUpCredits: Math.max(0, request.requestedCredits ?? 0),
      warnings: ['Credit wallet was not found; suggestion used only explicit requestedCredits when provided.'],
    }
  }

  if (request.topUpReason === 'insufficient_credits_for_estimate' && request.relatedCreditEstimateId) {
    const preview = getEditCreditEstimatePreview(estimateStore, request.relatedCreditEstimateId)
    if (preview) {
      const required = preview.topUpSummary.requiredTopUpCredits > 0
        ? preview.topUpSummary.requiredTopUpCredits
        : Math.max(0, preview.summary.requiredHoldCredits - walletBalance.availableCredits)
      return {
        requiredTopUpCredits: required,
        warnings: ['Estimate reservation top-up suggestion only; reservation was not retried.'],
      }
    }
  }

  if (request.topUpReason === 'revised_credit_additional_hold' && request.relatedCreditRevisionActionId) {
    const action = getCreditRevisionAction(creditDataStore, request.relatedCreditRevisionActionId)
    const reservation = request.relatedCreditReservationId
      ? getCreditReservation(reservationStore, request.relatedCreditReservationId)
      : action ? getCreditReservation(reservationStore, action.creditReservationId) : undefined
    if (action && reservation) {
      const additionalHoldCredits = Math.max(0, action.newMaximumEstimatedCredits - reservation.reservedCredits)
      return {
        requiredTopUpCredits: Math.max(0, additionalHoldCredits - walletBalance.availableCredits),
        warnings: ['Revised-credit top-up suggestion only; approval was not retried.'],
      }
    }
  }

  if (request.topUpReason === 'export_top_up_required') {
    const settlement = request.relatedCreditSettlementId
      ? getCreditSettlement(creditDataStore, request.relatedCreditSettlementId)
      : request.relatedCreditReservationId
        ? getCreditSettlementForReservation(creditDataStore, request.relatedCreditReservationId)
        : undefined
    if (settlement) {
      return {
        requiredTopUpCredits: settlement.outstandingCredits,
        warnings: ['Export top-up suggestion only; export gate was not retried or unlocked.'],
      }
    }
  }

  return {
    requiredTopUpCredits: Math.max(0, request.requestedCredits ?? 0),
    warnings: ['No complete top-up context was found; suggestion used explicit requestedCredits or 0.'],
  }
}

function recommendedPack(requiredTopUpCredits: number): { pack: CreditPackDefinition | undefined; coversRequired: boolean } {
  if (requiredTopUpCredits <= 0) return { pack: undefined, coversRequired: true }
  const active = [...MOCK_CREDIT_PACKS].filter((pack) => pack.isActive).sort((a, b) => a.credits - b.credits)
  const covering = active.find((pack) => pack.credits >= requiredTopUpCredits)
  if (covering) return { pack: covering, coversRequired: true }
  return { pack: active.at(-1), coversRequired: false }
}

function nextActionForReason(reason: CreditTopUpReason): MockCreditTopUpNextAction {
  if (reason === 'insufficient_credits_for_estimate') return 'retry_estimate_reservation'
  if (reason === 'revised_credit_additional_hold') return 'retry_revised_credit_approval'
  if (reason === 'export_top_up_required') return 'retry_export_gate'
  if (reason === 'manual_wallet_top_up' || reason === 'admin_test') return 'review_wallet'
  return 'none'
}

function createResponse(
  status: MockCreditTopUpResponseStatus,
  topUpIntent: MockCreditTopUpIntent | null,
  creditGrant: null,
  walletBalance: CreditReservationWalletBalance | null,
  creditsAdded: 0,
  priceCents: number,
  nextSuggestedAction: MockCreditTopUpNextAction,
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created',
  intentWritten: boolean,
  walletMutated: boolean,
  warnings: string[],
): CreateMockCreditTopUpResponse {
  return {
    status,
    topUpIntent,
    creditGrant,
    walletBalance,
    creditsAdded,
    priceCents,
    userFacingTitle: 'Mock credit top-up ready',
    userFacingMessage: 'A mock credit top-up intent was created. Complete the mock top-up to add credits to your wallet.',
    nextSuggestedAction,
    idempotencyStatus,
    safetyFlags: safetyFlags(intentWritten, false, walletMutated),
    warnings,
  }
}

function completeResponse(
  status: MockCreditTopUpResponseStatus,
  topUpIntent: MockCreditTopUpIntent | null,
  creditGrant: CreditGrantRecord | null,
  walletBalance: CreditReservationWalletBalance | null,
  creditsAdded: number,
  priceCents: number,
  nextSuggestedAction: MockCreditTopUpNextAction,
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created',
  intentWritten: boolean,
  grantWritten: boolean,
  warnings: string[],
): CompleteMockCreditTopUpResponse {
  return {
    status,
    topUpIntent,
    creditGrant,
    walletBalance,
    creditsAdded,
    priceCents,
    ...topUpCopy(creditsAdded, nextSuggestedAction),
    nextSuggestedAction,
    idempotencyStatus,
    safetyFlags: safetyFlags(intentWritten, grantWritten, grantWritten),
    warnings,
  }
}

function blockedCreateResponse(
  status: MockCreditTopUpResponseStatus,
  request: CreateMockCreditTopUpRequest,
  message: string,
  warnings: string[] = ['No mock top-up intent, grant, wallet, reservation, export, provider, render, checkout, payment, ledger, or Supabase mutation occurred.'],
): CreateMockCreditTopUpResponse {
  return createResponse(
    status,
    null,
    null,
    null,
    0,
    0,
    nextActionForReason(request.topUpReason),
    'not_created',
    false,
    false,
    [message, ...warnings],
  )
}

function blockedCompleteResponse(
  status: MockCreditTopUpResponseStatus,
  request: CompleteMockCreditTopUpRequest,
  message: string,
  warnings: string[] = ['No mock top-up intent, grant, wallet, reservation, export, provider, render, checkout, payment, ledger, or Supabase mutation occurred.'],
): CompleteMockCreditTopUpResponse {
  return completeResponse(
    status,
    null,
    null,
    null,
    0,
    0,
    nextActionForReason(request.topUpReason),
    'not_created',
    false,
    false,
    [message, ...warnings],
  )
}

function topUpCopy(creditsAdded: number, nextSuggestedAction: MockCreditTopUpNextAction): {
  userFacingTitle: string
  userFacingMessage: string
} {
  if (nextSuggestedAction === 'retry_estimate_reservation') {
    return {
      userFacingTitle: 'Credits added. You can continue.',
      userFacingMessage: `${creditsAdded} credits were added. Retry the estimate reservation to continue.`,
    }
  }
  if (nextSuggestedAction === 'retry_revised_credit_approval') {
    return {
      userFacingTitle: 'Credits added. Revised credit approval can continue.',
      userFacingMessage: `${creditsAdded} credits were added. Retry the revised credit approval to reserve the additional hold.`,
    }
  }
  if (nextSuggestedAction === 'retry_export_gate') {
    return {
      userFacingTitle: 'Credits added. Export can be checked again.',
      userFacingMessage: `${creditsAdded} credits were added. Recheck the export gate to unlock export if the approved balance is now funded.`,
    }
  }
  return {
    userFacingTitle: 'Credits added',
    userFacingMessage: `${creditsAdded} credits were added to your ReEditPro wallet. These credits are now available for estimates, revised credit holds, or export top-up actions.`,
  }
}

function safetyFlags(
  intentWritten: boolean,
  grantWritten: boolean,
  walletMutated: boolean,
): MockCreditTopUpSafetyFlags {
  return {
    mockOnly: true,
    mockTopUpIntentWritten: intentWritten,
    mockCreditGrantWritten: grantWritten,
    walletMutated,
    creditsAdded: walletMutated,
    creditsReserved: false,
    creditsSpent: false,
    creditsReleased: false,
    creditsRefunded: false,
    ledgerWritten: false,
    productionWalletMutated: false,
    productionPersistenceWritten: false,
    checkoutSessionCreated: false,
    paymentProviderCalled: false,
    stripeCalled: false,
    providerCalled: false,
    workerRun: false,
    renderOrExportStarted: false,
    exportUnlocked: false,
    checkoutOrTopUpStarted: false,
    supabaseWritten: false,
  }
}

function asJsonObject(value: Record<string, unknown>): JSONObject {
  return value as JSONObject
}
