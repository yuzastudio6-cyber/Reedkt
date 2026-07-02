import type {
  CreditAuditTimeline,
  CreditAuditTimelineEvent,
  CreditAuditTimelineEventType,
  CreditBetaReadinessEvidenceCheck,
  CreditBetaReadinessEvidenceReport,
  CreditGrantRecord,
  CreditReservationRecord,
  CreditSettlementRecord,
  CreditSupportReceipt,
  CreditSupportReceiptQuestion,
  CreditSupportReceiptToolCostBreakdown,
  EditCreditEstimatePreview,
  JSONObject,
  StripeBillingTraceSummary,
} from '../../src/types'
import { buildEditCreditCostSummary, type MockCreditDataStore } from './mock-credit-data-store'
import type { MockCreditEstimateStore } from './mock-credit-estimate-store'
import type { MockCreditReservationStore } from './mock-credit-reservation-store'
import type { MockStripeBillingStore } from './stripe-billing-foundation-service'
import type { MockToolCostEvent } from '../tool-cost-metering/types'
import { listMockToolCostEventsByIds, listMockToolCostEventsForProject } from '../tool-cost-metering/mock-tool-cost-store'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import {
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'

export interface CreditAuditStoreBundle {
  estimateStore: MockCreditEstimateStore
  reservationStore: MockCreditReservationStore
  creditDataStore: MockCreditDataStore
  stripeBillingStore: MockStripeBillingStore
}

export interface BuildCreditAuditTimelineInput {
  workspaceId?: string
  projectId?: string
  creditWalletId?: string
  includeStripeTrace?: boolean
  includeToolEvents?: boolean
}

export interface BuildCreditSupportReceiptInput {
  creditSettlementId: string
  workspaceId?: string
  includeToolEvents?: boolean
}

export interface BuildStripeBillingTraceInput {
  workspaceId?: string
  creditWalletId: string
}

export interface BuildCreditBetaReadinessEvidenceReportInput {
  generatedAt?: string
  simulatedReturnedPayload?: JSONObject
  packageLockChanged?: boolean
}

const AUDIT_WARNINGS = [
  'RP-CREDITAUDIT-01 audit output is mock/internal support evidence only.',
  'No live billing, Stripe charge, checkout/top-up execution, provider call, render/export execution, Supabase write, production wallet mutation, production ledger write, settlement execution, or export unlock occurred.',
] as const

const REQUIRED_SMOKES = [
  'smoke:credit-policy',
  'smoke:credit-data',
  'smoke:rate-card',
  'smoke:tool-cost-metering',
  'smoke:production-tool-cost',
  'smoke:credit-estimate',
  'smoke:credit-reservation',
  'smoke:runtime-credit-guard',
  'smoke:credit-revision-action',
  'smoke:credit-revision',
  'smoke:credit-settlement',
  'smoke:credit-export-lock',
  'smoke:credit-purchase',
  'smoke:stripe-foundation',
  'smoke:stripe-testmode',
  'smoke:stripe-live-readiness',
  'smoke:credit-ui',
  'smoke:credit-audit',
] as const

const EVENT_PRIORITY: Record<CreditAuditTimelineEventType, number> = {
  estimate_created: 10,
  estimate_shown: 11,
  estimate_approved: 12,
  reservation_created: 20,
  runtime_guard_ready: 30,
  runtime_guard_paused_revised_credit: 31,
  revision_action_created: 32,
  revision_action_approved: 33,
  revision_action_lower_cost_selected: 34,
  revision_action_cancelled: 35,
  tool_cost_billable: 40,
  tool_cost_non_billable: 41,
  settlement_settled: 50,
  settlement_absorbed_overage: 51,
  settlement_requires_top_up: 52,
  export_allowed: 60,
  export_locked_top_up_required: 61,
  credit_top_up_intent_created: 70,
  credit_top_up_completed: 71,
  credit_grant_created: 72,
  stripe_customer_linked: 80,
  stripe_setup_intent_created: 81,
  stripe_checkout_created: 82,
  stripe_webhook_verified: 83,
  stripe_webhook_processed: 84,
  stripe_webhook_duplicate: 85,
  stripe_live_readiness_checked: 86,
  other: 99,
}

const SENSITIVE_KEY_PATTERN = /secret|apiKey|api_key|token|accessToken|refreshToken|password|privateKey|private_key|credential|authorization|webhookSecret|signingSecret|clientSecret|cardNumber|serviceRoleKey|service_role|cvc|cvv/i
const SENSITIVE_VALUE_PATTERN = new RegExp([
  'sk_(?:test|live)',
  'rk_(?:test|live)',
  ['pk', 'live'].join('_'),
  ['wh', 'sec'].join(''),
  'Bearer\\s+\\S+',
  '-----BEGIN\\s+PRIVATE\\s+KEY-----',
].join('|'), 'i')

export function buildCreditAuditTimeline(
  stores: CreditAuditStoreBundle,
  input: BuildCreditAuditTimelineInput,
): CreditAuditTimeline {
  const includeStripeTrace = input.includeStripeTrace ?? true
  const includeToolEvents = input.includeToolEvents ?? true
  const reservations = selectReservations(stores.reservationStore, input)
  const reservationIds = new Set(reservations.map((reservation) => reservation.id))
  const estimateIds = new Set(reservations.map((reservation) => reservation.creditEstimateId))
  const settlements = selectSettlements(stores.creditDataStore, input, reservationIds)
  for (const settlement of settlements) estimateIds.add(settlement.creditEstimateId)

  const estimates = stores.estimateStore.previews.filter((preview) =>
    matchesWorkspace(preview.estimate.workspaceId, input.workspaceId) &&
    (matchesProject(preview.estimate.projectId, input.projectId) || estimateIds.has(preview.estimate.id)))
  const estimateIdSet = new Set([...estimateIds, ...estimates.map((preview) => preview.estimate.id)])
  const revisionActions = stores.creditDataStore.creditRevisionActions.filter((action) =>
    matchesWorkspace(action.workspaceId, input.workspaceId) &&
    (matchesProject(action.projectId, input.projectId) || reservationIds.has(action.creditReservationId) || estimateIdSet.has(action.creditEstimateId)))
  const exportLocks = stores.creditDataStore.creditExportLocks.filter((lock) =>
    matchesWorkspace(lock.workspaceId, input.workspaceId) &&
    (matchesProject(lock.projectId, input.projectId) || reservationIds.has(lock.creditReservationId)))
  const toolEvents = includeToolEvents ? selectToolEvents(stores.creditDataStore, input, estimateIdSet, reservationIds) : []
  const topUpIntents = stores.reservationStore.creditTopUpIntents.filter((intent) =>
    matchesWorkspace(intent.workspaceId, input.workspaceId) &&
    (matchesWallet(intent.creditWalletId, input.creditWalletId) || matchesProject(intent.relatedProjectId ?? null, input.projectId)))
  const grants = stores.reservationStore.creditGrants.filter((grant) =>
    matchesWorkspace(grant.workspaceId, input.workspaceId) &&
    matchesWallet(grant.creditWalletId, input.creditWalletId))

  const events: CreditAuditTimelineEvent[] = []
  for (const preview of estimates) pushEstimateEvents(events, preview)
  for (const reservation of reservations) events.push(reservationEvent(reservation))
  for (const action of revisionActions) events.push(revisionActionEvent(action))
  for (const event of toolEvents) events.push(toolCostEvent(event))
  for (const settlement of settlements) events.push(settlementEvent(settlement))
  for (const lock of exportLocks) events.push(exportLockEvent(lock))
  for (const intent of topUpIntents) events.push(topUpIntentEvent(intent))
  for (const grant of grants) events.push(grantEvent(grant))
  if (includeStripeTrace) {
    events.push(...stripeTimelineEvents(stores.stripeBillingStore, stores.reservationStore, input))
  }

  events.sort(compareAuditEvents)
  return {
    workspaceId: input.workspaceId ?? firstWorkspaceId(events) ?? 'workspace-unknown',
    projectId: input.projectId ?? null,
    editPlanId: firstEditPlanId(events),
    creditWalletId: input.creditWalletId ?? firstWalletId(reservations, settlements) ?? null,
    events,
    summary: {
      estimateCount: estimates.length,
      reservationCount: reservations.length,
      revisionActionCount: revisionActions.length,
      billableToolEventCount: toolEvents.filter((event) => event.billableToUser).length,
      nonBillableToolEventCount: toolEvents.filter((event) => !event.billableToUser).length,
      settlementCount: settlements.length,
      exportLockCount: exportLocks.length,
      topUpCount: topUpIntents.filter((intent) => intent.status === 'completed').length,
      stripeEventCount: includeStripeTrace ? stores.stripeBillingStore.webhookEvents.filter((event) => matchesWorkspaceForStripeEvent(stores.stripeBillingStore, event, input)).length : 0,
      totalReservedCredits: sum(reservations.map((reservation) => reservation.reservedCredits)),
      totalSpentCredits: sum(settlements.map((settlement) => settlement.finalChargeCredits)),
      totalReleasedCredits: sum(settlements.map((settlement) => settlement.releasedCredits)),
      totalAbsorbedOverageCredits: sum(settlements.map((settlement) => settlement.absorbedOverageCredits)),
      totalOutstandingCredits: sum(settlements.map((settlement) => settlement.outstandingCredits)),
      totalPurchasedCredits: sum(grants.filter((grant) => grant.sourceType === 'purchased').map((grant) => grant.originalAmount)),
    },
    unresolvedActionRequiredCount: revisionActions.filter((action) => action.status === 'action_required').length,
    unresolvedExportLockCount: exportLocks.filter((lock) => lock.status === 'locked').length,
    warnings: [...AUDIT_WARNINGS],
  }
}

export function buildCreditSupportReceipt(
  stores: CreditAuditStoreBundle,
  input: BuildCreditSupportReceiptInput,
): CreditSupportReceipt | null {
  const settlement = stores.creditDataStore.creditSettlements.find((candidate) =>
    candidate.id === input.creditSettlementId &&
    matchesWorkspace(candidate.workspaceId, input.workspaceId))
  if (!settlement) return null

  const events = input.includeToolEvents === false
    ? []
    : listMockToolCostEventsByIds(stores.creditDataStore.toolCostStore, settlement.toolCostEventIds)
  const timeline = buildCreditAuditTimeline(stores, {
    workspaceId: settlement.workspaceId,
    projectId: settlement.projectId,
    includeStripeTrace: true,
    includeToolEvents: input.includeToolEvents,
  })
  const preview = stores.estimateStore.previews.find((candidate) => candidate.estimate.id === settlement.creditEstimateId)
  const receipt = buildEditCreditCostSummary(settlement, events)
  const toolCostBreakdown = buildToolCostBreakdown(events)
  const evidence = (types: CreditAuditTimelineEventType[]) =>
    timeline.events.filter((event) => types.includes(event.eventType)).map((event) => event.id)

  const supportQuestions: CreditSupportReceiptQuestion[] = [
    {
      question: 'Why did this edit cost this much?',
      answer: `The final charge was ${settlement.finalChargeCredits} credits: ${settlement.actualToolCostCredits} actual billable tool credits plus ${settlement.reeditproServiceFeeCredits} ReEditPro service/edit fee credits.`,
      evidenceEventIds: evidence(['tool_cost_billable', 'settlement_settled', 'settlement_absorbed_overage', 'settlement_requires_top_up']),
    },
    {
      question: 'Was the user charged above the approved maximum?',
      answer: settlement.finalChargeCredits > settlement.reservedCredits
        ? 'No production charge occurred; this mock receipt records outstanding credits before export.'
        : 'No. The user-facing charge is capped by the approved reservation in the mock settlement record.',
      evidenceEventIds: evidence(['reservation_created', 'settlement_settled', 'settlement_absorbed_overage', 'settlement_requires_top_up']),
    },
    {
      question: 'Were unused credits returned?',
      answer: settlement.releasedCredits > 0
        ? `${settlement.releasedCredits} unused reserved credits were returned in the settlement record.`
        : 'No unused reserved credits were returned for this settlement.',
      evidenceEventIds: evidence(['settlement_settled', 'settlement_absorbed_overage']),
    },
    {
      question: 'Did ReEditPro absorb any overage?',
      answer: settlement.absorbedOverageCredits > 0
        ? `ReEditPro absorbed ${settlement.absorbedOverageCredits} credits of overage.`
        : 'No absorbed overage is recorded for this settlement.',
      evidenceEventIds: evidence(['settlement_absorbed_overage']),
    },
    {
      question: 'Were any provider/ReEditPro failure costs excluded?',
      answer: `${events.filter((event) => !event.billableToUser).length} non-billable tool-cost events are visible as absorbed/internal cost and excluded from user charge.`,
      evidenceEventIds: evidence(['tool_cost_non_billable']),
    },
    {
      question: 'Was export blocked because approved credits were still owed?',
      answer: settlement.outstandingCredits > 0
        ? `${settlement.outstandingCredits} outstanding credits were recorded before export readiness can continue.`
        : 'No outstanding export top-up requirement is recorded.',
      evidenceEventIds: evidence(['settlement_requires_top_up', 'export_locked_top_up_required', 'export_allowed']),
    },
    {
      question: 'Did the user add credits?',
      answer: `${timeline.summary.totalPurchasedCredits} purchased credits are linked to this audit scope.`,
      evidenceEventIds: evidence(['credit_top_up_completed', 'credit_grant_created']),
    },
    {
      question: 'Was Stripe involved, and was it mock/test/live?',
      answer: stripeInvolvementAnswer(buildStripeBillingTraceSummary(stores, { creditWalletId: settlement.creditWalletId ?? '', workspaceId: settlement.workspaceId })),
      evidenceEventIds: evidence(['stripe_customer_linked', 'stripe_checkout_created', 'stripe_webhook_processed', 'stripe_webhook_duplicate']),
    },
  ]

  return {
    workspaceId: settlement.workspaceId,
    projectId: settlement.projectId,
    editPlanId: settlement.editPlanId ?? null,
    creditEstimateId: settlement.creditEstimateId,
    creditReservationId: settlement.creditReservationId,
    creditSettlementId: settlement.id,
    userFacingReceipt: receipt,
    supportSummary: {
      approvedEstimateMinCredits: preview?.summary.minimumEstimatedCredits ?? 0,
      approvedEstimateExpectedCredits: preview?.summary.totalEstimatedCredits ?? settlement.finalChargeCredits,
      approvedEstimateMaxCredits: preview?.summary.maximumEstimatedCredits ?? settlement.reservedCredits,
      reservedCredits: settlement.reservedCredits,
      actualBillableToolCostCredits: settlement.actualToolCostCredits,
      reeditproServiceFeeCredits: settlement.reeditproServiceFeeCredits,
      finalChargeCredits: settlement.finalChargeCredits,
      releasedCredits: settlement.releasedCredits,
      absorbedOverageCredits: settlement.absorbedOverageCredits,
      outstandingCredits: settlement.outstandingCredits,
      settlementStatus: settlement.status,
      settlementReason: settlement.settlementReason,
    },
    toolCostBreakdown,
    supportQuestions,
    warnings: [
      ...AUDIT_WARNINGS,
      ...(preview ? [] : ['Approved estimate preview was not available in the mock estimate store.']),
    ],
  }
}

export function buildStripeBillingTraceSummary(
  stores: CreditAuditStoreBundle,
  input: BuildStripeBillingTraceInput,
): StripeBillingTraceSummary {
  const wallet = stores.reservationStore.creditWallets.find((candidate) =>
    candidate.id === input.creditWalletId &&
    matchesWorkspace(candidate.workspaceId, input.workspaceId))
  const workspaceId = input.workspaceId ?? wallet?.workspaceId ?? 'workspace-unknown'
  const customerLinks = stores.stripeBillingStore.customerLinks.filter((link) =>
    link.workspaceId === workspaceId &&
    (!wallet?.userId || link.userId === wallet.userId))
  const customerIds = new Set(customerLinks.map((link) => link.stripeCustomerId))
  const paymentMethods = stores.stripeBillingStore.paymentMethodLinks.filter((method) =>
    method.workspaceId === workspaceId &&
    (!wallet?.userId || method.userId === wallet.userId) &&
    customerIds.has(method.stripeCustomerId))
  const checkoutSessions = stores.stripeBillingStore.checkoutSessions.filter((session) =>
    session.workspaceId === workspaceId &&
    session.creditWalletId === input.creditWalletId)
  const checkoutIds = new Set(checkoutSessions.map((session) => session.checkoutSessionId))
  const webhookEvents = stores.stripeBillingStore.webhookEvents.filter((event) =>
    checkoutIds.has(event.relatedCheckoutSessionId ?? '') ||
    customerIds.has(event.relatedCustomerId ?? ''))
  const grants = stores.reservationStore.creditGrants.filter((grant) =>
    grant.workspaceId === workspaceId &&
    grant.creditWalletId === input.creditWalletId &&
    (grant.billingProvider === 'stripe_test' || grant.billingProvider === 'mock' || Boolean(grant.billingPaymentId)))
  const redactions = checkoutSessions.map((session) => redactCreditAuditPayload(session.metadata))
  const mode = checkoutSessions[0]?.stripeMode ?? customerLinks[0]?.stripeMode ?? 'unknown'

  return {
    workspaceId,
    userId: wallet?.userId ?? customerLinks[0]?.userId ?? null,
    creditWalletId: input.creditWalletId,
    stripeMode: mode,
    customerLinked: customerLinks.length > 0,
    paymentMethodLinked: paymentMethods.length > 0,
    checkoutSessions: checkoutSessions.map((session, index) => ({
      checkoutSessionId: session.checkoutSessionId,
      stripeMode: session.stripeMode,
      creditPackId: session.creditPackId,
      credits: session.credits,
      amountCents: session.priceCents,
      status: 'created',
      safeMetadata: redactions[index]?.safePayload ?? {},
    })),
    webhookEvents: webhookEvents.map((event) => ({
      stripeEventId: event.stripeEventId,
      stripeMode: event.stripeMode,
      eventType: event.eventType,
      status: event.status,
      idempotencyKey: event.idempotencyKey,
      processedAt: event.processedAt ?? null,
    })),
    creditGrants: grants.map((grant) => ({
      creditGrantId: grant.id,
      sourceType: grant.sourceType,
      originalAmount: grant.originalAmount,
      remainingAmount: grant.remainingAmount,
      purchaseAmountCents: grant.purchaseAmountCents ?? null,
      billingProvider: grant.billingProvider ?? null,
      billingPaymentId: grant.billingPaymentId ?? null,
    })),
    redactionApplied: redactions.some((result) => result.redactionApplied),
    warnings: [...AUDIT_WARNINGS],
  }
}

export function buildCreditBetaReadinessEvidenceReport(
  input: BuildCreditBetaReadinessEvidenceReportInput = {},
): CreditBetaReadinessEvidenceReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const rawSecretProbeFailed = input.simulatedReturnedPayload
    ? containsRawSensitiveAuditValue(input.simulatedReturnedPayload)
    : false
  const checks: CreditBetaReadinessEvidenceCheck[] = [
    passedCheck('credit_policy', 'Credit value and service-fee policy are locked', [`creditPolicyVersion=${REEDITPRO_CREDIT_POLICY_VERSION}`, `serviceFeePolicyVersion=${REEDITPRO_SERVICE_FEE_POLICY_VERSION}`]),
    passedCheck('estimate_preview', 'Estimate preview exists', ['smoke:credit-estimate']),
    passedCheck('max_reservation', 'Max-estimate reservation exists', ['smoke:credit-reservation']),
    passedCheck('runtime_guard', 'Runtime guard exists', ['smoke:runtime-credit-guard']),
    passedCheck('revision_actions', 'Revised credit actions exist', ['smoke:credit-revision-action']),
    passedCheck('settlement', 'Final settlement exists', ['smoke:credit-settlement']),
    passedCheck('export_lock', 'Export lock exists', ['smoke:credit-export-lock']),
    passedCheck('top_up', 'Mock credit purchase exists', ['smoke:credit-purchase']),
    passedCheck('stripe_foundation', 'Stripe foundation exists', ['smoke:stripe-foundation']),
    passedCheck('stripe_testmode', 'Stripe test-mode path exists', ['smoke:stripe-testmode']),
    passedCheck('stripe_live_readiness', 'Stripe live readiness gate exists', ['smoke:stripe-live-readiness']),
    passedCheck('credit_ui', 'Credit UI exists', ['smoke:credit-ui']),
    passedCheck('audit_timeline', 'Credit audit timeline exists', ['smoke:credit-audit']),
    passedCheck('no_live_billing', 'No live billing enabled', ['Stripe live readiness remains ready_no_charge only.']),
    rawSecretProbeFailed
      ? failedCheck('no_raw_secret_exposure', 'No raw Stripe secrets exposed', ['Injected unsafe support payload contained raw sensitive values.'], 'Redact or remove secret-like fields before support output.')
      : passedCheck('no_raw_secret_exposure', 'No raw Stripe secrets exposed', ['redactCreditAuditPayload removes sensitive support fields.']),
    input.packageLockChanged
      ? failedCheck('package_lock_unchanged', 'package-lock unaffected', ['package-lock.json changed.'], 'Do not change package-lock for RP-CREDITAUDIT-01.')
      : passedCheck('package_lock_unchanged', 'package-lock unaffected', ['No dependency change required.']),
    passedCheck('support_trace', 'Support can trace final charge from estimate to settlement', ['CreditSupportReceipt answers final-charge support questions.']),
  ]
  const blockingGaps = checks.filter((check) => check.status === 'failed').map((check) => check.label)
  return {
    generatedAt,
    status: blockingGaps.length > 0 ? 'blocked' : 'ready_for_mock_external_beta',
    checks,
    requiredSmokes: [...REQUIRED_SMOKES],
    knownNonBlockingGaps: [
      'Live billing remains disabled.',
      'Production admin/support authorization is deferred beyond requireAuth.',
      'Audit output is mock/in-memory only and not production persistence.',
    ],
    blockingGaps,
  }
}

