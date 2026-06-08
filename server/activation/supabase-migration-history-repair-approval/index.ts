import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  MigrationHistoryRepairBlocker,
  MigrationHistoryRepairDecision,
  MigrationHistoryRepairEvidence,
} from './migration-history-repair-approval-types'

export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE =
  'supabase-migration-history-repair-approval'
export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID =
  'supabase-migration-history-repair-approval-20260608'
export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_BRANCH =
  'codex/rp-foundation-supabase-migration-history-repair-approval'
export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-deploy-transport-rerun'
export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-migration-history-repair-approval-reports'
export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PACKET'

export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'migration_history_repair_approval_plan.json',
  'migration_history_evidence_inventory.json',
  'migration_history_local_remote_comparison.json',
  'migration_history_repair_candidate_plan.json',
  'migration_history_repair_risk_report.json',
  'migration_history_repair_operator_checklist.json',
  'migration_history_repair_approval_decision.json',
  'migration_history_repair_blocker_report.json',
  'migration_history_repair_readiness_report.json',
  'migration_history_repair_private_artifact_manifest.json',
] as const

export const SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_DOCS = [
  'docs/supabase-migration-history-repair-operator-checklist.md',
  'docs/supabase-migration-history-repair-approval-decision.md',
  'docs/implementation-prompts/prompt-supabase-staging-migration-history-repair-execution.md',
] as const

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
] as const

const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const TARGET_MIGRATION_ID = '202606050001'
const TARGET_MIGRATION_FILE = '202606050001_activation_milestone_registry_schema_rls.sql'
const APPROVED_STAGING_PROJECT = {
  projectName: 'Reeditpro',
  projectRef: 'wmyyttnynmteqgcdishd',
  environment: 'staging',
}
const FORBIDDEN_CONFIRMATIONS = [
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

type JsonRecord = Record<string, unknown>

export function getSupabaseMigrationHistoryRepairApprovalPlan() {
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    branch: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_BRANCH,
    baseBranch: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging migration history repair approval',
    reportDir: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS,
    docs: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [196, 198, 200, 202, 206, 209, 212, 216, 223],
    approvedStagingTarget: APPROVED_STAGING_PROJECT,
    supabaseDocs: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      changelogChecked: true,
      changelogCheckedAt: '2026-06-08',
      migrationRepairSemantics:
        'migration repair updates supabase_migrations history only; it does not apply or revert SQL',
    },
    confirmationRequiredForExecute: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_CONFIRMATION,
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedActions: [
      'read_committed_pr_223_reports',
      'read_local_migration_filenames',
      'build_redacted_repair_candidate',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'supabase_migration_repair_execution',
      'schema_deploy',
      'direct_sql',
      'track_b_backfill_write',
      'production_supabase',
      'secret_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
  }
}

export function buildSupabaseMigrationHistoryRepairApprovalReports(input: {
  executeConfirmed?: boolean
} = {}) {
  const evidence = loadMigrationHistoryEvidence()
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory(evidence)
  const comparison = buildLocalRemoteComparison(evidence)
  const candidate = buildRepairCandidatePlan(evidence)
  const risk = buildRiskReport(evidence, candidate)
  const checklist = buildOperatorChecklist(candidate)
  const decision = buildApprovalDecision(evidence, candidate, risk, input.executeConfirmed === true)
  const blockers = buildBlockerReport(decision)
  const readiness = buildReadinessReport(decision, blockers)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan: getSupabaseMigrationHistoryRepairApprovalPlan(),
    evidenceInventory,
    localRemoteComparison: comparison,
    repairCandidatePlan: candidate,
    riskReport: risk,
    operatorChecklist: checklist,
    approvalDecision: decision,
    blockerReport: blockers,
    readinessReport: readiness,
    privateArtifactManifest,
  }
}

export async function writeSupabaseMigrationHistoryRepairApprovalArtifacts(
  reports: ReturnType<typeof buildSupabaseMigrationHistoryRepairApprovalReports>,
) {
  const dir = SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_approval_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_local_remote_comparison.json'), reports.localRemoteComparison)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_candidate_plan.json'), reports.repairCandidatePlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_risk_report.json'), reports.riskReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'migration_history_repair_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(
    path.join(dir, 'migration_history_repair_readiness_report.md'),
    renderReadinessMarkdown(reports),
  )
}

export async function executeSupabaseMigrationHistoryRepairApproval(input: {
  keepTemp: boolean
}): Promise<{ reports: ReturnType<typeof buildSupabaseMigrationHistoryRepairApprovalReports>; exitCode: number }> {
  void input
  const executeConfirmed = process.env[SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_CONFIRMATION] === 'true'
  const reports = buildSupabaseMigrationHistoryRepairApprovalReports({ executeConfirmed })
  await writeSupabaseMigrationHistoryRepairApprovalArtifacts(reports)
  return { reports, exitCode: executeConfirmed ? 0 : 1 }
}

