import { Router, type Request } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createApprovedSnapshotService } from '../services/approved-snapshot-service'
import {
  approvedSnapshotReadinessSchema,
  createApprovedSnapshotSchema,
  getApprovedSnapshotQuerySchema,
  listApprovedSnapshotsQuerySchema,
  verifyApprovedSnapshotIntegritySchema,
} from '../validation/approved-snapshot-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

function getOptionalIdempotencyKey(request: Request): string | undefined {
  const value = request.get('Idempotency-Key')
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function createApprovalRoutes(): Router {
  const router = Router()

  router.post('/v1/edit-plans/:editPlanId/approved-snapshots/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(approvedSnapshotReadinessSchema, request.body)
    const result = await createApprovedSnapshotService(getServiceContext(request)).checkSnapshotReadiness({
      ...body,
      editPlanId: getRouteParam(request, 'editPlanId'),
      idempotencyKey: getOptionalIdempotencyKey(request),
    })
    sendOk(response, { readiness: result }, result.warnings)
  }))

  router.post('/v1/edit-plans/:editPlanId/approved-snapshots/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(approvedSnapshotReadinessSchema, request.body)
    const result = await createApprovedSnapshotService(getServiceContext(request)).getSnapshotBlockers({
      ...body,
      editPlanId: getRouteParam(request, 'editPlanId'),
      idempotencyKey: getOptionalIdempotencyKey(request),
    })
    sendOk(response, { readiness: result.readiness, blockers: result.blockers }, result.warnings)
  }))

  router.post('/v1/edit-plans/:editPlanId/approved-snapshots', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedSnapshotSchema, request.body)
    const result = await createApprovedSnapshotService(getServiceContext(request)).createApprovedSnapshot({
      ...body,
      editPlanId: getRouteParam(request, 'editPlanId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { approvedPlanSnapshot: result.approvedPlanSnapshot, readiness: result.readiness }, result.warnings, 201)
  }))

  router.get('/v1/approved-snapshots/:snapshotId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(getApprovedSnapshotQuerySchema, request.query)
    const result = await createApprovedSnapshotService(getServiceContext(request)).getApprovedSnapshot(
      getRouteParam(request, 'snapshotId'),
      query.workspaceId,
    )
    sendOk(response, { approvedPlanSnapshot: result.approvedPlanSnapshot }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/approved-snapshots', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(listApprovedSnapshotsQuerySchema, request.query)
    const result = await createApprovedSnapshotService(getServiceContext(request)).listApprovedSnapshotsForProject(
      getRouteParam(request, 'projectId'),
      query.workspaceId,
    )
    sendOk(response, { approvedPlanSnapshots: result.approvedPlanSnapshots }, result.warnings)
  }))

  router.post('/v1/approved-snapshots/:snapshotId/verify-integrity', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(verifyApprovedSnapshotIntegritySchema, request.body)
    const result = await createApprovedSnapshotService(getServiceContext(request)).verifySnapshotIntegrity(
      getRouteParam(request, 'snapshotId'),
      body.expectedSnapshotHash,
      body.workspaceId,
    )
    sendOk(response, { integrity: result.integrity }, result.warnings)
  }))

  return router
}
