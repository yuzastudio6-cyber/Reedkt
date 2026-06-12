import {
  supabaseMilestoneRegistryArtifactPrefix,
  supabaseMilestoneRegistryConfig,
} from './supabase-milestone-registry-policy'
import type { SupabaseMilestoneRegistryCommandPlan, SupabaseMilestoneRegistryIamPlan } from './supabase-milestone-registry-types'

export function buildSupabaseMilestoneRegistryCommandPlan(): SupabaseMilestoneRegistryCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_supabase_registry_write',
    migrationApplyMode: 'guarded_local_psql_only',
    allowedCommands: [
      'npm run activation:supabase-milestone-registry:report',
      'npm run activation:supabase-milestone-registry:iam-plan',
      'npm run smoke:activation-supabase-milestone-registry',
      'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true npm run activation:supabase-milestone-registry -- --execute',
      'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true npm run activation:supabase-milestone-registry -- --execute --apply-migration',
    ],
    blockedAlways: [
      'Supabase lifecycle commands such as supabase start/status/db reset/db push.',
      'DDL through Supabase service-role REST client.',
      'SQL mutations outside the explicit local psql migration file.',
      'Destructive migration statements, drops, resets, public policies, anon/authenticated grants, or service-role frontend exposure.',
      'Public artifact URLs or signed URLs as source of truth.',
      'Production, external beta, paid production, broad media, provider execution, Docker, deployment, or broad historical backfill.',
    ],
    blockers: [],
    warnings: [
      'Migration apply is intentionally blocked unless a direct DB URL resolves from backend env or Secret Manager and REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true is set.',
      'If the schema is absent, Phase 51B still produces private artifacts and a blocked write-verification report.',
    ],
  }
}

export function buildSupabaseMilestoneRegistryIamPlan(runId = 'phase51b-planned'): SupabaseMilestoneRegistryIamPlan {
  const prefix = supabaseMilestoneRegistryArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: supabaseMilestoneRegistryConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${supabaseMilestoneRegistryConfig.generatedAssetsBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
      {
        bucket: supabaseMilestoneRegistryConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${supabaseMilestoneRegistryConfig.qaBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
    ],
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'metadata_or_backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'metadata_or_backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_DB_URL', access: 'metadata_or_backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'DATABASE_URL', access: 'metadata_or_backend_resolution_only', mutationAllowedByDefault: false },
    ],
    databasePlan: {
      migrationRequiresDirectDbUrl: true,
      ddlThroughSupabaseRestAllowed: false,
      broadDbPrivilegesAllowed: false,
    },
    blockedRoles: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'allUsers',
      'allAuthenticatedUsers',
      'anon table grants',
      'authenticated table grants',
    ],
  }
}
