import {
  SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
  buildSupabaseCleanStagingTargetApprovalReports,
  writeSupabaseCleanStagingTargetApprovalArtifacts,
} from '../activation/supabase-clean-staging-target-approval'

const reports = buildSupabaseCleanStagingTargetApprovalReports()
await writeSupabaseCleanStagingTargetApprovalArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
  decision: reports.approvalDecision.decision,
  approvalStatus: reports.approvalDecision.approvalStatus,
  recommendedTarget: reports.approvalDecision.recommendedTarget,
  branchOrProjectCreated: false,
  sqlExecuted: false,
  migrationDeployed: false,
  migrationRepairRun: false,
  trackBBackfillRowsWritten: false,
  supportTicketSubmitted: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
