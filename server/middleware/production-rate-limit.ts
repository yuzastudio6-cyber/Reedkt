import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import { getServiceContext } from '../routes/route-helpers'
import { createProductionRateLimitService } from '../services/production-rate-limit-service'
import type { RuntimeRequest } from '../types'

export interface ProductionRateLimitMiddlewareInput {
  routeId: string
  maxHits?: number
  windowMs?: number
  scope?: 'project' | 'edit_session' | 'marker'
}

export function requireProductionRateLimit(input: ProductionRateLimitMiddlewareInput) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const runtimeRequest = request as RuntimeRequest
      const auth = runtimeRequest.context?.auth
      const access = runtimeRequest.context?.projectAccess
      if (!auth) throw new ApiError('AUTH_REQUIRED', 'Authentication is required before rate-limit checks.', 401)
      if (!access) throw new ApiError('PROJECT_ACCESS_DENIED', 'Project access is required before rate-limit checks.', 403)

      const result = await createProductionRateLimitService(getServiceContext(request)).assertAllowed({
        routeId: input.routeId,
        workspaceId: access.workspaceId,
        userId: auth.userId,
        projectId: access.projectId,
        editSessionId: input.scope === 'project' ? undefined : access.editSessionId,
        markerId: input.scope === 'marker' ? access.markerId : undefined,
        maxHits: input.maxHits ?? 20,
        windowMs: input.windowMs ?? 60_000,
      })

      runtimeRequest.context = {
        ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
        rateLimit: {
          routeId: result.routeId,
          hitCount: result.hitCount,
          maxHits: result.maxHits,
          windowMs: result.windowMs,
          scopeKey: result.scopeKey,
        },
      }
      response.setHeader('x-ratelimit-limit', String(result.maxHits))
      response.setHeader('x-ratelimit-remaining', String(Math.max(0, result.maxHits - result.hitCount)))
      response.setHeader('x-ratelimit-window-ms', String(result.windowMs))
      next()
    } catch (error) {
      next(error)
    }
  }
}
