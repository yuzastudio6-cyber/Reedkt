import {
  buildSupabaseStagingSchemaAfterReferenceReports,
  executeSupabaseStagingSchemaAfterReferenceVerify,
  writeSupabaseStagingSchemaAfterReferenceArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

if (!process.argv.includes('--execute')) {
  const reports = await buildSupabaseStagingSchemaAfterReferenceReports()
  await writeSupabaseStagingSchemaAfterReferenceArtifacts(reports)
  console.log(JSON.stringify({
    ...reports.schemaVerifyAfterReferenceReport,
    reason: 'after_reference_staging_schema_verify_requires_explicit_execute_flag_and_allowed_confirmation',
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingSchemaAfterReferenceVerify()
console.log(JSON.stringify({
  schemaVerify: result.reports.schemaVerifyAfterReferenceReport,
  rlsVerify: result.reports.rlsVerifyAfterReferenceReport,
}, null, 2))
process.exit(result.exitCode)
