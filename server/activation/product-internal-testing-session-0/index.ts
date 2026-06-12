import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ProductInternalTestingSession0Decision,
  ProductInternalTestingSession0Reports,
} from './session-0-types'

export const PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE = 'product-internal-testing-session-0'
export const PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID = 'product-internal-testing-session-0-20260612'
export const PRODUCT_INTERNAL_TESTING_SESSION_0_BRANCH =
  'codex/rp-product-restricted-internal-testing-session-0'
export const PRODUCT_INTERNAL_TESTING_SESSION_0_BASE_BRANCH =
  'codex/rp-product-restricted-internal-testing-start-gate'
export const PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR =
  'docs/activation-product-internal-testing-session-0-reports'

const PR309_REPORT_DIR = 'docs/activation-product-internal-testing-start-gate-reports'
const PR306_REPORT_DIR = 'docs/activation-product-internal-testing-launch-rehearsal-reports'
const PR302_REPORT_DIR = 'docs/activation-product-internal-testing-scope-freeze-reports'
const PR299_REPORT_DIR = 'docs/activation-product-internal-beta-readiness-reports'
const PR298_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const PR283_REPORT_DIR = 'docs/activation-supabase-clean-staging-branch-execution-reports'
const TRACK_B_ROLLUP_REPORT_DIR = 'docs/activation-track-b-readiness-rollup-reports'
const TRACK_B_CAPABILITY_REPORT_DIR = 'docs/activation-track-b-capability-manifests-reports'
const TRACK_B_ROUTE_REPORT_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
const AUDIO_TIMING_REPORT_DIR = 'docs/activation-phase-36m-audio-timing-internal-beta-readiness-gate-reports'
const MEDIA_DATA_REPORT_DIR = 'docs/activation-phase-46e-media-data-internal-beta-readiness-gate-reports'
const CLEAN_STAGING_PROJECT_REF = 'fnjiylwirntrqdcwpbho'

export const PRODUCT_INTERNAL_TESTING_SESSION_0_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'session_0_plan.json',
  'session_0_scope_validation.json',
  'session_0_review_checklist.json',
  'session_0_trackb_readiness_review.json',
  'session_0_issue_intake_report.json',
  'session_0_stop_condition_check.json',
  'session_0_decision.json',
  'session_0_blocker_report.json',
  'session_0_readiness_report.json',
  'session_0_private_artifact_manifest.json',
] as const

export const PRODUCT_INTERNAL_TESTING_SESSION_0_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_SESSION_0',
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_METADATA_ONLY_SESSION',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_START_GATE',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_LAUNCH_REHEARSAL',
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_SCOPE_FREEZE',
  'REEDITPRO_CONFIRM_OPERATOR_SIGNOFF_PACKET',
  'REEDITPRO_CONFIRM_READINESS_METADATA_AGGREGATION',
  'REEDITPRO_CONFIRM_RESTRICTED_INTERNAL_TESTING_OPERATOR_ACCEPTANCE',
] as const

export const PRODUCT_INTERNAL_TESTING_SESSION_0_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_INTERNAL_TESTING_RUNTIME_EXECUTION',
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
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
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
  PR309_REPORT_DIR,
  PR306_REPORT_DIR,
  PR302_REPORT_DIR,
  PR299_REPORT_DIR,
  PR298_REPORT_DIR,
  PR283_REPORT_DIR,
  TRACK_B_ROLLUP_REPORT_DIR,
  TRACK_B_CAPABILITY_REPORT_DIR,
  TRACK_B_ROUTE_REPORT_DIR,
  AUDIO_TIMING_REPORT_DIR,
  MEDIA_DATA_REPORT_DIR,
] as const

const REVIEW_CHECKS = [
  'allowed_scope_reviewed',
  'blocked_scope_reviewed',
  'track_b_clean_staging_milestone_sync_reviewed',
  'track_b_capability_manifest_reviewed',
  'track_b_route_manifest_reviewed',
  'audio_timing_evidence_reviewed',
  'media_data_evidence_reviewed',
  'hybrid_desktop_metadata_evidence_reviewed',
  'issue_intake_reviewed',
  'stop_conditions_reviewed',
  'no_runtime_execution',
  'no_providers',
  'no_production',
  'no_public_artifacts',
] as const

