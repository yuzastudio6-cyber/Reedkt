import { loadRuntimeEnv } from '../config/env'
import { runLocalFullEditingFlow } from '../services/e2e-editing-flow-service'
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
  clients: { admin: null, public: null },
  requestId: 'cli-e2e-local-full',
  auth: { userId: 'local-full-flow-cli', isMockUser: true },
}

const result = await runLocalFullEditingFlow(context, {
  workspaceId: process.env.E2E_LOCAL_WORKSPACE_ID ?? 'workspace-e2e-local-full',
  projectName: 'RP-E2E local full editing flow',
})

console.log(JSON.stringify(result, null, 2))
if (!result.ok || result.status !== 'preview_ready') process.exitCode = 1