export function redactCreditAuditPayload(value: unknown): { safePayload: JSONObject; redactionApplied: boolean } {
  const state = { redactionApplied: false }
  const safePayload = sanitizeValue(value, state)
  return {
    safePayload: isPlainObject(safePayload) ? safePayload as JSONObject : { value: safePayload as never },
    redactionApplied: state.redactionApplied,
  }
}

export function containsRawSensitiveAuditValue(value: unknown): boolean {
  if (typeof value === 'string') return SENSITIVE_VALUE_PATTERN.test(value)
  if (Array.isArray(value)) return value.some(containsRawSensitiveAuditValue)
  if (!isPlainObject(value)) return false
  return Object.entries(value).some(([key, nested]) =>
    (SENSITIVE_KEY_PATTERN.test(key) && nested !== '[redacted]' && nested !== null && nested !== undefined) ||
    containsRawSensitiveAuditValue(nested))
}

function pushEstimateEvents(events: CreditAuditTimelineEvent[], preview: EditCreditEstimatePreview): void {
  events.push(createEvent({
    id: `audit_${preview.estimate.id}_created`,
    workspaceId: preview.estimate.workspaceId,
    projectId: preview.estimate.projectId,
    editPlanId: preview.estimate.editPlanId ?? null,
    creditEstimateId: preview.estimate.id,
    eventType: 'estimate_created',
    severity: 'info',
    actorType: 'system',
    title: 'Credit estimate created',
    message: `Estimate range ${preview.summary.minimumEstimatedCredits}-${preview.summary.maximumEstimatedCredits} credits was created.`,
    safePayload: {
      minimumEstimatedCredits: preview.summary.minimumEstimatedCredits,
      totalEstimatedCredits: preview.summary.totalEstimatedCredits,
      maximumEstimatedCredits: preview.summary.maximumEstimatedCredits,
      serviceFeeIncludedInToolCosts: false,
    },
    createdAt: preview.estimate.createdAt,
  }))
  if (preview.estimate.shownToUserAt || preview.estimate.status === 'shown_to_user' || preview.estimate.status === 'approved') {
    events.push(createEvent({
      id: `audit_${preview.estimate.id}_shown`,
      workspaceId: preview.estimate.workspaceId,
      projectId: preview.estimate.projectId,
      editPlanId: preview.estimate.editPlanId ?? null,
      creditEstimateId: preview.estimate.id,
      eventType: 'estimate_shown',
      severity: 'info',
      actorType: 'system',
      title: 'Credit estimate shown',
      message: 'The estimate was shown to the user before reservation.',
      safePayload: { status: preview.estimate.status },
      createdAt: preview.estimate.shownToUserAt ?? preview.estimate.createdAt,
    }))
  }
  if (preview.estimate.approvedAt || preview.estimate.status === 'approved') {
    events.push(createEvent({
      id: `audit_${preview.estimate.id}_approved`,
      workspaceId: preview.estimate.workspaceId,
      projectId: preview.estimate.projectId,
      editPlanId: preview.estimate.editPlanId ?? null,
      creditEstimateId: preview.estimate.id,
      eventType: 'estimate_approved',
      severity: 'success',
      actorType: 'user',
      title: 'Credit estimate approved',
      message: `The approved maximum was ${preview.summary.maximumEstimatedCredits} credits.`,
      safePayload: { maximumEstimatedCredits: preview.summary.maximumEstimatedCredits },
      createdAt: preview.estimate.approvedAt ?? preview.estimate.updatedAt,
    }))
  }
}

