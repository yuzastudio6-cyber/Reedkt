import type { QwenTimeoutFailure, QwenTimeoutModelId } from './qwen-timeout-calibration-types'

export const QWEN_TIMEOUT_CALIBRATION_PHASE = 'model-orchestration-qwen-timeout-calibration'
export const QWEN_TIMEOUT_CALIBRATION_BRANCH =
  'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-dashscope-auth-repair'
export const QWEN_TIMEOUT_CALIBRATION_PR_TITLE = '[model] Qwen schema timeout target calibration'
export const QWEN_TIMEOUT_CALIBRATION_REPORT_DIR = 'docs/activation-qwen-timeout-calibration-reports'
export const QWEN_TIMEOUT_CALIBRATION_GENERATED_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const QWEN_TIMEOUT_CALIBRATION_QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const QWEN_TIMEOUT_CALIBRATION_OBJECT_PREFIX = 'activation-model-orchestration/qwen-timeout-calibration'
export const QWEN_TIMEOUT_APPROVED_BASE_URL = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'

export const QWEN_TIMEOUT_CALIBRATION_RUN_ID =
  process.env.REEDITPRO_QWEN_TIMEOUT_RUN_ID ??
  process.env.REEDITPRO_MODEL_DRY_RUN_ID ??
  process.env.REEDITPRO_MODELDRYRUN1_RUN_ID ??
  buildQwenTimeoutRunId()

export const QWEN_TIMEOUT_REQUIRED_ENVIRONMENT = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_QWEN_SCHEMA_TIMEOUT_CALIBRATION',
] as const

export const QWEN_TIMEOUT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
] as const

export const QWEN_TIMEOUT_SECRET_REFS = [
  'DASHSCOPE_API_KEY',
  'DASHSCOPE_BASE_URL',
  'DASHSCOPE_REGION',
] as const

export const QWEN_TIMEOUT_PRIMARY_MODEL: QwenTimeoutModelId = 'qwen3.7-plus'
export const QWEN_TIMEOUT_ESCALATION_MODEL: QwenTimeoutModelId = 'qwen3.7-max'
export const QWEN_TIMEOUT_FALLBACK_SANITY_MODELS: QwenTimeoutModelId[] = ['qwen-plus-us', 'qwen-flash-us']
export const QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL: QwenTimeoutModelId = 'qwen-max'

export const QWEN_TIMEOUT_EXPECTED_ARTIFACTS = [
  'audit/repo-ownership-audit.json',
  'policy/qwen-timeout-calibration-policy.json',
  'secrets/qwen-timeout-secret-access.json',
  'cases/qwen-timeout-calibration-cases.json',
  'results/qwen-timeout-calibration-results.json',
  'analysis/qwen-timeout-result-analysis.json',
  'recommendation/qwen-model-timeout-target-recommendation.json',
  'manifest/qwen-timeout-calibration-manifest.json',
  'qa/qwen-timeout-calibration-qa.json',
  'reports/qwen-timeout-calibration-report.json',
] as const

export const QWEN_TIMEOUT_BLOCKED_SCOPES = [
  'full_qwen_deepseek_provider_dry_run',
  'deepseek_calls',
  'provider_chains',
  'tools_workers_routes',
  'media_processing',
  'browser_capture',
  'map_rendering',
  'raw_prompt_execution',
  'supabase_writes',
  'sql_migrations_schema_rls',
  'public_artifacts',
  'signed_urls',
  'production',
  'external_beta',
  'paid_production',
] as const

export const QWEN_TIMEOUT_FAILURES: QwenTimeoutFailure[] = [
  'provider_timeout',
  'first_byte_timeout',
  'stream_timeout',
  'schema_invalid',
  'model_alias_unavailable',
  'auth_regression',
  'region_mismatch',
  'output_too_large',
  'prompt_too_large',
]

export function getQwenTimeoutGeneratedArtifactPrefix(runId = QWEN_TIMEOUT_CALIBRATION_RUN_ID) {
  return `gs://${QWEN_TIMEOUT_CALIBRATION_GENERATED_BUCKET}/${QWEN_TIMEOUT_CALIBRATION_OBJECT_PREFIX}/${runId}/`
}

export function getQwenTimeoutQaArtifactPrefix(runId = QWEN_TIMEOUT_CALIBRATION_RUN_ID) {
  return `gs://${QWEN_TIMEOUT_CALIBRATION_QA_BUCKET}/${QWEN_TIMEOUT_CALIBRATION_OBJECT_PREFIX}/${runId}/`
}

export function buildQwenTimeoutRunId() {
  return `qwentimeout1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}
