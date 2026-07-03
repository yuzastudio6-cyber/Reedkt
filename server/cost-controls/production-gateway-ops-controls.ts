import { randomUUID } from 'node:crypto'
import type { RuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'
import { killSwitchPolicy } from './kill-switch-policy'
import { rateLimitPolicy } from './rate-limit-policy'
import { workerConcurrencyPolicy } from './worker-concurrency-policy'

export type ProductionGatewayOpsControlGateName =
  | 'production_ops_kill_switch'
  | 'production_ops_rate_limit'
  | 'production_ops_concurrency'
  | 'production_ops_backend'

export interface ProductionGatewayOpsControlBlocker {
  code: string
  gateName: ProductionGatewayOpsControlGateName
  message: string
  details?: Record<string, unknown>
}

export interface ProductionGatewayOpsControlAdmissionInput {
  workspaceId: string
  projectId: string
  userId: string
  jobId: string
  workerType: ProductionWorkerRuntimeType
  renderMode?: 'preview' | 'final_export' | 'qa_probe'
  nowMs?: number
}

export interface ProductionGatewayOpsControlSnapshot {
  workspaceId: string
  projectId: string
  workerType: ProductionWorkerRuntimeType
  activeKillSwitches: ProductionGatewayActiveKillSwitches
  workspaceJobCreationCountLastHour: number
  workspaceJobCreationLimitPerHour: number
  projectActiveJobCount: number
  projectConcurrentJobLimit: number
  workerActiveJobCount: number
  workerConcurrentJobLimit: number
  persistentBackendChecked: boolean
  persistentAdmissionLeaseId?: string
}

export interface ProductionGatewayOpsControlAdmission {
  allowed: boolean
  blockers: ProductionGatewayOpsControlBlocker[]
  warnings: string[]
  snapshot: ProductionGatewayOpsControlSnapshot
  release: () => Promise<string[]>
}

export interface ProductionGatewayActiveKillSwitches {
  globalGeneration: boolean
  gpuWorker: boolean
  renderWorker: boolean
  provider: boolean
  finalExport: boolean
}

interface PersistentAdmissionLeaseClaim {
  leaseId?: string
  leaseToken?: string
  workspaceJobCreationCountLastHour: number
  projectActiveJobCount: number
  workerActiveJobCount: number
  blocker?: ProductionGatewayOpsControlBlocker
}

interface MockProductionGatewayOpsControlState {
  activeKillSwitches: Partial<ProductionGatewayActiveKillSwitches>
  workspaceJobCreationTimestamps: Map<string, number[]>
  projectActiveJobs: Map<string, number>
  workerActiveJobs: Map<ProductionWorkerRuntimeType, number>
}

const HOUR_MS = 60 * 60 * 1000

const mockState: MockProductionGatewayOpsControlState = {
  activeKillSwitches: {},
  workspaceJobCreationTimestamps: new Map(),
  projectActiveJobs: new Map(),
  workerActiveJobs: new Map(),
}

export function resetMockProductionGatewayOpsControlState(): void {
  mockState.activeKillSwitches = {}
  mockState.workspaceJobCreationTimestamps.clear()
  mockState.projectActiveJobs.clear()
  mockState.workerActiveJobs.clear()
}

export function setMockProductionGatewayOpsControlState(input: {
  activeKillSwitches?: Partial<ProductionGatewayActiveKillSwitches>
  workspaceJobCreationTimestamps?: Array<{ workspaceId: string; createdAtMs: number }>
  projectActiveJobs?: Array<{ projectId: string; count: number }>
  workerActiveJobs?: Array<{ workerType: ProductionWorkerRuntimeType; count: number }>
}): void {
  resetMockProductionGatewayOpsControlState()
  mockState.activeKillSwitches = { ...(input.activeKillSwitches ?? {}) }

  for (const item of input.workspaceJobCreationTimestamps ?? []) {
    const existing = mockState.workspaceJobCreationTimestamps.get(item.workspaceId) ?? []
    existing.push(item.createdAtMs)
    mockState.workspaceJobCreationTimestamps.set(item.workspaceId, existing)
  }

  for (const item of input.projectActiveJobs ?? []) {
    mockState.projectActiveJobs.set(item.projectId, item.count)
  }

  for (const item of input.workerActiveJobs ?? []) {
    mockState.workerActiveJobs.set(item.workerType, item.count)
  }
}

export async function admitProductionGatewayOpsControls(
  context: ServiceContext,
  input: ProductionGatewayOpsControlAdmissionInput,
): Promise<ProductionGatewayOpsControlAdmission> {
  if (!context.clients.admin || context.env.mockOnly) {
    return admitMockProductionGatewayOpsControls(context.env, input)
  }

  return admitPersistentProductionGatewayOpsControls(context, input)
}

function admitMockProductionGatewayOpsControls(
  env: RuntimeEnv,
  input: ProductionGatewayOpsControlAdmissionInput,
): ProductionGatewayOpsControlAdmission {
  const nowMs = input.nowMs ?? Date.now()
  const activeKillSwitches = {
    ...runtimeKillSwitchState(env),
    ...mockState.activeKillSwitches,
  }
  const timestamps = pruneTimestamps(
    mockState.workspaceJobCreationTimestamps.get(input.workspaceId) ?? [],
    nowMs,
  )
  const projectActiveJobCount = mockState.projectActiveJobs.get(input.projectId) ?? 0
  const workerActiveJobCount = mockState.workerActiveJobs.get(input.workerType) ?? 0
  const snapshot = buildSnapshot({
    input,
    activeKillSwitches,
    workspaceJobCreationCountLastHour: timestamps.length,
    projectActiveJobCount,
    workerActiveJobCount,
    persistentBackendChecked: false,
  })
  const blockers = buildPolicyBlockers(input, snapshot)

  if (blockers.length > 0) {
    mockState.workspaceJobCreationTimestamps.set(input.workspaceId, timestamps)
    return blockedAdmission(snapshot, blockers, [
      'Production gateway ops controls blocked before worker dispatch; no billing audit or tool work was started.',
    ])
  }

  timestamps.push(nowMs)
  mockState.workspaceJobCreationTimestamps.set(input.workspaceId, timestamps)
  mockState.projectActiveJobs.set(input.projectId, projectActiveJobCount + 1)
  mockState.workerActiveJobs.set(input.workerType, workerActiveJobCount + 1)

  let released = false
  return {
    allowed: true,
    blockers: [],
    warnings: [
      'Production gateway ops controls admitted this mock/local job with in-memory rate and concurrency counters.',
    ],
    snapshot,
    release: async () => {
      if (released) return []
      released = true
      decrement(mockState.projectActiveJobs, input.projectId)
      decrement(mockState.workerActiveJobs, input.workerType)
      return []
    },
  }
}

async function admitPersistentProductionGatewayOpsControls(
  context: ServiceContext,
  input: ProductionGatewayOpsControlAdmissionInput,
): Promise<ProductionGatewayOpsControlAdmission> {
  const nowMs = input.nowMs ?? Date.now()
  const activeKillSwitches = runtimeKillSwitchState(context.env)
  const baseSnapshot = buildSnapshot({
    input,
    activeKillSwitches,
    workspaceJobCreationCountLastHour: 0,
    projectActiveJobCount: 0,
    workerActiveJobCount: 0,
    persistentBackendChecked: true,
  })
  const killSwitchBlockers = buildKillSwitchBlockers(input, baseSnapshot)
  if (killSwitchBlockers.length > 0) {
    return blockedAdmission(baseSnapshot, killSwitchBlockers, [
      'Production gateway ops controls blocked because a backend kill switch is active.',
    ])
  }

  const admin = context.clients.admin
  if (!admin) {
    return blockedAdmission(baseSnapshot, [{
      code: 'PRODUCTION_OPS_CONTROLS_BACKEND_REQUIRED',
      gateName: 'production_ops_backend',
      message: 'Persistent production operations controls require a Supabase service-role backend.',
    }])
  }

  const persistentIdBlockers = buildPersistentIdBlockers(input)
  if (persistentIdBlockers.length > 0) {
    return blockedAdmission(baseSnapshot, persistentIdBlockers)
  }

  const lease = await createPersistentAdmissionLease(context, input, nowMs)

  const snapshot = buildSnapshot({
    input,
    activeKillSwitches,
    workspaceJobCreationCountLastHour: lease.workspaceJobCreationCountLastHour,
    projectActiveJobCount: lease.projectActiveJobCount,
    workerActiveJobCount: lease.workerActiveJobCount,
    persistentBackendChecked: true,
  })

  if (lease.blocker) {
    return blockedAdmission(snapshot, [lease.blocker], [
      'Production gateway ops controls blocked before worker dispatch because atomic durable admission failed.',
    ])
  }

  const blockers = buildPolicyBlockers(input, snapshot)
  if (blockers.length > 0) {
    return blockedAdmission(snapshot, blockers)
  }

  const admittedSnapshot: ProductionGatewayOpsControlSnapshot = {
    ...snapshot,
    persistentAdmissionLeaseId: lease.leaseId,
  }

  return {
    allowed: true,
    blockers: [],
    warnings: [
      'Production gateway ops controls passed against persistent idempotency readback and atomic durable worker-lease admission.',
    ],
    snapshot: admittedSnapshot,
    release: () => releasePersistentAdmissionLease(context, {
      leaseId: lease.leaseId,
      leaseToken: lease.leaseToken,
    }),
  }
}

async function createPersistentAdmissionLease(
  context: ServiceContext,
  input: ProductionGatewayOpsControlAdmissionInput,
  nowMs: number,
): Promise<PersistentAdmissionLeaseClaim> {
  const emptyClaim = {
    workspaceJobCreationCountLastHour: 0,
    projectActiveJobCount: 0,
    workerActiveJobCount: 0,
  }
  const admin = context.clients.admin
  if (!admin) {
    return {
      ...emptyClaim,
      blocker: {
        code: 'PRODUCTION_OPS_CONTROLS_BACKEND_REQUIRED',
        gateName: 'production_ops_backend',
        message: 'Persistent production operations controls require a Supabase service-role backend.',
      },
    }
  }

  const leaseToken = `production-gateway-${randomUUID()}`
  const workerId = `production-gateway:${input.userId}`
  const nowIso = new Date(nowMs).toISOString()
  const expiresAt = new Date(nowMs + 5 * 60 * 1000).toISOString()
  const result = await admin.rpc('claim_production_gateway_worker_lease', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_job_id: input.jobId,
    p_worker_id: workerId,
    p_worker_kind: input.workerType,
    p_lease_token: leaseToken,
    p_expires_at: expiresAt,
    p_workspace_job_creation_limit: rateLimitPolicy.perWorkspaceJobCreationPerHour,
    p_project_concurrent_limit: rateLimitPolicy.perProjectConcurrentJobs,
    p_worker_concurrent_limit: workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[input.workerType] ?? 0,
    p_request_path_pattern: '%/v1/tool-executions/dispatch%',
    p_now: nowIso,
    p_render_mode: input.renderMode ?? null,
  })

  if (result.error) {
    return {
      ...emptyClaim,
      blocker: blockerForAdmissionRpcError(result.error),
    }
  }

  const data = normalizeAdmissionRpcData(result.data)
  if (!data.leaseId) {
    return {
      ...data,
      blocker: {
        code: 'PRODUCTION_OPS_ADMISSION_RPC_INVALID_RESULT',
        gateName: 'production_ops_backend',
        message: 'Production gateway ops admission RPC did not return a lease id.',
      },
    }
  }

  return {
    ...data,
    leaseToken,
  }
}

