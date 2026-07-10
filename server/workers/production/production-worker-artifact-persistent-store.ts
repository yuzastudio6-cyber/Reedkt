import type { SupabaseClient } from '@supabase/supabase-js'

import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { ApiError } from '../../errors/api-error'
import { validateProductionStorageReference } from './production-worker-artifact-policy'
import type {
  WorkerRuntimeArtifactPipelineResult,
  WorkerRuntimeJobRecord,
  WorkerRuntimeLeaseRecord,
  WorkerRuntimeOutputManifest,
  WorkerRuntimeRetryDecision,
} from './production-worker-artifact-pipeline'
import type {
  ProductionWorkerJobPayload,
  ProductionWorkerJobStatus,
  ProductionWorkerRuntimeType,
  ProductionWorkerStorageReferenceInput,
} from './production-worker-types'

interface ProductionWorkerRuntimeJobRow {
  id: string
  workspace_id: string
  project_id: string
  job_id: string
  tool_execution_plan_id: string
  approved_plan_snapshot_id: string
  credit_estimate_id: string | null
  credit_reservation_id: string | null
  production_readiness_evidence_packet_id: string | null
  worker_type: string
  execution_mode: string
  requested_tool_ids: unknown
  requested_recipe_ids: unknown
  api_idempotency_key: string | null
  worker_idempotency_key: string
  attempt: number
  max_attempts: number
  status: string
  lease_json: unknown
  output_artifact_ids: unknown
  failure_category: string | null
  retry_decision_json: unknown
  created_at: string
  updated_at: string
}

interface ProductionWorkerRuntimeArtifactRow {
  id: string
  workspace_id: string
  project_id: string
  job_id: string
  worker_idempotency_key: string
  artifact_type: string
  storage_bucket_purpose: string
  storage_object_path: string
  is_private: boolean
  source_of_truth: boolean
  artifact_record: unknown
  created_at: string
}

export async function recordPersistentWorkerRuntimeArtifactPipeline(
  admin: SupabaseClient,
  pipeline: WorkerRuntimeArtifactPipelineResult,
): Promise<WorkerRuntimeArtifactPipelineResult> {
  validatePipelineForPersistence(pipeline)

  const existing = await getPersistentWorkerRuntimeArtifactReplay(
    admin,
    pipeline.job.workerIdempotencyKey,
  )
  if (existing) return markPersistentReplay(existing)

  const insertedJob = await admin
    .from('production_worker_runtime_jobs')
    .insert(jobToRow(pipeline.job))
    .select('*')
    .single()

  if (insertedJob.error?.code === '23505') {
    const replay = await getPersistentWorkerRuntimeArtifactReplay(admin, pipeline.job.workerIdempotencyKey)
    if (replay) return markPersistentReplay(replay)
  }

  throwPersistentStoreError(insertedJob.error)
  if (!insertedJob.data) {
    throw new ApiError(
      'TOOL_RUNTIME_ARTIFACT_BACKEND_REQUIRED',
      'Production worker runtime job insert did not return a row.',
      409,
    )
  }

  if (pipeline.outputManifest.length > 0) {
    const insertedArtifacts = await admin
      .from('production_worker_runtime_artifacts')
      .insert(pipeline.outputManifest.map((artifact) => artifactToRow(pipeline.job, artifact)))
      .select('id')

    if (insertedArtifacts.error?.code === '23505') {
      const replay = await getPersistentWorkerRuntimeArtifactReplay(admin, pipeline.job.workerIdempotencyKey)
      if (replay) return markPersistentReplay(replay)
    }

    throwPersistentStoreError(insertedArtifacts.error)
  }

  const replay = await getPersistentWorkerRuntimeArtifactReplay(admin, pipeline.job.workerIdempotencyKey)
  if (!replay) {
    throw new ApiError(
      'TOOL_RUNTIME_ARTIFACT_BACKEND_REQUIRED',
      'Production worker runtime artifact persistence could not read back the stored job/output manifest.',
      409,
    )
  }

  return {
    ...replay,
    replayed: false,
    warnings: uniqueWarnings([
      ...replay.warnings,
      'Worker runtime artifact pipeline persisted private output manifests through Supabase service-role storage.',
    ]),
  }
}

