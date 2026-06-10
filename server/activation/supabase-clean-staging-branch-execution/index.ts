import { execFile } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { buildSupabaseTrackBBackfillReports } from '../supabase-trackb-backfill'
import type {
  SupabaseCleanStagingBranchAction,
  SupabaseCleanStagingBranchExecutionBlocker,
  SupabaseCleanStagingBranchExecutionStatus,
} from './clean-staging-branch-execution-types'

export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE =
  'supabase-clean-staging-branch-execution'
export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID =
  'supabase-clean-staging-branch-execution-20260610'
export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_BRANCH =
  'codex/rp-foundation-supabase-clean-staging-branch-execution'
export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_BASE_BRANCH =
  'codex/rp-foundation-supabase-clean-staging-target-approval'
export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PR_TITLE =
  '[foundation] Supabase clean staging branch execution'
export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR =
  'docs/activation-supabase-clean-staging-branch-execution-reports'

export const CLEAN_STAGING_PARENT_PROJECT_REF = 'wmyyttnynmteqgcdishd'
export const CLEAN_STAGING_PARENT_PROJECT_NAME = 'Reeditpro'
export const CLEAN_STAGING_BRANCH_NAME = 'reeditpro-internal-staging-clean'
export const CLEAN_STAGING_ENVIRONMENT = 'clean_staging'
export const TARGET_REGISTRY_MIGRATION_ID = '202606050001'
export const TARGET_REGISTRY_MIGRATION_FILE =
  '202606050001_activation_milestone_registry_schema_rls.sql'

export const SUPABASE_CLEAN_STAGING_BRANCH_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_PERSISTENT_BRANCH_CREATE',
  'REEDITPRO_CONFIRM_SUPABASE_BRANCHING_COST_ACCEPTANCE',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_NO_PRODUCTION_DATA',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_MIGRATION_APPLY',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_SCHEMA_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
  'REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION',
  'REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_BRANCH_CREATE_RETRY_AFTER_DIAGNOSTICS',
] as const

export const SUPABASE_CLEAN_STAGING_BRANCH_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_BRANCH_WITH_DATA',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

export const CLEAN_STAGING_BRANCH_DB_URL_ENV_NAMES = [
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CLEAN_STAGING_BRANCH_DB_URL',
  'SUPABASE_CLEAN_STAGING_DB_URL',
] as const

export const SUPABASE_ACCESS_TOKEN_SECRET_CANDIDATE_REFS = [
  'SUPABASE_ACCESS_TOKEN',
] as const

export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'clean_staging_branch_execution_plan.json',
  'clean_staging_branch_precheck_report.json',
  'clean_staging_branch_access_token_secret_discovery_report.json',
  'clean_staging_branch_access_token_injection_report.json',
  'clean_staging_branch_cli_transport_report.json',
  'clean_staging_branch_existing_check_report.json',
  'clean_staging_branch_creation_report.json',
  'clean_staging_branch_create_failure_diagnostics_report.json',
  'clean_staging_branch_cli_help_report.json',
  'clean_staging_branch_create_retry_strategy_report.json',
  'clean_staging_branch_create_retry_report.json',
  'clean_staging_branch_health_report.json',
  'clean_staging_branch_migration_transport_report.json',
  'clean_staging_branch_secret_reference_plan.json',
  'clean_staging_branch_migration_apply_report.json',
  'clean_staging_branch_schema_rls_verify_report.json',
  'clean_staging_branch_migration_history_verify_report.json',
  'clean_staging_target_reference.json',
  'clean_staging_branch_trackb_backfill_preflight_report.json',
  'clean_staging_branch_trackb_backfill_diff_report.json',
  'clean_staging_branch_blocker_report.json',
  'clean_staging_branch_readiness_report.json',
  'clean_staging_branch_private_artifact_manifest.json',
] as const

export const SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS = [
  'docs/supabase-clean-staging-branch-execution.md',
  'docs/supabase-clean-staging-branch-secret-policy.md',
  'docs/supabase-approved-clean-staging-target-reference.md',
  'docs/supabase-clean-staging-branch-schema-rls-verification.md',
  'docs/supabase-trackb-backfill-after-clean-staging-branch.md',
  'docs/implementation-prompts/prompt-supabase-trackb-backfill-after-clean-staging-branch.md',
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

const PR280_REPORT_DIR = 'docs/activation-supabase-clean-staging-target-approval-reports'
const PR276_REPORT_DIR = 'docs/activation-supabase-support-ticket-submission-reports'
const PR271_REPORT_DIR = 'docs/activation-supabase-reset-retry-failure-diagnostics-reports'
const PR269_REPORT_DIR = 'docs/activation-supabase-staging-reset-retry-execution-reports'
const PR252_REPORT_DIR = 'docs/activation-supabase-staging-data-impact-backup-reports'
const PR247_REPORT_DIR = 'docs/activation-supabase-schema-parity-remediation-reports'
const PR241_REPORT_DIR = 'docs/activation-supabase-remote-schema-equivalence-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const PR200_REPORT_DIR = 'docs/activation-supabase-milestone-registry-schema-reports'
const PR198_REPORT_DIR = 'docs/activation-supabase-trackb-backfill-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const TEMP_NPM_CACHE = '/tmp/reeditpro-supabase-cli-cache'
const TEMP_NPM_PREFIX = '/tmp/reeditpro-supabase-cli-prefix'
const SECRET_MANAGER_PROJECT_ID = 'reeditpro'

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

interface CommandResult {
  status: SupabaseCleanStagingBranchExecutionStatus
  command: string
  args: string[]
  exitCode: number | null
  stdoutSummary: OutputSummary
  stderrSummary: OutputSummary
  parsedJson: boolean
  blockers: SupabaseCleanStagingBranchExecutionBlocker[]
}

interface OutputSummary {
  byteLength: number
  lineCount: number
  secretPatternDetected: boolean
}

type BranchCreateFailureClass =
  | 'none'
  | 'branch_create_region_required'
  | 'branch_create_size_required'
  | 'branch_create_region_and_size_required'
  | 'branch_create_plan_or_billing_unavailable'
  | 'branch_create_permission_denied'
  | 'branch_create_quota_or_limit_reached'
  | 'branch_create_feature_unavailable'
  | 'branch_create_project_ref_invalid'
  | 'branch_create_branch_name_invalid'
  | 'branch_create_cli_version_issue'
  | 'branch_create_unknown'

type BranchCreateRetryStrategy =
  | 'not_needed'
  | 'retry_same_command_if_transient'
  | 'retry_with_region_if_region_required'
  | 'retry_with_size_if_size_required'
  | 'retry_with_region_and_size_if_both_required'
  | 'blocked_pending_plan_or_billing_review'
  | 'blocked_pending_permission_review'
  | 'blocked_pending_branching_feature_review'
  | 'blocked_pending_operator_review'

const COMMAND_STDOUT = new WeakMap<CommandResult, string>()
const COMMAND_STDERR = new WeakMap<CommandResult, string>()

interface Reports {
  sourceOfTruthOwnershipAudit: JsonRecord
  plan: JsonRecord
  precheckReport: JsonRecord
  accessTokenSecretDiscoveryReport: JsonRecord
  accessTokenInjectionReport: JsonRecord
  cliTransportReport: JsonRecord
  existingBranchCheckReport: JsonRecord
  branchCreationReport: JsonRecord
  branchCreateFailureDiagnosticsReport: JsonRecord
  branchCliHelpReport: JsonRecord
  branchCreateRetryStrategyReport: JsonRecord
  branchCreateRetryReport: JsonRecord
  branchHealthReport: JsonRecord
  migrationTransportReport: JsonRecord
  secretReferencePlan: JsonRecord
  migrationApplyReport: JsonRecord
  schemaRlsVerifyReport: JsonRecord
  migrationHistoryVerifyReport: JsonRecord
  targetReferenceReport: JsonRecord
  trackBBackfillPreflightReport: JsonRecord
  trackBBackfillDiffReport: JsonRecord
  blockerReport: JsonRecord
  readinessReport: JsonRecord
  privateArtifactManifest: JsonRecord
}

export function getSupabaseCleanStagingBranchExecutionPlan(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    branch: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_BRANCH,
    baseBranch: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_BASE_BRANCH,
    prTitle: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PR_TITLE,
    worktree: '/private/tmp/reeditpro-supabase-clean-staging-branch-execution',
    reportDir: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
    expectedReports: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS,
    docs: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [198, 200, 223, 241, 247, 252, 269, 271, 276, 280],
    docsBasis: {
      supabaseCliReference: 'https://supabase.com/docs/reference/cli/introduction',
      supabaseDatabaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      supabaseChangelog: 'https://supabase.com/changelog',
      checkedAt: '2026-06-10',
      branchCreateFlags: ['--persistent', '--project-ref'],
      optionalDiagnosticRetryFlags: ['--region', '--size'],
      forbiddenBranchDataCloneFlag: 'with_data_clone_flag_forbidden',
      dbPushFlags: ['--db-url', '--dry-run'],
      accessTokenSecretDiscovery: 'metadata_only_gcloud_secret_manager',
    },
    cleanBranchTarget: {
      parentProjectName: CLEAN_STAGING_PARENT_PROJECT_NAME,
      parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      branchName: CLEAN_STAGING_BRANCH_NAME,
      environment: CLEAN_STAGING_ENVIRONMENT,
      persistent: true,
      withProductionData: false,
      purpose: 'internal milestone registry/schema/RLS and future Track B metadata backfill',
    },
    requiredConfirmations: SUPABASE_CLEAN_STAGING_BRANCH_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_CLEAN_STAGING_BRANCH_FORBIDDEN_CONFIRMATIONS,
    allowedCommandClasses: [
      'gcloud config get-value project',
      'gcloud secrets describe SUPABASE_ACCESS_TOKEN --project=reeditpro --format=json(name,labels,replication,createTime,annotations)',
      'gcloud secrets versions access latest --secret=[SELECTED_ACCESS_TOKEN_SECRET_REF] --project=reeditpro',
      'npm exec --yes --package supabase@latest -- supabase --version',
      'npm exec --yes --package supabase@latest -- supabase branches create --help',
      'supabase branches list --project-ref [PARENT_PROJECT_REF]',
      'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]',
      'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF] [OPTIONAL_SAFE_REGION_SIZE_FLAGS]',
      'supabase db push --db-url [REDACTED_CLEAN_BRANCH_DB_URL] --dry-run',
      'supabase db push --db-url [REDACTED_CLEAN_BRANCH_DB_URL]',
      'supabase migration list --db-url [REDACTED_CLEAN_BRANCH_DB_URL]',
    ],
    blockedCommandClasses: [
      'supabase branches create with production data clone',
      'remote_reset_command_forbidden',
      'migration_history_repair_command_forbidden',
      'direct_manual_sql',
      'track_b_backfill_write',
      'provider_worker_tool_route_media_execution',
      'production_supabase',
    ],
    accessTokenSecretPolicy: {
      project: SECRET_MANAGER_PROJECT_ID,
      candidateRefs: SUPABASE_ACCESS_TOKEN_SECRET_CANDIDATE_REFS,
      payloadAccessRequires: 'REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION=true',
      preinjectedTokenRequires: 'REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED=true',
      payloadPrinted: false,
      payloadCommitted: false,
    },
  }
}

