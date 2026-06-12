import type { ModelProviderDryRunPolicy, ProviderSecretReference } from './model-provider-dry-run-types'

export const MODEL_PROVIDER_DRY_RUN_PHASE = 'MODEL_DRYRUN_1'
export const MODEL_PROVIDER_DRY_RUN_MODE = 'qwen_deepseek_synthetic_provider_dry_run'
export const MODEL_PROVIDER_DRY_RUN_BRANCH = 'codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run'
export const MODEL_PROVIDER_DRY_RUN_BASE_BRANCH = 'codex/rp-model-orchestration-qwen-deepseek-dry-run-approval'
export const MODEL_PROVIDER_DRY_RUN_PR_TITLE = '[model] Qwen DeepSeek synthetic provider dry run'
export const MODEL_PROVIDER_DRY_RUN_REPORT_DIR = 'docs/activation-model-provider-dry-run-reports'
export const MODEL_PROVIDER_DRY_RUN_DOC_RESULTS_PATH = 'docs/activation-phase-model-provider-dry-run-results.md'
export const MODEL_PROVIDER_DRY_RUN_IMPLEMENTATION_PROMPT_PATH =
  'docs/implementation-prompts/prompt-model-dryrun-1-qwen-deepseek-synthetic-provider-dry-run.md'

export const MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV = [
  'GCP_PROJECT_ID',
  'GCP_REGION',
  'REEDITPRO_ENV',
  'REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC',
] as const

export const MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES: Record<string, string> = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
  REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN: 'true',
  REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC: 'true',
}

export const MODEL_PROVIDER_DRY_RUN_POLICY: ModelProviderDryRunPolicy = {
  phase: 'MODEL_DRYRUN_1',
  mode: 'qwen_deepseek_synthetic_provider_dry_run',
  environment: 'staging',
  syntheticOnly: true,
  userDataAllowed: false,
  rawMediaAllowed: false,
  signedUrlAllowed: false,
  privateGcsUrlAllowed: false,
  secretPayloadLoggingAllowed: false,
  toolExecutionAllowed: false,
  workerExecutionAllowed: false,
  routeExecutionAllowed: false,
  providerChainingAllowed: false,
  webSearchAllowed: false,
  browserCaptureAllowed: false,
  mapRenderingAllowed: false,
  mediaProcessingAllowed: false,
  publicArtifactsAllowed: false,
  rawPromptExecutionAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadMediaAllowed: false,
}

export const MODEL_PROVIDER_DRY_RUN_SECRET_REFS: ProviderSecretReference[] = [
  {
    providerId: 'qwen_dashscope',
    envName: 'DASHSCOPE_API_KEY',
    secretName: 'DASHSCOPE_API_KEY',
  },
  {
    providerId: 'deepseek',
    envName: 'DEEPSEEK_API_KEY',
    secretName: 'DEEPSEEK_API_KEY',
  },
]

export const MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX =
  'gs://reeditpro-staging-reeditpro-generated-assets/activation-model-orchestration/model-dry-run-1'
export const MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX =
  'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-model-orchestration/model-dry-run-1'

export const MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS = [
  'model_provider_dry_run_source_audit.json',
  'model_provider_dry_run_policy.json',
  'model_provider_dry_run_synthetic_cases.json',
  'model_provider_dry_run_request_redaction.json',
  'model_provider_dry_run_secret_resolution.json',
  'model_provider_dry_run_provider_results.json',
  'model_provider_dry_run_normalized_responses.json',
  'model_provider_dry_run_schema_validation.json',
  'model_provider_dry_run_response_redaction.json',
  'model_provider_dry_run_cost_usage.json',
  'model_provider_dry_run_fail_closed.json',
  'model_provider_dry_run_artifact_manifest.json',
  'model_provider_dry_run_supabase_milestone_sync.json',
  'model_provider_dry_run_qa_summary.json',
  'model_provider_dry_run_readiness_report.json',
] as const

export const MODEL_PROVIDER_DRY_RUN_BLOCKED_SCOPES = [
  'real_user_data',
  'raw_media',
  'signed_urls',
  'private_urls',
  'provider_chaining',
  'tool_execution',
  'worker_execution',
  'route_execution',
  'browser_capture',
  'web_search',
  'map_rendering',
  'media_processing',
  'public_artifacts',
  'raw_prompt_execution',
  'production',
  'external_beta',
] as const

export function buildModelProviderDryRunRunId(date = new Date()): string {
  return `modeldryrun1-${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`
}
