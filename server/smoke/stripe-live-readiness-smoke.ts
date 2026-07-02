import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { createMockCreditReservationStore } from '../services/mock-credit-reservation-store'
import {
  containsRawStripeSecretValue,
  createMockStripeBillingStore,
  createMockStripeCheckoutSession,
  createMockStripeSetupIntent,
  createMockStripeWebhookEvent,
  evaluateStripeLiveReadiness,
  MockSecretValueProvider,
  runStripeLiveNoChargeDryRun,
} from '../services/stripe-billing-foundation-service'
import {
  createStripeTestCheckoutSession,
  createStripeTestSetupIntent,
  MockStripeClient,
  processStripeTestWebhook,
} from '../services/stripe-testmode-service'

const root = process.cwd()
const liveSecretPrefix = ['sk', 'live', ''].join('_')
const liveRestrictedPrefix = ['rk', 'live', ''].join('_')
const livePublishablePrefix = ['pk', 'live', ''].join('_')
const testSecretPrefix = ['sk', 'test', ''].join('_')
const webhookSecretPrefix = ['wh', 'sec', ''].join('')
const forbiddenStripeSecretPattern = new RegExp([
  liveSecretPrefix,
  liveRestrictedPrefix,
  testSecretPrefix,
  ['rk', 'test', ''].join('_'),
  ['pk', 'live', ''].join('_'),
  webhookSecretPrefix,
].join('|'))

const defaultEnv = loadRuntimeEnv({})
assert.equal(evaluateStripeLiveReadiness(defaultEnv.stripeBilling).status, 'not_ready')
assert.equal(evaluateStripeLiveReadiness(defaultEnv.stripeBilling).canEnableLiveMode, false)

const testEnv = loadRuntimeEnv({
  REEDITPRO_STRIPE_BILLING_MODE: 'test',
  REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
  REEDITPRO_STRIPE_TEST_SECRET_KEY_SECRET_NAME: 'reeditpro-test-stripe-secret-key',
  REEDITPRO_STRIPE_TEST_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-test-stripe-publishable-key',
  REEDITPRO_STRIPE_TEST_WEBHOOK_SECRET_NAME: 'reeditpro-test-stripe-webhook-secret',
  REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'test',
})
assert.equal(evaluateStripeLiveReadiness(testEnv.stripeBilling).status, 'not_ready')

assert.equal(evaluateStripeLiveReadiness(liveEnv({ NODE_ENV: 'development' }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_LIVE_MODE_ALLOWED: undefined }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL: undefined }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_SECRET_SOURCE: 'disabled' }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: undefined }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: undefined }).stripeBilling).status, 'invalid_config')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: undefined }).stripeBilling).status, 'blocked')
assert.equal(evaluateStripeLiveReadiness(liveEnv({ REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'test' }).stripeBilling).status, 'invalid_config')

const mixedRefs = liveEnv({
  REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: 'reeditpro-test-stripe-secret-key',
})
assert.equal(evaluateStripeLiveReadiness(mixedRefs.stripeBilling).status, 'invalid_config')

const equalWebhookRef = liveEnv({
  REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
})
assert.equal(evaluateStripeLiveReadiness(equalWebhookRef.stripeBilling).canEnableLiveMode, false)
assert.equal(evaluateStripeLiveReadiness(equalWebhookRef.stripeBilling).checks.find((check) => check.id === 'live_secret_distinct_from_webhook')?.status, 'failed')

const equalPublishableRef = liveEnv({
  REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
})
assert.equal(evaluateStripeLiveReadiness(equalPublishableRef.stripeBilling).canEnableLiveMode, false)
assert.equal(evaluateStripeLiveReadiness(equalPublishableRef.stripeBilling).checks.find((check) => check.id === 'live_publishable_distinct_from_secret')?.status, 'failed')

const testRealFlag = liveEnv({
  REEDITPRO_STRIPE_TEST_MODE_REAL_CALLS_ALLOWED: 'true',
})
assert.equal(evaluateStripeLiveReadiness(testRealFlag.stripeBilling).canEnableLiveMode, false)
assert.equal(evaluateStripeLiveReadiness(testRealFlag.stripeBilling).checks.find((check) => check.id === 'test_real_calls_not_live_gate')?.status, 'failed')