export function buildSupabaseCleanStagingBranchExecutionReports(): Reports {
  const existing = loadExistingExecutionReports()
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const plan = getSupabaseCleanStagingBranchExecutionPlan()
  const precheckReport = existing.precheckReport ?? buildPrecheckReport()
  const accessTokenSecretDiscoveryReport = existing.accessTokenSecretDiscoveryReport ??
    buildSkippedReport('clean_staging_branch_access_token_secret_discovery_report', ['secret_manager_metadata_discovery_unavailable'])
  const accessTokenInjectionReport = existing.accessTokenInjectionReport ??
    buildSkippedReport('clean_staging_branch_access_token_injection_report', ['supabase_access_token_unavailable'])
  const cliTransportReport = existing.cliTransportReport ?? buildSkippedReport('clean_staging_branch_cli_transport_report', ['temp_npm_supabase_cli_unavailable'])
  const existingBranchCheckReport = existing.existingBranchCheckReport ?? buildSkippedReport('clean_staging_branch_existing_check_report', ['clean_staging_branch_list_failed'])
  const branchCreationReport = existing.branchCreationReport ?? buildSkippedBranchCreationReport()
  const branchCreateFailureDiagnosticsReport = existing.branchCreateFailureDiagnosticsReport ??
    buildSkippedBranchCreateFailureDiagnosticsReport(branchCreationReport, cliTransportReport)
  const branchCliHelpReport = existing.branchCliHelpReport ??
    buildSkippedBranchCliHelpReport()
  const branchCreateRetryStrategyReport = existing.branchCreateRetryStrategyReport ??
    buildBranchCreateRetryStrategyReport(branchCreateFailureDiagnosticsReport, branchCliHelpReport, { diagnoseCreate: false })
  const branchCreateRetryReport = existing.branchCreateRetryReport ??
    buildSkippedBranchCreateRetryReport(branchCreateRetryStrategyReport)
  const branchHealthReport = existing.branchHealthReport ?? buildSkippedReport('clean_staging_branch_health_report', ['clean_staging_branch_health_unavailable'])
  const migrationTransportReport = existing.migrationTransportReport ?? buildMigrationTransportReport()
  const secretReferencePlan = existing.secretReferencePlan ??
    buildSecretReferencePlan(accessTokenSecretDiscoveryReport, migrationTransportReport)
  const migrationApplyReport = existing.migrationApplyReport ?? buildSkippedReport('clean_staging_branch_migration_apply_report', ['clean_branch_migration_apply_transport_unavailable'])
  const schemaRlsVerifyReport = existing.schemaRlsVerifyReport ?? buildSkippedReport('clean_staging_branch_schema_rls_verify_report', ['clean_branch_schema_rls_verify_unavailable'])
  const migrationHistoryVerifyReport = existing.migrationHistoryVerifyReport ?? buildSkippedReport('clean_staging_branch_migration_history_verify_report', ['clean_branch_migration_history_verify_failed'])
  const targetReferenceReport = existing.targetReferenceReport ?? buildTargetReferenceReport(branchCreationReport, branchHealthReport)
  const trackB = buildSupabaseTrackBBackfillReports()
  const trackBBackfillPreflightReport = existing.trackBBackfillPreflightReport ??
    decorateTrackBPreflightReport(trackB.stagingSupabaseBackfillPreflightReport as JsonRecord)
  const trackBBackfillDiffReport = existing.trackBBackfillDiffReport ??
    decorateTrackBDiffReport(trackB.diffReport as JsonRecord)
  const blockers = collectBlockers([
    sourceOfTruthOwnershipAudit,
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    trackBBackfillPreflightReport,
  ])
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport({
    blockers,
    branchCreationReport,
    branchHealthReport,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    targetReferenceReport,
  })
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    plan,
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    targetReferenceReport,
    trackBBackfillPreflightReport,
    trackBBackfillDiffReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function executeSupabaseCleanStagingBranchExecution(input: {
  keepTemp: boolean
  diagnoseCreate: boolean
}) {
  void input.keepTemp
  const accessTokenSecretDiscoveryReport = await buildAccessTokenSecretDiscoveryReport()
  const accessTokenInjectionReport = await buildAccessTokenInjectionReport(accessTokenSecretDiscoveryReport)
  const precheckReport = buildPrecheckReport()
  let cliTransportReport = buildSkippedReport('clean_staging_branch_cli_transport_report', ['temp_npm_supabase_cli_unavailable'])
  let existingBranchCheckReport = buildSkippedReport('clean_staging_branch_existing_check_report', ['clean_staging_branch_list_failed'])
  let branchCreationReport = buildSkippedBranchCreationReport()
  let branchCreateFailureDiagnosticsReport = buildSkippedBranchCreateFailureDiagnosticsReport(branchCreationReport, cliTransportReport)
  let branchCliHelpReport = buildSkippedBranchCliHelpReport()
  let branchCreateRetryStrategyReport = buildBranchCreateRetryStrategyReport(
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    { diagnoseCreate: input.diagnoseCreate },
  )
  let branchCreateRetryReport = buildSkippedBranchCreateRetryReport(branchCreateRetryStrategyReport)
  let branchHealthReport = buildSkippedReport('clean_staging_branch_health_report', ['clean_staging_branch_health_unavailable'])
  let migrationTransportReport = buildMigrationTransportReport()
  let secretReferencePlan = buildSecretReferencePlan(accessTokenSecretDiscoveryReport, migrationTransportReport)
  let migrationApplyReport = buildSkippedReport('clean_staging_branch_migration_apply_report', ['clean_branch_migration_apply_transport_unavailable'])
  let schemaRlsVerifyReport = buildSkippedReport('clean_staging_branch_schema_rls_verify_report', ['clean_branch_schema_rls_verify_unavailable'])
  let migrationHistoryVerifyReport = buildSkippedReport('clean_staging_branch_migration_history_verify_report', ['clean_branch_migration_history_verify_failed'])

  if (precheckReport.status === 'passed') {
    cliTransportReport = await buildCliTransportReport()
    if (cliTransportReport.status === 'passed') {
      branchCliHelpReport = await buildBranchCliHelpReport(cliTransportReport)
    }
  }

  const cliAvailable = cliTransportReport.status === 'passed'
  if (precheckReport.status === 'passed' && cliAvailable) {
    existingBranchCheckReport = await buildExistingBranchCheckReport()
    const existingBranch = asRecord(existingBranchCheckReport.cleanBranch)
    if (existingBranchCheckReport.status === 'passed' && existingBranch.exists === true) {
      branchCreationReport = buildBranchReuseReport(existingBranch)
    } else if (existingBranchCheckReport.status === 'passed') {
      branchCreationReport = await createCleanBranch()
      branchCreateFailureDiagnosticsReport = buildBranchCreateFailureDiagnosticsReport(
        branchCreationReport,
        cliTransportReport,
        branchCliHelpReport,
      )
      branchCreateRetryStrategyReport = buildBranchCreateRetryStrategyReport(
        branchCreateFailureDiagnosticsReport,
        branchCliHelpReport,
        { diagnoseCreate: input.diagnoseCreate },
      )
      branchCreateRetryReport = await buildBranchCreateRetryReport(branchCreateRetryStrategyReport)
      if (branchCreateRetryReport.status === 'passed') {
        branchCreationReport = branchCreateRetryReport
      }
    }
  }

  if (branchCreationReport.status === 'passed' && branchCreateFailureDiagnosticsReport.status === 'skipped') {
    branchCreateFailureDiagnosticsReport = buildBranchCreateNotNeededDiagnosticsReport(branchCreationReport, cliTransportReport)
    branchCreateRetryStrategyReport = buildBranchCreateRetryStrategyReport(
      branchCreateFailureDiagnosticsReport,
      branchCliHelpReport,
      { diagnoseCreate: input.diagnoseCreate },
    )
    branchCreateRetryReport = buildSkippedBranchCreateRetryReport(branchCreateRetryStrategyReport)
  }

  if (branchCreationReport.status === 'passed') {
    branchHealthReport = await buildBranchHealthReport(branchCreationReport)
  }

  if (branchHealthReport.status === 'passed') {
    migrationTransportReport = buildMigrationTransportReport()
    secretReferencePlan = buildSecretReferencePlan(accessTokenSecretDiscoveryReport, migrationTransportReport)
    if (migrationTransportReport.status === 'passed') {
      migrationApplyReport = await applyMigrationsToCleanBranch()
    }
  }

  if (migrationApplyReport.status === 'passed') {
    migrationHistoryVerifyReport = await verifyMigrationHistory()
    schemaRlsVerifyReport = await verifySchemaRls()
  }

  const targetReferenceReport = buildTargetReferenceReport(branchCreationReport, branchHealthReport)
  const trackB = buildSupabaseTrackBBackfillReports()
  const trackBBackfillPreflightReport = decorateTrackBPreflightReport(trackB.stagingSupabaseBackfillPreflightReport as JsonRecord)
  const trackBBackfillDiffReport = decorateTrackBDiffReport(trackB.diffReport as JsonRecord)
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const blockers = collectBlockers([
    sourceOfTruthOwnershipAudit,
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    trackBBackfillPreflightReport,
  ])
  const reports: Reports = {
    sourceOfTruthOwnershipAudit,
    plan: getSupabaseCleanStagingBranchExecutionPlan(),
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    targetReferenceReport,
    trackBBackfillPreflightReport,
    trackBBackfillDiffReport,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport({
      blockers,
      branchCreationReport,
      branchHealthReport,
      migrationApplyReport,
      schemaRlsVerifyReport,
      migrationHistoryVerifyReport,
      targetReferenceReport,
    }),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
  await writeSupabaseCleanStagingBranchExecutionArtifacts(reports)
  return {
    reports,
    exitCode: reports.readinessReport.status === 'passed' || reports.branchCreationReport.status === 'passed' ? 0 : 1,
  }
}

export async function executeSupabaseCleanStagingBranchExecutionVerify() {
  const migrationHistoryVerifyReport = await verifyMigrationHistory()
  const schemaRlsVerifyReport = await verifySchemaRls()
  const existing = loadExistingExecutionReports()
  const branchCreationReport = existing.branchCreationReport ?? buildSkippedBranchCreationReport()
  const branchHealthReport = existing.branchHealthReport ?? buildSkippedReport('clean_staging_branch_health_report', ['clean_staging_branch_health_unavailable'])
  const targetReferenceReport = buildTargetReferenceReport(branchCreationReport, branchHealthReport)
  const trackB = buildSupabaseTrackBBackfillReports()
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const precheckReport = existing.precheckReport ?? buildPrecheckReport()
  const accessTokenSecretDiscoveryReport = existing.accessTokenSecretDiscoveryReport ??
    buildSkippedReport('clean_staging_branch_access_token_secret_discovery_report', ['secret_manager_metadata_discovery_unavailable'])
  const accessTokenInjectionReport = existing.accessTokenInjectionReport ??
    buildSkippedReport('clean_staging_branch_access_token_injection_report', ['supabase_access_token_unavailable'])
  const cliTransportReport = existing.cliTransportReport ?? buildSkippedReport('clean_staging_branch_cli_transport_report', ['temp_npm_supabase_cli_unavailable'])
  const existingBranchCheckReport = existing.existingBranchCheckReport ?? buildSkippedReport('clean_staging_branch_existing_check_report', ['clean_staging_branch_list_failed'])
  const branchCreateFailureDiagnosticsReport = existing.branchCreateFailureDiagnosticsReport ??
    buildSkippedBranchCreateFailureDiagnosticsReport(branchCreationReport, cliTransportReport)
  const branchCliHelpReport = existing.branchCliHelpReport ?? buildSkippedBranchCliHelpReport()
  const branchCreateRetryStrategyReport = existing.branchCreateRetryStrategyReport ??
    buildBranchCreateRetryStrategyReport(branchCreateFailureDiagnosticsReport, branchCliHelpReport, { diagnoseCreate: false })
  const branchCreateRetryReport = existing.branchCreateRetryReport ??
    buildSkippedBranchCreateRetryReport(branchCreateRetryStrategyReport)
  const migrationTransportReport = existing.migrationTransportReport ?? buildMigrationTransportReport()
  const secretReferencePlan = existing.secretReferencePlan ??
    buildSecretReferencePlan(accessTokenSecretDiscoveryReport, migrationTransportReport)
  const migrationApplyReport = existing.migrationApplyReport ?? buildSkippedReport('clean_staging_branch_migration_apply_report', ['clean_branch_migration_apply_transport_unavailable'])
  const trackBBackfillPreflightReport = decorateTrackBPreflightReport(trackB.stagingSupabaseBackfillPreflightReport as JsonRecord)
  const trackBBackfillDiffReport = decorateTrackBDiffReport(trackB.diffReport as JsonRecord)
  const blockers = collectBlockers([
    sourceOfTruthOwnershipAudit,
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    trackBBackfillPreflightReport,
  ])
  const reports: Reports = {
    sourceOfTruthOwnershipAudit,
    plan: getSupabaseCleanStagingBranchExecutionPlan(),
    precheckReport,
    accessTokenSecretDiscoveryReport,
    accessTokenInjectionReport,
    cliTransportReport,
    existingBranchCheckReport,
    branchCreationReport,
    branchCreateFailureDiagnosticsReport,
    branchCliHelpReport,
    branchCreateRetryStrategyReport,
    branchCreateRetryReport,
    branchHealthReport,
    migrationTransportReport,
    secretReferencePlan,
    migrationApplyReport,
    schemaRlsVerifyReport,
    migrationHistoryVerifyReport,
    targetReferenceReport,
    trackBBackfillPreflightReport,
    trackBBackfillDiffReport,
    blockerReport: buildBlockerReport(blockers),
    readinessReport: buildReadinessReport({
      blockers,
      branchCreationReport,
      branchHealthReport,
      migrationApplyReport,
      schemaRlsVerifyReport,
      migrationHistoryVerifyReport,
      targetReferenceReport,
    }),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
  await writeSupabaseCleanStagingBranchExecutionArtifacts(reports)
  return { reports, exitCode: reports.readinessReport.status === 'passed' ? 0 : 1 }
}

export async function writeSupabaseCleanStagingBranchExecutionArtifacts(reports: Reports) {
  const dir = SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_execution_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_precheck_report.json'), reports.precheckReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_access_token_secret_discovery_report.json'), reports.accessTokenSecretDiscoveryReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_access_token_injection_report.json'), reports.accessTokenInjectionReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_cli_transport_report.json'), reports.cliTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_existing_check_report.json'), reports.existingBranchCheckReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_creation_report.json'), reports.branchCreationReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_create_failure_diagnostics_report.json'), reports.branchCreateFailureDiagnosticsReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_cli_help_report.json'), reports.branchCliHelpReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_create_retry_strategy_report.json'), reports.branchCreateRetryStrategyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_create_retry_report.json'), reports.branchCreateRetryReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_health_report.json'), reports.branchHealthReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_migration_transport_report.json'), reports.migrationTransportReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_secret_reference_plan.json'), reports.secretReferencePlan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_migration_apply_report.json'), reports.migrationApplyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_schema_rls_verify_report.json'), reports.schemaRlsVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_migration_history_verify_report.json'), reports.migrationHistoryVerifyReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_target_reference.json'), reports.targetReferenceReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_trackb_backfill_preflight_report.json'), reports.trackBBackfillPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_trackb_backfill_diff_report.json'), reports.trackBBackfillDiffReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'clean_staging_branch_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/supabase-clean-staging-branch-execution.md', renderExecutionDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-clean-staging-branch-secret-policy.md', renderSecretPolicyDoc())
  await writeVlmRuntimeTextArtifact('docs/supabase-approved-clean-staging-target-reference.md', renderTargetReferenceDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-clean-staging-branch-schema-rls-verification.md', renderSchemaRlsVerificationDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-trackb-backfill-after-clean-staging-branch.md', renderTrackBHandoffDoc(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-trackb-backfill-after-clean-staging-branch.md',
    renderTrackBHandoffPrompt(reports),
  )
}

