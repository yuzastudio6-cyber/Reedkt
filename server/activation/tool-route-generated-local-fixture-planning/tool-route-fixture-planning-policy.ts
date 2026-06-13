import { existsSync } from 'node:fs'
import type {
  ToolRouteFixtureFamilyId,
  ToolRouteFixtureOwner,
  ToolRouteFixtureRouteFamilyId,
  ToolRouteFixtureSafetyFlags,
  ToolRouteFixtureSupabaseClassification,
} from './tool-route-fixture-planning-types'

export const TOOL_ROUTE_FIXTURE_PHASE = 'TOOL_ROUTE_2'
export const TOOL_ROUTE_FIXTURE_OWNER = 'WORKER_RUNTIME_JOBS / TOOL_ROUTE_COORDINATION'
export const TOOL_ROUTE_FIXTURE_BRANCH = 'codex/rp-tool-route-2-generated-local-fixture-planning'
export const TOOL_ROUTE_FIXTURE_BASE_BRANCH = 'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const TOOL_ROUTE_FIXTURE_PR_TITLE = '[tool-route] Generated local fixture planning'
export const TOOL_ROUTE_FIXTURE_REPORT_DIR = 'docs/activation-tool-route-generated-local-fixture-planning-reports'

export const TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

export const TOOL_ROUTE_FIXTURE_SOURCE = {
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
  toolRoute1RunId: 'toolroute1-20260613T141131',
  toolRoute1Decision: 'tool_route_dry_run_planning_passed_ready_for_tool_route_2_generated_local_fixture_planning',
} as const

export const TOOL_ROUTE_FIXTURE_PR_STACK = [
  {
    pr: 331,
    title: 'MODEL-DRYRUN-1',
    mergeSha: '131d54e662abeafc8c415f63dca9b33f2b3f7afb',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.modelDryRunId,
  },
  {
    pr: 334,
    title: 'PLAN-SNAPSHOT-1',
    mergeSha: 'e31c58b4063a2b924852f4fd89770c243079f3ad',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.planSnapshotRunId,
  },
  {
    pr: 340,
    title: 'WORKER-0',
    mergeSha: 'f33b36e246268ce4231045ed6aab8de46ef1ac94',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.worker0RunId,
  },
  {
    pr: 343,
    title: 'WORKER-1',
    mergeSha: '82672f2cda8c4f84e970a6a2275a7802ed3954ea',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.worker1RunId,
  },
  {
    pr: 347,
    title: 'TOOL-ROUTE-0',
    mergeSha: 'ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute0RunId,
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
  {
    pr: 375,
    title: 'TOOL-ROUTE-1',
    mergeSha: 'b1fc1d40c5a41c6e3874331d2ed84dc7072d7364',
    expectedRunId: TOOL_ROUTE_FIXTURE_SOURCE.toolRoute1RunId,
  },
] as const

export const TOOL_ROUTE_FIXTURE_SOURCE_PATHS = {
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
  toolRoute1Report:
    'docs/activation-tool-route-dry-run-planning-reports/reports/tool-route-dry-run-planning-report.json',
  toolRoute1RouteFamilyPlan:
    'docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-family-dry-run-plan.json',
  toolRoute1OwnerRoutePlan:
    'docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-owner-route-plan.json',
  toolRoute1ArtifactContractMap:
    'docs/activation-tool-route-dry-run-planning-reports/artifacts/tool-route-artifact-contract-map.json',
  toolRoute1QaGateMap:
    'docs/activation-tool-route-dry-run-planning-reports/qa/tool-route-qa-gate-map.json',
  toolRoute1BlockedExecution:
    'docs/activation-tool-route-dry-run-planning-reports/validation/tool-route-blocked-execution-validation.json',
} as const

export const TOOL_ROUTE_FIXTURE_OPTIONAL_ABSENT_PATHS = [
  'docs/runtime-unlock/runtime-unlock-roadmap.md',
  'docs/cross-chat/README.md',
  'docs/agents/README.md',
  'server/activation/supabase-milestone-sync',
] as const

export const TOOL_ROUTE_FIXTURE_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

export const TOOL_ROUTE_FIXTURE_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_GENERATED_LOCAL_FIXTURE_PLANNING',
] as const

