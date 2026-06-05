import type { MultiAgentDryRunCommandPlan } from './multi-agent-dry-run-types'

export function buildMultiAgentDryRunCommandPlan(): MultiAgentDryRunCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync',
    allowedCommands: [
      'npm run smoke:activation-multi-agent-dry-run',
      'npm run activation:multi-agent-dry-run:report',
      'npm run activation:multi-agent-dry-run:iam-plan',
      'npm run activation:multi-agent:summary',
      'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_MULTI_AGENT_DRY_RUN=true REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true npm run activation:multi-agent-dry-run -- --execute',
    ],
    blockedAlways: [
      'tool or worker runtime execution',
      'AI model inference',
      'provider calls',
      'web search or browser capture',
      'map rendering or media processing',
      'Docker build/push',
      'Cloud Run deploy',
      'Supabase migrations, schema changes, or historical backfill reruns',
      'production, external beta, paid production, or broad media unlock',
      'public artifacts, signed URL source-of-truth, or raw prompt execution',
    ],
    noToolRuntimeExecution: true,
    noProviderCalls: true,
    noMigrations: true,
  }
}
