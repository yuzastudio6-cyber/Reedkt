import type { AgentToolPlanBridgeCommandPlan } from './agent-tool-plan-bridge-types'

export function buildAgentToolPlanBridgeCommandPlan(): AgentToolPlanBridgeCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync',
    allowedCommands: [
      'npm run activation:agent-tool-plan-bridge:report',
      'npm run activation:agent-tool-plan-bridge:iam-plan',
      'npm run activation:agent-tool-plan:summary',
      'npm run activation:agent-tool-plan-bridge -- --execute',
      'gcloud storage cp private Phase 52D JSON artifacts',
      'one Phase 52D milestone-registry write/readback through Phase 51D/51B utilities',
    ],
    blockedAlways: [
      'tool runtime execution',
      'worker execution',
      'AI model inference',
      'provider calls',
      'media processing',
      'web search',
      'browser capture',
      'map rendering',
      'migrations or schema changes',
      'historical backfill reruns',
      'Docker or Cloud Run mutation',
      'production/external beta/broad media unlock',
    ],
    noToolRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noMigrations: true,
  }
}
