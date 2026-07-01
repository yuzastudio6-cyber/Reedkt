import { createHmac, timingSafeEqual } from 'node:crypto'

import type {
  CreateStripeCreditCheckoutSessionRequest,
  CreateStripeCreditCheckoutSessionResponse,
  CreateStripeSetupIntentRequest,
  CreateStripeSetupIntentResponse,
  CreateStripeWebhookTestResponse,
  CreditGrantRecord,
  CreditPackDefinition,
  JSONObject,
  ReEditProStripeClient,
  SecretValueProvider,
  StripeBillingRuntimeConfig,
  StripeClientCheckoutSessionResult,
  StripeClientCreateCheckoutSessionInput,
  StripeClientCreateCustomerInput,
  StripeClientCreateSetupIntentInput,
  StripeClientCustomerResult,
  StripeClientSetupIntentResult,
  StripeClientVerifiedWebhookEvent,
  StripeClientVerifyWebhookInput,
  StripeClientVerifyWebhookResult,
  StripeCustomerLinkRecord,
  StripeOperationalMode,
  StripePaymentMethodLinkRecord,
  StripeTestReadinessCheck,
  StripeTestReadinessResponse,
  StripeWebhookEventRecord,
  VerifyStripeWebhookSignatureResult,
} from '../../src/types'
import { CREDIT_RETAIL_VALUE_CENTS } from '../../src/types/credit-policy'
import { listCreditPacks } from './mock-credit-purchase-store'
import {
  getMockCreditWalletBalance,
  grantMockCredits,
  type MockCreditReservationStore,
} from './mock-credit-reservation-store'
import {
  containsRawStripeSecretValue,
  createStripeBillingSafetyFlags,
  type MockStripeBillingStore,
  STRIPE_FOUNDATION_WARNINGS,
  validateStripeBillingRuntimeConfig,
} from './stripe-billing-foundation-service'
import { createMockId, nowIso } from './service-helpers'

const TEST_SECRET_PREFIX = ['sk', 'test', ''].join('_')
const TEST_RESTRICTED_PREFIX = ['rk', 'test', ''].join('_')
const TEST_PUBLISHABLE_PREFIX = ['pk', 'test', ''].join('_')
const TEST_WEBHOOK_PREFIX = ['wh', 'sec', ''].join('')
const STRIPE_API_BASE_URL = 'https://api.stripe.com/v1'
const TEST_MODE_WARNINGS = [
  'RP-STRIPE-TESTMODE-01 permits Stripe test-mode calls only.',
  'No live billing, live Stripe call, Supabase write, production wallet mutation, production ledger write, provider call, render/export execution, export unlock, or production persistence occurred.',
] as const

export class MockStripeClient implements ReEditProStripeClient {
  readonly runtimeSource = 'mock_stripe_client' as const

  async createCustomer(input: StripeClientCreateCustomerInput): Promise<StripeClientCustomerResult> {
    return { stripeCustomerId: `cus_test_${stableToken(input.workspaceId, input.userId)}` }
  }

  async createSetupIntent(input: StripeClientCreateSetupIntentInput): Promise<StripeClientSetupIntentResult> {
    return {
      setupIntentId: `seti_test_${stableToken(input.stripeCustomerId, input.idempotencyKey)}`,
      clientSecret: `seti_secret_test_${stableToken(input.idempotencyKey, input.stripeCustomerId)}`,
    }
  }

  async createCheckoutSession(input: StripeClientCreateCheckoutSessionInput): Promise<StripeClientCheckoutSessionResult> {
    return {
      checkoutSessionId: `cs_test_${stableToken(input.clientReferenceId, input.creditPackId)}`,
      checkoutUrl: `https://checkout.stripe.test/session/${encodeURIComponent(input.clientReferenceId)}`,
    }
  }

  async verifyWebhookSignature(input: StripeClientVerifyWebhookInput): Promise<StripeClientVerifyWebhookResult> {
    verifyStripeSignature(input.rawBody, input.stripeSignatureHeader, input.webhookSecret)
    return { event: parseStripeEvent(input.rawBody) }
  }
}

export class FetchStripeTestClient implements ReEditProStripeClient {
  readonly runtimeSource = 'fetch_stripe_test_client' as const

  constructor(
    private readonly secretProvider: SecretValueProvider,
    private readonly secretKeySecretName: string,
  ) {}

  async createCustomer(input: StripeClientCreateCustomerInput): Promise<StripeClientCustomerResult> {
    const response = await this.postStripe('/customers', input.idempotencyKey, {
      description: `ReEditPro test customer ${input.workspaceId}/${input.userId}`,
      [`metadata[workspaceId]`]: input.workspaceId,
      [`metadata[userId]`]: input.userId,
      [`metadata[milestone]`]: 'RP-STRIPE-TESTMODE-01',
      [`metadata[stripeMode]`]: 'test',
      ...metadataParams(input.metadata),
    })
    return { stripeCustomerId: stringField(response, 'id') }
  }

  async createSetupIntent(input: StripeClientCreateSetupIntentInput): Promise<StripeClientSetupIntentResult> {
    const response = await this.postStripe('/setup_intents', input.idempotencyKey, {
      customer: input.stripeCustomerId,
      usage: 'off_session',
      [`payment_method_types[0]`]: 'card',
      [`metadata[milestone]`]: 'RP-STRIPE-TESTMODE-01',
      [`metadata[stripeMode]`]: 'test',
      ...metadataParams(input.metadata),
    })
    return {
      setupIntentId: stringField(response, 'id'),
      clientSecret: nullableStringField(response, 'client_secret'),
    }
  }

