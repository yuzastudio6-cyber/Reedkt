import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  StagingDataImpactBackupBlocker,
  StagingDataImpactBackupDecision,
  StagingDataImpactRiskLevel,
  StagingDataImpactTableEstimate,
} from './staging-data-impact-backup-types'

export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE =
  'supabase-staging-data-impact-backup-approval'
export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID =
  'supabase-staging-data-impact-backup-approval-20260609'
export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_BRANCH =
  'codex/rp-foundation-supabase-staging-data-impact-backup-approval'
export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-reset-approval-packet'
export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR =
  'docs/activation-supabase-staging-data-impact-backup-reports'
export const SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_DATA_IMPACT_REVIEW'
export const SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_BACKUP_SNAPSHOT_APPROVAL_PACKET'
export const SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION'
export const SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE'
export const SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT'

export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'staging_data_impact_backup_plan.json',
  'staging_data_impact_evidence_inventory.json',
  'staging_data_impact_readonly_inspection_report.json',
  'staging_data_impact_inventory.json',
  'staging_data_impact_risk_report.json',
  'staging_backup_snapshot_plan.json',
  'staging_owner_data_loss_acceptance_artifact.json',
  'staging_owner_data_loss_acceptance_decision_update.json',
  'staging_data_impact_backup_operator_checklist.json',
  'staging_data_impact_backup_approval_decision.json',
  'staging_data_impact_backup_blocker_report.json',
  'staging_data_impact_backup_readiness_report.json',
  'staging_data_impact_backup_private_artifact_manifest.json',
] as const

export const SUPABASE_STAGING_DATA_IMPACT_BACKUP_DOCS = [
  'docs/supabase-staging-data-impact-backup-approval-decision.md',
  'docs/supabase-staging-data-impact-backup-operator-checklist.md',
  'docs/supabase-staging-owner-data-loss-acceptance.md',
  'docs/supabase-staging-reset-owner-approval-decision.md',
  'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
] as const

const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_STAGING_PROJECT_NAME = 'Reeditpro'
const APPROVED_STAGING_ENVIRONMENT = 'staging'
const APPROVED_DB_URL_ENV_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const
const OWNER_ACCEPTANCE_PATHS = [
  'docs/supabase-staging-owner-data-loss-acceptance.md',
  'docs/supabase-staging-reset-owner-approval-decision.md',
  'docs/staging-supabase-reset-owner-approval.md',
] as const
const OWNER_ACCEPTANCE_DECISION_UPDATE_PATH = path.join(
  SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
  'staging_owner_data_loss_acceptance_decision_update.json',
)
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
const PR248_REPORT_DIR = 'docs/activation-supabase-staging-reset-approval-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const MILESTONE_MIGRATION = 'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
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
const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role/i,
  /access[_-]?token/i,
  /BEGIN PRIVATE KEY/i,
  /x-goog-signature=/i,
] as const

type JsonRecord = Record<string, unknown>
type ReadonlyInspectionCatalog = {
  schemas: JsonRecord[]
  tables: JsonRecord[]
  tableEstimates: StagingDataImpactTableEstimate[]
  rls: JsonRecord[]
  policies: JsonRecord[]
  storageBuckets: JsonRecord[]
  migrationHistory: JsonRecord[]
}

export function getSupabaseStagingDataImpactBackupPlan() {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    branch: SUPABASE_STAGING_DATA_IMPACT_BACKUP_BRANCH,
    baseBranch: SUPABASE_STAGING_DATA_IMPACT_BACKUP_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging data impact backup approval',
    reportDir: SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
    expectedReports: SUPABASE_STAGING_DATA_IMPACT_BACKUP_EXPECTED_REPORTS,
    docs: SUPABASE_STAGING_DATA_IMPACT_BACKUP_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 248],
    docsBasis: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      dbDump: 'https://supabase.com/docs/reference/cli/supabase-db-dump',
      backups: 'https://supabase.com/docs/guides/platform/backups',
      changelogCheckedAt: '2026-06-09',
      blockingBreakingChangeFound: false,
    },
    allowedActions: [
      'read_committed_safe_reports',
      'read_local_migration_sql',
      'run_readonly_staging_metadata_count_inspection_when_confirmed',
      'classify_staging_data_impact',
      'plan_future_backup_snapshot_requirements',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'staging_reset_execution',
      'supabase_db_push',
      'supabase_migration_repair',
      'direct_ddl_dml',
      'schema_deploy',
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
    allowedConfirmations: [
      SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION,
      SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION,
      SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION,
    ],
    conditionalAllowedConfirmations: [
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION,
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    approvalThreshold:
      'future reset requires completed data-impact review, acceptable backup/snapshot plan, and explicit staging-owner data-loss acceptance artifact',
  }
}

export function buildSupabaseStagingDataImpactBackupReports(input: {
  executeReadonly?: boolean
  acceptOwnerRisk?: boolean
} = {}) {
  const plan = getSupabaseStagingDataImpactBackupPlan()
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceInventory = buildEvidenceInventory()
  const readonlyInspection = input.executeReadonly
    ? runReadonlyStagingDataImpactInspection()
    : loadExistingReadonlyInspectionReport() ?? buildNotExecutedReadonlyInspectionReport()
  const dataImpactInventory = buildDataImpactInventory(evidenceInventory, readonlyInspection)
  const riskReport = buildRiskReport(dataImpactInventory, readonlyInspection)
  const backupSnapshotPlan = buildBackupSnapshotPlan(dataImpactInventory)
  const ownerAcceptance = buildOwnerAcceptanceReview({ acceptOwnerRisk: input.acceptOwnerRisk === true })
  const ownerAcceptanceArtifact = buildOwnerDataLossAcceptanceArtifact(ownerAcceptance)
  const operatorChecklist = buildOperatorChecklist(dataImpactInventory, backupSnapshotPlan, ownerAcceptance)
  const decision = buildApprovalDecision(dataImpactInventory, backupSnapshotPlan, riskReport, ownerAcceptance)
  const ownerAcceptanceDecisionUpdate = buildOwnerDataLossAcceptanceDecisionUpdate(
    ownerAcceptanceArtifact,
    decision,
    dataImpactInventory,
    backupSnapshotPlan,
    riskReport,
  )
  const blockerReport = buildBlockerReport(decision, dataImpactInventory, backupSnapshotPlan, ownerAcceptance)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    evidenceInventory,
    readonlyInspection,
    dataImpactInventory,
    riskReport,
    backupSnapshotPlan,
    ownerAcceptance,
    ownerAcceptanceArtifact,
    ownerAcceptanceDecisionUpdate,
    operatorChecklist,
    approvalDecision: decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseStagingDataImpactBackupArtifacts(
  reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>,
) {
  const dir = SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_data_impact_backup_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_data_impact_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_readonly_inspection_report.json'),
    reports.readonlyInspection,
  )
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_data_impact_inventory.json'), reports.dataImpactInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_data_impact_risk_report.json'), reports.riskReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'staging_backup_snapshot_plan.json'), reports.backupSnapshotPlan)
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_owner_data_loss_acceptance_artifact.json'),
    reports.ownerAcceptanceArtifact,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_owner_data_loss_acceptance_decision_update.json'),
    reports.ownerAcceptanceDecisionUpdate,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_backup_operator_checklist.json'),
    reports.operatorChecklist,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_backup_approval_decision.json'),
    reports.approvalDecision,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_backup_blocker_report.json'),
    reports.blockerReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_backup_readiness_report.json'),
    reports.readinessReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'staging_data_impact_backup_private_artifact_manifest.json'),
    reports.privateArtifactManifest,
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-data-impact-backup-approval-decision.md',
    renderDecisionMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-data-impact-backup-operator-checklist.md',
    renderChecklistMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-owner-data-loss-acceptance.md',
    renderOwnerAcceptanceMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-staging-reset-owner-approval-decision.md',
    renderOwnerApprovalDecisionMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
    renderResetExecutionHandoffPrompt(reports),
  )
}

