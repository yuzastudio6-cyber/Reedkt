import type {
  CreditPackDefinition,
  CreditReservationWalletBalance,
  CreditRevisionActionRecord,
  EditCreditEstimatePreview,
  ExportCreditGateResult,
  ReserveMaxEstimateCreditsResponse,
  SettleCreditReservationResponse,
  StripeConfigStatusResponse,
  StripeLiveReadinessResponse,
  StripeTestReadinessResponse,
} from '../types'
import { CREDIT_RETAIL_VALUE_CENTS } from '../types'

export type CreditUITone = 'blue' | 'cyan' | 'violet' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

export interface CreditUIBadge {
  label: string
  tone: CreditUITone
}

export interface CreditUIMetric {
  label: string
  value: string
  detail?: string
  tone?: CreditUITone
}

export interface CreditUILineItem {
  label: string
  value: string
  detail?: string
  tone?: CreditUITone
}

export interface CreditUIAction {
  label: string
  disabled: boolean
  helper: string
  tone: CreditUITone
}

export interface CreditWalletSummaryViewModel {
  title: string
  badge: CreditUIBadge
  metrics: CreditUIMetric[]
  purchasedCreditsLabel?: string
  weeklyBonusCreditsLabel?: string
  outstandingCreditsLabel?: string
  usageCopy: string
  mockCopy: string
}

export interface CreditEstimateCardViewModel {
  title: string
  badge: CreditUIBadge
  estimateRange: string
  expectedEstimate: string
  requiredHold: string
  topUpRequired: string
  lineItems: CreditUILineItem[]
  lowerCostOptions: CreditUILineItem[]
  actions: CreditUIAction[]
  copy: string[]
  warnings: string[]
}

export interface CreditReservationCardViewModel {
  title: string
  badge: CreditUIBadge
  message: string
  metrics: CreditUIMetric[]
  lineItems: CreditUILineItem[]
  warnings: string[]
}

export type CreditRuntimeGuardStatus =
  | 'ready'
  | 'estimate_only'
  | 'missing_approved_plan'
  | 'missing_approved_credit_estimate'
  | 'missing_active_credit_reservation'
  | 'missing_idempotency_key'
  | 'production_blocked'
  | 'requires_revised_estimate'
  | 'invalid_context'

export interface CreditRuntimeGuardSource {
  status: CreditRuntimeGuardStatus
  approvedReservedCredits: number
  currentBillableToolCredits: number
  committedPendingHighCredits: number
  nextToolHighCredits: number
  projectedToolCredits: number
  projectedServiceFeeCredits: number
  projectedFinalCredits: number
  warnings: string[]
}

export interface CreditRuntimeGuardCardViewModel {
  title: string
  badge: CreditUIBadge
  message: string
  metrics: CreditUIMetric[]
  warnings: string[]
}

export interface CreditRevisionActionCardViewModel {
  title: string
  badge: CreditUIBadge
  message: string
  metrics: CreditUIMetric[]
  options: CreditUIAction[]
  warnings: string[]
}

export interface CreditSettlementReceiptViewModel {
  title: string
  badge: CreditUIBadge
  message: string
  metrics: CreditUIMetric[]
  lineItems: CreditUILineItem[]
  warnings: string[]
}

export interface CreditExportLockCardViewModel {
  title: string
  badge: CreditUIBadge
  message: string
  metrics: CreditUIMetric[]
  warnings: string[]
}

export interface CreditTopUpPackViewModel {
  id: string
  label: string
  credits: string
  price: string
  recommended: boolean
}

export interface CreditTopUpCardViewModel {
  title: string
  badge: CreditUIBadge
  packs: CreditTopUpPackViewModel[]
  requiredCredits: string
  recommendedPack?: string
  nextSuggestedAction: string
  copy: string[]
  warnings: string[]
}

export interface StripeBillingStatusViewModel {
  title: string
  badge: CreditUIBadge
  metrics: CreditUIMetric[]
  copy: string[]
  warnings: string[]
}

