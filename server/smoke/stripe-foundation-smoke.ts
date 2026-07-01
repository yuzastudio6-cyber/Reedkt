import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { getOrCreateMockCreditWallet, createMockCreditReservationStore } from '../services/mock-credit-reservation-store'
import {
  containsRawStripeSecretValue,
  createMockStripeBillingStore,
  createMockStripeCheckoutSession,
  createMockStripeSetupIntent,
  createMockStripeWebhookEvent,
  evaluateStripeLiveReadiness,
  getStripeConfigStatus,
  inspectStripeSecretValue,
  MockSecretValueProvider,
  validateStripeBillingRuntimeConfig,
  validateStripeCustomerMode,
  validateStripePaymentMethodSafeMetadata,
  verifyStripeWebhookSignature,
} from '../services/stripe-billing-foundation-service'
import {
  createStripeCreditCheckoutSessionSchema,
  createStripeSetupIntentSchema,
  createStripeWebhookMockSchema,
} from '../validation/stripe-billing-schemas'
import type {
  StripeCustomerLinkRecord,
  StripePaymentMethodLinkRecord,
} from '../../src/types'

const root = process.cwd()
const testSecretPrefix = ['sk', 'test', ''].join('_')
const liveSecretPrefix = ['sk', 'live', ''].join('_')
const webhookSecretPrefix = ['wh', 'sec', ''].join('')
const forbiddenStripeSecretPattern = new RegExp([
  testSecretPrefix,
  liveSecretPrefix,
  ['rk', 'test', ''].join('_'),
  ['rk', 'live', ''].join('_'),
  ['pk', 'live', ''].join('_'),
  webhookSecretPrefix,
].join('|'))

const defaultEnv = loadRuntimeEnv({})
assert.equal(defaultEnv.stripeBilling.mode, 'disabled')
assert.equal(defaultEnv.stripeBilling.mockOnly, true)
assert.equal(getStripeConfigStatus(defaultEnv.stripeBilling).status, 'billing_disabled')

const testEnv = loadRuntimeEnv({
  NODE_ENV: 'development',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: 'reeditpro-test-stripe-secret-key',
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
  REEDITPRO_STRIPE_TEST_WEBHOOK_SECRET_NAME: 'reeditpro-test-stripe-webhook-secret',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'test',
})
assert.equal(validateStripeBillingRuntimeConfig(testEnv.stripeBilling).ok, true)
assert.equal(getStripeConfigStatus(testEnv.stripeBilling).status, 'test_configured')
assert.equal(testEnv.stripeBilling.secretKeySecretName, 'reeditpro-test-stripe-secret-key')
assert.notEqual(testEnv.stripeBilling.secretKeySecretName, testEnv.stripeBilling.webhookSigningSecretName)

const mixedTestEnv = loadRuntimeEnv({
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
  REEDITPRO_STRIPE_TEST_WEBHOOK_SECRET_NAME: 'reeditpro-test-stripe-webhook-secret',
})
assert.equal(validateStripeBillingRuntimeConfig(mixedTestEnv.stripeBilling).ok, false)

const liveDevEnv = loadRuntimeEnv({
  NODE_ENV: 'development',
  REEDITPRO_STRIPE_BILLING_MODE: 'live',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
  REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-live-stripe-publishable-key',
  REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: 'reeditpro-live-stripe-webhook-secret',
  REEDITPRO_STRIPE_LIVE_MODE_ALLOWED: 'true',
  REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL: 'true',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'live',
})
assert.equal(evaluateStripeLiveReadiness(liveDevEnv.stripeBilling).status, 'invalid_config')

const liveProdEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  REEDITPRO_STRIPE_BILLING_MODE: 'live',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
  REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-live-stripe-publishable-key',
  REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: 'reeditpro-live-stripe-webhook-secret',
  REEDITPRO_STRIPE_LIVE_MODE_ALLOWED: 'true',
  REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL: 'true',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'live',
})
assert.equal(evaluateStripeLiveReadiness(liveProdEnv.stripeBilling).status, 'ready_no_charge')

const rawSecretEnv = loadRuntimeEnv({
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: `${testSecretPrefix}should_not_be_here`,
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
})
assert.equal(validateStripeBillingRuntimeConfig(rawSecretEnv.stripeBilling).ok, false)
assert.equal(containsRawStripeSecretValue({ webhook: `${webhookSecretPrefix}should_not_be_here` }), true)

