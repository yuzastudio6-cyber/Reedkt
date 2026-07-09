import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectService } from '../services/project-service'
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

  router.post('/v1/projects', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createProjectSchema, request.body)
    const result = await createProjectService(getServiceContext(request)).createProject(body)
    sendOk(response, { project: result.project }, result.warnings, 201)
  }))

  router.get('/v1/projects', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) {
      response.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'workspaceId query parameter is required.',
        },
      })
      return
    }

    const result = await createProjectService(getServiceContext(request)).listProjects(workspaceId)
    sendOk(response, { projects: result.projects }, result.warnings)
  }))

  router.get('/v1/projects/:projectId', requireAuth, asyncRoute(async (request, response) => {
    const result = await createProjectService(getServiceContext(request)).getProject(getRouteParam(request, 'projectId'))
    sendOk(response, { project: result.project }, result.warnings)
  }))

  return router
}