export interface CreditLifecycleViewModel {
  wallet: CreditWalletSummaryViewModel
  estimate: CreditEstimateCardViewModel
  reservation: CreditReservationCardViewModel
  runtimeGuard: CreditRuntimeGuardCardViewModel
  revisionAction: CreditRevisionActionCardViewModel
  settlement: CreditSettlementReceiptViewModel
  exportLock: CreditExportLockCardViewModel
  topUp: CreditTopUpCardViewModel
  stripeBilling: StripeBillingStatusViewModel
}

export interface CreditLifecycleSource {
  walletBalance: CreditReservationWalletBalance
  purchasedCredits: number
  weeklyBonusCredits: number
  outstandingCredits: number
  estimatePreview: EditCreditEstimatePreview
  reservationResult: ReserveMaxEstimateCreditsResponse
  runtimeGuard: CreditRuntimeGuardSource
  revisionAction: CreditRevisionActionRecord
  settlementResult: SettleCreditReservationResponse
  exportGate: ExportCreditGateResult
  creditPacks: readonly CreditPackDefinition[]
  recommendedPackId: string
  topUpRequiredCredits: number
  topUpNextSuggestedAction: string
  stripeConfig: StripeConfigStatusResponse
  stripeTestReadiness: StripeTestReadinessResponse
  stripeLiveReadiness: StripeLiveReadinessResponse
}

export const CREDIT_UI_COPY = {
  estimateNotCharge: 'This is an estimate, not a charge.',
  reserveMaximum: 'ReEditPro reserves the maximum estimate before paid work starts.',
  finalCharge: 'Final charge after completion is actual billable tool usage plus the ReEditPro service/edit fee.',
  formula: 'Final charge = actual billable tool cost + ReEditPro service/edit fee',
  unusedReturns: 'Unused reserved credits are returned automatically.',
  walletUsage: 'Credits are used for AI generation, rendering, editing usage, and ReEditPro service/edit fees.',
  topUpMockOnly: 'This top-up flow is mock/test only in this build.',
  topUpNotSpent: 'Credits are added to your wallet balance and are not automatically spent.',
  topUpRetry: 'After adding credits, retry the reservation, revised-credit approval, or export gate.',
  stripeNoPayment: 'Live mode readiness does not enable payment processing.',
  stripeLiveBlocked: 'Live Checkout, SetupIntent, PaymentIntent, and webhooks remain blocked until a future activation milestone.',
  stripeNoSecrets: 'No raw Stripe secrets are shown in the UI.',
  secretReferenceSafety: 'Secret keys are stored by reference only and are never shown.',
} as const

export function formatCreditAmount(credits: number): string {
  return `${credits.toLocaleString('en-US')} ${credits === 1 ? 'credit' : 'credits'}`
}

export function formatCurrencyCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(cents / 100)
}

export function formatCreditDollarEquivalent(credits: number): string {
  return formatCurrencyCents(credits * CREDIT_RETAIL_VALUE_CENTS)
}

export function formatCreditWithValue(credits: number): string {
  return `${formatCreditAmount(credits)} (${formatCreditDollarEquivalent(credits)} value)`
}

export function createCreditWalletSummaryViewModel(input: {
  balance: CreditReservationWalletBalance
  purchasedCredits?: number
  weeklyBonusCredits?: number
  outstandingCredits?: number
}): CreditWalletSummaryViewModel {
  const { balance } = input
  const outstandingCredits = Math.max(0, input.outstandingCredits ?? 0)

  return {
    title: 'Credit Wallet',
    badge: { label: 'Mock/test data', tone: 'cyan' },
    metrics: [
      metric('Available credits', formatCreditWithValue(balance.availableCredits), 'Ready for future reservations.', 'success'),
      metric('Reserved credits', formatCreditAmount(balance.reservedCredits), 'Held before paid work starts.', 'warning'),
      metric('Spent credits', formatCreditAmount(balance.spentCredits), 'Final settled usage only.', 'violet'),
      metric('Refunded credits', formatCreditAmount(balance.refundedCredits), 'Returned by mock refund flows.', 'info'),
    ],
    purchasedCreditsLabel: input.purchasedCredits === undefined ? undefined : `Purchased credits: ${formatCreditAmount(input.purchasedCredits)}`,
    weeklyBonusCreditsLabel: input.weeklyBonusCredits === undefined ? undefined : `Weekly bonus credits: ${formatCreditAmount(input.weeklyBonusCredits)}`,
    outstandingCreditsLabel: outstandingCredits > 0
      ? `Outstanding credits required before export: ${formatCreditAmount(outstandingCredits)}`
      : undefined,
    usageCopy: CREDIT_UI_COPY.walletUsage,
    mockCopy: 'Mock/test badge: this card displays fixture data and does not mutate any wallet.',
  }
}

