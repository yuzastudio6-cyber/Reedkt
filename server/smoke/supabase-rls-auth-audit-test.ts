import { loadRuntimeEnv } from '../config/env'
import { runRlsAuthAudit } from '../supabase/rls-auth-audit'
import type { ServiceContext } from '../types'

const context: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-supabase-rls-auth-audit',
  auth: { userId: 'rls-auth-audit-smoke', isMockUser: true },
}

const result = await runRlsAuthAudit(context)
const serialized = JSON.stringify(result)
const checks = [
  result.ok && result.status === 'skipped' ? 'disabled_mode_local_audit_passes' : undefined,
  result.tables.some((table) => table.table === 'approved_plan_snapshots') ? 'approved_snapshots_checked' : undefined,
  result.localArtifacts.every((artifact) => typeof artifact.exists === 'boolean') ? 'local_artifacts_checked' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, result }, null, 2))
if (!ok) process.exitCode = 1
