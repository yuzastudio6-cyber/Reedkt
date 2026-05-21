import { loadRuntimeEnv } from '../config/env'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import { WORKER_TOOL_NAMES, type WorkerToolName } from '../workers/tool-readiness-types'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-tools-check',
  auth: { userId: 'local-cli-worker', isMockUser: true },
}

const result = await runToolReadinessChecks(context, {
  workspaceId: readArg('--workspace-id'),
  workerType: readArg('--worker-type') ?? 'cli_tool_readiness',
  toolName: parseToolName(readArg('--tool')),
  recordResults: false,
})

console.log(JSON.stringify(result, null, 2))

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function parseToolName(value: string | undefined): WorkerToolName | undefined {
  return WORKER_TOOL_NAMES.includes(value as WorkerToolName) ? value as WorkerToolName : undefined
}
