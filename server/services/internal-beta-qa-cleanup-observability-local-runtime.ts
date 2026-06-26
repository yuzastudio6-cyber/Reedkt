import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaQaCleanupObservabilityLocalRuntimeStatus =
  | 'local_qa_cleanup_observability_validated_no_remote_execution'
  | 'blocked_invalid_qa_cleanup_observability_input'

export type InternalBetaQaCleanupCheckCategory =
  | 'approved_snapshot'
  | 'credit_reservation'
  | 'job_queue'
  | 'artifact_manifest'
  | 'private_preview_export'
  | 'safety_boundary'
  | 'cleanup_policy'
  | 'observability'
  | 'rollback'

export type InternalBetaQaCleanupCheckOutcome = 'passed' | 'warning' | 'failed' | 'blocked' | 'not_run'

export interface InternalBetaQaCleanupCheckInput {
  category?: InternalBetaQaCleanupCheckCategory
  outcome?: InternalBetaQaCleanupCheckOutcome
  summary?: string
  linkedArtifactIds?: string[]
  linkedJobIds?: string[]
  metadata?: Record<string, unknown>
}

export interface InternalBetaCleanupPolicyInput {
  artifactId?: string
  fileName?: string
  cleanupPolicy?: 'worker_temp_delete_after_job' | 'retain_with_project_private' | 'qa_short_retention'
  cleanupStatus?: 'recorded_only' | 'blocked_pending_storage_runtime'
  metadata?: Record<string, unknown>
}

export interface InternalBetaObservabilityEventInput {
  eventType?: 'qa_gate_recorded' | 'cleanup_policy_recorded' | 'rollback_gate_recorded' | 'safety_boundary_recorded'
  severity?: 'info' | 'warning' | 'error'
  message?: string
  metadata?: Record<string, unknown>
}

export interface InternalBetaQaCleanupObservabilityLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobId?: string
  artifactManifestId?: string
  renderRequestId?: string
  idempotencyKey?: string
  qaChecks?: InternalBetaQaCleanupCheckInput[]
  cleanupPolicies?: InternalBetaCleanupPolicyInput[]
  observabilityEvents?: InternalBetaObservabilityEventInput[]
  rollbackPlan?: {
    rollbackAllowed?: boolean
    rollbackScope?: 'local_metadata_only' | 'blocked_pending_remote_runtime'
    reason?: string
  }
  metadata?: Record<string, unknown>
}

export interface InternalBetaQaCleanupCheckRecord {
  id: string
  category: InternalBetaQaCleanupCheckCategory
  outcome: InternalBetaQaCleanupCheckOutcome
  summary: string
  linkedArtifactIds: string[]
  linkedJobIds: string[]
  qaExecution: false
  mediaInspection: false
  metadata: Record<string, unknown>
}

export interface InternalBetaCleanupPolicyRecord {
  id: string
  artifactId: string
  fileName: string
  cleanupPolicy: NonNullable<InternalBetaCleanupPolicyInput['cleanupPolicy']>
  cleanupStatus: NonNullable<InternalBetaCleanupPolicyInput['cleanupStatus']>
  cleanupJobCreated: false
  cleanupExecuted: false
  storageObjectDeleted: false
  localOnly: true
  metadata: Record<string, unknown>
}

export interface InternalBetaObservabilityEventRecord {
  id: string
  eventType: NonNullable<InternalBetaObservabilityEventInput['eventType']>
  severity: NonNullable<InternalBetaObservabilityEventInput['severity']>
  message: string
  eventWrittenToRemoteSink: false
  localOnly: true
  metadata: Record<string, unknown>
}

export interface InternalBetaQaCleanupObservabilityLocalRecord {
  id: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobId: string
  artifactManifestId: string
  renderRequestId: string
  idempotencyKeyHash: string
  status: 'local_qa_cleanup_observability_metadata_only'
  createdAt: string
  localOnly: true
  persistedToSupabase: false
  qaChecks: InternalBetaQaCleanupCheckRecord[]
  cleanupPolicies: InternalBetaCleanupPolicyRecord[]
  observabilityEvents: InternalBetaObservabilityEventRecord[]
  rollbackPlan: {
    rollbackAllowed: boolean
    rollbackScope: 'local_metadata_only' | 'blocked_pending_remote_runtime'
    reason: string
    rollbackExecuted: false
  }
  metadata: Record<string, unknown>
}

