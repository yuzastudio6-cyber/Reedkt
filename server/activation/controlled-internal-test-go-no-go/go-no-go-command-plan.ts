import type { GoNoGoCommandPlan } from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoCommandPlan(): GoNoGoCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_go_no_go_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'static report and IAM plan generation',
      'confirmed Phase 52G artifact upload to private GCS',
      'confirmed single Phase 52G milestone sync through Phase 51D/51B registry path',
      'readback verification of the Phase 52G activation run',
    ],
    blockedAlways: [
      'tool, worker, model, provider, media, web search, browser capture, or map execution',
      'Docker build/push or Cloud Run deploy',
      'Supabase migrations, schema/RLS changes, historical backfill, or unrelated product writes',
      'public artifacts, signed URLs as source of truth, production, external beta, paid production, or broad media',
    ],
    noToolRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noMigrations: true,
    noHistoricalBackfill: true,
  }
}
