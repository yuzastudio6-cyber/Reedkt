import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { runSupabaseWriteReadSmoke } from '../services/supabase-e2e-smoke-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-supabase-write-smoke-strict',
  auth: {
    userId: env.supabaseE2eUserId ?? 'supabase-e2e-smoke-cli',
    isMockUser: true,
  },
}

const result = await runSupabaseWriteReadSmoke(context)
const cleanupErrors = result.cleanup?.errors ?? []
const deletedCount = result.cleanup?.deleted.length ?? 0
const blockers: string[] = []

if (!result.ok || result.status !== 'passed') {
  blockers.push(result.error?.message ?? 'Supabase write/read smoke did not pass.')
}
if (!result.writesAllowed) {
  blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged by the smoke result.')
}
if (!result.cleanupEnabled) {
  blockers.push('SUPABASE_E2E_CLEANUP=true is required for strict staging write validation.')
}
if (!result.cleanup?.attempted) {
  blockers.push('Strict staging write validation requires cleanup to be attempted.')
}
if (cleanupErrors.length > 0) {
  blockers.push(`Cleanup reported ${cleanupErrors.length} error(s).`)
}
if (!result.records?.smokeRunId) {
  blockers.push('Smoke result did not include a smokeRunId.')
}
if (deletedCount === 0) {
  blockers.push('Cleanup did not delete any smoke-tagged records.')
}

const strictResult = {
  ...result,
  strictValidation: {
    ok: blockers.length === 0,
    blockers,
    cleanupDeletedCount: deletedCount,
  },
}

console.log(JSON.stringify(strictResult, null, 2))
if (blockers.length > 0) process.exitCode = 1
