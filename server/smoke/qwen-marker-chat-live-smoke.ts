import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createQwenLiveBetaDoctorReport } from '../../src/backend/qwen-runtime/qwen-live-beta-service'
import {
  QWEN_LIVE_SMOKE_FIXTURE,
  assertNoUnsafeQwenRuntimeEffects,
  qwenLiveSmokeBlockedResult,
} from './qwen-live-smoke-helpers'

function localUrl(port: number, path: string): string {
  return `http://127.0.0.1:${port}${path}`
}

const doctor = await createQwenLiveBetaDoctorReport()
if (!doctor.ready) {
  console.error(JSON.stringify(qwenLiveSmokeBlockedResult('blocked_live_beta_configuration', {
    doctorStatus: doctor.status,
    checks: doctor.checks,
    nextStep: doctor.nextStep,
  }), null, 2))
  process.exit(1)
}

const app = createReeditProApiApp(loadRuntimeEnv({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  STORAGE_MODE: process.env.STORAGE_MODE ?? 'local',
}))
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const port = address.port

try {
  const requestId = `qwen-marker-chat-live-${Date.now().toString(36)}`
  const body = {
    ...QWEN_LIVE_SMOKE_FIXTURE,
    requestId,
    idempotencyKey: requestId,
  }
  const response = await fetch(localUrl(port, '/v1/project-edit-brief/marker-messages'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': requestId,
      'x-request-id': requestId,
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { ok?: boolean; data?: Record<string, unknown>; warnings?: string[] }
  const data = payload.data ?? {}
  const qwenRuntime = (data.qwenRuntime ?? {}) as Record<string, unknown>
  assertNoUnsafeQwenRuntimeEffects(qwenRuntime)

  const replay = await fetch(localUrl(port, '/v1/project-edit-brief/marker-messages'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': requestId,
      'x-request-id': requestId,
    },
    body: JSON.stringify(body),
  })
  const replayPayload = await replay.json() as { ok?: boolean; data?: Record<string, unknown>; warnings?: string[] }
  const replayData = replayPayload.data ?? {}
  const replayIdempotency = (replayData.idempotency ?? {}) as Record<string, unknown>

  const passed = response.ok
    && payload.ok === true
    && data.runtimeSource === 'qwen_live'
    && data.fallbackUsed === false
    && qwenRuntime.qwenCallMade === true
    && qwenRuntime.providerCallMade === true
    && qwenRuntime.secretValuePrinted === false
    && replay.ok
    && replayPayload.ok === true
    && replayIdempotency.replayed === true

  console.log(JSON.stringify({
    smoke: 'qwen-marker-chat-live',
    ok: passed,
    httpStatus: response.status,
    runtimeSource: data.runtimeSource,
    fallbackUsed: data.fallbackUsed,
    qwenCallMade: qwenRuntime.qwenCallMade,
    providerCallMade: qwenRuntime.providerCallMade,
    secretValuePrinted: qwenRuntime.secretValuePrinted,
    editPlanCreated: qwenRuntime.editPlanCreated,
    creditReservedOrSpent: qwenRuntime.creditReservedOrSpent,
    replayed: replayIdempotency.replayed,
    warnings: payload.warnings,
  }, null, 2))

  if (!passed) process.exitCode = 1
} finally {
  server.close()
  await once(server, 'close')
}
