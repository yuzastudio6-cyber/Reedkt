import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { requireProjectAccess } from '../middleware/project-access'
import { createEditReferenceTargetVideoUnderstandingService } from '../services/edit-reference-target-video-understanding-service'
import { validateBody } from '../validation/common-schemas'
import {
  readEditReferenceTargetVideoUnderstandingSchema,
  startEditReferenceTargetVideoUnderstandingSchema,
} from '../validation/edit-reference-target-video-understanding-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createEditReferenceTargetVideoUnderstandingRoutes(): Router {
  const router = Router()
  const route = '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-reference-target-understanding'

  router.post(
    route,
    requireAuth,
    requireProjectAccess('write'),
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(startEditReferenceTargetVideoUnderstandingSchema, request.body)
      const result = await createEditReferenceTargetVideoUnderstandingService(getServiceContext(request)).start({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(
        response,
        {
          targetVideoUnderstandingPackage: result.package,
          schedule: result.schedule,
          persistence: result.persistence,
          replayed: result.replayed,
          productReady: result.productReady,
        },
        [...result.warnings],
        result.package.status === 'ready' ? 201 : 202,
      )
    }),
  )

  router.get(
    route,
    requireAuth,
    requireProjectAccess('read'),
    asyncRoute(async (request, response) => {
      const query = validateBody(readEditReferenceTargetVideoUnderstandingSchema, request.query)
      const result = await createEditReferenceTargetVideoUnderstandingService(getServiceContext(request)).readLatest({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
      })
      sendOk(response, {
        targetVideoUnderstandingPackage: result.package,
        schedule: result.schedule,
        persistence: result.persistence,
        replayed: result.replayed,
        productReady: result.productReady,
      }, [...result.warnings])
    }),
  )

  return router
}
