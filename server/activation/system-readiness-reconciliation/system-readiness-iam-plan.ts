import { systemReadinessArtifactPrefix, systemReadinessConfig } from './system-readiness-reconciliation-policy'
import type { SystemReadinessIamPlan } from './system-readiness-reconciliation-types'

export function buildSystemReadinessIamPlan(runId = '<runId>'): SystemReadinessIamPlan {
  const prefix = systemReadinessArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: systemReadinessConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: systemReadinessConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      phase52FOnly: true,
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
