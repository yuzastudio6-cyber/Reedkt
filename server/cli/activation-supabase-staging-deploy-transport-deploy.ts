import {
  buildSupabaseStagingDeployTransportReports,
  executeSupabaseStagingDeployTransportDeploy,
  writeSupabaseStagingDeployTransportArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabaseStagingDeployTransportReports()
  await writeSupabaseStagingDeployTransportArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaDeployTransportReport,
    reason: 'staging_deploy_transport_requires_explicit_execute_flag_and_allowed_confirmations',
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingDeployTransportDeploy({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(result.reports.schemaDeployTransportReport, null, 2))
process.exit(result.exitCode)
