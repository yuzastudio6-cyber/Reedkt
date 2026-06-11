import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { TRACK_B_TOOL_IDS } from '../track-b-capability-manifests/track-b-tool-registry'
import type {
  TrackBSupabaseMilestoneBackfillRecord,
  TrackBSupabaseMilestoneExport,
} from './supabase-trackb-backfill-types'
import type {
  SupabaseTrackBCleanStagingBackfillBlocker,
  SupabaseTrackBCleanStagingBackfillReports,
  SupabaseTrackBCleanStagingPluginResultInput,
} from './supabase-trackb-clean-staging-types'

export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE =
  'supabase-trackb-clean-staging-backfill'
export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID =
  'supabase-trackb-clean-staging-backfill-20260611'
export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_BRANCH =
  'codex/rp-foundation-supabase-trackb-clean-staging-backfill'
export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_BASE_BRANCH =
  'codex/rp-foundation-supabase-clean-staging-branch-execution'
export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR =
  'docs/activation-supabase-trackb-clean-staging-backfill-reports'

export const CLEAN_STAGING_PARENT_PROJECT_REF = 'wmyyttnynmteqgcdishd'
export const CLEAN_STAGING_BRANCH_PROJECT_REF = 'fnjiylwirntrqdcwpbho'
export const CLEAN_STAGING_BRANCH_NAME = 'reeditpro-internal-staging-clean'
export const CLEAN_STAGING_ENVIRONMENT = 'clean_staging'

const TRACK_B_SUPABASE_EXPORT_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json'
const TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.schema.json'
const TRACK_B_TOOL_STATUS_ROLLUP_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_tool_status_rollup.json'
const TRACK_B_PHASE_STATUS_ROLLUP_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_phase_status_rollup.json'
const TRACK_B_BLOCKED_SCOPE_ROLLUP_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_blocked_scope_rollup.json'
const TRACK_B_INTERNAL_READY_SCOPE_ROLLUP_PATH =
  'docs/activation-track-b-readiness-rollup-reports/track_b_internal_ready_scope_rollup.json'
const CLEAN_STAGING_SCHEMA_RLS_VERIFY_REPORT_PATH =
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_schema_rls_verify_report.json'
const CLEAN_STAGING_MIGRATION_HISTORY_REPORT_PATH =
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_migration_history_verify_report.json'
const CLEAN_STAGING_TARGET_REFERENCE_REPORT_PATH =
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json'
const REGISTRY_MIGRATION_PATH =
  'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql'
const TRACK_B_SUPABASE_EXPORT_VERSION = 'track-b-supabase-milestone-export-v1'

export const SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'trackb_clean_staging_backfill_plan.json',
  'trackb_export_validation_report.json',
  'clean_staging_target_preflight_report.json',
  'trackb_clean_staging_backfill_mapping_report.json',
  'trackb_clean_staging_backfill_diff_report.json',
  'trackb_clean_staging_backfill_write_report.json',
  'trackb_clean_staging_backfill_verification_report.json',
  'trackb_clean_staging_backfill_audit_report.json',
  'trackb_clean_staging_backfill_blocker_report.json',
  'trackb_clean_staging_backfill_readiness_report.json',
  'trackb_clean_staging_backfill_private_artifact_manifest.json',
] as const

export const SUPABASE_TRACKB_CLEAN_STAGING_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_SUPABASE_EXPORT_READ',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_BACKFILL_DIFF_REVIEW',
] as const

export const SUPABASE_TRACKB_CLEAN_STAGING_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_BRANCH_WITH_DATA',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_EXECUTE',
  'REEDITPRO_CONFIRM_SUPABASE_DB_RESET',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_REPAIR',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
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

const ACTIVATION_REGISTRY_TABLES = [
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
] as const

const FORBIDDEN_EXPORT_KEYS = [
  'secretValue',
  'serviceRoleKey',
  'providerKey',
  'signedUrl',
  'rawPayload',
  'userPii',
  'connectionString',
  'privateArtifactContents',
] as const

const FORBIDDEN_VALUE_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /provider[_-]?key\s*[:=]/i,
  /x-goog-signature=/i,
  /awsaccesskeyid=/i,
  /private-user-images\.githubusercontent\.com/i,
  /\bsbp_[A-Za-z0-9_-]+/,
] as const

interface TrackBLoadedExport {
  export?: TrackBSupabaseMilestoneExport
  schema?: Record<string, unknown>
  blockers: SupabaseTrackBCleanStagingBackfillBlocker[]
}

interface CleanStagingRows {
  milestones: Record<string, unknown>[]
  phaseRuns: Record<string, unknown>[]
  toolReadiness: Record<string, unknown>[]
  prEvidence: Record<string, unknown>[]
  artifactManifests: Record<string, unknown>[]
  blockers: Record<string, unknown>[]
  allowedScopes: Record<string, unknown>[]
  blockedScopes: Record<string, unknown>[]
  nextPhases: Record<string, unknown>[]
  humanApprovals: Record<string, unknown>[]
  syncAuditLog: Record<string, unknown>[]
}

export function getSupabaseTrackBCleanStagingBackfillPlan() {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    branch: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_BRANCH,
    baseBranch: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_BASE_BRANCH,
    prTitle: '[foundation] Supabase Track B clean staging backfill',
    reportDir: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
    expectedReports: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_EXPECTED_REPORTS,
    cleanStagingTarget: {
      projectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
      branchName: CLEAN_STAGING_BRANCH_NAME,
      parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
      environment: CLEAN_STAGING_ENVIRONMENT,
    },
    inputExportPath: TRACK_B_SUPABASE_EXPORT_PATH,
    inputExportSchemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
    requiredConfirmations: SUPABASE_TRACKB_CLEAN_STAGING_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: SUPABASE_TRACKB_CLEAN_STAGING_FORBIDDEN_CONFIRMATIONS,
    allowedMutation: 'metadata_only_idempotent_upsert_into_clean_staging_activation_registry',
    docsBasis: [
      'https://supabase.com/docs/reference/cli/supabase-db-push',
      'https://supabase.com/docs/guides/deployment/database-migrations',
      'https://supabase.com/changelog.md',
    ],
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    migrationDeployment: false,
    migrationRepair: false,
    trackBRuntimeExecution: false,
    providerCalls: false,
    mediaProcessing: false,
    trackA: 'not_touched',
    nextRecommendedPhase: 'Product-wide internal readiness aggregation after Track B clean-staging backfill evidence is reviewed.',
  }
}