  async createCheckoutSession(input: StripeClientCreateCheckoutSessionInput): Promise<StripeClientCheckoutSessionResult> {
    const response = await this.postStripe('/checkout/sessions', input.idempotencyKey, {
      customer: input.stripeCustomerId,
      mode: 'payment',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.clientReferenceId,
      [`line_items[0][quantity]`]: '1',
      [`line_items[0][price_data][currency]`]: input.currency.toLowerCase(),
      [`line_items[0][price_data][unit_amount]`]: String(input.priceCents),
      [`line_items[0][price_data][product_data][name]`]: `${input.credits} ReEditPro credits`,
      [`metadata[milestone]`]: 'RP-STRIPE-TESTMODE-01',
      [`metadata[stripeMode]`]: 'test',
      ...metadataParams(input.metadata),
    })
    return {
      checkoutSessionId: stringField(response, 'id'),
      checkoutUrl: nullableStringField(response, 'url'),
    }
  }

  async verifyWebhookSignature(input: StripeClientVerifyWebhookInput): Promise<StripeClientVerifyWebhookResult> {
    verifyStripeSignature(input.rawBody, input.stripeSignatureHeader, input.webhookSecret)
    return { event: parseStripeEvent(input.rawBody) }
  }

  private async postStripe(path: string, idempotencyKey: string, params: Record<string, string>): Promise<Record<string, unknown>> {
    const secretKey = await this.secretProvider.getSecretValue(this.secretKeySecretName)
    if (!isTestSecretKey(secretKey)) throw new Error('Stripe test secret key reference resolved to a non-test key.')

    const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
        'idempotency-key': idempotencyKey,
      },
      body: new URLSearchParams(params),
    })
    const payload = await response.json().catch(() => ({})) as unknown
    if (!response.ok) throw new Error(`Stripe test API request failed with HTTP ${response.status}.`)
    if (!payload || typeof payload !== 'object') throw new Error('Stripe test API returned an invalid payload.')
    return payload as Record<string, unknown>
  }
}

export function evaluateStripeTestReadiness(
  config: StripeBillingRuntimeConfig,
): StripeTestReadinessResponse {
  const validation = validateStripeBillingRuntimeConfig(config)
  const checks: StripeTestReadinessCheck[] = [
    check('mode_test', 'Stripe mode test', config.mode === 'test', 'Stripe billing mode must be test.'),
    check('real_calls_allowed', 'Real test calls owner allowed', config.testModeRealCallsAllowed, 'REEDITPRO_STRIPE_TEST_MODE_REAL_CALLS_ALLOWED must be true.'),
    check('live_blocked', 'Live mode blocked', config.mode !== 'live', 'Live Stripe mode is not allowed for this route.'),
    check('secret_source', 'Secret source enabled', config.secretSource !== 'disabled', 'Test mode requires an approved server-side secret source.'),
    check('test_secret_key_ref', 'Test secret key reference present', Boolean(config.secretReferences.testSecretKeySecretName), 'Test secret key reference is required.'),
    check('test_publishable_key_ref', 'Test publishable key reference present', Boolean(config.secretReferences.testPublishableKeySecretName), 'Test publishable key reference is required.'),
    check('test_webhook_ref', 'Test webhook signing secret reference present', Boolean(config.secretReferences.testWebhookSigningSecretName), 'Test webhook signing secret reference is required.'),
    check('webhook_endpoint_test', 'Webhook endpoint test', config.webhookEndpointMode === 'test', 'Test webhook endpoint mode must be test.'),
    check('no_live_refs_in_test', 'No live refs in test config', !hasLiveReference(config), 'Test mode must not use live Stripe secret references.'),
    check('no_raw_secret_values', 'No raw Stripe secrets', !containsRawStripeSecretValue(config.secretReferences), 'Config must contain reference names, not raw Stripe keys or webhook secrets.'),
  ]
  if (!validation.ok) {
    checks.push(check('config_validation', 'Stripe config validation', false, validation.errors.join(' ')))
  }
  const canRunTestMode = checks.every((item) => item.passed)
  return {
    status: canRunTestMode ? 'ready' : 'blocked',
    stripeMode: config.mode,
    canRunTestMode,
    checks,
    config: {
      ...config,
      secretReferences: { ...config.secretReferences },
      warnings: [...config.warnings],
    },
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      testModeOnly: true,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...config.warnings, ...validation.warnings],
  }
}

