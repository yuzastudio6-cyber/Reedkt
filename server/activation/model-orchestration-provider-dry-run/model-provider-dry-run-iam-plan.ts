import {
  MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
  MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
  MODEL_PROVIDER_DRY_RUN_SECRET_REFS,
} from './model-provider-dry-run-policy'

export function buildModelProviderDryRunIamPlan() {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: 'passed',
    mode: 'least_privilege_execution_plan_only',
    serviceAccount: 'existing_activation_operator_or_ci_identity',
    requiredSecretAccess: MODEL_PROVIDER_DRY_RUN_SECRET_REFS.map((secret) => ({
      providerId: secret.providerId,
      secretName: secret.secretName,
      access: 'secretmanager.versions.access',
      payloadLoggingAllowed: false,
      payloadCommitAllowed: false,
    })),
    requiredStorageAccess: [
      {
        prefix: MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
        access: 'storage.objects.create',
        publicAccessAllowed: false,
      },
      {
        prefix: MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
        access: 'storage.objects.create',
        publicAccessAllowed: false,
      },
    ],
    notRequired: [
      'supabase service role',
      'sql execution',
      'migration deployment',
      'worker runtime identity',
      'render/export worker identity',
      'public artifact signer',
      'production service account',
    ],
    iamMutationPerformed: false,
  }
}
