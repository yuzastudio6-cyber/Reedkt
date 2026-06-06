import type { RuntimeUnlockCommandPlan } from './runtime-unlock-roadmap-types'

export function buildRuntimeUnlockCommandPlan(): RuntimeUnlockCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'npm run activation:runtime-unlock-roadmap:report',
      'npm run activation:runtime-unlock-roadmap:iam-plan',
      'npm run activation:runtime-unlock-roadmap -- --execute',
    ],
    blockedAlways: [
      'tool runtime execution',
      'worker execution',
      'model inference',
      'provider calls',
      'media processing',
      'web search',
      'browser capture',
      'map rendering',
      'Docker or Cloud Run mutation',
      'SQL migrations',
      'schema/RLS changes',
      'production/external beta/paid production/broad media unlocks',
    ],
    noRuntimeExecution: true,
  }
}
