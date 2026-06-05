import {
  SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
  buildSupabasePluginStagingDeployReports,
  writeSupabasePluginStagingDeployArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

const reports = await buildSupabasePluginStagingDeployReports()
await writeSupabasePluginStagingDeployArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
  reportsWritten: true,
  targetStatus: reports.targetPreflightReport.status,
  deployStatus: reports.schemaDeployReport.status,
  verifyStatus: reports.schemaVerifyReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
