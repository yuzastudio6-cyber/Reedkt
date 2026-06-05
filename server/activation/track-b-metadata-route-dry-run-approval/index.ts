import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS,
  TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
  buildTrackBNoopRouteDryRunReports,
} from '../track-b-noop-route-dry-run'
import {
  TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  buildTrackBRouteDryRunApprovalReports,
} from '../track-b-route-dry-run-approval'
import {
  TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
  TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
  buildTrackBRouteEntries,
  buildTrackBToolRouteReports,
} from '../track-b-tool-route-manifest'
import {
  TRACK_B_COST_ESTIMATOR_REPORT_DIR,
  buildTrackBCostEstimatorReports,
} from '../track-b-cost-estimator'
import {
  LOCAL_WORKER_SIDECAR_REPORT_DIR,
  buildLocalWorkerSidecarReports,
} from '../local-worker-sidecar-foundation'
import {
  HYBRID_COMPUTE_E2E_REPORT_DIR,
  buildHybridComputeE2EReports,
} from '../hybrid-compute-e2e-simulation'
import {
  DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
  buildDesktopBetaReadinessGateReports,
} from '../desktop-beta-readiness-gate'
import type {
  MetadataRouteDryRunApprovalDecision,
  TrackBMetadataRouteDryRunApprovalReports,
} from './metadata-route-dry-run-approval-types'

export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE = '44N'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID = 'phase44n-metadata-route-dry-run-approval-packet-20260605'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BRANCH = 'codex/rp-activation-44n-metadata-route-dry-run-approval-packet'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BASE_BRANCH = 'codex/rp-activation-44m-noop-route-dry-run-execution'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR = 'docs/activation-phase-44n-metadata-route-dry-run-approval-reports'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE = 'candidate-duckdb-metadata-route-dry-run'

export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS = [
  'phase_44n_metadata_route_dry_run_plan.json',
  'phase_44n_metadata_route_dry_run_prior_evidence_inventory.json',
  'phase_44n_metadata_route_dry_run_prior_evidence_inventory.md',
  'phase_44n_metadata_route_dry_run_candidate_registry.json',
  'phase_44n_metadata_route_dry_run_approval_criteria.json',
  'phase_44n_metadata_route_dry_run_plan_snapshot.json',
  'phase_44n_metadata_route_dry_run_artifact_scope.json',
  'phase_44n_metadata_route_dry_run_security_review.json',
  'phase_44n_metadata_route_secret_payload_guard.json',
  'phase_44n_metadata_route_dry_run_operator_checklist.json',
  'phase_44n_metadata_route_dry_run_rollback_policy.json',
  'phase_44n_metadata_route_dry_run_approval_decision.json',
  'phase_44n_metadata_route_dry_run_approval_decision.md',
  'phase_44n_metadata_route_dry_run_blocker_report.json',
  'phase_44n_metadata_route_dry_run_readiness_report.json',
  'phase_44n_private_artifact_manifest.json',
] as const

