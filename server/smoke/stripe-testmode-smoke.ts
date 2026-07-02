import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import { loadRuntimeEnv } from '../config/env'
import { getOrCreateMockCreditWallet, createMockCreditReservationStore } from '../services/mock-credit-reservation-store'
import { createMockStripeBillingStore, MockSecretValueProvider } from '../services/stripe-billing-foundation-service'
import {
  createStripeTestCheckoutSession,
  createStripeTestSetupIntent,
  evaluateStripeTestReadiness,
  MockStripeClient,
  processStripeTestWebhook,
} from '../services/stripe-testmode-service'
import {
  createStripeTestCreditCheckoutSessionSchema,
  createStripeTestSetupIntentSchema,
} from '../validation/stripe-billing-schemas'

const testSecretPrefix = ['sk', 'test', ''].join('_')
const testPublishablePrefix = ['pk', 'test', ''].join('_')
const webhookSecretPrefix = ['wh', 'sec', ''].join('')
const liveModeSecretName = 'reeditpro-live-stripe-secret-key'

const testEnv = loadRuntimeEnv({
  NODE_ENV: 'development',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: 'reeditpro-test-stripe-secret-key',
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
  REEDITPRO_STRIPE_TEST_WEBHOOK_SECRET_NAME: 'reeditpro-test-stripe-webhook-secret',
  REEDITPRO_STRIPE_TEST_MODE_REAL_CALLS_ALLOWED: 'true',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'test',
})
const blockedEnv = loadRuntimeEnv({
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: 'reeditpro-test-stripe-secret-key',
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
  REEDITPRO_STRIPE_TEST_WEBHOOK_SECRET_NAME: 'reeditpro-test-stripe-webhook-secret',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'test',
})
const liveEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  REEDITPRO_STRIPE_BILLING_MODE: 'live',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: liveModeSecretName,
  REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-live-stripe-publishable-key',
  REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: 'reeditpro-live-stripe-webhook-secret',
  REEDITPRO_STRIPE_LIVE_MODE_ALLOWED: 'true',
  REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL: 'true',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'live',
})

assert.equal(evaluateStripeTestReadiness(blockedEnv.stripeBilling).status, 'blocked')
assert.equal(evaluateStripeTestReadiness(testEnv.stripeBilling).status, 'ready')
assert.equal(evaluateStripeTestReadiness(liveEnv.stripeBilling).status, 'blocked')

const provider = new MockSecretValueProvider({
  'reeditpro-test-stripe-secret-key': `${testSecretPrefix}mock_secret_value`,
  'reeditpro-test-stripe-publishable-key': `${testPublishablePrefix}mock_publishable_value`,
  'reeditpro-test-stripe-webhook-secret': `${webhookSecretPrefix}_mock_secret_value`,
})
const stripeStore = createMockStripeBillingStore()
const reservationStore = createMockCreditReservationStore()
const client = new MockStripeClient()
const workspaceId = 'workspace_stripe_testmode'
const userId = 'user_stripe_testmode'
const wallet = getOrCreateMockCreditWallet(reservationStore, { workspaceId, userId })
const startingWallet = { ...wallet }

assert.equal(createStripeTestSetupIntentSchema.safeParse({
  workspaceId,
  userId,
  stripeMode: 'live',
  idempotencyKey: 'stripe-test-setup-live-rejected',
}).success, false)
assert.equal(createStripeTestCreditCheckoutSessionSchema.safeParse({
  workspaceId,
  userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: `${testSecretPrefix}not_allowed`,
}).success, false)

const setup = await createStripeTestSetupIntent(stripeStore, testEnv.stripeBilling, client, provider, {
  workspaceId,
  userId,
  stripeMode: 'test',
  returnUrl: 'https://app.reeditpro.local/billing/payment-method',
  idempotencyKey: 'stripe-test-setup-created',
})
assert.equal(setup.status, 'created')
assert.equal(setup.mockOnly, true)
assert.equal(setup.safetyFlags.stripeCallAttempted, false)
assert.ok(setup.stripeCustomerId)
assert.ok(setup.setupIntentId)
assert.ok(setup.clientSecret)
assert.ok(setup.publishableKey?.startsWith(testPublishablePrefix))
assert.equal(stripeStore.customerLinks.length, 1)
assert.equal(stripeStore.setupIntents.length, 1)