const ISSUE_CATEGORIES = [
  'readiness_doc_gap',
  'blocker_scope_gap',
  'owner_assignment_gap',
  'supabase_milestone_issue',
  'track_b_metadata_issue',
  'secret_security_concern',
  'attempted_runtime_scope_violation',
  'support_runbook_gap',
] as const

const STOP_CONDITIONS = [
  'secret_exposure',
  'production_write',
  'external_beta_exposure',
  'public_artifact',
  'signed_url_source_of_truth_use',
  'raw_prompt_execution_as_worker_input',
  'provider_call',
  'worker_tool_runtime_execution_outside_scope',
  'supabase_production_mutation',
  'broad_media_processing',
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

function readExistingSession0Started(): boolean {
  const decision = readJson(path.join(PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR, 'session_0_decision.json'))
  return decision?.session0Started === true
}

function check(id: string, passed: boolean) {
  return { id, passed }
}

export function getProductInternalTestingSession0Plan() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    branch: PRODUCT_INTERNAL_TESTING_SESSION_0_BRANCH,
    baseBranch: PRODUCT_INTERNAL_TESTING_SESSION_0_BASE_BRANCH,
    prTitle: '[product] Restricted internal testing session 0',
    mode: 'metadata_readiness_session_0_only',
    reportDir: PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR,
    expectedReports: PRODUCT_INTERNAL_TESTING_SESSION_0_EXPECTED_REPORTS,
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_SESSION_0_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: PRODUCT_INTERNAL_TESTING_SESSION_0_FORBIDDEN_CONFIRMATIONS,
    sourcePrs: {
      startGate: 309,
      launchRehearsal: 306,
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
    supabaseUpdateRequired: 'no_new_write_metadata_readiness_review_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed',
    supabaseEnvironmentTouched: 'none',
    noSupabaseWrites: true,
    noSql: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noPublicArtifacts: true,
    noProductionUnlock: true,
    noExternalBetaUnlock: true,
    noPaidProductionUnlock: true,
    nextRecommendedPhase: 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing session 1.',
  }
}

export function buildProductInternalTestingSession0Reports(options: {
  session0Started?: boolean
} = {}): ProductInternalTestingSession0Reports {
  const session0Started = options.session0Started ?? readExistingSession0Started()
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const scopeValidation = buildScopeValidation(session0Started)
  const trackBReadinessReview = buildTrackBReadinessReview()
  const issueIntakeReport = buildIssueIntakeReport(scopeValidation, trackBReadinessReview)
  const stopConditionCheck = buildStopConditionCheck(scopeValidation)
  const reviewChecklist = buildReviewChecklist(scopeValidation, trackBReadinessReview, issueIntakeReport, stopConditionCheck)
  const decision = buildDecision(scopeValidation, reviewChecklist, trackBReadinessReview, issueIntakeReport, stopConditionCheck)
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision, blockerReport)
  return {
    sourceOfTruthOwnershipAudit,
    plan: getProductInternalTestingSession0Plan(),
    scopeValidation,
    reviewChecklist,
    trackBReadinessReview,
    issueIntakeReport,
    stopConditionCheck,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeProductInternalTestingSession0Artifacts(
  reports = buildProductInternalTestingSession0Reports(),
  reportDir = PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_scope_validation.json'), reports.scopeValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_review_checklist.json'), reports.reviewChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_trackb_readiness_review.json'), reports.trackBReadinessReview)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_issue_intake_report.json'), reports.issueIntakeReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_stop_condition_check.json'), reports.stopConditionCheck)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'session_0_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact('docs/product-restricted-internal-testing-session-0.md', renderOverviewMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-session-0-checklist.md', renderChecklistMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-session-0-issue-intake.md', renderIssueIntakeMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/restricted-internal-testing-session-0-decision.md', renderDecisionMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/beta-readiness-scorecard.md', renderBetaReadinessScorecardMarkdown(reports))
  await writeVlmRuntimeTextArtifact('docs/production-beta-blocker-inventory.md', renderProductionBetaBlockerMarkdown(reports))
  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-1.md',
    renderNextPromptMarkdown(reports),
  )
}

