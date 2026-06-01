import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type JobRuntimeStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type JobMutationAction =
  | 'job_batch_create'
  | 'job_queue_create'
  | 'job_create'
  | 'job_dependency_create'
  | 'job_event_append'
  | 'job_retry_schedule'
  | 'job_cancel_request'

export interface JobRuntimeInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  jobBatchId?: string
  jobId?: string
  dependsOnJobId?: string
  jobType?: string
  executionMode?: string
  idempotencyKey?: string
  attemptNumber?: number
  maxAttempts?: number
  reason?: string
  eventType?: string
  eventVisibility?: string
  status?: string
  payloadJson?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

interface JobBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'not_applicable'
  note: string
}

export interface JobRuntimeResult {
  status: JobRuntimeStatus
  canProceed: boolean
  canClaim: boolean
  canRun: boolean
  blockers: JobBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  job?: Record<string, unknown> | null
  jobs?: Record<string, unknown>[]
  jobBatch?: Record<string, unknown> | null
  dependencySummary?: Record<string, unknown> | null
  dependencies?: Record<string, unknown>[]
  events?: Record<string, unknown>[]
  workerClaimSummary?: Record<string, unknown> | null
  idempotencySummary?: Record<string, unknown> | null
  intendedPayload?: Record<string, unknown>
  auditEvent?: Record<string, unknown>
}

interface Row {
  [key: string]: unknown
}

const EXPENSIVE_JOB_TYPES = new Set([
  'generation',
  'provider_request',
  'render_preview',
  'render_export',
  'export',
  'tool_execution',
  'media_analysis',
  'transcript_alignment',
  'visual_observation',
  'audio_observation',
])

const TERMINAL_JOB_STATUSES = new Set(['completed', 'failed', 'cancelled'])
const SAFE_EVENT_VISIBILITIES = new Set(['internal', 'user_summary', 'audit'])
const UNSAFE_KEY_TERMS = [
  'secret',
  'token',
  'apikey',
  'providerkey',
  'servicerole',
  'signedurl',
  'uploadurl',
  'downloadurl',
  'temporaryurl',
  'privatekey',
  'password',
  'credential',
  'stripe',
]

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function collectUnsafeJsonPaths(value: unknown, path = 'payload', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeJsonPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!isRecord(value)) return paths

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key)
    if (UNSAFE_KEY_TERMS.some((term) => normalized.includes(term))) {
      paths.push(`${path}.${key}`)
    }
    collectUnsafeJsonPaths(child, `${path}.${key}`, paths)
  }

  return paths
}

function assertSafeJson(value: Record<string, unknown> | undefined, label: string): void {
  if (!value) return
  const unsafePaths = collectUnsafeJsonPaths(value, label)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Job and worker payloads must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, or credentials.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): JobRuntimeResult {
  return {
    status: 'ready',
    canProceed: true,
    canClaim: false,
    canRun: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'No action required.',
  }
}

function addBlocker(result: JobRuntimeResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.canProceed = false
  result.canClaim = false
  result.canRun = false
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
}

function addRequiredRecord(result: JobRuntimeResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: JobRuntimeResult): JobRuntimeResult {
  if (result.blockers.length === 0) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Job/worker boundary check passed. Prompt 8 still does not execute jobs or workers.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.canClaim = false
  result.canRun = false
  result.nextAction = result.status === 'backend_required'
    ? 'Use a reviewed transactional backend/service-role queue runtime before mutating job or worker state.'
    : 'Resolve listed job/worker blockers before proceeding.'
  return result
}

