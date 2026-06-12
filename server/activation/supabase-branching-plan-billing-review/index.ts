import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseBranchingPlanBillingBlocker,
  SupabaseBranchingPlanBillingDecision,
} from './branching-plan-billing-types'

export const SUPABASE_BRANCHING_PLAN_BILLING_PHASE =
  'supabase-branching-plan-billing-review'
export const SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID =
  'supabase-branching-plan-billing-review-20260610'
export const SUPABASE_BRANCHING_PLAN_BILLING_BRANCH =
  'codex/rp-foundation-supabase-branching-plan-billing-review'
export const SUPABASE_BRANCHING_PLAN_BILLING_BASE_BRANCH =
  'codex/rp-foundation-supabase-clean-staging-branch-execution'
export const SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR =
  'docs/activation-supabase-branching-plan-billing-reports'

export const SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_BRANCHING_PLAN_BILLING_REVIEW'
export const SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_BRANCHING_COST_REVIEW'

export const SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'branching_plan_billing_review_plan.json',
  'branching_plan_billing_evidence_inventory.json',
  'branching_plan_billing_cost_estimate.json',
  'branching_plan_billing_operator_checklist.json',
  'branching_plan_billing_decision.json',
  'branching_plan_billing_blocker_report.json',
  'branching_plan_billing_readiness_report.json',
  'branching_plan_billing_private_artifact_manifest.json',
] as const

export const SUPABASE_BRANCHING_PLAN_BILLING_DOCS = [
  'docs/supabase-branching-plan-billing-decision.md',
  'docs/supabase-branching-plan-billing-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-rerun-after-billing.md',
] as const

const CLEAN_STAGING_PARENT_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const CLEAN_STAGING_PARENT_PROJECT_NAME = 'Reeditpro'
const CLEAN_STAGING_BRANCH_NAME = 'reeditpro-internal-staging-clean'
const TARGET_REGISTRY_MIGRATION_FILE =
  '202606050001_activation_milestone_registry_schema_rls.sql'
const TARGET_REGISTRY_MIGRATION_ID = '202606050001'
const DEFAULT_MICRO_BRANCH_HOURLY_USD = 0.01344

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
] as const

const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const PR280_REPORT_DIR = 'docs/activation-supabase-clean-staging-target-approval-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const PR200_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const OPERATOR_BILLING_APPROVAL_DOC =
  'docs/supabase-branching-plan-billing-operator-action.md'

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_PERSISTENT_BRANCH_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_BRANCHING_COST_ACCEPTANCE',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_MIGRATION_APPLY',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_SCHEMA_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_BRANCH_WITH_DATA',
  'REEDITPRO_CONFIRM_SUPABASE_BILLING_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_PLAN_UPGRADE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_PUSH',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

const SENSITIVE_PATTERNS = [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['anon_key', '='].join(''),
  ['access_token', '='].join(''),
  ['jwt_secret', '='].join(''),
  'sbp_',
  ['"', 'secret', 'Value', '"'].join(''),
  ['"', 'private', 'Payload', '"'].join(''),
] as const

type JsonRecord = Record<string, unknown>
type Reports = ReturnType<typeof buildSupabaseBranchingPlanBillingReports>