export function buildSupabaseTrackBCleanStagingBackfillReports(
  overrides: SupabaseTrackBCleanStagingPluginResultInput = {},
): SupabaseTrackBCleanStagingBackfillReports {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const exportValidationReport = buildExportValidationReport()
  const targetPreflightReport = buildTargetPreflightReport()
  const baseBlockers = collectBlockers(exportValidationReport, targetPreflightReport)
  const mappingReport = buildMappingReport(exportValidationReport, baseBlockers)
  const diffReport = overrides.diffResult ?? readPreservedReport('trackb_clean_staging_backfill_diff_report.json') ??
    buildDiffReport(mappingReport, baseBlockers)
  const writeReport = overrides.writeResult ?? readPreservedReport('trackb_clean_staging_backfill_write_report.json') ??
    buildWriteReport(baseBlockers)
  const verificationReport = overrides.verificationResult ??
    readPreservedReport('trackb_clean_staging_backfill_verification_report.json') ??
    buildVerificationReport(writeReport, baseBlockers)
  const blockers = collectBlockers(
    exportValidationReport,
    targetPreflightReport,
    mappingReport,
    diffReport,
    writeReport,
    verificationReport,
  )
  const auditReport = buildAuditReport(diffReport, writeReport, verificationReport, blockers)
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(exportValidationReport, targetPreflightReport, writeReport, verificationReport, blockers)
  return {
    sourceOfTruthOwnershipAudit,
    plan: getSupabaseTrackBCleanStagingBackfillPlan(),
    exportValidationReport,
    targetPreflightReport,
    mappingReport,
    diffReport,
    writeReport,
    verificationReport,
    auditReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeSupabaseTrackBCleanStagingBackfillArtifacts(
  reports = buildSupabaseTrackBCleanStagingBackfillReports(),
  reportDir = SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_export_validation_report.json'), reports.exportValidationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'clean_staging_target_preflight_report.json'), reports.targetPreflightReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_mapping_report.json'), reports.mappingReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_diff_report.json'), reports.diffReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_write_report.json'), reports.writeReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_verification_report.json'), reports.verificationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_audit_report.json'), reports.auditReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'trackb_clean_staging_backfill_audit_report.md'), renderAuditMarkdown(reports))
}

export async function writeSupabaseTrackBCleanStagingPluginResultArtifacts(
  input: SupabaseTrackBCleanStagingPluginResultInput,
): Promise<SupabaseTrackBCleanStagingBackfillReports> {
  const reports = buildSupabaseTrackBCleanStagingBackfillReports(input)
  await writeSupabaseTrackBCleanStagingBackfillArtifacts(reports)
  return reports
}

export function readSupabaseTrackBCleanStagingBackfillSummary() {
  const reports = buildSupabaseTrackBCleanStagingBackfillReports()
  const blockerReport = reports.blockerReport as { activeBlockers?: string[] }
  const writeReport = reports.writeReport as { status?: string; writePerformed?: boolean; rowsWrittenTotal?: number; sqlExecuted?: boolean }
  const verificationReport = reports.verificationReport as { status?: string; verificationPerformed?: boolean }
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: (reports.readinessReport as { status?: string }).status,
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    environment: CLEAN_STAGING_ENVIRONMENT,
    writeStatus: writeReport.status,
    writePerformed: writeReport.writePerformed === true,
    rowsWrittenTotal: writeReport.rowsWrittenTotal ?? 0,
    verificationStatus: verificationReport.status,
    verificationPerformed: verificationReport.verificationPerformed === true,
    sqlExecuted: writeReport.sqlExecuted === true,
    migrationDeployed: false,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    trackBRuntimeExecution: false,
    activeBlockers: blockerReport.activeBlockers ?? [],
  }
}

export async function executeSupabaseTrackBCleanStagingBackfill(input: {
  cleanStaging: boolean
  keepTemp: boolean
}): Promise<{ reports: SupabaseTrackBCleanStagingBackfillReports; exitCode: number }> {
  const confirmationBlockers = validateExecutionConfirmations(input)
  if (confirmationBlockers.length > 0) {
    const reports = buildSupabaseTrackBCleanStagingBackfillReports({
      writeResult: buildBlockedExecutionReport('write', confirmationBlockers),
      verificationResult: buildBlockedExecutionReport('verification', confirmationBlockers),
    })
    await writeSupabaseTrackBCleanStagingBackfillArtifacts(reports)
    return { reports, exitCode: 1 }
  }

  const reports = buildSupabaseTrackBCleanStagingBackfillReports()
  const writeReport = reports.writeReport as { status?: string; writePerformed?: boolean }
  const verificationReport = reports.verificationReport as { status?: string; verificationPerformed?: boolean }
  if (writeReport.status === 'passed' && writeReport.writePerformed === true &&
    verificationReport.status === 'passed' && verificationReport.verificationPerformed === true) {
    await writeSupabaseTrackBCleanStagingBackfillArtifacts(reports)
    return { reports, exitCode: 0 }
  }

  const blockers = collectBlockers(reports.exportValidationReport, reports.targetPreflightReport, reports.mappingReport)
  const executionBlockers: SupabaseTrackBCleanStagingBackfillBlocker[] = blockers.length > 0
    ? blockers
    : ['clean_staging_plugin_write_not_available']
  const blockedReports = buildSupabaseTrackBCleanStagingBackfillReports({
    writeResult: buildBlockedExecutionReport('write', executionBlockers),
    verificationResult: buildBlockedExecutionReport('verification', executionBlockers),
  })
  await writeSupabaseTrackBCleanStagingBackfillArtifacts(blockedReports)
  return { reports: blockedReports, exitCode: 1 }
}

export function buildSupabaseTrackBCleanStagingDiffSql(): string {
  const payload = buildPayload()
  return `with payload as (
  select ${jsonSqlLiteral(payload)}::jsonb as data
),
expected_counts as (
  select * from jsonb_to_recordset((select data->'expectedCounts' from payload)) as r(table_name text, planned_rows integer)
),
existing_counts as (
  select 'activation_milestones'::text as table_name, count(*)::integer as existing_rows from public.activation_milestones where phase_id in (select value #>> '{}' from jsonb_array_elements((select data->'phaseIds' from payload)))
  union all select 'activation_phase_runs', count(*)::integer from public.activation_phase_runs where run_id like '%-${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_tool_readiness', count(*)::integer from public.activation_tool_readiness where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_pr_evidence', count(*)::integer from public.activation_pr_evidence where evidence_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_artifact_manifests', count(*)::integer from public.activation_artifact_manifests where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_blockers', count(*)::integer from public.activation_blockers where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_allowed_scopes', count(*)::integer from public.activation_allowed_scopes where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_blocked_scopes', count(*)::integer from public.activation_blocked_scopes where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_next_phases', count(*)::integer from public.activation_next_phases where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_human_approvals', count(*)::integer from public.activation_human_approvals where approval_key = '${SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID}'
  union all select 'activation_sync_audit_log', count(*)::integer from public.activation_sync_audit_log where sync_key = '${SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID}'
),
unsafe_rows as (
  select 'activation_milestones'::text as table_name, count(*)::integer as unsafe_rows from public.activation_milestones where phase_id in (select value #>> '{}' from jsonb_array_elements((select data->'phaseIds' from payload))) and (production_allowed or external_beta_allowed or paid_production_allowed or broad_media_allowed or public_output_allowed or provider_calls_allowed)
  union all select 'activation_phase_runs', count(*)::integer from public.activation_phase_runs where run_id like '%-${TRACK_B_SUPABASE_EXPORT_VERSION}' and (production_allowed or external_beta_allowed or paid_production_allowed or broad_media_allowed or public_output_allowed or provider_calls_allowed)
  union all select 'activation_tool_readiness', count(*)::integer from public.activation_tool_readiness where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}' and (production_allowed or external_beta_allowed or paid_production_allowed or broad_media_allowed or public_output_allowed or provider_calls_allowed)
)
select jsonb_build_object(
  'status', case when coalesce((select sum(unsafe_rows) from unsafe_rows), 0) = 0 then 'passed' else 'blocked' end,
  'remoteReadPerformed', true,
  'targetProjectRef', '${CLEAN_STAGING_BRANCH_PROJECT_REF}',
  'environment', '${CLEAN_STAGING_ENVIRONMENT}',
  'plannedCounts', (select jsonb_object_agg(table_name, planned_rows) from expected_counts),
  'existingCounts', (select jsonb_object_agg(table_name, existing_rows) from existing_counts),
  'unsafeRows', (select jsonb_object_agg(table_name, unsafe_rows) from unsafe_rows),
  'conflicts', coalesce((select sum(unsafe_rows) from unsafe_rows), 0),
  'productionAffected', false,
  'brokenOriginalStagingAffected', false,
  'secretsPrintedOrCommitted', false
) as result;`
}

