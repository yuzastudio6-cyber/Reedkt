import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import type { RuntimeRequest } from '../types'

export const INTERNAL_SERVICE_TOKEN_HEADER = 'x-reeditpro-internal-token'

export function requireInternalServiceAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    const env = (request as RuntimeRequest).runtime?.env
    if (!env) {
      throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    }

    const expectedToken = env.internalServiceToken
    const providedToken = request.header(INTERNAL_SERVICE_TOKEN_HEADER)?.trim()
    if (expectedToken && providedToken && constantTimeTokenEquals(providedToken, expectedToken)) {
      next()
      return
    }

    if (isExplicitLocalInternalRequestAllowed(request, env)) {
      next()
      return
    }

    if (!expectedToken) {
      throw new ApiError(
        'INTERNAL_SERVICE_AUTH_REQUIRED',
        'Internal service authentication is not configured for this runtime.',
        503,
      )
    }

    throw new ApiError(
      providedToken ? 'INTERNAL_SERVICE_AUTH_INVALID' : 'INTERNAL_SERVICE_AUTH_REQUIRED',
      'Valid internal service authentication is required.',
      providedToken ? 403 : 401,
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Requires the configured service token even in an explicit loopback test
 * runtime. Use this for endpoints that mint or consume opaque credentials;
 * those responses must never rely on the broader local-development bypass.
 */
export function requireStrictInternalServiceAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    const env = (request as RuntimeRequest).runtime?.env
    if (!env) {
      throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    }
    const expectedToken = env.internalServiceToken
    const providedToken = request.header(INTERNAL_SERVICE_TOKEN_HEADER)?.trim()
    if (!expectedToken) {
      throw new ApiError(
        'INTERNAL_SERVICE_AUTH_REQUIRED',
        'Internal service authentication is not configured for this runtime.',
        503,
      )
    }
    if (!providedToken || !constantTimeTokenEquals(providedToken, expectedToken)) {
      throw new ApiError(
        providedToken ? 'INTERNAL_SERVICE_AUTH_INVALID' : 'INTERNAL_SERVICE_AUTH_REQUIRED',
        'Valid internal service authentication is required.',
        providedToken ? 403 : 401,
      )
    }
    next()
  } catch (error) {
    next(error)
  }
}

export function isExplicitLocalInternalRequestAllowed(
  request: Request,
  env: NonNullable<RuntimeRequest['runtime']>['env'],
): boolean {
  if (env.nodeEnv === 'production') return false
  if (env.mode !== 'local' && env.mode !== 'mock') return false
  if (!env.allowMockWithoutSupabase && !env.allowInternalTestExecutionWithSupabase) return false

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

function constantTimeTokenEquals(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  if (providedBytes.length !== expectedBytes.length) return false
  return timingSafeEqual(providedBytes, expectedBytes)
}

function isLoopbackHost(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase().replace(/^\[|\]$/g, '')
  return normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1'
}
