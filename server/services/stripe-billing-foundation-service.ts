import type {
  CreateStripeCreditCheckoutSessionRequest,
  CreateStripeCreditCheckoutSessionResponse,
  CreateStripeSetupIntentRequest,
  CreateStripeSetupIntentResponse,
  CreateStripeWebhookMockRequest,
  CreateStripeWebhookMockResponse,
  MockStripeCheckoutSessionRecord,
  MockStripeSetupIntentRecord,
  SecretValueProvider,
  StripeBillingConfigValidationResult,
  StripeBillingRuntimeConfig,
  StripeBillingSafetyFlags,
  StripeConfigStatusResponse,
  StripeCustomerLinkRecord,
  StripeLiveReadinessCheck,
  StripeLiveReadinessResponse,
  StripeOperationalMode,
  StripePaymentMethodLinkRecord,
  StripeSecretValueResult,
  StripeWebhookEventRecord,
  VerifyStripeWebhookSignatureInput,
  VerifyStripeWebhookSignatureResult,
} from '../../src/types'
import { listCreditPacks } from './mock-credit-purchase-store'
import type { MockCreditReservationStore } from './mock-credit-reservation-store'
import { createMockId, nowIso } from './service-helpers'

export interface MockStripeBillingStore {
  customerLinks: StripeCustomerLinkRecord[]
  paymentMethodLinks: StripePaymentMethodLinkRecord[]
  setupIntents: MockStripeSetupIntentRecord[]
  checkoutSessions: MockStripeCheckoutSessionRecord[]
  webhookEvents: StripeWebhookEventRecord[]
}

export const STRIPE_FOUNDATION_WARNINGS = [
  'RP-STRIPE-FOUNDATION-01 is mock/config only.',
  'No live billing, Stripe charge, real Checkout Session, real SetupIntent, real PaymentIntent, webhook credit grant, Supabase write, production wallet mutation, production ledger write, provider call, render/export execution, checkout/top-up live behavior, or production persistence occurred.',
] as const

const RAW_STRIPE_SECRET_VALUE_PATTERNS = [
  stripeSecretPattern('sk', 'test'),
  stripeSecretPattern('sk', 'live'),
  stripeSecretPattern('rk', 'test'),
  stripeSecretPattern('rk', 'live'),
  stripeSecretPattern('pk', 'live'),
  new RegExp(`\\b${['wh', 'sec', ''].join('')}[A-Za-z0-9_]+`),
]

export class DisabledSecretValueProvider implements SecretValueProvider {
  async getSecretValue(): Promise<string> {
    throw new Error('Stripe secret value provider is disabled.')
  }
}

export class MockSecretValueProvider implements SecretValueProvider {
  constructor(private readonly values: Record<string, string>) {}

  async getSecretValue(secretName: string): Promise<string> {
    const value = this.values[secretName]
    if (!value) throw new Error(`Mock secret ${secretName} was not found.`)
    return value
  }
}

export class EnvironmentSecretValueProvider implements SecretValueProvider {
  constructor(private readonly values: NodeJS.ProcessEnv = process.env) {}

  async getSecretValue(secretName: string): Promise<string> {
    const value = this.values[secretName]
    if (!value?.trim()) throw new Error(`Environment secret reference ${secretName} was not found.`)
    return value
  }
}

export const sharedMockStripeBillingStore = createMockStripeBillingStore()

export function createMockStripeBillingStore(): MockStripeBillingStore {
  return {
    customerLinks: [],
    paymentMethodLinks: [],
    setupIntents: [],
    checkoutSessions: [],
    webhookEvents: [],
  }
}

export function createStripeBillingSafetyFlags(): StripeBillingSafetyFlags {
  return {
    mockOnly: true,
    testModeOnly: false,
    stripeCallAttempted: false,
    liveStripeCallAttempted: false,
    checkoutSessionCreated: false,
    setupIntentCreated: false,
    paymentIntentCreated: false,
    creditsGranted: false,
    walletMutated: false,
    ledgerWritten: false,
    supabaseWritten: false,
    providerCalled: false,
    renderOrExportStarted: false,
    secretValueReturned: false,
  }
}

