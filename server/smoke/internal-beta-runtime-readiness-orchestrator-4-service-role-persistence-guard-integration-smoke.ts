import {
  assertInternalBetaRuntimeReadinessOrchestratorFailClosed,
  createInternalBetaRuntimeReadinessOrchestratorReport,
} from '../services/internal-beta-runtime-readiness-orchestrator'
import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const report = createInternalBetaRuntimeReadinessOrchestratorReport({
  workspaceId: 'workspace_smoke_runtime_readiness_orchestrator_4',
  projectId: 'project_smoke_runtime_readiness_orchestrator_4',
  userId: 'user_smoke_runtime_readiness_orchestrator_4',
  requestId: 'request_smoke_runtime_readiness_orchestrator_4',
  chatSessionId: 'chat_session_smoke_runtime_readiness_orchestrator_4',
  editPlanId: 'edit_plan_smoke_runtime_readiness_orchestrator_4',
  editPlanVersionId: 'edit_plan_version_smoke_runtime_readiness_orchestrator_4',
  creditEstimateId: 'credit_estimate_smoke_runtime_readiness_orchestrator_4',
  creditApprovalId: 'credit_approval_smoke_runtime_readiness_orchestrator_4',
  creditReservationId: 'credit_reservation_smoke_runtime_readiness_orchestrator_4',
  approvedByUserId: 'user_smoke_runtime_readiness_orchestrator_4',
  approvedAt: '2026-06-26T00:00:00.000Z',
  supabaseCredentialContext: createInternalBetaSupabaseCredentialContextContract({}),
  payload: {
    packet: 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-4-SERVICE-ROLE-PERSISTENCE-GUARD-INTEGRATION',
    serviceRoleKey: 'must_not_appear',
    token: 'must_not_appear',
    signedUrl: 'must_not_appear',
  },
})

