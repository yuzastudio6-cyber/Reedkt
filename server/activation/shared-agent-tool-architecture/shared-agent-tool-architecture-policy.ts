import type { SharedAgentToolArchitectureSafetyFlags } from './shared-agent-tool-architecture-types'

export const sharedAgentToolArchitectureConfig = {
  phase: '52A',
  basePhase: '51D',
  canonicalPhase51DRunId: 'phase51d-20260605T032516',
  mode: 'shared_agent_tool_ownership_architecture',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52a',
  branch: 'codex/rp-activation-52a-shared-agent-tool-ownership-architecture',
  baseBranch: 'codex/rp-activation-51d-automatic-supabase-milestone-sync',
  phase52BReadinessWhenPassed: 'ready_for_tool_capability_registry_audit',
} as const

export const sharedAgentToolArchitectureSafetyFlags: SharedAgentToolArchitectureSafetyFlags = {
  architectureDocsOnly: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  toolRuntimeExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  providerCallsAllowed: false,
  gcpMutationAllowed: false,
  broadGcpMutationAllowed: false,
  cloudRunDeployAllowed: false,
  migrationsAllowed: false,
  historicalBackfillAllowed: false,
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
  'activation:shared-agent-tool-architecture',
  'activation:shared-agent-tool-architecture:plan',
  'activation:shared-agent-tool-architecture:report',
  'activation:shared-agent-tool-architecture:iam-plan',
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
  'docs/agents/source-of-truth-policy.md',
  'docs/agents/cross-track-handoff-template.md',
  'docs/agents/agent-qa-policy.md',
  'docs/activation-phase-52a-shared-agent-tool-architecture-results.md',
] as const

export function makeSharedAgentToolArchitectureRunId(now = new Date()): string {
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
  return `phase52a-${timestamp}`
}

export function sharedAgentToolArchitectureArtifactPrefix(runId: string): string {
  return `${sharedAgentToolArchitectureConfig.artifactPrefixBase}/${runId}`
}

export function validateSharedAgentToolArchitectureExecutionEnv(input: { activeProject?: string }): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== sharedAgentToolArchitectureConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== sharedAgentToolArchitectureConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== sharedAgentToolArchitectureConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_SHARED_AGENT_TOOL_ARCHITECTURE !== 'true') blockers.push('REEDITPRO_CONFIRM_SHARED_AGENT_TOOL_ARCHITECTURE=true is required for Phase 52A execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 52A Supabase milestone sync.')
  if (input.activeProject && input.activeProject !== sharedAgentToolArchitectureConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY === 'true') blockers.push('Phase 52A must not apply migrations; unset REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL === 'true') blockers.push('Phase 52A must not run historical backfill; unset REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL.')
  warnings.push('Execution uploads private architecture JSON and writes exactly one Phase 52A milestone sync bundle.')
  return { ok: blockers.length === 0, blockers, warnings }
}
