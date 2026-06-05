import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
  buildTrackBMetadataRouteDryRunApprovalReports,
} from '../track-b-metadata-route-dry-run-approval'
import {
  TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR,
  buildTrackBNoopRouteDryRunReports,
} from '../track-b-noop-route-dry-run'
import {
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
  DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
  buildDesktopBetaReadinessGateReports,
} from '../desktop-beta-readiness-gate'
import {
  HYBRID_COMPUTE_E2E_REPORT_DIR,
  buildHybridComputeE2EReports,
} from '../hybrid-compute-e2e-simulation'
import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
  TRACK_B_METADATA_ROUTE_DRY_RUN_SCHEMA_VERSION,
  buildMetadataRouteAuditReport,
  buildMetadataRouteSecretPayloadGuard,
  executeMetadataRouteDryRun,
  resolveMetadataRouteDryRun,
  runMetadataRouteFailureFixtures,
  validateMetadataRouteArtifactScope,
  validateMetadataRouteCostGuard,
  validateMetadataRoutePlanSnapshot,
  validateMetadataRouteResult,
  validateMetadataRouteSidecarPolicy,
  type MetadataRouteArtifactScope,
  type MetadataRoutePlanSnapshot,
} from '../../../src/lib/track-b/metadata-route-dry-run'
import type { TrackBMetadataRouteDryRunReports } from './metadata-route-dry-run-types'

export const TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE = '44O'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID = 'phase44o-metadata-route-dry-run-execution-20260605'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_BRANCH = 'codex/rp-activation-44o-metadata-route-dry-run-execution'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_BASE_BRANCH = 'codex/rp-activation-44n-metadata-route-dry-run-approval-packet'
export const TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR = 'docs/activation-phase-44o-metadata-route-dry-run-execution-reports'

export const TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS = [
  'phase_44o_metadata_route_dry_run_plan.json',
  'phase_44o_metadata_route_dry_run_prior_evidence_inventory.json',
  'phase_44o_metadata_route_dry_run_prior_evidence_inventory.md',
  'phase_44o_metadata_route_secret_payload_guard.json',
  'phase_44o_metadata_route_plan_snapshot_validation.json',
  'phase_44o_metadata_route_artifact_scope_validation.json',
  'phase_44o_metadata_route_resolution_report.json',
  'phase_44o_metadata_route_cost_guard_report.json',
  'phase_44o_metadata_route_sidecar_validation_report.json',
  'phase_44o_metadata_route_dry_run_execution_report.json',
  'phase_44o_metadata_route_dry_run_audit_report.json',
  'phase_44o_metadata_route_dry_run_failure_report.json',
  'phase_44o_metadata_route_dry_run_readiness_report.json',
  'phase_44o_metadata_route_dry_run_blocker_report.json',
  'phase_44o_private_artifact_manifest.json',
] as const

export const TRACK_B_METADATA_ROUTE_DRY_RUN_BLOCKED_SCOPES = [
  'future_real_tool_runtime_route_approval',
  'live_route_execution',
  'real_worker_execution',
  'local_sidecar_execution',
  'real_tool_execution',
  'duckdb_runtime_execution',
  'polars_runtime_execution',
  'media_processing',
  'audio_processing',
  'ocr_runtime',
  'vlm_runtime',
  'model_download_or_runtime',
  'provider_calls',
  'web_search_provider_calls',
  'secret_payload_access',
  'service_role_secret_access',
  'provider_secret_access',
  'secret_manager_access',
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
  { inputId: 'pr192_metadata_route_dry_run_approval', pr: 192, phase: '44N', title: 'Phase 44N metadata route dry-run approval packet', reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR },
  { inputId: 'pr189_noop_route_dry_run_execution', pr: 189, phase: '44M', title: 'Phase 44M no-op route dry-run execution', reportDir: TRACK_B_NOOP_ROUTE_DRY_RUN_REPORT_DIR },
  { inputId: 'pr188_route_dry_run_approval_packet', pr: 188, phase: '44L', title: 'Phase 44L route dry-run approval packet', reportDir: TRACK_B_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR },
  { inputId: 'pr187_desktop_beta_readiness_gate', pr: 187, phase: '44K', title: 'Phase 44K desktop beta readiness gate', reportDir: DESKTOP_BETA_READINESS_GATE_REPORT_DIR },
  { inputId: 'pr184_hybrid_compute_e2e_simulation', pr: 184, phase: '44J', title: 'Phase 44J hybrid compute E2E simulation', reportDir: HYBRID_COMPUTE_E2E_REPORT_DIR },
  { inputId: 'pr181_local_worker_sidecar_foundation', pr: 181, phase: '44G', title: 'Phase 44G local worker sidecar foundation', reportDir: LOCAL_WORKER_SIDECAR_REPORT_DIR },
  { inputId: 'pr180_track_b_cost_estimator', pr: 180, phase: '44H', title: 'Phase 44H Track B cost estimator', reportDir: TRACK_B_COST_ESTIMATOR_REPORT_DIR },
  { inputId: 'pr164_track_b_route_manifest', pr: 164, phase: '44I', title: 'Phase 44I Track B tool route manifest integration', reportDir: TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR },
] as const