export async function getPersistentWorkerRuntimeArtifactReplay(
  admin: SupabaseClient,
  workerIdempotencyKey: string,
): Promise<WorkerRuntimeArtifactPipelineResult | null> {
  const jobResult = await admin
    .from('production_worker_runtime_jobs')
    .select('*')
    .eq('worker_idempotency_key', workerIdempotencyKey)
    .maybeSingle()

  throwPersistentStoreError(jobResult.error)
  if (!jobResult.data) return null

  const job = rowToJob(jobResult.data as ProductionWorkerRuntimeJobRow)
  const artifacts = await listPersistentArtifactsForWorker(admin, workerIdempotencyKey)
  const mergedOutputManifest = await getPersistentProjectWorkerRuntimeOutputManifest(admin, {
    workspaceId: job.workspaceId,
    projectId: job.projectId,
  })

  return {
    job,
    outputManifest: artifacts,
    mergedOutputManifest,
    replayed: true,
    warnings: [
      'Worker runtime artifact pipeline replayed a persistent Supabase-backed job/output manifest for this idempotency key.',
    ],
  }
}

export async function getPersistentProjectWorkerRuntimeOutputManifest(
  admin: SupabaseClient,
  input: { workspaceId: string; projectId: string },
): Promise<WorkerRuntimeOutputManifest> {
  const result = await admin
    .from('production_worker_runtime_artifacts')
    .select('*')
    .eq('workspace_id', input.workspaceId)
    .eq('project_id', input.projectId)
    .order('created_at', { ascending: true })

  throwPersistentStoreError(result.error)

  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    artifactRecords: dedupeArtifacts(((result.data ?? []) as ProductionWorkerRuntimeArtifactRow[]).map(rowToArtifact)),
    updatedAt: new Date().toISOString(),
    mockOnly: false,
    persistenceMode: 'persistent_supabase',
  }
}

async function listPersistentArtifactsForWorker(
  admin: SupabaseClient,
  workerIdempotencyKey: string,
): Promise<ToolArtifact[]> {
  const result = await admin
    .from('production_worker_runtime_artifacts')
    .select('*')
    .eq('worker_idempotency_key', workerIdempotencyKey)
    .order('created_at', { ascending: true })

  throwPersistentStoreError(result.error)
  return ((result.data ?? []) as ProductionWorkerRuntimeArtifactRow[]).map(rowToArtifact)
}

function jobToRow(job: WorkerRuntimeJobRecord): ProductionWorkerRuntimeJobRow {
  return {
    id: job.id,
    workspace_id: job.workspaceId,
    project_id: job.projectId,
    job_id: job.jobId,
    tool_execution_plan_id: job.toolExecutionPlanId,
    approved_plan_snapshot_id: job.approvedPlanSnapshotId,
    credit_estimate_id: job.creditEstimateId ?? null,
    credit_reservation_id: job.creditReservationId ?? null,
    production_readiness_evidence_packet_id: job.productionReadinessEvidencePacketId ?? null,
    worker_type: job.workerType,
    execution_mode: job.executionMode,
    requested_tool_ids: job.requestedToolIds,
    requested_recipe_ids: job.requestedRecipeIds,
    api_idempotency_key: job.apiIdempotencyKey ?? null,
    worker_idempotency_key: job.workerIdempotencyKey,
    attempt: job.attempt,
    max_attempts: job.maxAttempts,
    status: job.status,
    lease_json: job.lease,
    output_artifact_ids: job.outputArtifactIds,
    failure_category: job.failureCategory ?? null,
    retry_decision_json: job.retryDecision,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  }
}

function artifactToRow(job: WorkerRuntimeJobRecord, artifact: ToolArtifact): ProductionWorkerRuntimeArtifactRow {
  validateArtifactForPersistence(artifact)

  return {
    id: artifact.id,
    workspace_id: artifact.workspaceId,
    project_id: artifact.projectId,
    job_id: job.jobId,
    worker_idempotency_key: job.workerIdempotencyKey,
    artifact_type: artifact.artifactType,
    storage_bucket_purpose: artifact.storageBucketPurpose,
    storage_object_path: artifact.storageObjectPath,
    is_private: artifact.isPrivate,
    source_of_truth: artifact.sourceOfTruth,
    artifact_record: artifact,
    created_at: artifact.createdAt,
  }
}