export function createCreditEstimateCardViewModel(preview: EditCreditEstimatePreview): CreditEstimateCardViewModel {
  const { summary } = preview

  return {
    title: `${editLevelLabel(summary.productEditLevel)} credit estimate`,
    badge: {
      label: summary.readinessStatus === 'needs_top_up' ? 'Top-up needed' : 'Estimate only',
      tone: summary.readinessStatus === 'needs_top_up' ? 'warning' : 'cyan',
    },
    estimateRange: `${formatCreditAmount(summary.minimumEstimatedCredits)} - ${formatCreditAmount(summary.maximumEstimatedCredits)}`,
    expectedEstimate: formatCreditAmount(summary.totalEstimatedCredits),
    requiredHold: formatCreditAmount(summary.requiredHoldCredits),
    topUpRequired: formatCreditAmount(summary.requiredTopUpCredits),
    lineItems: [
      ...summary.userFacingLines.map((line) => ({
        label: line.label,
        value: formatCreditAmount(line.credits),
        detail: line.description,
        tone: line.label.toLowerCase().includes('service') ? 'violet' as CreditUITone : 'blue' as CreditUITone,
      })),
      {
        label: 'ReEditPro service/edit fee',
        value: formatCreditAmount(summary.highServiceFeeCredits),
        detail: 'Service fee is separate from tool costs.',
        tone: 'violet',
      },
    ],
    lowerCostOptions: preview.lowerCostOptions.map((option) => ({
      label: option.label,
      value: option.estimatedSavingsCredits ? `Save ${formatCreditAmount(option.estimatedSavingsCredits)}` : 'Review option',
      detail: option.description,
      tone: 'success',
    })),
    actions: [
      action('Reserve Credits', !summary.canProceedToReservation, 'Mock CTA only; reservation route is not called from this fixture UI.', 'success'),
      action('Add Credits', summary.requiredTopUpCredits <= 0, 'Mock/test top-up is shown below and is not live payment.', 'warning'),
      action('Choose Lower-Cost Option', false, 'Displays options only; no plan is rewritten here.', 'cyan'),
    ],
    copy: [
      CREDIT_UI_COPY.estimateNotCharge,
      CREDIT_UI_COPY.reserveMaximum,
      CREDIT_UI_COPY.finalCharge,
      CREDIT_UI_COPY.unusedReturns,
      CREDIT_UI_COPY.formula,
    ],
    warnings: preview.warnings,
  }
}

