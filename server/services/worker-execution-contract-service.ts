import type { ApiErrorCode } from '../errors/error-codes'
import { getToolReadiness, listToolReadiness } from '../foundation/tool-readiness'
import type { ServiceContext } from '../types'
import type {
  WorkerCancelBoundaryInput,
  WorkerExecutionEnvelopeInput,
  WorkerRuntimeCapabilitiesQuery,
  WorkerRuntimeToolRequirementsInput,
  WorkerStaleRecoveryPreviewInput,
} from '../validation/worker-execution-schemas'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, sanitizeJson } from './service-helpers'

type WorkerExecutionContractStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'

interface WorkerContractBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'blocked' | 'not_applicable'
  note: string
}

export interface WorkerExecutionContractResult {
  status: WorkerExecutionContractStatus
  canProceed: boolean
  canClaim: boolean
  canExecute: boolean
  canComplete: boolean
  canFail: boolean
  canCancel: boolean
  blockers: WorkerContractBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  executionEnvelope?: Record<string, unknown>
  preflightSummary?: Record<string, unknown>
  runtimeCapabilities?: Record<string, unknown>[]
  toolReadinessSummary?: Record<string, unknown>
  intendedPayload?: Record<string, unknown>
  auditEvent?: Record<string, unknown>
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
  'custom_worker',
]

const FORBIDDEN_OPERATIONS = [
  'real worker execution',
  'production job claim',
  'Cloud Run dispatch',
  'Pub/Sub dispatch',
  'Cloud Tasks dispatch',
  'provider calls',
  'render or export execution',
  'tool execution',
  'media processing',
  'browser capture',
  'credit mutation',
  'storage transfer',
]

function baseResult(warnings: string[] = []): WorkerExecutionContractResult {
  return {
    status: 'backend_required',
    canProceed: false,
    canClaim: false,
    canExecute: false,
    canComplete: false,
    canFail: false,
    canCancel: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'Use a future reviewed transactional worker runtime before enabling worker execution.',
  }
}

function addBlocker(result: WorkerExecutionContractResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
}

function addRequiredRecord(result: WorkerExecutionContractResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: WorkerExecutionContractResult): WorkerExecutionContractResult {
  if (result.blockers.length === 0) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Worker contract metadata is readable. Execution still requires a future runtime milestone.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.canClaim = false
  result.canExecute = false
  result.canComplete = false
  result.canFail = false
  result.canCancel = false
  result.nextAction = 'Resolve listed gates and add a reviewed transactional worker runtime before enabling execution.'
  return result
}

function requiredRecord(table: string, id: string | undefined, note: string): RequiredRecord {
  return {
    table,
    id,
    status: id ? 'present' : 'missing',
    note,
  }
}

function summarizeToolReadiness(requiredToolIds: string[], runtimeToolIds: string[]) {
  const uniqueToolIds = Array.from(new Set([...requiredToolIds, ...runtimeToolIds]))
  const tools = uniqueToolIds.map((toolId) => getToolReadiness(toolId).tool)
  const blockedTools = tools.filter((tool) => !tool.allowedInRuntime)

  return {
    requiredToolIds,
    runtimeToolIds,
    tools: tools.map((tool) => sanitizeJson({
      toolId: tool.toolId,
      readinessState: tool.readinessState,
      allowedInRuntime: tool.allowedInRuntime,
      blockedReason: tool.blockedReason,
      requiredWorkerType: 'requiredWorkerType' in tool ? tool.requiredWorkerType : null,
      requiresWorker: 'requiresWorker' in tool ? tool.requiresWorker : true,
      requiresStorageRead: 'requiresStorageRead' in tool ? tool.requiresStorageRead : true,
      requiresStorageWrite: 'requiresStorageWrite' in tool ? tool.requiresStorageWrite : true,
    })),
    blockedToolIds: blockedTools.map((tool) => tool.toolId),
    allRuntimeToolsDisabled: blockedTools.length === tools.length,
  }
}

