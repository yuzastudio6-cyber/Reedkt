import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createJobService } from '../services/job-service'
import {
  appendJobEventSchema,
  createJobBatchSchema,
  createJobDependencySchema,
  createJobSchema,
  jobCancelSchema,
  jobDependencyQuerySchema,
  jobReadQuerySchema,
  jobReadinessSchema,
  jobRetrySchema,
  listProjectJobsQuerySchema,
} from '../validation/job-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createJobRoutes(): Router {
  const router = Router()

  router.post('/v1/jobs/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(jobReadinessSchema, request.body)
    const result = await createJobService(getServiceContext(request)).checkJobReadiness(body)
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.post('/v1/job-batches', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobBatchSchema, request.body)
    const result = await createJobService(getServiceContext(request)).createJobBatch({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/jobs/queue', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobSchema, request.body)
    const result = await createJobService(getServiceContext(request)).queueJob({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/jobs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobSchema, request.body)
    const result = await createJobService(getServiceContext(request)).createJob({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.get('/v1/projects/:projectId/jobs', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(listProjectJobsQuerySchema, request.query)
    const result = await createJobService(getServiceContext(request)).listJobsForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.get('/v1/jobs/:jobId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(jobReadQuerySchema, request.query)
    const result = await createJobService(getServiceContext(request)).getJob({
      jobId: getRouteParam(request, 'jobId'),
      workspaceId: query.workspaceId,
      projectId: query.projectId,
    })
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/dependencies', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createJobDependencySchema, request.body)
    const result = await createJobService(getServiceContext(request)).createDependency({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      dependsOnJobId: body.dependsOnJobId,
      status: body.requiredStatus,
      reason: body.dependencyReason,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.get('/v1/jobs/:jobId/dependencies', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(jobDependencyQuerySchema, request.query)
    const result = await createJobService(getServiceContext(request)).getDependencies({
      jobId: getRouteParam(request, 'jobId'),
      workspaceId: query.workspaceId,
      projectId: query.projectId,
    })
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/events', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(appendJobEventSchema, request.body)
    const result = await createJobService(getServiceContext(request)).appendJobEvent({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.get('/v1/jobs/:jobId/events', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(jobReadQuerySchema, request.query)
    const result = await createJobService(getServiceContext(request)).listJobEvents({
      jobId: getRouteParam(request, 'jobId'),
      workspaceId: query.workspaceId,
      projectId: query.projectId,
    })
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.get('/v1/jobs/:jobId/status', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(jobReadQuerySchema, request.query)
    const result = await createJobService(getServiceContext(request)).getJobStatus({
      jobId: getRouteParam(request, 'jobId'),
      workspaceId: query.workspaceId,
      projectId: query.projectId,
    })
    sendOk(response, { jobRuntime: result }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/retry', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(jobRetrySchema, request.body)
    const result = await createJobService(getServiceContext(request)).scheduleRetry({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/jobs/:jobId/cancel', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(jobCancelSchema, request.body)
    const result = await createJobService(getServiceContext(request)).requestCancel({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { jobRuntime: result }, result.warnings, 202)
  }))

  return router
}