export async function executeSupabaseStagingDataImpactBackup(input: {
  readonlyMode: boolean
  acceptOwnerRisk: boolean
  keepTemp: boolean
}) {
  void input.keepTemp
  const reports = buildSupabaseStagingDataImpactBackupReports({
    executeReadonly: input.readonlyMode,
    acceptOwnerRisk: input.acceptOwnerRisk,
  })
  await writeSupabaseStagingDataImpactBackupArtifacts(reports)
  const readonlyConfirmationsPassed =
    !input.readonlyMode ||
    (process.env[SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION] === 'true')
  const ownerAcceptanceConfirmationsPassed =
    !input.acceptOwnerRisk ||
    (process.env[SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION] === 'true' &&
      process.env[SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION] === 'true')
  const forbiddenConfirmationsClear = FORBIDDEN_CONFIRMATIONS.every((name) => process.env[name] !== 'true')
  const approvalOutcomePassed =
    !input.acceptOwnerRisk ||
    reports.approvalDecision.decision === 'approved_for_future_staging_reset_and_reapply_migrations'
  const confirmationsPassed =
    readonlyConfirmationsPassed &&
    ownerAcceptanceConfirmationsPassed &&
    forbiddenConfirmationsClear &&
    approvalOutcomePassed
  return { reports, exitCode: confirmationsPassed ? 0 : 1 }
}

export function readSupabaseStagingDataImpactBackupSummary() {
  const reports = buildSupabaseStagingDataImpactBackupReports()
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.approvalDecision.decision,
    liveStagingInspection: reports.readonlyInspection.status,
    dataImpact: reports.dataImpactInventory.status,
    backupSnapshot: reports.backupSnapshotPlan.status,
    ownerAcceptance: reports.ownerAcceptance.status,
    risk: reports.riskReport.overallRisk,
    futureResetApproved: reports.approvalDecision.futureResetApproved,
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
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: {
      trackBMediaProcessing: 'safe Track B milestone export from PR #196 only',
      observabilityAuditCost: 'future milestone registry/audit consumer only',
      workerRuntimeJobs: 'not executed',
      productInternalBetaAggregation: 'depends on accurate Supabase milestone state later',
    },
    explicitlyNotOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'production/external beta unlocks',
    ],
    integrationPoints: [198, 200, 223, 241, 247, 248],
    sourceOfTruthPaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    duplicateWorkAvoided: [
      'no_new_reset_strategy',
      'no_new_deploy_wrapper',
      'no_new_milestone_registry_schema',
      'no_reset_execution',
      'no_schema_deploy',
      'no_migration_history_repair',
    ],
    supabaseEnvironmentTouched: 'none_unless_readonly_staging_metadata_inspection_is_confirmed',
    sqlExecuted: 'readonly_metadata_count_select_only_if_confirmed',
    migrationDeployed: false,
    productionAffected: false,
  }
}