function buildEnvelope(input: WorkerExecutionEnvelopeInput, requestId: string, requestedBy: string): Record<string, unknown> {
  return sanitizeJson({
    envelopeSchemaVersion: 'prompt-14.worker-execution-envelope.v1',
    identity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: input.jobId,
      jobBatchId: input.jobBatchId,
      approvedSnapshotId: input.approvedSnapshotId,
      workerType: input.workerType,
      jobType: input.jobType,
      executionMode: input.executionMode,
      requestedBy: input.requestedBy ?? requestedBy,
      workerClaimId: input.workerClaimId,
      workerLeaseId: input.workerLeaseId,
    },
    gateReferences: {
      approvedSnapshotStatus: input.approvedSnapshotId ? 'referenced_unverified' : 'missing',
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      creditGateStatus: input.creditReservationId ? 'referenced_unverified' : 'missing',
      mediaReadinessStatus: input.mediaAssetIds.length > 0 ? 'referenced_unverified' : 'not_provided',
      storageReadinessStatus: input.storageObjectRecordIds.length > 0 ? 'referenced_unverified' : 'not_provided',
      timingReadinessStatus: 'backend_required',
      qaBlockerStatus: input.qaReportId ? 'referenced_unverified' : 'backend_required',
      toolReadinessStatus: 'static_readiness_only',
      workerRuntimeReadinessStatus: 'backend_required',
    },
    idempotencyAndClaim: {
      idempotencyKeyPresent: true,
      workerClaimId: input.workerClaimId,
      workerLeaseId: input.workerLeaseId,
      claimTokenReference: 'opaque_reference_only',
      attemptNumber: input.attemptNumber,
      maxAttempts: input.maxAttempts,
      retryBudget: input.retryBudget,
      leaseExpiresAt: input.leaseExpiresAt,
      heartbeatDueAt: input.heartbeatDueAt,
    },
    inputs: {
      sourceRecordIds: input.sourceRecordIds,
      storageObjectRecordIds: input.storageObjectRecordIds,
      mediaAssetIds: input.mediaAssetIds,
      toolCallIntentIds: input.toolCallIntentIds,
      noSignedUrlsAsSourceOfTruth: true,
      noRawSecrets: true,
      noProviderKeys: true,
      noServiceRoleKeys: true,
      noRawChatAsSoleInstruction: true,
    },
    executionContract: {
      allowedOperation: input.allowedOperation,
      forbiddenOperations: FORBIDDEN_OPERATIONS,
      canExecute: false,
      backendRequiredReasons: [
        'Transactional worker claim runtime is not enabled.',
        'Tool runtime execution is disabled by Prompt 13 readiness policy.',
        'Prompt 14 is contract hardening only.',
      ],
      runtimeRequiredTools: input.requiredToolIds,
      runtimeBlockedTools: input.blockedToolIds,
      expectedOutputs: ['sanitized job events', 'storage object record references', 'QA-safe summaries'],
      outputWritePolicy: 'future_backend_only',
      auditEventPolicy: 'append_only_sanitized_future',
    },
    completionFailure: {
      completionStatus: input.completionStatus,
      completionSummary: input.completionSummary,
      failureCategory: input.failureCategory,
      failureMessageSafe: input.safeFailureMessage,
      retryable: input.retryable,
      refundOrReleaseNeeded: 'future_credit_runtime_decision',
      downstreamBlocked: true,
      userVisibleMessage: 'Worker execution is not enabled yet.',
    },
    integrity: {
      envelopeHash: 'future_deterministic_hash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestId,
      auditEvent: `workers.executionEnvelope.${input.executionMode}`,
    },
  })
}

function addStandardGateRecords(result: WorkerExecutionContractResult, input: WorkerExecutionEnvelopeInput): void {
  addRequiredRecord(result, requiredRecord('projects', input.projectId, 'Worker envelopes must be project-scoped.'))
  addRequiredRecord(result, requiredRecord('approved_plan_snapshots', input.approvedSnapshotId, 'Workers must execute approved snapshots, not raw chat.'))
  addRequiredRecord(result, requiredRecord('credit_estimates', input.creditEstimateId, 'Credit estimate approval must be linked before paid work.'))
  addRequiredRecord(result, requiredRecord('credit_reservations', input.creditReservationId, 'Credit reservation must be active when credits apply.'))
  addRequiredRecord(result, requiredRecord('jobs', input.jobId, 'Worker envelopes should reference the canonical jobs row.'))
  addRequiredRecord(result, requiredRecord('worker_job_claims', input.workerClaimId, 'Claim state remains backend-only.'))
  addRequiredRecord(result, requiredRecord('worker_leases', input.workerLeaseId, 'Lease state remains backend-only.'))
  addRequiredRecord(result, {
    table: 'tool_runtime_checks',
    status: 'backend_required',
    note: 'Tool readiness is static/read-only in Prompt 14; runtime checks are not executed.',
  })
}

