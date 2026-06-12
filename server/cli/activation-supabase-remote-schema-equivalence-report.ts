import {
  SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
  buildSupabaseRemoteSchemaEquivalenceReports,
  writeSupabaseRemoteSchemaEquivalenceArtifacts,
} from '../activation/supabase-remote-schema-equivalence'

const reports = buildSupabaseRemoteSchemaEquivalenceReports()
await writeSupabaseRemoteSchemaEquivalenceArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
  reportsWritten: true,
  decision: reports.migrationHistoryRepairApprovalAfterEquivalenceReview.decision,
  overallEquivalence: reports.remoteSchemaEquivalenceComparisonReport.overallEquivalence,
  remoteIntrospectionStatus: reports.remoteStagingSchemaIntrospectionReport.status,
  blockers: reports.remoteSchemaEquivalenceBlockerReport.activeBlockers,
}, null, 2))