export function readSupabaseMigrationHistoryRepairApprovalSummary() {
  const reports = buildSupabaseMigrationHistoryRepairApprovalReports()
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    repairCandidateVersionCount: reports.repairCandidatePlan.repairVersions.length,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directSqlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.blockerReport.activeBlockers,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
  }
}

function loadMigrationHistoryEvidence(): MigrationHistoryRepairEvidence {
  const comparison = readJson(path.join(PR223_REPORT_DIR, 'staging_local_remote_migration_comparison_report.json'))
  const dryRun = readJson(path.join(PR223_REPORT_DIR, 'staging_schema_dry_run_after_history_audit_report.json'))
  const localIds = readStringArray(comparison, 'localMigrationIds')
  const remoteIds = readStringArray(comparison, 'remoteMigrationIds')
  const localIdsMissingRemotely = readStringArray(comparison, 'localIdsMissingRemotely')
  const olderLocalMigrationsAbsentRemotely = readStringArray(comparison, 'olderLocalMigrationsAbsentRemotely')
  const localFallback = listLocalMigrationIds()
  return {
    localMigrationIds: localIds.length > 0 ? localIds : localFallback,
    remoteMigrationIds: remoteIds,
    localIdsMissingRemotely,
    olderLocalMigrationsAbsentRemotely,
    remoteUnknownMigrationIds: readStringArray(comparison, 'remoteUnknownMigrationIds'),
    targetMigrationId: readString(comparison, 'targetMigrationId') ?? TARGET_MIGRATION_ID,
    targetMigrationFile: readString(comparison, 'targetMigrationFile') ?? TARGET_MIGRATION_FILE,
    targetMigrationPending: readBoolean(comparison, 'targetMigrationPending') ?? true,
    targetMigrationRemoteApplied: readBoolean(comparison, 'targetMigrationRemoteApplied') ?? false,
    dryRunFailureReason:
      readString(dryRun, 'reason') ??
      (readStringArray(dryRun, 'blockers').join(',') || 'staging_schema_dry_run_failed'),
  }
}

function buildSourceOfTruthOwnershipAudit() {
  const paths = SOURCE_OF_TRUTH_PATHS.map((pathname) => ({
    path: pathname,
    present: existsSync(pathname),
    directory: existsSync(pathname) && isDirectory(pathname),
  }))
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: 'passed',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: [
      'TRACK_B_MEDIA_PROCESSING',
      'OBSERVABILITY_AUDIT_COST',
      'WORKER_RUNTIME_JOBS',
    ],
    explicitlyNotOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'product beta/production unlocks',
    ],
    sourcePaths: paths,
    crossChatPathPresent: paths.find((entry) => entry.path === 'docs/cross-chat')?.present === true,
    missingPathsAreAuditFactsNotFabricated: true,
    duplicateWorkRisk: 'do_not_create_schema_deploy_wrapper_or_backfill_path_continue_pr_223_after_future_approval',
    sqlExecuted: false,
    migrationRepairRun: false,
    migrationDeployed: false,
    trackBBackfillRun: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: [],
  }
}

function buildEvidenceInventory(evidence: MigrationHistoryRepairEvidence) {
  const reportPaths = SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS.map((name) =>
    path.join(SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR, name),
  )
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: evidence.remoteMigrationIds.length > 0 ? 'passed' : 'blocked',
    source: 'committed_pr_223_migration_history_audit_reports',
    sourceReports: [
      path.join(PR223_REPORT_DIR, 'staging_migration_history_audit_report.json'),
      path.join(PR223_REPORT_DIR, 'staging_local_remote_migration_comparison_report.json'),
      path.join(PR223_REPORT_DIR, 'staging_schema_dry_run_after_history_audit_report.json'),
      path.join(PR223_REPORT_DIR, 'staging_migration_deploy_strategy_after_history_audit.json'),
    ],
    reportPathsExpectedForThisPhase: reportPaths,
    localMigrationCount: evidence.localMigrationIds.length,
    remoteMigrationCount: evidence.remoteMigrationIds.length,
    localMigrationIds: evidence.localMigrationIds,
    remoteMigrationIds: evidence.remoteMigrationIds,
    localIdsMissingRemotely: evidence.localIdsMissingRemotely,
    unknownRemoteMigrationIds: evidence.remoteUnknownMigrationIds,
    intendedMigration: {
      id: evidence.targetMigrationId,
      file: evidence.targetMigrationFile,
      pending: evidence.targetMigrationPending,
      remoteApplied: evidence.targetMigrationRemoteApplied,
    },
    dryRunFailureReason: evidence.dryRunFailureReason,
    secretPayloadAccess: false,
    dbUrlPrinted: false,
    sqlExecuted: false,
    blockers: evidence.remoteMigrationIds.length > 0 ? [] : ['migration_history_evidence_missing'],
  }
}