function buildEvidenceInventory() {
  const resetDecision = readJsonArtifact(path.join(PR248_REPORT_DIR, 'staging_reset_approval_decision.json'))
  const resetDataImpact = readJsonArtifact(path.join(PR248_REPORT_DIR, 'staging_reset_data_impact_review.json'))
  const resetBackup = readJsonArtifact(path.join(PR248_REPORT_DIR, 'staging_reset_backup_snapshot_plan.json'))
  const parityDecision = readJsonArtifact(path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'))
  const parityStrategy = readJsonArtifact(path.join(PR247_REPORT_DIR, 'schema_parity_recommended_strategy.json'))
  const equivalence = readJsonArtifact(path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'))
  const deployTransport = readJsonArtifact(path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'))
  const backfill = readJsonArtifact(path.join(PR198_REPORT_DIR, 'supabase_trackb_backfill_readiness_report.json'))
  const localMigrations = existsSync(MIGRATION_DIR)
    ? readdirSync(MIGRATION_DIR).filter((name) => name.endsWith('.sql')).sort()
    : []
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    pr248: {
      decision: asString(resetDecision?.decision, 'missing'),
      approvalStatus: asString(resetDecision?.approvalStatus, 'missing'),
      dataImpactStatus: asString(resetDataImpact?.status, 'missing'),
      backupSnapshotStatus: asString(resetBackup?.status, 'missing'),
      sourceReportsPresent: Boolean(resetDecision && resetDataImpact && resetBackup),
    },
    pr247: {
      decision: asString(parityDecision?.decision, 'missing'),
      selectedStrategy: asString(parityStrategy?.selectedStrategy, 'missing'),
      sourceReportsPresent: Boolean(parityDecision && parityStrategy),
    },
    pr241: {
      overallEquivalence: asString(equivalence?.overallEquivalence, 'missing'),
      equivalentMigrationCount: asNumber(equivalence?.equivalentMigrationCount, 0),
      notEquivalentMigrationCount: asNumber(equivalence?.notEquivalentMigrationCount, 0),
      remoteIntrospectionStatus: asString(equivalence?.remoteIntrospectionStatus, 'missing'),
      sourceReportPresent: Boolean(equivalence),
    },
    pr223: {
      readinessStatus: asString(deployTransport?.readinessStatus ?? deployTransport?.status, 'missing'),
      sourceReportPresent: Boolean(deployTransport),
    },
    pr198: {
      readinessStatus: asString(backfill?.status, 'blocked_or_report_missing'),
      sourceReportPresent: Boolean(backfill),
    },
    pr200: {
      milestoneRegistryMigrationPath: MILESTONE_MIGRATION,
      milestoneRegistryMigrationPresent: existsSync(MILESTONE_MIGRATION),
    },
    localMigrations: {
      count: localMigrations.length,
      versions: localMigrations.map((name) => name.split('_')[0]),
      latest: localMigrations.at(-1) ?? null,
    },
    safeMetadataOnly: true,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function runReadonlyStagingDataImpactInspection() {
  const forbiddenConfirmationsSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const confirmationBlockers: StagingDataImpactBackupBlocker[] = []
  if (process.env[SUPABASE_STAGING_DATA_IMPACT_REVIEW_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_data_impact_review_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_BACKUP_SNAPSHOT_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_backup_snapshot_approval_packet_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_SCHEMA_READONLY_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_schema_readonly_inspection_not_confirmed')
  }
  if (forbiddenConfirmationsSet.length > 0) confirmationBlockers.push('forbidden_confirmation_set')

  const dbUrlCheck = getApprovedDbUrlEnv()
  const psqlCheck = findUsablePsql()
  const blockers = unique([...confirmationBlockers, ...dbUrlCheck.blockers, ...psqlCheck.blockers])
  const base = {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    mode: 'readonly_staging_metadata_count_inspection',
    reviewExecuted: true,
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    dbUrlEnvPresent: dbUrlCheck.present,
    dbUrlEnvName: dbUrlCheck.envName,
    dbUrlSecretRefUsed: getSecretHandlingMetadata().dbUrlSecretRefUsed,
    dbUrlSecretPayloadAccessStatus: getSecretHandlingMetadata().dbUrlSecretPayloadAccessStatus,
    dbUrlValuePrinted: false,
    dbUrlTargetMatchedApprovedStaging: dbUrlCheck.targetMatched,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadAccessAttempted: getSecretHandlingMetadata().secretPayloadAccessAttempted,
    secretPayloadCommitted: false,
    psqlAvailable: psqlCheck.available,
    psqlVersionChecked: psqlCheck.versionChecked,
    psqlVersionSummary: psqlCheck.versionSummary,
    rowContentsRead: false,
    countOnly: true,
    productionTouched: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    forbiddenConfirmationsSet,
  }

  if (blockers.length > 0 || !dbUrlCheck.parsed || !psqlCheck.psqlPath) {
    return {
      ...base,
      status: 'blocked',
      inspectedCatalogs: [],
      queryReports: [],
      catalog: emptyReadonlyInspectionCatalog(),
      blockers,
    }
  }

  const catalog = emptyReadonlyInspectionCatalog()
  const queryReports: JsonRecord[] = []
  for (const [key, sql] of Object.entries(READONLY_DATA_IMPACT_QUERIES)) {
    const result = runReadonlyPsqlJsonQuery(psqlCheck.psqlPath, dbUrlCheck.parsed, key, sql)
    queryReports.push(result.report)
    if (result.status === 'passed') {
      catalog[key as keyof ReadonlyInspectionCatalog] = result.rows as never
    } else {
      blockers.push('readonly_staging_data_impact_inspection_failed')
    }
  }

  return {
    ...base,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    inspectedCatalogs: [
      'information_schema',
      'pg_catalog',
      'pg_namespace',
      'pg_class',
      'pg_policies',
      'storage.buckets_metadata',
      'supabase_migrations.schema_migrations',
    ],
    queryReports,
    catalog,
    blockers: unique(blockers),
  }
}

function buildNotExecutedReadonlyInspectionReport() {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: 'blocked',
    mode: 'readonly_staging_metadata_count_inspection',
    reviewExecuted: false,
    reason: 'readonly_execution_not_run',
    inspectedCatalogs: [],
    queryReports: [],
    catalog: emptyReadonlyInspectionCatalog(),
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    dbUrlEnvPresent: APPROVED_DB_URL_ENV_NAMES.some((name) => Boolean(process.env[name])),
    dbUrlSecretRefUsed: getSecretHandlingMetadata().dbUrlSecretRefUsed,
    dbUrlSecretPayloadAccessStatus: getSecretHandlingMetadata().dbUrlSecretPayloadAccessStatus,
    dbUrlValuePrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadAccessAttempted: getSecretHandlingMetadata().secretPayloadAccessAttempted,
    secretPayloadCommitted: false,
    rowContentsRead: false,
    countOnly: true,
    productionTouched: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    blockers: ['staging_data_impact_not_reviewed'] as StagingDataImpactBackupBlocker[],
  }
}

function buildDataImpactInventory(evidenceInventory: JsonRecord, readonlyInspection: JsonRecord) {
  const catalog = asCatalog(readonlyInspection.catalog)
  const estimates = catalog.tableEstimates
  const tableNames = new Set(estimates.map((row) => `${row.schema}.${row.table}`))
  const storageBuckets = catalog.storageBuckets
  const status = readonlyInspection.status === 'passed' ? 'reviewed_from_readonly_metadata' : 'blocked'
  const category = {
    authUsers: classifyTables(estimates, ['auth.users']),
    workspaceProject: classifyTables(estimates, [
      'public.profiles',
      'public.workspaces',
      'public.workspace_members',
      'public.projects',
      'public.edit_sessions',
    ]),
    mediaArtifacts: classifyTables(estimates, [
      'public.media_assets',
      'public.uploaded_clips',
      'public.source_sequence_items',
      'public.generated_assets',
      'public.export_jobs',
      'storage.objects',
    ]),
    milestoneRegistry: classifyTables(estimates, [
      'public.activation_milestones',
      'public.activation_phase_runs',
      'public.activation_tool_readiness',
      'public.activation_artifact_manifests',
      'public.activation_blockers',
    ]),
  }
  const unknowns = readonlyInspection.status === 'passed'
    ? [
        'row contents were not read',
        'exact business importance of staging records requires owner acceptance',
        'backup destination and restore test require separate execution phase',
      ]
    : [
        'live staging metadata/count inspection did not pass',
        'auth/user/workspace/project/media/artifact row impact remains unknown',
        'backup sizing and restore expectations remain unverified',
      ]

  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status,
    sourceEvidence: {
      pr248Decision: readNestedString(evidenceInventory, ['pr248', 'decision'], 'missing'),
      pr247Strategy: readNestedString(evidenceInventory, ['pr247', 'selectedStrategy'], 'missing'),
      pr241Equivalence: readNestedString(evidenceInventory, ['pr241', 'overallEquivalence'], 'missing'),
      pr241NotEquivalentMigrationCount: readNestedNumber(evidenceInventory, ['pr241', 'notEquivalentMigrationCount'], 0),
    },
    liveInspectionStatus: readonlyInspection.status,
    schemasPresent: catalog.schemas.map((row) => asString(row.schema, 'unknown')).filter((name) => name !== 'unknown').sort(),
    tableCount: tableNames.size,
    tablesPresent: [...tableNames].sort(),
    tableRowEstimates: estimates,
    categories: category,
    storageBuckets: storageBuckets.map((row) => ({
      id: asString(row.id, 'unknown'),
      public: row.public === true,
    })),
    privateArtifactReferenceRisk: category.mediaArtifacts.present || storageBuckets.length > 0 ? 'requires_owner_review' : 'not_observed_in_metadata',
    internalTestingDataRisk: category.workspaceProject.present || category.milestoneRegistry.present ? 'requires_owner_review' : 'not_observed_in_metadata',
    migrationHistoryVersionsObserved: catalog.migrationHistory.map((row) => asString(row.version, 'unknown')).filter((version) => version !== 'unknown'),
    rowContentsRead: false,
    countOnlyOrEstimateOnly: true,
    unknowns,
    blockers: readonlyInspection.status === 'passed' ? [] : ['staging_data_impact_not_reviewed'],
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildRiskReport(dataImpactInventory: JsonRecord, readonlyInspection: JsonRecord) {
  const blockers: StagingDataImpactBackupBlocker[] = []
  if (dataImpactInventory.status !== 'reviewed_from_readonly_metadata') blockers.push('staging_data_impact_not_reviewed')
  const categories = dataImpactInventory.categories as Record<string, { present?: boolean; estimatedRows?: number | null }> | undefined
  const materialCategories = Object.values(categories ?? {}).filter((category) => category.present)
  const overallRisk: StagingDataImpactRiskLevel = dataImpactInventory.status !== 'reviewed_from_readonly_metadata'
    ? 'high'
    : materialCategories.length > 0
      ? 'high'
      : 'medium'
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: blockers.length > 0 ? 'blocked' : 'reviewed_requires_owner_acceptance',
    overallRisk,
    authUserRisk: riskForCategory(categories?.authUsers),
    workspaceProjectRisk: riskForCategory(categories?.workspaceProject),
    storageArtifactReferenceRisk: riskForCategory(categories?.mediaArtifacts),
    milestoneRegistryRisk: riskForCategory(categories?.milestoneRegistry),
    internalTestingDisruptionRisk: materialCategories.length > 0 ? 'requires_owner_acceptance' : 'medium_until_owner_acceptance',
    dataLossRisk: materialCategories.length > 0 ? 'high_without_backup_and_owner_acceptance' : 'medium_until_owner_acceptance',
    resetSafety: 'not_approved_in_this_phase',
    readOnlyInspectionStatus: readonlyInspection.status,
    unacceptableRiskDetected: false,
    requiredApprovals: [
      'staging_owner_data_loss_acceptance',
      'backup_snapshot_execution_approval',
      'reset_reapply_execution_approval',
      'post_reset_verification_acceptance',
    ],
    blockers,
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildBackupSnapshotPlan(dataImpactInventory: JsonRecord) {
  const inventoryPassed = dataImpactInventory.status === 'reviewed_from_readonly_metadata'
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: inventoryPassed ? 'acceptable_for_future_execution_not_run' : 'planned_requires_data_inventory',
    preResetBackupSnapshotOrExportRequired: true,
    backupRunInThisPhase: false,
    backupExecutionRequiresSeparatePhase: true,
    recommendedBackupExportTypes: [
      'platform_daily_backup_or_pitr_snapshot_if_available',
      'private_logical_schema_dump_with_supabase_db_dump',
      'private_logical_data_dump_with_supabase_db_dump_data_only_when_approved',
      'separate_storage_object_backup_if_storage_objects_or_private_artifact_references_exist',
    ],
    docsBasis: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      dbDump: 'https://supabase.com/docs/reference/cli/supabase-db-dump',
      backups: 'https://supabase.com/docs/guides/platform/backups',
    },
    backupDestinationPolicy: 'private_staging_backup_destination_only_no_public_links_no_repo_committed_payloads',
    retentionPolicy: 'requires_staging_owner_retention_duration_and_cleanup_acceptance_before_execution',
    accessControl: 'least_privilege_operator_access_no_frontend_or_public_access',
    secretHandling: 'DB URLs passwords service keys and access tokens remain process-only and redacted',
    restoreTestRecommendation: 'perform restore rehearsal or documented restore verification before reset/reapply execution',
    storageObjectBackupRequiredIfStorageReferencesExist: true,
    limitations: [
      'this phase does not create a backup',
      'this phase does not read row contents',
      'backup destination and retention owner must be confirmed separately',
    ],
    blockers: inventoryPassed ? [] : ['staging_data_impact_not_reviewed'],
    stagingResetRun: false,
    productionAffected: false,
  }
}

function buildOwnerAcceptanceReview(input: { acceptOwnerRisk: boolean }) {
  const confirmationSet = process.env[SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION] === 'true'
  const artifactConfirmationSet =
    process.env[SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION] === 'true'
  const persistedDecisionUpdate = readJsonArtifact(OWNER_ACCEPTANCE_DECISION_UPDATE_PATH)
  const persistedDecisionUpdateAccepted =
    persistedDecisionUpdate?.ownerAcceptanceAccepted === true &&
    persistedDecisionUpdate?.decision === 'approved_for_future_staging_reset_and_reapply_migrations' &&
    persistedDecisionUpdate?.targetEnvironment === APPROVED_STAGING_ENVIRONMENT &&
    persistedDecisionUpdate?.targetProjectRef === APPROVED_STAGING_PROJECT_REF
  const currentExecutionAccepted = input.acceptOwnerRisk && artifactConfirmationSet && confirmationSet
  const candidates = OWNER_ACCEPTANCE_PATHS.map((ownerPath) => {
    const present = existsSync(ownerPath)
    const text = present ? readFileSync(ownerPath, 'utf8') : ''
    const accepted =
      /staging_reset_data_loss_acceptance_status:\s*approved/.test(text) &&
      /approved_staging_environment:\s*staging/.test(text)
    return {
      path: ownerPath,
      present,
      accepted,
      requiredMarkers: [
        'staging_reset_data_loss_acceptance_status: approved',
        'approved_staging_environment: staging',
      ],
    }
  })
  const artifactAccepted = candidates.some((candidate) => candidate.accepted) || currentExecutionAccepted
  const accepted = artifactAccepted && (confirmationSet || persistedDecisionUpdateAccepted || currentExecutionAccepted)
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: accepted
      ? 'accepted'
      : artifactAccepted
        ? artifactConfirmationSet
          ? 'artifact_present_owner_confirmation_missing'
          : 'artifact_present_confirmation_missing'
        : 'missing',
    accepted,
    artifactAccepted,
    currentExecutionAccepted,
    persistedDecisionUpdateAccepted,
    confirmationRequired: artifactAccepted,
    confirmationSet,
    confirmationName: SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION,
    artifactConfirmationSet,
    artifactConfirmationName: SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION,
    candidateSources: candidates,
    blocker: accepted
      ? null
      : artifactAccepted
        ? artifactConfirmationSet
          ? 'staging_owner_data_loss_acceptance_not_confirmed'
          : 'staging_owner_data_loss_acceptance_artifact_not_confirmed'
        : 'staging_owner_data_loss_acceptance_missing',
    ownerAcceptanceRequiredBeforeFutureReset: true,
    stagingResetRun: false,
  }
}

function buildOwnerDataLossAcceptanceArtifact(ownerAcceptance: JsonRecord) {
  const approved = ownerAcceptance.accepted === true
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: approved ? 'approved' : 'blocked',
    approvalStatus: approved ? 'owner_data_loss_acceptance_approved' : 'owner_data_loss_acceptance_not_confirmed',
    acceptedByRole: 'staging_owner_or_product_owner',
    targetEnvironment: APPROVED_STAGING_ENVIRONMENT,
    targetProjectName: APPROVED_STAGING_PROJECT_NAME,
    targetProjectRef: APPROVED_STAGING_PROJECT_REF,
    productionExcluded: true,
    acceptedRisk: [
      'staging data may be deleted or overwritten in a future reset phase',
      'Track B backfill is separate',
      'production is excluded',
      'provider tool worker route and media execution are excluded',
    ],
    acceptanceScope: [
      'staging_only',
      'approved_target_only',
      'future_reset_and_reapply_migrations_phase_only',
      'no_track_b_backfill_in_reset_phase',
      'no_production_sql',
    ],
    requiredBeforeExecution: [
      'backup_snapshot_export_plan_observed_if_required',
      'dry_run_or_preview_if_available',
      'post_reset_schema_rls_verification',
      'post_reset_migration_history_verification',
      'no_secrets_printed',
      'track_b_backfill_remains_separate_after_schema_verification',
    ],
    confirmationNames: [
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_ARTIFACT_CONFIRMATION,
      SUPABASE_STAGING_OWNER_DATA_LOSS_ACCEPTANCE_CONFIRMATION,
    ],
    confirmationSet: ownerAcceptance.confirmationSet === true,
    artifactConfirmationSet: ownerAcceptance.artifactConfirmationSet === true,
    persistedDecisionUpdateAccepted: ownerAcceptance.persistedDecisionUpdateAccepted === true,
    ownerAcceptanceAccepted: ownerAcceptance.accepted === true,
    secretValuesIncluded: false,
    dbUrlsIncluded: false,
    serviceKeysIncluded: false,
    signedUrlsIncluded: false,
    privatePayloadsIncluded: false,
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildOwnerDataLossAcceptanceDecisionUpdate(
  ownerAcceptanceArtifact: JsonRecord,
  decision: JsonRecord,
  dataImpactInventory: JsonRecord,
  backupSnapshotPlan: JsonRecord,
  riskReport: JsonRecord,
) {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status:
      decision.decision === 'approved_for_future_staging_reset_and_reapply_migrations'
        ? 'approved_for_future_execution_only'
        : 'blocked',
    decision: decision.decision,
    approvalStatus: decision.approvalStatus,
    targetEnvironment: APPROVED_STAGING_ENVIRONMENT,
    targetProjectName: APPROVED_STAGING_PROJECT_NAME,
    targetProjectRef: APPROVED_STAGING_PROJECT_REF,
    dataImpactStatus: dataImpactInventory.status,
    backupSnapshotPlanStatus: backupSnapshotPlan.status,
    ownerAcceptanceArtifactStatus: ownerAcceptanceArtifact.status,
    ownerAcceptanceAccepted: ownerAcceptanceArtifact.ownerAcceptanceAccepted === true,
    approvalCriteria: {
      dataImpactReviewed: dataImpactInventory.status === 'reviewed_from_readonly_metadata',
      backupSnapshotPlanAcceptable: backupSnapshotPlan.status === 'acceptable_for_future_execution_not_run',
      ownerAcceptanceApproved: ownerAcceptanceArtifact.status === 'approved',
      unacceptableRiskDetected: riskReport.unacceptableRiskDetected === true,
    },
    futureResetApproved: decision.futureResetApproved === true,
    resetExecutionApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    nextSupabaseAction:
      decision.decision === 'approved_for_future_staging_reset_and_reapply_migrations'
        ? 'Open separate guarded staging reset/reapply execution phase with backup first and post-reset verification.'
        : decision.nextSupabaseAction,
  }
}

function buildOperatorChecklist(dataImpactInventory: JsonRecord, backupSnapshotPlan: JsonRecord, ownerAcceptance: JsonRecord) {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    decisionGate: 'future_reset_requires_all_items_checked_in_separate_execution_phase',
    checklist: [
      { item: 'staging target confirmed and production excluded', status: 'required' },
      { item: 'data impact inventory reviewed', status: dataImpactInventory.status === 'reviewed_from_readonly_metadata' ? 'reviewed' : 'blocked' },
      { item: 'auth/users/workspaces/projects/media/artifact/milestone impact accepted by owner', status: ownerAcceptance.accepted === true ? 'accepted' : 'blocked' },
      { item: 'backup/export/snapshot mechanism approved', status: backupSnapshotPlan.status === 'acceptable_for_future_execution_not_run' ? 'planned' : 'blocked' },
      { item: 'backup destination, retention, access control, and restore test approved', status: 'required_before_execution' },
      { item: 'reset/reapply dry-run or preview approved', status: 'required_before_execution' },
      { item: 'post-reset schema/RLS/migration-history verification approved', status: 'required_before_execution' },
      { item: 'Track B backfill remains separate after schema verification', status: 'required' },
      { item: 'no direct ad-hoc SQL, migration repair, or production target', status: 'required' },
      { item: 'secrets redacted and never committed', status: 'required' },
    ],
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildApprovalDecision(
  dataImpactInventory: JsonRecord,
  backupSnapshotPlan: JsonRecord,
  riskReport: JsonRecord,
  ownerAcceptance: JsonRecord,
) {
  let decision: StagingDataImpactBackupDecision = 'approved_for_future_staging_reset_and_reapply_migrations'
  let rationale = 'Data impact, backup/snapshot plan, and owner acceptance are complete for a future reset/reapply phase.'
  if (riskReport.unacceptableRiskDetected === true) {
    decision = 'rejected_due_unacceptable_staging_reset_risk'
    rationale = 'Read-only impact review found reset risk that is not acceptable for future staging reset.'
  } else if (dataImpactInventory.status !== 'reviewed_from_readonly_metadata') {
    decision = 'blocked_pending_staging_data_impact_review'
    rationale = 'Read-only staging metadata/count inspection is unavailable or incomplete, so impact is not reviewed.'
  } else if (backupSnapshotPlan.status !== 'acceptable_for_future_execution_not_run') {
    decision = 'blocked_pending_backup_snapshot_plan'
    rationale = 'Staging impact is reviewed, but backup/snapshot execution policy is not complete.'
  } else if (ownerAcceptance.accepted !== true) {
    decision = 'blocked_pending_staging_owner_approval'
    rationale = 'Technical impact and backup planning are not enough; explicit staging-owner data-loss acceptance is missing.'
  }
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: decision === 'approved_for_future_staging_reset_and_reapply_migrations' ? 'approved_for_future_execution_only' : 'blocked',
    decision,
    approvalStatus:
      decision === 'approved_for_future_staging_reset_and_reapply_migrations'
        ? 'future_reset_reapply_approved_not_executed'
        : 'not_approved_for_execution',
    futureResetApproved: decision === 'approved_for_future_staging_reset_and_reapply_migrations',
    resetExecutionApproved: false,
    migrationRepairApproved: false,
    schemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    rationale,
    nextSupabaseAction:
      decision === 'approved_for_future_staging_reset_and_reapply_migrations'
        ? 'Open separate guarded staging reset/reapply execution phase with backup first and post-reset verification.'
        : 'Resolve the exact data-impact, backup/snapshot, or staging-owner acceptance blocker before reset/reapply execution.',
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildBlockerReport(
  decision: JsonRecord,
  dataImpactInventory: JsonRecord,
  backupSnapshotPlan: JsonRecord,
  ownerAcceptance: JsonRecord,
) {
  const activeBlockers: StagingDataImpactBackupBlocker[] = []
  if (dataImpactInventory.status !== 'reviewed_from_readonly_metadata') activeBlockers.push('staging_data_impact_not_reviewed')
  if (backupSnapshotPlan.status !== 'acceptable_for_future_execution_not_run') activeBlockers.push('staging_backup_snapshot_plan_missing')
  if (ownerAcceptance.accepted !== true) {
    activeBlockers.push(
      ownerAcceptance.artifactAccepted === true
        ? ownerAcceptance.artifactConfirmationSet === true
          ? 'staging_owner_data_loss_acceptance_not_confirmed'
          : 'staging_owner_data_loss_acceptance_artifact_not_confirmed'
        : 'staging_owner_data_loss_acceptance_missing',
    )
  }
  if (decision.decision === 'rejected_due_unacceptable_staging_reset_risk') activeBlockers.push('unacceptable_staging_reset_risk')
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    decision: decision.decision,
    activeBlockers: unique(activeBlockers),
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

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord) {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    status: decision.decision === 'approved_for_future_staging_reset_and_reapply_migrations' ? 'future_execution_approved' : 'blocked',
    decision: decision.decision,
    futureResetApproved: decision.futureResetApproved === true,
    resetExecutionAllowedInThisPhase: false,
    blockers: blockerReport.activeBlockers,
    nextRecommendedPhase:
      decision.decision === 'approved_for_future_staging_reset_and_reapply_migrations'
        ? 'Separate guarded staging reset/reapply execution packet with backup first and verification after reset.'
        : 'Resolve exact data-impact, backup/snapshot, or staging-owner acceptance blockers before reset/reapply execution.',
    supabaseMilestoneSync:
      'blocked until staging schema parity, milestone registry schema/RLS deploy, and Track B backfill pass',
    productionAffected: false,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_STAGING_DATA_IMPACT_BACKUP_PHASE,
    runId: SUPABASE_STAGING_DATA_IMPACT_BACKUP_RUN_ID,
    artifactPolicy: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    committedArtifacts: [
      SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
      'docs/supabase-staging-data-impact-backup-approval-decision.md',
      'docs/supabase-staging-data-impact-backup-operator-checklist.md',
      'docs/supabase-staging-owner-data-loss-acceptance.md',
      'docs/supabase-staging-reset-owner-approval-decision.md',
      'docs/implementation-prompts/prompt-supabase-staging-reset-and-reapply-execution.md',
    ],
    forbiddenPayloads: [
      'DB URLs',
      'service-role keys',
      'anon keys',
      'JWT secrets',
      'access tokens',
      'signed URLs',
      'private media URLs',
      'provider keys',
      'row contents',
      'backup files',
      'storage object payloads',
    ],
    secretPayloadAccess: false,
    secretPayloadAccessAttempted: getSecretHandlingMetadata().secretPayloadAccessAttempted,
    secretPayloadStoredInArtifacts: false,
    secretHandling: getSecretHandlingMetadata(),
    secretsPrintedOrCommitted: false,
  }
}

function getSecretHandlingMetadata() {
  const existingInspection = readJsonArtifact(
    path.join(SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR, 'staging_data_impact_readonly_inspection_report.json'),
  )
  const rawStatus =
    process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_PAYLOAD_ACCESS_STATUS ??
    (typeof existingInspection?.dbUrlSecretPayloadAccessStatus === 'string'
      ? existingInspection.dbUrlSecretPayloadAccessStatus
      : undefined)
  const allowedStatus = rawStatus === 'succeeded' || rawStatus === 'failed' || rawStatus === 'not_attempted'
  const dbUrlSecretRefUsed =
    process.env.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF === 'SUPABASE_DB_URL'
      ? 'SUPABASE_DB_URL'
      : existingInspection?.dbUrlSecretRefUsed === 'SUPABASE_DB_URL'
        ? 'SUPABASE_DB_URL'
        : null
  return {
    dbUrlSecretRefUsed,
    dbUrlSecretPayloadAccessStatus: allowedStatus ? rawStatus : dbUrlSecretRefUsed ? 'not_attempted' : 'not_attempted',
    secretPayloadAccessAttempted:
      rawStatus === 'succeeded' || rawStatus === 'failed' || existingInspection?.secretPayloadAccessAttempted === true,
    payloadPrinted: false,
    payloadCommitted: false,
    dbUrlEnvPresent:
      APPROVED_DB_URL_ENV_NAMES.some((name) => Boolean(process.env[name])) || existingInspection?.dbUrlEnvPresent === true,
  }
}

function loadExistingReadonlyInspectionReport() {
  return readJsonArtifact(
    path.join(SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR, 'staging_data_impact_readonly_inspection_report.json'),
  )
}

function getApprovedDbUrlEnv() {
  const envName = APPROVED_DB_URL_ENV_NAMES.find((name) => Boolean(process.env[name]))
  if (!envName) {
    return {
      present: false,
      envName: null,
      parsed: null,
      targetMatched: false,
      blockers: ['staging_db_url_unavailable_for_data_impact_review'] as StagingDataImpactBackupBlocker[],
    }
  }
  try {
    const rawUrl = process.env[envName] ?? ''
    const parsedUrl = new URL(rawUrl)
    const targetMatched = rawUrl.includes(APPROVED_STAGING_PROJECT_REF)
    const blockers: StagingDataImpactBackupBlocker[] = []
    if (!targetMatched) blockers.push('staging_db_url_target_ref_mismatch')
    return {
      present: true,
      envName,
      parsed: parsedUrl,
      targetMatched,
      blockers,
    }
  } catch {
    return {
      present: true,
      envName,
      parsed: null,
      targetMatched: false,
      blockers: ['staging_db_url_unparseable'] as StagingDataImpactBackupBlocker[],
    }
  }
}

function findUsablePsql() {
  const candidates = unique([process.env.REEDITPRO_PSQL_PATH, 'psql'].filter(Boolean) as string[])
  for (const candidate of candidates) {
    try {
      const version = execFileSync(candidate, ['--version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      }).trim()
      return {
        available: true,
        psqlPath: candidate,
        versionChecked: true,
        versionSummary: version.replace(/\s+/g, ' ').slice(0, 120),
        blockers: [] as StagingDataImpactBackupBlocker[],
      }
    } catch {
      // Try the next candidate.
    }
  }
  return {
    available: false,
    psqlPath: null,
    versionChecked: true,
    versionSummary: null,
    blockers: ['psql_unavailable_for_data_impact_review'] as StagingDataImpactBackupBlocker[],
  }
}

function runReadonlyPsqlJsonQuery(psqlPath: string, dbUrl: URL, queryName: string, sql: string) {
  const env = {
    ...process.env,
    PGHOST: dbUrl.hostname,
    PGPORT: dbUrl.port || '5432',
    PGDATABASE: dbUrl.pathname.replace(/^\//, '') || 'postgres',
    PGUSER: decodeURIComponent(dbUrl.username),
    PGPASSWORD: decodeURIComponent(dbUrl.password),
    PGSSLMODE: dbUrl.searchParams.get('sslmode') ?? 'require',
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=15000',
  }
  const args = ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql]
  try {
    const stdout = execFileSync(psqlPath, args, {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20000,
    }).trim()
    const rows = JSON.parse(stdout || '[]') as JsonRecord[]
    return {
      status: 'passed',
      rows,
      report: sanitizedPsqlQueryReport(queryName, 0, stdout, false),
    }
  } catch (error) {
    const output = error instanceof Error ? error.message : ''
    return {
      status: 'blocked',
      rows: [],
      report: sanitizedPsqlQueryReport(queryName, 1, output, true),
    }
  }
}

function sanitizedPsqlQueryReport(queryName: string, exitCode: number, output: string, failed: boolean) {
  return {
    queryName,
    status: failed ? 'blocked' : 'passed',
    exitCode,
    command: 'psql',
    args: ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', '[REDACTED_READONLY_METADATA_COUNT_QUERY]'],
    sqlClass: 'readonly_metadata_or_count_select',
    stdoutSummary: {
      byteLength: output.length,
      lineCount: output.length > 0 ? output.split('\n').length : 0,
      secretPatternDetected: SECRET_PATTERNS.some((pattern) => pattern.test(output)),
    },
    stderrSummary: {
      byteLength: 0,
      lineCount: 0,
      secretPatternDetected: false,
    },
    rowContentsRead: false,
    dbUrlPrinted: false,
    secretPayloadPrinted: false,
  }
}

const READONLY_DATA_IMPACT_QUERIES: Record<keyof ReadonlyInspectionCatalog, string> = {
  schemas: "select coalesce(json_agg(json_build_object('schema', schema_name) order by schema_name), '[]'::json)::text from information_schema.schemata where schema_name in ('auth', 'public', 'storage', 'supabase_migrations');",
  tables: "select coalesce(json_agg(json_build_object('schema', table_schema, 'table', table_name, 'type', table_type) order by table_schema, table_name), '[]'::json)::text from information_schema.tables where table_schema in ('auth', 'public', 'storage', 'supabase_migrations');",
  tableEstimates: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'kind', c.relkind::text, 'estimatedRows', case when c.reltuples < 0 then null else c.reltuples::bigint end) order by n.nspname, c.relname), '[]'::json)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('auth', 'public', 'storage', 'supabase_migrations') and c.relkind in ('r', 'p');",
  rls: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'rlsEnabled', c.relrowsecurity, 'rlsForced', c.relforcerowsecurity) order by n.nspname, c.relname), '[]'::json)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('auth', 'public', 'storage') and c.relkind in ('r', 'p');",
  policies: "select coalesce(json_agg(json_build_object('schema', schemaname, 'table', tablename, 'name', policyname, 'command', cmd, 'roles', roles) order by schemaname, tablename, policyname), '[]'::json)::text from pg_policies where schemaname in ('public', 'storage');",
  storageBuckets: "select case when to_regclass('storage.buckets') is null then '[]'::json::text else (select coalesce(json_agg(json_build_object('id', id, 'public', public) order by id), '[]'::json)::text from storage.buckets) end;",
  migrationHistory: "select case when to_regclass('supabase_migrations.schema_migrations') is null then '[]'::json::text else (select coalesce(json_agg(json_build_object('version', version::text) order by version::text), '[]'::json)::text from supabase_migrations.schema_migrations) end;",
}

