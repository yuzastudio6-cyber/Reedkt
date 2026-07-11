import type { ApiRequestEnvelope, ApiResponseEnvelope, ApiRouteDefinition } from './api-runtime-contracts'
import { createApiBackendRequiredResponse, createApiErrorResponse } from './api-response'
import { getApiRouteById } from './api-route-registry'
import { getBackendApiBaseUrl, getBackendRuntimeStatus } from './backend-runtime-config'

type RuntimeEnvRecord = Record<string, string | undefined>

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: RuntimeEnvRecord
  }
  location?: {
    hostname?: string
  }
}

type ReeditProApiCallOptions<TBody = unknown> = {
  params?: Record<string, string>
  query?: Record<string, string>
  context?: Partial<ApiRequestEnvelope<TBody>['context']>
  idempotencyKey?: string
}

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
      : 'Frontend API client can call reviewed backend HTTP routes and keeps unsafe routes gated.',
    warnings: runtime.warnings,
  }
}

export async function callMockReeditProApi<TBody = unknown, TData = unknown>(
  routeId: string,
  body?: TBody,
  options: ReeditProApiCallOptions<TBody> = {},
): Promise<ApiResponseEnvelope<TData>> {
  const { createMockApiRuntimeContext, handleMockApiRequest } = await import('./mock-api-router')

  return handleMockApiRequest<TBody, TData>({
    routeId,
    body,
    params: options.params,
    query: options.query,
    idempotencyKey: options.idempotencyKey,
    context: createMockApiRuntimeContext(options.context),
  })
}

export async function callReeditProApi<TBody = unknown, TData = unknown>(
  routeId: string,
  body?: TBody,
  options: ReeditProApiCallOptions<TBody> = {},
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

  if (!apiBaseUrl) {
    return createApiErrorResponse(
      'backend_api_base_url_missing',
      `${routeId} is registered for backend HTTP transport, but VITE_REEDITPRO_API_BASE_URL is not configured.`,
      {
        statusCode: 503,
        warnings: [
          'No backend HTTP call was attempted.',
          ...route.notes,
        ],
        mockOnly: true,
      },
    ) as ApiResponseEnvelope<TData>
  }

  if (!isHttpTransportRoute(route)) {
    if (route.mockHandlerName) {
      return callMockReeditProApi<TBody, TData>(routeId, body, options)
    }

    return createApiErrorResponse(
      'http_transport_route_not_enabled',
      `${routeId} is not exposed as a reviewed frontend HTTP route.`,
      {
        statusCode: 424,
        warnings: [
          'Only reviewed /v1 route contracts are eligible for frontend HTTP transport.',
          ...route.notes,
        ],
        mockOnly: true,
      },
    ) as ApiResponseEnvelope<TData>
  }

  return callReeditProHttpRoute<TBody, TData>(route, apiBaseUrl, body, options)
}

function isHttpTransportRoute(route: ApiRouteDefinition): boolean {
  return route.path.startsWith('/v1/')
}

async function callReeditProHttpRoute<TBody, TData>(
  route: ApiRouteDefinition,
  apiBaseUrl: string,
  body: TBody | undefined,
  options: ReeditProApiCallOptions<TBody>,
): Promise<ApiResponseEnvelope<TData>> {
  try {
    const url = buildBackendRouteUrl(apiBaseUrl, route.path, options.params, options.query)
    const headers = new Headers()
    headers.set('accept', 'application/json')
    headers.set('x-request-id', createRequestId(route.id))

    if (route.method !== 'GET') {
      headers.set('content-type', 'application/json')
      headers.set('idempotency-key', options.idempotencyKey ?? createClientIdempotencyKey(route.id))
    }

    const authorization = await getReeditProApiAuthorizationHeader()
    if (authorization) {
      headers.set('authorization', authorization)
    }

    const response = await fetch(url, {
      method: route.method,
      // ReeditPro authenticates reviewed browser API calls with an explicit
      // Supabase bearer token (or the guarded loopback local-test identity),
      // never ambient cookies. Omitting credentials keeps credentialed CORS
      // disabled and prevents unrelated browser cookies from crossing origins.
      credentials: 'omit',
      headers,
      body: route.method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    })
    const payload = await parseJsonResponse(response)

    return normalizeHttpApiResponse<TData>(payload, response.status)
  } catch (error) {
    return createApiErrorResponse(
      'http_transport_failed',
      error instanceof Error ? error.message : `${route.id} backend HTTP transport failed.`,
      {
        statusCode: 503,
        warnings: [
          'Backend HTTP transport failed before ReEditPro could complete the route call.',
          ...route.notes,
        ],
        mockOnly: false,
      },
    ) as ApiResponseEnvelope<TData>
  }
}

