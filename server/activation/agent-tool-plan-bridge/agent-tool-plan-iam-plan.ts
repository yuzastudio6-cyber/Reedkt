import type { AgentToolPlanBridgeIamPlan } from './agent-tool-plan-bridge-types'
import { agentToolPlanBridgeArtifactPrefix, agentToolPlanBridgeConfig } from './agent-tool-plan-bridge-policy'

export function buildAgentToolPlanBridgeIamPlan(runId = '<runId>'): AgentToolPlanBridgeIamPlan {
  const prefix = agentToolPlanBridgeArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: agentToolPlanBridgeConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: agentToolPlanBridgeConfig.qaBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
    ],
    supabasePlan: {
      writesAllowedOnlyToMilestoneRegistry: true,
      phase52DOnly: true,
      migrationsAllowed: false,
      schemaChangesAllowed: false,
      productRowWritesAllowed: false,
      historicalBackfillAllowed: false,
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
    blockedRoles: ['roles/owner', 'roles/editor', 'roles/storage.admin', 'roles/storage.objectAdmin', 'public principals', 'allUsers', 'allAuthenticatedUsers'],
  }
}
