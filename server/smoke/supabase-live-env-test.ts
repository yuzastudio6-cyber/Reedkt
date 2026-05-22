import { loadRuntimeEnv } from '../config/env'
import { checkSupabaseLiveEnv } from '../supabase/live-env-readiness'

const disabled = checkSupabaseLiveEnv(loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'disabled',
}), {})

const liveMissing = checkSupabaseLiveEnv(loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'live',
}), {})

const viteServiceRole = checkSupabaseLiveEnv(loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'disabled',
}), { VITE_SUPABASE_SERVICE_ROLE_KEY: 'do-not-use' })

const serialized = JSON.stringify({ disabled, liveMissing, viteServiceRole })
const checks = [
  disabled.ok && disabled.status === 'skipped' ? 'disabled_mode_skips' : undefined,
  !liveMissing.ok && liveMissing.blockers.some((blocker) => blocker.includes('SUPABASE_URL')) ? 'live_missing_env_fails_clearly' : undefined,
  !viteServiceRole.ok && viteServiceRole.blockers.some((blocker) => blocker.includes('VITE')) ? 'vite_service_role_blocked' : undefined,
  !serialized.includes('do-not-use') ? 'secret_values_not_printed' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, disabled, liveMissing, viteServiceRole }, null, 2))
if (!ok) process.exitCode = 1
