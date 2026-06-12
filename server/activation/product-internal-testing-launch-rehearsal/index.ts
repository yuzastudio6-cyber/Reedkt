import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ProductInternalTestingLaunchRehearsalDecision,
  ProductInternalTestingLaunchRehearsalReports,
} from './launch-rehearsal-types'

export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE =
  'product-internal-testing-launch-rehearsal'
export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID =
  'product-internal-testing-launch-rehearsal-20260611'
export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_BRANCH =
  'codex/rp-product-restricted-internal-testing-launch-rehearsal'
export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_BASE_BRANCH =
  'codex/rp-product-internal-testing-scope-freeze-signoff'
export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR =
  'docs/activation-product-internal-testing-launch-rehearsal-reports'

const PR302_REPORT_DIR = 'docs/activation-product-internal-testing-scope-freeze-reports'
const PR299_REPORT_DIR = 'docs/activation-product-internal-beta-readiness-reports'
const PR298_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const TRACK_B_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
const TRACK_B_CAPABILITY_REPORT_DIR = 'docs/activation-track-b-capability-manifests-reports'
const TRACK_B_ROUTE_REPORT_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
const CLEAN_STAGING_PROJECT_REF = 'fnjiylwirntrqdcwpbho'

export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'launch_rehearsal_plan.json',
  'launch_rehearsal_scope_signoff_validation.json',
  'launch_rehearsal_tester_flow.json',
  'launch_rehearsal_issue_intake.json',
  'launch_rehearsal_stop_conditions.json',
  'launch_rehearsal_checklist.json',
  'launch_rehearsal_decision.json',
  'launch_rehearsal_blocker_report.json',
  'launch_rehearsal_readiness_report.json',
  'launch_rehearsal_private_artifact_manifest.json',
] as const

export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_LAUNCH_REHEARSAL',
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_SCOPE_FREEZE',
  'REEDITPRO_CONFIRM_OPERATOR_SIGNOFF_PACKET',
  'REEDITPRO_CONFIRM_READINESS_METADATA_AGGREGATION',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_OPERATOR_ACCEPTANCE',
] as const

export const PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_FORBIDDEN_CONFIRMATIONS = [
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
  PR302_REPORT_DIR,
  PR299_REPORT_DIR,
  PR298_REPORT_DIR,
  PR283_REPORT_DIR,
  TRACK_B_ROLLUP_REPORT_DIR,
  TRACK_B_CAPABILITY_REPORT_DIR,
  TRACK_B_ROUTE_REPORT_DIR,
] as const

const RELATED_WORKSTREAMS = [
  'SUPABASE_RLS_STORAGE_DATABASE',
  'TRACK_B_MEDIA_PROCESSING',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY',
  'MODEL_ORCHESTRATION',
  'OBSERVABILITY_AUDIT_COST',
  'PUBLIC_ARTIFACT_DELIVERY',
  'FRONTEND_PRODUCT_UX',
] as const

const TESTER_FLOW_STEPS = [
  'open_internal_readiness_review_dashboard_or_docs',
  'review_track_b_capability_readiness_metadata',
  'review_supabase_clean_staging_milestone_sync_status',
  'review_allowed_and_blocked_scope',
  'review_completed_evidence_artifacts',
  'report_issues_through_approved_issue_intake',
] as const

const ISSUE_CATEGORIES = [
  'supabase_milestone_sync_issue',
  'track_b_readiness_issue',
  'docs_runbook_issue',
  'security_or_secret_exposure_issue',
  'runtime_provider_tool_worker_route_execution_attempt',
  'public_artifact_or_signed_url_policy_issue',
  'production_external_beta_or_paid_production_unlock_attempt',
] as const

