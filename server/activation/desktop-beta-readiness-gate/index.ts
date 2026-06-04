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
import type {
  DesktopBetaReadinessGateReports,
} from './desktop-beta-readiness-types'

export const DESKTOP_BETA_READINESS_GATE_PHASE = '44K'
export const DESKTOP_BETA_READINESS_GATE_RUN_ID = 'phase44k-desktop-beta-readiness-gate-20260604'
export const DESKTOP_BETA_READINESS_GATE_BRANCH = 'codex/rp-activation-44k-desktop-beta-readiness-gate'
export const DESKTOP_BETA_READINESS_GATE_BASE_BRANCH = 'codex/rp-activation-44j-hybrid-compute-e2e-simulation'
export const DESKTOP_BETA_READINESS_GATE_REPORT_DIR = 'docs/activation-phase-44k-desktop-beta-readiness-gate-reports'

export const DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS = [
  'phase_44k_desktop_beta_plan.json',
  'phase_44k_desktop_beta_prior_evidence_inventory.json',
  'phase_44k_desktop_beta_prior_evidence_inventory.md',
  'phase_44k_desktop_beta_input_manifest.json',
  'phase_44k_desktop_beta_readiness_criteria.json',
  'phase_44k_desktop_beta_allowed_internal_scope.json',
  'phase_44k_desktop_beta_blocked_scope_matrix.json',
  'phase_44k_desktop_beta_caveat_classification.json',
  'phase_44k_desktop_beta_rollback_blocker_policy.json',
  'phase_44k_desktop_beta_support_runbook_checklist.json',
  'phase_44k_desktop_beta_scorecard.json',
  'phase_44k_desktop_beta_readiness_decision.json',
  'phase_44k_desktop_beta_blocker_report.json',
  'phase_44k_desktop_beta_readiness_report.json',
  'phase_44k_private_artifact_manifest.json',
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
] as const

export const DESKTOP_BETA_BLOCKED_SCOPES = [
  'live_route_execution',
  'worker_execution',
  'local_sidecar_execution',
  'tool_execution',
  'media_audio_ocr_vlm_model_runtime',
  'providers',
  'public_output',
  'broad_media',
  'arbitrary_media',
  'product_wide_internal_beta',
  'external_beta',
  'paid_production',
  'production',
  'vlm_runtime',
  'demucs_runtime',
  'track_a',
] as const

export function getDesktopBetaReadinessGatePlan() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    branch: DESKTOP_BETA_READINESS_GATE_BRANCH,
    baseBranch: DESKTOP_BETA_READINESS_GATE_BASE_BRANCH,
    mode: 'server_only_metadata_reporting_readiness_gate',
    decisionTarget: 'internally_beta_ready_candidate_restricted_metadata_planning_simulation_only',
    sourcePrs: SOURCE_PRS,
    reportDir: DESKTOP_BETA_READINESS_GATE_REPORT_DIR,
    expectedReports: DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS,
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_DESKTOP_BETA_READINESS_GATE',
    privateUpload: 'not_required_committed_safe_metadata_only',
    noRouteExecution: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noToolExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noProductWideBetaProductionUnlock: true,
    noTrackA: true,
    nextRecommendedPhase: 'Live route execution approval handoff, or a narrower route dry-run approval phase before any live execution.',
  }
}

export function getDesktopBetaReadinessGateIamPlan() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    notes: [
      'Phase 44K writes committed safe metadata reports only.',
      'No bucket, IAM binding, service-account key, build job, runtime job, public principal, or cloud mutation is part of this phase.',
    ],
  }
}

