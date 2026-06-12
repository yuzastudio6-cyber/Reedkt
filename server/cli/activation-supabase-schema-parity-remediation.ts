import {
  SUPABASE_SCHEMA_PARITY_REMEDIATION_CONFIRMATION,
  SUPABASE_STAGING_DRIFT_ANALYSIS_CONFIRMATION,
  executeSupabaseSchemaParityRemediation,
  readSupabaseSchemaParityRemediationSummary,
} from '../activation/supabase-schema-parity-remediation'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'schema_parity_remediation_strategy_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_SCHEMA_PARITY_REMEDIATION_CONFIRMATION,
      SUPABASE_STAGING_DRIFT_ANALYSIS_CONFIRMATION,
    ],
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseSchemaParityRemediation({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseSchemaParityRemediationSummary(), null, 2))
process.exit(result.exitCode)
