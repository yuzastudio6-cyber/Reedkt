import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ProductInternalTestingStartGateDecision,
  ProductInternalTestingStartGateReports,
} from './start-gate-types'

export const PRODUCT_INTERNAL_TESTING_START_GATE_PHASE = 'product-internal-testing-start-gate'
export const PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID = 'product-internal-testing-start-gate-20260612'
export const PRODUCT_INTERNAL_TESTING_START_GATE_BRANCH =
  'codex/rp-product-restricted-internal-testing-start-gate'
export const PRODUCT_INTERNAL_TESTING_START_GATE_BASE_BRANCH =
  'codex/rp-product-restricted-internal-testing-launch-rehearsal'
export const PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR =
  'docs/activation-product-internal-testing-start-gate-reports'

const PR306_REPORT_DIR = 'docs/activation-product-internal-testing-launch-rehearsal-reports'
const PR302_REPORT_DIR = 'docs/activation-product-internal-testing-scope-freeze-reports'
const PR299_REPORT_DIR = 'docs/activation-product-internal-beta-readiness-reports'
const PR298_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const TRACK_B_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
const TRACK_B_CAPABILITY_REPORT_DIR = 'docs/activation-track-b-capability-manifests-reports'
const TRACK_B_ROUTE_REPORT_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
const CLEAN_STAGING_PROJECT_REF = 'fnjiylwirntrqdcwpbho'

export const PRODUCT_INTERNAL_TESTING_START_GATE_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'start_gate_plan.json',
  'start_gate_evidence_validation.json',
  'restricted_internal_testing_start_packet.json',
  'start_gate_blocked_scope_assertion.json',
  'restricted_internal_testing_start_gate_decision.json',
  'start_gate_blocker_report.json',
  'start_gate_readiness_report.json',
  'start_gate_private_artifact_manifest.json',
] as const

export const PRODUCT_INTERNAL_TESTING_START_GATE_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_START_GATE',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_LAUNCH_REHEARSAL',
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_SCOPE_FREEZE',
  'REEDITPRO_CONFIRM_OPERATOR_SIGNOFF_PACKET',
  'REEDITPRO_CONFIRM_READINESS_METADATA_AGGREGATION',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_OPERATOR_ACCEPTANCE',
] as const

export const PRODUCT_INTERNAL_TESTING_START_GATE_FORBIDDEN_CONFIRMATIONS = [
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
  PR306_REPORT_DIR,
  PR302_REPORT_DIR,
  PR299_REPORT_DIR,
  PR298_REPORT_DIR,
  PR283_REPORT_DIR,
  TRACK_B_ROLLUP_REPORT_DIR,
  TRACK_B_CAPABILITY_REPORT_DIR,
  TRACK_B_ROUTE_REPORT_DIR,
] as const

const RELATED_WORKSTREAMS = [
  'PRODUCT_INTERNAL_BETA_AGGREGATION',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'TRACK_B_MEDIA_PROCESSING',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY',
  'MODEL_ORCHESTRATION',
  'OBSERVABILITY_AUDIT_COST',
  'PUBLIC_ARTIFACT_DELIVERY',
  'FRONTEND_PRODUCT_UX',
] as const

const TESTER_MAY_DO_ACTIONS = [
  'review_readiness_dashboards_and_reports',
  'review_clean_staging_milestone_registry_metadata',
  'review_track_b_capability_and_route_metadata',
  'review_completed_evidence_artifacts',
  'submit_issues_through_approved_issue_intake',
  'stop_and_escalate_on_any_blocked_scope_attempt',
] as const

const TESTER_MUST_NOT_DO_ACTIONS = [
  'start_internal_testing_session_0_in_this_phase',
  'execute_tools_workers_routes_or_providers',
  'process_broad_or_arbitrary_media',
  'create_public_artifacts_or_public_output',
  'use_signed_urls_as_source_of_truth',
  'execute_raw_prompts_as_worker_input',
  'mutate_supabase_or_production',
  'unlock_external_beta_paid_production_or_production',
] as const