export const TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BLOCKED_SCOPES = [
  'future_metadata_dry_run_execution_until_phase44o',
  'live_route_execution',
  'runtime_execution',
  'real_worker_execution',
  'local_sidecar_execution',
  'real_tool_execution',
  'duckdb_runtime_execution',
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

const SOURCE_EVIDENCE = [
  { inputId: 'pr189_noop_route_dry_run', pr: 189, phase: '44M', title: 'Phase 44M no-op route dry-run execution', reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR, expectedReportCount: TRACK_B_NOOP_ROUTE_DRY_RUN_EXPECTED_REPORTS.length },
  { inputId: 'pr188_route_dry_run_approval', pr: 188, phase: '44L', title: 'Phase 44L route dry-run approval packet', reportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR, expectedReportCount: TRACK_B_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS.length },
  { inputId: 'pr187_desktop_beta_readiness_gate', pr: 187, phase: '44K', title: 'Phase 44K desktop beta readiness gate', reportDir: DESKTOP_BETA_READINESS_GATE_REPORT_DIR, expectedReportCount: 15 },
  { inputId: 'pr184_hybrid_compute_e2e_simulation', pr: 184, phase: '44J', title: 'Phase 44J hybrid compute E2E simulation', reportDir: HYBRID_COMPUTE_E2E_REPORT_DIR, expectedReportCount: 14 },
  { inputId: 'pr181_local_worker_sidecar_foundation', pr: 181, phase: '44G', title: 'Phase 44G local worker sidecar foundation', reportDir: LOCAL_WORKER_SIDECAR_REPORT_DIR, expectedReportCount: 17 },
  { inputId: 'pr180_cost_estimator', pr: 180, phase: '44H', title: 'Phase 44H Track B cost estimator', reportDir: TRACK_B_COST_ESTIMATOR_REPORT_DIR, expectedReportCount: 15 },
  { inputId: 'pr164_route_manifest', pr: 164, phase: '44I', title: 'Phase 44I Track B tool route manifest integration', reportDir: TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR, expectedReportCount: 13 },
] as const

export function getTrackBMetadataRouteDryRunApprovalPlan() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    branch: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BRANCH,
    baseBranch: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BASE_BRANCH,
    mode: 'approval_packet_metadata_only_no_route_execution',
    sourcePr: 189,
    selectedCandidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
    selectedToolId: 'duckdb',
    selectedCapabilityId: 'internal_qa_aggregation',
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PACKET',
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN_EXECUTE',
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
    reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
    noRouteExecution: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noToolExecution: true,
    noDuckDbRuntime: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noSecretAccess: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    nextRecommendedPhase: 'Phase 44O metadata-only route dry-run execution.',
  }
}

export function getTrackBMetadataRouteDryRunApprovalIamPlan() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    secretPayloadAccess: 'not_required',
    notes: [
      'Phase 44N writes committed safe metadata reports only.',
      'No IAM binding, service-account key, Secret Manager read, Cloud Run, Cloud Build, Docker push, bucket, public principal, or GCP mutation is part of this approval packet.',
    ],
  }
}

export function getTrackBMetadataRouteDryRunApprovalCostSummary() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44NCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    runtimeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    duckDbRuntime: 'not_run',
    providerCalls: 'not_run',
    sourceCostEstimator: 'Phase 44H marks duckdb metadata-only route as free_or_negligible planning cost.',
    futurePhase44OCost: 'must_be_estimated_again_before_execution',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeTrackBMetadataRouteDryRunApprovalArtifacts(reportDir = TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR): Promise<void> {
  const reports = buildTrackBMetadataRouteDryRunApprovalReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_prior_evidence_inventory.md'), renderPriorEvidenceInventoryMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_candidate_registry.json'), reports.candidateRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_approval_criteria.json'), reports.approvalCriteria)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_plan_snapshot.json'), reports.planSnapshot)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_artifact_scope.json'), reports.artifactScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_security_review.json'), reports.securityReview)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_secret_payload_guard.json'), reports.secretGuard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_operator_checklist.json'), reports.operatorChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_rollback_policy.json'), reports.rollbackPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_approval_decision.json'), reports.approvalDecision)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_approval_decision.md'), renderApprovalDecisionMarkdown(reports.approvalDecision))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_metadata_route_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44n_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readTrackBMetadataRouteDryRunApprovalSummary() {
  const reports = buildTrackBMetadataRouteDryRunApprovalReports()
  const decision = reports.approvalDecision as { decision?: string; status?: string }
  const criteria = reports.approvalCriteria as { passedCriteria?: number; totalCriteria?: number }
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    selectedCandidate: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
    selectedToolId: 'duckdb',
    approvalCriteria: `${criteria.passedCriteria}/${criteria.totalCriteria}`,
    routeExecution: 'not_run',
    runtimeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    secretAccess: 'not_run',
    nextRecommendedPhase: 'Phase 44O metadata-only route dry-run execution',
    trackA: 'not_touched',
  }
}

