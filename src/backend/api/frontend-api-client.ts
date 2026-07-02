import type { ApiRequestEnvelope, ApiResponseEnvelope } from './api-runtime-contracts'
import { createApiBackendRequiredResponse, createApiErrorResponse } from './api-response'
import { getApiRouteById } from './api-route-registry'
import { getBackendApiBaseUrl, getBackendRuntimeStatus } from './backend-runtime-config'
import { createMockApiRuntimeContext, handleMockApiRequest } from './mock-api-router'

export interface FrontendApiClientStatus {
  mode: ReturnType<typeof getBackendRuntimeStatus>['mode']
  apiBaseUrl?: string
  mockOnly: boolean
  message: string
  warnings: string[]
}

export function getFrontendApiClientStatus(): FrontendApiClientStatus {
  const runtime = getBackendRuntimeStatus()

  return {
    mode: runtime.mode,
    apiBaseUrl: runtime.configuredApiBaseUrl,
    mockOnly: runtime.mockOnly,
    message: runtime.mockOnly
      ? 'Frontend API client is using the local mock router.'
      : 'Frontend API client has a configured backend URL, but live transport remains gated in RP-FIX-08.',
    warnings: runtime.warnings,
  }
}

export async function callMockReeditProApi<TBody = unknown, TData = unknown>(
  routeId: string,
  body?: TBody,
  options: {
    params?: Record<string, string>
    query?: Record<string, string>
    context?: Partial<ApiRequestEnvelope<TBody>['context']>
  } = {},
): Promise<ApiResponseEnvelope<TData>> {
  return handleMockApiRequest<TBody, TData>({
    routeId,
    body,
    params: options.params,
    query: options.query,
    context: createMockApiRuntimeContext(options.context),
  })
}

export async function callReeditProApi<TBody = unknown, TData = unknown>(
  routeId: string,
  body?: TBody,
  options: {
    params?: Record<string, string>
    query?: Record<string, string>
    context?: Partial<ApiRequestEnvelope<TBody>['context']>
  } = {},
): Promise<ApiResponseEnvelope<TData>> {
  const runtime = getBackendRuntimeStatus()
  const route = getApiRouteById(routeId)

  if (!route) {
    return createApiErrorResponse('unknown_route', `${routeId} is not registered in the API route map.`, {
      statusCode: 404,
      warnings: ['No backend or mock call was attempted.'],
      mockOnly: true,
    }) as ApiResponseEnvelope<TData>
  }

  if (runtime.mockOnly || runtime.mode === 'mock') {
    return callMockReeditProApi<TBody, TData>(routeId, body, options)
  }

  if (
    route.requiresServiceRole ||
    route.requiresProviderSecret ||
    route.requiresStripeSecret ||
    route.status === 'disabled' ||
    route.status === 'backend_required'
  ) {
    return createApiBackendRequiredResponse(routeId, route.notes) as ApiResponseEnvelope<TData>
  }

  const apiBaseUrl = getBackendApiBaseUrl()

  return createApiErrorResponse(
    'http_transport_not_enabled',
    `${routeId} is registered, but live HTTP transport is intentionally disabled in RP-FIX-08.`,
    {
      statusCode: apiBaseUrl ? 501 : 503,
      warnings: [
        'This client prepares the frontend/backend boundary without making live API calls yet.',
        'Use mock mode until a reviewed backend runtime is deployed.',
      ],
      mockOnly: true,
    },
  ) as ApiResponseEnvelope<TData>
}