export const TOOL_ROUTE_FIXTURE_FORBIDDEN_CONFIRMATIONS = [
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
  'REEDITPRO_CONFIRM_AUDIO_GENERATION',
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

export const TOOL_ROUTE_FIXTURE_SAFETY_FLAGS: ToolRouteFixtureSafetyFlags = {
  executionAllowed: false,
  workerExecutionAllowed: false,
  toolExecutionAllowed: false,
  providerCallsAllowed: false,
  modelCallsAllowed: false,
  routeExecutionAllowed: false,
  mediaProcessingAllowed: false,
  browserCaptureAllowed: false,
  mapRenderingAllowed: false,
  audioGenerationAllowed: false,
  renderExportAllowed: false,
  publicArtifactsAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  supabaseMutationAllowed: false,
  sqlExecutionAllowed: false,
  migrationDeploymentAllowed: false,
  googleCloudApiCallsAllowed: false,
  secretManagerApiCallsAllowed: false,
  gcsStorageTransferAllowed: false,
  creditMutationAllowed: false,
  stripeProcessingAllowed: false,
  internalBetaUnlockAllowed: false,
  externalBetaUnlockAllowed: false,
  productionUnlockAllowed: false,
  dependencyMutationAllowed: false,
  finalRenderExportAllowed: false,
  broadServiceRoleHandlerAllowed: false,
}

export const TOOL_ROUTE_FIXTURE_ROUTE_FAMILY_IDS: ToolRouteFixtureRouteFamilyId[] = [
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

export const TOOL_ROUTE_FIXTURE_FAMILY_IDS: ToolRouteFixtureFamilyId[] = [
  'provider_model_planning_fixture',
  'worker_runtime_job_planning_fixture',
  'web_search_capture_fixture',
  'map_geospatial_fixture',
  'ai_tools_creative_graphics_fixture',
  'track_a_render_export_fixture',
  'track_b_media_processing_fixture',
  'sound_music_audio_fixture',
  'supabase_metadata_storage_fixture',
  'observability_audit_cost_fixture',
  'compliance_security_fixture',
  'frontend_product_ux_fixture',
  'billing_stripe_credits_fixture',
  'public_artifact_signed_url_delivery_blocked_fixture',
]

export const TOOL_ROUTE_FIXTURE_OWNER_IDS: ToolRouteFixtureOwner[] = [
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

export const TOOL_ROUTE_FIXTURE_REPORT_PATHS = {
  sourceAudit: 'audit/tool-route-fixture-source-audit.json',
  toolRoute1Evidence: 'evidence/tool-route-1-evidence-context.json',
  toolStudyEvidence: 'studies/tool-study-fixture-evidence-context.json',
  fixtureCatalog: 'fixtures/generated-local-fixture-catalog.json',
  inputOutputContractMap: 'contracts/fixture-input-output-contract-map.json',
  ownerFixtureHandoffMap: 'handoff/owner-fixture-handoff-map.json',
  qaGateMap: 'qa/fixture-qa-gate-map.json',
  blockedExecutionValidation: 'validation/fixture-blocked-execution-validation.json',
  gapMap: 'gaps/tool-route-fixture-gap-map.json',
  nextPhasePlan: 'roadmap/tool-route-fixture-next-phase-plan.json',
  qa: 'qa/tool-route-generated-local-fixture-planning-qa.json',
  report: 'reports/tool-route-generated-local-fixture-planning-report.json',
  summary: 'summary/tool-route-generated-local-fixture-planning-summary.json',
} as const

export function buildToolRouteFixtureRunId(): string {
  return `toolroute2-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getToolRouteFixtureRunId(): string {
  return process.env.REEDITPRO_TOOL_ROUTE2_RUN_ID ??
    process.env.REEDITPRO_TOOL_ROUTE_GENERATED_LOCAL_FIXTURE_PLANNING_RUN_ID ??
    buildToolRouteFixtureRunId()
}

export function getToolRouteFixtureGuardBlockers(): string[] {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(TOOL_ROUTE_FIXTURE_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of TOOL_ROUTE_FIXTURE_REQUIRED_CONFIRMATIONS) {
    if (process.env[name] !== 'true') blockers.push(`missing_confirmation:${name}`)
  }
  for (const name of TOOL_ROUTE_FIXTURE_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[name] === 'true') blockers.push(`forbidden_confirmation:${name}`)
  }
  return blockers
}

export function buildToolRouteFixtureSupabaseClassification(
  blockers: string[] = [],
): ToolRouteFixtureSupabaseClassification {
  return {
    updateRequired: 'docs/status only',
    updateStatus: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    milestoneSync: 'blocked_current_branch_missing_sync_layer',
    evidenceDocs: [
      'docs/activation-phase-tool-route-2-generated-local-fixture-planning-results.md',
      `${TOOL_ROUTE_FIXTURE_REPORT_DIR}/reports/tool-route-generated-local-fixture-planning-report.json`,
    ],
    blockers,
    nextSupabaseAction: 'none',
  }
}

export function fixturePathRecord(path: string, required: boolean, purpose: string) {
  return {
    path,
    exists: existsSync(path),
    required,
    purpose,
    status: existsSync(path) ? 'present' : 'missing_on_base',
  } as const
}