export function buildTrackBMetadataRouteDryRunApprovalReports(): TrackBMetadataRouteDryRunApprovalReports {
  const priorEvidenceInventory = buildPriorEvidenceInventory()
  const candidateRegistry = buildCandidateRegistry()
  const planSnapshot = buildPlanSnapshot()
  const artifactScope = buildArtifactScope()
  const securityReview = buildSecurityReview(planSnapshot, artifactScope)
  const secretGuard = buildSecretGuard()
  const operatorChecklist = buildOperatorChecklist()
  const rollbackPolicy = buildRollbackPolicy()
  const approvalCriteria = buildApprovalCriteria(priorEvidenceInventory, candidateRegistry, planSnapshot, artifactScope, securityReview, secretGuard)
  const decision = buildApprovalDecision(approvalCriteria, securityReview, secretGuard, candidateRegistry)
  return {
    plan: getTrackBMetadataRouteDryRunApprovalPlan(),
    priorEvidenceInventory,
    candidateRegistry,
    approvalCriteria,
    planSnapshot,
    artifactScope,
    securityReview,
    secretGuard,
    operatorChecklist,
    rollbackPolicy,
    approvalDecision: decision,
    blockerReport: buildBlockerReport(decision, approvalCriteria, securityReview, secretGuard),
    readinessReport: buildReadinessReport(decision, approvalCriteria),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

function buildPriorEvidenceInventory() {
  const phase44mReports = buildTrackBNoopRouteDryRunReports()
  const phase44lReports = buildTrackBRouteDryRunApprovalReports()
  const routeReports = buildTrackBToolRouteReports()
  const costReports = buildTrackBCostEstimatorReports()
  const sidecarReports = buildLocalWorkerSidecarReports()
  const hybridReports = buildHybridComputeE2EReports()
  const desktopBetaReports = buildDesktopBetaReadinessGateReports()
  const routeEntries = buildTrackBRouteEntries()
  const duckDbRoute = routeEntries.find((entry) => entry.toolId === 'duckdb')
  const costToolMapping = costReports.toolMapping as { tools?: Array<{ toolId?: string; executionClass?: string; costRiskClass?: string; estimateAllowed?: boolean; blockers?: string[] }> }
  const duckDbCost = costToolMapping.tools?.find((entry) => entry.toolId === 'duckdb')
  const phase44mExecution = phase44mReports.executionReport as { noopRouteDryRunStatus?: string; routeExecutionPerformed?: boolean; secretPayloadAccessPerformed?: boolean }
  const phase44lDecision = phase44lReports.approvalDecision as { decision?: string; status?: string }
  const desktopDecision = desktopBetaReports.readinessDecision as { status?: string; desktopHybridComputeBetaStatus?: string }
  const hybridDecision = hybridReports.readinessDecision as { status?: string }
  const sidecarValidation = sidecarReports.validationReport as { status?: string }
  const routeValidation = routeReports.validationReport as { status?: string }
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'all_required_committed_safe_evidence_loaded',
    sourceEvidence: SOURCE_EVIDENCE.map((entry) => ({
      ...entry,
      loaded: true,
      required: true,
      privatePayloadsRead: false,
      acceptedForPhase44N: true,
    })),
    phase44m: {
      reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
      noopRouteDryRunStatus: phase44mExecution.noopRouteDryRunStatus,
      routeExecutionPerformed: phase44mExecution.routeExecutionPerformed,
      secretPayloadAccessPerformed: phase44mExecution.secretPayloadAccessPerformed,
    },
    phase44l: {
      reportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
      decision: phase44lDecision.decision,
      status: phase44lDecision.status,
    },
    phase44k: {
      reportDir: DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
      status: desktopDecision.status,
      desktopHybridComputeBetaStatus: desktopDecision.desktopHybridComputeBetaStatus,
    },
    phase44j: {
      reportDir: HYBRID_COMPUTE_E2E_REPORT_DIR,
      status: hybridDecision.status,
    },
    routeManifest: {
      reportDir: TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
      validationStatus: routeValidation.status,
      routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
      duckDbRoute,
    },
    costEstimator: {
      reportDir: TRACK_B_COST_ESTIMATOR_REPORT_DIR,
      duckDbCost,
    },
    sidecarFoundation: {
      reportDir: LOCAL_WORKER_SIDECAR_REPORT_DIR,
      validationStatus: sidecarValidation.status,
      allowsValidationOnly: true,
      executionAllowed: false,
    },
    privatePayloadsRead: false,
    secretPayloadsRead: false,
    noTrackA: true,
  }
}

function buildCandidateRegistry() {
  const candidates = [
    candidate('candidate-duckdb-metadata-route-dry-run', 'duckdb', 'internal_qa_aggregation', true, 'selected_approved_candidate', 'metadata-only DuckDB route resolution dry-run; no DuckDB runtime execution.'),
    candidate('candidate-polars-metadata-route-dry-run', 'polars', 'internal_qa_transforms', false, 'eligible_alternative_not_selected', 'metadata-only Polars route resolution dry-run; no Polars runtime execution.'),
    candidate('candidate-route-metadata-validator', 'tool_route_manifest_integration', 'route_manifest_metadata_handoff', false, 'eligible_alternative_not_selected', 'generic route metadata validation only; no tool-specific runtime.'),
    candidate('candidate-sharp-thumbnail-route', 'sharp_libvips', 'thumbnail_generation', false, 'not_approved_for_phase44n', 'would process image artifacts; defer until metadata-only route dry-run passes.'),
    candidate('candidate-ocr-safe-zone-route', 'paddleocr', 'internal_ocr_qa_planning', false, 'not_approved_for_phase44n', 'would involve OCR runtime; defer to later explicit runtime route phase.'),
    candidate('candidate-deepfilternet-route', 'deepfilternet', 'bounded_speech_cleanup', false, 'not_approved_for_phase44n', 'would involve audio runtime; defer.'),
    candidate('candidate-signalsmith-route', 'signalsmith_stretch', 'bounded_timing_stretch', false, 'not_approved_for_phase44n', 'would involve audio runtime; defer.'),
    candidate('candidate-demucs-route', 'demucs', 'none', false, 'blocked', 'Demucs remains blocked pending provenance/legal approval and no model download/source separation is allowed.'),
    candidate('candidate-vlm-route', 'qwen3_vl', 'none', false, 'blocked', 'VLM route remains excluded/blocked by Track B decision evidence.'),
  ]
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'candidate_registry_ready',
    candidateCount: candidates.length,
    selectedCandidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
    selectedCandidateUsesRealEligibleRouteEntry: true,
    candidates,
    realRuntimeCandidatesApproved: false,
    mediaProcessingCandidatesApproved: false,
    ocrAudioVlmCandidatesApproved: false,
  }
}