assert(report.ok === false, 'orchestrator must remain fail-closed')
assert(
  report.status === 'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'orchestrator status mismatch',
)
assert(report.internalBetaEndToEndReady === false, 'internal beta readiness must remain false')
assert(report.productReadyEndToEndLocalOssTools === 0, 'product-ready local OSS tools must remain 0')
assert(report.componentCounts.apiRouteRuntimeFacade === 8, 'API route facade count mismatch')
assert(report.componentCounts.serviceRoleRuntime === 8, 'service-role runtime count mismatch')
assert(report.componentCounts.creditLedgerRuntime === 6, 'credit ledger count mismatch')
assert(report.componentCounts.jobQueueRuntime === 8, 'job queue count mismatch')
assert(report.componentCounts.privateArtifactManifest === 8, 'private artifact manifest count mismatch')
assert(report.componentCounts.remotionRenderWorker === 8, 'Remotion render worker count mismatch')
assert(report.componentCounts.providerAdapter === 8, 'provider adapter count mismatch')
assert(report.componentCounts.total === 54, 'total disabled operation count mismatch')
assert(report.componentSummaries.length === 54, 'component summaries must include every disabled operation')
assert(
  report.localEvidenceCounts.approvedSnapshotServiceRolePersistenceGuard === 1,
  'approved snapshot service-role persistence guard evidence count mismatch',
)
assert(report.localEvidenceCounts.localE2EChainSmoke === 1, 'local E2E chain evidence count mismatch')
assert(report.localEvidenceCounts.total === 2, 'local evidence total count mismatch')
assert(
  report.serviceRolePersistenceGuard.status ===
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'service-role persistence guard status mismatch',
)
assert(
  report.serviceRolePersistenceGuard.localSnapshotRuntimeStatus ===
    'local_snapshot_persistence_validated_no_supabase_write',
  'service-role persistence guard local snapshot status mismatch',
)
assert(report.serviceRolePersistenceGuard.localSnapshotRuntimeOk === true, 'service-role guard local runtime must pass')
assert(report.serviceRolePersistenceGuard.persistedToSupabase === false, 'service-role guard must not persist remotely')
assert(report.serviceRolePersistenceGuard.routeExecution === false, 'service-role guard route execution must remain false')
assert(
  report.serviceRolePersistenceGuard.serviceRoleRouteExecution === false,
  'service-role guard route execution must remain false',
)
assert(
  report.serviceRolePersistenceGuard.remoteSupabaseMutation === false,
  'service-role guard Supabase mutation must remain false',
)
assert(report.serviceRolePersistenceGuard.sqlExecution === false, 'service-role guard SQL execution must remain false')
assert(report.serviceRolePersistenceGuard.migrationApply === false, 'service-role guard migration apply must remain false')
assert(report.serviceRolePersistenceGuard.creditMutation === false, 'service-role guard credit mutation must remain false')
assert(report.serviceRolePersistenceGuard.jobEnqueue === false, 'service-role guard job enqueue must remain false')
assert(report.serviceRolePersistenceGuard.workerExecution === false, 'service-role guard worker execution must remain false')
assert(report.serviceRolePersistenceGuard.workerDispatch === false, 'service-role guard worker dispatch must remain false')
assert(report.serviceRolePersistenceGuard.signedUrlCreation === false, 'service-role guard signed URL must remain false')
assert(report.serviceRolePersistenceGuard.publicArtifactCreation === false, 'service-role guard public artifact must remain false')
assert(report.serviceRolePersistenceGuard.internalBetaUnlock === false, 'service-role guard beta unlock must remain false')
assert(
  report.serviceRolePersistenceGuard.requiredBeforePersistence.includes('confirmed_supabase_target_rls_storage_validation'),
  'service-role guard must preserve target validation gate',
)
assert(
  report.serviceRolePersistenceGuard.requiredBeforePersistence.includes('service_role_persistence_runtime_approval'),
  'service-role guard must preserve runtime approval gate',
)
assert(
  report.requiredBeforeEnablement.includes('approved_snapshot_service_role_persistence_guard'),
  'orchestrator must keep service-role persistence guard gate',
)
assert(
  report.requiredBeforeEnablement.includes('confirmed_supabase_target_rls_storage_validation'),
  'orchestrator must keep Supabase target validation gate',
)
assert(report.localE2EChainSmoke.ok === true, 'local E2E chain evidence must pass locally')
assert(report.localE2EChainSmoke.localOnly === true, 'local E2E evidence must remain local-only')
assert(report.localE2EChainSmoke.persistedToSupabase === false, 'local E2E evidence must not persist remotely')
assert(report.localE2EChainSmoke.internalBetaEndToEndReady === false, 'local E2E evidence must not unlock beta')
assert(report.safety.remoteSupabaseMutation === false, 'Supabase mutation must remain false')
assert(report.safety.sqlExecution === false, 'SQL execution must remain false')
assert(report.safety.serviceRoleRouteExecution === false, 'service-role route execution must remain false')
assert(report.safety.workerDispatch === false, 'worker dispatch must remain false')
assert(report.safety.workerExecution === false, 'worker execution must remain false')
assert(report.safety.providerModelCall === false, 'provider/model calls must remain false')
assert(report.safety.signedUrlCreation === false, 'signed URL creation must remain false')
assert(report.safety.publicArtifactCreation === false, 'public artifact creation must remain false')
assert(report.safety.creditMutation === false, 'credit mutation must remain false')
assert(report.safety.internalBetaUnlock === false, 'internal beta unlock must remain false')
assert(report.safety.externalBetaUnlock === false, 'external beta unlock must remain false')
assert(report.safety.productionUnlock === false, 'production unlock must remain false')
assert(!JSON.stringify(report.inputSummary).includes('must_not_appear'), 'secret-like fields must be sanitized')
assertInternalBetaRuntimeReadinessOrchestratorFailClosed(report)

console.log('internal-beta-runtime-readiness-orchestrator-4-service-role-persistence-guard-integration-smoke passed')
