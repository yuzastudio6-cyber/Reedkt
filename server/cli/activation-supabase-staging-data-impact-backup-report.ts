import {
  SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
  buildSupabaseStagingDataImpactBackupReports,
  writeSupabaseStagingDataImpactBackupArtifacts,
} from '../activation/supabase-staging-data-impact-backup'

const reports = buildSupabaseStagingDataImpactBackupReports()
await writeSupabaseStagingDataImpactBackupArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
  reportsWritten: true,
  decision: reports.approvalDecision.decision,
  liveStagingInspection: reports.readonlyInspection.status,
  dataImpact: reports.dataImpactInventory.status,
  backupSnapshot: reports.backupSnapshotPlan.status,
  ownerAcceptance: reports.ownerAcceptance.status,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
