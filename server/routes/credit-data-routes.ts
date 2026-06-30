import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  createCreditRevisionActionRecord,
  listCreditRevisionActionsForProject,
  listCreditSettlementsForProject,
  previewCreditSettlement,
  upsertCreditRevisionActionByIdempotencyKey,
} from '../services/mock-credit-data-store'
import { sharedMockCreditDataStore } from '../services/mock-credit-foundation-stores'
import {
  createCreditRevisionActionSchema,
  previewCreditSettlementSchema,
} from '../validation/credit-data-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'
import type { JSONObject } from '../../src/types'

const mockWarnings = [
  'RP-CREDITDATA-01 mock-only route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, or export unlock occurred.',
]

export function createCreditDataRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-settlements/preview', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(previewCreditSettlementSchema, request.body)
    const preview = previewCreditSettlement(sharedMockCreditDataStore, body)
    sendOk(response, preview, [...mockWarnings, ...preview.warnings])
  }))

  router.get('/v1/projects/:projectId/credit-settlements', requireAuth, asyncRoute(async (request, response) => {
    const settlements = listCreditSettlementsForProject(sharedMockCreditDataStore, getRouteParam(request, 'projectId'))
    sendOk(response, { settlements }, mockWarnings)
  }))

  router.post('/v1/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createCreditRevisionActionSchema, request.body)
    const action = upsertCreditRevisionActionByIdempotencyKey(
      sharedMockCreditDataStore,
      createCreditRevisionActionRecord({
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      }),
    )
    sendOk(response, { action }, mockWarnings, 201)
  }))

  router.get('/v1/projects/:projectId/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const actions = listCreditRevisionActionsForProject(sharedMockCreditDataStore, getRouteParam(request, 'projectId'))
    sendOk(response, { actions }, mockWarnings)
  }))

  return router
}