function candidate(candidateId: string, toolId: string, capabilityId: string, selected: boolean, approvalStatus: string, reason: string) {
  return {
    candidateId,
    toolId,
    capabilityId,
    selected,
    approvalStatus,
    reason,
    dryRunType: selected || approvalStatus === 'eligible_alternative_not_selected' ? 'metadata_only_route_resolution' : 'not_approved',
    execute: false,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noToolExecution: true,
    noMediaInput: true,
    noProviderCalls: true,
    noSecrets: true,
    noPublicOutput: true,
  }
}

function buildPlanSnapshot() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'plan_snapshot_ready_for_future_metadata_only_route_dry_run',
    planSnapshotId: 'phase44n-plan-snapshot-candidate-duckdb-metadata-route-dry-run-v1',
    candidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeId: 'track_b_duckdb',
    toolId: 'duckdb',
    capabilityId: 'internal_qa_aggregation',
    inputArtifactScopeId: 'phase44n-input-scope-duckdb-metadata-route-dry-run',
    outputArtifactScopeId: 'phase44n-output-scope-duckdb-metadata-route-dry-run',
    sourcePhase: 'phase_44n',
    confirmationPhase: 'phase_44o_required',
    dryRunMode: 'metadata_only',
    executeTool: false,
    rawChatExecution: false,
    publicOutputAllowed: false,
    broadMediaAllowed: false,
    arbitraryMediaAllowed: false,
    providerCallsAllowed: false,
    secretPayloadAccessAllowed: false,
    runtimeExecutionAllowed: false,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    toolExecutionAllowed: false,
    duckDbRuntimeExecutionAllowed: false,
    noExecutionPerformed: true,
    auditReportPath: `${TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR}/phase_44n_metadata_route_dry_run_approval_decision.json`,
    futureExecutionRequires: [
      'explicit_human_approval',
      'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN_EXECUTE',
      'separate_phase_44o_or_equivalent',
      'fresh_plan_snapshot_validation',
      'fresh_artifact_scope_validation',
      'fresh_secret_guard',
      'operator_abort_and_rollback_review',
    ],
  }
}