function blockerForAdmissionRpcError(
  error: { code?: string; message?: string; hint?: string },
): ProductionGatewayOpsControlBlocker {
  const message = error.message ?? 'production gateway ops admission RPC failed'
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('workspace rate limit exceeded')) {
    return {
      code: 'PRODUCTION_WORKSPACE_RATE_LIMIT_EXCEEDED',
      gateName: 'production_ops_rate_limit',
      message: 'Workspace production tool execution rate limit has been reached.',
      details: { reason: message, code: error.code },
    }
  }
  if (lowerMessage.includes('project concurrency limit exceeded')) {
    return {
      code: 'PRODUCTION_PROJECT_CONCURRENCY_LIMIT_EXCEEDED',
      gateName: 'production_ops_concurrency',
      message: 'Project production tool execution concurrency limit has been reached.',
      details: { reason: message, code: error.code },
    }
  }
  if (lowerMessage.includes('worker concurrency limit exceeded')) {
    return {
      code: 'PRODUCTION_WORKER_CONCURRENCY_LIMIT_EXCEEDED',
      gateName: 'production_ops_concurrency',
      message: 'Worker production tool execution concurrency limit has been reached.',
      details: { reason: message, code: error.code },
    }
  }
  if (lowerMessage.includes('lease claim conflict') || error.code === '23505') {
    return {
      code: 'PRODUCTION_WORKER_LEASE_CLAIM_CONFLICT',
      gateName: 'production_ops_backend',
      message: 'A durable production worker lease already exists for this job.',
      details: { reason: message, code: error.code },
    }
  }
  if (
    error.code === '42883' ||
    /claim_production_gateway_worker_lease|function .* does not exist/i.test(message)
  ) {
    return {
      code: 'PRODUCTION_OPS_ADMISSION_RPC_UNAVAILABLE',
      gateName: 'production_ops_backend',
      message: 'Production-ready gateway dispatch requires the service-role-only claim_production_gateway_worker_lease RPC before worker dispatch.',
      details: { reason: message, code: error.code, hint: error.hint },
    }
  }
  if (
    error.code === '42P01' ||
    /api_idempotency_keys|worker_leases|does not exist|schema cache/i.test(message)
  ) {
    return {
      code: 'PRODUCTION_OPS_CONTROLS_BACKEND_UNAVAILABLE',
      gateName: 'production_ops_backend',
      message: 'Production-ready gateway dispatch requires deployed persistent ops-control tables before worker dispatch.',
      details: { reason: message, code: error.code, hint: error.hint },
    }
  }
  return {
    code: 'PRODUCTION_OPS_ADMISSION_RPC_FAILED',
    gateName: 'production_ops_backend',
    message: 'Production-ready gateway dispatch could not complete atomic ops admission.',
    details: { reason: message, code: error.code, hint: error.hint },
  }
}

