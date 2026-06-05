import {
  buildSupabasePluginStagingDeployReports,
  executeSupabasePluginStagingDeploy,
  writeSupabasePluginStagingDeployArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabasePluginStagingDeployReports()
  await writeSupabasePluginStagingDeployArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaDeployReport,
    reason: 'plugin_staging_schema_deploy_requires_explicit_execute_flag_and_allowed_current_shell_confirmations',
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabasePluginStagingDeploy({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(result.reports.schemaDeployReport, null, 2))
process.exit(result.exitCode)
