import {
  SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  buildSupabaseStagingTargetProofReports,
  writeSupabaseStagingTargetProofArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

const reports = await buildSupabaseStagingTargetProofReports()
await writeSupabaseStagingTargetProofArtifacts(reports)

console.log(JSON.stringify({
  status: reports.pluginTargetProofReport.status,
  reportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  approvedTargetReference: reports.approvedTargetReferenceReport.status,
  pluginTargetProof: reports.pluginTargetProofReport.status,
  deployStrategy: reports.deployStrategyReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