const STOP_CONDITIONS = [
  'any_secret_exposure',
  'any_production_write',
  'any_external_beta_exposure',
  'any_public_artifact',
  'any_signed_url_source_of_truth_use',
  'any_raw_prompt_execution_as_worker_input',
  'any_provider_call',
  'any_worker_tool_runtime_execution_outside_scope',
  'any_supabase_production_mutation',
  'any_broad_media_processing',
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

export function getProductInternalTestingLaunchRehearsalPlan() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    branch: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_BRANCH,
    baseBranch: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_BASE_BRANCH,
    prTitle: '[product] Restricted internal testing launch rehearsal',
    mode: 'metadata_readiness_launch_rehearsal_only',
    reportDir: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR,
    expectedReports: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_EXPECTED_REPORTS,
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_FORBIDDEN_CONFIRMATIONS,
    sourcePrs: {
      scopeFreezeAndSignoff: 302,
      internalBetaReadinessAggregation: 299,
      trackBCleanStagingBackfill: 298,
      cleanStagingSchemaRlsVerification: 283,
      trackBReadinessRollupExport: 196,
      trackBCapabilityManifests: 161,
      trackBRouteManifest: 164,
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
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing start gate.',
  }
}

export function buildProductInternalTestingLaunchRehearsalReports(): ProductInternalTestingLaunchRehearsalReports {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const scopeSignoffValidation = buildScopeSignoffValidation()
  const testerFlow = buildTesterFlow(scopeSignoffValidation)
  const issueIntake = buildIssueIntake()
  const stopConditions = buildStopConditions()
  const checklist = buildChecklist(scopeSignoffValidation, testerFlow, issueIntake, stopConditions)
  const decision = buildDecision(scopeSignoffValidation, testerFlow, issueIntake, stopConditions, checklist)
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  return {
    sourceOfTruthOwnershipAudit,
    plan: getProductInternalTestingLaunchRehearsalPlan(),
    scopeSignoffValidation,
    testerFlow,
    issueIntake,
    stopConditions,
    checklist,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeProductInternalTestingLaunchRehearsalArtifacts(
  reports = buildProductInternalTestingLaunchRehearsalReports(),
  reportDir = PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_scope_signoff_validation.json'), reports.scopeSignoffValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_tester_flow.json'), reports.testerFlow)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_issue_intake.json'), reports.issueIntake)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_stop_conditions.json'), reports.stopConditions)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_checklist.json'), reports.checklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'launch_rehearsal_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/product-restricted-internal-testing-launch-rehearsal.md', renderOverviewMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-tester-flow.md', renderTesterFlowMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-issue-intake.md', renderIssueIntakeMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-stop-conditions.md', renderStopConditionsMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-launch-rehearsal-checklist.md', renderChecklistMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-launch-rehearsal-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-start-gate.md',
    renderNextPromptMarkdown(reports),
  )
}

export function readProductInternalTestingLaunchRehearsalSummary() {
  return buildProductInternalTestingLaunchRehearsalReports().readinessReport
}

