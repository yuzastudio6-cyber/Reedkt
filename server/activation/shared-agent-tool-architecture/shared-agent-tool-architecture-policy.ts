import type { SharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-types'

export const sharedAgentToolArchitectureConfig = {
  phase: '52A',
  basePhase: '50G',
  canonicalPhase50GRunId: 'phase50g-20260604T153331',
  mode: 'shared_agent_tool_ownership_architecture',
  phase52BReadinessWhenPassed: 'ready_for_tool_capability_registry_audit',
} as const

export const sharedAgentToolArchitectureSafetyFlags: SharedAgentToolArchitectureSafetyFlags = {
  architectureDocsOnly: true,
  toolRuntimeExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  providerCallsAllowed: false,
  gcpMutationAllowed: false,
  dockerBuildAllowed: false,
  rawPromptExecutionAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const sharedAgentToolArchitectureRequiredScripts = [
  'activation:shared-agent-tool-architecture:plan',
  'activation:shared-agent-tool-architecture:report',
  'activation:shared-agent-tool:summary',
  'smoke:activation-shared-agent-tool-architecture',
] as const

export const sharedAgentToolArchitectureRequiredDocs = [
  'docs/agents/reeditpro-agent-architecture.md',
  'docs/agents/agent-role-registry.md',
  'docs/agents/tool-ownership-map.md',
  'docs/agents/tool-capability-manifest-schema.md',
  'docs/agents/agent-finding-schema.md',
  'docs/agents/edit-intent-schema.md',
  'docs/agents/approved-plan-snapshot-schema.md',
  'docs/agents/agent-to-tool-routing-policy.md',
  'docs/agents/cross-track-handoff-template.md',
  'docs/agents/agent-qa-policy.md',
  'docs/activation-phase-52a-shared-agent-tool-architecture-results.md',
] as const