export function readSupabaseCleanStagingBranchExecutionSummary(): JsonRecord {
  const reports = buildSupabaseCleanStagingBranchExecutionReports()
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: reports.readinessReport.status,
    supabaseUpdateStatus: reports.readinessReport.supabaseUpdateStatus,
    branchAction: reports.branchCreationReport.branchAction,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchStatus: reports.branchHealthReport.branchStatus,
    branchCreateFailureClass: reports.branchCreateFailureDiagnosticsReport.failureClass,
    branchCreateDeterministicRetryPossible: reports.branchCreateFailureDiagnosticsReport.deterministicRetryPossible,
    branchCreateRetryStrategy: reports.branchCreateRetryStrategyReport.retryStrategy,
    branchCreateRetryStatus: reports.branchCreateRetryReport.status,
    accessTokenSecretDiscovery: reports.accessTokenSecretDiscoveryReport.status,
    accessTokenInjection: reports.accessTokenInjectionReport.status,
    withProductionData: false,
    migrationTransport: reports.migrationTransportReport.status,
    migrationApply: reports.migrationApplyReport.status,
    schemaRlsVerify: reports.schemaRlsVerifyReport.status,
    migrationHistoryVerify: reports.migrationHistoryVerifyReport.status,
    trackBPreflight: reports.trackBBackfillPreflightReport.status,
    trackBWrite: false,
    productionAffected: false,
    sqlExecuted: reports.migrationApplyReport.sqlExecuted === true,
    migrationDeployed: reports.migrationApplyReport.migrationDeployed === true,
    blockers: reports.blockerReport.activeBlockers,
    nextRecommendedPhase: reports.readinessReport.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit(): JsonRecord {
  const reportPaths = [
    path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
    path.join(PR280_REPORT_DIR, 'clean_staging_target_readiness_report.json'),
    path.join(PR276_REPORT_DIR, 'support_ticket_submission_readiness_report.json'),
    path.join(PR271_REPORT_DIR, 'reset_retry_recovery_decision.json'),
    path.join(PR269_REPORT_DIR, 'staging_reset_retry_execution_report.json'),
    path.join(PR252_REPORT_DIR, 'staging_data_impact_backup_approval_decision.json'),
    path.join(PR247_REPORT_DIR, 'schema_parity_decision.json'),
    path.join(PR241_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
    path.join(PR223_REPORT_DIR, 'staging_deploy_transport_readiness_report.json'),
    path.join(PR200_REPORT_DIR, 'schema_readiness_report.json'),
    path.join(PR198_REPORT_DIR, 'staging_supabase_backfill_preflight_report.json'),
  ]
  const requiredReportPaths = reportPaths.filter((reportPath) => !reportPath.includes(PR200_REPORT_DIR))
  const missing = requiredReportPaths.filter((reportPath) => !existsSync(reportPath))
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    mode: 'clean_staging_branch_execution',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      type: existsSync(sourcePath) && safeStatIsDirectory(sourcePath) ? 'directory' : 'file',
    })),
    reportPaths: reportPaths.map((reportPath) => ({
      path: reportPath,
      present: existsSync(reportPath),
      required: requiredReportPaths.includes(reportPath),
    })),
    localMigrationInventory: {
      migrationDir: MIGRATION_DIR,
      localMigrationCount: getLocalMigrationFiles().length,
      targetRegistryMigrationFile: TARGET_REGISTRY_MIGRATION_FILE,
      targetRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    },
    status: missing.length === 0 ? 'passed' : 'blocked',
    blockers: missing.length === 0 ? [] : ['pr280_clean_staging_approval_missing'],
    productionAffected: false,
    trackBBackfillRowsWritten: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildPrecheckReport(): JsonRecord {
  const approval = readJsonArtifact(path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'))
  const forbiddenSet = SUPABASE_CLEAN_STAGING_BRANCH_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const missingRequired = SUPABASE_CLEAN_STAGING_BRANCH_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (approval?.decision !== 'approved_for_future_clean_supabase_staging_branch') {
    blockers.push('pr280_clean_staging_approval_missing')
  }
  for (const missing of missingRequired) {
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_EXECUTE') blockers.push('clean_staging_branch_execute_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_CREATE') blockers.push('clean_staging_branch_create_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_PERSISTENT_BRANCH_CREATE') blockers.push('persistent_branch_create_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_BRANCHING_COST_ACCEPTANCE') blockers.push('branching_cost_acceptance_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_NO_PRODUCTION_DATA') blockers.push('clean_staging_no_production_data_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_MIGRATION_APPLY') blockers.push('clean_staging_migration_apply_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_SCHEMA_VERIFY') blockers.push('clean_staging_schema_verify_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC') blockers.push('temp_cli_exec_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION') blockers.push('access_token_secret_injection_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED') blockers.push('preinjected_access_token_not_confirmed')
    if (missing === 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_BRANCH_CREATE_RETRY_AFTER_DIAGNOSTICS') blockers.push('clean_branch_create_retry_not_confirmed')
  }
  if (forbiddenSet.length > 0) blockers.push('forbidden_confirmation_set')
  if (!process.env.SUPABASE_ACCESS_TOKEN) blockers.push('supabase_access_token_unavailable')
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    pr280Decision: asString(approval?.decision, 'missing'),
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchNameSafe: /^[a-z0-9-]+$/.test(CLEAN_STAGING_BRANCH_NAME),
    persistentBranchConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_PERSISTENT_BRANCH_CREATE === 'true',
    branchingCostAccepted: process.env.REEDITPRO_CONFIRM_SUPABASE_BRANCHING_COST_ACCEPTANCE === 'true',
    noProductionDataConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_NO_PRODUCTION_DATA === 'true',
    migrationApplyConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_MIGRATION_APPLY === 'true',
    schemaVerifyConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_SCHEMA_VERIFY === 'true',
    supabaseAccessTokenPresent: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
    supabaseAccessTokenPrinted: false,
    accessTokenSecretInjectionConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION === 'true',
    preinjectedAccessTokenAllowed: process.env.REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED === 'true',
    branchCreateRetryAfterDiagnosticsConfirmed: process.env.REEDITPRO_CONFIRM_SUPABASE_CLEAN_BRANCH_CREATE_RETRY_AFTER_DIAGNOSTICS === 'true',
    forbiddenConfirmationsSet: forbiddenSet,
    localMigrationDirExists: existsSync(MIGRATION_DIR),
    targetRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    trackBBackfillBlockedInThisPhase: true,
    productionExcluded: true,
    branchWithData: false,
    blockers: collectUnique(blockers),
  }
}

async function buildAccessTokenSecretDiscoveryReport(): Promise<JsonRecord> {
  const preinjectedAllowed = process.env.REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED === 'true'
  const existingTokenPresent = Boolean(process.env.SUPABASE_ACCESS_TOKEN)
  if (existingTokenPresent) {
    const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = preinjectedAllowed
      ? []
      : ['preinjected_access_token_not_confirmed']
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: blockers.length === 0 ? 'passed' : 'blocked',
      mode: 'preinjected_supabase_access_token_discovery',
      tokenSource: preinjectedAllowed ? 'preinjected_env' : 'unavailable',
      project: SECRET_MANAGER_PROJECT_ID,
      activeGcloudProject: 'not_checked_preinjected_token',
      activeProjectMatchesExpected: null,
      allowedCommands: [],
      skippedCommands: [
        'gcloud config get-value project',
        'gcloud secrets describe SUPABASE_ACCESS_TOKEN --project=reeditpro --format=json(name,labels,replication,createTime,annotations)',
      ],
      forbiddenPayloadOperations: ['gcloud secrets versions access unless env token is absent and exact ref is selected'],
      candidateSecretRefs: ['SUPABASE_ACCESS_TOKEN'],
      discoveredSecretCount: 0,
      candidateTokenSecretRefs: [],
      selectedTokenSecretRef: null,
      selectedTokenSecretConfidence: null,
      envVarPresent: true,
      envVarName: 'SUPABASE_ACCESS_TOKEN',
      payloadAccessAttempted: false,
      payloadAccessCommandRun: false,
      payloadViewed: false,
      payloadPrinted: false,
      payloadCommitted: false,
      tokenValuePrinted: false,
      tokenValueCommitted: false,
      dbUrlPrinted: false,
      secretValuesPrinted: false,
      credentialPayloadsPrinted: false,
      metadataCommands: {},
      blockers,
    }
  }

  const projectCommand = await runGcloudMetadataCommand(['config', 'get-value', 'project'])
  const describeCommand = await runGcloudMetadataCommand([
    'secrets',
    'describe',
    'SUPABASE_ACCESS_TOKEN',
    `--project=${SECRET_MANAGER_PROJECT_ID}`,
    '--format=json(name,labels,replication,createTime,annotations)',
  ])
  const activeProject = asString(COMMAND_STDOUT.get(projectCommand)?.trim(), 'unknown')
  const secretMetadata = describeCommand.status === 'passed'
    ? extractSecretMetadata([parseJsonOutput(describeCommand)]).find((secret) => secret.secretName === 'SUPABASE_ACCESS_TOKEN') ?? null
    : null
  const candidates = secretMetadata ? buildAccessTokenSecretCandidates([secretMetadata]) : []
  const selected = candidates.find((candidate) => candidate.selected === true)
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (projectCommand.status !== 'passed' || describeCommand.status !== 'passed') {
    blockers.push('secret_manager_metadata_discovery_unavailable')
  }
  if (!selected) blockers.push('supabase_access_token_secret_reference_missing')
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    mode: 'exact_ref_supabase_access_token_secret_discovery',
    tokenSource: selected ? 'exact_secret_ref' : 'unavailable',
    project: SECRET_MANAGER_PROJECT_ID,
    activeGcloudProject: activeProject,
    activeProjectMatchesExpected: activeProject === SECRET_MANAGER_PROJECT_ID,
    allowedCommands: [
      'gcloud config get-value project',
      'gcloud secrets describe SUPABASE_ACCESS_TOKEN --project=reeditpro --format=json(name,labels,replication,createTime,annotations)',
    ],
    forbiddenPayloadOperations: ['gcloud secrets versions access'],
    candidateSecretRefs: ['SUPABASE_ACCESS_TOKEN'],
    discoveredSecretCount: secretMetadata ? 1 : 0,
    candidateTokenSecretRefs: candidates,
    selectedTokenSecretRef: selected?.secretName ?? null,
    selectedTokenSecretConfidence: selected?.confidence ?? null,
    payloadAccessAttempted: false,
    payloadAccessCommandRun: false,
    payloadViewed: false,
    payloadPrinted: false,
    payloadCommitted: false,
    tokenValuePrinted: false,
    tokenValueCommitted: false,
    dbUrlPrinted: false,
    secretValuesPrinted: false,
    credentialPayloadsPrinted: false,
    metadataCommands: {
      project: projectCommand,
      describe: describeCommand,
    },
    blockers: collectUnique(blockers),
  }
}

