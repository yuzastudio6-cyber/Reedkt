import type { ToolCapabilityRegistrySafetyFlags } from './tool-capability-registry-types'

export const toolCapabilityRegistryConfig = {
  phase: '52B',
  mode: 'tool_capability_registry_audit',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  basePhase: '52A',
  canonicalPhase52ARunId: 'phase52a-20260605T111515',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-agents/phase52b',
  branch: 'codex/rp-activation-52b-tool-capability-registry-audit',
  baseBranch: 'codex/rp-activation-52a-shared-agent-tool-ownership-architecture',
} as const

export const toolCapabilityRegistrySafetyFlags: ToolCapabilityRegistrySafetyFlags = {
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
  registryAuditOnly: true,
  privateGcsArtifactUploadAllowed: true,
  supabaseToolCapabilitySyncAllowed: true,
  toolRuntimeExecutionAllowed: false,
  modelInferenceAllowed: false,
  mediaProcessingAllowed: false,
  webSearchAllowed: false,
  mapRenderingAllowed: false,
  browserCaptureAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  schemaChangesAllowed: false,
}

export const toolCapabilityRegistryExpectedCounts = {
  total: 67,
  track_a_visual_video: 13,
  web_search: 8,
  map_geospatial: 12,
  supabase: 4,
  ai_tools: 12,
  track_b: 18,
} as const

export const toolCapabilityRegistryRequiredScripts = [
  'activation:tool-capability-registry-audit',
  'activation:tool-capability-registry-audit:report',
  'activation:tool-capability-registry-audit:iam-plan',
  'activation:tool-capability-registry:summary',
  'smoke:activation-tool-capability-registry-audit',
] as const

export function makeToolCapabilityRegistryRunId(date = new Date()): string {
  return `phase52b-${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function toolCapabilityRegistryArtifactPrefix(runId: string): string {
  return `${toolCapabilityRegistryConfig.artifactPrefixBase}/${runId}`
}

export function validateToolCapabilityRegistryExecutionEnv(input: { activeProject?: string } = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== toolCapabilityRegistryConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== toolCapabilityRegistryConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== toolCapabilityRegistryConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_TOOL_CAPABILITY_REGISTRY_AUDIT !== 'true') blockers.push('REEDITPRO_CONFIRM_TOOL_CAPABILITY_REGISTRY_AUDIT=true is required for Phase 52B execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for the guarded milestone registry sync.')
  if (input.activeProject && input.activeProject !== toolCapabilityRegistryConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  for (const flag of [
    'REEDITPRO_PRODUCTION_READY',
    'REEDITPRO_EXTERNAL_BETA_READY',
    'REEDITPRO_PAID_PRODUCTION_READY',
    'REEDITPRO_BROAD_MEDIA_READY',
    'REEDITPRO_ENABLE_PROVIDER_EXECUTION',
    'REEDITPRO_ENABLE_TOOL_RUNTIME_EXECUTION',
    'REEDITPRO_ENABLE_PUBLIC_ARTIFACTS',
  ]) {
    if (process.env[flag] === 'true') blockers.push(`${flag} must remain false or unset in Phase 52B.`)
  }
  if (!input.activeProject) warnings.push('Active gcloud project was not available during static validation.')
  return { ok: blockers.length === 0, blockers, warnings }
}
