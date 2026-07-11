import type { Request } from 'express'
import type { ApiErrorCode } from './error-codes'
import { sanitizeJsonValue, sanitizeText } from '../security/redaction'
import type { RuntimeRequest } from '../types'

const PUBLIC_INTERNAL_ERROR_MESSAGE = 'The request could not be completed.'

export interface ApiErrorEnvelope {
  ok: false
  statusCode: number
  error: {
    code: ApiErrorCode
    message: string
    status: number
    request_id: string
    details?: unknown
  }
  warnings: string[]
  mockOnly: boolean
}

export interface ApiErrorOptions {
  cause?: unknown
  internal?: boolean
}

export interface ApiErrorEnvelopeOptions {
  exposeInternalDetails?: boolean
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown
  readonly internal: boolean
  readonly internalCause?: unknown

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 400,
    details?: unknown,
    options: ApiErrorOptions = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
    this.internal = options.internal ?? code === 'INTERNAL_ERROR'
    this.internalCause = options.cause
  }
}

export function createApiErrorEnvelope(
  error: ApiError,
  requestId: string,
  options: ApiErrorEnvelopeOptions = {},
): ApiErrorEnvelope {
  const hideInternalDetails = error.internal && !options.exposeInternalDetails
  const code = hideInternalDetails ? 'INTERNAL_ERROR' : error.code
  const message = hideInternalDetails ? PUBLIC_INTERNAL_ERROR_MESSAGE : sanitizeText(error.message)
  const status = hideInternalDetails ? 500 : error.status
  const safeRequestId = sanitizeText(requestId, 128)
  const details = hideInternalDetails || error.details === undefined
    ? undefined
    : sanitizeJsonValue(error.details)

  return {
    ok: false,
    statusCode: status,
    error: {
      code,
      message,
      status,
      request_id: safeRequestId,
      ...(details === undefined ? {} : { details }),
    },
    warnings: [],
    mockOnly: false,
  }
}

export function getRequestId(request: Request): string {
  return (request as RuntimeRequest).context?.requestId ?? 'request-unknown'
}

export function shouldExposeInternalErrorDetails(request: Request): boolean {
  const env = (request as RuntimeRequest).runtime?.env
  return Boolean(
    env &&
    (env.nodeEnv === 'development' || env.nodeEnv === 'test') &&
    (env.mode === 'local' || env.mode === 'mock'),
  )
}

export function normalizeUnknownError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isPayloadTooLargeError(error)) {
    return new ApiError('VALIDATION_FAILED', 'Request payload is too large for this backend route.', 413)
  }
  if (error instanceof Error) {
    return new ApiError('INTERNAL_ERROR', error.message, 500, undefined, {
      cause: error,
      internal: true,
    })
  }
  return new ApiError('INTERNAL_ERROR', 'Unexpected backend runtime error.', 500, undefined, {
    cause: error,
    internal: true,
  })
}

export function createApiErrorLogRecord(
  error: ApiError,
  requestId: string,
  request?: Pick<Request, 'method' | 'path'>,
): Record<string, unknown> {
  return {
    event: 'api_request_error',
    request_id: sanitizeText(requestId, 128),
    method: request?.method ? sanitizeText(request.method, 16) : undefined,
    path: request?.path ? sanitizeText(request.path, 512) : undefined,
    code: error.code,
    status: error.status,
    internal: error.internal,
    error: sanitizeJsonValue({
      name: error.name,
      message: error.message,
      details: error.details,
    }),
    cause: summarizeInternalCause(error.internalCause),
  }
}

function isPayloadTooLargeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { status?: unknown; statusCode?: unknown; type?: unknown }
  return (
    candidate.type === 'entity.too.large' ||
    candidate.status === 413 ||
    candidate.statusCode === 413
  )
}

function summarizeInternalCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    const candidate = cause as Error & {
      code?: unknown
      status?: unknown
      statusCode?: unknown
      type?: unknown
    }
    return sanitizeJsonValue({
      name: candidate.name,
      message: candidate.message,
      code: candidate.code,
      status: candidate.status ?? candidate.statusCode,
      type: candidate.type,
    })
  }

  return sanitizeJsonValue(cause)
}
