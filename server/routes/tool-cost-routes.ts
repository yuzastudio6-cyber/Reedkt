import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createToolCostMeteringService } from '../tool-cost-metering/tool-cost-metering-service'
import { buildToolCostOwnerCoverageMatrix, buildToolCostOwnerCoverageSummary } from '../tool-cost-metering/tool-cost-owner-coverage'
import { toolCostEstimateSchema, toolCostEventSchema } from '../validation/tool-cost-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createToolCostRoutes(): Router {
  const router = Router()

  router.post('/v1/tool-costs/estimate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolCostEstimateSchema, request.body)
    const result = createToolCostMeteringService(getServiceContext(request)).estimateToolCost(body)
    sendOk(response, { estimate: result.estimate }, result.warnings)
  }))

  router.post('/v1/tool-costs/events', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(toolCostEventSchema, request.body)
    const result = createToolCostMeteringService(getServiceContext(request)).emitToolCostEvent(body, getIdempotencyKey(request))
    sendOk(response, { event: result.event, replayed: result.replayed }, result.warnings, result.replayed ? 200 : 201)
  }))

  router.get('/v1/tool-costs/owner-coverage', requireAuth, asyncRoute(async (_request, response) => {
    const tools = buildToolCostOwnerCoverageMatrix()
    sendOk(response, {
      summary: buildToolCostOwnerCoverageSummary(tools),
      tools,
    })
  }))

  router.get('/v1/projects/:projectId/tool-cost-summary', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = stringQueryValue(request.query.workspaceId)
    if (!workspaceId) {
      throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required for tool cost summaries.', 400)
    }
    const result = createToolCostMeteringService(getServiceContext(request)).getToolCostSummary({
      workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { summary: result.summary }, result.warnings)
  }))

  return router
}

function stringQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