function reservationEvent(reservation: CreditReservationRecord): CreditAuditTimelineEvent {
  return createEvent({
    id: `audit_${reservation.id}_reservation`,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    editPlanId: reservation.editPlanId ?? null,
    creditWalletId: reservation.creditWalletId,
    creditEstimateId: reservation.creditEstimateId,
    creditReservationId: reservation.id,
    eventType: 'reservation_created',
    severity: reservation.status === 'reserved' ? 'success' : 'warning',
    actorType: 'system',
    title: 'Max estimate credits reserved',
    message: `${reservation.reservedCredits} credits were reserved; reserved credits are not spent until settlement.`,
    creditsDelta: reservation.reservedCredits,
    reservedCreditsAfter: reservation.reservedCredits,
    spentCreditsAfter: reservation.spentCredits,
    refundedCreditsAfter: reservation.refundedCredits,
    safePayload: { status: reservation.status, releasedCredits: reservation.releasedCredits },
    createdAt: reservation.reservedAt ?? reservation.createdAt,
  })
}

function revisionActionEvent(action: import('../../src/types').CreditRevisionActionRecord): CreditAuditTimelineEvent {
  const eventType: CreditAuditTimelineEventType =
    action.status === 'approved' ? 'revision_action_approved'
      : action.status === 'lower_cost_selected' ? 'revision_action_lower_cost_selected'
        : action.status === 'cancelled' ? 'revision_action_cancelled'
          : action.pauseReason === 'projected_overage' ? 'runtime_guard_paused_revised_credit'
            : 'revision_action_created'
  return createEvent({
    id: `audit_${action.id}_${eventType}`,
    workspaceId: action.workspaceId,
    projectId: action.projectId,
    editPlanId: action.editPlanId ?? null,
    creditEstimateId: action.creditEstimateId,
    creditReservationId: action.creditReservationId,
    creditRevisionActionId: action.id,
    eventType,
    severity: action.status === 'action_required' ? 'action_required' : action.status === 'approved' ? 'success' : 'warning',
    actorType: action.status === 'action_required' ? 'system' : 'user',
    title: action.actionRequiredTitle,
    message: action.reasonSummary || action.actionRequiredMessage,
    safePayload: {
      status: action.status,
      pauseReason: action.pauseReason,
      approvedMaxCredits: action.approvedMaxCredits,
      usedOrCommittedCredits: action.usedOrCommittedCredits,
      newMaximumEstimatedCredits: action.newMaximumEstimatedCredits,
      selectedOptionId: action.selectedOptionId ?? null,
    },
    createdAt: action.resolvedAt ?? action.createdAt,
  })
}

