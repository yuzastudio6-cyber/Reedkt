import {
  buildSupabaseStagingTargetProofReports,
  executeSupabaseStagingTargetProofDeploy,
  writeSupabaseStagingTargetProofArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabaseStagingTargetProofReports()
  await writeSupabaseStagingTargetProofArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaDeployRerunReport,
    reason: 'staging_target_proof_deploy_rerun_requires_explicit_execute_flag_and_all_allowed_confirmations',
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingTargetProofDeploy({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(result.reports.schemaDeployRerunReport, null, 2))
process.exit(result.exitCode)
