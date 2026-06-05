import {
  SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_CONFIRMATIONS,
  buildSupabaseMilestoneRegistryStagingDeployReports,
  executeSupabaseMilestoneRegistryStagingDeploy,
  writeSupabaseMilestoneRegistryStagingDeployArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabaseMilestoneRegistryStagingDeployReports()
  await writeSupabaseMilestoneRegistryStagingDeployArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaDeployReport,
    reason: 'staging_schema_deploy_requires_explicit_execute_flag_and_current_shell_confirmations',
    requiredConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseMilestoneRegistryStagingDeploy({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(result.reports.schemaDeployReport, null, 2))
process.exit(result.exitCode)