const duplicateSetup = await createStripeTestSetupIntent(stripeStore, testEnv.stripeBilling, client, provider, {
  workspaceId,
  userId,
  stripeMode: 'test',
  idempotencyKey: 'stripe-test-setup-created',
})
assert.equal(duplicateSetup.idempotencyStatus, 'duplicate_returned')
assert.equal(stripeStore.setupIntents.length, 1)

const liveSetup = await createStripeTestSetupIntent(stripeStore, liveEnv.stripeBilling, client, provider, {
  workspaceId,
  userId,
  stripeMode: 'live',
  idempotencyKey: 'stripe-test-live-setup-blocked',
})
assert.equal(liveSetup.status, 'test_mode_not_allowed')

const checkout = await createStripeTestCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, client, {
  workspaceId,
  userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/credits/success',
  cancelUrl: 'https://app.reeditpro.local/credits/cancel',
  idempotencyKey: 'stripe-test-checkout-created',
  relatedProjectId: 'project_stripe_testmode',
})
assert.equal(checkout.status, 'created')
assert.equal(checkout.mockOnly, true)
assert.equal(checkout.safetyFlags.checkoutSessionCreated, false)
assert.ok(checkout.checkoutSessionId)
assert.ok(checkout.checkoutUrl)
assert.equal(reservationStore.creditGrants.length, 0)
assert.equal(wallet.cachedAvailableCredits, startingWallet.cachedAvailableCredits)
assert.equal(wallet.cachedReservedCredits, startingWallet.cachedReservedCredits)
assert.equal(wallet.cachedSpentCredits, startingWallet.cachedSpentCredits)
assert.equal(wallet.cachedRefundedCredits, startingWallet.cachedRefundedCredits)

const duplicateCheckout = await createStripeTestCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, client, {
  workspaceId,
  userId,
  creditWalletId: wallet.id,
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/credits/success',
  cancelUrl: 'https://app.reeditpro.local/credits/cancel',
  idempotencyKey: 'stripe-test-checkout-created',
})
assert.equal(duplicateCheckout.idempotencyStatus, 'duplicate_returned')
assert.equal(stripeStore.checkoutSessions.length, 1)

const invalidPack = await createStripeTestCheckoutSession(stripeStore, reservationStore, testEnv.stripeBilling, client, {
  workspaceId,
  userId,
  creditWalletId: wallet.id,
  creditPackId: 'missing_pack',
  stripeMode: 'test',
  successUrl: 'https://app.reeditpro.local/credits/success',
  cancelUrl: 'https://app.reeditpro.local/credits/cancel',
  idempotencyKey: 'stripe-test-checkout-invalid-pack',
})
assert.equal(invalidPack.status, 'credit_pack_not_found')

const checkoutEvent = stripeEvent({
  id: 'evt_test_checkout_completed',
  type: 'checkout.session.completed',
  object: {
    id: checkout.checkoutSessionId,
    amount_total: 1000,
    currency: 'usd',
    metadata: {
      workspaceId,
      userId,
      creditWalletId: wallet.id,
      creditPackId: 'credits_100_usd_10',
      credits: '100',
      priceCents: '1000',
      stripeMode: 'test',
    },
  },
})
const checkoutWebhook = await processStripeTestWebhook(stripeStore, reservationStore, testEnv.stripeBilling, client, provider, {
  rawBody: checkoutEvent.raw,
  stripeSignatureHeader: checkoutEvent.signature,
})
assert.equal(checkoutWebhook.status, 'processed')
assert.equal(checkoutWebhook.creditsGranted, 100)
assert.equal(checkoutWebhook.safetyFlags.walletMutated, true)
assert.equal(checkoutWebhook.safetyFlags.creditsGranted, true)
assert.equal(wallet.cachedAvailableCredits, startingWallet.cachedAvailableCredits + 100)
assert.equal(wallet.cachedReservedCredits, startingWallet.cachedReservedCredits)
assert.equal(wallet.cachedSpentCredits, startingWallet.cachedSpentCredits)
assert.equal(wallet.cachedRefundedCredits, startingWallet.cachedRefundedCredits)
assert.equal(reservationStore.creditGrants.length, 1)
assert.equal(reservationStore.creditGrants[0]?.sourceType, 'purchased')
assert.equal(reservationStore.creditGrants[0]?.billingProvider, 'stripe_test')
assert.equal(reservationStore.creditGrants[0]?.metadata?.noLedgerWrite, true)

