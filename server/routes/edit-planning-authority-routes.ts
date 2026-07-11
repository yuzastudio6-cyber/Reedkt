import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import {
  approveCanonicalEditPlanSchema,
  authorityWorkspaceQuerySchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import { validateBody } from '../validation/common-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createEditPlanningAuthorityRoutes(): Router {
  const router = Router()

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-plans',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(publishCanonicalEditPlanSchema, request.body)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).publishCanonicalPlan({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, { authority: result.authority }, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/edit-plans/:editPlanId/approve',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(approveCanonicalEditPlanSchema, request.body)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).approveAndFundCanonicalPlan({
        ...body,
        editPlanId: getRouteParam(request, 'editPlanId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, { authority: result.authority }, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/edit-plans/:editPlanId/authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(authorityWorkspaceQuerySchema, request.query)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).getCanonicalPlan(
        getRouteParam(request, 'editPlanId'),
        query.workspaceId,
      )
      sendOk(response, { authority: result.authority }, result.warnings)
    }),
  )

  router.get(
    '/v1/approved-snapshots/:snapshotId/authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(authorityWorkspaceQuerySchema, request.query)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).getApprovedSnapshot(
        getRouteParam(request, 'snapshotId'),
        query.workspaceId,
      )
      sendOk(response, { authority: result.authority }, result.warnings)
    }),
  )

  return router
}
