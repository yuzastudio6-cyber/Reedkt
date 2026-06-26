import {
  INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_COMPONENTS,
  assertInternalBetaRuntimeReadinessOrchestratorFailClosed,
  createInternalBetaRuntimeReadinessOrchestratorReport,
} from '../services/internal-beta-runtime-readiness-orchestrator'
import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const supabaseCredentialContext = createInternalBetaSupabaseCredentialContextContract({})

const report = createInternalBetaRuntimeReadinessOrchestratorReport({
  workspaceId: 'workspace_smoke_internal_beta_runtime_readiness',
  projectId: 'project_smoke_internal_beta_runtime_readiness',
  userId: 'user_smoke_internal_beta_runtime_readiness',
  requestId: 'request_smoke_internal_beta_runtime_readiness',
  supabaseCredentialContext,
  payload: {
    safe: true,
    serviceRoleKey: 'must_not_appear',
    token: 'must_not_appear',
    signedUrl: 'must_not_appear',
  },
})

assert(report.ok === false, 'readiness orchestrator must fail closed')
assert(
  report.status === 'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'readiness orchestrator status mismatch',
)
assert(report.internalBetaEndToEndReady === false, 'internal beta must not be ready')
assert(report.productReadyEndToEndLocalOssTools === 0, 'product-ready local OSS tools must remain 0')
assert(report.componentCounts.serviceRoleRuntime === 8, 'service-role runtime count mismatch')
assert(report.componentCounts.creditLedgerRuntime === 6, 'credit ledger count mismatch')
assert(report.componentCounts.jobQueueRuntime === 8, 'job queue count mismatch')
assert(report.componentCounts.privateArtifactManifest === 8, 'private artifact manifest count mismatch')
assert(report.componentCounts.remotionRenderWorker === 8, 'Remotion render worker count mismatch')
assert(report.componentCounts.providerAdapter === 8, 'provider adapter count mismatch')
assert(report.componentCounts.total === 46, 'total disabled operation count mismatch')
assert(report.localEvidenceCounts.localE2EChainSmoke === 1, 'local E2E chain evidence count mismatch')
assert(report.localEvidenceCounts.total === 1, 'local evidence total count mismatch')
assert(report.componentSummaries.length === 46, 'component summaries must include every disabled operation')
assert(report.localE2EChainSmoke.ok === true, 'local E2E chain evidence must pass locally')
assert(
  report.localE2EChainSmoke.status === 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'local E2E chain evidence status mismatch',
)
assert(report.localE2EChainSmoke.localOnly === true, 'local E2E chain evidence must remain local-only')
assert(report.localE2EChainSmoke.persistedToSupabase === false, 'local E2E chain evidence must not persist to Supabase')
assert(report.localE2EChainSmoke.internalBetaEndToEndReady === false, 'local E2E chain evidence must not unlock beta')
assert(report.localE2EChainSmoke.stepSummary.approvedSnapshot === true, 'local E2E approved snapshot step mismatch')
assert(report.localE2EChainSmoke.stepSummary.creditReservation === true, 'local E2E credit reservation step mismatch')
assert(report.localE2EChainSmoke.stepSummary.jobQueue === true, 'local E2E job queue step mismatch')
assert(report.localE2EChainSmoke.stepSummary.privateArtifactManifest === true, 'local E2E artifact manifest step mismatch')
assert(report.localE2EChainSmoke.stepSummary.privateArtifactAccessPolicy === true, 'local E2E artifact access step mismatch')
assert(
  report.localE2EChainSmoke.stepSummary.remotionPrivatePreviewExportMetadata === true,
  'local E2E Remotion metadata step mismatch',
)
assert(report.localE2EChainSmoke.stepSummary.qaCleanupObservability === true, 'local E2E QA cleanup step mismatch')
assert(
  report.localE2EChainSmoke.requiredBeforeInternalBeta.includes('confirmed_supabase_target_rls_storage_validation'),
  'local E2E evidence must preserve Supabase target gate',
)
assert(
  report.supabaseCredentialContext.decision ===
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'credential context decision mismatch',
)
assert(
  report.supabaseCredentialContext.execution === 'blocked_no_remote_execution_missing_safe_credential_context',
  'credential context execution mismatch',
)
assert(
  report.supabaseCredentialContext.credentialPresence.supabaseAccessToken === false,
  'credential context access token presence must be false for empty env',
)
assert(
  report.supabaseCredentialContext.credentialPresence.readonlyDatabaseUrl === false,
  'credential context read-only DB URL presence must be false for empty env',
)
assert(
  INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_COMPONENTS.every(
    (component) => report.componentStatuses[component].length === 1,
  ),
  'each component class must have one disabled status',
)
assert(report.unsafeExecutionDetected === false, 'unsafe execution must not be detected')
assert(report.safety.remoteSupabaseMutation === false, 'remote Supabase mutation must remain false')
assert(report.safety.sqlExecution === false, 'SQL execution must remain false')
assert(report.safety.serviceRoleRouteExecution === false, 'service-role route execution must remain false')
assert(report.safety.workerExecution === false, 'worker execution must remain false')
assert(report.safety.workerDispatch === false, 'worker dispatch must remain false')
assert(report.safety.providerModelCall === false, 'provider/model call must remain false')
assert(report.safety.modelCall === false, 'model call must remain false')
assert(report.safety.secretPayloadAccess === false, 'secret payload access must remain false')
assert(report.safety.rawPromptExecution === false, 'raw prompt execution must remain false')
assert(report.safety.remotionExecution === false, 'Remotion execution must remain false')
assert(report.safety.ffmpegExecution === false, 'FFmpeg execution must remain false')
assert(report.safety.ffprobeExecution === false, 'FFprobe execution must remain false')
assert(report.safety.mediaProcessing === false, 'media processing must remain false')
assert(report.safety.renderExportExecution === false, 'render/export execution must remain false')
assert(report.safety.storageWrite === false, 'storage write must remain false')
assert(report.safety.storageRead === false, 'storage read must remain false')
assert(report.safety.signedUrlCreation === false, 'signed URL creation must remain false')
assert(report.safety.publicArtifactCreation === false, 'public artifact creation must remain false')
assert(report.safety.creditMutation === false, 'credit mutation must remain false')
assert(report.safety.internalBetaUnlock === false, 'internal beta unlock must remain false')
assert(report.safety.externalBetaUnlock === false, 'external beta unlock must remain false')
assert(report.safety.productionUnlock === false, 'production unlock must remain false')
assert(report.requiredBeforeEnablement.includes('confirmed_supabase_target_rls_storage_validation'), 'missing target gate')
assert(report.requiredBeforeEnablement.includes('approved_supabase_credential_context_present'), 'missing credential context gate')
assert(report.requiredBeforeEnablement.includes('guarded_worker_runtime_rpc_staging_sql_execution'), 'missing RPC gate')
assert(!JSON.stringify(report.inputSummary).includes('must_not_appear'), 'secret-like fields must be sanitized')
assertInternalBetaRuntimeReadinessOrchestratorFailClosed(report)

console.log('internal-beta-runtime-readiness-orchestrator-smoke passed')