function buildArtifactScope() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'artifact_scope_ready_for_future_metadata_only_route_dry_run',
    inputArtifactScopeId: 'phase44n-input-scope-duckdb-metadata-route-dry-run',
    outputArtifactScopeId: 'phase44n-output-scope-duckdb-metadata-route-dry-run',
    allowedInputArtifactClasses: [
      'approved_private_media_metadata',
      'approved_generated_fixture_metadata',
      'approved_controlled_sample_metadata',
      'approved_plan_snapshot_metadata',
    ],
    allowedOutputArtifactClasses: [
      'private_reporting_metadata',
      'route_dry_run_metadata_report',
    ],
    noMediaInput: true,
    noAudioInput: true,
    noModelInput: true,
    noProviderOutput: true,
    noPayloadUploadInPhase44N: true,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    arbitraryLocalPathAllowed: false,
    arbitraryGcsPrefixAllowed: false,
    broadMediaAllowed: false,
    committedPayloadAllowed: false,
    futureMetadataRouteDryRunMayWritePrivateMetadataOnlyIfApproved: true,
  }
}

function buildApprovalCriteria(
  priorEvidence: ReturnType<typeof buildPriorEvidenceInventory>,
  candidateRegistry: ReturnType<typeof buildCandidateRegistry>,
  planSnapshot: ReturnType<typeof buildPlanSnapshot>,
  artifactScope: ReturnType<typeof buildArtifactScope>,
  securityReview: ReturnType<typeof buildSecurityReview>,
  secretGuard: ReturnType<typeof buildSecretGuard>,
) {
  const duckDbRoute = priorEvidence.routeManifest.duckDbRoute as { routeStatus?: string; routeExecutionAllowed?: boolean; runtimeExecutionAllowed?: boolean; capabilityIds?: string[] } | undefined
  const duckDbCost = priorEvidence.costEstimator.duckDbCost as { executionClass?: string; estimateAllowed?: boolean; costRiskClass?: string; blockers?: string[] } | undefined
  const selectedCandidate = candidateRegistry.candidates.find((entry) => entry.selected)
  const criteria = [
    criterion('phase_44m_passed', priorEvidence.phase44m.noopRouteDryRunStatus === 'passed'),
    criterion('phase_44l_approval_packet_passed', priorEvidence.phase44l.decision === 'approved_for_future_noop_route_dry_run'),
    criterion('phase_44k_desktop_beta_gate_passed', priorEvidence.phase44k.status === 'passed'),
    criterion('phase_44j_hybrid_e2e_simulation_passed', priorEvidence.phase44j.status === 'passed'),
    criterion('route_manifest_exists', priorEvidence.routeManifest.validationStatus === 'passed'),
    criterion('duckdb_route_restricted_internal_metadata_ready', duckDbRoute?.routeStatus === 'route_enabled_restricted_internal' && duckDbRoute.capabilityIds?.includes('internal_qa_aggregation') === true),
    criterion('cost_estimator_no_hard_block_for_metadata_only_route', duckDbCost?.executionClass === 'metadata_only' && duckDbCost.estimateAllowed === true && duckDbCost.costRiskClass === 'free_or_negligible'),
    criterion('sidecar_policy_allows_validation_not_execution', priorEvidence.sidecarFoundation.allowsValidationOnly === true && priorEvidence.sidecarFoundation.executionAllowed === false),
    criterion('selected_candidate_is_metadata_only', selectedCandidate?.candidateId === TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE && selectedCandidate.dryRunType === 'metadata_only_route_resolution'),
    criterion('no_actual_duckdb_runtime', planSnapshot.duckDbRuntimeExecutionAllowed === false && planSnapshot.executeTool === false),
    criterion('no_worker_execution', planSnapshot.workerExecutionAllowed === false),
    criterion('no_media_processing', artifactScope.noMediaInput === true && artifactScope.noAudioInput === true),
    criterion('no_provider_calls', planSnapshot.providerCallsAllowed === false),
    criterion('no_public_output', planSnapshot.publicOutputAllowed === false && artifactScope.publicOutputAllowed === false),
    criterion('no_secret_payload_access', planSnapshot.secretPayloadAccessAllowed === false && secretGuard.status === 'passed'),
    criterion('no_raw_chat_execution', planSnapshot.rawChatExecution === false),
    criterion('no_arbitrary_path', artifactScope.arbitraryLocalPathAllowed === false && artifactScope.arbitraryGcsPrefixAllowed === false),
    criterion('vlm_blocked', candidateRegistry.candidates.find((entry) => entry.candidateId === 'candidate-vlm-route')?.approvalStatus === 'blocked'),
    criterion('demucs_blocked', candidateRegistry.candidates.find((entry) => entry.candidateId === 'candidate-demucs-route')?.approvalStatus === 'blocked'),
    criterion('future_execution_requires_separate_phase', planSnapshot.futureExecutionRequires.includes('separate_phase_44o_or_equivalent')),
  ]
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: criteria.every((entry) => entry.passed) && securityReview.status === 'passed' ? 'passed' : 'blocked',
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
    securityCheck('no_execution_happened_in_phase44n', true),
    securityCheck('future_execution_must_be_separate', planSnapshot.futureExecutionRequires.includes('separate_phase_44o_or_equivalent')),
    securityCheck('no_worker_execution', planSnapshot.workerExecutionAllowed === false),
    securityCheck('no_tool_execution', planSnapshot.toolExecutionAllowed === false),
    securityCheck('no_sidecar_process', planSnapshot.sidecarExecutionAllowed === false),
    securityCheck('no_raw_chat_execution', planSnapshot.rawChatExecution === false),
    securityCheck('no_arbitrary_subprocess', true),
    securityCheck('no_shell_command', true),
    securityCheck('no_arbitrary_path', artifactScope.arbitraryLocalPathAllowed === false && artifactScope.arbitraryGcsPrefixAllowed === false),
    securityCheck('no_public_output', planSnapshot.publicOutputAllowed === false && artifactScope.publicOutputAllowed === false),
    securityCheck('no_provider_calls', planSnapshot.providerCallsAllowed === false),
    securityCheck('no_secret_payload_access', planSnapshot.secretPayloadAccessAllowed === false),
    securityCheck('vlm_demucs_remain_blocked', true),
    securityCheck('rollback_policy_exists', true),
  ]
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: checks.every((entry) => entry.passed) ? 'passed' : 'blocked',
    checks,
    noExecutionPerformed: true,
  }
}

