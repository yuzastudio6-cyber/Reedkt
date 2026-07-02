import { createHash } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import { createIdempotencyService } from '../services/idempotency-service'
import type { RuntimeRequest } from '../types'

export async function requireIdempotency(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const runtimeRequest = request as RuntimeRequest
    const idempotencyKey = request.header('idempotency-key')?.trim()

    if (!idempotencyKey) {
      throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for this write endpoint.', 400)
    }

    const auth = runtimeRequest.context?.auth
    if (!auth) {
      throw new ApiError('AUTH_REQUIRED', 'Authentication is required before idempotency can be recorded.', 401)
    }

    const workspaceId = resolveWorkspaceId(request)
    if (!workspaceId) {
      throw new ApiError('VALIDATION_FAILED', 'workspaceId is required for idempotent writes.', 400)
    }

    const requestHash = hashRequest(request)
    const runtime = runtimeRequest.runtime

    if (!runtime) {
      throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
    }

    const result = await createIdempotencyService({
      env: runtime.env,
      clients: runtime.clients,
      requestId: runtimeRequest.context?.requestId ?? 'request-unknown',
      auth,
    }).recordOrValidate({
      workspaceId,
      userId: auth.userId,
      idempotencyKey,
      requestMethod: request.method,
      requestPath: request.originalUrl,
      requestHash,
    })

    runtimeRequest.context = {
      ...(runtimeRequest.context ?? { requestId: 'request-unknown' }),
      idempotency: {
        key: idempotencyKey,
        requestHash,
        workspaceId,
        replayed: result.replayed,
      },
    }
    next()
  } catch (error) {
    next(error)
  }
}

function resolveWorkspaceId(request: Request): string | undefined {
  const body = isRecord(request.body) ? request.body : {}
  return stringValue(body.workspaceId) ?? stringValue(request.params.workspaceId)
}

function hashRequest(request: Request): string {
  return createHash('sha256')
    .update(JSON.stringify({
      method: request.method,
      path: request.originalUrl,
      body: request.body ?? {},
    }))
    .digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
