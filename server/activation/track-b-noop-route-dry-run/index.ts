import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  buildTrackBRouteDryRunApprovalReports,
} from '../track-b-route-dry-run-approval'
import {
  TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID,
  TRACK_B_NOOP_ROUTE_DRY_RUN_SCHEMA_VERSION,
  buildNoopRouteAuditReport,
  buildNoopRouteSecretPayloadGuard,
  executeNoopRouteDryRun,
  runNoopRouteFailureFixtures,
  validateNoopArtifactScope,
  validateNoopPlanSnapshot,
  validateNoopRouteResult,
  type NoopRouteArtifactScope,
  type NoopRoutePlanSnapshot,
} from '../../../src/lib/track-b/noop-route-dry-run'
import type { TrackBNoopRouteDryRunReports } from './noop-route-dry-run-types'

export const TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE = '44M'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID = 'phase44m-noop-route-dry-run-execution-20260605'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_BRANCH = 'codex/rp-activation-44m-noop-route-dry-run-execution'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_BASE_BRANCH = 'codex/rp-activation-44l-trackb-route-dry-run-approval-packet'
export const TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR = 'docs/activation-phase-44m-noop-route-dry-run-execution-reports'

export const TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS = [
  'phase_44m_noop_route_dry_run_plan.json',
  'phase_44m_noop_route_dry_run_prior_evidence_inventory.json',
  'phase_44m_noop_route_dry_run_prior_evidence_inventory.md',
  'phase_44m_noop_route_secret_payload_guard.json',
  'phase_44m_noop_route_plan_snapshot_validation.json',
  'phase_44m_noop_route_artifact_scope_validation.json',
  'phase_44m_noop_route_dry_run_execution_report.json',
  'phase_44m_noop_route_dry_run_audit_report.json',
  'phase_44m_noop_route_dry_run_failure_report.json',
  'phase_44m_noop_route_dry_run_readiness_report.json',
  'phase_44m_noop_route_dry_run_blocker_report.json',
  'phase_44m_private_artifact_manifest.json',
] as const

export const TRACK_B_NOOP_ROUTE_DRY_RUN_BLOCKED_SCOPES = [
  'future_metadata_route_dry_run_until_separate_approval',
  'live_route_execution',
  'real_worker_execution',
  'local_sidecar_execution',
  'real_tool_execution',
  'media_processing',
  'audio_processing',
  'ocr_runtime',
  'vlm_runtime',
  'model_download_or_runtime',
  'provider_calls',
  'web_search_provider_calls',
  'secret_payload_access',
  'docker_cloud_gcp_iam_mutation',
  'public_output',
  'public_artifacts',
  'signed_urls_as_source_of_truth',
  'raw_chat_execution',
  'arbitrary_paths',
  'broad_media',
  'arbitrary_media',
  'product_wide_internal_beta',
  'external_beta',
  'paid_production',
  'production',
  'track_a',
] as const

export function getTrackBNoopRouteDryRunPlan() {
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    branch: TRACK_B_NOOP_ROUTE_DRY_RUN_BRANCH,
    baseBranch: TRACK_B_NOOP_ROUTE_DRY_RUN_BASE_BRANCH,
    schemaVersion: TRACK_B_NOOP_ROUTE_DRY_RUN_SCHEMA_VERSION,
    mode: 'noop_route_dry_run_metadata_only',
    sourceApprovalPr: 188,
    sourceApprovalReportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    selectedCandidateId: TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID,
    requiredConfirmations: [
      'REEDITPRO_CONFIRM_TRACK_B_NOOP_ROUTE_DRY_RUN',
      'REEDITPRO_CONFIRM_TRACK_B_NOOP_ROUTE_DRY_RUN_EXECUTE',
    ],
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
      'REEDITPRO_CONFIRM_SERVICE_ROLE_SECRET_ACCESS',
      'REEDITPRO_CONFIRM_PROVIDER_SECRET_ACCESS',
      'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
      'REEDITPRO_CONFIRM_HYBRID_COMPUTE_LIVE_ROUTE',
      'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_EXECUTION',
      'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
      'REEDITPRO_CONFIRM_WORKER_EXECUTION',
      'REEDITPRO_CONFIRM_PROVIDER_CALLS',
      'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
      'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
    ],
    reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
    expectedReports: TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS,
    noSecretPayloadAccess: true,
    noRealRouteExecution: true,
    noWorkerExecution: true,
    noToolExecution: true,
    noSidecarProcess: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviderCalls: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    nextRecommendedPhase: 'metadata-only route dry-run approval/execution phase after the no-op dry-run passes.',
  }
}

export function getTrackBNoopRouteDryRunIamPlan() {
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    secretPayloadAccess: 'not_required',
    notes: [
      'Phase 44M reads committed safe metadata and writes committed safe reports only.',
      'No IAM binding, secret payload, Cloud Run, Cloud Build, Docker push, bucket, public principal, or GCP mutation is part of the no-op dry-run.',
    ],
  }
}