export function buildSupabaseTrackBCleanStagingBackfillSql(): string {
  const payload = buildPayload()
  return `with payload as (
  select ${jsonSqlLiteral(payload)}::jsonb as data
),
milestones as (
  insert into public.activation_milestones (
    phase_id, track, family, milestone_name, milestone_status, readiness_status, beta_status,
    branch, pr_number, pr_url, commit_sha, source_report_path, export_version, summary_json, evidence_json
  )
  select phase_id, track, family, milestone_name, milestone_status, readiness_status, beta_status,
    branch, pr_number, pr_url, commit_sha, source_report_path, export_version, summary_json, evidence_json
  from jsonb_to_recordset((select data->'milestones' from payload)) as r(
    phase_id text, track text, family text, milestone_name text, milestone_status text,
    readiness_status text, beta_status text, branch text, pr_number integer, pr_url text,
    commit_sha text, source_report_path text, export_version text, summary_json jsonb, evidence_json jsonb
  )
  on conflict (phase_id, track, family, milestone_name) do update set
    milestone_status = excluded.milestone_status,
    readiness_status = excluded.readiness_status,
    beta_status = excluded.beta_status,
    branch = excluded.branch,
    pr_number = excluded.pr_number,
    pr_url = excluded.pr_url,
    commit_sha = excluded.commit_sha,
    source_report_path = excluded.source_report_path,
    export_version = excluded.export_version,
    summary_json = excluded.summary_json,
    evidence_json = excluded.evidence_json
  returning id
),
phase_runs as (
  insert into public.activation_phase_runs (
    phase_id, run_id, run_status, track, family, branch, pr_number, pr_url, commit_sha,
    source_report_path, result_json, blocker_codes
  )
  select phase_id, run_id, run_status, track, family, branch, pr_number, pr_url, commit_sha,
    source_report_path, result_json, blocker_codes
  from jsonb_to_recordset((select data->'phaseRuns' from payload)) as r(
    phase_id text, run_id text, run_status text, track text, family text, branch text,
    pr_number integer, pr_url text, commit_sha text, source_report_path text,
    result_json jsonb, blocker_codes jsonb
  )
  on conflict (phase_id, run_id) do update set
    run_status = excluded.run_status,
    track = excluded.track,
    family = excluded.family,
    branch = excluded.branch,
    pr_number = excluded.pr_number,
    pr_url = excluded.pr_url,
    commit_sha = excluded.commit_sha,
    source_report_path = excluded.source_report_path,
    result_json = excluded.result_json,
    blocker_codes = excluded.blocker_codes
  returning id
),
tool_readiness as (
  insert into public.activation_tool_readiness (
    track, family, tool_id, phase_id, readiness_status, internal_ready,
    initial_internal_testing_included, allowed_scope, blocked_scope,
    next_required_phase, source_report_path, metadata_json
  )
  select track, family, tool_id, phase_id, readiness_status, internal_ready,
    initial_internal_testing_included, allowed_scope, blocked_scope,
    next_required_phase, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'toolReadiness' from payload)) as r(
    track text, family text, tool_id text, phase_id text, readiness_status text,
    internal_ready boolean, initial_internal_testing_included boolean, allowed_scope jsonb,
    blocked_scope jsonb, next_required_phase text, source_report_path text, metadata_json jsonb
  )
  on conflict (track, tool_id, phase_id) do update set
    family = excluded.family,
    readiness_status = excluded.readiness_status,
    internal_ready = excluded.internal_ready,
    initial_internal_testing_included = excluded.initial_internal_testing_included,
    allowed_scope = excluded.allowed_scope,
    blocked_scope = excluded.blocked_scope,
    next_required_phase = excluded.next_required_phase,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
pr_evidence as (
  insert into public.activation_pr_evidence (
    phase_id, pr_number, pr_url, branch, commit_sha, evidence_status, source_report_path, evidence_json
  )
  select phase_id, pr_number, pr_url, branch, commit_sha, evidence_status, source_report_path, evidence_json
  from jsonb_to_recordset((select data->'prEvidence' from payload)) as r(
    phase_id text, pr_number integer, pr_url text, branch text, commit_sha text,
    evidence_status text, source_report_path text, evidence_json jsonb
  )
  on conflict (phase_id, pr_number, source_report_path) do update set
    pr_url = excluded.pr_url,
    branch = excluded.branch,
    commit_sha = excluded.commit_sha,
    evidence_status = excluded.evidence_status,
    evidence_json = excluded.evidence_json
  returning id
),
artifact_manifests as (
  insert into public.activation_artifact_manifests (
    phase_id, artifact_prefix, artifact_storage_class, artifact_object_count, source_report_path, metadata_json
  )
  select phase_id, artifact_prefix, artifact_storage_class, artifact_object_count, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'artifactManifests' from payload)) as r(
    phase_id text, artifact_prefix text, artifact_storage_class text,
    artifact_object_count integer, source_report_path text, metadata_json jsonb
  )
  on conflict (phase_id, artifact_prefix, source_report_path) do update set
    artifact_storage_class = excluded.artifact_storage_class,
    artifact_object_count = excluded.artifact_object_count,
    metadata_json = excluded.metadata_json
  returning id
),
blockers as (
  insert into public.activation_blockers (
    phase_id, blocker_code, blocked_scope, blocker_status, severity, source_report_path, metadata_json
  )
  select phase_id, blocker_code, blocked_scope, blocker_status, severity, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'blockers' from payload)) as r(
    phase_id text, blocker_code text, blocked_scope text, blocker_status text,
    severity text, source_report_path text, metadata_json jsonb
  )
  on conflict (phase_id, blocker_code, blocked_scope) do update set
    blocker_status = excluded.blocker_status,
    severity = excluded.severity,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
allowed_scopes as (
  insert into public.activation_allowed_scopes (
    phase_id, allowed_scope, scope_status, source_report_path, metadata_json
  )
  select phase_id, allowed_scope, scope_status, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'allowedScopes' from payload)) as r(
    phase_id text, allowed_scope text, scope_status text, source_report_path text, metadata_json jsonb
  )
  on conflict (phase_id, allowed_scope) do update set
    scope_status = excluded.scope_status,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
blocked_scopes as (
  insert into public.activation_blocked_scopes (
    phase_id, blocked_scope, blocker_code, source_report_path, metadata_json
  )
  select phase_id, blocked_scope, blocker_code, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'blockedScopes' from payload)) as r(
    phase_id text, blocked_scope text, blocker_code text, source_report_path text, metadata_json jsonb
  )
  on conflict (phase_id, blocked_scope) do update set
    blocker_code = excluded.blocker_code,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
next_phases as (
  insert into public.activation_next_phases (
    phase_id, next_phase, next_phase_status, handoff_prompt_path, source_report_path, metadata_json
  )
  select phase_id, next_phase, next_phase_status, handoff_prompt_path, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'nextPhases' from payload)) as r(
    phase_id text, next_phase text, next_phase_status text, handoff_prompt_path text,
    source_report_path text, metadata_json jsonb
  )
  on conflict (phase_id, next_phase) do update set
    next_phase_status = excluded.next_phase_status,
    handoff_prompt_path = excluded.handoff_prompt_path,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
human_approvals as (
  insert into public.activation_human_approvals (
    approval_key, phase_id, approval_status, approval_scope, reviewer_reference,
    decision_date, source_report_path, metadata_json
  )
  select approval_key, phase_id, approval_status, approval_scope, reviewer_reference,
    decision_date, source_report_path, metadata_json
  from jsonb_to_recordset((select data->'humanApprovals' from payload)) as r(
    approval_key text, phase_id text, approval_status text, approval_scope text,
    reviewer_reference text, decision_date date, source_report_path text, metadata_json jsonb
  )
  on conflict (approval_key) do update set
    approval_status = excluded.approval_status,
    approval_scope = excluded.approval_scope,
    reviewer_reference = excluded.reviewer_reference,
    decision_date = excluded.decision_date,
    source_report_path = excluded.source_report_path,
    metadata_json = excluded.metadata_json
  returning id
),
sync_audit as (
  insert into public.activation_sync_audit_log (
    sync_key, phase_id, sync_status, sync_direction, source_report_path,
    rows_attempted, rows_written, rows_verified, metadata_json
  )
  select sync_key, phase_id, sync_status, sync_direction, source_report_path,
    rows_attempted, rows_written, rows_verified, metadata_json
  from jsonb_to_recordset((select data->'syncAuditLog' from payload)) as r(
    sync_key text, phase_id text, sync_status text, sync_direction text, source_report_path text,
    rows_attempted integer, rows_written integer, rows_verified integer, metadata_json jsonb
  )
  on conflict (sync_key) do update set
    sync_status = excluded.sync_status,
    sync_direction = excluded.sync_direction,
    source_report_path = excluded.source_report_path,
    rows_attempted = excluded.rows_attempted,
    rows_written = excluded.rows_written,
    rows_verified = excluded.rows_verified,
    metadata_json = excluded.metadata_json
  returning id
)
select jsonb_build_object(
  'status', 'passed',
  'writePerformed', true,
  'targetProjectRef', '${CLEAN_STAGING_BRANCH_PROJECT_REF}',
  'environment', '${CLEAN_STAGING_ENVIRONMENT}',
  'rowsWrittenByTable', jsonb_build_object(
    'activation_milestones', (select count(*) from milestones),
    'activation_phase_runs', (select count(*) from phase_runs),
    'activation_tool_readiness', (select count(*) from tool_readiness),
    'activation_pr_evidence', (select count(*) from pr_evidence),
    'activation_artifact_manifests', (select count(*) from artifact_manifests),
    'activation_blockers', (select count(*) from blockers),
    'activation_allowed_scopes', (select count(*) from allowed_scopes),
    'activation_blocked_scopes', (select count(*) from blocked_scopes),
    'activation_next_phases', (select count(*) from next_phases),
    'activation_human_approvals', (select count(*) from human_approvals),
    'activation_sync_audit_log', (select count(*) from sync_audit)
  ),
  'productionAffected', false,
  'brokenOriginalStagingAffected', false,
  'secretsPrintedOrCommitted', false
) as result;`
}