const BLOCKED_SCOPE_ASSERTIONS = [
  'production',
  'external_beta',
  'paid_production',
  'public_artifacts',
  'signed_url_source_of_truth',
  'raw_prompt_execution',
  'workers_tools_routes_providers',
  'broad_arbitrary_media',
  'vlm_qwen_runtime',
  'demucs_runtime',
  'track_a_runtime',
  'supabase_production_writes',
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function getProductInternalTestingStartGatePlan() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    branch: PRODUCT_INTERNAL_TESTING_START_GATE_BRANCH,
    baseBranch: PRODUCT_INTERNAL_TESTING_START_GATE_BASE_BRANCH,
    prTitle: '[product] Restricted internal testing start gate',
    mode: 'metadata_readiness_final_start_gate_only',
    reportDir: PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR,
    expectedReports: PRODUCT_INTERNAL_TESTING_START_GATE_EXPECTED_REPORTS,
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_START_GATE_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: PRODUCT_INTERNAL_TESTING_START_GATE_FORBIDDEN_CONFIRMATIONS,
    sourcePrs: {
      launchRehearsal: 306,
      scopeFreezeAndSignoff: 302,
      internalBetaReadinessAggregation: 299,
      trackBCleanStagingBackfill: 298,
      cleanStagingSchemaRlsVerification: 283,
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
    session0Started: false,
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing session 0.',
  }
}

export function buildProductInternalTestingStartGateReports(): ProductInternalTestingStartGateReports {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const evidenceValidation = buildEvidenceValidation()
  const startPacket = buildStartPacket(evidenceValidation)
  const blockedScopeAssertion = buildBlockedScopeAssertion(evidenceValidation, startPacket)
  const decision = buildDecision(evidenceValidation, startPacket, blockedScopeAssertion)
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  return {
    sourceOfTruthOwnershipAudit,
    plan: getProductInternalTestingStartGatePlan(),
    evidenceValidation,
    startPacket,
    blockedScopeAssertion,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeProductInternalTestingStartGateArtifacts(
  reports = buildProductInternalTestingStartGateReports(),
  reportDir = PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_evidence_validation.json'), reports.evidenceValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'restricted_internal_testing_start_packet.json'), reports.startPacket)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_blocked_scope_assertion.json'), reports.blockedScopeAssertion)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'restricted_internal_testing_start_gate_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'start_gate_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/product-restricted-internal-testing-start-gate.md', renderOverviewMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-start-packet.md', renderStartPacketMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-start-gate-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-session-0.md', renderSession0InstructionsMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-0.md',
    renderNextPromptMarkdown(reports),
  )
}

export function readProductInternalTestingStartGateSummary() {
  return buildProductInternalTestingStartGateReports().readinessReport
}

export async function executeProductInternalTestingStartGate(options: {
  execute?: boolean
  metadataOnly?: boolean
  keepTemp?: boolean
} = {}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) {
    await writeProductInternalTestingStartGateArtifacts()
    return { exitCode: 0 }
  }

  const missing = PRODUCT_INTERNAL_TESTING_START_GATE_REQUIRED_CONFIRMATIONS.filter(
    (name) => process.env[name] !== 'true',
  )
  const forbidden = PRODUCT_INTERNAL_TESTING_START_GATE_FORBIDDEN_CONFIRMATIONS.filter(
    (name) => process.env[name] === 'true',
  )
  const reports = buildProductInternalTestingStartGateReports()
  if (missing.length > 0 || forbidden.length > 0) {
    const activeBlockers = [
      ...missing.map((name) => `missing_confirmation:${name}`),
      ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ]
    await writeProductInternalTestingStartGateArtifacts({
      ...reports,
      blockerReport: {
        phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
        runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
        status: 'blocked',
        activeBlockers,
        internalTestingExecutionStarted: false,
        session0Started: false,
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
        decision: 'blocked_pending_rehearsal_evidence',
        activeBlockers,
        session0Started: false,
        internalTestingExecutionStarted: false,
      },
    })
    return { exitCode: 1 }
  }

  await writeProductInternalTestingStartGateArtifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1 }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    workstreamOwner: 'PRODUCT_INTERNAL_BETA_AGGREGATION',
    relatedWorkstreams: RELATED_WORKSTREAMS,
    explicitlyNotOwned: [
      'internal_testing_session_0_execution',
      'track_b_runtime_tool_execution',
      'track_a_visual_video_runtime',
      'provider_model_execution',
      'worker_execution',
      'production_deploy',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_delivery',
      'raw_prompt_execution',
      'supabase_mutation',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      kind: existsSync(sourcePath) ? 'repo_safe_source' : 'missing_audit_fact',
    })),
    duplicateWorkAvoided: [
      'no_new_launch_rehearsal_module',
      'no_new_scope_freeze_module',
      'no_new_internal_beta_readiness_module',
      'no_new_track_b_export',
      'no_new_supabase_backfill',
      'no_runtime_execution',
      'no_supabase_mutation',
    ],
    secretsPrintedOrCommitted: false,
  }
}