function normalizeAdmissionRpcData(data: unknown): Omit<PersistentAdmissionLeaseClaim, 'leaseToken' | 'blocker'> {
  const record = data && typeof data === 'object'
    ? data as Record<string, unknown>
    : {}
  return {
    leaseId: typeof record.leaseId === 'string'
      ? record.leaseId
      : typeof record.leaseid === 'string'
        ? record.leaseid
        : undefined,
    workspaceJobCreationCountLastHour: numberField(record, 'workspaceJobCreationCountLastHour', 'workspacejobcreationcountlasthour'),
    projectActiveJobCount: numberField(record, 'projectActiveJobCount', 'projectactivejobcount'),
    workerActiveJobCount: numberField(record, 'workerActiveJobCount', 'workeractivejobcount'),
  }
}

function numberField(record: Record<string, unknown>, camelKey: string, lowerKey: string): number {
  const value = record[camelKey] ?? record[lowerKey]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return 0
}

async function releasePersistentAdmissionLease(
  context: ServiceContext,
  input: { leaseId?: string; leaseToken?: string },
): Promise<string[]> {
  if (!input.leaseId || !input.leaseToken) {
    return ['Production gateway durable admission lease release skipped because lease metadata was missing.']
  }
  const admin = context.clients.admin
  if (!admin) {
    return ['Production gateway durable admission lease release skipped because the Supabase admin client was unavailable.']
  }

  const releasedAt = new Date().toISOString()
  const result = await admin
    .from('worker_leases')
    .update({
      status: 'released',
      released_at: releasedAt,
      completed_at: releasedAt,
    })
    .eq('id', input.leaseId)
    .eq('lease_token', input.leaseToken)
    .in('status', ['claimed', 'active', 'renewed'])
    .select('id')
    .single()

  if (result.error || !result.data?.id) {
    return [`Production gateway durable admission lease release failed: ${result.error?.message ?? 'worker lease row was not returned.'}`]
  }

  return ['Production gateway durable admission lease was released after dispatch.']
}

