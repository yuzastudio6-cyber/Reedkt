import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createJobService } from '../services/job-service'
import { idSchema } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createJobRoutes(): Router {
  const router = Router()

  router.post('/v1/job-batches', requireAuth, requireInternalServiceAuth, asyncRoute(async () => {
    throwLegacyFreeFormJobGate()
  }))

  router.post('/v1/jobs', requireAuth, requireInternalServiceAuth, asyncRoute(async () => {
    throwLegacyFreeFormJobGate()
  }))

  router.get('/v1/jobs/:jobId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = idSchema.parse(request.query.workspaceId)
    const result = await createJobService(getServiceContext(request)).getJob(getRouteParam(request, 'jobId'), workspaceId)
    sendOk(response, { job: result.job }, result.warnings)
  }))

  router.get('/v1/jobs/:jobId/events', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = idSchema.parse(request.query.workspaceId)
    const result = await createJobService(getServiceContext(request)).getJobEvents(getRouteParam(request, 'jobId'), workspaceId)
    sendOk(response, { events: result.events }, result.warnings)
  }))

  return router
}

function throwLegacyFreeFormJobGate(): never {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Free-form job creation is disabled. Jobs must be derived from immutable approved work items.',
    503,
    { requiredGate: 'canonical_approved_work_item_job_derivation' },
  )
}
