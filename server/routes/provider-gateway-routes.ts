import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { validateBody, validateQuery } from '../validation/common-schemas'
import {
  providerAttemptGetQuerySchema,
  providerAttemptListQuerySchema,
  providerBlockersSchema,
  providerCatalogGetQuerySchema,
  providerCatalogListQuerySchema,
  providerExecutionBlockedSchema,
  providerModelGetQuerySchema,
  providerModelsListQuerySchema,
  providerOutputReadinessSchema,
  providerReadinessSchema,
  providerRequestAttemptCreateBoundarySchema,
  providerRequestAttemptReadinessSchema,
  providerRequestEnvelopeSchema,
  providerRoutePreviewSchema,
  providerSecretReferenceSchema,
  providerWebhookReadinessSchema,
  providerWebhookReceiveBoundarySchema,
  providerWebhookSummaryQuerySchema,
} from '../validation/provider-gateway-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { createProviderGatewayService } from '../services/provider-gateway-service'

export function createProviderGatewayRoutes(): Router {
  const router = Router()

  router.post('/v1/providers/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerReadinessSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).checkReadiness(body)
    sendOk(response, { providerGateway: result })
  }))

  router.get('/v1/providers/catalog', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(providerCatalogListQuerySchema, request.query)
    const result = createProviderGatewayService(getServiceContext(request)).listCatalog(query.providerType)
    sendOk(response, { providerGateway: result })
  }))

  router.get('/v1/providers/catalog/:providerKey', requireAuth, asyncRoute(async (request, response) => {
    validateQuery(providerCatalogGetQuerySchema, request.query)
    const result = createProviderGatewayService(getServiceContext(request)).getCatalogProvider(getRouteParam(request, 'providerKey'))
    sendOk(response, { providerGateway: result })
  }))

  router.get('/v1/providers/models', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(providerModelsListQuerySchema, request.query)
    const result = createProviderGatewayService(getServiceContext(request)).listModels(query.providerKey, query.providerType)
    sendOk(response, { providerGateway: result })
  }))

  router.get('/v1/providers/models/:providerModelKey', requireAuth, asyncRoute(async (request, response) => {
    validateQuery(providerModelGetQuerySchema, request.query)
    const result = createProviderGatewayService(getServiceContext(request)).getModel(getRouteParam(request, 'providerModelKey'))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/secret-reference/check', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerSecretReferenceSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).checkSecretReference(body)
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/route/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRoutePreviewSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).previewRoute(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/request-envelope/validate', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRequestEnvelopeSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).validateRequestEnvelope(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/request-attempt/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRequestAttemptReadinessSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).checkRequestAttemptReadiness(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/request-attempt/create-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRequestAttemptCreateBoundarySchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).createRequestAttemptBoundary(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result }, [], 202)
  }))

  router.post('/v1/provider-gateway/requests', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRequestAttemptCreateBoundarySchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).createRequestAttemptBoundary(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result }, ['Legacy provider-gateway path is mapped to Prompt 15 create-boundary behavior.'], 202)
  }))

  router.get('/v1/providers/request-attempts/:providerAttemptId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(providerAttemptGetQuerySchema, {
      ...request.query,
      providerAttemptId: getRouteParam(request, 'providerAttemptId'),
    })
    const result = await createProviderGatewayService(getServiceContext(request)).getRequestAttempt(query)
    sendOk(response, { providerGateway: result })
  }))

  router.get('/v1/projects/:projectId/provider-request-attempts', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(providerAttemptListQuerySchema, request.query)
    const result = await createProviderGatewayService(getServiceContext(request)).listRequestAttemptsForProject({
      ...query,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/webhook/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerWebhookReadinessSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).checkWebhookReadiness(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/webhooks/:provider/receive-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerWebhookReceiveBoundarySchema, {
      ...request.body,
      providerKey: getRouteParam(request, 'provider'),
    })
    const result = await createProviderGatewayService(getServiceContext(request)).receiveWebhookBoundary(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result }, [], 202)
  }))

  router.post('/v1/provider-gateway/webhooks/:provider', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerWebhookReceiveBoundarySchema, {
      ...request.body,
      providerKey: getRouteParam(request, 'provider'),
    })
    const result = await createProviderGatewayService(getServiceContext(request)).receiveWebhookBoundary(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result }, ['Legacy provider-gateway webhook path is mapped to Prompt 15 receive-boundary behavior.'], 202)
  }))

  router.get('/v1/providers/webhooks/:providerWebhookEventId/summary', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(providerWebhookSummaryQuerySchema, {
      ...request.query,
      providerWebhookEventId: getRouteParam(request, 'providerWebhookEventId'),
    })
    const result = await createProviderGatewayService(getServiceContext(request)).getWebhookSummary(query)
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/output/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerOutputReadinessSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).checkOutputReadiness(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/execution/blocked', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerExecutionBlockedSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).executionBlocked(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  router.post('/v1/providers/blockers', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerBlockersSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).blockers(body, getIdempotencyKey(request))
    sendOk(response, { providerGateway: result })
  }))

  return router
}
