import { Router } from 'express'

import type { PreviewEditCreditEstimateRequest } from '../../src/types/credits'
import { requireAuth } from '../middleware/auth'
import {
  getLatestEditCreditEstimatePreviewForEditPlan,
  listEditCreditEstimatePreviewsForProject,
  upsertEditCreditEstimatePreviewByIdempotencyKey,
} from '../services/mock-credit-estimate-store'
import { sharedMockCreditEstimateStore } from '../services/mock-credit-foundation-stores'
import { validateBody } from '../validation/common-schemas'
import { previewEditCreditEstimateSchema } from '../validation/credit-estimate-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

const mockWarnings = [
  'RP-ESTIMATE-01 mock-only route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, export unlock, or credit spend occurred.',
]

export function createCreditEstimateRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-estimates/preview', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(previewEditCreditEstimateSchema, request.body) as PreviewEditCreditEstimateRequest
    const preview = upsertEditCreditEstimatePreviewByIdempotencyKey(sharedMockCreditEstimateStore, body)
    const status = preview.idempotencyStatus === 'created' ? 201 : 200
    sendOk(response, { preview }, [...mockWarnings, ...preview.warnings], status)
  }))

  router.get('/v1/projects/:projectId/credit-estimates', requireAuth, asyncRoute(async (request, response) => {
    const previews = listEditCreditEstimatePreviewsForProject(
      sharedMockCreditEstimateStore,
      getRouteParam(request, 'projectId'),
    )
    sendOk(response, {
      previews,
      estimates: previews.map((preview) => preview.estimate),
    }, mockWarnings)
  }))

  router.get('/v1/edit-plans/:editPlanId/credit-estimates/latest', requireAuth, asyncRoute(async (request, response) => {
    const preview = getLatestEditCreditEstimatePreviewForEditPlan(
      sharedMockCreditEstimateStore,
      getRouteParam(request, 'editPlanId'),
    ) ?? null
    sendOk(response, {
      preview,
      estimate: preview?.estimate ?? null,
    }, mockWarnings)
  }))

  return router
}
