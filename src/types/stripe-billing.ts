import type { CreditAmount, CurrencyCode, ID, ISODateString, JSONObject } from './shared'

export const STRIPE_BILLING_MODES = ['disabled', 'test', 'live'] as const
export type StripeBillingMode = typeof STRIPE_BILLING_MODES[number]
export type StripeOperationalMode = Exclude<StripeBillingMode, 'disabled'>

export const STRIPE_SECRET_SOURCES = ['google_secret_manager', 'environment_variable', 'disabled'] as const
export type StripeSecretSource = typeof STRIPE_SECRET_SOURCES[number]

export const STRIPE_WEBHOOK_ENDPOINT_MODES = ['disabled', 'test', 'live'] as const
export type StripeWebhookEndpointMode = typeof STRIPE_WEBHOOK_ENDPOINT_MODES[number]

export const STRIPE_PAYMENT_METHOD_TYPES = ['card', 'us_bank_account', 'unknown'] as const
export type StripePaymentMethodType = typeof STRIPE_PAYMENT_METHOD_TYPES[number]

export const STRIPE_CUSTOMER_LINK_STATUSES = ['active', 'deleted', 'disabled'] as const
export type StripeCustomerLinkStatus = typeof STRIPE_CUSTOMER_LINK_STATUSES[number]

export const STRIPE_PAYMENT_METHOD_LINK_STATUSES = ['active', 'detached', 'expired', 'disabled'] as const
export type StripePaymentMethodLinkStatus = typeof STRIPE_PAYMENT_METHOD_LINK_STATUSES[number]

export const STRIPE_SETUP_INTENT_RESPONSE_STATUSES = [
  'created',
  'billing_disabled',
  'test_mode_not_allowed',
  'live_mode_not_allowed',
  'stripe_config_invalid',
  'stripe_secret_unavailable',
  'stripe_api_error',
  'customer_not_found',
  'invalid_request',
] as const
export type CreateStripeSetupIntentStatus = typeof STRIPE_SETUP_INTENT_RESPONSE_STATUSES[number]

export const STRIPE_CHECKOUT_SESSION_RESPONSE_STATUSES = [
  'created',
  'billing_disabled',
  'test_mode_not_allowed',
  'live_mode_not_allowed',
  'stripe_config_invalid',
  'stripe_secret_unavailable',
  'stripe_api_error',
  'credit_pack_not_found',
  'wallet_not_found',
  'invalid_request',
] as const
export type CreateStripeCreditCheckoutSessionStatus = typeof STRIPE_CHECKOUT_SESSION_RESPONSE_STATUSES[number]

export const STRIPE_WEBHOOK_EVENT_STATUSES = [
  'received',
  'verified',
  'processed',
  'ignored',
  'failed',
  'mode_mismatch',
  'duplicate',
] as const
export type StripeWebhookEventStatus = typeof STRIPE_WEBHOOK_EVENT_STATUSES[number]

export const STRIPE_TEST_READINESS_STATUSES = ['ready', 'blocked'] as const
export type StripeTestReadinessStatus = typeof STRIPE_TEST_READINESS_STATUSES[number]

export const STRIPE_TEST_WEBHOOK_RESPONSE_STATUSES = [
  'processed',
  'duplicate',
  'ignored',
  'billing_disabled',
  'test_mode_not_allowed',
  'stripe_config_invalid',
  'stripe_secret_unavailable',
  'invalid_signature',
  'invalid_request',
] as const
export type CreateStripeWebhookTestStatus = typeof STRIPE_TEST_WEBHOOK_RESPONSE_STATUSES[number]

export const STRIPE_WEBHOOK_SIGNATURE_STATUSES = [
  'verified',
  'missing_signature',
  'missing_webhook_secret',
  'mode_mismatch',
  'invalid_signature',
  'invalid_request',
] as const
export type VerifyStripeWebhookSignatureStatus = typeof STRIPE_WEBHOOK_SIGNATURE_STATUSES[number]

export const STRIPE_SECRET_VALUE_RESULT_STATUSES = [
  'resolved',
  'disabled',
  'missing_secret',
  'mode_mismatch',
  'invalid_secret_value',
  'invalid_request',
] as const
export type StripeSecretValueResultStatus = typeof STRIPE_SECRET_VALUE_RESULT_STATUSES[number]

export interface StripeBillingSecretReferences {
  testSecretKeySecretName?: string | null
  testPublishableKeySecretName?: string | null
  testWebhookSigningSecretName?: string | null
  liveSecretKeySecretName?: string | null
  livePublishableKeySecretName?: string | null
  liveWebhookSigningSecretName?: string | null
}

