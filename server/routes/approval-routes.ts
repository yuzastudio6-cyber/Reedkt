import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { createApprovedSnapshotService } from '../services/approved-snapshot-service'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createApprovalRoutes(): Router {
  const router = Router()

  router.post('/v1/edit-plans/:editPlanId/approved-snapshots', requireAuth, asyncRoute(async () => {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Caller-authored approved snapshots are disabled. Approve the server-owned canonical plan instead.',
      503,
      {
        replacementRoute: '/v1/edit-plans/:editPlanId/approve',
        requiredGate: 'server_owned_canonical_plan_authority',
      },
    )
  }))

  router.get('/v1/approved-snapshots/:snapshotId', requireAuth, asyncRoute(async (request, response) => {
    const result = await createApprovedSnapshotService(getServiceContext(request)).getApprovedSnapshot(getRouteParam(request, 'snapshotId'))
    sendOk(response, { approvedPlanSnapshot: result.approvedPlanSnapshot }, result.warnings)
  }))

  return router
}