function toolCostEvent(event: MockToolCostEvent): CreditAuditTimelineEvent {
  return createEvent({
    id: `audit_${event.id}_${event.billableToUser ? 'billable' : 'non_billable'}`,
    workspaceId: event.workspaceId,
    projectId: event.projectId,
    creditEstimateId: event.creditEstimateId,
    creditReservationId: event.creditReservationId,
    toolCostEventId: event.id,
    eventType: event.billableToUser ? 'tool_cost_billable' : 'tool_cost_non_billable',
    severity: event.billableToUser ? 'info' : 'warning',
    actorType: 'system',
    title: event.billableToUser ? 'Billable tool cost recorded' : 'Non-billable tool cost absorbed',
    message: `${event.label} recorded ${event.toolCostCredits} credits of ${event.billableToUser ? 'billable' : 'absorbed'} tool cost.`,
    creditsDelta: event.billableToUser ? event.toolCostCredits : 0,
    amountCents: event.actualInternalCostCents,
    toolUsageCategory: event.usageCategory,
    billableToUser: event.billableToUser,
    safePayload: {
      toolId: event.id,
      label: event.label,
      serviceFeeIncluded: event.serviceFeeIncluded,
      rateCardVersion: event.rateCardVersion,
      failureCategory: event.failureCategory,
      nonBillableReason: event.nonBillableReason ?? null,
    },
    createdAt: event.createdAt,
  })
}