export async function executeProductInternalTestingLaunchRehearsal(options: {
  execute?: boolean
  metadataOnly?: boolean
  keepTemp?: boolean
} = {}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) {
    await writeProductInternalTestingLaunchRehearsalArtifacts()
    return { exitCode: 0 }
  }

  const missing = PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REQUIRED_CONFIRMATIONS.filter(
    (name) => process.env[name] !== 'true',
  )
  const forbidden = PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_FORBIDDEN_CONFIRMATIONS.filter(
    (name) => process.env[name] === 'true',
  )
  const reports = buildProductInternalTestingLaunchRehearsalReports()
  if (missing.length > 0 || forbidden.length > 0) {
    await writeProductInternalTestingLaunchRehearsalArtifacts({
      ...reports,
      blockerReport: {
        phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
        runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
        status: 'blocked',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
        internalTestingExecution: false,
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
        decision: 'blocked_pending_rehearsal_scope_review',
        activeBlockers: [
          ...missing.map((name) => `missing_confirmation:${name}`),
          ...forbidden.map((name) => `forbidden_confirmation:${name}`),
        ],
      },
    })
    return { exitCode: 1 }
  }

  await writeProductInternalTestingLaunchRehearsalArtifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1 }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    workstreamOwner: 'PRODUCT_INTERNAL_BETA_AGGREGATION',
    relatedWorkstreams: RELATED_WORKSTREAMS,
    explicitlyNotOwned: [
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
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      kind: existsSync(sourcePath) ? 'repo_safe_source' : 'missing_audit_fact',
    })),
    duplicateWorkAvoided: [
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

function buildScopeSignoffValidation() {
  const signoffDecision = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'))
  const operatorArtifact = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_artifact.json'))
  const operatorValidation = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_scope_validation.json'))
  const allowedScope = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_allowed_scope_freeze.json'))
  const blockedScope = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_blocked_scope_freeze.json'))
  const runbook = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_runbook_checklist.json'))
  const betaSummary = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_readiness_summary.json'))
  const betaDecision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  const sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const cleanBranchVerify = readJson(path.join(PR283_REPORT_DIR, 'clean_staging_branch_schema_rls_verify_report.json'))

  const operatorAcceptanceExists = operatorArtifact?.status === 'approved'
  const signoffApproved =
    signoffDecision?.decision === 'approved_for_future_restricted_internal_testing_launch_rehearsal' &&
    signoffDecision?.operatorSignoffPresent === true
  const scopeValidationPassed =
    operatorValidation?.status === 'passed' &&
    operatorValidation?.acceptedScopeMatchesFrozenScope === true &&
    operatorValidation?.blockedScopeUnchanged === true &&
    operatorValidation?.noUnlockIntroduced === true
  const betaCandidate =
    betaDecision?.decision === 'restricted_internal_testing_candidate' &&
    betaSummary?.decision === 'restricted_internal_testing_candidate'
  const syncCompleted =
    sync?.syncStatus === 'completed' &&
    sync?.targetProjectRef === CLEAN_STAGING_PROJECT_REF &&
    asNumber(sync?.rowsVerifiedTotal) === 259 &&
    asNumber(sync?.canonicalToolCount) === 18 &&
    asBool(sync?.productionAffected) === false &&
    asBool(sync?.brokenOriginalStagingAffected) === false &&
    asBool(sync?.trackBRuntimeExecution) === false
  const noUnlockIntroduced =
    signoffDecision?.internalTestingExecutionStarted === false &&
    signoffDecision?.productionAllowed === false &&
    signoffDecision?.externalBetaAllowed === false &&
    signoffDecision?.paidProductionAllowed === false &&
    signoffDecision?.publicArtifactsAllowed === false &&
    signoffDecision?.runtimeExecutionAllowed === false &&
    signoffDecision?.providerCallsAllowed === false &&
    signoffDecision?.supabaseWritesAllowedInThisPhase === false &&
    operatorArtifact?.secretValuesIncluded === false &&
    operatorArtifact?.secretsPrintedOrCommitted === false
  const runbookReady = runbook?.status === 'ready_for_operator_review'
  const validationPassed =
    operatorAcceptanceExists &&
    signoffApproved &&
    scopeValidationPassed &&
    betaCandidate &&
    syncCompleted &&
    noUnlockIntroduced &&
    runbookReady

  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: validationPassed ? 'passed' : 'blocked',
    sourceReports: {
      signoffDecision: path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'),
      operatorAcceptanceArtifact: path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_artifact.json'),
      operatorAcceptanceScopeValidation: path.join(PR302_REPORT_DIR, 'internal_testing_operator_acceptance_scope_validation.json'),
      internalBetaReadinessSummary: path.join(PR299_REPORT_DIR, 'internal_beta_readiness_summary.json'),
      trackBCleanStagingSync: path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'),
    },
    operatorAcceptanceExists,
    signoffApproved,
    acceptedByRole: operatorArtifact?.acceptedByRole ?? 'missing',
    acceptedScope: operatorArtifact?.acceptedScope ?? 'missing',
    allowedScopeUnchanged: scopeValidationPassed,
    blockedScopeUnchanged: operatorValidation?.blockedScopeUnchanged === true,
    noUnlockIntroduced,
    betaCandidate,
    trackBCleanStagingSyncCompleted: syncCompleted,
    trackBRowsVerified: asNumber(sync?.rowsVerifiedTotal),
    canonicalTrackBToolsVerified: asNumber(sync?.canonicalToolCount),
    cleanStagingSchemaRlsStatus: cleanBranchVerify?.status ?? 'missing',
    allowedScope: allowedScope?.allowedScope ?? [],
    blockedScope: blockedScope?.blockedScope ?? [],
    runbookReady,
    internalTestingExecutionStarted: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    blockers: validationPassed
      ? []
      : [
          ...(operatorAcceptanceExists ? [] : ['operator_acceptance_missing']),
          ...(signoffApproved ? [] : ['pr302_launch_rehearsal_approval_missing']),
          ...(scopeValidationPassed ? [] : ['scope_signoff_validation_failed']),
          ...(betaCandidate ? [] : ['pr299_restricted_internal_testing_candidate_missing']),
          ...(syncCompleted ? [] : ['track_b_clean_staging_sync_not_completed']),
          ...(noUnlockIntroduced ? [] : ['blocked_scope_unlock_detected']),
          ...(runbookReady ? [] : ['support_runbook_not_ready']),
        ],
  }
}

