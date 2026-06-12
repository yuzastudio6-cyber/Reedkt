import {
  MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
  MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES,
} from './model-provider-dry-run-policy'

export function buildModelProviderDryRunCommandPlan() {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: 'passed',
    defaultMode: 'static_report_only',
    executeRequiresFlag: '--execute',
    requiredEnvironment: MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV.map((name) => ({
      name,
      expectedValue: MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES[name],
    })),
    reportCommands: [
      'npm run smoke:activation-model-provider-dry-run',
      'npm run activation:model-provider-dry-run:report',
      'npm run activation:model-provider-dry-run:iam-plan',
      'npm run activation:model-provider-dry-run:summary',
    ],
    executeCommandTemplate: [
      'GCP_PROJECT_ID=reeditpro',
      'GCP_REGION=us-central1',
      'REEDITPRO_ENV=staging',
      'REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN=true',
      'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true',
      'npm run activation:model-provider-dry-run -- --execute',
    ].join(' '),
    privateArtifactPrefixes: {
      generatedAssets: MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
      qaArtifacts: MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
    },
    forbiddenCommands: [
      'supabase link',
      'supabase db push',
      'supabase db reset',
      'psql',
      'provider chaining',
      'worker execution',
      'tool execution',
      'render/export',
      'public artifact creation',
      'signed URL creation',
      'production unlock',
      'external beta unlock',
    ],
  }
}
