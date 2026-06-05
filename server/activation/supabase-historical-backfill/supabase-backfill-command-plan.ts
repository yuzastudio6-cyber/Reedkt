import type { SupabaseHistoricalBackfillCommandPlan } from './supabase-historical-backfill-types'

export function buildSupabaseHistoricalBackfillCommandPlan(): SupabaseHistoricalBackfillCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_supabase_historical_backfill',
    allowedCommands: [
      'npm run activation:supabase-historical-backfill:report',
      'npm run activation:supabase-historical-backfill:iam-plan',
      'npm run smoke:activation-supabase-historical-backfill',
      'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL=true npm run activation:supabase-historical-backfill -- --execute',
    ],
    blockedAlways: [
      'Supabase migrations, schema mutation, RLS mutation, lifecycle commands, db reset, and broad SQL execution.',
      'Rerunning media processing, web search, map rendering, browser capture, AI/model/runtime jobs, providers, Docker, or deployment.',
      'Storing secrets, raw provider responses, Brave snippets, signed URLs, public artifact URLs, large blobs, or media blobs in Supabase.',
      'Production, external beta, paid production, broad media, public artifacts, frontend service-role exposure, or raw prompt execution unlocks.',
    ],
    blockers: [],
    warnings: ['Execution writes only historical activation milestone metadata into Phase 51B registry tables after explicit confirmation.'],
  }
}
