import { toolCapabilityRegistryArtifactPrefix, toolCapabilityRegistryConfig } from './tool-capability-registry-policy'
import type { ToolCapabilityRegistryIamPlan } from './tool-capability-registry-types'

export function buildToolCapabilityRegistryIamPlan(runId = '<runId>'): ToolCapabilityRegistryIamPlan {
  const prefix = toolCapabilityRegistryArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: toolCapabilityRegistryConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: toolCapabilityRegistryConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      toolCapabilitiesUpsertAllowed: true,
      migrationsAllowed: false,
      schemaChangesAllowed: false,
      productRowWritesAllowed: false,
    },
    secretPlan: [
      { secretName: 'SUPABASE_URL', access: 'backend_resolution_only', mutationAllowedByDefault: false },
      { secretName: 'SUPABASE_SERVICE_ROLE_KEY', access: 'backend_resolution_only', mutationAllowedByDefault: false },
    ],
    blockedRoles: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'public principals',
      'frontend service-role access',
      'database owner/admin grants',
    ],
  }
}
