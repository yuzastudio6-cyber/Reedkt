import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { findSupabaseSmokeRunLeftovers } from '../services/supabase-smoke-leftover-service'

const smokeRunId = readArgValue('--smoke-run-id')
  ?? process.env.SUPABASE_E2E_PREVIOUS_SMOKE_RUN_ID
  ?? process.env.SUPABASE_E2E_SMOKE_RUN_ID

const env = loadRuntimeEnv(process.env)
const client = createSupabaseAdminClient(env)

if (!smokeRunId) {
  console.log(JSON.stringify({
    ok: false,
    status: 'failed',
    error: {
      code: 'missing_smoke_run_id',
      message: 'Pass --smoke-run-id=<id> or set SUPABASE_E2E_PREVIOUS_SMOKE_RUN_ID before checking leftovers.',
    },
  }, null, 2))
  process.exit(1)
}

if (env.supabaseE2eSmokeMode !== 'live' || !client || !env.hasSupabaseAdmin) {
  console.log(JSON.stringify({
    ok: false,
    status: 'failed',
    smokeRunId,
    error: {
      code: 'missing_env',
      message: 'Live Supabase admin configuration is required for staging smoke leftover checks.',
    },
  }, null, 2))
  process.exit(1)
}

const result = await findSupabaseSmokeRunLeftovers(client, smokeRunId)
console.log(JSON.stringify({
  ...result,
  status: result.ok ? 'passed' : 'failed',
}, null, 2))

if (!result.ok) process.exitCode = 1

function readArgValue(name: string): string | undefined {
  const prefix = `${name}=`
  const value = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
  return value?.trim() || undefined
}
