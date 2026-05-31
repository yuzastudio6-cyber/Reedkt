import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createProjectService } from '../services/project-service'
import { projectAccessCheckSchema } from '../validation/auth-workspace-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createProjectRoutes(): Router {
  const router = Router()

  router.post('/v1/projects', requireAuth, asyncRoute(async (request) => {
    await createProjectService(getServiceContext(request)).createProject()
  }))

  router.get('/v1/projects/:projectId', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(projectAccessCheckSchema, { projectId: getRouteParam(request, 'projectId') })
    const result = await createProjectService(getServiceContext(request)).getProject(body.projectId)
    sendOk(response, {
      status: result.status,
      hasAccess: result.hasAccess,
      project: result.project,
      membership: result.membership,
    }, result.warnings)
  }))

  router.post('/v1/projects/access/check', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(projectAccessCheckSchema, request.body)
    const result = await createProjectService(getServiceContext(request)).checkProjectAccess(body.projectId)
    sendOk(response, {
      status: result.status,
      hasAccess: result.hasAccess,
      project: result.project,
      membership: result.membership,
    }, result.warnings)
  }))

  return router
}
