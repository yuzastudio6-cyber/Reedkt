import { Router, type NextFunction, type Request, type Response } from 'express'
import { requireAuth, requireLiveSupabaseWriteAccess, requireLiveUserAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { ApiError } from '../errors/api-error'
import {
  getE2EReadinessSummary,
  getLiveSupabaseDryRun,
  runLocalFullEditingFlow,
  runSupabaseFullEditingFlow,
} from '../services/e2e-editing-flow-service'
import { validateBody } from '../validation/common-schemas'
import { e2eFullEditingFlowRouteSchema } from '../validation/e2e-schemas'
import { asyncRoute, getIdempotencyKey, getServiceContext, sendOk } from './route-helpers'

export function createE2ERoutes(): Router {
  const router = Router()

  router.get('/health/e2e/readiness', asyncRoute(async (request, response) => {
    const readiness = await getE2EReadinessSummary(getServiceContext(request))
    sendOk(response, { readiness }, readiness.warnings)
  }))

  router.get('/health/e2e/live-supabase-dry-run', asyncRoute(async (request, response) => {
    const result = await getLiveSupabaseDryRun(getServiceContext(request))
    sendOk(response, { dryRun: result }, [], result.ok === true ? 200 : 409)
  }))

  router.post('/v1/e2e/local/full-editing-flow', requireAuth, requireLocalSmokeMode, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(e2eFullEditingFlowRouteSchema, request.body)
    const result = await runLocalFullEditingFlow(getServiceContext(request), {
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { result }, result.warnings, statusForFlow(result.status))
  }))

  router.post('/v1/e2e/supabase/full-editing-flow', requireLiveUserAuth, requireLiveSupabaseWriteAccess, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(e2eFullEditingFlowRouteSchema, request.body)
    const result = await runSupabaseFullEditingFlow(getServiceContext(request))
    sendOk(response, { result, requestedWorkspaceId: body.workspaceId }, result.warnings, statusForFlow(result.status))
  }))

  return router
}

function requireLocalSmokeMode(request: Request, _response: Response, next: NextFunction): void {
  const context = getServiceContext(request)
  if (context.env.supabaseE2eSmokeMode === 'live') {
    next(new ApiError('MOCK_ONLY', 'Local full E2E route is local/mock only. Use /v1/e2e/supabase/full-editing-flow for live Supabase validation.', 409))
    return
  }
  next()
}

function statusForFlow(status: string): number {
  if (status === 'preview_ready') return 201
  if (status === 'skipped') return 202
  return 409
}
