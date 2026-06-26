import {
  assertInternalBetaRuntimeReadinessOrchestratorFailClosed,
  createInternalBetaRuntimeReadinessOrchestratorReport,
} from '../services/internal-beta-runtime-readiness-orchestrator'
import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const report = createInternalBetaRuntimeReadinessOrchestratorReport({
  workspaceId: 'workspace_smoke_runtime_readiness_orchestrator_2',
  projectId: 'project_smoke_runtime_readiness_orchestrator_2',
  userId: 'user_smoke_runtime_readiness_orchestrator_2',
  requestId: 'request_smoke_runtime_readiness_orchestrator_2',
  supabaseCredentialContext: createInternalBetaSupabaseCredentialContextContract({}),
  payload: {
    packet: 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-2-LOCAL-E2E-CHAIN-INTEGRATION',
    serviceRoleKey: 'must_not_appear',
    token: 'must_not_appear',
    signedUrl: 'must_not_appear',
  },
})

assert(report.ok === false, 'orchestrator must remain fail-closed')
assert(report.internalBetaEndToEndReady === false, 'internal beta readiness must remain false')
assert(report.productReadyEndToEndLocalOssTools === 0, 'product-ready local OSS tools must remain 0')
assert(report.componentCounts.apiRouteRuntimeFacade === 8, 'API route facade component count mismatch')
assert(report.componentCounts.total === 54, 'disabled runtime component count mismatch')
assert(
  report.localEvidenceCounts.approvedSnapshotServiceRolePersistenceGuard === 1,
  'approved snapshot service-role persistence guard evidence count mismatch',
)
assert(report.localEvidenceCounts.localE2EChainSmoke === 1, 'local E2E evidence count mismatch')
assert(report.localEvidenceCounts.total === 2, 'local evidence total count mismatch')
assert(
  report.localE2EChainSmoke.status === 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'local E2E chain status mismatch',
)
assert(report.localE2EChainSmoke.localOnly === true, 'local E2E evidence must remain local-only')
assert(report.localE2EChainSmoke.persistedToSupabase === false, 'local E2E evidence must not persist remotely')
assert(report.localE2EChainSmoke.internalBetaEndToEndReady === false, 'local E2E evidence must not unlock beta')
assert(
  Object.values(report.localE2EChainSmoke.stepSummary).every((value) => value === true),
  'every local E2E chain metadata step must pass',
)
assert(
  report.requiredBeforeEnablement.includes('approved_supabase_credential_context_present'),
  'orchestrator must keep credential context gate',
)
assert(
  report.requiredBeforeEnablement.includes('confirmed_supabase_target_rls_storage_validation'),
  'orchestrator must keep Supabase target gate',
)
assert(
  report.requiredBeforeEnablement.includes('guarded_worker_runtime_rpc_staging_sql_execution'),
  'orchestrator must keep guarded worker runtime RPC gate',
)
assert(
  report.requiredBeforeEnablement.includes('api_route_runtime_facade_validation'),
  'orchestrator must keep API route facade gate',
)
assert(
  report.requiredBeforeEnablement.includes('approved_snapshot_service_role_persistence_guard'),
  'orchestrator must keep service-role persistence guard gate',
)
assert(report.safety.remoteSupabaseMutation === false, 'Supabase mutation must remain false')
assert(report.safety.sqlExecution === false, 'SQL execution must remain false')
assert(report.safety.workerExecution === false, 'worker execution must remain false')
assert(report.safety.providerModelCall === false, 'provider/model calls must remain false')
assert(report.safety.remotionExecution === false, 'Remotion execution must remain false')
assert(report.safety.signedUrlCreation === false, 'signed URL creation must remain false')
assert(report.safety.publicArtifactCreation === false, 'public artifact creation must remain false')
assert(report.safety.internalBetaUnlock === false, 'internal beta unlock must remain false')
assert(report.safety.productionUnlock === false, 'production unlock must remain false')
assert(!JSON.stringify(report.inputSummary).includes('must_not_appear'), 'secret-like fields must be sanitized')
assertInternalBetaRuntimeReadinessOrchestratorFailClosed(report)

console.log('internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke passed')