function buildEvidenceValidation() {
  const rehearsalDecision = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_decision.json'))
  const rehearsalScope = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_scope_signoff_validation.json'))
  const testerFlow = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_tester_flow.json'))
  const issueIntake = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_issue_intake.json'))
  const stopConditions = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_stop_conditions.json'))
  const checklist = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_checklist.json'))
  const signoffDecision = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'))
  const operatorValidation = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_scope_validation.json'))
  const operatorArtifact = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_artifact.json'))
  const betaDecision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  const betaSummary = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_readiness_summary.json'))
  const sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const cleanBranchVerify = readJson(path.join(PR283_REPORT_DIR, 'clean_staging_branch_schema_rls_verify_report.json'))

  const rehearsalPassed =
    rehearsalDecision?.decision === 'restricted_internal_testing_launch_rehearsal_passed' &&
    rehearsalDecision?.status === 'passed' &&
    rehearsalDecision?.launchRehearsalPassed === true
  const scopeSignoffValid =
    rehearsalScope?.status === 'passed' &&
    rehearsalScope?.operatorAcceptanceExists === true &&
    rehearsalScope?.signoffApproved === true &&
    rehearsalScope?.allowedScopeUnchanged === true &&
    rehearsalScope?.blockedScopeUnchanged === true &&
    rehearsalScope?.noUnlockIntroduced === true
  const testerFlowReady = testerFlow?.status === 'rehearsed' && asArray(testerFlow?.testerFlowSteps).length >= 6
  const issueIntakeReady = issueIntake?.status === 'ready' && asArray(issueIntake?.blockerCategories).length >= 7
  const stopConditionsReady = stopConditions?.status === 'ready' && asArray(stopConditions?.stopConditions).length >= 10
  const checklistPassed =
    checklist?.status === 'passed' &&
    asArray(checklist?.checks).length >= 10 &&
    asArray(checklist?.checks).every((item) => (item as { passed?: boolean }).passed === true)
  const signoffApproved =
    signoffDecision?.decision === 'approved_for_future_restricted_internal_testing_launch_rehearsal' &&
    signoffDecision?.operatorSignoffPresent === true &&
    operatorArtifact?.status === 'approved' &&
    operatorValidation?.status === 'passed'
  const betaCandidate =
    betaDecision?.decision === 'restricted_internal_testing_candidate' &&
    betaSummary?.decision === 'restricted_internal_testing_candidate'
  const trackBSyncCompleted =
    sync?.syncStatus === 'completed' &&
    sync?.targetProjectRef === CLEAN_STAGING_PROJECT_REF &&
    asNumber(sync?.rowsVerifiedTotal) === 259 &&
    asNumber(sync?.canonicalToolCount) === 18 &&
    asBool(sync?.productionAffected) === false &&
    asBool(sync?.brokenOriginalStagingAffected) === false &&
    asBool(sync?.trackBRuntimeExecution) === false
  const noScopeDrift =
    asArray(rehearsalScope?.allowedScope).length > 0 &&
    asArray(rehearsalScope?.blockedScope).length > 0 &&
    rehearsalScope?.allowedScopeUnchanged === true &&
    rehearsalScope?.blockedScopeUnchanged === true
  const blockedScopesRemainBlocked =
    rehearsalDecision?.externalBetaAllowed === false &&
    rehearsalDecision?.paidProductionAllowed === false &&
    rehearsalDecision?.productionAllowed === false &&
    rehearsalDecision?.publicArtifactsAllowed === false &&
    rehearsalDecision?.signedUrlSourceOfTruthAllowed === false &&
    rehearsalDecision?.rawPromptExecutionAllowed === false &&
    rehearsalDecision?.runtimeExecutionAllowed === false &&
    rehearsalDecision?.providerCallsAllowed === false &&
    rehearsalDecision?.supabaseWritesAllowedInThisPhase === false &&
    rehearsalScope?.runtimeExecution === false &&
    rehearsalScope?.providerCalls === false &&
    rehearsalScope?.publicArtifacts === false &&
    rehearsalScope?.production === false &&
    rehearsalScope?.supabaseWrites === false &&
    rehearsalScope?.secretsPrintedOrCommitted === false
  const cleanStagingVerified = cleanBranchVerify?.status === 'passed'
  const passed =
    rehearsalPassed &&
    scopeSignoffValid &&
    testerFlowReady &&
    issueIntakeReady &&
    stopConditionsReady &&
    checklistPassed &&
    signoffApproved &&
    betaCandidate &&
    trackBSyncCompleted &&
    noScopeDrift &&
    blockedScopesRemainBlocked &&
    cleanStagingVerified

  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    sourceReports: {
      launchRehearsalDecision: path.join(PR306_REPORT_DIR, 'launch_rehearsal_decision.json'),
      launchRehearsalScopeSignoffValidation: path.join(PR306_REPORT_DIR, 'launch_rehearsal_scope_signoff_validation.json'),
      launchRehearsalIssueIntake: path.join(PR306_REPORT_DIR, 'launch_rehearsal_issue_intake.json'),
      launchRehearsalStopConditions: path.join(PR306_REPORT_DIR, 'launch_rehearsal_stop_conditions.json'),
      launchRehearsalChecklist: path.join(PR306_REPORT_DIR, 'launch_rehearsal_checklist.json'),
      scopeFreezeDecision: path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'),
      internalBetaReadinessDecision: path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'),
      trackBCleanStagingSync: path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'),
      cleanStagingSchemaRlsVerify: path.join(PR283_REPORT_DIR, 'clean_staging_branch_schema_rls_verify_report.json'),
    },
    rehearsalPassed,
    scopeSignoffValid,
    testerFlowReady,
    issueIntakeReady,
    stopConditionsReady,
    checklistPassed,
    signoffApproved,
    betaCandidate,
    trackBCleanStagingSyncCompleted: trackBSyncCompleted,
    trackBRowsVerified: asNumber(sync?.rowsVerifiedTotal),
    canonicalTrackBToolsVerified: asNumber(sync?.canonicalToolCount),
    cleanStagingProjectRef: CLEAN_STAGING_PROJECT_REF,
    cleanStagingSchemaRlsStatus: cleanBranchVerify?.status ?? 'missing',
    noScopeDrift,
    blockedScopesRemainBlocked,
    allowedScope: rehearsalScope?.allowedScope ?? [],
    blockedScope: rehearsalScope?.blockedScope ?? [],
    issueIntakePath: path.join(PR306_REPORT_DIR, 'launch_rehearsal_issue_intake.json'),
    stopConditionsPath: path.join(PR306_REPORT_DIR, 'launch_rehearsal_stop_conditions.json'),
    supportRunbookOwner: 'FRONTEND_PRODUCT_UX',
    internalTestingExecutionStarted: false,
    session0Started: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    blockers: passed
      ? []
      : [
          ...(rehearsalPassed ? [] : ['pr306_launch_rehearsal_not_passed']),
          ...(scopeSignoffValid ? [] : ['scope_signoff_validation_not_passed']),
          ...(testerFlowReady ? [] : ['tester_flow_missing_or_not_rehearsed']),
          ...(issueIntakeReady ? [] : ['issue_intake_not_ready']),
          ...(stopConditionsReady ? [] : ['stop_conditions_not_ready']),
          ...(checklistPassed ? [] : ['launch_rehearsal_checklist_not_passed']),
          ...(signoffApproved ? [] : ['pr302_operator_signoff_not_approved']),
          ...(betaCandidate ? [] : ['pr299_restricted_internal_testing_candidate_missing']),
          ...(trackBSyncCompleted ? [] : ['track_b_clean_staging_sync_not_completed']),
          ...(noScopeDrift ? [] : ['scope_drift_detected']),
          ...(blockedScopesRemainBlocked ? [] : ['blocked_scope_unlock_detected']),
          ...(cleanStagingVerified ? [] : ['clean_staging_schema_rls_verify_not_passed']),
        ],
  }
}

