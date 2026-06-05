import {
  SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS,
  executeSupabaseMilestoneRegistrySchemaStagingDeploy,
} from '../activation/supabase-milestone-registry-schema'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_schema_deploy_requires_explicit_execute_flag_and_current_shell_confirmations',
    requiredConfirmations: SUPABASE_MILESTONE_REGISTRY_STAGING_CONFIRMATIONS,
    migrationWorkflowOnly: true,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseMilestoneRegistrySchemaStagingDeploy()
console.log(JSON.stringify(result.reports.stagingDeployReport, null, 2))
process.exit(result.exitCode)
