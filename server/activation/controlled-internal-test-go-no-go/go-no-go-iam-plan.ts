import { goNoGoArtifactPrefix, goNoGoConfig } from './controlled-internal-test-go-no-go-policy'
import type { GoNoGoIamPlan } from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoIamPlan(runId = '<runId>'): GoNoGoIamPlan {
  const prefix = goNoGoArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: goNoGoConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: goNoGoConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      phase52GOnly: true,
      migrationsAllowed: false,
      schemaChangesAllowed: false,
      productRowWritesAllowed: false,
      historicalBackfillAllowed: false,
    },
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only', mutationAllowedByDefault: false },
    ],
    blockedRoles: ['roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor', 'allUsers', 'allAuthenticatedUsers'],
  }
}