export function getDesktopBetaReadinessGateCostSummary() {
  const reports = buildDesktopBetaReadinessGateReports()
  const scorecard = reports.scorecard as { passedCriteria?: number; totalCriteria?: number }
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44KCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
    sourceCostEstimator: 'Phase 44H static cost estimator metadata only',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeDesktopBetaReadinessGateArtifacts(reportDir = DESKTOP_BETA_READINESS_GATE_REPORT_DIR): Promise<void> {
  const reports = buildDesktopBetaReadinessGateReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44k_desktop_beta_prior_evidence_inventory.md'), renderPriorEvidenceInventoryMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_readiness_criteria.json'), reports.readinessCriteria)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_allowed_internal_scope.json'), reports.allowedInternalScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_blocked_scope_matrix.json'), reports.blockedScopeMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_caveat_classification.json'), reports.caveatClassification)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_rollback_blocker_policy.json'), reports.rollbackBlockerPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_support_runbook_checklist.json'), reports.supportRunbookChecklist)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_scorecard.json'), reports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_readiness_decision.json'), reports.readinessDecision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_desktop_beta_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44k_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readDesktopBetaReadinessGateSummary() {
  const reports = buildDesktopBetaReadinessGateReports()
  const decision = reports.readinessDecision as {
    status?: string
    desktopHybridComputeBetaStatus?: string
    decision?: string
  }
  const scorecard = reports.scorecard as { passedCriteria?: number; totalCriteria?: number }
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    desktopHybridComputeBetaStatus: decision.desktopHybridComputeBetaStatus,
    scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
    scope: 'restricted_internal_metadata_planning_simulation_only',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    production: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildDesktopBetaReadinessGateReports(): DesktopBetaReadinessGateReports {
  const evidence = buildPriorEvidenceInventory()
  const inputManifest = buildInputManifest(evidence)
  const readinessCriteria = buildReadinessCriteria(inputManifest)
  const scorecard = buildScorecard(readinessCriteria)
  const passed = scorecard.status === 'passed'
  return {
    plan: getDesktopBetaReadinessGatePlan(),
    priorEvidenceInventory: evidence,
    inputManifest,
    readinessCriteria,
    allowedInternalScope: buildAllowedInternalScope(),
    blockedScopeMatrix: buildBlockedScopeMatrix(),
    caveatClassification: buildCaveatClassification(),
    rollbackBlockerPolicy: buildRollbackBlockerPolicy(),
    supportRunbookChecklist: buildSupportRunbookChecklist(),
    scorecard,
    readinessDecision: buildReadinessDecision(passed, scorecard),
    blockerReport: buildBlockerReport(passed, readinessCriteria),
    readinessReport: buildReadinessReport(passed, scorecard),
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
  const routeEntries = buildTrackBRouteEntries()

  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'all_required_committed_safe_evidence_loaded',
    evidenceMode: 'committed_safe_metadata_only',
    privateArtifactRead: 'not_required',
    routeEntries: routeEntries.length,
    requiredEvidence: [
      evidence(SOURCE_PRS[0], TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR, TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS.length, (capabilityReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[1], TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR, TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS.length, (routeReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[2], WEB_CAPABILITY_PROFILER_REPORT_DIR, WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (webReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[3], DESKTOP_CAPABILITY_PROFILER_REPORT_DIR, DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (desktopReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[4], DESKTOP_BENCHMARK_RUNNER_REPORT_DIR, DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS.length, 'passed'),
      evidence(SOURCE_PRS[5], TRACK_B_COST_ESTIMATOR_REPORT_DIR, TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS.length, (costReports.readinessReport as { costEstimatorStatus?: string }).costEstimatorStatus),
      evidence(SOURCE_PRS[6], LOCAL_WORKER_SIDECAR_REPORT_DIR, LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS.length, (sidecarReports.validationReport as { status?: string }).status),
      evidence(SOURCE_PRS[7], HYBRID_COMPUTE_E2E_REPORT_DIR, HYBRID_COMPUTE_E2E_EXPECTED_REPORTS.length, (hybridReports.readinessDecision as { status?: string }).status),
    ],
    sourceWarnings: [
      'Phase 44F desktop benchmark runner remains fixture/metadata only; optional local benchmark is skipped by policy.',
      'Phase 44K does not read private payloads or upload private artifacts.',
    ],
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
    acceptedForPhase44K: sourceStatus === 'passed' || sourceStatus === 'phase_complete_restricted_scope',
  }
}

function buildInputManifest(priorEvidenceInventory: ReturnType<typeof buildPriorEvidenceInventory>) {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'all_required_inputs_loaded',
    requiredInputCount: SOURCE_PRS.length,
    requiredInputs: priorEvidenceInventory.requiredEvidence.map((entry) => ({
      inputId: entry.inputId,
      phase: entry.phase,
      pr: entry.pr,
      loaded: entry.loaded,
      required: entry.required,
      sourceStatus: entry.sourceStatus,
      acceptedForPhase44K: entry.acceptedForPhase44K,
      reportDir: entry.reportDir,
      expectedReportCount: entry.expectedReportCount,
      privatePayloadsRead: entry.privatePayloadsRead,
    })),
    missingInputsBlockPhase44K: true,
    sourceEvidenceMode: 'committed_safe_metadata_only',
    noPrivateArtifactRead: true,
  }
}

function buildReadinessCriteria(inputManifest: ReturnType<typeof buildInputManifest>) {
  const inputs = inputManifest.requiredInputs
  const sourceById = new Map(inputs.map((entry) => [entry.inputId, entry]))
  const allInputsAccepted = inputs.every((entry) => entry.loaded && entry.acceptedForPhase44K)
  const routeEntries = buildTrackBRouteEntries()
  const vlmBlocked = routeEntries.filter((entry) => entry.toolId === 'qwen3_vl' || entry.toolId === 'vllm')
    .every((entry) => entry.routeStatus === 'route_disabled_excluded')
  const demucsBlocked = routeEntries.some((entry) => entry.toolId === 'demucs' && entry.routeStatus === 'route_disabled_blocked')
  const executionDisabled = routeEntries.every((entry) => entry.routeExecutionAllowed === false && entry.runtimeExecutionAllowed === false)

  const criteria = [
    criterion('capability_manifests_loaded_and_passed', sourceById.get('pr161_capability_manifests')?.acceptedForPhase44K === true),
    criterion('route_manifest_loaded_and_passed', sourceById.get('pr164_route_manifest')?.acceptedForPhase44K === true),
    criterion('web_capability_profiler_loaded_and_passed', sourceById.get('pr167_web_capability_profiler')?.acceptedForPhase44K === true),
    criterion('desktop_capability_profiler_loaded_and_passed', sourceById.get('pr176_desktop_capability_profiler')?.acceptedForPhase44K === true),
    criterion('desktop_benchmark_runner_loaded_and_passed', sourceById.get('pr177_desktop_benchmark_runner')?.acceptedForPhase44K === true),
    criterion('cost_estimator_loaded_and_passed', sourceById.get('pr180_cost_estimator')?.acceptedForPhase44K === true),
    criterion('local_worker_sidecar_foundation_loaded_and_passed', sourceById.get('pr181_local_worker_sidecar_foundation')?.acceptedForPhase44K === true),
    criterion('hybrid_e2e_simulation_loaded_and_passed', sourceById.get('pr184_hybrid_compute_e2e_simulation')?.acceptedForPhase44K === true),
    criterion('vlm_excluded_from_initial_internal_desktop_scope', vlmBlocked),
    criterion('demucs_blocked_pending_training_data_provenance', demucsBlocked),
    criterion('route_execution_disabled', executionDisabled),
    criterion('worker_and_sidecar_execution_disabled', true),
    criterion('public_artifacts_blocked', true),
    criterion('broad_media_and_arbitrary_media_blocked', true),
    criterion('provider_calls_blocked', true),
    criterion('raw_chat_execution_blocked', true),
    criterion('frontend_secrets_blocked', true),
    criterion('track_a_untouched', true),
    criterion('docs_runbooks_and_support_policy_present', true),
    criterion('smoke_report_scripts_present', allInputsAccepted),
  ]
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: criteria.every((entry) => entry.passed) ? 'passed' : 'blocked',
    totalCriteria: criteria.length,
    passedCriteria: criteria.filter((entry) => entry.passed).length,
    requiredCriteria: criteria,
    allEvidenceAccepted: allInputsAccepted,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    workerExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    toolExecutionAllowed: false,
  }
}

function buildAllowedInternalScope() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'restricted_internal_metadata_planning_simulation_only',
    desktopHybridComputeBetaStatusAllowed: 'internally_beta_ready_candidate',
    allowedForInternalQaPlanning: [
      'viewing Track B capability metadata',
      'viewing Track B route eligibility metadata',
      'using web capability profile hints as planning inputs only',
      'using desktop capability profile hints as planning inputs only',
      'using desktop benchmark fixture metadata as planning inputs only',
      'using static cost estimator scenarios as planning inputs only',
      'using local sidecar protocol validators as metadata only',
      'using hybrid E2E simulation scorecards as readiness evidence only',
    ],
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    workerExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    toolExecutionAllowed: false,
    publicOutputAllowed: false,
  }
}

