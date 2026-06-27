import type { ToolReadinessCheckResult } from './tool-readiness-types'
import type { BasicRenderSmokeResponse } from './jobs/basic-render-smoke-types'
import type { ToolCostEstimate, ToolCostEvent } from '../tool-cost-metering'

export interface WorkerGateCheckResult {
  gate: string
  passed: boolean
  required: boolean
  message: string
  details?: Record<string, unknown>
}

export interface WorkerEventPayload {
  eventName: string
  jobId: string
  workerType: string
  workerInstanceId?: string
  message: string
  progressPercent?: number
  payloadJson?: Record<string, unknown>
  createdAt: string
}

export interface MediaProbeResult {
  mediaAssetId?: string
  storageObjectRecordId?: string
  durationSeconds?: number
  width?: number
  height?: number
  codecName?: string
  formatName?: string
  sizeBytes?: number
  streamCount: number
  probeTool: 'ffprobe'
  mockOnly?: boolean
}

export interface WorkerExecutionResult {
  jobId: string
  workerType: string
  workerInstanceId: string
  status: 'completed' | 'failed' | 'blocked' | 'dry_run'
  claim?: Record<string, unknown>
  gateChecks: WorkerGateCheckResult[]
  toolChecks: ToolReadinessCheckResult[]
  toolCostEstimate?: ToolCostEstimate
  toolCostEvent?: ToolCostEvent
  events: WorkerEventPayload[]
  output?: object | MediaProbeResult | BasicRenderSmokeResponse
  error?: {
    code: string
    message: string
  }
  warnings: string[]
  startedAt: string
  completedAt: string
}

export function createGateResult(input: WorkerGateCheckResult): WorkerGateCheckResult {
  return input
}
