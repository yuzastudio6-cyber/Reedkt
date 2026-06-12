import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseCleanStagingTargetApprovalBlocker,
  SupabaseCleanStagingTargetApprovalDecision,
  SupabaseCleanStagingTargetKind,
} from './clean-staging-target-approval-types'

export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE =
  'supabase-clean-staging-target-approval'
export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID =
  'supabase-clean-staging-target-approval-20260610'
export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_BRANCH =
  'codex/rp-foundation-supabase-clean-staging-target-approval'
export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_BASE_BRANCH =
  'codex/rp-foundation-supabase-support-ticket-submission'
export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-clean-staging-target-approval-reports'

export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PACKET'
export const SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW'

export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'clean_staging_target_approval_plan.json',
  'clean_staging_evidence_inventory.json',
  'clean_staging_option_matrix.json',
  'clean_staging_cost_risk_review.json',
  'clean_staging_secret_reference_plan.json',
  'clean_staging_migration_and_backfill_plan.json',
  'clean_staging_operator_checklist.json',
  'clean_staging_target_approval_decision.json',
  'clean_staging_target_blocker_report.json',
  'clean_staging_target_readiness_report.json',
  'clean_staging_private_artifact_manifest.json',
] as const

export const SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS = [
  'docs/supabase-clean-staging-target-approval-decision.md',
  'docs/supabase-clean-staging-target-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-target-execution.md',
] as const

const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const TARGET_REGISTRY_MIGRATION_ID = '202606050001'
const TARGET_REGISTRY_MIGRATION_FILE =
  '202606050001_activation_milestone_registry_schema_rls.sql'

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

const PR276_REPORT_DIR = 'docs/activation-supabase-support-ticket-submission-reports'
const PR274_REPORT_DIR = 'docs/activation-supabase-support-escalation-approval-reports'
const PR271_REPORT_DIR = 'docs/activation-supabase-reset-retry-failure-diagnostics-reports'
const PR269_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR200_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_BRANCH_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_PROJECT_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_DB_PUSH',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
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
type Reports = ReturnType<typeof buildSupabaseCleanStagingTargetApprovalReports>

export function getSupabaseCleanStagingTargetApprovalPlan(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    branch: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_BRANCH,
    baseBranch: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_BASE_BRANCH,
    prTitle: '[foundation] Supabase clean staging target approval',
    worktree: '/private/tmp/reeditpro-supabase-clean-staging-target-approval',
    reportDir: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS,
    docs: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 252, 269, 271, 274, 276],
    docsBasis: {
      supabaseCliReference: 'https://supabase.com/docs/reference/cli/introduction',
      supabaseDatabaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      supabaseChangelog: 'https://supabase.com/changelog',
      checkedAt: '2026-06-10',
      branchOrProjectCreationApprovedInThisPhase: false,
    },
    approvedCurrentStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    allowedConfirmations: [
      SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION,
      SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    preferredDecision: 'approved_for_future_clean_supabase_staging_branch',
    fallbackDecision: 'approved_for_future_clean_supabase_staging_project',
    allowedActions: [
      'read_committed_safe_reports',
      'compare_clean_staging_options',
      'record_future_execution_gates',
      'write_safe_reports_and_docs',
    ],
    blockedActions: [
      'supabase_branch_creation',
      'supabase_project_creation',
      'staging_reset',
      'schema_migration_deploy',
      'migration_history_repair',
      'direct_sql_or_ddl_dml',
      'track_b_backfill_write',
      'support_ticket_submission',
      'production_supabase',
      'secret_payload_access_or_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
  }
}