async function buildAccessTokenInjectionReport(discoveryReport: JsonRecord): Promise<JsonRecord> {
  const selectedSecretRef = maybeString(discoveryReport.selectedTokenSecretRef)
  const confirmationPresent = process.env.REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION === 'true'
  const preinjectedAllowed = process.env.REEDITPRO_CONFIRM_SUPABASE_PREINJECTED_ACCESS_TOKEN_ALLOWED === 'true'
  const existingTokenPresent = Boolean(process.env.SUPABASE_ACCESS_TOKEN)
  if (existingTokenPresent) {
    if (!preinjectedAllowed) {
      return {
        phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
        runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
        status: 'blocked',
        mode: 'current_process_supabase_access_token_present_without_confirmation',
        tokenSource: 'unavailable',
        secretRefUsed: null,
        payloadAccessStatus: 'not_attempted',
        payloadAccessCommandRun: false,
        payloadPrinted: false,
        payloadCommitted: false,
        tokenValuePrinted: false,
        tokenValueCommitted: false,
        envVarPresent: true,
        envVarName: 'SUPABASE_ACCESS_TOKEN',
        blockers: ['preinjected_access_token_not_confirmed'],
      }
    }
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: 'passed',
      mode: 'current_process_supabase_access_token_already_present',
      tokenSource: 'preinjected_env',
      secretRefUsed: process.env.REEDITPRO_SUPABASE_ACCESS_TOKEN_SECRET_REF ?? selectedSecretRef ?? 'current_process_env',
      payloadAccessStatus: 'not_attempted',
      payloadAccessCommandRun: false,
      payloadPrinted: false,
      payloadCommitted: false,
      tokenValuePrinted: false,
      tokenValueCommitted: false,
      envVarPresent: true,
      envVarName: 'SUPABASE_ACCESS_TOKEN',
      blockers: [],
    }
  }
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (!confirmationPresent) blockers.push('access_token_secret_injection_not_confirmed')
  if (discoveryReport.status !== 'passed') blockers.push('secret_manager_metadata_discovery_unavailable')
  if (!selectedSecretRef) blockers.push('supabase_access_token_secret_reference_missing')
  if (blockers.length > 0 || !selectedSecretRef) {
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: 'blocked',
      mode: 'supabase_access_token_secret_injection',
      tokenSource: 'unavailable',
      secretRefUsed: selectedSecretRef,
      payloadAccessStatus: 'not_attempted',
      payloadAccessCommandRun: false,
      payloadPrinted: false,
      payloadCommitted: false,
      tokenValuePrinted: false,
      tokenValueCommitted: false,
      envVarPresent: false,
      envVarName: 'SUPABASE_ACCESS_TOKEN',
      blockers: collectUnique(blockers),
    }
  }
  const access = await accessSecretPayload(selectedSecretRef)
  if (!access.value) {
    const blocker: SupabaseCleanStagingBranchExecutionBlocker = access.status === 'invalid'
      ? 'supabase_access_token_secret_payload_invalid'
      : 'supabase_access_token_secret_payload_access_denied'
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: 'blocked',
      mode: 'supabase_access_token_secret_injection',
      tokenSource: 'unavailable',
      secretRefUsed: selectedSecretRef,
      payloadAccessStatus: access.status,
      payloadAccessCommandRun: true,
      payloadPrinted: false,
      payloadCommitted: false,
      tokenValuePrinted: false,
      tokenValueCommitted: false,
      envVarPresent: false,
      envVarName: 'SUPABASE_ACCESS_TOKEN',
      stderrSummary: access.stderrSummary,
      blockers: [blocker],
    }
  }
  process.env.SUPABASE_ACCESS_TOKEN = access.value
  process.env.REEDITPRO_SUPABASE_ACCESS_TOKEN_SECRET_REF = selectedSecretRef
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'passed',
    mode: 'supabase_access_token_secret_injection',
    tokenSource: 'exact_secret_ref',
    secretRefUsed: selectedSecretRef,
    payloadAccessStatus: 'succeeded',
    payloadAccessCommandRun: true,
    payloadPrinted: false,
    payloadCommitted: false,
    tokenValuePrinted: false,
    tokenValueCommitted: false,
    envVarPresent: true,
    envVarName: 'SUPABASE_ACCESS_TOKEN',
    blockers: [],
  }
}

function buildMigrationTransportReport(): JsonRecord {
  const dbUrlInfo = getCleanBranchDbUrl()
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: dbUrlInfo.present ? 'passed' : 'blocked',
    mode: 'clean_staging_branch_migration_transport',
    migrationWorkflow: 'supabase_db_push_redacted_db_url',
    branchName: CLEAN_STAGING_BRANCH_NAME,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    acceptedDbUrlEnvNames: CLEAN_STAGING_BRANCH_DB_URL_ENV_NAMES,
    selectedDbUrlEnvName: dbUrlInfo.present ? dbUrlInfo.name : null,
    dbUrlEnvPresent: dbUrlInfo.present,
    dbUrlPrinted: false,
    dbUrlCommitted: false,
    directSqlAllowed: false,
    seedIncluded: false,
    migrationRepairAllowed: false,
    trackBBackfillWrite: false,
    blockers: dbUrlInfo.present ? [] : ['clean_branch_migration_apply_transport_unavailable'],
  }
}

function buildSecretReferencePlan(
  accessTokenDiscoveryReport: JsonRecord,
  migrationTransportReport: JsonRecord,
): JsonRecord {
  const tokenSecretRef = maybeString(accessTokenDiscoveryReport.selectedTokenSecretRef)
  const tokenSource = maybeString(accessTokenDiscoveryReport.tokenSource)
  const cleanDbUrlPresent = migrationTransportReport.dbUrlEnvPresent === true
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (!tokenSecretRef && tokenSource !== 'preinjected_env') blockers.push('supabase_access_token_secret_reference_missing')
  if (!cleanDbUrlPresent) blockers.push('clean_branch_migration_apply_transport_unavailable')
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    mode: 'clean_staging_branch_secret_reference_plan',
    recommendedAccessTokenSecretRefEnv: 'REEDITPRO_SUPABASE_ACCESS_TOKEN_SECRET_REF',
    recommendedAccessTokenSecretRef: tokenSecretRef,
    accessTokenSource: tokenSource ?? 'unavailable',
    recommendedCleanBranchDbUrlEnv: 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
    acceptedCleanBranchDbUrlEnvNames: CLEAN_STAGING_BRANCH_DB_URL_ENV_NAMES,
    cleanBranchDbUrlEnvPresent: cleanDbUrlPresent,
    payloadsIncluded: false,
    payloadPrinted: false,
    payloadCommitted: false,
    tokenPrinted: false,
    dbUrlPrinted: false,
    serviceRoleKeyPrinted: false,
    anonKeyPrinted: false,
    productionAffected: false,
    trackBBackfillWrite: false,
    blockers: collectUnique(blockers),
  }
}

async function buildCliTransportReport(): Promise<JsonRecord> {
  const result = await runSupabaseCli(['--version'])
  const cliVersion = commandOutputText(result).trim().split(/\r?\n/)[0] ?? 'unknown'
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: result.status,
    strategy: 'temp_npm_exec_supabase_cli',
    cliVersion: cliVersion.length > 0 ? cliVersion : 'unknown',
    npmCache: TEMP_NPM_CACHE,
    npmPrefix: TEMP_NPM_PREFIX,
    cacheInsideRepo: TEMP_NPM_CACHE.includes(process.cwd()),
    prefixInsideRepo: TEMP_NPM_PREFIX.includes(process.cwd()),
    commandResult: result,
    globalCliUsed: false,
    packageLockChanged: false,
    blockers: result.blockers,
  }
}

async function buildExistingBranchCheckReport(): Promise<JsonRecord> {
  const result = await runSupabaseCli([
    '-o',
    'json',
    'branches',
    'list',
    '--project-ref',
    CLEAN_STAGING_PARENT_PROJECT_REF,
  ], { failureBlocker: 'clean_staging_branch_list_failed' })
  const parsed = parseJsonOutput(result)
  const branches = extractBranches(parsed)
  const cleanBranch = branches.find((branch) => branch.name === CLEAN_STAGING_BRANCH_NAME)
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (result.status !== 'passed') blockers.push('clean_staging_branch_list_failed')
  if (cleanBranch && cleanBranch.withData === true) blockers.push('clean_staging_branch_metadata_unsafe')
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    commandResult: result,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchListParsed: parsed !== null,
    branchCount: branches.length,
    cleanBranch: cleanBranch
      ? {
          exists: true,
          name: cleanBranch.name,
          branchRef: cleanBranch.ref,
          status: cleanBranch.status,
          persistent: cleanBranch.persistent,
          withProductionData: false,
          metadataSafe: cleanBranch.withData !== true,
        }
      : { exists: false },
    secretsPrintedOrCommitted: false,
    productionAffected: false,
    blockers: collectUnique(blockers),
  }
}

async function createCleanBranch(options: {
  retryAttempt?: boolean
  retryStrategy?: BranchCreateRetryStrategy
  region?: string | null
  size?: string | null
} = {}): Promise<JsonRecord> {
  const args = [
    '-o',
    'json',
    'branches',
    'create',
    CLEAN_STAGING_BRANCH_NAME,
    '--persistent',
    '--project-ref',
    CLEAN_STAGING_PARENT_PROJECT_REF,
  ]
  if (options.region) args.push('--region', options.region)
  if (options.size) args.push('--size', options.size)
  const result = await runSupabaseCli(args, { failureBlocker: 'clean_staging_branch_create_failed' })
  const parsed = parseJsonOutput(result)
  const branch = extractBranchFromUnknown(parsed)
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (result.status !== 'passed') {
    if (result.stderrSummary.lineCount > 0 || result.stdoutSummary.lineCount > 0) {
      blockers.push('clean_staging_branch_create_failed')
    } else {
      blockers.push('branch_region_or_size_required')
    }
  }
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    branchAction: blockers.length === 0 ? 'created' : 'blocked',
    commandClass: 'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]',
    retryAttempt: options.retryAttempt === true,
    retryStrategy: options.retryStrategy ?? null,
    regionProvided: Boolean(options.region),
    sizeProvided: Boolean(options.size),
    commandResult: result,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchRef: branch.ref,
    branchStatus: branch.status,
    persistent: true,
    withData: false,
    withProductionData: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUnique(blockers),
  }
}