export function getStripeConfigStatus(config: StripeBillingRuntimeConfig): StripeConfigStatusResponse {
  const validation = validateStripeBillingRuntimeConfig(config)
  const status = !validation.ok
    ? 'stripe_config_invalid'
    : config.mode === 'disabled'
      ? 'billing_disabled'
      : config.mode === 'live'
        ? 'live_configured'
        : 'test_configured'

  return {
    status,
    config: cloneSafeConfig(config),
    validation,
    safetyFlags: createStripeBillingSafetyFlags(),
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...config.warnings, ...validation.warnings],
  }
}

export function evaluateStripeLiveReadiness(config: StripeBillingRuntimeConfig): StripeLiveReadinessResponse {
  const validation = validateStripeBillingRuntimeConfig(config)
  const checks: StripeLiveReadinessCheck[] = [
    check('environment_production', 'Production environment', config.environment === 'production', 'Live Stripe mode requires NODE_ENV=production.'),
    check('mode_live', 'Stripe mode live', config.mode === 'live', 'Stripe billing mode must be live.'),
    check('live_mode_allowed', 'Live mode owner allowed', config.liveModeAllowed, 'REEDITPRO_STRIPE_LIVE_MODE_ALLOWED must be true.'),
    check('manual_approval', 'Manual live approval present', config.liveModeRequiresManualApproval, 'REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL must be true.'),
    check('secret_source', 'Secret source enabled', config.secretSource !== 'disabled', 'Live mode requires an approved secret source.'),
    check('live_secret_key_ref', 'Live secret key reference present', Boolean(config.secretReferences.liveSecretKeySecretName), 'Live secret key Secret Manager reference is required.'),
    check('live_publishable_key_ref', 'Live publishable key reference present', Boolean(config.secretReferences.livePublishableKeySecretName), 'Live publishable key reference is required.'),
    check('live_webhook_ref', 'Live webhook secret reference present', Boolean(config.secretReferences.liveWebhookSigningSecretName), 'Live webhook signing secret reference is required.'),
    check('webhook_endpoint_live', 'Webhook endpoint live', config.webhookEndpointMode === 'live', 'Live mode requires webhook endpoint mode live.'),
    check('no_test_refs_in_live', 'No test refs in live config', !hasAnyModeMarker(config, 'test'), 'Live mode must not use test Stripe secret references.'),
    check('no_raw_secret_values', 'No raw Stripe secrets', !containsRawStripeSecretValue(config.secretReferences), 'Config must contain reference names, not raw Stripe keys or webhook secrets.'),
  ]
  if (!validation.ok) {
    checks.push(check('config_validation', 'Stripe config validation', false, validation.errors.join(' ')))
  }

  const canEnableLiveMode = checks.every((item) => item.passed)

  return {
    status: canEnableLiveMode ? 'ready' : 'blocked',
    stripeMode: config.mode,
    canEnableLiveMode,
    checks,
    config: cloneSafeConfig(config),
    safetyFlags: createStripeBillingSafetyFlags(),
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...config.warnings, ...validation.warnings],
  }
}

export async function inspectStripeSecretValue(
  provider: SecretValueProvider,
  input: {
    secretName: string
    stripeMode: StripeOperationalMode
    expectedPrefix: string
  },
): Promise<StripeSecretValueResult> {
  if (!input.secretName.trim()) return secretValueResult('invalid_request', input, false)
  const refValidation = validateSecretReferenceMode(input.secretName, input.stripeMode)
  if (!refValidation.ok) return secretValueResult('mode_mismatch', input, false, refValidation.errors)

  try {
    const value = await provider.getSecretValue(input.secretName)
    if (!value.startsWith(input.expectedPrefix)) {
      return secretValueResult('mode_mismatch', input, true, [`Secret value for ${input.secretName} does not match expected Stripe mode prefix.`])
    }
    return secretValueResult('resolved', input, true)
  } catch {
    return secretValueResult('missing_secret', input, false, [`Secret reference ${input.secretName} was not resolved by the configured provider.`])
  }
}