export function getTrackBMetadataRouteDryRunPlan() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    branch: TRACK_B_METADATA_ROUTE_DRY_RUN_BRANCH,
    baseBranch: TRACK_B_METADATA_ROUTE_DRY_RUN_BASE_BRANCH,
    schemaVersion: TRACK_B_METADATA_ROUTE_DRY_RUN_SCHEMA_VERSION,
    mode: 'metadata_route_dry_run_metadata_only',
    sourceApprovalPr: 192,
    sourceApprovalReportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
    selectedCandidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
    requiredConfirmations: [
      'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN',
      'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN_EXECUTE',
    ],
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
      'REEDITPRO_CONFIRM_SERVICE_ROLE_SECRET_ACCESS',
      'REEDITPRO_CONFIRM_PROVIDER_SECRET_ACCESS',
      'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
      'REEDITPRO_CONFIRM_DUCKDB_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_POLARS_RUNTIME_EXECUTE',
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
    reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
    expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS,
    noSecretPayloadAccess: true,
    noLiveRouteExecution: true,
    noWorkerExecution: true,
    noToolExecution: true,
    noDuckDbRuntime: true,
    noSidecarProcess: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviderCalls: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    nextRecommendedPhase: 'separate tool-runtime route approval packet or product-level internal beta aggregation gate.',
  }
}

export function getTrackBMetadataRouteDryRunIamPlan() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    secretPayloadAccess: 'not_required',
    notes: [
      'Phase 44O reads committed safe metadata and writes committed safe reports only.',
      'No IAM binding, service-account key, Secret Manager read, Cloud Run, Cloud Build, Docker push, bucket, public principal, or GCP mutation is part of this metadata route dry-run.',
    ],
  }
}

export function getTrackBMetadataRouteDryRunCostSummary() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44OCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    cloudCalls: 'not_run',
    routeExecution: 'metadata_only_dry_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    duckDbRuntime: 'not_run',
    providerCalls: 'not_run',
    sourceCostEstimator: 'Phase 44H marks duckdb metadata-only route as free_or_negligible planning cost.',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeTrackBMetadataRouteDryRunArtifacts(reportDir = TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR): Promise<void> {
  const reports = buildTrackBMetadataRouteDryRunReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_prior_evidence_inventory.md'), renderPriorEvidenceInventoryMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_secret_payload_guard.json'), reports.secretPayloadGuard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_plan_snapshot_validation.json'), reports.planSnapshotValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_artifact_scope_validation.json'), reports.artifactScopeValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_resolution_report.json'), reports.routeResolutionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_cost_guard_report.json'), reports.costGuardReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_sidecar_validation_report.json'), reports.sidecarValidationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_execution_report.json'), reports.executionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_audit_report.json'), reports.auditReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_failure_report.json'), reports.failureReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_metadata_route_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44o_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readTrackBMetadataRouteDryRunSummary() {
  const reports = buildTrackBMetadataRouteDryRunReports()
  const executionReport = reports.executionReport
  const failureReport = reports.failureReport as { fixtureCount?: number; passedFixtures?: number }
  const readinessReport = reports.readinessReport as { trackBMetadataRouteDryRun?: string }
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: executionReport.metadataRouteDryRunStatus,
    trackBMetadataRouteDryRun: readinessReport.trackBMetadataRouteDryRun,
    selectedCandidate: TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
    planSnapshotValidation: reports.planSnapshotValidation.status,
    artifactScopeValidation: reports.artifactScopeValidation.status,
    secretPayloadGuard: reports.secretPayloadGuard.status,
    routeResolution: reports.routeResolutionReport.status,
    costGuard: reports.costGuardReport.status,
    sidecarValidation: reports.sidecarValidationReport.status,
    failureFixtures: `${failureReport.passedFixtures}/${failureReport.fixtureCount}`,
    duckDbRuntime: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    sidecarExecution: 'not_run',
    secretPayloadAccess: 'not_required',
    trackA: 'not_touched',
  }
}