function backendRequiredResult(scope: string, intendedPayload?: Record<string, unknown>, extraWarnings: string[] = []): JobRuntimeResult {
  const result = baseResult([
    `${scope} requires backend service-role transactional runtime.`,
    'Prompt 8 does not create jobs, claim workers, execute workers, call providers, render media, execute tools, mutate credits, upload/download storage, run media analysis, deploy, or run remote Supabase.',
    ...extraWarnings,
  ])
  result.intendedPayload = intendedPayload ? sanitizeJson(intendedPayload) : undefined
  addBlocker(result, 'TransactionalRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 8.`)
  return finalize(result)
}

function mutationBoundaryResult(action: JobMutationAction, input: JobRuntimeInput, readiness?: JobRuntimeResult): JobRuntimeResult {
  assertSafeJson(input.payloadJson, 'payloadJson')
  assertSafeJson(input.metadata, 'metadata')

  const result = baseResult([
    'Job/worker mutation is fail-closed in Prompt 8 until a reviewed transactional RPC/service exists.',
    'No job, dependency, job event, worker claim, worker lease, provider, render, tool, media analysis, storage, or credit mutation occurred.',
  ])

  if (readiness) {
    result.blockers.push(...readiness.blockers)
    result.requiredRecords.push(...readiness.requiredRecords)
    result.job = readiness.job
    result.jobBatch = readiness.jobBatch
    result.dependencySummary = readiness.dependencySummary
    result.idempotencySummary = readiness.idempotencySummary
  }

  result.intendedPayload = sanitizeJson({
    action,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId ?? input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    jobBatchId: input.jobBatchId,
    jobId: input.jobId,
    dependsOnJobId: input.dependsOnJobId,
    jobType: input.jobType,
    executionMode: input.executionMode,
    attemptNumber: input.attemptNumber,
    maxAttempts: input.maxAttempts,
    eventType: input.eventType,
    eventVisibility: input.eventVisibility,
    status: input.status,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    prompt8BoundaryOnly: true,
  })
  result.auditEvent = sanitizeJson({
    eventName: `jobs.${action}.backend_required`,
    action,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
  })

  addBlocker(result, 'TransactionalMutationGate', 'BACKEND_REQUIRED', `Job action ${action} requires a future transactional backend implementation.`)
  return finalize(result)
}

function jobSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    jobBatchId: stringValue(row.job_batch_id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    approvedSnapshotId: stringValue(row.approved_plan_snapshot_id),
    creditEstimateId: stringValue(row.credit_estimate_id),
    creditReservationId: stringValue(row.credit_reservation_id),
    jobType: stringValue(row.job_type),
    status: stringValue(row.status),
    priority: stringValue(row.priority),
    workerTarget: stringValue(row.worker_target),
    runtimeType: stringValue(row.runtime_type),
    attemptCount: numberValue(row.attempt_count),
    maxAttempts: numberValue(row.max_attempts),
    progressPercent: numberValue(row.progress_percent),
    progressMessage: stringValue(row.progress_message),
    scheduledFor: stringValue(row.scheduled_for),
    startedAt: stringValue(row.started_at),
    completedAt: stringValue(row.completed_at),
    failedAt: stringValue(row.failed_at),
    cancelledAt: stringValue(row.cancelled_at),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  })
}

function dependencySummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    jobId: stringValue(row.job_id),
    dependsOnJobId: stringValue(row.depends_on_job_id),
    dependencyReason: stringValue(row.dependency_reason),
    requiredStatus: stringValue(row.required_status),
    createdAt: stringValue(row.created_at),
  })
}

function eventSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    jobId: stringValue(row.job_id),
    jobBatchId: stringValue(row.job_batch_id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    eventType: stringValue(row.event_type),
    message: stringValue(row.message),
    progressPercent: numberValue(row.progress_percent),
    actorType: stringValue(row.actor_type),
    createdAt: stringValue(row.created_at),
  })
}

function assertIdempotency(input: JobRuntimeInput): void {
  if (!input.idempotencyKey) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for job and worker mutation boundaries.', 400)
  }
}

function normalizeSnapshotId(input: JobRuntimeInput): string | undefined {
  return input.approvedSnapshotId ?? input.approvedPlanSnapshotId
}