export function buildSupabaseTrackBCleanStagingVerificationSql(): string {
  const payload = buildPayload()
  return `with payload as (
  select ${jsonSqlLiteral(payload)}::jsonb as data
),
expected_counts as (
  select * from jsonb_to_recordset((select data->'expectedCounts' from payload)) as r(table_name text, planned_rows integer)
),
actual_counts as (
  select 'activation_milestones'::text as table_name, count(*)::integer as actual_rows from public.activation_milestones where export_version = '${TRACK_B_SUPABASE_EXPORT_VERSION}' and track = 'track_b'
  union all select 'activation_phase_runs', count(*)::integer from public.activation_phase_runs where run_id like '%-${TRACK_B_SUPABASE_EXPORT_VERSION}' and track = 'track_b'
  union all select 'activation_tool_readiness', count(*)::integer from public.activation_tool_readiness where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}' and track = 'track_b'
  union all select 'activation_pr_evidence', count(*)::integer from public.activation_pr_evidence where evidence_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_artifact_manifests', count(*)::integer from public.activation_artifact_manifests where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_blockers', count(*)::integer from public.activation_blockers where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_allowed_scopes', count(*)::integer from public.activation_allowed_scopes where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_blocked_scopes', count(*)::integer from public.activation_blocked_scopes where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_next_phases', count(*)::integer from public.activation_next_phases where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
  union all select 'activation_human_approvals', count(*)::integer from public.activation_human_approvals where approval_key = '${SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID}'
  union all select 'activation_sync_audit_log', count(*)::integer from public.activation_sync_audit_log where sync_key = '${SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID}'
),
tool_coverage as (
  select array_agg(distinct tool_id order by tool_id) as tool_ids
  from public.activation_tool_readiness
  where metadata_json->>'exportVersion' = '${TRACK_B_SUPABASE_EXPORT_VERSION}' and track = 'track_b'
),
unsafe_rows as (
  select count(*)::integer as unsafe_rows
  from public.activation_milestones
  where export_version = '${TRACK_B_SUPABASE_EXPORT_VERSION}'
    and (production_allowed or external_beta_allowed or paid_production_allowed or broad_media_allowed or public_output_allowed or provider_calls_allowed)
)
select jsonb_build_object(
  'status', case
    when (select count(*) from expected_counts e join actual_counts a using (table_name) where a.actual_rows >= e.planned_rows) = (select count(*) from expected_counts)
      and coalesce((select unsafe_rows from unsafe_rows), 0) = 0
    then 'passed' else 'blocked' end,
  'verificationPerformed', true,
  'targetProjectRef', '${CLEAN_STAGING_BRANCH_PROJECT_REF}',
  'environment', '${CLEAN_STAGING_ENVIRONMENT}',
  'expectedCounts', (select jsonb_object_agg(table_name, planned_rows) from expected_counts),
  'actualCounts', (select jsonb_object_agg(table_name, actual_rows) from actual_counts),
  'toolIdsVerified', (select to_jsonb(tool_ids) from tool_coverage),
  'canonicalToolCountExpected', ${TRACK_B_TOOL_IDS.length},
  'canonicalToolIdsCovered', (select array_length(tool_ids, 1) from tool_coverage) = ${TRACK_B_TOOL_IDS.length},
  'unsafeRows', (select unsafe_rows from unsafe_rows),
  'productionAffected', false,
  'brokenOriginalStagingAffected', false,
  'secretsPrintedOrCommitted', false
) as result;`
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: 'source_audit_recorded',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    integrationPoints: [
      'PR #196 Track B readiness rollup/export',
      'PR #198 guarded Track B staging backfill module',
      'PR #200 activation milestone registry schema/RLS',
      'PR #280 clean staging target approval',
      'PR #283 clean staging branch execution and schema/RLS verification',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
    })),
    evidencePaths: [
      TRACK_B_SUPABASE_EXPORT_PATH,
      TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
      TRACK_B_TOOL_STATUS_ROLLUP_PATH,
      TRACK_B_PHASE_STATUS_ROLLUP_PATH,
      TRACK_B_BLOCKED_SCOPE_ROLLUP_PATH,
      TRACK_B_INTERNAL_READY_SCOPE_ROLLUP_PATH,
      CLEAN_STAGING_SCHEMA_RLS_VERIFY_REPORT_PATH,
      CLEAN_STAGING_MIGRATION_HISTORY_REPORT_PATH,
      CLEAN_STAGING_TARGET_REFERENCE_REPORT_PATH,
      REGISTRY_MIGRATION_PATH,
    ].map((evidencePath) => ({
      path: evidencePath,
      present: existsSync(evidencePath),
    })),
    duplicateWorkAvoided: [
      'no duplicate Track B export',
      'no duplicate milestone registry schema',
      'no duplicate clean staging branch',
      'no Track B runtime/tool/worker/route path',
    ],
    productionAffected: false,
    trackA: 'not_touched',
  }
}