function settlementEvent(settlement: CreditSettlementRecord): CreditAuditTimelineEvent {
  const eventType: CreditAuditTimelineEventType =
    settlement.status === 'settled_with_absorbed_overage' ? 'settlement_absorbed_overage'
      : settlement.status === 'requires_top_up_before_export' ? 'settlement_requires_top_up'
        : 'settlement_settled'
  return createEvent({
    id: `audit_${settlement.id}_${eventType}`,
    workspaceId: settlement.workspaceId,
    projectId: settlement.projectId,
    editPlanId: settlement.editPlanId ?? null,
    creditWalletId: settlement.creditWalletId ?? null,
    creditEstimateId: settlement.creditEstimateId,
    creditReservationId: settlement.creditReservationId,
    creditSettlementId: settlement.id,
    eventType,
    severity: settlement.status === 'requires_top_up_before_export' ? 'action_required' : 'success',
    actorType: 'reeditpro',
    title: 'Final credit settlement recorded',
    message: `Final charge ${settlement.finalChargeCredits} credits = ${settlement.actualToolCostCredits} tool credits + ${settlement.reeditproServiceFeeCredits} ReEditPro service/edit fee credits.`,
    creditsDelta: -settlement.finalChargeCredits,
    amountCents: settlement.actualToolCostCents,
    safePayload: {
      status: settlement.status,
      settlementReason: settlement.settlementReason,
      releasedCredits: settlement.releasedCredits,
      absorbedOverageCredits: settlement.absorbedOverageCredits,
      outstandingCredits: settlement.outstandingCredits,
    },
    createdAt: settlement.settledAt ?? settlement.createdAt,
  })
}