function buildStartPacket(evidenceValidation: Record<string, unknown>) {
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: evidenceValidation.status === 'passed' ? 'ready' : 'blocked',
    startGateMode: 'metadata_readiness_only',
    startGateMayApprove: 'restricted_internal_testing_start',
    session0Started: false,
    internalTestingExecutionStarted: false,
    allowedScope: evidenceValidation.allowedScope ?? [],
    blockedScope: evidenceValidation.blockedScope ?? [],
    testerFlowSummary: [
      'review readiness reports and dashboards',
      'review Track B clean-staging registry metadata',
      'review allowed and blocked scope',
      'review evidence artifacts',
      'file issues through approved intake',
      'stop on blocked-scope attempts',
    ],
    issueIntakePath: evidenceValidation.issueIntakePath,
    stopConditionsPath: evidenceValidation.stopConditionsPath,
    ownerMap: [
      { area: 'supabase_milestone_sync', owner: 'SUPABASE_RLS_STORAGE_DATABASE' },
      { area: 'track_b_readiness', owner: 'TRACK_B_MEDIA_PROCESSING' },
      { area: 'docs_runbook', owner: 'FRONTEND_PRODUCT_UX' },
      { area: 'security_or_secret_exposure', owner: 'OBSERVABILITY_AUDIT_COST' },
      { area: 'runtime_provider_tool_worker_route_attempt', owner: 'WORKER_RUNTIME_JOBS/PROVIDER_GATEWAY' },
      { area: 'public_artifact_or_signed_url_policy', owner: 'PUBLIC_ARTIFACT_DELIVERY' },
      { area: 'production_external_beta_paid_production_unlock_attempt', owner: 'PRODUCT_INTERNAL_BETA_AGGREGATION' },
    ],
    supportRunbookOwner: evidenceValidation.supportRunbookOwner,
    supabaseMilestoneSyncStatus: evidenceValidation.trackBCleanStagingSyncCompleted === true ? 'completed' : 'blocked',
    cleanStagingProjectRef: evidenceValidation.cleanStagingProjectRef,
    trackBRowsVerified: evidenceValidation.trackBRowsVerified,
    canonicalTrackBToolsVerified: evidenceValidation.canonicalTrackBToolsVerified,
    testerMayDo: TESTER_MAY_DO_ACTIONS,
    testerMustNotDo: TESTER_MUST_NOT_DO_ACTIONS,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationDeployed: false,
    trackBBackfillWrite: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    signedUrlSourceOfTruth: false,
    rawPromptExecution: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildBlockedScopeAssertion(
  evidenceValidation: Record<string, unknown>,
  startPacket: Record<string, unknown>,
) {
  const blockedScope = asArray(evidenceValidation.blockedScope)
  const blockedScopePresent = BLOCKED_SCOPE_ASSERTIONS.every((scope) => {
    if (scope === 'signed_url_source_of_truth') return blockedScope.includes('signed_urls_as_source_of_truth')
    if (scope === 'workers_tools_routes_providers') {
      return blockedScope.includes('live_worker_execution') &&
        blockedScope.includes('live_tool_route_execution') &&
        blockedScope.includes('provider_calls')
    }
    if (scope === 'broad_arbitrary_media') {
      return blockedScope.includes('broad_media') && blockedScope.includes('arbitrary_media')
    }
    if (scope === 'supabase_production_writes') return blockedScope.includes('direct_supabase_production_writes')
    return blockedScope.includes(scope)
  })
  const executionFlagsSafe =
    startPacket.supabaseWrites === false &&
    startPacket.sqlExecuted === false &&
    startPacket.runtimeExecution === false &&
    startPacket.providerCalls === false &&
    startPacket.publicArtifacts === false &&
    startPacket.signedUrlSourceOfTruth === false &&
    startPacket.rawPromptExecution === false &&
    startPacket.production === false &&
    startPacket.externalBeta === false &&
    startPacket.paidProduction === false &&
    startPacket.secretsPrintedOrCommitted === false
  const passed = evidenceValidation.status === 'passed' && blockedScopePresent && executionFlagsSafe

  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    allBlockedScopesPreserved: passed,
    blockedScopeAssertions: {
      production: true,
      externalBeta: true,
      paidProduction: true,
      publicArtifacts: true,
      signedUrlSourceOfTruth: true,
      rawPromptExecution: true,
      workersToolsRoutesProviders: true,
      broadArbitraryMedia: true,
      vlmQwenRuntime: true,
      demucsRuntime: true,
      trackARuntime: true,
      supabaseProductionWrites: true,
    },
    blockedScopePresent,
    executionFlagsSafe,
    session0Started: false,
    internalTestingExecutionStarted: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    blockers: passed
      ? []
      : [
          ...(blockedScopePresent ? [] : ['blocked_scope_assertion_missing_required_scope']),
          ...(executionFlagsSafe ? [] : ['blocked_scope_execution_flag_unsafe']),
        ],
  }
}