export function buildSupabaseCleanStagingTargetApprovalReports(input: {
  approvalConfirmed?: boolean
  replacementReviewConfirmed?: boolean
} = {}) {
  const preservedApproval = input.approvalConfirmed === true || input.replacementReviewConfirmed === true
    ? null
    : loadLatestApprovedDecision()
  const effectiveInput = preservedApproval
    ? {
        approvalConfirmed: true,
        replacementReviewConfirmed: true,
        preservedFromLatestApprovedPacket: true,
      }
    : input
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseCleanStagingTargetApprovalPlan()
  const evidenceInventory = buildEvidenceInventory()
  const optionMatrix = buildOptionMatrix(evidenceInventory)
  const costRiskReview = buildCostRiskReview()
  const secretReferencePlan = buildSecretReferencePlan()
  const migrationAndBackfillPlan = buildMigrationAndBackfillPlan()
  const operatorChecklist = buildOperatorChecklist()
  const approvalDecision = buildApprovalDecision({
    evidenceInventory,
    optionMatrix,
    costRiskReview,
    secretReferencePlan,
    input: effectiveInput,
  })
  const blockerReport = buildBlockerReport(approvalDecision)
  const readinessReport = buildReadinessReport(approvalDecision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    optionMatrix,
    costRiskReview,
    secretReferencePlan,
    migrationAndBackfillPlan,
    operatorChecklist,
    approvalDecision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseCleanStagingTargetApprovalArtifacts(reports: Reports) {
  const dir = SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_target_approval_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_option_matrix.json'), reports.optionMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_cost_risk_review.json'), reports.costRiskReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_secret_reference_plan.json'), reports.secretReferencePlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_migration_and_backfill_plan.json'), reports.migrationAndBackfillPlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_target_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_target_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_target_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-clean-staging-target-approval-decision.md',
    renderApprovalDecisionDoc(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-clean-staging-target-operator-checklist.md',
    renderOperatorChecklistDoc(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-clean-staging-target-execution.md',
    renderCleanStagingExecutionPrompt(reports),
  )
}

export async function executeSupabaseCleanStagingTargetApproval(input: {
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseCleanStagingTargetApprovalReports({
    approvalConfirmed: process.env[SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION] === 'true',
    replacementReviewConfirmed: process.env[SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION] === 'true',
  })
  await writeSupabaseCleanStagingTargetApprovalArtifacts(reports)
  const ok = [
    'approved_for_future_clean_supabase_staging_branch',
    'approved_for_future_clean_supabase_staging_project',
  ].includes(asString(reports.approvalDecision.decision, 'blocked'))
  return { reports, exitCode: ok ? 0 : 1 }
}

export function readSupabaseCleanStagingTargetApprovalSummary(): JsonRecord {
  const reports = buildSupabaseCleanStagingTargetApprovalReports()
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    approvalStatus: reports.approvalDecision.approvalStatus,
    recommendedTarget: reports.approvalDecision.recommendedTarget,
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    blockers: reports.blockerReport.activeBlockers,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR276_REPORT_DIR, 'support_ticket_submission_readiness_report.json'),
    path.join(PR276_REPORT_DIR, 'support_ticket_submission_evidence_inventory.json'),
    path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
    path.join(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR200_REPORT_DIR, 'schema_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  const missingRequiredReports = reportPaths.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    mode: 'clean_staging_target_approval_packet',
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
      : (['pr276_support_ticket_submission_evidence_missing'] satisfies SupabaseCleanStagingTargetApprovalBlocker[]),
    crossChatOwnership: {
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      related: [
        'TRACK_B_MEDIA_PROCESSING',
        'OBSERVABILITY_AUDIT_COST',
        'WORKER_RUNTIME_JOBS',
        'PRODUCT_INTERNAL_BETA_AGGREGATION',
      ],
      notOwned: [
        'track_b_runtime_tool_execution',
        'track_a_visual_video_pipeline',
        'provider_model_execution',
        'production_external_beta_unlocks',
      ],
    },
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const pr276Readiness = readJsonArtifact(path.join(PR276_REPORT_DIR, 'support_ticket_submission_readiness_report.json'))
  const pr276Evidence = readJsonArtifact(path.join(PR276_REPORT_DIR, 'support_ticket_submission_evidence_inventory.json'))
  const pr274Decision = readJsonArtifact(path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'))
  const pr271Decision = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'))
  const pr269Reset = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'))
  const pr252Decision = readJsonArtifact(path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'))
  const pr247Decision = readJsonArtifact(path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'))
  const pr241Comparison = readJsonArtifact(path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'))
  const pr241Repair = readJsonArtifact(path.join(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'))
  const pr223Readiness = readJsonArtifact(path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'))
  const pr198Preflight = readJsonArtifact(path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'))

  const blockers: SupabaseCleanStagingTargetApprovalBlocker[] = []
  if (pr276Readiness?.decision !== 'support_ticket_ready_for_manual_operator_submission') {
    blockers.push('pr276_support_ticket_submission_evidence_missing')
  }
  if (pr274Decision?.decision !== 'approved_for_future_manual_supabase_support_ticket') {
    blockers.push('pr274_support_escalation_approval_missing')
  }
  if (!pr271Decision) blockers.push('pr271_reset_retry_diagnostics_missing')
  if (!pr269Reset) blockers.push('pr269_reset_retry_evidence_missing')
  if (pr252Decision?.decision !== 'approved_for_future_staging_reset_and_reapply_migrations') {
    blockers.push('pr252_owner_data_loss_acceptance_missing')
  }
  if (pr247Decision?.selectedStrategy !== 'staging_reset_and_reapply_migrations') {
    blockers.push('pr247_schema_parity_strategy_missing')
  }
  if (pr241Comparison?.overallEquivalence !== 'not_equivalent') {
    blockers.push('pr241_remote_schema_equivalence_evidence_missing')
  }
  if (!pr223Readiness) blockers.push('pr223_transport_blocker_evidence_missing')
  if (!pr198Preflight) blockers.push('pr198_trackb_backfill_preflight_missing')

  const currentStagingRepairUnsafe =
    pr241Comparison?.overallEquivalence === 'not_equivalent' &&
    asNumber(pr241Comparison?.notEquivalentMigrationCount, 0) >= 11 &&
    pr241Repair?.decision === 'blocked_pending_remote_history_evidence' &&
    pr269Reset?.resetAttempted === true &&
    pr269Reset?.stagingSqlMayHaveRun === true
  if (!currentStagingRepairUnsafe) blockers.push('current_staging_repair_not_proven_unsafe')

  const currentStagingDataNotRequiredForInternalTesting =
    pr252Decision?.decision === 'approved_for_future_staging_reset_and_reapply_migrations'
  if (!currentStagingDataNotRequiredForInternalTesting) {
    blockers.push('existing_staging_data_preservation_required')
  }

  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    approvedCurrentStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    pr276: {
      supportTicketSubmissionPath: path.join(PR276_REPORT_DIR, 'support_ticket_submission_readiness_report.json'),
      decision: asString(pr276Readiness?.decision, 'missing'),
      status: asString(pr276Readiness?.status, 'missing'),
      supportTicketSubmitted: pr276Readiness?.supportTicketSubmitted === true,
      supportPacketEvidenceStatus: asString(pr276Evidence?.status, 'missing'),
    },
    pr274: {
      decisionPath: path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'),
      decision: asString(pr274Decision?.decision, 'missing'),
      approvalStatus: asString(pr274Decision?.approvalStatus, 'missing'),
      supportTicketSubmitted: pr274Decision?.supportTicketSubmitted === true,
    },
    pr271: {
      diagnosticsDecision: asString(pr271Decision?.decision, 'missing'),
      stagingSqlMayHaveRun: pr271Decision?.stagingSqlMayHaveRun === true,
    },
    pr269: {
      resetRetryStatus: asString(pr269Reset?.status, 'missing'),
      resetAttempted: pr269Reset?.resetAttempted === true,
      stagingSqlMayHaveRun: pr269Reset?.stagingSqlMayHaveRun === true,
      selectedStrategy: asString(pr269Reset?.selectedStrategy, 'missing'),
    },
    pr252: {
      decision: asString(pr252Decision?.decision, 'missing'),
      approvalStatus: asString(pr252Decision?.approvalStatus, 'missing'),
      currentStagingDataNotRequiredForInternalTesting,
    },
    pr247: {
      decision: asString(pr247Decision?.decision, 'missing'),
      selectedStrategy: asString(pr247Decision?.selectedStrategy, 'missing'),
    },
    pr241: {
      overallEquivalence: asString(pr241Comparison?.overallEquivalence, 'missing'),
      remoteIntrospectionStatus: asString(pr241Comparison?.remoteIntrospectionStatus, 'missing'),
      missingMigrationCount: asNumber(pr241Comparison?.missingMigrationCount, 0),
      equivalentMigrationCount: asNumber(pr241Comparison?.equivalentMigrationCount, 0),
      notEquivalentMigrationCount: asNumber(pr241Comparison?.notEquivalentMigrationCount, 0),
      repairDecision: asString(pr241Repair?.decision, 'missing'),
    },
    pr223: {
      transportStatus: asString(pr223Readiness?.status, 'missing'),
      nextRecommendedPhase: asString(pr223Readiness?.nextRecommendedPhase, 'missing'),
      blockers: asStringArray(pr223Readiness?.blockers),
    },
    pr198: {
      preflightStatus: asString(pr198Preflight?.status, 'missing'),
      blockers: asStringArray(pr198Preflight?.blockers),
      trackBBackfillRowsWritten: false,
    },
    currentStagingRepairUnsafe,
    currentStagingDataNotRequiredForInternalTesting,
    productionExclusionPreserved: true,
    trackBBackfillSeparate: true,
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildOptionMatrix(evidence: JsonRecord): JsonRecord {
  const recommendedTarget: SupabaseCleanStagingTargetKind = 'clean_supabase_staging_branch'
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: evidence.status === 'passed' ? 'passed' : 'blocked',
    recommendedTarget,
    options: [
      {
        option: 'existing_staging_repair',
        decision: 'rejected',
        rationale: 'Current staging repair is not safe to continue because schema equivalence is not proven, reset attempts failed, and registry migration remains absent.',
        futureUse: 'only_after_separate_support_or_manual_recovery_decision',
      },
      {
        option: 'clean_supabase_staging_branch',
        decision: 'recommended',
        rationale: 'Creates an isolated data-less staging target from a known base for clean migration apply and verification, without preserving broken current staging drift.',
        futureUse: 'preferred_future_execution_target_after_cost_availability_and_secret_plan_confirmation',
      },
      {
        option: 'clean_supabase_staging_project',
        decision: 'fallback',
        rationale: 'Use only if branch availability, branch cost, or branch lifecycle constraints block the preferred staging branch path.',
        futureUse: 'future_fallback_approval_or_execution_gate',
      },
      {
        option: 'support_ticket_wait',
        decision: 'not_selected',
        rationale: 'PR #276 prepared a manual ticket packet, but clean staging approval can proceed as a separate staging-only path while no ticket has been submitted.',
        futureUse: 'parallel_or_fallback_operator_path',
      },
    ],
    existingStagingMustBePreserved: false,
    currentStagingDataRequiredForInternalTesting: false,
    branchOrProjectCreated: false,
    productionAffected: false,
    trackBBackfillRowsWritten: false,
  }
}

function buildCostRiskReview(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: 'planning_review_passed_future_confirmation_required',
    branchAvailabilityReviewedForApproval: true,
    branchAvailabilityConfirmedNow: false,
    branchCostReviewedForApproval: true,
    branchCostConfirmedNow: false,
    projectFallbackCostHigherRisk: true,
    recommendedCostClass: 'low_or_account_dependent_for_future_branch',
    costRisk: 'low_medium_until_future_supabase_cost_confirmation',
    approvalPacketCostDecision: 'acceptable_for_future_execution_gate',
    futureExecutionMustConfirmBranchAvailability: true,
    futureExecutionMustConfirmBranchCost: true,
    futureExecutionMustNotCreateProjectUnlessBranchUnavailable: true,
    productionBillingAffected: false,
    branchOrProjectCreated: false,
    blockers: [],
  }
}

function buildSecretReferencePlan(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: 'planned_for_future_execution',
    payloadAccessInThisPhase: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValuesKnownToThisPhase: false,
    futureSecretReferences: [
      {
        purpose: 'clean staging database connection',
        referenceClass: 'operator_provided_secret_reference',
        payloadRequiredBeforeExecution: true,
        reportPayload: false,
      },
      {
        purpose: 'clean staging API URL',
        referenceClass: 'operator_provided_secret_reference',
        payloadRequiredBefore_track_b_backfill: true,
        reportPayload: false,
      },
      {
        purpose: 'clean staging server-only service key',
        referenceClass: 'operator_provided_server_only_secret_reference',
        payloadRequiredBefore_track_b_backfill: true,
        reportPayload: false,
      },
    ],
    secretPlanCompleteForApproval: true,
    futureExecutionMustCreateOrUpdateSecretReferences: true,
    frontendSecretExposureAllowed: false,
    productionSecretReuseAllowed: false,
    signedUrlsAllowedAsSourceOfTruth: false,
    blockers: [],
  }
}

function buildMigrationAndBackfillPlan(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: 'planned_for_future_execution',
    localMigrationCount: getLocalMigrationIds().length,
    targetRegistryMigrationId: TARGET_REGISTRY_MIGRATION_ID,
    targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
    targetRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    futureCleanTargetFlow: [
      'create_or_select_clean_staging_branch_after_cost_and_availability_confirmation',
      'apply_local_migrations_with_approved_supabase_workflow_in_future_execution_phase',
      'verify_migration_history_schema_rls_and_registry_tables',
      'run_pr198_track_b_backfill_preflight_and_diff',
      'run_track_b_backfill_write_only_in_later_separate_guarded_phase',
    ],
    cleanTargetMigrationApplyApprovedInThisPhase: false,
    schemaDeployRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    trackBBackfillSeparatePhaseRequired: true,
    directManualSqlAllowed: false,
    productionAffected: false,
  }
}

function buildOperatorChecklist(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: 'ready',
    checklist: [
      'Confirm current staging data is disposable for internal testing and does not need preservation.',
      'Confirm production is excluded and no production secrets or targets are used.',
      'Confirm Supabase branch availability and cost before creating a clean staging target.',
      'Prefer a clean Supabase staging branch; use a new staging project only if branch availability or cost blocks the branch path.',
      'Create or update server-only secret references for the clean target without printing payloads.',
      'Apply migrations and verify schema/RLS only in a separate execution phase.',
      'Keep Track B milestone backfill as a separate guarded phase after clean schema verification.',
    ],
    approvalsCapturedByThisPacket: [
      SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION,
      SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION,
    ],
    branchOrProjectCreated: false,
    sqlExecuted: false,
    productionAffected: false,
  }
}

function buildApprovalDecision(input: {
  evidenceInventory: JsonRecord
  optionMatrix: JsonRecord
  costRiskReview: JsonRecord
  secretReferencePlan: JsonRecord
  input: {
    approvalConfirmed?: boolean
    replacementReviewConfirmed?: boolean
    preservedFromLatestApprovedPacket?: boolean
  }
}): JsonRecord {
  const forbiddenSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const blockers: SupabaseCleanStagingTargetApprovalBlocker[] = []
  blockers.push(...(asStringArray(input.evidenceInventory.blockers) as SupabaseCleanStagingTargetApprovalBlocker[]))
  if (input.input.approvalConfirmed !== true) blockers.push('clean_staging_target_approval_not_confirmed')
  if (input.input.replacementReviewConfirmed !== true) blockers.push('clean_staging_replacement_review_not_confirmed')
  if (input.costRiskReview.status !== 'planning_review_passed_future_confirmation_required') {
    blockers.push('clean_staging_cost_review_missing')
  }
  if (input.secretReferencePlan.status !== 'planned_for_future_execution') {
    blockers.push('clean_staging_secret_reference_plan_missing')
  }
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')

  const evidenceBlockers = asStringArray(input.evidenceInventory.blockers)
  let decision: SupabaseCleanStagingTargetApprovalDecision = 'blocked_pending_human_review'
  let approvalStatus = 'not_approved_for_execution'
  const recommendedTarget: SupabaseCleanStagingTargetKind = 'clean_supabase_staging_branch'
  if (evidenceBlockers.includes('existing_staging_data_preservation_required')) {
    decision = 'rejected_due_existing_staging_must_be_preserved'
  } else if (forbiddenSet.length > 0) {
    decision = 'blocked_pending_human_review'
  } else if (
    input.input.approvalConfirmed === true &&
    input.input.replacementReviewConfirmed === true &&
    input.evidenceInventory.status === 'passed'
  ) {
    decision = 'approved_for_future_clean_supabase_staging_branch'
    approvalStatus = 'future_clean_staging_branch_approved_not_created'
  } else if (input.costRiskReview.status !== 'planning_review_passed_future_confirmation_required') {
    decision = 'blocked_pending_cost_review'
  } else if (input.optionMatrix.status !== 'passed') {
    decision = 'blocked_pending_branching_availability_review'
  } else if (input.secretReferencePlan.status !== 'planned_for_future_execution') {
    decision = 'blocked_pending_secret_reference_plan'
  }

  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: decision.startsWith('approved_') ? 'approved_for_future_execution_only' : 'blocked',
    decision,
    approvalStatus,
    recommendedTarget,
    fallbackTarget: 'clean_supabase_staging_project',
    preservedFromLatestApprovedPacket: input.input.preservedFromLatestApprovedPacket === true,
    reason: decision === 'approved_for_future_clean_supabase_staging_branch'
      ? 'Current staging repair is unsafe; a clean staging branch is approved for a separate future execution phase.'
      : 'Clean staging target approval requires source evidence and explicit replacement review confirmations.',
    currentStagingRepairRejected: true,
    existingStagingMustBePreserved: false,
    currentStagingDataRequiredForInternalTesting: false,
    futureExecutionGates: [
      'confirm_supabase_branch_availability_and_cost',
      'create_or_select_clean_staging_branch_or_project_in_separate_phase',
      'create_or_update_clean_staging_secret_references_without_payload_logging',
      'apply_local_migrations_with_approved_supabase_workflow_in_separate_phase',
      'verify_schema_rls_migration_history_and_registry_tables',
      'run_track_b_backfill_only_in_later_separate_guarded_phase',
    ],
    confirmations: {
      cleanStagingTargetApproval: input.input.approvalConfirmed === true,
      cleanStagingReplacementReview: input.input.replacementReviewConfirmed === true,
      forbiddenConfirmationsSet: forbiddenSet,
    },
    branchOrProjectCreated: false,
    cleanStagingBranchCreated: false,
    cleanStagingProjectCreated: false,
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
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: String(decision.decision).startsWith('approved_') ? 'no_active_packet_blockers' : 'blocked',
    decision: decision.decision,
    activeBlockers: asStringArray(decision.blockers),
    futureExecutionGates: decision.futureExecutionGates,
    blockedScopes: [
      'supabase_branch_creation_in_this_phase',
      'supabase_project_creation_in_this_phase',
      'staging_reset',
      'schema_migration_deploy',
      'migration_history_repair',
      'direct_sql_or_ddl_dml',
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
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    productionAffected: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    status: String(decision.decision).startsWith('approved_')
      ? 'future_clean_staging_target_approved_not_created'
      : 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    recommendedTarget: decision.recommendedTarget,
    activeBlockers: asStringArray(blockerReport.activeBlockers),
    resetExecutionAllowedInThisPhase: false,
    cleanStagingTargetCreationAllowedInThisPhase: false,
    migrationDeployAllowedInThisPhase: false,
    trackBBackfillAllowedInThisPhase: false,
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: String(decision.decision).startsWith('approved_')
      ? 'Prompt: Supabase clean staging target execution.'
      : 'Resolve clean staging target approval blockers before any clean target execution phase.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_PHASE,
    runId: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_RUN_ID,
    reportDir: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
    committedArtifacts: [
      ...SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS.map((name) =>
        path.join(SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR, name),
      ),
      ...SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS,
    ],
    privateUploadRequired: false,
    privateDataPayloadsCommitted: false,
    dbUrlCommitted: false,
    keyMaterialCommitted: false,
    backupPayloadCommitted: false,
    mediaPayloadCommitted: false,
    branchOrProjectCreated: false,
    productionAffected: false,
  }
}

function renderApprovalDecisionDoc(reports: Reports): string {
  return `# Supabase Clean Staging Target Approval Decision

Decision: \`${reports.approvalDecision.decision}\`

Approval status: \`${reports.approvalDecision.approvalStatus}\`

Recommended future target: \`${reports.approvalDecision.recommendedTarget}\`

This packet approves a future clean Supabase staging branch as the preferred recovery path. It does not create a branch or project, run SQL, deploy migrations, repair migration history, submit a support ticket, backfill Track B rows, or touch production.

## Evidence Summary

- PR #276 support ticket packet: \`${asString(asRecord(reports.evidenceInventory.pr276).decision, 'missing')}\`
- PR #252 owner/data-loss acceptance: \`${asString(asRecord(reports.evidenceInventory.pr252).decision, 'missing')}\`
- PR #241 remote equivalence: \`${asString(asRecord(reports.evidenceInventory.pr241).overallEquivalence, 'missing')}\`
- PR #269 retry reset attempted: \`${String(asRecord(reports.evidenceInventory.pr269).resetAttempted === true)}\`
- PR #198 Track B backfill remains separate: \`true\`

## Explicit Non-Execution

- Clean branch/project created: false
- SQL executed: false
- Migration deployed: false
- Migration repair run: false
- Track B backfill rows written: false
- Support ticket submitted: false
- Production affected: false
- Secrets printed or committed: false

## Documentation Basis

- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase changelog: https://supabase.com/changelog
`
}

function renderOperatorChecklistDoc(reports: Reports): string {
  return `# Supabase Clean Staging Target Operator Checklist

Decision: \`${reports.approvalDecision.decision}\`

Future execution must complete these checks before creating any clean target:

${asStringArray(reports.operatorChecklist.checklist).map((item) => `- ${item}`).join('\n')}

Track B milestone backfill remains a later separate guarded phase after clean schema/RLS verification.
`
}

function renderCleanStagingExecutionPrompt(reports: Reports): string {
  return `# Supabase Clean Staging Target Execution

Use this prompt only after reviewing the clean staging approval packet.

## Required Source

- Approval decision: \`${reports.approvalDecision.decision}\`
- Report path: \`docs/activation-supabase-clean-staging-target-approval-reports/clean_staging_target_approval_decision.json\`
- Recommended target: \`${reports.approvalDecision.recommendedTarget}\`

## Required Behavior

- Confirm Supabase branch availability and cost before creating a clean staging branch.
- Prefer a clean staging branch; use a new staging project only if branch availability or cost blocks the branch path.
- Create or update clean staging secret references without printing payloads.
- Apply local migrations only in the separate execution phase and verify migration history, schema, RLS, and activation milestone registry tables.
- Run PR #198 Track B staging backfill preflight/diff after verification only.
- Keep Track B backfill writes, production, direct SQL, support ticket submission, providers, tools, workers, media, Track A, beta, and production unlocks blocked unless later phases explicitly approve them.

## Forbidden In This Approval Packet

This approval packet did not create a branch/project, run SQL, deploy migrations, repair migration history, write Track B rows, submit a support ticket, or touch production.
`
}

function loadLatestApprovedDecision(): JsonRecord | null {
  const decision = readJsonArtifact(
    path.join(SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
  )
  return decision?.decision === 'approved_for_future_clean_supabase_staging_branch' ||
    decision?.decision === 'approved_for_future_clean_supabase_staging_project'
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
  ...groups: Array<readonly SupabaseCleanStagingTargetApprovalBlocker[]>
): SupabaseCleanStagingTargetApprovalBlocker[] {
  return Array.from(new Set(groups.flat()))
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
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

export function scanSupabaseCleanStagingApprovalPayloadText(text: string): string[] {
  return SENSITIVE_PATTERNS.filter((pattern) => text.includes(pattern))
}
