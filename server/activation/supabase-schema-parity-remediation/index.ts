import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  SchemaParityMissingEffect,
  SchemaParityRemediationBlocker,
  SchemaParityRemediationDecision,
  SchemaParityRemediationOptionId,
  SchemaParityRemediationOptionStatus,
  SchemaParityRiskLevel,
} from './schema-parity-remediation-types'

export const SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE =
  'supabase-schema-parity-remediation-strategy'
export const SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID =
  'supabase-schema-parity-remediation-strategy-20260609'
export const SUPABASE_SCHEMA_PARITY_REMEDIATION_BRANCH =
  'codex/rp-foundation-supabase-schema-parity-remediation-strategy'
export const SUPABASE_SCHEMA_PARITY_REMEDIATION_BASE_BRANCH =
  'codex/rp-foundation-supabase-remote-schema-equivalence-review'
export const SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR =
  'docs/activation-supabase-schema-parity-remediation-reports'
export const SUPABASE_SCHEMA_PARITY_REMEDIATION_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_SCHEMA_PARITY_REMEDIATION_STRATEGY'
export const SUPABASE_STAGING_DRIFT_ANALYSIS_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_DRIFT_ANALYSIS'

export const SUPABASE_SCHEMA_PARITY_REMEDIATION_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'schema_parity_remediation_plan.json',
  'schema_parity_missing_effect_inventory.json',
  'schema_parity_remediation_option_matrix.json',
  'schema_parity_risk_report.json',
  'schema_parity_recommended_strategy.json',
  'schema_parity_operator_checklist.json',
  'schema_parity_decision.json',
  'schema_parity_blocker_report.json',
  'schema_parity_readiness_report.json',
  'schema_parity_private_artifact_manifest.json',
] as const