export function getTrackBNoopRouteDryRunCostSummary() {
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44MCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    routeExecution: 'noop_only',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    providerCalls: 'not_run',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeTrackBNoopRouteDryRunArtifacts(reportDir = TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR): Promise<void> {
  const reports = buildTrackBNoopRouteDryRunReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_prior_evidence_inventory.md'), renderPriorEvidenceInventoryMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_secret_payload_guard.json'), reports.secretPayloadGuard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_plan_snapshot_validation.json'), reports.planSnapshotValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_artifact_scope_validation.json'), reports.artifactScopeValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_execution_report.json'), reports.executionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_audit_report.json'), reports.auditReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_failure_report.json'), reports.failureReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_noop_route_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44m_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readTrackBNoopRouteDryRunSummary() {
  const reports = buildTrackBNoopRouteDryRunReports()
  const executionReport = reports.executionReport as { noopRouteDryRunStatus?: string }
  const failureReport = reports.failureReport as { fixtureCount?: number; passedFixtures?: number }
  const readinessReport = reports.readinessReport as { trackBNoopRouteDryRun?: string }
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: executionReport.noopRouteDryRunStatus,
    trackBNoopRouteDryRun: readinessReport.trackBNoopRouteDryRun,
    selectedCandidate: TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID,
    failureFixtures: `${failureReport.passedFixtures}/${failureReport.fixtureCount}`,
    secretPayloadAccess: 'not_required',
    routeExecution: 'noop_only',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    sidecarExecution: 'not_run',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildTrackBNoopRouteDryRunReports(): TrackBNoopRouteDryRunReports {
  const phase44lReports = buildTrackBRouteDryRunApprovalReports()
  const priorEvidenceInventory = buildPriorEvidenceInventory(phase44lReports)
  const planSnapshot = normalizePlanSnapshot(phase44lReports.planSnapshot)
  const artifactScope = normalizeArtifactScope(phase44lReports.artifactScope)
  const secretPayloadGuard = buildNoopRouteSecretPayloadGuard()
  const planSnapshotValidation = validateNoopPlanSnapshot(planSnapshot)
  const artifactScopeValidation = validateNoopArtifactScope(artifactScope)
  const executionReport = executeNoopRouteDryRun({
    candidateId: TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID,
    planSnapshotValidation,
    artifactScopeValidation,
    secretPayloadGuard,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
  })
  const auditReport = buildNoopRouteAuditReport({
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    planSnapshot,
    artifactScope,
    planSnapshotValidation,
    artifactScopeValidation,
    secretPayloadGuard,
    executionReport,
  })
  const failureFixtureResults = runNoopRouteFailureFixtures({ planSnapshot, artifactScope })
  const resultValidation = validateNoopRouteResult({ executionReport, failureFixtureResults })
  const failureReport = buildFailureReport(failureFixtureResults)
  const readinessReport = buildReadinessReport(executionReport, resultValidation)
  const blockerReport = buildBlockerReport(executionReport, resultValidation)
  return {
    plan: getTrackBNoopRouteDryRunPlan(),
    priorEvidenceInventory,
    secretPayloadGuard,
    planSnapshotValidation: {
      phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
      runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
      selectedCandidateId: planSnapshot.candidateId,
      planSnapshotId: planSnapshot.planSnapshotId,
      ...planSnapshotValidation,
      routeExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      workerExecutionAllowed: false,
      sidecarExecutionAllowed: false,
      toolExecutionAllowed: false,
    },
    artifactScopeValidation: {
      phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
      runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
      inputArtifactScopeId: artifactScope.inputArtifactScopeId,
      outputArtifactScopeId: artifactScope.outputArtifactScopeId,
      ...artifactScopeValidation,
      publicOutputAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      arbitraryPathAllowed: false,
      broadMediaAllowed: false,
    },
    executionReport,
    auditReport,
    failureReport,
    readinessReport,
    blockerReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

function buildPriorEvidenceInventory(phase44lReports: ReturnType<typeof buildTrackBRouteDryRunApprovalReports>) {
  const candidateRegistry = phase44lReports.candidateRegistry as {
    selectedCandidateId?: string
    realToolRuntimeCandidatesApproved?: boolean
  }
  const planSnapshot = phase44lReports.planSnapshot as {
    planSnapshotId?: string
    routeExecutionAllowed?: boolean
    runtimeExecutionAllowed?: boolean
    toolExecutionAllowed?: boolean
  }
  const artifactScope = phase44lReports.artifactScope as {
    outputArtifactScopeId?: string
    publicOutputAllowed?: boolean
    signedUrlSourceOfTruthAllowed?: boolean
  }
  const decision = phase44lReports.approvalDecision as {
    decision?: string
    status?: string
  }
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: 'phase44l_committed_safe_metadata_loaded',
    sourceApprovalPr: 188,
    sourceApprovalReportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    selectedCandidateId: candidateRegistry.selectedCandidateId,
    phase44lDecision: decision.decision,
    phase44lDecisionStatus: decision.status,
    phase44lPlanSnapshotId: planSnapshot.planSnapshotId,
    phase44lOutputArtifactScopeId: artifactScope.outputArtifactScopeId,
    routeExecutionAllowed: planSnapshot.routeExecutionAllowed,
    runtimeExecutionAllowed: planSnapshot.runtimeExecutionAllowed,
    toolExecutionAllowed: planSnapshot.toolExecutionAllowed,
    publicOutputAllowed: artifactScope.publicOutputAllowed,
    signedUrlSourceOfTruthAllowed: artifactScope.signedUrlSourceOfTruthAllowed,
    realToolRuntimeCandidatesApproved: candidateRegistry.realToolRuntimeCandidatesApproved,
    privatePayloadsRead: false,
    secretPayloadsRead: false,
  }
}

function normalizePlanSnapshot(planSnapshot: Record<string, unknown>): NoopRoutePlanSnapshot {
  return planSnapshot as NoopRoutePlanSnapshot
}

function normalizeArtifactScope(artifactScope: Record<string, unknown>): NoopRouteArtifactScope {
  const compatibility = artifactScope.validatorCompatibility as { request?: { artifactClasses?: string[] } } | undefined
  return {
    ...(artifactScope as NoopRouteArtifactScope),
    artifactClasses: compatibility?.request?.artifactClasses ?? ['safe_json_report', 'safe_markdown_report'],
  }
}

function buildFailureReport(fixtureResults: ReturnType<typeof runNoopRouteFailureFixtures>) {
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: fixtureResults.every((result) => result.status === 'passed' && result.expectedBlockedReasonObserved) ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    passedFixtures: fixtureResults.filter((result) => result.status === 'passed' && result.expectedBlockedReasonObserved).length,
    failureFixtures: fixtureResults,
    routeExecutionAllowedTrueBlocked: fixtureResults.some((result) => result.expectedBlockedReason === 'route_execution_allowed_true_blocked' && result.expectedBlockedReasonObserved),
    runtimeExecutionAllowedTrueBlocked: fixtureResults.some((result) => result.expectedBlockedReason === 'runtime_execution_allowed_true_blocked' && result.expectedBlockedReasonObserved),
    secretPayloadRequestedBlocked: fixtureResults.some((result) => result.expectedBlockedReason === 'unexpected_secret_payload_access_required' && result.expectedBlockedReasonObserved),
  }
}

