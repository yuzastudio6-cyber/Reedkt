import type { Request } from 'express'
import type { ApiErrorCode } from './error-codes'
import type { RuntimeRequest } from '../types'

export interface ApiErrorEnvelope {
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
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      request_id: requestId,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  }
}

export function getRequestId(request: Request): string {
  return (request as RuntimeRequest).context?.requestId ?? 'request-unknown'
}

export function normalizeUnknownError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError('INTERNAL_ERROR', error.message, 500)
  return new ApiError('INTERNAL_ERROR', 'Unexpected backend runtime error.', 500)
}
