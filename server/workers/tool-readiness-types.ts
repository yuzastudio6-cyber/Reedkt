import type { RuntimeEnv } from '../config/env'
import { EDITING_TOOL_IDS, type EditingToolId } from '../tools/editing-tool-contracts'

export const WORKER_TOOL_NAMES = EDITING_TOOL_IDS

export type WorkerToolName = EditingToolId

export type ToolReadinessStatus = 'passed' | 'warning' | 'failed' | 'missing' | 'blocked'

export interface ToolReadinessCheckResult {
  toolName: WorkerToolName
  status: ToolReadinessStatus
  required: boolean
  version?: string
  binaryPath?: string
  capabilities: string[]
  summary: string
  checkedAt: string
  durationMs: number
  errorCode?: string
  mockOnly?: boolean
}

export interface ToolCheckContext {
  env: RuntimeEnv
  required?: boolean
}

export type ToolCheck = (context: ToolCheckContext) => Promise<ToolReadinessCheckResult>

export function createToolResult(input: {
  toolName: WorkerToolName
  status: ToolReadinessStatus
  required: boolean
  capabilities: string[]
  summary: string
  startedAt: number
  version?: string
  binaryPath?: string
  errorCode?: string
}): ToolReadinessCheckResult {
  return {
    toolName: input.toolName,
    status: input.status,
    required: input.required,
    version: input.version,
    binaryPath: input.binaryPath,
    capabilities: input.capabilities,
    summary: input.summary,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - input.startedAt,
    errorCode: input.errorCode,
    mockOnly: true,
  }
}