export async function createStripeTestSetupIntent(
  store: MockStripeBillingStore,
  config: StripeBillingRuntimeConfig,
  client: ReEditProStripeClient,
  secretProvider: SecretValueProvider,
  request: CreateStripeSetupIntentRequest,
): Promise<CreateStripeSetupIntentResponse> {
  const duplicate = store.setupIntents.find((intent) =>
    intent.workspaceId === request.workspaceId &&
    intent.idempotencyKey === request.idempotencyKey)
  if (duplicate) {
    return setupResponse('created', duplicate, 'duplicate_returned', client, [
      'Duplicate setup intent idempotency key returned the existing test setup intent.',
    ])
  }

  const blocked = testModeBlock(config, client)
  if (blocked) return setupBlocked(blocked.status, request.stripeMode, blocked.warnings)

  if (request.stripeMode !== 'test') return setupBlocked('test_mode_not_allowed', request.stripeMode, ['Only Stripe test mode is accepted by this route.'])

  const publishableKey = await resolvePublishableKey(config, secretProvider)
  if (!publishableKey.ok) return setupBlocked('stripe_secret_unavailable', 'test', publishableKey.warnings)

  const customer = await getOrCreateStripeTestCustomerLink(store, config, client, request)
  if (!customer.ok) return setupBlocked(customer.status, 'test', customer.warnings)

  try {
    const intent = await client.createSetupIntent({
      stripeCustomerId: customer.customer.stripeCustomerId,
      idempotencyKey: request.idempotencyKey,
      metadata: {
        workspaceId: request.workspaceId,
        userId: request.userId,
        returnUrlConfigured: Boolean(request.returnUrl),
        ...(request.metadata ?? {}),
      },
    })
    const createdAt = nowIso()
    const record = {
      id: createMockId('stripe_setup_intent'),
      workspaceId: request.workspaceId,
      userId: request.userId,
      stripeMode: 'test' as const,
      stripeCustomerId: customer.customer.stripeCustomerId,
      setupIntentId: intent.setupIntentId,
      clientSecret: intent.clientSecret,
      returnUrl: request.returnUrl ?? null,
      status: 'created' as const,
      idempotencyKey: request.idempotencyKey,
      mockOnly: client.runtimeSource === 'mock_stripe_client',
      runtimeSource: client.runtimeSource,
      metadata: {
        ...(request.metadata ?? {}),
        testModeOnly: true,
        liveModeBlocked: true,
        noWalletMutation: true,
      },
      createdAt,
      updatedAt: createdAt,
    }
    store.setupIntents.push(record)
    return {
      ...setupResponse('created', record, 'created', client, ['Created a Stripe test-mode SetupIntent record.']),
      publishableKey: publishableKey.value,
    }
  } catch (error) {
    return setupBlocked('stripe_api_error', 'test', [safeErrorMessage(error)])
  }
}

export async function createStripeTestCheckoutSession(
  store: MockStripeBillingStore,
  reservationStore: MockCreditReservationStore,
  config: StripeBillingRuntimeConfig,
  client: ReEditProStripeClient,
  request: CreateStripeCreditCheckoutSessionRequest,
): Promise<CreateStripeCreditCheckoutSessionResponse> {
  const duplicate = store.checkoutSessions.find((session) =>
    session.workspaceId === request.workspaceId &&
    session.idempotencyKey === request.idempotencyKey)
  if (duplicate) {
    return checkoutResponse('created', duplicate, 'duplicate_returned', client, [
      'Duplicate checkout idempotency key returned the existing test checkout session.',
    ])
  }

  const blocked = testModeBlock(config, client)
  if (blocked) return checkoutBlocked(blocked.status, request.stripeMode, blocked.warnings)
  if (request.stripeMode !== 'test') return checkoutBlocked('test_mode_not_allowed', request.stripeMode, ['Only Stripe test mode is accepted by this route.'])

  const wallet = reservationStore.creditWallets.find((candidate) =>
    candidate.id === request.creditWalletId &&
    candidate.workspaceId === request.workspaceId)
  if (!wallet) {
    return checkoutBlocked('wallet_not_found', 'test', ['Credit wallet was not found. No Stripe test Checkout Session was created.'])
  }

  const pack = listCreditPacks().find((candidate) => candidate.id === request.creditPackId && candidate.isActive)
  if (!pack) {
    return checkoutBlocked('credit_pack_not_found', 'test', ['Credit pack was not found or is inactive.'])
  }

  const customer = await getOrCreateStripeTestCustomerLink(store, config, client, request)
  if (!customer.ok) return checkoutBlocked(customer.status, 'test', customer.warnings)

  try {
    const metadata = checkoutMetadata(request, pack)
    const checkout = await client.createCheckoutSession({
      stripeCustomerId: customer.customer.stripeCustomerId,
      creditPackId: pack.id,
      credits: pack.credits,
      priceCents: pack.priceCents,
      currency: pack.currency,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      clientReferenceId: request.idempotencyKey,
      idempotencyKey: request.idempotencyKey,
      metadata,
    })
    const createdAt = nowIso()
    const record = {
      id: createMockId('stripe_checkout_session'),
      workspaceId: request.workspaceId,
      userId: request.userId,
      creditWalletId: wallet.id,
      creditPackId: pack.id,
      stripeMode: 'test' as const,
      checkoutSessionId: checkout.checkoutSessionId,
      checkoutUrl: checkout.checkoutUrl,
      currency: 'USD' as const,
      credits: pack.credits,
      priceCents: pack.priceCents,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      relatedProjectId: request.relatedProjectId ?? null,
      relatedCreditEstimateId: request.relatedCreditEstimateId ?? null,
      relatedCreditReservationId: request.relatedCreditReservationId ?? null,
      relatedCreditSettlementId: request.relatedCreditSettlementId ?? null,
      relatedCreditRevisionActionId: request.relatedCreditRevisionActionId ?? null,
      idempotencyKey: request.idempotencyKey,
      mockOnly: client.runtimeSource === 'mock_stripe_client',
      runtimeSource: client.runtimeSource,
      metadata: {
        ...metadata,
        noCreditGrantUntilVerifiedWebhook: true,
        walletMutated: false,
      },
      createdAt,
      updatedAt: createdAt,
    }
    store.checkoutSessions.push(record)
    return checkoutResponse('created', record, 'created', client, [
      'Created a Stripe test-mode Checkout Session. Credits are granted only after a verified test webhook.',
    ])
  } catch (error) {
    return checkoutBlocked('stripe_api_error', 'test', [safeErrorMessage(error)])
  }
}