export function readProductInternalTestingSession0Summary() {
  return buildProductInternalTestingSession0Reports().readinessReport
}

export async function executeProductInternalTestingSession0(options: {
  execute?: boolean
  metadataOnly?: boolean
  keepTemp?: boolean
} = {}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) {
    await writeProductInternalTestingSession0Artifacts()
    return { exitCode: 0 }
  }

  const missing = PRODUCT_INTERNAL_TESTING_SESSION_0_REQUIRED_CONFIRMATIONS.filter(
    (name) => process.env[name] !== 'true',
  )
  const forbidden = PRODUCT_INTERNAL_TESTING_SESSION_0_FORBIDDEN_CONFIRMATIONS.filter(
    (name) => process.env[name] === 'true',
  )
  if (missing.length > 0 || forbidden.length > 0) {
    const activeBlockers = [
      ...missing.map((name) => `missing_confirmation:${name}`),
      ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ]
    const reports = buildProductInternalTestingSession0Reports({ session0Started: false })
    await writeProductInternalTestingSession0Artifacts({
      ...reports,
      blockerReport: {
        phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
        runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
        status: 'blocked',
        activeBlockers,
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
        decision: 'blocked_pending_session_0_issue_review',
        activeBlockers,
        session0Started: false,
      },
    })
    return { exitCode: 1 }
  }

  const reports = buildProductInternalTestingSession0Reports({ session0Started: true })
  await writeProductInternalTestingSession0Artifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1 }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
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
      'supabase_mutation',
    ],
    sourcePaths: SOURCE_OF_TRUTH_PATHS.map((sourcePath) => ({
      path: sourcePath,
      present: existsSync(sourcePath),
      kind: existsSync(sourcePath) ? 'repo_safe_source' : 'missing_audit_fact',
    })),
    duplicateWorkAvoided: [
      'no_new_start_gate_module',
      'no_new_launch_rehearsal_module',
      'no_new_scope_freeze_module',
      'no_new_track_b_export',
      'no_new_supabase_backfill',
      'no_runtime_execution',
      'no_supabase_mutation',
    ],
    secretsPrintedOrCommitted: false,
  }
}

