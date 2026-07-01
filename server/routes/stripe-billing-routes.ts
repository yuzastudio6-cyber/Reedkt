import { Router } from 'express'

import type {
  CreateStripeCreditCheckoutSessionRequest,
  CreateStripeSetupIntentRequest,
  CreateStripeWebhookMockRequest,
} from '../../src/types'
import { requireAuth } from '../middleware/auth'
import {
  createMockStripeCheckoutSession,
  createMockStripeSetupIntent,
  createMockStripeWebhookEvent,
  evaluateStripeLiveReadiness,
  getStripeConfigStatus,
  sharedMockStripeBillingStore,
  STRIPE_FOUNDATION_WARNINGS,
} from '../services/stripe-billing-foundation-service'
import { sharedMockCreditReservationStore } from '../services/mock-credit-foundation-stores'
import { validateBody } from '../validation/common-schemas'
import {
  createStripeCreditCheckoutSessionSchema,
  createStripeSetupIntentSchema,
  createStripeWebhookMockSchema,
} from '../validation/stripe-billing-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

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

  router.post('/v1/billing/stripe/setup-intents/mock', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeSetupIntentSchema, request.body) as CreateStripeSetupIntentRequest
    const result = createMockStripeSetupIntent(sharedMockStripeBillingStore, context.env.stripeBilling, body)
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

  router.post('/v1/billing/stripe/webhooks/mock', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const body = validateBody(createStripeWebhookMockSchema, request.body) as CreateStripeWebhookMockRequest
    const result = createMockStripeWebhookEvent(sharedMockStripeBillingStore, context.env.stripeBilling, body)
    sendOk(response, { stripeWebhook: result }, [...STRIPE_FOUNDATION_WARNINGS, ...result.warnings], result.status === 'verified' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  return router
}
