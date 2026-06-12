import type { GoNoGoConfig, GoNoGoSafetyFlags } from './controlled-internal-test-go-no-go-types'

export const goNoGoConfig: GoNoGoConfig = {
  phase: '52G',
  mode: 'controlled_internal_test_go_no_go_handoff_dispatch',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52FRunId: 'phase52f-20260605T185559',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52g',
  branch: 'codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch',
  baseBranch: 'codex/rp-activation-52f-system-readiness-reconciliation-internal-test-plan',
}

export const goNoGoSafetyFlags: GoNoGoSafetyFlags = {
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
  goNoGoPacketAllowed: true,
  ownerHandoffDispatchAllowed: true,
  controlledInternalTestPlanningAllowed: true,
  crossTrackHandoffGenerationAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  supabaseWritesLimitedToPhase52G: true,
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

export const goNoGoRequiredScripts = [
  'activation:controlled-internal-test-go-no-go',
  'activation:controlled-internal-test-go-no-go:report',
  'activation:controlled-internal-test-go-no-go:iam-plan',
  'activation:controlled-internal-test:summary',
  'smoke:activation-controlled-internal-test-go-no-go',
] as const

export const goNoGoDisabledFeatureGates = [
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
  'approved_plan_snapshot_execution',
  'track_b_vlm_runtime',
  'demucs_runtime',
] as const

export function makeGoNoGoRunId(now = new Date()): string {
  return `phase52g-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', 'T')}`
}

export function goNoGoArtifactPrefix(runId: string): string {
  return `${goNoGoConfig.artifactPrefixBase}/${runId}`
}

export function validateControlledInternalTestGoNoGoEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== goNoGoConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== goNoGoConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== goNoGoConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_CONTROLLED_INTERNAL_TEST_GO_NO_GO !== 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_INTERNAL_TEST_GO_NO_GO=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== goNoGoConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in Phase 52G.`)
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
