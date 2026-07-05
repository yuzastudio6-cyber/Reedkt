import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectEditSessionService } from '../services/project-edit-session-service'
import { validateBody } from '../validation/common-schemas'
import {
  createProjectEditSessionSchema,
  projectEditSessionLifecycleCheckpointSchema,
} from '../validation/project-edit-session-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createProjectEditSessionRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/edit-sessions', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createProjectEditSessionSchema, request.body)
    const result = await createProjectEditSessionService(getServiceContext(request)).createProjectEditSession({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { editSession: result.editSession }, result.warnings, 201)
  }))

  router.get('/v1/projects/:projectId/edit-sessions', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createProjectEditSessionService(getServiceContext(request)).listProjectEditSessions({
      projectId: getRouteParam(request, 'projectId'),
      workspaceId,
    })
    sendOk(response, { editSessions: result.editSessions }, result.warnings)
  }))

  router.get('/v1/edit-sessions/:editSessionId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createProjectEditSessionService(getServiceContext(request)).getProjectEditSession(
      getRouteParam(request, 'editSessionId'),
      workspaceId,
    )
    sendOk(response, { editSession: result.editSession }, result.warnings)
  }))

  router.post('/v1/edit-sessions/:editSessionId/lifecycle-checkpoints', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(projectEditSessionLifecycleCheckpointSchema, request.body)
    const result = await createProjectEditSessionService(getServiceContext(request)).recordProjectEditSessionLifecycleCheckpoint({
      ...body,
      editSessionId: getRouteParam(request, 'editSessionId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { editSession: result.editSession }, result.warnings, 201)
  }))

  return router
}