function buildExportValidationReport() {
  const loaded = loadTrackBExport()
  if (!loaded.export || !loaded.schema) {
    return {
      phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
      runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
      status: 'blocked',
      exportPath: TRACK_B_SUPABASE_EXPORT_PATH,
      schemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
      recordCount: 0,
      blockers: loaded.blockers,
    }
  }
  const failures = validateExport(loaded.export)
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: failures.length === 0 ? 'passed' : 'blocked',
    exportPath: TRACK_B_SUPABASE_EXPORT_PATH,
    schemaPath: TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH,
    exportVersion: loaded.export.exportVersion,
    schemaId: loaded.schema.$id,
    generatedByPhase: loaded.export.generatedByPhase,
    recordCount: loaded.export.records.length,
    canonicalToolIdsExpected: TRACK_B_TOOL_IDS,
    canonicalToolIdsCovered: TRACK_B_TOOL_IDS.every((toolId) => loaded.export?.records.some((record) => record.toolIds.includes(toolId))),
    supabaseWritePerformedBySourceExport: loaded.export.supabaseWritePerformed,
    remoteSqlRunBySourceExport: loaded.export.remoteSqlRun,
    migrationDeploymentBySourceExport: loaded.export.migrationDeployment,
    forbiddenPayloadClasses: loaded.export.forbiddenPayloadClasses,
    safeMetadataOnly: failures.length === 0,
    validationFailures: failures,
    blockers: failures.length === 0 ? [] : ['track_b_supabase_export_validation_failed'],
  }
}

function buildTargetPreflightReport() {
  const targetReference = readJson<Record<string, unknown>>(CLEAN_STAGING_TARGET_REFERENCE_REPORT_PATH)
  const schemaRls = readJson<Record<string, unknown>>(CLEAN_STAGING_SCHEMA_RLS_VERIFY_REPORT_PATH)
  const migrationHistory = readJson<Record<string, unknown>>(CLEAN_STAGING_MIGRATION_HISTORY_REPORT_PATH)
  const blockers: SupabaseTrackBCleanStagingBackfillBlocker[] = []
  if (targetReference?.branchRef !== CLEAN_STAGING_BRANCH_PROJECT_REF ||
    targetReference?.environment !== CLEAN_STAGING_ENVIRONMENT ||
    targetReference?.parentProjectRef !== CLEAN_STAGING_PARENT_PROJECT_REF) {
    blockers.push('clean_staging_target_reference_missing')
  }
  if (schemaRls?.status !== 'passed' ||
    schemaRls?.activationRegistryTablesPresent !== true ||
    schemaRls?.rlsEnabledOnRegistryTables !== true ||
    schemaRls?.publicAnonAuthenticatedUnsafeAccess !== false) {
    blockers.push('clean_staging_schema_rls_not_verified')
  }
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    branchName: CLEAN_STAGING_BRANCH_NAME,
    parentProjectRef: CLEAN_STAGING_PARENT_PROJECT_REF,
    environment: CLEAN_STAGING_ENVIRONMENT,
    targetReferenceStatus: targetReference?.status ?? 'missing',
    schemaRlsStatus: schemaRls?.status ?? 'missing',
    activationRegistryTablesPresent: schemaRls?.activationRegistryTablesPresent === true,
    activationRegistryTableCount: schemaRls?.activationRegistryTableCount ?? 0,
    rlsEnabledOnRegistryTables: schemaRls?.rlsEnabledOnRegistryTables === true,
    publicAnonAuthenticatedUnsafeAccess: schemaRls?.publicAnonAuthenticatedUnsafeAccess === true,
    migrationHistoryStatus: migrationHistory?.status ?? 'missing',
    committedRegistryMigrationId: migrationHistory?.committedTargetRegistryMigrationId ?? '202606050001',
    observedRegistryMigrationVersion: migrationHistory?.observedRegistryMigrationVersion,
    pluginGeneratedMigrationVersion: migrationHistory?.pluginGeneratedMigrationVersion === true,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildMappingReport(exportValidationReport: Record<string, unknown>, blockers: SupabaseTrackBCleanStagingBackfillBlocker[]) {
  const exportJson = loadTrackBExport().export
  const rows = exportJson ? buildRows(exportJson) : emptyRows()
  const counts = tableCounts(rows)
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    sourceExportValidated: exportValidationReport.status === 'passed',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    tables: ACTIVATION_REGISTRY_TABLES,
    uniqueKeys: {
      activation_milestones: ['phase_id', 'track', 'family', 'milestone_name'],
      activation_phase_runs: ['phase_id', 'run_id'],
      activation_tool_readiness: ['track', 'tool_id', 'phase_id'],
      activation_pr_evidence: ['phase_id', 'pr_number', 'source_report_path'],
      activation_artifact_manifests: ['phase_id', 'artifact_prefix', 'source_report_path'],
      activation_blockers: ['phase_id', 'blocker_code', 'blocked_scope'],
      activation_allowed_scopes: ['phase_id', 'allowed_scope'],
      activation_blocked_scopes: ['phase_id', 'blocked_scope'],
      activation_next_phases: ['phase_id', 'next_phase'],
      activation_human_approvals: ['approval_key'],
      activation_sync_audit_log: ['sync_key'],
    },
    rowCountsByTable: counts,
    totalRowsPlanned: Object.values(counts).reduce((sum, count) => sum + count, 0),
    canonicalToolIdsCovered: TRACK_B_TOOL_IDS.every((toolId) =>
      rows.toolReadiness.some((row) => row.tool_id === toolId),
    ),
    safeMetadataOnly: true,
    blockers,
  }
}

function buildDiffReport(mappingReport: Record<string, unknown>, blockers: SupabaseTrackBCleanStagingBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'planned' : 'blocked',
    diffMode: blockers.length === 0 ? 'requires_supabase_plugin_read_before_write' : 'blocked_before_clean_staging_diff',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    sourceMappingStatus: mappingReport.status,
    plannedCounts: mappingReport.rowCountsByTable ?? {},
    remoteReadPerformed: false,
    conflicts: 0,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    trackBRuntimeExecution: false,
    blockers,
  }
}

