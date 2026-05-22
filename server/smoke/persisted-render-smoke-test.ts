import { loadRuntimeEnv } from '../config/env'
import { runPersistedBasicRenderSmoke } from '../services/supabase-e2e-smoke-service'
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
  requestId: 'smoke-persisted-render-disabled',
  auth: { userId: 'persisted-render-smoke', isMockUser: true },
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
  requestId: 'smoke-persisted-render-live-missing-env',
  auth: { userId: 'persisted-render-smoke', isMockUser: true },
}

const disabled = await runPersistedBasicRenderSmoke(disabledContext)
const liveMissingEnv = await runPersistedBasicRenderSmoke(liveMissingEnvContext)
const serialized = JSON.stringify({ disabled, liveMissingEnv })
const checks = [
  disabled.ok && disabled.status === 'skipped' ? 'disabled_persisted_render_skips' : undefined,
  !liveMissingEnv.ok && liveMissingEnv.error?.code === 'missing_env' ? 'live_persisted_render_missing_env_fails_clearly' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
  !serialized.includes('signedUrl') && !serialized.includes('signed_url') ? 'no_signed_url_canonical_output' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, disabled, liveMissingEnv }, null, 2))
if (!ok) process.exitCode = 1
