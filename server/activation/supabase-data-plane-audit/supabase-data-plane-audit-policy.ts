import type {
  SupabaseDataPlaneAuditConfig,
  SupabaseDataPlaneQaGateId,
  SupabaseDataPlaneSafetyFlags,
} from './supabase-data-plane-audit-types'

export const supabaseDataPlaneAuditConfig: SupabaseDataPlaneAuditConfig = {
  phase: '51A',
  mode: 'supabase_data_plane_readonly_audit',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-supabase/phase51a',
  baseBranch: 'codex/rp-activation-50g-map-geospatial-internal-readiness',
}

export const supabaseDataPlaneSafetyFlags: SupabaseDataPlaneSafetyFlags = {
  readOnlyAuditOnly: true,
  migrationsAllowed: false,
  sqlMutationAllowed: false,
  supabaseLifecycleAllowed: false,
  remoteSchemaMutationAllowed: false,
  rowWritesAllowed: false,
  secretValueLoggingAllowed: false,
  signedUrlCreationAllowed: false,
  providerCallsAllowed: false,
  mediaProcessingAllowed: false,
  dockerAllowed: false,
  deploymentAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const supabaseDataPlaneRequiredScripts = [
  'activation:supabase-data-plane-audit',
  'activation:supabase-data-plane-audit:report',
  'activation:supabase-data-plane-audit:iam-plan',
  'smoke:activation-supabase-data-plane-audit',
] as const

export const supabaseDataPlaneRequiredDocs = [
  'docs/activation-supabase-data-plane-audit-runbook.md',
  'docs/activation-supabase-data-plane-audit-policy.md',
  'docs/activation-supabase-data-plane-audit-qa-policy.md',
  'docs/activation-phase-51a-supabase-data-plane-audit-results.md',
] as const

export const supabaseDataPlaneQaGateIds: SupabaseDataPlaneQaGateId[] = [
  'repo_supabase_discovery',
  'env_secret_audit',
  'migration_schema_audit',
  'rls_security_audit',
  'runtime_integration_audit',
  'remote_activity_audit',
  'data_model_gap_analysis',
  'beta_readiness_impact',
  'storytiming_rls_triage',
  'artifact_privacy',
  'blocked_features',
]

export const supabaseDataPlaneAuditTables = [
  'user_profiles',
  'workspaces',
  'workspace_members',
  'projects',
  'chat_sessions',
  'chat_messages',
  'media_assets',
  'edit_plans',
  'credit_estimates',
  'credit_approvals',
  'credit_reservations',
  'approved_plan_snapshots',
  'jobs',
  'job_events',
  'worker_job_claims',
  'storage_object_records',
  'signed_url_events',
  'tool_runtime_checks',
  'provider_request_attempts',
  'provider_webhook_events',
] as const

export function makeSupabaseDataPlaneRunId(): string {
  const now = new Date().toISOString()
  return `phase51a-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function supabaseDataPlaneArtifactPrefix(runId: string): string {
  if (!/^phase51a-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 51A run id: ${runId}`)
  return `${supabaseDataPlaneAuditConfig.artifactPrefixBase}/${runId}`
}

export function validateSupabaseDataPlaneExecutionEnv(input: {
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT

  if (projectId !== supabaseDataPlaneAuditConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== supabaseDataPlaneAuditConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== supabaseDataPlaneAuditConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== supabaseDataPlaneAuditConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT=true is required for Phase 51A execution.')

  const falseFlags: Record<string, string | undefined> = {
    SUPABASE_MIGRATIONS_ALLOWED: process.env.SUPABASE_MIGRATIONS_ALLOWED,
    SQL_MUTATION_ALLOWED: process.env.SQL_MUTATION_ALLOWED,
    SUPABASE_LIFECYCLE_ALLOWED: process.env.SUPABASE_LIFECYCLE_ALLOWED,
    REMOTE_SCHEMA_MUTATION_ALLOWED: process.env.REMOTE_SCHEMA_MUTATION_ALLOWED,
    SUPABASE_ROW_WRITES_ALLOWED: process.env.SUPABASE_ROW_WRITES_ALLOWED,
    SECRET_VALUE_LOGGING_ALLOWED: process.env.SECRET_VALUE_LOGGING_ALLOWED,
    SIGNED_URL_CREATION_ALLOWED: process.env.SIGNED_URL_CREATION_ALLOWED,
    PROVIDER_CALLS_ALLOWED: process.env.PROVIDER_CALLS_ALLOWED,
    MEDIA_PROCESSING_ALLOWED: process.env.MEDIA_PROCESSING_ALLOWED,
    DOCKER_ALLOWED: process.env.DOCKER_ALLOWED,
    DEPLOYMENT_ALLOWED: process.env.DEPLOYMENT_ALLOWED,
    REEDITPRO_PRODUCTION_READY: process.env.REEDITPRO_PRODUCTION_READY,
    REEDITPRO_EXTERNAL_BETA_READY: process.env.REEDITPRO_EXTERNAL_BETA_READY,
    REEDITPRO_PAID_PRODUCTION_READY: process.env.REEDITPRO_PAID_PRODUCTION_READY,
    REEDITPRO_BROAD_REAL_MEDIA_READY: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY,
  }

  for (const [name, value] of Object.entries(falseFlags)) {
    if (value === 'true') blockers.push(`${name} must remain false or unset for Phase 51A.`)
  }

  warnings.push('Phase 51A is read-only: no migrations, Supabase lifecycle commands, SQL mutations, row writes, secret printing, providers, media processing, Docker, deploys, or production/beta unlocks.')
  return { ok: blockers.length === 0, blockers, warnings }
}
