import type { ToolCapabilityRegistryCommandPlan } from './tool-capability-registry-types'

export function buildToolCapabilityRegistryCommandPlan(): ToolCapabilityRegistryCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_and_supabase_registry_sync',
    allowedCommands: [
      'npm run activation:tool-capability-registry-audit:report',
      'npm run activation:tool-capability-registry-audit:iam-plan',
      'npm run activation:tool-capability-registry:summary',
      'npm run activation:tool-capability-registry-audit -- --execute',
    ],
    blockedAlways: [
      'tool runtime execution',
      'AI model inference',
      'media processing',
      'web search',
      'map rendering',
      'browser capture',
      'provider calls',
      'Docker build or push',
      'Cloud Run deploy',
      'Supabase migration or schema change',
      'historical backfill rerun',
      'production/external beta/broad media unlock',
    ],
    noMigrationCommands: true,
    noToolRuntimeExecution: true,
  }
}
