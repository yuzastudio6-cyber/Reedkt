import type { ProviderModelApprovalCommandPlan } from './provider-model-approval-types'

export function buildProviderModelApprovalCommandPlan(): ProviderModelApprovalCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync',
    allowedCommands: [
      'npm run smoke:activation-provider-model-approval-policy',
      'npm run activation:provider-model-approval-policy:report',
      'npm run activation:provider-model-approval-policy:iam-plan',
      'npm run activation:provider-model-approval:summary',
      'npm run activation:provider-model-approval-policy -- --execute',
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
      'public artifacts',
      'raw prompt execution',
      'signed URLs as source of truth',
    ],
    noProviderCalls: true,
    noRuntimeExecution: true,
  }
}
