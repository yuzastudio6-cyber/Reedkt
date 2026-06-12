import { existsSync } from 'node:fs'
import type {
  WorkerDryRunArtifactUploadStatus,
  WorkerDryRunSafetyFlags,
  WorkerDryRunSupabaseStatus,
} from './worker-approved-plan-dry-run-types'

export const WORKER_APPROVED_PLAN_DRY_RUN_PHASE = 'WORKER_1'
export const WORKER_APPROVED_PLAN_DRY_RUN_OWNER = 'WORKER_RUNTIME_JOBS'
export const WORKER_APPROVED_PLAN_DRY_RUN_BRANCH = 'codex/rp-worker-1-approved-plan-snapshot-dry-run'
export const WORKER_APPROVED_PLAN_DRY_RUN_BASE_BRANCH = 'codex/rp-worker-0-worker-runtime-jobs-repo-audit'
export const WORKER_APPROVED_PLAN_DRY_RUN_PR_TITLE = '[worker] Approved plan snapshot dry run'
export const WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR = 'docs/activation-worker-approved-plan-dry-run-reports'
export const WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_GENERATED_BUCKET =
  'reeditpro-staging-reeditpro-generated-assets'
export const WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_OBJECT_PREFIX = 'activation-worker-runtime/worker1'

export const WORKER_APPROVED_PLAN_DRY_RUN_SOURCE = {
  worker0RunId: 'worker0-20260612T191022',
  worker0Decision: 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run',
  planSnapshotRunId: 'plansnapshot1-20260612T182758',
  planSnapshotDecision: 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit',
  candidatePlanId: 'candidate-approved-plan-plansnapshot1-20260612T182758',
  modelDryRunId: 'modeldryrun1-20260612T174538',
  modelDryRunDecision: 'provider_dry_run_passed_ready_for_plan_snapshot_contract',
} as const

export const WORKER_APPROVED_PLAN_DRY_RUN_PATHS = {
  worker0Summary:
    'docs/activation-worker-runtime-jobs-audit-reports/summary/worker-runtime-jobs-audit-summary.json',
  worker0Report:
    'docs/activation-worker-runtime-jobs-audit-reports/reports/worker-runtime-jobs-audit-report.json',
  worker0ResultsDoc:
    'docs/activation-phase-worker-0-worker-runtime-jobs-audit-results.md',
  planSnapshotSummary:
    'docs/activation-provider-output-plan-snapshot-contract-reports/summary/provider-output-plan-snapshot-contract-summary.json',
  planSnapshotCandidate:
    'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json',
  planSnapshotReport:
    'docs/activation-provider-output-plan-snapshot-contract-reports/reports/provider-output-plan-snapshot-contract-report.json',
  planSnapshotWorkerHandoff:
    'docs/activation-provider-output-plan-snapshot-contract-reports/handoff/worker-runtime-handoff.json',
  modelDryRunDecision:
    'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json',
  modelDryRunReadiness:
    'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_readiness_report.json',
} as const