export async function processStripeTestWebhook(
  store: MockStripeBillingStore,
  reservationStore: MockCreditReservationStore,
  config: StripeBillingRuntimeConfig,
  client: ReEditProStripeClient,
  secretProvider: SecretValueProvider,
  input: { rawBody: Uint8Array | string; stripeSignatureHeader?: string | null },
): Promise<CreateStripeWebhookTestResponse> {
  const blocked = testModeBlock(config, client)
  if (blocked) return webhookBlocked(blocked.status, blocked.warnings)
  if (!input.stripeSignatureHeader?.trim()) return webhookBlocked('invalid_signature', ['Stripe-Signature header is required.'])
  if (!config.webhookSigningSecretName) return webhookBlocked('stripe_secret_unavailable', ['Stripe test webhook signing secret reference is required.'])

  const webhookSecret = await resolveSecretValue(secretProvider, config.webhookSigningSecretName, TEST_WEBHOOK_PREFIX)
  if (!webhookSecret.ok) return webhookBlocked('stripe_secret_unavailable', webhookSecret.warnings)

  let event: StripeClientVerifiedWebhookEvent
  try {
    event = (await client.verifyWebhookSignature({
      rawBody: input.rawBody,
      stripeSignatureHeader: input.stripeSignatureHeader,
      webhookSecret: webhookSecret.value,
    })).event
  } catch (error) {
    return webhookBlocked('invalid_signature', [safeErrorMessage(error)])
  }

  const duplicate = store.webhookEvents.find((candidate) =>
    candidate.stripeMode === 'test' &&
    candidate.stripeEventId === event.id)
  if (duplicate) {
    return webhookProcessed('duplicate', verificationResult('verified', event, ['Duplicate Stripe test webhook event returned the existing record.']), duplicate, null, 'duplicate_returned', client, [
      'Duplicate event ID did not create another grant or wallet mutation.',
    ])
  }

  if (event.livemode) {
    return webhookBlocked('test_mode_not_allowed', ['Live Stripe webhook events are rejected by the test-mode endpoint.'], event)
  }

  if (event.type === 'checkout.session.completed') {
    return processCheckoutCompletedWebhook(store, reservationStore, client, event)
  }
  if (event.type === 'setup_intent.succeeded') {
    return processSetupIntentSucceededWebhook(store, client, event)
  }

  const record = insertWebhookEvent(store, event, 'ignored', { ignoredEventType: event.type }, null)
  return webhookProcessed('ignored', verificationResult('verified', event, ['Verified test webhook event type is not processed by RP-STRIPE-TESTMODE-01.']), record, null, 'created', client, [
    'Verified test webhook was recorded and ignored without side effects.',
  ])
}

async function getOrCreateStripeTestCustomerLink(
  store: MockStripeBillingStore,
  config: StripeBillingRuntimeConfig,
  client: ReEditProStripeClient,
  request: Pick<CreateStripeSetupIntentRequest, 'workspaceId' | 'userId' | 'idempotencyKey' | 'metadata'>,
): Promise<
  | { ok: true; customer: StripeCustomerLinkRecord }
  | { ok: false; status: 'test_mode_not_allowed' | 'stripe_config_invalid' | 'stripe_api_error'; warnings: string[] }
> {
  const blocked = testModeBlock(config, client)
  if (blocked) return { ok: false, status: blocked.status, warnings: blocked.warnings }

  const existing = store.customerLinks.find((link) =>
    link.workspaceId === request.workspaceId &&
    link.userId === request.userId &&
    link.stripeMode === 'test' &&
    link.status === 'active')
  if (existing) return { ok: true, customer: existing }

  try {
    const customer = await client.createCustomer({
      workspaceId: request.workspaceId,
      userId: request.userId,
      idempotencyKey: `${request.idempotencyKey}:customer`,
      metadata: request.metadata,
    })
    const createdAt = nowIso()
    const record: StripeCustomerLinkRecord = {
      id: createMockId('stripe_customer_link'),
      workspaceId: request.workspaceId,
      userId: request.userId,
      stripeMode: 'test',
      stripeCustomerId: customer.stripeCustomerId,
      status: 'active',
      defaultPaymentMethodId: null,
      metadata: {
        testModeOnly: true,
        runtimeSource: client.runtimeSource,
        liveModeBlocked: true,
      },
      createdAt,
      updatedAt: createdAt,
    }
    store.customerLinks.push(record)
    return { ok: true, customer: record }
  } catch (error) {
    return { ok: false, status: 'stripe_api_error', warnings: [safeErrorMessage(error)] }
  }
}

