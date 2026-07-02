import { Router } from 'express'

import { requireAuth } from '../middleware/auth'
import {
  buildCreditAuditTimeline,
  buildCreditBetaReadinessEvidenceReport,
  buildCreditSupportReceipt,
  buildStripeBillingTraceSummary,
  CREDIT_AUDIT_ROUTE_WARNINGS,
} from '../services/credit-audit-service'
import {
  sharedMockCreditDataStore,
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'
import { sharedMockStripeBillingStore } from '../services/stripe-billing-foundation-service'
import {
  creditAuditBetaReadinessQuerySchema,
  creditAuditReceiptQuerySchema,
  creditAuditStripeTraceQuerySchema,
  creditAuditTimelineQuerySchema,
  validateCreditAuditQuery,
} from '../validation/credit-audit-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

const stores = {
  estimateStore: sharedMockCreditEstimateStore,
  reservationStore: sharedMockCreditReservationStore,
  creditDataStore: sharedMockCreditDataStore,
  stripeBillingStore: sharedMockStripeBillingStore,
}

export function createCreditAuditRoutes(): Router {
  const router = Router()

  router.get('/v1/credit-audit/projects/:projectId/timeline', requireAuth, asyncRoute(async (request, response) => {
    const query = validateCreditAuditQuery(creditAuditTimelineQuerySchema, request.query)
    const timeline = buildCreditAuditTimeline(stores, {
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
      includeStripeTrace: query.includeStripeTrace,
      includeToolEvents: query.includeToolEvents,
    })
    sendOk(response, { timeline }, [...CREDIT_AUDIT_ROUTE_WARNINGS, ...timeline.warnings])
  }))

  router.get('/v1/credit-audit/wallets/:creditWalletId/timeline', requireAuth, asyncRoute(async (request, response) => {
    const query = validateCreditAuditQuery(creditAuditTimelineQuerySchema, request.query)
    const timeline = buildCreditAuditTimeline(stores, {
      workspaceId: query.workspaceId,
      creditWalletId: getRouteParam(request, 'creditWalletId'),
      includeStripeTrace: query.includeStripeTrace,
      includeToolEvents: query.includeToolEvents,
    })
    sendOk(response, { timeline }, [...CREDIT_AUDIT_ROUTE_WARNINGS, ...timeline.warnings])
  }))

  router.get('/v1/credit-audit/settlements/:creditSettlementId/receipt', requireAuth, asyncRoute(async (request, response) => {
    const query = validateCreditAuditQuery(creditAuditReceiptQuerySchema, request.query)
    const receipt = buildCreditSupportReceipt(stores, {
      creditSettlementId: getRouteParam(request, 'creditSettlementId'),
      workspaceId: query.workspaceId,
      includeToolEvents: query.includeToolEvents,
    })
    sendOk(response, {
      receipt,
      warnings: receipt?.warnings ?? ['Credit settlement was not found in the mock audit stores.'],
    }, [...CREDIT_AUDIT_ROUTE_WARNINGS, ...(receipt?.warnings ?? [])])
  }))

  router.get('/v1/credit-audit/wallets/:creditWalletId/stripe-trace', requireAuth, asyncRoute(async (request, response) => {
    const query = validateCreditAuditQuery(creditAuditStripeTraceQuerySchema, request.query)
    const stripeTrace = buildStripeBillingTraceSummary(stores, {
      workspaceId: query.workspaceId,
      creditWalletId: getRouteParam(request, 'creditWalletId'),
    })
    sendOk(response, { stripeTrace }, [...CREDIT_AUDIT_ROUTE_WARNINGS, ...stripeTrace.warnings])
  }))

  router.get('/v1/credit-audit/beta-readiness', requireAuth, asyncRoute(async (request, response) => {
    validateCreditAuditQuery(creditAuditBetaReadinessQuerySchema, request.query)
    const report = buildCreditBetaReadinessEvidenceReport()
    sendOk(response, { report }, CREDIT_AUDIT_ROUTE_WARNINGS)
  }))

  return router
}
