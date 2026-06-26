import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaJobQueueLocalRuntimeStatus =
  | 'local_job_queue_metadata_validated_no_worker_execution'
  | 'blocked_invalid_job_queue_input'

export interface InternalBetaLocalJobSpec {
  jobType?: string
  workerType?: string
  priority?: 'low' | 'normal' | 'high'
  dependsOnLocalJobIndexes?: number[]
  payload?: Record<string, unknown>
}

export interface InternalBetaJobQueueLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  idempotencyKey?: string
  requestedByUserId?: string
  jobs?: InternalBetaLocalJobSpec[]
  metadata?: Record<string, unknown>
}

export interface InternalBetaLocalJobBatchRecord {
  id: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'queued_metadata_only'
  idempotencyKeyHash: string
  jobCount: number
  createdAt: string
  localOnly: true
  remoteSupabaseMutation: false
  workerExecution: false
  workerDispatch: false
  metadata: Record<string, unknown>
}

export interface InternalBetaLocalJobRecord {
  id: string
  batchId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobType: string
  workerType: string
  priority: 'low' | 'normal' | 'high'
  status: 'queued_metadata_only'
  retryCount: 0
  maxAttempts: 1
  idempotencyKeyHash: string
  localOnly: true
  workerLeaseClaimed: false
  workerExecution: false
  workerDispatch: false
  createdAt: string
  payloadSummary: Record<string, unknown>
}

export interface InternalBetaLocalJobDependencyRecord {
  id: string
  jobId: string
  dependsOnJobId: string
  dependencyType: 'blocks_start'
  requiredStatus: 'completed'
  status: 'pending'
  localOnly: true
  createdAt: string
}

export interface InternalBetaLocalJobEventRecord {
  id: string
  jobId: string
  eventType: 'job_queued_metadata_recorded'
  eventMessage: string
  visibleToUser: false
  localOnly: true
  jobEventWriteExecution: false
  createdAt: string
}

export interface InternalBetaJobQueueLocalRuntimeSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  serviceRoleRouteExecution: false
  creditMutation: false
  realCreditMutation: false
  jobEnqueueExecution: false
  jobEventWriteExecution: false
  workerLeaseClaim: false
  workerHeartbeat: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  rawPromptExecution: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageObjectCreation: false
  storageObjectRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaJobQueueLocalRuntimeResult {
  ok: boolean
  status: InternalBetaJobQueueLocalRuntimeStatus
  createdAt: string
  batch?: InternalBetaLocalJobBatchRecord
  jobs: InternalBetaLocalJobRecord[]
  dependencies: InternalBetaLocalJobDependencyRecord[]
  events: InternalBetaLocalJobEventRecord[]
  jobQueueHash?: string
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localJobBatchRecordCreated: boolean
  localJobRecordsCreated: number
  localJobDependencyRecordsCreated: number
  localJobEventRecordsCreated: number
  localOnly: true
  persistedToSupabase: false
  requiredBeforeRemoteJobRuntime: string[]
  safety: InternalBetaJobQueueLocalRuntimeSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_JOB_QUEUE_LOCAL_RUNTIME_RULE =
  'Job queue local runtime validates approved snapshot job metadata without route execution, Supabase writes, leases, dispatch, or worker execution.'

export const INTERNAL_BETA_JOB_QUEUE_FORBIDDEN_INPUT_KEYS = [
  'rawChat',
  'rawUserMessage',
  'rawUserMessages',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'directPrompt',
  'signedUrl',
  'publicUrl',
  'serviceRoleKey',
  'providerApiKey',
]

const REQUIRED_REMOTE_JOB_GATES = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'service_role_job_runtime_enablement',
  'transactional_job_event_and_lease_contract',
  'worker_lease_idempotency_key_enforcement',
  'private_artifact_manifest_storage_runtime',
  'negative_no_worker_execution_before_approval_regression',
]

const SAFETY_FALSE: InternalBetaJobQueueLocalRuntimeSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  serviceRoleRouteExecution: false,
  creditMutation: false,
  realCreditMutation: false,
  jobEnqueueExecution: false,
  jobEventWriteExecution: false,
  workerLeaseClaim: false,
  workerHeartbeat: false,
  workerExecution: false,
  workerDispatch: false,
  providerModelCall: false,
  rawPromptExecution: false,
  renderExportExecution: false,
  previewArtifactCreation: false,
  finalExportCreation: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