function processCheckoutCompletedWebhook(
  store: MockStripeBillingStore,
  reservationStore: MockCreditReservationStore,
  client: ReEditProStripeClient,
  event: StripeClientVerifiedWebhookEvent,
): CreateStripeWebhookTestResponse {
  const session = eventObject(event)
  const checkoutSessionId = stringValue(session.id)
  if (!checkoutSessionId) return webhookBlocked('invalid_request', ['checkout.session.completed is missing a session ID.'], event)

  const checkout = store.checkoutSessions.find((candidate) =>
    candidate.checkoutSessionId === checkoutSessionId &&
    candidate.stripeMode === 'test')
  if (!checkout) return webhookBlocked('invalid_request', ['Checkout Session was not created by this Stripe test-mode service.'], event)

  const pack = listCreditPacks().find((candidate) => candidate.id === checkout.creditPackId && candidate.isActive)
  if (!pack) return webhookBlocked('invalid_request', ['Credit pack for Checkout Session is no longer active.'], event)

  const metadata = recordValue(session.metadata)
  if (!metadataMatchesCheckout(metadata, checkout, pack)) {
    return webhookBlocked('invalid_request', ['Checkout Session metadata, amount, wallet, pack, or credit totals did not match the stored checkout session.'], event)
  }

  const amountTotal = numberValue(session.amount_total)
  const currency = stringValue(session.currency)?.toUpperCase()
  if (amountTotal !== pack.priceCents || currency !== pack.currency) {
    return webhookBlocked('invalid_request', ['Checkout Session amount or currency did not match the selected credit pack.'], event)
  }

  const walletBalance = getMockCreditWalletBalance(reservationStore, checkout.creditWalletId)
  if (!walletBalance) return webhookBlocked('invalid_request', ['Credit wallet was not found for verified Stripe test checkout.'], event)

  const existingGrant = reservationStore.creditGrants.find((grant) =>
    grant.billingProvider === 'stripe_test' &&
    grant.billingPaymentId === checkout.checkoutSessionId)
  const record = insertWebhookEvent(store, event, 'processed', checkoutPayloadSummary(checkout, pack), checkout.checkoutSessionId)
  if (existingGrant) {
    return webhookProcessed('duplicate', verificationResult('verified', event, ['Verified checkout was already granted.']), record, existingGrant, 'duplicate_returned', client, [
      'Existing Stripe test grant was returned; wallet credits were not added again.',
    ])
  }

  const grant = grantMockCredits(reservationStore, {
    creditWalletId: checkout.creditWalletId,
    amount: pack.credits,
    sourceType: 'purchased',
    userId: checkout.userId,
    grantReason: 'Stripe test checkout completed for mock purchased credits.',
    retailValueCents: pack.credits * CREDIT_RETAIL_VALUE_CENTS,
    purchaseAmountCents: pack.priceCents,
    billingProvider: 'stripe_test',
    billingPaymentId: checkout.checkoutSessionId,
    metadata: {
      mockOnly: true,
      testModeOnly: true,
      milestone: 'RP-STRIPE-TESTMODE-01',
      stripeWebhookEventId: event.id,
      stripeCheckoutSessionId: checkout.checkoutSessionId,
      creditPackId: pack.id,
      noProductionWalletMutation: true,
      noLedgerWrite: true,
      noExportUnlock: true,
    },
  })
  return webhookProcessed('processed', verificationResult('verified', event, ['Verified Stripe test checkout completed and mock purchased credits were granted once.']), record, grant, 'created', client, [
    'Purchased credits were added to the local mock wallet only after a verified Stripe test webhook.',
  ])
}

function processSetupIntentSucceededWebhook(
  store: MockStripeBillingStore,
  client: ReEditProStripeClient,
  event: StripeClientVerifiedWebhookEvent,
): CreateStripeWebhookTestResponse {
  const setupIntent = eventObject(event)
  const setupIntentId = stringValue(setupIntent.id)
  const customerId = stringValue(setupIntent.customer)
  if (!setupIntentId || !customerId) {
    return webhookBlocked('invalid_request', ['setup_intent.succeeded is missing setup intent or customer ID.'], event)
  }

  const customer = store.customerLinks.find((link) =>
    link.stripeMode === 'test' &&
    link.stripeCustomerId === customerId &&
    link.status === 'active')
  if (!customer) {
    const record = insertWebhookEvent(store, event, 'ignored', { reason: 'customer_link_not_found', setupIntentId }, setupIntentId)
    return webhookProcessed('ignored', verificationResult('verified', event, ['SetupIntent customer link was not found, so the event was safely ignored.']), record, null, 'created', client, [
      'No payment method link was stored because the Stripe test customer link was not found.',
    ])
  }

  const method = extractPaymentMethod(setupIntent)
  if (method) {
    upsertPaymentMethodLink(store, customer, method)
  }
  const record = insertWebhookEvent(store, event, 'processed', {
    setupIntentId,
    customerId,
    paymentMethodStored: Boolean(method),
    safePaymentMetadataOnly: true,
  }, setupIntentId)
  return webhookProcessed('processed', verificationResult('verified', event, ['Verified Stripe test SetupIntent succeeded; safe payment method metadata was recorded when available.']), record, null, 'created', client, [
    'No card number, CVC, raw Stripe payload, wallet mutation, or grant was stored.',
  ])
}

