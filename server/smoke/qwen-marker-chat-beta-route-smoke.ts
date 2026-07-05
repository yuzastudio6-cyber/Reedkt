import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

function localUrl(port: number, path: string): string {
  return `http://127.0.0.1:${port}${path}`
}

const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
}))
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const port = address.port

try {
  const readiness = await fetch(localUrl(port, '/v1/qwen-beta/readiness'), {
    headers: { accept: 'application/json' },
  })
  assert.equal(readiness.status, 200)
  const readinessPayload = await readiness.json() as { ok?: boolean; data?: Record<string, unknown>; warnings?: string[] }
  assert.equal(readinessPayload.ok, true)
  assert.equal(readinessPayload.data?.status, 'blocked_runtime_disabled')
  assert.equal(readinessPayload.data?.ready, false)
  assert.equal((readinessPayload.data?.flags as Record<string, unknown> | undefined)?.qwenCallMade, false)
  assert.equal((readinessPayload.data?.flags as Record<string, unknown> | undefined)?.secretValuePrinted, false)

  const missingIdempotency = await fetch(localUrl(port, '/v1/project-edit-brief/marker-messages'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      workspaceId: 'mock-workspace',
      projectId: 'mock-project-edit-chat-foundation',
      editSessionId: 'edit-session-approved-preview',
      briefId: 'project-edit-brief-chat-confirmation',
      markerId: 'marker-keep-quote',
      messageText: 'Tighten this moment but preserve the quote.',
    }),
  })
  assert.equal(missingIdempotency.status, 400)

  const markerChat = await fetch(localUrl(port, '/v1/project-edit-brief/marker-messages'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'qwen-marker-route-smoke-1',
      'x-request-id': 'qwen-marker-route-smoke-1',
    },
    body: JSON.stringify({
      workspaceId: 'mock-workspace',
      projectId: 'mock-project-edit-chat-foundation',
      editSessionId: 'edit-session-approved-preview',
      briefId: 'project-edit-brief-chat-confirmation',
      markerId: 'marker-keep-quote',
      messageText: 'Tighten this moment but preserve the quote.',
      idempotencyKey: 'qwen-marker-route-smoke-1',
    }),
  })
  assert.equal(markerChat.status, 200)
  const markerPayload = await markerChat.json() as { ok?: boolean; data?: Record<string, unknown>; warnings?: string[] }
  assert.equal(markerPayload.ok, true)
  assert.equal(markerPayload.data?.runtimeSource, 'deterministic_fallback')
  assert.equal(markerPayload.data?.fallbackUsed, true)
  assert.equal(markerPayload.data?.providerCallMade, false)
  assert.equal((markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.qwenCallMade, false)
  assert.equal((markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.secretValuePrinted, false)
  assert.equal((markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.editPlanCreated, false)
  assert.equal((markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.creditReservedOrSpent, false)

  const appSource = source('server/app.ts')
  const routeSource = source('server/routes/qwen-marker-chat-beta-routes.ts')
  const clientSource = source('src/lib/project-edit-brief-api-client.ts')
  const packageSource = source('package.json')

  assert.match(appSource, /createQwenMarkerChatBetaRoutes/)
  assert.match(routeSource, /QWEN_LIVE_BETA_READINESS_ROUTE_PATH/)
  assert.match(routeSource, /requireAuth/)
  assert.match(routeSource, /requireIdempotency/)
  assert.match(clientSource, /createAuthHeaders/)
  assert.match(clientSource, /authorization: `Bearer \$\{token\}`/)
  assert.match(packageSource, /"smoke:qwen-marker-chat-beta-route": "tsx server\/smoke\/qwen-marker-chat-beta-route-smoke\.ts"/)

  console.log(JSON.stringify({
    smoke: 'qwen-marker-chat-beta-route',
    readinessStatus: readinessPayload.data?.status,
    markerRuntimeSource: markerPayload.data?.runtimeSource,
    qwenCallMade: (markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.qwenCallMade,
    providerCallMade: markerPayload.data?.providerCallMade,
    secretValuePrinted: (markerPayload.data?.qwenRuntime as Record<string, unknown> | undefined)?.secretValuePrinted,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
