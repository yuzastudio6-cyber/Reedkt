import { Router } from 'express'

import {
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import {
  createVisualIntelligenceAuthenticatedReadService,
  parseVisualIntelligenceAuthenticatedReadRequest,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import {
  asyncRoute,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Read-only provider-neutral Visual Intelligence surface. All active analyze,
 * query, compare, and inspection execution now enters exclusively through the
 * Orchestra job route; the former direct execution routes are intentionally
 * not mounted.
 */
export function createVisualIntelligenceRoutes(): Router {
  const router = Router()

  router.post(
    VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE,
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = parseVisualIntelligenceAuthenticatedReadRequest(
        request.body,
      )
      const context = getServiceContext(request)
      assertAuthenticatedScope({
        routeWorkspaceId: getRouteParam(request, 'workspaceId'),
        ownerUserId: body.scope.ownerUserId,
        workspaceId: body.scope.workspaceId,
        authenticatedOwnerUserId: context.auth?.userId,
      })
      if (!context.visualIntelligenceReportRepository) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'The immutable Visual Intelligence report repository is not released in this runtime.',
          503,
          { requiredGate: 'visual_intelligence_report_repository_release' },
        )
      }
      const authenticatedRead = await
        createVisualIntelligenceAuthenticatedReadService({
          reportRepository: context.visualIntelligenceReportRepository,
        }).read({
          authenticatedOwnerUserId: context.auth!.userId,
          request: body,
        })
      sendOk(response, { authenticatedRead }, [
        authenticatedRead.disposition === 'completed'
          ? 'The server reread the exact immutable Visual Intelligence report. Browser-local state cannot promote completion or authority.'
          : 'No exact immutable Visual Intelligence report was found for this request. Historical Qwen evidence is not substituted.',
      ])
    }),
  )

  return router
}

function assertAuthenticatedScope(input: {
  routeWorkspaceId: string
  ownerUserId: string
  workspaceId: string
  authenticatedOwnerUserId?: string
}): void {
  if (
    !input.authenticatedOwnerUserId
    || input.authenticatedOwnerUserId !== input.ownerUserId
    || input.routeWorkspaceId !== input.workspaceId
  ) throw new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'Visual Intelligence request scope is outside the authenticated workspace.',
    403,
  )
}
