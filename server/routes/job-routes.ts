import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createJobService } from '../services/job-service'
import { createJobBatchSchema, createJobSchema } from '../validation/job-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createJobRoutes(): Router {
  const router = Router()

  router.post('/v1/job-batches', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobBatchSchema, request.body)
    const result = await createJobService(getServiceContext(request)).createJobBatch(body)
    sendOk(response, { jobBatch: result.jobBatch }, result.warnings, 201)
  }))

  router.post('/v1/jobs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobSchema, request.body)
    const result = await createJobService(getServiceContext(request)).createJob(body)
    sendOk(response, { job: result.job }, result.warnings, 201)
  }))

  router.get('/v1/jobs/:jobId', requireAuth, asyncRoute(async (request, response) => {
    const result = await createJobService(getServiceContext(request)).getJob(getRouteParam(request, 'jobId'))
    sendOk(response, { job: result.job }, result.warnings)
  }))

  router.get('/v1/jobs/:jobId/events', requireAuth, asyncRoute(async (request, response) => {
    const result = await createJobService(getServiceContext(request)).getJobEvents(getRouteParam(request, 'jobId'))
    sendOk(response, { events: result.events }, result.warnings)
  }))

  return router
}
