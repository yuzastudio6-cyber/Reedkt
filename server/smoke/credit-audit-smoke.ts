import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type {
  CreditExportLockRecord,
  CreditGrantRecord,
  CreditReservationRecord,
  CreditSettlementRecord,
  CreditWalletRecord,
  MockCreditTopUpIntent,
  StripeCustomerLinkRecord,
  StripePaymentMethodLinkRecord,
  MockStripeCheckoutSessionRecord,
  MockStripeSetupIntentRecord,
  StripeWebhookEventRecord,
} from '../../src/types'
import {
  buildCreditAuditTimeline,
  buildCreditBetaReadinessEvidenceReport,
  buildCreditSupportReceipt,
  buildStripeBillingTraceSummary,
  containsRawSensitiveAuditValue,
  redactCreditAuditPayload,
} from '../services/credit-audit-service'
import { createMockCreditDataStore, insertCreditExportLock, insertCreditSettlement } from '../services/mock-credit-data-store'
import { createMockCreditEstimateStore, insertEditCreditEstimatePreview, buildEditCreditEstimatePreview } from '../services/mock-credit-estimate-store'
import { createMockCreditReservationStore } from '../services/mock-credit-reservation-store'
import { createMockStripeBillingStore } from '../services/stripe-billing-foundation-service'
import { createMockToolCostEvent, insertMockToolCostEvent } from '../tool-cost-metering/mock-tool-cost-store'

const root = process.cwd()
const workspaceId = 'workspace_credit_audit_smoke'
const projectId = 'project_credit_audit_smoke'
const editPlanId = 'edit_plan_credit_audit_smoke'
const creditWalletId = 'wallet_credit_audit_smoke'
const creditEstimateId = 'credit_estimate_audit_smoke'
const creditReservationId = 'credit_reservation_audit_smoke'
const createdAt = '2026-07-01T12:00:00.000Z'
const fakeSetupSecret = ['seti', 'secret', 'must_redact'].join('_')
const fakeNestedSecret = ['nested', 'secret', 'must_redact'].join('_')
const fakeRedactionSecret = ['seti', 'secret', 'should_redact'].join('_')
const fakeAuthorizationHeader = ['Bearer', 'should-redact'].join(' ')
const fakeCardNumber = ['4242', '4242', '4242', '4242'].join('')
const fakeWebhookSecret = ['wh', 'sec', 'should_block'].join('')
const forbiddenStripeMarkers = [
  ['sk', 'test'].join('_'),
  ['sk', 'live'].join('_'),
  ['rk', 'test'].join('_'),
  ['rk', 'live'].join('_'),
  ['pk', 'live'].join('_'),
]

const estimateStore = createMockCreditEstimateStore()
const reservationStore = createMockCreditReservationStore()
const creditDataStore = createMockCreditDataStore()
const stripeBillingStore = createMockStripeBillingStore()
const stores = { estimateStore, reservationStore, creditDataStore, stripeBillingStore }

const preview = buildEditCreditEstimatePreview({
  workspaceId,
  projectId,
  editPlanId,
  productEditLevel: 'premium',
  finalVideoDurationSeconds: 60,
  plannedToolIds: ['opentimelineio'],
  toolUsageInputs: {
    opentimelineio: {
      actualInternalCostCents: 1200,
      estimatedRuntimeSeconds: 30,
    },
  },
  availableCreditsSnapshot: 260,
  reservedCreditsSnapshot: 0,
  purchasedCreditsSnapshot: 100,
  weeklyBonusCreditsSnapshot: 160,
  idempotencyKey: 'credit-audit-estimate',
})
preview.estimate.id = creditEstimateId
preview.estimate.status = 'approved'
preview.estimate.shownToUserAt = '2026-07-01T12:01:00.000Z'
preview.estimate.approvedAt = '2026-07-01T12:02:00.000Z'
preview.estimate.createdAt = createdAt
preview.estimate.updatedAt = '2026-07-01T12:02:00.000Z'
preview.summary.creditEstimateId = creditEstimateId
preview.summary.minimumEstimatedCredits = 120
preview.summary.totalEstimatedCredits = 160
preview.summary.maximumEstimatedCredits = 200
preview.summary.requiredHoldCredits = 200
preview.serviceFeeEstimate.lowToolCostCredits = 90
preview.serviceFeeEstimate.expectedToolCostCredits = 120
preview.serviceFeeEstimate.highToolCostCredits = 160
preview.serviceFeeEstimate.lowServiceFeeCredits = 30
preview.serviceFeeEstimate.expectedServiceFeeCredits = 40
preview.serviceFeeEstimate.highServiceFeeCredits = 40
insertEditCreditEstimatePreview(estimateStore, preview)

