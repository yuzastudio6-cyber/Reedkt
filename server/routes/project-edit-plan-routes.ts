import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectEditPlanService } from '../services/project-edit-plan-service'
import { createAutonomousEditPrivateReviewService } from '../services/autonomous-edit-private-review-service'
import {
  activateApprovedLocalEditPlanSchema,
  createApprovedLocalEditPlanSchema,
} from '../validation/project-edit-plan-schemas'
import { validateBody } from '../validation/common-schemas'
import { ApiError } from '../errors/api-error'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createProjectEditPlanRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/edit-sessions/:editSessionId/local-edit-plans', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedLocalEditPlanSchema, request.body)
    const result = await createProjectEditPlanService(getServiceContext(request)).createApprovedLocalEditPlan({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      editSessionId: getRouteParam(request, 'editSessionId'),
    })
    sendOk(response, { localEditPlan: result.localEditPlan }, result.warnings, 201)
  }))

  router.get('/v1/local-edit-plans/:planId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createProjectEditPlanService(getServiceContext(request)).getApprovedLocalEditPlan(
      getRouteParam(request, 'planId'),
      workspaceId,
    )
    sendOk(response, { localEditPlan: result.localEditPlan, executionGate: result.executionGate }, result.warnings)
  }))

  router.post('/v1/local-edit-plans/:planId/activate', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(activateApprovedLocalEditPlanSchema, request.body)
    const result = await createProjectEditPlanService(getServiceContext(request)).activateApprovedLocalEditPlan(
      getRouteParam(request, 'planId'),
      body.workspaceId,
    )
    sendOk(response, { executionGate: result.executionGate }, result.warnings, 201)
  }))

  router.post('/v1/local-edit-plans/:planId/private-review-executions', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(activateApprovedLocalEditPlanSchema, request.body)
    const result = await createAutonomousEditPrivateReviewService(getServiceContext(request)).startExecution(
      getRouteParam(request, 'planId'),
      body.workspaceId,
    )
    sendOk(response, { execution: result.execution, replayed: result.replayed }, [], result.replayed ? 200 : 202)
  }))

  router.get('/v1/local-edit-plans/:planId/private-review-execution', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)
    const result = await createAutonomousEditPrivateReviewService(getServiceContext(request)).getExecution(
      getRouteParam(request, 'planId'),
      workspaceId,
    )
    sendOk(response, { execution: result.execution })
  }))

  return router
}
