import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createInternalEditStateService } from '../services/internal-edit-state-service'
import { createProjectService } from '../services/project-service'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

const saveInternalEditStateSchema = z.object({
  workspaceId: idSchema,
  editSessionId: idSchema,
  handoff: z.record(z.string(), z.unknown()),
})

export function createInternalEditStateRoutes(): Router {
  const router = Router()

  router.put('/v1/projects/:projectId/internal-edit-state', requireAuth, requireInternalEditStateWriteAccess, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(saveInternalEditStateSchema, request.body)
    const result = await createInternalEditStateService(getServiceContext(request)).saveInternalEditState({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { internalEditState: result.internalEditState }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/internal-edit-state', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = typeof request.query.workspaceId === 'string' ? idSchema.parse(request.query.workspaceId) : idSchema.parse('')
    const editSessionId = typeof request.query.editSessionId === 'string'
      ? idSchema.parse(request.query.editSessionId)
      : undefined
    const result = await createInternalEditStateService(getServiceContext(request)).getInternalEditState(
      workspaceId,
      getRouteParam(request, 'projectId'),
      editSessionId,
    )
    sendOk(response, { internalEditState: result.internalEditState }, result.warnings)
  }))

  router.get('/v1/internal-edit-states', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = typeof request.query.workspaceId === 'string' ? request.query.workspaceId : ''
    const parsedWorkspaceId = idSchema.parse(workspaceId)
    const result = await createInternalEditStateService(getServiceContext(request)).listInternalEditStates(parsedWorkspaceId)
    sendOk(response, { internalEditStates: result.internalEditStates }, result.warnings)
  }))

  return router
}

async function requireInternalEditStateWriteAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(saveInternalEditStateSchema, request.body)
    const context = getServiceContext(request)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
    await createProjectService(context).getProject(getRouteParam(request, 'projectId'), body.workspaceId)
    next()
  } catch (error) {
    next(error)
  }
}