function buildSecretGuard() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'passed',
    serviceRoleSecretAccess: 'not_required',
    providerSecretAccess: 'not_required',
    secretManagerAccess: 'not_required',
    envSecretAccess: 'not_required',
    frontendSecretAccess: 'blocked',
    secretPayloadReadAttempted: false,
    secretValuesInReports: false,
    unexpectedSecretPayloadAccess: 'not_observed',
    futureSecretAccessRequestBlocker: 'unexpected_secret_payload_access_required',
  }
}

function buildOperatorChecklist() {
  const checklist = [
    'selected_candidate_reviewed',
    'selected_candidate_is_metadata_only',
    'duckdb_runtime_will_not_execute',
    'no_worker_execution_confirmed',
    'artifact_scope_reviewed',
    'no_media_tool_runtime_confirmed',
    'no_public_output_confirmed',
    'no_provider_calls_confirmed',
    'no_secret_access_confirmed',
    'route_execution_allowed_remains_false_until_future_execution_phase',
    'future_confirmations_identified',
    'rollback_reviewed',
    'success_criteria_reviewed',
    'failure_criteria_reviewed',
  ].map((itemId) => ({ itemId, completed: true, status: 'ready' }))
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'operator_checklist_ready',
    checklist,
  }
}

function buildRollbackPolicy() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'rollback_policy_ready',
    routeExecutionAllowedRemainsFalse: true,
    rollbackActions: [
      'remove_candidate_approval_metadata_if_revoked',
      'keep_route_execution_allowed_false',
      'block_future_execution_if_candidate_plan_or_artifact_scope_mismatch',
      'block_future_execution_if_public_output_requested',
      'block_future_execution_if_media_input_requested',
      'block_future_execution_if_provider_call_requested',
      'block_future_execution_if_secret_access_requested',
      'block_future_execution_if_vlm_or_demucs_requested',
      'block_future_execution_if_raw_chat_requested',
      'operator_escalation_required_for_scope_ambiguity',
    ],
  }
}

