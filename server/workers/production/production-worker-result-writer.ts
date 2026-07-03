import type {
  ProductionWorkerEventRecord,
  ProductionWorkerExecutionResult,
  ProductionWorkerFailureCategory,
  ProductionWorkerGateCheck,
  ProductionWorkerJobPayload,
  ProductionWorkerJobStatus,
  ProductionWorkerRouteOutput,
} from './production-worker-types'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

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
    artifactRecords: extractOutputArtifactRecords(input.output),
    qualityGateResults: extractOutputQualityGateResults(input.output),
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

function extractOutputArtifactRecords(output?: ProductionWorkerRouteOutput): ToolArtifact[] {
  return [
    ...extractArtifactsFromResult(output?.mediaFoundationResult, 'artifactRecords'),
    ...extractArtifactsFromResult(output?.smartCutTimelineExecutionResult, 'artifacts'),
  ]
}

function extractOutputQualityGateResults(output?: ProductionWorkerRouteOutput): ProductionWorkerExecutionResult['qualityGateResults'] {
  const qaResults = output?.smartCutTimelineExecutionResult && typeof output.smartCutTimelineExecutionResult === 'object'
    ? (output.smartCutTimelineExecutionResult as { qaResults?: unknown }).qaResults
    : undefined
  if (!Array.isArray(qaResults)) return []
  return qaResults.filter(isQualityGateResult)
}

function extractArtifactsFromResult(result: unknown, fieldName: 'artifactRecords' | 'artifacts'): ToolArtifact[] {
  if (!result || typeof result !== 'object') return []
  const artifactRecords = (result as Record<string, unknown>)[fieldName]
  if (!Array.isArray(artifactRecords)) return []
  return artifactRecords.filter(isToolArtifact)
}

function isToolArtifact(value: unknown): value is ToolArtifact {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' &&
    typeof record.workspaceId === 'string' &&
    typeof record.projectId === 'string' &&
    typeof record.mediaAssetId === 'string' &&
    typeof record.artifactType === 'string' &&
    typeof record.storageBucketPurpose === 'string' &&
    typeof record.storageObjectPath === 'string' &&
    record.isPrivate === true &&
    record.sourceOfTruth === true
}

function isQualityGateResult(value: unknown): value is ProductionWorkerExecutionResult['qualityGateResults'][number] {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' &&
    typeof record.gateType === 'string' &&
    typeof record.status === 'string' &&
    typeof record.blocksPreview === 'boolean' &&
    typeof record.blocksFinalExport === 'boolean'
}
