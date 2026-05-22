import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { runSupabaseFullEditingFlow } from '../services/e2e-editing-flow-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-e2e-supabase-full',
  auth: { userId: env.supabaseE2eUserId ?? 'supabase-full-flow-cli', isMockUser: true },
}

const result = await runSupabaseFullEditingFlow(context)
console.log(JSON.stringify(result, null, 2))

if (!result.ok && result.status !== 'skipped') process.exitCode = 1