export function validateStripeBillingRuntimeConfig(config: StripeBillingRuntimeConfig): StripeBillingConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (containsRawStripeSecretValue(config.secretReferences)) {
    errors.push('Stripe billing config contains a raw Stripe key or webhook secret value. Store only secret reference names.')
  }

  if (config.mode === 'disabled') {
    if (config.secretSource !== 'disabled') {
      warnings.push('Stripe billing is disabled; configured secret references remain unused.')
    }
    return { ok: errors.length === 0, errors, warnings }
  }

  if (config.secretSource === 'disabled') {
    errors.push('Enabled Stripe billing mode requires google_secret_manager or environment_variable secret source.')
  }

  if (!config.secretKeySecretName) errors.push('Enabled Stripe billing mode requires an active secret key reference name.')
  if (!config.publishableKeySecretName) errors.push('Enabled Stripe billing mode requires an active publishable key reference name.')
  if (!config.webhookSigningSecretName) warnings.push('Stripe webhook signing secret reference is not configured; webhook verification will fail closed.')

  const activeRefs = [
    config.secretKeySecretName,
    config.publishableKeySecretName,
    config.webhookSigningSecretName,
  ].filter((value): value is string => Boolean(value))

  activeRefs.forEach((secretName) => {
    const result = validateSecretReferenceMode(secretName, config.mode)
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  })

  if (config.mode === 'live') {
    if (!config.liveModeAllowed) errors.push('Live Stripe mode requires REEDITPRO_STRIPE_LIVE_MODE_ALLOWED=true.')
    if (!config.liveModeRequiresManualApproval) errors.push('Live Stripe mode requires REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL=true.')
    if (config.environment !== 'production') errors.push('Live Stripe mode requires NODE_ENV=production.')
    if (config.webhookEndpointMode !== 'live') errors.push('Live Stripe mode requires REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE=live.')
    if (hasAnyModeMarker(config, 'test')) errors.push('Live Stripe mode must not include test Stripe secret references.')
  }

  if (config.mode === 'test' && hasAnyModeMarker(config, 'live')) {
    errors.push('Test Stripe mode must not include live Stripe secret references.')
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function createMockStripeSetupIntent(
  store: MockStripeBillingStore,
  config: StripeBillingRuntimeConfig,
  request: CreateStripeSetupIntentRequest,
): CreateStripeSetupIntentResponse {
  const duplicate = store.setupIntents.find((intent) =>
    intent.workspaceId === request.workspaceId &&
    intent.idempotencyKey === request.idempotencyKey)
  if (duplicate) {
    return setupResponse('created', request.stripeMode, duplicate, 'duplicate_returned', [
      'Duplicate setup intent idempotency key returned the existing mock setup intent.',
    ])
  }

  const blocked = commonBillingBlock(config, request.stripeMode)
  if (blocked) return setupResponse(blocked.status, request.stripeMode, null, 'not_created', blocked.warnings)

  const validation = validateStripeBillingRuntimeConfig(config)
  if (!validation.ok) return setupResponse('stripe_config_invalid', request.stripeMode, null, 'not_created', validation.errors)

  const customer = store.customerLinks.find((link) =>
    link.workspaceId === request.workspaceId &&
    link.userId === request.userId &&
    link.stripeMode === request.stripeMode &&
    link.status === 'active')
  if (!customer) {
    return setupResponse('customer_not_found', request.stripeMode, null, 'not_created', [
      'No active Stripe customer link exists for this workspace, user, and mode.',
    ])
  }

  const createdAt = nowIso()
  const record: MockStripeSetupIntentRecord = {
    id: createMockId('stripe_setup_intent'),
    workspaceId: request.workspaceId,
    userId: request.userId,
    stripeMode: request.stripeMode,
    stripeCustomerId: customer.stripeCustomerId,
    setupIntentId: `seti_mock_${createMockId('stripe')}`,
    clientSecret: null,
    returnUrl: request.returnUrl ?? null,
    status: 'created',
    idempotencyKey: request.idempotencyKey,
    mockOnly: true,
    metadata: {
      ...(request.metadata ?? {}),
      mockOnly: true,
      noStripeCall: true,
      noClientSecret: true,
    },
    createdAt,
    updatedAt: createdAt,
  }
  store.setupIntents.push(record)
  return setupResponse('created', request.stripeMode, record, 'created', [
    'Created a mock setup intent record only; no Stripe SetupIntent or client secret was created.',
  ])
}

export function createMockStripeCheckoutSession(
  store: MockStripeBillingStore,
  reservationStore: MockCreditReservationStore,
  config: StripeBillingRuntimeConfig,
  request: CreateStripeCreditCheckoutSessionRequest,
): CreateStripeCreditCheckoutSessionResponse {
  const duplicate = store.checkoutSessions.find((session) =>
    session.workspaceId === request.workspaceId &&
    session.idempotencyKey === request.idempotencyKey)
  if (duplicate) {
    return checkoutResponse('created', request.stripeMode, duplicate, 'duplicate_returned', [
      'Duplicate checkout idempotency key returned the existing mock checkout session.',
    ])
  }

  const blocked = commonBillingBlock(config, request.stripeMode)
  if (blocked) return checkoutResponse(blocked.status, request.stripeMode, null, 'not_created', blocked.warnings)

  const validation = validateStripeBillingRuntimeConfig(config)
  if (!validation.ok) return checkoutResponse('stripe_config_invalid', request.stripeMode, null, 'not_created', validation.errors)

  const wallet = reservationStore.creditWallets.find((candidate) =>
    candidate.id === request.creditWalletId &&
    candidate.workspaceId === request.workspaceId)
  if (!wallet) {
    return checkoutResponse('wallet_not_found', request.stripeMode, null, 'not_created', [
      'Credit wallet was not found. No mock checkout session was created.',
    ])
  }

  const pack = listCreditPacks().find((candidate) => candidate.id === request.creditPackId && candidate.isActive)
  if (!pack) {
    return checkoutResponse('credit_pack_not_found', request.stripeMode, null, 'not_created', [
      'Credit pack was not found or is inactive.',
    ])
  }

  const createdAt = nowIso()
  const record: MockStripeCheckoutSessionRecord = {
    id: createMockId('stripe_checkout_session'),
    workspaceId: request.workspaceId,
    userId: request.userId,
    creditWalletId: wallet.id,
    creditPackId: pack.id,
    stripeMode: request.stripeMode,
    checkoutSessionId: `cs_mock_${createMockId('stripe')}`,
    checkoutUrl: null,
    currency: 'USD',
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
    mockOnly: true,
    metadata: {
      ...(request.metadata ?? {}),
      mockOnly: true,
      clientReferenceId: request.idempotencyKey,
      noStripeCall: true,
      noCreditGrant: true,
      walletMutated: false,
    },
    createdAt,
    updatedAt: createdAt,
  }
  store.checkoutSessions.push(record)
  return checkoutResponse('created', request.stripeMode, record, 'created', [
    'Created a mock checkout session record only; no real Stripe Checkout Session, payment, wallet mutation, or credit grant occurred.',
  ])
}

export function verifyStripeWebhookSignature(input: VerifyStripeWebhookSignatureInput): VerifyStripeWebhookSignatureResult {
  if (!input.stripeSignatureHeader?.trim()) {
    return webhookVerification('missing_signature', input, ['Stripe-Signature header is required.'])
  }
  if (!input.webhookSecretRef?.trim()) {
    return webhookVerification('missing_webhook_secret', input, ['Webhook signing secret reference is required.'])
  }
  const modeCheck = validateSecretReferenceMode(input.webhookSecretRef, input.stripeMode)
  if (!modeCheck.ok) return webhookVerification('mode_mismatch', input, modeCheck.errors)
  if (containsRawStripeSecretValue(input.webhookSecretRef)) {
    return webhookVerification('invalid_request', input, ['Webhook secret must be a reference name, not a raw Stripe webhook secret value.'])
  }
  if (!input.rawBody) {
    return webhookVerification('invalid_request', input, [
      'Live Stripe webhook verification requires raw request body; parsed JSON body alone is not accepted.',
    ])
  }
  return webhookVerification('verified', input, [
    'Mock verifier accepted the raw-body boundary only; no Stripe SDK signature verification ran in RP-STRIPE-FOUNDATION-01.',
  ])
}

export function createMockStripeWebhookEvent(
  store: MockStripeBillingStore,
  config: StripeBillingRuntimeConfig,
  request: CreateStripeWebhookMockRequest,
): CreateStripeWebhookMockResponse {
  const duplicate = store.webhookEvents.find((event) =>
    event.stripeMode === request.stripeMode &&
    event.stripeEventId === request.stripeEventId)
  if (duplicate) {
    return webhookResponse('duplicate', request.stripeMode, webhookVerification('verified', {
      stripeMode: request.stripeMode,
      rawBody: request.rawBody ?? null,
      stripeSignatureHeader: request.stripeSignatureHeader ?? null,
      webhookSecretRef: config.webhookSigningSecretName ?? null,
      eventId: request.stripeEventId,
      eventType: request.eventType,
    }, ['Duplicate Stripe webhook event ID returned the existing mock event.']), duplicate, 'duplicate_returned')
  }

  const blocked = commonBillingBlock(config, request.stripeMode)
  if (blocked) {
    const verification = webhookVerification('invalid_request', {
      stripeMode: request.stripeMode,
      eventId: request.stripeEventId,
      eventType: request.eventType,
    }, blocked.warnings)
    return webhookResponse(blocked.status === 'live_mode_not_allowed' ? 'live_mode_not_allowed' : 'billing_disabled', request.stripeMode, verification, null, 'not_created')
  }

  const validation = validateStripeBillingRuntimeConfig(config)
  if (!validation.ok) {
    const verification = webhookVerification('invalid_request', {
      stripeMode: request.stripeMode,
      eventId: request.stripeEventId,
      eventType: request.eventType,
    }, validation.errors)
    return webhookResponse('stripe_config_invalid', request.stripeMode, verification, null, 'not_created')
  }

  const verification = verifyStripeWebhookSignature({
    stripeMode: request.stripeMode,
    rawBody: request.rawBody ?? null,
    parsedJsonBody: request.parsedJsonBody ?? null,
    stripeSignatureHeader: request.stripeSignatureHeader ?? null,
    webhookSecretRef: config.webhookSigningSecretName ?? null,
    eventId: request.stripeEventId,
    eventType: request.eventType,
  })
  if (verification.status !== 'verified') {
    return webhookResponse('invalid_request', request.stripeMode, verification, null, 'not_created')
  }

  const createdAt = nowIso()
  const record: StripeWebhookEventRecord = {
    id: createMockId('stripe_webhook_event'),
    stripeMode: request.stripeMode,
    stripeEventId: request.stripeEventId,
    eventType: request.eventType,
    status: 'verified',
    relatedCheckoutSessionId: request.relatedCheckoutSessionId ?? null,
    relatedPaymentIntentId: request.relatedPaymentIntentId ?? null,
    relatedSetupIntentId: request.relatedSetupIntentId ?? null,
    relatedCustomerId: request.relatedCustomerId ?? null,
    idempotencyKey: request.idempotencyKey,
    payloadSummary: {
      ...(request.metadata ?? {}),
      mockOnly: true,
      rawBodyReceived: true,
      parsedJsonBodyAcceptedForLiveVerification: false,
      creditsGranted: false,
    },
    errorMessage: null,
    createdAt,
    processedAt: null,
  }
  store.webhookEvents.push(record)
  return webhookResponse('verified', request.stripeMode, verification, record, 'created')
}

export function containsRawStripeSecretValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return RAW_STRIPE_SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))
  }
  if (Array.isArray(value)) return value.some((item) => containsRawStripeSecretValue(item))
  if (!value || typeof value !== 'object') return false
  return Object.values(value).some((item) => containsRawStripeSecretValue(item))
}