const wallet: CreditWalletRecord = {
  id: creditWalletId,
  workspaceId,
  userId: 'user_credit_audit_smoke',
  walletType: 'personal',
  name: 'Audit smoke wallet',
  currencyCode: 'CREDITS',
  cachedAvailableCredits: 60,
  cachedReservedCredits: 200,
  cachedSpentCredits: 160,
  cachedRefundedCredits: 0,
  lastCalculatedAt: '2026-07-01T12:20:00.000Z',
  createdAt,
  updatedAt: '2026-07-01T12:20:00.000Z',
  metadata: { mockOnly: true },
}
reservationStore.creditWallets.push(wallet)

const reservation: CreditReservationRecord = {
  id: creditReservationId,
  creditWalletId,
  workspaceId,
  projectId,
  creditEstimateId,
  creditApprovalId: 'credit_approval_audit_smoke',
  editPlanId,
  status: 'reserved',
  reservedCredits: 200,
  spentCredits: 160,
  releasedCredits: 40,
  refundedCredits: 0,
  reservationReason: 'Reserve maximum estimate for audit smoke.',
  idempotencyKey: 'credit-audit-reservation',
  reservedAt: '2026-07-01T12:03:00.000Z',
  createdAt: '2026-07-01T12:03:00.000Z',
  updatedAt: '2026-07-01T12:20:00.000Z',
  metadata: { mockOnly: true },
}
reservationStore.creditReservations.push(reservation)

reservationStore.creditTopUpIntents.push(topUpIntent())
reservationStore.creditGrants.push(purchasedGrant())

const billableToolEvent = createMockToolCostEvent({
  id: 'tool_cost_billable_audit_smoke',
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  label: 'OpenTimelineIO edit analysis',
  usageCategory: 'media_analysis',
  billableToUser: true,
  actualInternalCostCents: 1600,
  idempotencyKey: 'tool-cost-billable-audit',
})
billableToolEvent.createdAt = '2026-07-01T12:05:00.000Z'
const nonBillableToolEvent = createMockToolCostEvent({
  id: 'tool_cost_non_billable_audit_smoke',
  workspaceId,
  projectId,
  creditEstimateId,
  creditReservationId,
  label: 'Provider retry absorbed by ReEditPro',
  usageCategory: 'rendering',
  billableToUser: false,
  actualInternalCostCents: 300,
  nonBillableReason: 'provider_failure_absorbed',
  failureCategory: 'provider_error',
  idempotencyKey: 'tool-cost-nonbillable-audit',
})
nonBillableToolEvent.createdAt = '2026-07-01T12:06:00.000Z'
insertMockToolCostEvent(creditDataStore.toolCostStore, billableToolEvent)
insertMockToolCostEvent(creditDataStore.toolCostStore, nonBillableToolEvent)

