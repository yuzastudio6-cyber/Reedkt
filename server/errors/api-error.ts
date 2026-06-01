import type { Request } from 'express'
import type { ApiErrorCode } from './error-codes'
import type { RuntimeRequest } from '../types'

export interface ApiErrorEnvelope {
  ok: false
  status: string
  requestId: string
  error: {
    code: ApiErrorCode
    message: string
    status: number
    request_id: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function createApiErrorEnvelope(error: ApiError, requestId: string): ApiErrorEnvelope {
  return {
    ok: false,
    status: statusForError(error),
    requestId,
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      request_id: requestId,
      ...(error.details === undefined ? {} : { details: redactDetails(error.details) }),
    },
  }
}

export function getRequestId(request: Request): string {
  return (request as RuntimeRequest).context?.requestId ?? 'request-unknown'
}

export function normalizeUnknownError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError('INTERNAL_ERROR', 'Unexpected backend runtime error.', 500)
  return new ApiError('INTERNAL_ERROR', 'Unexpected backend runtime error.', 500)
}

function statusForError(error: ApiError): string {
  if (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_INVALID') return 'unauthorized'
  if (error.code === 'WORKSPACE_ACCESS_DENIED') return 'forbidden'
  if (error.code === 'VALIDATION_FAILED') return 'validation_failed'
  if (error.code === 'IDEMPOTENCY_CONFLICT') return 'idempotency_conflict'
  if (error.code === 'BACKEND_REQUIRED') return 'backend_required'
  if (error.code === 'IDEMPOTENCY_KEY_REQUIRED') return 'validation_failed'
  if (error.status === 501) return 'not_implemented'
  if (error.status === 424) return 'dependency_missing'
  return 'error'
}

function redactDetails(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactDetails)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => {
      if (isSensitiveKey(key)) return [key, '[redacted]']
      return [key, redactDetails(child)]
    }),
  )
}

function isSensitiveKey(key: string): boolean {
  return /secret|token|password|credential|private.?key|service.?role|api.?key|signed.?url|client.?secret/i.test(key)
}
