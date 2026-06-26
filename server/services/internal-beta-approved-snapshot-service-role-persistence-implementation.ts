import { createHash } from 'node:crypto'

import type { ApprovedPlanSnapshotRecord } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import {
  type InternalBetaSupabaseCredentialContextContract,
  createInternalBetaSupabaseCredentialContextContract,
} from '../config/internal-beta-supabase-credential-context-contract'
import {
  evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard,
  type InternalBetaApprovedSnapshotServiceRolePersistenceGuardInput,
  type InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult,
} from './internal-beta-approved-snapshot-service-role-persistence-guard'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaApprovedSnapshotServiceRolePersistenceImplementationStatus =
  | 'completed_service_role_persistence_envelope_validated_no_remote_write'
  | 'blocked_invalid_approved_snapshot_persistence_input'
  | 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
  | 'blocked_missing_approved_supabase_access_token_alias'
  | 'blocked_missing_approved_supabase_readonly_db_url_alias'
  | 'blocked_pending_confirmed_supabase_target_rls_storage_validation'
  | 'blocked_pending_service_role_persistence_runtime_approval'

export interface InternalBetaApprovedSnapshotServiceRolePersistenceImplementationInput
  extends InternalBetaApprovedSnapshotServiceRolePersistenceGuardInput {
  requestMethod?: 'POST'
  requestPath?: '/internal-beta/approved-plan-snapshots'
  idempotencyExpiresAt?: string
  planHash?: string
  creditHash?: string
  sourceSequenceHash?: string
  timingHash?: string
}

export interface InternalBetaApprovedSnapshotServiceRolePersistenceEnvelope {
  approvedPlanSnapshotTable: 'approved_plan_snapshots'
  approvedPlanSnapshotInsert: Record<string, unknown>
  approvalRecordTable: 'approval_records'
  approvalRecordPatch: Record<string, unknown>
  apiIdempotencyKeyTable: 'api_idempotency_keys'
  apiIdempotencyKeyInsert: Record<string, unknown>
  auditEventTable: 'audit_events'
  auditEventInsert: Record<string, unknown>
  requestHash: string
  approvedSnapshotUuid: string
}

