import type { SharedAgentToolArchitectureCommandPlan } from './shared-agent-tool-architecture-types'

export function buildSharedAgentToolArchitectureCommandPlan(): SharedAgentToolArchitectureCommandPlan {
  return {
    planId: 'phase52a-shared-agent-tool-architecture-command-plan',
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_and_supabase_sync',
    commands: [
      {
        commandId: 'execute',
        command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SHARED_AGENT_TOOL_ARCHITECTURE=true REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true npm run activation:shared-agent-tool-architecture -- --execute',
        mutating: 'guarded_private_artifact_and_milestone_write',
        description: 'Guarded Phase 52A execution: upload private JSON artifacts and write/read back one Supabase milestone record.',
      },
      {
        commandId: 'plan',
        command: 'npm run activation:shared-agent-tool-architecture:plan',
        mutating: false,
        description: 'Print the static Phase 52A command and architecture plan.',
      },
      {
        commandId: 'report',
        command: 'npm run activation:shared-agent-tool-architecture:report',
        mutating: false,
        description: 'Print the static Phase 52A architecture report.',
      },
      {
        commandId: 'summary',
        command: 'npm run activation:shared-agent-tool:summary',
        mutating: false,
        description: 'Print concise agent and ownership summary.',
      },
      {
        commandId: 'iam-plan',
        command: 'npm run activation:shared-agent-tool-architecture:iam-plan',
        mutating: false,
        description: 'Print report-only storage and Supabase milestone sync IAM expectations.',
      },
    ],
    blockedAlways: [
      'tool runtime execution',
      'AI model inference',
      'media processing',
      'web search',
      'map rendering',
      'browser capture',
      'provider calls',
      'GCP mutation',
      'Docker build/push',
      'raw prompt execution',
      'public artifacts',
      'production/external beta/broad media unlock',
    ],
  }
}