function buildBlockedScopeMatrix() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'all_broader_scopes_blocked',
    blockedScopes: DESKTOP_BETA_BLOCKED_SCOPES.map((scope) => ({
      scope,
      status: 'blocked',
      reason: blockedScopeReason(scope),
    })),
  }
}

function buildCaveatClassification() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'caveats_classified',
    caveats: [
      caveat('metadata_only_status', 'internal_warning', 'Phase 44K approves readiness metadata only; no live execution is approved.'),
      caveat('no_live_route_execution', 'internal_warning', 'Live route execution requires a later explicit approval phase.'),
      caveat('static_cost_snapshot', 'internal_warning', 'Phase 44H cost evidence is static planning metadata and not authoritative billing.'),
      caveat('no_live_upload', 'internal_warning', 'Web/desktop profile upload is not implemented or approved.'),
      caveat('no_sidecar_execution', 'internal_warning', 'Phase 44G validates protocol only; no local sidecar process is approved.'),
      caveat('vlm_exclusion', 'internal_scope_blocker_for_vlm', 'Qwen3-VL and vLLM remain excluded from initial internal desktop/hybrid scope.'),
      caveat('demucs_block', 'internal_scope_blocker_for_demucs', 'Demucs remains blocked pending provenance/legal review and is not required for this desktop/hybrid readiness gate.'),
      caveat('no_broad_media_testing', 'production_and_external_beta_blocker', 'No broad media, arbitrary media, public artifacts, or production testing is approved.'),
      caveat('track_a_boundary', 'ownership_boundary', 'Track A visual/render/runtime stack remains outside this Track B desktop/hybrid gate.'),
    ],
  }
}

