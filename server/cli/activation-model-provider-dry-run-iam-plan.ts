import {
  MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET,
  MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX,
  MODEL_DRY_RUN_PRIVATE_QA_BUCKET,
  getModelDryRunGeneratedArtifactPrefix,
  getModelDryRunQaArtifactPrefix,
  getModelOrchestrationProviderDryRunPlan,
} from '../activation/model-orchestration-provider-dry-run'

const plan = getModelOrchestrationProviderDryRunPlan()

console.log(JSON.stringify({
  phase: plan.phase,
  runId: plan.runId,
  status: 'metadata_only',
  mutatesIam: false,
  readsSecretPayloads: false,
  writesSupabase: false,
  sqlExecuted: false,
  migrationDeployed: false,
  secretManager: {
    project: 'reeditpro',
    exactSecretRefs: [
      'DASHSCOPE_API_KEY',
      'DASHSCOPE_BASE_URL',
      'DASHSCOPE_REGION',
      'DEEPSEEK_API_KEY',
    ],
    broadSecretDiscovery: false,
    payloadLoggingAllowed: false,
    environmentProviderSecretPayloadsAllowed: false,
  },
  privateGcs: {
    generatedBucket: MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET,
    qaBucket: MODEL_DRY_RUN_PRIVATE_QA_BUCKET,
    objectPrefix: `${MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${plan.runId}/`,
    generatedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    qaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  blockedScopes: [
    'tools_workers_routes',
    'media_processing',
    'provider_chaining',
    'raw_prompt_execution',
    'browser_capture',
    'map_rendering',
    'sql_migrations_schema_rls',
    'production_external_beta_paid_production',
  ],
}, null, 2))