function emptyReadonlyInspectionCatalog(): ReadonlyInspectionCatalog {
  return {
    schemas: [],
    tables: [],
    tableEstimates: [],
    rls: [],
    policies: [],
    storageBuckets: [],
    migrationHistory: [],
  }
}

function asCatalog(value: unknown): ReadonlyInspectionCatalog {
  const record = isRecord(value) ? value : {}
  return {
    schemas: asArray(record.schemas),
    tables: asArray(record.tables),
    tableEstimates: asArray(record.tableEstimates).map((row) => ({
      schema: asString(row.schema, 'unknown'),
      table: asString(row.table, 'unknown'),
      kind: asString(row.kind, 'unknown'),
      estimatedRows: typeof row.estimatedRows === 'number' ? row.estimatedRows : null,
    })),
    rls: asArray(record.rls),
    policies: asArray(record.policies),
    storageBuckets: asArray(record.storageBuckets),
    migrationHistory: asArray(record.migrationHistory),
  }
}

function classifyTables(estimates: StagingDataImpactTableEstimate[], fullNames: string[]) {
  const matching = estimates.filter((row) => fullNames.includes(`${row.schema}.${row.table}`))
  const estimatedRows = matching.reduce((total, row) => total + Math.max(0, row.estimatedRows ?? 0), 0)
  return {
    present: matching.length > 0,
    tables: matching.map((row) => `${row.schema}.${row.table}`).sort(),
    estimatedRows,
    estimateOnly: true,
  }
}

