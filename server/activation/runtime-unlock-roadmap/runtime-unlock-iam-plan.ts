import { runtimeUnlockArtifactPrefix, runtimeUnlockConfig } from './runtime-unlock-roadmap-policy'
import type { RuntimeUnlockIamPlan } from './runtime-unlock-roadmap-types'

export function buildRuntimeUnlockIamPlan(runId = '<runId>'): RuntimeUnlockIamPlan {
  const prefix = runtimeUnlockArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: runtimeUnlockConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: runtimeUnlockConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      migrationsAllowed: false,
      schemaChangesAllowed: false,
      unrelatedRowsAllowed: false,
    },
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only', mutationAllowedByDefault: false },
    ],
    blockedRoles: ['roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor', 'allUsers', 'allAuthenticatedUsers'],
  }
}
