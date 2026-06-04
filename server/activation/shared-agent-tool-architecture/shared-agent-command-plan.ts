import type { SharedAgentToolArchitectureCommandPlan } from './shared-agent-tool-architecture-types'

export function buildSharedAgentToolArchitectureCommandPlan(): SharedAgentToolArchitectureCommandPlan {
  return {
    planId: 'phase52a-shared-agent-tool-architecture-command-plan',
    defaultMode: 'static_report_only',
    commands: [
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