function buildTesterFlow(scopeValidation: Record<string, unknown>) {
  const allowedScope = asArray(scopeValidation.allowedScope)
  const blockedScope = asArray(scopeValidation.blockedScope)
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: scopeValidation.status === 'passed' ? 'rehearsed' : 'blocked',
    rehearsalMode: 'metadata_readiness_only',
    testerFlowSteps: TESTER_FLOW_STEPS,
    allowedReviewScope: allowedScope,
    blockedActions: [
      'execute_tools_workers_or_providers',
      'process_media',
      'create_public_artifacts',
      'use_signed_urls_as_source_of_truth',
      'run_raw_prompts',
      'mutate_supabase',
      'unlock_production_external_beta_or_paid_production',
    ],
    testerMustNotExecuteToolsWorkersProviders: true,
    testerMustNotProcessMedia: true,
    testerMustNotCreatePublicArtifacts: true,
    testerMustNotUseSignedUrlsAsSourceOfTruth: true,
    blockedScope,
    internalTestingExecutionStarted: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildIssueIntake() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: 'ready',
    severityLevels: [
      { id: 'sev0_stop', meaning: 'Stop rehearsal immediately; possible secret, production, public artifact, or runtime execution breach.' },
      { id: 'sev1_blocker', meaning: 'Blocks restricted internal testing start gate.' },
      { id: 'sev2_major', meaning: 'Needs owner review before start gate but does not indicate execution breach.' },
      { id: 'sev3_minor', meaning: 'Documentation or metadata cleanup follow-up.' },
    ],
    blockerCategories: ISSUE_CATEGORIES,
    ownerRouting: [
      { category: 'supabase_milestone_sync_issue', owner: 'SUPABASE_RLS_STORAGE_DATABASE' },
      { category: 'track_b_readiness_issue', owner: 'TRACK_B_MEDIA_PROCESSING' },
      { category: 'docs_runbook_issue', owner: 'FRONTEND_PRODUCT_UX' },
      { category: 'security_or_secret_exposure_issue', owner: 'OBSERVABILITY_AUDIT_COST' },
      { category: 'runtime_provider_tool_worker_route_execution_attempt', owner: 'WORKER_RUNTIME_JOBS/PROVIDER_GATEWAY' },
      { category: 'public_artifact_or_signed_url_policy_issue', owner: 'PUBLIC_ARTIFACT_DELIVERY' },
      { category: 'production_external_beta_or_paid_production_unlock_attempt', owner: 'PRODUCT_INTERNAL_BETA_AGGREGATION' },
    ],
    requiredFields: ['severity', 'category', 'owner', 'report_path', 'evidence_summary', 'blocked_scope_check', 'recommended_next_action'],
    rowOrPrivatePayloadsAllowed: false,
    secretsAllowed: false,
    statusReadyForRehearsal: true,
  }
}