export interface InternalBetaQaCleanupObservabilitySummary {
  qaGateId: string
  qaStatus: 'local_metadata_only_review_recorded'
  qaExecution: false
  qaCheckCount: number
  passedCount: number
  warningCount: number
  failedCount: number
  blockedCount: number
  notRunCount: number
  cleanupPolicyCount: number
  cleanupExecuted: false
  observabilityEventCount: number
  remoteObservabilitySinkWrite: false
  rollbackExecuted: false
}

export interface InternalBetaQaCleanupObservabilitySafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
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
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
  qaMediaInspection: false
  cleanupExecution: false
  rollbackExecution: false
  remoteObservabilitySinkWrite: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageObjectCreation: false
  storageObjectRead: false
  storageObjectDelete: false
  signedUrlCreation: false
  publicArtifactCreation: false
  privateMediaProcessing: false
  userMediaProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaQaCleanupObservabilityLocalRuntimeResult {
  ok: boolean
  status: InternalBetaQaCleanupObservabilityLocalRuntimeStatus
  createdAt: string
  record?: InternalBetaQaCleanupObservabilityLocalRecord
  recordHash?: string
  summary?: InternalBetaQaCleanupObservabilitySummary
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localQaGateRecorded: boolean
  localCleanupPoliciesRecorded: number
  localObservabilityEventsRecorded: number
  localRollbackGateRecorded: boolean
  localOnly: true
  persistedToSupabase: false
  requiredBeforeInternalBetaUnlock: string[]
  safety: InternalBetaQaCleanupObservabilitySafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_QA_CLEANUP_OBSERVABILITY_LOCAL_RUNTIME_RULE =
  'QA, cleanup, observability, and rollback local runtime validates metadata gates without remote execution, media inspection, cleanup execution, or beta unlock.'

export const INTERNAL_BETA_QA_CLEANUP_OBSERVABILITY_FORBIDDEN_INPUT_KEYS = [
  'rawChat',
  'rawUserMessage',
  'rawUserMessages',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'directPrompt',
  'signedUrl',
  'signedURL',
  'publicUrl',
  'publicURL',
  'serviceRoleKey',
  'providerApiKey',
  'storageObjectBody',
  'mediaBytes',
  'fileBuffer',
  'renderedBytes',
  'secret',
  'token',
]

const REQUIRED_BEFORE_UNLOCK = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'service_role_qa_report_runtime_enablement',
  'private_artifact_storage_runtime',
  'transactional_job_event_observability_runtime',
  'cleanup_retention_runtime_policy',
  'rollback_runbook_runtime_policy',
  'negative_no_public_artifact_or_signed_url_without_policy_regression',
  'negative_no_beta_unlock_without_runtime_gate_regression',
]

const SAFETY_FALSE: InternalBetaQaCleanupObservabilitySafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  migrationApply: false,
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
  remotionExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  mediaProcessing: false,
  qaMediaInspection: false,
  cleanupExecution: false,
  rollbackExecution: false,
  remoteObservabilitySinkWrite: false,
  renderExportExecution: false,
  previewArtifactCreation: false,
  finalExportCreation: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  storageObjectDelete: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

