import { existsSync } from 'node:fs'
import type {
  ToolRouteDryRunFamilyId,
  ToolRouteDryRunOwner,
  ToolRouteDryRunSafetyFlags,
  ToolRouteDryRunSupabaseClassification,
} from './tool-route-dry-run-planning-types'

export const TOOL_ROUTE_DRY_RUN_PHASE = 'TOOL_ROUTE_1'
export const TOOL_ROUTE_DRY_RUN_OWNER = 'WORKER_RUNTIME_JOBS / tool-route planning coordination layer'
export const TOOL_ROUTE_DRY_RUN_BRANCH = 'codex/rp-tool-route-1-route-dry-run-planning'
export const TOOL_ROUTE_DRY_RUN_BASE_BRANCH = 'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const TOOL_ROUTE_DRY_RUN_PR_TITLE = '[tool-route] Route dry-run planning'
export const TOOL_ROUTE_DRY_RUN_REPORT_DIR = 'docs/activation-tool-route-dry-run-planning-reports'

export const TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

export const TOOL_ROUTE_DRY_RUN_SOURCE = {
  modelDryRunId: 'modeldryrun1-20260612T174538',
  modelDryRunDecision: 'provider_dry_run_passed_ready_for_plan_snapshot_contract',
  planSnapshotRunId: 'plansnapshot1-20260612T182758',
  planSnapshotDecision: 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit',
  candidatePlanId: 'candidate-approved-plan-plansnapshot1-20260612T182758',
  worker0RunId: 'worker0-20260612T191022',
  worker0Decision: 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run',
  worker1RunId: 'worker1-20260612T193823',
  worker1Decision: 'worker_approved_plan_dry_run_passed_ready_for_tool_route_0_unlock_audit',
  toolRoute0RunId: 'toolroute0-20260612T201155',
  toolRoute0Decision: 'tool_route_execution_unlock_audit_passed_ready_for_route_dry_run_planning',
} as const

export const TOOL_ROUTE_DRY_RUN_PR_STACK = [
  {
    pr: 331,
    title: 'MODEL-DRYRUN-1',
    mergeSha: '131d54e662abeafc8c415f63dca9b33f2b3f7afb',
    expectedRunId: TOOL_ROUTE_DRY_RUN_SOURCE.modelDryRunId,
  },
  {
    pr: 334,
    title: 'PLAN-SNAPSHOT-1',
    mergeSha: 'e31c58b4063a2b924852f4fd89770c243079f3ad',
    expectedRunId: TOOL_ROUTE_DRY_RUN_SOURCE.planSnapshotRunId,
  },
  {
    pr: 340,
    title: 'WORKER-0',
    mergeSha: 'f33b36e246268ce4231045ed6aab8de46ef1ac94',
    expectedRunId: TOOL_ROUTE_DRY_RUN_SOURCE.worker0RunId,
  },
  {
    pr: 343,
    title: 'WORKER-1',
    mergeSha: '82672f2cda8c4f84e970a6a2275a7802ed3954ea',
    expectedRunId: TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId,
  },
  {
    pr: 347,
    title: 'TOOL-ROUTE-0',
    mergeSha: 'ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49',
    expectedRunId: TOOL_ROUTE_DRY_RUN_SOURCE.toolRoute0RunId,
  },
  {
    pr: 354,
    title: 'WEB_SEARCH_CAPTURE TOOL-STUDY-0',
    mergeSha: '51ba1d44965d758935241af7712779bb15d713c6',
  },
  {
    pr: 356,
    title: 'MAP_GEOSPATIAL TOOL-STUDY-0',
    mergeSha: 'c0c96030358d52852b712b9f239a3237490d25ec',
  },
  {
    pr: 361,
    title: 'AI_TOOLS_CREATIVE_GRAPHICS TOOL-STUDY-0',
    mergeSha: '05d429f6029136f0f55fe01375809071b588791c',
  },
  {
    pr: 364,
    title: 'TRACK_A_RENDER_EXPORT TOOL-STUDY-0',
    mergeSha: '0ac258f939f403dbef438d3184408f28f874f26c',
  },
  {
    pr: 365,
    title: 'TRACK_B_MEDIA_PROCESSING TOOL-STUDY-0',
    mergeSha: '454d06caaf3b3349efa541f3ce50aac0bc0044aa',
  },
  {
    pr: 371,
    title: 'SOUND_MUSIC_AUDIO TOOL-STUDY-0',
    mergeSha: 'f6283e63742d6999910d3887482dc3112da1e570',
  },
] as const

