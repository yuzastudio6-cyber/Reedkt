import type { ProviderModelApprovalConfig, ProviderModelApprovalSafetyFlags } from './provider-model-approval-types'

export const providerModelApprovalConfig: ProviderModelApprovalConfig = {
  phase: 'PROVIDER-1',
  mode: 'deepseek_qwen_api_approval_policy',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  provider0EvidenceBranch: 'codex/rp-provider-0-provider-gateway-models-repo-audit',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-provider-gateway/provider1',
  branch: 'codex/rp-provider-1-deepseek-qwen-api-approval-policy',
  baseBranch: 'codex/rp-provider-0-provider-gateway-models-repo-audit',
}

export const providerModelApprovalSafetyFlags: ProviderModelApprovalSafetyFlags = {
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
  providerModelApprovalPolicyAllowed: true,
  policyOnlyAllowed: true,
  deepSeekProviderCallsAllowed: false,
  qwenProviderCallsAllowed: false,
  providerSecretsAddedAllowed: false,
  providerSecretValueReadsAllowed: false,
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
  supabaseWritesLimitedToProvider1Milestone: true,
}

export const providerModelApprovalRequiredScripts = [
  'activation:provider-model-approval-policy',
  'activation:provider-model-approval-policy:report',
  'activation:provider-model-approval-policy:iam-plan',
  'activation:provider-model-approval:summary',
  'smoke:activation-provider-model-approval-policy',
] as const

export const providerModelApprovalDisabledFeatureGates = [
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
  'provider_chaining',
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

export function makeProviderModelApprovalRunId(now = new Date()): string {
  return `provider1-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function providerModelApprovalArtifactPrefix(runId: string): string {
  return `${providerModelApprovalConfig.artifactPrefixBase}/${runId}`
}

export function validateProviderModelApprovalExecutionEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== providerModelApprovalConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== providerModelApprovalConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== providerModelApprovalConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_PROVIDER_MODEL_APPROVAL_POLICY !== 'true') blockers.push('REEDITPRO_CONFIRM_PROVIDER_MODEL_APPROVAL_POLICY=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== providerModelApprovalConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in PROVIDER-1.`)
  }
  if (process.env.GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME || process.env.GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME) {
    warnings.push('Provider secret reference names may be configured, but PROVIDER-1 does not create, read, or verify provider secret payloads.')
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
