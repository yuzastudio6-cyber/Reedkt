import {
  SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_CONFIRMATION,
  SUPABASE_REMOTE_SCHEMA_READONLY_CONFIRMATION,
  SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION,
  executeSupabaseRemoteSchemaEquivalenceReview,
  readSupabaseRemoteSchemaEquivalenceSummary,
} from '../activation/supabase-remote-schema-equivalence'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'remote_schema_equivalence_execution_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_CONFIRMATION,
      SUPABASE_REMOTE_SCHEMA_READONLY_CONFIRMATION,
      SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION,
    ],
    readOnlyCatalogIntrospection: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseRemoteSchemaEquivalenceReview({
  readonlyMode: process.argv.includes('--readonly'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseRemoteSchemaEquivalenceSummary(), null, 2))
process.exit(result.exitCode)
