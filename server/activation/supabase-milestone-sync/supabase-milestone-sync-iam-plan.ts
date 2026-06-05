import { supabaseMilestoneSyncArtifactPrefix, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { SupabaseMilestoneSyncIamPlan } from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncIamPlan(runId = '<runId>'): SupabaseMilestoneSyncIamPlan {
  const prefix = supabaseMilestoneSyncArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: supabaseMilestoneSyncConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${supabaseMilestoneSyncConfig.generatedAssetsBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
      {
        bucket: supabaseMilestoneSyncConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${supabaseMilestoneSyncConfig.qaBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
    ],
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only', mutationAllowedByDefault: false },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      migrationsAllowed: false,
      historicalBackfillAllowed: false,
    },
    blockedRoles: [
      'roles/owner',
      'roles/editor',
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/secretmanager.admin',
      'public principals',
    ],
  }
}