function buildScopeValidation(session0Started: boolean) {
  const startGateDecision = readJson(path.join(PR309_REPORT_DIR, 'restricted_internal_testing_start_gate_decision.json'))
  const startPacket = readJson(path.join(PR309_REPORT_DIR, 'restricted_internal_testing_start_packet.json'))
  const startGateValidation = readJson(path.join(PR309_REPORT_DIR, 'start_gate_evidence_validation.json'))
  const launchDecision = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_decision.json'))
  const launchScope = readJson(path.join(PR306_REPORT_DIR, 'launch_rehearsal_scope_signoff_validation.json'))
  const scopeDecision = readJson(path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'))
  const betaDecision = readJson(path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'))
  const sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const cleanBranchVerify = readJson(path.join(PR283_REPORT_DIR, 'clean_staging_branch_schema_rls_verify_report.json'))

  const startGateApproved =
    startGateDecision?.decision === 'approved_for_restricted_internal_testing_start' &&
    startGateDecision?.status === 'passed' &&
    startGateDecision?.approvedForRestrictedInternalTestingStart === true &&
    startGateDecision?.session0Started === false
  const startPacketReady =
    startPacket?.status === 'ready' &&
    startPacket?.session0Started === false &&
    startPacket?.internalTestingExecutionStarted === false
  const launchRehearsalPassed =
    launchDecision?.decision === 'restricted_internal_testing_launch_rehearsal_passed' &&
    launchDecision?.status === 'passed'
  const scopeFreezeAccepted =
    scopeDecision?.decision === 'approved_for_future_restricted_internal_testing_launch_rehearsal' &&
    scopeDecision?.status === 'passed' &&
    scopeDecision?.operatorSignoffPresent === true
  const betaCandidate =
    betaDecision?.decision === 'restricted_internal_testing_candidate' &&
    betaDecision?.status === 'passed'
  const syncCompleted =
    sync?.syncStatus === 'completed' &&
    sync?.targetProjectRef === CLEAN_STAGING_PROJECT_REF &&
    asNumber(sync?.rowsVerifiedTotal) === 259 &&
    asNumber(sync?.canonicalToolCount) === 18 &&
    asBool(sync?.productionAffected) === false &&
    asBool(sync?.brokenOriginalStagingAffected) === false &&
    asBool(sync?.trackBRuntimeExecution) === false
  const scopeUnchanged =
    startGateValidation?.noScopeDrift === true &&
    launchScope?.allowedScopeUnchanged === true &&
    launchScope?.blockedScopeUnchanged === true &&
    asArray(startPacket?.allowedScope).length > 0 &&
    asArray(startPacket?.blockedScope).length > 0
  const noUnlockIntroduced =
    startGateDecision?.externalBetaAllowed === false &&
    startGateDecision?.paidProductionAllowed === false &&
    startGateDecision?.productionAllowed === false &&
    startGateDecision?.publicArtifactsAllowed === false &&
    startGateDecision?.signedUrlSourceOfTruthAllowed === false &&
    startGateDecision?.rawPromptExecutionAllowed === false &&
    startGateDecision?.runtimeExecutionAllowed === false &&
    startGateDecision?.providerCallsAllowed === false &&
    startGateDecision?.supabaseWritesAllowedInThisPhase === false &&
    launchScope?.runtimeExecution === false &&
    launchScope?.providerCalls === false &&
    launchScope?.publicArtifacts === false &&
    launchScope?.production === false &&
    launchScope?.supabaseWrites === false
  const cleanStagingVerified = cleanBranchVerify?.status === 'passed'
  const noSecretsIntroduced =
    startGateValidation?.secretsPrintedOrCommitted === false &&
    launchScope?.secretsPrintedOrCommitted === false
  const statusPassed =
    startGateApproved &&
    startPacketReady &&
    launchRehearsalPassed &&
    scopeFreezeAccepted &&
    betaCandidate &&
    syncCompleted &&
    scopeUnchanged &&
    noUnlockIntroduced &&
    cleanStagingVerified &&
    noSecretsIntroduced

  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: statusPassed ? 'passed' : 'blocked',
    session0Started,
    session0Mode: 'metadata_readiness_review_only',
    sourceReports: {
      startGateDecision: path.join(PR309_REPORT_DIR, 'restricted_internal_testing_start_gate_decision.json'),
      startGatePacket: path.join(PR309_REPORT_DIR, 'restricted_internal_testing_start_packet.json'),
      launchRehearsalDecision: path.join(PR306_REPORT_DIR, 'launch_rehearsal_decision.json'),
      launchRehearsalScope: path.join(PR306_REPORT_DIR, 'launch_rehearsal_scope_signoff_validation.json'),
      scopeFreezeDecision: path.join(PR302_REPORT_DIR, 'internal_testing_scope_freeze_decision.json'),
      internalBetaReadinessDecision: path.join(PR299_REPORT_DIR, 'internal_beta_go_no_go_decision.json'),
      trackBCleanStagingSync: path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'),
      cleanStagingSchemaRlsVerify: path.join(PR283_REPORT_DIR, 'clean_staging_branch_schema_rls_verify_report.json'),
    },
    startGateApproved,
    priorStartGateSession0Started: startGateDecision?.session0Started ?? 'missing',
    startPacketReady,
    launchRehearsalPassed,
    scopeFreezeAccepted,
    betaCandidate,
    trackBCleanStagingSyncCompleted: syncCompleted,
    trackBRowsVerified: asNumber(sync?.rowsVerifiedTotal),
    canonicalTrackBToolsVerified: asNumber(sync?.canonicalToolCount),
    cleanStagingProjectRef: CLEAN_STAGING_PROJECT_REF,
    cleanStagingSchemaRlsStatus: cleanBranchVerify?.status ?? 'missing',
    allowedScopeUnchanged: scopeUnchanged,
    blockedScopeUnchanged: scopeUnchanged,
    noScopeDrift: scopeUnchanged,
    noUnlockIntroduced,
    noSecretsIntroduced,
    allowedScope: startPacket?.allowedScope ?? launchScope?.allowedScope ?? [],
    blockedScope: startPacket?.blockedScope ?? launchScope?.blockedScope ?? [],
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    blockers: statusPassed
      ? []
      : [
          ...(startGateApproved ? [] : ['pr309_start_gate_not_approved_or_prior_session0_not_false']),
          ...(startPacketReady ? [] : ['pr309_start_packet_not_ready']),
          ...(launchRehearsalPassed ? [] : ['pr306_launch_rehearsal_not_passed']),
          ...(scopeFreezeAccepted ? [] : ['pr302_scope_freeze_not_accepted']),
          ...(betaCandidate ? [] : ['pr299_restricted_internal_testing_candidate_missing']),
          ...(syncCompleted ? [] : ['track_b_clean_staging_sync_not_completed']),
          ...(scopeUnchanged ? [] : ['scope_drift_detected']),
          ...(noUnlockIntroduced ? [] : ['blocked_scope_unlock_detected']),
          ...(cleanStagingVerified ? [] : ['clean_staging_schema_rls_verify_not_passed']),
          ...(noSecretsIntroduced ? [] : ['secret_policy_evidence_missing']),
        ],
  }
}

function buildTrackBReadinessReview() {
  const rollup = readJson(path.join(TRACK_B_ROLLUP_REPORT_DIR, 'track_b_tool_status_rollup.json'))
  const sync = readJson(path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'))
  const capability = readJson(path.join(TRACK_B_CAPABILITY_REPORT_DIR, 'track_b_readiness_summary.json'))
  const route = readJson(path.join(TRACK_B_ROUTE_REPORT_DIR, 'track_b_route_integration_report.json'))
  const tools = asArray(rollup?.tools) as Array<Record<string, unknown>>
  const readyTools = tools
    .filter((tool) => tool.internalReady === true && tool.initialInternalTestingIncluded === true)
    .map((tool) => tool.toolId)
  const blockedRuntimeLanes = tools
    .filter((tool) => ['demucs', 'qwen3_vl', 'vllm'].includes(String(tool.toolId)))
    .map((tool) => ({
      toolId: tool.toolId,
      currentStatus: tool.currentStatus,
      internalReady: tool.internalReady,
      initialInternalTestingIncluded: tool.initialInternalTestingIncluded,
      runtimeLaneBlocked: true,
      nextOwnerPrompt: tool.toolId === 'demucs'
        ? 'training data provenance and runtime unlock owner review'
        : 'VLM/Qwen/vLLM runtime unlock owner review',
    }))
  const statusPassed =
    rollup?.status === 'passed' &&
    asNumber(rollup?.totalTools) === 18 &&
    asArray(rollup?.missingToolIds).length === 0 &&
    sync?.syncStatus === 'completed' &&
    capability !== undefined &&
    route !== undefined

  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: statusPassed ? 'passed' : 'blocked',
    sourceReports: {
      toolStatusRollup: path.join(TRACK_B_ROLLUP_REPORT_DIR, 'track_b_tool_status_rollup.json'),
      capabilitySummary: path.join(TRACK_B_CAPABILITY_REPORT_DIR, 'track_b_readiness_summary.json'),
      routeIntegration: path.join(TRACK_B_ROUTE_REPORT_DIR, 'track_b_route_integration_report.json'),
      cleanStagingSync: path.join(PR299_REPORT_DIR, 'trackb_clean_staging_sync_verification.json'),
    },
    canonicalToolCount: asNumber(rollup?.totalTools),
    expectedToolIds: rollup?.expectedToolIds ?? [],
    missingToolIds: rollup?.missingToolIds ?? [],
    restrictedInternalReadyTools: readyTools,
    restrictedInternalReadyToolCount: readyTools.length,
    blockedExcludedRuntimeLanes: blockedRuntimeLanes,
    demucsRuntimeBlocked: true,
    qwenVlmRuntimeBlocked: true,
    vllmRuntimeBlocked: true,
    completedSupabaseSync: sync?.syncStatus === 'completed',
    rowsVerifiedTotal: asNumber(sync?.rowsVerifiedTotal),
    noRuntimeExecution: true,
    noToolExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    blockers: statusPassed
      ? []
      : [
          ...(rollup?.status === 'passed' ? [] : ['track_b_tool_status_rollup_not_passed']),
          ...(asNumber(rollup?.totalTools) === 18 ? [] : ['track_b_tool_count_not_18']),
          ...(asArray(rollup?.missingToolIds).length === 0 ? [] : ['track_b_missing_tool_ids']),
          ...(sync?.syncStatus === 'completed' ? [] : ['track_b_clean_staging_sync_not_completed']),
          ...(capability !== undefined ? [] : ['track_b_capability_summary_missing']),
          ...(route !== undefined ? [] : ['track_b_route_integration_report_missing']),
        ],
  }
}

function buildIssueIntakeReport(
  scopeValidation: Record<string, unknown>,
  trackBReadinessReview: Record<string, unknown>,
) {
  const activeIssues = [
    ...asArray(scopeValidation.blockers).map((issue) => ({
      category: 'blocker_scope_gap',
      severity: 'sev1_blocker',
      issue,
    })),
    ...asArray(trackBReadinessReview.blockers).map((issue) => ({
      category: 'track_b_metadata_issue',
      severity: 'sev1_blocker',
      issue,
    })),
  ]
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: activeIssues.length === 0 ? 'no_session_0_issues_found' : 'issues_recorded',
    issueCategories: ISSUE_CATEGORIES,
    activeIssueCount: activeIssues.length,
    activeIssues,
    zeroIssuesFound: activeIssues.length === 0,
    rowOrPrivatePayloadsAllowed: false,
    secretsAllowed: false,
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    publicArtifactsAllowed: false,
    productionAllowed: false,
  }
}

