import { multiAgentDryRunArtifactPrefix, multiAgentDryRunConfig } from './multi-agent-dry-run-policy'
import type { MultiAgentDryRunIamPlan } from './multi-agent-dry-run-types'

export function buildMultiAgentDryRunIamPlan(runId = '<phase52c-run-id>'): MultiAgentDryRunIamPlan {
  const prefix = multiAgentDryRunArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: multiAgentDryRunConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: multiAgentDryRunConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      migrationsAllowed: false,
      schemaChangesAllowed: false,
      productRowWritesAllowed: false,
      historicalBackfillAllowed: false,
    },
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only', mutationAllowedByDefault: false },
    ],
    blockedRoles: ['roles/owner', 'roles/editor', 'roles/storage.admin', 'roles/storage.objectAdmin', 'allUsers', 'allAuthenticatedUsers'],
  }
}
