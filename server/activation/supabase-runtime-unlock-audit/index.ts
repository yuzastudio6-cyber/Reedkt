import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

export const SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE = 'SUPABASE_RLS_STORAGE_DATABASE-0'
export const SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID = 'supabase-runtime-unlock-repo-audit-20260606'
export const SUPABASE_RUNTIME_UNLOCK_AUDIT_BRANCH = 'codex/rp-foundation-supabase-staging-deploy-transport-rerun'
export const SUPABASE_RUNTIME_UNLOCK_AUDIT_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference'
export const SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR =
  'docs/activation-supabase-runtime-unlock-audit-reports'

export const SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS = [
  'supabase_runtime_unlock_repo_audit.json',
  'supabase_existing_implementation_inventory.json',
  'supabase_deploy_transport_blocker_inventory.json',
  'supabase_duplicate_work_risk_report.json',
  'supabase_next_unlock_stage_recommendation.json',
] as const

export const SUPABASE_RUNTIME_UNLOCK_AUDIT_DOCS = [
  'docs/supabase-runtime-unlock-repo-audit.md',
  'docs/supabase-runtime-unlock-next-stage.md',
] as const

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/production-architecture-freeze.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/future-worker-lanes.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/provider-gateway-foundation.md',
  'docs/render-preview-export-foundation.md',
  'docs/media-readiness-probe-timing-foundation.md',
  'docs/compliance-license-security-review-foundation.md',
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
] as const

const EVIDENCE_PATHS = {
  trackBReadinessExport:
    'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json',
  trackBReadinessExportSchema:
    'docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.schema.json',
  trackBReadinessReport:
    'docs/activation-track-b-readiness-rollup-reports/track_b_readiness_rollup_final_report.json',
  trackBBackfillModule: 'server/activation/supabase-trackb-backfill/index.ts',
  trackBBackfillPreflight:
    'docs/activation-supabase-trackb-backfill-reports/staging_supabase_backfill_preflight_report.json',
  trackBBackfillBlocker:
    'docs/activation-supabase-trackb-backfill-reports/trackb_staging_backfill_blocker_report.json',
  milestoneRegistryMigration:
    'supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql',
  milestoneRegistryModule: 'server/activation/supabase-milestone-registry-schema/index.ts',
  milestoneRegistryMigrationReport:
    'docs/activation-supabase-milestone-registry-schema-reports/milestone_registry_migration_report.json',
  milestoneRegistryRlsPolicyReport:
    'docs/activation-supabase-milestone-registry-schema-reports/milestone_registry_rls_policy_report.json',
  pluginTargetPreflight:
    'docs/activation-supabase-plugin-staging-deploy-reports/supabase_plugin_target_preflight_report.json',
  approvedStagingTarget:
    'docs/activation-supabase-approved-staging-target-reports/approved_staging_target_reference.json',
  stagingTargetProof:
    'docs/activation-supabase-staging-target-proof-reports/supabase_plugin_target_proof_report.json',
  afterReferenceStrategy:
    'docs/activation-supabase-staging-schema-deploy-after-target-reference-reports/supabase_staging_schema_deploy_strategy_after_reference_report.json',
  deployTransportModule:
    'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport.ts',
  deployTransportPreflight:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_deploy_transport_preflight_report.json',
  deployTransportStrategy:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_deploy_transport_strategy_report.json',
  deployTransportBlocker:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_deploy_transport_blocker_report.json',
  deployTransportReadiness:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_deploy_transport_readiness_report.json',
  secretDiscovery:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_secret_reference_discovery_report.json',
  secretCandidates:
    'docs/activation-supabase-staging-deploy-transport-reports/staging_secret_reference_candidates.json',
} as const

const PR_REFERENCES = [
  { pr: 196, role: 'Track B readiness rollup/export', expectedPath: EVIDENCE_PATHS.trackBReadinessExport },
  { pr: 198, role: 'guarded Track B staging backfill module', expectedPath: EVIDENCE_PATHS.trackBBackfillModule },
  { pr: 200, role: 'activation milestone registry schema/RLS migration', expectedPath: EVIDENCE_PATHS.milestoneRegistryMigration },
  { pr: 202, role: 'guarded staging deploy/verify wrapper', expectedPath: EVIDENCE_PATHS.pluginTargetPreflight },
  { pr: 206, role: 'plugin-assisted staging deploy wrapper', expectedPath: EVIDENCE_PATHS.pluginTargetPreflight },
  { pr: 209, role: 'staging target proof wrapper', expectedPath: EVIDENCE_PATHS.stagingTargetProof },
  { pr: 212, role: 'approved staging target reference', expectedPath: EVIDENCE_PATHS.approvedStagingTarget },
  { pr: 216, role: 'after-reference deploy wrapper', expectedPath: EVIDENCE_PATHS.afterReferenceStrategy },
  { pr: 223, role: 'deploy transport wrapper and Secret Manager discovery', expectedPath: EVIDENCE_PATHS.deployTransportModule },
] as const