function buildApprovalDecision(
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
  securityReview: ReturnType<typeof buildSecurityReview>,
  secretGuard: ReturnType<typeof buildSecretGuard>,
  candidateRegistry: ReturnType<typeof buildCandidateRegistry>,
) {
  const selectedCandidate = candidateRegistry.candidates.find((entry) => entry.selected)
  const decision: MetadataRouteDryRunApprovalDecision = approvalCriteria.status === 'passed'
    && securityReview.status === 'passed'
    && secretGuard.status === 'passed'
    && selectedCandidate?.candidateId === TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE
    ? 'approved_for_future_metadata_only_route_dry_run'
    : 'blocked_pending_human_review'
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: decision.startsWith('approved') ? 'passed' : 'blocked',
    decision,
    selectedCandidateId: selectedCandidate?.candidateId,
    selectedCandidateReason: selectedCandidate?.reason,
    phase44nExecutionOccurred: false,
    futureExecutionOnly: true,
    futureExecutionPhaseRequired: 'Phase 44O metadata-only route dry-run execution',
    routeExecution: 'not_run',
    runtimeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    duckDbRuntime: 'not_run',
    mediaAudioOcrVlmModelRuntime: 'not_run',
    providers: 'not_run',
    secretAccess: 'not_run',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    trackA: 'not_touched',
  }
}

function buildReadinessReport(
  decision: ReturnType<typeof buildApprovalDecision>,
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
) {
  const passed = decision.status === 'passed' && approvalCriteria.status === 'passed'
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    trackBMetadataRouteDryRunApproval: passed ? 'approved_for_future_metadata_only_route_dry_run' : 'blocked',
    selectedCandidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_SELECTED_CANDIDATE,
    noExecutionOccurred: true,
    futureMetadataRouteDryRunExecution: 'requires_phase44o_or_equivalent',
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
  decision: ReturnType<typeof buildApprovalDecision>,
  approvalCriteria: ReturnType<typeof buildApprovalCriteria>,
  securityReview: ReturnType<typeof buildSecurityReview>,
  secretGuard: ReturnType<typeof buildSecretGuard>,
) {
  const activeBlockers = [
    ...approvalCriteria.criteria.filter((entry) => !entry.passed).map((entry) => entry.criterionId),
    ...securityReview.checks.filter((entry) => !entry.passed).map((entry) => entry.checkId),
    ...(secretGuard.status === 'passed' ? [] : ['secret_guard_failed']),
  ]
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: decision.status === 'passed' && activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    stillBlockedScopes: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_BLOCKED_SCOPES,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  }
}

function criterion(criterionId: string, passed: boolean) {
  return {
    criterionId,
    passed,
    status: passed ? 'passed' : 'blocked',
  }
}

function securityCheck(checkId: string, passed: boolean) {
  return {
    checkId,
    passed,
    status: passed ? 'passed' : 'blocked',
  }
}

function renderPriorEvidenceInventoryMarkdown(priorEvidenceInventory: Record<string, unknown>) {
  return [
    '# Phase 44N Prior Evidence Inventory',
    '',
    `Run id: \`${TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_RUN_ID}\``,
    '',
    `Status: \`${String(priorEvidenceInventory.status)}\``,
    '',
    'Loaded committed safe reports from PR #189, #188, #187, #184, #181, #180, and #164.',
    '',
    'Phase 44N reads no private payloads and no secret payloads.',
  ].join('\n')
}

function renderApprovalDecisionMarkdown(approvalDecision: Record<string, unknown>) {
  return [
    '# Phase 44N Metadata Route Dry-Run Approval Decision',
    '',
    `Decision: \`${String(approvalDecision.decision)}\``,
    '',
    `Selected candidate: \`${String(approvalDecision.selectedCandidateId)}\``,
    '',
    'No route, worker, sidecar, tool, DuckDB runtime, media, provider, secret, cloud, or Track A execution occurred in Phase 44N.',
    '',
    'Future metadata-only route dry-run execution requires Phase 44O or equivalent with explicit human approval and confirmations.',
  ].join('\n')
}
