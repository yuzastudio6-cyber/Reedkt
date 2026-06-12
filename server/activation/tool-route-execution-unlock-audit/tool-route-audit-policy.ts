import { existsSync } from 'node:fs'
import type {
  ToolRouteSafetyFlags,
  ToolRouteSupabaseClassification,
} from './tool-route-audit-types'

export const TOOL_ROUTE_AUDIT_PHASE = 'TOOL_ROUTE_0'
export const TOOL_ROUTE_AUDIT_OWNER = 'WORKER_RUNTIME_JOBS / tool-route coordination audit layer'
export const TOOL_ROUTE_AUDIT_BRANCH = 'codex/rp-tool-route-0-execution-unlock-audit'
export const TOOL_ROUTE_AUDIT_BASE_BRANCH = 'codex/rp-worker-1-approved-plan-snapshot-dry-run'
export const TOOL_ROUTE_AUDIT_PR_TITLE = '[tool-route] Execution unlock audit'
export const TOOL_ROUTE_AUDIT_REPORT_DIR = 'docs/activation-tool-route-execution-unlock-audit-reports'

export const TOOL_ROUTE_AUDIT_SOURCE = {
  worker1RunId: 'worker1-20260612T193823',
  worker1Decision: 'worker_approved_plan_dry_run_passed_ready_for_tool_route_0_unlock_audit',
  worker0RunId: 'worker0-20260612T191022',
  worker0Decision: 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run',
  planSnapshotRunId: 'plansnapshot1-20260612T182758',
  planSnapshotDecision: 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit',
  candidatePlanId: 'candidate-approved-plan-plansnapshot1-20260612T182758',
  modelDryRunId: 'modeldryrun1-20260612T174538',
  modelDryRunDecision: 'provider_dry_run_passed_ready_for_plan_snapshot_contract',
} as const

export const TOOL_ROUTE_AUDIT_SOURCE_PATHS = {
  worker1Summary:
    'docs/activation-worker-approved-plan-dry-run-reports/summary/worker-approved-plan-dry-run-summary.json',
  worker1Report:
    'docs/activation-worker-approved-plan-dry-run-reports/reports/worker-approved-plan-dry-run-report.json',
  worker1Batch:
    'docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json',
  worker1BlockedRoutes:
    'docs/activation-worker-approved-plan-dry-run-reports/validation/blocked-route-validation.json',
  worker1ResultsDoc:
    'docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md',
  worker0Summary:
    'docs/activation-worker-runtime-jobs-audit-reports/summary/worker-runtime-jobs-audit-summary.json',
  planSnapshotSummary:
    'docs/activation-provider-output-plan-snapshot-contract-reports/summary/provider-output-plan-snapshot-contract-summary.json',
  planSnapshotCandidate:
    'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json',
  modelDryRunReadiness:
    'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_readiness_report.json',
} as const

export const TOOL_ROUTE_AUDIT_OPTIONAL_ABSENT_PATHS = [
  'docs/runtime-unlock',
  'docs/cross-chat',
  'docs/agents',
  'docs/tool-studies',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/provider-gateway-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
] as const

export const TOOL_ROUTE_AUDIT_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const TOOL_ROUTE_AUDIT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION_UNLOCK_AUDIT',
] as const

export const TOOL_ROUTE_AUDIT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_RUNTIME_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
  'REEDITPRO_CONFIRM_MAP_RENDERING',
  'REEDITPRO_CONFIRM_WEB_SEARCH',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCT_ROW_WRITE',
  'REEDITPRO_CONFIRM_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_MIGRATION_DEPLOY',
  'REEDITPRO_CONFIRM_SCHEMA_RLS_CHANGE',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_GOOGLE_CLOUD_API_CALLS',
  'REEDITPRO_CONFIRM_STRIPE_CREDIT_MUTATION',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
] as const

export const TOOL_ROUTE_AUDIT_SAFETY_FLAGS: ToolRouteSafetyFlags = {
  toolExecution: false,
  workerExecution: false,
  routeExecution: false,
  providerModelCalls: false,
  mediaProcessing: false,
  browserMapWeb: false,
  supabaseMutation: false,
  sqlMigrationsSchemaRls: false,
  googleCloudApiCalls: false,
  secretManagerApiCalls: false,
  gcsStorageTransfer: false,
  publicArtifacts: false,
  signedUrls: false,
  rawPromptExecution: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
  broadMedia: false,
  stripeCredits: false,
  dependencyMutation: false,
  finalRenderExport: false,
}

export const TOOL_ROUTE_AUDIT_REPORT_PATHS = {
  sourceAudit: 'audit/tool-route-source-audit.json',
  routeResolution: 'routes/worker-dry-run-route-resolution.json',
  familyMap: 'routes/tool-route-family-map.json',
  prerequisiteMap: 'prerequisites/tool-study-prerequisite-map.json',
  blockedUseRegister: 'blocked/tool-route-blocked-use-register.json',
  ownerPromptMap: 'prompts/tool-study-owner-prompt-map.json',
  gapMap: 'gaps/tool-route-gap-map.json',
  nextPhasePlan: 'roadmap/tool-route-next-phase-plan.json',
  qa: 'qa/tool-route-execution-unlock-audit-qa.json',
  report: 'reports/tool-route-execution-unlock-audit-report.json',
  summary: 'summary/tool-route-execution-unlock-audit-summary.json',
} as const

export const TOOL_ROUTE_AUDIT_OWNER_PROMPT_PATHS = [
  'docs/implementation-prompts/prompt-tool-study-0-web-search-capture.md',
  'docs/implementation-prompts/prompt-tool-study-0-map-geospatial.md',
  'docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-b-media-processing.md',
  'docs/implementation-prompts/prompt-tool-study-0-sound-music-audio.md',
] as const

export function buildToolRouteAuditRunId(): string {
  return `toolroute0-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getToolRouteAuditRunId(): string {
  return process.env.REEDITPRO_TOOL_ROUTE0_RUN_ID ??
    process.env.REEDITPRO_TOOL_ROUTE_EXECUTION_UNLOCK_AUDIT_RUN_ID ??
    buildToolRouteAuditRunId()
}

export function getToolRouteAuditGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(TOOL_ROUTE_AUDIT_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of TOOL_ROUTE_AUDIT_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of TOOL_ROUTE_AUDIT_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}

export function buildToolRouteSupabaseClassification(blockers: string[] = []): ToolRouteSupabaseClassification {
  return {
    updateRequired: 'docs/status only',
    updateStatus: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    evidenceDocs: [
      'docs/activation-phase-tool-route-0-execution-unlock-audit-results.md',
      `${TOOL_ROUTE_AUDIT_REPORT_DIR}/reports/tool-route-execution-unlock-audit-report.json`,
    ],
    blockers,
    nextSupabaseAction: 'none',
  }
}

export function optionalPathRecord(path: string, purpose: string) {
  return {
    path,
    exists: existsSync(path),
    required: false,
    purpose,
  }
}
