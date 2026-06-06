import {
  buildSupabaseStagingSchemaAfterReferenceReports,
  executeSupabaseStagingSchemaAfterReferenceDeploy,
  writeSupabaseStagingSchemaAfterReferenceArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabaseStagingSchemaAfterReferenceReports()
  await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaDeployAfterReferenceReport,
    reason: 'after_reference_staging_schema_deploy_requires_explicit_execute_flag_and_allowed_confirmations',
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingSchemaAfterReferenceDeploy({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(result.reports.schemaDeployAfterReferenceReport, null, 2))
process.exit(result.exitCode)