insertCreditSettlement(creditDataStore, settlementRecord({
  id: 'credit_settlement_returned_audit_smoke',
  status: 'settled',
  actualToolCostCredits: 120,
  actualToolCostCents: 1200,
  serviceFeeCredits: 40,
  finalChargeCredits: 160,
  releasedCredits: 40,
  absorbedOverageCredits: 0,
  outstandingCredits: 0,
  createdAt: '2026-07-01T12:10:00.000Z',
  toolCostEventIds: [billableToolEvent.id],
}))
const absorbedSettlement = insertCreditSettlement(creditDataStore, settlementRecord({
  id: 'credit_settlement_absorbed_audit_smoke',
  status: 'settled_with_absorbed_overage',
  settlementReason: 'provider_variance_absorbed',
  actualToolCostCredits: 160,
  actualToolCostCents: 1600,
  serviceFeeCredits: 70,
  finalChargeCredits: 200,
  releasedCredits: 0,
  absorbedOverageCredits: 30,
  outstandingCredits: 0,
  createdAt: '2026-07-01T12:11:00.000Z',
  toolCostEventIds: [billableToolEvent.id, nonBillableToolEvent.id],
}))
const topUpSettlement = insertCreditSettlement(creditDataStore, settlementRecord({
  id: 'credit_settlement_topup_audit_smoke',
  status: 'requires_top_up_before_export',
  settlementReason: 'approved_but_unfunded',
  actualToolCostCredits: 160,
  actualToolCostCents: 1600,
  serviceFeeCredits: 70,
  finalChargeCredits: 230,
  releasedCredits: 0,
  absorbedOverageCredits: 0,
  outstandingCredits: 30,
  createdAt: '2026-07-01T12:12:00.000Z',
  toolCostEventIds: [billableToolEvent.id],
}))

creditDataStore.creditRevisionActions.push({
  id: 'credit_revision_action_audit_smoke',
  workspaceId,
  projectId,
  editPlanId,
  creditEstimateId,
  creditReservationId,
  editComputeLevel: 'premium',
  status: 'action_required',
  pauseReason: 'projected_overage',
  approvedMaxCredits: 200,
  usedOrCommittedCredits: 188,
  additionalLowCredits: 10,
  additionalExpectedCredits: 20,
  additionalHighCredits: 30,
  newMaximumEstimatedCredits: 230,
  reasonSummary: 'Projected high-cost usage may exceed approved hold.',
  actionRequiredTitle: 'Action required: revised credit estimate needed',
  actionRequiredMessage: 'No extra paid work will continue until the user chooses an option.',
  userOptions: [
    { id: 'approve-and-continue', label: 'Approve & Continue', action: 'approve_and_continue' },
    { id: 'lower-cost', label: 'Choose Lower-Cost Option', action: 'choose_lower_cost_option' },
    { id: 'cancel', label: 'Cancel Extra Work', action: 'cancel_extra_work' },
  ],
  idempotencyKey: 'credit-revision-audit-smoke',
  metadata: { mockOnly: true },
  createdAt: '2026-07-01T12:07:00.000Z',
  updatedAt: '2026-07-01T12:07:00.000Z',
})

const exportLock: CreditExportLockRecord = {
  id: 'credit_export_lock_audit_smoke',
  workspaceId,
  projectId,
  editPlanId,
  creditReservationId,
  creditSettlementId: topUpSettlement.id,
  status: 'locked',
  lockReason: 'approved_but_unfunded',
  outstandingCredits: 30,
  finalChargeCredits: 230,
  reservedCredits: 200,
  actionRequiredTitle: 'Action required: add credits to export',
  actionRequiredMessage: '30 approved credits are still needed before export can be rechecked.',
  idempotencyKey: 'credit-export-lock-audit',
  metadata: { mockOnly: true },
  createdAt: '2026-07-01T12:13:00.000Z',
  updatedAt: '2026-07-01T12:13:00.000Z',
}
insertCreditExportLock(creditDataStore, exportLock)

stripeBillingStore.customerLinks.push(stripeCustomer())
stripeBillingStore.paymentMethodLinks.push(stripePaymentMethod())
stripeBillingStore.setupIntents.push(stripeSetupIntent())
stripeBillingStore.checkoutSessions.push(stripeCheckoutSession())
stripeBillingStore.webhookEvents.push(stripeWebhook('evt_audit_processed', 'processed', '2026-07-01T12:16:00.000Z'))
stripeBillingStore.webhookEvents.push(stripeWebhook('evt_audit_duplicate', 'duplicate', '2026-07-01T12:17:00.000Z'))

