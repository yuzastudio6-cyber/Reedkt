import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createAuthService } from '../services/auth-service'
import {
  ensureProfileSchema,
  ensureWorkspaceSchema,
  workspaceMembershipCheckSchema,
} from '../validation/auth-workspace-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export function createAuthRoutes(): Router {
  const router = Router()

  router.get('/v1/auth/bootstrap/status', asyncRoute(async (request, response) => {
    const result = createAuthService(getServiceContext(request)).getBootstrapStatus()
    sendOk(response, { bootstrapStatus: result }, result.warnings)
  }))

  router.get('/v1/auth/current-user', requireAuth, asyncRoute(async (request, response) => {
    const result = createAuthService(getServiceContext(request)).getCurrentUserSummary()
    sendOk(response, { user: result })
  }))

  router.post('/v1/auth/profile/ensure', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(ensureProfileSchema, request.body ?? {})
    const result = await createAuthService(getServiceContext(request)).ensureProfile(body)
    sendOk(response, {
      status: result.status,
      available: result.available,
      profile: result.profile,
      user: result.user,
    }, result.warnings)
  }))

  router.post('/v1/auth/workspace/ensure', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(ensureWorkspaceSchema, request.body ?? {})
    const result = await createAuthService(getServiceContext(request)).ensureWorkspace(body)
    sendOk(response, {
      status: result.status,
      available: result.available,
      workspace: result.workspace,
      membership: result.membership,
    }, result.warnings)
  }))

  router.get('/v1/auth/workspace/current', requireAuth, asyncRoute(async (request, response) => {
    const result = await createAuthService(getServiceContext(request)).getCurrentWorkspace()
    sendOk(response, {
      status: result.status,
      available: result.available,
      workspace: result.workspace,
      membership: result.membership,
    }, result.warnings)
  }))

  router.post('/v1/workspaces/membership/check', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(workspaceMembershipCheckSchema, request.body)
    const result = await createAuthService(getServiceContext(request)).checkWorkspaceMembership(body.workspaceId)
    sendOk(response, {
      status: result.status,
      available: result.available,
      hasAccess: result.hasAccess,
      workspace: result.workspace,
      membership: result.membership,
    }, result.warnings)
  }))

  return router
}
