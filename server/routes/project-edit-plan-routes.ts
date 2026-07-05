import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectEditPlanService } from '../services/project-edit-plan-service'
import { createApprovedLocalEditPlanSchema } from '../validation/project-edit-plan-schemas'
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
    sendOk(response, { localEditPlan: result.localEditPlan }, result.warnings)
  }))

  return router
}
