import { supabaseMilestoneSyncArtifactPrefix, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { SupabaseMilestoneSyncIamPlan } from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncIamPlan(runId = 'phase51d-planned'): SupabaseMilestoneSyncIamPlan {
  const prefix = supabaseMilestoneSyncArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [supabaseMilestoneSyncConfig.generatedAssetsBucket, supabaseMilestoneSyncConfig.qaBucket].map((bucket) => ({
      bucket,
      prefix,
      role: 'roles/storage.objectCreator',
      condition: `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}/")`,
      mutationAllowedByDefault: false,
    })),
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only_during_confirmed_execution', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only_during_confirmed_execution', mutationAllowedByDefault: false },
    ],
    databasePlan: {
      writesAllowedOnlyToMilestoneRegistryTables: true,
      migrationsAllowed: false,
      schemaMutationAllowed: false,
      rlsMutationAllowed: false,
      historicalBackfillAllowed: false,
    },
    blockedRoles: ['roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor', 'allUsers', 'allAuthenticatedUsers', 'anon table grants', 'authenticated table grants'],
  }
}