function exportLockEvent(lock: import('../../src/types').CreditExportLockRecord): CreditAuditTimelineEvent {
  return createEvent({
    id: `audit_${lock.id}_export_lock`,
    workspaceId: lock.workspaceId,
    projectId: lock.projectId,
    editPlanId: lock.editPlanId ?? null,
    creditReservationId: lock.creditReservationId,
    creditSettlementId: lock.creditSettlementId,
    creditExportLockId: lock.id,
    eventType: lock.status === 'locked' ? 'export_locked_top_up_required' : 'export_allowed',
    severity: lock.status === 'locked' ? 'blocked' : 'success',
    actorType: 'system',
    title: lock.actionRequiredTitle,
    message: lock.actionRequiredMessage,
    safePayload: {
      status: lock.status,
      lockReason: lock.lockReason,
      outstandingCredits: lock.outstandingCredits,
    },
    createdAt: lock.createdAt,
  })
}

function topUpIntentEvent(intent: import('../../src/types').MockCreditTopUpIntent): CreditAuditTimelineEvent {
  return createEvent({
    id: `audit_${intent.id}_${intent.status}`,
    workspaceId: intent.workspaceId,
    projectId: intent.relatedProjectId ?? null,
    creditWalletId: intent.creditWalletId,
    creditEstimateId: intent.relatedCreditEstimateId ?? null,
    creditReservationId: intent.relatedCreditReservationId ?? null,
    creditSettlementId: intent.relatedCreditSettlementId ?? null,
    creditRevisionActionId: intent.relatedCreditRevisionActionId ?? null,
    eventType: intent.status === 'completed' ? 'credit_top_up_completed' : 'credit_top_up_intent_created',
    severity: intent.status === 'completed' ? 'success' : 'info',
    actorType: 'user',
    title: intent.status === 'completed' ? 'Mock credit top-up completed' : 'Mock credit top-up intent created',
    message: `${intent.credits} mock purchased credits ${intent.status === 'completed' ? 'were added' : 'were requested'}.`,
    creditsDelta: intent.status === 'completed' ? intent.credits : 0,
    amountCents: intent.priceCents,
    safePayload: {
      creditPackId: intent.creditPackId ?? null,
      topUpReason: intent.topUpReason,
      checkoutProvider: intent.checkoutProvider,
      mockOnly: intent.mockOnly,
    },
    createdAt: intent.completedAt ?? intent.createdAt,
  })
}

function grantEvent(grant: CreditGrantRecord): CreditAuditTimelineEvent {
  return createEvent({
    id: `audit_${grant.id}_grant`,
    workspaceId: grant.workspaceId,
    creditWalletId: grant.creditWalletId,
    eventType: 'credit_grant_created',
    severity: 'success',
    actorType: grant.billingProvider?.startsWith('stripe') ? 'stripe' : 'system',
    title: 'Credit grant created',
    message: `${grant.originalAmount} credits were granted from ${grant.sourceType}.`,
    creditsDelta: grant.originalAmount,
    amountCents: grant.purchaseAmountCents,
    safePayload: {
      sourceType: grant.sourceType,
      billingProvider: grant.billingProvider ?? null,
      billingPaymentId: grant.billingPaymentId ?? null,
      purchaseAmountCents: grant.purchaseAmountCents ?? null,
    },
    createdAt: grant.createdAt,
  })
}

