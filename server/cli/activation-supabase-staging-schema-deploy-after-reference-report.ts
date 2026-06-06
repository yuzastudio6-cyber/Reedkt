import {
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  buildSupabaseStagingSchemaAfterReferenceReports,
  writeSupabaseStagingSchemaAfterReferenceArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

const reports = await buildSupabaseStagingSchemaAfterReferenceReports()
await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  reportsWritten: true,
  readinessStatus: reports.readinessReport.status,
  approvedStagingTargetReference: reports.approvedStagingTargetReferenceLoadedReport.status,
  pluginTargetProof: reports.pluginTargetProofAfterReferenceReport.status,
  deployStatus: reports.schemaDeployAfterReferenceReport.status,
  verifyStatus: reports.schemaVerifyAfterReferenceReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
