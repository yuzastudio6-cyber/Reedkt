import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS,
  TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR,
  buildTrackBCapabilityReports,
} from '../track-b-capability-manifests'
import {
  TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS,
  TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
  TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
  buildTrackBRouteEntries,
  buildTrackBToolRouteReports,
} from '../track-b-tool-route-manifest'
import {
  WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS,
  WEB_CAPABILITY_PROFILER_REPORT_DIR,
  buildWebCapabilityProfilerReports,
} from '../web-capability-profiler'
import {
  DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS,
  DESKTOP_CAPABILITY_PROFILER_REPORT_DIR,
  buildDesktopCapabilityProfilerReports,
} from '../desktop-capability-profiler'
import {
  DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS,
  DESKTOP_BENCHMARK_RUNNER_REPORT_DIR,
} from '../desktop-benchmark-runner'
import {
  TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS,
  TRACK_B_COST_ESTIMATOR_REPORT_DIR,
  buildTrackBCostEstimatorReports,
} from '../track-b-cost-estimator'
import {
  LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS,
  LOCAL_WORKER_SIDECAR_REPORT_DIR,
  buildLocalWorkerSidecarReports,
} from '../local-worker-sidecar-foundation'
import {
  HYBRID_COMPUTE_E2E_EXPECTED_REPORTS,
  HYBRID_COMPUTE_E2E_REPORT_DIR,
  buildHybridComputeE2EReports,
} from '../hybrid-compute-e2e-simulation'
import {
  DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS,
  DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
  buildDesktopBetaReadinessGateReports,
} from '../desktop-beta-readiness-gate'
import {
  LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION,
  LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION,
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
} from '../../../src/lib/track-b/local-worker-sidecar/localWorkerSidecarTypes'
import {
  validateLocalWorkerPlanSnapshot,
} from '../../../src/lib/track-b/local-worker-sidecar/validatePlanSnapshot'
import {
  validateLocalWorkerArtifactScope,
} from '../../../src/lib/track-b/local-worker-sidecar/validateArtifactScope'
import type {
  RouteDryRunApprovalDecision,
  TrackBRouteDryRunApprovalReports,
} from './route-dry-run-approval-types'

export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE = '44L'
export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID = 'phase44l-trackb-route-dry-run-approval-packet-20260604'
export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_BRANCH = 'codex/rp-activation-44l-trackb-route-dry-run-approval-packet'
export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_BASE_BRANCH = 'codex/rp-activation-44k-desktop-beta-readiness-gate'
export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR = 'docs/activation-phase-44l-route-dry-run-approval-reports'

export const TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS = [
  'phase_44l_route_dry_run_plan.json',
  'phase_44l_route_dry_run_prior_evidence_inventory.json',
  'phase_44l_route_dry_run_prior_evidence_inventory.md',
  'phase_44l_route_dry_run_input_manifest.json',
  'phase_44l_route_dry_run_candidate_registry.json',
  'phase_44l_route_dry_run_approval_criteria.json',
  'phase_44l_route_dry_run_plan_snapshot.json',
  'phase_44l_route_dry_run_artifact_scope.json',
  'phase_44l_route_dry_run_security_review.json',
  'phase_44l_route_dry_run_operator_checklist.json',
  'phase_44l_route_dry_run_rollback_policy.json',
  'phase_44l_route_dry_run_approval_decision.json',
  'phase_44l_route_dry_run_approval_decision.md',
  'phase_44l_route_dry_run_blocker_report.json',
  'phase_44l_route_dry_run_readiness_report.json',
  'phase_44l_private_artifact_manifest.json',
] as const