export function validateStripeCustomerMode(record: StripeCustomerLinkRecord, stripeMode: StripeOperationalMode): StripeBillingConfigValidationResult {
  const errors: string[] = []
  if (record.stripeMode !== stripeMode) errors.push('Stripe customer link mode does not match requested mode.')
  if (!stripeIdMatchesMode(record.stripeCustomerId, stripeMode)) errors.push('Stripe customer ID marker does not match requested mode.')
  return { ok: errors.length === 0, errors, warnings: [] }
}

export function validateStripePaymentMethodSafeMetadata(record: StripePaymentMethodLinkRecord): StripeBillingConfigValidationResult {
  const errors: string[] = []
  if (containsRawStripeSecretValue(record.metadata)) errors.push('Payment method metadata contains a raw Stripe secret value.')
  if (containsForbiddenPaymentCredential(record.metadata)) errors.push('Payment method metadata must not store card numbers, CVC, or raw payment credentials.')
  return { ok: errors.length === 0, errors, warnings: [] }
}

function commonBillingBlock(config: StripeBillingRuntimeConfig, requestedMode: StripeOperationalMode): {
  status: 'billing_disabled' | 'live_mode_not_allowed' | 'stripe_config_invalid'
  warnings: string[]
} | null {
  if (config.mode === 'disabled') {
    return { status: 'billing_disabled', warnings: ['Stripe billing is disabled.'] }
  }
  if (requestedMode === 'live' && !evaluateStripeLiveReadiness(config).canEnableLiveMode) {
    return { status: 'live_mode_not_allowed', warnings: ['Live Stripe mode is blocked by the readiness gate.'] }
  }
  if (config.mode !== requestedMode) {
    return {
      status: requestedMode === 'live' ? 'live_mode_not_allowed' : 'stripe_config_invalid',
      warnings: [`Requested Stripe mode ${requestedMode} does not match runtime mode ${config.mode}.`],
    }
  }
  return null
}

