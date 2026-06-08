import {
  SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
  buildSupabaseMigrationHistoryRepairApprovalReports,
  writeSupabaseMigrationHistoryRepairApprovalArtifacts,
} from '../activation/supabase-migration-history-repair-approval'

const reports = buildSupabaseMigrationHistoryRepairApprovalReports()
await writeSupabaseMigrationHistoryRepairApprovalArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
  reportsWritten: true,
  decision: reports.approvalDecision.decision,
  readinessStatus: reports.readinessReport.status,
  repairVersionCount: reports.repairCandidatePlan.repairVersions.length,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