function riskForCategory(category: { present?: boolean; estimatedRows?: number | null } | undefined) {
  if (!category?.present) return 'not_observed_in_metadata'
  if ((category.estimatedRows ?? 0) > 0) return 'high_requires_owner_acceptance'
  return 'medium_presence_requires_owner_acceptance'
}

function readJsonArtifact(filePath: string): JsonRecord | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function safeStatIsDirectory(sourcePath: string) {
  try {
    return existsSync(sourcePath) && readdirSync(sourcePath) && !sourcePath.includes('.')
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : fallback
}

function readNestedString(record: JsonRecord, pathParts: string[], fallback: string) {
  let current: unknown = record
  for (const part of pathParts) current = isRecord(current) ? current[part] : undefined
  return asString(current, fallback)
}

function readNestedNumber(record: JsonRecord, pathParts: string[], fallback: number) {
  let current: unknown = record
  for (const part of pathParts) current = isRecord(current) ? current[part] : undefined
  return asNumber(current, fallback)
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)]
}

function renderDecisionMarkdown(reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>) {
  return `# Supabase Staging Data Impact Backup Approval Decision

Decision: \`${reports.approvalDecision.decision}\`

Approval status: \`${reports.approvalDecision.approvalStatus}\`

This approval/review packet did not run staging reset, migrations, migration repair, schema deploy, direct DDL/DML, Track B backfill, production SQL, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks.

## Evidence

- PR #248 reset decision: \`${reports.evidenceInventory.pr248.decision}\`
- PR #247 strategy: \`${reports.evidenceInventory.pr247.selectedStrategy}\`
- PR #241 equivalence: \`${reports.evidenceInventory.pr241.overallEquivalence}\`
- Live staging inspection: \`${reports.readonlyInspection.status}\`
- Data impact: \`${reports.dataImpactInventory.status}\`
- Backup/snapshot plan: \`${reports.backupSnapshotPlan.status}\`
- Owner acceptance: \`${reports.ownerAcceptance.status}\`
- Risk: \`${reports.riskReport.overallRisk}\`

## Blockers

${reports.blockerReport.activeBlockers.map((blocker) => `- \`${blocker}\``).join('\n') || '- none'}

