import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createQaRevisionService } from '../services/qa-revision-service'
import {
  exportBlockersSchema,
  fallbackDecisionPlanSchema,
  fallbackDecisionReadQuerySchema,
  fallbackReadinessSchema,
  previewReviewCreateSchema,
  previewReviewListQuerySchema,
  previewReviewReadQuerySchema,
  qaBlockerResolveSchema,
  qaBlockersSchema,
  qaProjectListQuerySchema,
  qaReadinessSchema,
  qaReportCreateSchema,
  qaReportReadQuerySchema,
  repairPlanReadinessSchema,
  reviewCommentCreateSchema,
  reviewCommentListQuerySchema,
  revisionApprovalRequiredSchema,
  revisionEstimateReadinessSchema,
  revisionProjectListQuerySchema,
  revisionRequestCreateSchema,
  revisionRequestReadQuerySchema,
} from '../validation/qa-revision-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createQaRevisionRoutes(): Router {
  const router = Router()

  router.post('/v1/qa/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(qaReadinessSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkQaReadiness(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/qa/reports', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(qaReportCreateSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).createQaReportBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.get('/v1/qa/reports/:qaReportId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(qaReportReadQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).getQaReport({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      qaReportId: getRouteParam(request, 'qaReportId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/qa-reports', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(qaProjectListQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).listQaReportsForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/qa/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(qaBlockersSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).listQaBlockers(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/qa/blockers/resolve-boundary', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(qaBlockerResolveSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).resolveQaBlockerBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.post('/v1/preview/reviews', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(previewReviewCreateSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).createPreviewReviewBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.get('/v1/preview/reviews/:previewReviewId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(previewReviewReadQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).getPreviewReview({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      previewReviewId: getRouteParam(request, 'previewReviewId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.get('/v1/renders/:renderId/preview-reviews', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(previewReviewListQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).listPreviewReviewsForRender({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      renderId: getRouteParam(request, 'renderId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/review/comments', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(reviewCommentCreateSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).createReviewCommentBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.get('/v1/preview/reviews/:previewReviewId/comments', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(reviewCommentListQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).listReviewComments({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      previewReviewId: getRouteParam(request, 'previewReviewId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/revision/requests', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(revisionRequestCreateSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).createRevisionRequestBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.get('/v1/revision/requests/:revisionRequestId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(revisionRequestReadQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).getRevisionRequest({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      revisionRequestId: getRouteParam(request, 'revisionRequestId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/revision-requests', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(revisionProjectListQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).listRevisionRequestsForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/revision/estimate/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(revisionEstimateReadinessSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkRevisionEstimateReadiness(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/revision/approval/required', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(revisionApprovalRequiredSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkRevisionApprovalRequired(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/fallback/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(fallbackReadinessSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkFallbackReadiness(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/fallback/decisions/plan', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(fallbackDecisionPlanSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).planFallbackDecisionBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { qaRevision: result }, result.warnings, 202)
  }))

  router.get('/v1/fallback/decisions/:fallbackDecisionId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(fallbackDecisionReadQuerySchema, request.query)
    const result = await createQaRevisionService(getServiceContext(request)).getFallbackDecision({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      fallbackDecisionId: getRouteParam(request, 'fallbackDecisionId'),
    })
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/repair/plan/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(repairPlanReadinessSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkRepairPlanReadiness(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  router.post('/v1/export/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(exportBlockersSchema, request.body)
    const result = await createQaRevisionService(getServiceContext(request)).checkExportBlockers(body)
    sendOk(response, { qaRevision: result }, result.warnings)
  }))

  return router
}