const rawSecretEnv = liveEnv({
  REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: `${liveSecretPrefix}should_not_be_configured`,
})
assert.equal(evaluateStripeLiveReadiness(rawSecretEnv.stripeBilling).status, 'invalid_config')
assert.equal(containsRawStripeSecretValue({ webhook: `${webhookSecretPrefix}_should_not_be_configured` }), true)
assert.equal(containsRawStripeSecretValue({ publishable: `${livePublishablePrefix}should_not_be_configured` }), true)

const readyEnv = liveEnv()
const ready = evaluateStripeLiveReadiness(readyEnv.stripeBilling)
assert.equal(ready.status, 'ready_no_charge')
assert.equal(ready.canEnableLiveMode, true)
assert.equal(ready.noChargeDryRun, true)
assert.equal(ready.canCreateLiveCheckoutSessions, false)
assert.equal(ready.canCreateLiveSetupIntents, false)
assert.equal(ready.canCreateLivePaymentIntents, false)
assert.equal(ready.canProcessLiveWebhooks, false)
assert.equal(ready.canGrantLiveCredits, false)
assert.equal(ready.safetyFlags.stripeCallAttempted, false)
assert.equal(ready.safetyFlags.liveStripeCallAttempted, false)
assert.equal(ready.safetyFlags.walletMutated, false)
assert.equal(ready.safetyFlags.ledgerWritten, false)
assert.equal(ready.safetyFlags.supabaseWritten, false)
assert.equal(ready.safetyFlags.providerCalled, false)
assert.equal(ready.safetyFlags.renderOrExportStarted, false)
assert.equal(forbiddenStripeSecretPattern.test(JSON.stringify(ready.safeConfigSummary)), false)
assert.equal(ready.safeConfigSummary.noChargeDryRun, true)

const provider = new MockSecretValueProvider({
  'reeditpro-live-stripe-secret-key': `${liveSecretPrefix}mock_secret_value`,
  'reeditpro-live-stripe-publishable-key': `${livePublishablePrefix}mock_publishable_value`,
  'reeditpro-live-stripe-webhook-secret': `${webhookSecretPrefix}_mock_secret_value`,
})
const dryRun = await runStripeLiveNoChargeDryRun(readyEnv.stripeBilling, {
  secretProvider: provider,
  auditSecretResolution: true,
})
assert.equal(dryRun.status, 'ready_no_charge')
assert.equal(dryRun.noChargeDryRun, true)
assert.equal(dryRun.checks.find((check) => check.id === 'live_secret_key_value')?.status, 'passed')
assert.equal(dryRun.checks.find((check) => check.id === 'live_publishable_key_value')?.status, 'passed')
assert.equal(dryRun.checks.find((check) => check.id === 'live_webhook_secret_value')?.status, 'passed')
assert.equal(dryRun.canCreateLiveCheckoutSessions, false)
assert.equal(dryRun.canCreateLiveSetupIntents, false)
assert.equal(dryRun.canProcessLiveWebhooks, false)
assert.equal(dryRun.canGrantLiveCredits, false)

const stripeStore = createMockStripeBillingStore()
const reservationStore = createMockCreditReservationStore()
const client = new MockStripeClient()
const liveSetup = await createStripeTestSetupIntent(stripeStore, readyEnv.stripeBilling, client, provider, {
  workspaceId: 'workspace_live_readiness',
  userId: 'user_live_readiness',
  stripeMode: 'live',
  idempotencyKey: 'live-readiness-setup',
})
assert.equal(liveSetup.status, 'test_mode_not_allowed')
const liveCheckout = await createStripeTestCheckoutSession(stripeStore, reservationStore, readyEnv.stripeBilling, client, {
  workspaceId: 'workspace_live_readiness',
  userId: 'user_live_readiness',
  creditWalletId: 'wallet_live_readiness',
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'live',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: 'live-readiness-checkout',
})
assert.equal(liveCheckout.status, 'test_mode_not_allowed')
const liveWebhook = await processStripeTestWebhook(stripeStore, reservationStore, readyEnv.stripeBilling, client, provider, {
  rawBody: '{"id":"evt_live_blocked"}',
  stripeSignatureHeader: 't=1700000000,v1=blocked',
})
assert.equal(liveWebhook.status, 'test_mode_not_allowed')

