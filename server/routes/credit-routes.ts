import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { createCreditGateService } from '../services/credit-gate-service'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createCreditRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-estimates/:creditEstimateId/approve', requireAuth, asyncRoute(async () => {
    throwLegacyStandaloneCreditGate()
  }))

  router.post('/v1/credit-estimates/:creditEstimateId/reserve', requireAuth, asyncRoute(async () => {
    throwLegacyStandaloneCreditGate()
  }))

  router.get('/v1/workspaces/:workspaceId/credit-balance', requireAuth, asyncRoute(async (request, response) => {
    const result = await createCreditGateService(getServiceContext(request)).getCreditBalance(getRouteParam(request, 'workspaceId'))
    sendOk(response, { creditBalance: result.creditBalance }, result.warnings)
  }))

  return router
}

function throwLegacyStandaloneCreditGate(): never {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Standalone credit approval and reservation are disabled. Canonical plan approval performs both in one authority transaction.',
    503,
    {
      replacementRoute: '/v1/edit-plans/:editPlanId/canonical-approval',
      requiredGate: 'atomic_plan_approval_and_funded_credit_reservation',
    },
  )
}
