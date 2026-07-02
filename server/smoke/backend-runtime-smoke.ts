import { createReeditProApiApp } from '../app'
import { createApiErrorEnvelope, ApiError } from '../errors/api-error'
import { createSafeRuntimeSummary, loadRuntimeEnv } from '../config/env'
import { assertRealProviderCallsDisabled } from '../services/provider-gateway-service'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: 'smoke-service-role-placeholder',
  SUPABASE_URL: '',
})
const cloudRunPortEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'cloud_run',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  PORT: '8080',
  SUPABASE_URL: '',
})

const app = createReeditProApiApp(env)
assert(Boolean(app), 'Express app should be created.')
assert(cloudRunPortEnv.apiPort === 8080, 'Cloud Run PORT must be honored when API_PORT is not set.')

const errorEnvelope = createApiErrorEnvelope(
  new ApiError('VALIDATION_FAILED', 'Smoke validation error.', 400),
  'smoke-request-id',
)
assert(errorEnvelope.error.code === 'VALIDATION_FAILED', 'Error envelope should include code.')
assert(errorEnvelope.error.status === 400, 'Error envelope should include status.')
assert(errorEnvelope.error.request_id === 'smoke-request-id', 'Error envelope should include request ID.')

let providerBlocked = false
try {
  assertRealProviderCallsDisabled()
} catch (error) {
  providerBlocked = error instanceof ApiError && error.code === 'REAL_PROVIDER_CALLS_DISABLED'
}
assert(providerBlocked, 'Provider gateway should block real provider calls.')

const summaryText = JSON.stringify(createSafeRuntimeSummary(env))
assert(!summaryText.includes('smoke-service-role-placeholder'), 'Safe runtime summary must not expose service-role key values.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'env_parser_mock_mode',
    'cloud_run_port_fallback',
    'express_app_registration',
    'error_envelope_shape',
    'provider_real_calls_disabled',
    'service_role_not_exposed',
  ],
}))