function setupResponse(
  status: CreateStripeSetupIntentResponse['status'],
  stripeMode: StripeOperationalMode,
  setupIntent: MockStripeSetupIntentRecord | null,
  idempotencyStatus: CreateStripeSetupIntentResponse['idempotencyStatus'],
  warnings: string[],
): CreateStripeSetupIntentResponse {
  return {
    status,
    stripeMode,
    stripeCustomerId: setupIntent?.stripeCustomerId ?? null,
    setupIntentId: setupIntent?.setupIntentId ?? null,
    clientSecret: null,
    publishableKey: null,
    setupIntent,
    idempotencyStatus,
    mockOnly: true,
    safetyFlags: createStripeBillingSafetyFlags(),
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...warnings],
  }
}

function checkoutResponse(
  status: CreateStripeCreditCheckoutSessionResponse['status'],
  stripeMode: StripeOperationalMode,
  checkoutSession: MockStripeCheckoutSessionRecord | null,
  idempotencyStatus: CreateStripeCreditCheckoutSessionResponse['idempotencyStatus'],
  warnings: string[],
): CreateStripeCreditCheckoutSessionResponse {
  return {
    status,
    stripeMode,
    checkoutSessionId: checkoutSession?.checkoutSessionId ?? null,
    checkoutUrl: null,
    checkoutSession,
    idempotencyStatus,
    mockOnly: true,
    safetyFlags: createStripeBillingSafetyFlags(),
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...warnings],
  }
}

