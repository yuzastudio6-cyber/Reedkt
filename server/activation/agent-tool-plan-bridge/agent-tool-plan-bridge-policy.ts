import type { AgentToolPlanBridgeConfig, AgentToolPlanBridgeSafetyFlags } from './agent-tool-plan-bridge-types'

export const agentToolPlanBridgeConfig: AgentToolPlanBridgeConfig = {
  phase: '52D',
  mode: 'agent_to_tool_plan_bridge_existing_evidence',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52CRunId: 'phase52c-20260605T134904',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52d',
  branch: 'codex/rp-activation-52d-agent-to-tool-plan-bridge',
  baseBranch: 'codex/rp-activation-52c-multi-agent-dry-run-existing-evidence',
}

export const agentToolPlanBridgeSafetyFlags: AgentToolPlanBridgeSafetyFlags = {
  writesAllowed: true,
  migrationsAllowed: false,
  historicalBackfillAllowed: false,
  productRowWritesAllowed: false,
  providerCallsAllowed: false,
  frontendServiceRoleExposureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  repoAuditRequired: true,
  candidatePlanGenerationAllowed: true,
  crossTrackHandoffGenerationAllowed: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  supabaseWritesLimitedToPhase52D: true,
  toolRuntimeAllowed: false,
  workerExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  approvedPlanSnapshotExecutionAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  schemaChangesAllowed: false,
}

export const agentToolPlanBridgeRequiredScripts = [
  'activation:agent-tool-plan-bridge',
  'activation:agent-tool-plan-bridge:report',
  'activation:agent-tool-plan-bridge:iam-plan',
  'activation:agent-tool-plan:summary',
  'smoke:activation-agent-tool-plan-bridge',
] as const

export const agentToolPlanBridgeRequiredDocs = [
  'docs/agents/agent-tool-plan-bridge-runbook.md',
  'docs/agents/agent-tool-plan-bridge-policy.md',
  'docs/agents/agent-tool-plan-bridge-qa-policy.md',
  'docs/activation-phase-52d-agent-tool-plan-bridge-results.md',
] as const

export function makeAgentToolPlanBridgeRunId(date = new Date()): string {
  return `phase52d-${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function agentToolPlanBridgeArtifactPrefix(runId: string): string {
  return `${agentToolPlanBridgeConfig.artifactPrefixBase}/${runId}`
}

export function validateAgentToolPlanBridgeEnv(input: { activeProject?: string } = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== agentToolPlanBridgeConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== agentToolPlanBridgeConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== agentToolPlanBridgeConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_AGENT_TO_TOOL_PLAN_BRIDGE !== 'true') blockers.push('REEDITPRO_CONFIRM_AGENT_TO_TOOL_PLAN_BRIDGE=true is required for Phase 52D execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 52D Supabase milestone sync.')
  if (input.activeProject && input.activeProject !== agentToolPlanBridgeConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const flag of [
    'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY',
    'REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL',
    'REEDITPRO_PRODUCTION_READY',
    'REEDITPRO_EXTERNAL_BETA_READY',
    'REEDITPRO_PAID_PRODUCTION_READY',
    'REEDITPRO_BROAD_MEDIA_READY',
    'REEDITPRO_ENABLE_PROVIDER_EXECUTION',
    'REEDITPRO_ENABLE_TOOL_RUNTIME_EXECUTION',
    'REEDITPRO_ENABLE_WORKER_EXECUTION',
    'REEDITPRO_ENABLE_PUBLIC_ARTIFACTS',
    'REEDITPRO_ENABLE_RAW_PROMPT_EXECUTION',
    'REEDITPRO_ENABLE_WEB_SEARCH',
    'REEDITPRO_ENABLE_MAP_RENDERING',
    'REEDITPRO_ENABLE_BROWSER_CAPTURE',
  ]) {
    if (process.env[flag] === 'true') blockers.push(`${flag} must remain false or unset in Phase 52D.`)
  }
  if (!input.activeProject) warnings.push('Active gcloud project was not available during static validation.')
  return { ok: blockers.length === 0, blockers, warnings }
}