function buildReadinessReport(
  executionReport: ReturnType<typeof executeNoopRouteDryRun>,
  resultValidation: ReturnType<typeof validateNoopRouteResult>,
) {
  const passed = executionReport.status === 'passed' && resultValidation.status === 'passed'
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    trackBNoopRouteDryRun: passed ? 'phase_complete_restricted_scope' : 'blocked',
    noopRouteDryRunStatus: executionReport.noopRouteDryRunStatus,
    noSecretPayloadAccessRequired: true,
    noRealWorkerExecution: true,
    noRealToolExecution: true,
    routeExecution: 'noop_only',
    localSidecarExecution: 'not_run',
    futureMetadataRouteDryRun: 'requires_separate_approval_execution_phase',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    broadMedia: 'blocked',
    publicArtifacts: 'blocked',
    trackA: 'not_touched',
  }
}

function buildBlockerReport(
  executionReport: ReturnType<typeof executeNoopRouteDryRun>,
  resultValidation: ReturnType<typeof validateNoopRouteResult>,
) {
  const activeBlockers = [...new Set([...executionReport.blockedReasons, ...resultValidation.blockedReasons])]
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    stillBlockedScopes: TRACK_B_NOOP_ROUTE_DRY_RUN_BLOCKED_SCOPES,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: TRACK_B_NOOP_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
    expectedReports: TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS,
  }
}

function renderPriorEvidenceInventoryMarkdown(priorEvidenceInventory: Record<string, unknown>) {
  return [
    '# Phase 44M Prior Evidence Inventory',
    '',
    `Run id: \`${TRACK_B_NOOP_ROUTE_DRY_RUN_RUN_ID}\``,
    '',
    `Status: \`${String(priorEvidenceInventory.status)}\``,
    '',
    `Source approval PR: #${String(priorEvidenceInventory.sourceApprovalPr)}`,
    '',
    `Selected candidate: \`${String(priorEvidenceInventory.selectedCandidateId)}\``,
    '',
    `Phase 44L decision: \`${String(priorEvidenceInventory.phase44lDecision)}\``,
    '',
    'Phase 44M uses committed safe metadata only and reads no private or secret payloads.',
  ].join('\n')
}