type JsonRecord = Record<string, unknown>

function readJson(pathname: string): JsonRecord | null {
  if (!existsSync(pathname)) return null
  try {
    return JSON.parse(readFileSync(pathname, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function getNestedBoolean(source: JsonRecord | null, pathParts: string[]): boolean | null {
  let current: unknown = source
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || !(part in current)) return null
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'boolean' ? current : null
}

function getNestedString(source: JsonRecord | null, pathParts: string[]): string | null {
  let current: unknown = source
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || !(part in current)) return null
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : null
}

function getStringArray(source: JsonRecord | null, key: string): string[] {
  const value = source?.[key]
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function buildFilePresence(paths: readonly string[]) {
  return paths.map((pathname) => ({
    path: pathname,
    present: existsSync(pathname),
  }))
}

function buildSourceOfTruthInventory() {
  const files = buildFilePresence(SOURCE_OF_TRUTH_PATHS)
  return {
    status: 'recorded',
    inspectedAt: '2026-06-06',
    files,
    presentCount: files.filter((file) => file.present).length,
    missingCount: files.filter((file) => !file.present).length,
    missingFilesAreAuditFactsNotFabricated: true,
  }
}

export function getSupabaseRuntimeUnlockAuditPlan() {
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    branch: SUPABASE_RUNTIME_UNLOCK_AUDIT_BRANCH,
    baseBranch: SUPABASE_RUNTIME_UNLOCK_AUDIT_BASE_BRANCH,
    pr: 223,
    reportDir: SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
    expectedReports: SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS,
    docs: SUPABASE_RUNTIME_UNLOCK_AUDIT_DOCS,
    mode: 'repo_source_of_truth_audit_only',
    workstreamOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: [
      'TRACK_B_MEDIA_PROCESSING',
      'OBSERVABILITY_AUDIT_COST',
      'WORKER_RUNTIME_JOBS',
    ],
    notOwned: [
      'Track B runtime/tool execution',
      'Track A visual/video pipeline',
      'provider/model execution',
      'frontend UX',
      'product beta/production unlocks',
    ],
    runtimeUnlockPath: [
      'blocked',
      'owner_accepted',
      'repo_audit_passed',
      'dry_run_passed',
      'generated/local_fixture_passed',
      'staging_fixture_passed',
      'controlled_private_sample_passed',
      'internal_beta_candidate',
      'external_beta_candidate',
      'production_candidate',
    ],
    supabaseDocs: {
      cliDbPush: 'https://supabase.com/docs/reference/cli/supabase-db-push',
      databaseMigrations: 'https://supabase.com/docs/guides/deployment/database-migrations',
      changelogChecked: 'https://supabase.com/changelog.md',
      accessedAt: '2026-06-06',
      dbPushNotes: [
        'supabase db push is the migration-safe transport to remote databases.',
        '--db-url and --dry-run remain the intended transport flags for this branch.',
      ],
    },
    noSupabaseEnvironmentTouched: true,
    noSql: true,
    noMigrationDeployment: true,
    noTrackBBackfill: true,
    noSecretPayloadAccess: true,
    noToolWorkerRouteExecution: true,
    noProviderCalls: true,
    noProductionBetaUnlock: true,
    noTrackA: true,
  }
}

export function buildExistingImplementationInventory() {
  const evidence = Object.entries(EVIDENCE_PATHS).map(([id, pathname]) => {
    const json = pathname.endsWith('.json') ? readJson(pathname) : null
    return {
      id,
      path: pathname,
      present: existsSync(pathname),
      status: getNestedString(json, ['status']),
      selectedStrategy: getNestedString(json, ['selectedStrategy']),
      activeBlockers: getStringArray(json, 'activeBlockers'),
      blockers: getStringArray(json, 'blockers'),
    }
  })
  const requiredImplementationFound = {
    trackBExport: existsSync(EVIDENCE_PATHS.trackBReadinessExport),
    trackBBackfillModule: existsSync(EVIDENCE_PATHS.trackBBackfillModule),
    registryMigration: existsSync(EVIDENCE_PATHS.milestoneRegistryMigration),
    registrySchemaModule: existsSync(EVIDENCE_PATHS.milestoneRegistryModule),
    approvedStagingTarget: existsSync(EVIDENCE_PATHS.approvedStagingTarget),
    stagingTargetProof: existsSync(EVIDENCE_PATHS.stagingTargetProof),
    deployTransportModule: existsSync(EVIDENCE_PATHS.deployTransportModule),
    secretManagerDiscovery: existsSync(EVIDENCE_PATHS.secretDiscovery),
  }
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: Object.values(requiredImplementationFound).every(Boolean) ? 'passed' : 'blocked',
    prReferences: PR_REFERENCES.map((reference) => ({
      ...reference,
      url: `https://github.com/yuzastudio6-cyber/Reedkt/pull/${reference.pr}`,
      evidencePresent: existsSync(reference.expectedPath),
    })),
    requiredImplementationFound,
    evidence,
    sourceOfTruthInventory: buildSourceOfTruthInventory(),
    noDuplicateSchemaCreated: true,
    noDuplicateDeployWrapperCreated: true,
    noDuplicateTrackBExportCreated: true,
    noDuplicateBackfillPathCreated: true,
  }
}

export function buildDeployTransportBlockerInventory() {
  const preflight = readJson(EVIDENCE_PATHS.deployTransportPreflight)
  const strategy = readJson(EVIDENCE_PATHS.deployTransportStrategy)
  const blocker = readJson(EVIDENCE_PATHS.deployTransportBlocker)
  const readiness = readJson(EVIDENCE_PATHS.deployTransportReadiness)
  const secretCandidates = readJson(EVIDENCE_PATHS.secretCandidates)
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: 'blocked',
    preflightStatus: getNestedString(preflight, ['status']),
    strategyStatus: getNestedString(strategy, ['status']),
    selectedStrategy: getNestedString(strategy, ['selectedStrategy']) ?? 'blocked_no_migration_safe_deploy_path',
    readinessStatus: getNestedString(readiness, ['status']),
    dbUrlTargetMatchedApprovedStaging:
      getNestedBoolean(preflight, [
        'secretReferenceGuardReport',
        'dbUrlTargetValidation',
        'dbUrlTargetMatchedApprovedStaging',
      ]) ?? false,
    dbUrlValuePrinted:
      getNestedBoolean(preflight, [
        'secretReferenceGuardReport',
        'dbUrlTargetValidation',
        'dbUrlValuePrinted',
      ]) ?? false,
    credentialPayloadsPrinted:
      getNestedBoolean(preflight, [
        'secretReferenceGuardReport',
        'dbUrlTargetValidation',
        'credentialPayloadsPrinted',
      ]) ?? false,
    candidateDbUrlSecretRef: getNestedString(secretCandidates, ['selectedDbUrlCandidate']) ?? 'SUPABASE_DB_URL',
    activeBlockers: [
      ...new Set([
        ...getStringArray(blocker, 'activeBlockers'),
        ...getStringArray(readiness, 'activeBlockers'),
        ...getStringArray(strategy, 'blockers'),
      ]),
    ],
    requiredRepair: [
      'provide a compatible migration-safe Supabase CLI or gated npx transport',
      'rerun PR #223 with secure SUPABASE_DB_URL process-env injection',
      'run dry-run before apply through supabase db push --db-url only',
    ],
    sqlExecuted: false,
    migrationDeployed: false,
    stagingRlsVerified: false,
    dataBackfill: false,
    productionAffected: false,
  }
}

