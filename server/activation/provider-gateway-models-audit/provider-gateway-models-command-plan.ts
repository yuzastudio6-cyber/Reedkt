import type { ProviderModelsAuditCommandPlan } from './provider-gateway-models-audit-types'

export function buildProviderModelsAuditCommandPlan(): ProviderModelsAuditCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'npm run activation:provider-gateway-models-audit:report',
      'npm run activation:provider-gateway-models-audit:iam-plan',
      'npm run activation:provider-gateway-models-audit -- --execute',
    ],
    blockedAlways: [
      'DeepSeek provider calls',
      'Qwen provider calls',
      'provider secret creation or value reads',
      'tool runtime execution',
      'worker execution',
      'model inference',
      'media processing',
      'web search',
      'browser capture',
      'map rendering',
      'Docker or Cloud Run mutation',
      'SQL migrations',
      'schema/RLS/Data API changes',
      'production/external beta/paid production/broad media unlocks',
    ],
    noProviderCalls: true,
    noRuntimeExecution: true,
  }
}