export interface InternalBetaApprovedSnapshotServiceRolePersistenceImplementationResult {
  ok: boolean
  status: InternalBetaApprovedSnapshotServiceRolePersistenceImplementationStatus
  createdAt: string
  guard: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult
  envelope?: InternalBetaApprovedSnapshotServiceRolePersistenceEnvelope
  envelopeValidated: boolean
  backendOnly: true
  localOnly: true
  persistedToSupabase: false
  routeExecution: false
  serviceRoleRouteExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  creditMutation: false
  jobEnqueue: false
  workerExecution: false
  workerDispatch: false
  signedUrlCreation: false
  publicArtifactCreation: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
  requiredBeforeRemotePersistence: string[]
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_APPROVED_SNAPSHOT_SERVICE_ROLE_PERSISTENCE_IMPLEMENTATION_RULE =
  'Approved snapshot service-role persistence implementation validates the backend-only insert envelope locally and does not write Supabase.'

const DEFAULT_REQUEST_METHOD = 'POST'
const DEFAULT_REQUEST_PATH = '/internal-beta/approved-plan-snapshots'

export function createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation(
  input: InternalBetaApprovedSnapshotServiceRolePersistenceImplementationInput,
): InternalBetaApprovedSnapshotServiceRolePersistenceImplementationResult {
  const createdAt = nowIso()
  const credentialContext =
    input.supabaseCredentialContext ?? createInternalBetaSupabaseCredentialContextContract()
  const guard = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard({
    ...input,
    supabaseCredentialContext: credentialContext,
  })

  if (!guard.ok || !guard.localSnapshotRuntime.snapshot || !guard.localSnapshotRuntime.snapshotHash) {
    return createResult({
      createdAt,
      status: mapGuardStatus(guard),
      input,
      credentialContext,
      guard,
    })
  }

  const envelope = buildPersistenceEnvelope({
    input,
    credentialContext,
    createdAt,
    snapshot: guard.localSnapshotRuntime.snapshot,
    snapshotHash: guard.localSnapshotRuntime.snapshotHash,
  })

  return createResult({
    createdAt,
    status: 'completed_service_role_persistence_envelope_validated_no_remote_write',
    input,
    credentialContext,
    guard,
    envelope,
  })
}

function buildPersistenceEnvelope(input: {
  input: InternalBetaApprovedSnapshotServiceRolePersistenceImplementationInput
  credentialContext: InternalBetaSupabaseCredentialContextContract
  createdAt: string
  snapshot: ApprovedPlanSnapshotRecord
  snapshotHash: string
}): InternalBetaApprovedSnapshotServiceRolePersistenceEnvelope {
  const approvedSnapshotUuid = uuidFromHash(input.snapshotHash)
  const planHash = input.input.planHash ?? sha256Hex(stableStringify(input.snapshot.snapshotPayload))
  const creditHash =
    input.input.creditHash ?? sha256Hex(stableStringify(input.snapshot.snapshotPayload.creditEstimate))
  const sourceSequenceHash =
    input.input.sourceSequenceHash ?? sha256Hex(stableStringify(input.snapshot.snapshotPayload.sourceOrder))
  const timingHash =
    input.input.timingHash ??
    sha256Hex(stableStringify({
      confirmedSettings: input.snapshot.snapshotPayload.confirmedSettings,
      rendererPlan: input.snapshot.snapshotPayload.rendererPlan,
      renderPolicy: input.snapshot.snapshotPayload.renderPolicy,
    }))
  const requestMethod = input.input.requestMethod ?? DEFAULT_REQUEST_METHOD
  const requestPath = input.input.requestPath ?? DEFAULT_REQUEST_PATH
  const requestHash = sha256Hex(stableStringify({
    approvedSnapshotUuid,
    idempotencyKey: input.input.idempotencyKey,
    planHash,
    creditHash,
    sourceSequenceHash,
    timingHash,
    snapshotHash: input.snapshotHash,
  }))
  const sanitizedMetadata = sanitizeJson(input.input.metadata ?? {})

  return {
    approvedPlanSnapshotTable: 'approved_plan_snapshots',
    approvedPlanSnapshotInsert: {
      id: approvedSnapshotUuid,
      workspace_id: input.snapshot.workspaceId,
      project_id: input.snapshot.projectId,
      chat_session_id: input.snapshot.chatSessionId,
      edit_session_id: input.snapshot.chatSessionId,
      edit_plan_id: input.snapshot.editPlanId,
      edit_plan_version_id: input.snapshot.editPlanVersionId ?? null,
      credit_estimate_id: input.snapshot.creditEstimateId,
      credit_approval_id: input.snapshot.creditApprovalId ?? null,
      credit_reservation_id: input.snapshot.creditReservationId ?? null,
      approved_by: input.snapshot.approvedByUserId,
      approved_by_user_id: input.snapshot.approvedByUserId,
      approved_at: input.snapshot.approvedAt,
      snapshot_version: input.snapshot.snapshotVersion,
      snapshot_status: 'approved',
      status: 'approved',
      immutable: true,
      snapshot_json: input.snapshot.snapshotPayload,
      plan_hash: planHash,
      credit_hash: creditHash,
      source_sequence_hash: sourceSequenceHash,
      timing_hash: timingHash,
      created_at: input.createdAt,
      updated_at: input.createdAt,
    },
    approvalRecordTable: 'approval_records',
    approvalRecordPatch: {
      approved_snapshot_id: approvedSnapshotUuid,
      approved_snapshot_summary_json: {
        approvedSnapshotId: approvedSnapshotUuid,
        planHash,
        creditHash,
        sourceSequenceHash,
        timingHash,
        snapshotHash: input.snapshotHash,
      },
      audit_metadata_json: {
        idempotencyKey: input.input.idempotencyKey,
        persistenceMode: 'service_role_envelope_validated_no_remote_write',
        sourcePacket: 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1',
        ...sanitizedMetadata,
      },
    },
    apiIdempotencyKeyTable: 'api_idempotency_keys',
    apiIdempotencyKeyInsert: {
      workspace_id: input.snapshot.workspaceId,
      user_id: input.snapshot.approvedByUserId,
      idempotency_key: input.input.idempotencyKey,
      request_method: requestMethod,
      request_path: requestPath,
      request_hash: requestHash,
      response_status: 201,
      response_record_table: 'approved_plan_snapshots',
      response_record_id: approvedSnapshotUuid,
      expires_at: input.input.idempotencyExpiresAt ?? addHoursIso(input.createdAt, 24),
      created_at: input.createdAt,
      updated_at: input.createdAt,
    },
    auditEventTable: 'audit_events',
    auditEventInsert: {
      workspace_id: input.snapshot.workspaceId,
      project_id: input.snapshot.projectId,
      actor_user_id: input.snapshot.approvedByUserId,
      event_type: 'approved_snapshot.service_role_persistence_envelope_validated',
      event_json: {
        approvedSnapshotId: approvedSnapshotUuid,
        idempotencyKey: input.input.idempotencyKey,
        targetRef: input.credentialContext.targetRef,
        targetClass: input.credentialContext.targetClass,
        persistedToSupabase: false,
        remoteSupabaseMutation: false,
        serviceRoleRouteExecution: false,
        workerExecution: false,
        signedUrlCreation: false,
        publicArtifactCreation: false,
        internalBetaUnlock: false,
      },
      created_at: input.createdAt,
    },
    requestHash,
    approvedSnapshotUuid,
  }
}

function createResult(input: {
  createdAt: string
  status: InternalBetaApprovedSnapshotServiceRolePersistenceImplementationStatus
  input: InternalBetaApprovedSnapshotServiceRolePersistenceImplementationInput
  credentialContext: InternalBetaSupabaseCredentialContextContract
  guard: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult
  envelope?: InternalBetaApprovedSnapshotServiceRolePersistenceEnvelope
}): InternalBetaApprovedSnapshotServiceRolePersistenceImplementationResult {
  const ok = input.status === 'completed_service_role_persistence_envelope_validated_no_remote_write'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    guard: input.guard,
    envelope: input.envelope,
    envelopeValidated: ok,
    backendOnly: true,
    localOnly: true,
    persistedToSupabase: false,
    routeExecution: false,
    serviceRoleRouteExecution: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    migrationApply: false,
    creditMutation: false,
    jobEnqueue: false,
    workerExecution: false,
    workerDispatch: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    requiredBeforeRemotePersistence: [
      'separate_guarded_remote_persistence_confirmation',
      'transactional_rpc_or_backend_transaction_implementation',
      'least_privilege_service_role_secret_injection',
      'idempotency_conflict_regression',
      'approval_record_patch_regression',
      'audit_event_append_only_regression',
      'negative_no_raw_chat_or_prompt_execution_regression',
    ],
    inputSummary: sanitizeJson({
      workspaceId: input.input.workspaceId,
      projectId: input.input.projectId,
      chatSessionId: input.input.chatSessionId,
      editPlanId: input.input.editPlanId,
      editPlanVersionId: input.input.editPlanVersionId,
      creditEstimateId: input.input.creditEstimateId,
      creditApprovalId: input.input.creditApprovalId,
      creditReservationId: input.input.creditReservationId,
      approvedByUserId: input.input.approvedByUserId,
      idempotencyKey: input.input.idempotencyKey,
      credentialDecision: input.credentialContext.decision,
      confirmedSupabaseTargetValidation: input.input.confirmedSupabaseTargetValidation === true,
      serviceRolePersistenceRuntimeApproved: input.input.serviceRolePersistenceRuntimeApproved === true,
      remotePersistenceConfirmation: input.input.remotePersistenceConfirmation === true,
    }),
  }
}

function mapGuardStatus(
  guard: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult,
): InternalBetaApprovedSnapshotServiceRolePersistenceImplementationStatus {
  if (!guard.localSnapshotRuntime.ok) return 'blocked_invalid_approved_snapshot_persistence_input'
  return guard.status === 'ready_for_separate_service_role_persistence_implementation_no_supabase_write'
    ? 'blocked_pending_service_role_persistence_runtime_approval'
    : guard.status
}

function addHoursIso(value: string, hours: number): string {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000).toISOString()
}

function uuidFromHash(hash: string): string {
  const normalized = `${hash}${'0'.repeat(32)}`.slice(0, 32)
  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    `5${normalized.slice(13, 16)}`,
    `8${normalized.slice(17, 20)}`,
    normalized.slice(20, 32),
  ].join('-')
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