function upsertPaymentMethodLink(
  store: MockStripeBillingStore,
  customer: StripeCustomerLinkRecord,
  method: {
    stripePaymentMethodId: string
    type: StripePaymentMethodLinkRecord['type']
    brand?: string | null
    last4?: string | null
    expMonth?: number | null
    expYear?: number | null
  },
): void {
  const createdAt = nowIso()
  const existing = store.paymentMethodLinks.find((link) =>
    link.stripeMode === 'test' &&
    link.stripePaymentMethodId === method.stripePaymentMethodId)
  if (existing) {
    existing.status = 'active'
    existing.brand = method.brand ?? existing.brand ?? null
    existing.last4 = method.last4 ?? existing.last4 ?? null
    existing.expMonth = method.expMonth ?? existing.expMonth ?? null
    existing.expYear = method.expYear ?? existing.expYear ?? null
    existing.updatedAt = createdAt
    customer.defaultPaymentMethodId = existing.stripePaymentMethodId
    customer.updatedAt = createdAt
    return
  }

  store.paymentMethodLinks.push({
    id: createMockId('stripe_payment_method_link'),
    workspaceId: customer.workspaceId,
    userId: customer.userId,
    stripeMode: 'test',
    stripeCustomerId: customer.stripeCustomerId,
    stripePaymentMethodId: method.stripePaymentMethodId,
    type: method.type,
    status: 'active',
    brand: method.brand ?? null,
    last4: method.last4 ?? null,
    expMonth: method.expMonth ?? null,
    expYear: method.expYear ?? null,
    isDefault: true,
    metadata: {
      testModeOnly: true,
      safeDisplayOnly: true,
      noCardNumber: true,
      noCvc: true,
    },
    createdAt,
    updatedAt: createdAt,
  })
  customer.defaultPaymentMethodId = method.stripePaymentMethodId
  customer.updatedAt = createdAt
}

function resolvePublishableKey(
  config: StripeBillingRuntimeConfig,
  secretProvider: SecretValueProvider,
): Promise<{ ok: true; value: string } | { ok: false; warnings: string[] }> {
  if (!config.publishableKeySecretName) return Promise.resolve({ ok: false, warnings: ['Stripe test publishable key reference is missing.'] })
  return resolveSecretValue(secretProvider, config.publishableKeySecretName, TEST_PUBLISHABLE_PREFIX)
}

async function resolveSecretValue(
  secretProvider: SecretValueProvider,
  secretName: string,
  expectedPrefix: string,
): Promise<{ ok: true; value: string } | { ok: false; warnings: string[] }> {
  try {
    const value = await secretProvider.getSecretValue(secretName)
    if (!value.startsWith(expectedPrefix)) {
      return { ok: false, warnings: [`Stripe secret reference ${secretName} resolved to the wrong test-mode prefix.`] }
    }
    return { ok: true, value }
  } catch {
    return { ok: false, warnings: [`Stripe secret reference ${secretName} was not resolved by the configured server-side provider.`] }
  }
}

function testModeBlock(
  config: StripeBillingRuntimeConfig,
  client: ReEditProStripeClient,
): { status: 'billing_disabled' | 'test_mode_not_allowed' | 'stripe_config_invalid'; warnings: string[] } | null {
  if (config.mode === 'disabled') return { status: 'billing_disabled', warnings: ['Stripe billing is disabled.'] }
  if (config.mode !== 'test') return { status: 'test_mode_not_allowed', warnings: ['Only Stripe test mode is accepted by RP-STRIPE-TESTMODE-01 routes.'] }
  if (client.runtimeSource !== 'mock_stripe_client' && !config.testModeRealCallsAllowed) {
    return { status: 'test_mode_not_allowed', warnings: ['Real Stripe test-mode calls require REEDITPRO_STRIPE_TEST_MODE_REAL_CALLS_ALLOWED=true.'] }
  }
  const validation = validateStripeBillingRuntimeConfig(config)
  if (!validation.ok) return { status: 'stripe_config_invalid', warnings: validation.errors }
  return null
}

function checkoutMetadata(request: CreateStripeCreditCheckoutSessionRequest, pack: CreditPackDefinition): JSONObject {
  return {
    ...(request.metadata ?? {}),
    workspaceId: request.workspaceId,
    userId: request.userId,
    creditWalletId: request.creditWalletId,
    creditPackId: pack.id,
    credits: String(pack.credits),
    priceCents: String(pack.priceCents),
    currency: pack.currency,
    topUpReason: 'manual_wallet_top_up',
    relatedProjectId: request.relatedProjectId ?? '',
    relatedCreditEstimateId: request.relatedCreditEstimateId ?? '',
    relatedCreditReservationId: request.relatedCreditReservationId ?? '',
    relatedCreditSettlementId: request.relatedCreditSettlementId ?? '',
    relatedCreditRevisionActionId: request.relatedCreditRevisionActionId ?? '',
    stripeMode: 'test',
    testModeOnly: true,
    noAutoGrantWithoutWebhook: true,
  }
}

function metadataParams(metadata?: JSONObject): Record<string, string> {
  const params: Record<string, string> = {}
  Object.entries(metadata ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'object') return
    params[`metadata[${key}]`] = String(value)
  })
  return params
}

