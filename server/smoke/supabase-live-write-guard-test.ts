import { loadRuntimeEnv } from '../config/env'
import {
  createSmokeMetadata,
  getLiveWriteGuardStatus,
  rejectNonSmokeCleanup,
  sanitizeLiveSmokePayload,
} from '../supabase/live-write-guard'

const disabledEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'disabled',
})
const liveEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_E2E_SMOKE_MODE: 'live',
  SUPABASE_E2E_ALLOW_WRITES: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-placeholder',
  SUPABASE_E2E_USER_ID: '00000000-0000-0000-0000-000000000001',
})

const metadata = createSmokeMetadata('rp-e2e-smoke-test-run')
const sanitized = sanitizeLiveSmokePayload({
  ...metadata,
  api_key: 'should-redact',
  nested: { signed_url: 'should-redact-too', keep: true },
})

let cleanupBlocked = false
try {
  rejectNonSmokeCleanup({ metadata_json: createSmokeMetadata('other-run') }, 'rp-e2e-smoke-test-run')
} catch {
  cleanupBlocked = true
}

const disabled = getLiveWriteGuardStatus(disabledEnv)
const live = getLiveWriteGuardStatus(liveEnv, metadata.smokeRunId)
const serialized = JSON.stringify({ disabled, live, sanitized })
const checks = [
  !disabled.ok && disabled.blockers.length > 0 ? 'disabled_mode_blocks_writes' : undefined,
  live.ok ? 'live_guard_allows_when_explicit' : undefined,
  sanitized.api_key === undefined && !JSON.stringify(sanitized).includes('signed_url') ? 'secret_like_payload_removed' : undefined,
  cleanupBlocked ? 'cross_run_cleanup_blocked' : undefined,
  !serialized.includes('test-service-role-placeholder') ? 'secret_values_not_printed' : undefined,
].filter(Boolean)

const ok = checks.length === 5
console.log(JSON.stringify({ ok, checks, disabled, live, sanitized }, null, 2))
if (!ok) process.exitCode = 1
