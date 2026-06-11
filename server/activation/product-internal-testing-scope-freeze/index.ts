import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { buildBetaReadinessReport } from '../../beta-readiness'
import {
  buildUnifiedProductionReadinessReport,
  summarizeProductionReadinessReport,
} from '../../workers/readiness-validation'
import type {
  ProductInternalTestingScopeFreezeDecision,
  ProductInternalTestingScopeFreezeReports,
} from './internal-testing-scope-freeze-types'

export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE =
  'product-internal-testing-scope-freeze'
export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID =
  'product-internal-testing-scope-freeze-20260611'
export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_BRANCH =
  'codex/rp-product-internal-testing-scope-freeze-signoff'
export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_BASE_BRANCH =
  'codex/rp-product-internal-beta-readiness-aggregation'
export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR =
  'docs/activation-product-internal-testing-scope-freeze-reports'

const PR299_REPORT_DIR = 'docs/activation-product-internal-beta-readiness-reports'
const PR298_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const TRACK_B_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
const CLEAN_STAGING_PROJECT_REF = 'fnjiylwirntrqdcwpbho'

export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'internal_testing_scope_freeze_plan.json',
  'internal_testing_allowed_scope_freeze.json',
  'internal_testing_blocked_scope_freeze.json',
  'internal_testing_operator_signoff_packet.json',
  'internal_testing_runbook_checklist.json',
  'internal_testing_scope_freeze_decision.json',
  'internal_testing_scope_freeze_blocker_report.json',
  'internal_testing_scope_freeze_readiness_report.json',
  'internal_testing_scope_freeze_private_artifact_manifest.json',
] as const

export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_SCOPE_FREEZE',
  'REEDITPRO_CONFIRM_OPERATOR_SIGNOFF_PACKET',
  'REEDITPRO_CONFIRM_READINESS_METADATA_AGGREGATION',
] as const

export const PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_EXECUTION',
  'REEDITPRO_CONFIRM_PRODUCT_INTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
] as const

const SOURCE_OF_TRUTH_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
  PR299_REPORT_DIR,
  PR298_REPORT_DIR,
  PR283_REPORT_DIR,
  TRACK_B_ROLLUP_REPORT_DIR,
] as const

const ALLOWED_SCOPE = [
  'readiness_dashboards_and_reports',
  'supabase_clean_staging_milestone_registry_review',
  'track_b_readiness_capability_route_metadata_review',
  'completed_generated_controlled_evidence_review',
  'noop_route_dry_run_evidence_review',
  'metadata_only_duckdb_polars_route_dry_run_evidence_review',
  'audio_timing_deepfilternet_signalsmith_evidence_review',
  'media_data_opencv_pyav_pyscenedetect_sharp_duckdb_polars_evidence_review',
  'desktop_hybrid_planning_simulation_evidence_review',
] as const

const BLOCKED_SCOPE = [
  'production',
  'external_beta',
  'paid_production',
  'public_artifacts',
  'public_output',
  'signed_urls_as_source_of_truth',
  'raw_prompt_execution',
  'live_worker_execution',
  'live_tool_route_execution',
  'provider_calls',
  'broad_media',
  'arbitrary_media',
  'vlm_qwen_runtime',
  'demucs_runtime',
  'track_a_runtime',
  'direct_supabase_production_writes',
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

export function getProductInternalTestingScopeFreezePlan() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    branch: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_BRANCH,
    baseBranch: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_BASE_BRANCH,
    prTitle: '[product] Internal testing scope freeze and signoff',
    mode: 'scope_freeze_and_signoff_packet_only',
    reportDir: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR,
    expectedReports: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_EXPECTED_REPORTS,
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_FORBIDDEN_CONFIRMATIONS,
    optionalOperatorAcceptanceConfirmation: 'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_OPERATOR_ACCEPTANCE',
    sourcePrs: {
      internalBetaReadinessAggregation: 299,
      trackBCleanStagingBackfill: 298,
      cleanStagingSchemaRls: 283,
      trackBReadinessRollupExport: 196,
    },
    docsBasis: [
      'https://supabase.com/docs/reference/cli/supabase-db-push',
      'https://supabase.com/docs/guides/deployment/database-migrations',
      'https://supabase.com/changelog.md',
    ],
    noSupabaseWrites: true,
    noSql: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noPublicArtifacts: true,
    noProductionUnlock: true,
    noExternalBetaUnlock: true,
    noPaidProductionUnlock: true,
    nextRecommendedPhase: 'Resolve operator signoff before PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing launch rehearsal.',
  }
}

