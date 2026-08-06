import assert from 'node:assert/strict'
import type { Request } from 'express'

import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'
import { isLocalMockAuthRequestAllowed } from '../middleware/auth'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import {
  INTERNAL_SERVICE_TOKEN_HEADER,
  isExplicitLocalInternalRequestAllowed,
  requireInternalServiceAuth,
} from '../middleware/internal-service-auth'
import type { RuntimeRequest } from '../types'

const localEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})

assert.equal(
  isLocalMockAuthRequestAllowed(createRequest('127.0.0.1', 'http://127.0.0.1:5173'), localEnv),
  true,
  'Explicit local-test auth bypass should work only from a loopback browser origin.',
)
assert.equal(
  isLocalMockAuthRequestAllowed(createRequest('::ffff:127.0.0.1'), localEnv),
  true,
  'Loopback server-to-server internal tests may omit the Origin header.',
)
assert.equal(
  isLocalMockAuthRequestAllowed(createRequest('10.0.0.12', 'http://127.0.0.1:5173'), localEnv),
  false,
  'A loopback Origin header must not authorize a remote caller.',
)
assert.equal(
  isLocalMockAuthRequestAllowed(createRequest('127.0.0.1', 'https://example.com'), localEnv),
  false,
  'Local mock auth must reject non-loopback browser origins.',
)

const mockDisabledEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
})
assert.equal(
  isLocalMockAuthRequestAllowed(createRequest('127.0.0.1'), mockDisabledEnv),
  false,
  'Local mock auth requires the explicit server-side enable flag.',
)

assert.equal(
  isExplicitLocalInternalRequestAllowed(createRequest('127.0.0.1'), localEnv),
  true,
  'Explicit local internal execution may use loopback only when a local test flag is enabled.',
)
assert.equal(
  isExplicitLocalInternalTestRuntime(localEnv),
  true,
  'Local mock worker execution should require the full explicit local-test boundary.',
)
assert.equal(
  isExplicitLocalInternalRequestAllowed(createRequest('10.0.0.12'), localEnv),
  false,
  'Remote callers must never inherit the local internal-service bypass.',
)

const productionBypassEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
assert.throws(
  () => assertRuntimeCanStart(productionBypassEnv),
  /restricted to non-production local\/mock runtimes/i,
  'Production startup must fail when mock auth bypass is enabled.',
)

const cloudBypassEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'cloud_run',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
assert.throws(
  () => assertRuntimeCanStart(cloudBypassEnv),
  /restricted to non-production local\/mock runtimes/i,
  'Cloud runtime startup must fail when local mock auth bypass is enabled.',
)
assert.equal(
  isExplicitLocalInternalTestRuntime(cloudBypassEnv),
  false,
  'A non-production Cloud Run mode must never expose legacy local worker execution.',
)

const cloudRuntimeWithAdmin = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
assert.equal(
  isExplicitLocalInternalTestRuntime(cloudRuntimeWithAdmin),
  false,
  'Supabase admin availability must not turn a non-production cloud runtime into a local execution boundary.',
)

const productionWithoutInternalToken = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
assert.throws(
  () => assertRuntimeCanStart(productionWithoutInternalToken),
  /internal_service_token is required/i,
  'Production startup must fail closed without internal service authentication.',
)

const productionInternalEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'internal-test-token-123',
})
assert.doesNotThrow(() => assertRuntimeCanStart(productionInternalEnv))
assert.equal(runInternalAuthMiddleware(productionInternalEnv, 'internal-test-token-123'), undefined)
assert.match(
  String(runInternalAuthMiddleware(productionInternalEnv, 'wrong-token')),
  /Valid internal service authentication is required/i,
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'loopback_local_test_auth_allowed',
    'loopback_server_to_server_auth_allowed_without_origin',
    'remote_caller_rejected',
    'non_loopback_origin_rejected',
    'explicit_mock_auth_flag_required',
    'production_mock_auth_startup_rejected',
    'cloud_mock_auth_startup_rejected',
    'local_internal_service_loopback_gate',
    'remote_internal_service_bypass_rejected',
    'legacy_worker_execution_limited_to_explicit_local_test_boundary',
    'nonproduction_cloud_worker_execution_blocked',
    'production_internal_service_token_required',
    'internal_service_token_constant_time_gate',
  ],
}))

function createRequest(remoteAddress: string, origin?: string): Request {
  return {
    ip: remoteAddress,
    socket: { remoteAddress },
    header(name: string) {
      return name.toLowerCase() === 'origin' ? origin : undefined
    },
  } as unknown as Request
}

function runInternalAuthMiddleware(
  env: ReturnType<typeof loadRuntimeEnv>,
  token?: string,
): unknown {
  let nextError: unknown
  const request = {
    ip: '10.0.0.12',
    socket: { remoteAddress: '10.0.0.12' },
    runtime: {
      env,
      clients: { admin: null, public: null },
    },
    header(name: string) {
      return name.toLowerCase() === INTERNAL_SERVICE_TOKEN_HEADER ? token : undefined
    },
  } as unknown as RuntimeRequest

  requireInternalServiceAuth(request, {} as never, (error?: unknown) => {
    nextError = error
  })
  return nextError
}
