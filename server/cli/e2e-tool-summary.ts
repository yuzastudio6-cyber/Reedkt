import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { createPrompt6ToolSummary } from '../workers/prompt6-tool-summary'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
  WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-e2e-tool-summary',
  auth: { userId: 'local-cli-worker', isMockUser: true },
}

const summary = await createPrompt6ToolSummary(context)

console.log(JSON.stringify(summary, null, 2))