export function getSupabaseBranchingPlanBillingPlan(): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    branch: SUPABASE_BRANCHING_PLAN_BILLING_BRANCH,
    baseBranch: SUPABASE_BRANCHING_PLAN_BILLING_BASE_BRANCH,
    prTitle: '[foundation] Supabase branching plan billing review',
    worktree: '/private/tmp/reeditpro-supabase-branching-plan-billing-review',
    reportDir: SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
    expectedReports: SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS,
    docs: SUPABASE_BRANCHING_PLAN_BILLING_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 280, 283],
    docsBasis: {
      supabaseBranching: 'https://supabase.com/docs/guides/deployment/branching',
      supabaseBranchingUsage:
        'https://supabase.com/docs/guides/platform/manage-your-usage/branching',
      supabaseCliReference: 'https://supabase.com/docs/reference/cli/introduction',
      supabaseDbPush: 'https://supabase.com/docs/reference/cli/supabase-db-push',
      checkedAt: '2026-06-10',
    },
    target: {
      projectName: CLEAN_STAGING_PARENT_PROJECT_NAME,
      projectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      branchName: CLEAN_STAGING_BRANCH_NAME,
      persistent: true,
      withData: false,
    },
    allowedConfirmations: [
      SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION,
      SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    defaultDecision: 'blocked_pending_operator_billing_action',
    allowedActions: [
      'read_committed_safe_reports',
      'review_official_supabase_branching_cost_docs',
      'write_safe_metadata_reports_and_docs',
    ],
    blockedActions: [
      'supabase_branch_creation',
      'billing_mutation_or_plan_upgrade',
      'sql_or_ddl_dml',
      'schema_migration_deploy',
      'migration_history_repair',
      'track_b_backfill_write',
      'support_ticket_submission',
      'production_supabase',
      'secret_payload_access_or_printing',
      'provider_calls',
      'worker_tool_route_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
  }
}

export function buildSupabaseBranchingPlanBillingReports(input: {
  reviewConfirmed?: boolean
  costReviewConfirmed?: boolean
} = {}) {
  const preservedReview = input.reviewConfirmed === undefined && input.costReviewConfirmed === undefined
    ? loadLatestReviewedDecision()
    : null
  const effectiveInput = preservedReview
    ? {
        reviewConfirmed: true,
        costReviewConfirmed: true,
        preservedFromLatestReviewedPacket: true,
      }
    : input
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseBranchingPlanBillingPlan()
  const evidenceInventory = buildEvidenceInventory()
  const costEstimate = buildCostEstimate()
  const operatorChecklist = buildOperatorChecklist()
  const decision = buildDecision({
    evidenceInventory,
    costEstimate,
    input: effectiveInput,
  })
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    costEstimate,
    operatorChecklist,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseBranchingPlanBillingArtifacts(reports: Reports) {
  const dir = SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'source_of_truth_ownership_audit.json'),
    reports.sourceOfTruthOwnershipAudit,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_review_plan.json'),
    reports.plan,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_evidence_inventory.json'),
    reports.evidenceInventory,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_cost_estimate.json'),
    reports.costEstimate,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_operator_checklist.json'),
    reports.operatorChecklist,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_decision.json'),
    reports.decision,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_blocker_report.json'),
    reports.blockerReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_readiness_report.json'),
    reports.readinessReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'branching_plan_billing_private_artifact_manifest.json'),
    reports.privateArtifactManifest,
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-branching-plan-billing-decision.md',
    renderDecisionDoc(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-branching-plan-billing-operator-checklist.md',
    renderOperatorChecklistDoc(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-clean-staging-branch-rerun-after-billing.md',
    renderRerunPrompt(reports),
  )
}