export function buildTrackBMetadataRouteDryRunReports(): TrackBMetadataRouteDryRunReports {
  const phase44nReports = buildTrackBMetadataRouteDryRunApprovalReports()
  const priorEvidenceInventory = buildPriorEvidenceInventory(phase44nReports)
  const planSnapshot = normalizePlanSnapshot(phase44nReports.planSnapshot)
  const artifactScope = normalizeArtifactScope(phase44nReports.artifactScope)
  const secretPayloadGuard = buildMetadataRouteSecretPayloadGuard()
  const planSnapshotValidation = validateMetadataRoutePlanSnapshot(planSnapshot)
  const artifactScopeValidation = validateMetadataRouteArtifactScope(artifactScope)
  const routeResolutionReport = resolveMetadataRouteDryRun({
    routeEntry: priorEvidenceInventory.routeManifest.duckDbRoute,
    planSnapshotValidation,
    artifactScopeValidation,
  })
  const costGuardReport = validateMetadataRouteCostGuard({ costEntry: priorEvidenceInventory.costEstimator.duckDbCost })
  const sidecarValidationReport = validateMetadataRouteSidecarPolicy({
    planSnapshot,
    artifactScope,
    auditRef: `${TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR}/phase_44o_metadata_route_dry_run_audit_report.json`,
  })
  const executionReport = executeMetadataRouteDryRun({
    candidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
    planSnapshotValidation,
    artifactScopeValidation,
    secretPayloadGuard,
    routeResolutionReport,
    costGuardReport,
    sidecarValidationReport,
  })
  const auditReport = buildMetadataRouteAuditReport({
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    planSnapshot,
    artifactScope,
    planSnapshotValidation,
    artifactScopeValidation,
    secretPayloadGuard,
    routeResolutionReport,
    costGuardReport,
    sidecarValidationReport,
    executionReport,
  })
  const failureFixtureResults = runMetadataRouteFailureFixtures({ planSnapshot, artifactScope })
  const resultValidation = validateMetadataRouteResult({ executionReport, failureFixtureResults })
  const failureReport = buildFailureReport(failureFixtureResults)
  const readinessReport = buildReadinessReport(executionReport, resultValidation)
  const blockerReport = buildBlockerReport(executionReport, resultValidation)
  return {
    plan: getTrackBMetadataRouteDryRunPlan(),
    priorEvidenceInventory,
    secretPayloadGuard,
    planSnapshotValidation: {
      phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
      runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
      selectedCandidateId: planSnapshot.candidateId,
      planSnapshotId: planSnapshot.planSnapshotId,
      ...planSnapshotValidation,
      routeExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      workerExecutionAllowed: false,
      sidecarExecutionAllowed: false,
      toolExecutionAllowed: false,
      duckDbRuntimeExecutionAllowed: false,
    },
    artifactScopeValidation: {
      phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
      runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
      inputArtifactScopeId: artifactScope.inputArtifactScopeId,
      outputArtifactScopeId: artifactScope.outputArtifactScopeId,
      ...artifactScopeValidation,
      publicOutputAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      arbitraryPathAllowed: false,
      broadMediaAllowed: false,
    },
    routeResolutionReport,
    costGuardReport,
    sidecarValidationReport,
    executionReport,
    auditReport,
    failureReport,
    readinessReport,
    blockerReport,
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

function buildPriorEvidenceInventory(phase44nReports: ReturnType<typeof buildTrackBMetadataRouteDryRunApprovalReports>) {
  const phase44mReports = buildTrackBNoopRouteDryRunReports()
  const phase44lReports = buildTrackBRouteDryRunApprovalReports()
  const routeReports = buildTrackBToolRouteReports()
  const costReports = buildTrackBCostEstimatorReports()
  const sidecarReports = buildLocalWorkerSidecarReports()
  const hybridReports = buildHybridComputeE2EReports()
  const desktopReports = buildDesktopBetaReadinessGateReports()
  const routeEntries = buildTrackBRouteEntries()
  const duckDbRoute = routeEntries.find((entry) => entry.toolId === 'duckdb')
  const costToolMapping = costReports.toolMapping as { tools?: Array<{ toolId?: string; routeId?: string; capabilityId?: string; executionClass?: string; costRiskClass?: string; estimateAllowed?: boolean; blockers?: string[] }> }
  const duckDbCost = costToolMapping.tools?.find((entry) => entry.toolId === 'duckdb')
  const phase44nDecision = phase44nReports.approvalDecision as { decision?: string; status?: string }
  const phase44nCandidateRegistry = phase44nReports.candidateRegistry as { selectedCandidateId?: string }
  const phase44mExecution = phase44mReports.executionReport as { noopRouteDryRunStatus?: string; routeExecutionPerformed?: boolean; secretPayloadAccessPerformed?: boolean }
  const phase44lDecision = phase44lReports.approvalDecision as { decision?: string; status?: string }
  const routeValidation = routeReports.validationReport as { status?: string }
  const sidecarValidation = sidecarReports.validationReport as { status?: string }
  const hybridDecision = hybridReports.readinessDecision as { status?: string }
  const desktopDecision = desktopReports.readinessDecision as { status?: string; desktopHybridComputeBetaStatus?: string }
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: 'all_required_committed_safe_evidence_loaded',
    sourceEvidence: SOURCE_EVIDENCE.map((entry) => ({
      ...entry,
      loaded: true,
      required: true,
      privatePayloadsRead: false,
      secretPayloadsRead: false,
      acceptedForPhase44O: true,
    })),
    phase44n: {
      reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_APPROVAL_REPORT_DIR,
      selectedCandidateId: phase44nCandidateRegistry.selectedCandidateId,
      decision: phase44nDecision.decision,
      status: phase44nDecision.status,
    },
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

function normalizePlanSnapshot(planSnapshot: Record<string, unknown>): MetadataRoutePlanSnapshot {
  return planSnapshot as MetadataRoutePlanSnapshot
}

function normalizeArtifactScope(artifactScope: Record<string, unknown>): MetadataRouteArtifactScope {
  return artifactScope as MetadataRouteArtifactScope
}

function buildFailureReport(fixtureResults: ReturnType<typeof runMetadataRouteFailureFixtures>) {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: fixtureResults.every((result) => result.status === 'passed' && result.expectedBlockedReasonObserved) ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    passedFixtures: fixtureResults.filter((result) => result.status === 'passed' && result.expectedBlockedReasonObserved).length,
    failureFixtures: fixtureResults,
  }
}

function buildReadinessReport(
  executionReport: ReturnType<typeof executeMetadataRouteDryRun>,
  resultValidation: ReturnType<typeof validateMetadataRouteResult>,
) {
  const passed = executionReport.status === 'passed' && resultValidation.status === 'passed'
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    trackBMetadataRouteDryRun: passed ? 'phase_complete_restricted_scope' : 'blocked',
    selectedCandidateId: TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
    noSecretPayloadAccessRequired: true,
    duckDbRouteResolvedMetadataOnly: passed,
    duckDbRuntimeExecuted: false,
    realWorkerExecution: 'not_run',
    sidecarExecution: 'not_run',
    toolExecution: 'not_run',
    futureRealToolRuntimeRoute: 'requires_separate_approval_execution_phase',
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
  executionReport: ReturnType<typeof executeMetadataRouteDryRun>,
  resultValidation: ReturnType<typeof validateMetadataRouteResult>,
) {
  const activeBlockers = [...new Set([...executionReport.blockedReasons, ...resultValidation.blockedReasons])]
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers,
    stillBlockedScopes: TRACK_B_METADATA_ROUTE_DRY_RUN_BLOCKED_SCOPES,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: TRACK_B_METADATA_ROUTE_DRY_RUN_PHASE,
    runId: TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID,
    status: 'committed_safe_metadata_only',
    privateUploadRequired: false,
    privatePayloadsCommitted: false,
    secretPayloadsCommitted: false,
    reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
    expectedReports: TRACK_B_METADATA_ROUTE_DRY_RUN_EXPECTED_REPORTS,
  }
}

function renderPriorEvidenceInventoryMarkdown(priorEvidenceInventory: Record<string, unknown>) {
  return [
    '# Phase 44O Prior Evidence Inventory',
    '',
    `Run id: \`${TRACK_B_METADATA_ROUTE_DRY_RUN_RUN_ID}\``,
    '',
    `Status: \`${String(priorEvidenceInventory.status)}\``,
    '',
    'Loaded committed safe reports from PR #192, #189, #188, #187, #184, #181, #180, and #164.',
    '',
    'Phase 44O reads no private payloads and no secret payloads.',
  ].join('\n')
}
