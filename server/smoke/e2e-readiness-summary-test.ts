import { loadRuntimeEnv } from '../config/env'
import { getE2EReadinessSummary } from '../services/e2e-editing-flow-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'disabled',
  SUPABASE_E2E_ALLOW_WRITES: 'false',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-readiness-summary',
  auth: { userId: 'e2e-readiness-smoke', isMockUser: true },
}

const readiness = await getE2EReadinessSummary(context)
const serialized = JSON.stringify(readiness)
const checks = [
  readiness.providerRealCallsDisabled ? 'provider_real_calls_disabled' : undefined,
  readiness.remotionDisabled ? 'remotion_disabled' : undefined,
  readiness.storageMode === 'local' ? 'local_storage_mode' : undefined,
  readiness.supabase.smokeMode === 'disabled' ? 'supabase_disabled_by_default' : undefined,
  Array.isArray(readiness.blockers) ? 'blockers_reported' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
].filter(Boolean)

const ok = checks.length === 6
console.log(JSON.stringify({ ok, checks, readiness }, null, 2))
if (!ok) process.exitCode = 1