export async function executeSupabaseBranchingPlanBillingReview(input: {
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseBranchingPlanBillingReports({
    reviewConfirmed: process.env[SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION] === 'true',
    costReviewConfirmed: process.env[SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION] === 'true',
  })
  await writeSupabaseBranchingPlanBillingArtifacts(reports)
  const ok = reports.decision.decision === 'approved_for_future_branch_create_after_billing_enablement'
  return { reports, exitCode: ok ? 0 : 1 }
}

export function readSupabaseBranchingPlanBillingSummary(): JsonRecord {
  return summarizeSupabaseBranchingPlanBillingReports(buildSupabaseBranchingPlanBillingReports())
}

export function summarizeSupabaseBranchingPlanBillingReports(reports: Reports): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.decision.decision,
    approvalStatus: reports.decision.approvalStatus,
    targetProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    targetBranchName: CLEAN_STAGING_BRANCH_NAME,
    defaultMicroBranchHourlyUsd: DEFAULT_MICRO_BRANCH_HOURLY_USD,
    sixDayInternalTestingEstimateUsd: asRecord(reports.costEstimate.estimatedCostsUsd).sixDayInternalTesting,
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.blockerReport.activeBlockers,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_failure_diagnostics_report.json'),
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_retry_strategy_report.json'),
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_readiness_report.json'),
    path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    path.join(PR200_REPORT_DIR, 'schema_readiness_report.json'),
  ]
  const missingRequiredReports = reportPaths.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    mode: 'branching_plan_billing_review_packet',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    reportPaths: reportPaths.map((reportPath) => ({
      path: reportPath,
      present: existsSync(reportPath),
    })),
    localMigrationInventory: {
      migrationDir: MIGRATION_DIR,
      localMigrationCount: getLocalMigrationIds().length,
      localMigrationIds: getLocalMigrationIds(),
      targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
      targetRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    },
    status: missingRequiredReports.length === 0 ? 'passed' : 'blocked',
    blockers: missingRequiredReports.length === 0
      ? []
      : (['pr283_branch_create_plan_or_billing_evidence_missing'] satisfies SupabaseBranchingPlanBillingBlocker[]),
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    secretPayloadAccessed: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const pr283Diagnostics = readJsonArtifact(
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_failure_diagnostics_report.json'),
  )
  const pr283RetryStrategy = readJsonArtifact(
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_retry_strategy_report.json'),
  )
  const pr283Readiness = readJsonArtifact(
    path.join(PR283_REPORT_DIR, 'clean_staging_branch_readiness_report.json'),
  )
  const pr280Decision = readJsonArtifact(
    path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
  )
  const pr198Preflight = readJsonArtifact(
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  )
  const registryMigrationPresent = existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE))
  const operatorEvidence = loadOperatorBillingApprovalEvidence()

  const blockers: SupabaseBranchingPlanBillingBlocker[] = []
  if (
    pr283Diagnostics?.failureClass !== 'branch_create_plan_or_billing_unavailable' ||
    pr283RetryStrategy?.retryStrategy !== 'blocked_pending_plan_or_billing_review'
  ) {
    blockers.push('pr283_branch_create_plan_or_billing_evidence_missing')
  }
  if (pr280Decision?.decision !== 'approved_for_future_clean_supabase_staging_branch') {
    blockers.push('pr280_clean_staging_target_approval_missing')
  }
  if (!pr198Preflight) blockers.push('pr198_trackb_backfill_preflight_missing')
  if (!registryMigrationPresent) blockers.push('pr200_registry_migration_missing')
  if (!operatorEvidence.operatorBillingActionRecorded) blockers.push('operator_billing_action_missing')
  if (!operatorEvidence.costOwnerApprovalRecorded) blockers.push('operator_cost_owner_approval_missing')

  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: blockers.filter((blocker) =>
      !['operator_billing_action_missing', 'operator_cost_owner_approval_missing'].includes(blocker),
    ).length === 0 ? 'passed_with_operator_action_missing' : 'blocked',
    pr283: {
      diagnosticsPath: path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_failure_diagnostics_report.json'),
      retryStrategyPath: path.join(PR283_REPORT_DIR, 'clean_staging_branch_create_retry_strategy_report.json'),
      readinessPath: path.join(PR283_REPORT_DIR, 'clean_staging_branch_readiness_report.json'),
      targetProjectRef: asString(pr283Diagnostics?.targetProjectRef, CLEAN_STAGING_PARENT_PROJECT_REF),
      targetBranchName: asString(pr283Diagnostics?.branchName, CLEAN_STAGING_BRANCH_NAME),
      persistent: pr283Diagnostics?.persistent === true,
      withData: pr283Diagnostics?.withData === true ? true : false,
      failureClass: asString(pr283Diagnostics?.failureClass, 'missing'),
      deterministicRetryPossible: pr283Diagnostics?.deterministicRetryPossible === true,
      retryStrategy: asString(pr283RetryStrategy?.retryStrategy, 'missing'),
      branchCreated: false,
      sqlExecuted: pr283Readiness?.sqlExecuted === true,
      migrationDeployed: pr283Readiness?.migrationDeployed === true,
      trackBBackfillRowsWritten: pr283Readiness?.trackBBackfillRowsWritten === true,
      productionAffected: pr283Readiness?.productionAffected === true,
    },
    pr280: {
      decisionPath: path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
      decision: asString(pr280Decision?.decision, 'missing'),
      approvalStatus: asString(pr280Decision?.approvalStatus, 'missing'),
      recommendedTarget: asString(pr280Decision?.recommendedTarget, 'missing'),
    },
    pr198: {
      preflightPath: path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
      preflightStatus: asString(pr198Preflight?.status, 'missing'),
      trackBBackfillRowsWritten: false,
    },
    pr200: {
      targetRegistryMigrationId: TARGET_REGISTRY_MIGRATION_ID,
      targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
      migrationPresent: registryMigrationPresent,
      localMigrationCount: getLocalMigrationIds().length,
    },
    operatorBillingApprovalEvidence: operatorEvidence,
    sourceFactsAccepted: {
      targetProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      targetBranchName: CLEAN_STAGING_BRANCH_NAME,
      persistent: true,
      withData: false,
      failureClass: 'branch_create_plan_or_billing_unavailable',
      deterministicRetryPossible: false,
      branchCreated: false,
      billingMutationRun: false,
      planUpgradeRun: false,
      sqlExecuted: false,
      migrationDeployed: false,
      migrationRepairRun: false,
      trackBBackfillRowsWritten: false,
      productionAffected: false,
    },
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildCostEstimate(): JsonRecord {
  const daily = DEFAULT_MICRO_BRANCH_HOURLY_USD * 24
  const sixDay = daily * 6
  const monthly = daily * 30
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: 'reviewed_from_official_docs_operator_action_required',
    docsEvidence: [
      {
        source: 'https://supabase.com/docs/guides/deployment/branching',
        facts: [
          'Supabase branches are separate environments.',
          'Persistent branches are long-lived and recommended for staging, QA, or development.',
          'New branches do not start with data from the main project by default.',
        ],
      },
      {
        source: 'https://supabase.com/docs/guides/platform/manage-your-usage/branching',
        facts: [
          'Branch usage counts toward subscription plan quota and is not covered by Spend Cap.',
          'A branch running on default Micro compute starts at $0.01344 per hour.',
          'Branching compute appears as Branching Compute Hours; other usage rolls into the project.',
        ],
      },
    ],
    target: {
      projectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      branchName: CLEAN_STAGING_BRANCH_NAME,
      persistent: true,
      withData: false,
      computeClassAssumption: 'default_micro_branch_starting_rate',
    },
    estimatedCostsUsd: {
      hourly: usd(DEFAULT_MICRO_BRANCH_HOURLY_USD),
      daily24Hours: usd(daily),
      sixDayInternalTesting: usd(sixDay),
      monthlyIfLeftRunning30Days: usd(monthly),
    },
    unknownsNotGuessed: [
      'actual subscription plan quota and branching availability',
      'branch disk usage above included quota',
      'egress generated by branch testing',
      'storage usage generated by branch testing',
      'organization-specific billing credits or discounts',
      'whether branch size/region affects final hourly rate',
    ],
    costRisk: 'low_medium_until_operator_confirms_plan_billing_and_quota',
    costOwnerActionRequired: true,
    billingMutationRun: false,
    planUpgradeRun: false,
    branchCreated: false,
  }
}