const provider = new MockSecretValueProvider({
  'reeditpro-test-stripe-secret-key': `${testSecretPrefix}mock_secret_value`,
})
assert.equal(await provider.getSecretValue('reeditpro-test-stripe-secret-key'), `${testSecretPrefix}mock_secret_value`)
const inspected = await inspectStripeSecretValue(provider, {
  secretName: 'reeditpro-test-stripe-secret-key',
  stripeMode: 'test',
  expectedPrefix: testSecretPrefix,
})
assert.equal(inspected.status, 'resolved')
assert.equal('value' in inspected, false)
assert.equal(inspected.redactedSummary.valueExposed, false)
assert.equal((await inspectStripeSecretValue(provider, {
  secretName: 'reeditpro-test-missing-secret-key',
  stripeMode: 'test',
  expectedPrefix: testSecretPrefix,
})).status, 'missing_secret')
assert.equal((await inspectStripeSecretValue(provider, {
  secretName: 'reeditpro-test-stripe-secret-key',
  stripeMode: 'live',
  expectedPrefix: liveSecretPrefix,
})).status, 'mode_mismatch')

const stripeStore = createMockStripeBillingStore()
const customer: StripeCustomerLinkRecord = {
  id: 'stripe_customer_link_test',
  workspaceId: 'workspace_stripe_foundation',
  userId: 'user_stripe_foundation',
  stripeMode: 'test',
  stripeCustomerId: 'cus_test_foundation',
  status: 'active',
  defaultPaymentMethodId: 'pm_test_foundation',
  metadata: { mockOnly: true },
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}
stripeStore.customerLinks.push(customer)
assert.equal(validateStripeCustomerMode(customer, 'test').ok, true)
assert.equal(validateStripeCustomerMode(customer, 'live').ok, false)

const paymentMethod: StripePaymentMethodLinkRecord = {
  id: 'stripe_payment_method_link_test',
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  stripeMode: 'test',
  stripeCustomerId: customer.stripeCustomerId,
  stripePaymentMethodId: 'pm_test_foundation',
  type: 'card',
  status: 'active',
  brand: 'visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2030,
  isDefault: true,
  metadata: { mockOnly: true, safeDisplayOnly: true },
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
}
assert.equal(validateStripePaymentMethodSafeMetadata(paymentMethod).ok, true)
assert.equal(validateStripePaymentMethodSafeMetadata({
  ...paymentMethod,
  metadata: { card_number: '4242424242424242' },
}).ok, false)

assert.equal(createStripeSetupIntentSchema.safeParse({
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  stripeMode: 'test',
}).success, false)
const disabledSetup = createMockStripeSetupIntent(stripeStore, defaultEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  stripeMode: 'test',
  idempotencyKey: 'stripe-setup-disabled',
})
assert.equal(disabledSetup.status, 'billing_disabled')
const setup = createMockStripeSetupIntent(stripeStore, testEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  stripeMode: 'test',
  returnUrl: 'https://app.reeditpro.local/billing',
  idempotencyKey: 'stripe-setup-created',
})
assert.equal(setup.status, 'created')
assert.equal(setup.clientSecret, null)
assert.equal(setup.safetyFlags.stripeCallAttempted, false)
assert.equal(createMockStripeSetupIntent(stripeStore, testEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  stripeMode: 'test',
  idempotencyKey: 'stripe-setup-created',
}).idempotencyStatus, 'duplicate_returned')

const reservationStore = createMockCreditReservationStore()
const wallet = getOrCreateMockCreditWallet(reservationStore, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
})
assert.ok(wallet)
const walletBefore = { ...wallet }
assert.equal(createStripeCreditCheckoutSessionSchema.safeParse({
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
}).success, false)
const checkout = createMockStripeCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: 'stripe-checkout-created',
  relatedProjectId: 'project_stripe_foundation',
})
assert.equal(checkout.status, 'created')
assert.equal(checkout.checkoutUrl, null)
assert.equal(checkout.safetyFlags.checkoutSessionCreated, false)
assert.equal(checkout.safetyFlags.creditsGranted, false)
assert.equal(reservationStore.creditGrants.length, 0)
assert.equal(wallet.cachedAvailableCredits, walletBefore.cachedAvailableCredits)
assert.equal(wallet.cachedReservedCredits, walletBefore.cachedReservedCredits)
assert.equal(wallet.cachedSpentCredits, walletBefore.cachedSpentCredits)
assert.equal(createMockStripeCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: 'stripe-checkout-created',
}).idempotencyStatus, 'duplicate_returned')
assert.equal(createMockStripeCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, {
  workspaceId: customer.workspaceId,
  userId: customer.userId,
  creditWalletId: wallet.id,
  creditPackId: 'missing_pack',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: 'stripe-checkout-invalid-pack',
}).status, 'credit_pack_not_found')