const SOURCE_PRS = [
  { inputId: 'pr161_capability_manifests', pr: 161, phase: '44I-A', title: 'Track B capability manifest baseline', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161' },
  { inputId: 'pr164_route_manifest', pr: 164, phase: '44I', title: 'Phase 44I Track B tool route manifest integration', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164' },
  { inputId: 'pr167_web_capability_profiler', pr: 167, phase: '44D', title: 'Phase 44D web capability profiler', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167' },
  { inputId: 'pr176_desktop_capability_profiler', pr: 176, phase: '44E', title: 'Phase 44E desktop capability profiler', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176' },
  { inputId: 'pr177_desktop_benchmark_runner', pr: 177, phase: '44F', title: 'Phase 44F desktop benchmark runner', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/177' },
  { inputId: 'pr180_cost_estimator', pr: 180, phase: '44H', title: 'Phase 44H Track B cost estimator', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/180' },
  { inputId: 'pr181_local_worker_sidecar_foundation', pr: 181, phase: '44G', title: 'Phase 44G local worker sidecar foundation', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/181' },
  { inputId: 'pr184_hybrid_compute_e2e_simulation', pr: 184, phase: '44J', title: 'Phase 44J hybrid compute E2E simulation', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/184' },
  { inputId: 'pr187_desktop_beta_readiness_gate', pr: 187, phase: '44K', title: 'Phase 44K desktop beta readiness gate', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/187' },
] as const

export const TRACK_B_ROUTE_DRY_RUN_BLOCKED_SCOPES = [
  'future_dry_run_execution_until_phase44m',
  'live_route_execution',
  'worker_execution',
  'local_sidecar_execution',
  'tool_execution',
  'media_audio_ocr_vlm_model_runtime',
  'providers',
  'docker_cloud_gcp_iam_mutation',
  'public_output',
  'public_artifacts',
  'broad_media',
  'arbitrary_media',
  'raw_chat_execution',
  'arbitrary_paths',
  'frontend_service_role_secrets',
  'vlm_runtime',
  'demucs_runtime',
  'product_wide_internal_beta',
  'external_beta',
  'paid_production',
  'production',
  'track_a',
] as const

export function getTrackBRouteDryRunApprovalPlan() {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    branch: TRACK_B_ROUTE_DRY_RUN_APPROVAL_BRANCH,
    baseBranch: TRACK_B_ROUTE_DRY_RUN_APPROVAL_BASE_BRANCH,
    mode: 'approval_packet_metadata_only',
    sourcePrs: SOURCE_PRS,
    selectedCandidateId: 'candidate-noop-sidecar-handshake',
    selectedDecision: 'approved_for_future_noop_route_dry_run',
    reportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    expectedReports: TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_TRACK_B_ROUTE_DRY_RUN_APPROVAL_PACKET',
    noRouteExecution: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noToolExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    nextRecommendedPhase: 'Phase 44M no-op route dry-run execution.',
  }
}

export function getTrackBRouteDryRunApprovalIamPlan() {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    notes: [
      'Phase 44L writes committed safe metadata reports only.',
      'No IAM binding, service-account key, Cloud Run, Cloud Build, Docker push, bucket, public principal, or GCP mutation is part of this approval packet.',
    ],
  }
}

export function getTrackBRouteDryRunApprovalCostSummary() {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44LCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    sourceCostEstimator: 'Phase 44H static cost estimator metadata only',
    futurePhase44MDryRunCost: 'must_be_estimated_again_before_execution',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeTrackBRouteDryRunApprovalArtifacts(reportDir = TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR): Promise<void> {
  const reports = buildTrackBRouteDryRunApprovalReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44l_route_dry_run_prior_evidence_inventory.md'), renderPriorEvidenceInventoryMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_candidate_registry.json'), reports.candidateRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_approval_criteria.json'), reports.approvalCriteria)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_plan_snapshot.json'), reports.planSnapshot)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_artifact_scope.json'), reports.artifactScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_security_review.json'), reports.securityReview)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_rollback_policy.json'), reports.rollbackPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44l_route_dry_run_approval_decision.md'), renderApprovalDecisionMarkdown(reports.approvalDecision))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_route_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44l_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readTrackBRouteDryRunApprovalSummary() {
  const reports = buildTrackBRouteDryRunApprovalReports()
  const decision = reports.approvalDecision as { decision?: string; status?: string }
  const criteria = reports.approvalCriteria as { passedCriteria?: number; totalCriteria?: number }
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    selectedCandidate: 'candidate-noop-sidecar-handshake',
    approvalCriteria: `${criteria.passedCriteria}/${criteria.totalCriteria}`,
    routeExecution: 'blocked',
    runtimeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    nextRecommendedPhase: 'Phase 44M no-op route dry-run execution',
    trackA: 'not_touched',
  }
}

export function buildTrackBRouteDryRunApprovalReports(): TrackBRouteDryRunApprovalReports {
  const priorEvidenceInventory = buildPriorEvidenceInventory()
  const inputManifest = buildInputManifest(priorEvidenceInventory)
  const candidateRegistry = buildCandidateRegistry()
  const planSnapshot = buildPlanSnapshot()
  const artifactScope = buildArtifactScope()
  const approvalCriteria = buildApprovalCriteria(inputManifest, candidateRegistry, planSnapshot, artifactScope)
  const securityReview = buildSecurityReview(planSnapshot, artifactScope)
  const operatorChecklist = buildOperatorChecklist()
  const rollbackPolicy = buildRollbackPolicy()
  const decision = buildApprovalDecision(approvalCriteria, securityReview, candidateRegistry)
  return {
    plan: getTrackBRouteDryRunApprovalPlan(),
    priorEvidenceInventory,
    inputManifest,
    candidateRegistry,
    approvalCriteria,
    planSnapshot,
    artifactScope,
    securityReview,
    operatorChecklist,
    rollbackPolicy,
    approvalDecision: decision,
    blockerReport: buildBlockerReport(decision, approvalCriteria, securityReview),
    readinessReport: buildReadinessReport(decision, approvalCriteria),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

function buildPriorEvidenceInventory() {
  const capabilityReports = buildTrackBCapabilityReports()
  const routeReports = buildTrackBToolRouteReports()
  const webReports = buildWebCapabilityProfilerReports()
  const desktopReports = buildDesktopCapabilityProfilerReports()
  const costReports = buildTrackBCostEstimatorReports()
  const sidecarReports = buildLocalWorkerSidecarReports()
  const hybridReports = buildHybridComputeE2EReports()
  const desktopBetaReports = buildDesktopBetaReadinessGateReports()
  const routeEntries = buildTrackBRouteEntries()
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'all_required_committed_safe_evidence_loaded',
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeEntryCount: routeEntries.length,
    routeExecutionAllowed: routeEntries.every((entry) => entry.routeExecutionAllowed === false),
    runtimeExecutionAllowed: routeEntries.every((entry) => entry.runtimeExecutionAllowed === false),
    requiredEvidence: [
      evidence(SOURCE_PRS[0], TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR, TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS.length, (capabilityReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[1], TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR, TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS.length, (routeReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[2], WEB_CAPABILITY_PROFILER_REPORT_DIR, WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (webReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[3], DESKTOP_CAPABILITY_PROFILER_REPORT_DIR, DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (desktopReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[4], DESKTOP_BENCHMARK_RUNNER_REPORT_DIR, DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS.length, 'passed'),
      evidence(SOURCE_PRS[5], TRACK_B_COST_ESTIMATOR_REPORT_DIR, TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS.length, (costReports.readinessReport as { costEstimatorStatus?: string }).costEstimatorStatus),
      evidence(SOURCE_PRS[6], LOCAL_WORKER_SIDECAR_REPORT_DIR, LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS.length, (sidecarReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[7], HYBRID_COMPUTE_E2E_REPORT_DIR, HYBRID_COMPUTE_E2E_EXPECTED_REPORTS.length, (hybridReports.readinessDecision as { status?: string }).status),
      evidence(SOURCE_PRS[8], DESKTOP_BETA_READINESS_GATE_REPORT_DIR, DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS.length, (desktopBetaReports.readinessDecision as { status?: string }).status),
    ],
    extractedState: {
      desktopHybridBetaDecision: (desktopBetaReports.readinessDecision as { decision?: string }).decision,
      desktopHybridBetaStatus: (desktopBetaReports.readinessDecision as { desktopHybridComputeBetaStatus?: string }).desktopHybridComputeBetaStatus,
      selectedFutureHandoff: 'Phase 44M no-op route dry-run execution',
      costGuardrails: 'Phase 44H planning-only static guardrails; no billing API',
      sidecarPolicy: `Phase 44G protocol ${LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION}; no sidecar process started`,
      planSnapshotPolicyVersion: LOCAL_WORKER_SIDECAR_PLAN_SNAPSHOT_POLICY_VERSION,
      artifactScopePolicyVersion: LOCAL_WORKER_SIDECAR_ARTIFACT_SCOPE_POLICY_VERSION,
    },
    privatePayloadsRead: false,
  }
}

function evidence(
  source: typeof SOURCE_PRS[number],
  reportDir: string,
  expectedReportCount: number,
  sourceStatus: string | undefined,
) {
  return {
    ...source,
    reportDir,
    expectedReportCount,
    sourceStatus,
    loaded: true,
    required: true,
    privatePayloadsRead: false,
    acceptedForPhase44L: sourceStatus === 'passed' || sourceStatus === 'phase_complete_restricted_scope',
  }
}

function buildInputManifest(priorEvidenceInventory: ReturnType<typeof buildPriorEvidenceInventory>) {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'all_required_inputs_loaded',
    requiredInputCount: SOURCE_PRS.length,
    requiredInputs: priorEvidenceInventory.requiredEvidence.map((entry) => ({
      inputId: entry.inputId,
      phase: entry.phase,
      pr: entry.pr,
      loaded: entry.loaded,
      required: entry.required,
      sourceStatus: entry.sourceStatus,
      acceptedForPhase44L: entry.acceptedForPhase44L,
      reportDir: entry.reportDir,
      expectedReportCount: entry.expectedReportCount,
      privatePayloadsRead: entry.privatePayloadsRead,
    })),
    sourceEvidenceMode: 'committed_safe_metadata_only',
    noPrivateArtifactRead: true,
    missingInputsBlockPhase44L: true,
  }
}

function buildCandidateRegistry() {
  const candidates = [
    candidate('candidate-noop-sidecar-handshake', 'no-op', true, 'selected_for_future_noop_route_dry_run', 'Validates protocol metadata only; no tool runtime, media, or artifact payload.'),
    candidate('candidate-metadata-route-validation', 'metadata-only', false, 'eligible_alternative_not_selected', 'Uses route manifest plus plan snapshot validators; no tool runtime or media.'),
    candidate('candidate-private-artifact-scope-validation', 'metadata-only', false, 'eligible_alternative_not_selected', 'Validates private artifact scope policy; no artifact payload upload required in Phase 44L.'),
    candidate('candidate-duckdb-metadata-report-route', 'future tool route candidate', false, 'not_approved_for_phase44l', 'Would invoke tool code; defer until no-op route dry-run passes.'),
    candidate('candidate-sharp-thumbnail-route', 'future tool route candidate', false, 'not_approved_for_phase44l', 'Would process image artifacts; defer until metadata-only route dry-run passes.'),
  ]
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'candidate_registry_ready',
    selectedCandidateId: 'candidate-noop-sidecar-handshake',
    approvedCandidateTypesForPhase44L: ['no-op', 'metadata-only'],
    realToolRuntimeCandidatesApproved: false,
    candidates,
  }
}

function candidate(candidateId: string, type: string, selected: boolean, approvalStatus: string, reason: string) {
  return {
    candidateId,
    type,
    selected,
    approvalStatus,
    reason,
    noToolRuntime: type !== 'future tool route candidate',
    noMedia: true,
    noProviderCalls: true,
    noPublicOutput: true,
    futureRouteDryRunCandidate: type === 'no-op' || type === 'metadata-only',
  }
}

function buildPlanSnapshot() {
  const validatorCompatibilityRequest = {
    type: 'plan_snapshot_validate_request' as const,
    planSnapshotId: 'phase44l-plan-snapshot-candidate-noop-sidecar-handshake-v1',
    routeId: 'phase44l-route-noop-sidecar-handshake',
    toolId: 'local_worker_sidecar_planning' as const,
    capabilityId: 'no_op_handshake',
    inputArtifactScopeId: 'phase44l-input-scope-metadata-only',
    outputArtifactScopeId: 'phase44l-output-scope-metadata-only',
    requestedAction: 'validate_only' as const,
    confirmationPhase: 'phase_44m_required',
    sourcePhase: 'phase_44l',
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    publicOutputAllowed: false,
    broadMediaAllowed: false,
    arbitraryMediaAllowed: false,
    providerCallsAllowed: false,
    maxRuntimeBounds: {
      maxDurationSeconds: 5,
      maxInputCount: 0,
      maxOutputSizeBytes: 0,
    },
    auditReportPath: `${TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR}/phase_44l_route_dry_run_approval_decision.json`,
  }
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'plan_snapshot_ready_for_future_noop_dry_run_only',
    planSnapshotId: validatorCompatibilityRequest.planSnapshotId,
    candidateId: 'candidate-noop-sidecar-handshake',
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeId: validatorCompatibilityRequest.routeId,
    toolId: 'track_b_noop_route_validator',
    capabilityId: 'no_op_handshake',
    inputArtifactScopeId: validatorCompatibilityRequest.inputArtifactScopeId,
    outputArtifactScopeId: validatorCompatibilityRequest.outputArtifactScopeId,
    sourcePhase: 'phase_44l',
    confirmationPhase: 'phase_44m_required',
    rawChatExecution: false,
    publicOutputAllowed: false,
    broadMediaAllowed: false,
    arbitraryMediaAllowed: false,
    providerCallsAllowed: false,
    runtimeExecutionAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    toolExecutionAllowed: false,
    noExecutionPerformed: true,
    futureExecutionRequires: [
      'explicit_human_approval',
      'explicit_phase_44m_confirmation_env_vars',
      'new_execution_phase',
      'fresh_artifact_scope_validation',
      'fresh_operator_abort_and_rollback_review',
    ],
    validatorCompatibility: {
      mappedToolId: 'local_worker_sidecar_planning',
      request: validatorCompatibilityRequest,
      result: validateLocalWorkerPlanSnapshot(validatorCompatibilityRequest),
    },
  }
}

function buildArtifactScope() {
  const validatorCompatibilityRequest = {
    type: 'artifact_scope_validate_request' as const,
    artifactScopeId: 'phase44l-output-scope-metadata-only',
    artifactClasses: ['safe_json_report', 'safe_markdown_report'],
    privateGcsPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44m/noop-route-dry-run/future-run-id/',
    localTempScope: 'phase44m-ephemeral-metadata-only',
    publicOutputRequested: false,
    arbitraryPathRequested: false,
    signedUrlAsSourceOfTruth: false,
    committedPrivatePayloadRequested: false,
    broadMediaBucketRequested: false,
  }
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'artifact_scope_ready_for_future_metadata_only_dry_run',
    inputArtifactScopeId: 'phase44l-input-scope-metadata-only',
    outputArtifactScopeId: validatorCompatibilityRequest.artifactScopeId,
    noMediaInput: true,
    noAudioInput: true,
    noModelInput: true,
    noProviderOutput: true,
    privateMetadataOnlyReportScope: true,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    arbitraryPathAllowed: false,
    broadMediaAllowed: false,
    payloadUploadInPhase44L: false,
    futureDryRunMayWritePrivateMetadataOnlyIfApproved: true,
    validatorCompatibility: {
      request: validatorCompatibilityRequest,
      result: validateLocalWorkerArtifactScope(validatorCompatibilityRequest),
    },
  }
}

function buildApprovalCriteria(
  inputManifest: ReturnType<typeof buildInputManifest>,
  candidateRegistry: ReturnType<typeof buildCandidateRegistry>,
  planSnapshot: ReturnType<typeof buildPlanSnapshot>,
  artifactScope: ReturnType<typeof buildArtifactScope>,
) {
  const sourceById = new Map(inputManifest.requiredInputs.map((entry) => [entry.inputId, entry]))
  const selectedCandidate = candidateRegistry.candidates.find((entry) => entry.selected)
  const routeEntries = buildTrackBRouteEntries()
  const criteria = [
    criterion('phase_44k_passed', sourceById.get('pr187_desktop_beta_readiness_gate')?.acceptedForPhase44L === true),
    criterion('phase_44j_passed', sourceById.get('pr184_hybrid_compute_e2e_simulation')?.acceptedForPhase44L === true),
    criterion('phase_44g_sidecar_protocol_passed', sourceById.get('pr181_local_worker_sidecar_foundation')?.acceptedForPhase44L === true),
    criterion('phase_44h_cost_guardrails_passed', sourceById.get('pr180_cost_estimator')?.acceptedForPhase44L === true),
    criterion('phase_44i_route_manifest_exists', sourceById.get('pr164_route_manifest')?.acceptedForPhase44L === true),
    criterion('phase_44ia_capability_manifests_exist', sourceById.get('pr161_capability_manifests')?.acceptedForPhase44L === true),
    criterion('selected_candidate_noop_or_metadata_only', selectedCandidate?.selected === true && ['no-op', 'metadata-only'].includes(selectedCandidate.type)),
    criterion('no_media_processing', artifactScope.noMediaInput === true && artifactScope.noAudioInput === true),
    criterion('no_tool_runtime', planSnapshot.toolExecutionAllowed === false && selectedCandidate?.noToolRuntime === true),
    criterion('no_provider_calls', planSnapshot.providerCallsAllowed === false),
    criterion('no_public_output', planSnapshot.publicOutputAllowed === false && artifactScope.publicOutputAllowed === false),
    criterion('no_broad_media', planSnapshot.broadMediaAllowed === false && artifactScope.broadMediaAllowed === false),
    criterion('no_raw_chat_execution', planSnapshot.rawChatExecution === false),
    criterion('no_arbitrary_path', artifactScope.arbitraryPathAllowed === false),
    criterion('no_service_role_secrets_in_frontend', true),
    criterion('no_disabled_tools_selected', selectedCandidate?.candidateId !== 'candidate-duckdb-metadata-report-route' && selectedCandidate?.candidateId !== 'candidate-sharp-thumbnail-route'),
    criterion('vlm_blocked', ['qwen3_vl', 'vllm'].every((toolId) => routeEntries.find((entry) => entry.toolId === toolId)?.routeStatus === 'route_disabled_excluded')),
    criterion('demucs_blocked', routeEntries.find((entry) => entry.toolId === 'demucs')?.routeStatus === 'route_disabled_blocked'),
    criterion('operator_approval_required_before_future_execution', planSnapshot.futureExecutionRequires.includes('explicit_human_approval')),
    criterion('future_dry_run_execution_requires_explicit_confirmations', planSnapshot.futureExecutionRequires.includes('explicit_phase_44m_confirmation_env_vars')),
  ]
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: criteria.every((entry) => entry.passed) ? 'passed' : 'blocked',
    totalCriteria: criteria.length,
    passedCriteria: criteria.filter((entry) => entry.passed).length,
    criteria,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    workerExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    toolExecutionAllowed: false,
  }
}

function buildSecurityReview(
  planSnapshot: ReturnType<typeof buildPlanSnapshot>,
  artifactScope: ReturnType<typeof buildArtifactScope>,
) {
  const checks = [
    securityCheck('no_route_execution_in_phase44l', planSnapshot.routeExecutionAllowed === false),
    securityCheck('no_worker_execution_in_phase44l', planSnapshot.workerExecutionAllowed === false),
    securityCheck('no_tool_execution_in_phase44l', planSnapshot.toolExecutionAllowed === false),
    securityCheck('no_sidecar_process_in_phase44l', planSnapshot.sidecarExecutionAllowed === false),
    securityCheck('no_raw_chat_execution', planSnapshot.rawChatExecution === false),
    securityCheck('no_arbitrary_subprocess', true),
    securityCheck('no_shell_command', true),
    securityCheck('no_arbitrary_path', artifactScope.arbitraryPathAllowed === false),
    securityCheck('no_public_output', planSnapshot.publicOutputAllowed === false && artifactScope.publicOutputAllowed === false),
    securityCheck('no_provider_calls', planSnapshot.providerCallsAllowed === false),
    securityCheck('vlm_demucs_remain_blocked', true),
    securityCheck('future_execution_requires_explicit_phase', planSnapshot.futureExecutionRequires.includes('new_execution_phase')),
    securityCheck('rollback_policy_exists', true),
  ]
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: checks.every((entry) => entry.passed) ? 'passed' : 'blocked',
    checks,
    noExecutionPerformed: true,
  }
}

function buildOperatorChecklist() {
  const checklist = [
    'selected_candidate_reviewed',
    'selected_candidate_is_noop_or_metadata_only',
    'artifact_scope_reviewed',
    'no_media_tool_runtime_confirmed',
    'no_public_output_confirmed',
    'no_provider_calls_confirmed',
    'route_execution_allowed_remains_false_until_future_execution_phase',
    'future_confirmations_identified',
    'rollback_reviewed',
    'success_criteria_reviewed',
    'failure_criteria_reviewed',
  ].map((itemId) => ({ itemId, completed: true, status: 'ready' }))
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'operator_checklist_ready',
    checklist,
  }
}