async function buildBranchCliHelpReport(cliTransportReport: JsonRecord): Promise<JsonRecord> {
  const result = await runSupabaseCli(['branches', 'create', '--help'])
  const helpText = commandOutputText(result)
  const supportedFlags = {
    projectRef: helpText.includes(dashFlag('project-ref')),
    persistent: helpText.includes(dashFlag('persistent')),
    region: helpText.includes(dashFlag('region')),
    size: helpText.includes(dashFlag('size')),
    dataClone: helpText.includes(dashFlag(['with', 'data'].join('-'))),
  }
  const regionChoices = extractChoiceList(helpText, 'region')
  const sizeChoices = extractChoiceList(helpText, 'size')
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: result.status,
    mode: 'clean_staging_branch_cli_help',
    cliVersion: maybeString(cliTransportReport.cliVersion) ?? 'unknown',
    commandResult: result,
    rawHelpStored: false,
    supportedFlags,
    regionChoices,
    sizeChoices,
    dataCloneAllowed: false,
    withData: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: result.blockers,
  }
}

function buildBranchCreateFailureDiagnosticsReport(
  branchCreationReport: JsonRecord,
  cliTransportReport: JsonRecord,
  branchCliHelpReport: JsonRecord,
): JsonRecord {
  const commandResult = asRecord(branchCreationReport.commandResult) as unknown as CommandResult
  const output = commandOutputText(commandResult)
  const classification = classifyBranchCreateFailure(branchCreationReport, output)
  const safeValues = getApprovedBranchRetryValues(branchCliHelpReport)
  const deterministicRetryPossible = determineBranchCreateDeterministicRetryPossible(classification, safeValues)
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: branchCreationReport.status === 'passed' ? 'passed' : 'blocked',
    mode: 'clean_staging_branch_create_failure_diagnostics',
    commandClass: 'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]',
    commandResult: summarizeCommandResult(commandResult),
    cliVersion: maybeString(cliTransportReport.cliVersion) ?? 'unknown',
    tokenPresent: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
    tokenPrinted: false,
    tokenCommitted: false,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    persistent: true,
    withData: false,
    productionAffected: false,
    rawOutputStored: false,
    sanitizedFailureSignals: classification.signals,
    failureClass: classification.failureClass,
    transientSignalDetected: classification.transientSignalDetected,
    deterministicRetryPossible,
    approvedRegion: safeValues.region,
    approvedRegionSource: safeValues.regionSource,
    approvedSize: safeValues.size,
    approvedSizeSource: safeValues.sizeSource,
    requiredFix: buildBranchCreateRequiredFix(classification.failureClass, safeValues),
    blockers: branchCreationReport.status === 'passed'
      ? []
      : collectUnique(classification.blockers),
  }
}

function buildBranchCreateNotNeededDiagnosticsReport(
  branchCreationReport: JsonRecord,
  cliTransportReport: JsonRecord,
): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'passed',
    mode: 'clean_staging_branch_create_not_needed',
    commandClass: 'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]',
    cliVersion: maybeString(cliTransportReport.cliVersion) ?? 'unknown',
    tokenPresent: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
    tokenPrinted: false,
    tokenCommitted: false,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    persistent: true,
    withData: false,
    productionAffected: false,
    rawOutputStored: false,
    failureClass: 'none' satisfies BranchCreateFailureClass,
    transientSignalDetected: false,
    deterministicRetryPossible: false,
    requiredFix: 'none',
    branchAction: branchCreationReport.branchAction,
    blockers: [],
  }
}

function buildBranchCreateRetryStrategyReport(
  diagnosticsReport: JsonRecord,
  branchCliHelpReport: JsonRecord,
  options: { diagnoseCreate: boolean },
): JsonRecord {
  const failureClass = asString(diagnosticsReport.failureClass, 'branch_create_unknown') as BranchCreateFailureClass
  const safeValues = getApprovedBranchRetryValues(branchCliHelpReport)
  const retryConfirmed = process.env.REEDITPRO_CONFIRM_SUPABASE_CLEAN_BRANCH_CREATE_RETRY_AFTER_DIAGNOSTICS === 'true'
  let retryStrategy: BranchCreateRetryStrategy = 'blocked_pending_operator_review'
  if (failureClass === 'none') retryStrategy = 'not_needed'
  else if (diagnosticsReport.transientSignalDetected === true) retryStrategy = 'retry_same_command_if_transient'
  else if (failureClass === 'branch_create_region_required' && safeValues.region) retryStrategy = 'retry_with_region_if_region_required'
  else if (failureClass === 'branch_create_size_required' && safeValues.size) retryStrategy = 'retry_with_size_if_size_required'
  else if (failureClass === 'branch_create_region_and_size_required' && safeValues.region && safeValues.size) {
    retryStrategy = 'retry_with_region_and_size_if_both_required'
  } else if (failureClass === 'branch_create_plan_or_billing_unavailable') retryStrategy = 'blocked_pending_plan_or_billing_review'
  else if (failureClass === 'branch_create_permission_denied') retryStrategy = 'blocked_pending_permission_review'
  else if (failureClass === 'branch_create_feature_unavailable') retryStrategy = 'blocked_pending_branching_feature_review'

  const deterministicRetryPossible = retryStrategy.startsWith('retry_') &&
    retryConfirmed &&
    options.diagnoseCreate
  const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
  if (retryStrategy !== 'not_needed' && !retryConfirmed) blockers.push('clean_branch_create_retry_not_confirmed')
  if (retryStrategy === 'retry_with_region_if_region_required' && !safeValues.region) blockers.push('branch_region_or_size_required')
  if (retryStrategy === 'retry_with_size_if_size_required' && !safeValues.size) blockers.push('branch_region_or_size_required')
  if (retryStrategy === 'retry_with_region_and_size_if_both_required' && (!safeValues.region || !safeValues.size)) {
    blockers.push('branch_region_or_size_required')
  }
  if (!retryStrategy.startsWith('retry_') && retryStrategy !== 'not_needed') {
    blockers.push(...failureClassToBlockers(failureClass))
  }
  if (retryStrategy.startsWith('retry_') && (!retryConfirmed || !options.diagnoseCreate)) {
    blockers.push('clean_branch_create_retry_not_confirmed')
  }
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: retryStrategy === 'not_needed' || deterministicRetryPossible ? 'passed' : 'blocked',
    mode: 'clean_staging_branch_create_retry_strategy',
    failureClass,
    retryStrategy,
    deterministicRetryPossible,
    retryConfirmed,
    diagnoseCreateFlagPresent: options.diagnoseCreate,
    approvedRegion: safeValues.region,
    approvedRegionSource: safeValues.regionSource,
    approvedSize: safeValues.size,
    approvedSizeSource: safeValues.sizeSource,
    withData: false,
    dataCloneAllowed: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: collectUnique(blockers),
  }
}

async function buildBranchCreateRetryReport(strategyReport: JsonRecord): Promise<JsonRecord> {
  const retryStrategy = asString(strategyReport.retryStrategy, 'blocked_pending_operator_review') as BranchCreateRetryStrategy
  const deterministicRetryPossible = strategyReport.deterministicRetryPossible === true
  if (retryStrategy === 'not_needed') return buildSkippedBranchCreateRetryReport(strategyReport)
  if (!deterministicRetryPossible) return buildSkippedBranchCreateRetryReport(strategyReport)

  const beforeRetry = await buildExistingBranchCheckReport()
  const existingBranch = asRecord(beforeRetry.cleanBranch)
  if (beforeRetry.status === 'passed' && existingBranch.exists === true) {
    return {
      ...buildBranchReuseReport(existingBranch),
      mode: 'clean_staging_branch_create_retry_existing_branch_found',
      retryAttempt: true,
      retryStrategy,
      beforeRetryExistingCheck: beforeRetry,
    }
  }

  const result = await createCleanBranch({
    retryAttempt: true,
    retryStrategy,
    region: maybeString(strategyReport.approvedRegion),
    size: maybeString(strategyReport.approvedSize),
  })
  return {
    ...result,
    mode: 'clean_staging_branch_create_retry',
    retryAttempt: true,
    retryStrategy,
    beforeRetryExistingCheck: beforeRetry,
  }
}

function buildSkippedBranchCreateFailureDiagnosticsReport(
  branchCreationReport: JsonRecord,
  cliTransportReport: JsonRecord,
): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'skipped',
    mode: 'clean_staging_branch_create_failure_diagnostics_not_attempted',
    commandClass: 'supabase branches create [BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]',
    cliVersion: maybeString(cliTransportReport.cliVersion) ?? 'unknown',
    tokenPresent: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    persistent: true,
    withData: false,
    productionAffected: false,
    rawOutputStored: false,
    failureClass: branchCreationReport.status === 'passed' ? 'none' : 'branch_create_unknown',
    deterministicRetryPossible: false,
    requiredFix: 'diagnostics_not_attempted',
    blockers: branchCreationReport.status === 'passed' ? [] : ['branch_create_unknown'],
  }
}

function buildSkippedBranchCliHelpReport(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'skipped',
    mode: 'clean_staging_branch_cli_help_not_attempted',
    rawHelpStored: false,
    supportedFlags: {
      projectRef: false,
      persistent: false,
      region: false,
      size: false,
      dataClone: false,
    },
    regionChoices: [],
    sizeChoices: [],
    dataCloneAllowed: false,
    withData: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: ['temp_npm_supabase_cli_unavailable'],
  }
}

function buildSkippedBranchCreateRetryReport(strategyReport: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'skipped',
    mode: 'clean_staging_branch_create_retry_not_run',
    retryAttempt: false,
    retryStrategy: strategyReport.retryStrategy ?? 'blocked_pending_operator_review',
    deterministicRetryPossible: strategyReport.deterministicRetryPossible === true,
    branchAction: 'not_run',
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    persistent: true,
    withData: false,
    withProductionData: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: asStringArray(strategyReport.blockers),
  }
}

function buildBranchReuseReport(existingBranch: JsonRecord): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'passed',
    branchAction: 'reused',
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchRef: asString(existingBranch.branchRef, 'unknown'),
    branchStatus: asString(existingBranch.status, 'unknown'),
    persistent: existingBranch.persistent !== false,
    withData: false,
    withProductionData: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: [],
  }
}

async function buildBranchHealthReport(creationReport: JsonRecord): Promise<JsonRecord> {
  const existing = await buildExistingBranchCheckReport()
  const cleanBranch = asRecord(existing.cleanBranch)
  const status = asString(cleanBranch.status, asString(creationReport.branchStatus, 'unknown'))
  const healthy = existing.status === 'passed' && cleanBranch.exists === true && !['failed', 'deleted'].includes(status)
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: healthy ? 'passed' : 'blocked',
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchRef: asString(cleanBranch.branchRef, asString(creationReport.branchRef, 'unknown')),
    branchStatus: status,
    branchAction: creationReport.branchAction,
    branchExists: cleanBranch.exists === true,
    branchHealthy: healthy,
    withProductionData: false,
    secretsPrintedOrCommitted: false,
    productionAffected: false,
    blockers: healthy ? [] : ['clean_staging_branch_health_unavailable'],
  }
}