export const SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS = [
  'docs/supabase-schema-parity-remediation-decision.md',
  'docs/supabase-schema-parity-remediation-operator-checklist.md',
  'docs/implementation-prompts/prompt-supabase-staging-schema-parity-remediation-execution.md',
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

const REMOTE_EQUIVALENCE_REPORT_DIR =
  'docs/activation-supabase-remote-schema-equivalence-reports'
const REPAIR_APPROVAL_REPORT_DIR =
  'docs/activation-supabase-migration-history-repair-approval-reports'
const DEPLOY_TRANSPORT_REPORT_DIR =
  'docs/activation-supabase-staging-deploy-transport-reports'

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

export function getSupabaseSchemaParityRemediationPlan() {
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    branch: SUPABASE_SCHEMA_PARITY_REMEDIATION_BRANCH,
    baseBranch: SUPABASE_SCHEMA_PARITY_REMEDIATION_BASE_BRANCH,
    prTitle: '[foundation] Supabase staging schema parity remediation strategy',
    reportDir: SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
    expectedReports: SUPABASE_SCHEMA_PARITY_REMEDIATION_EXPECTED_REPORTS,
    docs: SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: [
      'TRACK_B_MEDIA_PROCESSING',
      'OBSERVABILITY_AUDIT_COST',
      'WORKER_RUNTIME_JOBS',
    ],
    sourcePrs: [196, 198, 200, 223, 238, 241],
    docsBasis: {
      dbPush: 'https://supabase.com/docs/reference/cli/supabase-db-push',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelogChecked: true,
      changelogCheckedAt: '2026-06-09',
    },
    allowedActions: [
      'read_committed_pr_241_reports',
      'read_committed_pr_238_reports',
      'read_committed_pr_223_reports',
      'read_local_migration_sql',
      'classify_schema_drift',
      'write_safe_metadata_reports',
    ],
    blockedActions: [
      'supabase_migration_repair',
      'supabase_db_push',
      'schema_deploy',
      'direct_ddl_dml',
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
    confirmationsForStrategyPacketExecution: [
      SUPABASE_SCHEMA_PARITY_REMEDIATION_CONFIRMATION,
      SUPABASE_STAGING_DRIFT_ANALYSIS_CONFIRMATION,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
  }
}

export function buildSupabaseSchemaParityRemediationReports(input: {
  executeConfirmed?: boolean
  driftAnalysisConfirmed?: boolean
} = {}) {
  const sourceAudit = buildSourceOfTruthOwnershipAudit()
  const evidence = loadSchemaParityEvidence()
  const missingInventory = buildMissingEffectInventory(evidence)
  const optionMatrix = buildOptionMatrix(missingInventory)
  const riskReport = buildRiskReport(evidence, missingInventory)
  const recommendedStrategy = buildRecommendedStrategy(riskReport, optionMatrix)
  const operatorChecklist = buildOperatorChecklist(recommendedStrategy)
  const decision = buildDecision(recommendedStrategy, riskReport)
  const blockerReport = buildBlockerReport(decision, riskReport)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  const privateArtifactManifest = buildPrivateArtifactManifest()

  return {
    sourceOfTruthOwnershipAudit: sourceAudit,
    plan: getSupabaseSchemaParityRemediationPlan(),
    missingEffectInventory: missingInventory,
    remediationOptionMatrix: optionMatrix,
    riskReport,
    recommendedStrategy,
    operatorChecklist,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
    executionConfirmationStatus: {
      strategyPacketConfirmed: input.executeConfirmed === true,
      driftAnalysisConfirmed: input.driftAnalysisConfirmed === true,
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

export async function writeSupabaseSchemaParityRemediationArtifacts(
  reports: ReturnType<typeof buildSupabaseSchemaParityRemediationReports>,
) {
  const dir = SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_remediation_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_missing_effect_inventory.json'), reports.missingEffectInventory)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_remediation_option_matrix.json'), reports.remediationOptionMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_risk_report.json'), reports.riskReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_recommended_strategy.json'), reports.recommendedStrategy)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(dir, 'schema_parity_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-schema-parity-remediation-decision.md',
    renderDecisionMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/supabase-schema-parity-remediation-operator-checklist.md',
    renderChecklistMarkdown(reports),
  )
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-supabase-staging-schema-parity-remediation-execution.md',
    renderExecutionPrompt(reports),
  )
}

export async function executeSupabaseSchemaParityRemediation(input: {
  keepTemp: boolean
}): Promise<{ reports: ReturnType<typeof buildSupabaseSchemaParityRemediationReports>; exitCode: number }> {
  void input
  const executeConfirmed = process.env[SUPABASE_SCHEMA_PARITY_REMEDIATION_CONFIRMATION] === 'true'
  const driftConfirmed = process.env[SUPABASE_STAGING_DRIFT_ANALYSIS_CONFIRMATION] === 'true'
  const reports = buildSupabaseSchemaParityRemediationReports({
    executeConfirmed,
    driftAnalysisConfirmed: driftConfirmed,
  })
  await writeSupabaseSchemaParityRemediationArtifacts(reports)
  return { reports, exitCode: executeConfirmed && driftConfirmed ? 0 : 1 }
}

export function readSupabaseSchemaParityRemediationSummary() {
  const reports = buildSupabaseSchemaParityRemediationReports()
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.decision.decision,
    selectedStrategy: reports.recommendedStrategy.selectedStrategy,
    missingEffectCount: reports.missingEffectInventory.nonEquivalentMigrationCount,
    equivalentMigrationCount: reports.missingEffectInventory.equivalentMigrationCount,
    repairOnlyStatus: reports.remediationOptionMatrix.options.find(
      (option) => option.optionId === 'migration_history_repair_only',
    )?.status,
    riskLevel: reports.riskReport.overallRisk,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
    blockers: reports.blockerReport.activeBlockers,
    nextRecommendedPhase: reports.recommendedStrategy.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit() {
  const sourcePaths = SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
    path: sourcePath,
    present: existsSync(sourcePath),
    note: existsSync(sourcePath)
      ? 'available_for_strategy_packet'
      : 'missing_in_pr_241_branch_recorded_as_audit_fact',
  }))
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: {
      trackBMediaProcessing: 'safe Track B milestone export only',
      observabilityAuditCost: 'future milestone registry consumer only',
      workerRuntimeJobs: 'not executed',
    },
    explicitlyNotOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'product beta/production unlocks',
    ],
    integrationPoints: [
      'PR #196 Track B readiness rollup/export',
      'PR #198 guarded Track B staging backfill module',
      'PR #200 milestone registry schema/RLS migration',
      'PR #223 deploy transport and migration-history audit',
      'PR #238 migration-history repair approval packet',
      'PR #241 remote schema equivalence review',
    ],
    sourcePaths,
    duplicateWorkRisk: 'high_if_new_deploy_wrapper_schema_or_backfill_path_is_created',
    secretPayloadAccess: false,
    sqlExecuted: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function loadSchemaParityEvidence() {
  const localIntent = readJson(path.join(
    REMOTE_EQUIVALENCE_REPORT_DIR,
    'local_missing_migration_intent_inventory.json',
  ))
  const comparison = readJson(path.join(
    REMOTE_EQUIVALENCE_REPORT_DIR,
    'remote_schema_equivalence_comparison_report.json',
  ))
  const repairDecision = readJson(path.join(
    REPAIR_APPROVAL_REPORT_DIR,
    'migration_history_repair_approval_decision.json',
  ))
  const migrationHistoryAudit = readJson(path.join(
    DEPLOY_TRANSPORT_REPORT_DIR,
    'staging_migration_history_audit_report.json',
  ))
  const migrations = Array.isArray(localIntent.migrations)
    ? localIntent.migrations.filter(isJsonRecord)
    : []
  const perMigrationResults = Array.isArray(comparison.perMigrationResults)
    ? comparison.perMigrationResults.filter(isJsonRecord)
    : []

  return {
    localIntent,
    comparison,
    repairDecision,
    migrationHistoryAudit,
    migrations,
    perMigrationResults,
    sourceReports: [
      path.join(REMOTE_EQUIVALENCE_REPORT_DIR, 'local_missing_migration_intent_inventory.json'),
      path.join(REMOTE_EQUIVALENCE_REPORT_DIR, 'remote_schema_equivalence_comparison_report.json'),
      path.join(REPAIR_APPROVAL_REPORT_DIR, 'migration_history_repair_approval_decision.json'),
      path.join(DEPLOY_TRANSPORT_REPORT_DIR, 'staging_migration_history_audit_report.json'),
    ],
  }
}

