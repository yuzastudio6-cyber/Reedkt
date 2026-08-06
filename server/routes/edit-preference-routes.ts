import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { createEditPreferenceService } from '../services/edit-preference-service'
import { validateBody } from '../validation/common-schemas'
import {
  preferenceScopeIdSchema,
  upsertEditPreferencesSchema,
} from '../validation/edit-preference-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
} from './route-helpers'

export function createEditPreferenceRoutes(): Router {
  const router = Router()

  router.get(
    '/v1/workspaces/:workspaceId/edit-preferences/current',
    requireAuth,
    asyncRoute(async (request, response) => {
      const workspaceId = parseWorkspaceId(getRouteParam(request, 'workspaceId'))
      const result = await createEditPreferenceService(getServiceContext(request)).getCurrent(workspaceId)
      response.status(200).json({
        ok: true,
        data: {
          persistenceCapability: result.persistenceCapability,
          preferenceRecord: result.preferenceRecord,
        },
        warnings: result.warnings,
        mockOnly: result.mockOnly,
      })
    }),
  )

  router.put(
    '/v1/workspaces/:workspaceId/edit-preferences/current',
    requireAuth,
    asyncRoute(async (request, response) => {
      const workspaceId = parseWorkspaceId(getRouteParam(request, 'workspaceId'))
      const body = validateBody(upsertEditPreferencesSchema, request.body)
      if (body.workspaceId !== workspaceId) {
        throw new ApiError('VALIDATION_FAILED', 'Body workspaceId must match the route workspace.', 400)
      }
      const result = await createEditPreferenceService(getServiceContext(request)).upsertCurrent({
        ...body,
        idempotencyKey: getIdempotencyKey(request),
      })
      response.status(200).json({
        ok: true,
        data: {
          persistenceCapability: result.persistenceCapability,
          preferenceRecord: result.preferenceRecord,
        },
        warnings: result.warnings,
        mockOnly: result.mockOnly,
      })
    }),
  )

  return router
}

function parseWorkspaceId(value: string): string {
  const parsed = preferenceScopeIdSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'A safe workspace route id is required.', 400)
  }
  return parsed.data
}
