import type { SystemReadinessConfig, SystemReadinessSafetyFlags } from './system-readiness-reconciliation-types'

export const systemReadinessConfig: SystemReadinessConfig = {
  phase: '52F',
  mode: 'system_readiness_reconciliation_controlled_internal_test_plan',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52ERunId: 'phase52e-20260605T175613',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52f',
  branch: 'codex/rp-activation-52f-system-readiness-reconciliation-internal-test-plan',
  baseBranch: 'codex/rp-activation-52e-approved-plan-snapshot-validation-system-reconciliation',
}

export const systemReadinessSafetyFlags: SystemReadinessSafetyFlags = {
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
  systemReadinessReconciliationAllowed: true,
  controlledInternalTestPlanningAllowed: true,
  crossTrackHandoffGenerationAllowed: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  supabaseWritesLimitedToPhase52F: true,
  candidatePlanGenerationAllowed: false,
  approvedPlanSnapshotExecutionAllowed: false,
  toolRuntimeAllowed: false,
  workerExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  schemaChangesAllowed: false,
}

export const systemReadinessRequiredScripts = [
  'activation:system-readiness-reconciliation',
  'activation:system-readiness-reconciliation:report',
  'activation:system-readiness-reconciliation:iam-plan',
  'activation:system-readiness:summary',
  'smoke:activation-system-readiness-reconciliation',
] as const

export const systemReadinessDisabledFeatureGates = [
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
  'map_rendering',
  'browser_capture',
  'map_live_tiles',
  'map_geocoding',
  'map_routing',
  'web_search_broad_crawling',
  'web_search_arbitrary_url_capture',
  'track_b_vlm_runtime',
  'demucs_runtime',
] as const

export function makeSystemReadinessRunId(now = new Date()): string {
  return `phase52f-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', 'T')}`
}

export function systemReadinessArtifactPrefix(runId: string): string {
  return `${systemReadinessConfig.artifactPrefixBase}/${runId}`
}

export function validateSystemReadinessEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== systemReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== systemReadinessConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== systemReadinessConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_SYSTEM_READINESS_RECONCILIATION !== 'true') blockers.push('REEDITPRO_CONFIRM_SYSTEM_READINESS_RECONCILIATION=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== systemReadinessConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in Phase 52F.`)
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