function buildBackendRouteUrl(
  apiBaseUrl: string,
  routePath: string,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
): string {
  const path = routePath.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key]
    if (!value) {
      throw new Error(`Missing route parameter ${key} for ${routePath}.`)
    }
    return encodeURIComponent(value)
  })
  const url = new URL(path, normalizeBaseUrl(apiBaseUrl))

  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value)
  }

  return url.toString()
}

function normalizeBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
}

export async function getReeditProApiAuthorizationHeader(): Promise<string | undefined> {
  const e2eAuthorization = getE2EReeditProApiAuthorizationHeader()
  if (e2eAuthorization) return e2eAuthorization

  const { getSupabaseClient } = await import('../supabase/supabase-client')
  const client = getSupabaseClient()
  if (!client) return undefined

  const { data } = await client.auth.getSession()
  const token = data.session?.access_token
  return token ? `Bearer ${token}` : undefined
}

function getE2EReeditProApiAuthorizationHeader(): string | undefined {
  const env = getRuntimeEnv()
  const enabled = env.VITE_REEDITPRO_E2E === 'true'
  const token = env.VITE_REEDITPRO_E2E_AUTH_TOKEN?.trim()

  if (!enabled || !token || !isLoopbackBrowserHost()) return undefined

  return `Bearer ${token}`
}

function getRuntimeEnv(): RuntimeEnvRecord {
  const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnvRecord }).env
  const processEnv = (globalThis as RuntimeGlobal).process?.env
  return viteEnv ?? processEnv ?? {}
}

function isLoopbackBrowserHost(): boolean {
  const hostname = (globalThis as RuntimeGlobal).location?.hostname
  if (!hostname) return true
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) {
    return {
      ok: response.ok,
      warnings: [],
    }
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid_json_response',
        message: `Backend returned non-JSON response with status ${response.status}.`,
      },
      warnings: [],
    }
  }
}

function normalizeHttpApiResponse<TData>(payload: unknown, statusCode: number): ApiResponseEnvelope<TData> {
  if (isApiResponseLike<TData>(payload)) {
    return {
      ok: payload.ok,
      statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : statusCode,
      data: payload.data,
      error: payload.error,
      warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
      mockOnly: payload.mockOnly === true,
    }
  }

  return createApiErrorResponse(
    'invalid_backend_response',
    'Backend response did not match the ReEditPro API envelope.',
    {
      statusCode,
      details: payload,
      warnings: [],
      mockOnly: false,
    },
  ) as ApiResponseEnvelope<TData>
}

function isApiResponseLike<TData>(value: unknown): value is Partial<ApiResponseEnvelope<TData>> & { ok: boolean } {
  return Boolean(value && typeof value === 'object' && typeof (value as { ok?: unknown }).ok === 'boolean')
}

function createClientIdempotencyKey(routeId: string): string {
  return `frontend:${routeId}:${createRequestId(routeId)}`
}

function createRequestId(routeId: string): string {
  const randomId = globalThis.crypto?.randomUUID?.()
  return randomId ?? `${routeId}:${Date.now()}:${Math.random().toString(36).slice(2)}`
}