function buildOperatorChecklist(): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: 'operator_action_required',
    checklist: [
      'Open the Supabase dashboard for the organization that owns project wmyyttnynmteqgcdishd.',
      'Confirm Branching is available for the plan and account.',
      'Confirm persistent branch usage is acceptable for internal staging and QA.',
      'Confirm cost owner accepts default Micro branch starting-rate exposure and unknown usage items.',
      'Record repo-safe approval evidence before rerunning the PR #283 clean branch execution.',
      'Keep the branch data-less; do not use with-data cloning.',
      'Keep Track B backfill writes separate until clean branch schema/RLS verification passes.',
    ],
    allowedConfirmations: [
      SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION,
      SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    operatorBillingActionRecorded: false,
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    productionAffected: false,
  }
}

function buildDecision(input: {
  evidenceInventory: JsonRecord
  costEstimate: JsonRecord
  input: {
    reviewConfirmed?: boolean
    costReviewConfirmed?: boolean
    preservedFromLatestReviewedPacket?: boolean
  }
}): JsonRecord {
  const forbiddenSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const blockers: SupabaseBranchingPlanBillingBlocker[] = []
  blockers.push(...(asStringArray(input.evidenceInventory.blockers) as SupabaseBranchingPlanBillingBlocker[]))
  if (input.input.reviewConfirmed !== true) blockers.push('branching_plan_billing_review_not_confirmed')
  if (input.input.costReviewConfirmed !== true) blockers.push('branching_cost_review_not_confirmed')
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')

  const operatorEvidence = asRecord(input.evidenceInventory.operatorBillingApprovalEvidence)
  const operatorBillingActionRecorded = operatorEvidence.operatorBillingActionRecorded === true
  const costOwnerApprovalRecorded = operatorEvidence.costOwnerApprovalRecorded === true
  const orgOwnerPermissionRecorded = operatorEvidence.orgOwnerPermissionRecorded === true
  const unacceptableCostRisk = operatorEvidence.unacceptableCostRisk === true

  let decision: SupabaseBranchingPlanBillingDecision
  let approvalStatus = 'not_approved_for_branch_create_rerun'
  if (forbiddenSet.length > 0) {
    decision = 'blocked_pending_operator_billing_action'
  } else if (unacceptableCostRisk) {
    decision = 'rejected_due_unacceptable_cost_risk'
  } else if (input.input.reviewConfirmed !== true || input.input.costReviewConfirmed !== true) {
    decision = 'blocked_pending_operator_billing_action'
  } else if (!operatorBillingActionRecorded) {
    decision = 'blocked_pending_operator_billing_action'
  } else if (!costOwnerApprovalRecorded) {
    decision = 'blocked_pending_cost_owner_approval'
  } else if (!orgOwnerPermissionRecorded) {
    decision = 'blocked_pending_org_owner_permission'
  } else if (input.evidenceInventory.status === 'passed_with_operator_action_missing') {
    decision = 'approved_for_future_branch_create_after_billing_enablement'
    approvalStatus = 'future_pr283_branch_create_rerun_approved_not_executed'
  } else {
    decision = 'blocked_pending_support_or_dashboard_review'
  }

  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: decision.startsWith('approved_') ? 'approved_future_only' : 'blocked',
    decision,
    approvalStatus,
    reason: decision === 'blocked_pending_operator_billing_action'
      ? 'PR #283 reached a plan/billing branch-create blocker, but no repo-safe operator billing/branching action is recorded.'
      : 'Future branch-create rerun requires completed billing/plan evidence and remains separate from this packet.',
    target: {
      projectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      branchName: CLEAN_STAGING_BRANCH_NAME,
      persistent: true,
      withData: false,
    },
    confirmations: {
      branchingPlanBillingReview: input.input.reviewConfirmed === true,
      branchingCostReview: input.input.costReviewConfirmed === true,
      preservedFromLatestReviewedPacket: input.input.preservedFromLatestReviewedPacket === true,
      forbiddenConfirmationsSet: forbiddenSet,
    },
    operatorBillingActionRecorded,
    costOwnerApprovalRecorded,
    orgOwnerPermissionRecorded,
    costEstimateStatus: input.costEstimate.status,
    futureExecutionGates: [
      'operator_confirms_supabase_branching_enabled_or_billing_action_completed',
      'cost_owner_accepts_persistent_branch_cost_and_usage_unknowns',
      'org_owner_permission_confirmed_if_required',
      'rerun_pr283_clean_staging_branch_execution_with_data_less_persistent_branch_only',
      'verify_clean_branch_schema_rls_migration_history_before_track_b_backfill',
      'run_track_b_backfill_only_in_later_separate_guarded_phase',
    ],
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretPayloadAccessed: false,
    secretsPrintedOrCommitted: false,
    providerCalls: false,
    workerToolRouteExecution: false,
    mediaProcessing: false,
    trackA: 'not_touched',
    blockers: decision.startsWith('approved_') ? [] : collectUniqueBlockers(blockers),
  }
}

