import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  StagingResetApprovalBlocker,
  StagingResetApprovalDecision,
  StagingResetRiskLevel,
} from './staging-reset-approval-types'

export const SUPABASE_STAGING_RESET_APPROVAL_PHASE =
  'supabase-staging-reset-approval-packet'
export const SUPABASE_STAGING_RESET_APPROVAL_RUN_ID =
  'supabase-staging-reset-approval-packet-20260609'
export const SUPABASE_STAGING_RESET_APPROVAL_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-approval-packet'
export const SUPABASE_STAGING_RESET_APPROVAL_BASE_BRANCH =
  'codex/rp-foundation-supabase-schema-parity-remediation-strategy'
export const SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-staging-reset-approval-reports'
export const SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_APPROVAL_PACKET'
export const SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RISK_REVIEW'

export const SUPABASE_STAGING_RESET_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_reset_approval_plan.json',
  'staging_reset_evidence_inventory.json',
  'staging_reset_data_impact_review.json',
  'staging_reset_backup_snapshot_plan.json',
  'staging_reset_migration_order_review.json',
  'staging_reset_target_proof_review.json',
  'staging_reset_post_reset_verification_plan.json',
  'staging_reset_risk_report.json',
  'staging_reset_operator_checklist.json',
  'staging_reset_approval_decision.json',
  'staging_reset_blocker_report.json',
  'staging_reset_readiness_report.json',
  'staging_reset_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_RESET_APPROVAL_DOCS = [
  'docs/supabase-staging-reset-approval-decision.md',
  'docs/supabase-staging-reset-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
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

const SCHEMA_PARITY_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const REMOTE_EQUIVALENCE_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const REPAIR_APPROVAL_REPORT_DIR = 'docs/activation-supabase-migration-history-repair-approval-reports'
const DEPLOY_TRANSPORT_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const BACKFILL_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MILESTONE_MIGRATION = 'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
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

export function getSupabaseStagingResetApprovalPlan() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    branch: SUPABASE_STAGING_RESET_APPROVAL_BRANCH,
    baseBranch: SUPABASE_STAGING_RESET_APPROVAL_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging reset approval packet',
    reportDir: SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_RESET_APPROVAL_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_RESET_APPROVAL_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [196, 198, 200, 223, 238, 241, 247],
    allowedActions: [
      'read_committed_safe_reports',
      'read_local_migration_files',
      'generate_reset_approval_criteria',
      'generate_backup_snapshot_plan',
      'generate_migration_order_review',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'staging_reset_execution',
      'supabase_migration_repair',
      'schema_deploy',
      'direct_sql',
      'track_b_backfill_write',
      'production_supabase',
      'secret_payload_access',
      'secret_printing',
      'provider_calls',
      'route_tool_worker_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    confirmationsForApprovalPacketExecution: [
      SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION,
      SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
  }
}

export function buildSupabaseStagingResetApprovalReports(input: {
  executeConfirmed?: boolean
  riskReviewConfirmed?: boolean
} = {}) {
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory()
  const dataImpactReview = buildDataImpactReview(evidenceInventory)
  const backupSnapshotPlan = buildBackupSnapshotPlan()
  const migrationOrderReview = buildMigrationOrderReview()
  const targetProofReview = buildTargetProofReview()
  const postResetVerificationPlan = buildPostResetVerificationPlan()
  const riskReport = buildRiskReport(dataImpactReview, backupSnapshotPlan, migrationOrderReview)
  const operatorChecklist = buildOperatorChecklist()
  const decision = buildApprovalDecision(dataImpactReview, backupSnapshotPlan, riskReport)
  const blockerReport = buildBlockerReport(decision, dataImpactReview, backupSnapshotPlan)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan: getSupabaseStagingResetApprovalPlan(),
    evidenceInventory,
    dataImpactReview,
    backupSnapshotPlan,
    migrationOrderReview,
    targetProofReview,
    postResetVerificationPlan,
    riskReport,
    operatorChecklist,
    approvalDecision: decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
    executionConfirmationStatus: {
      approvalPacketConfirmed: input.executeConfirmed === true,
      riskReviewConfirmed: input.riskReviewConfirmed === true,
      stagingResetRun: false,
      migrationRepairRun: false,
      schemaDeployRun: false,
      trackBBackfillRun: false,
      productionAffected: false,
      directDdlDmlRun: false,
      secretPayloadAccess: false,
      secretsPrintedOrCommitted: false,
    },
  }
}

