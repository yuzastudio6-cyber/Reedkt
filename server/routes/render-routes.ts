import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { checkBasicRenderSmokeTools, createSkippedBasicRenderSmokeResult } from '../services/render-smoke-service'
import { createRenderService } from '../services/render-service'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import { basicRenderSmokePreviewSchema, createRenderJobSchema, previewReviewSchema } from '../validation/render-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createRenderRoutes(): Router {
  const router = Router()

  router.post('/v1/render-jobs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createRenderJobSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).createRenderJob(body)
    sendOk(response, { renderJob: result.renderJob, toolCostEstimate: result.toolCostEstimate }, result.warnings, 201)
  }))

  router.get('/v1/renders/:renderId', requireAuth, asyncRoute(async (request, response) => {
    const result = await createRenderService(getServiceContext(request)).getRender(getRouteParam(request, 'renderId'))
    sendOk(response, { render: result.render }, result.warnings)
  }))

  router.post('/v1/renders/:renderId/preview-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(previewReviewSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).createPreviewReview({
      ...body,
      renderId: getRouteParam(request, 'renderId'),
    })
    sendOk(response, { previewReview: result.previewReview }, result.warnings, 201)
  }))

  router.post('/v1/render-jobs/:renderJobId/basic-smoke-preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(basicRenderSmokePreviewSchema, request.body)
    const context = getServiceContext(request)
    const renderJobId = getRouteParam(request, 'renderJobId')
    const workspaceId = body.workspaceId ?? 'workspace-mock'
    const projectId = body.projectId ?? 'project-mock'
    const tools = await checkBasicRenderSmokeTools(context)

    if (!tools.ready && !body.strict) {
      const skipped = createSkippedBasicRenderSmokeResult({
        workspaceId,
        projectId,
        renderJobId,
        sourceStorageObjectId: body.sourceStorageObjectId,
        sourceStorageObject: body.sourceStorageObject,
        approvedPlanSnapshotId: body.approvedPlanSnapshotId,
        creditReservationId: body.creditReservationId,
        workerInstanceId: body.workerInstanceId,
        strict: body.strict,
      }, tools.warnings)
      sendOk(response, { result: skipped }, skipped.warnings, 202)
      return
    }

    const result = await runWorkerClaimRunner(context, {
      jobId: renderJobId,
      workspaceId,
      projectId,
      jobType: 'basic_render_smoke',
      workerType: 'basic_render_smoke_worker',
      workerInstanceId: body.workerInstanceId,
      idempotencyKey: getIdempotencyKey(request),
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      creditEstimateId: body.creditEstimateId,
      creditReservationId: body.creditReservationId,
      storageObjectRecordId: body.sourceStorageObjectId,
      payloadJson: {
        sourceStorageObjectId: body.sourceStorageObjectId,
        storageObjectRecordId: body.sourceStorageObjectId,
        sourceStorageObject: body.sourceStorageObject,
      },
    })
    sendOk(response, { result, renderSmoke: result.output }, result.warnings, result.status === 'blocked' ? 409 : 201)
  }))

  return router
}
