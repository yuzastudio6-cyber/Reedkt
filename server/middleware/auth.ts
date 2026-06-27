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
      const validationUserId = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID?.trim()
      const validationEmail = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL?.trim()
      const isValidationUser = Boolean(validationUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validationUserId))
      const mockUserId = isValidationUser && validationUserId ? validationUserId : 'mock-user-runtime'

      runtimeRequest.context = {
        ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
        auth: {
          userId: mockUserId,
          email: isValidationUser ? validationEmail || 'route-validation@reeditpro.local' : 'mock-user@reeditpro.local',
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

function parseBearerToken(headerValue: string | undefined): string | undefined {
  const match = headerValue?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim()
}