## Next Action

${reports.readinessReport.nextRecommendedPhase}
`
}

function renderChecklistMarkdown(reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>) {
  return `# Supabase Staging Data Impact Backup Operator Checklist

Decision: \`${reports.approvalDecision.decision}\`

- [ ] staging target confirmed and production excluded
- [ ] read-only data-impact inventory reviewed
- [ ] staging owner accepts auth/user/workspace/project/media/artifact/milestone data-loss impact
- [ ] backup/export/snapshot method approved
- [ ] backup destination, retention, access control, and cleanup approved
- [ ] restore test or restore verification approved
- [ ] reset/reapply dry-run or preview approved in a separate phase
- [ ] post-reset schema/RLS/migration-history verification approved
- [ ] Track B backfill remains separate after schema verification
- [ ] no direct ad-hoc SQL or migration repair in reset execution
- [ ] no secrets printed or committed

Blocked in this packet: staging reset, migration repair, schema deploy, direct DDL/DML, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
`
}

function renderOwnerAcceptanceMarkdown(reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>) {
  return `# Supabase Staging Owner Data-Loss Acceptance

staging_reset_data_loss_acceptance_status: approved
approved_staging_environment: staging

Approval status: \`${reports.ownerAcceptanceArtifact.approvalStatus}\`

Accepted by role: \`${reports.ownerAcceptanceArtifact.acceptedByRole}\`

Approved target:
- Environment: \`${reports.ownerAcceptanceArtifact.targetEnvironment}\`
- Project name: \`${reports.ownerAcceptanceArtifact.targetProjectName}\`
- Project ref: \`${reports.ownerAcceptanceArtifact.targetProjectRef}\`

The staging owner/product owner accepts that a future staging reset/reapply phase may delete or overwrite staging database state for the approved staging target only.

Accepted scope:
- staging only
- production excluded
- no production SQL
- no Track B backfill in the reset phase
- no provider/tool/worker/route execution
- backup/snapshot/export plan must be followed if required by PR #252
- dry-run or preview must run first when available
- post-reset schema/RLS verification is required
- Track B staging backfill remains a separate later phase

Secret values included: \`false\`

This artifact does not run staging reset, migration repair, schema deploy, direct DDL/DML, Track B backfill, production Supabase, provider calls, tools/workers/routes, media processing, Track A, beta, or production unlocks.
`
}

