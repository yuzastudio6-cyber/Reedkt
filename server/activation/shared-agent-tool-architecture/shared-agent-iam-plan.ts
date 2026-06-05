import {
  sharedAgentToolArchitectureArtifactPrefix,
  sharedAgentToolArchitectureConfig,
} from './shared-agent-tool-architecture-policy'
import type { SharedAgentToolArchitectureIamPlan } from './shared-agent-tool-architecture-types'

export function buildSharedAgentToolArchitectureIamPlan(runId = '<runId>'): SharedAgentToolArchitectureIamPlan {
  const prefix = sharedAgentToolArchitectureArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: sharedAgentToolArchitectureConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${sharedAgentToolArchitectureConfig.generatedAssetsBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
      {
        bucket: sharedAgentToolArchitectureConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        condition: `resource.name.startsWith("projects/_/buckets/${sharedAgentToolArchitectureConfig.qaBucket}/objects/${prefix}/")`,
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      migrationsAllowed: false,
      historicalBackfillAllowed: false,
      productRowWritesAllowed: false,
    },
    secretPlan: [
      {
        secretName: 'SUPABASE_URL',
        access: 'backend_resolution_only',
        mutationAllowedByDefault: false,
      },
      {
        secretName: 'SUPABASE_SERVICE_ROLE_KEY',
        access: 'backend_resolution_only',
        mutationAllowedByDefault: false,
      },
    ],
    blockedRoles: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'public allUsers',
      'public allAuthenticatedUsers',
      'database migration or schema admin roles',
    ],
  }
}
