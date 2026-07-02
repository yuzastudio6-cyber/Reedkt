import type { ApiResponseEnvelope } from './api-runtime-contracts'

export function createApiSuccessResponse<TData>(
  data: TData,
  options: {
    statusCode?: number
    warnings?: string[]
    mockOnly?: boolean
  } = {},
): ApiResponseEnvelope<TData> {
  return {
    ok: true,
    statusCode: options.statusCode ?? 200,
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
    details?: unknown
    warnings?: string[]
    mockOnly?: boolean
  } = {},
): ApiResponseEnvelope {
  return {
    ok: false,
    statusCode: options.statusCode ?? 500,
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
      warnings,
      mockOnly: true,
    },
  )
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
