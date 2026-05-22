import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { getE2EReadinessSummary } from '../services/e2e-editing-flow-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
  WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
  STORAGE_MODE: process.env.STORAGE_MODE ?? 'local',
})

const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-e2e-readiness',
  auth: { userId: env.supabaseE2eUserId ?? 'e2e-readiness-cli', isMockUser: true },
}

const readiness = await getE2EReadinessSummary(context)
console.log(JSON.stringify(readiness, null, 2))
