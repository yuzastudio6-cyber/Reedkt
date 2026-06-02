import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createObservabilityService } from '../services/observability-service'
import { validateBody, validateQuery } from '../validation/common-schemas'
import {
  abuseCheckBoundarySchema,
  abusePolicyPreviewSchema,
  abuseReadinessSchema,
  auditEventCreateBoundarySchema,
  auditEventListForProjectQuerySchema,
  auditEventListForWorkspaceQuerySchema,
  auditEventPreviewSchema,
  auditSummaryQuerySchema,
  costControlExecutionBlockedSchema,
  costControlPolicyPreviewSchema,
  costControlReadinessSchema,
  costControlUsageSummaryPreviewSchema,
  observabilityReadinessSchema,
  observabilityRequestTraceQuerySchema,
  observabilityRouteRiskSummaryQuerySchema,
  observabilityRuntimeStatusQuerySchema,
  operationalAlertPreviewSchema,
  operationalAlertReadinessSchema,
  rateLimitCheckBoundarySchema,
  rateLimitPolicyPreviewSchema,
  rateLimitReadinessSchema,
} from '../validation/observability-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createObservabilityRoutes(): Router {
  const router = Router()

  router.post('/v1/observability/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(observabilityReadinessSchema, request.body)
    const result = await createObservabilityService(getServiceContext(request)).checkReadiness(body, getIdempotencyKey(request))
    sendOk(response, { observability: result })
  }))

  router.get('/v1/observability/runtime-status', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(observabilityRuntimeStatusQuerySchema, request.query)
    const result = createObservabilityService(getServiceContext(request)).runtimeStatus(query)
    sendOk(response, { observability: result })
  }))

  router.get('/v1/observability/request-traces/:requestId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(observabilityRequestTraceQuerySchema, {
      ...request.query,
      requestId: getRouteParam(request, 'requestId'),
    })
    const result = createObservabilityService(getServiceContext(request)).requestTrace(query)
    sendOk(response, { observability: result })
  }))

  router.get('/v1/observability/route-risk-summary', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(observabilityRouteRiskSummaryQuerySchema, request.query)
    const result = createObservabilityService(getServiceContext(request)).routeRiskSummary(query)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/audit/event/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(auditEventPreviewSchema, request.body)
    const result = await createObservabilityService(getServiceContext(request)).auditEventPreview(body, getIdempotencyKey(request))
    sendOk(response, { observability: result })
  }))

  router.post('/v1/audit/event/create-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(auditEventCreateBoundarySchema, request.body)
    const result = await createObservabilityService(getServiceContext(request)).auditEventCreateBoundary(body, getIdempotencyKey(request))
    sendOk(response, { observability: result }, [], 202)
  }))

  router.get('/v1/projects/:projectId/audit-events', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(auditEventListForProjectQuerySchema, {
      ...request.query,
      projectId: getRouteParam(request, 'projectId'),
    })
    const result = await createObservabilityService(getServiceContext(request)).listAuditEventsForProject(query)
    sendOk(response, { observability: result })
  }))

  router.get('/v1/workspaces/:workspaceId/audit-events', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(auditEventListForWorkspaceQuerySchema, {
      ...request.query,
      workspaceId: getRouteParam(request, 'workspaceId'),
    })
    const result = createObservabilityService(getServiceContext(request)).listAuditEventsForWorkspace(query)
    sendOk(response, { observability: result })
  }))

  router.get('/v1/audit/summary', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(auditSummaryQuerySchema, request.query)
    const result = createObservabilityService(getServiceContext(request)).auditSummary(query)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/rate-limit/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(rateLimitReadinessSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).rateLimitReadiness(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/rate-limit/policy/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(rateLimitPolicyPreviewSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).rateLimitPolicyPreview(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/rate-limit/check-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(rateLimitCheckBoundarySchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).rateLimitCheckBoundary(body, getIdempotencyKey(request))
    sendOk(response, { observability: result }, [], 202)
  }))

  router.post('/v1/abuse/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(abuseReadinessSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).abuseReadiness(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/abuse/policy/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(abusePolicyPreviewSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).abusePolicyPreview(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/abuse/check-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(abuseCheckBoundarySchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).abuseCheckBoundary(body, getIdempotencyKey(request))
    sendOk(response, { observability: result }, [], 202)
  }))

  router.post('/v1/cost-control/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(costControlReadinessSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).costControlReadiness(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/cost-control/policy/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(costControlPolicyPreviewSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).costControlPolicyPreview(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/cost-control/usage-summary/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(costControlUsageSummaryPreviewSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).costControlUsageSummaryPreview(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/cost-control/execution-blocked', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(costControlExecutionBlockedSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).costControlExecutionBlocked(body, getIdempotencyKey(request))
    sendOk(response, { observability: result }, [], 409)
  }))

  router.post('/v1/operational-alert/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(operationalAlertReadinessSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).operationalAlertReadiness(body)
    sendOk(response, { observability: result })
  }))

  router.post('/v1/operational-alert/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(operationalAlertPreviewSchema, request.body)
    const result = createObservabilityService(getServiceContext(request)).operationalAlertPreview(body, getIdempotencyKey(request))
    sendOk(response, { observability: result })
  }))

  return router
}
