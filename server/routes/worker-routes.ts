import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createWorkerClaimService } from '../services/worker-claim-service'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import {
  claimWorkerJobSchema,
  probeMediaJobSchema,
  recordToolRuntimeCheckSchema,
  releaseWorkerJobSchema,
  runWorkerJobSchema,
  toolReadinessCheckSchema,
} from '../validation/worker-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createWorkerRoutes(): Router {
  const router = Router()

  router.post('/v1/jobs/:jobId/claim', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(claimWorkerJobSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).claimJob({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { claim: result.claim }, result.warnings, 201)
  }))

  router.post('/v1/jobs/:jobId/heartbeat', requireAuth, asyncRoute(async (request, response) => {
    const result = await createWorkerClaimService(getServiceContext(request)).heartbeat({
      jobId: getRouteParam(request, 'jobId'),
    })
    sendOk(response, { heartbeat: result.heartbeat }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/release', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(releaseWorkerJobSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).release({
      jobId: getRouteParam(request, 'jobId'),
      claimStatus: body.claimStatus,
    })
    sendOk(response, { claim: result.claim }, result.warnings)
  }))

  router.post('/v1/tool-runtime-checks', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(recordToolRuntimeCheckSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).recordToolRuntimeCheck(body)
    sendOk(response, { toolRuntimeCheck: result.toolRuntimeCheck }, result.warnings, 201)
  }))

  router.post('/v1/workers/tool-readiness/check', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolReadinessCheckSchema, request.body)
    const result = await runToolReadinessChecks(getServiceContext(request), body)
    sendOk(response, result, result.warnings, 201)
  }))

  router.post('/v1/workers/jobs/:jobId/run', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(runWorkerJobSchema, request.body)
    const result = await runWorkerClaimRunner(getServiceContext(request), {
      ...body,
      jobId: getRouteParam(request, 'jobId'),
    })
    sendOk(response, { result }, result.warnings, result.status === 'blocked' ? 409 : 201)
  }))

  router.post('/v1/workers/jobs/:jobId/probe-media', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(probeMediaJobSchema, request.body)
    const result = await runWorkerClaimRunner(getServiceContext(request), {
      ...body,
      workerType: body.workerType ?? 'media_probe_worker',
      jobType: body.jobType ?? 'media_analysis',
      jobId: getRouteParam(request, 'jobId'),
    })
    sendOk(response, { result, mediaProbe: result.output }, result.warnings, result.status === 'blocked' ? 409 : 201)
  }))

  return router
}
