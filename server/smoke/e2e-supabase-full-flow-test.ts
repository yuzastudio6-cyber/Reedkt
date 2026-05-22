import { loadRuntimeEnv } from '../config/env'
import { runSupabaseFullEditingFlow } from '../services/e2e-editing-flow-service'
import type { ServiceContext } from '../types'

const disabledContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    SUPABASE_E2E_ALLOW_WRITES: 'false',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-supabase-full-disabled',
  auth: { userId: 'supabase-full-flow-smoke', isMockUser: true },
}

const liveMissingEnvContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'live',
    SUPABASE_E2E_ALLOW_WRITES: 'true',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-supabase-full-live-missing-env',
  auth: { userId: 'supabase-full-flow-smoke', isMockUser: true },
}

const disabled = await runSupabaseFullEditingFlow(disabledContext)
const liveMissingEnv = await runSupabaseFullEditingFlow(liveMissingEnvContext)
const serialized = JSON.stringify({ disabled, liveMissingEnv })
const checks = [
  disabled.ok && disabled.status === 'skipped' ? 'disabled_supabase_full_flow_skips' : undefined,
  !liveMissingEnv.ok && liveMissingEnv.mode === 'supabase' ? 'live_missing_env_fails_clearly' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
  !serialized.includes('"providerCallsAttempted":true') ? 'no_provider_calls_attempted' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, disabled, liveMissingEnv }, null, 2))
if (!ok) process.exitCode = 1
