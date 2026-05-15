import type { BackendErrorCode } from './errors'

export interface ServiceError {
  code: BackendErrorCode
  message: string
  details?: unknown
}

export type ServiceResult<T> =
  | {
      ok: true
      data: T
      warnings?: string[]
    }
  | {
      ok: false
      error: ServiceError
    }

export function ok<T>(data: T, warnings?: string[]): ServiceResult<T> {
  return warnings?.length ? { ok: true, data, warnings } : { ok: true, data }
}

export function fail<T = never>(
  code: BackendErrorCode,
  message: string,
  details?: unknown,
): ServiceResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  }
}

export function unwrapServiceResult<T>(result: ServiceResult<T>): T {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  return result.data
}
