import { loadRuntimeEnv } from '../config/env'
import { runPersistedBasicRenderSmoke } from '../services/supabase-e2e-smoke-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-e2e-rpc-persisted-render-smoke',
  auth: {
    userId: env.supabaseE2eUserId ?? 'supabase-e2e-rpc-render-cli',
    isMockUser: true,
  },
}

const result = await runPersistedBasicRenderSmoke(context)
console.log(JSON.stringify(result, null, 2))
if (!result.ok && result.status !== 'skipped') process.exitCode = 1
