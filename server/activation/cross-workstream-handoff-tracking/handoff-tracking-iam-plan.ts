import { crossWorkstreamHandoffArtifactPrefix, crossWorkstreamHandoffConfig } from './cross-workstream-handoff-policy'
import type { CrossWorkstreamIamPlan } from './cross-workstream-handoff-types'

export function buildCrossWorkstreamHandoffIamPlan(runId = '<runId>'): CrossWorkstreamIamPlan {
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: crossWorkstreamHandoffConfig.generatedAssetsBucket,
        prefix: crossWorkstreamHandoffArtifactPrefix(runId),
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: crossWorkstreamHandoffConfig.qaBucket,
        prefix: crossWorkstreamHandoffArtifactPrefix(runId),
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      phase52HOnly: true,
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