function rowToJob(row: ProductionWorkerRuntimeJobRow): WorkerRuntimeJobRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    jobId: row.job_id,
    toolExecutionPlanId: row.tool_execution_plan_id,
    approvedPlanSnapshotId: row.approved_plan_snapshot_id,
    creditEstimateId: row.credit_estimate_id ?? undefined,
    creditReservationId: row.credit_reservation_id ?? undefined,
    productionReadinessEvidencePacketId: row.production_readiness_evidence_packet_id ?? undefined,
    workerType: row.worker_type as ProductionWorkerRuntimeType,
    executionMode: row.execution_mode as ProductionWorkerJobPayload['executionMode'],
    requestedToolIds: stringArray(row.requested_tool_ids),
    requestedRecipeIds: stringArray(row.requested_recipe_ids),
    apiIdempotencyKey: row.api_idempotency_key ?? undefined,
    workerIdempotencyKey: row.worker_idempotency_key,
    attempt: numericValue(row.attempt),
    maxAttempts: numericValue(row.max_attempts),
    status: row.status as ProductionWorkerJobStatus,
    lease: recordValue(row.lease_json) as unknown as WorkerRuntimeLeaseRecord,
    outputArtifactIds: stringArray(row.output_artifact_ids),
    failureCategory: row.failure_category as WorkerRuntimeJobRecord['failureCategory'],
    retryDecision: recordValue(row.retry_decision_json) as unknown as WorkerRuntimeRetryDecision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replayCount: 1,
    mockOnly: false,
    persistenceMode: 'persistent_supabase',
  }
}

function rowToArtifact(row: ProductionWorkerRuntimeArtifactRow): ToolArtifact {
  const record = recordValue(row.artifact_record)
  const artifact: ToolArtifact = {
    id: stringValue(record.id, row.id),
    workspaceId: stringValue(record.workspaceId, row.workspace_id),
    projectId: stringValue(record.projectId, row.project_id),
    mediaAssetId: stringValue(record.mediaAssetId, 'media-asset-not-recorded'),
    toolRunId: stringValue(record.toolRunId, `${row.job_id}:${row.artifact_type}`),
    artifactType: stringValue(record.artifactType, row.artifact_type) as ToolArtifact['artifactType'],
    storageBucketPurpose: stringValue(record.storageBucketPurpose, row.storage_bucket_purpose) as ToolArtifact['storageBucketPurpose'],
    storageObjectPath: stringValue(record.storageObjectPath, row.storage_object_path),
    contentType: stringValue(record.contentType, 'application/octet-stream'),
    sizeBytes: optionalNumber(record.sizeBytes),
    checksum: optionalString(record.checksum),
    createdAt: stringValue(record.createdAt, row.created_at),
    isPrivate: row.is_private,
    metadata: recordValue(record.metadata) as ToolArtifact['metadata'],
    previewAllowed: Boolean(record.previewAllowed),
    sourceOfTruth: row.source_of_truth,
  }

  validateArtifactForPersistence(artifact)
  return artifact
}

function validatePipelineForPersistence(pipeline: WorkerRuntimeArtifactPipelineResult): void {
  for (const artifact of pipeline.outputManifest) {
    validateArtifactForPersistence(artifact)
  }
}

function validateArtifactForPersistence(artifact: ToolArtifact): void {
  validateProductionStorageReference(artifact as ProductionWorkerStorageReferenceInput)
}

function markPersistentReplay(pipeline: WorkerRuntimeArtifactPipelineResult): WorkerRuntimeArtifactPipelineResult {
  return {
    ...pipeline,
    job: {
      ...pipeline.job,
      replayCount: pipeline.job.replayCount + 1,
    },
    replayed: true,
    warnings: uniqueWarnings([
      ...pipeline.warnings,
      'Persistent worker runtime artifact replay avoided duplicate worker dispatch and duplicate output manifest inserts.',
    ]),
  }
}

function throwPersistentStoreError(error: { code?: string; message?: string; hint?: string } | null): void {
  if (!error) return
  if (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /production_worker_runtime_(jobs|artifacts)|does not exist|schema cache/i.test(error.message ?? '')
  ) {
    throw new ApiError(
      'TOOL_RUNTIME_ARTIFACT_BACKEND_REQUIRED',
      'Production worker artifact manifest persistence requires the production_worker_runtime_jobs and production_worker_runtime_artifacts migration before production output manifests can be stored or read.',
      409,
      { code: error.code, hint: error.hint },
    )
  }
  throw new ApiError('INTERNAL_ERROR', error.message ?? 'Production worker artifact persistence failed.', 500, {
    code: error.code,
    hint: error.hint,
  })
}

function recordValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function numericValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  const parsed = numericValue(value)
  return parsed > 0 ? parsed : undefined
}

function dedupeArtifacts(artifacts: ToolArtifact[]): ToolArtifact[] {
  const byPath = new Map<string, ToolArtifact>()
  for (const artifact of artifacts) {
    byPath.set(`${artifact.id}:${artifact.storageObjectPath}`, artifact)
  }
  return [...byPath.values()]
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)))
}