function buildBlockerReport(decision: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: String(decision.decision).startsWith('approved_') ? 'no_active_packet_blockers' : 'blocked',
    decision: decision.decision,
    activeBlockers: asStringArray(decision.blockers),
    blockedScopes: [
      'supabase_branch_creation',
      'billing_mutation_or_plan_upgrade',
      'sql_or_ddl_dml',
      'schema_migration_deploy',
      'migration_history_repair',
      'track_b_backfill_write',
      'support_ticket_submission',
      'production_supabase',
      'secret_payload_access_or_printing',
      'provider_calls',
      'worker_tool_route_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    productionAffected: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    status: String(decision.decision).startsWith('approved_')
      ? 'future_pr283_branch_create_rerun_approved_not_executed'
      : 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    activeBlockers: asStringArray(blockerReport.activeBlockers),
    cleanStagingBranchCreateAllowedInThisPhase: false,
    billingMutationAllowedInThisPhase: false,
    planUpgradeAllowedInThisPhase: false,
    migrationDeployAllowedInThisPhase: false,
    trackBBackfillAllowedInThisPhase: false,
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: String(decision.decision).startsWith('approved_')
      ? 'Rerun PR #283 clean staging branch execution after billing enablement.'
      : 'Complete the operator billing/branching dashboard action and record repo-safe approval evidence before rerunning PR #283.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_BRANCHING_PLAN_BILLING_PHASE,
    runId: SUPABASE_BRANCHING_PLAN_BILLING_RUN_ID,
    reportDir: SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
    committedArtifacts: [
      ...SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS.map((name) =>
        path.join(SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR, name),
      ),
      ...SUPABASE_BRANCHING_PLAN_BILLING_DOCS,
    ],
    privateUploadRequired: false,
    privateDataPayloadsCommitted: false,
    dbUrlCommitted: false,
    keyMaterialCommitted: false,
    tokenCommitted: false,
    backupPayloadCommitted: false,
    mediaPayloadCommitted: false,
    branchCreated: false,
    billingMutationRun: false,
    productionAffected: false,
  }
}