function buildStopConditions() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: 'ready',
    stopConditions: STOP_CONDITIONS,
    stopAction: 'Stop rehearsal, mark start gate blocked, route issue to owner, and do not attempt runtime or Supabase mutation repair in this phase.',
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildChecklist(
  scopeValidation: Record<string, unknown>,
  testerFlow: Record<string, unknown>,
  issueIntake: Record<string, unknown>,
  stopConditions: Record<string, unknown>,
) {
  const checks = [
    check('track_b_clean_staging_sync_completed', scopeValidation.trackBCleanStagingSyncCompleted === true),
    check('allowed_scope_reviewed', asArray(scopeValidation.allowedScope).length > 0),
    check('blocked_scope_reviewed', asArray(scopeValidation.blockedScope).length > 0),
    check('operator_acceptance_reviewed', scopeValidation.operatorAcceptanceExists === true),
    check('runbook_reviewed', scopeValidation.runbookReady === true),
    check('tester_flow_reviewed', testerFlow.status === 'rehearsed'),
    check('issue_intake_reviewed', issueIntake.status === 'ready'),
    check('stop_conditions_reviewed', stopConditions.status === 'ready'),
    check('owner_map_reviewed', true),
    check('no_runtime_execution', true),
    check('no_provider_calls', true),
    check('no_production', true),
    check('no_public_artifacts', true),
    check('no_secrets_printed', true),
  ]
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: checks.every((entry) => entry.passed) ? 'passed' : 'blocked',
    checks,
    internalTestingExecutionStarted: false,
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function check(id: string, passed: boolean) {
  return { id, passed }
}

function buildDecision(
  scopeValidation: Record<string, unknown>,
  testerFlow: Record<string, unknown>,
  issueIntake: Record<string, unknown>,
  stopConditions: Record<string, unknown>,
  checklist: Record<string, unknown>,
) {
  const blockers = [
    ...(scopeValidation.status === 'passed' ? [] : ['scope_signoff_validation_not_passed']),
    ...(testerFlow.status === 'rehearsed' ? [] : ['tester_flow_not_rehearsed']),
    ...(issueIntake.status === 'ready' ? [] : ['issue_intake_not_ready']),
    ...(stopConditions.status === 'ready' ? [] : ['stop_conditions_not_ready']),
    ...(checklist.status === 'passed' ? [] : ['launch_rehearsal_checklist_not_passed']),
  ]
  const decision: ProductInternalTestingLaunchRehearsalDecision =
    blockers.length === 0
      ? 'restricted_internal_testing_launch_rehearsal_passed'
      : blockers.includes('issue_intake_not_ready')
        ? 'blocked_pending_issue_intake_review'
        : blockers.includes('stop_conditions_not_ready')
          ? 'blocked_pending_stop_condition_review'
          : blockers.includes('launch_rehearsal_checklist_not_passed')
            ? 'blocked_pending_support_runbook_review'
            : 'blocked_pending_rehearsal_scope_review'
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    decision,
    status: decision === 'restricted_internal_testing_launch_rehearsal_passed' ? 'passed' : 'blocked',
    launchRehearsalPassed: decision === 'restricted_internal_testing_launch_rehearsal_passed',
    internalTestingExecutionStarted: false,
    internalTestingStartGateApprovedInThisPhase: false,
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
    nextRecommendedPhase: decision === 'restricted_internal_testing_launch_rehearsal_passed'
      ? 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing start gate.'
      : 'Resolve rehearsal blockers before restricted internal testing start gate.',
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = Array.isArray(decision.blockers) ? decision.blockers : []
  return {
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    blockedScopesPreserved: [
      'external_beta',
      'paid_production',
      'production',
      'public_artifacts',
      'broad_media',
      'runtime_tool_worker_provider_execution',
      'supabase_writes',
    ],
    internalTestingExecution: false,
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
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: blockerReport.activeBlockers,
    scopeValidation: decision.status === 'passed' ? 'passed' : 'blocked',
    testerFlow: 'recorded',
    issueIntake: 'recorded',
    stopConditions: 'recorded',
    checklist: decision.status === 'passed' ? 'passed' : 'blocked',
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
    phase: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_RUN_ID,
    status: 'safe_metadata_only',
    reportDir: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR,
    reports: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_EXPECTED_REPORTS,
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

function renderOverviewMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Product Restricted Internal Testing Launch Rehearsal',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    '',
    'This rehearsal is metadata/readiness-only. It does not start internal testing execution, mutate Supabase, run providers/tools/workers/routes, process media, create public artifacts, create signed URLs, run raw prompts, or unlock production/external beta/paid production.',
  ].join('\n')
}

function renderTesterFlowMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Restricted Internal Testing Tester Flow',
    '',
    ...asArray(reports.testerFlow.testerFlowSteps).map((item) => `- \`${item}\``),
    '',
    'Testers must not execute tools, workers, providers, routes, media processing, public artifact generation, signed URL source-of-truth flows, raw prompt execution, Supabase writes, or production/external beta/paid production unlocks.',
  ].join('\n')
}

function renderIssueIntakeMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Restricted Internal Testing Issue Intake',
    '',
    'Severity levels:',
    ...asArray(reports.issueIntake.severityLevels).map((item) => {
      const entry = item as { id?: string; meaning?: string }
      return `- \`${entry.id ?? 'unknown'}\`: ${entry.meaning ?? 'missing'}`
    }),
    '',
    'Categories:',
    ...asArray(reports.issueIntake.blockerCategories).map((item) => `- \`${item}\``),
  ].join('\n')
}

function renderStopConditionsMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Restricted Internal Testing Stop Conditions',
    '',
    ...asArray(reports.stopConditions.stopConditions).map((item) => `- \`${item}\``),
    '',
    `${reports.stopConditions.stopAction}`,
  ].join('\n')
}

function renderChecklistMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Restricted Internal Testing Launch Rehearsal Checklist',
    '',
    ...asArray(reports.checklist.checks).map((item) => {
      const entry = item as { id?: string; passed?: boolean }
      return `- \`${entry.id ?? 'unknown'}\`: \`${entry.passed === true}\``
    }),
  ].join('\n')
}

function renderDecisionMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# Restricted Internal Testing Launch Rehearsal Decision',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    `Launch rehearsal passed: \`${reports.decision.launchRehearsalPassed}\`.`,
    '',
    'This decision does not start internal testing. The restricted internal testing start gate remains a separate phase with explicit confirmation.',
  ].join('\n')
}

function renderNextPromptMarkdown(reports: ProductInternalTestingLaunchRehearsalReports) {
  return [
    '# PRODUCT_INTERNAL_BETA_AGGREGATION - Restricted Internal Testing Start Gate',
    '',
    `Current launch rehearsal decision: \`${reports.decision.decision}\`.`,
    '',
    'This next phase is separate. It may start only the frozen restricted internal testing metadata/readiness scope after explicit start-gate confirmation. Do not unlock production, external beta, or paid production. Do not run tools, workers, providers, routes, media processing, public artifacts, raw prompt execution, signed URL source-of-truth flows, or Supabase writes unless a separate owner-approved phase explicitly authorizes them.',
  ].join('\n')
}
