import type {
  SupabaseHistoricalBackfillConfig,
  SupabaseHistoricalBackfillQaGateId,
  SupabaseHistoricalBackfillSafetyFlags,
} from './supabase-historical-backfill-types'

export const supabaseHistoricalBackfillConfig: SupabaseHistoricalBackfillConfig = {
  phase: '51C',
  mode: 'supabase_historical_activation_evidence_backfill',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-supabase/phase51c',
  baseBranch: 'codex/rp-activation-51b-supabase-activation-milestone-registry',
}

export const supabaseHistoricalBackfillSafetyFlags: SupabaseHistoricalBackfillSafetyFlags = {
  supabaseWritesAllowed: true,
  milestoneRegistryWritesOnly: true,
  migrationApplyAllowed: false,
  schemaMutationAllowed: false,
  rlsMutationAllowed: false,
  secretValueLoggingAllowed: false,
  frontendServiceRoleAllowed: false,
  rawPromptExecutionAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawProviderResponseStorageAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const supabaseHistoricalBackfillRequiredScripts = [
  'activation:supabase-historical-backfill',
  'activation:supabase-historical-backfill:report',
  'activation:supabase-historical-backfill:iam-plan',
  'smoke:activation-supabase-historical-backfill',
] as const

export const supabaseHistoricalBackfillRequiredDocs = [
  'docs/activation-supabase-historical-backfill-runbook.md',
  'docs/activation-supabase-historical-backfill-policy.md',
  'docs/activation-supabase-historical-backfill-qa-policy.md',
  'docs/activation-phase-51c-supabase-historical-backfill-results.md',
] as const

export const supabaseHistoricalBackfillQaGateIds: SupabaseHistoricalBackfillQaGateId[] = [
  'phase51b_evidence',
  'registry_schema_available',
  'backfill_plan_defined',
  'evidence_resolution',
  'bundle_validation',
  'idempotent_upsert',
  'readback_verification',
  'artifact_policy',
  'feature_gate_policy',
  'secret_safety',
  'skipped_phase_policy',
  'blocked_features',
]

export const supabaseHistoricalBackfillDisabledFeatureGates = [
  'production_ready',
  'external_beta_ready',
  'paid_production_ready',
  'broad_media_ready',
  'public_artifacts_allowed',
  'signed_url_source_of_truth_allowed',
  'raw_prompt_execution_allowed',
  'provider_execution_allowed',
  'service_role_frontend_exposure_allowed',
  'raw_provider_response_storage_allowed',
] as const

export function makeSupabaseHistoricalBackfillRunId(): string {
  const now = new Date().toISOString()
  return `phase51c-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function supabaseHistoricalBackfillArtifactPrefix(runId: string): string {
  if (!/^phase51c-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 51C run id: ${runId}`)
  return `${supabaseHistoricalBackfillConfig.artifactPrefixBase}/${runId}`
}

export function validateSupabaseHistoricalBackfillEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL

  if (projectId !== supabaseHistoricalBackfillConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== supabaseHistoricalBackfillConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== supabaseHistoricalBackfillConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== supabaseHistoricalBackfillConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL=true is required for Phase 51C execution.')

  blockers.push(...collectForbiddenFlagBlockers())
  warnings.push('Phase 51C writes historical milestone metadata only to the Phase 51B registry tables; migrations, production, beta, public artifacts, providers, and broad media remain blocked.')
  return { ok: blockers.length === 0, blockers, warnings }
}

function collectForbiddenFlagBlockers(): string[] {
  const falseFlags: Record<string, string | undefined> = {
    REEDITPRO_PRODUCTION_READY: process.env.REEDITPRO_PRODUCTION_READY,
    REEDITPRO_EXTERNAL_BETA_READY: process.env.REEDITPRO_EXTERNAL_BETA_READY,
    REEDITPRO_PAID_PRODUCTION_READY: process.env.REEDITPRO_PAID_PRODUCTION_READY,
    REEDITPRO_BROAD_REAL_MEDIA_READY: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY,
    REEDITPRO_PUBLIC_ARTIFACTS_ALLOWED: process.env.REEDITPRO_PUBLIC_ARTIFACTS_ALLOWED,
    REEDITPRO_SIGNED_URL_SOURCE_OF_TRUTH: process.env.REEDITPRO_SIGNED_URL_SOURCE_OF_TRUTH,
    REEDITPRO_RAW_PROMPT_EXECUTION_ALLOWED: process.env.REEDITPRO_RAW_PROMPT_EXECUTION_ALLOWED,
    REEDITPRO_PROVIDER_EXECUTION_ALLOWED: process.env.REEDITPRO_PROVIDER_EXECUTION_ALLOWED,
    REEDITPRO_SERVICE_ROLE_FRONTEND_EXPOSURE_ALLOWED: process.env.REEDITPRO_SERVICE_ROLE_FRONTEND_EXPOSURE_ALLOWED,
    REEDITPRO_RAW_PROVIDER_RESPONSE_STORAGE_ALLOWED: process.env.REEDITPRO_RAW_PROVIDER_RESPONSE_STORAGE_ALLOWED,
    REEDITPRO_SCHEMA_MUTATION_ALLOWED: process.env.REEDITPRO_SCHEMA_MUTATION_ALLOWED,
    REEDITPRO_RLS_MUTATION_ALLOWED: process.env.REEDITPRO_RLS_MUTATION_ALLOWED,
    SUPABASE_LIFECYCLE_ALLOWED: process.env.SUPABASE_LIFECYCLE_ALLOWED,
    SQL_MUTATION_OUTSIDE_MILESTONE_REGISTRY_ALLOWED: process.env.SQL_MUTATION_OUTSIDE_MILESTONE_REGISTRY_ALLOWED,
    SUPABASE_MIGRATION_APPLY_ALLOWED: process.env.SUPABASE_MIGRATION_APPLY_ALLOWED,
  }
  return Object.entries(falseFlags)
    .filter(([, value]) => value === 'true')
    .map(([name]) => `${name} must remain false or unset for Phase 51C.`)
}
