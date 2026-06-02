import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createComplianceService } from '../services/compliance-service'
import { validateBody, validateQuery } from '../validation/common-schemas'
import {
  complianceAuditSummaryQuerySchema,
  complianceBlockersSchema,
  complianceDependencyReadinessSchema,
  complianceLicenseReadinessSchema,
  complianceProductionUnlockBlockedSchema,
  complianceReadinessSchema,
  complianceReviewCreateBoundarySchema,
  complianceReviewGetQuerySchema,
  complianceReviewListForSubjectQuerySchema,
  complianceReviewPreviewSchema,
  complianceSecurityReadinessSchema,
  complianceSubjectGetQuerySchema,
  complianceSubjectsListQuerySchema,
  complianceRuntimeApprovalReadinessSchema,
  reviewSubjectTypeSchema,
} from '../validation/compliance-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createComplianceRoutes(): Router {
  const router = Router()

  router.post('/v1/compliance/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceReadinessSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).checkReadiness(body)
    sendOk(response, { compliance: result })
  }))

  router.get('/v1/compliance/subjects', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(complianceSubjectsListQuerySchema, request.query)
    const result = createComplianceService(getServiceContext(request)).listSubjects(query)
    sendOk(response, { compliance: result })
  }))

  router.get('/v1/compliance/subjects/:reviewSubjectType/:reviewSubjectKey/reviews', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(complianceReviewListForSubjectQuerySchema, request.query)
    const reviewSubjectType = validateBody(reviewSubjectTypeSchema, getRouteParam(request, 'reviewSubjectType'))
    const result = createComplianceService(getServiceContext(request)).listReviewsForSubject({
      ...query,
      reviewSubjectType,
      reviewSubjectKey: getRouteParam(request, 'reviewSubjectKey'),
    })
    sendOk(response, { compliance: result })
  }))

  router.get('/v1/compliance/subjects/:reviewSubjectType/:reviewSubjectKey', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(complianceSubjectGetQuerySchema, request.query)
    const reviewSubjectType = validateBody(reviewSubjectTypeSchema, getRouteParam(request, 'reviewSubjectType'))
    const result = createComplianceService(getServiceContext(request)).getSubject({
      ...query,
      reviewSubjectType,
      reviewSubjectKey: getRouteParam(request, 'reviewSubjectKey'),
    })
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/review/preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceReviewPreviewSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).previewReview(body, getIdempotencyKey(request))
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/review/create-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceReviewCreateBoundarySchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).createReviewBoundary(body, getIdempotencyKey(request))
    sendOk(response, { compliance: result }, [], 202)
  }))

  router.get('/v1/compliance/reviews/:complianceReviewId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(complianceReviewGetQuerySchema, {
      ...request.query,
      complianceReviewId: getRouteParam(request, 'complianceReviewId'),
    })
    const result = createComplianceService(getServiceContext(request)).getReview(query)
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/blockers', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceBlockersSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).blockers(body, getIdempotencyKey(request))
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/license/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceLicenseReadinessSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).categoryReadiness(body, 'license')
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/security/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceSecurityReadinessSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).categoryReadiness(body, 'security')
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/dependency/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceDependencyReadinessSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).categoryReadiness(body, 'dependency')
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/runtime-approval/readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceRuntimeApprovalReadinessSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).categoryReadiness(body, 'runtime_isolation')
    sendOk(response, { compliance: result })
  }))

  router.post('/v1/compliance/production-unlock/blocked', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(complianceProductionUnlockBlockedSchema, request.body)
    const result = await createComplianceService(getServiceContext(request)).productionUnlockBlocked(body, getIdempotencyKey(request))
    sendOk(response, { compliance: result }, [], 409)
  }))

  router.get('/v1/compliance/audit-summary', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(complianceAuditSummaryQuerySchema, request.query)
    const result = createComplianceService(getServiceContext(request)).auditSummary(query)
    sendOk(response, { compliance: result })
  }))

  return router
}
