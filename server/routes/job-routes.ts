import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createJobBatchSchema, createJobSchema } from '../validation/job-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendBackendRequired } from './route-helpers'

export function createJobRoutes(): Router {
  const router = Router()

  router.post('/v1/job-batches', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(createJobBatchSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'jobs.batch.create',
      routeGroup: 'jobs',
      message: 'Job orchestration remains blocked until Prompt 8.',
      blockers: ['Prompt 7 does not create job batches, dispatch workers, or mutate execution state.'],
      nextAction: 'Use Prompt 8 for job orchestration, worker claims, leases, and idempotency.',
    })
  }))

  router.post('/v1/jobs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(createJobSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'jobs.create',
      routeGroup: 'jobs',
      message: 'Job creation remains blocked until Prompt 8.',
      blockers: ['Prompt 7 does not create jobs, queue work, call providers, render media, or execute tools.'],
      nextAction: 'Use Prompt 8 for job orchestration, worker claims, leases, and idempotency.',
    })
  }))

  router.get('/v1/jobs/:jobId', requireAuth, asyncRoute(async (request, response) => {
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'jobs.get',
      routeGroup: 'jobs',
      message: 'Job reads remain backend-required because job runtime is not production-enabled.',
      blockers: ['Prompt 7 does not expose production job state.'],
      nextAction: 'Use Prompt 8 before relying on job runtime routes.',
    })
  }))

  router.get('/v1/jobs/:jobId/events', requireAuth, asyncRoute(async (request, response) => {
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'jobs.events.list',
      routeGroup: 'jobs',
      message: 'Job event reads remain backend-required because job runtime is not production-enabled.',
      blockers: ['Prompt 7 does not expose production job events.'],
      nextAction: 'Use Prompt 8 before relying on job runtime routes.',
    })
  }))

  return router
}