function webhookResponse(
  status: CreateStripeWebhookMockResponse['status'],
  stripeMode: StripeOperationalMode,
  verification: VerifyStripeWebhookSignatureResult,
  webhookEvent: StripeWebhookEventRecord | null,
  idempotencyStatus: CreateStripeWebhookMockResponse['idempotencyStatus'],
): CreateStripeWebhookMockResponse {
  return {
    status,
    stripeMode,
    verification,
    webhookEvent,
    idempotencyStatus,
    mockOnly: true,
    safetyFlags: createStripeBillingSafetyFlags(),
    warnings: [...STRIPE_FOUNDATION_WARNINGS, ...verification.warnings],
  }
}

function webhookVerification(
  status: VerifyStripeWebhookSignatureResult['status'],
  input: Pick<VerifyStripeWebhookSignatureInput, 'stripeMode' | 'eventId' | 'eventType'>,
  warnings: string[],
): VerifyStripeWebhookSignatureResult {
  return {
    status,
    stripeMode: input.stripeMode,
    eventId: input.eventId ?? null,
    eventType: input.eventType ?? null,
    warnings,
  }
}

function secretValueResult(
  status: StripeSecretValueResult['status'],
  input: { secretName: string; stripeMode: StripeOperationalMode },
  valueResolved: boolean,
  warnings: string[] = [],
): StripeSecretValueResult {
  return {
    status,
    secretName: input.secretName,
    stripeMode: input.stripeMode,
    redactedSummary: {
      secretName: input.secretName,
      stripeMode: input.stripeMode,
      valueResolved,
      valueExposed: false,
    },
    warnings,
  }
}

