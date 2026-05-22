import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import type { RuntimeRequest } from '../types'

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const runtimeRequest = request as RuntimeRequest
    const env = runtimeRequest.runtime?.env
    const publicClient = runtimeRequest.runtime?.clients.public

    if (!env) {
      throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    }

    const token = parseBearerToken(request.header('authorization'))

    if (!token && env.allowMockWithoutSupabase) {
      runtimeRequest.context = {
        ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
        auth: {
          userId: 'mock-user-runtime',
          email: 'mock-user@reeditpro.local',
          isMockUser: true,
        },
      }
      next()
      return
    }

    if (!token) {
      throw new ApiError('AUTH_REQUIRED', 'Authorization bearer token is required.', 401)
    }

    if (!publicClient) {
      throw new ApiError('AUTH_INVALID', 'Supabase auth client is unavailable for token verification.', 401)
    }

    const { data, error } = await publicClient.auth.getUser(token)
    if (error || !data.user) {
      throw new ApiError('AUTH_INVALID', 'Authorization token could not be verified.', 401)
    }

    runtimeRequest.context = {
      ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
      auth: {
        userId: data.user.id,
        email: data.user.email,
        user: data.user,
        isMockUser: false,
      },
    }
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireLiveUserAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  await requireAuth(request, response, (error?: unknown) => {
    if (error) {
      next(error)
      return
    }

    const runtimeRequest = request as RuntimeRequest
    const env = runtimeRequest.runtime?.env
    const auth = runtimeRequest.context?.auth
    if (env?.supabaseE2eSmokeMode === 'live' && auth?.isMockUser) {
      next(new ApiError('AUTH_INVALID', 'Live Supabase write routes require verified user auth; mock auth is local-only.', 401))
      return
    }
    next()
  })
}

export async function requireBackendOrWorkerAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  await requireAuth(request, response, (error?: unknown) => {
    if (error) {
      next(error)
      return
    }

    const runtimeRequest = request as RuntimeRequest
    const env = runtimeRequest.runtime?.env
    const auth = runtimeRequest.context?.auth
    if (env?.supabaseE2eSmokeMode === 'live' && auth?.isMockUser) {
      next(new ApiError('AUTH_INVALID', 'Live backend/worker routes require verified backend or worker auth; mock auth is local-only.', 401))
      return
    }
    next()
  })
}

export function requireLiveSupabaseWriteAccess(request: Request, _response: Response, next: NextFunction): void {
  try {
    const runtimeRequest = request as RuntimeRequest
    const env = runtimeRequest.runtime?.env
    const auth = runtimeRequest.context?.auth
    if (!env) throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    if (env.supabaseE2eSmokeMode !== 'live') {
      throw new ApiError('SUPABASE_SMOKE_DISABLED', 'SUPABASE_E2E_SMOKE_MODE=live is required for this route.', 409)
    }
    if (!env.supabaseE2eAllowWrites) {
      throw new ApiError('SUPABASE_WRITE_NOT_ALLOWED', 'SUPABASE_E2E_ALLOW_WRITES=true is required for this route.', 403)
    }
    if (!env.hasSupabaseAdmin || !runtimeRequest.runtime?.clients.admin) {
      throw new ApiError('SUPABASE_WRITE_NOT_ALLOWED', 'Supabase service-role client is required for this route.', 503)
    }
    if (!auth || auth.isMockUser) {
      throw new ApiError('AUTH_INVALID', 'Verified non-mock auth is required for live Supabase writes.', 401)
    }
    next()
  } catch (error) {
    next(error)
  }
}

function parseBearerToken(headerValue: string | undefined): string | undefined {
  const match = headerValue?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim()
}
