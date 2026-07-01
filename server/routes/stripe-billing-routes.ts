import { raw, Router } from 'express'

import type {
  CreateStripeCreditCheckoutSessionRequest,
  CreateStripeSetupIntentRequest,
  CreateStripeWebhookMockRequest,
} from '../../src/types'
import { requireAuth } from '../middleware/auth'
import {
  DisabledSecretValueProvider,
  EnvironmentSecretValueProvider,
  createMockStripeCheckoutSession,
  createMockStripeSetupIntent,
  createMockStripeWebhookEvent,
  evaluateStripeLiveReadiness,
  getStripeConfigStatus,
  sharedMockStripeBillingStore,
  STRIPE_FOUNDATION_WARNINGS,
} from '../services/stripe-billing-foundation-service'
import { sharedMockCreditReservationStore } from '../services/mock-credit-foundation-stores'
import {
  createStripeTestCheckoutSession,
  createStripeTestSetupIntent,
  evaluateStripeTestReadiness,
  FetchStripeTestClient,
  processStripeTestWebhook,
} from '../services/stripe-testmode-service'
import { validateBody } from '../validation/common-schemas'
import {
  createStripeCreditCheckoutSessionSchema,
  createStripeSetupIntentSchema,
  createStripeTestCreditCheckoutSessionSchema,
  createStripeTestSetupIntentSchema,
  createStripeWebhookMockSchema,
} from '../validation/stripe-billing-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'
import type { RuntimeEnv } from '../config/env'

export function createStripeBillingRoutes(): Router {
  const router = Router()

  router.get('/v1/billing/stripe/config/status', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const result = getStripeConfigStatus(context.env.stripeBilling)
    sendOk(response, { stripeBilling: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings])
  }))

  router.get('/v1/billing/stripe/live-readiness', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const result = evaluateStripeLiveReadiness(context.env.stripeBilling)
    sendOk(response, { stripeLiveReadiness: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings])
  }))

  router.get('/v1/billing/stripe/test-readiness', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const result = evaluateStripeTestReadiness(context.env.stripeBilling)
    sendOk(response, { stripeTestReadiness: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings])
  }))

  router.post('/v1/billing/stripe/setup-intents/mock', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeSetupIntentSchema, request.body) as CreateStripeSetupIntentRequest
    const result = createMockStripeSetupIntent(sharedMockStripeBillingStore, context.env.stripeBilling, body)
    sendOk(response, { stripeSetupIntent: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'created' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/billing/stripe/setup-intents/test', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeTestSetupIntentSchema, request.body) as CreateStripeSetupIntentRequest
    const provider = createRouteSecretProvider(context.env)
    const result = await createStripeTestSetupIntent(
      sharedMockStripeBillingStore,
      context.env.stripeBilling,
      new FetchStripeTestClient(provider, context.env.stripeBilling.secretKeySecretName ?? ''),
      provider,
      body,
    )
    sendOk(response, { stripeSetupIntent: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'created' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/billing/stripe/checkout-sessions/mock', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeCreditCheckoutSessionSchema, request.body) as CreateStripeCreditCheckoutSessionRequest
    const result = createMockStripeCheckoutSession(
      sharedMockStripeBillingStore,
      sharedMockCreditReservationStore,
      context.env.stripeBilling,
      body,
    )
    sendOk(response, { stripeCheckoutSession: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'created' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/billing/stripe/checkout-sessions/test', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeTestCreditCheckoutSessionSchema, request.body) as CreateStripeCreditCheckoutSessionRequest
    const provider = createRouteSecretProvider(context.env)
    const result = await createStripeTestCheckoutSession(
      sharedMockStripeBillingStore,
      sharedMockCreditReservationStore,
      context.env.stripeBilling,
      new FetchStripeTestClient(provider, context.env.stripeBilling.secretKeySecretName ?? ''),
      body,
    )
    sendOk(response, { stripeCheckoutSession: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'created' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/billing/stripe/webhooks/mock', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeWebhookMockSchema, request.body) as CreateStripeWebhookMockRequest
    const result = createMockStripeWebhookEvent(sharedMockStripeBillingStore, context.env.stripeBilling, body)
    sendOk(response, { stripeWebhook: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'verified' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  return router
}

export function createStripeBillingRawWebhookRoutes(): Router {
  const router = Router()

  router.post('/v1/billing/stripe/webhooks/test', raw({ type: 'application/json', limit: '1mb' }), asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const provider = createRouteSecretProvider(context.env)
    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from('')
    const result = await processStripeTestWebhook(
      sharedMockStripeBillingStore,
      sharedMockCreditReservationStore,
      context.env.stripeBilling,
      new FetchStripeTestClient(provider, context.env.stripeBilling.secretKeySecretName ?? ''),
      provider,
      {
        rawBody,
        stripeSignatureHeader: request.header('stripe-signature') ?? null,
      },
    )
    sendOk(response, { stripeWebhook: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'processed' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  return router
}

function createRouteSecretProvider(env: RuntimeEnv) {
  if (env.stripeBilling.secretSource === 'environment_variable') return new EnvironmentSecretValueProvider()
  return new DisabledSecretValueProvider()
}
