import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  assertWebSearchUiApiRouteGate,
  buildWebSearchUiApiPlanSnapshot,
  buildWebSearchUiApiRunEnvelope,
  buildWebSearchUiApiStatus,
  buildWebSearchUiApiUxState,
  validateWebSearchUiApiRequest,
  webSearchUiApiRequestSchema,
} from '../activation/web-search-ui-api-gating'
import { ApiError } from '../errors/api-error'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

export function createWebSearchRoutes(): Router {
  const router = Router()

  router.get('/v1/internal/web-search/status', requireAuth, asyncRoute(async (_request, response) => {
    assertWebSearchUiApiRouteGate('webSearch.internal.status')
    sendOk(response, {
      status: buildWebSearchUiApiStatus(),
      uxState: buildWebSearchUiApiUxState(),
    })
  }))

  router.post('/v1/internal/web-search/plans', requireAuth, asyncRoute(async (request, response) => {
    assertWebSearchUiApiRouteGate('webSearch.internal.plan')
    const body = validateBody(webSearchUiApiRequestSchema, request.body)
    const validation = validateWebSearchUiApiRequest(body)
    if (!validation.ok || !validation.request) {
      throw new ApiError('VALIDATION_FAILED', validation.blockers.join('\n'), 400, {
        reason: 'WEB_SEARCH_GATE_BLOCKED',
        validation,
      })
    }
    const planSnapshot = buildWebSearchUiApiPlanSnapshot({ request: validation.request })
    sendOk(response, { validation, planSnapshot })
  }))

  router.post('/v1/internal/web-search/run-controlled', requireAuth, asyncRoute(async (request, response) => {
    assertWebSearchUiApiRouteGate('webSearch.internal.runControlled')
    const body = validateBody(webSearchUiApiRequestSchema, request.body)
    const validation = validateWebSearchUiApiRequest(body)
    if (!validation.ok || !validation.request) {
      throw new ApiError('VALIDATION_FAILED', validation.blockers.join('\n'), 400, {
        reason: 'WEB_SEARCH_GATE_BLOCKED',
        validation,
      })
    }
    const planSnapshot = buildWebSearchUiApiPlanSnapshot({ request: validation.request })
    const runEnvelope = buildWebSearchUiApiRunEnvelope({ planSnapshot })
    sendOk(response, { validation, runEnvelope }, runEnvelope.warnings, 202)
  }))

  router.get('/v1/internal/web-search/runs/:runId', requireAuth, asyncRoute(async (request, response) => {
    assertWebSearchUiApiRouteGate('webSearch.internal.runStatus')
    const runId = getRouteParam(request, 'runId')
    sendOk(response, {
      runId,
      status: 'gate_only_status_available',
      liveSearchExecuted: false,
      browserCaptureExecuted: false,
      readabilityExtractionExecuted: false,
      paidProviderUsed: false,
      publicSearxngUsed: false,
      warnings: ['Phase 49I run status is an internal gate-only envelope; no live execution artifacts are created by this API route.'],
    })
  }))

  return router
}