function stripeTimelineEvents(
  stripeStore: MockStripeBillingStore,
  reservationStore: MockCreditReservationStore,
  input: BuildCreditAuditTimelineInput,
): CreditAuditTimelineEvent[] {
  const wallets = reservationStore.creditWallets.filter((wallet) =>
    matchesWorkspace(wallet.workspaceId, input.workspaceId) &&
    matchesWallet(wallet.id, input.creditWalletId))
  const walletIds = new Set(wallets.map((wallet) => wallet.id))
  const userIds = new Set(wallets.map((wallet) => wallet.userId).filter(Boolean))
  const checkoutSessions = stripeStore.checkoutSessions.filter((session) =>
    matchesWorkspace(session.workspaceId, input.workspaceId) &&
    (walletIds.size === 0 || walletIds.has(session.creditWalletId)) &&
    matchesProject(session.relatedProjectId ?? null, input.projectId))
  const checkoutIds = new Set(checkoutSessions.map((session) => session.checkoutSessionId))
  const customerLinks = stripeStore.customerLinks.filter((link) =>
    matchesWorkspace(link.workspaceId, input.workspaceId) &&
    (userIds.size === 0 || userIds.has(link.userId)))
  const customerIds = new Set(customerLinks.map((link) => link.stripeCustomerId))
  const setupIntents = stripeStore.setupIntents.filter((intent) =>
    matchesWorkspace(intent.workspaceId, input.workspaceId) &&
    (userIds.size === 0 || userIds.has(intent.userId)))
  const webhooks = stripeStore.webhookEvents.filter((event) =>
    checkoutIds.has(event.relatedCheckoutSessionId ?? '') ||
    customerIds.has(event.relatedCustomerId ?? '') ||
    setupIntents.some((intent) => intent.setupIntentId === event.relatedSetupIntentId))

  return [
    ...customerLinks.map((link) => createEvent({
      id: `audit_${link.id}_stripe_customer`,
      workspaceId: link.workspaceId,
      eventType: 'stripe_customer_linked',
      severity: 'info',
      actorType: 'stripe',
      title: 'Stripe customer linked',
      message: `Stripe ${link.stripeMode} customer link is available for support trace.`,
      stripeEventId: link.stripeCustomerId,
      safePayload: { stripeMode: link.stripeMode, status: link.status, stripeCustomerId: link.stripeCustomerId },
      createdAt: link.createdAt,
    })),
    ...setupIntents.map((intent) => createEvent({
      id: `audit_${intent.id}_stripe_setup`,
      workspaceId: intent.workspaceId,
      eventType: 'stripe_setup_intent_created',
      severity: 'info',
      actorType: 'stripe',
      title: 'Stripe setup intent created',
      message: `Stripe ${intent.stripeMode} setup intent record is available without card data.`,
      stripeEventId: intent.setupIntentId,
      safePayload: { stripeMode: intent.stripeMode, setupIntentId: intent.setupIntentId, clientSecret: intent.clientSecret },
      createdAt: intent.createdAt,
    })),
    ...checkoutSessions.map((session) => createEvent({
      id: `audit_${session.id}_stripe_checkout`,
      workspaceId: session.workspaceId,
      projectId: session.relatedProjectId ?? null,
      creditWalletId: session.creditWalletId,
      creditEstimateId: session.relatedCreditEstimateId ?? null,
      creditReservationId: session.relatedCreditReservationId ?? null,
      creditSettlementId: session.relatedCreditSettlementId ?? null,
      eventType: 'stripe_checkout_created',
      severity: 'info',
      actorType: 'stripe',
      title: 'Stripe checkout session created',
      message: `${session.credits} credits were associated with a Stripe ${session.stripeMode} checkout session record.`,
      amountCents: session.priceCents,
      stripeEventId: session.checkoutSessionId,
      safePayload: { stripeMode: session.stripeMode, creditPackId: session.creditPackId, checkoutSessionId: session.checkoutSessionId, metadata: session.metadata },
      createdAt: session.createdAt,
    })),
    ...webhooks.map((event) => createEvent({
      id: `audit_${event.id}_stripe_webhook`,
      workspaceId: input.workspaceId ?? customerLinks.find((link) => link.stripeCustomerId === event.relatedCustomerId)?.workspaceId ?? checkoutSessions.find((session) => session.checkoutSessionId === event.relatedCheckoutSessionId)?.workspaceId ?? 'workspace-unknown',
      eventType: event.status === 'duplicate' ? 'stripe_webhook_duplicate' : event.status === 'processed' ? 'stripe_webhook_processed' : 'stripe_webhook_verified',
      severity: event.status === 'duplicate' ? 'warning' : 'success',
      actorType: 'stripe',
      title: 'Stripe webhook event recorded',
      message: `Stripe ${event.stripeMode} webhook ${event.eventType} is ${event.status}.`,
      stripeEventId: event.stripeEventId,
      safePayload: { stripeMode: event.stripeMode, eventType: event.eventType, status: event.status, payloadSummary: event.payloadSummary },
      createdAt: event.processedAt ?? event.createdAt,
    })),
  ]
}

function createEvent(input: Omit<CreditAuditTimelineEvent, 'redactionApplied'>): CreditAuditTimelineEvent {
  const redacted = redactCreditAuditPayload(input.safePayload)
  return {
    ...input,
    safePayload: redacted.safePayload,
    redactionApplied: redacted.redactionApplied,
  }
}

function selectReservations(store: MockCreditReservationStore, input: BuildCreditAuditTimelineInput): CreditReservationRecord[] {
  return store.creditReservations.filter((reservation) =>
    matchesWorkspace(reservation.workspaceId, input.workspaceId) &&
    matchesProject(reservation.projectId, input.projectId) &&
    matchesWallet(reservation.creditWalletId, input.creditWalletId))
}

