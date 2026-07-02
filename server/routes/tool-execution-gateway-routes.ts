import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import { toolExecutionGatewayDispatchSchema } from '../validation/tool-execution-gateway-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getServiceContext, sendOk } from './route-helpers'

export function createToolExecutionGatewayRoutes(): Router {
  const router = Router()

  router.post('/v1/tool-executions/dispatch', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(toolExecutionGatewayDispatchSchema, request.body)
    const result = await createToolExecutionGatewayService(getServiceContext(request)).dispatchApprovedToolCall({
      ...body,
      apiIdempotencyKey: getIdempotencyKey(request),
    })
    sendOk(
      response,
      {
        gateway: result.gateway,
        workerResult: result.workerResult,
      },
      result.warnings,
      result.gateway.status === 'blocked' ? 409 : 202,
    )
  }))

  return router
}
