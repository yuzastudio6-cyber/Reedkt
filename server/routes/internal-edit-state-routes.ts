import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency, requireSensitiveIdempotencyKey } from '../middleware/idempotency'
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

const migrateRetainedStorytellingWorkflowSchema = z.object({
  workspaceId: idSchema,
  editSessionId: idSchema,
  expectedHandoffUpdatedAt: z.string().datetime({ offset: true }),
}).strict()

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

  router.post(
    '/v1/projects/:projectId/internal-edit-state/migrate-motion-studio-storytelling',
    requireAuth,
    requireInternalEditStateMigrationAccess,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const body = validateBody(migrateRetainedStorytellingWorkflowSchema, request.body)
      const result = await createInternalEditStateService(getServiceContext(request))
        .migrateRetainedStorytellingWorkflow({
          ...body,
          projectId: getRouteParam(request, 'projectId'),
          idempotencyKey: getIdempotencyKey(request),
        })
      sendOk(response, {
        internalEditState: result.internalEditState,
        migrationReceipt: result.migrationReceipt,
      }, result.warnings)
    }),
  )

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

async function requireInternalEditStateMigrationAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(migrateRetainedStorytellingWorkflowSchema, request.body)
    const context = getServiceContext(request)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
    await createProjectService(context).getProject(getRouteParam(request, 'projectId'), body.workspaceId)
    next()
  } catch (error) {
    next(error)
  }
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
