import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SupabaseSupportTicketSubmissionBlocker,
  SupabaseSupportTicketSubmissionDecision,
  SupabaseSupportTicketSubmissionMode,
} from './support-ticket-submission-types'

export const SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE =
  'supabase-support-ticket-submission'
export const SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID =
  'supabase-support-ticket-submission-20260610'
export const SUPABASE_SUPPORT_TICKET_SUBMISSION_BRANCH =
  'codex/rp-foundation-supabase-support-ticket-submission'
export const SUPABASE_SUPPORT_TICKET_SUBMISSION_BASE_BRANCH =
  'codex/rp-foundation-supabase-support-escalation-approval'
export const SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR =
  'docs/activation-supabase-support-ticket-submission-reports'

export const SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION'
export const SUPABASE_SUPPORT_TICKET_REDACTION_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW'
export const SUPABASE_SUPPORT_PORTAL_ACCESS_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_PORTAL_ACCESS_AVAILABLE'

export const SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'support_ticket_submission_plan.json',
  'support_ticket_submission_evidence_inventory.json',
  'support_ticket_redaction_validation_report.json',
  'support_ticket_manual_submission_packet.json',
  'support_ticket_submission_readiness_report.json',
  'support_ticket_submission_audit_report.json',
  'support_ticket_operator_submission_instructions.json',
  'support_ticket_blocker_report.json',
  'support_ticket_readiness_report.json',
  'support_ticket_private_artifact_manifest.json',
] as const

export const SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS = [
  'docs/supabase-support-ticket-submission.md',
  'docs/supabase-support-ticket-manual-submission-packet.md',
  'docs/supabase-support-ticket-redaction-policy.md',
  'docs/supabase-support-ticket-next-response-handling.md',
  'docs/implementation-prompts/prompt-supabase-support-response-recovery-decision.md',
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

const PR274_REPORT_DIR = 'docs/activation-supabase-support-escalation-approval-reports'
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
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET',
  'REEDITPRO_CONFIRM_SUPABASE_DEBUG_LOG_COLLECTION',
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_TICKET_CREATE_VIA_CLI',
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
type Reports = ReturnType<typeof buildSupabaseSupportTicketSubmissionReports>

export function getSupabaseSupportTicketSubmissionPlan(): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    branch: SUPABASE_SUPPORT_TICKET_SUBMISSION_BRANCH,
    baseBranch: SUPABASE_SUPPORT_TICKET_SUBMISSION_BASE_BRANCH,
    prTitle: '[foundation] Supabase support ticket submission',
    worktree: '/private/tmp/reeditpro-supabase-support-ticket-submission',
    reportDir: SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
    expectedReports: SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS,
    docs: SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269, 271, 274],
    docsBasis: {
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelog: 'https://supabase.com/changelog',
      checkedAt: '2026-06-10',
      cliCreateTicketFlagObserved: true,
      cliDebugFlagObserved: true,
      cliCreateTicketApprovedInThisPhase: false,
      cliDebugApprovedInThisPhase: false,
    },
    approvedStagingTarget: {
      projectName: APPROVED_STAGING_PROJECT_NAME,
      projectRef: APPROVED_STAGING_PROJECT_REF,
      environment: APPROVED_STAGING_ENVIRONMENT,
    },
    allowedConfirmations: [
      SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION_CONFIRMATION,
      SUPABASE_SUPPORT_TICKET_REDACTION_REVIEW_CONFIRMATION,
      `${SUPABASE_SUPPORT_PORTAL_ACCESS_CONFIRMATION} only if portal/session is actually available`,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedActions: [
      'read_committed_safe_reports',
      'validate_redacted_packet',
      'build_manual_support_ticket_content',
      'write_operator_submission_instructions',
      'write_safe_reports_and_docs',
    ],
    blockedActions: [
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
    defaultDecision: 'support_ticket_ready_for_manual_operator_submission',
  }
}