export function createCreditReservationCardViewModel(result: ReserveMaxEstimateCreditsResponse): CreditReservationCardViewModel {
  const success = result.status === 'reserved' || result.status === 'already_reserved'
  const title = success ? 'Credits reserved. Generation can continue.' : 'Action required: add credits to continue'
  const message = success
    ? `${result.requiredHoldCredits} credits were reserved. No credits have been spent yet. Final charge will be based on actual billable tool usage plus the ReEditPro service/edit fee.`
    : `This edit requires a ${result.requiredHoldCredits}-credit hold before generation. You currently have ${result.availableCreditsBeforeReservation} credits available. Add ${result.requiredTopUpCredits} credits to continue. No credits have been spent yet.`

  return {
    title,
    badge: { label: result.status, tone: success ? 'success' : 'warning' },
    message,
    metrics: [
      metric('Required hold', formatCreditAmount(result.requiredHoldCredits), 'Required hold = maximum estimate.', 'warning'),
      metric('Available before', formatCreditAmount(result.availableCreditsBeforeReservation), 'Snapshot before mock reservation.', 'info'),
      metric('Available after', formatCreditAmount(result.availableCreditsAfterReservation), 'Outstanding credits are shown separately from wallet balance.', 'success'),
      metric('Reserved after', formatCreditAmount(result.reservedCreditsAfterReservation), 'Reserved, not spent.', 'violet'),
    ],
    lineItems: result.reservationLineItems.map((line) => ({
      label: line.usageCategory,
      value: formatCreditAmount(line.reservedCredits),
      detail: `${formatCreditAmount(line.spentCredits)} spent / ${formatCreditAmount(line.releasedCredits)} released`,
      tone: 'blue',
    })),
    warnings: result.warnings,
  }
}

export function createCreditRuntimeGuardCardViewModel(source: CreditRuntimeGuardSource): CreditRuntimeGuardCardViewModel {
  const overage = source.status === 'requires_revised_estimate'

  return {
    title: overage ? 'Action required: revised credit estimate needed' : runtimeStatusTitle(source.status),
    badge: { label: source.status, tone: overage ? 'warning' : source.status === 'ready' ? 'success' : 'info' },
    message: overage
      ? 'This edit is paused because it may exceed the credit amount you approved. No extra paid work will continue until you approve the revised estimate or choose a lower-cost option.'
      : 'Runtime credit guard is display-only in this UI and does not start workers, providers, render, or export.',
    metrics: [
      metric('Approved reserved credits', formatCreditAmount(source.approvedReservedCredits), undefined, 'success'),
      metric('Current billable tool credits', formatCreditAmount(source.currentBillableToolCredits), undefined, 'blue'),
      metric('Pending high credits', formatCreditAmount(source.committedPendingHighCredits), undefined, 'warning'),
      metric('Next tool high credits', formatCreditAmount(source.nextToolHighCredits), undefined, 'warning'),
      metric('Projected tool credits', formatCreditAmount(source.projectedToolCredits), undefined, 'violet'),
      metric('Projected service fee credits', formatCreditAmount(source.projectedServiceFeeCredits), 'Service fee remains separate.', 'violet'),
      metric('Projected final credits', formatCreditAmount(source.projectedFinalCredits), CREDIT_UI_COPY.formula, 'danger'),
    ],
    warnings: source.warnings,
  }
}

export function createCreditRevisionActionCardViewModel(actionRecord: CreditRevisionActionRecord): CreditRevisionActionCardViewModel {
  const stateCopy = revisionStateCopy(actionRecord.status)

  return {
    title: stateCopy.title ?? actionRecord.actionRequiredTitle,
    badge: { label: actionRecord.status, tone: stateCopy.tone },
    message: stateCopy.message ?? actionRecord.actionRequiredMessage,
    metrics: [
      metric('Approved max credits', formatCreditAmount(actionRecord.approvedMaxCredits), undefined, 'success'),
      metric('Used or committed credits', formatCreditAmount(actionRecord.usedOrCommittedCredits), undefined, 'warning'),
      metric('Additional low / expected / high', `${actionRecord.additionalLowCredits} / ${actionRecord.additionalExpectedCredits} / ${actionRecord.additionalHighCredits}`, 'Additional projected credits.', 'info'),
      metric('New maximum estimated credits', formatCreditAmount(actionRecord.newMaximumEstimatedCredits), 'Additional approval target.', 'danger'),
    ],
    options: [
      action('Approve & Continue', actionRecord.status !== 'action_required', 'Requires a later runtime guard recheck and does not auto-resume work.', 'success'),
      action('Choose Lower-Cost Option', actionRecord.status !== 'action_required', 'ReEditPro will rebuild the estimate before more paid work continues.', 'cyan'),
      action('Cancel Extra Work', actionRecord.status !== 'action_required', 'Extra work is cancelled; existing approved limit remains the boundary.', 'warning'),
    ],
    warnings: [actionRecord.reasonSummary],
  }
}