function validateSecretReferenceMode(secretName: string, mode: StripeOperationalMode): StripeBillingConfigValidationResult {
  const lower = secretName.toLowerCase()
  const errors: string[] = []
  const warnings: string[] = []
  if (containsRawStripeSecretValue(secretName)) errors.push('Stripe secret fields must store reference names, not raw Stripe key values.')
  if (mode === 'live' && lower.includes('test')) errors.push(`Live Stripe mode cannot use test secret reference ${secretName}.`)
  if (mode === 'test' && lower.includes('live')) errors.push(`Test Stripe mode cannot use live secret reference ${secretName}.`)
  if (!lower.includes(mode)) warnings.push(`Stripe secret reference ${secretName} does not include an explicit ${mode} marker.`)
  return { ok: errors.length === 0, errors, warnings }
}

function hasAnyModeMarker(config: StripeBillingRuntimeConfig, marker: 'test' | 'live'): boolean {
  return Object.values(config.secretReferences).some((secretName) =>
    typeof secretName === 'string' && secretName.toLowerCase().includes(marker))
}

function stripeIdMatchesMode(stripeId: string, mode: StripeOperationalMode): boolean {
  const lower = stripeId.toLowerCase()
  if (mode === 'test') return !lower.includes('live')
  return !lower.includes('test')
}

function containsForbiddenPaymentCredential(value: unknown): boolean {
  if (typeof value === 'string') return /\b(?:cvc|cvv|card_number|cardnumber|payment_credential)\b/i.test(value)
  if (Array.isArray(value)) return value.some((item) => containsForbiddenPaymentCredential(item))
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, nested]) =>
    /\b(?:cvc|cvv|card_number|cardnumber|payment_credential|full_card)\b/i.test(key) ||
    containsForbiddenPaymentCredential(nested))
}

function check(id: string, label: string, passed: boolean, message: string): StripeLiveReadinessCheck {
  return {
    id,
    label,
    passed,
    message: passed ? `${label} passed.` : message,
  }
}

function cloneSafeConfig(config: StripeBillingRuntimeConfig): StripeBillingRuntimeConfig {
  return {
    ...config,
    secretReferences: { ...config.secretReferences },
    warnings: [...config.warnings],
  }
}

function stripeSecretPattern(kind: 'sk' | 'rk' | 'pk', mode: StripeOperationalMode): RegExp {
  return new RegExp(`\\b${[kind, mode, ''].join('_')}[A-Za-z0-9_]+`)
}
