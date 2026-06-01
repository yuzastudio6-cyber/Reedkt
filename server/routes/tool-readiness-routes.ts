import { Router } from 'express'
import {
  getToolReadiness,
  getToolReadinessDiagnosticsSummary,
  listToolReadiness,
} from '../foundation/tool-readiness'
import { requireAuth } from '../middleware/auth'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

export function createToolReadinessRoutes(): Router {
  const router = Router()

  router.get('/v1/tool-readiness', requireAuth, asyncRoute(async (_request, response) => {
    sendOk(response, { toolReadiness: listToolReadiness() })
  }))

  router.get('/v1/tool-readiness/diagnostics/summary', requireAuth, asyncRoute(async (_request, response) => {
    sendOk(response, { toolReadiness: getToolReadinessDiagnosticsSummary() })
  }))

  router.get('/v1/tool-readiness/:toolId', requireAuth, asyncRoute(async (request, response) => {
    sendOk(response, {
      toolReadiness: getToolReadiness(getRouteParam(request, 'toolId')),
    })
  }))

  return router
}
