import type { ApiResponseEnvelope } from './api-runtime-contracts'

export function createApiSuccessResponse<TData>(
  data: TData,
  options: {
    statusCode?: number
    requestId?: string
    warnings?: string[]
    mockOnly?: boolean
  } = {},
): ApiResponseEnvelope<TData> {
  return {
    ok: true,
    status: 'ok',
    statusCode: options.statusCode ?? 200,
    requestId: options.requestId,
    data,
    warnings: options.warnings ?? [],
    mockOnly: options.mockOnly ?? false,
  }
}

export function createApiErrorResponse(
  code: string,
  message: string,
  options: {
    statusCode?: number
    status?: string
    requestId?: string
    details?: unknown
    warnings?: string[]
    mockOnly?: boolean
  } = {},
): ApiResponseEnvelope {
  return {
    ok: false,
    status: options.status ?? normalizeStatus(code, options.statusCode ?? 500),
    statusCode: options.statusCode ?? 500,
    requestId: options.requestId,
    error: {
      code,
      message,
      details: options.details,
    },
    warnings: options.warnings ?? [],
    mockOnly: options.mockOnly ?? false,
  }
}

export function createApiNotImplementedResponse(
  routeId: string,
  warnings: string[] = [],
): ApiResponseEnvelope {
  return createApiErrorResponse(
    'not_implemented',
    `${routeId} does not have a mock handler yet.`,
    {
      statusCode: 501,
      status: 'not_implemented',
      warnings,
      mockOnly: true,
    },
  )
}

export function createApiBackendRequiredResponse(
  routeId: string,
  warnings: string[] = [],
): ApiResponseEnvelope {
  return createApiErrorResponse(
    'backend_runtime_required',
    `${routeId} requires a backend runtime before it can run outside mock mode.`,
    {
      statusCode: 424,
      status: 'backend_required',
      warnings: [
        'This operation is intentionally blocked in the frontend-safe mock runtime.',
        ...warnings,
      ],
      mockOnly: true,
    },
  )
}

export function createApiNotConfiguredResponse(
  routeId: string,
  warnings: string[] = [],
): ApiResponseEnvelope {
  return createApiErrorResponse(
    'not_configured',
    `${routeId} is not configured for live runtime.`,
    {
      statusCode: 503,
      status: 'environment_blocked',
      warnings,
      mockOnly: true,
    },
  )
}

export function createApiForbiddenResponse(
  routeId: string,
  warnings: string[] = [],
): ApiResponseEnvelope {
  return createApiErrorResponse(
    'forbidden',
    `${routeId} is not allowed for the current runtime context.`,
    {
      statusCode: 403,
      status: 'forbidden',
      warnings,
      mockOnly: true,
    },
  )
}

function normalizeStatus(code: string, statusCode: number): string {
  if (code.includes('backend') || statusCode === 424) return 'backend_required'
  if (code.includes('forbidden') || statusCode === 403) return 'forbidden'
  if (code.includes('unauthorized') || statusCode === 401) return 'unauthorized'
  if (code.includes('validation') || statusCode === 400) return 'validation_failed'
  if (statusCode === 501) return 'not_implemented'
  if (statusCode === 503) return 'environment_blocked'
  return 'error'
}

export function createApiMockResponse<TData>(
  data: TData,
  warnings: string[] = [],
): ApiResponseEnvelope<TData> {
  return createApiSuccessResponse(data, {
    warnings: [
      'Mock API response only; no backend route, provider, worker, storage upload, render, or payment call was made.',
      ...warnings,
    ],
    mockOnly: true,
  })
}