export interface StripeBillingRuntimeConfig {
  mode: StripeBillingMode
  secretSource: StripeSecretSource
  publishableKeyMode: StripeWebhookEndpointMode
  secretKeySecretName?: string | null
  publishableKeySecretName?: string | null
  webhookSigningSecretName?: string | null
  secretReferences: StripeBillingSecretReferences
  restrictedKeyPreferred: boolean
  testModeRealCallsAllowed: boolean
  liveModeAllowed: boolean
  liveModeRequiresManualApproval: boolean
  webhookEndpointMode: StripeWebhookEndpointMode
  environment: string
  mockOnly: boolean
  warnings: string[]
}

export interface StripeBillingConfigValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface StripeLiveReadinessCheck {
  id: string
  label: string
  passed: boolean
  message: string
}

export interface StripeTestReadinessCheck {
  id: string
  label: string
  passed: boolean
  message: string
}

export interface StripeBillingSafetyFlags {
  mockOnly: boolean
  testModeOnly?: boolean
  stripeCallAttempted: boolean
  liveStripeCallAttempted: false
  checkoutSessionCreated: boolean
  setupIntentCreated: boolean
  paymentIntentCreated: false
  creditsGranted: boolean
  walletMutated: boolean
  ledgerWritten: false
  supabaseWritten: false
  providerCalled: false
  renderOrExportStarted: false
  secretValueReturned: false
}

