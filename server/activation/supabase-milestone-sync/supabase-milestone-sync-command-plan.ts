import type { SupabaseMilestoneSyncCommandPlan } from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncCommandPlan(): SupabaseMilestoneSyncCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executeCommand: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true npm run activation:supabase-milestone-sync -- --execute',
    applyMigrations: false,
    historicalBackfill: false,
    writes: 'phase51d_self_sync_only',
    blockedCommands: [
      'supabase migration apply',
      'supabase db reset',
      'psql migration execution',
      'historical activation backfill rerun',
      'provider execution',
      'production/external beta unlock',
      'public artifact publication',
    ],
  }
}