assert.equal(verifyStripeWebhookSignature({
  stripeMode: 'test',
  rawBody: '{"id":"evt_test"}',
  webhookSecretRef: 'reeditpro-test-stripe-webhook-secret',
}).status, 'missing_signature')
assert.equal(verifyStripeWebhookSignature({
  stripeMode: 'test',
  rawBody: '{"id":"evt_test"}',
  stripeSignatureHeader: 'mock_sig_test',
}).status, 'missing_webhook_secret')
assert.equal(verifyStripeWebhookSignature({
  stripeMode: 'test',
  parsedJsonBody: { id: 'evt_test' },
  stripeSignatureHeader: 'mock_sig_test',
  webhookSecretRef: 'reeditpro-test-stripe-webhook-secret',
}).status, 'invalid_request')
assert.equal(verifyStripeWebhookSignature({
  stripeMode: 'test',
  rawBody: '{"id":"evt_test"}',
  stripeSignatureHeader: 'mock_sig_test',
  webhookSecretRef: 'reeditpro-live-stripe-webhook-secret',
}).status, 'mode_mismatch')
assert.equal(createStripeWebhookMockSchema.safeParse({
  stripeMode: 'test',
  rawBody: '{"id":"evt_test"}',
  stripeSignatureHeader: 'mock_sig_test',
  stripeEventId: 'evt_test_foundation',
  eventType: 'checkout.session.completed',
}).success, false)
const webhook = createMockStripeWebhookEvent(stripeStore, testEnv.stripeBilling, {
  stripeMode: 'test',
  rawBody: '{"id":"evt_test_foundation"}',
  stripeSignatureHeader: 'mock_sig_test',
  stripeEventId: 'evt_test_foundation',
  eventType: 'checkout.session.completed',
  relatedCheckoutSessionId: checkout.checkoutSessionId,
  idempotencyKey: 'stripe-webhook-created',
})
assert.equal(webhook.status, 'verified')
assert.equal(webhook.verification.status, 'verified')
assert.equal(webhook.safetyFlags.creditsGranted, false)
assert.equal(reservationStore.creditGrants.length, 0)
assert.equal(createMockStripeWebhookEvent(stripeStore, testEnv.stripeBilling, {
  stripeMode: 'test',
  rawBody: '{"id":"evt_test_foundation"}',
  stripeSignatureHeader: 'mock_sig_test',
  stripeEventId: 'evt_test_foundation',
  eventType: 'checkout.session.completed',
  idempotencyKey: 'stripe-webhook-replay',
}).status, 'duplicate')

const serializedResponses = JSON.stringify({ setup, checkout, webhook })
assert.equal(forbiddenStripeSecretPattern.test(serializedResponses), false)
assert.equal(setup.safetyFlags.walletMutated, false)
assert.equal(checkout.safetyFlags.walletMutated, false)
assert.equal(webhook.safetyFlags.ledgerWritten, false)
assert.equal(webhook.safetyFlags.supabaseWritten, false)
assert.equal(webhook.safetyFlags.providerCalled, false)
assert.equal(webhook.safetyFlags.renderOrExportStarted, false)

const packageJson = readFileSync(join(root, 'package.json'), 'utf8')
assert.match(packageJson, /"smoke:stripe-foundation"/)
const doc = readFileSync(join(root, 'docs/stripe-billing-foundation.md'), 'utf8')
assert.match(doc, /test\/live mode separation/)
assert.match(doc, /no live Stripe calls/)
assert.match(doc, /raw request body/)
assert.match(doc, /Secret Manager reference/)
assert.match(doc, /no production wallet mutation/)

console.log(JSON.stringify({
  smoke: 'stripe-foundation',
  modes: ['disabled', 'test', 'live'],
  setupStatus: setup.status,
  checkoutStatus: checkout.status,
  webhookStatus: webhook.status,
  liveReadiness: evaluateStripeLiveReadiness(liveProdEnv.stripeBilling).status,
  stripeCallAttempted: false,
  walletMutated: false,
  creditsGranted: false,
  packageLockChanged: false,
}, null, 2))
