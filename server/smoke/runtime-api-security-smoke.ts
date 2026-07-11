import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { INTERNAL_SERVICE_TOKEN_HEADER } from '../middleware/internal-service-auth'

const internalToken = 'runtime-security-smoke-internal-token'
const env = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
})

const publicClient = {
  auth: {
    async getUser(token: string) {
      return token === 'verified-user-token'
        ? {
            data: {
              user: {
                id: 'user-runtime-security',
                email: 'security@example.test',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date(0).toISOString(),
              },
            },
            error: null,
          }
        : { data: { user: null }, error: new Error('invalid token') }
    },
  },
} as unknown as SupabaseClient

const server = createServer(createReeditProApiApp(env, {
  clients: { admin: null, public: publicClient },
}))
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address() as AddressInfo
const baseUrl = `http://127.0.0.1:${address.port}`

try {
  const health = await fetch(`${baseUrl}/health`, {
    headers: {
      origin: 'https://app.reeditpro.test',
      'x-request-id': 'unsafe request id with spaces',
    },
  })
  assert.equal(health.status, 200)
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(health.headers.get('x-frame-options'), 'DENY')
  assert.equal(health.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(health.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains')
  assert.equal(health.headers.get('access-control-allow-origin'), 'https://app.reeditpro.test')
  assert.equal(health.headers.get('access-control-allow-credentials'), null)
  assert.notEqual(health.headers.get('x-request-id'), 'unsafe request id with spaces')
  const healthBody = await health.json() as { data?: Record<string, unknown> }
  assert.equal('runtime' in (healthBody.data ?? {}), false)

  const readinessWithoutInternalAuth = await fetch(`${baseUrl}/health/readiness`)
  assert.equal(readinessWithoutInternalAuth.status, 401)

  const readinessWithInternalAuth = await fetch(`${baseUrl}/health/readiness`, {
    headers: { [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken },
  })
  assert.equal(readinessWithInternalAuth.status, 200)

  const toolReadinessWithoutInternalAuth = await fetch(`${baseUrl}/health/tool-readiness`)
  assert.equal(toolReadinessWithoutInternalAuth.status, 401)

  const toolReadinessWithInternalAuth = await fetch(`${baseUrl}/health/tool-readiness`, {
    headers: { [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken },
  })
  assert.equal(toolReadinessWithInternalAuth.status, 200)

  const workerWithUserOnly = await fetch(`${baseUrl}/v1/jobs/job-security-smoke/heartbeat`, {
    method: 'POST',
    headers: { authorization: 'Bearer verified-user-token' },
  })
  assert.equal(workerWithUserOnly.status, 401)

  const workerWithInvalidInternalToken = await fetch(`${baseUrl}/v1/jobs/job-security-smoke/heartbeat`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      [INTERNAL_SERVICE_TOKEN_HEADER]: 'wrong-token',
    },
  })
  assert.equal(workerWithInvalidInternalToken.status, 403)

  const workerWithDualAuth = await fetch(`${baseUrl}/v1/jobs/job-security-smoke/heartbeat`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
    },
  })
  assert.equal(workerWithDualAuth.status, 503)

  const renderSmokeWithDualAuth = await fetch(`${baseUrl}/v1/render-jobs/render-job-security-smoke/basic-smoke-preview`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
      'content-type': 'application/json',
      // Deliberately omit the idempotency key and a valid body. The canonical
      // production gate must run before idempotency, validation, tool probes,
      // job claims, or render side effects.
    },
    body: '{}',
  })
  assert.equal(renderSmokeWithDualAuth.status, 503)
  const renderSmokeError = await renderSmokeWithDualAuth.json() as {
    error?: { code?: string; details?: { requiredGates?: string[] } }
  }
  assert.equal(renderSmokeError.error?.code, 'TOOL_NOT_READY')
  assert.ok(renderSmokeError.error?.details?.requiredGates?.includes('canonical_worker_claim_rpc'))

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'production_security_headers',
      'credentialed_cors_disabled',
      'unsafe_request_id_rejected',
      'public_health_does_not_expose_runtime_configuration',
      'detailed_readiness_is_internal_only',
      'tool_readiness_internal_only',
      'worker_user_only_denied',
      'worker_invalid_internal_token_denied',
      'worker_dual_auth_reaches_fail_closed_canonical_runtime_gate',
      'render_smoke_execution_reaches_gate_before_idempotency_validation_and_side_effects',
    ],
  }))
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
