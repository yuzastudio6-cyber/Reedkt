import { providerModelsAuditArtifactPrefix, providerModelsAuditConfig } from './provider-gateway-models-audit-policy'
import type { ProviderModelsAuditIamPlan } from './provider-gateway-models-audit-types'

export function buildProviderModelsAuditIamPlan(runId = '<runId>'): ProviderModelsAuditIamPlan {
  const prefix = providerModelsAuditArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: providerModelsAuditConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: providerModelsAuditConfig.qaBucket,
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
    providerSecretPlan: [
      { secretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME', status: 'future_metadata_only_not_created_or_read_in_provider0' },
      { secretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME', status: 'future_metadata_only_not_created_or_read_in_provider0' },
    ],
    blockedRoles: ['roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor', 'roles/secretmanager.admin', 'allUsers', 'allAuthenticatedUsers'],
  }
}