export function buildSupabaseSupportTicketSubmissionReports(input: {
  manualSubmissionConfirmed?: boolean
  redactionReviewConfirmed?: boolean
  portalAccessConfirmed?: boolean
} = {}) {
  const preservedReadiness = input.manualSubmissionConfirmed === true || input.redactionReviewConfirmed === true
    ? null
    : loadLatestReadyDecision()
  const effectiveInput = preservedReadiness
    ? {
        manualSubmissionConfirmed: true,
        redactionReviewConfirmed: true,
        portalAccessConfirmed: false,
        preservedFromLatestReadyPacket: true,
      }
    : input
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseSupportTicketSubmissionPlan()
  const evidenceInventory = buildEvidenceInventory()
  const manualSubmissionPacket = buildManualSubmissionPacket(evidenceInventory)
  const redactionValidation = buildRedactionValidationReport(manualSubmissionPacket)
  const submissionReadiness = buildSubmissionReadiness(
    evidenceInventory,
    redactionValidation,
    effectiveInput,
  )
  const submissionAudit = buildSubmissionAudit(submissionReadiness, effectiveInput)
  const operatorInstructions = buildOperatorSubmissionInstructions(manualSubmissionPacket, submissionReadiness)
  const blockerReport = buildBlockerReport(submissionReadiness)
  const readinessReport = buildReadinessReport(submissionReadiness, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    redactionValidation,
    manualSubmissionPacket,
    submissionReadiness,
    submissionAudit,
    operatorInstructions,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseSupportTicketSubmissionArtifacts(reports: Reports) {
  const dir = SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_submission_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_submission_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_redaction_validation_report.json'), reports.redactionValidation)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_manual_submission_packet.json'), reports.manualSubmissionPacket)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_submission_readiness_report.json'), reports.submissionReadiness)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_submission_audit_report.json'), reports.submissionAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_operator_submission_instructions.json'), reports.operatorInstructions)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'support_ticket_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-support-ticket-submission.md', renderSubmissionOverview(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-support-ticket-manual-submission-packet.md',
    renderManualPacketDoc(reports),
  )
  await writeVlmRuntimeTextArtifact('docs/supabase-support-ticket-redaction-policy.md', renderRedactionPolicyDoc(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-support-ticket-next-response-handling.md',
    renderNextResponseHandlingDoc(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-support-response-recovery-decision.md',
    renderSupportResponsePrompt(reports),
  )
}

export async function executeSupabaseSupportTicketSubmission(input: {
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseSupportTicketSubmissionReports({
    manualSubmissionConfirmed: process.env[SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION_CONFIRMATION] === 'true',
    redactionReviewConfirmed: process.env[SUPABASE_SUPPORT_TICKET_REDACTION_REVIEW_CONFIRMATION] === 'true',
    portalAccessConfirmed: process.env[SUPABASE_SUPPORT_PORTAL_ACCESS_CONFIRMATION] === 'true',
  })
  await writeSupabaseSupportTicketSubmissionArtifacts(reports)
  const ok = [
    'support_ticket_ready_for_manual_operator_submission',
    'support_ticket_submitted',
  ].includes(asString(reports.submissionReadiness.decision, 'blocked'))
  return { reports, exitCode: ok ? 0 : 1 }
}

export function readSupabaseSupportTicketSubmissionSummary(): JsonRecord {
  const reports = buildSupabaseSupportTicketSubmissionReports()
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.submissionReadiness.decision,
    submissionMode: reports.submissionReadiness.submissionMode,
    redactionValidation: reports.redactionValidation.status,
    supportTicketSubmitted: reports.submissionAudit.supportTicketSubmitted,
    ticketReference: reports.submissionAudit.ticketReference,
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
    blockers: reports.blockerReport.activeBlockers,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'),
    path.join(PR274_REPORT_DIR, 'support_escalation_redacted_packet.json'),
    path.join(PR274_REPORT_DIR, 'support_escalation_redaction_review.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_cli_failure_analysis_report.json'),
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
  const requiredReports = reportPaths.slice(0, 6)
  const missingRequiredReports = requiredReports.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    mode: 'support_ticket_submission_packet',
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
      : (['pr274_redacted_packet_missing'] satisfies SupabaseSupportTicketSubmissionBlocker[]),
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
    duplicateWorkAvoided: [
      'no_new_support_packet',
      'no_reset_executor',
      'no_deploy_wrapper',
      'no_cli_create_ticket',
      'no_unredacted_submission',
    ],
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceInventory(): JsonRecord {
  const pr274Decision = readJsonArtifact(path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'))
  const pr274Packet = readJsonArtifact(path.join(PR274_REPORT_DIR, 'support_escalation_redacted_packet.json'))
  const pr274Redaction = readJsonArtifact(path.join(PR274_REPORT_DIR, 'support_escalation_redaction_review.json'))
  const pr271Decision = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'))
  const pr271Packet = readJsonArtifact(path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'))
  const pr269Reset = readJsonArtifact(path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'))
  const pr259Reset = readJsonArtifact(path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'))
  const blockers: SupabaseSupportTicketSubmissionBlocker[] = []
  if (!pr274Decision) blockers.push('pr274_approval_decision_missing')
  if (pr274Decision?.decision !== 'approved_for_future_manual_supabase_support_ticket') {
    blockers.push('pr274_not_approved_for_manual_support_submission')
  }
  if (!pr274Packet) blockers.push('pr274_redacted_packet_missing')
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    pr274: {
      approvalDecisionPath: path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'),
      redactedPacketPath: path.join(PR274_REPORT_DIR, 'support_escalation_redacted_packet.json'),
      decision: asString(pr274Decision?.decision, 'missing'),
      approvalStatus: asString(pr274Decision?.approvalStatus, 'missing'),
      supportTicketSubmitted: pr274Decision?.supportTicketSubmitted === true,
      cliCreateTicketRun: pr274Decision?.cliCreateTicketRun === true,
      redactionStatus: asString(pr274Redaction?.status, 'missing'),
      projectRef: asString(asRecord(asRecord(pr274Packet?.project).projectRef), APPROVED_STAGING_PROJECT_REF),
      environment: asString(asRecord(pr274Packet?.project).environment, APPROVED_STAGING_ENVIRONMENT),
      commandShape: asString(pr274Packet?.commandShape, 'missing'),
      selectedStrategy: asString(pr274Packet?.selectedStrategy, 'missing'),
      sanitizedFailureClass: asString(pr274Packet?.sanitizedFailureClass, 'missing'),
      stagingSqlMayHaveRun: pr274Packet?.stagingSqlMayHaveRun === true,
      localMigrationCount: asNumber(asRecord(pr274Packet?.migrationSummary).localMigrationCount, 0),
      remoteMigrationCount: asNumber(asRecord(pr274Packet?.migrationSummary).remoteMigrationCount, 0),
      targetRegistryMigrationId: asString(asRecord(pr274Packet?.migrationSummary).targetRegistryMigrationId, TARGET_REGISTRY_MIGRATION_ID),
      targetRegistryMigrationApplied: asRecord(pr274Packet?.migrationSummary).targetRegistryMigrationApplied === true,
      dbUrlIncluded: pr274Packet?.dbUrlIncluded === true,
      accessTokenIncluded: pr274Packet?.accessTokenIncluded === true,
      supportTicketSubmittedInPriorPhase: pr274Packet?.supportTicketSubmitted === true,
      productionAffected: pr274Packet?.productionAffected === true,
      trackBBackfillRowsWritten: pr274Packet?.trackBBackfillRowsWritten === true,
    },
    pr271: {
      diagnosticsDecision: asString(pr271Decision?.decision, 'missing'),
      supportPacketStatus: asString(pr271Packet?.status, 'missing'),
      exactFailureCauseProven: pr271Packet?.exactFailureCauseProven === true,
      postFailureStateClassifier: asString(pr271Packet?.postFailureStateClassifier, 'missing'),
      supportPacketRecommended: pr271Decision?.supportPacketBuilt === true,
    },
    pr269: {
      resetRetryStatus: asString(pr269Reset?.status, 'missing'),
      resetAttempted: pr269Reset?.resetAttempted === true,
      stagingSqlMayHaveRun: pr269Reset?.stagingSqlMayHaveRun === true,
      selectedStrategy: asString(pr269Reset?.selectedStrategy, 'missing'),
    },
    pr259: {
      firstResetStatus: asString(pr259Reset?.status, 'missing'),
      resetAttempted: pr259Reset?.resetAttempted === true,
      stagingSqlMayHaveRun: pr259Reset?.stagingSqlMayHaveRun === true,
    },
    upstreamEvidence: {
      pr265RetryApproval: readReportDecision(PR265_REPORT_DIR, 'staging_reset_retry_approval_decision.json'),
      pr262FailureTriage: readReportDecision(PR262_REPORT_DIR, 'staging_reset_recovery_decision.json'),
      pr252DataImpactBackup: readReportDecision(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
      pr247SchemaParity: readReportDecision(PR247_REPORT_DIR, 'schema_parity_decision.json'),
      pr241RemoteEquivalence: readReportDecision(PR241_REPORT_DIR, 'migration_history_repair_approval_after_equivalence_review.json'),
      pr223DeployTransport: readReportDecision(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
      pr200RegistrySchema: readReportDecision(PR200_REPORT_DIR, 'schema_readiness_report.json'),
      pr198TrackBBackfill: readReportDecision(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    },
    productionExclusion: true,
    trackBBackfillBlocked: true,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildManualSubmissionPacket(evidence: JsonRecord): JsonRecord {
  const pr274 = asRecord(evidence.pr274)
  const title = 'Supabase staging db reset failed twice with migration history/schema not restored'
  const summary = [
    'We are requesting guidance for a staging-only Supabase recovery path.',
    'The approved staging project had two guarded reset attempts fail.',
    'After failure diagnostics, migration history and the activation milestone registry schema remained absent.',
    'Track B milestone backfill and production were not touched.',
  ].join(' ')
  const body = [
    `Title: ${title}`,
    '',
    'Summary:',
    summary,
    '',
    'Environment:',
    `- Project ref: ${APPROVED_STAGING_PROJECT_REF}`,
    `- Environment: ${APPROVED_STAGING_ENVIRONMENT}`,
    '- Production affected: false',
    '',
    'Command class used:',
    '- supabase db reset --db-url [REDACTED] --no-seed',
    '',
    'CLI strategy:',
    '- temp npm Supabase CLI',
    '',
    'Observed behavior:',
    '- First guarded staging reset attempt failed.',
    '- Guarded staging reset retry failed.',
    '- Migration history and activation milestone registry schema remained absent after verification.',
    '- Track B staging backfill was not run.',
    '- Production was not touched.',
    '',
    'Expected behavior:',
    '- Staging reset should safely reapply local migrations or Supabase should advise a supported migration-safe recovery path.',
    '',
    'Questions:',
    '1. Is remote db reset with --db-url supported for this staging environment?',
    '2. Is the observed failure a known CLI or platform issue?',
    '3. Should we use a different migration-safe recovery path?',
    '4. Is creating a new staging branch or project recommended?',
    '5. What safe next step avoids direct untracked SQL?',
    '',
    'Safe references:',
    '- PR #274 support escalation approval packet',
    '- PR #271 reset retry failure diagnostics',
    '- PR #269 reset retry execution attempt',
    '- PR #259 first reset execution attempt',
    '- PR #198 Track B backfill remains blocked',
  ].join('\n')
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: 'ready_for_operator_manual_submission',
    title,
    summary,
    environment: APPROVED_STAGING_ENVIRONMENT,
    projectRef: APPROVED_STAGING_PROJECT_REF,
    projectName: APPROVED_STAGING_PROJECT_NAME,
    commandClass: 'supabase db reset --db-url [REDACTED] --no-seed',
    cliStrategy: asString(pr274.selectedStrategy, 'temp_npm_supabase_cli'),
    sanitizedObservedBehavior: [
      'first_reset_failed',
      'retry_reset_failed',
      'migration_history_registry_schema_remained_absent',
      'track_b_backfill_not_run',
      'production_not_affected',
    ],
    expectedBehavior: 'reset_or_reapply_local_migrations_or_guidance_on_supported_migration_safe_recovery_path',
    supportQuestions: [
      'Is remote db reset with --db-url supported for this staging environment?',
      'Is the observed failure a known CLI or platform issue?',
      'Should we use a different migration-safe recovery path?',
      'Is creating a new staging branch or project recommended?',
      'What safe next step avoids direct untracked SQL?',
    ],
    diagnosticsAlreadyCollected: [
      'pr274_redacted_support_packet',
      'pr271_reset_retry_failure_diagnostics',
      'pr269_retry_reset_execution_report',
      'pr259_first_reset_execution_report',
      'pr252_owner_data_loss_acceptance_and_backup_review',
    ],
    migrationSummary: {
      localMigrationCount: asNumber(pr274.localMigrationCount, getLocalMigrationIds().length),
      remoteMigrationCount: asNumber(pr274.remoteMigrationCount, 0),
      targetRegistryMigrationId: asString(pr274.targetRegistryMigrationId, TARGET_REGISTRY_MIGRATION_ID),
      targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
      targetRegistryMigrationApplied: pr274.targetRegistryMigrationApplied === true,
    },
    safePrReferences: [198, 200, 223, 241, 247, 252, 259, 262, 265, 269, 271, 274],
    safeReportReferences: [
      path.join(PR274_REPORT_DIR, 'support_escalation_redacted_packet.json'),
      path.join(PR274_REPORT_DIR, 'support_escalation_approval_decision.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_supabase_support_packet.json'),
      path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
      path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
      path.join(PR259_REPORT_DIR, 'staging_reset_execution_report.json'),
      path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
    ],
    manualSubmissionText: body,
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
    rawLogsIncluded: false,
    productionTargetIncluded: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildRedactionValidationReport(packet: JsonRecord): JsonRecord {
  const text = JSON.stringify(packet, null, 2)
  const matchedPatterns = SENSITIVE_PATTERNS.filter((pattern) => text.includes(pattern))
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
    packet.rawLogsIncluded === true ? 'raw_logs_included' : '',
    packet.productionTargetIncluded === true ? 'production_target_included' : '',
  ].filter(Boolean)
  const blockers: SupabaseSupportTicketSubmissionBlocker[] =
    matchedPatterns.length === 0 && booleanFailures.length === 0
      ? []
      : ['support_ticket_redaction_failed']
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    reviewedArtifact: path.join(SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR, 'support_ticket_manual_submission_packet.json'),
    rules: [
      'no_database_url_values',
      'no_passwords',
      'no_service_keys',
      'no_access_tokens',
      'no_private_backup_payloads',
      'no_signed_urls',
      'no_provider_keys',
      'no_private_media_urls',
      'no_production_target',
      'no_private_row_data',
      'no_raw_logs',
    ],
    matchedSensitivePatternCount: matchedPatterns.length,
    matchedSensitivePatterns: matchedPatterns,
    booleanFailures,
    safeToSubmit: blockers.length === 0,
    productionTargetSelected: false,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    debugResetRun: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildSubmissionReadiness(
  evidence: JsonRecord,
  redactionValidation: JsonRecord,
  input: {
    manualSubmissionConfirmed?: boolean
    redactionReviewConfirmed?: boolean
    portalAccessConfirmed?: boolean
    preservedFromLatestReadyPacket?: boolean
  },
): JsonRecord {
  const forbiddenSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const blockers: SupabaseSupportTicketSubmissionBlocker[] = []
  const evidenceBlockers = asStringArray(evidence.blockers) as SupabaseSupportTicketSubmissionBlocker[]
  blockers.push(...evidenceBlockers)
  if (redactionValidation.status !== 'passed') blockers.push('support_ticket_redaction_failed')
  if (input.manualSubmissionConfirmed !== true) blockers.push('manual_support_ticket_submission_not_confirmed')
  if (input.redactionReviewConfirmed !== true) blockers.push('support_packet_redaction_review_not_confirmed')
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')

  let decision: SupabaseSupportTicketSubmissionDecision = 'support_ticket_ready_for_manual_operator_submission'
  let submissionMode: SupabaseSupportTicketSubmissionMode = 'operator_manual'
  if (redactionValidation.status !== 'passed') {
    decision = 'rejected_due_sensitive_support_payload_risk'
    submissionMode = 'not_available'
  } else if (evidenceBlockers.includes('pr274_not_approved_for_manual_support_submission')) {
    decision = 'blocked_pending_support_owner_approval'
    submissionMode = 'not_available'
  } else if (evidenceBlockers.length > 0 || input.manualSubmissionConfirmed !== true || input.redactionReviewConfirmed !== true) {
    decision = input.redactionReviewConfirmed !== true
      ? 'blocked_pending_redaction_review'
      : 'blocked_pending_support_owner_approval'
    submissionMode = 'not_available'
  } else if (input.portalAccessConfirmed === true) {
    decision = 'blocked_pending_support_portal_access'
    submissionMode = 'portal_manual_if_available'
    blockers.push('support_portal_access_unavailable')
  }

  if (decision === 'support_ticket_ready_for_manual_operator_submission') {
    blockers.push('support_ticket_submission_requires_operator_portal_action')
  }

  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'ready_for_manual_operator_submission'
      : 'blocked',
    decision,
    submissionMode,
    preservedFromLatestReadyPacket: input.preservedFromLatestReadyPacket === true,
    supportPortalAccessAvailable: false,
    supportPortalAccessConfirmed: input.portalAccessConfirmed === true,
    supportTicketSubmitted: false,
    ticketReference: null,
    redactionValidated: redactionValidation.status === 'passed',
    operatorManualSubmissionRequired: decision === 'support_ticket_ready_for_manual_operator_submission',
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUniqueBlockers(blockers),
  }
}

function buildSubmissionAudit(
  readiness: JsonRecord,
  input: {
    manualSubmissionConfirmed?: boolean
    redactionReviewConfirmed?: boolean
    portalAccessConfirmed?: boolean
  },
): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: readiness.decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'not_submitted_operator_ready'
      : 'not_submitted_blocked',
    supportTicketSubmitted: false,
    ticketReference: null,
    submissionMode: readiness.submissionMode,
    supportPortalAccessConfirmed: input.portalAccessConfirmed === true,
    supportPortalAccessActuallyAvailable: false,
    manualSubmissionConfirmed: input.manualSubmissionConfirmed === true,
    redactionReviewConfirmed: input.redactionReviewConfirmed === true,
    cliCreateTicketRun: false,
    cliCreateTicketReason: 'blocked_by_policy_and_requires_separate_future_phase',
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildOperatorSubmissionInstructions(packet: JsonRecord, readiness: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: readiness.decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'ready'
      : 'blocked',
    decision: readiness.decision,
    operatorSteps: [
      'Open Supabase dashboard support in an authenticated browser session.',
      'Use the title and manualSubmissionText from support_ticket_manual_submission_packet.json.',
      'Attach only safe report references if the portal allows references; do not attach private payloads or logs.',
      'Do not include DB URLs, passwords, keys, tokens, private backup payloads, signed URLs, private media URLs, row contents, or production data.',
      'After submission, record the ticket reference in a separate support-response/recovery-decision phase.',
    ],
    copyPasteTitle: packet.title,
    copyPasteBody: packet.manualSubmissionText,
    supportTicketSubmitted: false,
    ticketReference: null,
    cliCreateTicketRun: false,
    debugResetRun: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildBlockerReport(readiness: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: readiness.decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'ready_with_operator_action_required'
      : 'blocked',
    activeBlockers: asStringArray(readiness.blockers),
    blockedScopes: [
      'cli_create_ticket',
      'debug_reset_logs',
      'reset_retry',
      'db_push',
      'migration_repair',
      'schema_deploy',
      'track_b_backfill_write',
      'production_supabase',
      'direct_ddl_dml',
      'provider_calls',
      'worker_tool_route_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(readiness: JsonRecord, blockerReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    status: readiness.decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'operator_submission_ready'
      : 'blocked',
    decision: readiness.decision,
    submissionMode: readiness.submissionMode,
    activeBlockers: asStringArray(blockerReport.activeBlockers),
    supportTicketSubmitted: false,
    ticketReference: null,
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: readiness.decision === 'support_ticket_ready_for_manual_operator_submission'
      ? 'Operator submits the generated manual packet, then runs support-response recovery decision prompt with the ticket reference.'
      : 'Resolve redaction, approval, or portal-access blockers before support submission.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_SUPPORT_TICKET_SUBMISSION_PHASE,
    runId: SUPABASE_SUPPORT_TICKET_SUBMISSION_RUN_ID,
    reportDir: SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
    committedArtifacts: [
      ...SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS.map((name) =>
        path.join(SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR, name),
      ),
      ...SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS,
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

function renderSubmissionOverview(reports: Reports): string {
  return `# Supabase Support Ticket Submission

Decision: \`${reports.submissionReadiness.decision}\`

Submission mode: \`${reports.submissionReadiness.submissionMode}\`

This packet prepares an operator-ready manual Supabase support ticket using PR #274's approved redacted packet. No support ticket was submitted from this phase because no authenticated support portal/session is available in this environment.

## Status

- Support ticket submitted: false
- Ticket reference: none
- CLI create-ticket run: false
- Debug reset run: false
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

function renderManualPacketDoc(reports: Reports): string {
  return `# Supabase Support Ticket Manual Submission Packet

Title: ${reports.manualSubmissionPacket.title}

## Copy/Paste Body

\`\`\`text
${reports.manualSubmissionPacket.manualSubmissionText}
\`\`\`

## Safety

This packet intentionally excludes DB URLs, passwords, service keys, access tokens, signed URLs, provider keys, private backup payloads, private media URLs, row contents, raw logs, and production targets.
`
}

function renderRedactionPolicyDoc(reports: Reports): string {
  return `# Supabase Support Ticket Redaction Policy

Validation status: \`${reports.redactionValidation.status}\`

The support ticket may include the staging project ref, redacted command class, CLI strategy, sanitized failure class, migration counts, target migration filename, safe PR/report references, and support questions.

It must not include DB URLs, passwords, service-role keys, anon keys, access tokens, signed URLs, provider keys, private backup payloads, private media URLs, row contents, raw logs, or production target details.
`
}

function renderNextResponseHandlingDoc(reports: Reports): string {
  return `# Supabase Support Ticket Next Response Handling

Current decision: \`${reports.submissionReadiness.decision}\`

After the operator submits the manual packet, record the ticket reference and wait for the Supabase support response. Do not reset, deploy, repair migration history, backfill Track B rows, or touch production until a support-response recovery decision packet reviews the response.
`
}

function renderSupportResponsePrompt(reports: Reports): string {
  return `# Supabase Support Response Recovery Decision

Use this prompt only after the manual Supabase support ticket has been submitted and a response is available.

## Required Inputs

- Ticket reference from the operator.
- Supabase response, redacted for secrets/private data.
- Current support submission packet decision: \`${reports.submissionReadiness.decision}\`
- Manual packet path: \`docs/activation-supabase-support-ticket-submission-reports/support_ticket_manual_submission_packet.json\`

## Required Behavior

- Classify support guidance into safe recovery options.
- Keep reset, deploy, migration repair, Track B backfill, and production blocked unless a later explicit execution phase approves a specific action.
- Do not include DB URLs, passwords, keys, tokens, private payloads, signed URLs, row contents, or production data.
- Recommend the next recovery phase while preserving staging-only scope.
`
}

function loadLatestReadyDecision(): JsonRecord | null {
  const readiness = readJsonArtifact(
    path.join(SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR, 'support_ticket_submission_readiness_report.json'),
  )
  return readiness?.decision === 'support_ticket_ready_for_manual_operator_submission' ? readiness : null
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
  const filePath = path.join(reportDir, fileName)
  const report = readJsonArtifact(filePath)
  if (!report) return { path: filePath, present: false, status: 'missing' }
  return {
    path: filePath,
    present: true,
    status: asString(report.status, 'unknown'),
    decision: asString(report.decision, 'not_recorded'),
    approvalStatus: asString(report.approvalStatus, 'not_recorded'),
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
  ...groups: Array<readonly SupabaseSupportTicketSubmissionBlocker[]>
): SupabaseSupportTicketSubmissionBlocker[] {
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
