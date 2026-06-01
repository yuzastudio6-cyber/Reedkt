import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { basicRenderSmokePreviewSchema, createRenderJobSchema, previewReviewSchema } from '../validation/render-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendBackendRequired } from './route-helpers'

export function createRenderRoutes(): Router {
  const router = Router()

  router.post('/v1/render-jobs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(createRenderJobSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'render.jobs.create',
      routeGroup: 'render',
      message: 'Render job creation remains blocked until the render/preview/export foundation milestone.',
      blockers: ['Prompt 7 does not create render jobs, run Remotion, run FFmpeg, or export media.'],
      nextAction: 'Use the render/preview/export foundation milestone before enabling render routes.',
    })
  }))

  router.get('/v1/renders/:renderId', requireAuth, asyncRoute(async (request, response) => {
    getRouteParam(request, 'renderId')
    sendBackendRequired(response, {
      routeId: 'renders.get',
      routeGroup: 'render',
      message: 'Render reads remain backend-required because render runtime is not production-enabled.',
      blockers: ['Prompt 7 does not expose production render/export state.'],
      nextAction: 'Use the render/preview/export foundation milestone before relying on render routes.',
    })
  }))

  router.post('/v1/renders/:renderId/preview-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(previewReviewSchema, request.body)
    getRouteParam(request, 'renderId')
    sendBackendRequired(response, {
      routeId: 'renders.previewReview.create',
      routeGroup: 'render',
      message: 'Preview review persistence remains blocked until render/revision/export foundations are implemented.',
      blockers: ['Prompt 7 does not create preview reviews, revisions, QA records, or exports.'],
      nextAction: 'Use the QA/revision/render milestones before enabling preview review persistence.',
    })
  }))

  router.post('/v1/render-jobs/:renderJobId/basic-smoke-preview', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(basicRenderSmokePreviewSchema, request.body)
    getRouteParam(request, 'renderJobId')
    sendBackendRequired(response, {
      routeId: 'render.basicSmokePreview.create',
      routeGroup: 'render',
      message: 'Basic render smoke preview execution remains blocked in Prompt 7.',
      blockers: ['Prompt 7 does not execute workers, run Remotion, run FFmpeg, read media, or write preview artifacts.'],
      nextAction: 'Use the render/preview/export foundation milestone before enabling render smoke execution.',
    })
  }))

  return router
}
