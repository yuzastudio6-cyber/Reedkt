import { providerModelApprovalArtifactPrefix, providerModelApprovalConfig } from './provider-model-approval-policy'
import type { ProviderModelApprovalIamPlan } from './provider-model-approval-types'

export function buildProviderModelApprovalIamPlan(runId = '<runId>'): ProviderModelApprovalIamPlan {
  const prefix = providerModelApprovalArtifactPrefix(runId)
  return {
    defaultMutationAllowed: false,
    storagePlan: [
      {
        bucket: providerModelApprovalConfig.generatedAssetsBucket,
        prefix,
        role: 'roles/storage.objectCreator',
        mutationAllowedByDefault: false,
      },
      {
        bucket: providerModelApprovalConfig.qaBucket,
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
      {
        secretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME',
        providerKeySemantics: 'DEEPSEEK_API_KEY',
        status: 'reference_name_recorded_only_not_created_or_read_in_provider1',
      },
      {
        secretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME',
        providerKeySemantics: 'DASHSCOPE_API_KEY',
        status: 'reference_name_recorded_only_not_created_or_read_in_provider1',
      },
    ],
    blockedRoles: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'roles/secretmanager.admin',
      'roles/secretmanager.secretAccessor for provider secrets in PROVIDER-1',
      'allUsers',
      'allAuthenticatedUsers',
    ],
  }
}
