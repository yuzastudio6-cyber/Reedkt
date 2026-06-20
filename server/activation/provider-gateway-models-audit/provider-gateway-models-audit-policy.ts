import type { ProviderModelsAuditConfig, ProviderModelsAuditSafetyFlags } from './provider-gateway-models-audit-types'

export const providerModelsAuditConfig: ProviderModelsAuditConfig = {
  phase: 'PROVIDER-0',
  mode: 'provider_gateway_models_repo_audit',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase53ARunId: 'phase53a-20260606T171318',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-provider-gateway/provider0',
  branch: 'codex/rp-provider-0-provider-gateway-models-repo-audit',
  baseBranch: 'codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit',
}

export const providerModelsAuditSafetyFlags: ProviderModelsAuditSafetyFlags = {
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
  providerGatewayModelsAuditAllowed: true,
  repoAuditOnlyAllowed: true,
  deepSeekProviderCallsAllowed: false,
  qwenProviderCallsAllowed: false,
  providerSecretsAddedAllowed: false,
  toolExecutionAllowed: false,
  workerExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  browserCaptureAllowed: false,
  mapRenderingAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  sqlExecutionAllowed: false,
  schemaChangesAllowed: false,
  supabaseWritesLimitedToProvider0Milestone: true,
}

export const providerModelsAuditRequiredScripts = [
  'activation:provider-gateway-models-audit',
  'activation:provider-gateway-models-audit:report',
  'activation:provider-gateway-models-audit:iam-plan',
  'activation:provider-gateway-models:summary',
  'smoke:activation-provider-gateway-models-audit',
] as const

export const providerModelsAuditDisabledFeatureGates = [
  'production_ready',
  'external_beta',
  'paid_production',
  'broad_real_media',
  'public_artifacts',
  'signed_url_source_of_truth',
  'raw_prompt_execution',
  'provider_calls',
  'qwen_provider_calls',
  'deepseek_provider_calls',
  'provider_secret_creation',
  'provider_secret_value_read',
  'worker_execution',
  'tool_runtime_execution',
  'model_inference',
  'media_processing',
  'web_search_execution',
  'browser_capture',
  'map_rendering',
  'docker_build',
  'cloud_run_deploy',
  'sql_execution',
  'schema_rls_changes',
  'historical_backfill',
] as const

export function makeProviderModelsAuditRunId(now = new Date()): string {
  return `provider0-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function providerModelsAuditArtifactPrefix(runId: string): string {
  return `${providerModelsAuditConfig.artifactPrefixBase}/${runId}`
}

export function validateProviderModelsAuditExecutionEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== providerModelsAuditConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== providerModelsAuditConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== providerModelsAuditConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_PROVIDER_GATEWAY_MODELS_AUDIT !== 'true') blockers.push('REEDITPRO_CONFIRM_PROVIDER_GATEWAY_MODELS_AUDIT=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== providerModelsAuditConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in PROVIDER-0.`)
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
