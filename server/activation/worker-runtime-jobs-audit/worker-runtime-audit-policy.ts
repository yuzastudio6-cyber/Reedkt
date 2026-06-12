import { existsSync } from 'node:fs'
import type {
  WorkerRuntimeArtifactUploadStatus,
  WorkerRuntimeSafetyFlags,
  WorkerRuntimeSupabaseSyncStatus,
} from './worker-runtime-audit-types'

export const WORKER_RUNTIME_JOBS_AUDIT_PHASE = 'WORKER_0'
export const WORKER_RUNTIME_JOBS_AUDIT_OWNER = 'WORKER_RUNTIME_JOBS'
export const WORKER_RUNTIME_JOBS_AUDIT_BRANCH = 'codex/rp-worker-0-worker-runtime-jobs-repo-audit'
export const WORKER_RUNTIME_JOBS_AUDIT_BASE_BRANCH = 'codex/rp-plan-snapshot-1-provider-output-contract'
export const WORKER_RUNTIME_JOBS_AUDIT_PR_TITLE = '[worker] Worker Runtime Jobs repo audit'
export const WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR = 'docs/activation-worker-runtime-jobs-audit-reports'
export const WORKER_RUNTIME_JOBS_AUDIT_SOURCE_PR = 334
export const WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID = 'plansnapshot1-20260612T182758'
export const WORKER_RUNTIME_JOBS_AUDIT_SOURCE_DECISION =
  'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit'
export const WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_GENERATED_BUCKET =
  'reeditpro-staging-reeditpro-generated-assets'
export const WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_OBJECT_PREFIX = 'activation-worker-runtime/worker0'

export const WORKER_RUNTIME_JOBS_AUDIT_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const WORKER_RUNTIME_JOBS_AUDIT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_REPO_AUDIT',
] as const

export const WORKER_RUNTIME_JOBS_AUDIT_FORBIDDEN_CONFIRMATIONS = [
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

export const WORKER_RUNTIME_JOBS_AUDIT_GENERATED_ARTIFACTS = [
  'audit/repo-ownership-audit.json',
  'audit/worker-schema-audit.json',
  'audit/approved-plan-intake-audit.json',
  'audit/worker-claim-lease-audit.json',
  'audit/worker-artifact-scope-audit.json',
  'audit/worker-event-log-audit.json',
  'gaps/worker-runtime-gap-map.json',
  'roadmap/worker-runtime-next-phase-plan.json',
  'manifest/worker-runtime-jobs-audit-manifest.json',
] as const

export const WORKER_RUNTIME_JOBS_AUDIT_QA_ARTIFACTS = [
  'qa/worker-runtime-jobs-audit-qa.json',
  'reports/worker-runtime-jobs-audit-report.json',
] as const

export const WORKER_RUNTIME_REQUIRED_MIGRATION_PATHS = [
  'supabase/migrations/202605130005_job_orchestration_agent_runs.sql',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'supabase/migrations/202605200002_worker_leases_runtime_transport.sql',
  'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql',
] as const

export const WORKER_RUNTIME_REQUIRED_TABLES = [
  'approved_plan_snapshots',
  'job_batches',
  'jobs',
  'job_dependencies',
  'job_events',
  'agent_runs',
  'agent_outputs',
  'worker_runtime_configs',
  'worker_heartbeats',
  'event_log',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'storage_object_records',
  'signed_url_events',
  'worker_job_claims',
  'tool_runtime_checks',
  'provider_request_attempts',
  'provider_webhook_events',
] as const

export const WORKER_RUNTIME_REQUIRED_FUNCTIONS = [
  'can_run_job',
  'can_create_approved_plan_snapshot',
  'active_worker_claim_exists',
  'can_claim_worker_job',
] as const

export const WORKER_RUNTIME_REQUIRED_SERVICE_PATHS = [
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/worker-lease-recovery-service.ts',
  'src/backend/services/job-orchestration-service.ts',
  'src/backend/services/job-queue-runtime-service.ts',
  'src/backend/services/job-gate-service.ts',
  'src/backend/services/job-dependency-runtime-service.ts',
  'src/backend/services/job-event-runtime-service.ts',
  'src/backend/cloud/worker-job-contracts.ts',
  'src/backend/cloud/approved-plan-snapshot-contracts.ts',
  'server/services/approved-snapshot-service.ts',
  'server/services/worker-claim-service.ts',
] as const

export const WORKER_RUNTIME_SAFETY_FLAGS: WorkerRuntimeSafetyFlags = {
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
  broadMedia: false,
}

export function buildWorkerRuntimeJobsAuditRunId(): string {
  return `worker0-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getWorkerRuntimeJobsAuditRunId(): string {
  return process.env.REEDITPRO_WORKER0_RUN_ID ??
    process.env.REEDITPRO_WORKER_RUNTIME_JOBS_AUDIT_RUN_ID ??
    buildWorkerRuntimeJobsAuditRunId()
}

export function getWorkerRuntimeJobsAuditGeneratedPrefix(runId = getWorkerRuntimeJobsAuditRunId()): string {
  return `gs://${WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_GENERATED_BUCKET}/${WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function getWorkerRuntimeJobsAuditQaPrefix(runId = getWorkerRuntimeJobsAuditRunId()): string {
  return `gs://${WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_QA_BUCKET}/${WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function buildWorkerRuntimeSupabaseSyncStatus(requested = true): WorkerRuntimeSupabaseSyncStatus {
  return {
    requested,
    status: 'not_attempted_current_branch_missing_sync_layer',
    syncLayerPresent: false,
    sqlExecuted: false,
    migrationDeployed: false,
    unrelatedRowsWritten: false,
    syncLayerDirectoryPresent: existsSync('server/activation/supabase-milestone-sync'),
  }
}

export function buildWorkerRuntimeNotAttemptedUploadStatus(
  runId: string,
): WorkerRuntimeArtifactUploadStatus {
  return {
    status: 'not_attempted',
    generatedPrefix: getWorkerRuntimeJobsAuditGeneratedPrefix(runId),
    qaPrefix: getWorkerRuntimeJobsAuditQaPrefix(runId),
    publicArtifacts: false,
    signedUrls: false,
    rawPromptPayloadsStored: false,
    rawProviderResponsesStored: false,
    secretPayloadsStored: false,
  }
}

export function getWorkerRuntimeJobsAuditGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(WORKER_RUNTIME_JOBS_AUDIT_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of WORKER_RUNTIME_JOBS_AUDIT_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of WORKER_RUNTIME_JOBS_AUDIT_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}
