import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import {
  createCreditRevisionActionRecord,
  createMockCreditDataStore,
  listCreditRevisionActionsForProject,
  listCreditSettlementsForProject,
  previewCreditSettlement,
  upsertCreditRevisionActionByIdempotencyKey,
} from '../services/mock-credit-data-store'
import {
  createCreditRevisionActionSchema,
  previewCreditSettlementSchema,
} from '../validation/credit-data-schemas'
import { idSchema, validateBody } from '../validation/common-schemas'
import { assertLocalMockRoute } from './mock-route-helpers'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import type { JSONObject } from '../../src/types'

const creditDataStore = createMockCreditDataStore()

const mockWarnings = [
  'RP-CREDITDATA-01 mock-only route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, or export unlock occurred.',
]

export function createCreditDataRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-settlements/preview', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    assertLocalMockRoute(context, 'Credit settlement preview persistence')
    const body = validateBody(previewCreditSettlementSchema, request.body)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
    const preview = previewCreditSettlement(creditDataStore, body)
    sendOk(response, preview, [...mockWarnings, ...preview.warnings])
  }))

  router.get('/v1/projects/:projectId/credit-settlements', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    assertLocalMockRoute(context, 'Credit settlement history')
    const workspaceId = idSchema.parse(request.query.workspaceId)
    await authorizeWorkspaceAccess(context, workspaceId, 'read')
    const settlements = listCreditSettlementsForProject(creditDataStore, getRouteParam(request, 'projectId'))
      .filter((settlement) => settlement.workspaceId === workspaceId)
    sendOk(response, { settlements }, mockWarnings)
  }))

  router.post('/v1/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    assertLocalMockRoute(context, 'Credit revision actions')
    const body = validateBody(createCreditRevisionActionSchema, request.body)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
    const action = upsertCreditRevisionActionByIdempotencyKey(
      creditDataStore,
      createCreditRevisionActionRecord({
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      }),
    )
    sendOk(response, { action }, mockWarnings, 201)
  }))

  router.get('/v1/projects/:projectId/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    assertLocalMockRoute(context, 'Credit revision action history')
    const workspaceId = idSchema.parse(request.query.workspaceId)
    await authorizeWorkspaceAccess(context, workspaceId, 'read')
    const actions = listCreditRevisionActionsForProject(creditDataStore, getRouteParam(request, 'projectId'))
      .filter((action) => action.workspaceId === workspaceId)
    sendOk(response, { actions }, mockWarnings)
  }))

  return router
}
