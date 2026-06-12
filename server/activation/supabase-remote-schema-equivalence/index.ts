import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ParsedMigrationIntent,
  RemoteSchemaEquivalenceBlocker,
  RemoteSchemaEquivalenceDecision,
  RemoteSchemaEquivalenceOverall,
} from './remote-schema-equivalence-types'

export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE = 'supabase-remote-schema-equivalence-review'
export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID =
  'supabase-remote-schema-equivalence-review-20260608'
export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR =
  'docs/activation-supabase-remote-schema-equivalence-reports'
export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REVIEW'
export const SUPABASE_REMOTE_SCHEMA_READONLY_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_READONLY_INSPECTION'
export const SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT'

export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'remote_schema_equivalence_plan.json',
  'local_missing_migration_intent_inventory.json',
  'remote_staging_schema_introspection_report.json',
  'remote_schema_equivalence_comparison_report.json',
  'migration_history_repair_approval_after_equivalence_review.json',
  'remote_schema_equivalence_blocker_report.json',
  'remote_schema_equivalence_readiness_report.json',
  'remote_schema_equivalence_private_artifact_manifest.json',
] as const

export const SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_DOCS = [
  'docs/supabase-migration-history-repair-equivalence-decision.md',
  'docs/implementation-prompts/prompt-supabase-staging-migration-history-repair-execution.md',
] as const

const REPAIR_APPROVAL_REPORT_DIR = 'docs/activation-supabase-migration-history-repair-approval-reports'
const PR223_REPORT_DIR = 'docs/activation-supabase-staging-deploy-transport-reports'
const MIGRATION_DIR = path.join('supabase', 'migrations')
const APPROVED_STAGING_PROJECT_REF = 'wmyyttnynmteqgcdishd'
const APPROVED_DB_URL_ENV_NAMES = [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
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
type RemoteCatalog = {
  tables: JsonRecord[]
  columns: JsonRecord[]
  constraints: JsonRecord[]
  indexes: JsonRecord[]
  policies: JsonRecord[]
  rls: JsonRecord[]
  triggers: JsonRecord[]
  functions: JsonRecord[]
  types: JsonRecord[]
  extensions: JsonRecord[]
  storageBuckets: JsonRecord[]
  migrationHistory: JsonRecord[]
}

export function getSupabaseRemoteSchemaEquivalencePlan() {
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    branch: 'codex/rp-foundation-supabase-remote-schema-equivalence-review',
    baseBranch: 'codex/rp-foundation-supabase-migration-history-repair-approval',
    prTitle: '[foundation] Supabase remote schema equivalence review',
    reportDir: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
    expectedReports: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS,
    docs: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourcePrs: [196, 198, 200, 223, 238],
    docsBasis: {
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      cliReference: 'https://supabase.com/docs/reference/cli/introduction',
      changelog: 'https://supabase.com/changelog.md',
      changelogCheckedAt: '2026-06-08',
      migrationRepairBreakingChangeBlockingThisPacket: false,
    },
    allowedConfirmations: [
      SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_CONFIRMATION,
      SUPABASE_REMOTE_SCHEMA_READONLY_CONFIRMATION,
      SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedActions: [
      'read_committed_pr_223_reports',
      'read_committed_pr_238_reports',
      'read_local_migration_sql',
      'run_readonly_staging_catalog_introspection_when_confirmed',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'supabase_migration_repair',
      'supabase_db_push',
      'direct_ddl_dml',
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

export function buildSupabaseRemoteSchemaEquivalenceReports(input: {
  executeReadonly?: boolean
  forceFreshIntrospection?: boolean
} = {}) {
  const plan = getSupabaseRemoteSchemaEquivalencePlan()
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const priorEvidence = loadPriorEvidence()
  const localInventory = buildLocalMissingMigrationIntentInventory(priorEvidence.repairVersions)
  const remoteIntrospection = input.executeReadonly
    ? runRemoteSchemaIntrospection()
    : loadExistingRemoteIntrospectionReport() ?? buildNotExecutedIntrospectionReport()
  const comparison = buildRemoteSchemaEquivalenceComparison(localInventory, remoteIntrospection)
  const approvalDecision = buildApprovalAfterEquivalenceReview(comparison)
  const blockerReport = buildBlockerReport(remoteIntrospection, comparison, approvalDecision)
  const readinessReport = buildReadinessReport(approvalDecision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()

  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan,
    localMissingMigrationIntentInventory: localInventory,
    remoteStagingSchemaIntrospectionReport: remoteIntrospection,
    remoteSchemaEquivalenceComparisonReport: comparison,
    migrationHistoryRepairApprovalAfterEquivalenceReview: approvalDecision,
    remoteSchemaEquivalenceBlockerReport: blockerReport,
    remoteSchemaEquivalenceReadinessReport: readinessReport,
    remoteSchemaEquivalencePrivateArtifactManifest: privateArtifactManifest,
  }
}

export async function writeSupabaseRemoteSchemaEquivalenceArtifacts(
  reports: ReturnType<typeof buildSupabaseRemoteSchemaEquivalenceReports>,
) {
  const dir = SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'remote_schema_equivalence_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'local_missing_migration_intent_inventory.json'),
    reports.localMissingMigrationIntentInventory,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'remote_staging_schema_introspection_report.json'),
    reports.remoteStagingSchemaIntrospectionReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'remote_schema_equivalence_comparison_report.json'),
    reports.remoteSchemaEquivalenceComparisonReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'migration_history_repair_approval_after_equivalence_review.json'),
    reports.migrationHistoryRepairApprovalAfterEquivalenceReview,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'remote_schema_equivalence_blocker_report.json'),
    reports.remoteSchemaEquivalenceBlockerReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'remote_schema_equivalence_readiness_report.json'),
    reports.remoteSchemaEquivalenceReadinessReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(dir, 'remote_schema_equivalence_private_artifact_manifest.json'),
    reports.remoteSchemaEquivalencePrivateArtifactManifest,
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-migration-history-repair-equivalence-decision.md',
    renderEquivalenceDecisionMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-migration-history-repair-execution.md',
    renderRepairExecutionHandoffPrompt(reports),
  )
}

