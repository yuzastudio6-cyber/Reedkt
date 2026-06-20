import type { RuntimeUnlockConfig, RuntimeUnlockSafetyFlags } from './runtime-unlock-roadmap-types'

export const runtimeUnlockConfig: RuntimeUnlockConfig = {
  phase: '53A',
  mode: 'runtime_unlock_roadmap_owner_acceptance_audit',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52HRunId: 'phase52h-20260606T130257',
  canonicalPhase52HCommit: '03680b3',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-runtime-unlock/phase53a',
  branch: 'codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit',
  baseBranch: 'codex/rp-activation-52h-cross-workstream-handoff-tracking',
}

export const runtimeUnlockSafetyFlags: RuntimeUnlockSafetyFlags = {
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
  runtimeUnlockRoadmapAllowed: true,
  ownerAcceptanceAuditAllowed: true,
  ownerRepoAuditPromptGenerationAllowed: true,
  toolRuntimeAllowed: false,
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
  supabaseWritesLimitedToPhase53A: true,
}

export const runtimeUnlockRequiredScripts = [
  'activation:runtime-unlock-roadmap',
  'activation:runtime-unlock-roadmap:report',
  'activation:runtime-unlock-roadmap:iam-plan',
  'activation:runtime-unlock:summary',
  'smoke:activation-runtime-unlock-roadmap',
] as const

export const runtimeUnlockDisabledFeatureGates = [
  'production_ready',
  'external_beta',
  'paid_production',
  'broad_real_media',
  'public_artifacts',
  'raw_prompt_execution',
  'signed_url_source_of_truth',
  'provider_calls',
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

export function makeRuntimeUnlockRunId(now = new Date()): string {
  return `phase53a-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function runtimeUnlockArtifactPrefix(runId: string): string {
  return `${runtimeUnlockConfig.artifactPrefixBase}/${runId}`
}

export function validateRuntimeUnlockExecutionEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== runtimeUnlockConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== runtimeUnlockConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== runtimeUnlockConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_RUNTIME_UNLOCK_ROADMAP !== 'true') blockers.push('REEDITPRO_CONFIRM_RUNTIME_UNLOCK_ROADMAP=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== runtimeUnlockConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in Phase 53A.`)
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
