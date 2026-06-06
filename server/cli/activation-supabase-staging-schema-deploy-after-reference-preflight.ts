import {
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  buildSupabaseStagingSchemaAfterReferenceReports,
  writeSupabaseStagingSchemaAfterReferenceArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

const reports = await buildSupabaseStagingSchemaAfterReferenceReports()
await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)

console.log(JSON.stringify({
  status: reports.pluginTargetProofAfterReferenceReport.status,
  reportDir: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  approvedStagingTargetReference: reports.approvedStagingTargetReferenceLoadedReport.status,
  pluginTargetProof: reports.pluginTargetProofAfterReferenceReport.status,
  deployStrategy: reports.deployStrategyAfterReferenceReport.status,
  deployStatus: reports.schemaDeployAfterReferenceReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