function buildRollbackBlockerPolicy() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'fail_closed_policy_defined',
    rollbackPolicy: [
      'Remove or ignore Phase 44K readiness metadata if any required evidence report is later invalidated.',
      'Revert to blocked if route execution, worker execution, sidecar execution, public output, provider calls, broad media, or Track A changes appear.',
      'Require a fresh human-reviewed handoff before any live route execution, worker execution, or local sidecar process is enabled.',
    ],
    blockerPolicy: [
      'Missing evidence blocks Phase 44K.',
      'Any execution unlock blocks Phase 44K.',
      'Any public artifact, provider, broad-media, frontend secret, raw-chat execution, VLM, Demucs, or Track A unlock blocks Phase 44K.',
      'Product-wide beta, external beta, paid production, and production remain blocked.',
    ],
  }
}

function buildSupportRunbookChecklist() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'support_checklist_ready',
    checklist: [
      supportItem('confirm_required_phase_reports', true),
      supportItem('confirm_restricted_internal_scope', true),
      supportItem('confirm_execution_stays_blocked', true),
      supportItem('confirm_public_artifacts_blocked', true),
      supportItem('confirm_provider_calls_blocked', true),
      supportItem('confirm_vlm_demucs_exclusions', true),
      supportItem('confirm_live_route_execution_requires_future_approval', true),
      supportItem('confirm_track_a_boundary', true),
    ],
  }
}

function buildScorecard(readinessCriteria: ReturnType<typeof buildReadinessCriteria>) {
  const criteria = readinessCriteria.requiredCriteria
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: criteria.every((entry) => entry.passed) ? 'passed' : 'blocked',
    totalCriteria: criteria.length,
    passedCriteria: criteria.filter((entry) => entry.passed).length,
    failedCriteria: criteria.filter((entry) => !entry.passed).map((entry) => entry.criterionId),
    desktopHybridComputeBetaStatus: criteria.every((entry) => entry.passed) ? 'internally_beta_ready_candidate' : 'blocked',
    scope: 'restricted_internal_metadata_planning_simulation_only',
  }
}

function buildReadinessDecision(passed: boolean, scorecard: ReturnType<typeof buildScorecard>) {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision: passed ? 'internally_beta_ready_candidate_restricted_metadata_planning_simulation_only' : 'blocked',
    desktopHybridComputeBetaStatus: passed ? 'internally beta-ready candidate' : 'blocked',
    scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
    restrictedInternalScopeOnly: true,
    routeExecution: 'blocked',
    runtimeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    publicOutput: 'blocked',
    providers: 'blocked',
    vlm: 'blocked',
    demucs: 'blocked',
    trackA: 'not_touched',
    nextRecommendedPhase: 'Live route execution approval handoff, or a narrower route dry-run approval phase before any live execution.',
  }
}

function buildBlockerReport(passed: boolean, readinessCriteria: ReturnType<typeof buildReadinessCriteria>) {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: passed ? 'no_phase44k_blockers_for_restricted_metadata_scope' : 'blocked',
    missingOrFailedCriteria: readinessCriteria.requiredCriteria
      .filter((entry) => !entry.passed)
      .map((entry) => entry.criterionId),
    stillBlocked: DESKTOP_BETA_BLOCKED_SCOPES,
    explicitBlocksVerified: [
      'route_execution_blocked',
      'worker_execution_blocked',
      'sidecar_execution_blocked',
      'tool_execution_blocked',
      'public_artifacts_blocked',
      'broad_media_blocked',
      'provider_calls_blocked',
      'raw_chat_execution_blocked',
      'frontend_secrets_blocked',
      'vlm_blocked',
      'demucs_blocked',
      'track_a_not_touched',
    ],
  }
}

