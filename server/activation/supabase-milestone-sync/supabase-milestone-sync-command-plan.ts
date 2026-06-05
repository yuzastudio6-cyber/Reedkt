import type { SupabaseMilestoneSyncCommandPlan } from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncCommandPlan(): SupabaseMilestoneSyncCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_single_self_sync_write',
    allowedCommands: [
      'npm run activation:supabase-milestone-sync:report',
      'npm run activation:supabase-milestone-sync:iam-plan',
      'npm run activation:supabase-milestone-sync -- --execute',
      'gcloud storage cp <local-private-json> gs://<private-bucket>/activation-supabase/phase51d/<runId>/...',
    ],
    blockedAlways: [
      'supabase migrations apply/reset/db reset',
      'psql migration or schema mutation commands',
      'historical backfill reruns',
      'provider calls or media processing',
      'public artifact or signed URL generation',
      'production/external beta/broad media unlocks',
    ],
    noMigrationCommands: true,
    noBackfillRerun: true,
    blockers: [],
    warnings: ['Report/IAM modes are static and do not resolve secrets or write to Supabase.'],
  }
}
