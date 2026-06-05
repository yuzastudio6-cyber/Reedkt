import type { ApprovedPlanValidationConfig, ApprovedPlanValidationSafetyFlags } from './approved-plan-validation-types'

export const approvedPlanValidationConfig: ApprovedPlanValidationConfig = {
  phase: '52E',
  mode: 'approved_plan_snapshot_validation_system_reconciliation',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52DRunId: 'phase52d-20260605T164423',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52e',
  sourcePhase52DGeneratedPrefix: 'activation-agents/phase52d/phase52d-20260605T164423',
  sourcePhase52DQaPrefix: 'activation-agents/phase52d/phase52d-20260605T164423',
  branch: 'codex/rp-activation-52e-approved-plan-snapshot-validation-system-reconciliation',
  baseBranch: 'codex/rp-activation-52d-agent-to-tool-plan-bridge',
}

export const approvedPlanValidationSafetyFlags: ApprovedPlanValidationSafetyFlags = {
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
  candidatePlanValidationAllowed: true,
  systemReconciliationAllowed: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  supabaseWritesLimitedToPhase52E: true,
  candidatePlanGenerationAllowed: false,
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

export const approvedPlanValidationRequiredScripts = [
  'activation:approved-plan-snapshot-validation',
  'activation:approved-plan-snapshot-validation:report',
  'activation:approved-plan-snapshot-validation:iam-plan',
  'activation:approved-plan:summary',
  'smoke:activation-approved-plan-snapshot-validation',
] as const

export const approvedPlanValidationRequiredDocs = [
  'docs/agents/approved-plan-snapshot-validation-runbook.md',
  'docs/agents/approved-plan-snapshot-validation-policy.md',
  'docs/agents/approved-plan-snapshot-validation-qa-policy.md',
  'docs/activation-phase-52e-approved-plan-snapshot-validation-results.md',
] as const

export const approvedPlanValidationBlockedFeatures = [
  'candidate approved-plan snapshot execution',
  'tool runtime execution',
  'worker execution',
  'direct agent-to-tool execution',
  'model inference',
  'media processing',
  'web search execution',
  'browser capture',
  'map rendering',
  'provider calls',
  'Docker build or Cloud Run deploy',
  'Supabase migrations or schema/RLS changes',
  'historical backfill rerun',
  'production/external beta/paid production/broad media',
  'public artifacts and signed URL source of truth',
  'raw prompt execution',
] as const

export function makeApprovedPlanValidationRunId(date = new Date()): string {
  return `phase52e-${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function approvedPlanValidationArtifactPrefix(runId: string): string {
  return `${approvedPlanValidationConfig.artifactPrefixBase}/${runId}`
}

export function validateApprovedPlanValidationEnv(input: { activeProject?: string } = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== approvedPlanValidationConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== approvedPlanValidationConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== approvedPlanValidationConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_VALIDATION !== 'true') blockers.push('REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_VALIDATION=true is required for Phase 52E execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 52E Supabase milestone sync.')
  if (input.activeProject && input.activeProject !== approvedPlanValidationConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
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
    if (process.env[flag] === 'true') blockers.push(`${flag} must remain false or unset in Phase 52E.`)
  }
  if (!input.activeProject) warnings.push('Active gcloud project was not available during static validation.')
  return { ok: blockers.length === 0, blockers, warnings }
}