export function createCreditSettlementReceiptViewModel(result: SettleCreditReservationResponse): CreditSettlementReceiptViewModel {
  const settlement = result.settlement
  const summary = result.summary
  const absorbed = settlement?.absorbedOverageCredits ?? summary?.absorbedOverageCredits ?? 0
  const outstanding = settlement?.outstandingCredits ?? summary?.outstandingCredits ?? 0
  const released = settlement?.releasedCredits ?? summary?.releasedCredits ?? 0
  const finalCharge = settlement?.finalChargeCredits ?? summary?.finalChargeCredits ?? 0

  let title = 'Final credit charge settled'
  let message = `Your edit used ${finalCharge} credits. ${released} unused reserved credits were returned. Final charge includes actual billable tool usage plus the ReEditPro service/edit fee.`
  if (result.status === 'settled_with_absorbed_overage') {
    message = `This edit cost more to process than your approved maximum, but you were not charged above your approved hold. ReEditPro absorbed ${absorbed} credits.`
  }
  if (result.status === 'requires_top_up_before_export') {
    title = 'Action required: add credits to export'
    message = `Your edit is ready, but ${outstanding} approved credits are still needed before export can be rechecked.`
  }

  return {
    title,
    badge: { label: result.status, tone: result.status === 'requires_top_up_before_export' ? 'warning' : 'success' },
    message,
    metrics: [
      metric('Actual tool cost', formatCreditAmount(summary?.actualToolCostCredits ?? settlement?.actualToolCostCredits ?? 0), undefined, 'blue'),
      metric('ReEditPro service fee', formatCreditAmount(summary?.reeditproServiceFeeCredits ?? settlement?.reeditproServiceFeeCredits ?? 0), 'Separate from tool costs.', 'violet'),
      metric('Final charge', formatCreditAmount(finalCharge), CREDIT_UI_COPY.formula, 'success'),
      metric('Reserved credits', formatCreditAmount(settlement?.reservedCredits ?? 0), undefined, 'warning'),
      metric('Returned credits', formatCreditAmount(released), undefined, 'success'),
      metric('Absorbed overage', formatCreditAmount(absorbed), 'Absorbed by ReEditPro when applicable.', 'info'),
      metric('Outstanding credits', formatCreditAmount(outstanding), 'Shown separately from wallet balance.', 'warning'),
    ],
    lineItems: [
      ...(summary?.userFacingLines ?? []).map((line) => ({
        label: line.label,
        value: formatCreditAmount(line.credits),
        detail: line.description,
        tone: 'blue' as CreditUITone,
      })),
      ...result.reservationLineItems.map((line) => ({
        label: `${line.usageCategory} reservation`,
        value: `${formatCreditAmount(line.spentCredits)} spent`,
        detail: `${formatCreditAmount(line.releasedCredits)} returned`,
        tone: 'violet' as CreditUITone,
      })),
    ],
    warnings: result.warnings,
  }
}

export function createCreditExportLockCardViewModel(result: ExportCreditGateResult): CreditExportLockCardViewModel {
  const absorbedCopy = result.absorbedOverageCredits > 0
    ? 'Your edit cost more to process than your approved maximum, but you were not charged above your approved hold. ReEditPro absorbed the extra credits, and you can export this edit.'
    : result.userFacingMessage

  return {
    title: result.status === 'export_allowed' ? 'Export ready' : result.userFacingTitle,
    badge: { label: result.status, tone: result.canExport ? 'success' : 'warning' },
    message: result.status === 'export_locked_top_up_required'
      ? `Your edit is ready, but ${result.outstandingCredits} approved credits are still needed before export can be rechecked.`
      : absorbedCopy,
    metrics: [
      metric('Can export', result.canExport ? 'Yes' : 'No', 'Display-only; this UI does not change real export readiness.', result.canExport ? 'success' : 'warning'),
      metric('Outstanding credits', formatCreditAmount(result.outstandingCredits), undefined, 'warning'),
      metric('Reserved credits', formatCreditAmount(result.reservedCredits), undefined, 'violet'),
      metric('Final charge', formatCreditAmount(result.finalChargeCredits), undefined, 'blue'),
      metric('Released credits', formatCreditAmount(result.releasedCredits), undefined, 'success'),
    ],
    warnings: result.warnings,
  }
}