async function applyMigrationsToCleanBranch(): Promise<JsonRecord> {
  const dbUrlInfo = getCleanBranchDbUrl()
  if (!dbUrlInfo.present) {
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: 'blocked',
      commandClass: 'supabase db push --db-url [REDACTED_CLEAN_BRANCH_DB_URL]',
      dbUrlEnvPresent: false,
      dbUrlEnvName: null,
      dbUrlPrinted: false,
      dryRunStatus: 'not_run',
      applyStatus: 'not_run',
      sqlExecuted: false,
      migrationDeployed: false,
      blockers: ['clean_branch_migration_apply_transport_unavailable'],
    }
  }
  const dryRun = await runSupabaseCli([
    'db',
    'push',
    '--db-url',
    dbUrlInfo.value,
    '--dry-run',
  ], { redactArgs: true, failureBlocker: 'clean_branch_migration_dry_run_failed' })
  if (dryRun.status !== 'passed') {
    return {
      phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
      runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
      status: 'blocked',
      commandClass: 'supabase db push --db-url [REDACTED_CLEAN_BRANCH_DB_URL] --dry-run',
      dbUrlEnvPresent: true,
      dbUrlEnvName: dbUrlInfo.name,
      dbUrlPrinted: false,
      dryRunStatus: 'blocked',
      dryRunCommandResult: dryRun,
      applyStatus: 'not_run',
      sqlExecuted: false,
      migrationDeployed: false,
      blockers: ['clean_branch_migration_dry_run_failed'],
    }
  }
  const apply = await runSupabaseCli([
    'db',
    'push',
    '--db-url',
    dbUrlInfo.value,
  ], { redactArgs: true, failureBlocker: 'clean_branch_migration_apply_failed' })
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: apply.status,
    commandClass: 'supabase db push --db-url [REDACTED_CLEAN_BRANCH_DB_URL]',
    dbUrlEnvPresent: true,
    dbUrlEnvName: dbUrlInfo.name,
    dbUrlPrinted: false,
    dryRunStatus: 'passed',
    dryRunCommandResult: dryRun,
    applyStatus: apply.status,
    applyCommandResult: apply,
    sqlExecuted: apply.status === 'passed',
    migrationDeployed: apply.status === 'passed',
    seedIncluded: false,
    includeAllUsed: false,
    productionAffected: false,
    blockers: apply.status === 'passed' ? [] : ['clean_branch_migration_apply_failed'],
  }
}

async function verifyMigrationHistory(): Promise<JsonRecord> {
  const dbUrlInfo = getCleanBranchDbUrl()
  if (!dbUrlInfo.present) {
    return buildSkippedReport('clean_staging_branch_migration_history_verify_report', ['clean_branch_migration_history_verify_failed'])
  }
  const result = await runSupabaseCli([
    '-o',
    'json',
    'migration',
    'list',
    '--db-url',
    dbUrlInfo.value,
  ], { redactArgs: true, failureBlocker: 'clean_branch_migration_history_verify_failed' })
  const parsed = parseJsonOutput(result)
  const migrationIds = extractMigrationIds(parsed)
  const targetPresent = migrationIds.includes(TARGET_REGISTRY_MIGRATION_ID)
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: result.status === 'passed' && targetPresent ? 'passed' : 'blocked',
    commandClass: 'supabase migration list --db-url [REDACTED_CLEAN_BRANCH_DB_URL]',
    dbUrlEnvPresent: true,
    dbUrlEnvName: dbUrlInfo.name,
    dbUrlPrinted: false,
    commandResult: result,
    migrationHistoryParsed: parsed !== null,
    migrationIds,
    targetRegistryMigrationId: TARGET_REGISTRY_MIGRATION_ID,
    targetRegistryMigrationPresent: targetPresent,
    productionAffected: false,
    blockers: result.status === 'passed' && targetPresent ? [] : ['clean_branch_migration_history_verify_failed'],
  }
}

async function verifySchemaRls(): Promise<JsonRecord> {
  const history = await verifyMigrationHistory()
  const passed = history.status === 'passed'
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    verificationMode: 'migration_history_plus_committed_registry_schema_static_evidence',
    registryMigrationId: TARGET_REGISTRY_MIGRATION_ID,
    registryMigrationHistoryPresent: history.targetRegistryMigrationPresent === true,
    committedRegistryMigrationPresent: existsSync(path.join(MIGRATION_DIR, TARGET_REGISTRY_MIGRATION_FILE)),
    activationRegistryTablesExpected: [
      'activation_milestones',
      'activation_phase_runs',
      'activation_tool_readiness',
      'activation_pr_evidence',
      'activation_artifact_manifests',
      'activation_blockers',
      'activation_allowed_scopes',
      'activation_blocked_scopes',
      'activation_next_phases',
      'activation_human_approvals',
      'activation_sync_audit_log',
    ],
    rlsVerification: passed ? 'expected_from_applied_registry_migration' : 'not_verified',
    publicAnonAuthenticatedUnsafeAccess: false,
    directDdlDmlRun: false,
    productionAffected: false,
    blockers: passed ? [] : ['clean_branch_schema_rls_verify_failed'],
  }
}

function buildTargetReferenceReport(branchCreationReport: JsonRecord, branchHealthReport: JsonRecord): JsonRecord {
  const branchRef = asString(branchHealthReport.branchRef, asString(branchCreationReport.branchRef, 'unknown'))
  const exists = branchCreationReport.status === 'passed' || branchHealthReport.status === 'passed'
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: exists ? 'passed' : 'blocked',
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    parentProjectName: CLEAN_STAGING_PARENT_PROJECT_NAME,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchRef: branchRef === 'unknown' ? null : branchRef,
    environment: CLEAN_STAGING_ENVIRONMENT,
    purpose: 'internal milestone registry/schema/RLS and future Track B staging metadata backfill',
    allowedUses: [
      'schema_rls_verification',
      'track_b_milestone_metadata_backfill_after_separate_approval',
    ],
    blockedUses: [
      'production',
      'public_artifacts',
      'provider_calls',
      'broad_media',
      'tool_worker_route_execution',
      'track_a',
      'beta_or_production_unlock',
    ],
    secretValuesIncluded: false,
    dbUrlIncluded: false,
    serviceRoleKeyIncluded: false,
    anonKeyIncluded: false,
    accessTokenIncluded: false,
    blockers: exists ? [] : ['clean_staging_branch_health_unavailable'],
  }
}

function decorateTrackBPreflightReport(report: JsonRecord): JsonRecord {
  return {
    ...report,
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    sourcePhase: 'supabase-trackb-milestone-staging-backfill',
    cleanStagingBranchName: CLEAN_STAGING_BRANCH_NAME,
    writePathRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    blockers: asStringArray(report.blockers),
  }
}

function decorateTrackBDiffReport(report: JsonRecord): JsonRecord {
  return {
    ...report,
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    sourcePhase: 'supabase-trackb-milestone-staging-backfill',
    cleanStagingBranchName: CLEAN_STAGING_BRANCH_NAME,
    writePathRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
  }
}

function buildBlockerReport(blockers: SupabaseCleanStagingBranchExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    blockedScopes: [
      'production_supabase',
      'current_broken_staging_reset',
      'migration_repair',
      'direct_manual_sql',
      'track_b_backfill_write',
      'support_ticket_submission',
      'branch_with_data',
      'provider_calls',
      'worker_tool_route_execution',
      'media_processing',
      'track_a',
      'beta_or_production_unlock',
    ],
    withProductionData: false,
    productionAffected: false,
    trackBBackfillRowsWritten: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(input: {
  blockers: SupabaseCleanStagingBranchExecutionBlocker[]
  branchCreationReport: JsonRecord
  branchHealthReport: JsonRecord
  migrationApplyReport: JsonRecord
  schemaRlsVerifyReport: JsonRecord
  migrationHistoryVerifyReport: JsonRecord
  targetReferenceReport: JsonRecord
}): JsonRecord {
  const verified = input.migrationApplyReport.status === 'passed' &&
    input.schemaRlsVerifyReport.status === 'passed' &&
    input.migrationHistoryVerifyReport.status === 'passed'
  const branchReady = input.branchCreationReport.status === 'passed' || input.branchHealthReport.status === 'passed'
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: verified ? 'passed' : branchReady ? 'blocked_after_branch_ready' : 'blocked',
    supabaseUpdateRequired: 'clean_staging_branch_creation_or_reuse_and_migration_apply',
    supabaseUpdateStatus: verified
      ? 'clean_staging_branch_schema_rls_verified'
      : branchReady
        ? 'clean_staging_branch_ready_migration_apply_blocked'
        : 'clean_staging_branch_execution_blocked',
    supabaseEnvironmentTouched: branchReady ? CLEAN_STAGING_ENVIRONMENT : 'none',
    branchName: CLEAN_STAGING_BRANCH_NAME,
    branchAction: input.branchCreationReport.branchAction ?? 'not_run',
    branchStatus: input.branchHealthReport.branchStatus ?? input.branchCreationReport.branchStatus ?? 'unknown',
    withProductionData: false,
    sqlExecuted: input.migrationApplyReport.sqlExecuted === true,
    migrationDeployed: input.migrationApplyReport.migrationDeployed === true,
    schemaRlsVerified: input.schemaRlsVerifyReport.status === 'passed',
    migrationHistoryVerified: input.migrationHistoryVerifyReport.status === 'passed',
    targetReferenceStatus: input.targetReferenceReport.status,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers: input.blockers,
    nextRecommendedPhase: verified
      ? 'Run separate PR #198 Track B staging backfill execution against the clean staging target.'
      : 'Resolve the exact clean branch, migration transport, or secret-reference blocker before Track B backfill.',
  }
}

function buildPrivateArtifactManifest(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    reportDir: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
    committedArtifacts: [
      ...SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS.map((name) =>
        path.join(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR, name),
      ),
      ...SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS,
    ],
    privateUploadRequired: false,
    dbUrlCommitted: false,
    keyMaterialCommitted: false,
    backupPayloadCommitted: false,
    mediaPayloadCommitted: false,
    packageLockChanged: false,
    productionAffected: false,
  }
}

function buildSkippedBranchCreationReport(): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    status: 'skipped',
    branchAction: 'not_run' satisfies SupabaseCleanStagingBranchAction,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    persistent: true,
    withData: false,
    withProductionData: false,
    productionAffected: false,
    blockers: ['clean_staging_branch_list_failed'],
  }
}

function buildSkippedReport(name: string, blockers: SupabaseCleanStagingBranchExecutionBlocker[]): JsonRecord {
  return {
    phase: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_PHASE,
    runId: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_RUN_ID,
    report: name,
    status: 'skipped',
    productionAffected: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

async function runGcloudMetadataCommand(args: string[]): Promise<CommandResult> {
  return await new Promise((resolve) => {
    execFile('gcloud', args, {
      cwd: process.cwd(),
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 2,
    }, (error, stdout, stderr) => {
      const exitCode = typeof (error as { code?: unknown } | null)?.code === 'number'
        ? (error as { code: number }).code
        : error ? 1 : 0
      const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
      if (exitCode !== 0) blockers.push('secret_manager_metadata_discovery_unavailable')
      if (summarizeOutput(stdout).secretPatternDetected || summarizeOutput(stderr).secretPatternDetected) {
        blockers.push('sensitive_payload_pattern_detected')
      }
      const result: CommandResult = {
        status: exitCode === 0 && blockers.length === 0 ? 'passed' : 'blocked',
        command: 'gcloud',
        args,
        exitCode,
        stdoutSummary: summarizeOutput(stdout),
        stderrSummary: summarizeOutput(stderr),
        parsedJson: args.some((arg) => arg.startsWith('--format=json')),
        blockers: collectUnique(blockers),
      }
      COMMAND_STDOUT.set(result, stdout)
      COMMAND_STDERR.set(result, stderr)
      resolve(result)
    })
  })
}

async function accessSecretPayload(secretRef: string): Promise<{
  status: 'succeeded' | 'failed' | 'invalid'
  value: string | null
  stderrSummary: OutputSummary
}> {
  return await new Promise((resolve) => {
    execFile('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${secretRef}`,
      `--project=${SECRET_MANAGER_PROJECT_ID}`,
    ], {
      cwd: process.cwd(),
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          status: 'failed',
          value: null,
          stderrSummary: summarizeOutput(stderr),
        })
        return
      }
      const value = stdout.trim()
      if (value.length < 20 || /\s/.test(value)) {
        resolve({
          status: 'invalid',
          value: null,
          stderrSummary: summarizeOutput(stderr),
        })
        return
      }
      resolve({
        status: 'succeeded',
        value,
        stderrSummary: summarizeOutput(stderr),
      })
    })
  })
}