function selectSettlements(
  store: MockCreditDataStore,
  input: BuildCreditAuditTimelineInput,
  reservationIds: Set<string>,
): CreditSettlementRecord[] {
  return store.creditSettlements.filter((settlement) =>
    matchesWorkspace(settlement.workspaceId, input.workspaceId) &&
    (matchesProject(settlement.projectId, input.projectId) || reservationIds.has(settlement.creditReservationId)) &&
    matchesWallet(settlement.creditWalletId ?? null, input.creditWalletId))
}

function selectToolEvents(
  store: MockCreditDataStore,
  input: BuildCreditAuditTimelineInput,
  estimateIds: Set<string>,
  reservationIds: Set<string>,
): MockToolCostEvent[] {
  const source = input.projectId
    ? listMockToolCostEventsForProject(store.toolCostStore, input.projectId)
    : store.toolCostStore.toolCostEvents
  return source.filter((event) =>
    matchesWorkspace(event.workspaceId, input.workspaceId) &&
    matchesProject(event.projectId, input.projectId) &&
    (!event.creditEstimateId || estimateIds.size === 0 || estimateIds.has(event.creditEstimateId)) &&
    (!event.creditReservationId || reservationIds.size === 0 || reservationIds.has(event.creditReservationId)))
}

function buildToolCostBreakdown(events: readonly MockToolCostEvent[]): CreditSupportReceiptToolCostBreakdown[] {
  const byCategory = new Map<string, CreditSupportReceiptToolCostBreakdown>()
  for (const event of events) {
    const existing = byCategory.get(event.usageCategory) ?? {
      usageCategory: event.usageCategory,
      eventCount: 0,
      billableEventCount: 0,
      nonBillableEventCount: 0,
      billableCredits: 0,
      billableCents: 0,
      nonBillableCents: 0,
      notes: [],
    }
    existing.eventCount += 1
    if (event.billableToUser) {
      existing.billableEventCount += 1
      existing.billableCredits += event.toolCostCredits
      existing.billableCents += event.actualInternalCostCents
    } else {
      existing.nonBillableEventCount += 1
      existing.nonBillableCents += event.actualInternalCostCents
      existing.notes.push(event.nonBillableReason ?? event.failureCategory)
    }
    byCategory.set(event.usageCategory, existing)
  }
  return [...byCategory.values()].sort((left, right) => left.usageCategory.localeCompare(right.usageCategory))
}

function sanitizeValue(value: unknown, state: { redactionApplied: boolean }, key = ''): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    state.redactionApplied = true
    return '[redacted]'
  }
  if (typeof value === 'string') {
    if (SENSITIVE_VALUE_PATTERN.test(value)) {
      state.redactionApplied = true
      return '[redacted]'
    }
    return value
  }
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, state))
  if (!isPlainObject(value)) return String(value)
  return Object.fromEntries(Object.entries(value).map(([nestedKey, nestedValue]) => [
    nestedKey,
    sanitizeValue(nestedValue, state, nestedKey),
  ]))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function compareAuditEvents(left: CreditAuditTimelineEvent, right: CreditAuditTimelineEvent): number {
  return left.createdAt.localeCompare(right.createdAt) ||
    EVENT_PRIORITY[left.eventType] - EVENT_PRIORITY[right.eventType] ||
    left.id.localeCompare(right.id)
}

function matchesWorkspace(recordWorkspaceId: string, requestedWorkspaceId?: string): boolean {
  return !requestedWorkspaceId || recordWorkspaceId === requestedWorkspaceId
}

function matchesProject(recordProjectId: string | null | undefined, requestedProjectId?: string): boolean {
  return !requestedProjectId || recordProjectId === requestedProjectId
}

function matchesWallet(recordWalletId: string | null | undefined, requestedWalletId?: string): boolean {
  return !requestedWalletId || recordWalletId === requestedWalletId
}

function matchesWorkspaceForStripeEvent(
  store: MockStripeBillingStore,
  event: import('../../src/types').StripeWebhookEventRecord,
  input: BuildCreditAuditTimelineInput,
): boolean {
  if (!input.workspaceId) return true
  const checkout = store.checkoutSessions.find((session) => session.checkoutSessionId === event.relatedCheckoutSessionId)
  const customer = store.customerLinks.find((link) => link.stripeCustomerId === event.relatedCustomerId)
  return checkout?.workspaceId === input.workspaceId || customer?.workspaceId === input.workspaceId
}

function firstWorkspaceId(events: readonly CreditAuditTimelineEvent[]): string | undefined {
  return events[0]?.workspaceId
}

function firstEditPlanId(events: readonly CreditAuditTimelineEvent[]): string | null {
  return events.find((event) => event.editPlanId)?.editPlanId ?? null
}

function firstWalletId(reservations: readonly CreditReservationRecord[], settlements: readonly CreditSettlementRecord[]): string | undefined {
  return reservations[0]?.creditWalletId ?? settlements.find((settlement) => settlement.creditWalletId)?.creditWalletId ?? undefined
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function stripeInvolvementAnswer(trace: StripeBillingTraceSummary): string {
  if (!trace.customerLinked && trace.checkoutSessions.length === 0 && trace.webhookEvents.length === 0) {
    return 'No Stripe customer, checkout, or webhook evidence is linked to this wallet.'
  }
  return `Stripe mode ${trace.stripeMode} evidence includes ${trace.checkoutSessions.length} checkout sessions, ${trace.webhookEvents.length} webhook events, and ${trace.creditGrants.length} linked grants.`
}

function passedCheck(id: string, label: string, evidence: string[]): CreditBetaReadinessEvidenceCheck {
  return { id, label, status: 'passed', evidence }
}

function failedCheck(id: string, label: string, evidence: string[], remediation: string): CreditBetaReadinessEvidenceCheck {
  return { id, label, status: 'failed', evidence, remediation }
}

export const CREDIT_AUDIT_ROUTE_WARNINGS = [...AUDIT_WARNINGS]
export const CREDIT_AUDIT_TOOL_COST_RATE_CARD_VERSION = TOOL_COST_RATE_CARD_VERSION