export function createCreditTopUpCardViewModel(input: {
  packs: readonly CreditPackDefinition[]
  recommendedPackId?: string
  requiredCredits: number
  nextSuggestedAction: string
  warnings?: string[]
}): CreditTopUpCardViewModel {
  const recommendedPack = input.packs.find((pack) => pack.id === input.recommendedPackId)

  return {
    title: 'Mock credit top-up packs',
    badge: { label: 'Mock/test only', tone: 'cyan' },
    packs: input.packs.map((pack) => ({
      id: pack.id,
      label: pack.label,
      credits: formatCreditAmount(pack.credits),
      price: formatCurrencyCents(pack.priceCents),
      recommended: pack.id === input.recommendedPackId,
    })),
    requiredCredits: formatCreditAmount(input.requiredCredits),
    recommendedPack: recommendedPack ? `${recommendedPack.label}: ${formatCreditAmount(recommendedPack.credits)} = ${formatCurrencyCents(recommendedPack.priceCents)}` : undefined,
    nextSuggestedAction: nextActionLabel(input.nextSuggestedAction),
    copy: [
      CREDIT_UI_COPY.topUpMockOnly,
      CREDIT_UI_COPY.topUpNotSpent,
      CREDIT_UI_COPY.topUpRetry,
    ],
    warnings: input.warnings ?? [],
  }
}

export function createStripeBillingStatusViewModel(input: {
  config: StripeConfigStatusResponse
  testReadiness: StripeTestReadinessResponse
  liveReadiness: StripeLiveReadinessResponse
}): StripeBillingStatusViewModel {
  const { config, liveReadiness, testReadiness } = input

  return {
    title: 'Stripe billing status',
    badge: { label: config.config.mode, tone: config.config.mode === 'live' ? 'warning' : config.config.mode === 'test' ? 'cyan' : 'muted' },
    metrics: [
      metric('Billing mode', config.config.mode, config.status, 'blue'),
      metric('Test readiness', testReadiness.status, testReadiness.canRunTestMode ? 'Test mode can run when configured.' : 'Test mode blocked.', testReadiness.canRunTestMode ? 'success' : 'warning'),
      metric('Live readiness', liveReadiness.status, liveReadiness.noChargeDryRun ? 'No-charge dry run only.' : undefined, liveReadiness.status === 'ready_no_charge' ? 'success' : 'warning'),
      metric('Live Checkout', liveReadiness.canCreateLiveCheckoutSessions ? 'Enabled' : 'Blocked', undefined, 'warning'),
      metric('Live SetupIntent', liveReadiness.canCreateLiveSetupIntents ? 'Enabled' : 'Blocked', undefined, 'warning'),
      metric('Live PaymentIntent', liveReadiness.canCreateLivePaymentIntents ? 'Enabled' : 'Blocked', undefined, 'warning'),
      metric('Live webhooks', liveReadiness.canProcessLiveWebhooks ? 'Enabled' : 'Blocked', undefined, 'warning'),
      metric('Live credit grants', liveReadiness.canGrantLiveCredits ? 'Enabled' : 'Blocked', undefined, 'warning'),
    ],
    copy: [
      CREDIT_UI_COPY.secretReferenceSafety,
      CREDIT_UI_COPY.stripeNoPayment,
      CREDIT_UI_COPY.stripeLiveBlocked,
      CREDIT_UI_COPY.stripeNoSecrets,
      'No real Stripe calls are enabled by this UI.',
    ],
    warnings: [...config.warnings, ...testReadiness.warnings, ...liveReadiness.warnings],
  }
}

