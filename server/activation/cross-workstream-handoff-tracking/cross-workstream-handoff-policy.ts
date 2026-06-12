import type { CrossWorkstreamHandoffConfig, CrossWorkstreamHandoffSafetyFlags } from './cross-workstream-handoff-types'

export const crossWorkstreamHandoffConfig: CrossWorkstreamHandoffConfig = {
  phase: '52H',
  mode: 'cross_workstream_handoff_tracking_owner_response_intake',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase52GRunId: 'phase52g-20260606T033152',
  canonicalPhase52GCommit: 'f2cce03',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52h',
  branch: 'codex/rp-activation-52h-cross-workstream-handoff-tracking',
  baseBranch: 'codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch',
}

export const crossWorkstreamHandoffSafetyFlags: CrossWorkstreamHandoffSafetyFlags = {
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
  handoffTrackingAllowed: true,
  ownerResponseIntakeAllowed: true,
  ownerPromptExecutionAllowed: false,
  toolRuntimeAllowed: false,
  workerExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  approvedPlanSnapshotExecutionAllowed: false,
  crossTrackHandoffGenerationAllowed: true,
  supabaseMilestoneSyncAllowed: true,
  supabaseWritesLimitedToPhase52H: true,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  schemaChangesAllowed: false,
}

export const crossWorkstreamHandoffRequiredScripts = [
  'activation:cross-workstream-handoff-tracking',
  'activation:cross-workstream-handoff-tracking:report',
  'activation:cross-workstream-handoff-tracking:iam-plan',
  'activation:cross-workstream-handoff:summary',
  'smoke:activation-cross-workstream-handoff-tracking',
] as const

export const crossWorkstreamHandoffDisabledFeatureGates = [
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
  'owner_prompt_execution',
  'model_inference',
  'media_processing',
  'web_search_execution',
  'map_rendering',
  'browser_capture',
  'approved_plan_snapshot_execution',
  'schema_rls_changes',
  'historical_backfill',
] as const

export function makeCrossWorkstreamHandoffRunId(now = new Date()): string {
  return `phase52h-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function crossWorkstreamHandoffArtifactPrefix(runId: string): string {
  return `${crossWorkstreamHandoffConfig.artifactPrefixBase}/${runId}`
}

export function validateCrossWorkstreamHandoffTrackingEnv(input: { activeProject?: string } = {}): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== crossWorkstreamHandoffConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== crossWorkstreamHandoffConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== crossWorkstreamHandoffConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_CROSS_WORKSTREAM_HANDOFF_TRACKING !== 'true') blockers.push('REEDITPRO_CONFIRM_CROSS_WORKSTREAM_HANDOFF_TRACKING=true is required.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required.')
  if (input.activeProject && input.activeProject !== crossWorkstreamHandoffConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const envName of ['REEDITPRO_ENABLE_PRODUCTION', 'REEDITPRO_ENABLE_EXTERNAL_BETA', 'REEDITPRO_ENABLE_BROAD_MEDIA']) {
    if (process.env[envName] === 'true') blockers.push(`${envName} must not be true in Phase 52H.`)
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('Supabase milestone credentials may be resolved from Google Secret Manager during confirmed execution.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
