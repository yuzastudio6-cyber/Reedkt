import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectEditBriefLocalService } from '../services/project-edit-brief-local-service'
import { validateBody } from '../validation/common-schemas'
import { saveProjectEditBriefLocalSchema } from '../validation/project-edit-brief-local-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createProjectEditBriefLocalRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/edit-sessions/:editSessionId/local-brief', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(saveProjectEditBriefLocalSchema, request.body)
    const result = await createProjectEditBriefLocalService(getServiceContext(request)).saveProjectEditBrief({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      editSessionId: getRouteParam(request, 'editSessionId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { editBrief: result.editBrief }, result.warnings, 201)
  }))

  router.get('/v1/projects/:projectId/edit-sessions/:editSessionId/local-brief', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createProjectEditBriefLocalService(getServiceContext(request)).getProjectEditBriefForSession({
      workspaceId,
      projectId: getRouteParam(request, 'projectId'),
      editSessionId: getRouteParam(request, 'editSessionId'),
    })
    sendOk(response, { editBrief: result.editBrief }, result.warnings)
  }))

  return router
}
