import { loadRuntimeEnv } from '../config/env'
import { runSupabaseRpcReadinessSmoke } from '../services/e2e-service-role-runtime-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-supabase-rpc-readiness-smoke',
  auth: {
    userId: env.supabaseE2eUserId ?? 'supabase-e2e-rpc-smoke-cli',
    isMockUser: true,
  },
}

const result = await runSupabaseRpcReadinessSmoke(context)
console.log(JSON.stringify(result, null, 2))
if (!result.ok && result.status !== 'skipped') process.exitCode = 1
