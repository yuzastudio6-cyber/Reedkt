import type {
  ProductionWorkerEventRecord,
  ProductionWorkerExecutionResult,
  ProductionWorkerFailureCategory,
  ProductionWorkerGateCheck,
  ProductionWorkerJobPayload,
  ProductionWorkerJobStatus,
  ProductionWorkerRouteOutput,
} from './production-worker-types'

function nowIso(): string {
  return new Date().toISOString()
}

export function createProductionWorkerResult(input: {
  payload: ProductionWorkerJobPayload
  status: ProductionWorkerJobStatus
  gateChecks: ProductionWorkerGateCheck[]
  events: ProductionWorkerEventRecord[]
  output?: ProductionWorkerRouteOutput
  warnings?: string[]
  error?: {
    code: string
    message: string
    failureCategory: ProductionWorkerFailureCategory
  }
  startedAt?: string
}): ProductionWorkerExecutionResult {
  return {
    jobId: input.payload.jobId,
    workerType: input.payload.workerType,
    status: input.status,
    gateChecks: input.gateChecks,
    events: input.events,
    output: input.output,
    toolRunResults: [],
    artifactRecords: [],
    qualityGateResults: [],
    fallbackDecisions: [],
    warnings: input.warnings ?? [],
    error: input.error,
    startedAt: input.startedAt ?? nowIso(),
    completedAt: nowIso(),
  }
}

export function collectGateWarnings(gateChecks: ProductionWorkerGateCheck[]): string[] {
  return gateChecks.flatMap((gate) => gate.warnings)
}