export function createInternalBetaQaCleanupObservabilityLocalRuntime(
  input: InternalBetaQaCleanupObservabilityLocalRuntimeInput,
): InternalBetaQaCleanupObservabilityLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.creditReservationId, 'creditReservationId', errors)
  requireNonEmpty(input.jobId, 'jobId', errors)
  requireNonEmpty(input.artifactManifestId, 'artifactManifestId', errors)
  requireNonEmpty(input.renderRequestId, 'renderRequestId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  validateArray(input.qaChecks, 'qaChecks', 1, 30, errors)
  validateArray(input.cleanupPolicies, 'cleanupPolicies', 1, 30, errors)
  validateArray(input.observabilityEvents, 'observabilityEvents', 1, 50, errors)

  for (const [index, check] of (input.qaChecks ?? []).entries()) {
    if (!isQaCategory(check.category)) errors.push(`qaChecks[${index}].category must be a supported QA category.`)
    if (!isQaOutcome(check.outcome)) errors.push(`qaChecks[${index}].outcome must be passed, warning, failed, blocked, or not_run.`)
    requireNonEmpty(check.summary, `qaChecks[${index}].summary`, errors)
  }

  for (const [index, cleanup] of (input.cleanupPolicies ?? []).entries()) {
    requireNonEmpty(cleanup.artifactId, `cleanupPolicies[${index}].artifactId`, errors)
    requireNonEmpty(cleanup.fileName, `cleanupPolicies[${index}].fileName`, errors)
    if (cleanup.fileName && /[/\\]/.test(cleanup.fileName)) {
      errors.push(`cleanupPolicies[${index}].fileName must be a file name only, not a path.`)
    }
  }

  for (const [index, event] of (input.observabilityEvents ?? []).entries()) {
    if (!isObservabilityEventType(event.eventType)) {
      errors.push(`observabilityEvents[${index}].eventType must be a supported local observability event type.`)
    }
    if (!['info', 'warning', 'error', undefined].includes(event.severity)) {
      errors.push(`observabilityEvents[${index}].severity must be info, warning, or error.`)
    }
    requireNonEmpty(event.message, `observabilityEvents[${index}].message`, errors)
  }

  const forbiddenInputKeys = findForbiddenInputKeys(input)
  forbiddenInputKeys.forEach((path) => {
    errors.push(`QA cleanup observability input must not contain raw prompt, signed/public URL, media bytes, provider secret, service-role, token, or secret fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0 || !input.qaChecks || !input.cleanupPolicies || !input.observabilityEvents) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_qa_cleanup_observability_input',
      errors,
      warnings,
      input,
    })
  }

  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const recordBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    renderRequestId: input.renderRequestId,
    idempotencyKeyHash,
    qaChecks: input.qaChecks.map((check) => ({
      category: check.category,
      outcome: check.outcome ?? 'not_run',
      summary: check.summary,
      linkedArtifactIds: check.linkedArtifactIds ?? [],
      linkedJobIds: check.linkedJobIds ?? [],
    })),
    cleanupPolicies: input.cleanupPolicies.map((cleanup) => ({
      artifactId: cleanup.artifactId,
      fileName: cleanup.fileName,
      cleanupPolicy: cleanup.cleanupPolicy ?? 'qa_short_retention',
      cleanupStatus: cleanup.cleanupStatus ?? 'recorded_only',
    })),
    observabilityEvents: input.observabilityEvents.map((event) => ({
      eventType: event.eventType,
      severity: event.severity ?? 'info',
      message: event.message,
    })),
    rollbackPlan: input.rollbackPlan ?? {},
  }
  const recordHash = sha256Hex(stableStringify(recordBasis))
  const recordId = `qa_cleanup_observability_${recordHash.slice(0, 24)}`

  const qaChecks = input.qaChecks.map(
    (check, index): InternalBetaQaCleanupCheckRecord => ({
      id: `qa_check_${recordHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
      category: check.category ?? 'safety_boundary',
      outcome: check.outcome ?? 'not_run',
      summary: check.summary ?? '',
      linkedArtifactIds: check.linkedArtifactIds ?? [],
      linkedJobIds: check.linkedJobIds ?? [],
      qaExecution: false,
      mediaInspection: false,
      metadata: {
        ...sanitizeJson(check.metadata ?? {}),
        localRuntime: true,
        qaEvidenceReviewOnly: true,
      },
    }),
  )

  const cleanupPolicies = input.cleanupPolicies.map(
    (cleanup, index): InternalBetaCleanupPolicyRecord => ({
      id: `cleanup_policy_${recordHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
      artifactId: cleanup.artifactId ?? '',
      fileName: cleanup.fileName ?? '',
      cleanupPolicy: cleanup.cleanupPolicy ?? 'qa_short_retention',
      cleanupStatus: cleanup.cleanupStatus ?? 'recorded_only',
      cleanupJobCreated: false,
      cleanupExecuted: false,
      storageObjectDeleted: false,
      localOnly: true,
      metadata: {
        ...sanitizeJson(cleanup.metadata ?? {}),
        localRuntime: true,
        cleanupExecution: false,
      },
    }),
  )

  const observabilityEvents = input.observabilityEvents.map(
    (event, index): InternalBetaObservabilityEventRecord => ({
      id: `observability_event_${recordHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
      eventType: event.eventType ?? 'qa_gate_recorded',
      severity: event.severity ?? 'info',
      message: event.message ?? '',
      eventWrittenToRemoteSink: false,
      localOnly: true,
      metadata: {
        ...sanitizeJson(event.metadata ?? {}),
        localRuntime: true,
        remoteSinkWrite: false,
      },
    }),
  )

  const record: InternalBetaQaCleanupObservabilityLocalRecord = {
    id: recordId,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    creditReservationId: input.creditReservationId ?? '',
    jobId: input.jobId ?? '',
    artifactManifestId: input.artifactManifestId ?? '',
    renderRequestId: input.renderRequestId ?? '',
    idempotencyKeyHash,
    status: 'local_qa_cleanup_observability_metadata_only',
    createdAt,
    localOnly: true,
    persistedToSupabase: false,
    qaChecks,
    cleanupPolicies,
    observabilityEvents,
    rollbackPlan: {
      rollbackAllowed: Boolean(input.rollbackPlan?.rollbackAllowed),
      rollbackScope: input.rollbackPlan?.rollbackScope ?? 'blocked_pending_remote_runtime',
      reason: input.rollbackPlan?.reason ?? 'Rollback policy recorded locally; remote rollback is blocked pending runtime approval.',
      rollbackExecuted: false,
    },
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      localRuntime: true,
      persistenceMode: 'local_validation_only_no_qa_execution_cleanup_or_remote_sink',
      internalBetaUnlock: false,
    },
  }

  return createResult({
    createdAt,
    status: 'local_qa_cleanup_observability_validated_no_remote_execution',
    errors,
    warnings,
    input,
    record,
    recordHash,
    summary: buildSummary(record),
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaQaCleanupObservabilityLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaQaCleanupObservabilityLocalRuntimeInput
  record?: InternalBetaQaCleanupObservabilityLocalRecord
  recordHash?: string
  summary?: InternalBetaQaCleanupObservabilitySummary
}): InternalBetaQaCleanupObservabilityLocalRuntimeResult {
  const ok = input.status === 'local_qa_cleanup_observability_validated_no_remote_execution'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    record: ok ? input.record : undefined,
    recordHash: ok ? input.recordHash : undefined,
    summary: ok ? input.summary : undefined,
    validation: { ok, errors: input.errors, warnings: input.warnings },
    localQaGateRecorded: ok,
    localCleanupPoliciesRecorded: ok ? input.record?.cleanupPolicies.length ?? 0 : 0,
    localObservabilityEventsRecorded: ok ? input.record?.observabilityEvents.length ?? 0 : 0,
    localRollbackGateRecorded: ok,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeInternalBetaUnlock: [...REQUIRED_BEFORE_UNLOCK],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function buildSummary(record: InternalBetaQaCleanupObservabilityLocalRecord): InternalBetaQaCleanupObservabilitySummary {
  return {
    qaGateId: `qa_gate_${record.id.replace(/^qa_cleanup_observability_/, '')}`,
    qaStatus: 'local_metadata_only_review_recorded',
    qaExecution: false,
    qaCheckCount: record.qaChecks.length,
    passedCount: record.qaChecks.filter((check) => check.outcome === 'passed').length,
    warningCount: record.qaChecks.filter((check) => check.outcome === 'warning').length,
    failedCount: record.qaChecks.filter((check) => check.outcome === 'failed').length,
    blockedCount: record.qaChecks.filter((check) => check.outcome === 'blocked').length,
    notRunCount: record.qaChecks.filter((check) => check.outcome === 'not_run').length,
    cleanupPolicyCount: record.cleanupPolicies.length,
    cleanupExecuted: false,
    observabilityEventCount: record.observabilityEvents.length,
    remoteObservabilitySinkWrite: false,
    rollbackExecuted: false,
  }
}

function summarizeInput(input: InternalBetaQaCleanupObservabilityLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    renderRequestId: input.renderRequestId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    qaCheckCount: input.qaChecks?.length ?? 0,
    cleanupPolicyCount: input.cleanupPolicies?.length ?? 0,
    observabilityEventCount: input.observabilityEvents?.length ?? 0,
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} is required.`)
  }
}

function validateArray(value: unknown, label: string, min: number, max: number, errors: string[]) {
  if (!Array.isArray(value) || value.length < min) {
    errors.push(`${label} must include at least ${min} item.`)
  } else if (value.length > max) {
    errors.push(`${label} must not exceed ${max} items.`)
  }
}

function isQaCategory(value: unknown): value is InternalBetaQaCleanupCheckCategory {
  return [
    'approved_snapshot',
    'credit_reservation',
    'job_queue',
    'artifact_manifest',
    'private_preview_export',
    'safety_boundary',
    'cleanup_policy',
    'observability',
    'rollback',
  ].includes(String(value))
}

function isQaOutcome(value: unknown): value is InternalBetaQaCleanupCheckOutcome {
  return ['passed', 'warning', 'failed', 'blocked', 'not_run'].includes(String(value))
}

function isObservabilityEventType(value: unknown): value is NonNullable<InternalBetaObservabilityEventInput['eventType']> {
  return ['qa_gate_recorded', 'cleanup_policy_recorded', 'rollback_gate_recorded', 'safety_boundary_recorded'].includes(String(value))
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (
      INTERNAL_BETA_QA_CLEANUP_OBSERVABILITY_FORBIDDEN_INPUT_KEYS.some(
        (forbidden) => forbidden.toLowerCase() === key.toLowerCase(),
      )
    ) {
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