function buildDecision(
  evidenceValidation: Record<string, unknown>,
  startPacket: Record<string, unknown>,
  blockedScopeAssertion: Record<string, unknown>,
) {
  const blockers = [
    ...(evidenceValidation.status === 'passed' ? [] : asArray(evidenceValidation.blockers).map(String)),
    ...(startPacket.status === 'ready' ? [] : ['start_packet_not_ready']),
    ...(blockedScopeAssertion.status === 'passed' ? [] : asArray(blockedScopeAssertion.blockers).map(String)),
  ]
  const decision: ProductInternalTestingStartGateDecision =
    blockers.length === 0
      ? 'approved_for_restricted_internal_testing_start'
      : blockers.includes('issue_intake_not_ready')
        ? 'blocked_pending_issue_intake_review'
        : blockers.includes('stop_conditions_not_ready')
          ? 'blocked_pending_stop_condition_review'
          : blockers.includes('blocked_scope_unlock_detected') || blockers.includes('scope_drift_detected')
            ? 'blocked_pending_scope_review'
            : blockers.includes('launch_rehearsal_checklist_not_passed')
              ? 'blocked_pending_support_runbook_review'
              : 'blocked_pending_rehearsal_evidence'

  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    decision,
    status: decision === 'approved_for_restricted_internal_testing_start' ? 'passed' : 'blocked',
    approvedForRestrictedInternalTestingStart: decision === 'approved_for_restricted_internal_testing_start',
    session0Started: false,
    internalTestingExecutionStarted: false,
    startGateApprovedInThisPhase: decision === 'approved_for_restricted_internal_testing_start',
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    productionAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    supabaseWritesAllowedInThisPhase: false,
    blockers,
    nextRecommendedPhase: decision === 'approved_for_restricted_internal_testing_start'
      ? 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing session 0.'
      : 'Resolve start-gate blockers before restricted internal testing session 0.',
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = Array.isArray(decision.blockers) ? decision.blockers : []
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    blockedScopesPreserved: [
      'production',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_source_of_truth',
      'raw_prompt_execution',
      'runtime_tool_worker_provider_execution',
      'broad_arbitrary_media',
      'vlm_qwen_runtime',
      'demucs_runtime',
      'track_a_runtime',
      'supabase_production_writes',
    ],
    session0Started: false,
    internalTestingExecutionStarted: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildReadinessReport(
  decision: Record<string, unknown>,
  blockerReport: Record<string, unknown>,
) {
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: blockerReport.activeBlockers,
    evidenceValidation: decision.status === 'passed' ? 'passed' : 'blocked',
    startPacket: 'recorded',
    blockedScopeAssertion: decision.status === 'passed' ? 'passed' : 'blocked',
    supabaseUpdateRequired: 'none_metadata_readiness_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed',
    supabaseEnvironmentTouched: 'none',
    session0Started: false,
    internalTestingExecutionStarted: false,
    sqlExecuted: false,
    migrationDeployed: false,
    runtimeToolsWorkersRoutes: false,
    providers: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    nextRecommendedPhase: decision.nextRecommendedPhase,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_START_GATE_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_START_GATE_RUN_ID,
    status: 'safe_metadata_only',
    reportDir: PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR,
    reports: PRODUCT_INTERNAL_TESTING_START_GATE_EXPECTED_REPORTS,
    committedArtifactsAllowed: ['json_reports', 'markdown_docs', 'server_only_typescript', 'package_scripts'],
    excludedArtifacts: [
      'secrets',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'private_payloads',
      'media_payloads',
      'signed_urls',
      'node_modules',
      'caches',
      'build_output',
    ],
  }
}

