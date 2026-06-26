import type { InternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'
import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'
import {
  createInternalBetaApprovedSnapshotLocalRuntime,
  type InternalBetaApprovedSnapshotPersistenceInput,
  type InternalBetaApprovedSnapshotPersistenceResult,
} from './internal-beta-approved-snapshot-persistence-local-runtime'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaApprovedSnapshotServiceRolePersistenceGuardStatus =
  | 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
  | 'blocked_missing_approved_supabase_access_token_alias'
  | 'blocked_missing_approved_supabase_readonly_db_url_alias'
  | 'blocked_pending_confirmed_supabase_target_rls_storage_validation'
  | 'blocked_pending_service_role_persistence_runtime_approval'
  | 'ready_for_separate_service_role_persistence_implementation_no_supabase_write'

export interface InternalBetaApprovedSnapshotServiceRolePersistenceGuardInput
  extends InternalBetaApprovedSnapshotPersistenceInput {
  supabaseCredentialContext?: InternalBetaSupabaseCredentialContextContract
  confirmedSupabaseTargetValidation?: boolean
  serviceRolePersistenceRuntimeApproved?: boolean
  remotePersistenceConfirmation?: boolean
}

export interface InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult {
  ok: boolean
  status: InternalBetaApprovedSnapshotServiceRolePersistenceGuardStatus
  createdAt: string
  localSnapshotRuntime: InternalBetaApprovedSnapshotPersistenceResult
  supabaseCredentialContextDecision: string
  confirmedSupabaseTargetValidation: boolean
  serviceRolePersistenceRuntimeApproved: boolean
  remotePersistenceConfirmation: boolean
  readyForSeparatePersistenceImplementation: boolean
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
  requiredBeforePersistence: string[]
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_APPROVED_SNAPSHOT_SERVICE_ROLE_PERSISTENCE_GUARD_RULE =
  'Approved snapshot service-role persistence must remain blocked until credential context, target validation, and service-role runtime approval are present.'

export function evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard(
  input: InternalBetaApprovedSnapshotServiceRolePersistenceGuardInput,
): InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult {
  const createdAt = nowIso()
  const localSnapshotRuntime = createInternalBetaApprovedSnapshotLocalRuntime(input)
  const credentialContext =
    input.supabaseCredentialContext ?? createInternalBetaSupabaseCredentialContextContract()
  const credentialDecision = credentialContext.decision
  const confirmedSupabaseTargetValidation = input.confirmedSupabaseTargetValidation === true
  const serviceRolePersistenceRuntimeApproved = input.serviceRolePersistenceRuntimeApproved === true
  const remotePersistenceConfirmation = input.remotePersistenceConfirmation === true

  let status: InternalBetaApprovedSnapshotServiceRolePersistenceGuardStatus

  if (
    credentialDecision === 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias' ||
    credentialDecision === 'blocked_missing_approved_supabase_access_token_alias' ||
    credentialDecision === 'blocked_missing_approved_supabase_readonly_db_url_alias'
  ) {
    status = credentialDecision
  } else if (!confirmedSupabaseTargetValidation) {
    status = 'blocked_pending_confirmed_supabase_target_rls_storage_validation'
  } else if (!serviceRolePersistenceRuntimeApproved || !remotePersistenceConfirmation) {
    status = 'blocked_pending_service_role_persistence_runtime_approval'
  } else {
    status = 'ready_for_separate_service_role_persistence_implementation_no_supabase_write'
  }

  const readyForSeparatePersistenceImplementation =
    status === 'ready_for_separate_service_role_persistence_implementation_no_supabase_write' &&
    localSnapshotRuntime.ok

  return {
    ok: readyForSeparatePersistenceImplementation,
    status: readyForSeparatePersistenceImplementation
      ? 'ready_for_separate_service_role_persistence_implementation_no_supabase_write'
      : status,
    createdAt,
    localSnapshotRuntime,
    supabaseCredentialContextDecision: credentialDecision,
    confirmedSupabaseTargetValidation,
    serviceRolePersistenceRuntimeApproved,
    remotePersistenceConfirmation,
    readyForSeparatePersistenceImplementation,
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
    requiredBeforePersistence: [
      'approved_supabase_credential_context_present',
      'confirmed_supabase_target_rls_storage_validation',
      'service_role_persistence_runtime_approval',
      'separate_service_role_persistence_implementation',
      'least_privilege_rls_storage_regression',
      'negative_no_raw_chat_or_prompt_execution_regression',
    ],
    inputSummary: sanitizeJson({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      confirmedSupabaseTargetValidation,
      serviceRolePersistenceRuntimeApproved,
      remotePersistenceConfirmation,
    }),
  }
}
