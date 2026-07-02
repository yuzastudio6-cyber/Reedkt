import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createCreditGateService } from '../services/credit-gate-service'
import { approveCreditEstimateSchema, reserveCreditsSchema } from '../validation/credit-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createCreditRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-estimates/:creditEstimateId/approve', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(approveCreditEstimateSchema, request.body)
    const result = await createCreditGateService(getServiceContext(request)).approveCreditEstimate({
      ...body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
    })
    sendOk(response, { creditApproval: result.creditApproval }, result.warnings, 201)
  }))

  router.post('/v1/credit-estimates/:creditEstimateId/reserve', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(reserveCreditsSchema, request.body)
    const result = await createCreditGateService(getServiceContext(request)).reserveCredits({
      ...body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
    })
    sendOk(response, { creditReservation: result.creditReservation }, result.warnings, 201)
  }))

  router.get('/v1/workspaces/:workspaceId/credit-balance', requireAuth, asyncRoute(async (request, response) => {
    const result = await createCreditGateService(getServiceContext(request)).getCreditBalance(getRouteParam(request, 'workspaceId'))
    sendOk(response, { creditBalance: result.creditBalance }, result.warnings)
  }))

  return router
}