const timeline = buildCreditAuditTimeline(stores, { workspaceId, projectId, includeStripeTrace: true, includeToolEvents: true })
const timelineTypes = new Set(timeline.events.map((event) => event.eventType))
for (const type of [
  'estimate_created',
  'reservation_created',
  'runtime_guard_paused_revised_credit',
  'tool_cost_billable',
  'tool_cost_non_billable',
  'settlement_absorbed_overage',
  'settlement_requires_top_up',
  'export_locked_top_up_required',
  'credit_top_up_completed',
  'stripe_checkout_created',
  'stripe_webhook_processed',
  'stripe_webhook_duplicate',
] as const) {
  assert.equal(timelineTypes.has(type), true, `Timeline must include ${type}`)
}
const repeatedTimeline = buildCreditAuditTimeline(stores, { workspaceId, projectId, includeStripeTrace: true, includeToolEvents: true })
assert.deepEqual(repeatedTimeline.events.map((event) => event.id), timeline.events.map((event) => event.id), 'Timeline ordering must be deterministic across repeated builds.')
for (let index = 1; index < timeline.events.length; index += 1) {
  assert.ok(timeline.events[index - 1].createdAt <= timeline.events[index].createdAt, 'Timeline timestamps must be nondecreasing.')
}
assert.equal(timeline.summary.estimateCount, 1)
assert.equal(timeline.summary.reservationCount, 1)
assert.equal(timeline.summary.billableToolEventCount, 1)
assert.equal(timeline.summary.nonBillableToolEventCount, 1)
assert.equal(timeline.summary.totalReservedCredits, 200)
assert.equal(timeline.summary.totalAbsorbedOverageCredits, 30)
assert.equal(timeline.summary.totalOutstandingCredits, 30)
assert.equal(timeline.summary.totalPurchasedCredits, 100)

const absorbedReceipt = buildCreditSupportReceipt(stores, { creditSettlementId: absorbedSettlement.id })
assert.ok(absorbedReceipt)
assert.equal(absorbedReceipt.supportSummary.approvedEstimateMaxCredits, 200)
assert.equal(absorbedReceipt.supportSummary.reservedCredits, 200)
assert.equal(absorbedReceipt.supportSummary.actualBillableToolCostCredits, 160)
assert.equal(absorbedReceipt.supportSummary.reeditproServiceFeeCredits, 70)
assert.equal(absorbedReceipt.supportSummary.finalChargeCredits, 200)
assert.equal(absorbedReceipt.supportSummary.absorbedOverageCredits, 30)
assert.equal(absorbedReceipt.toolCostBreakdown.some((item) => item.nonBillableEventCount === 1 && item.nonBillableCents === 300), true)
assert.equal(absorbedReceipt.userFacingReceipt.userFacingLines.some((line) => line.label === 'ReEditPro absorbed' && line.credits === 30), true)
assert.equal(absorbedReceipt.supportQuestions.every((question) => question.evidenceEventIds.length > 0 || /No|0 purchased/.test(question.answer)), true)
assert.match(absorbedReceipt.supportQuestions[0].answer, /actual billable tool credits plus .*ReEditPro service\/edit fee/)

const returnedReceipt = buildCreditSupportReceipt(stores, { creditSettlementId: 'credit_settlement_returned_audit_smoke' })
assert.equal(returnedReceipt?.supportSummary.releasedCredits, 40)
assert.equal(returnedReceipt?.userFacingReceipt.userFacingLines.some((line) => line.label === 'Returned' && line.credits === 40), true)
const topUpReceipt = buildCreditSupportReceipt(stores, { creditSettlementId: topUpSettlement.id })
assert.equal(topUpReceipt?.supportSummary.outstandingCredits, 30)

assert.equal(billableToolEvent.serviceFeeIncluded, false)
assert.equal(nonBillableToolEvent.serviceFeeIncluded, false)

const trace = buildStripeBillingTraceSummary(stores, { workspaceId, creditWalletId })
assert.equal(trace.customerLinked, true)
assert.equal(trace.paymentMethodLinked, true)
assert.equal(trace.checkoutSessions.length, 1)
assert.equal(trace.webhookEvents.some((event) => event.status === 'processed'), true)
assert.equal(trace.webhookEvents.some((event) => event.status === 'duplicate'), true)
assert.equal(trace.creditGrants.some((grant) => grant.billingPaymentId === 'cs_test_audit_smoke'), true)
assert.equal(JSON.stringify(trace).includes('rawBody'), false)
assert.equal(JSON.stringify(trace).includes('cardNumber'), false)

