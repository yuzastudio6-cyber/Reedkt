import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { createPrompt6ToolSummary } from '../workers/prompt6-tool-summary'

const strictPrompt6Readiness = process.env.STRICT_PROMPT6_TOOL_READINESS === 'true' || process.env.STRICT_PROMPT6_TOOL_READINESS === '1'
const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'prompt6-readiness-smoke',
  auth: { userId: 'prompt6-smoke-user', isMockUser: true },
}

const summary = await createPrompt6ToolSummary(context)
const result = {
  ok: summary.prompt6Ready || !strictPrompt6Readiness,
  strictPrompt6Readiness,
  prompt6Ready: summary.prompt6Ready,
  required: summary.required,
  optional: summary.optional,
  notes: summary.prompt6Ready
    ? summary.notes
    : [
      ...summary.notes,
      strictPrompt6Readiness
        ? 'STRICT_PROMPT6_TOOL_READINESS=true blocks this smoke test because FFmpeg/FFprobe are unavailable.'
        : 'STRICT_PROMPT6_TOOL_READINESS is false, so this smoke test warns and exits cleanly.',
    ],
  checks: summary.checks,
}

console.log(JSON.stringify(result, null, 2))

if (!result.ok) {
  process.exitCode = 1
}
