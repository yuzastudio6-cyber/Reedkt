import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import { WORKER_TOOL_NAMES } from '../workers/tool-readiness-types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'tool-readiness-smoke',
  auth: { userId: 'tool-smoke-user', isMockUser: true },
}

const result = await runToolReadinessChecks(context)
const toolNames = new Set(result.checks.map((check) => check.toolName))

for (const toolName of WORKER_TOOL_NAMES) {
  assert(toolNames.has(toolName), `Tool readiness runner should include ${toolName}.`)
}

const ffmpeg = result.checks.find((check) => check.toolName === 'ffmpeg')
const ffprobe = result.checks.find((check) => check.toolName === 'ffprobe')
assert(Boolean(ffmpeg), 'FFmpeg check should be present.')
assert(Boolean(ffprobe), 'FFprobe check should be present.')
assert(['passed', 'missing', 'warning', 'failed', 'blocked'].includes(ffmpeg?.status ?? ''), 'FFmpeg status should be explicit.')
assert(['passed', 'missing', 'warning', 'failed', 'blocked'].includes(ffprobe?.status ?? ''), 'FFprobe status should be explicit.')
assert(result.checks.length === WORKER_TOOL_NAMES.length, 'Optional tools should not stop the readiness runner.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'all_tool_names_returned',
    'ffmpeg_status_explicit',
    'ffprobe_status_explicit',
    'optional_tools_do_not_fail_runner',
  ],
  toolStatuses: Object.fromEntries(result.checks.map((check) => [check.toolName, check.status])),
}))