const redacted = redactCreditAuditPayload({
  checkoutSessionId: 'cs_test_audit_smoke',
  clientSecret: fakeRedactionSecret,
  authorization: fakeAuthorizationHeader,
  nested: { cardNumber: fakeCardNumber, amountCents: 1000 },
})
assert.equal(redacted.redactionApplied, true)
assert.equal(redacted.safePayload.clientSecret, '[redacted]')
assert.equal(redacted.safePayload.authorization, '[redacted]')
assert.deepEqual(redacted.safePayload.nested, { cardNumber: '[redacted]', amountCents: 1000 })
assert.equal(containsRawSensitiveAuditValue(redacted.safePayload), false)

const readiness = buildCreditBetaReadinessEvidenceReport({ generatedAt: createdAt })
assert.equal(readiness.status, 'ready_for_mock_external_beta')
for (const id of ['credit_policy', 'estimate_preview', 'max_reservation', 'runtime_guard', 'revision_actions', 'settlement', 'export_lock', 'top_up', 'stripe_foundation', 'stripe_testmode', 'stripe_live_readiness', 'credit_ui', 'audit_timeline', 'no_live_billing', 'support_trace']) {
  assert.equal(readiness.checks.some((check) => check.id === id && check.status === 'passed'), true, `Readiness must pass ${id}`)
}
const blockedReadiness = buildCreditBetaReadinessEvidenceReport({
  generatedAt: createdAt,
  simulatedReturnedPayload: { webhookSecret: fakeWebhookSecret },
})
assert.equal(blockedReadiness.status, 'blocked')
assert.equal(blockedReadiness.blockingGaps.includes('No raw Stripe secrets exposed'), true)

const routeSource = readFileSync(repoPath('server/routes/credit-audit-routes.ts'), 'utf8')
for (const route of [
  '/v1/credit-audit/projects/:projectId/timeline',
  '/v1/credit-audit/wallets/:creditWalletId/timeline',
  '/v1/credit-audit/settlements/:creditSettlementId/receipt',
  '/v1/credit-audit/wallets/:creditWalletId/stripe-trace',
  '/v1/credit-audit/beta-readiness',
]) {
  assert.equal(routeSource.includes(route), true, `Missing audit route ${route}`)
}
assert.equal(/router\.post|router\.put|router\.patch|router\.delete/.test(routeSource), false, 'Credit audit routes must remain GET/read-only.')
assert.equal(routeSource.includes('requireAuth'), true, 'Credit audit routes must use existing auth gate.')

for (const file of [
  'src/types/credits.ts',
  'src/backend/contracts/credit-contracts.ts',
  'server/services/credit-audit-service.ts',
  'server/validation/credit-audit-schemas.ts',
  'server/routes/credit-audit-routes.ts',
  'docs/credit-audit-support-timeline.md',
]) {
  assert.equal(existsSync(repoPath(file)), true, `Missing RP-CREDITAUDIT-01 file ${file}`)
}

const packageJson = JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:credit-audit'], 'tsx server/smoke/credit-audit-smoke.ts')

const serialized = JSON.stringify({ timeline, absorbedReceipt, trace, readiness })
for (const forbidden of [...forbiddenStripeMarkers, fakeWebhookSecret, fakeRedactionSecret, fakeAuthorizationHeader, fakeCardNumber]) {
  assert.equal(serialized.includes(forbidden), false, `Audit output must not expose ${forbidden}`)
}

assert.deepEqual(estimateStore.walletMutationRecords, [])
assert.deepEqual(estimateStore.reservationMutationRecords, [])
assert.deepEqual(creditDataStore.walletMutationRecords, [])
assert.deepEqual(creditDataStore.reservationMutationRecords, [])
assert.deepEqual(creditDataStore.ledgerMutationRecords, [])
assert.deepEqual(creditDataStore.exportUnlockRecords, [])

