import {
  SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
  buildSupabaseSchemaParityRemediationReports,
  writeSupabaseSchemaParityRemediationArtifacts,
} from '../activation/supabase-schema-parity-remediation'

const reports = buildSupabaseSchemaParityRemediationReports()
await writeSupabaseSchemaParityRemediationArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
  reportsWritten: true,
  decision: reports.decision.decision,
  selectedStrategy: reports.recommendedStrategy.selectedStrategy,
  missingEffects: reports.missingEffectInventory.nonEquivalentMigrationCount,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
