import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ReadyAudioAdapterResult, ReadyAudioArtifactManifestEntry } from '../../ready-audio-adapters'
import type { TrackBAdapterResult, TrackBArtifactManifestEntry } from '../../trackb-adapters'
import { findForbiddenWorkerPayloadEntries, validateProductionStorageReference } from './production-worker-artifact-policy'
import {
  maxAttemptsByWorkerType,
  nextRetryDelayMs,
  shouldRetryWorkerJob,
} from './production-worker-retry-policy'
import type {
  ProductionWorkerExecutionResult,
  ProductionWorkerFailureCategory,
  ProductionWorkerJobPayload,
  ProductionWorkerJobStatus,
  ProductionWorkerStorageReferenceInput,
} from './production-worker-types'

export interface WorkerRuntimeLeaseRecord {
  leaseId: string
  workerInstanceId: string
  leaseStatus: 'claimed' | 'active' | 'released' | 'stale' | 'failed'
  claimedAt: string
  heartbeatAt: string
  expiresAt: string
  releasedAt?: string
}

export interface WorkerRuntimeRetryDecision {
  failureCategory?: ProductionWorkerFailureCategory
  shouldRetry: boolean
  nextRetryDelayMs: number
  nextAttempt?: number
  maxAttempts: number
}

export interface WorkerRuntimeJobRecord {
  id: string
  workspaceId: string
  projectId: string
  jobId: string
  toolExecutionPlanId: string
  approvedPlanSnapshotId: string
  creditEstimateId?: string
  creditReservationId?: string
  productionReadinessEvidencePacketId?: string
  workerType: ProductionWorkerJobPayload['workerType']
  executionMode: ProductionWorkerJobPayload['executionMode']
  requestedToolIds: string[]
  requestedRecipeIds: string[]
  apiIdempotencyKey?: string
  workerIdempotencyKey: string
  attempt: number
  maxAttempts: number
  status: ProductionWorkerJobStatus
  lease: WorkerRuntimeLeaseRecord
  outputArtifactIds: string[]
  failureCategory?: ProductionWorkerFailureCategory
  retryDecision: WorkerRuntimeRetryDecision
  createdAt: string
  updatedAt: string
  replayCount: number
  mockOnly: boolean
  persistenceMode: 'mock_memory' | 'persistent_supabase'
}

export interface WorkerRuntimeOutputManifest {
  workspaceId: string
  projectId: string
  artifactRecords: ToolArtifact[]
  updatedAt: string
  mockOnly: boolean
  persistenceMode: 'mock_memory' | 'persistent_supabase'
}

export interface WorkerRuntimeArtifactPipelineResult {
  job: WorkerRuntimeJobRecord
  outputManifest: ToolArtifact[]
  mergedOutputManifest: WorkerRuntimeOutputManifest
  replayed: boolean
  warnings: string[]
}

interface WorkerRuntimeReplayRecord {
  pipeline: WorkerRuntimeArtifactPipelineResult
  workerResult?: ProductionWorkerExecutionResult
  trackBAdapterResult?: TrackBAdapterResult
  readyAudioAdapterResult?: ReadyAudioAdapterResult
}

interface WorkerRuntimeArtifactState {
  jobsByWorkerIdempotencyKey: Map<string, WorkerRuntimeReplayRecord>
  projectManifests: Map<string, WorkerRuntimeOutputManifest>
}

const mockWorkerRuntimeArtifactState: WorkerRuntimeArtifactState = {
  jobsByWorkerIdempotencyKey: new Map(),
  projectManifests: new Map(),
}

function nowIso(): string {
  return new Date().toISOString()
}

function addMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

function projectManifestKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:${projectId}`
}

export function clearMockWorkerRuntimeArtifactPipelineState(): void {
  mockWorkerRuntimeArtifactState.jobsByWorkerIdempotencyKey.clear()
  mockWorkerRuntimeArtifactState.projectManifests.clear()
}

export function getWorkerRuntimeArtifactReplay(
  workerIdempotencyKey: string,
): WorkerRuntimeReplayRecord | undefined {
  const replay = mockWorkerRuntimeArtifactState.jobsByWorkerIdempotencyKey.get(workerIdempotencyKey)
  if (!replay) return undefined

  replay.pipeline.job.replayCount += 1
  replay.pipeline.replayed = true
  replay.pipeline.warnings = uniqueWarnings([
    ...replay.pipeline.warnings,
    'Worker runtime artifact pipeline replayed the existing job/output manifest for this idempotency key.',
  ])
  return replay
}

export function recordWorkerRuntimeArtifactPipeline(input: {
  payload: ProductionWorkerJobPayload
  workerResult: ProductionWorkerExecutionResult
  trackBAdapterResult?: TrackBAdapterResult
  readyAudioAdapterResult?: ReadyAudioAdapterResult
  apiIdempotencyKey?: string
}): WorkerRuntimeArtifactPipelineResult {
  validatePipelinePayload(input.payload, input.trackBAdapterResult, input.readyAudioAdapterResult)

  const replay = getWorkerRuntimeArtifactReplay(input.payload.idempotencyKey)
  if (replay) return replay.pipeline

  const createdAt = nowIso()
  const outputManifest = buildOutputManifest({
    payload: input.payload,
    trackBAdapterResult: input.trackBAdapterResult,
    readyAudioAdapterResult: input.readyAudioAdapterResult,
    workerResult: input.workerResult,
    createdAt,
  })
  const mergedOutputManifest = mergeProjectOutputManifest(input.payload.workspaceId, input.payload.projectId, outputManifest)
  const failureCategory = input.workerResult.error?.failureCategory
  const maxAttempts = input.payload.maxAttempts || maxAttemptsByWorkerType(input.payload.workerType)
  const retryDecision = buildRetryDecision({
    failureCategory,
    attempt: input.payload.attempt,
    maxAttempts,
  })
  const lease = buildLeaseRecord(input.payload, input.workerResult)

  const job: WorkerRuntimeJobRecord = {
    id: `worker-runtime-job:${input.payload.workspaceId}:${input.payload.projectId}:${input.payload.jobId}`,
    workspaceId: input.payload.workspaceId,
    projectId: input.payload.projectId,
    jobId: input.payload.jobId,
    toolExecutionPlanId: input.payload.toolExecutionPlanId,
    approvedPlanSnapshotId: input.payload.approvedSnapshotId,
    creditEstimateId: input.payload.metadata?.creditEstimateId as string | undefined,
    creditReservationId: input.payload.creditReservationId,
    productionReadinessEvidencePacketId: input.payload.metadata?.productionReadinessEvidencePacketId as string | undefined,
    workerType: input.payload.workerType,
    executionMode: input.payload.executionMode,
    requestedToolIds: input.payload.requestedToolIds,
    requestedRecipeIds: input.payload.requestedRecipeIds,
    apiIdempotencyKey: input.apiIdempotencyKey,
    workerIdempotencyKey: input.payload.idempotencyKey,
    attempt: input.payload.attempt,
    maxAttempts,
    status: input.workerResult.status,
    lease,
    outputArtifactIds: outputManifest.map((artifact) => artifact.id),
    failureCategory,
    retryDecision,
    createdAt,
    updatedAt: createdAt,
    replayCount: 0,
    mockOnly: true,
    persistenceMode: 'mock_memory',
  }

  const workerOutputMockOnly = input.workerResult.output?.mockOnly !== false
  const pipeline: WorkerRuntimeArtifactPipelineResult = {
    job,
    outputManifest,
    mergedOutputManifest,
    replayed: false,
    warnings: uniqueWarnings([
      'Worker runtime artifact pipeline recorded private output manifests in mock-safe storage.',
      workerOutputMockOnly
        ? 'No signed URLs, public artifacts, Supabase writes, provider calls, or media execution occurred in the artifact pipeline.'
        : 'No signed URLs, public artifacts, Supabase writes, or provider calls occurred in the artifact pipeline; media/tool execution evidence remains scoped to the worker result.',
      ...(input.trackBAdapterResult?.warnings ?? []),
      ...(input.readyAudioAdapterResult?.warnings ?? []),
    ]),
  }

  mockWorkerRuntimeArtifactState.jobsByWorkerIdempotencyKey.set(input.payload.idempotencyKey, {
    pipeline,
    workerResult: input.workerResult,
    trackBAdapterResult: input.trackBAdapterResult,
    readyAudioAdapterResult: input.readyAudioAdapterResult,
  })

  return pipeline
}

export function getProjectWorkerRuntimeOutputManifest(input: {
  workspaceId: string
  projectId: string
}): WorkerRuntimeOutputManifest {
  return mockWorkerRuntimeArtifactState.projectManifests.get(projectManifestKey(input.workspaceId, input.projectId)) ?? {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    artifactRecords: [],
    updatedAt: nowIso(),
    mockOnly: true,
    persistenceMode: 'mock_memory',
  }
}

function validatePipelinePayload(
  payload: ProductionWorkerJobPayload,
  trackBAdapterResult: TrackBAdapterResult | undefined,
  readyAudioAdapterResult: ReadyAudioAdapterResult | undefined,
): void {
  const findings = findForbiddenWorkerPayloadEntries({
    payload,
    trackBAdapterResult,
    readyAudioAdapterResult,
  })

  if (findings.length > 0) {
    throw new Error(`Worker runtime artifact pipeline received forbidden payload fields: ${findings.join(', ')}`)
  }

  for (const manifest of trackBAdapterResult?.outputManifest ?? []) {
    validateAdapterManifestEntry(payload, manifest)
  }

  for (const manifest of readyAudioAdapterResult?.outputManifest ?? []) {
    validateAdapterManifestEntry(payload, manifest)
  }
}

function validateAdapterManifestEntry(
  payload: ProductionWorkerJobPayload,
  manifest: TrackBArtifactManifestEntry | ReadyAudioArtifactManifestEntry,
): void {
  validateProductionStorageReference(manifest as ProductionWorkerStorageReferenceInput)

  const expectedPrefix = `workspaces/${payload.workspaceId}/projects/${payload.projectId}/`
  if (!manifest.storageObjectPath.startsWith(expectedPrefix)) {
    throw new Error(`Worker output artifact path must be scoped to ${expectedPrefix}`)
  }
}

function buildOutputManifest(input: {
  payload: ProductionWorkerJobPayload
  trackBAdapterResult?: TrackBAdapterResult
  readyAudioAdapterResult?: ReadyAudioAdapterResult
  workerResult: ProductionWorkerExecutionResult
  createdAt: string
}): ToolArtifact[] {
  const adapterArtifacts = (input.trackBAdapterResult?.outputManifest ?? []).map((manifest) => (
    toolArtifactFromAdapterManifest(input.payload, manifest, input.createdAt, 'trackb-adapter-pack-v1')
  ))
  const readyAudioAdapterArtifacts = (input.readyAudioAdapterResult?.outputManifest ?? []).map((manifest) => (
    toolArtifactFromAdapterManifest(input.payload, manifest, input.createdAt, 'ready-audio-adapter-pack-v1')
  ))

  const workerArtifacts = input.workerResult.artifactRecords.filter((artifact) => {
    validateProductionStorageReference(artifact as ProductionWorkerStorageReferenceInput)
    return artifact.workspaceId === input.payload.workspaceId && artifact.projectId === input.payload.projectId
  })

  return dedupeArtifacts([...adapterArtifacts, ...readyAudioAdapterArtifacts, ...workerArtifacts])
}

function toolArtifactFromAdapterManifest(
  payload: ProductionWorkerJobPayload,
  manifest: TrackBArtifactManifestEntry | ReadyAudioArtifactManifestEntry,
  createdAt: string,
  adapterPackVersion: 'trackb-adapter-pack-v1' | 'ready-audio-adapter-pack-v1',
): ToolArtifact {
  return {
    id: manifest.id,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-required',
    toolRunId: `${payload.jobId}:${manifest.producedByToolId ?? payload.requestedToolIds[0] ?? 'tool'}`,
    artifactType: manifest.artifactType,
    storageBucketPurpose: manifest.storageBucketPurpose,
    storageObjectPath: manifest.storageObjectPath,
    contentType: manifest.contentType ?? 'application/octet-stream',
    sizeBytes: manifest.sizeBytes,
    checksum: manifest.checksum,
    createdAt,
    isPrivate: true,
    metadata: {
      jobId: payload.jobId,
      workerType: payload.workerType,
      toolExecutionPlanId: payload.toolExecutionPlanId,
      producedByToolId: manifest.producedByToolId ?? payload.requestedToolIds[0] ?? 'unknown',
      adapterPackVersion,
      mockOnly: true,
    },
    previewAllowed: manifest.storageBucketPurpose === 'previews',
    sourceOfTruth: true,
  }
}

function mergeProjectOutputManifest(
  workspaceId: string,
  projectId: string,
  outputManifest: ToolArtifact[],
): WorkerRuntimeOutputManifest {
  const key = projectManifestKey(workspaceId, projectId)
  const existing = mockWorkerRuntimeArtifactState.projectManifests.get(key)
  const artifactRecords = dedupeArtifacts([
    ...(existing?.artifactRecords ?? []),
    ...outputManifest,
  ])
  const merged = {
    workspaceId,
    projectId,
    artifactRecords,
    updatedAt: nowIso(),
    mockOnly: true,
    persistenceMode: 'mock_memory' as const,
  }

  mockWorkerRuntimeArtifactState.projectManifests.set(key, merged)
  return merged
}

function dedupeArtifacts(artifacts: ToolArtifact[]): ToolArtifact[] {
  const byPath = new Map<string, ToolArtifact>()
  for (const artifact of artifacts) {
    byPath.set(`${artifact.id}:${artifact.storageObjectPath}`, artifact)
  }
  return [...byPath.values()]
}

function buildRetryDecision(input: {
  failureCategory?: ProductionWorkerFailureCategory
  attempt: number
  maxAttempts: number
}): WorkerRuntimeRetryDecision {
  if (!input.failureCategory) {
    return {
      shouldRetry: false,
      nextRetryDelayMs: 0,
      maxAttempts: input.maxAttempts,
    }
  }

  const shouldRetry = shouldRetryWorkerJob({
    failureCategory: input.failureCategory,
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
  })

  return {
    failureCategory: input.failureCategory,
    shouldRetry,
    nextRetryDelayMs: shouldRetry
      ? nextRetryDelayMs({ failureCategory: input.failureCategory, attempt: input.attempt })
      : 0,
    nextAttempt: shouldRetry ? input.attempt + 1 : undefined,
    maxAttempts: input.maxAttempts,
  }
}

function buildLeaseRecord(
  payload: ProductionWorkerJobPayload,
  workerResult: ProductionWorkerExecutionResult,
): WorkerRuntimeLeaseRecord {
  const leaseId = `lease:${payload.jobId}:${payload.workerType}:artifact-pipeline:attempt-${payload.attempt}`
  const claimedAt = workerResult.startedAt
  const releasedAt = workerResult.completedAt

  return {
    leaseId,
    workerInstanceId: `worker-${payload.workerType}-local`,
    leaseStatus: workerResult.status === 'completed' ? 'released' : workerResult.status === 'blocked' || workerResult.status === 'failed' ? 'failed' : 'released',
    claimedAt,
    heartbeatAt: claimedAt,
    expiresAt: addMs(5 * 60 * 1000),
    releasedAt,
  }
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)))
}