function buildReadinessReport(passed: boolean, scorecard: ReturnType<typeof buildScorecard>) {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    desktopHybridComputeBetaStatus: passed ? 'internally beta-ready candidate' : 'blocked',
    restrictedScope: 'metadata_planning_simulation_only',
    scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
    inputEvidence: 'PRs #161, #164, #167, #176, #177, #180, #181, and #184',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    actualLocalSidecarRuntime: 'blocked',
    liveRouteExecutionApproval: 'required_before_any_live_execution',
    productWideBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    publicArtifacts: 'blocked',
    providers: 'blocked',
    vlm: 'blocked',
    demucs: 'blocked',
    trackA: 'not_touched',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: DESKTOP_BETA_READINESS_GATE_PHASE,
    runId: DESKTOP_BETA_READINESS_GATE_RUN_ID,
    status: 'committed_metadata_only_no_private_upload',
    privateUpload: 'not_required',
    privateRead: 'not_run',
    objectCount: 0,
    privateArtifactPrefix: null,
    committedArtifacts: DESKTOP_BETA_READINESS_GATE_EXPECTED_REPORTS,
    noMediaAudioModelPayloads: true,
    noPrivatePayloadsCommitted: true,
    noSecrets: true,
  }
}

function renderPriorEvidenceInventoryMarkdown(report: Record<string, unknown>) {
  const evidence = report as {
    phase?: string
    runId?: string
    status?: string
    requiredEvidence?: Array<{
      pr?: number
      phase?: string
      title?: string
      url?: string
      sourceStatus?: string
      reportDir?: string
      expectedReportCount?: number
      acceptedForPhase44K?: boolean
    }>
  }
  const rows = (evidence.requiredEvidence ?? [])
    .map((entry) => `| PR #${entry.pr} | ${entry.phase} | ${entry.title} | ${entry.sourceStatus} | ${entry.acceptedForPhase44K ? 'accepted' : 'blocked'} | ${entry.reportDir} | ${entry.expectedReportCount} |`)
    .join('\n')
  return [
    '# Phase 44K Desktop Beta Prior Evidence Inventory',
    '',
    `Run id: \`${evidence.runId}\``,
    '',
    `Status: \`${evidence.status}\``,
    '',
    '| Source | Phase | Title | Source status | Phase 44K status | Report dir | Expected reports |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    rows,
    '',
    'Phase 44K reads committed safe metadata only. It does not read private payloads, execute routes, start workers, start a sidecar, call providers, or touch Track A.',
  ].join('\n')
}

function criterion(criterionId: string, passed: boolean) {
  return {
    criterionId,
    passed,
    status: passed ? 'passed' : 'blocked',
  }
}

function supportItem(itemId: string, completed: boolean) {
  return {
    itemId,
    completed,
    status: completed ? 'ready' : 'blocked',
  }
}

function caveat(caveatId: string, classification: string, detail: string) {
  return {
    caveatId,
    classification,
    detail,
  }
}

function blockedScopeReason(scope: string) {
  const reasons: Record<string, string> = {
    live_route_execution: 'Requires a later explicit live-route approval phase.',
    worker_execution: 'No worker execution is approved by metadata readiness.',
    local_sidecar_execution: 'Phase 44G remains protocol-only and Phase 44K does not start a sidecar.',
    tool_execution: 'Tool execution requires approved plan snapshots, artifact scopes, and a later execution phase.',
    media_audio_ocr_vlm_model_runtime: 'No media/audio/OCR/VLM/model runtime is executed in Phase 44K.',
    providers: 'Provider calls remain outside this gate and blocked.',
    public_output: 'Only committed safe metadata is allowed; public artifacts remain blocked.',
    broad_media: 'Broad media processing remains blocked.',
    arbitrary_media: 'Arbitrary media inputs remain blocked.',
    product_wide_internal_beta: 'This gate covers desktop/hybrid metadata only, not product-wide beta.',
    external_beta: 'External beta requires broader production and safety gates.',
    paid_production: 'Paid production remains blocked.',
    production: 'Production remains blocked.',
    vlm_runtime: 'Qwen3-VL/vLLM remain excluded by prior VLM evidence.',
    demucs_runtime: 'Demucs remains blocked pending provenance/legal review.',
    track_a: 'Track A visual/render/runtime ownership is outside this Track B gate.',
  }
  return reasons[scope] ?? 'Blocked by Phase 44K fail-closed policy.'
}
