import type { CurrencyCode, ID, ISODateString, JSONObject } from './shared'

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
  'live_mode_not_allowed',
  'stripe_config_invalid',
  'customer_not_found',
  'invalid_request',
] as const
export type CreateStripeSetupIntentStatus = typeof STRIPE_SETUP_INTENT_RESPONSE_STATUSES[number]

export const STRIPE_CHECKOUT_SESSION_RESPONSE_STATUSES = [
  'created',
  'billing_disabled',
  'live_mode_not_allowed',
  'stripe_config_invalid',
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

export interface StripeBillingSafetyFlags {
  mockOnly: true
  stripeCallAttempted: false
  liveStripeCallAttempted: false
  checkoutSessionCreated: false
  setupIntentCreated: false
  paymentIntentCreated: false
  creditsGranted: false
  walletMutated: false
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
  clientSecret: null
  returnUrl?: string | null
  status: 'created'
  idempotencyKey: string
  mockOnly: true
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
  mockOnly: true
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
  checkoutUrl: null
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
  mockOnly: true
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
  mockOnly: true
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
  mockOnly: true
  safetyFlags: StripeBillingSafetyFlags
  warnings: string[]
}