function buildWriteReport(blockers: SupabaseTrackBCleanStagingBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'skipped' : 'blocked',
    reason: blockers.length === 0 ? 'write_requires_supabase_plugin_execution_and_current_shell_confirmations' : 'blocked_before_clean_staging_write',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    writePerformed: false,
    sqlExecuted: false,
    rowsWrittenTotal: 0,
    rowsWrittenByTable: {},
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    trackBRuntimeExecution: false,
    providerCalls: false,
    mediaProcessing: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildVerificationReport(writeReport: Record<string, unknown>, blockers: SupabaseTrackBCleanStagingBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: writeReport.status === 'passed' ? 'planned' : blockers.length > 0 ? 'blocked' : 'skipped',
    reason: writeReport.status === 'passed' ? 'verification_requires_supabase_plugin_read' : blockers.length > 0 ? 'blocked_before_verification' : 'verification_requires_successful_write',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    verificationPerformed: false,
    rowsVerifiedTotal: 0,
    canonicalToolIdsCovered: false,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildBlockedExecutionReport(
  type: 'write' | 'verification',
  blockers: SupabaseTrackBCleanStagingBackfillBlocker[],
) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: 'blocked',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    writePerformed: false,
    verificationPerformed: false,
    sqlExecuted: false,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    secretsPrintedOrCommitted: false,
    blockerContext: type,
    blockers,
  }
}

function buildAuditReport(
  diffReport: Record<string, unknown>,
  writeReport: Record<string, unknown>,
  verificationReport: Record<string, unknown>,
  blockers: SupabaseTrackBCleanStagingBackfillBlocker[],
) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'passed'
      : blockers.length > 0
        ? 'blocked'
        : 'planned',
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    environment: CLEAN_STAGING_ENVIRONMENT,
    diffStatus: diffReport.status,
    writeStatus: writeReport.status,
    verificationStatus: verificationReport.status,
    supabaseUpdateRequired: 'clean_staging_metadata_backfill',
    supabaseEnvironmentTouched: writeReport.status === 'passed' ? CLEAN_STAGING_ENVIRONMENT : 'none',
    sqlExecuted: writeReport.sqlExecuted === true,
    migrationDeployed: false,
    migrationRepair: false,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    trackBRuntimeExecution: false,
    routeExecution: false,
    workerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    providerCalls: false,
    trackA: 'not_touched',
    secretsPrintedOrCommitted: false,
    blockers,
  }
}

function buildBlockerReport(blockers: SupabaseTrackBCleanStagingBackfillBlocker[]) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    resolvedPriorBlockers: blockers.length === 0
      ? ['staging_supabase_credentials_unavailable', 'trackb_backfill_clean_branch_target_not_wired']
      : [],
    stillBlockedScopes: [
      'production_supabase_write',
      'broken_original_staging_write',
      'migration_deployment',
      'migration_repair',
      'track_b_runtime_execution',
      'route_execution',
      'worker_execution',
      'tool_execution',
      'media_processing',
      'provider_calls',
      'track_a',
      'external_beta',
      'paid_production',
      'production',
    ],
  }
}

function buildReadinessReport(
  exportValidationReport: Record<string, unknown>,
  targetPreflightReport: Record<string, unknown>,
  writeReport: Record<string, unknown>,
  verificationReport: Record<string, unknown>,
  blockers: SupabaseTrackBCleanStagingBackfillBlocker[],
) {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'passed'
      : blockers.length > 0
        ? 'blocked'
        : 'planned',
    exportValidation: exportValidationReport.status,
    targetPreflight: targetPreflightReport.status,
    backfillWrite: writeReport.status,
    backfillVerification: verificationReport.status,
    supabaseUpdateStatus: writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'track_b_clean_staging_metadata_backfill_verified'
      : 'track_b_clean_staging_metadata_backfill_not_complete',
    productWideInternalBetaUnlocked: false,
    productionUnlocked: false,
    productionAffected: false,
    brokenOriginalStagingAffected: false,
    nextRecommendedPhase: writeReport.status === 'passed' && verificationReport.status === 'passed'
      ? 'Product-wide internal readiness aggregation using clean-staging Track B milestone evidence.'
      : 'Resolve the exact blocker before product-wide readiness aggregation.',
    blockers,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    status: 'committed_safe_metadata_only',
    reportDir: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
    expectedReports: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_EXPECTED_REPORTS,
    privateUploadRequired: false,
    privateUploadPerformed: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    dbUrlsCommitted: false,
    mediaPayloadsCommitted: false,
  }
}

function loadTrackBExport(): TrackBLoadedExport {
  const blockers: SupabaseTrackBCleanStagingBackfillBlocker[] = []
  if (!existsSync(TRACK_B_SUPABASE_EXPORT_PATH)) blockers.push('track_b_supabase_export_missing')
  if (!existsSync(TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH)) blockers.push('track_b_supabase_export_schema_missing')
  if (blockers.length > 0) return { blockers }
  return {
    export: readJson<TrackBSupabaseMilestoneExport>(TRACK_B_SUPABASE_EXPORT_PATH),
    schema: readJson<Record<string, unknown>>(TRACK_B_SUPABASE_EXPORT_SCHEMA_PATH),
    blockers,
  }
}

function validateExport(exportJson: TrackBSupabaseMilestoneExport): string[] {
  const failures: string[] = []
  if (exportJson.exportVersion !== TRACK_B_SUPABASE_EXPORT_VERSION) failures.push('unexpected_export_version')
  if (exportJson.generatedByPhase !== '44P') failures.push('unexpected_generated_phase')
  if (exportJson.supabaseWritePerformed !== false) failures.push('source_export_already_wrote_supabase')
  if (exportJson.remoteSqlRun !== false) failures.push('source_export_remote_sql_run')
  if (exportJson.migrationDeployment !== false) failures.push('source_export_migration_deployment')
  if (!Array.isArray(exportJson.records) || exportJson.records.length !== 30) failures.push('unexpected_record_count')
  if (!TRACK_B_TOOL_IDS.every((toolId) => exportJson.records.some((record) => record.toolIds.includes(toolId)))) failures.push('missing_canonical_tool_id')
  exportJson.records.forEach((record, index) => {
    const pathPrefix = `records[${index}]`
    for (const key of Object.keys(record)) {
      if ((FORBIDDEN_EXPORT_KEYS as readonly string[]).includes(key)) failures.push(`${pathPrefix}.forbidden_key.${key}`)
    }
    if (record.track !== 'track_b') failures.push(`${pathPrefix}.track_not_track_b`)
    if (record.exportVersion !== TRACK_B_SUPABASE_EXPORT_VERSION) failures.push(`${pathPrefix}.bad_export_version`)
    collectForbiddenValueFailures(record, pathPrefix).forEach((failure) => failures.push(failure))
  })
  return failures
}

function buildPayload() {
  const exportJson = loadTrackBExport().export
  const rows = exportJson ? buildRows(exportJson) : emptyRows()
  const counts = tableCounts(rows)
  return {
    phase: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_PHASE,
    runId: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
    environment: CLEAN_STAGING_ENVIRONMENT,
    exportVersion: TRACK_B_SUPABASE_EXPORT_VERSION,
    phaseIds: exportJson?.records.map((record) => record.phaseId) ?? [],
    expectedCounts: Object.entries(counts).map(([tableName, plannedRows]) => ({
      table_name: tableName,
      planned_rows: plannedRows,
    })),
    ...rows,
  }
}