function buildStopConditionCheck(scopeValidation: Record<string, unknown>) {
  const clean =
    scopeValidation.status === 'passed' &&
    scopeValidation.noUnlockIntroduced === true &&
    scopeValidation.noSecretsIntroduced === true &&
    scopeValidation.runtimeExecution === false &&
    scopeValidation.providerCalls === false &&
    scopeValidation.publicArtifacts === false &&
    scopeValidation.production === false &&
    scopeValidation.supabaseWrites === false
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: clean ? 'passed' : 'blocked',
    stopConditions: STOP_CONDITIONS.map((condition) => ({ id: condition, occurred: false })),
    noStopConditionsOccurred: clean,
    stopAction: 'Stop Session 0, preserve blocked scopes, and route to the owner-specific blocker follow-up.',
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
    blockers: clean ? [] : ['stop_condition_clean_evidence_missing'],
  }
}

function buildReviewChecklist(
  scopeValidation: Record<string, unknown>,
  trackBReadinessReview: Record<string, unknown>,
  issueIntakeReport: Record<string, unknown>,
  stopConditionCheck: Record<string, unknown>,
) {
  const audioTimingEvidencePresent = existsSync(path.join(AUDIO_TIMING_REPORT_DIR, 'phase_36m_audio_timing_beta_gate_decision.json'))
  const mediaDataEvidencePresent = existsSync(path.join(MEDIA_DATA_REPORT_DIR, 'phase_46e_media_data_beta_gate_decision.json'))
  const checks = [
    check('allowed_scope_reviewed', asArray(scopeValidation.allowedScope).length > 0),
    check('blocked_scope_reviewed', asArray(scopeValidation.blockedScope).length > 0),
    check('track_b_clean_staging_milestone_sync_reviewed', scopeValidation.trackBCleanStagingSyncCompleted === true),
    check('track_b_capability_manifest_reviewed', existsSync(path.join(TRACK_B_CAPABILITY_REPORT_DIR, 'track_b_capability_manifests.json'))),
    check('track_b_route_manifest_reviewed', existsSync(path.join(TRACK_B_ROUTE_REPORT_DIR, 'track_b_tool_route_manifest.json'))),
    check('audio_timing_evidence_reviewed', audioTimingEvidencePresent),
    check('media_data_evidence_reviewed', mediaDataEvidencePresent),
    check('hybrid_desktop_metadata_evidence_reviewed', asArray(trackBReadinessReview.restrictedInternalReadyTools).includes('desktop_capability_profiler')),
    check('issue_intake_reviewed', issueIntakeReport.status === 'no_session_0_issues_found'),
    check('stop_conditions_reviewed', stopConditionCheck.status === 'passed'),
    check('no_runtime_execution', true),
    check('no_providers', true),
    check('no_production', true),
    check('no_public_artifacts', true),
  ]
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: checks.every((entry) => entry.passed) ? 'passed' : 'blocked',
    checks,
    requiredChecklistIds: REVIEW_CHECKS,
    audioTimingEvidencePresent,
    mediaDataEvidencePresent,
    session0ReviewMode: 'metadata_only',
    runtimeExecution: false,
    providerCalls: false,
    publicArtifacts: false,
    production: false,
    supabaseWrites: false,
    secretsPrintedOrCommitted: false,
  }
}

