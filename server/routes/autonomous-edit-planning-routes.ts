import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createAutonomousEditPlanningService } from '../services/autonomous-edit-planning-service'
import { createAutonomousEditPlanSchema } from '../validation/autonomous-edit-planning-schemas'
import { validateBody } from '../validation/common-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createAutonomousEditPlanningRoutes(): Router {
  const router = Router()

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/autonomous-edit-plans',
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(createAutonomousEditPlanSchema, request.body)
      const attempt = await createAutonomousEditPlanningService(getServiceContext(request)).createPlan({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, { autonomousEditPlanningAttempt: attempt }, attempt.warnings, attempt.status === 'completed' ? 201 : 202)
    }),
  )

  return router
}
