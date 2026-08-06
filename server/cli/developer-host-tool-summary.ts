import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { createPrompt6ToolSummary } from '../workers/prompt6-tool-summary'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE:
    process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
  WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-developer-host-tool-summary',
  auth: { userId: 'local-cli-worker', isMockUser: true },
}

const hostProbe = await createPrompt6ToolSummary(context)

console.log(JSON.stringify({
  schemaVersion: 'developer-host-tool-summary-v1',
  scope: 'developer_host_convenience_probe',
  changesCanonicalToolCount: false,
  changesCanonicalExecutionEvidence: false,
  hostProbe,
  notes: [
    'This probes only nine convenience dependencies on the current developer host.',
    'Unavailable host packages do not contradict the separately pinned and confined canonical runtime evidence.',
    'Use npm run tools:summary for the authoritative exact 50-tool canonical private summary.',
  ],
}, null, 2))