export interface StripeConfigStatusResponse {
  status: 'billing_disabled' | 'test_configured' | 'live_configured' | 'stripe_config_invalid'
  config: StripeBillingRuntimeConfig
  validation: StripeBillingConfigValidationResult
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface StripeLiveReadinessResponse {
  status: 'ready' | 'blocked'
  stripeMode: StripeBillingMode
  canEnableLiveMode: boolean
  checks: StripeLiveReadinessCheck[]
  config: StripeBillingRuntimeConfig
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface StripeTestReadinessResponse {
  status: StripeTestReadinessStatus
  stripeMode: StripeBillingMode
  canRunTestMode: boolean
  checks: StripeTestReadinessCheck[]
  config: StripeBillingRuntimeConfig
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface StripeSecretValueResult {
  status: StripeSecretValueResultStatus
  secretName: string
  stripeMode: StripeOperationalMode
  value?: string
  redactedSummary: {
    secretName: string
    stripeMode: StripeOperationalMode
    valueResolved: boolean
    valueExposed: false
  }
  warnings: string[]
}

export interface SecretValueProvider {
  getSecretValue(secretName: string): Promise<string>
}

export interface StripeClientCreateCustomerInput {
  workspaceId: ID
  userId: ID
  idempotencyKey: string
  metadata?: JSONObject
}

export interface StripeClientCustomerResult {
  stripeCustomerId: string
}

export interface StripeClientCreateSetupIntentInput {
  stripeCustomerId: string
  idempotencyKey: string
  metadata?: JSONObject
}

export interface StripeClientSetupIntentResult {
  setupIntentId: string
  clientSecret: string | null
}

export interface StripeClientCreateCheckoutSessionInput {
  stripeCustomerId: string
  creditPackId: ID
  credits: CreditAmount
  priceCents: number
  currency: CurrencyCode
  successUrl: string
  cancelUrl: string
  clientReferenceId: string
  idempotencyKey: string
  metadata: JSONObject
}

export interface StripeClientCheckoutSessionResult {
  checkoutSessionId: string
  checkoutUrl: string | null
}

export interface StripeClientVerifyWebhookInput {
  rawBody: Uint8Array | string
  stripeSignatureHeader: string
  webhookSecret: string
}

export interface StripeClientVerifiedWebhookEvent {
  id: string
  type: string
  livemode: boolean
  data: JSONObject
}

export interface StripeClientVerifyWebhookResult {
  event: StripeClientVerifiedWebhookEvent
}

export interface ReEditProStripeClient {
  readonly runtimeSource: 'mock_stripe_client' | 'fetch_stripe_test_client'
  createCustomer(input: StripeClientCreateCustomerInput): Promise<StripeClientCustomerResult>
  createSetupIntent(input: StripeClientCreateSetupIntentInput): Promise<StripeClientSetupIntentResult>
  createCheckoutSession(input: StripeClientCreateCheckoutSessionInput): Promise<StripeClientCheckoutSessionResult>
  verifyWebhookSignature(input: StripeClientVerifyWebhookInput): Promise<StripeClientVerifyWebhookResult>
}

export interface StripeCustomerLinkRecord {
  id: ID
  workspaceId: ID
  userId: ID
  stripeMode: StripeOperationalMode
  stripeCustomerId: string
  status: StripeCustomerLinkStatus
  defaultPaymentMethodId?: string | null
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface StripePaymentMethodLinkRecord {
  id: ID
  workspaceId: ID
  userId: ID
  stripeMode: StripeOperationalMode
  stripeCustomerId: string
  stripePaymentMethodId: string
  type: StripePaymentMethodType
  status: StripePaymentMethodLinkStatus
  brand?: string | null
  last4?: string | null
  expMonth?: number | null
  expYear?: number | null
  isDefault: boolean
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateStripeSetupIntentRequest {
  workspaceId: ID
  userId: ID
  stripeMode: StripeOperationalMode
  returnUrl?: string | null
  idempotencyKey: string
  metadata?: JSONObject
}

export interface MockStripeSetupIntentRecord {
  id: ID
  workspaceId: ID
  userId: ID
  stripeMode: StripeOperationalMode
  stripeCustomerId: string
  setupIntentId: string
  clientSecret: string | null
  returnUrl?: string | null
  status: 'created'
  idempotencyKey: string
  mockOnly: boolean
  runtimeSource?: ReEditProStripeClient['runtimeSource']
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateStripeSetupIntentResponse {
  status: CreateStripeSetupIntentStatus
  stripeMode: StripeOperationalMode
  stripeCustomerId?: string | null
  setupIntentId?: string | null
  clientSecret?: string | null
  publishableKey?: string | null
  setupIntent?: MockStripeSetupIntentRecord | null
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  mockOnly: boolean
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface CreateStripeCreditCheckoutSessionRequest {
  workspaceId: ID
  userId: ID
  creditWalletId: ID
  creditPackId: ID
  stripeMode: StripeOperationalMode
  successUrl: string
  cancelUrl: string
  idempotencyKey: string
  relatedProjectId?: ID | null
  relatedCreditEstimateId?: ID | null
  relatedCreditReservationId?: ID | null
  relatedCreditSettlementId?: ID | null
  relatedCreditRevisionActionId?: ID | null
  metadata?: JSONObject
}

export interface MockStripeCheckoutSessionRecord {
  id: ID
  workspaceId: ID
  userId: ID
  creditWalletId: ID
  creditPackId: ID
  stripeMode: StripeOperationalMode
  checkoutSessionId: string
  checkoutUrl: string | null
  currency: CurrencyCode
  credits: number
  priceCents: number
  successUrl: string
  cancelUrl: string
  relatedProjectId?: ID | null
  relatedCreditEstimateId?: ID | null
  relatedCreditReservationId?: ID | null
  relatedCreditSettlementId?: ID | null
  relatedCreditRevisionActionId?: ID | null
  idempotencyKey: string
  mockOnly: boolean
  runtimeSource?: ReEditProStripeClient['runtimeSource']
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CreateStripeCreditCheckoutSessionResponse {
  status: CreateStripeCreditCheckoutSessionStatus
  stripeMode: StripeOperationalMode
  checkoutSessionId?: string | null
  checkoutUrl?: string | null
  checkoutSession?: MockStripeCheckoutSessionRecord | null
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  mockOnly: boolean
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface VerifyStripeWebhookSignatureInput {
  stripeMode: StripeOperationalMode
  rawBody?: string | Uint8Array | null
  parsedJsonBody?: JSONObject | null
  stripeSignatureHeader?: string | null
  webhookSecretRef?: string | null
  eventId?: string | null
  eventType?: string | null
}

export interface VerifyStripeWebhookSignatureResult {
  status: VerifyStripeWebhookSignatureStatus
  stripeMode: StripeOperationalMode
  eventId?: string | null
  eventType?: string | null
  warnings: string[]
}

export interface StripeWebhookEventRecord {
  id: ID
  stripeMode: StripeOperationalMode
  stripeEventId: string
  eventType: string
  status: StripeWebhookEventStatus
  relatedCheckoutSessionId?: string | null
  relatedPaymentIntentId?: string | null
  relatedSetupIntentId?: string | null
  relatedCustomerId?: string | null
  idempotencyKey: string
  payloadSummary: JSONObject
  errorMessage?: string | null
  createdAt: ISODateString
  processedAt?: ISODateString | null
}

export interface CreateStripeWebhookMockRequest {
  stripeMode: StripeOperationalMode
  rawBody?: string | null
  parsedJsonBody?: JSONObject | null
  stripeSignatureHeader?: string | null
  stripeEventId: string
  eventType: string
  relatedCheckoutSessionId?: string | null
  relatedPaymentIntentId?: string | null
  relatedSetupIntentId?: string | null
  relatedCustomerId?: string | null
  idempotencyKey: string
  metadata?: JSONObject
}

export interface CreateStripeWebhookMockResponse {
  status:
    | 'received'
    | 'verified'
    | 'duplicate'
    | 'billing_disabled'
    | 'live_mode_not_allowed'
    | 'stripe_config_invalid'
    | 'invalid_request'
  stripeMode: StripeOperationalMode
  verification: VerifyStripeWebhookSignatureResult
  webhookEvent?: StripeWebhookEventRecord | null
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  mockOnly: boolean
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}

export interface CreateStripeWebhookTestResponse {
  status: CreateStripeWebhookTestStatus
  stripeMode: 'test'
  verification: VerifyStripeWebhookSignatureResult
  webhookEvent?: StripeWebhookEventRecord | null
  creditGrantId?: ID | null
  creditWalletId?: ID | null
  creditsGranted: CreditAmount
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}