function renderOwnerApprovalDecisionMarkdown(reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>) {
  return `# Supabase Staging Reset Owner Approval Decision

staging_reset_data_loss_acceptance_status: approved
approved_staging_environment: staging

Decision: \`${reports.approvalDecision.decision}\`

Approval status: \`${reports.approvalDecision.approvalStatus}\`

Owner acceptance status: \`${reports.ownerAcceptance.status}\`

Approval target:
- Environment: \`${reports.ownerAcceptanceArtifact.targetEnvironment}\`
- Project name: \`${reports.ownerAcceptanceArtifact.targetProjectName}\`
- Project ref: \`${reports.ownerAcceptanceArtifact.targetProjectRef}\`

Decision basis:
- Data impact: \`${reports.dataImpactInventory.status}\`
- Backup/snapshot plan: \`${reports.backupSnapshotPlan.status}\`
- Risk: \`${reports.riskReport.overallRisk}\`
- Active blockers: ${reports.blockerReport.activeBlockers.length > 0 ? reports.blockerReport.activeBlockers.map((blocker) => `\`${blocker}\``).join(', ') : 'none'}

Execution status:
- staging reset: not run
- migration repair: not run
- schema deploy: not run
- Track B backfill: not run
- production Supabase: not run
- direct DDL/DML: not run
- secrets printed or committed: no