assert.equal(createMockStripeSetupIntent(stripeStore, readyEnv.stripeBilling, {
  workspaceId: 'workspace_live_readiness',
  userId: 'user_live_readiness',
  stripeMode: 'live',
  idempotencyKey: 'live-readiness-mock-setup',
}).status, 'live_mode_not_allowed')
assert.equal(createMockStripeCheckoutSession(stripeStore, reservationStore, readyEnv.stripeBilling, {
  workspaceId: 'workspace_live_readiness',
  userId: 'user_live_readiness',
  creditWalletId: 'wallet_live_readiness',
  creditPackId: 'credits_100_usd_10',
  stripeMode: 'live',
  successUrl: 'https://app.reeditpro.local/success',
  cancelUrl: 'https://app.reeditpro.local/cancel',
  idempotencyKey: 'live-readiness-mock-checkout',
}).status, 'live_mode_not_allowed')
assert.equal(createMockStripeWebhookEvent(stripeStore, readyEnv.stripeBilling, {
  stripeMode: 'live',
  rawBody: '{"id":"evt_live_mock_blocked"}',
  stripeSignatureHeader: 'mock_sig_live',
  stripeEventId: 'evt_live_mock_blocked',
  eventType: 'checkout.session.completed',
  idempotencyKey: 'live-readiness-mock-webhook',
}).status, 'live_mode_not_allowed')

assert.equal(stripeStore.customerLinks.length, 0)
assert.equal(stripeStore.setupIntents.length, 0)
assert.equal(stripeStore.checkoutSessions.length, 0)
assert.equal(stripeStore.webhookEvents.length, 0)
assert.equal(reservationStore.creditWallets.length, 0)
assert.equal(reservationStore.creditGrants.length, 0)
assert.equal(reservationStore.creditReservations.length, 0)
assert.equal(reservationStore.creditReservationLineItems.length, 0)

const doc = readFileSync(join(root, 'docs/stripe-live-readiness.md'), 'utf8')
assert.match(doc, /ready_no_charge/)
assert.match(doc, /No-charge dry run/)
assert.match(doc, /no live Checkout Sessions/)
assert.equal(forbiddenStripeSecretPattern.test(doc), false)
const packageJson = readFileSync(join(root, 'package.json'), 'utf8')
assert.match(packageJson, /"smoke:stripe-live-readiness"/)

console.log(JSON.stringify({
  smoke: 'stripe-live-readiness',
  status: dryRun.status,
  noChargeDryRun: dryRun.noChargeDryRun,
  liveCapabilities: {
    checkout: dryRun.canCreateLiveCheckoutSessions,
    setupIntent: dryRun.canCreateLiveSetupIntents,
    paymentIntent: dryRun.canCreateLivePaymentIntents,
    webhook: dryRun.canProcessLiveWebhooks,
    creditGrant: dryRun.canGrantLiveCredits,
  },
  stripeObjectsCreated: stripeStore.checkoutSessions.length + stripeStore.setupIntents.length + stripeStore.webhookEvents.length,
  walletMutations: reservationStore.walletMutationRecords.length,
}, null, 2))

function liveEnv(overrides: Record<string, string | undefined> = {}) {
  return loadRuntimeEnv({
    NODE_ENV: 'production',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_STRIPE_BILLING_MODE: 'live',
    REEDITPRO_STRIPE_SECRET_SOURCE: 'google_secret_manager',
    REEDITPRO_STRIPE_LIVE_SECRET_KEY_SECRET_NAME: 'reeditpro-live-stripe-secret-key',
    REEDITPRO_STRIPE_LIVE_PUBLISHABLE_KEY_SECRET_NAME: 'reeditpro-live-stripe-publishable-key',
    REEDITPRO_STRIPE_LIVE_WEBHOOK_SECRET_NAME: 'reeditpro-live-stripe-webhook-secret',
    REEDITPRO_STRIPE_LIVE_MODE_ALLOWED: 'true',
    REEDITPRO_STRIPE_LIVE_MODE_MANUAL_APPROVAL: 'true',
    REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE: 'live',
    ...overrides,
  })
}