export const WORKER_APPROVED_PLAN_DRY_RUN_ABSENT_OPTIONAL_TREES = [
  'docs/runtime-unlock',
  'docs/cross-chat',
  'docs/agents',
  'docs/tool-studies',
  'server/activation/approved-plan-snapshot-validation',
  'server/activation/supabase-milestone-sync',
  'docs/tool-call-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const WORKER_APPROVED_PLAN_DRY_RUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_APPROVED_PLAN_DRY_RUN',
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_RUNTIME_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
  'REEDITPRO_CONFIRM_MAP_RENDERING',
  'REEDITPRO_CONFIRM_WEB_SEARCH',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCT_ROW_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_MIGRATION_DEPLOY',
  'REEDITPRO_CONFIRM_SCHEMA_RLS_CHANGE',
  'REEDITPRO_CONFIRM_DOCKER_CLOUD_RUN',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_GENERATED_ARTIFACTS = [
  'audit/repo-ownership-audit.json',
  'evidence/plan-snapshot-evidence-context.json',
  'dry-run/worker-job-batch-plan.json',
  'dry-run/worker-job-dependency-plan.json',
  'dry-run/simulated-claim-lease-result.json',
  'validation/artifact-scope-validation.json',
  'validation/blocked-route-validation.json',
  'event-log/worker-event-log-plan.json',
  'gaps/worker-dry-run-gap-map.json',
  'roadmap/worker-dry-run-next-phase-plan.json',
  'manifest/worker-approved-plan-dry-run-manifest.json',
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_QA_ARTIFACTS = [
  'qa/worker-approved-plan-dry-run-qa.json',
  'reports/worker-approved-plan-dry-run-report.json',
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_BLOCKED_ROUTES = [
  { routeId: 'track_a_runtime', owner: 'TRACK_A_RENDER_EXPORT', blockedReason: 'Track A render/export implementation is out of WORKER-1 scope.' },
  { routeId: 'track_b_runtime', owner: 'TRACK_B_MEDIA_PROCESSING', blockedReason: 'Track B media/model runtime is out of WORKER-1 scope.' },
  { routeId: 'ai_tools_runtime', owner: 'AI_TOOLS_CREATIVE_GRAPHICS', blockedReason: 'Tool-owner studies and route unlock audits must precede tool execution.' },
  { routeId: 'map_rendering', owner: 'MAP_GEOSPATIAL', blockedReason: 'Map rendering remains owner-gated and non-executing.' },
  { routeId: 'web_search_execution', owner: 'COMPLIANCE_SECURITY', blockedReason: 'Web search execution remains blocked in WORKER-1.' },
  { routeId: 'browser_capture', owner: 'COMPLIANCE_SECURITY', blockedReason: 'Browser capture remains blocked in WORKER-1.' },
  { routeId: 'provider_calls', owner: 'PROVIDER_GATEWAY_MODELS', blockedReason: 'Provider calls are not part of Worker Runtime dry-run.' },
  { routeId: 'media_processing', owner: 'TRACK_B_MEDIA_PROCESSING', blockedReason: 'Media processing is not approved by this dry-run.' },
  { routeId: 'route_execution', owner: 'WORKER_RUNTIME_JOBS', blockedReason: 'WORKER-1 validates routes as blocked metadata only.' },
  { routeId: 'public_artifact_delivery', owner: 'PUBLIC_ARTIFACT_SIGNED_URL_POLICY', blockedReason: 'Public artifacts remain blocked.' },
  { routeId: 'signed_url_creation_or_source_of_truth', owner: 'PUBLIC_ARTIFACT_SIGNED_URL_POLICY', blockedReason: 'Signed URLs remain blocked as source of truth.' },
  { routeId: 'raw_prompt_execution', owner: 'COMPLIANCE_SECURITY', blockedReason: 'Workers must execute approved snapshots, not raw prompts.' },
] as const

export const WORKER_APPROVED_PLAN_DRY_RUN_SAFETY_FLAGS: WorkerDryRunSafetyFlags = {
  workerExecution: false,
  toolExecution: false,
  providerCalls: false,
  routeExecution: false,
  runtimeExecution: false,
  mediaProcessing: false,
  browserMapWeb: false,
  sqlMigrationsSchemaRls: false,
  supabaseProductRows: false,
  publicArtifacts: false,
  signedUrls: false,
  rawPrompts: false,
  rawProviderResponses: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
  broadMedia: false,
}

export function buildWorkerApprovedPlanDryRunRunId(): string {
  return `worker1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getWorkerApprovedPlanDryRunRunId(): string {
  return process.env.REEDITPRO_WORKER1_RUN_ID ??
    process.env.REEDITPRO_WORKER_APPROVED_PLAN_DRY_RUN_ID ??
    buildWorkerApprovedPlanDryRunRunId()
}

export function getWorkerApprovedPlanDryRunGeneratedPrefix(runId = getWorkerApprovedPlanDryRunRunId()): string {
  return `gs://${WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_GENERATED_BUCKET}/${WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function getWorkerApprovedPlanDryRunQaPrefix(runId = getWorkerApprovedPlanDryRunRunId()): string {
  return `gs://${WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_QA_BUCKET}/${WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function buildWorkerDryRunSupabaseStatus(requested = true): WorkerDryRunSupabaseStatus {
  return {
    requested,
    status: 'not_attempted_current_branch_missing_sync_layer',
    syncLayerPresent: false,
    syncLayerDirectoryPresent: existsSync('server/activation/supabase-milestone-sync'),
    sqlExecuted: false,
    migrationDeployed: false,
    unrelatedRowsWritten: false,
  }
}

export function buildWorkerApprovedPlanDryRunNotAttemptedUploadStatus(
  runId: string,
): WorkerDryRunArtifactUploadStatus {
  return {
    status: 'not_attempted',
    generatedPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(runId),
    qaPrefix: getWorkerApprovedPlanDryRunQaPrefix(runId),
    publicArtifacts: false,
    signedUrls: false,
    rawPromptPayloadsStored: false,
    rawProviderResponsesStored: false,
    secretPayloadsStored: false,
  }
}

export function getWorkerApprovedPlanDryRunGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(WORKER_APPROVED_PLAN_DRY_RUN_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of WORKER_APPROVED_PLAN_DRY_RUN_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of WORKER_APPROVED_PLAN_DRY_RUN_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}