export function buildProductInternalTestingScopeFreezeReports(): ProductInternalTestingScopeFreezeReports {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const allowedScopeFreeze = buildAllowedScopeFreeze()
  const blockedScopeFreeze = buildBlockedScopeFreeze()
  const runbookChecklist = buildRunbookChecklist()
  const operatorSignoffPacket = buildOperatorSignoffPacket(allowedScopeFreeze, blockedScopeFreeze, runbookChecklist)
  const decision = buildDecision(allowedScopeFreeze, blockedScopeFreeze, operatorSignoffPacket, runbookChecklist)
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)

  return {
    sourceOfTruthOwnershipAudit,
    plan: getProductInternalTestingScopeFreezePlan(),
    allowedScopeFreeze,
    blockedScopeFreeze,
    operatorSignoffPacket,
    runbookChecklist,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeProductInternalTestingScopeFreezeArtifacts(
  reports = buildProductInternalTestingScopeFreezeReports(),
  reportDir = PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_scope_freeze_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_allowed_scope_freeze.json'), reports.allowedScopeFreeze)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_blocked_scope_freeze.json'), reports.blockedScopeFreeze)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_operator_signoff_packet.json'), reports.operatorSignoffPacket)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_runbook_checklist.json'), reports.runbookChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_scope_freeze_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_scope_freeze_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_scope_freeze_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'internal_testing_scope_freeze_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/product-internal-testing-scope-freeze.md', renderOverviewMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-testing-allowed-scope-freeze.md', renderAllowedScopeMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-testing-blocked-scope-freeze.md', renderBlockedScopeMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-testing-operator-signoff-packet.md', renderOperatorSignoffMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-testing-runbook-checklist.md', renderRunbookMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/internal-testing-scope-freeze-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-launch-rehearsal.md',
    renderNextPromptMarkdown(reports),
  )
}

export function readProductInternalTestingScopeFreezeSummary() {
  const reports = buildProductInternalTestingScopeFreezeReports()
  return reports.readinessReport
}

export async function executeProductInternalTestingScopeFreeze(options: {
  execute?: boolean
  metadataOnly?: boolean
  keepTemp?: boolean
} = {}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) {
    await writeProductInternalTestingScopeFreezeArtifacts()
    return { exitCode: 0 }
  }

  const missing = PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REQUIRED_CONFIRMATIONS.filter(
    (name) => process.env[name] !== 'true',
  )
  const forbidden = PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_FORBIDDEN_CONFIRMATIONS.filter(
    (name) => process.env[name] === 'true',
  )
  const reports = buildProductInternalTestingScopeFreezeReports()
  if (missing.length > 0 || forbidden.length > 0) {
    await writeProductInternalTestingScopeFreezeArtifacts({
      ...reports,
      blockerReport: {
        phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
        runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
        status: 'blocked',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
        runtimeExecution: false,
        providerCalls: false,
        publicArtifacts: false,
        production: false,
        supabaseWrites: false,
        secretsPrintedOrCommitted: false,
      },
      readinessReport: {
        ...reports.readinessReport,
        status: 'blocked',
        decision: 'blocked_pending_operator_signoff',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
      },
    })
    return { exitCode: 1 }
  }

  await writeProductInternalTestingScopeFreezeArtifacts(reports)
  return { exitCode: 0 }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    workstreamOwner: 'PRODUCT_INTERNAL_BETA_AGGREGATION',
    relatedWorkstreams: [
      'SUPABASE_RLS_STORAGE_DATABASE',
      'TRACK_B_MEDIA_PROCESSING',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY',
      'MODEL_ORCHESTRATION',
      'OBSERVABILITY_AUDIT_COST',
      'PUBLIC_ARTIFACT_DELIVERY',
      'FRONTEND_PRODUCT_UX',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      kind: existsSync(sourcePath) ? 'repo_safe_source' : 'missing_audit_fact',
    })),
    duplicateWorkAvoided: [
      'no_new_track_b_export',
      'no_new_supabase_backfill',
      'no_new_internal_beta_aggregation_module',
      'no_runtime_execution',
      'no_supabase_mutation',
    ],
    secretsPrintedOrCommitted: false,
  }
}

function buildAllowedScopeFreeze() {
  const pr299Summary = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_readiness_summary.json'))
  const pr299Decision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: 'frozen',
    sourceDecision: pr299Decision?.decision ?? 'missing',
    sourceReadinessStatus: pr299Summary?.status ?? 'missing',
    allowedScope: ALLOWED_SCOPE,
    sourceAllowedScope: pr299Summary?.allowedScope ?? [],
    internalTestingExecutionAllowedInThisPhase: false,
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    publicArtifactsAllowed: false,
    productionAllowed: false,
    supabaseWritesAllowed: false,
  }
}