function buildPersistentIdBlockers(
  input: ProductionGatewayOpsControlAdmissionInput,
): ProductionGatewayOpsControlBlocker[] {
  const blockers: ProductionGatewayOpsControlBlocker[] = []
  if (!isUuid(input.workspaceId)) {
    blockers.push({
      code: 'PRODUCTION_WORKSPACE_UUID_REQUIRED',
      gateName: 'production_ops_backend',
      message: 'Persistent production ops admission requires a UUID workspaceId for worker_leases.',
    })
  }
  if (!isUuid(input.projectId)) {
    blockers.push({
      code: 'PRODUCTION_PROJECT_UUID_REQUIRED',
      gateName: 'production_ops_backend',
      message: 'Persistent production ops admission requires a UUID projectId for worker_leases.',
    })
  }
  if (!isUuid(input.jobId)) {
    blockers.push({
      code: 'PRODUCTION_JOB_UUID_REQUIRED',
      gateName: 'production_ops_backend',
      message: 'Persistent production ops admission requires a UUID jobId for worker_leases.',
    })
  }
  return blockers
}

function runtimeKillSwitchState(env: RuntimeEnv): ProductionGatewayActiveKillSwitches {
  const fallbackActive = !env.mockOnly
  return {
    globalGeneration: booleanOrDefault(env.productionGlobalGenerationKillSwitchActive, fallbackActive),
    gpuWorker: booleanOrDefault(env.productionGpuWorkerKillSwitchActive, fallbackActive),
    renderWorker: booleanOrDefault(env.productionRenderWorkerKillSwitchActive, fallbackActive),
    provider: booleanOrDefault(env.productionProviderKillSwitchActive, fallbackActive),
    finalExport: booleanOrDefault(env.productionFinalExportKillSwitchActive, fallbackActive),
  }
}

