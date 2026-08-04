import type { NextFunction, Request, Response } from 'express'
import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import type { RuntimeRequest } from '../types'
import {
  REEDITPRO_USER_AUTHORIZATION_HEADER,
  assertAuthenticatedUserMatchesGateway,
  parseBearerToken,
  resolveBrowserUserAuthentication,
} from './browser-api-auth-transport'

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const runtimeRequest = request as RuntimeRequest
    const env = runtimeRequest.runtime?.env
    const publicClient = runtimeRequest.runtime?.clients.public

    if (!env) {
      throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    }

    const directToken = parseBearerToken(request.header('authorization'))

    if (
      !directToken &&
      !request.header(REEDITPRO_USER_AUTHORIZATION_HEADER) &&
      isLocalMockAuthRequestAllowed(request, env)
    ) {
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

    const authentication = resolveBrowserUserAuthentication(request, env)

    if (!publicClient) {
      throw new ApiError('AUTH_INVALID', 'Supabase auth client is unavailable for token verification.', 401)
    }

    const { data, error } = await publicClient.auth.getUser(authentication.accessToken)
    if (error || !data.user) {
      throw new ApiError('AUTH_INVALID', 'Authorization token could not be verified.', 401)
    }
    assertAuthenticatedUserMatchesGateway(authentication, data.user)

    runtimeRequest.context = {
      ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
      auth: {
        userId: data.user.id,
        email: data.user.email,
        accessToken: authentication.accessToken,
        user: data.user,
        isMockUser: false,
      },
    }
    next()
  } catch (error) {
    next(error)
  }
}

export function isLocalMockAuthRequestAllowed(request: Request, env: RuntimeEnv): boolean {
  if (!env.allowMockWithoutSupabase) return false
  if (env.nodeEnv === 'production') return false
  if (env.mode !== 'local' && env.mode !== 'mock') return false

  const remoteAddress = request.socket?.remoteAddress ?? request.ip
  if (!isLoopbackHost(remoteAddress)) return false

  const origin = request.header('origin')
  if (!origin) return true

  try {
    return isLoopbackHost(new URL(origin).hostname)
  } catch {
    return false
  }
}

function isLoopbackHost(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase().replace(/^\[|\]$/g, '')
  return normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1'
}