function metadataMatchesCheckout(
  metadata: Record<string, unknown>,
  checkout: { workspaceId: string; userId: string; creditWalletId: string; creditPackId: string; credits: number; priceCents: number },
  pack: CreditPackDefinition,
): boolean {
  return stringValue(metadata.workspaceId) === checkout.workspaceId &&
    stringValue(metadata.userId) === checkout.userId &&
    stringValue(metadata.creditWalletId) === checkout.creditWalletId &&
    stringValue(metadata.creditPackId) === checkout.creditPackId &&
    numberFromMetadata(metadata.credits) === pack.credits &&
    numberFromMetadata(metadata.priceCents) === pack.priceCents &&
    stringValue(metadata.stripeMode) === 'test'
}

function insertWebhookEvent(
  store: MockStripeBillingStore,
  event: StripeClientVerifiedWebhookEvent,
  status: StripeWebhookEventRecord['status'],
  payloadSummary: JSONObject,
  relatedId: string | null,
): StripeWebhookEventRecord {
  const createdAt = nowIso()
  const record: StripeWebhookEventRecord = {
    id: createMockId('stripe_webhook_event'),
    stripeMode: 'test',
    stripeEventId: event.id,
    eventType: event.type,
    status,
    relatedCheckoutSessionId: event.type === 'checkout.session.completed' ? relatedId : null,
    relatedPaymentIntentId: null,
    relatedSetupIntentId: event.type === 'setup_intent.succeeded' ? relatedId : null,
    relatedCustomerId: null,
    idempotencyKey: `stripe_event_${event.id}`,
    payloadSummary: {
      ...payloadSummary,
      testModeOnly: true,
      rawProviderPayloadStored: false,
    },
    errorMessage: null,
    createdAt,
    processedAt: status === 'processed' || status === 'ignored' ? createdAt : null,
  }
  store.webhookEvents.push(record)
  return record
}

function checkoutPayloadSummary(
  checkout: { checkoutSessionId: string; creditWalletId: string; creditPackId: string; credits: number; priceCents: number },
  pack: CreditPackDefinition,
): JSONObject {
  return {
    checkoutSessionId: checkout.checkoutSessionId,
    creditWalletId: checkout.creditWalletId,
    creditPackId: checkout.creditPackId,
    credits: pack.credits,
    priceCents: pack.priceCents,
    creditGrantProvider: 'stripe_test',
  }
}

