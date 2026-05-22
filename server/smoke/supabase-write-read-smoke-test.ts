import { loadRuntimeEnv } from '../config/env'
import { runSupabaseWriteReadSmoke } from '../services/supabase-e2e-smoke-service'
import type { ServiceContext } from '../types'

const disabledContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    SUPABASE_E2E_ALLOW_WRITES: 'false',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-supabase-write-disabled',
  auth: { userId: 'supabase-write-smoke', isMockUser: true },
}

const liveMissingEnvContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'live',
    SUPABASE_E2E_ALLOW_WRITES: 'true',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-supabase-write-live-missing-env',
  auth: { userId: 'supabase-write-smoke', isMockUser: true },
}

const disabled = await runSupabaseWriteReadSmoke(disabledContext)
const liveMissingEnv = await runSupabaseWriteReadSmoke(liveMissingEnvContext)
const serialized = JSON.stringify({ disabled, liveMissingEnv })
const checks = [
  disabled.ok && disabled.status === 'skipped' ? 'disabled_write_smoke_skips' : undefined,
  !liveMissingEnv.ok && liveMissingEnv.error?.code === 'missing_env' ? 'live_write_missing_env_fails_clearly' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
  !serialized.toLowerCase().includes('provider call') ? 'no_provider_calls_attempted' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, disabled, liveMissingEnv }, null, 2))
if (!ok) process.exitCode = 1