export async function executeSupabaseRemoteSchemaEquivalenceReview(input: { readonlyMode: boolean; keepTemp: boolean }) {
  void input.keepTemp
  const reports = buildSupabaseRemoteSchemaEquivalenceReports({
    executeReadonly: input.readonlyMode,
    forceFreshIntrospection: true,
  })
  await writeSupabaseRemoteSchemaEquivalenceArtifacts(reports)
  return {
    reports,
    exitCode: reports.remoteSchemaEquivalenceBlockerReport.forbiddenConfirmationSet ? 1 : 0,
  }
}

export function readSupabaseRemoteSchemaEquivalenceSummary() {
  const reports = buildSupabaseRemoteSchemaEquivalenceReports()
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: reports.remoteSchemaEquivalenceReadinessReport.status,
    decision: reports.migrationHistoryRepairApprovalAfterEquivalenceReview.decision,
    overallEquivalence: reports.remoteSchemaEquivalenceComparisonReport.overallEquivalence,
    missingHistoryEntries:
      reports.localMissingMigrationIntentInventory.missingMigrationVersions.length,
    remoteIntrospectionStatus: reports.remoteStagingSchemaIntrospectionReport.status,
    equivalentMigrationCount:
      reports.remoteSchemaEquivalenceComparisonReport.perMigrationResults.filter(
        (result: JsonRecord) => result.equivalent === true,
      ).length,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.remoteSchemaEquivalenceBlockerReport.activeBlockers,
    nextRecommendedPhase: reports.remoteSchemaEquivalenceReadinessReport.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: 'passed',
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: [
      'TRACK_B_MEDIA_PROCESSING',
      'OBSERVABILITY_AUDIT_COST',
      'WORKER_RUNTIME_JOBS',
    ],
    explicitlyNotOwned: [
      'track_b_runtime_tool_execution',
      'track_a_visual_video_pipeline',
      'provider_model_execution',
      'frontend_ux',
      'product_beta_or_production_unlock',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      exists: existsSync(sourcePath),
      type: existsSync(sourcePath) && readdirSafe(sourcePath).length > 0 ? 'directory_or_nonempty' : 'file_or_missing',
    })),
    integrationPoints: [
      'PR #196 Track B readiness rollup/export',
      'PR #198 guarded Track B staging backfill module',
      'PR #200 milestone registry schema/RLS migration',
      'PR #223 deploy transport and migration-history audit',
      'PR #238 migration-history repair approval packet',
    ],
    sqlExecuted: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function loadPriorEvidence() {
  const candidate = readJson(path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_repair_candidate_plan.json'))
  const repairComparison = readJson(path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_local_remote_comparison.json'))
  const stagingComparison = readJson(path.join(PR223_REPORT_DIR, 'staging_local_remote_migration_comparison_report.json'))
  const repairVersions = readStringArray(candidate, 'repairVersions')
  return {
    candidate,
    repairComparison,
    stagingComparison,
    repairVersions,
  }
}

function buildLocalMissingMigrationIntentInventory(migrationVersions: string[]) {
  const parsedMigrations = migrationVersions.map(parseMigrationIntent)
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: parsedMigrations.some((migration) => migration.status !== 'parsed') ? 'blocked' : 'passed',
    sourceReports: [
      path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_repair_candidate_plan.json'),
      path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_local_remote_comparison.json'),
      path.join(PR223_REPORT_DIR, 'staging_local_remote_migration_comparison_report.json'),
    ],
    missingMigrationVersions: migrationVersions,
    missingMigrationCount: migrationVersions.length,
    parsedMigrationCount: parsedMigrations.filter((migration) => migration.status === 'parsed').length,
    migrations: parsedMigrations,
    blockers: unique(
      parsedMigrations.flatMap((migration) => migration.blockers),
    ),
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function parseMigrationIntent(version: string): ParsedMigrationIntent {
  const migrationFile = findMigrationFile(version)
  if (!migrationFile) {
    return emptyMigrationIntent(version, 'missing_file', ['migration_intent_unparsed'])
  }

  const text = readFileSync(migrationFile, 'utf8')
  const lower = text.toLowerCase()
  const expectedColumns = extractExpectedColumns(text)
  const tables = extractQualifiedMatches(text, /create\s+table\s+if\s+not\s+exists\s+([a-z_][\w]*)\.([a-z_][\w]*)/gi)
  const rlsTables = extractQualifiedMatches(text, /alter\s+table\s+([a-z_][\w]*)\.([a-z_][\w]*)\s+enable\s+row\s+level\s+security/gi)
  const policies = extractPolicies(text)
  const destructiveStatements = extractDestructiveStatements(lower)
  const changesData = /\b(insert|update|delete)\b/i.test(text)
  const intent: ParsedMigrationIntent = {
    version,
    migrationFile,
    status: text.trim().length > 0 ? 'parsed' : 'migration_intent_unparsed',
    schemaOnly: !changesData,
    changesData,
    destructiveStatements,
    policyReplacementStatements: countMatches(lower, /\bdrop\s+policy\s+if\s+exists\b/g),
    affectedTables: unique([
      ...tables.map((entry) => `${entry.schema}.${entry.name}`),
      ...expectedColumns.map((entry) => `${entry.schema}.${entry.table}`),
      ...rlsTables.map((entry) => `${entry.schema}.${entry.name}`),
      ...policies.map((entry) => `${entry.schema}.${entry.table}`),
    ]),
    expectedColumns,
    expectedFunctions: extractQualifiedMatches(text, /create\s+(?:or\s+replace\s+)?function\s+([a-z_][\w]*)\.([a-z_][\w]*)/gi),
    expectedTypes: extractQualifiedMatches(text, /create\s+type\s+([a-z_][\w]*)\.([a-z_][\w]*)/gi),
    expectedIndexes: extractNameMatches(text, /create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+([a-z_][\w]*)/gi),
    expectedTriggers: extractNameMatches(text, /create\s+trigger\s+([a-z_][\w]*)/gi),
    expectedRlsTables: rlsTables.map((entry) => ({ schema: entry.schema, table: entry.name })),
    expectedPolicies: policies,
    expectedExtensions: extractNameMatches(text, /create\s+extension\s+if\s+not\s+exists\s+([a-z0-9_]+)/gi),
    expectedStorageBuckets: extractStorageBuckets(text),
    confidence: 'medium',
    blockers: [],
  }

  if (intent.status !== 'parsed') intent.blockers.push('migration_intent_unparsed')
  return intent
}

function emptyMigrationIntent(
  version: string,
  status: 'migration_intent_unparsed' | 'missing_file',
  blockers: RemoteSchemaEquivalenceBlocker[],
): ParsedMigrationIntent {
  return {
    version,
    migrationFile: '',
    status,
    schemaOnly: false,
    changesData: false,
    destructiveStatements: [],
    policyReplacementStatements: 0,
    affectedTables: [],
    expectedColumns: [],
    expectedFunctions: [],
    expectedTypes: [],
    expectedIndexes: [],
    expectedTriggers: [],
    expectedRlsTables: [],
    expectedPolicies: [],
    expectedExtensions: [],
    expectedStorageBuckets: [],
    confidence: 'low',
    blockers,
  }
}

function runRemoteSchemaIntrospection() {
  const forbiddenConfirmationsSet = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const confirmationBlockers: RemoteSchemaEquivalenceBlocker[] = []
  if (process.env[SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('remote_schema_equivalence_review_not_confirmed')
  }
  if (process.env[SUPABASE_REMOTE_SCHEMA_READONLY_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_schema_readonly_inspection_not_confirmed')
  }
  if (process.env[SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION] !== 'true') {
    confirmationBlockers.push('staging_migration_history_audit_not_confirmed')
  }
  if (forbiddenConfirmationsSet.length > 0) confirmationBlockers.push('forbidden_confirmation_set')

  const dbUrlCheck = getApprovedDbUrlEnv()
  const psqlCheck = findUsablePsql()
  const blockers = unique([...confirmationBlockers, ...dbUrlCheck.blockers, ...psqlCheck.blockers])
  const base = {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    mode: 'readonly_catalog_introspection',
    reviewExecuted: true,
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    dbUrlEnvPresent: dbUrlCheck.present,
    dbUrlEnvName: dbUrlCheck.envName,
    dbUrlValuePrinted: false,
    dbUrlTargetMatchedApprovedStaging: dbUrlCheck.targetMatched,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    psqlAvailable: psqlCheck.available,
    psqlVersionChecked: psqlCheck.versionChecked,
    psqlVersionSummary: psqlCheck.versionSummary,
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
      catalog: emptyRemoteCatalog(),
      blockers,
    }
  }

  const catalog: RemoteCatalog = emptyRemoteCatalog()
  const queryReports: JsonRecord[] = []
  for (const [key, sql] of Object.entries(READONLY_CATALOG_QUERIES)) {
    const result = runReadonlyPsqlJsonQuery(psqlCheck.psqlPath, dbUrlCheck.parsed, key, sql)
    queryReports.push(result.report)
    if (result.status === 'passed') {
      catalog[key as keyof RemoteCatalog] = result.rows
    } else {
      blockers.push('remote_schema_introspection_failed')
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
      'pg_attribute',
      'pg_constraint',
      'pg_indexes',
      'pg_policies',
      'pg_trigger',
      'pg_proc',
      'pg_type',
      'pg_extension',
      'storage.buckets_metadata',
      'supabase_migrations.schema_migrations',
    ],
    queryReports,
    catalog,
    blockers: unique(blockers),
  }
}

function buildNotExecutedIntrospectionReport() {
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: 'blocked',
    mode: 'readonly_catalog_introspection',
    reviewExecuted: false,
    reason: 'readonly_execution_not_run',
    inspectedCatalogs: [],
    queryReports: [],
    catalog: emptyRemoteCatalog(),
    approvedDbUrlEnvNames: APPROVED_DB_URL_ENV_NAMES,
    dbUrlEnvPresent: APPROVED_DB_URL_ENV_NAMES.some((name) => Boolean(process.env[name])),
    dbUrlValuePrinted: false,
    credentialPayloadsPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    productionTouched: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    blockers: ['remote_schema_equivalence_review_not_executed'] as RemoteSchemaEquivalenceBlocker[],
  }
}

function loadExistingRemoteIntrospectionReport() {
  const reportPath = path.join(
    SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
    'remote_staging_schema_introspection_report.json',
  )
  if (!existsSync(reportPath)) return null
  const report = readJson(reportPath)
  if (report.reviewExecuted === true) return report
  return null
}

function buildRemoteSchemaEquivalenceComparison(localInventory: JsonRecord, remoteReport: JsonRecord) {
  const migrations = Array.isArray(localInventory.migrations)
    ? (localInventory.migrations as ParsedMigrationIntent[])
    : []
  const catalog = isJsonRecord(remoteReport.catalog) ? (remoteReport.catalog as RemoteCatalog) : emptyRemoteCatalog()
  const remotePassed = remoteReport.status === 'passed'
  const perMigrationResults = migrations.map((migration) => compareMigrationIntent(migration, catalog, remotePassed))
  const allEquivalent = perMigrationResults.every((result) => result.equivalent === true)
  const anyFalse = perMigrationResults.some((result) => result.equivalent === false)
  const anyUnknown = perMigrationResults.some((result) => result.equivalent === 'unknown')
  const overallEquivalence: RemoteSchemaEquivalenceOverall = !remotePassed || anyUnknown
    ? 'insufficient_evidence'
    : anyFalse
      ? 'not_equivalent'
      : allEquivalent
        ? 'all_equivalent'
        : 'partial_equivalence'
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: overallEquivalence === 'all_equivalent' ? 'passed' : 'blocked',
    overallEquivalence,
    remoteIntrospectionStatus: remoteReport.status,
    missingMigrationCount: migrations.length,
    equivalentMigrationCount: perMigrationResults.filter((result) => result.equivalent === true).length,
    unknownMigrationCount: perMigrationResults.filter((result) => result.equivalent === 'unknown').length,
    notEquivalentMigrationCount: perMigrationResults.filter((result) => result.equivalent === false).length,
    perMigrationResults,
    confidence: overallEquivalence === 'all_equivalent' ? 'medium' : 'low',
    productionTouched: false,
    directDdlDmlRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    blockers: unique(perMigrationResults.flatMap((result) => result.blockers)),
  }
}

function compareMigrationIntent(migration: ParsedMigrationIntent, catalog: RemoteCatalog, remotePassed: boolean) {
  if (!remotePassed) {
    return {
      version: migration.version,
      migrationFile: migration.migrationFile,
      equivalent: 'unknown' as const,
      confidence: 'low',
      expectedObjectCount: expectedObjectCount(migration),
      observedObjectCount: 0,
      missingObjects: ['remote_catalog_introspection_unavailable'],
      observedObjects: [],
      blockers: ['remote_schema_equivalence_not_proven'] as RemoteSchemaEquivalenceBlocker[],
    }
  }

  const checks = buildExpectedChecks(migration)
  const observedObjects: string[] = []
  const missingObjects: string[] = []
  for (const check of checks) {
    if (checkRemoteObject(check, catalog)) observedObjects.push(check.id)
    else missingObjects.push(check.id)
  }

  const equivalent = missingObjects.length === 0 && migration.status === 'parsed'
  const blockers: RemoteSchemaEquivalenceBlocker[] = []
  if (migration.status !== 'parsed') blockers.push('migration_intent_unparsed')
  if (!equivalent) blockers.push('remote_schema_equivalence_not_proven')
  return {
    version: migration.version,
    migrationFile: migration.migrationFile,
    equivalent,
    confidence: equivalent ? 'medium' : 'low',
    expectedObjectCount: checks.length,
    observedObjectCount: observedObjects.length,
    missingObjects,
    observedObjects,
    changesData: migration.changesData,
    destructiveStatements: migration.destructiveStatements,
    blockers: unique(blockers),
  }
}

function buildApprovalAfterEquivalenceReview(comparison: JsonRecord) {
  const approved = comparison.overallEquivalence === 'all_equivalent'
  const decision: RemoteSchemaEquivalenceDecision = approved
    ? 'approved_for_future_staging_migration_history_repair'
    : 'blocked_pending_remote_history_evidence'
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: approved ? 'approved_for_future_repair_execution_phase' : 'blocked',
    decision,
    approvedForFutureRepair: approved,
    repairExecutionStillRequiresSeparatePhase: true,
    reason: approved
      ? 'All 12 missing migration-history entries are equivalent to remote staging catalog metadata at medium confidence.'
      : 'Remote schema equivalence for all 12 missing migration-history entries is not proven.',
    overallEquivalence: comparison.overallEquivalence,
    confidence: comparison.confidence,
    exactRepairVersions: loadPriorEvidence().repairVersions,
    futureRepairStatus: 'applied',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: approved ? [] : ['remote_schema_equivalence_not_proven'],
  }
}

function buildBlockerReport(remoteReport: JsonRecord, comparison: JsonRecord, decision: JsonRecord) {
  const activeBlockers = unique([
    ...readStringArray(remoteReport, 'blockers'),
    ...readStringArray(comparison, 'blockers'),
    ...readStringArray(decision, 'blockers'),
  ]) as RemoteSchemaEquivalenceBlocker[]
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    forbiddenConfirmationSet: activeBlockers.includes('forbidden_confirmation_set'),
    stillBlockedScopes: [
      'migration_repair_execution_until_separate_approved_phase',
      'staging_schema_deploy',
      'track_b_staging_backfill',
      'production_supabase',
      'direct_ddl_dml',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
      'track_a',
    ],
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildReadinessReport(decision: JsonRecord, blockerReport: JsonRecord) {
  const passed = decision.decision === 'approved_for_future_staging_migration_history_repair' &&
    Array.isArray(blockerReport.activeBlockers) &&
    blockerReport.activeBlockers.length === 0
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: passed ? 'phase_complete_restricted_scope' : 'blocked',
    decision: decision.decision,
    approvedForFutureRepair: passed,
    supabaseUpdateStatus: 'evidence_review_only',
    supabaseEnvironmentTouched: 'staging_readonly_catalog_only_if_confirmed',
    sqlExecuted: passed || decision.overallEquivalence !== 'insufficient_evidence'
      ? 'read_only_catalog_introspection_only_if_report_status_passed'
      : 'no',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    nextRecommendedPhase: passed
      ? 'Prompt: Supabase staging migration-history repair execution'
      : 'Resolve exact missing remote schema equivalence evidence before migration-history repair execution.',
    supabaseMilestoneSync: 'blocked_until_migration_history_repair_staging_schema_deploy_and_track_b_backfill_pass',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_PHASE,
    runId: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_RUN_ID,
    status: 'metadata_committed_only',
    privateUploadRequired: false,
    committedSafeReports: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS,
    forbiddenArtifacts: [
      'db_urls',
      'service_role_keys',
      'access_tokens',
      'secret_payloads',
      'signed_urls',
      'table_data',
      'media_payloads',
      'model_payloads',
      'build_outputs',
      'node_modules',
    ],
  }
}

function renderEquivalenceDecisionMarkdown(
  reports: ReturnType<typeof buildSupabaseRemoteSchemaEquivalenceReports>,
) {
  const decision = reports.migrationHistoryRepairApprovalAfterEquivalenceReview
  const versions = Array.isArray(decision.exactRepairVersions)
    ? decision.exactRepairVersions.join(', ')
    : 'unavailable'
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.join(', ') : 'none'
  return `# Supabase Migration History Repair Equivalence Decision

- Decision: \`${decision.decision}\`
- Overall equivalence: \`${decision.overallEquivalence}\`
- Future repair approved: \`${decision.approvedForFutureRepair}\`
- Repair versions reviewed: \`${versions}\`
- Active blockers: \`${blockers}\`
- Migration repair run: \`false\`
- Schema deploy run: \`false\`
- Track B backfill run: \`false\`
- Production affected: \`false\`
- Secrets printed or committed: \`false\`

Remote schema equivalence must be proven for all 12 missing history entries before a repair execution phase may run. This phase writes evidence only.
`
}

function renderRepairExecutionHandoffPrompt(
  reports: ReturnType<typeof buildSupabaseRemoteSchemaEquivalenceReports>,
) {
  const decision = reports.migrationHistoryRepairApprovalAfterEquivalenceReview
  const versions = Array.isArray(decision.exactRepairVersions)
    ? decision.exactRepairVersions.join(' ')
    : ''
  if (decision.approvedForFutureRepair !== true) {
    return `# Supabase Staging Migration-History Repair Execution

Status: blocked.

The remote schema equivalence review did not approve repair execution.

Missing evidence:
- Decision: \`${decision.decision}\`
- Overall equivalence: \`${decision.overallEquivalence}\`
- Required repair versions still under review: \`${versions}\`
- Evidence report: \`docs/activation-supabase-remote-schema-equivalence-reports/remote_schema_equivalence_comparison_report.json\`

Do not run \`supabase migration repair\`, schema deploy, Track B backfill, production SQL, direct DDL/DML, providers, tools/workers/routes, media, Track A, beta, or production unlock.
`
  }

  return `# Supabase Staging Migration-History Repair Execution

This handoff is approved only for a future separate execution phase.

Repair command preview:

\`\`\`bash
supabase migration repair ${versions} --status applied --db-url [REDACTED_STAGING_DB_URL]
\`\`\`

Rules:
- staging target only: Reeditpro / ${APPROVED_STAGING_PROJECT_REF} / staging
- repair status: applied
- no schema deploy inside the repair step
- no Track B backfill inside the repair step
- no production Supabase
- no secrets printed or committed
- after repair, rerun PR #223 dry-run/deploy flow
`
}

function findMigrationFile(version: string) {
  if (!existsSync(MIGRATION_DIR)) return null
  const match = readdirSync(MIGRATION_DIR).find((file) => file.startsWith(`${version}_`) && file.endsWith('.sql'))
  return match ? path.join(MIGRATION_DIR, match) : null
}

function extractExpectedColumns(sql: string) {
  const columns: Array<{ schema: string; table: string; column: string }> = []
  const tableRegex = /create\s+table\s+if\s+not\s+exists\s+([a-z_][\w]*)\.([a-z_][\w]*)\s*\(([\s\S]*?)\);/gi
  for (const match of sql.matchAll(tableRegex)) {
    const schema = match[1]
    const table = match[2]
    const block = match[3]
    for (const line of block.split('\n')) {
      const trimmed = line.trim().replace(/,$/, '')
      const columnMatch = /^([a-z_][\w]*)\s+/i.exec(trimmed)
      if (!columnMatch) continue
      const column = columnMatch[1]
      if (['primary', 'unique', 'foreign', 'constraint', 'check'].includes(column.toLowerCase())) continue
      columns.push({ schema, table, column })
    }
  }

  for (const statement of sql.split(';')) {
    const tableMatch = /alter\s+table\s+([a-z_][\w]*)\.([a-z_][\w]*)/i.exec(statement)
    if (!tableMatch) continue
    for (const match of statement.matchAll(/add\s+column\s+if\s+not\s+exists\s+([a-z_][\w]*)/gi)) {
      columns.push({ schema: tableMatch[1], table: tableMatch[2], column: match[1] })
    }
  }
  return uniqueBy(columns, (entry) => `${entry.schema}.${entry.table}.${entry.column}`)
}

function extractQualifiedMatches(sql: string, regex: RegExp) {
  return uniqueBy(
    [...sql.matchAll(regex)].map((match) => ({ schema: match[1], name: match[2] })),
    (entry) => `${entry.schema}.${entry.name}`,
  )
}

function extractNameMatches(sql: string, regex: RegExp) {
  return unique([...sql.matchAll(regex)].map((match) => match[1]))
}

function extractPolicies(sql: string) {
  return uniqueBy(
    [...sql.matchAll(/create\s+policy\s+"?([^"\n]+?)"?\s+on\s+([a-z_][\w]*)\.([a-z_][\w]*)/gi)].map(
      (match) => ({ name: match[1].trim(), schema: match[2], table: match[3] }),
    ),
    (entry) => `${entry.schema}.${entry.table}.${entry.name}`,
  )
}

