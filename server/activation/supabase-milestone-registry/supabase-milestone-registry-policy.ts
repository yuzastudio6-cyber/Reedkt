import type {
  SupabaseMilestoneRegistryConfig,
  SupabaseMilestoneRegistryQaGateId,
  SupabaseMilestoneRegistrySafetyFlags,
  SupabaseRegistryTableName,
} from './supabase-milestone-registry-types'

export const supabaseMilestoneRegistryConfig: SupabaseMilestoneRegistryConfig = {
  phase: '51B',
  mode: 'supabase_activation_milestone_registry',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-supabase/phase51b',
  baseBranch: 'codex/rp-activation-51a-supabase-data-plane-audit',
  migrationFile: 'supabase/migrations/202606040001_activation_milestone_registry.sql',
}

export const supabaseMilestoneRegistrySafetyFlags: SupabaseMilestoneRegistrySafetyFlags = {
  activationRegistryWritesAllowed: true,
  migrationApplyAllowed: false,
  destructiveMigrationAllowed: false,
  supabaseLifecycleAllowed: false,
  sqlMutationOutsideMigrationAllowed: false,
  serviceRoleFrontendExposureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  broadHistoricalBackfillAllowed: false,
  providerCallsAllowed: false,
  mediaProcessingAllowed: false,
  dockerAllowed: false,
  deploymentAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const supabaseMilestoneRegistryTableNames: SupabaseRegistryTableName[] = [
  'activation_runs',
  'activation_artifacts',
  'activation_qa_gates',
  'readiness_snapshots',
  'tool_capabilities',
  'feature_gates',
]

export const supabaseMilestoneRegistryRequiredScripts = [
  'activation:supabase-milestone-registry',
  'activation:supabase-milestone-registry:report',
  'activation:supabase-milestone-registry:iam-plan',
  'smoke:activation-supabase-milestone-registry',
] as const

export const supabaseMilestoneRegistryRequiredDocs = [
  'docs/activation-supabase-milestone-registry-runbook.md',
  'docs/activation-supabase-milestone-registry-policy.md',
  'docs/activation-supabase-milestone-registry-qa-policy.md',
  'docs/activation-phase-51b-supabase-milestone-registry-results.md',
] as const

export const supabaseMilestoneRegistryQaGateIds: SupabaseMilestoneRegistryQaGateId[] = [
  'phase51a_evidence',
  'schema_metadata',
  'migration_safety',
  'rls_security',
  'credential_safety',
  'writer_validation',
  'schema_verification',
  'milestone_bundle',
  'supabase_write_verification',
  'backfill_plan',
  'artifact_privacy',
  'blocked_features',
]

export const supabaseMilestoneDisabledFeatureGates = [
  'production_ready',
  'external_beta_ready',
  'paid_production_ready',
  'broad_media_ready',
  'public_artifacts_allowed',
  'signed_url_source_of_truth_allowed',
  'raw_prompt_execution_allowed',
  'provider_execution_allowed',
  'service_role_frontend_exposure_allowed',
] as const

export function makeSupabaseMilestoneRegistryRunId(): string {
  const now = new Date().toISOString()
  return `phase51b-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function supabaseMilestoneRegistryArtifactPrefix(runId: string): string {
  if (!/^phase51b-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 51B run id: ${runId}`)
  return `${supabaseMilestoneRegistryConfig.artifactPrefixBase}/${runId}`
}

export function validateSupabaseMilestoneRegistryExecutionEnv(input: {
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY

  if (projectId !== supabaseMilestoneRegistryConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== supabaseMilestoneRegistryConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== supabaseMilestoneRegistryConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== supabaseMilestoneRegistryConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true is required for Phase 51B execution.')

  blockers.push(...collectForbiddenFlagBlockers())
  warnings.push('Phase 51B writes only the activation milestone registry when schema verification passes; production, beta, raw prompt execution, public artifacts, providers, and broad media remain blocked.')
  return { ok: blockers.length === 0, blockers, warnings }
}

export function validateSupabaseMilestoneMigrationApplyEnv(input: {
  confirmation?: string
  dbUrlResolved?: boolean
} = {}) {
  const blockers: string[] = []
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true is required before applying the Phase 51B migration.')
  if (!input.dbUrlResolved) blockers.push('SUPABASE_DB_URL or DATABASE_URL must resolve from backend env or Secret Manager before local psql migration apply.')
  blockers.push(...collectForbiddenFlagBlockers())
  return { ok: blockers.length === 0, blockers }
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
    SUPABASE_LIFECYCLE_ALLOWED: process.env.SUPABASE_LIFECYCLE_ALLOWED,
    SQL_MUTATION_OUTSIDE_MIGRATION_ALLOWED: process.env.SQL_MUTATION_OUTSIDE_MIGRATION_ALLOWED,
    DOCKER_ALLOWED: process.env.DOCKER_ALLOWED,
    DEPLOYMENT_ALLOWED: process.env.DEPLOYMENT_ALLOWED,
  }
  return Object.entries(falseFlags)
    .filter(([, value]) => value === 'true')
    .map(([name]) => `${name} must remain false or unset for Phase 51B.`)
}