export function createInternalBetaJobQueueLocalRuntime(
  input: InternalBetaJobQueueLocalRuntimeInput,
): InternalBetaJobQueueLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.creditReservationId, 'creditReservationId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (!Array.isArray(input.jobs) || input.jobs.length === 0) {
    errors.push('jobs must include at least one local job spec.')
  } else if (input.jobs.length > 25) {
    errors.push('jobs must not exceed 25 local metadata records in one batch.')
  }

  for (const [index, job] of (input.jobs ?? []).entries()) {
    requireNonEmpty(job.jobType, `jobs[${index}].jobType`, errors)
    requireNonEmpty(job.workerType, `jobs[${index}].workerType`, errors)
    for (const dependencyIndex of job.dependsOnLocalJobIndexes ?? []) {
      if (!Number.isInteger(dependencyIndex) || dependencyIndex < 0 || dependencyIndex >= (input.jobs?.length ?? 0)) {
        errors.push(`jobs[${index}].dependsOnLocalJobIndexes contains invalid index ${dependencyIndex}.`)
      }
      if (dependencyIndex === index) {
        errors.push(`jobs[${index}] must not depend on itself.`)
      }
    }
  }

  const forbiddenInputKeys = findForbiddenInputKeys({
    metadata: input.metadata ?? {},
    jobs: input.jobs ?? [],
  })
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Job queue input must not contain raw prompt, signed/public URL, provider secret, or service-role fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0 || !input.jobs) {
    return createResult({ createdAt, status: 'blocked_invalid_job_queue_input', errors, warnings, input })
  }

  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const batchBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKeyHash,
    jobs: input.jobs.map((job) => ({
      jobType: job.jobType,
      workerType: job.workerType,
      priority: job.priority ?? 'normal',
      dependsOnLocalJobIndexes: job.dependsOnLocalJobIndexes ?? [],
      payloadKeys: job.payload ? Object.keys(sanitizeJson(job.payload)).sort() : [],
    })),
  }
  const jobQueueHash = sha256Hex(stableStringify(batchBasis))
  const batchId = `job_batch_${jobQueueHash.slice(0, 24)}`
  const batch: InternalBetaLocalJobBatchRecord = {
    id: batchId,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    creditReservationId: input.creditReservationId ?? '',
    status: 'queued_metadata_only',
    idempotencyKeyHash,
    jobCount: input.jobs.length,
    createdAt,
    localOnly: true,
    remoteSupabaseMutation: false,
    workerExecution: false,
    workerDispatch: false,
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      localRuntime: true,
      persistenceMode: 'local_validation_only_no_supabase_write',
      workerExecution: false,
      workerDispatch: false,
    },
  }

  const jobs = input.jobs.map((job, index): InternalBetaLocalJobRecord => ({
    id: `job_${jobQueueHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
    batchId,
    workspaceId: batch.workspaceId,
    projectId: batch.projectId,
    approvedPlanSnapshotId: batch.approvedPlanSnapshotId,
    creditReservationId: batch.creditReservationId,
    jobType: job.jobType ?? '',
    workerType: job.workerType ?? '',
    priority: job.priority ?? 'normal',
    status: 'queued_metadata_only',
    retryCount: 0,
    maxAttempts: 1,
    idempotencyKeyHash,
    localOnly: true,
    workerLeaseClaimed: false,
    workerExecution: false,
    workerDispatch: false,
    createdAt,
    payloadSummary: {
      payloadKeys: job.payload ? Object.keys(sanitizeJson(job.payload)).sort() : [],
    },
  }))

  const dependencies = input.jobs.flatMap((job, index) =>
    (job.dependsOnLocalJobIndexes ?? []).map((dependencyIndex): InternalBetaLocalJobDependencyRecord => ({
      id: `job_dependency_${jobQueueHash.slice(0, 14)}_${dependencyIndex + 1}_${index + 1}`,
      jobId: jobs[index].id,
      dependsOnJobId: jobs[dependencyIndex].id,
      dependencyType: 'blocks_start',
      requiredStatus: 'completed',
      status: 'pending',
      localOnly: true,
      createdAt,
    })),
  )

  const events = jobs.map((job): InternalBetaLocalJobEventRecord => ({
    id: `job_event_${job.id.replace(/^job_/, '')}`,
    jobId: job.id,
    eventType: 'job_queued_metadata_recorded',
    eventMessage: 'Local job queue metadata recorded; no queue push, lease, dispatch, or worker execution occurred.',
    visibleToUser: false,
    localOnly: true,
    jobEventWriteExecution: false,
    createdAt,
  }))

  return createResult({
    createdAt,
    status: 'local_job_queue_metadata_validated_no_worker_execution',
    errors,
    warnings,
    input,
    batch,
    jobs,
    dependencies,
    events,
    jobQueueHash,
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaJobQueueLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaJobQueueLocalRuntimeInput
  batch?: InternalBetaLocalJobBatchRecord
  jobs?: InternalBetaLocalJobRecord[]
  dependencies?: InternalBetaLocalJobDependencyRecord[]
  events?: InternalBetaLocalJobEventRecord[]
  jobQueueHash?: string
}): InternalBetaJobQueueLocalRuntimeResult {
  const ok = input.status === 'local_job_queue_metadata_validated_no_worker_execution'
  const jobs = ok ? input.jobs ?? [] : []
  const dependencies = ok ? input.dependencies ?? [] : []
  const events = ok ? input.events ?? [] : []

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    batch: ok ? input.batch : undefined,
    jobs,
    dependencies,
    events,
    jobQueueHash: ok ? input.jobQueueHash : undefined,
    validation: { ok, errors: input.errors, warnings: input.warnings },
    localJobBatchRecordCreated: ok,
    localJobRecordsCreated: jobs.length,
    localJobDependencyRecordsCreated: dependencies.length,
    localJobEventRecordsCreated: events.length,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeRemoteJobRuntime: [...REQUIRED_REMOTE_JOB_GATES],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function summarizeInput(input: InternalBetaJobQueueLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    requestedByUserId: input.requestedByUserId,
    jobCount: input.jobs?.length ?? 0,
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} is required.`)
  }
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (INTERNAL_BETA_JOB_QUEUE_FORBIDDEN_INPUT_KEYS.some((forbidden) => forbidden.toLowerCase() === key.toLowerCase())) {
      result.push(nextPath)
    }
    result.push(...findForbiddenInputKeys(nested, nextPath))
  }
  return result
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