function buildDecision(
  scopeValidation: Record<string, unknown>,
  reviewChecklist: Record<string, unknown>,
  trackBReadinessReview: Record<string, unknown>,
  issueIntakeReport: Record<string, unknown>,
  stopConditionCheck: Record<string, unknown>,
) {
  const blockers = [
    ...(scopeValidation.status === 'passed' ? [] : asArray(scopeValidation.blockers).map(String)),
    ...(reviewChecklist.status === 'passed' ? [] : ['session_0_review_checklist_not_passed']),
    ...(trackBReadinessReview.status === 'passed' ? [] : asArray(trackBReadinessReview.blockers).map(String)),
    ...(issueIntakeReport.status === 'no_session_0_issues_found' ? [] : ['session_0_issues_require_review']),
    ...(stopConditionCheck.status === 'passed' ? [] : asArray(stopConditionCheck.blockers).map(String)),
    ...(scopeValidation.session0Started === true ? [] : ['session_0_metadata_execution_not_recorded']),
  ]
  const decision: ProductInternalTestingSession0Decision =
    blockers.length === 0
      ? 'restricted_internal_testing_session_0_passed'
      : blockers.includes('blocked_scope_unlock_detected') || blockers.includes('scope_drift_detected')
        ? 'blocked_pending_scope_violation_review'
        : blockers.includes('session_0_issues_require_review')
          ? 'blocked_pending_session_0_issue_review'
          : blockers.includes('stop_condition_clean_evidence_missing')
            ? 'blocked_pending_stop_condition_review'
            : blockers.includes('secret_policy_evidence_missing')
              ? 'blocked_pending_security_review'
              : 'blocked_pending_session_0_issue_review'
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    decision,
    status: decision === 'restricted_internal_testing_session_0_passed' ? 'passed' : 'blocked',
    session0Started: scopeValidation.session0Started === true,
    session0Mode: 'metadata_readiness_review_only',
    session0Passed: decision === 'restricted_internal_testing_session_0_passed',
    internalTestingExecutionStarted: false,
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
    nextRecommendedPhase: decision === 'restricted_internal_testing_session_0_passed'
      ? 'PRODUCT_INTERNAL_BETA_AGGREGATION - restricted internal testing session 1.'
      : 'Resolve Session 0 blockers before Session 1.',
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = Array.isArray(decision.blockers) ? decision.blockers : []
  return {
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    blockedScopesPreserved: [
      'external_beta',
      'paid_production',
      'production',
      'public_artifacts',
      'signed_url_source_of_truth',
      'raw_prompt_execution',
      'runtime_tool_worker_provider_execution',
      'broad_arbitrary_media',
      'track_a_runtime',
      'supabase_production_writes',
    ],
    session0Started: decision.session0Started === true,
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
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: blockerReport.activeBlockers,
    session0Started: decision.session0Started === true,
    scopeValidation: decision.status === 'passed' ? 'passed' : 'blocked',
    reviewChecklist: decision.status === 'passed' ? 'passed' : 'blocked',
    trackBReadinessReview: decision.status === 'passed' ? 'passed' : 'blocked',
    issueIntake: decision.status === 'passed' ? 'no_session_0_issues_found' : 'review_required',
    stopConditionCheck: decision.status === 'passed' ? 'passed' : 'blocked',
    supabaseUpdateRequired: 'no_new_write_metadata_readiness_review_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed',
    supabaseEnvironmentTouched: 'none',
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
    phase: PRODUCT_INTERNAL_TESTING_SESSION_0_PHASE,
    runId: PRODUCT_INTERNAL_TESTING_SESSION_0_RUN_ID,
    status: 'safe_metadata_only',
    reportDir: PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR,
    reports: PRODUCT_INTERNAL_TESTING_SESSION_0_EXPECTED_REPORTS,
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

function renderOverviewMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Product Restricted Internal Testing Session 0',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    `Session 0 started: \`${reports.decision.session0Started}\`.`,
    '',
    'This session is metadata/readiness review only. It does not run tools, workers, providers, routes, media processing, Supabase writes, SQL, public artifacts, signed URLs, raw prompts, external beta, paid production, or production.',
  ].join('\n')
}

function renderChecklistMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Restricted Internal Testing Session 0 Checklist',
    '',
    ...asArray(reports.reviewChecklist.checks).map((item) => {
      const entry = item as { id?: string; passed?: boolean }
      return `- \`${entry.id ?? 'unknown'}\`: \`${entry.passed === true}\``
    }),
  ].join('\n')
}

function renderIssueIntakeMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Restricted Internal Testing Session 0 Issue Intake',
    '',
    `Status: \`${reports.issueIntakeReport.status}\`.`,
    `Active issue count: \`${reports.issueIntakeReport.activeIssueCount}\`.`,
    '',
    'Issue categories:',
    ...asArray(reports.issueIntakeReport.issueCategories).map((item) => `- \`${item}\``),
  ].join('\n')
}

function renderDecisionMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Restricted Internal Testing Session 0 Decision',
    '',
    `Decision: \`${reports.decision.decision}\`.`,
    `Session 0 passed: \`${reports.decision.session0Passed}\`.`,
    `Session 0 started: \`${reports.decision.session0Started}\`.`,
    '',
    'External beta, paid production, production, public artifacts, runtime execution, providers, raw prompt execution, signed URL source-of-truth flows, and Supabase writes remain blocked.',
  ].join('\n')
}

function renderBetaReadinessScorecardMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Beta Readiness Scorecard',
    '',
    'Session 0 owned metadata scorecard.',
    '',
    `Restricted internal testing session 0: \`${reports.decision.decision}\`.`,
    `External beta allowed: \`${reports.decision.externalBetaAllowed}\`.`,
    `Paid production allowed: \`${reports.decision.paidProductionAllowed}\`.`,
    `Production allowed: \`${reports.decision.productionAllowed}\`.`,
    '',
    'This scorecard does not unlock external beta, paid production, public artifacts, runtime execution, or Supabase writes.',
  ].join('\n')
}

function renderProductionBetaBlockerMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# Production Beta Blocker Inventory',
    '',
    'Session 0 owned blocker inventory.',
    '',
    '- `external_beta`: blocked',
    '- `paid_production`: blocked',
    '- `production`: blocked',
    '- `public_artifacts`: blocked',
    '- `runtime_tool_worker_provider_execution`: blocked',
    '- `supabase_production_writes`: blocked',
    '',
    `Active Session 0 blockers: \`${asArray(reports.blockerReport.activeBlockers).length}\`.`,
  ].join('\n')
}

function renderNextPromptMarkdown(reports: ProductInternalTestingSession0Reports) {
  return [
    '# PRODUCT_INTERNAL_BETA_AGGREGATION - Restricted Internal Testing Session 1',
    '',
    `Current Session 0 decision: \`${reports.decision.decision}\`.`,
    '',
    'Session 1 is a separate phase. Keep it metadata/readiness review only unless a later owner-approved prompt explicitly changes scope. Do not unlock production, external beta, or paid production. Do not run tools, workers, providers, routes, media processing, public artifacts, raw prompt execution, signed URL source-of-truth flows, or Supabase writes.',
  ].join('\n')
}
