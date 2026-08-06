import { Router, type NextFunction, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectService } from '../services/project-service'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { z } from 'zod'

const createProjectSchema = z.object({
  workspaceId: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
})

export function createProjectRoutes(): Router {
  const router = Router()

  router.post('/v1/projects', requireAuth, requireProjectCreateAccess, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createProjectSchema, request.body)
    const result = await createProjectService(getServiceContext(request)).createProject(body)
    sendOk(response, { project: result.project }, result.warnings, 201)
  }))

  router.get('/v1/projects', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = typeof request.query.workspaceId === 'string'
      ? idSchema.parse(request.query.workspaceId)
      : idSchema.parse('')
    const result = await createProjectService(getServiceContext(request)).listProjects(workspaceId)
    sendOk(response, { projects: result.projects }, result.warnings)
  }))

  router.get('/v1/projects/:projectId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = typeof request.query.workspaceId === 'string'
      ? idSchema.parse(request.query.workspaceId)
      : idSchema.parse('')
    const result = await createProjectService(getServiceContext(request)).getProject(
      getRouteParam(request, 'projectId'),
      workspaceId,
    )
    sendOk(response, { project: result.project }, result.warnings)
  }))

  return router
}

async function requireProjectCreateAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(createProjectSchema, request.body)
    await authorizeWorkspaceAccess(getServiceContext(request), body.workspaceId, 'write')
    next()
  } catch (error) {
    next(error)
  }
}
