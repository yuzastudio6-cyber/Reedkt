import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { executeTrackBAgentTool } from '../agents/trackb-agent-tool-execution'
import { validateBody } from '../validation/common-schemas'
import { trackbAgentToolExecutionSchema } from '../validation/trackb-agent-tool-schemas'
import { asyncRoute, getIdempotencyKey, sendOk } from './route-helpers'

export function createTrackBAgentToolRoutes(): Router {
  const router = Router()

  router.post('/v1/agent-tools/trackb/execute', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(trackbAgentToolExecutionSchema, request.body)
    const result = await executeTrackBAgentTool({
      ...body,
      apiIdempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { trackBAgentToolExecution: result }, result.warnings, result.status === 'blocked' ? 409 : 202)
  }))

  return router
}
