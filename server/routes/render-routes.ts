import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireCanonicalWorkerRuntime } from '../middleware/canonical-worker-runtime'
import { requireIdempotency } from '../middleware/idempotency'
import { checkBasicRenderSmokeTools, createSkippedBasicRenderSmokeResult, runBasicFinalExportSmoke } from '../services/render-smoke-service'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createRenderService } from '../services/render-service'
import { runSmartCutPreviewSmoke } from '../services/smart-cut-preview-service'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import { basicRenderSmokeFinalExportSchema, basicRenderSmokePreviewSchema, previewReviewSchema, smartCutPreviewSmokeSchema } from '../validation/render-schemas'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createRenderRoutes(): Router {
  const router = Router()

  router.post('/v1/render-jobs', requireAuth, requireInternalServiceAuth, asyncRoute(async () => {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Render jobs must be derived from canonical approved work items, source assets, timing, QA, and funded reservation authority; caller IDs cannot queue rendering.',
      503,
      { requiredGate: 'canonical_render_job_derivation' },
    )
  }))

  router.get('/v1/renders/:renderId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = idSchema.parse(request.query.workspaceId)
    const result = await createRenderService(getServiceContext(request)).getRender(getRouteParam(request, 'renderId'), workspaceId)
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

  router.post('/v1/render-jobs/:renderJobId/basic-smoke-preview', requireAuth, requireInternalServiceAuth, requireCanonicalWorkerRuntime, requireIdempotency, asyncRoute(async (request, response) => {
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
      creditReservationId: body.creditReservationId,
      storageObjectRecordId: body.sourceStorageObjectId,
      payloadJson: {
        sourceStorageObjectId: body.sourceStorageObjectId,
        storageObjectRecordId: body.sourceStorageObjectId,
        sourceStorageObject: body.sourceStorageObject,
        editAssemblyPlan: body.editAssemblyPlan,
      },
    })
    sendOk(response, { result, renderSmoke: result.output }, result.warnings, result.status === 'blocked' ? 409 : 201)
  }))

  router.post('/v1/render-jobs/:renderJobId/basic-smoke-final-export', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(basicRenderSmokeFinalExportSchema, request.body)
    const context = getServiceContext(request)
    const renderJobId = getRouteParam(request, 'renderJobId')
    const workspaceId = body.workspaceId ?? 'workspace-mock'
    const projectId = body.projectId ?? 'project-mock'
    const result = await runBasicFinalExportSmoke(context, {
      workspaceId,
      projectId,
      renderJobId,
      sourceStorageObjectId: body.sourceStorageObjectId,
      sourceStorageObject: body.sourceStorageObject,
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      creditReservationId: body.creditReservationId,
      workerInstanceId: body.workerInstanceId,
      strict: body.strict,
      previewReviewId: body.previewReviewId,
      previewReviewStatus: body.previewReviewStatus,
      editAssemblyPlan: body.editAssemblyPlan,
    })
    sendOk(response, { result, finalExportSmoke: result }, result.warnings, result.status === 'failed' ? 409 : result.status === 'skipped' ? 202 : 201)
  }))

  router.post('/v1/render-jobs/:renderJobId/private-review-preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(smartCutPreviewSmokeSchema, request.body)
    const context = getServiceContext(request)
    const renderJobId = getRouteParam(request, 'renderJobId')
    const workspaceId = body.workspaceId ?? 'workspace-mock'
    const projectId = body.projectId ?? 'project-mock'
    const smartCutPreview = await runSmartCutPreviewSmoke(context, {
      workspaceId,
      projectId,
      renderJobId,
      sourceStorageObjectId: body.sourceStorageObjectId,
      sourceStorageObject: body.sourceStorageObject,
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      creditReservationId: body.creditReservationId,
      toolExecutionPlanId: body.toolExecutionPlanId,
      workerInstanceId: body.workerInstanceId,
      sourceVideoDurationSeconds: body.sourceVideoDurationSeconds,
      sourceVideoWidth: body.sourceVideoWidth,
      sourceVideoHeight: body.sourceVideoHeight,
      strict: body.strict,
    })
    sendOk(response, { smartCutPreview }, smartCutPreview.warnings, 201)
  }))

  return router
}