function addExecutionBlockers(result: WorkerExecutionContractResult, input: WorkerExecutionEnvelopeInput, toolSummary: Record<string, unknown>): void {
  const blockedToolIds = toolSummary.blockedToolIds
  if (!input.approvedSnapshotId) addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Worker execution requires an approved snapshot reference.')
  if (!input.creditReservationId) addBlocker(result, 'CreditReservationGate', 'CREDITS_NOT_RESERVED', 'Worker execution requires an active credit reservation when credits apply.')
  if (!input.jobId) addBlocker(result, 'WorkerClaimGate', 'JOB_NOT_FOUND', 'Worker execution requires a canonical job reference.')
  if (Array.isArray(blockedToolIds) && blockedToolIds.length > 0) {
    addBlocker(result, 'ToolRuntimeDisabledGate', 'TOOL_NOT_READY', 'Required tools are not allowed in runtime by Prompt 13 readiness policy.')
  }
  addBlocker(result, 'WorkerRuntimeGate', 'BACKEND_REQUIRED', 'Transactional worker claim/lease runtime is not enabled in Prompt 14.')
  addBlocker(result, 'ProviderExecutionBlockedGate', 'PROVIDER_ROUTE_BLOCKED', 'Provider calls remain blocked from worker contracts.')
  addBlocker(result, 'RenderExecutionBlockedGate', 'RENDER_NOT_READY', 'Render/export execution remains blocked from worker contracts.')
  addBlocker(result, 'ProductionUnlockGate', 'BACKEND_REQUIRED', 'Production, beta, and broad-media worker execution remain locked.')
}

