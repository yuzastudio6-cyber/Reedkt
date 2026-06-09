import {
  SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION,
  SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION,
  SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION,
  SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION,
  SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION,
  executeSupabaseStagingDataImpactBackup,
  readSupabaseStagingDataImpactBackupSummary,
} from '../activation/supabase-staging-data-impact-backup'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_data_impact_backup_packet_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION,
      SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION,
      SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION,
    ],
    ownerAcceptanceConfirmations: [
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION,
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION,
    ],
    safeExecutionModes: [
      '--readonly',
      '--accept-owner-risk',
    ],
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingDataImpactBackup({
  readonlyMode: process.argv.includes('--readonly'),
  acceptOwnerRisk: process.argv.includes('--accept-owner-risk'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseStagingDataImpactBackupSummary(), null, 2))
process.exit(result.exitCode)
