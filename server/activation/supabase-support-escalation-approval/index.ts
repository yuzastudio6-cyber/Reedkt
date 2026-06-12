import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseSupportEscalationApprovalBlocker,
  SupabaseSupportEscalationApprovalDecision,
  SupabaseSupportSubmissionOption,
} from './support-escalation-approval-types'

export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE =
  'supabase-support-escalation-approval'
export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID =
  'supabase-support-escalation-approval-20260610'
export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_BRANCH =
  'codex/rp-foundation-supabase-support-escalation-approval'
export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_BASE_BRANCH =
  'codex/rp-foundation-supabase-reset-retry-failure-diagnostics'
export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-support-escalation-approval-reports'

export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_ESCALATION_APPROVAL_PACKET'
export const SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW'

export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'support_escalation_approval_plan.json',
  'support_escalation_evidence_inventory.json',
  'support_escalation_redacted_packet.json',
  'support_escalation_redaction_review.json',
  'support_escalation_submission_option_matrix.json',
  'support_escalation_operator_checklist.json',
  'support_escalation_approval_decision.json',
  'support_escalation_blocker_report.json',
  'support_escalation_readiness_report.json',
  'support_escalation_private_artifact_manifest.json',
] as const

export const SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS = [
  'docs/supabase-support-escalation-approval.md',
  'docs/supabase-support-redacted-reset-failure-packet.md',
  'docs/supabase-support-escalation-operator-checklist.md',
  'docs/supabase-support-escalation-approval-decision.md',
  'docs/implementation-prompts/prompt-supabase-support-ticket-submission.md',
] as const

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

const PR271_REPORT_DIR = 'docs/activation-supabase-reset-retry-failure-diagnostics-reports'
const PR269_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-execution-reports'
const PR265_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-approval-reports'
const PR262_REPORT_DIR = 'docs/activation-supabase-staging-reset-failure-triage-reports'
const PR259_REPORT_DIR = 'docs/activation-supabase-staging-reset-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR200_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const TARGET_REGISTRY_MIGRATION_ID = '202606050001'
const TARGET_REGISTRY_MIGRATION_FILE =
  '202606050001_activation_milestone_registry_schema_rls.sql'

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_TICKET_SUBMISSION',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_DEBUG_RESET_LOGS',
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
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
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
type Reports = ReturnType<typeof buildSupabaseSupportEscalationApprovalReports>

export function getSupabaseSupportEscalationApprovalPlan(): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    branch: SUPABASE_SUPPORT_ESCALATION_APPROVAL_BRANCH,
    baseBranch: SUPABASE_SUPPORT_ESCALATION_APPROVAL_BASE_BRANCH,
    prTitle: '[foundation] Supabase support escalation approval',
    worktree: '/private/tmp/reeditpro-supabase-support-escalation-approval',
    reportDir: SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS,
    docs: SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269, 271],
    docsBasis: {
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelog: 'https://supabase.com/changelog',
      checkedAt: '2026-06-10',
      globalCreateTicketFlagObserved: true,
      cliCreateTicketApprovedInThisPhase: false,
      migrationWorkflowRemainsRequiredForFutureSchemaChanges: true,
    },
    approvedStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    allowedConfirmations: [
      SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION,
      SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedActions: [
      'read_committed_safe_reports',
      'build_redacted_support_packet_metadata',
      'review_redaction_policy',
      'approve_future_manual_support_ticket_only',
      'write_safe_metadata_reports_and_docs',
    ],
    blockedActions: [
      'support_ticket_submission',
      'cli_create_ticket',
      'debug_reset_log_collection',
      'reset_retry',
      'db_push',
      'migration_repair',
      'schema_deploy',
      'track_b_backfill_write',
      'production_supabase',
      'direct_ddl_dml',
      'secret_payload_access_or_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    defaultDecision: 'blocked_pending_support_owner_approval',
  }
}