function extractStorageBuckets(sql: string) {
  return unique([...sql.matchAll(/\('([^']+)'\s*,\s*'[^']+'\s*,\s*false/gi)].map((match) => match[1]))
}

function extractDestructiveStatements(lowerSql: string) {
  const destructive: string[] = []
  if (/\bdrop\s+table\b/.test(lowerSql)) destructive.push('drop_table')
  if (/\bdrop\s+column\b/.test(lowerSql)) destructive.push('drop_column')
  if (/\balter\s+table\b[\s\S]{0,120}\bdrop\b/.test(lowerSql)) destructive.push('alter_table_drop')
  if (/\btruncate\b/.test(lowerSql)) destructive.push('truncate')
  return unique(destructive)
}

function buildExpectedChecks(migration: ParsedMigrationIntent) {
  return [
    ...migration.affectedTables.map((id) => ({ kind: 'table', id })),
    ...migration.expectedColumns.map((entry) => ({
      kind: 'column',
      id: `column:${entry.schema}.${entry.table}.${entry.column}`,
      schema: entry.schema,
      table: entry.table,
      name: entry.column,
    })),
    ...migration.expectedFunctions.map((entry) => ({
      kind: 'function',
      id: `function:${entry.schema}.${entry.name}`,
      schema: entry.schema,
      name: entry.name,
    })),
    ...migration.expectedTypes.map((entry) => ({
      kind: 'type',
      id: `type:${entry.schema}.${entry.name}`,
      schema: entry.schema,
      name: entry.name,
    })),
    ...migration.expectedIndexes.map((name) => ({ kind: 'index', id: `index:${name}`, name })),
    ...migration.expectedTriggers.map((name) => ({ kind: 'trigger', id: `trigger:${name}`, name })),
    ...migration.expectedRlsTables.map((entry) => ({
      kind: 'rls',
      id: `rls:${entry.schema}.${entry.table}`,
      schema: entry.schema,
      table: entry.table,
    })),
    ...migration.expectedPolicies.map((entry) => ({
      kind: 'policy',
      id: `policy:${entry.schema}.${entry.table}.${entry.name}`,
      schema: entry.schema,
      table: entry.table,
      name: entry.name,
    })),
    ...migration.expectedExtensions.map((name) => ({ kind: 'extension', id: `extension:${name}`, name })),
    ...migration.expectedStorageBuckets.map((name) => ({ kind: 'storage_bucket', id: `storage_bucket:${name}`, name })),
  ]
}