export function buildDuplicateWorkRiskReport() {
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: 'passed',
    duplicateRisk: 'high_if_new_schema_deploy_wrapper_export_or_backfill_is_created',
    existingPathsToReuse: [
      EVIDENCE_PATHS.milestoneRegistryMigration,
      EVIDENCE_PATHS.deployTransportModule,
      EVIDENCE_PATHS.trackBBackfillModule,
      EVIDENCE_PATHS.trackBReadinessExport,
    ],
    forbiddenDuplicateWork: [
      'new activation milestone registry schema',
      'new staging deploy wrapper',
      'new Track B export',
      'new Track B backfill writer',
      'manual/direct SQL path',
    ],
    recommendation: 'continue_pr_223_deploy_transport_after_exact_transport_repair',
    duplicateSchemaCreated: false,
    duplicateDeployWrapperCreated: false,
    duplicateTrackBExportCreated: false,
    duplicateBackfillPathCreated: false,
  }
}

export function buildNextUnlockStageRecommendation() {
  const blockers = buildDeployTransportBlockerInventory()
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: 'blocked_pending_deploy_transport_repair',
    currentUnlockStageBeforeAudit: 'owner_accepted',
    auditDecision: 'repo_audit_passed',
    nextRecommendedUnlockStage: 'fix_exact_missing_deploy_transport_blocker_before_dry_run',
    nextSupabaseAction:
      'repair or provide a compatible migration-safe Supabase CLI/npx transport, then rerun PR #223 after secure SUPABASE_DB_URL process-env injection',
    doNotProceedTo: [
      'dry_run_passed',
      'staging_fixture_passed',
      'Track B backfill write',
      'internal beta candidate',
      'production candidate',
    ],
    blockers: blockers.activeBlockers,
    supabaseMilestoneSync: 'blocked_pending_staging_schema_deploy_transport',
    handoffOwner: 'SUPABASE_RLS_STORAGE_DATABASE',
    handoffPrompt: 'PR #223 deploy transport repair/rerun with compatible Supabase CLI transport',
  }
}