export function createWorkerExecutionContractService(context: ServiceContext) {
  async function checkProjectAccess(input: WorkerExecutionEnvelopeInput, result: WorkerExecutionContractResult): Promise<void> {
    getRequiredAuthUserId(context)

    const access = await createProjectService(context).checkProjectAccess(input.projectId)
    if (access.status === 'backend_required') {
      addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access verification requires backend service-role runtime.')
      result.warnings.push(...access.warnings)
      return
    }

    if (!access.hasAccess) {
      addBlocker(result, 'ProjectAccessGate', 'WORKSPACE_ACCESS_DENIED', 'Workspace membership is required for worker execution contracts.')
    }
  }

  async function buildContract(input: WorkerExecutionEnvelopeInput, mode: string, idempotencyKey?: string): Promise<WorkerExecutionContractResult> {
    const requestedBy = getRequiredAuthUserId(context)
    const result = baseResult([
      'Prompt 14 builds worker contract metadata only.',
      'No worker claim, heartbeat, completion, failure, tool execution, provider call, render, media processing, credit mutation, or storage transfer occurred.',
    ])
    const toolSummary = summarizeToolReadiness(input.requiredToolIds, input.runtimeToolIds)

    await checkProjectAccess(input, result)
    addStandardGateRecords(result, input)
    addExecutionBlockers(result, input, toolSummary)

    result.executionEnvelope = buildEnvelope(input, context.requestId, requestedBy)
    result.toolReadinessSummary = sanitizeJson(toolSummary)
    result.preflightSummary = sanitizeJson({
      mode,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: input.jobId,
      workerType: input.workerType,
      jobType: input.jobType,
      idempotencyKeyPresent: Boolean(idempotencyKey),
      canExecute: false,
      failClosed: true,
    })
    result.auditEvent = sanitizeJson({
      eventName: `workers.${mode}.backend_required`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: input.jobId,
      workerType: input.workerType,
    })

    return finalize(result)
  }

  return {
    checkExecutionEnvelopeReadiness(input: WorkerExecutionEnvelopeInput, idempotencyKey?: string) {
      return buildContract(input, 'executionEnvelope.readiness', idempotencyKey)
    },

    previewExecutionEnvelope(input: WorkerExecutionEnvelopeInput, idempotencyKey: string) {
      return buildContract(input, 'executionEnvelope.preview', idempotencyKey)
    },

    preflightClaim(input: WorkerExecutionEnvelopeInput, idempotencyKey: string) {
      return buildContract(input, 'claim.preflight', idempotencyKey)
    },

    executionBlocked(input: WorkerExecutionEnvelopeInput, idempotencyKey: string) {
      return buildContract(input, 'execution.blocked', idempotencyKey)
    },

    async cancelBoundary(input: WorkerCancelBoundaryInput, idempotencyKey: string): Promise<WorkerExecutionContractResult> {
      const envelopeInput: WorkerExecutionEnvelopeInput = {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        jobId: input.jobId,
        workerClaimId: input.workerClaimId,
        workerLeaseId: input.workerLeaseId,
        workerType: 'custom_worker',
        jobType: 'worker_cancel_boundary',
        executionMode: 'blocked',
        sourceRecordIds: [],
        storageObjectRecordIds: [],
        mediaAssetIds: [],
        toolCallIntentIds: [],
        runtimeToolIds: [],
        requiredToolIds: [],
        blockedToolIds: [],
        attemptNumber: 1,
        maxAttempts: 1,
        retryBudget: 0,
        allowedOperation: 'cancel_boundary',
        completionStatus: 'cancelled',
        failureCategory: 'cancelled',
        retryable: false,
        cancelReason: input.cancelReason,
        metadata: input.metadata,
      }
      const result = await buildContract(envelopeInput, 'cancel.boundary', idempotencyKey)
      result.intendedPayload = sanitizeJson({
        action: 'worker_cancel_boundary',
        cancelReason: input.cancelReason,
        idempotencyKeyPresent: true,
      })
      return result
    },

    async staleRecoveryPreview(input: WorkerStaleRecoveryPreviewInput, idempotencyKey: string): Promise<WorkerExecutionContractResult> {
      const result = baseResult([
        'Stale recovery preview is read-only contract metadata.',
        'No worker claim, lease, job, or retry state was changed.',
      ])
      addRequiredRecord(result, requiredRecord('worker_job_claims', undefined, 'Future stale recovery must query active/stale claims transactionally.'))
      addRequiredRecord(result, requiredRecord('worker_leases', undefined, 'Future stale recovery must verify lease expiry transactionally.'))
      addBlocker(result, 'StaleClaimRecoveryGate', 'BACKEND_REQUIRED', 'Stale claim recovery requires a future transactional backend runtime.')
      result.preflightSummary = sanitizeJson({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        jobId: input.jobId,
        workerType: input.workerType,
        maxStaleAgeSeconds: input.maxStaleAgeSeconds,
        idempotencyKeyPresent: Boolean(idempotencyKey),
        canRecover: false,
      })
      return finalize(result)
    },

    getRuntimeCapabilities(query: WorkerRuntimeCapabilitiesQuery): WorkerExecutionContractResult {
      getRequiredAuthUserId(context)
      const result = baseResult(['Worker runtime capabilities are static metadata only.'])
      result.runtimeCapabilities = WORKER_TYPES
        .filter((workerType) => !query.workerType || query.workerType === workerType)
        .map((workerType) => ({
          workerType,
          executionEnabled: false,
          claimRuntimeEnabled: false,
          requiresApprovedSnapshot: true,
          requiresCreditReservation: true,
          requiresToolReadiness: true,
          status: 'backend_required',
        }))
      addBlocker(result, 'WorkerRuntimeGate', 'BACKEND_REQUIRED', 'No real worker runtime capability is enabled in Prompt 14.')
      return finalize(result)
    },

    getRuntimeToolRequirements(input: WorkerRuntimeToolRequirementsInput, idempotencyKey: string): WorkerExecutionContractResult {
      getRequiredAuthUserId(context)
      const result = baseResult(['Tool requirements are read from the Prompt 13 static registry only.'])
      result.toolReadinessSummary = sanitizeJson({
        workerType: input.workerType,
        idempotencyKeyPresent: Boolean(idempotencyKey),
        policy: listToolReadiness().policy,
        ...summarizeToolReadiness(input.requiredToolIds, input.runtimeToolIds),
      })
      addBlocker(result, 'ToolRuntimeDisabledGate', 'TOOL_NOT_READY', 'Tool runtime execution remains disabled by Prompt 13 policy.')
      addBlocker(result, 'WorkerRuntimeGate', 'BACKEND_REQUIRED', 'Worker runtime capability checks are metadata-only in Prompt 14.')
      return finalize(result)
    },
  }
}