function checkRemoteObject(check: JsonRecord, catalog: RemoteCatalog) {
  const kind = String(check.kind)
  if (kind === 'table') {
    const [schema, table] = String(check.id).split('.')
    return catalog.tables.some((row) => row.schema === schema && row.table === table)
  }
  if (kind === 'column') {
    return catalog.columns.some(
      (row) => row.schema === check.schema && row.table === check.table && row.column === check.name,
    )
  }
  if (kind === 'function') {
    return catalog.functions.some((row) => row.schema === check.schema && row.name === check.name)
  }
  if (kind === 'type') {
    return catalog.types.some((row) => row.schema === check.schema && row.name === check.name)
  }
  if (kind === 'index') return catalog.indexes.some((row) => row.name === check.name)
  if (kind === 'trigger') return catalog.triggers.some((row) => row.name === check.name)
  if (kind === 'rls') {
    return catalog.rls.some(
      (row) => row.schema === check.schema && row.table === check.table && row.rlsEnabled === true,
    )
  }
  if (kind === 'policy') {
    return catalog.policies.some(
      (row) => row.schema === check.schema && row.table === check.table && row.name === check.name,
    )
  }
  if (kind === 'extension') return catalog.extensions.some((row) => row.name === check.name)
  if (kind === 'storage_bucket') return catalog.storageBuckets.some((row) => row.id === check.name)
  return false
}