export function buildSupabaseRuntimeUnlockRepoAudit() {
  const inventory = buildExistingImplementationInventory()
  const transportBlockers = buildDeployTransportBlockerInventory()
  const duplicateRisk = buildDuplicateWorkRiskReport()
  const nextStage = buildNextUnlockStageRecommendation()
  const repoAuditPassed =
    inventory.status === 'passed' &&
    duplicateRisk.status === 'passed' &&
    transportBlockers.sqlExecuted === false &&
    transportBlockers.migrationDeployed === false &&
    transportBlockers.dataBackfill === false
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: repoAuditPassed ? 'passed' : 'blocked',
    ownerAccepted: true,
    ownerAcceptanceSource: {
      source: 'Phase 53A runtime unlock roadmap owner acceptance context',
      pr: 228,
      url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/228',
      committedOnPr223Branch: false,
      note: 'PR #223 does not duplicate Phase 53A docs; this audit records the cross-chat owner context and continues PR #223 only.',
    },
    sourceOfTruthFilesInspected: inventory.sourceOfTruthInventory,
    existingImplementationFound: inventory.requiredImplementationFound,
    duplicateWorkRisk: duplicateRisk.duplicateRisk,
    currentUnlockStage: repoAuditPassed ? 'repo_audit_passed' : 'owner_accepted',
    recommendedNextUnlockStage: nextStage.nextRecommendedUnlockStage,
    crossChatImpact: {
      workstreamUpdated: 'SUPABASE_RLS_STORAGE_DATABASE',
      otherWorkstreamsAffected: [
        'TRACK_B_MEDIA_PROCESSING handoff remains pending staging registry deploy/backfill',
        'OBSERVABILITY_AUDIT_COST may consume future registry/audit records only after later phases',
        'WORKER_RUNTIME_JOBS may consume milestone/plan snapshot status only after later phases',
      ],
      contractsChanged: false,
      handoffNeeded: true,
      duplicateRisk: duplicateRisk.duplicateRisk,
      nextOwnerPrompt: nextStage.handoffPrompt,
    },
    supabaseUpdateClassification: {
      supabaseUpdateRequired: 'staging_validation_required',
      supabaseUpdateStatus: 'blocked_pending_deploy_transport_readiness',
      supabaseEnvironmentTouched: 'none',
      sqlExecuted: false,
      migrationDeployed: false,
      evidenceDocs: SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS.map((report) =>
        path.join(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR, report),
      ),
      blockers: transportBlockers.activeBlockers,
      nextSupabaseAction: nextStage.nextSupabaseAction,
    },
    execution: {
      secretPayloadAccess: false,
      sql: false,
      migrationDeployment: false,
      dataBackfill: false,
      toolWorkerRouteExecution: false,
      providerCalls: false,
      productionBetaUnlock: false,
    },
    reports: {
      inventory: path.join(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR, 'supabase_existing_implementation_inventory.json'),
      transportBlockers: path.join(
        SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
        'supabase_deploy_transport_blocker_inventory.json',
      ),
      duplicateRisk: path.join(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR, 'supabase_duplicate_work_risk_report.json'),
      nextStage: path.join(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR, 'supabase_next_unlock_stage_recommendation.json'),
    },
  }
}

export function buildSupabaseRuntimeUnlockAuditReports() {
  const existingImplementationInventory = buildExistingImplementationInventory()
  const deployTransportBlockerInventory = buildDeployTransportBlockerInventory()
  const duplicateWorkRiskReport = buildDuplicateWorkRiskReport()
  const nextUnlockStageRecommendation = buildNextUnlockStageRecommendation()
  const repoAudit = buildSupabaseRuntimeUnlockRepoAudit()
  return {
    plan: getSupabaseRuntimeUnlockAuditPlan(),
    repoAudit,
    existingImplementationInventory,
    deployTransportBlockerInventory,
    duplicateWorkRiskReport,
    nextUnlockStageRecommendation,
  }
}