export function createCreditLifecycleViewModel(source: CreditLifecycleSource): CreditLifecycleViewModel {
  return {
    wallet: createCreditWalletSummaryViewModel({
      balance: source.walletBalance,
      outstandingCredits: source.outstandingCredits,
      purchasedCredits: source.purchasedCredits,
      weeklyBonusCredits: source.weeklyBonusCredits,
    }),
    estimate: createCreditEstimateCardViewModel(source.estimatePreview),
    reservation: createCreditReservationCardViewModel(source.reservationResult),
    runtimeGuard: createCreditRuntimeGuardCardViewModel(source.runtimeGuard),
    revisionAction: createCreditRevisionActionCardViewModel(source.revisionAction),
    settlement: createCreditSettlementReceiptViewModel(source.settlementResult),
    exportLock: createCreditExportLockCardViewModel(source.exportGate),
    topUp: createCreditTopUpCardViewModel({
      nextSuggestedAction: source.topUpNextSuggestedAction,
      packs: source.creditPacks,
      recommendedPackId: source.recommendedPackId,
      requiredCredits: source.topUpRequiredCredits,
    }),
    stripeBilling: createStripeBillingStatusViewModel({
      config: source.stripeConfig,
      liveReadiness: source.stripeLiveReadiness,
      testReadiness: source.stripeTestReadiness,
    }),
  }
}

function metric(label: string, value: string, detail?: string, tone: CreditUITone = 'muted'): CreditUIMetric {
  return { detail, label, tone, value }
}

function action(label: string, disabled: boolean, helper: string, tone: CreditUITone): CreditUIAction {
  return { disabled, helper, label, tone }
}

function editLevelLabel(level: string): string {
  if (level === 'normal') return 'Normal'
  if (level === 'premium') return 'Premium'
  if (level === 'ultra_premium') return 'Ultra Premium'
  return level
}

function runtimeStatusTitle(status: CreditRuntimeGuardStatus): string {
  if (status === 'ready') return 'Credit guard ready'
  if (status === 'estimate_only') return 'Estimate only'
  if (status === 'missing_approved_plan') return 'Approved plan required'
  if (status === 'missing_approved_credit_estimate') return 'Approved credit estimate required'
  if (status === 'missing_active_credit_reservation') return 'Active reserved credits required'
  if (status === 'missing_idempotency_key') return 'Idempotency key required'
  if (status === 'production_blocked') return 'Production tool blocked'
  return 'Invalid credit context'
}

function revisionStateCopy(status: CreditRevisionActionRecord['status']): {
  message?: string
  title?: string
  tone: CreditUITone
} {
  if (status === 'approved') {
    return { message: 'Revised credits approved. Extra credits reserved.', title: 'Revised credits approved. Extra credits reserved.', tone: 'success' }
  }
  if (status === 'lower_cost_selected') {
    return { message: 'Lower-cost option selected. ReEditPro will rebuild the estimate before more paid work continues.', title: 'Lower-cost option selected', tone: 'cyan' }
  }
  if (status === 'cancelled') {
    return { message: 'Extra work cancelled. ReEditPro will continue only within your existing approved credit limit where possible.', title: 'Extra work cancelled', tone: 'warning' }
  }
  if (status === 'expired') return { title: 'Revised credit action expired', tone: 'danger' }
  if (status === 'resolved') return { title: 'Revised credit action resolved', tone: 'success' }
  return { tone: 'warning' }
}

function nextActionLabel(actionId: string): string {
  if (actionId === 'retry_estimate_reservation') return 'Retry estimate reservation'
  if (actionId === 'retry_revised_credit_approval') return 'Retry revised credit approval'
  if (actionId === 'retry_export_gate') return 'Retry export gate'
  if (actionId === 'review_wallet') return 'Review wallet'
  return 'None'
}
