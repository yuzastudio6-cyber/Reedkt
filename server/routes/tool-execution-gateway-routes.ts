import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import { toolExecutionGatewayDispatchSchema } from '../validation/tool-execution-gateway-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

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
        trackBAdapterResult: result.trackBAdapterResult,
        workerRuntimeArtifactPipeline: result.workerRuntimeArtifactPipeline,
        workerResult: result.workerResult,
      },
      result.warnings,
      result.gateway.status === 'blocked' ? 409 : 202,
    )
  }))

  router.get('/v1/projects/:projectId/tool-output-manifest', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = request.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) {
      throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)
    }
    const result = await createToolExecutionGatewayService(getServiceContext(request)).getProjectToolOutputManifest({
      workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { outputManifest: result.outputManifest }, result.warnings)
  }))

  return router
}