function addApprovalAndCreditRequirements(result: JobRuntimeResult, input: JobRuntimeInput): void {
  const approvedSnapshotId = normalizeSnapshotId(input)
  const requiresExpensiveGate = input.jobType ? EXPENSIVE_JOB_TYPES.has(input.jobType) : true

  addRequiredRecord(result, {
    table: 'approved_plan_snapshots',
    id: approvedSnapshotId,
    status: approvedSnapshotId ? 'present' : 'missing',
    note: 'Workers execute approved snapshots, not raw chat or mutable current plan state.',
  })

  if (!approvedSnapshotId) {
    addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Job orchestration requires an approved snapshot reference.')
  }

  addRequiredRecord(result, {
    table: 'credit_estimates',
    id: input.creditEstimateId,
    status: input.creditEstimateId ? 'present' : 'missing',
    note: 'Credit estimate approval must be tied to the execution boundary.',
  })

  addRequiredRecord(result, {
    table: 'credit_reservations',
    id: input.creditReservationId,
    status: input.creditReservationId ? 'present' : 'missing',
    note: 'Credit reservation must be active before expensive execution.',
  })

  if (requiresExpensiveGate && !input.creditReservationId) {
    addBlocker(result, 'CreditReservationGate', 'CREDITS_NOT_RESERVED', 'Expensive job types require an active credit reservation reference.')
  }
}

