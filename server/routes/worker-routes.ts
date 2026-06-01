import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import {
  claimWorkerJobSchema,
  probeMediaJobSchema,
  recordToolRuntimeCheckSchema,
  releaseWorkerJobSchema,
  runWorkerJobSchema,
  toolReadinessCheckSchema,
} from '../validation/worker-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendBackendRequired } from './route-helpers'

export function createWorkerRoutes(): Router {
  const router = Router()

  router.post('/v1/jobs/:jobId/claim', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(claimWorkerJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.claim',
      routeGroup: 'workers',
      message: 'Worker claims remain blocked until Prompt 8.',
      blockers: ['Prompt 7 does not claim jobs, create leases, heartbeat workers, or mutate worker state.'],
      nextAction: 'Use Prompt 8 for job orchestration, worker claims, leases, and idempotency.',
    })
  }))

  router.post('/v1/jobs/:jobId/heartbeat', requireAuth, asyncRoute(async (request, response) => {
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.heartbeat',
      routeGroup: 'workers',
      message: 'Worker heartbeat remains blocked until Prompt 8.',
      blockers: ['Prompt 7 does not update worker leases or heartbeats.'],
      nextAction: 'Use Prompt 8 before enabling worker heartbeat routes.',
    })
  }))

  router.post('/v1/jobs/:jobId/release', requireAuth, asyncRoute(async (request, response) => {
    validateBody(releaseWorkerJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.release',
      routeGroup: 'workers',
      message: 'Worker release remains blocked until Prompt 8.',
      blockers: ['Prompt 7 does not release worker claims or mutate worker state.'],
      nextAction: 'Use Prompt 8 before enabling worker release routes.',
    })
  }))

  router.post('/v1/tool-runtime-checks', requireAuth, asyncRoute(async (request, response) => {
    validateBody(recordToolRuntimeCheckSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'tools.runtimeChecks.create',
      routeGroup: 'tools',
      message: 'Tool runtime check writes remain blocked until tool readiness/runtime milestones.',
      blockers: ['Prompt 7 does not execute tools or write tool runtime check records.'],
      nextAction: 'Use Prompt 13 for tool readiness and worker runtime checks.',
    })
  }))

  router.post('/v1/workers/tool-readiness/check', requireAuth, asyncRoute(async (request, response) => {
    validateBody(toolReadinessCheckSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'workers.toolReadiness.check',
      routeGroup: 'workers',
      message: 'Tool readiness execution remains blocked from API routes in Prompt 7.',
      blockers: ['Prompt 7 does not run tool checks, execute binaries, or write readiness records.'],
      nextAction: 'Use Prompt 13 before enabling API-triggered tool readiness checks.',
    })
  }))

  router.post('/v1/workers/jobs/:jobId/run', requireAuth, asyncRoute(async (request, response) => {
    validateBody(runWorkerJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.run',
      routeGroup: 'workers',
      message: 'Worker job execution remains blocked until worker execution milestones.',
      blockers: ['Prompt 7 does not execute workers, providers, render, media analysis, or tools.'],
      nextAction: 'Use Prompt 8 and later worker/runtime milestones before enabling job execution.',
    })
  }))

  router.post('/v1/workers/jobs/:jobId/probe-media', requireAuth, asyncRoute(async (request, response) => {
    validateBody(probeMediaJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.probeMedia',
      routeGroup: 'workers',
      message: 'Media probe execution remains blocked until the media readiness milestone.',
      blockers: ['Prompt 7 does not run FFprobe, analyze media, or persist media readiness.'],
      nextAction: 'Use the media readiness/probe milestone before enabling this route.',
    })
  }))

  return router
}