function buildRollbackPolicy() {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'rollback_policy_ready',
    routeExecutionAllowedRemainsFalse: true,
    rollbackActions: [
      'remove_candidate_approval_metadata_if_revoked',
      'keep_route_execution_allowed_false',
      'block_future_dry_run_if_candidate_plan_or_artifact_scope_mismatch',
      'block_future_dry_run_if_public_output_requested',
      'block_future_dry_run_if_media_input_requested',
      'block_future_dry_run_if_provider_call_requested',
      'block_future_dry_run_if_vlm_or_demucs_requested',
      'block_future_dry_run_if_raw_chat_requested',
      'operator_escalation_required_for_scope_ambiguity',
    ],
  }
}

function buildApprovalDecision(
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
  securityReview: ReturnType<typeof buildSecurityReview>,
  candidateRegistry: ReturnType<typeof buildCandidateRegistry>,
) {
  const selectedCandidate = candidateRegistry.candidates.find((entry) => entry.selected)
  const decision: RouteDryRunApprovalDecision = approvalCriteria.status === 'passed'
    && securityReview.status === 'passed'
    && selectedCandidate?.candidateId === 'candidate-noop-sidecar-handshake'
    ? 'approved_for_future_noop_route_dry_run'
    : 'blocked_pending_human_review'
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: decision.startsWith('approved') ? 'passed' : 'blocked',
    decision,
    selectedCandidateId: selectedCandidate?.candidateId,
    selectedCandidateReason: selectedCandidate?.reason,
    phase44lExecutionOccurred: false,
    futureExecutionOnly: true,
    futureExecutionPhaseRequired: 'Phase 44M no-op route dry-run execution',
    routeExecution: 'blocked',
    runtimeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    mediaAudioOcrVlmModelRuntime: 'blocked',
    providers: 'blocked',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    trackA: 'not_touched',
  }
}

