import { createHash } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/api-error'
import {
  createIdempotencyService,
  type IdempotencyReservation,
  type InMemoryIdempotencyStore,
} from '../services/idempotency-service'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import type { RuntimeRequest } from '../types'

const REPLAYABLE_RESPONSE_HEADERS = [
  'cache-control',
  'content-disposition',
  'content-language',
  'content-type',
  'etag',
  'location',
  'retry-after',
] as const

export interface RequireIdempotencyOptions {
  store?: InMemoryIdempotencyStore
}

export function createRequireIdempotency(options: RequireIdempotencyOptions = {}) {
  return async function idempotencyMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const runtimeRequest = request as RuntimeRequest
      const idempotencyKey = normalizeIdempotencyKey(request.header('idempotency-key'))

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

      const runtime = runtimeRequest.runtime

      if (!runtime) {
        throw new ApiError('INTERNAL_ERROR', 'Runtime state was not attached to the request.', 500)
      }

      const serviceContext = {
        env: runtime.env,
        clients: runtime.clients,
        storageAdapter: runtime.storageAdapter,
        editReferenceSignedInPrivateMediaRuntimePort:
          runtime.editReferenceSignedInPrivateMediaRuntimePort,
        requestId: runtimeRequest.context?.requestId ?? 'request-unknown',
        auth,
      }

      // Authorization must happen before even a local reservation is created.
      // A denied tenant request therefore cannot poison another tenant's key.
      await authorizeWorkspaceAccess(serviceContext, workspaceId, 'write')

      const requestHash = hashRequest(request)
      const service = createIdempotencyService(serviceContext, options.store)
      const result = service.begin({
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
          replayed: result.kind === 'replay',
        },
      }

      if (result.kind === 'replay') {
        replayCompletedResponse(response, result.response)
        return
      }

      installResponseRecorder(response, service, result.reservation)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const requireIdempotency = createRequireIdempotency()

/**
 * Validates the write key without caching a response body.
 *
 * Use this only when the underlying domain service owns durable/serialized
 * idempotency itself and the response contains an opaque credential or other
 * bearer material that must not be retained in the generic replay cache.
 */
export function requireSensitiveIdempotencyKey(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    const idempotencyKey = normalizeIdempotencyKey(request.header('idempotency-key'))
    if (!idempotencyKey) {
      throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for this write endpoint.', 400)
    }
    next()
  } catch (error) {
    next(error)
  }
}

function installResponseRecorder(
  response: Response,
  service: ReturnType<typeof createIdempotencyService>,
  reservation: IdempotencyReservation,
): void {
  const originalWrite = response.write
  const originalEnd = response.end
  const chunks: Buffer[] = []
  const maxResponseBytes = service.maxResponseBytes
  let capturedBytes = 0
  let replayable = true
  let finalized = false
  let ending = false

  const capture = (chunk: unknown, encoding: unknown): void => {
    if (finalized || chunk === undefined || typeof chunk === 'function') return
    const buffer = toBuffer(chunk, encoding)
    if (!buffer || capturedBytes + buffer.byteLength > maxResponseBytes) {
      replayable = false
      chunks.length = 0
      capturedBytes = 0
      return
    }
    if (!replayable) return
    chunks.push(buffer)
    capturedBytes += buffer.byteLength
  }

  response.write = ((...args: unknown[]) => {
    capture(args[0], args[1])
    return Reflect.apply(originalWrite, response, args) as boolean
  }) as Response['write']

  response.end = ((...args: unknown[]) => {
    capture(args[0], args[1])
    ending = true
    try {
      const result = Reflect.apply(originalEnd, response, args) as Response
      finalized = true
      if (response.statusCode >= 500) {
        sealUnreplayable(service, reservation, response.statusCode)
      } else {
        const completed = service.complete(reservation, {
          statusCode: response.statusCode,
          headers: snapshotReplayableHeaders(response),
          body: replayable ? Buffer.concat(chunks, capturedBytes) : undefined,
          replayable,
        })
        if (!completed) {
          console.error(JSON.stringify({
            event: 'idempotency_local_completion_lost',
            status: response.statusCode,
          }))
        }
      }
      return result
    } catch (error) {
      finalized = true
      sealUnreplayable(service, reservation, 500)
      throw error
    } finally {
      ending = false
    }
  }) as Response['end']

  response.once('close', () => {
    if (finalized || ending) return
    finalized = true
    // Once the handler has started, the middleware cannot prove that a closed
    // connection happened before the business mutation. Seal the key instead
    // of risking a duplicate side effect on retry.
    sealUnreplayable(service, reservation, 503)
  })
}

function sealUnreplayable(
  service: ReturnType<typeof createIdempotencyService>,
  reservation: IdempotencyReservation,
  statusCode: number,
): void {
  service.complete(reservation, {
    statusCode,
    headers: {},
    replayable: false,
  })
}

function replayCompletedResponse(
  response: Response,
  replay: { statusCode: number; headers: Record<string, string | string[]>; body: Buffer },
): void {
  response.status(replay.statusCode)
  for (const [name, value] of Object.entries(replay.headers)) {
    response.setHeader(name, value)
  }
  response.setHeader('content-length', String(replay.body.byteLength))
  response.setHeader('idempotency-replayed', 'true')
  response.end(Buffer.from(replay.body))
}

function snapshotReplayableHeaders(response: Response): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {}
  for (const name of REPLAYABLE_RESPONSE_HEADERS) {
    const value = response.getHeader(name)
    if (typeof value === 'string') headers[name] = value
    else if (typeof value === 'number') headers[name] = String(value)
    else if (Array.isArray(value)) headers[name] = value.map(String)
  }
  return headers
}

function toBuffer(chunk: unknown, encoding: unknown): Buffer | undefined {
  if (typeof chunk === 'string') {
    return Buffer.from(chunk, isBufferEncoding(encoding) ? encoding : 'utf8')
  }
  if (Buffer.isBuffer(chunk)) return Buffer.from(chunk)
  if (chunk instanceof Uint8Array) return Buffer.from(chunk)
  return undefined
}

function isBufferEncoding(value: unknown): value is BufferEncoding {
  return typeof value === 'string' && Buffer.isEncoding(value)
}

function resolveWorkspaceId(request: Request): string | undefined {
  const body = isRecord(request.body) ? request.body : {}
  return stringValue(body.workspaceId) ?? stringValue(request.params.workspaceId)
}

function hashRequest(request: Request): string {
  const hash = createHash('sha256')
    .update(request.method)
    .update('\0')
    .update(request.originalUrl)
    .update('\0')

  if (Buffer.isBuffer(request.body)) {
    hash.update(request.body)
  } else {
    hash.update(JSON.stringify(request.body ?? {}))
  }

  return hash.digest('hex')
}

function normalizeIdempotencyKey(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  if (!normalized) return undefined
  if (normalized.length > 200 || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Idempotency-Key must be 1-200 safe ASCII characters.',
      400,
    )
  }
  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