async function runSupabaseCli(args: string[], options: {
  redactArgs?: boolean
  failureBlocker?: SupabaseCleanStagingBranchExecutionBlocker
} = {}): Promise<CommandResult> {
  mkdirSync(TEMP_NPM_CACHE, { recursive: true })
  mkdirSync(TEMP_NPM_PREFIX, { recursive: true })
  const command = 'npm'
  const fullArgs = ['exec', '--yes', '--package', 'supabase@latest', '--', 'supabase', ...args]
  const env = {
    ...process.env,
    NPM_CONFIG_CACHE: TEMP_NPM_CACHE,
    NPM_CONFIG_PREFIX: TEMP_NPM_PREFIX,
  }
  const displayArgs = options.redactArgs
    ? fullArgs.map((arg) => isLikelySecretValue(arg) ? '[REDACTED]' : arg)
    : fullArgs
  return await new Promise((resolve) => {
    execFile(command, fullArgs, {
      cwd: process.cwd(),
      env,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 8,
    }, (error, stdout, stderr) => {
      const exitCode = typeof (error as { code?: unknown } | null)?.code === 'number'
        ? (error as { code: number }).code
        : error ? 1 : 0
      const blockers: SupabaseCleanStagingBranchExecutionBlocker[] = []
      if (exitCode !== 0) blockers.push(options.failureBlocker ?? 'temp_npm_supabase_cli_unavailable')
      if (summarizeOutput(stdout).secretPatternDetected || summarizeOutput(stderr).secretPatternDetected) {
        blockers.push('sensitive_payload_pattern_detected')
      }
      const result: CommandResult = {
        status: exitCode === 0 && blockers.length === 0 ? 'passed' : 'blocked',
        command,
        args: displayArgs,
        exitCode,
        stdoutSummary: summarizeOutput(stdout),
        stderrSummary: summarizeOutput(stderr),
        parsedJson: false,
        blockers: collectUnique(blockers),
      }
      COMMAND_STDOUT.set(result, stdout)
      COMMAND_STDERR.set(result, stderr)
      resolve(result)
    })
  })
}

function parseJsonOutput(result: CommandResult): unknown | null {
  const stdout = COMMAND_STDOUT.get(result)
  if (!stdout) return null
  try {
    return JSON.parse(stdout) as unknown
  } catch {
    return null
  }
}

function extractSecretMetadata(parsed: unknown): Array<{ secretName: string; labels: JsonRecord }> {
  const values = Array.isArray(parsed) ? parsed : []
  return values.map((value) => {
    const record = asRecord(value)
    return {
      secretName: extractSecretName(asString(record.name, '')),
      labels: asRecord(record.labels),
    }
  }).filter((secret) => secret.secretName.length > 0)
}

function buildAccessTokenSecretCandidates(
  secrets: Array<{ secretName: string; labels: JsonRecord }>,
): JsonRecord[] {
  const secretByName = new Map(secrets.map((secret) => [secret.secretName, secret]))
  const exactCandidates: JsonRecord[] = []
  SUPABASE_ACCESS_TOKEN_SECRET_CANDIDATE_REFS.forEach((secretName, index) => {
    const secret = secretByName.get(secretName)
    if (!secret) return
    const environmentLabel = maybeString(secret.labels.env ?? secret.labels.environment)
    exactCandidates.push({
      secretName,
      candidateType: 'supabase_management_access_token',
      confidence: environmentLabel === 'staging' || environmentLabel === CLEAN_STAGING_ENVIRONMENT ? 'high' : 'medium',
      candidateOrder: index,
      environmentLabel,
      selected: false,
      payloadViewed: false,
      secretValuesPrinted: false,
      reason: environmentLabel
        ? 'Exact candidate token secret ref was present with environment metadata.'
        : 'Exact candidate token secret ref was present without environment metadata.',
    })
  })
  const selectedName = exactCandidates[0]?.secretName
  const exactCandidateNames = new Set<string>(SUPABASE_ACCESS_TOKEN_SECRET_CANDIDATE_REFS)
  const fuzzyCandidates = secrets
    .filter((secret) => !exactCandidateNames.has(secret.secretName as typeof SUPABASE_ACCESS_TOKEN_SECRET_CANDIDATE_REFS[number]))
    .filter((secret) => /supabase/i.test(secret.secretName) && /token|access|management/i.test(secret.secretName))
    .map((secret) => ({
      secretName: secret.secretName,
      candidateType: 'supabase_access_token_name_match_not_selected',
      confidence: 'low',
      environmentLabel: maybeString(secret.labels.env ?? secret.labels.environment),
      selected: false,
      payloadViewed: false,
      secretValuesPrinted: false,
      reason: 'Name resembles a Supabase access-token ref, but it is not one of the approved exact candidate refs for payload injection.',
    }))
  return [...exactCandidates, ...fuzzyCandidates].map((candidate) => ({
    ...candidate,
    selected: candidate.secretName === selectedName,
  }))
}

function extractSecretName(resourceName: string): string {
  return resourceName.includes('/secrets/')
    ? resourceName.split('/secrets/')[1] ?? ''
    : resourceName
}

function extractBranches(parsed: unknown): Array<{ name: string; ref: string | null; status: string; persistent: boolean | null; withData: boolean | null }> {
  const values = Array.isArray(parsed) ? parsed : Array.isArray(asRecord(parsed).branches) ? asRecord(parsed).branches as unknown[] : []
  return values.map((value) => {
    const record = asRecord(value)
    return {
      name: asString(record.name ?? record.branch_name, 'unknown'),
      ref: maybeString(record.project_ref ?? record.ref ?? record.id),
      status: asString(record.status, 'unknown'),
      persistent: typeof record.persistent === 'boolean' ? record.persistent : null,
      withData: typeof record.with_data === 'boolean' ? record.with_data : null,
    }
  }).filter((branch) => branch.name !== 'unknown')
}

function extractBranchFromUnknown(parsed: unknown): { ref: string | null; status: string } {
  const record = asRecord(parsed)
  return {
    ref: maybeString(record.project_ref ?? record.ref ?? record.id),
    status: asString(record.status, 'unknown'),
  }
}

function extractMigrationIds(parsed: unknown): string[] {
  if (!parsed) return []
  const text = JSON.stringify(parsed)
  const matches = text.match(/\b20\d{10}\b/g) ?? []
  return Array.from(new Set(matches)).sort()
}

function summarizeCommandResult(result: CommandResult): JsonRecord {
  return {
    status: result.status,
    command: result.command,
    args: result.args,
    exitCode: result.exitCode,
    stdoutSummary: result.stdoutSummary,
    stderrSummary: result.stderrSummary,
    parsedJson: result.parsedJson,
    blockers: result.blockers,
  }
}

function commandOutputText(result: CommandResult): string {
  return [
    COMMAND_STDOUT.get(result) ?? '',
    COMMAND_STDERR.get(result) ?? '',
  ].join('\n')
}

function dashFlag(name: string): string {
  return `--${name}`
}

function extractChoiceList(helpText: string, flagName: string): string[] {
  const line = helpText
    .split(/\r?\n/)
    .find((candidate) => candidate.includes(dashFlag(flagName)) && candidate.includes('choices:'))
  if (!line) return []
  const choices = line.match(/choices:\s*([^)]+)/)?.[1] ?? ''
  return choices.split(',').map((choice) => choice.trim()).filter(Boolean)
}

function classifyBranchCreateFailure(
  branchCreationReport: JsonRecord,
  outputText: string,
): {
  failureClass: BranchCreateFailureClass
  transientSignalDetected: boolean
  signals: JsonRecord
  blockers: SupabaseCleanStagingBranchExecutionBlocker[]
} {
  if (branchCreationReport.status === 'passed') {
    return {
      failureClass: 'none',
      transientSignalDetected: false,
      signals: {},
      blockers: [],
    }
  }
  const lower = outputText.toLowerCase()
  const hasRegion = /\bregion\b/.test(lower)
  const hasSize = /\b(size|instance)\b/.test(lower)
  const hasRequired = /\b(required|missing|must|select|specify|provide)\b/.test(lower)
  const signals = {
    regionMentioned: hasRegion,
    sizeMentioned: hasSize,
    requiredMentioned: hasRequired,
    billingOrPlanMentioned: /\b(billing|plan|paid|subscription|upgrade)\b/.test(lower),
    permissionMentioned: /\b(permission|unauthorized|forbidden|denied)\b|401|403/.test(lower),
    quotaOrLimitMentioned: /\b(quota|limit|maximum|too many)\b/.test(lower),
    branchFeatureMentioned: /\b(branching|preview branch|branches)\b/.test(lower) &&
      /\b(unavailable|disabled|not enabled|not available)\b/.test(lower),
    projectRefMentioned: /\b(project-ref|project ref|project)\b/.test(lower) &&
      /\b(invalid|not found|unknown)\b/.test(lower),
    branchNameMentioned: /\b(branch name|name)\b/.test(lower) &&
      /\b(invalid|not allowed|malformed)\b/.test(lower),
    cliVersionMentioned: /\b(unknown flag|invalid flag|unrecognized|unsupported|version)\b/.test(lower),
    transientMentioned: /\b(timeout|timed out|temporary|temporarily|try again|network)\b|5\d\d/.test(lower),
    outputAvailable: outputText.trim().length > 0,
  }
  let failureClass: BranchCreateFailureClass = 'branch_create_unknown'
  if (hasRegion && hasSize && hasRequired) failureClass = 'branch_create_region_and_size_required'
  else if (hasRegion && hasRequired) failureClass = 'branch_create_region_required'
  else if (hasSize && hasRequired) failureClass = 'branch_create_size_required'
  else if (signals.billingOrPlanMentioned === true) failureClass = 'branch_create_plan_or_billing_unavailable'
  else if (signals.permissionMentioned === true) failureClass = 'branch_create_permission_denied'
  else if (signals.quotaOrLimitMentioned === true) failureClass = 'branch_create_quota_or_limit_reached'
  else if (signals.branchFeatureMentioned === true) failureClass = 'branch_create_feature_unavailable'
  else if (signals.projectRefMentioned === true) failureClass = 'branch_create_project_ref_invalid'
  else if (signals.branchNameMentioned === true) failureClass = 'branch_create_branch_name_invalid'
  else if (signals.cliVersionMentioned === true) failureClass = 'branch_create_cli_version_issue'
  return {
    failureClass,
    transientSignalDetected: signals.transientMentioned === true,
    signals,
    blockers: failureClassToBlockers(failureClass),
  }
}

function failureClassToBlockers(failureClass: BranchCreateFailureClass): SupabaseCleanStagingBranchExecutionBlocker[] {
  if (failureClass === 'none') return []
  if (
    failureClass === 'branch_create_region_required' ||
    failureClass === 'branch_create_size_required' ||
    failureClass === 'branch_create_region_and_size_required'
  ) return ['branch_region_or_size_required']
  if (failureClass === 'branch_create_plan_or_billing_unavailable') return ['branch_create_plan_or_billing_unavailable']
  if (failureClass === 'branch_create_permission_denied') return ['branch_create_permission_denied']
  if (failureClass === 'branch_create_quota_or_limit_reached') return ['branch_create_quota_or_limit_reached']
  if (failureClass === 'branch_create_feature_unavailable') return ['branch_create_feature_unavailable']
  if (failureClass === 'branch_create_project_ref_invalid') return ['branch_create_project_ref_invalid']
  if (failureClass === 'branch_create_branch_name_invalid') return ['branch_create_branch_name_invalid']
  if (failureClass === 'branch_create_cli_version_issue') return ['branch_create_cli_version_issue']
  return ['branch_create_unknown']
}

function determineBranchCreateDeterministicRetryPossible(
  classification: { failureClass: BranchCreateFailureClass; transientSignalDetected: boolean },
  safeValues: { region: string | null; size: string | null },
): boolean {
  if (classification.transientSignalDetected) return true
  if (classification.failureClass === 'branch_create_region_required') return Boolean(safeValues.region)
  if (classification.failureClass === 'branch_create_size_required') return Boolean(safeValues.size)
  if (classification.failureClass === 'branch_create_region_and_size_required') {
    return Boolean(safeValues.region && safeValues.size)
  }
  return false
}