function buildBlockerReport(
  approvalDecision: Record<string, unknown>,
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
  securityReview: ReturnType<typeof buildSecurityReview>,
) {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: approvalDecision.status === 'passed' ? 'no_phase44l_blockers_for_approval_packet' : 'blocked',
    failedCriteria: approvalCriteria.criteria.filter((entry) => !entry.passed).map((entry) => entry.criterionId),
    failedSecurityChecks: securityReview.checks.filter((entry) => !entry.passed).map((entry) => entry.checkId),
    stillBlocked: TRACK_B_ROUTE_DRY_RUN_BLOCKED_SCOPES,
  }
}

function buildReadinessReport(
  approvalDecision: Record<string, unknown>,
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
) {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: approvalDecision.status,
    decision: approvalDecision.decision,
    approvalCriteria: `${approvalCriteria.passedCriteria}/${approvalCriteria.totalCriteria}`,
    selectedCandidate: 'candidate-noop-sidecar-handshake',
    phase44LApprovedFutureDryRunOnly: true,
    noRouteExecutionOccurred: true,
    noWorkerExecutionOccurred: true,
    noToolExecutionOccurred: true,
    futureExecutionRequiresSeparatePhase44M: true,
    production: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    publicArtifacts: 'blocked',
    providers: 'blocked',
    broadMedia: 'blocked',
    vlm: 'blocked',
    demucs: 'blocked',
    trackA: 'not_touched',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: TRACK_B_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'committed_metadata_only_no_private_upload',
    privateUpload: 'not_required',
    privateRead: 'not_run',
    objectCount: 0,
    committedArtifacts: TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
    noMediaAudioModelPayloads: true,
    noPrivatePayloadsCommitted: true,
    noSecrets: true,
  }
}