console.log(JSON.stringify({
  smoke: 'credit-audit',
  status: 'passed',
  eventCount: timeline.events.length,
  supportQuestions: absorbedReceipt.supportQuestions.length,
  stripeWebhookEvents: trace.webhookEvents.length,
  readiness: readiness.status,
}, null, 2))

function settlementRecord(input: {
  id: string
  status: CreditSettlementRecord['status']
  settlementReason?: CreditSettlementRecord['settlementReason']
  actualToolCostCredits: number
  actualToolCostCents: number
  serviceFeeCredits: number
  finalChargeCredits: number
  releasedCredits: number
  absorbedOverageCredits: number
  outstandingCredits: number
  createdAt: string
  toolCostEventIds: string[]
}): CreditSettlementRecord {
  return {
    id: input.id,
    workspaceId,
    projectId,
    editPlanId,
    creditWalletId,
    creditEstimateId,
    creditReservationId,
    creditApprovalId: 'credit_approval_audit_smoke',
    editComputeLevel: 'premium',
    finalVideoDurationSeconds: 60,
    status: input.status,
    settlementReason: input.settlementReason ?? 'edit_completed',
    reservedCredits: 200,
    actualToolCostCents: input.actualToolCostCents,
    actualToolCostCredits: input.actualToolCostCredits,
    reeditproServiceFeeCredits: input.serviceFeeCredits,
    finalChargeCredits: input.finalChargeCredits,
    releasedCredits: input.releasedCredits,
    absorbedOverageCredits: input.absorbedOverageCredits,
    outstandingCredits: input.outstandingCredits,
    billableToolEventCount: 1,
    nonBillableToolEventCount: input.toolCostEventIds.includes(nonBillableToolEvent.id) ? 1 : 0,
    toolCostEventIds: input.toolCostEventIds,
    rateCardVersion: 'tool-metering-v1-2026-06-26',
    creditPolicyVersion: 'credit-policy-v1',
    serviceFeePolicyVersion: 'service-fee-v1',
    idempotencyKey: `${input.id}_idempotency`,
    settlementPayload: { mockOnly: true, computedFinalChargeCredits: input.actualToolCostCredits + input.serviceFeeCredits },
    receiptPayload: { mockOnly: true },
    metadata: { mockOnly: true },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    settledAt: input.createdAt,
  }
}

function topUpIntent(): MockCreditTopUpIntent {
  return {
    id: 'credit_top_up_intent_audit_smoke',
    workspaceId,
    userId: 'user_credit_audit_smoke',
    creditWalletId,
    creditPackId: 'credits_100_usd_10',
    credits: 100,
    priceCents: 1000,
    currency: 'USD',
    status: 'completed',
    topUpReason: 'export_top_up_required',
    mockOnly: true,
    checkoutProvider: 'mock',
    checkoutUrl: null,
    relatedProjectId: projectId,
    relatedCreditEstimateId: creditEstimateId,
    relatedCreditReservationId: creditReservationId,
    relatedCreditSettlementId: 'credit_settlement_topup_audit_smoke',
    idempotencyKey: 'credit-top-up-audit',
    completedAt: '2026-07-01T12:18:00.000Z',
    createdAt: '2026-07-01T12:14:00.000Z',
    updatedAt: '2026-07-01T12:18:00.000Z',
    metadata: { mockOnly: true },
  }
}

function purchasedGrant(): CreditGrantRecord {
  return {
    id: 'credit_grant_audit_smoke',
    creditWalletId,
    workspaceId,
    userId: 'user_credit_audit_smoke',
    sourceType: 'purchased',
    status: 'active',
    originalAmount: 100,
    remainingAmount: 100,
    retailValueCents: 1000,
    purchaseAmountCents: 1000,
    billingProvider: 'stripe_test',
    billingPaymentId: 'cs_test_audit_smoke',
    grantReason: 'Stripe test checkout completed.',
    createdAt: '2026-07-01T12:18:00.000Z',
    updatedAt: '2026-07-01T12:18:00.000Z',
    metadata: { mockOnly: true },
  }
}

