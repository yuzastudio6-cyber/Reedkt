import {
  SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
  buildSupabaseCleanStagingBranchExecutionReports,
  writeSupabaseCleanStagingBranchExecutionArtifacts,
} from '../activation/supabase-clean-staging-branch-execution'

const reports = buildSupabaseCleanStagingBranchExecutionReports()
await writeSupabaseCleanStagingBranchExecutionArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
  supabaseUpdateStatus: reports.readinessReport.supabaseUpdateStatus,
  branchAction: reports.branchCreationReport.branchAction,
  branchName: reports.readinessReport.branchName,
  branchCreateFailureClass: reports.branchCreateFailureDiagnosticsReport.failureClass,
  deterministicRetryPossible: reports.branchCreateFailureDiagnosticsReport.deterministicRetryPossible,
  branchCreateRetryStrategy: reports.branchCreateRetryStrategyReport.retryStrategy,
  branchCreateRetry: reports.branchCreateRetryReport.status,
  accessTokenSecretDiscovery: reports.accessTokenSecretDiscoveryReport.status,
  accessTokenInjection: reports.accessTokenInjectionReport.status,
  withProductionData: false,
  migrationTransport: reports.migrationTransportReport.status,
  migrationApply: reports.migrationApplyReport.status,
  schemaRlsVerify: reports.schemaRlsVerifyReport.status,
  trackBWrite: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