function buildMissingEffectInventory(evidence: ReturnType<typeof loadSchemaParityEvidence>) {
  const resultsByVersion = new Map<string, JsonRecord>()
  for (const result of evidence.perMigrationResults) {
    const version = readString(result, 'version')
    if (version) resultsByVersion.set(version, result)
  }

  const missingEffects: SchemaParityMissingEffect[] = []
  let equivalentMigrationCount = 0
  for (const migration of evidence.migrations) {
    const version = readString(migration, 'version')
    const result = resultsByVersion.get(version)
    if (!version || !result) continue
    if (result.equivalent === true) {
      equivalentMigrationCount += 1
      continue
    }
    if (result.equivalent !== false) continue
    const missingObjects = readStringArray(result, 'missingObjects')
    const affectedTables = readStringArray(migration, 'affectedTables')
    const expectedStorageBuckets = readStringArray(migration, 'expectedStorageBuckets')
    const expectedPolicies = readArray(migration, 'expectedPolicies')
    const expectedRlsTables = readArray(migration, 'expectedRlsTables')
    const destructiveStatements = readStringArray(migration, 'destructiveStatements')
    const policyReplacementStatementCount = readNumber(migration, 'policyReplacementStatements')
    const changesData = migration.changesData === true
    const schemaOnly = migration.schemaOnly === true
    const riskLevel = classifyMissingEffectRisk({
      changesData,
      expectedStorageBuckets,
      expectedPolicies,
      expectedRlsTables,
      destructiveStatements,
      policyReplacementStatementCount,
      missingObjects,
    })
    missingEffects.push({
      migrationVersion: version,
      migrationFile: readString(migration, 'migrationFile') || readString(result, 'migrationFile'),
      equivalence: false,
      expectedObjectCount: readNumber(result, 'expectedObjectCount'),
      observedObjectCount: readNumber(result, 'observedObjectCount'),
      missingObjectCount: missingObjects.length,
      missingObjectSamples: missingObjects.slice(0, 12),
      affectedSchemaObjects: missingObjects,
      affectedTables,
      expectedStorageBuckets,
      expectedPolicyCount: expectedPolicies.length,
      expectedRlsTableCount: expectedRlsTables.length,
      destructiveStatementCount: destructiveStatements.length,
      policyReplacementStatementCount,
      schemaOnly,
      changesData,
      riskLevel,
      confidence: readConfidence(result),
      recommendedRemediationOption: riskLevel === 'high'
        ? 'staging_reset_and_reapply_migrations_approval_packet'
        : 'human_reviewed_idempotent_schema_parity_remediation_migration',
      blockers: buildMissingEffectBlockers({
        changesData,
        expectedStorageBuckets,
        expectedPolicies,
        expectedRlsTables,
        destructiveStatements,
        policyReplacementStatementCount,
      }),
    })
  }

  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    sourceReports: evidence.sourceReports,
    remoteEquivalenceStatus: readString(evidence.comparison, 'overallEquivalence'),
    equivalentMigrationCount,
    nonEquivalentMigrationCount: missingEffects.length,
    missingEffects,
    schemaOnlyMigrationCount: missingEffects.filter((effect) => effect.schemaOnly).length,
    dataChangingMigrationCount: missingEffects.filter((effect) => effect.changesData).length,
    rlsOrStoragePolicyMigrationCount: missingEffects.filter(
      (effect) => effect.expectedPolicyCount > 0 ||
        effect.expectedRlsTableCount > 0 ||
        effect.expectedStorageBuckets.length > 0 ||
        effect.policyReplacementStatementCount > 0,
    ).length,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildOptionMatrix(missingInventory: ReturnType<typeof buildMissingEffectInventory>) {
  const options = [
    buildOption(
      'ordered_missing_migration_apply',
      'not_approved_pending_human_review',
      'May preserve canonical migration order, but cannot be approved in this packet because the missing set includes foundational schema, RLS, storage policy, and data-affecting statements.',
      'high',
      [
        'human review of all 11 missing migrations',
        'migration-safe dry-run against staging',
        'rollback/failure owner',
        'confirmation that no Track B backfill runs in the same phase',
      ],
    ),
    buildOption(
      'idempotent_schema_parity_remediation_migration',
      'not_approved_pending_human_review',
      'Could be safe only if a future phase scopes every missing effect and proves idempotency; this packet does not generate or apply that migration.',
      'high',
      [
        'human-reviewed object inventory',
        'explicit idempotency proof',
        'local and staging dry-run evidence',
        'separate execution approval',
      ],
    ),
    buildOption(
      'staging_reset_and_reapply_migrations',
      'recommended_next_approval_path',
      'Broad foundational drift makes a reset-and-reapply approval packet safer than repair-only or ad-hoc remediation.',
      'medium',
      [
        'human staging reset approval',
        'staging data preservation/export decision',
        'migration chain dry-run',
        'post-reset PR #223/#198 rerun plan',
      ],
    ),
    buildOption(
      'migration_history_repair_only',
      'rejected',
      'Rejected because PR #241 proves 11 migration effects are absent remotely; repairing history without applying effects would hide real drift.',
      'high',
      ['all 12 missing migrations equivalent at medium/high confidence'],
    ),
    buildOption(
      'do_nothing',
      'rejected',
      'Rejected because milestone sync, schema deploy, and Track B backfill remain blocked.',
      'high',
      ['none'],
    ),
  ]

  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    evaluatedOptionCount: options.length,
    nonEquivalentMigrationCount: missingInventory.nonEquivalentMigrationCount,
    options,
    selectedOption: 'staging_reset_and_reapply_migrations',
    selectedOptionStatus: 'recommended_next_approval_path',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildRiskReport(
  evidence: ReturnType<typeof loadSchemaParityEvidence>,
  missingInventory: ReturnType<typeof buildMissingEffectInventory>,
) {
  const missingObjectCount = missingInventory.missingEffects.reduce(
    (total, effect) => total + effect.missingObjectCount,
    0,
  )
  const highRiskMigrationCount = missingInventory.missingEffects.filter(
    (effect) => effect.riskLevel === 'high',
  ).length
  const policyRiskMigrationCount = missingInventory.missingEffects.filter(
    (effect) => effect.expectedPolicyCount > 0 ||
      effect.expectedRlsTableCount > 0 ||
      effect.expectedStorageBuckets.length > 0 ||
      effect.policyReplacementStatementCount > 0,
  ).length
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    overallRisk: 'high' as SchemaParityRiskLevel,
    driftClassification: 'broad_foundational_schema_drift',
    remoteEquivalenceDecision: readString(evidence.comparison, 'overallEquivalence'),
    priorRepairDecision: readString(evidence.repairDecision, 'decision'),
    nonEquivalentMigrationCount: missingInventory.nonEquivalentMigrationCount,
    missingObjectCount,
    highRiskMigrationCount,
    dataChangingMigrationCount: missingInventory.dataChangingMigrationCount,
    policyRiskMigrationCount,
    stagingDataRisk: true,
    productionRisk: false,
    unacceptableSchemaDriftRisk: false,
    riskReasons: [
      'remote staging schema is not equivalent to local migration intent',
      '11 migration effects are absent remotely',
      'missing effects include data-changing statements such as storage bucket inserts and policy churn',
      'missing effects include RLS/storage policy changes',
      'one later migration appears applied while earlier foundational migrations are absent',
    ],
    recommendedNextApproval: 'staging_reset_and_reapply_migrations_approval_packet',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildRecommendedStrategy(
  riskReport: ReturnType<typeof buildRiskReport>,
  optionMatrix: ReturnType<typeof buildOptionMatrix>,
) {
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    selectedStrategy: optionMatrix.selectedOption,
    selectedStrategyStatus: optionMatrix.selectedOptionStatus,
    decision: 'blocked_pending_staging_reset_approval' as SchemaParityRemediationDecision,
    whySelected:
      'The remote schema is missing broad foundational migration effects. A reset/reapply approval packet is safer than repair-only or ad-hoc deploy because it can review staging data preservation, dry-run the canonical migration chain, and avoid hiding real drift.',
    exactFutureExecutionScope: [
      'staging-only target proof',
      'no production',
      'no Track B backfill in same phase',
      'no migration-history repair unless separately reapproved after parity',
      'migration-safe dry-run before any mutation',
      'post-remediation verification against PR #241 missing effects',
    ],
    newMigrationFileShouldBeGeneratedInFuturePhase: false,
    oldMigrationsShouldBeAppliedInOrder: 'only after staging reset approval and migration-chain dry-run',
    humanReviewRequired: true,
    stagingDataRiskExists: riskReport.stagingDataRisk,
    productionExcluded: true,
    trackBBackfillRemainsBlocked: true,
    repairOnlyRejected: true,
    nextRecommendedPhase:
      'Separate staging reset/schema parity remediation approval packet before any execution.',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildOperatorChecklist(recommendedStrategy: ReturnType<typeof buildRecommendedStrategy>) {
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    selectedStrategy: recommendedStrategy.selectedStrategy,
    checklist: [
      'review all 11 missing effects from PR #241',
      'confirm staging-only target and no production target',
      'confirm no Track B backfill in the same phase',
      'confirm no direct SQL/manual dashboard mutation',
      'confirm no migration-history repair-only path',
      'confirm selected staging reset/schema parity remediation strategy',
      'confirm rollback/failure owner and cleanup behavior',
      'confirm migration-safe dry-run requirement before any execution',
      'confirm post-remediation verification and PR #198 backfill remains separate',
    ],
    completionRequiredBeforeExecution: true,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function buildDecision(
  recommendedStrategy: ReturnType<typeof buildRecommendedStrategy>,
  riskReport: ReturnType<typeof buildRiskReport>,
) {
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    decision: recommendedStrategy.decision,
    approvalStatus: 'not_approved_for_execution',
    selectedStrategy: recommendedStrategy.selectedStrategy,
    missingEffects: riskReport.nonEquivalentMigrationCount,
    risk: riskReport.overallRisk,
    repairOnlyStatus: 'rejected',
    remediationExecutionApproved: false,
    stagingSchemaDeployApproved: false,
    trackBBackfillApproved: false,
    productionAffected: false,
    rationale: recommendedStrategy.whySelected,
    nextSupabaseAction: recommendedStrategy.nextRecommendedPhase,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildBlockerReport(
  decision: ReturnType<typeof buildDecision>,
  riskReport: ReturnType<typeof buildRiskReport>,
) {
  const activeBlockers: SchemaParityRemediationBlocker[] = [
    'remote_schema_equivalence_not_proven',
    'missing_effects_include_data_changing_migrations',
    'missing_effects_include_rls_or_storage_policy_changes',
    'migration_history_repair_only_rejected',
    'ordered_missing_migration_apply_not_approved',
    'idempotent_remediation_migration_not_approved',
    'staging_reset_approval_required',
  ]
  if (FORBIDDEN_CONFIRMATIONS.some((name) => process.env[name] === 'true')) {
    activeBlockers.push('forbidden_confirmation_set')
  }
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    decision: decision.decision,
    activeBlockers,
    risk: riskReport.overallRisk,
    blockedScopes: [
      'remediation_execution_until_separate_approved_phase',
      'migration_history_repair',
      'staging_schema_deploy',
      'track_b_staging_backfill',
      'production_supabase',
      'direct_sql',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
    ],
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(
  decision: ReturnType<typeof buildDecision>,
  blockerReport: ReturnType<typeof buildBlockerReport>,
) {
  return {
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'blocked',
    decision: decision.decision,
    readinessStatus: 'strategy_packet_complete_execution_blocked',
    strategyPacketComplete: true,
    executionReady: false,
    activeBlockers: blockerReport.activeBlockers,
    nextRecommendedPhase: decision.nextSupabaseAction,
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
    phase: SUPABASE_SCHEMA_PARITY_REMEDIATION_PHASE,
    runId: SUPABASE_SCHEMA_PARITY_REMEDIATION_RUN_ID,
    status: 'metadata_committed_only',
    privateUploadRequired: false,
    privateUploadPerformed: false,
    committedArtifacts: [
      SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
      ...SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS,
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
    secretPayloadAccess: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildOption(
  optionId: SchemaParityRemediationOptionId,
  status: SchemaParityRemediationOptionStatus,
  recommendation: string,
  risk: SchemaParityRiskLevel,
  prerequisites: string[],
) {
  return {
    optionId,
    status,
    recommendation,
    safety: status === 'recommended_next_approval_path' ? 'conditional_after_human_approval' : 'not_safe_to_execute_now',
    migrationHistoryImpact:
      optionId === 'migration_history_repair_only'
        ? 'would mutate history without applying absent schema effects'
        : optionId === 'staging_reset_and_reapply_migrations'
          ? 'can rebuild migration history through canonical migration chain after reset approval'
          : 'requires separate dry-run and execution evidence',
    dataImpact:
      optionId === 'staging_reset_and_reapply_migrations'
        ? 'potential staging data loss unless preservation/export is approved'
        : 'unknown_until_human_review',
    schemaImpact: optionId === 'do_nothing' ? 'none_leaves_drift' : 'would alter staging schema in future execution phase',
    productionRisk: 'none_in_this_packet_production_blocked',
    rollbackDifficulty: optionId === 'staging_reset_and_reapply_migrations' ? 'high' : risk,
    prerequisites,
    recommended: status === 'recommended_next_approval_path',
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
  }
}

function classifyMissingEffectRisk(input: {
  changesData: boolean
  expectedStorageBuckets: string[]
  expectedPolicies: unknown[]
  expectedRlsTables: unknown[]
  destructiveStatements: string[]
  policyReplacementStatementCount: number
  missingObjects: string[]
}): SchemaParityRiskLevel {
  if (
    input.changesData ||
    input.expectedStorageBuckets.length > 0 ||
    input.expectedPolicies.length > 0 ||
    input.expectedRlsTables.length > 0 ||
    input.destructiveStatements.length > 0 ||
    input.policyReplacementStatementCount > 0 ||
    input.missingObjects.length > 20
  ) {
    return 'high'
  }
  if (input.missingObjects.length > 0) return 'medium'
  return 'low'
}

function buildMissingEffectBlockers(input: {
  changesData: boolean
  expectedStorageBuckets: string[]
  expectedPolicies: unknown[]
  expectedRlsTables: unknown[]
  destructiveStatements: string[]
  policyReplacementStatementCount: number
}): SchemaParityRemediationBlocker[] {
  const blockers: SchemaParityRemediationBlocker[] = ['remote_schema_equivalence_not_proven']
  if (input.changesData) blockers.push('missing_effects_include_data_changing_migrations')
  if (
    input.expectedStorageBuckets.length > 0 ||
    input.expectedPolicies.length > 0 ||
    input.expectedRlsTables.length > 0 ||
    input.destructiveStatements.length > 0 ||
    input.policyReplacementStatementCount > 0
  ) {
    blockers.push('missing_effects_include_rls_or_storage_policy_changes')
  }
  return Array.from(new Set(blockers))
}

function renderDecisionMarkdown(reports: ReturnType<typeof buildSupabaseSchemaParityRemediationReports>) {
  const strategy = reports.recommendedStrategy
  const risk = reports.riskReport
  return `# Supabase Schema Parity Remediation Decision

Decision: \`${reports.decision.decision}\`

Recommended strategy: \`${strategy.selectedStrategy}\`

This is a strategy packet only. It did not run migration repair, schema deploy, direct SQL, Track B backfill, production SQL, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks.

## Evidence

- PR #241 remote schema equivalence: \`${reports.missingEffectInventory.remoteEquivalenceStatus}\`
- Equivalent missing-history migrations: \`${reports.missingEffectInventory.equivalentMigrationCount}\`
- Non-equivalent missing-history migrations: \`${reports.missingEffectInventory.nonEquivalentMigrationCount}\`
- Overall risk: \`${risk.overallRisk}\`
- Repair-only status: \`rejected\`

## Rationale

${strategy.whySelected}

## Next Action

${strategy.nextRecommendedPhase}
`
}

function renderChecklistMarkdown(reports: ReturnType<typeof buildSupabaseSchemaParityRemediationReports>) {
  return `# Supabase Schema Parity Remediation Operator Checklist

Selected strategy: \`${reports.recommendedStrategy.selectedStrategy}\`

${reports.operatorChecklist.checklist.map((item) => `- [ ] ${item}`).join('\n')}

Blocked in this packet: migration repair, schema deploy, direct SQL, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
`
}

function renderExecutionPrompt(reports: ReturnType<typeof buildSupabaseSchemaParityRemediationReports>) {
  return `# Supabase Staging Schema Parity Remediation Execution Prompt

Use this only in a separate approved execution phase.

Decision from strategy packet: \`${reports.decision.decision}\`
Recommended strategy: \`${reports.recommendedStrategy.selectedStrategy}\`

Rules:
- execute only the separately approved strategy
- staging only
- no production
- no Track B backfill in the same phase unless separately approved later
- no migration-history repair-only path
- no secrets printed or committed
- dry-run first
- verify all PR #241 missing effects after remediation
- rerun PR #223 deploy transport or PR #198 backfill only according to the approved follow-up scope

This packet did not run migration repair, schema deploy, direct SQL, Track B backfill, or production SQL.
`
}

function readJson(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readNumber(record: JsonRecord, key: string): number {
  const value = record[key]
  return typeof value === 'number' ? value : 0
}

function readArray(record: JsonRecord, key: string): unknown[] {
  const value = record[key]
  return Array.isArray(value) ? value : []
}

function readStringArray(record: JsonRecord, key: string): string[] {
  return readArray(record, key).filter((value): value is string => typeof value === 'string')
}

function readConfidence(record: JsonRecord): 'high' | 'medium' | 'low' {
  const value = record.confidence
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'low'
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