function renderDecisionDoc(reports: Reports): string {
  const cost = asRecord(reports.costEstimate.estimatedCostsUsd)
  return `# Supabase Branching Plan Billing Decision

Decision: \`${reports.decision.decision}\`

Approval status: \`${reports.decision.approvalStatus}\`

Target: \`${CLEAN_STAGING_PARENT_PROJECT_REF}\` / \`${CLEAN_STAGING_BRANCH_NAME}\`

This packet reviews Supabase branching plan and billing readiness only. It does not create a branch, mutate billing, upgrade a plan, run SQL, deploy migrations, repair migration history, write Track B backfill rows, submit support tickets, touch production, or read secret payloads.

## Source Evidence

- PR #283 failure class: \`${asString(asRecord(reports.evidenceInventory.pr283).failureClass, 'missing')}\`
- PR #283 deterministic retry possible: \`${String(asRecord(reports.evidenceInventory.pr283).deterministicRetryPossible === true)}\`
- PR #280 clean target approval: \`${asString(asRecord(reports.evidenceInventory.pr280).decision, 'missing')}\`
- PR #198 Track B backfill remains separate: \`true\`
- Registry migration present: \`${String(asRecord(reports.evidenceInventory.pr200).migrationPresent === true)}\`

## Cost Estimate

- Default Micro branch hourly starting rate: \`$${cost.hourly}\`
- 24-hour estimate: \`$${cost.daily24Hours}\`
- 6-day internal testing estimate: \`$${cost.sixDayInternalTesting}\`
- 30-day if left running estimate: \`$${cost.monthlyIfLeftRunning30Days}\`

Usage unknowns such as egress, disk, storage, quota, and branch size/region effects are not guessed in this packet.

## Required Next Action

The current decision remains blocked until an operator completes and records the Supabase billing/branching dashboard action and cost-owner approval in repo-safe metadata.

## Documentation Basis

- Supabase Branching: https://supabase.com/docs/guides/deployment/branching
- Supabase Branching usage and pricing: https://supabase.com/docs/guides/platform/manage-your-usage/branching
- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
- Supabase db push reference: https://supabase.com/docs/reference/cli/supabase-db-push
`
}