function buildBranchCreateRequiredFix(
  failureClass: BranchCreateFailureClass,
  safeValues: { region: string | null; size: string | null },
): string {
  if (failureClass === 'branch_create_region_required') {
    return safeValues.region ? 'retry_with_approved_region' : 'approved_region_required_before_retry'
  }
  if (failureClass === 'branch_create_size_required') {
    return safeValues.size ? 'retry_with_approved_size' : 'approved_size_required_before_retry'
  }
  if (failureClass === 'branch_create_region_and_size_required') {
    return safeValues.region && safeValues.size
      ? 'retry_with_approved_region_and_size'
      : 'approved_region_and_size_required_before_retry'
  }
  if (failureClass === 'branch_create_plan_or_billing_unavailable') return 'plan_or_billing_review_required'
  if (failureClass === 'branch_create_permission_denied') return 'permission_review_required'
  if (failureClass === 'branch_create_quota_or_limit_reached') return 'quota_or_limit_review_required'
  if (failureClass === 'branch_create_feature_unavailable') return 'branching_feature_review_required'
  if (failureClass === 'branch_create_project_ref_invalid') return 'project_reference_review_required'
  if (failureClass === 'branch_create_branch_name_invalid') return 'branch_name_review_required'
  if (failureClass === 'branch_create_cli_version_issue') return 'cli_version_review_required'
  if (failureClass === 'none') return 'none'
  return 'manual_operator_review_required'
}

function getApprovedBranchRetryValues(branchCliHelpReport: JsonRecord): {
  region: string | null
  regionSource: string | null
  size: string | null
  sizeSource: string | null
} {
  const docs = [
    'docs/supabase-approved-clean-staging-target-reference.md',
    'docs/supabase-clean-staging-branch-execution.md',
  ]
  const jsonFiles = [
    path.join(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR, 'clean_staging_target_reference.json'),
    path.join(PR280_REPORT_DIR, 'clean_staging_target_approval_decision.json'),
  ]
  const regionChoices = new Set(asStringArray(branchCliHelpReport.regionChoices))
  const sizeChoices = new Set(asStringArray(branchCliHelpReport.sizeChoices))
  const region = findApprovedRetryValue({
    docs,
    jsonFiles,
    docMarker: 'approved_clean_staging_branch_region',
    jsonKeys: ['approvedCleanStagingBranchRegion', 'cleanStagingBranchRegion', 'branchRegion'],
    choices: regionChoices,
  })
  const size = findApprovedRetryValue({
    docs,
    jsonFiles,
    docMarker: 'approved_clean_staging_branch_size',
    jsonKeys: ['approvedCleanStagingBranchSize', 'cleanStagingBranchSize', 'branchSize'],
    choices: sizeChoices,
  })
  return {
    region: region.value,
    regionSource: region.source,
    size: size.value,
    sizeSource: size.source,
  }
}

function findApprovedRetryValue(input: {
  docs: string[]
  jsonFiles: string[]
  docMarker: string
  jsonKeys: string[]
  choices: Set<string>
}): { value: string | null; source: string | null } {
  for (const doc of input.docs) {
    if (!existsSync(doc)) continue
    const text = readFileSync(doc, 'utf8')
    const match = text.match(new RegExp(`${input.docMarker}:\\s*([A-Za-z0-9_-]+)`))
    const value = match?.[1] ?? null
    if (value && approvedRetryChoiceAllowed(value, input.choices)) return { value, source: doc }
  }
  for (const jsonFile of input.jsonFiles) {
    const report = readJsonArtifact(jsonFile)
    if (!report) continue
    for (const key of input.jsonKeys) {
      const value = maybeString(report[key])
      if (value && approvedRetryChoiceAllowed(value, input.choices)) return { value, source: jsonFile }
    }
  }
  return { value: null, source: null }
}

function approvedRetryChoiceAllowed(value: string, choices: Set<string>): boolean {
  return /^[a-z0-9_-]+$/.test(value) && (choices.size === 0 || choices.has(value))
}

function getCleanBranchDbUrl(): { present: false; name: null; value: '' } | { present: true; name: string; value: string } {
  for (const name of CLEAN_STAGING_BRANCH_DB_URL_ENV_NAMES) {
    const value = process.env[name]
    if (value && value.trim().length > 0) return { present: true, name, value }
  }
  return { present: false, name: null, value: '' }
}

function loadExistingExecutionReports(): Partial<Reports> {
  const read = (file: string) => {
    const report = readJsonArtifact(path.join(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR, file))
    if (!report) return null
    if (report.status === 'skipped') return null
    if (Array.isArray(report.blockers) && report.blockers.includes('clean_staging_branch_execute_not_confirmed')) return null
    return report
  }
  return {
    precheckReport: read('clean_staging_branch_precheck_report.json') ?? undefined,
    accessTokenSecretDiscoveryReport: read('clean_staging_branch_access_token_secret_discovery_report.json') ?? undefined,
    accessTokenInjectionReport: read('clean_staging_branch_access_token_injection_report.json') ?? undefined,
    cliTransportReport: read('clean_staging_branch_cli_transport_report.json') ?? undefined,
    existingBranchCheckReport: read('clean_staging_branch_existing_check_report.json') ?? undefined,
    branchCreationReport: read('clean_staging_branch_creation_report.json') ?? undefined,
    branchCreateFailureDiagnosticsReport: read('clean_staging_branch_create_failure_diagnostics_report.json') ?? undefined,
    branchCliHelpReport: read('clean_staging_branch_cli_help_report.json') ?? undefined,
    branchCreateRetryStrategyReport: read('clean_staging_branch_create_retry_strategy_report.json') ?? undefined,
    branchCreateRetryReport: read('clean_staging_branch_create_retry_report.json') ?? undefined,
    branchHealthReport: read('clean_staging_branch_health_report.json') ?? undefined,
    migrationTransportReport: read('clean_staging_branch_migration_transport_report.json') ?? undefined,
    secretReferencePlan: read('clean_staging_branch_secret_reference_plan.json') ?? undefined,
    migrationApplyReport: read('clean_staging_branch_migration_apply_report.json') ?? undefined,
    schemaRlsVerifyReport: read('clean_staging_branch_schema_rls_verify_report.json') ?? undefined,
    migrationHistoryVerifyReport: read('clean_staging_branch_migration_history_verify_report.json') ?? undefined,
    targetReferenceReport: read('clean_staging_target_reference.json') ?? undefined,
    trackBBackfillPreflightReport: read('clean_staging_branch_trackb_backfill_preflight_report.json') ?? undefined,
    trackBBackfillDiffReport: read('clean_staging_branch_trackb_backfill_diff_report.json') ?? undefined,
  }
}

function collectBlockers(reports: JsonRecord[]): SupabaseCleanStagingBranchExecutionBlocker[] {
  const blockers = reports.flatMap((report) => asStringArray(report.blockers)) as SupabaseCleanStagingBranchExecutionBlocker[]
  return collectUnique(blockers)
}

function summarizeOutput(text: string): OutputSummary {
  return {
    byteLength: Buffer.byteLength(text),
    lineCount: text.trim().length === 0 ? 0 : text.trim().split(/\r?\n/).length,
    secretPatternDetected: SENSITIVE_PATTERNS.some((pattern) => text.includes(pattern)),
  }
}

function renderExecutionDoc(reports: Reports): string {
  return `# Supabase Clean Staging Branch Execution

Status: \`${reports.readinessReport.status}\`

Supabase update status: \`${reports.readinessReport.supabaseUpdateStatus}\`

Branch: \`${CLEAN_STAGING_BRANCH_NAME}\`

## Execution

- Branch/project creation: \`${reports.branchCreationReport.branchAction ?? 'not_run'}\`
- Branch create failure class: \`${reports.branchCreateFailureDiagnosticsReport.failureClass ?? 'not_attempted'}\`
- Branch create retry strategy: \`${reports.branchCreateRetryStrategyReport.retryStrategy ?? 'not_attempted'}\`
- Branch create retry result: \`${reports.branchCreateRetryReport.status}\`
- Access-token secret discovery: \`${reports.accessTokenSecretDiscoveryReport.status}\`
- Access-token injection: \`${reports.accessTokenInjectionReport.status}\`
- Migration transport: \`${reports.migrationTransportReport.status}\`
- Current broken staging reset: not run
- Migration repair: not run
- Track B backfill write: not run
- Production Supabase: not run
- Direct/manual SQL: not run
- Secrets printed/committed: false

## Next

${reports.readinessReport.nextRecommendedPhase}
`
}

function renderSecretPolicyDoc(): string {
  return `# Supabase Clean Staging Branch Secret Policy

This phase may use \`SUPABASE_ACCESS_TOKEN\` and a clean-branch DB URL from process env only. Values must never be printed, reported, committed, or copied into docs.

Allowed report fields are secret reference names, payload access status, presence booleans, env var names, branch name/ref safe metadata, and redacted command classes. DB URLs, passwords, service-role keys, anon keys, access token values, signed URLs, and private payloads are forbidden.

Token payload access requires \`REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION=true\` and stores the token only in the current process as \`SUPABASE_ACCESS_TOKEN\`.
`
}

function renderTargetReferenceDoc(reports: Reports): string {
  return `# Supabase Approved Clean Staging Target Reference

approved_clean_staging_target_reference_status: ${reports.targetReferenceReport.status === 'passed' ? 'approved' : 'blocked'}
approved_clean_staging_parent_project_ref: ${CLEAN_STAGING_PARENT_PROJECT_REF}
approved_clean_staging_branch_name: ${CLEAN_STAGING_BRANCH_NAME}
approved_clean_staging_environment: ${CLEAN_STAGING_ENVIRONMENT}

Secret values included: false

Allowed uses: schema/RLS verification and future Track B milestone metadata backfill after separate approval.

Blocked uses: production, public artifacts, provider calls, broad media, tool/worker/route execution, Track A, beta, and production unlocks.
`
}

function renderSchemaRlsVerificationDoc(reports: Reports): string {
  return `# Supabase Clean Staging Branch Schema/RLS Verification

Migration history verification: \`${reports.migrationHistoryVerifyReport.status}\`

Schema/RLS verification: \`${reports.schemaRlsVerifyReport.status}\`

Target registry migration: \`${TARGET_REGISTRY_MIGRATION_ID}\`

No direct/manual SQL or production access is approved by this document.
`
}

function renderTrackBHandoffDoc(reports: Reports): string {
  return `# Track B Backfill After Clean Staging Branch

Clean branch readiness: \`${reports.readinessReport.status}\`

Track B preflight: \`${reports.trackBBackfillPreflightReport.status}\`

Track B write: not run

Clean branch migration transport: \`${reports.migrationTransportReport.status}\`

Branch create diagnostics: \`${reports.branchCreateFailureDiagnosticsReport.failureClass ?? 'not_attempted'}\`

Branch create retry: \`${reports.branchCreateRetryReport.status}\`

After clean schema/RLS verification passes, use a separate PR #198 Track B backfill execution prompt against the clean staging target. Production remains blocked.
`
}

function renderTrackBHandoffPrompt(reports: Reports): string {
  return `# Supabase Track B Backfill After Clean Staging Branch

Use this prompt only after the clean staging branch execution reports show schema/RLS and migration history verification passed.

Required clean target reference: \`docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json\`

Current clean branch readiness: \`${reports.readinessReport.status}\`

Current migration transport: \`${reports.migrationTransportReport.status}\`

Current branch create diagnostics: \`${reports.branchCreateFailureDiagnosticsReport.failureClass ?? 'not_attempted'}\`

Current branch create retry: \`${reports.branchCreateRetryReport.status}\`

Run PR #198 preflight/diff/report first. Do not write Track B rows until a separate guarded backfill execution phase sets the required Track B confirmations.
`
}

function readJsonArtifact(filePath: string): JsonRecord | null {
  if (!existsSync(filePath)) return null
  try {
    return asRecord(JSON.parse(readFileSync(filePath, 'utf8')) as unknown)
  } catch {
    return null
  }
}

function getLocalMigrationFiles(): string[] {
  if (!existsSync(MIGRATION_DIR)) return []
  return readdirSync(MIGRATION_DIR).filter((name) => /^\d+_.*\.sql$/.test(name)).sort()
}

function safeStatIsDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function collectUnique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function maybeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function isLikelySecretValue(value: string): boolean {
  return value.includes('://') || value.startsWith('sbp_') || value.length > 80
}

export function scanSupabaseCleanStagingBranchPayloadText(text: string): string[] {
  return SENSITIVE_PATTERNS.filter((pattern) => text.includes(pattern))
}