function buildSnapshot(input: {
  input: ProductionGatewayOpsControlAdmissionInput
  activeKillSwitches: ProductionGatewayActiveKillSwitches
  workspaceJobCreationCountLastHour: number
  projectActiveJobCount: number
  workerActiveJobCount: number
  persistentBackendChecked: boolean
}): ProductionGatewayOpsControlSnapshot {
  return {
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    workerType: input.input.workerType,
    activeKillSwitches: input.activeKillSwitches,
    workspaceJobCreationCountLastHour: input.workspaceJobCreationCountLastHour,
    workspaceJobCreationLimitPerHour: rateLimitPolicy.perWorkspaceJobCreationPerHour,
    projectActiveJobCount: input.projectActiveJobCount,
    projectConcurrentJobLimit: rateLimitPolicy.perProjectConcurrentJobs,
    workerActiveJobCount: input.workerActiveJobCount,
    workerConcurrentJobLimit: workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[input.input.workerType] ?? 0,
    persistentBackendChecked: input.persistentBackendChecked,
  }
}

function buildPolicyBlockers(
  input: ProductionGatewayOpsControlAdmissionInput,
  snapshot: ProductionGatewayOpsControlSnapshot,
): ProductionGatewayOpsControlBlocker[] {
  return [
    ...buildKillSwitchBlockers(input, snapshot),
    ...buildRateLimitBlockers(snapshot),
    ...buildConcurrencyBlockers(snapshot),
  ]
}

function buildKillSwitchBlockers(
  input: ProductionGatewayOpsControlAdmissionInput,
  snapshot: ProductionGatewayOpsControlSnapshot,
): ProductionGatewayOpsControlBlocker[] {
  const blockers: ProductionGatewayOpsControlBlocker[] = []

  if (!killSwitchPolicy.globalGenerationKillSwitch) {
    blockers.push({
      code: 'PRODUCTION_GLOBAL_KILL_SWITCH_POLICY_MISSING',
      gateName: 'production_ops_kill_switch',
      message: 'Global generation kill-switch policy is missing.',
    })
  } else if (snapshot.activeKillSwitches.globalGeneration) {
    blockers.push({
      code: 'PRODUCTION_GLOBAL_KILL_SWITCH_ACTIVE',
      gateName: 'production_ops_kill_switch',
      message: 'Global generation kill switch is active.',
    })
  }

  if (input.workerType === 'gpu_ai_worker' && snapshot.activeKillSwitches.gpuWorker) {
    blockers.push({
      code: 'PRODUCTION_GPU_WORKER_KILL_SWITCH_ACTIVE',
      gateName: 'production_ops_kill_switch',
      message: 'GPU worker kill switch is active.',
    })
  }

  if (input.workerType === 'render_worker' && snapshot.activeKillSwitches.renderWorker) {
    blockers.push({
      code: 'PRODUCTION_RENDER_WORKER_KILL_SWITCH_ACTIVE',
      gateName: 'production_ops_kill_switch',
      message: 'Render worker kill switch is active.',
    })
  }

  if (input.workerType === 'render_worker' && input.renderMode === 'final_export' && snapshot.activeKillSwitches.finalExport) {
    blockers.push({
      code: 'PRODUCTION_FINAL_EXPORT_KILL_SWITCH_ACTIVE',
      gateName: 'production_ops_kill_switch',
      message: 'Final export kill switch is active.',
    })
  }

  return blockers
}