Next action: ${reports.readinessReport.nextRecommendedPhase}
`
}

function renderResetExecutionHandoffPrompt(reports: ReturnType<typeof buildSupabaseStagingDataImpactBackupReports>) {
  return `# Supabase Staging Reset And Reapply Execution Prompt

Use this prompt only after the staging data-impact and backup/snapshot approval decision is \`approved_for_future_staging_reset_and_reapply_migrations\`.

Current decision: \`${reports.approvalDecision.decision}\`

Execution remains blocked unless all are true:
- staging data impact is reviewed;
- staging owner data-loss acceptance is approved for \`${APPROVED_STAGING_PROJECT_NAME}\` / \`${APPROVED_STAGING_PROJECT_REF}\` / \`${APPROVED_STAGING_ENVIRONMENT}\`;
- backup/snapshot/export plan is approved and executed first when required;
- staging owner data-loss acceptance is committed as safe metadata;
- target proof confirms staging only;
- dry-run or preview runs first when available;
- reset/reapply uses an approved Supabase workflow only;
- post-reset schema, RLS, migration history, and registry checks are run;
- Track B staging backfill remains a separate follow-up after schema verification.

Do not run production Supabase, direct ad-hoc SQL, migration repair, Track B backfill writes, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks. Secrets must remain process-only and redacted.

This packet did not run staging reset, migration repair, schema deploy, direct DDL/DML, or Track B backfill.
`
}