export const TOOL_ROUTE_DRY_RUN_SOURCE_PATHS = {
  modelDryRunReport:
    'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_readiness_report.json',
  planSnapshotReport:
    'docs/activation-provider-output-plan-snapshot-contract-reports/reports/provider-output-plan-snapshot-contract-report.json',
  planSnapshotCandidate:
    'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json',
  worker0Report:
    'docs/activation-worker-runtime-jobs-audit-reports/reports/worker-runtime-jobs-audit-report.json',
  worker1Report:
    'docs/activation-worker-approved-plan-dry-run-reports/reports/worker-approved-plan-dry-run-report.json',
  worker1Batch:
    'docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json',
  worker1BlockedRoutes:
    'docs/activation-worker-approved-plan-dry-run-reports/validation/blocked-route-validation.json',
  toolRoute0Report:
    'docs/activation-tool-route-execution-unlock-audit-reports/reports/tool-route-execution-unlock-audit-report.json',
  toolRoute0FamilyMap:
    'docs/activation-tool-route-execution-unlock-audit-reports/routes/tool-route-family-map.json',
} as const

export const TOOL_ROUTE_DRY_RUN_OPTIONAL_ABSENT_PATHS = [
  'docs/runtime-unlock/runtime-unlock-roadmap.md',
  'docs/cross-chat/README.md',
  'docs/agents/README.md',
] as const

export const TOOL_ROUTE_DRY_RUN_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const TOOL_ROUTE_DRY_RUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_DRY_RUN_PLANNING',
] as const

export const TOOL_ROUTE_DRY_RUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_RUNTIME_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_MODEL_CALLS',
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
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_GOOGLE_CLOUD_API_CALLS',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_API_CALLS',
  'REEDITPRO_CONFIRM_STRIPE_CREDIT_MUTATION',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_INTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_FINAL_RENDER_EXPORT',
] as const

export const TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS: ToolRouteDryRunSafetyFlags = {
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
  audioSfxMusicGeneration: false,
  ffmpegFfprobeExecution: false,
  demucsRuntime: false,
  qwenVlmVllmRuntime: false,
}

export const TOOL_ROUTE_DRY_RUN_FAMILY_IDS: ToolRouteDryRunFamilyId[] = [
  'provider_model_planning',
  'worker_runtime_job_planning',
  'web_search_capture',
  'map_geospatial',
  'ai_tools_creative_graphics',
  'track_a_render_export',
  'track_b_media_processing',
  'sound_music_audio',
  'supabase_metadata_storage',
  'observability_audit_cost',
  'compliance_security',
  'frontend_product_ux',
  'billing_stripe_credits',
  'public_artifact_signed_url_delivery_blocked',
]

export const TOOL_ROUTE_DRY_RUN_OWNER_IDS: ToolRouteDryRunOwner[] = [
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'COMPLIANCE_SECURITY',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
]

export const TOOL_ROUTE_DRY_RUN_REPORT_PATHS = {
  sourceAudit: 'audit/tool-route-dry-run-source-audit.json',
  ownerStudyContext: 'studies/tool-route-owner-study-context.json',
  workerDryRunContext: 'worker/worker-dry-run-context.json',
  routeFamilyPlan: 'routes/tool-route-family-dry-run-plan.json',
  ownerRoutePlan: 'routes/tool-route-owner-route-plan.json',
  artifactContractMap: 'artifacts/tool-route-artifact-contract-map.json',
  qaGateMap: 'qa/tool-route-qa-gate-map.json',
  blockedExecutionValidation: 'validation/tool-route-blocked-execution-validation.json',
  gapMap: 'gaps/tool-route-dry-run-gap-map.json',
  nextPhasePlan: 'roadmap/tool-route-dry-run-next-phase-plan.json',
  qa: 'qa/tool-route-dry-run-planning-qa.json',
  report: 'reports/tool-route-dry-run-planning-report.json',
  summary: 'summary/tool-route-dry-run-planning-summary.json',
} as const

export function buildToolRouteDryRunRunId(): string {
  return `toolroute1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getToolRouteDryRunRunId(): string {
  return process.env.REEDITPRO_TOOL_ROUTE1_RUN_ID ??
    process.env.REEDITPRO_TOOL_ROUTE_DRY_RUN_PLANNING_RUN_ID ??
    buildToolRouteDryRunRunId()
}

export function getToolRouteDryRunGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(TOOL_ROUTE_DRY_RUN_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of TOOL_ROUTE_DRY_RUN_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of TOOL_ROUTE_DRY_RUN_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}

export function buildToolRouteDryRunSupabaseClassification(
  blockers: string[] = [],
): ToolRouteDryRunSupabaseClassification {
  return {
    updateRequired: 'docs/status only',
    updateStatus: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    milestoneSync: 'blocked_current_branch_missing_sync_layer',
    evidenceDocs: [
      'docs/activation-phase-tool-route-1-route-dry-run-planning-results.md',
      `${TOOL_ROUTE_DRY_RUN_REPORT_DIR}/reports/tool-route-dry-run-planning-report.json`,
    ],
    blockers,
    nextSupabaseAction: 'none',
  }
}

export function pathRecord(path: string, required: boolean, purpose: string) {
  return {
    path,
    exists: existsSync(path),
    required,
    purpose,
  }
}