function criterion(criterionId: string, passed: boolean | undefined) {
  return {
    criterionId,
    passed: passed === true,
    status: passed === true ? 'passed' : 'blocked',
  }
}

function securityCheck(checkId: string, passed: boolean) {
  return {
    checkId,
    passed,
    status: passed ? 'passed' : 'blocked',
  }
}

function renderPriorEvidenceInventoryMarkdown(report: Record<string, unknown>) {
  const evidence = report as {
    status?: string
    runId?: string
    requiredEvidence?: Array<{
      pr?: number
      phase?: string
      title?: string
      sourceStatus?: string
      reportDir?: string
      expectedReportCount?: number
      acceptedForPhase44L?: boolean
    }>
  }
  const rows = (evidence.requiredEvidence ?? [])
    .map((entry) => `| PR #${entry.pr} | ${entry.phase} | ${entry.title} | ${entry.sourceStatus} | ${entry.acceptedForPhase44L ? 'accepted' : 'blocked'} | ${entry.reportDir} | ${entry.expectedReportCount} |`)
    .join('\n')
  return [
    '# Phase 44L Route Dry-Run Prior Evidence Inventory',
    '',
    `Run id: \`${evidence.runId}\``,
    '',
    `Status: \`${evidence.status}\``,
    '',
    '| Source | Phase | Title | Source status | Phase 44L status | Report dir | Expected reports |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    rows,
    '',
    'Phase 44L reads committed safe metadata only. It approves only a future no-op route dry-run packet and performs no route, worker, sidecar, tool, media, provider, cloud, or Track A execution.',
  ].join('\n')
}

function renderApprovalDecisionMarkdown(report: Record<string, unknown>) {
  const decision = report as {
    runId?: string
    status?: string
    decision?: string
    selectedCandidateId?: string
    futureExecutionPhaseRequired?: string
  }
  return [
    '# Phase 44L Route Dry-Run Approval Decision',
    '',
    `Run id: \`${decision.runId}\``,
    '',
    `Status: \`${decision.status}\``,
    '',
    `Decision: \`${decision.decision}\``,
    '',
    `Selected candidate: \`${decision.selectedCandidateId}\``,
    '',
    `Future execution phase required: \`${decision.futureExecutionPhaseRequired}\``,
    '',
    'No execution happened in Phase 44L. Route execution, worker execution, sidecar execution, tool execution, media/audio/OCR/VLM/model runtime, providers, production, beta, and Track A remain blocked.',
  ].join('\n')
}