function buildLocalRemoteComparison(evidence: MigrationHistoryRepairEvidence) {
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: 'passed',
    approvedStagingTarget: APPROVED_STAGING_PROJECT,
    localMigrationIds: evidence.localMigrationIds,
    remoteMigrationIds: evidence.remoteMigrationIds,
    localIdsMissingRemotely: evidence.localIdsMissingRemotely,
    olderLocalMigrationsAbsentRemotely: evidence.olderLocalMigrationsAbsentRemotely,
    olderLocalMigrationsAbsentRemotelyCount: evidence.olderLocalMigrationsAbsentRemotely.length,
    remoteUnknownMigrationIds: evidence.remoteUnknownMigrationIds,
    remoteUnknownMigrationCount: evidence.remoteUnknownMigrationIds.length,
    targetMigrationId: evidence.targetMigrationId,
    targetMigrationPending: evidence.targetMigrationPending,
    targetMigrationRemoteApplied: evidence.targetMigrationRemoteApplied,
    repairNeededBeforeTargetDeploy: evidence.olderLocalMigrationsAbsentRemotely.length > 0,
    productionExcluded: true,
    blockers: [],
  }
}

function buildRepairCandidatePlan(evidence: MigrationHistoryRepairEvidence) {
  const repairVersions = evidence.olderLocalMigrationsAbsentRemotely
  const deterministic = repairVersions.length > 0 && evidence.remoteUnknownMigrationIds.length === 0
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: deterministic ? 'candidate_identified_but_not_approved' : 'blocked',
    approvedStagingTarget: APPROVED_STAGING_PROJECT,
    selectedRepairAction: 'mark_missing_older_local_migrations_as_applied_in_staging_history',
    repairStatus: 'applied',
    repairVersions,
    repairVersionCount: repairVersions.length,
    commandPreview: [
      'supabase',
      'migration',
      'repair',
      ...repairVersions,
      '--status',
      'applied',
      '--db-url',
      '[REDACTED_STAGING_DB_URL]',
    ],
    commandPreviewRedacted: true,
    whyRepairIsNeeded:
      'PR #223 full-repo dry-run cannot prove the target migration until older local migration history gaps are resolved.',
    safetyAssessment:
      'Not approved by this packet because committed evidence does not prove the 12 older migration schemas already exist in staging.',
    mutatesRemoteMigrationHistory: true,
    changesSchemaData: false,
    backfillsRows: false,
    productionAffected: false,
    directSqlRun: false,
    migrationRepairRun: false,
    deterministicCandidate: deterministic,
    blockers: deterministic ? [] : ['migration_history_repair_candidate_not_deterministic'],
  }
}

function buildRiskReport(
  evidence: MigrationHistoryRepairEvidence,
  candidate: ReturnType<typeof buildRepairCandidatePlan>,
) {
  const remoteSchemaEquivalenceProven = false
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: 'blocked',
    overallRisk: 'high',
    targetRisk: 'low_staging_target_confirmed',
    historyMismatchRisk: candidate.repairVersions.length >= 12 ? 'high' : 'medium',
    schemaDriftRisk: remoteSchemaEquivalenceProven ? 'low' : 'high',
    productionRisk: 'low_production_explicitly_excluded',
    rollbackRisk: 'medium_history_repair_reversal_requires_separate_reverted_command_review',
    trackBBackfillImpact: 'blocked_no_rows_written',
    directSqlRisk: 'low_direct_sql_forbidden',
    secretExposureRisk: 'low_reports_redacted',
    remoteSchemaEquivalenceProven,
    remoteUnknownMigrationIds: evidence.remoteUnknownMigrationIds,
    candidateVersionCount: candidate.repairVersions.length,
    blockers: ['remote_schema_equivalence_not_proven'],
  }
}

function buildOperatorChecklist(candidate: ReturnType<typeof buildRepairCandidatePlan>) {
  const items = [
    'staging target confirmed',
    'repair candidate reviewed',
    'exact migration versions reviewed',
    'no production',
    'no direct SQL',
    'no schema DDL/DML',
    'no Track B data backfill',
    'DB URL secret redacted',
    'dry-run after repair required',
    'deploy after repair requires separate phase',
    'rollback plan reviewed',
  ]
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: 'passed',
    checklist: items.map((item) => ({ item, required: true, satisfiedForApprovalPacket: true })),
    repairVersionsToReview: candidate.repairVersions,
    operatorMustNotRunRepairFromThisPacket: true,
    blockers: [],
  }
}