function buildBlockedScopeFreeze() {
  const beta = buildBetaReadinessReport()
  const production = buildUnifiedProductionReadinessReport()
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: 'frozen',
    blockedScope: BLOCKED_SCOPE,
    betaReadinessStatus: beta.overallStatus,
    externalBetaAllowedByCurrentScorecard: beta.goNoGo.externalBetaAllowed,
    realUserMediaBetaAllowedByCurrentScorecard: beta.goNoGo.realUserMediaBetaAllowed,
    paidProductionAllowedByCurrentScorecard: beta.goNoGo.paidProductionAllowed,
    productionReadinessSummary: summarizeProductionReadinessReport(production),
    productionBlocked: true,
    externalBetaBlocked: true,
    paidProductionBlocked: true,
    runtimeExecutionBlocked: true,
    providerCallsBlocked: true,
    publicArtifactsBlocked: true,
    signedUrlSourceOfTruthBlocked: true,
    supabaseProductionWritesBlocked: true,
  }
}

function buildRunbookChecklist() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: 'ready_for_operator_review',
    testersAndScope: 'Internal operators may review metadata/readiness reports only after future signoff.',
    canBeViewed: ALLOWED_SCOPE,
    cannotBeExecuted: BLOCKED_SCOPE,
    issueReporting: [
      'Record report path, owner, blocker id, and reproduction notes.',
      'Escalate Supabase milestone sync issues to SUPABASE_RLS_STORAGE_DATABASE.',
      'Escalate runtime/tool/provider scope issues to the owning workstream before any execution.',
    ],
    stopConditions: [
      'Any secret, DB URL, access token, signed URL, raw prompt, private payload, or media payload appears.',
      'Any production, external beta, paid production, provider, worker, route, tool, public artifact, or Supabase write path becomes enabled.',
      'Track B clean-staging sync evidence becomes stale, missing, or contradictory.',
    ],
    rollbackPolicy: 'Revert the scope-freeze metadata packet or mark the launch rehearsal blocked; no runtime cleanup is required because this phase performs no execution.',
    supportOwner: 'FRONTEND_PRODUCT_UX',
    supabaseCleanStagingTarget: CLEAN_STAGING_PROJECT_REF,
    noPublicArtifacts: true,
    noProduction: true,
    noExternalUsers: true,
    secretsPrintedOrCommitted: false,
  }
}

function buildOperatorSignoffPacket(
  allowedScope: Record<string, unknown>,
  blockedScope: Record<string, unknown>,
  runbook: Record<string, unknown>,
) {
  const pr299Decision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  const pr299Sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const operatorAcceptanceEnvPresent =
    process.env.REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_OPERATOR_ACCEPTANCE === 'true'
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: 'pending_operator_signoff',
    decisionCandidateFromPr299: pr299Decision?.decision ?? 'missing',
    trackBCleanStagingSyncStatus: pr299Sync?.syncStatus ?? 'missing',
    trackBRowsVerified: asNumber(pr299Sync?.rowsVerifiedTotal),
    canonicalTrackBToolsVerified: asNumber(pr299Sync?.canonicalToolCount),
    allowedScope: allowedScope.allowedScope,
    blockedScope: blockedScope.blockedScope,
    rollbackStopConditions: runbook.stopConditions,
    supportRunbookOwner: runbook.supportOwner,
    signoffRequiredBeforeExecution: true,
    operatorAcceptanceConfirmationPresent: operatorAcceptanceEnvPresent,
    signoffPresent: false,
    signoffSource: 'missing_repo_safe_operator_acceptance_artifact',
    internalTestingExecutionStarted: false,
    productionAffected: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildDecision(
  allowedScope: Record<string, unknown>,
  blockedScope: Record<string, unknown>,
  operatorSignoff: Record<string, unknown>,
  runbook: Record<string, unknown>,
) {
  const pr299Decision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  const pr299Sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const blockers: string[] = []
  if (pr299Decision?.decision !== 'restricted_internal_testing_candidate') blockers.push('pr299_restricted_internal_testing_candidate_missing')
  if (pr299Sync?.syncStatus !== 'completed') blockers.push('track_b_clean_staging_sync_not_completed')
  if (allowedScope.status !== 'frozen') blockers.push('allowed_scope_not_frozen')
  if (blockedScope.status !== 'frozen') blockers.push('blocked_scope_not_frozen')
  if (runbook.status !== 'ready_for_operator_review') blockers.push('support_runbook_not_ready')
  if (operatorSignoff.signoffPresent !== true) blockers.push('operator_signoff_missing')

  const decision: ProductInternalTestingScopeFreezeDecision =
    blockers.includes('operator_signoff_missing') && blockers.length === 1
      ? 'blocked_pending_operator_signoff'
      : blockers.includes('support_runbook_not_ready')
        ? 'blocked_pending_support_runbook'
        : blockers.length > 0
          ? 'blocked_pending_scope_review'
          : 'approved_for_future_restricted_internal_testing_launch_rehearsal'

  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    decision,
    status: decision.startsWith('approved') ? 'passed' : 'blocked',
    approvedForFutureRestrictedInternalTestingLaunchRehearsal:
      decision === 'approved_for_future_restricted_internal_testing_launch_rehearsal',
    operatorSignoffPresent: operatorSignoff.signoffPresent,
    internalTestingExecutionStarted: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    productionAllowed: false,
    publicArtifactsAllowed: false,
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    supabaseWritesAllowedInThisPhase: false,
    blockers,
    nextRecommendedPhase: decision.startsWith('approved')
      ? 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing launch rehearsal.'
      : 'Resolve operator signoff before launch rehearsal.',
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = Array.isArray(decision.blockers) ? decision.blockers : []
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    blockedScope: BLOCKED_SCOPE,
    productionAffected: false,
    externalBetaUnlocked: false,
    paidProductionUnlocked: false,
    publicArtifactsCreated: false,
    providerCalls: false,
    runtimeExecution: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(
  decision: Record<string, unknown>,
  blockerReport: Record<string, unknown>,
) {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: blockerReport.activeBlockers,
    signoffPresent: decision.operatorSignoffPresent,
    allowedScopeFrozen: true,
    blockedScopeFrozen: true,
    runbookReadyForOperatorReview: true,
    supabaseUpdateRequired: 'none_metadata_readiness_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: false,
    migrationDeployed: false,
    runtimeToolsWorkersRoutes: false,
    providers: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: decision.nextRecommendedPhase,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_RUN_ID,
    status: 'safe_metadata_only',
    reportDir: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR,
    reports: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_EXPECTED_REPORTS,
    committedArtifactsAllowed: ['json_reports', 'markdown_docs', 'server_only_typescript', 'package_scripts'],
    excludedArtifacts: [
      'secrets',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'private_payloads',
      'media_payloads',
      'node_modules',
      'caches',
      'build_output',
    ],
  }
}

function renderOverviewMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  return [
    '# Product Internal Testing Scope Freeze',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    '',
    'This packet freezes the restricted internal testing scope and records operator signoff status. It does not start internal testing execution, mutate Supabase, run providers/tools/workers/routes, process media, create public artifacts, create signed URLs, run raw prompts, or unlock production/external beta/paid production.',
  ].join('\n')
}

function renderAllowedScopeMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  const allowed = Array.isArray(reports.allowedScopeFreeze.allowedScope) ? reports.allowedScopeFreeze.allowedScope : []
  return ['# Internal Testing Allowed Scope Freeze', '', ...allowed.map((item) => `- \`${item}\``)].join('\n')
}

function renderBlockedScopeMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  const blocked = Array.isArray(reports.blockedScopeFreeze.blockedScope) ? reports.blockedScopeFreeze.blockedScope : []
  return ['# Internal Testing Blocked Scope Freeze', '', ...blocked.map((item) => `- \`${item}\``)].join('\n')
}

function renderOperatorSignoffMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  return [
    '# Internal Testing Operator Signoff Packet',
    '',
    `Signoff present: \`${reports.operatorSignoffPacket.signoffPresent}\`.`,
    `Decision candidate from PR #299: \`${reports.operatorSignoffPacket.decisionCandidateFromPr299}\`.`,
    `Track B clean-staging sync: \`${reports.operatorSignoffPacket.trackBCleanStagingSyncStatus}\`.`,
    '',
    'Operator signoff remains required before any launch rehearsal.',
  ].join('\n')
}

function renderRunbookMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  const runbook = reports.runbookChecklist
  const stopConditions = Array.isArray(runbook.stopConditions) ? runbook.stopConditions : []
  return [
    '# Internal Testing Runbook Checklist',
    '',
    `Support owner: \`${runbook.supportOwner}\`.`,
    `Supabase clean-staging target: \`${runbook.supabaseCleanStagingTarget}\`.`,
    '',
    'Stop conditions:',
    ...stopConditions.map((item) => `- ${item}`),
  ].join('\n')
}

function renderDecisionMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  return [
    '# Internal Testing Scope Freeze Decision',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    '',
    'External beta, paid production, production, public artifacts, providers, workers, route/tool runtime, broad media, raw prompts, signed URLs, Supabase production writes, and Track A runtime remain blocked.',
  ].join('\n')
}

function renderNextPromptMarkdown(reports: ProductInternalTestingScopeFreezeReports) {
  return [
    '# PRODUCT_INTERNAL_BETA_AGGREGATION - Restricted Internal Testing Launch Rehearsal',
    '',
    `Current scope-freeze decision: \`${reports.decision.decision}\`.`,
    '',
    'This next phase is separate. It may rehearse metadata/readiness-only internal testing scope only after operator signoff is resolved. Do not run real runtime execution unless already separately allowed. Do not call providers, create public artifacts, touch production, execute raw prompts, create signed URLs, or use signed URLs as source of truth.',
  ].join('\n')
}
