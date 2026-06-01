import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type WorkerRuntimeStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type WorkerMutationAction =
  | 'worker_claim_create'
  | 'worker_heartbeat'
  | 'worker_lease_renew'
  | 'worker_lease_release'
  | 'worker_complete'
  | 'worker_fail'
  | 'worker_recover_stale'
  | 'tool_runtime_check_create'

export interface WorkerRuntimeInput {
  workspaceId?: string
  projectId?: string
  jobId?: string
  workerClaimId?: string
  leaseId?: string
  workerType?: string
  workerInstanceId?: string
  leaseExpiresAt?: string
  heartbeatToken?: string
  claimToken?: string
  attemptNumber?: number
  maxAttempts?: number
  reason?: string
  completionSummary?: string
  failReason?: string
  runtimeRegion?: string
  toolName?: string
  toolVersion?: string
  checkStatus?: string
  checkSummary?: string
  binaryPath?: string
  capabilitiesJson?: Record<string, unknown>
  idempotencyKey?: string
  outputJson?: Record<string, unknown>
  errorJson?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

interface WorkerBlocker {
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

export interface WorkerRuntimeResult {
  status: WorkerRuntimeStatus
  canProceed: boolean
  canClaim: boolean
  canRun: boolean
  blockers: WorkerBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  job?: Record<string, unknown> | null
  claim?: Record<string, unknown>
  workerClaim?: Record<string, unknown> | null
  lease?: Record<string, unknown> | null
  runtimeRegistry?: Record<string, unknown>[]
  idempotencySummary?: Record<string, unknown> | null
  intendedPayload?: Record<string, unknown>
  auditEvent?: Record<string, unknown>
}

interface Row {
  [key: string]: unknown
}

const WORKER_TYPES = [
  'media_probe_worker',
  'transcript_alignment_worker',
  'visual_observation_worker',
  'audio_observation_worker',
  'remotion_render_worker',
  'ffmpeg_postprocess_worker',
  'image_asset_worker',
  'browser_capture_worker',
  'map_render_worker',
  'chart_render_worker',
  'tool_execution_worker',
  'provider_asset_worker',
  'sfx_worker',
  'music_worker',
  'qa_worker',
  'export_worker',
]

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
      'Worker payloads must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, or credentials.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): WorkerRuntimeResult {
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

function addBlocker(result: WorkerRuntimeResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.canProceed = false
  result.canClaim = false
  result.canRun = false
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
}

function addRequiredRecord(result: WorkerRuntimeResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: WorkerRuntimeResult): WorkerRuntimeResult {
  if (result.blockers.length === 0) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Worker boundary check passed. Prompt 8 still does not execute workers.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.canClaim = false
  result.canRun = false
  result.nextAction = result.status === 'backend_required'
    ? 'Use a reviewed transactional backend/service-role worker runtime before mutating worker claim or lease state.'
    : 'Resolve listed worker blockers before proceeding.'
  return result
}

function backendRequiredResult(scope: string, intendedPayload?: Record<string, unknown>, extraWarnings: string[] = []): WorkerRuntimeResult {
  const result = baseResult([
    `${scope} requires backend service-role transactional runtime.`,
    'Prompt 8 does not claim workers, execute workers, run tools, call providers, render media, run media analysis, mutate credits, upload/download storage, deploy, or run remote Supabase.',
    ...extraWarnings,
  ])
  result.intendedPayload = intendedPayload ? sanitizeJson(intendedPayload) : undefined
  addBlocker(result, 'TransactionalRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 8.`)
  return finalize(result)
}

function mutationBoundaryResult(action: WorkerMutationAction, input: WorkerRuntimeInput, readiness?: WorkerRuntimeResult): WorkerRuntimeResult {
  assertSafeJson(input.outputJson, 'outputJson')
  assertSafeJson(input.errorJson, 'errorJson')
  assertSafeJson(input.metadata, 'metadata')

  const result = baseResult([
    'Worker mutation is fail-closed in Prompt 8 until a reviewed transactional RPC/service exists.',
    'No worker claim, worker lease, heartbeat, completion, failure, tool runtime check, provider, render, media analysis, storage, or credit mutation occurred.',
  ])

  if (readiness) {
    result.blockers.push(...readiness.blockers)
    result.requiredRecords.push(...readiness.requiredRecords)
    result.job = readiness.job
    result.claim = readiness.workerClaim ?? undefined
    result.workerClaim = readiness.workerClaim
    result.lease = readiness.lease
    result.idempotencySummary = readiness.idempotencySummary
  }

  result.intendedPayload = sanitizeJson({
    action,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    jobId: input.jobId,
    workerClaimId: input.workerClaimId,
    leaseId: input.leaseId,
    workerType: input.workerType,
    workerInstanceId: input.workerInstanceId,
    attemptNumber: input.attemptNumber,
    maxAttempts: input.maxAttempts,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    prompt8BoundaryOnly: true,
  })
  result.auditEvent = sanitizeJson({
    eventName: `workers.${action}.backend_required`,
    action,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    jobId: input.jobId,
    workerClaimId: input.workerClaimId,
    leaseId: input.leaseId,
  })

  addBlocker(result, 'TransactionalMutationGate', 'BACKEND_REQUIRED', `Worker action ${action} requires a future transactional backend implementation.`)
  return finalize(result)
}

function assertIdempotency(input: WorkerRuntimeInput): void {
  if (!input.idempotencyKey) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for job and worker mutation boundaries.', 400)
  }
}

function jobSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    jobBatchId: stringValue(row.job_batch_id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    jobType: stringValue(row.job_type),
    status: stringValue(row.status),
    runtimeType: stringValue(row.runtime_type),
    workerTarget: stringValue(row.worker_target),
    attemptCount: numberValue(row.attempt_count),
    maxAttempts: numberValue(row.max_attempts),
    progressPercent: numberValue(row.progress_percent),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  })
}

function workerClaimSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    jobId: stringValue(row.job_id),
    workerType: stringValue(row.worker_type),
    workerInstanceId: stringValue(row.worker_instance_id),
    claimStatus: stringValue(row.claim_status),
    attemptNumber: numberValue(row.attempt_number),
    claimedAt: stringValue(row.claimed_at),
    heartbeatAt: stringValue(row.heartbeat_at),
    releasedAt: stringValue(row.released_at),
    leaseExpiresAt: stringValue(row.lease_expires_at),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  })
}

export function createWorkerClaimService(context: ServiceContext) {
  async function ensureProjectAccess(projectId: string, workspaceId?: string): Promise<WorkerRuntimeResult | null> {
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

  async function resolveJob(input: WorkerRuntimeInput): Promise<{ row?: Row; blocker?: WorkerRuntimeResult }> {
    if (!input.jobId) {
      const result = baseResult()
      addRequiredRecord(result, {
        table: 'jobs',
        status: 'missing',
        note: 'Worker claim and lease boundaries require a job reference.',
      })
      addBlocker(result, 'WorkerClaimGate', 'JOB_NOT_FOUND', 'Worker boundary requires a jobId.')
      return { blocker: finalize(result) }
    }

    if (!context.clients.admin || context.env.mockOnly) return { blocker: backendRequiredResult('Job read') }

    const { data, error } = await context.clients.admin
      .from('jobs')
      .select('*')
      .eq('id', input.jobId)
      .maybeSingle()

    throwOnSupabaseError(error, 'JOB_NOT_FOUND')
    if (!data) {
      const result = baseResult()
      addBlocker(result, 'JobStatusGate', 'JOB_NOT_FOUND', 'Job was not found.')
      return { blocker: finalize(result) }
    }

    const row = data as Row
    const projectId = input.projectId ?? stringValue(row.project_id)
    if (!projectId) throw new ApiError('JOB_NOT_FOUND', 'Job is missing canonical project_id.', 404)
    const accessBlock = await ensureProjectAccess(projectId, input.workspaceId ?? stringValue(row.workspace_id))
    if (accessBlock) return { blocker: accessBlock }
    return { row }
  }

  async function resolveClaim(input: WorkerRuntimeInput): Promise<{ row?: Row; blocker?: WorkerRuntimeResult }> {
    if (!input.workerClaimId && !input.jobId) return { blocker: backendRequiredResult('Worker claim read') }
    if (!context.clients.admin || context.env.mockOnly) return { blocker: backendRequiredResult('Worker claim read') }

    let query = context.clients.admin.from('worker_job_claims').select('*')
    if (input.workerClaimId) query = query.eq('id', input.workerClaimId)
    if (input.jobId) query = query.eq('job_id', input.jobId)
    const { data, error } = await query.maybeSingle()

    throwOnSupabaseError(error, 'WORKER_CLAIM_CONFLICT')
    if (!data) {
      const result = baseResult()
      addBlocker(result, 'WorkerClaimGate', 'WORKER_CLAIM_CONFLICT', 'Worker claim was not found.')
      return { blocker: finalize(result) }
    }

    const row = data as Row
    const projectId = input.projectId ?? stringValue(row.project_id)
    if (projectId) {
      const accessBlock = await ensureProjectAccess(projectId, input.workspaceId ?? stringValue(row.workspace_id))
      if (accessBlock) return { blocker: accessBlock }
    }

    return { row }
  }

  async function checkClaimReadiness(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
    assertSafeJson(input.metadata, 'metadata')
    const { row, blocker } = await resolveJob(input)
    if (blocker) return blocker

    const result = baseResult([
      'Worker claim readiness is a Prompt 8 boundary check only; it does not claim, heartbeat, or execute workers.',
    ])
    result.job = row ? jobSummary(row) : null
    addRequiredRecord(result, {
      table: 'jobs',
      id: input.jobId,
      status: input.jobId ? 'present' : 'missing',
      note: 'Worker claims must reference a canonical jobs row.',
    })
    addRequiredRecord(result, {
      table: 'worker_job_claims',
      status: 'backend_required',
      note: 'Duplicate active worker claims require transactional backend enforcement.',
    })
    addRequiredRecord(result, {
      table: 'api_idempotency_keys',
      id: input.idempotencyKey,
      status: input.idempotencyKey ? 'present' : 'missing',
      note: 'Worker claim mutations must include an Idempotency-Key header.',
    })
    addBlocker(result, 'WorkerClaimGate', 'BACKEND_REQUIRED', 'Worker claims and leases require future transactional backend runtime.')
    return finalize(result)
  }

  return {
    checkClaimReadiness,

    async claimJob(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const readiness = await checkClaimReadiness(input)
      return mutationBoundaryResult('worker_claim_create', input, readiness)
    },

    async getClaim(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      const { row, blocker } = await resolveClaim(input)
      if (blocker) return blocker
      const result = baseResult(['Worker claim read returns sanitized claim metadata only.'])
      result.workerClaim = row ? workerClaimSummary(row) : null
      return finalize(result)
    },

    async heartbeat(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_heartbeat', input, readiness)
    },

    async renewLease(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_lease_renew', input, readiness)
    },

    async releaseLease(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_lease_release', input, readiness)
    },

    async release(input: WorkerRuntimeInput & { claimStatus?: string }): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_lease_release', input, readiness)
    },

    async complete(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_complete', input, readiness)
    },

    async fail(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const { row, blocker } = await resolveClaim(input)
      const readiness = blocker ?? (() => {
        const result = baseResult()
        result.workerClaim = row ? workerClaimSummary(row) : null
        return finalize(result)
      })()
      return mutationBoundaryResult('worker_fail', input, readiness)
    },

    async recoverStale(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      const readiness = input.jobId ? await checkClaimReadiness(input) : backendRequiredResult('Stale worker claim recovery')
      return mutationBoundaryResult('worker_recover_stale', input, readiness)
    },

    async getRuntimeRegistry(): Promise<WorkerRuntimeResult> {
      const result = baseResult([
        'Runtime registry is static metadata only; it does not run worker readiness checks or execute tools.',
      ])
      result.runtimeRegistry = WORKER_TYPES.map((workerType) => ({
        workerType,
        status: 'future',
        executionEnabled: false,
        requiresApprovedSnapshot: true,
        requiresCreditReservation: true,
        requiresWorkerClaim: true,
      }))
      return finalize(result)
    },

    async recordToolRuntimeCheck(input: WorkerRuntimeInput): Promise<WorkerRuntimeResult> {
      assertIdempotency(input)
      return mutationBoundaryResult('tool_runtime_check_create', input, backendRequiredResult('Tool runtime check recording'))
    },
  }
}