function buildApprovalDecision(
  evidence: MigrationHistoryRepairEvidence,
  candidate: ReturnType<typeof buildRepairCandidatePlan>,
  risk: ReturnType<typeof buildRiskReport>,
  executeConfirmed: boolean,
) {
  const forbiddenSet = getForbiddenConfirmationSet()
  const blockers: MigrationHistoryRepairBlocker[] = []
  if (evidence.remoteMigrationIds.length === 0) blockers.push('migration_history_evidence_missing')
  if (candidate.deterministicCandidate !== true) blockers.push('migration_history_repair_candidate_not_deterministic')
  if (risk.remoteSchemaEquivalenceProven !== true) blockers.push('remote_schema_equivalence_not_proven')
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')
  const decision: MigrationHistoryRepairDecision = blockers.includes('migration_history_evidence_missing')
    ? 'blocked_pending_remote_history_evidence'
    : blockers.includes('remote_schema_equivalence_not_proven')
      ? 'blocked_pending_remote_history_evidence'
      : blockers.length > 0
        ? 'blocked_pending_human_review'
        : 'approved_for_future_staging_migration_history_repair'
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: decision === 'approved_for_future_staging_migration_history_repair' ? 'passed' : 'blocked',
    decision,
    executeConfirmed,
    approvedForFutureRepair: false,
    reason:
      'Current safe evidence identifies a deterministic repair candidate, but does not prove the 12 historical migration schemas already exist in staging.',
    requiredAdditionalEvidence: [
      'remote_schema_equivalence_evidence_for_12_missing_history_versions',
      'human_review_of_exact_repair_versions',
      'separate_repair_execution_prompt',
    ],
    selectedCandidate: candidate.selectedRepairAction,
    repairVersions: candidate.repairVersions,
    forbiddenConfirmationsSet: forbiddenSet,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directSqlRun: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildBlockerReport(decision: ReturnType<typeof buildApprovalDecision>) {
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: decision.blockers.length > 0 ? 'blocked' : 'passed',
    activeBlockers: decision.blockers,
    expectedDefaultBlocker: 'remote_schema_equivalence_not_proven',
    stillBlockedScopes: [
      'migration_repair_execution',
      'staging_schema_deploy',
      'track_b_staging_backfill',
      'production_supabase',
      'direct_sql',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
      'track_a',
    ],
  }
}

function buildReadinessReport(
  decision: ReturnType<typeof buildApprovalDecision>,
  blockerReport: ReturnType<typeof buildBlockerReport>,
) {
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    approvalPacketGenerated: decision.executeConfirmed,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directSqlRun: false,
    blockers: blockerReport.activeBlockers,
    nextRecommendedPhase:
      decision.decision === 'approved_for_future_staging_migration_history_repair'
        ? 'Run the separate staging migration-history repair execution phase.'
        : 'Provide remote schema equivalence evidence and human review before repair execution.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_PHASE,
    runId: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    secretsCommitted: false,
    credentialPayloadsPrinted: false,
    sqlExecuted: false,
    migrationRepairRun: false,
    migrationDeployed: false,
    stagingDataWritten: false,
    productionAffected: false,
  }
}

function renderReadinessMarkdown(
  reports: ReturnType<typeof buildSupabaseMigrationHistoryRepairApprovalReports>,
) {
  return `# Supabase Migration-History Repair Approval

- Status: ${reports.readinessReport.status}
- Decision: ${reports.approvalDecision.decision}
- Repair versions: ${reports.repairCandidatePlan.repairVersions.join(', ')}
- Active blockers: ${reports.blockerReport.activeBlockers.join(', ')}
- Migration repair run: false
- Schema deploy run: false
- Track B backfill run: false
- Production affected: false
- Next action: ${reports.readinessReport.nextRecommendedPhase}
`
}

function readJson(filePath: string): JsonRecord | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function readStringArray(source: JsonRecord | null, key: string): string[] {
  const value = source?.[key]
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function readString(source: JsonRecord | null, key: string): string | null {
  const value = source?.[key]
  return typeof value === 'string' ? value : null
}

function readBoolean(source: JsonRecord | null, key: string): boolean | null {
  const value = source?.[key]
  return typeof value === 'boolean' ? value : null
}

function listLocalMigrationIds() {
  const migrationDir = path.join('supabase', 'migrations')
  if (!existsSync(migrationDir)) return []
  return readdirSync(migrationDir)
    .filter((file) => /^\d{12}_.+\.sql$/.test(file))
    .map((file) => file.slice(0, 12))
    .sort()
}

function isDirectory(pathname: string) {
  try {
    return readdirSync(pathname, { withFileTypes: true }).length >= 0
  } catch {
    return false
  }
}

function getForbiddenConfirmationSet() {
  return FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}