export async function writeSupabaseStagingResetApprovalArtifacts(
  reports: ReturnType<typeof buildSupabaseStagingResetApprovalReports>,
) {
  const dir = SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_approval_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_data_impact_review.json'), reports.dataImpactReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_backup_snapshot_plan.json'), reports.backupSnapshotPlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_migration_order_review.json'), reports.migrationOrderReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_target_proof_review.json'), reports.targetProofReview)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_post_reset_verification_plan.json'), reports.postResetVerificationPlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_risk_report.json'), reports.riskReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_reset_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-approval-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-staging-reset-operator-checklist.md', renderChecklistMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
    renderExecutionPrompt(reports),
  )
}

export async function executeSupabaseStagingResetApproval(input: {
  keepTemp: boolean
}): Promise<{ reports: ReturnType<typeof buildSupabaseStagingResetApprovalReports>; exitCode: number }> {
  void input
  const executeConfirmed = process.env[SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION] === 'true'
  const riskReviewConfirmed = process.env[SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION] === 'true'
  const reports = buildSupabaseStagingResetApprovalReports({
    executeConfirmed,
    riskReviewConfirmed,
  })
  await writeSupabaseStagingResetApprovalArtifacts(reports)
  return { reports, exitCode: executeConfirmed && riskReviewConfirmed ? 0 : 1 }
}