const duplicateWebhook = await processStripeTestWebhook(stripeStore, reservationStore, testEnv.stripeBilling, client, provider, {
  rawBody: checkoutEvent.raw,
  stripeSignatureHeader: checkoutEvent.signature,
})
assert.equal(duplicateWebhook.status, 'duplicate')
assert.equal(duplicateWebhook.creditsGranted, 0)
assert.equal(wallet.cachedAvailableCredits, startingWallet.cachedAvailableCredits + 100)
assert.equal(reservationStore.creditGrants.length, 1)

const badAmountEvent = stripeEvent({
  id: 'evt_test_checkout_bad_amount',
  type: 'checkout.session.completed',
  object: {
    id: checkout.checkoutSessionId,
    amount_total: 900,
    currency: 'usd',
    metadata: {
      workspaceId,
      userId,
      creditWalletId: wallet.id,
      creditPackId: 'credits_100_usd_10',
      credits: '100',
      priceCents: '1000',
      stripeMode: 'test',
    },
  },
})
const badAmount = await processStripeTestWebhook(stripeStore, reservationStore, testEnv.stripeBilling, client, provider, {
  rawBody: badAmountEvent.raw,
  stripeSignatureHeader: badAmountEvent.signature,
})
assert.equal(badAmount.status, 'invalid_request')
assert.equal(wallet.cachedAvailableCredits, startingWallet.cachedAvailableCredits + 100)

const setupEvent = stripeEvent({
  id: 'evt_test_setup_succeeded',
  type: 'setup_intent.succeeded',
  object: {
    id: setup.setupIntentId,
    customer: setup.stripeCustomerId,
    payment_method: {
      id: 'pm_test_safe_card',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2032,
      },
    },
  },
})
const setupWebhook = await processStripeTestWebhook(stripeStore, reservationStore, testEnv.stripeBilling, client, provider, {
  rawBody: setupEvent.raw,
  stripeSignatureHeader: setupEvent.signature,
})
assert.equal(setupWebhook.status, 'processed')
assert.equal(stripeStore.paymentMethodLinks.length, 1)
assert.equal(stripeStore.paymentMethodLinks[0]?.stripePaymentMethodId, 'pm_test_safe_card')
assert.equal(stripeStore.paymentMethodLinks[0]?.last4, '4242')
assert.equal(stripeStore.paymentMethodLinks[0]?.metadata?.noCvc, true)

const invalidSignature = await processStripeTestWebhook(stripeStore, reservationStore, testEnv.stripeBilling, client, provider, {
  rawBody: checkoutEvent.raw,
  stripeSignatureHeader: 't=123,v1=not-a-real-signature',
})
assert.equal(invalidSignature.status, 'invalid_signature')

const blockedWebhook = await processStripeTestWebhook(stripeStore, reservationStore, liveEnv.stripeBilling, client, provider, {
  rawBody: checkoutEvent.raw,
  stripeSignatureHeader: checkoutEvent.signature,
})
assert.equal(blockedWebhook.status, 'test_mode_not_allowed')

assert.equal(reservationStore.creditWallets.length, 1)
assert.equal(reservationStore.creditReservations.length, 0)
assert.equal(stripeStore.webhookEvents.every((event) => event.stripeMode === 'test'), true)

function stripeEvent(input: { id: string; type: string; object: Record<string, unknown> }): { raw: string; signature: string } {
  const raw = JSON.stringify({
    id: input.id,
    type: input.type,
    livemode: false,
    data: {
      object: input.object,
    },
  })
  const timestamp = '1700000000'
  const secret = `${webhookSecretPrefix}_mock_secret_value`
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  return {
    raw,
    signature: `t=${timestamp},v1=${signature}`,
  }
}

console.log('RP-STRIPE-TESTMODE-01 smoke passed')