function stripeCustomer(): StripeCustomerLinkRecord {
  return {
    id: 'stripe_customer_link_audit_smoke',
    workspaceId,
    userId: 'user_credit_audit_smoke',
    stripeMode: 'test',
    stripeCustomerId: 'cus_test_audit_smoke',
    status: 'active',
    defaultPaymentMethodId: 'pm_test_audit_smoke',
    metadata: { mockOnly: true },
    createdAt: '2026-07-01T12:14:00.000Z',
    updatedAt: '2026-07-01T12:14:00.000Z',
  }
}

function stripePaymentMethod(): StripePaymentMethodLinkRecord {
  return {
    id: 'stripe_payment_method_audit_smoke',
    workspaceId,
    userId: 'user_credit_audit_smoke',
    stripeMode: 'test',
    stripeCustomerId: 'cus_test_audit_smoke',
    stripePaymentMethodId: 'pm_test_audit_smoke',
    type: 'card',
    status: 'active',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2030,
    isDefault: true,
    metadata: { safeDisplayOnly: true },
    createdAt: '2026-07-01T12:15:00.000Z',
    updatedAt: '2026-07-01T12:15:00.000Z',
  }
}

function stripeSetupIntent(): MockStripeSetupIntentRecord {
  return {
    id: 'stripe_setup_intent_audit_smoke',
    workspaceId,
    userId: 'user_credit_audit_smoke',
    stripeMode: 'test',
    stripeCustomerId: 'cus_test_audit_smoke',
    setupIntentId: 'seti_test_audit_smoke',
    clientSecret: fakeSetupSecret,
    returnUrl: 'https://example.test/return',
    status: 'created',
    idempotencyKey: 'stripe-setup-audit',
    mockOnly: true,
    runtimeSource: 'mock_stripe_client',
    metadata: { clientSecret: fakeNestedSecret },
    createdAt: '2026-07-01T12:15:00.000Z',
    updatedAt: '2026-07-01T12:15:00.000Z',
  }
}

function stripeCheckoutSession(): MockStripeCheckoutSessionRecord {
  return {
    id: 'stripe_checkout_audit_smoke',
    workspaceId,
    userId: 'user_credit_audit_smoke',
    creditWalletId,
    creditPackId: 'credits_100_usd_10',
    stripeMode: 'test',
    checkoutSessionId: 'cs_test_audit_smoke',
    checkoutUrl: 'https://checkout.stripe.test/session/cs_test_audit_smoke',
    currency: 'USD',
    credits: 100,
    priceCents: 1000,
    successUrl: 'https://example.test/success',
    cancelUrl: 'https://example.test/cancel',
    relatedProjectId: projectId,
    relatedCreditEstimateId: creditEstimateId,
    relatedCreditReservationId: creditReservationId,
    relatedCreditSettlementId: 'credit_settlement_topup_audit_smoke',
    idempotencyKey: 'stripe-checkout-audit',
    mockOnly: true,
    runtimeSource: 'mock_stripe_client',
    metadata: { mockOnly: true, safeOrderId: 'order_audit_smoke' },
    createdAt: '2026-07-01T12:16:00.000Z',
    updatedAt: '2026-07-01T12:16:00.000Z',
  }
}

function stripeWebhook(id: string, status: StripeWebhookEventRecord['status'], processedAt: string): StripeWebhookEventRecord {
  return {
    id: `${id}_record`,
    stripeMode: 'test',
    stripeEventId: id,
    eventType: 'checkout.session.completed',
    status,
    relatedCheckoutSessionId: 'cs_test_audit_smoke',
    relatedPaymentIntentId: null,
    relatedSetupIntentId: null,
    relatedCustomerId: 'cus_test_audit_smoke',
    idempotencyKey: `${id}_idempotency`,
    payloadSummary: { checkoutSessionId: 'cs_test_audit_smoke', credits: 100 },
    createdAt: processedAt,
    processedAt,
  }
}

function repoPath(filePath: string): string {
  return path.join(root, filePath)
}
