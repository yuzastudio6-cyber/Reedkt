import { supabaseHistoricalBackfillConfig, supabaseHistoricalBackfillArtifactPrefix } from './supabase-historical-backfill-policy'
import type { SupabaseHistoricalBackfillIamPlan } from './supabase-historical-backfill-types'

export function buildSupabaseHistoricalBackfillIamPlan(runId = 'phase51c-planned'): SupabaseHistoricalBackfillIamPlan {
  const prefix = supabaseHistoricalBackfillArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      storagePlan(supabaseHistoricalBackfillConfig.generatedAssetsBucket, prefix),
      storagePlan(supabaseHistoricalBackfillConfig.qaBucket, prefix),
    ],
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only_during_confirmed_execution', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only_during_confirmed_execution', mutationAllowedByDefault: false },
    ],
    databasePlan: {
      writesAllowedOnlyToMilestoneRegistryTables: true,
      migrationsAllowed: false,
      schemaMutationAllowed: false,
      rlsMutationAllowed: false,
    },
    blockedRoles: ['roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor', 'allUsers', 'allAuthenticatedUsers', 'anon table grants', 'authenticated table grants'],
  }
}

function storagePlan(bucket: string, prefix: string) {
  return {
    bucket,
    prefix,
    role: 'roles/storage.objectCreator' as const,
    condition: `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}/")`,
    mutationAllowedByDefault: false as const,
  }
}
