import type { ServerResponse } from 'node:http'
import type { ServerRuntimeConfig } from './server-runtime-config'

export interface ServerJsonResponse<TBody = unknown> {
  statusCode: number
  body: TBody
  headers: Record<string, string>
}

export function createJsonResponse<TBody>(
  body: TBody,
  statusCode = 200,
  headers: Record<string, string> = {},
): ServerJsonResponse<TBody> {
  return {
    statusCode,
    body,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  }
}

export function createHealthResponse(config: ServerRuntimeConfig): ServerJsonResponse {
  return createJsonResponse({
    ok: true,
    service: 'reeditpro-backend',
    mode: config.mode,
    mockOnly: config.mockOnly,
  })
}

export function createReadinessResponse(input: {
  config: ServerRuntimeConfig
  warnings: string[]
}): ServerJsonResponse {
  return createJsonResponse({
    ok: true,
    service: 'reeditpro-backend',
    mode: input.config.mode,
    supabaseServiceRoleConfigured: input.config.supabaseServiceRoleConfigured,
    providerSecretsConfigured: input.config.providerSecretsConfigured,
    stripeConfigured: input.config.stripeConfigured,
    googleCloudConfigured: input.config.googleCloudConfigured,
    mockOnly: input.config.mockOnly,
    warnings: input.warnings,
  })
}

export function createServerErrorResponse(message: string, statusCode = 500): ServerJsonResponse {
  return createJsonResponse({
    ok: false,
    error: {
      code: 'server_error',
      message,
    },
  }, statusCode)
}

export function createNotFoundResponse(pathname: string): ServerJsonResponse {
  return createJsonResponse({
    ok: false,
    error: {
      code: 'not_found',
      message: `Route not found: ${pathname}`,
    },
  }, 404)
}

export function sendJsonResponse(response: ServerResponse, jsonResponse: ServerJsonResponse): void {
  response.writeHead(jsonResponse.statusCode, jsonResponse.headers)
  response.end(JSON.stringify(jsonResponse.body))
}
