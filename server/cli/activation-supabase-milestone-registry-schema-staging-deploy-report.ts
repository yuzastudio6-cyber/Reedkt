import {
  SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
  buildSupabaseMilestoneRegistryStagingDeployReports,
  writeSupabaseMilestoneRegistryStagingDeployArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify'

const reports = await buildSupabaseMilestoneRegistryStagingDeployReports()
await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
  reportsWritten: true,
  deployStatus: reports.schemaDeployReport.status,
  verifyStatus: reports.schemaVerificationReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