function renderOperatorChecklistDoc(reports: Reports): string {
  return `# Supabase Branching Plan Billing Operator Checklist

Decision: \`${reports.decision.decision}\`

Future operator action checklist:

${asStringArray(reports.operatorChecklist.checklist).map((item) => `- ${item}`).join('\n')}

This packet records review status only. Branch creation, billing mutation, plan upgrade, SQL, migration deploy, migration repair, Track B backfill, production, and secret payload access remain blocked.
`
}

function renderRerunPrompt(reports: Reports): string {
  return `# Supabase Clean Staging Branch Rerun After Billing

Use this prompt only after the Supabase branching plan/billing blocker is resolved by repo-safe operator evidence.

## Current Packet

- Decision: \`${reports.decision.decision}\`
- Required blocker to clear: \`operator_billing_action_missing\`
- Target project ref: \`${CLEAN_STAGING_PARENT_PROJECT_REF}\`
- Target branch: \`${CLEAN_STAGING_BRANCH_NAME}\`
- Persistent: \`true\`
- With data: \`false\`

## Required Future Behavior

- Rerun PR #283 clean staging branch execution only after billing/branching enablement and cost-owner approval are recorded.
- Keep the branch data-less and persistent for internal staging only.
- Apply migrations only through the approved migration-safe workflow in the clean branch execution phase.
- Verify schema/RLS and migration history before any Track B milestone backfill.
- Keep Track B backfill writes as a later separate guarded phase.

## Still Forbidden

No production Supabase, billing mutation by Codex, plan upgrade by Codex, current staging reset, migration repair, direct SQL, Track B writes, support ticket submission, provider/tool/worker/media execution, Track A, beta, or production unlock is authorized by this packet.
`
}

function loadOperatorBillingApprovalEvidence(): JsonRecord {
  if (!existsSync(OPERATOR_BILLING_APPROVAL_DOC)) {
    return {
      sourcePath: OPERATOR_BILLING_APPROVAL_DOC,
      present: false,
      operatorBillingActionRecorded: false,
      costOwnerApprovalRecorded: false,
      orgOwnerPermissionRecorded: false,
      unacceptableCostRisk: false,
      blocker: 'operator_billing_action_missing',
    }
  }
  const text = readFileSync(OPERATOR_BILLING_APPROVAL_DOC, 'utf8')
  return {
    sourcePath: OPERATOR_BILLING_APPROVAL_DOC,
    present: true,
    operatorBillingActionRecorded: text.includes('supabase_branching_plan_billing_action_status: completed'),
    costOwnerApprovalRecorded: text.includes('supabase_branching_cost_owner_approval_status: approved'),
    orgOwnerPermissionRecorded: text.includes('supabase_branching_org_owner_permission_status: approved'),
    unacceptableCostRisk: text.includes('supabase_branching_cost_risk_status: unacceptable'),
    payloadPrinted: false,
    payloadCommitted: false,
  }
}

function loadLatestReviewedDecision(): JsonRecord | null {
  const decision = readJsonArtifact(
    path.join(SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR, 'branching_plan_billing_decision.json'),
  )
  const confirmations = asRecord(decision?.confirmations)
  return confirmations.branchingPlanBillingReview === true &&
    confirmations.branchingCostReview === true
    ? decision
    : null
}

function readJsonArtifact(filePath: string): JsonRecord | null {
  if (!existsSync(filePath)) return null
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown
    return asRecord(parsed)
  } catch {
    return null
  }
}

function getLocalMigrationIds(): string[] {
  if (!existsSync(MIGRATION_DIR)) return []
  return readdirSync(MIGRATION_DIR)
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .map((name) => name.split('_')[0] ?? name)
    .sort()
}

function collectUniqueBlockers(
  ...groups: Array<readonly SupabaseBranchingPlanBillingBlocker[]>
): SupabaseBranchingPlanBillingBlocker[] {
  return Array.from(new Set(groups.flat()))
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function safeStatIsDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function usd(value: number): string {
  return value.toFixed(5).replace(/0+$/, '').replace(/\.$/, '')
}

export function scanSupabaseBranchingPlanBillingPayloadText(text: string): string[] {
  return SENSITIVE_PATTERNS.filter((pattern) => text.includes(pattern))
}