function expectedObjectCount(migration: ParsedMigrationIntent) {
  return buildExpectedChecks(migration).length
}

function getApprovedDbUrlEnv() {
  const envName = APPROVED_DB_URL_ENV_NAMES.find((name) => Boolean(process.env[name]))
  if (!envName) {
    return {
      present: false,
      envName: null,
      parsed: null,
      targetMatched: false,
      blockers: ['staging_db_url_unavailable_for_readonly_introspection'] as RemoteSchemaEquivalenceBlocker[],
    }
  }
  try {
    const rawUrl = process.env[envName] ?? ''
    const parsedUrl = new URL(rawUrl)
    const targetMatched = rawUrl.includes(APPROVED_STAGING_PROJECT_REF)
    const blockers: RemoteSchemaEquivalenceBlocker[] = []
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
      blockers: ['staging_db_url_unparseable'] as RemoteSchemaEquivalenceBlocker[],
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
        blockers: [] as RemoteSchemaEquivalenceBlocker[],
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
    blockers: ['psql_unavailable_for_readonly_introspection'] as RemoteSchemaEquivalenceBlocker[],
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
    args: ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', '[REDACTED_READONLY_CATALOG_QUERY]'],
    sqlClass: 'readonly_catalog_select',
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
    dbUrlPrinted: false,
    secretPayloadPrinted: false,
  }
}

