import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { ApiRequestEnvelope } from '../backend/api/api-runtime-contracts'
import { createApiRouteMapSummary, REEDITPRO_API_ROUTES } from '../backend/api/api-route-registry'
import { createMockApiRuntimeContext, handleMockApiRequest } from '../backend/api/mock-api-router'
import { getBackendEnvStatus } from './server-env'
import { createHealthResponse, createJsonResponse, createNotFoundResponse, createReadinessResponse, createServerErrorResponse, sendJsonResponse } from './server-response'
import { getServerRuntimeConfig, getServerRuntimeWarnings } from './server-runtime-config'

const MAX_JSON_BODY_BYTES = 1024 * 1024
const SPA_ENTRY_FILE = 'index.html'
const WEB_DIST_ENV = 'REEDITPRO_WEB_DIST_DIR'
const STATIC_ROUTE_EXCLUDED_PREFIXES = ['/api', '/v1']
const STATIC_ROUTE_EXCLUDED_PATHS = new Set(['/health', '/ready'])
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
}

export async function handleServerRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const method = request.method ?? 'GET'

    if (method === 'GET' && url.pathname === '/health') {
      sendJsonResponse(response, createHealthResponse(getServerRuntimeConfig()))
      return
    }

    if (method === 'GET' && url.pathname === '/ready') {
      sendJsonResponse(response, createReadinessResponse({
        config: getServerRuntimeConfig(),
        warnings: getServerRuntimeWarnings(),
      }))
      return
    }

    if (method === 'GET' && url.pathname === '/api/runtime/status') {
      sendJsonResponse(response, createJsonResponse({
        ok: true,
        runtime: getServerRuntimeConfig(),
        env: getBackendEnvStatus(),
        warnings: getServerRuntimeWarnings(),
      }))
      return
    }

    if (method === 'GET' && url.pathname === '/api/routes') {
      sendJsonResponse(response, createJsonResponse({
        ok: true,
        summary: createApiRouteMapSummary(),
        routes: REEDITPRO_API_ROUTES.map((route) => ({
          id: route.id,
          domain: route.domain,
          method: route.method,
          path: route.path,
          status: route.status,
          runtimeMode: route.runtimeMode,
          securityLevel: route.securityLevel,
        })),
      }))
      return
    }

    if (method === 'POST' && url.pathname === '/api/mock') {
      const body = await readJsonBody(request)
      const envelope = normalizeApiRequestEnvelope(body)
      const apiResponse = await handleMockApiRequest(envelope)
      sendJsonResponse(response, createJsonResponse(apiResponse, apiResponse.statusCode))
      return
    }

    if (sendStaticWebSurface(request, response, url)) {
      return
    }

    sendJsonResponse(response, createNotFoundResponse(url.pathname))
  } catch (error) {
    sendJsonResponse(
      response,
      createServerErrorResponse(error instanceof Error ? error.message : 'Unexpected server error.'),
    )
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.byteLength

    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw new Error('Request body is too large for mock API transport.')
    }

    chunks.push(buffer)
  }

  const text = Buffer.concat(chunks).toString('utf8').trim()
  return text.length > 0 ? JSON.parse(text) : {}
}

function normalizeApiRequestEnvelope(value: unknown): ApiRequestEnvelope {
  if (!isRecord(value) || typeof value.routeId !== 'string') {
    throw new Error('POST /api/mock requires a JSON API request envelope with routeId.')
  }

  const context = isRecord(value.context)
    ? createMockApiRuntimeContext(value.context)
    : createMockApiRuntimeContext()

  return {
    routeId: value.routeId,
    context,
    body: value.body,
    params: isStringRecord(value.params) ? value.params : undefined,
    query: isStringRecord(value.query) ? value.query : undefined,
  }
}

function sendStaticWebSurface(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): boolean {
  const method = request.method ?? 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    return false
  }

  if (STATIC_ROUTE_EXCLUDED_PATHS.has(url.pathname)) {
    return false
  }

  if (STATIC_ROUTE_EXCLUDED_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return false
  }

  const distDir = getWebDistDir()
  const staticFile = resolveStaticWebFile(distDir, url.pathname)
  if (!staticFile || !fs.existsSync(staticFile) || !fs.statSync(staticFile).isFile()) {
    return false
  }

  const ext = path.extname(staticFile).toLowerCase()
  const isSpaEntry = path.basename(staticFile) === SPA_ENTRY_FILE
  const body = method === 'HEAD' ? undefined : fs.readFileSync(staticFile)

  response.writeHead(200, {
    'content-type': MIME_TYPES[ext] ?? 'application/octet-stream',
    'cache-control': isSpaEntry ? 'no-store' : 'public, max-age=31536000, immutable',
  })
  response.end(body)
  return true
}

function getWebDistDir(): string {
  const configured = process.env[WEB_DIST_ENV]?.trim()
  return path.resolve(configured || path.join(process.cwd(), 'dist'))
}

function resolveStaticWebFile(distDir: string, pathname: string): string | null {
  let decodedPathname: string
  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    return null
  }

  const distRoot = path.resolve(distDir)
  const relativePath = decodedPathname === '/' || isSpaRoute(decodedPathname)
    ? SPA_ENTRY_FILE
    : decodedPathname.replace(/^\/+/, '')
  const candidate = path.resolve(distRoot, path.normalize(relativePath))

  if (candidate !== distRoot && !candidate.startsWith(`${distRoot}${path.sep}`)) {
    return null
  }

  return candidate
}

function isSpaRoute(pathname: string): boolean {
  return !path.basename(pathname).includes('.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string')
}