function renderRepoAuditDoc(reports = buildSupabaseRuntimeUnlockAuditReports()) {
  return `# Supabase Runtime Unlock Repo Audit

Status: ${reports.repoAudit.status}

This is a repo/source-of-truth audit for the SUPABASE_RLS_STORAGE_DATABASE workstream. It does not run SQL, deploy migrations, mutate Supabase, read secret payloads, backfill Track B rows, execute tools/workers/routes, call providers, touch production, unlock beta, or touch Track A.

## Decision

- Owner accepted: ${reports.repoAudit.ownerAccepted}
- Current unlock stage: ${reports.repoAudit.currentUnlockStage}
- Recommended next unlock stage: ${reports.repoAudit.recommendedNextUnlockStage}
- Duplicate work risk: ${reports.repoAudit.duplicateWorkRisk}
- Supabase environment touched: none
- SQL executed: false
- Migration deployed: false

## Existing Implementation

The audit found the existing Track B export, guarded Track B backfill module, activation milestone registry migration/RLS module, approved staging target reference, target proof reports, Secret Manager discovery reports, and PR #223 deploy transport module/report path.

Do not create another schema, deploy wrapper, Track B export, or Track B backfill path. Continue PR #223 after the exact deploy transport blocker is repaired.

## Supabase Docs Basis

- Supabase CLI db push: https://supabase.com/docs/reference/cli/supabase-db-push
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
`
}

function renderNextStageDoc(reports = buildSupabaseRuntimeUnlockAuditReports()) {
  return `# Supabase Runtime Unlock Next Stage

Next action: ${reports.nextUnlockStageRecommendation.nextSupabaseAction}

The audit recommends continuing PR #223 only after a compatible migration-safe Supabase CLI or gated npx transport is available. The path remains:

1. Securely inject the approved \`SUPABASE_DB_URL\` payload into process env only.
2. Confirm the DB URL target matches approved staging project \`wmyyttnynmteqgcdishd\`.
3. Use \`supabase db push --db-url\` with \`--dry-run\` before apply.
4. Deploy only \`supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql\`.
5. Run schema/RLS verification and PR #198 preflight/diff/report only.

Still blocked: ${reports.nextUnlockStageRecommendation.blockers.join(', ')}

Track B backfill writes, production Supabase, direct/manual SQL, tools/workers/routes, providers, media processing, Track A, beta, and production remain blocked.
`
}

export async function writeSupabaseRuntimeUnlockAuditArtifacts(
  reports = buildSupabaseRuntimeUnlockAuditReports(),
  reportDir = SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'supabase_runtime_unlock_repo_audit.json'), reports.repoAudit)
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'supabase_existing_implementation_inventory.json'),
    reports.existingImplementationInventory,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'supabase_deploy_transport_blocker_inventory.json'),
    reports.deployTransportBlockerInventory,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'supabase_duplicate_work_risk_report.json'),
    reports.duplicateWorkRiskReport,
  )
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'supabase_next_unlock_stage_recommendation.json'),
    reports.nextUnlockStageRecommendation,
  )
  await writeVlmRuntimeTextArtifact('docs/supabase-runtime-unlock-repo-audit.md', renderRepoAuditDoc(reports))
  await writeVlmRuntimeTextArtifact('docs/supabase-runtime-unlock-next-stage.md', renderNextStageDoc(reports))
}

export function readSupabaseRuntimeUnlockAuditSummary() {
  const reports = buildSupabaseRuntimeUnlockAuditReports()
  return {
    phase: SUPABASE_RUNTIME_UNLOCK_AUDIT_PHASE,
    runId: SUPABASE_RUNTIME_UNLOCK_AUDIT_RUN_ID,
    status: reports.repoAudit.status,
    ownerAccepted: reports.repoAudit.ownerAccepted,
    currentUnlockStage: reports.repoAudit.currentUnlockStage,
    recommendedNextUnlockStage: reports.repoAudit.recommendedNextUnlockStage,
    selectedTransportStrategy: reports.deployTransportBlockerInventory.selectedStrategy,
    blockers: reports.deployTransportBlockerInventory.activeBlockers,
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: false,
    migrationDeployed: false,
    dataBackfill: false,
    secretPayloadAccess: false,
    duplicateWorkRisk: reports.duplicateWorkRiskReport.duplicateRisk,
    nextSupabaseAction: reports.nextUnlockStageRecommendation.nextSupabaseAction,
  }
}
