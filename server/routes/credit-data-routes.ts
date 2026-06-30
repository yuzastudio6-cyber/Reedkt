import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  approveCreditRevisionAction,
  cancelCreditRevisionAction,
  chooseLowerCostCreditRevisionOption,
  createCreditRevisionActionRecord,
  listCreditRevisionActionsForProject,
  listCreditSettlementsForProject,
  previewCreditSettlement,
  upsertCreditRevisionActionByIdempotencyKey,
} from '../services/mock-credit-data-store'
import { sharedMockCreditDataStore, sharedMockCreditReservationStore } from '../services/mock-credit-foundation-stores'
import {
  approveCreditRevisionActionSchema,
  cancelCreditRevisionActionSchema,
  chooseLowerCostCreditRevisionOptionSchema,
  createCreditRevisionActionSchema,
  previewCreditSettlementSchema,
} from '../validation/credit-data-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'
import type { JSONObject } from '../../src/types'

const mockWarnings = [
  'RP-CREDITDATA-01 mock-only route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, or export unlock occurred.',
]

const revisionResolutionWarnings = [
  'RP-CREDITREVISION-01 mock-only route; only local in-memory revised-credit action and additional-hold reservation state may change.',
  'No live billing, Stripe/payment, Supabase write, production wallet mutation, production ledger write, settlement, spend/release/refund, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
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

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/approve-and-continue', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(approveCreditRevisionActionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = approveCreditRevisionAction(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      {
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      },
    )
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'approved' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/choose-lower-cost-option', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(chooseLowerCostCreditRevisionOptionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = chooseLowerCostCreditRevisionOption(sharedMockCreditDataStore, {
      ...body,
      metadata: body.metadata as JSONObject | undefined,
    })
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'lower_cost_selected' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/cancel-extra-work', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(cancelCreditRevisionActionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = cancelCreditRevisionAction(sharedMockCreditDataStore, {
      ...body,
      metadata: body.metadata as JSONObject | undefined,
    })
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'cancelled' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.get('/v1/projects/:projectId/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const actions = listCreditRevisionActionsForProject(sharedMockCreditDataStore, getRouteParam(request, 'projectId'))
    sendOk(response, { actions }, mockWarnings)
  }))

  return router
}
