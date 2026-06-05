import type { MultiAgentDryRunSafetyFlags } from './multi-agent-dry-run-types'

export const multiAgentDryRunConfig = {
  phase: '52C',
  mode: 'multi_agent_dry_run_existing_evidence',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  basePhase: '52B',
  canonicalPhase52ARunId: 'phase52a-20260605T111515',
  canonicalPhase52BRunId: 'phase52b-20260605T121905',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52c',
  branch: 'codex/rp-activation-52c-multi-agent-dry-run-existing-evidence',
  baseBranch: 'codex/rp-activation-52b-tool-capability-registry-audit',
} as const

export const multiAgentDryRunSafetyFlags: MultiAgentDryRunSafetyFlags = {
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
  dryRunOnly: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  toolRuntimeExecutionAllowed: false,
  workerExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  browserCaptureAllowed: false,
  mapRenderingAllowed: false,
  gcpRuntimeMutationAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  schemaChangesAllowed: false,
}

export const multiAgentDryRunRequiredScripts = [
  'activation:multi-agent-dry-run',
  'activation:multi-agent-dry-run:report',
  'activation:multi-agent-dry-run:iam-plan',
  'activation:multi-agent:summary',
  'smoke:activation-multi-agent-dry-run',
] as const

export const multiAgentDryRunRequiredDocs = [
  'docs/agents/multi-agent-dry-run-runbook.md',
  'docs/agents/multi-agent-dry-run-policy.md',
  'docs/agents/multi-agent-dry-run-qa-policy.md',
  'docs/activation-phase-52c-multi-agent-dry-run-results.md',
] as const

export function makeMultiAgentDryRunRunId(date = new Date()): string {
  return `phase52c-${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function multiAgentDryRunArtifactPrefix(runId: string): string {
  return `${multiAgentDryRunConfig.artifactPrefixBase}/${runId}`
}

export function validateMultiAgentDryRunExecutionEnv(input: { activeProject?: string } = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== multiAgentDryRunConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== multiAgentDryRunConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== multiAgentDryRunConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_MULTI_AGENT_DRY_RUN !== 'true') blockers.push('REEDITPRO_CONFIRM_MULTI_AGENT_DRY_RUN=true is required for Phase 52C execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 52C Supabase milestone sync.')
  if (input.activeProject && input.activeProject !== multiAgentDryRunConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
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
  ]) {
    if (process.env[flag] === 'true') blockers.push(`${flag} must remain false or unset in Phase 52C.`)
  }
  if (!input.activeProject) warnings.push('Active gcloud project was not available during static validation.')
  return { ok: blockers.length === 0, blockers, warnings }
}
