import type { CrossWorkstreamCommandPlan } from './cross-workstream-handoff-types'

export function buildCrossWorkstreamHandoffCommandPlan(): CrossWorkstreamCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_handoff_tracking_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'static report and summary CLIs',
      'confirmed Phase 52H artifact upload to private GCS prefixes',
      'one Phase 52H Supabase milestone sync write/readback through Phase 51D/51B path',
    ],
    blockedAlways: [
      'owner prompt execution',
      'tool/runtime execution',
      'worker execution',
      'model inference',
      'media processing',
      'web search',
      'browser capture',
      'map rendering',
      'provider calls',
      'Docker build/push',
      'Cloud Run deploy',
      'Supabase migrations/schema/RLS changes',
      'historical backfill',
      'public artifacts',
      'production/external beta/broad media unlock',
    ],
    noOwnerPromptExecution: true,
    noToolRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noMigrations: true,
    noHistoricalBackfill: true,
  }
}
