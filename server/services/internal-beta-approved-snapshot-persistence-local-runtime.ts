import { createHash } from 'node:crypto'

import type {
  ApprovedPlanSnapshotPayload,
  ApprovedPlanSnapshotRecord,
} from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { validateApprovedPlanSnapshotForWorker } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaApprovedSnapshotPersistenceStatus =
  | 'local_snapshot_persistence_validated_no_supabase_write'
  | 'blocked_invalid_approved_snapshot_persistence_input'

export interface InternalBetaApprovedSnapshotPersistenceInput {
  workspaceId?: string
  projectId?: string
  chatSessionId?: string
  editPlanId?: string
  editPlanVersionId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  creditReservationId?: string
  approvedByUserId?: string
  approvedAt?: string
  idempotencyKey?: string
  snapshotVersion?: number
  snapshotPayload?: ApprovedPlanSnapshotPayload
  metadata?: Record<string, unknown>
}

export interface InternalBetaApprovedSnapshotPersistenceSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  serviceRoleRouteExecution: false
  serviceRoleSecretPayloadAccess: false
  frontendServiceRoleCredentialExposure: false
  creditMutation: false
  creditReservationCreation: false
  jobEnqueue: false
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

export interface InternalBetaApprovedSnapshotPersistenceResult {
  ok: boolean
  status: InternalBetaApprovedSnapshotPersistenceStatus
  createdAt: string
  snapshot?: ApprovedPlanSnapshotRecord
  snapshotHash?: string
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  immutableSnapshotRecordCreated: boolean
  localOnly: true
  persistedToSupabase: false
  requiredBeforeRemotePersistence: string[]
  safety: InternalBetaApprovedSnapshotPersistenceSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_APPROVED_SNAPSHOT_LOCAL_RUNTIME_RULE =
  'Approved snapshot persistence local runtime validates immutable snapshot records without Supabase writes.'

export const INTERNAL_BETA_APPROVED_SNAPSHOT_FORBIDDEN_INPUT_KEYS = [
  'rawChat',
  'rawUserMessage',
  'rawUserMessages',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'directPrompt',
  'signedUrl',
  'serviceRoleKey',
]

const REQUIRED_REMOTE_PERSISTENCE_GATES = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'service_role_runtime_enablement',
  'approved_plan_snapshot_table_rls_validation',
  'credit_reservation_runtime_validation',
  'idempotency_key_enforcement',
  'negative_raw_chat_execution_regression',
]

const SAFETY_FALSE: InternalBetaApprovedSnapshotPersistenceSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  serviceRoleRouteExecution: false,
  serviceRoleSecretPayloadAccess: false,
  frontendServiceRoleCredentialExposure: false,
  creditMutation: false,
  creditReservationCreation: false,
  jobEnqueue: false,
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

export function createInternalBetaApprovedSnapshotLocalRuntime(
  input: InternalBetaApprovedSnapshotPersistenceInput,
): InternalBetaApprovedSnapshotPersistenceResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.chatSessionId, 'chatSessionId', errors)
  requireNonEmpty(input.editPlanId, 'editPlanId', errors)
  requireNonEmpty(input.creditEstimateId, 'creditEstimateId', errors)
  requireNonEmpty(input.creditReservationId, 'creditReservationId', errors)
  requireNonEmpty(input.approvedByUserId, 'approvedByUserId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (!input.snapshotPayload || typeof input.snapshotPayload !== 'object' || Array.isArray(input.snapshotPayload)) {
    errors.push('snapshotPayload is required.')
  }

  const forbiddenInputKeys = findForbiddenInputKeys({
    snapshotPayload: input.snapshotPayload ?? {},
    metadata: input.metadata ?? {},
  })
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Approved snapshot input must not contain raw chat, raw prompt, signed URL, or service-role fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0 || !input.snapshotPayload) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_approved_snapshot_persistence_input',
      errors,
      warnings,
      input,
    })
  }

  const approvedAt = input.approvedAt ?? createdAt
  const snapshotVersion = input.snapshotVersion ?? 1
  const snapshotBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditReservationId: input.creditReservationId,
    approvedByUserId: input.approvedByUserId,
    approvedAt,
    snapshotVersion,
    snapshotPayload: input.snapshotPayload,
  }
  const snapshotHash = sha256Hex(stableStringify(snapshotBasis))
  const snapshot: ApprovedPlanSnapshotRecord = {
    id: `approved_snapshot_${snapshotHash.slice(0, 24)}`,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    chatSessionId: input.chatSessionId ?? '',
    editPlanId: input.editPlanId ?? '',
    editPlanVersionId: input.editPlanVersionId,
    creditEstimateId: input.creditEstimateId ?? '',
    creditApprovalId: input.creditApprovalId,
    creditReservationId: input.creditReservationId,
    snapshotStatus: 'execution_ready',
    snapshotVersion,
    snapshotHash,
    approvedByUserId: input.approvedByUserId ?? '',
    approvedAt,
    executionReadyAt: createdAt,
    snapshotPayload: input.snapshotPayload,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      ...(sanitizeJson(input.metadata ?? {})),
      localRuntime: true,
      idempotencyKey: input.idempotencyKey ?? '',
      persistenceMode: 'local_validation_only_no_supabase_write',
    },
  }

  const snapshotValidation = validateApprovedPlanSnapshotForWorker(snapshot, {
    requiresCreditReservation: true,
  })
  errors.push(...snapshotValidation.errors)
  warnings.push(...snapshotValidation.warnings)

  if (errors.length > 0) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_approved_snapshot_persistence_input',
      errors,
      warnings,
      input,
      snapshot,
      snapshotHash,
    })
  }

  return createResult({
    createdAt,
    status: 'local_snapshot_persistence_validated_no_supabase_write',
    errors,
    warnings,
    input,
    snapshot,
    snapshotHash,
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaApprovedSnapshotPersistenceStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaApprovedSnapshotPersistenceInput
  snapshot?: ApprovedPlanSnapshotRecord
  snapshotHash?: string
}): InternalBetaApprovedSnapshotPersistenceResult {
  const ok = input.status === 'local_snapshot_persistence_validated_no_supabase_write'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    snapshot: ok ? input.snapshot : undefined,
    snapshotHash: ok ? input.snapshotHash : undefined,
    validation: {
      ok,
      errors: input.errors,
      warnings: input.warnings,
    },
    immutableSnapshotRecordCreated: ok,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeRemotePersistence: REQUIRED_REMOTE_PERSISTENCE_GATES,
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function requireNonEmpty(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${fieldName} is required.`)
  }
}

function summarizeInput(input: InternalBetaApprovedSnapshotPersistenceInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditReservationId: input.creditReservationId,
    approvedByUserId: input.approvedByUserId,
    idempotencyKey: input.idempotencyKey,
    snapshotPayloadFieldCount: input.snapshotPayload ? Object.keys(input.snapshotPayload).length : 0,
  })
}

function findForbiddenInputKeys(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nestedPath = `${path}.${key}`
    const matches = INTERNAL_BETA_APPROVED_SNAPSHOT_FORBIDDEN_INPUT_KEYS.includes(key) ? [nestedPath] : []

    return [...matches, ...findForbiddenInputKeys(nestedValue, nestedPath)]
  })
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  return `{${Object.entries(value)
    .filter(([, nestedValue]) => nestedValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(',')}}`
}