function renderOverviewMarkdown(reports: ProductInternalTestingStartGateReports) {
  return [
    '# Product Restricted Internal Testing Start Gate',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    '',
    'This packet is metadata/readiness-only. It may approve the future restricted internal testing start, but it does not start session 0, mutate Supabase, run providers/tools/workers/routes, process media, create public artifacts, create signed URLs, run raw prompts, or unlock production/external beta/paid production.',
    '',
    'Supabase documentation is reference-only in this phase: db push reference, database migration guidance, and changelog. No Supabase command or SQL runs here.',
  ].join('\n')
}

function renderStartPacketMarkdown(reports: ProductInternalTestingStartGateReports) {
  return [
    '# Restricted Internal Testing Start Packet',
    '',
    `Status: \`${reports.startPacket.status}\`.`,
    '',
    'Tester may do:',
    ...asArray(reports.startPacket.testerMayDo).map((item) => `- \`${item}\``),
    '',
    'Tester must not do:',
    ...asArray(reports.startPacket.testerMustNotDo).map((item) => `- \`${item}\``),
    '',
    `Issue intake path: \`${reports.startPacket.issueIntakePath}\`.`,
    `Stop conditions path: \`${reports.startPacket.stopConditionsPath}\`.`,
  ].join('\n')
}

function renderDecisionMarkdown(reports: ProductInternalTestingStartGateReports) {
  return [
    '# Restricted Internal Testing Start Gate Decision',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    `Approved for restricted internal testing start: \`${reports.decision.approvedForRestrictedInternalTestingStart}\`.`,
    `Session 0 started: \`${reports.decision.session0Started}\`.`,
    '',
    'This approval does not execute internal testing. Session 0 remains a separate phase with explicit confirmation and the frozen blocked scopes still apply.',
  ].join('\n')
}

