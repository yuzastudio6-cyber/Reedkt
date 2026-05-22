import { loadRuntimeEnv } from '../config/env'
import { runSupabaseTableReadinessSmoke } from '../services/supabase-e2e-smoke-service'
import type { ServiceContext } from '../types'

const context: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-supabase-readiness',
  auth: { userId: 'supabase-readiness-smoke', isMockUser: true },
}

const result = await runSupabaseTableReadinessSmoke(context)
const serialized = JSON.stringify(result)
const checks = [
  result.ok && result.status === 'skipped' ? 'disabled_mode_skips_without_connection' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
  result.error?.message.includes('SUPABASE_E2E_SMOKE_MODE=live') ? 'clear_live_mode_instruction' : undefined,
].filter(Boolean)

const ok = checks.length === 3
console.log(JSON.stringify({ ok, checks, result }, null, 2))
if (!ok) process.exitCode = 1