function setupResponse(
  status: CreateStripeSetupIntentResponse['status'],
  setupIntent: CreateStripeSetupIntentResponse['setupIntent'],
  idempotencyStatus: CreateStripeSetupIntentResponse['idempotencyStatus'],
  client: ReEditProStripeClient,
  warnings: string[],
): CreateStripeSetupIntentResponse {
  const realStripeCall = client.runtimeSource === 'fetch_stripe_test_client'
  return {
    status,
    stripeMode: 'test',
    stripeCustomerId: setupIntent?.stripeCustomerId ?? null,
    setupIntentId: setupIntent?.setupIntentId ?? null,
    clientSecret: setupIntent?.clientSecret ?? null,
    publishableKey: null,
    setupIntent,
    idempotencyStatus,
    mockOnly: !realStripeCall,
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      mockOnly: !realStripeCall,
      testModeOnly: true,
      stripeCallAttempted: realStripeCall,
      setupIntentCreated: realStripeCall,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function setupBlocked(
  status: CreateStripeSetupIntentResponse['status'],
  stripeMode: StripeOperationalMode,
  warnings: string[],
): CreateStripeSetupIntentResponse {
  return {
    status,
    stripeMode,
    stripeCustomerId: null,
    setupIntentId: null,
    clientSecret: null,
    publishableKey: null,
    setupIntent: null,
    idempotencyStatus: 'not_created',
    mockOnly: true,
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      testModeOnly: true,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function checkoutResponse(
  status: CreateStripeCreditCheckoutSessionResponse['status'],
  checkoutSession: CreateStripeCreditCheckoutSessionResponse['checkoutSession'],
  idempotencyStatus: CreateStripeCreditCheckoutSessionResponse['idempotencyStatus'],
  client: ReEditProStripeClient,
  warnings: string[],
): CreateStripeCreditCheckoutSessionResponse {
  const realStripeCall = client.runtimeSource === 'fetch_stripe_test_client'
  return {
    status,
    stripeMode: 'test',
    checkoutSessionId: checkoutSession?.checkoutSessionId ?? null,
    checkoutUrl: checkoutSession?.checkoutUrl ?? null,
    checkoutSession,
    idempotencyStatus,
    mockOnly: !realStripeCall,
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      mockOnly: !realStripeCall,
      testModeOnly: true,
      stripeCallAttempted: realStripeCall,
      checkoutSessionCreated: realStripeCall,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function checkoutBlocked(
  status: CreateStripeCreditCheckoutSessionResponse['status'],
  stripeMode: StripeOperationalMode,
  warnings: string[],
): CreateStripeCreditCheckoutSessionResponse {
  return {
    status,
    stripeMode,
    checkoutSessionId: null,
    checkoutUrl: null,
    checkoutSession: null,
    idempotencyStatus: 'not_created',
    mockOnly: true,
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      testModeOnly: true,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function webhookProcessed(
  status: CreateStripeWebhookTestResponse['status'],
  verification: VerifyStripeWebhookSignatureResult,
  webhookEvent: StripeWebhookEventRecord,
  grant: CreditGrantRecord | null,
  idempotencyStatus: CreateStripeWebhookTestResponse['idempotencyStatus'],
  client: ReEditProStripeClient,
  warnings: string[],
): CreateStripeWebhookTestResponse {
  const realStripeCall = client.runtimeSource === 'fetch_stripe_test_client'
  return {
    status,
    stripeMode: 'test',
    verification,
    webhookEvent,
    creditGrantId: grant?.id ?? null,
    creditWalletId: grant?.creditWalletId ?? null,
    creditsGranted: grant?.originalAmount ?? 0,
    idempotencyStatus,
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      mockOnly: !realStripeCall,
      testModeOnly: true,
      stripeCallAttempted: realStripeCall,
      creditsGranted: Boolean(grant),
      walletMutated: Boolean(grant),
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function webhookBlocked(
  status: CreateStripeWebhookTestResponse['status'],
  warnings: string[],
  event?: StripeClientVerifiedWebhookEvent,
): CreateStripeWebhookTestResponse {
  return {
    status,
    stripeMode: 'test',
    verification: verificationResult(status === 'invalid_signature' ? 'invalid_signature' : 'invalid_request', event ?? null, warnings),
    webhookEvent: null,
    creditGrantId: null,
    creditWalletId: null,
    creditsGranted: 0,
    idempotencyStatus: 'not_created',
    safetyFlags: {
      ...createStripeBillingSafetyFlags(),
      testModeOnly: true,
    },
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...TEST_MODE_WARNINGS, ...warnings],
  }
}

function verificationResult(
  status: VerifyStripeWebhookSignatureResult['status'],
  event: StripeClientVerifiedWebhookEvent | null,
  warnings: string[],
): VerifyStripeWebhookSignatureResult {
  return {
    status,
    stripeMode: 'test',
    eventId: event?.id ?? null,
    eventType: event?.type ?? null,
    warnings,
  }
}

function verifyStripeSignature(rawBody: Uint8Array | string, header: string, webhookSecret: string): void {
  if (!webhookSecret.startsWith(TEST_WEBHOOK_PREFIX)) throw new Error('Stripe webhook signing secret resolved to a non-test value.')
  const timestamp = header.split(',').find((part) => part.startsWith('t='))?.slice(2)
  const signature = header.split(',').find((part) => part.startsWith('v1='))?.slice(3)
  if (!timestamp || !signature) throw new Error('Stripe-Signature header is missing timestamp or v1 signature.')
  const body = rawBodyToString(rawBody)
  const expected = createHmac('sha256', webhookSecret).update(`${timestamp}.${body}`).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(signature, 'hex')
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error('Stripe test webhook signature did not match.')
  }
}

function parseStripeEvent(rawBody: Uint8Array | string): StripeClientVerifiedWebhookEvent {
  const parsed = JSON.parse(rawBodyToString(rawBody)) as unknown
  const record = recordValue(parsed)
  const id = stringValue(record.id)
  const type = stringValue(record.type)
  if (!id || !type) throw new Error('Stripe webhook event is missing id or type.')
  return {
    id,
    type,
    livemode: record.livemode === true,
    data: jsonObject(record.data),
  }
}

function eventObject(event: StripeClientVerifiedWebhookEvent): Record<string, unknown> {
  return recordValue(recordValue(event.data).object)
}

function extractPaymentMethod(setupIntent: Record<string, unknown>): {
  stripePaymentMethodId: string
  type: StripePaymentMethodLinkRecord['type']
  brand?: string | null
  last4?: string | null
  expMonth?: number | null
  expYear?: number | null
} | null {
  const raw = setupIntent.payment_method
  const method = typeof raw === 'string' ? { id: raw } : recordValue(raw)
  const id = stringValue(method.id)
  if (!id) return null
  const card = recordValue(method.card)
  const type = stringValue(method.type)
  return {
    stripePaymentMethodId: id,
    type: type === 'card' || type === 'us_bank_account' ? type : 'unknown',
    brand: stringValue(card.brand) ?? null,
    last4: stringValue(card.last4) ?? null,
    expMonth: numberValue(card.exp_month),
    expYear: numberValue(card.exp_year),
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function jsonObject(value: unknown): JSONObject {
  return recordValue(value) as JSONObject
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = stringValue(record[key])
  if (!value) throw new Error(`Stripe test response is missing ${key}.`)
  return value
}

function nullableStringField(record: Record<string, unknown>, key: string): string | null {
  return stringValue(record[key]) ?? null
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function numberFromMetadata(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function rawBodyToString(rawBody: Uint8Array | string): string {
  return typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8')
}

function isTestSecretKey(value: string): boolean {
  return value.startsWith(TEST_SECRET_PREFIX) || value.startsWith(TEST_RESTRICTED_PREFIX)
}

function hasLiveReference(config: StripeBillingRuntimeConfig): boolean {
  return Object.values(config.secretReferences).some((value) =>
    typeof value === 'string' && value.toLowerCase().includes('live'))
}

function check(id: string, label: string, passed: boolean, message: string): StripeTestReadinessCheck {
  return {
    id,
    label,
    passed,
    message: passed ? `${label} passed.` : message,
  }
}

function stableToken(...parts: string[]): string {
  return createHmac('sha256', 'reeditpro-stripe-testmode').update(parts.join('|')).digest('hex').slice(0, 16)
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Stripe test-mode operation failed.'
}
