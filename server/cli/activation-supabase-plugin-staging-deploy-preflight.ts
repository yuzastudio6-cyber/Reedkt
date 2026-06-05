import {
  buildSupabasePluginStagingDeployReports,
  writeSupabasePluginStagingDeployArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

const reports = await buildSupabasePluginStagingDeployReports()
await writeSupabasePluginStagingDeployArtifacts(reports)

console.log(JSON.stringify({
  status: reports.targetPreflightReport.status,
  reportDir: 'docs/activation-supabase-plugin-staging-deploy-reports',
  targetPreflight: reports.targetPreflightReport,
  schemaState: reports.schemaStateReport.status,
  rlsState: reports.rlsStateReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