export function createJobService(context: ServiceContext) {
  async function ensureProjectAccess(projectId: string, workspaceId?: string): Promise<JobRuntimeResult | null> {
    getRequiredAuthUserId(context)

    try {
      const projectAccess = await createProjectService(context).checkProjectAccess(projectId)
      if (projectAccess.status === 'backend_required') {
        return backendRequiredResult('Project access check')
      }
      if (workspaceId && projectAccess.project?.workspaceId && projectAccess.project.workspaceId !== workspaceId) {
        const result = baseResult()
        addBlocker(result, 'ProjectAccessGate', 'WORKSPACE_ACCESS_DENIED', 'Project does not belong to the requested workspace.')
        return finalize(result)
      }
      return null
    } catch (error) {
      if (error instanceof ApiError && error.code === 'BACKEND_REQUIRED') return backendRequiredResult('Project access check')
      throw error
    }
  }

  async function getJobRow(jobId: string): Promise<Row | null> {
    if (!context.clients.admin || context.env.mockOnly) return null

    const { data, error } = await context.clients.admin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    throwOnSupabaseError(error, 'JOB_NOT_FOUND')
    return data as Row | null
  }

  async function resolveJobAccess(jobId: string, workspaceId?: string, projectId?: string): Promise<{ row?: Row; blocker?: JobRuntimeResult }> {
    const row = await getJobRow(jobId)
    if (!row) return { blocker: backendRequiredResult('Job read') }

    const resolvedProjectId = stringValue(row.project_id)
    if (!resolvedProjectId) {
      throw new ApiError('JOB_NOT_FOUND', 'Job is missing canonical project_id.', 404)
    }

    if (projectId && projectId !== resolvedProjectId) {
      const result = baseResult()
      addBlocker(result, 'ProjectAccessGate', 'WORKSPACE_ACCESS_DENIED', 'Job does not belong to the requested project.')
      return { blocker: finalize(result) }
    }

    const accessBlock = await ensureProjectAccess(resolvedProjectId, workspaceId ?? stringValue(row.workspace_id))
    if (accessBlock) return { blocker: accessBlock }
    return { row }
  }

  async function checkJobReadiness(input: JobRuntimeInput): Promise<JobRuntimeResult> {
    assertSafeJson(input.payloadJson, 'payloadJson')
    assertSafeJson(input.metadata, 'metadata')

    const accessBlock = await ensureProjectAccess(input.projectId, input.workspaceId)
    if (accessBlock) return accessBlock

    const result = baseResult([
      'Readiness check is a Prompt 8 boundary check only; it does not create, queue, claim, or execute jobs.',
    ])
    addApprovalAndCreditRequirements(result, input)
    addRequiredRecord(result, {
      table: 'api_idempotency_keys',
      id: input.idempotencyKey,
      status: input.idempotencyKey ? 'present' : 'missing',
      note: 'Mutation routes must include an Idempotency-Key header.',
    })
    addBlocker(result, 'TransactionalRuntimeGate', 'BACKEND_REQUIRED', 'Job creation, dependency mutation, event append, retry, cancel, and worker claim require future transactional backend runtime.')
    return finalize(result)
  }

  async function getJob(input: { jobId: string; workspaceId?: string; projectId?: string }): Promise<JobRuntimeResult> {
    const { row, blocker } = await resolveJobAccess(input.jobId, input.workspaceId, input.projectId)
    if (blocker) return blocker

    const result = baseResult(['Job read is scoped by project access and returns sanitized status metadata only.'])
    result.job = row ? jobSummary(row) : null
    return finalize(result)
  }

  return {
    checkJobReadiness,

    async createJobBatch(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_batch_create', input, readiness)
    },

    async createJob(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_create', input, readiness)
    },

    async queueJob(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_queue_create', input, readiness)
    },

    getJob,

    async listJobsForProject(input: { workspaceId: string; projectId: string }): Promise<JobRuntimeResult> {
      const accessBlock = await ensureProjectAccess(input.projectId, input.workspaceId)
      if (accessBlock) return accessBlock
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Project job list')

      const { data, error } = await context.clients.admin
        .from('jobs')
        .select('*')
        .eq('project_id', input.projectId)
        .order('created_at', { ascending: false })
        .limit(100)

      throwOnSupabaseError(error)
      const result = baseResult(['Project job list returns sanitized status metadata only.'])
      result.jobs = (data ?? []).map((row) => jobSummary(row as Row))
      return finalize(result)
    },

    async createDependency(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_dependency_create', input, readiness)
    },

    async getDependencies(input: { jobId: string; workspaceId?: string; projectId?: string }): Promise<JobRuntimeResult> {
      const { row, blocker } = await resolveJobAccess(input.jobId, input.workspaceId, input.projectId)
      if (blocker) return blocker
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Job dependency read')

      const { data, error } = await context.clients.admin
        .from('job_dependencies')
        .select('*')
        .eq('job_id', input.jobId)
        .order('created_at', { ascending: true })

      throwOnSupabaseError(error)
      const result = baseResult(['Job dependency read is sanitized and project-scoped.'])
      result.job = row ? jobSummary(row) : null
      result.dependencies = (data ?? []).map((dependency) => dependencySummary(dependency as Row))
      return finalize(result)
    },

    async appendJobEvent(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      if (input.eventVisibility && !SAFE_EVENT_VISIBILITIES.has(input.eventVisibility)) {
        throw new ApiError('VALIDATION_FAILED', 'Job event visibility must be internal, user_summary, or audit.', 400)
      }
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_event_append', input, readiness)
    },

    async listJobEvents(input: { jobId: string; workspaceId?: string; projectId?: string }): Promise<JobRuntimeResult> {
      const { row, blocker } = await resolveJobAccess(input.jobId, input.workspaceId, input.projectId)
      if (blocker) return blocker
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Job event read')

      const { data, error } = await context.clients.admin
        .from('job_events')
        .select('*')
        .eq('job_id', input.jobId)
        .order('created_at', { ascending: true })

      throwOnSupabaseError(error)
      const result = baseResult(['Job event read returns sanitized progress events only.'])
      result.job = row ? jobSummary(row) : null
      result.events = (data ?? []).map((event) => eventSummary(event as Row))
      return finalize(result)
    },

    async getJobStatus(input: { jobId: string; workspaceId?: string; projectId?: string }): Promise<JobRuntimeResult> {
      const result = await getJob(input)
      if (result.job?.status && TERMINAL_JOB_STATUSES.has(String(result.job.status))) {
        result.warnings.push('Job is terminal; retry or revision requires a future approved retry policy.')
      }
      return result
    },

    async scheduleRetry(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_retry_schedule', input, readiness)
    },

    async requestCancel(input: JobRuntimeInput): Promise<JobRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkJobReadiness(input)
      return mutationBoundaryResult('job_cancel_request', input, readiness)
    },
  }
}