function buildRateLimitBlockers(snapshot: ProductionGatewayOpsControlSnapshot): ProductionGatewayOpsControlBlocker[] {
  if (snapshot.workspaceJobCreationLimitPerHour <= 0) {
    return [{
      code: 'PRODUCTION_WORKSPACE_RATE_LIMIT_POLICY_MISSING',
      gateName: 'production_ops_rate_limit',
      message: 'Workspace job creation rate-limit policy is missing.',
    }]
  }

  if (snapshot.workspaceJobCreationCountLastHour < snapshot.workspaceJobCreationLimitPerHour) return []

  return [{
    code: 'PRODUCTION_WORKSPACE_RATE_LIMIT_EXCEEDED',
    gateName: 'production_ops_rate_limit',
    message: 'Workspace production tool execution rate limit has been reached.',
    details: {
      countLastHour: snapshot.workspaceJobCreationCountLastHour,
      limitPerHour: snapshot.workspaceJobCreationLimitPerHour,
    },
  }]
}

function buildConcurrencyBlockers(snapshot: ProductionGatewayOpsControlSnapshot): ProductionGatewayOpsControlBlocker[] {
  const blockers: ProductionGatewayOpsControlBlocker[] = []

  if (snapshot.projectConcurrentJobLimit <= 0) {
    blockers.push({
      code: 'PRODUCTION_PROJECT_CONCURRENCY_POLICY_MISSING',
      gateName: 'production_ops_concurrency',
      message: 'Project concurrent job policy is missing.',
    })
  } else if (snapshot.projectActiveJobCount >= snapshot.projectConcurrentJobLimit) {
    blockers.push({
      code: 'PRODUCTION_PROJECT_CONCURRENCY_LIMIT_EXCEEDED',
      gateName: 'production_ops_concurrency',
      message: 'Project production tool execution concurrency limit has been reached.',
      details: {
        activeJobs: snapshot.projectActiveJobCount,
        limit: snapshot.projectConcurrentJobLimit,
      },
    })
  }

  if (snapshot.workerConcurrentJobLimit <= 0) {
    blockers.push({
      code: 'PRODUCTION_WORKER_CONCURRENCY_POLICY_MISSING',
      gateName: 'production_ops_concurrency',
      message: `Worker concurrency policy is missing for ${snapshot.workerType}.`,
    })
  } else if (snapshot.workerActiveJobCount >= snapshot.workerConcurrentJobLimit) {
    blockers.push({
      code: 'PRODUCTION_WORKER_CONCURRENCY_LIMIT_EXCEEDED',
      gateName: 'production_ops_concurrency',
      message: `${snapshot.workerType} production tool execution concurrency limit has been reached.`,
      details: {
        activeJobs: snapshot.workerActiveJobCount,
        limit: snapshot.workerConcurrentJobLimit,
      },
    })
  }

  return blockers
}

function blockedAdmission(
  snapshot: ProductionGatewayOpsControlSnapshot,
  blockers: ProductionGatewayOpsControlBlocker[],
  warnings: string[] = [],
): ProductionGatewayOpsControlAdmission {
  return {
    allowed: false,
    blockers,
    warnings,
    snapshot,
    release: async () => [],
  }
}

function pruneTimestamps(timestamps: number[], nowMs: number): number[] {
  return timestamps.filter((timestamp) => nowMs - timestamp < HOUR_MS)
}

function decrement<T>(map: Map<T, number>, key: T): void {
  const next = Math.max(0, (map.get(key) ?? 0) - 1)
  if (next === 0) {
    map.delete(key)
  } else {
    map.set(key, next)
  }
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
