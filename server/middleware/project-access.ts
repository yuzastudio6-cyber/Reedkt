import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import type { RuntimeRequest } from '../types'

export type RequiredProjectAccess = 'read' | 'write' | 'admin'

export function requireProjectAccess(required: RequiredProjectAccess = 'read') {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      const runtimeRequest = request as RuntimeRequest
      const runtime = runtimeRequest.runtime
      const auth = runtimeRequest.context?.auth
      if (!runtime) throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
      if (!auth) throw new ApiError('AUTH_REQUIRED', 'Authentication is required before project access can be checked.', 401)

      const body = bodyRecord(request)
      const projectId = stringValue(request.params.projectId) ?? stringValue(body.projectId)
      const editSessionId = stringValue(request.params.editSessionId) ?? stringValue(body.editSessionId)
      const briefId = stringValue(request.params.briefId) ?? stringValue(body.briefId)
      const markerId = stringValue(request.params.markerId) ?? stringValue(body.markerId)
      if (!projectId && !editSessionId && !briefId && !markerId) {
        throw new ApiError('VALIDATION_FAILED', 'projectId, editSessionId, briefId, or markerId is required for project access.', 400)
      }

      if (auth.isMockUser && runtime.env.allowMockWithoutSupabase && runtime.env.mode !== 'cloud_run' && runtime.env.nodeEnv !== 'production') {
        runtimeRequest.context = {
          ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
          projectAccess: {
            workspaceId: stringValue(body.workspaceId) ?? 'local-beta-workspace',
            projectId: projectId ?? 'local-beta-project',
            editSessionId,
            briefId,
            markerId,
            role: 'owner',
            canRead: true,
            canWrite: true,
            canAdmin: true,
            isMockAccess: true,
          },
        }
        next()
        return
      }

      throw new ApiError(
        'PROJECT_ACCESS_DENIED',
        `Project ${required} access is fail-closed until the canonical Supabase identity and RLS baseline is approved.`,
        403,
      )
    } catch (error) {
      next(error)
    }
  }
}

function bodyRecord(request: Request): Record<string, unknown> {
  return request.body && typeof request.body === 'object' && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
