import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createWorkerClaimService } from '../services/worker-claim-service'
import {
  claimWorkerJobSchema,
  claimWorkerReadinessSchema,
  probeMediaJobSchema,
  recordToolRuntimeCheckSchema,
  recoverStaleWorkerSchema,
  releaseWorkerJobSchema,
  runtimeRegistryQuerySchema,
  runWorkerJobSchema,
  toolReadinessCheckSchema,
  workerClaimQuerySchema,
  workerCompleteSchema,
  workerFailSchema,
  workerHeartbeatSchema,
  workerLeaseMutationSchema,
} from '../validation/worker-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendBackendRequired, sendOk } from './route-helpers'

export function createWorkerRoutes(): Router {
  const router = Router()

  router.post('/v1/jobs/:jobId/claim/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(claimWorkerReadinessSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).checkClaimReadiness({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
    })
    sendOk(response, { workerRuntime: result }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/claim', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(claimWorkerJobSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).claimJob({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.get('/v1/workers/claims/:workerClaimId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(workerClaimQuerySchema, request.query)
    const result = await createWorkerClaimService(getServiceContext(request)).getClaim({
      ...query,
      workerClaimId: getRouteParam(request, 'workerClaimId'),
    })
    sendOk(response, { workerRuntime: result }, result.warnings)
  }))

  router.post('/v1/jobs/:jobId/heartbeat', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerHeartbeatSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).heartbeat({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/claims/:workerClaimId/heartbeat', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerHeartbeatSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).heartbeat({
      ...body,
      workerClaimId: getRouteParam(request, 'workerClaimId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/leases/:leaseId/renew', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerLeaseMutationSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).renewLease({
      ...body,
      leaseId: getRouteParam(request, 'leaseId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/jobs/:jobId/release', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(releaseWorkerJobSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).releaseLease({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/leases/:leaseId/release', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerLeaseMutationSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).releaseLease({
      ...body,
      leaseId: getRouteParam(request, 'leaseId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/leases/:leaseId/complete', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerCompleteSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).complete({
      ...body,
      leaseId: getRouteParam(request, 'leaseId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/leases/:leaseId/fail', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(workerFailSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).fail({
      ...body,
      leaseId: getRouteParam(request, 'leaseId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/claims/recover-stale', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(recoverStaleWorkerSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).recoverStale({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.get('/v1/workers/runtime-registry', requireAuth, asyncRoute(async (request, response) => {
    validateQuery(runtimeRegistryQuerySchema, request.query)
    const result = await createWorkerClaimService(getServiceContext(request)).getRuntimeRegistry()
    sendOk(response, { workerRuntime: result }, result.warnings)
  }))

  router.post('/v1/tool-runtime-checks', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(recordToolRuntimeCheckSchema, request.body)
    const result = await createWorkerClaimService(getServiceContext(request)).recordToolRuntimeCheck({
      workspaceId: body.workspaceId,
      workerType: body.workerType,
      idempotencyKey: getIdempotencyKey(request),
      metadata: {
        runtimeRegion: body.runtimeRegion,
        toolName: body.toolName,
        toolVersion: body.toolVersion,
        checkStatus: body.checkStatus,
        checkSummary: body.checkSummary,
        binaryPath: body.binaryPath,
        capabilitiesJson: body.capabilitiesJson,
      },
    })
    sendOk(response, { workerRuntime: result }, result.warnings, 202)
  }))

  router.post('/v1/workers/tool-readiness/check', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(toolReadinessCheckSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'workers.toolReadiness.check',
      routeGroup: 'workers',
      message: 'Tool readiness execution remains blocked from API routes in Prompt 8.',
      blockers: ['Prompt 8 does not run tool checks, execute binaries, or write readiness records.'],
      nextAction: 'Use Prompt 13 before enabling API-triggered tool readiness checks.',
    })
  }))

  router.post('/v1/workers/jobs/:jobId/run', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(runWorkerJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.run',
      routeGroup: 'workers',
      message: 'Worker job execution remains blocked until worker execution milestones.',
      blockers: ['Prompt 8 does not execute workers, providers, render, media analysis, or tools.'],
      nextAction: 'Use future worker/runtime milestones before enabling job execution.',
    })
  }))

  router.post('/v1/workers/jobs/:jobId/probe-media', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(probeMediaJobSchema, request.body)
    getRouteParam(request, 'jobId')
    sendBackendRequired(response, {
      routeId: 'workers.jobs.probeMedia',
      routeGroup: 'workers',
      message: 'Media probe execution remains blocked until the media readiness milestone.',
      blockers: ['Prompt 8 does not run FFprobe, analyze media, or persist media readiness.'],
      nextAction: 'Use Prompt 9 before enabling this route.',
    })
  }))

  return router
}
