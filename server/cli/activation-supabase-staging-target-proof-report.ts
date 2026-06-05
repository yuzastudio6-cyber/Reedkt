import {
  SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  buildSupabaseStagingTargetProofReports,
  writeSupabaseStagingTargetProofArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

const reports = await buildSupabaseStagingTargetProofReports()
await writeSupabaseStagingTargetProofArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  reportsWritten: true,
  readinessStatus: reports.readinessReport.status,
  approvedTargetReferenceStatus: reports.approvedTargetReferenceReport.status,
  pluginTargetProofStatus: reports.pluginTargetProofReport.status,
  deployRerunStatus: reports.schemaDeployRerunReport.status,
  verifyStatus: reports.schemaVerifyAfterTargetProofReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
