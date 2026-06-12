import { existsSync } from 'node:fs'
import type { PlanSnapshotOwnerRoute } from './provider-output-plan-snapshot-types'

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_PHASE = 'PLAN_SNAPSHOT_1'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_BRANCH = 'codex/rp-plan-snapshot-1-provider-output-contract'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_PR_TITLE = '[plan] Provider output approved-plan snapshot contract'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_MODE = 'provider_output_to_approved_plan_snapshot_contract'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR =
  'docs/activation-provider-output-plan-snapshot-contract-reports'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID = 'modeldryrun1-20260612T174538'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION =
  'provider_dry_run_passed_ready_for_plan_snapshot_contract'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_GENERATED_BUCKET =
  'reeditpro-staging-reeditpro-generated-assets'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_QA_BUCKET =
  'reeditpro-staging-reeditpro-qa-artifacts'
export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_OBJECT_PREFIX =
  'activation-model-orchestration/plan-snapshot-1'

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PROVIDER_OUTPUT_PLAN_SNAPSHOT_CONTRACT',
] as const

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN',
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
] as const

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_EXPECTED_REPORTS = [
  'audit/repo-ownership-audit.json',
  'evidence/provider-output-evidence-context.json',
  'plans/candidate-approved-plan-snapshot.json',
  'validation/plan-snapshot-schema-validation.json',
  'validation/execution-block-validation.json',
  'routing/owner-route-map.json',
  'handoff/worker-runtime-handoff.json',
  'handoff/owner-review-handoff.json',
  'manifest/provider-output-plan-snapshot-contract-manifest.json',
  'qa/provider-output-plan-snapshot-contract-qa.json',
  'reports/provider-output-plan-snapshot-contract-report.json',
] as const

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_OWNER_ROUTES: PlanSnapshotOwnerRoute[] = [
  'MODEL_ORCHESTRATION',
  'COORDINATOR_PRODUCER_QA',
  'WORKER_RUNTIME_JOBS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'MAP_GEOSPATIAL',
  'SOUND_MUSIC_AUDIO',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'COMPLIANCE_SECURITY',
  'OBSERVABILITY_AUDIT_COST',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
  'PUBLIC_ARTIFACT_SIGNED_URL_POLICY',
]

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_BLOCKED_ACTIONS = [
  'qwen_api_call',
  'deepseek_api_call',
  'provider_chaining',
  'tool_execution',
  'worker_execution',
  'route_execution',
  'raw_prompt_execution',
  'raw_provider_response_storage',
  'secret_payload_storage',
  'media_processing',
  'browser_capture',
  'map_rendering',
  'web_search',
  'sql_execution',
  'migration_deploy',
  'schema_or_rls_change',
  'supabase_row_write',
  'docker_or_cloud_run',
  'public_artifact',
  'signed_url_source_of_truth',
  'production_or_external_beta',
]

export const PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_CAPABILITIES = [
  'provider_output_evidence_resolution',
  'plan_snapshot_candidate_v1_mapping',
  'agent_findings_v1_mapping',
  'approved_plan_snapshot_schema_validation',
  'execution_block_validation',
  'owner_route_review_matrix',
  'worker_runtime_repo_audit_handoff',
  'private_json_artifact_publication',
]

export function buildProviderOutputPlanSnapshotRunId(): string {
  return `plansnapshot1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getProviderOutputPlanSnapshotRunId(): string {
  return process.env.REEDITPRO_PLAN_SNAPSHOT_RUN_ID ??
    process.env.REEDITPRO_PLANSNAPSHOT1_RUN_ID ??
    buildProviderOutputPlanSnapshotRunId()
}

export function getProviderOutputPlanSnapshotGeneratedPrefix(runId = getProviderOutputPlanSnapshotRunId()): string {
  return `gs://${PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_GENERATED_BUCKET}/${PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function getProviderOutputPlanSnapshotQaPrefix(runId = getProviderOutputPlanSnapshotRunId()): string {
  return `gs://${PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_QA_BUCKET}/${PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function buildSupabaseMilestoneSyncPolicy(requested = true) {
  return {
    requested,
    status: 'not_attempted_current_branch_missing_sync_layer' as const,
    syncLayerPresent: false as const,
    sqlExecuted: false as const,
    migrationDeployed: false as const,
    unrelatedRowsWritten: false as const,
    syncLayerDirectoryPresent: existsSync('server/activation/supabase-milestone-sync'),
  }
}

export function getProviderOutputPlanSnapshotGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of PROVIDER_OUTPUT_PLAN_SNAPSHOT_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}