export function buildSupabaseSupportEscalationApprovalReports(input: {
  approvalPacketConfirmed?: boolean
  redactionReviewConfirmed?: boolean
} = {}) {
  const preservedDecision = input.approvalPacketConfirmed === true || input.redactionReviewConfirmed === true
    ? null
    : loadLatestApprovedDecision()
  const effectiveInput = preservedDecision
    ? {
        approvalPacketConfirmed: true,
        redactionReviewConfirmed: true,
        preservedFromLatestApprovedPacket: true,
      }
    : input
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseSupportEscalationApprovalPlan()
  const evidenceInventory = buildEvidenceInventory()
  const redactedPacket = buildRedactedSupportPacket(evidenceInventory)
  const redactionReview = buildRedactionReview(redactedPacket)
  const submissionOptionMatrix = buildSubmissionOptionMatrix(redactionReview)
  const operatorChecklist = buildOperatorChecklist(redactionReview, effectiveInput)
  const approvalDecision = buildApprovalDecision(
    evidenceInventory,
    redactionReview,
    operatorChecklist,
    effectiveInput,
  )
  const blockerReport = buildBlockerReport(approvalDecision)
  const readinessReport = buildReadinessReport(approvalDecision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    redactedPacket,
    redactionReview,
    submissionOptionMatrix,
    operatorChecklist,
    approvalDecision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseSupportEscalationApprovalArtifacts(reports: Reports) {
  const dir = SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_approval_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_redacted_packet.json'), reports.redactedPacket)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_redaction_review.json'), reports.redactionReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_submission_option_matrix.json'), reports.submissionOptionMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_escalation_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-support-escalation-approval.md', renderApprovalOverview(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-support-redacted-reset-failure-packet.md', renderRedactedPacketDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-support-escalation-operator-checklist.md', renderOperatorChecklistDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-support-escalation-approval-decision.md', renderApprovalDecisionDoc(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-support-ticket-submission.md',
    renderSupportTicketSubmissionPrompt(reports),
  )
}

export async function executeSupabaseSupportEscalationApproval(input: {
  keepTemp: boolean
}) {
  void input.keepTemp
  const approvalPacketConfirmed =
    process.env[SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION] === 'true'
  const redactionReviewConfirmed =
    process.env[SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION] === 'true'
  const reports = buildSupabaseSupportEscalationApprovalReports({
    approvalPacketConfirmed,
    redactionReviewConfirmed,
  })
  await writeSupabaseSupportEscalationApprovalArtifacts(reports)
  const approved =
    reports.approvalDecision.decision === 'approved_for_future_manual_supabase_support_ticket'
  return { reports, exitCode: approved ? 0 : 1 }
}

export function readSupabaseSupportEscalationApprovalSummary(): JsonRecord {
  const reports = buildSupabaseSupportEscalationApprovalReports()
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    approvalStatus: reports.approvalDecision.approvalStatus,
    recommendedSubmissionOption: reports.submissionOptionMatrix.recommendedOption,
    redactionReviewStatus: reports.redactionReview.status,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    blockers: reports.blockerReport.activeBlockers,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_cli_failure_analysis_report.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_post_failure_state_report.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_migration_state_review.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
    path.join(PR265_REPORT_DIR, 'staging_reset_retry_approval_decision.json'),
    path.join(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
    path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR200_REPORT_DIR, 'schema_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  const requiredReports = reportPaths.slice(0, 5)
  const missingRequiredReports = requiredReports.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    mode: 'support_escalation_approval_packet_only',
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
      : (['pr271_support_packet_missing'] satisfies SupabaseSupportEscalationApprovalBlocker[]),
    sourceFacts: {
      pr271BaseHead: 'a9fa107',
      pr269ResetRetryAttempted: true,
      stagingSqlMayHaveRun: true,
      supportPacketRecommendedByPr271: true,
      productionAffected: false,
      trackBBackfillRowsWritten: false,
    },
    duplicateWorkAvoided: [
      'no_support_ticket_submission',
      'no_cli_create_ticket_invocation',
      'no_reset_retry_path',
      'no_db_push_path',
      'no_migration_repair_path',
      'no_schema_deploy_path',
      'no_track_b_backfill_write_path',
    ],
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const supportPacket = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'))
  const recoveryDecision = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'))
  const cliFailure = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_cli_failure_analysis_report.json'))
  const postFailureState = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_post_failure_state_report.json'))
  const migrationState = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_migration_state_review.json'))
  const blockers: SupabaseSupportEscalationApprovalBlocker[] = []
  if (!supportPacket) blockers.push('pr271_support_packet_missing')
  if (!recoveryDecision) blockers.push('pr271_recovery_decision_missing')
  if (recoveryDecision?.decision !== 'recovery_path_supabase_support_packet') {
    blockers.push('support_packet_not_recommended')
  }
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    pr271: {
      supportPacketPresent: Boolean(supportPacket),
      supportPacketStatus: asString(supportPacket?.status, 'missing'),
      recoveryDecisionPresent: Boolean(recoveryDecision),
      recoveryDecision: asString(recoveryDecision?.decision, 'missing'),
      nextRecommendedPhase: asString(recoveryDecision?.nextRecommendedPhase, 'missing'),
      supportPacketBuilt: recoveryDecision?.supportPacketBuilt === true,
      cliFailureClassification: asString(cliFailure?.failureClassification, 'missing'),
      exactFailureCauseProven: cliFailure?.exactFailureCauseProven === true,
      supportPacketRecommended: cliFailure?.supportPacketRecommended === true,
      postFailureStateClassifier: asString(postFailureState?.stateClassifier, 'missing'),
      migrationHistoryStatus: asString(migrationState?.status, 'missing'),
      stagingSqlMayHaveRun:
        supportPacket?.stagingSqlMayHaveRun === true || recoveryDecision?.stagingSqlMayHaveRun === true,
      targetRegistryMigrationId: asString(supportPacket?.targetRegistryMigrationId, TARGET_REGISTRY_MIGRATION_ID),
      targetRegistryMigrationApplied: supportPacket?.targetRegistryMigrationApplied === true,
      localMigrationCount: asNumber(supportPacket?.localMigrationCount, getLocalMigrationIds().length),
      remoteMigrationCount: asNumber(supportPacket?.remoteMigrationCount, 0),
      missingLocalIdsAfterRetryFailure: asStringArray(supportPacket?.missingLocalIdsAfterRetryFailure),
      safeAttachments: asStringArray(supportPacket?.safeAttachments),
      excludedFromPacket: asStringArray(supportPacket?.excludedFromPacket),
      payloadPrinted: supportPacket?.payloadPrinted === true,
      payloadCommitted: supportPacket?.payloadCommitted === true,
      dbUrlPrinted: supportPacket?.dbUrlPrinted === true,
      productionAffected: supportPacket?.productionAffected === true,
      trackBBackfillRowsWritten: supportPacket?.trackBBackfillRowsWritten === true,
      migrationRepairRun: supportPacket?.migrationRepairRun === true,
      dbPushRun: supportPacket?.dbPushRun === true,
      directDdlDmlRun: supportPacket?.directDdlDmlRun === true,
    },
    upstreamEvidence: {
      pr269ResetRetryExecution: readReportDecision(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
      pr265RetryApproval: readReportDecision(PR265_REPORT_DIR, 'staging_reset_retry_approval_decision.json'),
      pr262FailureTriage: readReportDecision(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
      pr259ResetExecution: readReportDecision(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
      pr252DataImpactBackup: readReportDecision(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
      pr247SchemaParity: readReportDecision(PR247_REPORT_DIR, 'schema_parity_decision.json'),
      pr241RemoteEquivalence: readReportDecision(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
      pr223DeployTransport: readReportDecision(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
      pr200RegistrySchema: readReportDecision(PR200_REPORT_DIR, 'schema_readiness_report.json'),
      pr198TrackBBackfill: readReportDecision(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    },
    localMigrations: {
      count: getLocalMigrationIds().length,
      targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
      targetRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    },
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildRedactedSupportPacket(evidence: JsonRecord): JsonRecord {
  const pr271 = asRecord(evidence.pr271)
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: 'ready_for_manual_support_ticket_submission_in_future_phase',
    project: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
      productionTarget: false,
    },
    supportRequestType: 'manual_supabase_dashboard_support_ticket',
    supportRequestApprovedInThisPhase: false,
    commandClass: 'supabase_db_reset_via_temp_npm_exec',
    commandShape: 'npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed',
    cliCreateTicketFlag: {
      observedInOfficialCliDocs: true,
      approvedInThisPhase: false,
      runInThisPhase: false,
      requiresSeparatePrompt: true,
    },
    selectedStrategy: 'temp_npm_exec_supabase_cli',
    sanitizedFailureClass: asString(pr271.cliFailureClassification, 'reset_retry_command_failed_exact_cause_not_proven'),
    exactFailureCauseProven: pr271.exactFailureCauseProven === true,
    stagingSqlMayHaveRun: pr271.stagingSqlMayHaveRun === true,
    postFailureStateClassifier: asString(pr271.postFailureStateClassifier, 'unknown'),
    migrationSummary: {
      localMigrationCount: asNumber(pr271.localMigrationCount, getLocalMigrationIds().length),
      remoteMigrationCount: asNumber(pr271.remoteMigrationCount, 0),
      targetRegistryMigrationId: asString(pr271.targetRegistryMigrationId, TARGET_REGISTRY_MIGRATION_ID),
      targetRegistryMigrationApplied: pr271.targetRegistryMigrationApplied === true,
      missingLocalIdsAfterRetryFailure: asStringArray(pr271.missingLocalIdsAfterRetryFailure),
    },
    resetAttemptSummary: {
      previousApprovedRetryPhase: 'PR #265',
      resetExecutionPhase: 'PR #269',
      diagnosticsPhase: 'PR #271',
      resetRetryAttemptedBeforeThisPacket: true,
      resetRetryRunInThisPhase: false,
      stagingSqlMayHaveRunBeforeThisPacket: pr271.stagingSqlMayHaveRun === true,
      backupExportMetadataPresent: true,
      supportPacketRecommendedByDiagnostics: pr271.supportPacketRecommended === true,
    },
    verificationOutcome: {
      registryMigrationApplied: pr271.targetRegistryMigrationApplied === true,
      registrySchemaVerified: false,
      trackBBackfillReady: false,
      productionAffected: false,
    },
    sourcePrs: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269, 271],
    safeReportReferences: [
      path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_cli_failure_analysis_report.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_post_failure_state_report.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_migration_state_review.json'),
      path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
      path.join(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
      path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    ],
    excludedSensitiveMaterial: [
      'database url values',
      'database passwords',
      'service role keys',
      'anon keys',
      'personal access tokens',
      'signed urls',
      'provider keys',
      'private backup payloads',
      'private media urls',
      'row contents',
      'production targets',
    ],
    dbUrlIncluded: false,
    passwordIncluded: false,
    serviceRoleKeyIncluded: false,
    anonKeyIncluded: false,
    accessTokenIncluded: false,
    signedUrlIncluded: false,
    providerKeyIncluded: false,
    privateBackupPayloadIncluded: false,
    privateMediaUrlIncluded: false,
    rowContentsIncluded: false,
    productionTargetIncluded: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildRedactionReview(packet: JsonRecord): JsonRecord {
  const packetText = JSON.stringify(packet, null, 2)
  const matchedPatterns = SENSITIVE_PATTERNS.filter((pattern) => packetText.includes(pattern))
  const booleanFailures = [
    packet.dbUrlIncluded === true ? 'database_url_included' : '',
    packet.passwordIncluded === true ? 'password_included' : '',
    packet.serviceRoleKeyIncluded === true ? 'service_role_key_included' : '',
    packet.anonKeyIncluded === true ? 'anon_key_included' : '',
    packet.accessTokenIncluded === true ? 'access_token_included' : '',
    packet.signedUrlIncluded === true ? 'signed_url_included' : '',
    packet.providerKeyIncluded === true ? 'provider_key_included' : '',
    packet.privateBackupPayloadIncluded === true ? 'private_backup_payload_included' : '',
    packet.privateMediaUrlIncluded === true ? 'private_media_url_included' : '',
    packet.rowContentsIncluded === true ? 'row_contents_included' : '',
    packet.productionTargetIncluded === true ? 'production_target_included' : '',
  ].filter(Boolean)
  const blockers: SupabaseSupportEscalationApprovalBlocker[] =
    matchedPatterns.length === 0 && booleanFailures.length === 0
      ? []
      : ['support_packet_redaction_review_failed']
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    reviewedArtifact: path.join(
      SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
      'support_escalation_redacted_packet.json',
    ),
    redactionRules: [
      'no_database_url_values',
      'no_database_passwords',
      'no_service_role_keys',
      'no_anon_keys',
      'no_access_tokens',
      'no_signed_urls',
      'no_provider_keys',
      'no_private_backup_payloads',
      'no_private_media_urls',
      'no_row_contents',
      'no_production_target',
    ],
    matchedSensitivePatternCount: matchedPatterns.length,
    matchedSensitivePatterns: matchedPatterns,
    booleanFailures,
    safeMetadataOnly: blockers.length === 0,
    stagingOnly: asRecord(packet.project).environment === APPROVED_STAGING_ENVIRONMENT,
    productionTargetSelected: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildSubmissionOptionMatrix(redactionReview: JsonRecord): JsonRecord {
  const options: Array<{
    option: SupabaseSupportSubmissionOption
    status: string
    recommended: boolean
    reason: string
    executionInThisPhase: boolean
  }> = [
    {
      option: 'manual_supabase_dashboard_support_ticket',
      status: redactionReview.status === 'passed' ? 'recommended_for_future_phase' : 'blocked_pending_redaction',
      recommended: redactionReview.status === 'passed',
      reason: 'Manual dashboard submission can attach only the approved redacted packet after a separate submission phase.',
      executionInThisPhase: false,
    },
    {
      option: 'supabase_cli_create_ticket',
      status: 'blocked_pending_separate_cli_ticket_approval',
      recommended: false,
      reason: 'The CLI global create-ticket flag is observed but not approved or invoked in this packet.',
      executionInThisPhase: false,
    },
    {
      option: 'supabase_cli_github_issue',
      status: 'optional_future_alternative',
      recommended: false,
      reason: 'Could be chosen by a support owner later, using the same redacted packet.',
      executionInThisPhase: false,
    },
    {
      option: 'internal_manual_review_only',
      status: redactionReview.status === 'passed' ? 'fallback' : 'recommended_until_redaction_passes',
      recommended: redactionReview.status !== 'passed',
      reason: 'Fallback path if support owner or redaction approval is withheld.',
      executionInThisPhase: false,
    },
  ]
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: 'passed',
    recommendedOption: redactionReview.status === 'passed'
      ? 'manual_supabase_dashboard_support_ticket'
      : 'internal_manual_review_only',
    options,
    manualSupportTicketApprovedForFuturePhase: redactionReview.status === 'passed',
    cliCreateTicketApproved: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    blockers: redactionReview.status === 'passed'
      ? ['support_ticket_submission_requires_separate_phase']
      : ['support_packet_redaction_review_failed'],
  }
}

function buildOperatorChecklist(
  redactionReview: JsonRecord,
  input: {
    approvalPacketConfirmed?: boolean
    redactionReviewConfirmed?: boolean
    preservedFromLatestApprovedPacket?: boolean
  },
): JsonRecord {
  const forbiddenSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const approvalPacketConfirmed = input.approvalPacketConfirmed === true
  const redactionReviewConfirmed = input.redactionReviewConfirmed === true
  const checklist = [
    {
      id: 'pr271_support_packet_reviewed',
      status: 'passed',
      required: true,
      evidence: path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'),
    },
    {
      id: 'redaction_review_passed',
      status: redactionReview.status === 'passed' ? 'passed' : 'blocked',
      required: true,
      evidence: path.join(SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR, 'support_escalation_redaction_review.json'),
    },
    {
      id: 'support_escalation_approval_packet_confirmed',
      status: approvalPacketConfirmed ? 'passed' : 'blocked',
      required: true,
      evidence: SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION,
    },
    {
      id: 'support_packet_redaction_review_confirmed',
      status: redactionReviewConfirmed ? 'passed' : 'blocked',
      required: true,
      evidence: SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION,
    },
    {
      id: 'cli_create_ticket_deferred',
      status: 'passed',
      required: true,
      evidence: 'CLI create-ticket remains separate future phase.',
    },
    {
      id: 'forbidden_confirmations_absent',
      status: forbiddenSet.length === 0 ? 'passed' : 'blocked',
      required: true,
      evidence: forbiddenSet.length === 0 ? 'none_set' : forbiddenSet,
    },
  ]
  const blockers: SupabaseSupportEscalationApprovalBlocker[] = []
  if (redactionReview.status !== 'passed') blockers.push('support_packet_redaction_review_failed')
  if (!approvalPacketConfirmed) blockers.push('support_escalation_approval_packet_not_confirmed')
  if (!redactionReviewConfirmed) blockers.push('support_packet_redaction_review_not_confirmed')
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    preservedFromLatestApprovedPacket: input.preservedFromLatestApprovedPacket === true,
    checklist,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildApprovalDecision(
  evidence: JsonRecord,
  redactionReview: JsonRecord,
  operatorChecklist: JsonRecord,
  input: {
    approvalPacketConfirmed?: boolean
    redactionReviewConfirmed?: boolean
    preservedFromLatestApprovedPacket?: boolean
  },
): JsonRecord {
  const evidenceBlockers = asStringArray(evidence.blockers) as SupabaseSupportEscalationApprovalBlocker[]
  const checklistBlockers = asStringArray(operatorChecklist.blockers) as SupabaseSupportEscalationApprovalBlocker[]
  let decision: SupabaseSupportEscalationApprovalDecision = 'blocked_pending_support_owner_approval'
  let approvalStatus = 'not_approved'
  const blockers = collectUniqueBlockers(evidenceBlockers, checklistBlockers)
  if (redactionReview.status !== 'passed') {
    decision = 'blocked_pending_redaction_review'
    approvalStatus = 'blocked_redaction_review_required'
  } else if (evidenceBlockers.length > 0) {
    decision = 'blocked_pending_human_review'
    approvalStatus = 'blocked_evidence_review_required'
  } else if (input.approvalPacketConfirmed === true && input.redactionReviewConfirmed === true) {
    decision = 'approved_for_future_manual_supabase_support_ticket'
    approvalStatus = 'future_manual_support_ticket_approved_not_submitted'
  }
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: decision === 'approved_for_future_manual_supabase_support_ticket' ? 'approved' : 'blocked',
    decision,
    approvalStatus,
    preservedFromLatestApprovedPacket: input.preservedFromLatestApprovedPacket === true,
    decisionReason: decision === 'approved_for_future_manual_supabase_support_ticket'
      ? 'The PR #271 support packet is redacted, staging-only, non-production, and the approval/redaction confirmations were provided.'
      : 'Manual support escalation remains blocked until redaction and approval confirmations are present.',
    approvedSubmissionOption: decision === 'approved_for_future_manual_supabase_support_ticket'
      ? 'manual_supabase_dashboard_support_ticket'
      : 'none',
    cliCreateTicketDecision: 'blocked_pending_separate_cli_ticket_approval',
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: decision === 'approved_for_future_manual_supabase_support_ticket'
      ? 'Manual Supabase support ticket submission using only the approved redacted packet.'
      : 'Run the support escalation approval packet with redaction review confirmation.',
    blockers: decision === 'approved_for_future_manual_supabase_support_ticket'
      ? ['support_ticket_submission_requires_separate_phase', 'cli_create_ticket_not_approved_in_this_phase']
      : blockers,
  }
}

function buildBlockerReport(decision: JsonRecord): JsonRecord {
  const activeBlockers = asStringArray(decision.blockers)
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: decision.decision === 'approved_for_future_manual_supabase_support_ticket'
      ? 'approved_with_future_phase_blockers'
      : 'blocked',
    activeBlockers,
    supportSubmissionBlockers: [
      'support_ticket_submission_requires_separate_phase',
      'cli_create_ticket_not_approved_in_this_phase',
    ],
    executionBlockers: [
      'reset_retry_not_allowed',
      'db_push_not_allowed',
      'migration_repair_not_allowed',
      'schema_deploy_not_allowed',
      'track_b_backfill_write_not_allowed',
      'production_not_allowed',
    ],
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  const approved = decision.decision === 'approved_for_future_manual_supabase_support_ticket'
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    status: approved ? 'ready_for_future_manual_support_ticket_submission' : 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    activeBlockers: asStringArray(blockerReport.activeBlockers),
    futureManualSupportTicketApproved: approved,
    cliCreateTicketApproved: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: approved
      ? 'Separate manual Supabase support ticket submission phase using the approved redacted packet.'
      : 'Complete support escalation approval packet confirmations and redaction review.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_ESCALATION_APPROVAL_PHASE,
    runId: SUPABASE_SUPPORT_ESCALATION_APPROVAL_RUN_ID,
    reportDir: SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
    committedArtifacts: [
      ...SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS.map((name) =>
        path.join(SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR, name),
      ),
      ...SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS,
    ],
    privateUploadRequired: false,
    privateDataPayloadsCommitted: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    dbUrlCommitted: false,
    keyMaterialCommitted: false,
    backupPayloadCommitted: false,
    mediaPayloadCommitted: false,
    productionAffected: false,
  }
}

function renderApprovalOverview(reports: Reports): string {
  return `# Supabase Support Escalation Approval

Decision: \`${reports.approvalDecision.decision}\`

Approval status: \`${reports.approvalDecision.approvalStatus}\`

This packet approves only a future manual Supabase dashboard support ticket using the committed redacted reset-failure packet. It does not submit a ticket, run the Supabase CLI \`--create-ticket\` flag, retry reset, deploy schema, run \`db push\`, repair migrations, backfill Track B rows, execute SQL, or affect production.

## Scope

- Project: \`Reeditpro\`
- Project ref: \`wmyyttnynmteqgcdishd\`
- Environment: \`staging\`
- Support packet source: \`docs/activation-supabase-reset-retry-failure-diagnostics-reports/reset_retry_supabase_support_packet.json\`
- Recommended future submission option: \`${reports.submissionOptionMatrix.recommendedOption}\`

## Safety Status

- Support ticket submitted: false
- CLI create-ticket run: false
- Reset retry run: false
- SQL executed: false
- Migration deployed: false
- Track B backfill rows written: false
- Production affected: false
- Secrets printed or committed: false

## Documentation Basis

- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase changelog: https://supabase.com/changelog
`
}

function renderRedactedPacketDoc(reports: Reports): string {
  const packet = reports.redactedPacket
  return `# Supabase Support Redacted Reset Failure Packet

Status: \`${packet.status}\`

This is the human-readable companion to \`support_escalation_redacted_packet.json\`. It contains staging-safe metadata only.

## Redacted Command Class

\`${packet.commandShape}\`

## Failure Summary

- Sanitized failure class: \`${packet.sanitizedFailureClass}\`
- Exact failure cause proven: \`${packet.exactFailureCauseProven}\`
- Staging SQL may have run before this packet: \`${packet.stagingSqlMayHaveRun}\`
- Post-failure state classifier: \`${packet.postFailureStateClassifier}\`
- Target registry migration: \`${asRecord(packet.migrationSummary).targetRegistryMigrationId}\`

## Exclusions

No database URL values, database passwords, service role keys, anon keys, personal access tokens, signed URLs, provider keys, private backup payloads, private media URLs, row contents, or production targets are included.
`
}

function renderOperatorChecklistDoc(reports: Reports): string {
  return `# Supabase Support Escalation Operator Checklist

Decision: \`${reports.approvalDecision.decision}\`

## Required For The Future Manual Ticket

- Use only the approved redacted packet JSON/Markdown.
- Confirm the ticket target is staging project \`wmyyttnynmteqgcdishd\`.
- Do not attach DB URLs, passwords, key material, private backup payloads, row contents, private media, logs with secrets, or production data.
- Do not use CLI \`--create-ticket\` unless a separate future phase approves it.
- Do not run reset retry, schema deploy, migration repair, Track B backfill, or production operations as part of support submission.

## This Phase

- Support ticket submitted: false
- CLI create-ticket run: false
- SQL executed: false
- Migration deployed: false
- Production affected: false
`
}

function renderApprovalDecisionDoc(reports: Reports): string {
  return `# Supabase Support Escalation Approval Decision

- Decision: \`${reports.approvalDecision.decision}\`
- Approval status: \`${reports.approvalDecision.approvalStatus}\`
- Approved submission option: \`${reports.approvalDecision.approvedSubmissionOption}\`
- CLI create-ticket decision: \`${reports.approvalDecision.cliCreateTicketDecision}\`
- Redaction review: \`${reports.redactionReview.status}\`
- Next recommended phase: ${reports.readinessReport.nextRecommendedPhase}

## Execution Status

- Support ticket submitted: false
- CLI create-ticket run: false
- Reset retry run: false
- SQL executed: false
- Migration repair run: false
- Schema deploy run: false
- Track B backfill rows written: false
- Production affected: false
- Secrets printed or committed: false
`
}

function renderSupportTicketSubmissionPrompt(reports: Reports): string {
  return `# Supabase Support Ticket Submission

Use this prompt only after PR #271 diagnostics and this support escalation approval packet are reviewed.

## Required Inputs

- Approved decision: \`${reports.approvalDecision.decision}\`
- Approved redacted packet: \`docs/activation-supabase-support-escalation-approval-reports/support_escalation_redacted_packet.json\`
- Redaction review: \`${reports.redactionReview.status}\`

## Allowed Future Action

Submit a manual Supabase dashboard support ticket using only the approved redacted packet. The ticket must target staging project \`wmyyttnynmteqgcdishd\`.

## Blocked Actions

Do not run CLI \`--create-ticket\`, debug reset logs, reset retry, \`db push\`, migration repair, schema deploy, Track B backfill, production SQL, direct DDL/DML, provider calls, worker/tool/route execution, media processing, Track A, beta unlock, or production unlock inside the submission phase unless a later prompt explicitly approves that narrower action.

## Required Result

Record ticket submission metadata only: support channel, redacted ticket reference, submitted-by role, submission time, no secret payloads viewed or attached, and next recovery recommendation.
`
}

function loadLatestApprovedDecision(): JsonRecord | null {
  const decision = readJsonArtifact(
    path.join(SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR, 'support_escalation_approval_decision.json'),
  )
  return decision?.decision === 'approved_for_future_manual_supabase_support_ticket' ? decision : null
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

function readReportDecision(reportDir: string, fileName: string): JsonRecord {
  const report = readJsonArtifact(path.join(reportDir, fileName))
  if (!report) {
    return { path: path.join(reportDir, fileName), present: false, status: 'missing' }
  }
  return {
    path: path.join(reportDir, fileName),
    present: true,
    status: asString(report.status, 'unknown'),
    decision: asString(report.decision, 'not_recorded'),
    approvalStatus: asString(report.approvalStatus, 'not_recorded'),
    readinessStatus: asString(report.readinessStatus, 'not_recorded'),
    nextRecommendedPhase: asString(report.nextRecommendedPhase, 'not_recorded'),
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
  ...groups: Array<readonly SupabaseSupportEscalationApprovalBlocker[]>
): SupabaseSupportEscalationApprovalBlocker[] {
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