function renderSession0InstructionsMarkdown(reports: ProductInternalTestingStartGateReports) {
  return [
    '# Restricted Internal Testing Session 0 Instructions',
    '',
    'Session 0 is the next separate phase after this start gate. It must stay inside the frozen restricted internal testing scope unless a later owner-approved prompt changes that scope.',
    '',
    'May do:',
    ...asArray(reports.startPacket.testerMayDo).map((item) => `- \`${item}\``),
    '',
    'Must not do:',
    ...asArray(reports.startPacket.testerMustNotDo).map((item) => `- \`${item}\``),
    '',
    'Stop immediately on any secret exposure, production write, external beta exposure, public artifact, signed URL source-of-truth use, raw prompt execution, provider call, worker/tool/runtime execution outside scope, Supabase production mutation, or broad media processing.',
  ].join('\n')
}

function renderNextPromptMarkdown(reports: ProductInternalTestingStartGateReports) {
  return [
    '# PRODUCT_INTERNAL_BETA_AGGREGATION - Restricted Internal Testing Session 0',
    '',
    `Current start-gate decision: \`${reports.decision.decision}\`.`,
    '',
    'This next phase is separate. It may begin only the frozen restricted internal testing metadata/readiness session after explicit session-0 confirmation. Do not unlock production, external beta, or paid production. Do not run tools, workers, providers, routes, media processing, public artifacts, raw prompt execution, signed URL source-of-truth flows, or Supabase writes unless a separate owner-approved phase explicitly authorizes them.',
  ].join('\n')
}
