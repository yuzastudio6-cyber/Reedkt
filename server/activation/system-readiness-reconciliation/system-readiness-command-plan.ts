import type { SystemReadinessCommandPlan } from './system-readiness-reconciliation-types'

export function buildSystemReadinessCommandPlan(): SystemReadinessCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_reconciliation_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'npm run activation:system-readiness-reconciliation:report',
      'npm run activation:system-readiness-reconciliation:iam-plan',
      'npm run activation:system-readiness:summary',
      'npm run activation:system-readiness-reconciliation -- --execute',
    ],
    blockedAlways: ['tool runtime execution', 'worker execution', 'model inference', 'provider calls', 'web search', 'browser capture', 'map rendering', 'Docker build/push', 'Cloud Run deploy', 'Supabase migrations/schema/RLS changes', 'historical backfill'],
    noToolRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noMigrations: true,
    noHistoricalBackfill: true,
  }
}
