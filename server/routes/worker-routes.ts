import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createWorkerClaimService } from '../services/worker-claim-service'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
  runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  runGstreamerMkvtoolnixPersistedJobRuntimeHandoff,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'
import {
  TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH,
  runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource,
} from '../services/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import {
  claimWorkerJobSchema,
  gpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceSchema,
  gstreamerMkvtoolnixGeneratedFixtureApprovedSnapshotJobQueueHandoffSchema,
  gstreamerMkvtoolnixGeneratedFixtureQueuedJobRuntimeRouteInvocationSchema,
  gstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeSchema,
  gstreamerMkvtoolnixPersistedJobRuntimeHandoffSchema,
  gstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationSchema,
  gstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseSchema,
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

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(gstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeSchema, request.body)
      const result = await runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge({
        ...body,
        routeIdempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, { result }, [], result.ok ? 201 : 409)
    }),
  )

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        gstreamerMkvtoolnixGeneratedFixtureApprovedSnapshotJobQueueHandoffSchema,
        request.body,
      )
      const result = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff({
        ...body,
        queueIdempotencyKey: body.queueIdempotencyKey,
        routeIdempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, { result }, [], result.ok ? 201 : 409)
    }),
  )

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        gstreamerMkvtoolnixGeneratedFixtureQueuedJobRuntimeRouteInvocationSchema,
        request.body,
      )
      const result = await runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation({
        ...body,
        routeIdempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, { result }, [], result.ok ? 201 : 409)
    }),
  )

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        gstreamerMkvtoolnixPersistedJobRuntimeHandoffSchema,
        request.body,
      )
      const result = await runGstreamerMkvtoolnixPersistedJobRuntimeHandoff({
        ...body,
        routeIdempotencyKey: getIdempotencyKey(request),
      }, getServiceContext(request))
      sendOk(response, { result }, result.warnings, result.ok ? 201 : 409)
    }),
  )

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        gstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationSchema,
        request.body,
      )
      const result = await runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation({
        ...body,
        routeIdempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, { result }, [], result.ok ? 201 : 409)
    }),
  )

  router.post(
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(
        gstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseSchema,
        request.body,
      )
      const result = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease({
        ...body,
        routeIdempotencyKey: getIdempotencyKey(request),
      }, getServiceContext(request))
      sendOk(response, { result }, result.warnings, result.ok ? 201 : 409)
    }),
  )

  router.post(
    TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH,
    requireAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(gpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceSchema, request.body)
      const result = runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource({
        ...body,
        routeIdempotencyKey: body.routeIdempotencyKey || getIdempotencyKey(request),
      })
      sendOk(response, { result }, [], result.ok ? 201 : 409)
    }),
  )

  return router
}
