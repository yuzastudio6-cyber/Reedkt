import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createApprovedSnapshotService } from '../services/approved-snapshot-service'
import { createApprovedSnapshotSchema } from '../validation/approval-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createApprovalRoutes(): Router {
  const router = Router()

  router.post('/v1/edit-plans/:editPlanId/approved-snapshots', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedSnapshotSchema, request.body)
    const result = await createApprovedSnapshotService(getServiceContext(request)).createApprovedSnapshot({
      ...body,
      editPlanId: getRouteParam(request, 'editPlanId'),
    })
    sendOk(response, { approvedPlanSnapshot: result.approvedPlanSnapshot }, result.warnings, 201)
  }))

  router.get('/v1/approved-snapshots/:snapshotId', requireAuth, asyncRoute(async (request, response) => {
    const result = await createApprovedSnapshotService(getServiceContext(request)).getApprovedSnapshot(getRouteParam(request, 'snapshotId'))
    sendOk(response, { approvedPlanSnapshot: result.approvedPlanSnapshot }, result.warnings)
  }))

  return router
}