const READONLY_CATALOG_QUERIES: Record<keyof RemoteCatalog, string> = {
  tables: "select coalesce(json_agg(json_build_object('schema', table_schema, 'table', table_name, 'type', table_type) order by table_schema, table_name), '[]'::json)::text from information_schema.tables where table_schema in ('public', 'storage');",
  columns: "select coalesce(json_agg(json_build_object('schema', table_schema, 'table', table_name, 'column', column_name, 'dataType', data_type, 'udtName', udt_name, 'isNullable', is_nullable) order by table_schema, table_name, ordinal_position), '[]'::json)::text from information_schema.columns where table_schema in ('public', 'storage');",
  constraints: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'name', con.conname, 'type', con.contype) order by n.nspname, c.relname, con.conname), '[]'::json)::text from pg_constraint con join pg_class c on c.oid = con.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'storage');",
  indexes: "select coalesce(json_agg(json_build_object('schema', schemaname, 'table', tablename, 'name', indexname) order by schemaname, tablename, indexname), '[]'::json)::text from pg_indexes where schemaname in ('public', 'storage');",
  policies: "select coalesce(json_agg(json_build_object('schema', schemaname, 'table', tablename, 'name', policyname, 'command', cmd, 'roles', roles) order by schemaname, tablename, policyname), '[]'::json)::text from pg_policies where schemaname in ('public', 'storage');",
  rls: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'rlsEnabled', c.relrowsecurity, 'rlsForced', c.relforcerowsecurity) order by n.nspname, c.relname), '[]'::json)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'storage') and c.relkind in ('r', 'p');",
  triggers: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'name', t.tgname) order by n.nspname, c.relname, t.tgname), '[]'::json)::text from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'storage') and not t.tgisinternal;",
  functions: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'name', p.proname) order by n.nspname, p.proname), '[]'::json)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'storage');",
  types: "select coalesce(json_agg(json_build_object('schema', n.nspname, 'name', t.typname, 'kind', t.typtype) order by n.nspname, t.typname), '[]'::json)::text from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname in ('public', 'storage') and t.typtype in ('e', 'c', 'd');",
  extensions: "select coalesce(json_agg(json_build_object('name', extname, 'schema', n.nspname) order by extname), '[]'::json)::text from pg_extension e join pg_namespace n on n.oid = e.extnamespace;",
  storageBuckets: "select case when to_regclass('storage.buckets') is null then '[]'::json::text else (select coalesce(json_agg(json_build_object('id', id, 'public', public) order by id), '[]'::json)::text from storage.buckets) end;",
  migrationHistory: "select case when to_regclass('supabase_migrations.schema_migrations') is null then '[]'::json::text else (select coalesce(json_agg(json_build_object('version', version::text) order by version::text), '[]'::json)::text from supabase_migrations.schema_migrations) end;",
}

function emptyRemoteCatalog(): RemoteCatalog {
  return {
    tables: [],
    columns: [],
    constraints: [],
    indexes: [],
    policies: [],
    rls: [],
    triggers: [],
    functions: [],
    types: [],
    extensions: [],
    storageBuckets: [],
    migrationHistory: [],
  }
}

function readJson(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
}

function readStringArray(record: JsonRecord, key: string) {
  const value = record[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readdirSafe(sourcePath: string) {
  try {
    return existsSync(sourcePath) && path.extname(sourcePath) === '' ? readdirSync(sourcePath) : []
  } catch {
    return []
  }
}

function unique<T>(items: T[]) {
  return [...new Set(items)]
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const marker = key(item)
    if (seen.has(marker)) return false
    seen.add(marker)
    return true
  })
}

function countMatches(text: string, regex: RegExp) {
  return [...text.matchAll(regex)].length
}

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\/[^"'\s]+/i,
  /service[_-]?role[_-]?key/i,
  /access[_-]?token/i,
  new RegExp(['x-goog-signature', '='].join(''), 'i'),
  new RegExp(['BEGIN', 'PRIVATE KEY'].join(' '), 'i'),
]
