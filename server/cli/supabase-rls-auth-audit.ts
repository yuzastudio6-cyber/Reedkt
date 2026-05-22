import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { runRlsAuthAudit } from '../supabase/rls-auth-audit'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-supabase-rls-auth-audit',
  auth: {
    userId: env.supabaseE2eUserId ?? 'supabase-rls-auth-audit-cli',
    isMockUser: true,
  },
}

const result = await runRlsAuthAudit(context)
console.log(JSON.stringify(result, null, 2))
if (!result.ok && result.status !== 'skipped') process.exitCode = 1