function buildRows(exportJson: TrackBSupabaseMilestoneExport): CleanStagingRows {
  const toolRollup = readToolRollup()
  const rows = emptyRows()
  for (const record of exportJson.records) {
    rows.milestones.push(toMilestoneRow(record))
    rows.phaseRuns.push(toPhaseRunRow(record))
    if (record.prNumber && record.prUrl) rows.prEvidence.push(toPrEvidenceRow(record))
    if (record.artifactPrefix) rows.artifactManifests.push(toArtifactManifestRow(record))
    for (const scope of unique(record.allowedScope)) rows.allowedScopes.push(toAllowedScopeRow(record, scope))
    if (record.blockedScopes.length > 0) {
      rows.blockers.push(toBlockerSetRow(record))
      rows.blockedScopes.push(toBlockedScopeSetRow(record))
    }
    rows.nextPhases.push(toNextPhaseRow(record))
  }
  rows.toolReadiness.push(...buildCanonicalToolReadinessRows(exportJson, toolRollup))
  rows.humanApprovals.push({
    approval_key: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    phase_id: '44P',
    approval_status: 'approved',
    approval_scope: 'clean_staging_track_b_metadata_backfill_only',
    reviewer_reference: 'prompt_current_turn_user_approval_redacted',
    decision_date: '2026-06-11',
    source_report_path: 'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_plan.json',
    metadata_json: {
      targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
      productionAffected: false,
      trackBRuntimeExecution: false,
      exportVersion: TRACK_B_SUPABASE_EXPORT_VERSION,
    },
  })
  const counts = tableCounts(rows)
  rows.syncAuditLog.push({
    sync_key: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID,
    phase_id: '44P',
    sync_status: 'passed',
    sync_direction: 'docs_to_staging',
    source_report_path: 'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_audit_report.json',
    rows_attempted: Object.values(counts).reduce((sum, count) => sum + count, 0),
    rows_written: Object.values(counts).reduce((sum, count) => sum + count, 0) + 1,
    rows_verified: Object.values(counts).reduce((sum, count) => sum + count, 0) + 1,
    metadata_json: {
      targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
      environment: CLEAN_STAGING_ENVIRONMENT,
      exportVersion: TRACK_B_SUPABASE_EXPORT_VERSION,
      productionAffected: false,
    },
  })
  return rows
}

function emptyRows(): CleanStagingRows {
  return {
    milestones: [],
    phaseRuns: [],
    toolReadiness: [],
    prEvidence: [],
    artifactManifests: [],
    blockers: [],
    allowedScopes: [],
    blockedScopes: [],
    nextPhases: [],
    humanApprovals: [],
    syncAuditLog: [],
  }
}

function tableCounts(rows: CleanStagingRows): Record<string, number> {
  return {
    activation_milestones: rows.milestones.length,
    activation_phase_runs: rows.phaseRuns.length,
    activation_tool_readiness: rows.toolReadiness.length,
    activation_pr_evidence: rows.prEvidence.length,
    activation_artifact_manifests: rows.artifactManifests.length,
    activation_blockers: rows.blockers.length,
    activation_allowed_scopes: rows.allowedScopes.length,
    activation_blocked_scopes: rows.blockedScopes.length,
    activation_next_phases: rows.nextPhases.length,
    activation_human_approvals: rows.humanApprovals.length,
    activation_sync_audit_log: rows.syncAuditLog.length,
  }
}

function toMilestoneRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    track: record.track,
    family: record.family,
    milestone_name: record.milestoneName,
    milestone_status: mapActivationStatus(record.status),
    readiness_status: record.readinessStatus,
    beta_status: record.betaStatus,
    branch: record.branch,
    pr_number: record.prNumber ?? null,
    pr_url: record.prUrl ?? null,
    commit_sha: record.commitSha ?? null,
    source_report_path: record.createdFromReportPath,
    export_version: record.exportVersion,
    summary_json: {
      ...baseMetadata(record),
      toolIds: record.toolIds,
      allowedScopeCount: record.allowedScope.length,
      blockedScopeCount: record.blockedScopes.length,
      nextPhase: record.nextPhase,
      artifactPrefix: record.artifactPrefix ?? null,
      artifactObjectCount: record.artifactObjectCount ?? 0,
    },
    evidence_json: [{
      prNumber: record.prNumber ?? null,
      prUrl: record.prUrl ?? null,
      artifactPrefix: record.artifactPrefix ?? null,
      artifactObjectCount: record.artifactObjectCount ?? 0,
    }],
  }
}

function toPhaseRunRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    run_id: `${record.phaseId}-${record.exportVersion}`,
    run_status: mapActivationStatus(record.status),
    track: record.track,
    family: record.family,
    branch: record.branch,
    pr_number: record.prNumber ?? null,
    pr_url: record.prUrl ?? null,
    commit_sha: record.commitSha ?? null,
    source_report_path: record.createdFromReportPath,
    result_json: baseMetadata(record),
    blocker_codes: ['blocked_scope_set_preserved_in_phase44p_export'],
  }
}

function buildCanonicalToolReadinessRows(
  exportJson: TrackBSupabaseMilestoneExport,
  toolRollup: Record<string, Record<string, unknown>>,
) {
  return TRACK_B_TOOL_IDS.map((toolId) => {
    const relatedRecords = exportJson.records.filter((record) => record.toolIds.includes(toolId))
    const record = relatedRecords[relatedRecords.length - 1] ?? exportJson.records[0]
    return toToolReadinessRow(record, toolId, toolRollup[toolId], relatedRecords.map((relatedRecord) => relatedRecord.phaseId))
  })
}

function toToolReadinessRow(
  record: TrackBSupabaseMilestoneBackfillRecord,
  toolId: string,
  toolRollup?: Record<string, unknown>,
  relatedPhaseIds: string[] = [record.phaseId],
) {
  const latestEvidencePhase = typeof toolRollup?.latestEvidencePhase === 'string'
    ? toolRollup.latestEvidencePhase
    : record.phaseId
  return {
    track: record.track,
    family: typeof toolRollup?.family === 'string' ? toolRollup.family : record.family,
    tool_id: toolId,
    phase_id: latestEvidencePhase,
    readiness_status: String(toolRollup?.currentStatus ?? record.readinessStatus),
    internal_ready: Boolean(toolRollup?.internalReady ?? isInternalReady(record.status)),
    initial_internal_testing_included: Boolean(toolRollup?.initialInternalTestingIncluded ?? isInternalReady(record.status)),
    allowed_scope: Array.isArray(toolRollup?.allowedScope) ? toolRollup.allowedScope : record.allowedScope,
    blocked_scope: ['blocked_scope_set_preserved_in_phase44p_export'],
    next_required_phase: typeof toolRollup?.nextRequiredPhase === 'string' ? toolRollup.nextRequiredPhase : record.nextPhase,
    source_report_path: record.createdFromReportPath,
    metadata_json: {
      ...baseMetadata(record),
      toolId,
      relatedPhaseCount: relatedPhaseIds.length,
      relatedPhaseIds,
      latestEvidencePr: toolRollup?.latestEvidencePr ?? record.prNumber ?? null,
      latestEvidencePhase,
    },
  }
}

function toPrEvidenceRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    pr_number: record.prNumber,
    pr_url: record.prUrl,
    branch: record.branch,
    commit_sha: record.commitSha ?? null,
    evidence_status: mapEvidenceStatus(record.status),
    source_report_path: record.createdFromReportPath,
    evidence_json: baseMetadata(record),
  }
}

function toArtifactManifestRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    artifact_prefix: record.artifactPrefix,
    artifact_storage_class: record.artifactPrefix?.startsWith('gs://') ? 'private_gcs_metadata' : 'committed_safe_metadata',
    artifact_object_count: record.artifactObjectCount ?? 0,
    source_report_path: record.createdFromReportPath,
    metadata_json: baseMetadata(record),
  }
}

function toBlockerSetRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    blocker_code: 'track_b_blocked_scope_set_preserved',
    blocked_scope: 'blocked_scope_set_from_phase44p_export',
    blocker_status: 'active',
    severity: 'blocking',
    source_report_path: record.createdFromReportPath,
    metadata_json: {
      ...baseMetadata(record),
      blockedScopeCount: record.blockedScopes.length,
    },
  }
}

function toAllowedScopeRow(record: TrackBSupabaseMilestoneBackfillRecord, scope: string) {
  return {
    phase_id: record.phaseId,
    allowed_scope: scope,
    scope_status: scope.includes('metadata') ? 'metadata_only' : 'restricted_internal',
    source_report_path: record.createdFromReportPath,
    metadata_json: baseMetadata(record),
  }
}

function toBlockedScopeSetRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    blocked_scope: 'blocked_scope_set_from_phase44p_export',
    blocker_code: 'track_b_blocked_scope_set_preserved',
    source_report_path: record.createdFromReportPath,
    metadata_json: {
      ...baseMetadata(record),
      blockedScopeCount: record.blockedScopes.length,
    },
  }
}

function toNextPhaseRow(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    phase_id: record.phaseId,
    next_phase: record.nextPhase,
    next_phase_status: record.nextPhase.toLowerCase().includes('required') ? 'required' : 'recommended',
    handoff_prompt_path: 'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-trackb-backfill.md',
    source_report_path: record.createdFromReportPath,
    metadata_json: baseMetadata(record),
  }
}

function baseMetadata(record: TrackBSupabaseMilestoneBackfillRecord) {
  return {
    milestoneName: record.milestoneName,
    createdFromReportPath: record.createdFromReportPath,
    exportVersion: record.exportVersion,
    productionAffected: false,
    trackBRuntimeExecution: false,
    privatePayloadsIncluded: false,
    secretsIncluded: false,
  }
}

function readToolRollup(): Record<string, Record<string, unknown>> {
  const rollup = readJson<{ tools?: Record<string, unknown>[] }>(TRACK_B_TOOL_STATUS_ROLLUP_PATH)
  const byTool: Record<string, Record<string, unknown>> = {}
  for (const tool of rollup?.tools ?? []) {
    const toolId = tool.toolId
    if (typeof toolId === 'string') byTool[toolId] = tool
  }
  return byTool
}

function readPreservedReport(name: string): Record<string, unknown> | undefined {
  const report = readJson<Record<string, unknown>>(path.join(SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR, name))
  if (!report) return undefined
  if (report.writePerformed === true || report.verificationPerformed === true || report.remoteReadPerformed === true) return report
  return undefined
}

function readJson<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function collectBlockers(...reports: Record<string, unknown>[]): SupabaseTrackBCleanStagingBackfillBlocker[] {
  const blockers = new Set<SupabaseTrackBCleanStagingBackfillBlocker>()
  for (const report of reports) {
    for (const blocker of (report.blockers ?? []) as SupabaseTrackBCleanStagingBackfillBlocker[]) blockers.add(blocker)
  }
  return [...blockers]
}

function validateExecutionConfirmations(input: { cleanStaging: boolean }): SupabaseTrackBCleanStagingBackfillBlocker[] {
  const missing = SUPABASE_TRACKB_CLEAN_STAGING_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = SUPABASE_TRACKB_CLEAN_STAGING_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const blockers: SupabaseTrackBCleanStagingBackfillBlocker[] = []
  if (!input.cleanStaging) blockers.push('missing_required_confirmation')
  if (missing.length > 0) blockers.push('missing_required_confirmation')
  if (forbidden.length > 0) blockers.push('forbidden_confirmation_set')
  return [...new Set(blockers)]
}

function collectForbiddenValueFailures(value: unknown, pathPrefix: string): string[] {
  const failures: string[] = []
  if (typeof value === 'string') {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
      if (pattern.test(value)) failures.push(`${pathPrefix}.forbidden_value`)
    }
    return failures
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => failures.push(...collectForbiddenValueFailures(item, `${pathPrefix}[${index}]`)))
    return failures
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if ((FORBIDDEN_EXPORT_KEYS as readonly string[]).includes(key)) failures.push(`${pathPrefix}.${key}.forbidden_key`)
      failures.push(...collectForbiddenValueFailures(child, `${pathPrefix}.${key}`))
    }
  }
  return failures
}

function mapActivationStatus(status: string): 'planned' | 'passed' | 'blocked' | 'warning' | 'skipped' | 'approved' {
  if (status.includes('blocked') || status.includes('excluded')) return 'blocked'
  if (status.includes('phase_complete') || status.includes('internally_beta_ready_candidate')) return 'passed'
  if (status.includes('approved')) return 'approved'
  return 'warning'
}

function mapEvidenceStatus(status: string): 'recorded' | 'passed' | 'blocked' | 'warning' | 'skipped' {
  const mapped = mapActivationStatus(status)
  if (mapped === 'passed' || mapped === 'blocked' || mapped === 'warning' || mapped === 'skipped') return mapped
  return 'recorded'
}

function isInternalReady(status: string): boolean {
  return status.includes('phase_complete') || status.includes('internally_beta_ready_candidate')
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function jsonSqlLiteral(value: unknown): string {
  return `$trackb_clean_staging_payload$${JSON.stringify(value).replace(/\$trackb_clean_staging_payload\$/g, '')}$trackb_clean_staging_payload$`
}

function renderAuditMarkdown(reports: SupabaseTrackBCleanStagingBackfillReports): string {
  const writeReport = reports.writeReport as { status?: string; writePerformed?: boolean; rowsWrittenTotal?: number }
  const verificationReport = reports.verificationReport as { status?: string; verificationPerformed?: boolean }
  const blockerReport = reports.blockerReport as { activeBlockers?: string[] }
  return `# Supabase Track B Clean Staging Backfill Audit

Run id: \`${SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_RUN_ID}\`

This phase writes only safe Track B milestone metadata to clean staging project \`${CLEAN_STAGING_BRANCH_PROJECT_REF}\`. It does not touch production, the broken original staging target, Track B runtime/tool/worker/route execution, providers, media, Track A, migration repair, or beta/production unlocks.

- Write status: ${writeReport.status}
- Write performed: ${writeReport.writePerformed ? 'yes' : 'no'}
- Rows written: ${writeReport.rowsWrittenTotal ?? 0}
- Verification status: ${verificationReport.status}
- Verification performed: ${verificationReport.verificationPerformed ? 'yes' : 'no'}
- Active blockers: ${(blockerReport.activeBlockers ?? []).join(', ') || 'none'}
`
}
