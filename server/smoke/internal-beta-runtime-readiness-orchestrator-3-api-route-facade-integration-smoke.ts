import {
  assertInternalBetaRuntimeReadinessOrchestratorFailClosed,
  createInternalBetaRuntimeReadinessOrchestratorReport,
} from '../services/internal-beta-runtime-readiness-orchestrator'
import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const report = createInternalBetaRuntimeReadinessOrchestratorReport({
  workspaceId: 'workspace_smoke_runtime_readiness_orchestrator_3',
  projectId: 'project_smoke_runtime_readiness_orchestrator_3',
  userId: 'user_smoke_runtime_readiness_orchestrator_3',
  requestId: 'request_smoke_runtime_readiness_orchestrator_3',
  supabaseCredentialContext: createInternalBetaSupabaseCredentialContextContract({}),
  payload: {
    packet: 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-3-API-ROUTE-FACADE-INTEGRATION',
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
assert(report.componentCounts.apiRouteRuntimeFacade === 8, 'API route facade component count mismatch')
assert(report.componentCounts.serviceRoleRuntime === 8, 'service-role runtime count mismatch')
assert(report.componentCounts.creditLedgerRuntime === 6, 'credit ledger count mismatch')
assert(report.componentCounts.total === 54, 'total disabled operation count mismatch')
assert(report.componentSummaries.length === 54, 'component summaries must include all disabled operations')
assert(report.componentStatuses.api_route_runtime_facade.length === 1, 'API route facade status count mismatch')
assert(
  report.componentStatuses.api_route_runtime_facade[0] ===
    'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'API route facade status mismatch',
)
assert(
  report.componentSummaries.filter((summary) => summary.component === 'api_route_runtime_facade').length === 8,
  'API route facade summary count mismatch',
)
assert(
  report.localEvidenceCounts.approvedSnapshotServiceRolePersistenceGuard === 1,
  'approved snapshot service-role persistence guard evidence count mismatch',
)
assert(report.localEvidenceCounts.localE2EChainSmoke === 1, 'local E2E evidence count mismatch')
assert(report.localEvidenceCounts.total === 2, 'local evidence total count mismatch')
assert(report.localE2EChainSmoke.localOnly === true, 'local E2E evidence must remain local-only')
assert(report.localE2EChainSmoke.persistedToSupabase === false, 'local E2E evidence must not persist remotely')
assert(report.localE2EChainSmoke.internalBetaEndToEndReady === false, 'local E2E evidence must not unlock beta')
assert(
  report.requiredBeforeEnablement.includes('api_route_runtime_facade_validation'),
  'orchestrator must keep API route facade validation gate',
)
assert(
  report.requiredBeforeEnablement.includes('confirmed_supabase_target_rls_storage_validation'),
  'orchestrator must keep Supabase target validation gate',
)
assert(
  report.requiredBeforeEnablement.includes('approved_snapshot_service_role_persistence_guard'),
  'orchestrator must keep service-role persistence guard gate',
)
assert(report.safety.routeExecution === false, 'route execution must remain false')
assert(report.safety.serviceRoleRouteExecution === false, 'service-role route execution must remain false')
assert(report.safety.remoteSupabaseMutation === false, 'Supabase mutation must remain false')
assert(report.safety.sqlExecution === false, 'SQL execution must remain false')
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

console.log('internal-beta-runtime-readiness-orchestrator-3-api-route-facade-integration-smoke passed')