export function readSupabaseStagingResetApprovalSummary() {
  const reports = buildSupabaseStagingResetApprovalReports()
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    dataImpact: reports.dataImpactReview.status,
    backupSnapshot: reports.backupSnapshotPlan.status,
    migrationOrder: reports.migrationOrderReview.status,
    targetProof: reports.targetProofReview.status,
    risk: reports.riskReport.overallRisk,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.blockerReport.activeBlockers,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: {
      trackBMediaProcessing: 'safe Track B milestone export only',
      observabilityAuditCost: 'future registry/audit consumer only',
      workerRuntimeJobs: 'not executed',
      productInternalBetaAggregation: 'depends on milestone state later',
    },
    explicitlyNotOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'production/external beta unlocks',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      note: existsSync(sourcePath)
        ? 'available_for_approval_packet'
        : 'missing_in_pr_247_branch_recorded_as_audit_fact',
    })),
    duplicateWorkRisk: 'high_if_new_deploy_wrapper_schema_or_backfill_path_is_created',
    secretPayloadAccess: false,
    sqlExecuted: false,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildEvidenceInventory() {
  const schemaDecision = readJson(path.join(SCHEMA_PARITY_REPORT_DIR, 'schema_parity_decision.json'))
  const schemaStrategy = readJson(path.join(SCHEMA_PARITY_REPORT_DIR, 'schema_parity_recommended_strategy.json'))
  const remoteComparison = readJson(path.join(REMOTE_EQUIVALENCE_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'))
  const repairDecision = readJson(path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_repair_approval_decision.json'))
  const transportReadiness = readJson(path.join(DEPLOY_TRANSPORT_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'))
  const backfillReadiness = readJson(path.join(BACKFILL_REPORT_DIR, 'supabase_trackb_backfill_readiness_report.json'))
  const migrationFiles = listMigrationFiles()
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'passed',
    sourceReports: [
      path.join(SCHEMA_PARITY_REPORT_DIR, 'schema_parity_decision.json'),
      path.join(SCHEMA_PARITY_REPORT_DIR, 'schema_parity_recommended_strategy.json'),
      path.join(REMOTE_EQUIVALENCE_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
      path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_repair_approval_decision.json'),
      path.join(DEPLOY_TRANSPORT_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
      path.join(BACKFILL_REPORT_DIR, 'supabase_trackb_backfill_readiness_report.json'),
    ],
    schemaParityStrategy: readString(schemaStrategy, 'selectedStrategy'),
    schemaParityDecision: readString(schemaDecision, 'decision'),
    remoteEquivalence: readString(remoteComparison, 'overallEquivalence'),
    equivalentMigrationCount: readNumber(remoteComparison, 'equivalentMigrationCount'),
    notEquivalentMigrationCount: readNumber(remoteComparison, 'notEquivalentMigrationCount'),
    repairApprovalDecision: readString(repairDecision, 'decision'),
    deployTransportStatus: readString(transportReadiness, 'status'),
    backfillStatus: readString(backfillReadiness, 'status') || 'blocked_or_report_missing',
    milestoneRegistryMigration: {
      path: MILESTONE_MIGRATION,
      present: existsSync(MILESTONE_MIGRATION),
    },
    approvedStagingTargetReference: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      environment: 'staging',
      source: 'PR #212 committed approved target reference',
    },
    localMigrationCount: migrationFiles.length,
    localMigrationFiles: migrationFiles,
    knownBlockers: [
      'schema_parity_not_proven',
      'migration_history_repair_unsafe',
      'schema_deploy_blocked',
      'track_b_backfill_blocked',
    ],
    currentUnlockStage: 'staging_reset_approval_packet',
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildDataImpactReview(evidenceInventory: ReturnType<typeof buildEvidenceInventory>) {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    blocker: 'staging_data_impact_not_reviewed',
    isStagingUsedByInternalUsers: 'unknown_requires_human_review',
    importantStagingRecords: 'unknown_requires_human_review',
    privateArtifactReferencesInStaging: 'unknown_requires_human_review',
    authUserWorkspaceProjectRecordsAtRisk: 'unknown_requires_human_review',
    dataExportOrSnapshotRequiredBeforeReset: true,
    canResetProceedWithoutUserOrDataLoss: false,
    evidenceContext: {
      localMigrationCount: evidenceInventory.localMigrationCount,
      notEquivalentMigrationCount: evidenceInventory.notEquivalentMigrationCount,
    },
    unknowns: [
      'whether staging contains important auth users',
      'whether staging contains workspaces/projects needed for QA',
      'whether staging contains private artifact references',
      'whether any records require export before reset',
    ],
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildBackupSnapshotPlan() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    blocker: 'staging_backup_snapshot_plan_missing',
    preResetBackupSnapshotOrExportRequired: true,
    futureBackupCommandClass: 'redacted_supabase_cli_or_dashboard_backup_export_to_be_approved_later',
    backupRunInThisPhase: false,
    storageDestinationPolicy: 'private_staging_backup_destination_only_no_public_links',
    retentionPolicy: 'requires_human_owner_duration_and_cleanup_approval',
    secretPolicy: 'credential_values_never_logged_or_committed',
    restoreRollbackConcept: 'restore from approved pre-reset snapshot/export or stop and escalate',
    backupMechanismKnown: false,
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildMigrationOrderReview() {
  const migrationFiles = listMigrationFiles()
  const riskyMigrations = migrationFiles.filter((file) => {
    const text = readFileIfExists(path.join('supabase/migrations', file)).toLowerCase()
    return text.includes('drop policy') ||
      text.includes('drop trigger') ||
      text.includes('insert into storage.buckets') ||
      text.includes('enable row level security') ||
      text.includes('create policy')
  })
  const dataChangingMigrations = migrationFiles.filter((file) => {
    const text = readFileIfExists(path.join('supabase/migrations', file)).toLowerCase()
    return /\binsert\b|\bupdate\b|\bdelete\b|\btruncate\b/.test(text)
  })
  const policyMigrations = migrationFiles.filter((file) => {
    const text = readFileIfExists(path.join('supabase/migrations', file)).toLowerCase()
    return text.includes('create policy') || text.includes('enable row level security')
  })
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'reviewed_for_planning_future_dry_run_required',
    localMigrationCount: migrationFiles.length,
    migrationOrder: migrationFiles,
    riskyMigrationCount: riskyMigrations.length,
    riskyMigrations,
    dataChangingMigrationCount: dataChangingMigrations.length,
    dataChangingMigrations,
    extensionFunctionPolicyMigrations: policyMigrations,
    canReapplyFromEmptyStaging: 'likely_but_not_approved_until_future_dry_run',
    seedDataRequired: 'unknown_not_approved',
    milestoneRegistryMigrationIncluded: migrationFiles.includes(path.basename(MILESTONE_MIGRATION)),
    dryRunRequiredBeforeExecution: true,
    blocker: 'migration_order_dry_run_required',
    stagingResetRun: false,
    schemaDeployRun: false,
    productionAffected: false,
  }
}

function buildTargetProofReview() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'passed_for_metadata_only',
    approvedStagingTarget: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      environment: 'staging',
      source: 'PR #212',
    },
    productionExcluded: true,
    pluginTargetProofRequiredAgainInExecution: true,
    dbUrlTargetProofRequiredAgainInExecution: true,
    targetMutationInThisPhase: false,
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildPostResetVerificationPlan() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'planned_not_run',
    requiredVerification: [
      'migration_history_verification',
      'schema_rls_verification',
      'activation_milestone_registry_table_verification',
      'pr_198_backfill_preflight_and_diff_only',
      'production_untouched_verification',
      'secret_redaction_verification',
    ],
    trackBBackfillInResetPhase: false,
    trackBBackfillRequiresSeparateApproval: true,
    stagingResetRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildRiskReport(
  dataImpactReview: ReturnType<typeof buildDataImpactReview>,
  backupSnapshotPlan: ReturnType<typeof buildBackupSnapshotPlan>,
  migrationOrderReview: ReturnType<typeof buildMigrationOrderReview>,
) {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    overallRisk: 'high' as StagingResetRiskLevel,
    riskDimensions: {
      dataLoss: 'high_until_data_impact_review_passes',
      authUserDisruption: 'medium_high_until_auth_record_review_passes',
      privateArtifactReferenceLoss: 'medium_high_until_reference_review_passes',
      migrationFailure: 'medium_high_until_dry_run_passes',
      rollbackDifficulty: 'high_until_backup_snapshot_plan_passes',
      productionConfusion: 'low_with_target_proof_required_again',
      secretExposure: 'low_in_this_packet_no_secret_payload_access',
      trackBBackfillDelay: 'medium_backfill_remains_separate',
    },
    blockers: [
      dataImpactReview.blocker,
      backupSnapshotPlan.blocker,
      migrationOrderReview.blocker,
    ],
    unacceptableStagingResetRisk: false,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildOperatorChecklist() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    checklist: [
      'staging target confirmed',
      'production excluded',
      'data impact reviewed',
      'backup/snapshot plan reviewed',
      'migration order reviewed',
      'dry-run required before reset/reapply execution',
      'reset execution command approved in separate phase',
      'post-reset verification checklist reviewed',
      'rollback plan reviewed',
      'Track B backfill remains separate',
      'no secrets printed',
      'human approval required',
    ],
    completionRequiredBeforeExecution: true,
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildApprovalDecision(
  dataImpactReview: ReturnType<typeof buildDataImpactReview>,
  backupSnapshotPlan: ReturnType<typeof buildBackupSnapshotPlan>,
  riskReport: ReturnType<typeof buildRiskReport>,
) {
  const decision: StagingResetApprovalDecision = dataImpactReview.status === 'blocked'
    ? 'blocked_pending_staging_data_impact_review'
    : backupSnapshotPlan.status === 'blocked'
      ? 'blocked_pending_backup_snapshot_plan'
      : 'blocked_pending_human_review'
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    decision,
    approvalStatus: 'not_approved_for_execution',
    dataImpactStatus: dataImpactReview.status,
    backupSnapshotStatus: backupSnapshotPlan.status,
    risk: riskReport.overallRisk,
    futureResetApproved: false,
    resetExecutionApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    rationale:
      'PR #247 recommends staging reset/reapply, but staging data impact, backup/snapshot readiness, and execution-owner acceptance are not proven in this branch.',
    nextSupabaseAction:
      'Resolve staging data impact and backup/snapshot review before a separate reset/reapply execution approval phase.',
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildBlockerReport(
  decision: ReturnType<typeof buildApprovalDecision>,
  dataImpactReview: ReturnType<typeof buildDataImpactReview>,
  backupSnapshotPlan: ReturnType<typeof buildBackupSnapshotPlan>,
) {
  const activeBlockers: StagingResetApprovalBlocker[] = [
    'staging_data_impact_not_reviewed',
    'staging_backup_snapshot_plan_missing',
    'staging_reset_dependency_review_required',
    'staging_reset_execution_not_approved',
    'migration_order_dry_run_required',
  ]
  if (process.env[SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION] !== 'true') {
    activeBlockers.push('staging_reset_approval_packet_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION] !== 'true') {
    activeBlockers.push('staging_reset_risk_review_not_confirmed')
  }
  if (FORBIDDEN_CONFIRMATIONS.some((name) => process.env[name] === 'true')) {
    activeBlockers.push('forbidden_confirmation_set')
  }
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    decision: decision.decision,
    dataImpactBlocker: dataImpactReview.blocker,
    backupSnapshotBlocker: backupSnapshotPlan.blocker,
    activeBlockers: Array.from(new Set(activeBlockers)),
    blockedScopes: [
      'reset_execution_until_separate_approved_phase',
      'migration_history_repair',
      'schema_deploy',
      'track_b_staging_backfill',
      'production_supabase',
      'direct_sql',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
    ],
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(
  decision: ReturnType<typeof buildApprovalDecision>,
  blockerReport: ReturnType<typeof buildBlockerReport>,
) {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'blocked',
    decision: decision.decision,
    readinessStatus: 'approval_packet_complete_execution_blocked',
    resetApprovalPacketComplete: true,
    executionReady: false,
    activeBlockers: blockerReport.activeBlockers,
    nextRecommendedPhase: decision.nextSupabaseAction,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_STAGING_RESET_APPROVAL_PHASE,
    runId: SUPABASE_STAGING_RESET_APPROVAL_RUN_ID,
    status: 'metadata_committed_only',
    privateUploadRequired: false,
    privateUploadPerformed: false,
    committedArtifacts: [
      SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
      ...SUPABASE_STAGING_RESET_APPROVAL_DOCS,
    ],
    forbiddenPayloadClasses: [
      'db_url',
      'service_role_key',
      'anon_key',
      'jwt_secret',
      'access_token',
      'signed_url',
      'provider_key',
      'private_payload',
      'media_payload',
      'model_payload',
    ],
    secretRefUsed: 'none',
    secretPayloadAccess: false,
    payloadPrinted: false,
    payloadCommitted: false,
  }
}

function renderDecisionMarkdown(reports: ReturnType<typeof buildSupabaseStagingResetApprovalReports>) {
  return `# Supabase Staging Reset Approval Decision

Decision: \`${reports.approvalDecision.decision}\`

Approval status: \`${reports.approvalDecision.approvalStatus}\`

This is an approval packet only. It did not run staging reset, migration repair, schema deploy, direct SQL, Track B backfill, production SQL, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks.

## Current Evidence

- PR #247 strategy: \`${reports.evidenceInventory.schemaParityStrategy}\`
- PR #247 decision: \`${reports.evidenceInventory.schemaParityDecision}\`
- PR #241 equivalence: \`${reports.evidenceInventory.remoteEquivalence}\`
- Non-equivalent migration-history gaps: \`${reports.evidenceInventory.notEquivalentMigrationCount}\`
- Risk: \`${reports.riskReport.overallRisk}\`

## Blockers

- \`${reports.dataImpactReview.blocker}\`
- \`${reports.backupSnapshotPlan.blocker}\`
- \`migration_order_dry_run_required\`

## Next Action

${reports.approvalDecision.nextSupabaseAction}
`
}

function renderChecklistMarkdown(reports: ReturnType<typeof buildSupabaseStagingResetApprovalReports>) {
  return `# Supabase Staging Reset Operator Checklist

Decision: \`${reports.approvalDecision.decision}\`

${reports.operatorChecklist.checklist.map((item) => `- [ ] ${item}`).join('\n')}

Blocked in this packet: staging reset, migration repair, schema deploy, direct SQL, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
`
}

function renderExecutionPrompt(reports: ReturnType<typeof buildSupabaseStagingResetApprovalReports>) {
  return `# Supabase Staging Reset And Reapply Execution Prompt

Use this only in a separate approved execution phase.

Decision from approval packet: \`${reports.approvalDecision.decision}\`

Rules:
- run only if a later approval resolves data impact and backup/snapshot blockers
- staging only, never production
- backup/snapshot/export first when required
- migration-safe dry-run first
- reset/reapply only with approved target proof and redacted credentials
- verify schema, RLS, migration history, and activation milestone registry tables after reset
- rerun PR #198 Track B backfill only in a later separate phase
- do not print or commit secrets

This packet did not run staging reset, migration repair, schema deploy, direct SQL, or Track B backfill.
`
}

function listMigrationFiles(): string[] {
  const dir = 'supabase/migrations'
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
}

function readJson(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
}

function readFileIfExists(filePath: string): string {
  if (!existsSync(filePath)) return ''
  return readFileSync(filePath, 'utf8')
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readNumber(record: JsonRecord, key: string): number {
  const value = record[key]
  return typeof value === 'number' ? value : 0
}
