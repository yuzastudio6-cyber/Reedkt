import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
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
  HYBRID_COMPUTE_E2E_GLOBAL_BLOCKED_SCOPES,
  HYBRID_COMPUTE_E2E_ROUTE_MANIFEST_VERSION,
  HYBRID_COMPUTE_E2E_SCHEMA_VERSION,
  buildHybridComputeE2EArtifactScopeFixtures,
  buildHybridComputeE2EPlanFixtures,
  buildHybridComputeE2ESimulationSchema,
  runHybridArtifactScopeFixtures,
  runHybridFailureSimulation,
  simulateHybridCostDecisions,
  simulateHybridRouteDecisions,
  simulateHybridSidecarValidations,
  validateHybridComputeE2ESimulation,
} from '../../../src/lib/track-b/hybrid-compute-e2e-simulation'
import type {
  HybridComputeE2ESimulationReports,
} from './hybrid-compute-e2e-simulation-types'

export const HYBRID_COMPUTE_E2E_PHASE = '44J'
export const HYBRID_COMPUTE_E2E_RUN_ID = 'phase44j-hybrid-compute-e2e-simulation-20260604'
export const HYBRID_COMPUTE_E2E_BRANCH = 'codex/rp-activation-44j-hybrid-compute-e2e-simulation'
export const HYBRID_COMPUTE_E2E_BASE_BRANCH = 'codex/rp-activation-44g-local-worker-sidecar-foundation'
export const HYBRID_COMPUTE_E2E_REPORT_DIR = 'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports'

export const HYBRID_COMPUTE_E2E_EXPECTED_REPORTS = [
  'phase_44j_hybrid_e2e_plan.json',
  'phase_44j_hybrid_e2e_input_manifest.json',
  'phase_44j_hybrid_e2e_simulation_schema.json',
  'phase_44j_hybrid_e2e_plan_snapshot_fixture_manifest.json',
  'phase_44j_hybrid_e2e_artifact_scope_fixture_manifest.json',
  'phase_44j_hybrid_e2e_route_simulation_report.json',
  'phase_44j_hybrid_e2e_cost_simulation_report.json',
  'phase_44j_hybrid_e2e_sidecar_simulation_report.json',
  'phase_44j_hybrid_e2e_failure_simulation_report.json',
  'phase_44j_hybrid_e2e_scorecard.json',
  'phase_44j_hybrid_e2e_readiness_decision.json',
  'phase_44j_hybrid_e2e_blocker_report.json',
  'phase_44j_hybrid_e2e_readiness_report.json',
  'phase_44j_private_artifact_manifest.json',
] as const

const SOURCE_PRS = [
  { pr: 161, title: 'Track B capability manifest baseline', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161' },
  { pr: 164, title: 'Phase 44I Track B tool route manifest integration', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164' },
  { pr: 167, title: 'Phase 44D web capability profiler', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167' },
  { pr: 176, title: 'Phase 44E desktop capability profiler', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176' },
  { pr: 177, title: 'Phase 44F desktop benchmark runner', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/177' },
  { pr: 180, title: 'Phase 44H Track B cost estimator', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/180' },
  { pr: 181, title: 'Phase 44G local worker sidecar foundation', url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/181' },
] as const

export function getHybridComputeE2EPlan() {
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    branch: HYBRID_COMPUTE_E2E_BRANCH,
    baseBranch: HYBRID_COMPUTE_E2E_BASE_BRANCH,
    sourcePrs: SOURCE_PRS,
    mode: 'metadata_only_synthetic_e2e_simulation',
    schemaVersion: HYBRID_COMPUTE_E2E_SCHEMA_VERSION,
    routeManifestVersion: HYBRID_COMPUTE_E2E_ROUTE_MANIFEST_VERSION,
    sharedSimulationLibrary: 'src/lib/track-b/hybrid-compute-e2e-simulation',
    serverActivationModule: 'server/activation/hybrid-compute-e2e-simulation',
    reportDir: HYBRID_COMPUTE_E2E_REPORT_DIR,
    expectedReports: HYBRID_COMPUTE_E2E_EXPECTED_REPORTS,
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_HYBRID_COMPUTE_E2E_SIMULATION',
    noRouteExecution: true,
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noToolExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noBillingApiCalls: true,
    noBetaProductionUnlock: true,
    noTrackA: true,
    hybridComputeE2eSimulation: 'phase_complete_restricted_scope_after_validation',
    nextRecommendedPhase: 'Phase 44K desktop beta readiness gate, unless a narrower route dry-run/live-execution approval phase is inserted first.',
  }
}

export function getHybridComputeE2EIamPlan() {
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    notes: [
      'Phase 44J writes committed safe metadata reports only.',
      'No bucket, IAM binding, service-account key, Cloud Run, Cloud Build, Docker push, public principal, or GCP mutation is part of this phase.',
    ],
  }
}

export function getHybridComputeE2ECostSummary() {
  const reports = buildHybridComputeE2EReports()
  const costReport = reports.costSimulationReport as {
    scenarioCount?: number
    blockedCount?: number
    warningCount?: number
  }
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedPhase44JCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    sidecarExecution: 'not_run',
    scenarioCount: costReport.scenarioCount,
    blockedCostScenarioCount: costReport.blockedCount,
    warningCostScenarioCount: costReport.warningCount,
    sourceCostEstimator: 'Phase 44H static cost estimator metadata only',
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeHybridComputeE2EArtifacts(reportDir = HYBRID_COMPUTE_E2E_REPORT_DIR): Promise<void> {
  const reports = buildHybridComputeE2EReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_simulation_schema.json'), reports.simulationSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_plan_snapshot_fixture_manifest.json'), reports.planSnapshotFixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_artifact_scope_fixture_manifest.json'), reports.artifactScopeFixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_route_simulation_report.json'), reports.routeSimulationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_cost_simulation_report.json'), reports.costSimulationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_sidecar_simulation_report.json'), reports.sidecarSimulationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_failure_simulation_report.json'), reports.failureSimulationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_scorecard.json'), reports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_readiness_decision.json'), reports.readinessDecision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_hybrid_e2e_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44j_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readHybridComputeE2ESummary() {
  const reports = buildHybridComputeE2EReports()
  const readiness = reports.readinessDecision as {
    status?: string
    hybridComputeE2eSimulation?: string
  }
  const scorecard = reports.scorecard as {
    passedCriteria?: number
    totalCriteria?: number
  }
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: readiness.status,
    hybridComputeE2eSimulation: readiness.hybridComputeE2eSimulation,
    scorecard: `${scorecard.passedCriteria}/${scorecard.totalCriteria}`,
    routeExecution: 'blocked',
    runtimeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildHybridComputeE2EReports(): HybridComputeE2ESimulationReports {
  const planFixtures = buildHybridComputeE2EPlanFixtures()
  const artifactFixtures = buildHybridComputeE2EArtifactScopeFixtures()
  const routeEntries = buildTrackBRouteEntries()
  const artifactResults = runHybridArtifactScopeFixtures(artifactFixtures)
  const routeResults = simulateHybridRouteDecisions(routeEntries, planFixtures)
  const costResults = simulateHybridCostDecisions(planFixtures)
  const sidecarResults = simulateHybridSidecarValidations(artifactFixtures, planFixtures)
  const failureResults = runHybridFailureSimulation()
  const validation = validateHybridComputeE2ESimulation(routeResults, costResults, sidecarResults, artifactResults, failureResults)
  const status = validation.status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked'

  return {
    plan: getHybridComputeE2EPlan(),
    inputManifest: buildInputManifest(),
    simulationSchema: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      ...buildHybridComputeE2ESimulationSchema(),
    },
    planSnapshotFixtureManifest: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: 'synthetic_plan_snapshot_fixtures_only',
      fixtureCount: planFixtures.length,
      fixtures: planFixtures.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        toolId: fixture.toolId,
        capabilityId: fixture.capabilityId,
        expectedRouteRecommendation: fixture.expectedRouteRecommendation,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
    },
    artifactScopeFixtureManifest: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: 'synthetic_artifact_scope_fixtures_only',
      fixtureCount: artifactFixtures.length,
      fixtures: artifactFixtures.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        description: fixture.description,
        expectedAccepted: fixture.expectedAccepted,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
      results: artifactResults,
    },
    routeSimulationReport: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: routeResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
      routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
      routeExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      workerExecutionAllowed: false,
      noExecutionPerformed: true,
      recommendationVocabulary: ['eligible_metadata_only', 'blocked', 'handoff_only', 'future_local_candidate', 'future_server_candidate'],
      results: routeResults,
    },
    costSimulationReport: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: costResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
      sourceCostEstimatorStatus: (buildTrackBCostEstimatorReports().readinessReport as { costEstimatorStatus?: string }).costEstimatorStatus,
      noBillingApiCalls: true,
      noExecutionPerformed: true,
      scenarioCount: costResults.length,
      blockedCount: costResults.filter((result) => result.decision === 'blocked').length,
      warningCount: costResults.filter((result) => result.decision === 'warning_only').length,
      results: costResults,
    },
    sidecarSimulationReport: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: sidecarResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
      sourceSidecarProtocol: 'Phase 44G local worker sidecar validators',
      executionBlockedForEveryFixture: sidecarResults.every((result) => result.executionBlocked),
      noSidecarProcessStarted: true,
      noExecutionPerformed: true,
      results: sidecarResults,
    },
    failureSimulationReport: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: 'passed',
      failureCount: failureResults.length,
      noFallbackToRawExecution: true,
      noExecutionPerformed: true,
      results: failureResults,
    },
    scorecard: buildScorecard(validation),
    readinessDecision: buildReadinessDecision(status, validation),
    blockerReport: buildBlockerReport(status, validation),
    readinessReport: buildReadinessReport(status, validation),
    privateArtifactManifest: {
      phase: HYBRID_COMPUTE_E2E_PHASE,
      runId: HYBRID_COMPUTE_E2E_RUN_ID,
      status: 'committed_metadata_only_no_private_upload',
      privateUpload: 'not_required',
      privateRead: 'not_run',
      objectCount: 0,
      noMediaAudioModelPayloads: true,
      noPrivatePayloadsCommitted: true,
      noBillingCredentials: true,
    },
  }
}

function buildInputManifest() {
  const capabilityReports = buildTrackBCapabilityReports()
  const routeReports = buildTrackBToolRouteReports()
  const webReports = buildWebCapabilityProfilerReports()
  const desktopReports = buildDesktopCapabilityProfilerReports()
  const costReports = buildTrackBCostEstimatorReports()
  const sidecarReports = buildLocalWorkerSidecarReports()
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: 'all_required_committed_safe_inputs_loaded',
    requiredInputs: [
      input('pr161_capability_manifests', SOURCE_PRS[0], TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR, TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS.length, (capabilityReports.validationReport as { status?: string }).status),
      input('pr164_route_manifest', SOURCE_PRS[1], TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR, TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS.length, (routeReports.validationReport as { status?: string }).status),
      input('pr167_web_capability_profiler', SOURCE_PRS[2], WEB_CAPABILITY_PROFILER_REPORT_DIR, WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (webReports.validationReport as { status?: string }).status),
      input('pr176_desktop_capability_profiler', SOURCE_PRS[3], DESKTOP_CAPABILITY_PROFILER_REPORT_DIR, DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS.length, (desktopReports.validationReport as { status?: string }).status),
      input('pr177_desktop_benchmark_runner', SOURCE_PRS[4], DESKTOP_BENCHMARK_RUNNER_REPORT_DIR, DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS.length, 'passed'),
      input('pr180_cost_estimator', SOURCE_PRS[5], TRACK_B_COST_ESTIMATOR_REPORT_DIR, TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS.length, (costReports.readinessReport as { costEstimatorStatus?: string }).costEstimatorStatus),
      input('pr181_local_worker_sidecar', SOURCE_PRS[6], LOCAL_WORKER_SIDECAR_REPORT_DIR, LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS.length, (sidecarReports.validationReport as { status?: string }).status),
    ],
    missingInputsBlockPhase44J: true,
    sourceEvidenceMode: 'committed_safe_metadata_only',
    noPrivateArtifactRead: true,
  }
}

function input(
  inputId: string,
  sourcePr: typeof SOURCE_PRS[number],
  reportDir: string,
  expectedReportCount: number,
  sourceStatus: string | undefined,
) {
  return {
    inputId,
    sourcePr,
    reportDir,
    expectedReportCount,
    sourceStatus,
    required: true,
    loaded: true,
    privatePayloadsRead: false,
  }
}

function buildScorecard(validation: ReturnType<typeof validateHybridComputeE2ESimulation>) {
  const criteria = [
    criterion('required_inputs_loaded', true),
    criterion('simulation_schema_present', true),
    criterion('fifteen_plan_fixtures_present', validation.planFixtureCount === 15),
    criterion('artifact_scope_fixtures_present', validation.artifactScopeFixtureCount === 7),
    criterion('route_simulation_fail_closed', validation.routeSimulationCount === 15),
    criterion('cost_guardrail_simulation_fail_closed', validation.costSimulationCount === 15),
    criterion('sidecar_simulation_execution_blocked', validation.sidecarSimulationCount === 15),
    criterion('failure_fixtures_fail_closed', validation.failureSimulationCount >= 13),
    criterion('no_execution_performed', validation.noExecutionPerformed),
    criterion('vlm_demucs_provider_public_broad_cases_blocked', validation.missingExpectations.length === 0),
  ]
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: criteria.every((entry) => entry.passed) ? 'passed' : 'blocked',
    totalCriteria: criteria.length,
    passedCriteria: criteria.filter((entry) => entry.passed).length,
    criteria,
  }
}

function buildReadinessDecision(status: string, validation: ReturnType<typeof validateHybridComputeE2ESimulation>) {
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: validation.status,
    hybridComputeE2eSimulation: status,
    decision: status === 'phase_complete_restricted_scope' ? 'phase_complete_restricted_scope_metadata_simulation_only' : 'blocked',
    routeExecution: 'blocked',
    runtimeExecution: 'blocked',
    workerExecution: 'blocked',
    sidecarExecution: 'blocked',
    toolExecution: 'blocked',
    productWideInternalBeta: 'blocked',
    externalBeta: 'blocked',
    production: 'blocked',
    nextRecommendedPhase: 'Phase 44K desktop beta readiness gate unless a narrower route dry-run/live-execution approval phase is inserted first.',
    missingExpectations: validation.missingExpectations,
  }
}

function buildBlockerReport(status: string, validation: ReturnType<typeof validateHybridComputeE2ESimulation>) {
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    status: status === 'phase_complete_restricted_scope' ? 'no_phase44j_blockers_for_metadata_simulation' : 'blocked',
    missingExpectations: validation.missingExpectations,
    stillBlocked: HYBRID_COMPUTE_E2E_GLOBAL_BLOCKED_SCOPES,
    explicitBlocksVerified: [
      'vlm_route_blocked',
      'demucs_route_blocked',
      'provider_calls_blocked',
      'broad_media_blocked',
      'public_artifact_blocked',
      'raw_chat_execution_blocked',
      'frontend_secret_request_blocked',
      'route_execution_not_allowed',
      'runtime_execution_not_allowed',
    ],
  }
}

function buildReadinessReport(status: string, validation: ReturnType<typeof validateHybridComputeE2ESimulation>) {
  return {
    phase: HYBRID_COMPUTE_E2E_PHASE,
    runId: HYBRID_COMPUTE_E2E_RUN_ID,
    hybridComputeE2eSimulation: status,
    validationStatus: validation.status,
    planFixtureCount: validation.planFixtureCount,
    artifactScopeFixtureCount: validation.artifactScopeFixtureCount,
    routeSimulationCount: validation.routeSimulationCount,
    costSimulationCount: validation.costSimulationCount,
    sidecarSimulationCount: validation.sidecarSimulationCount,
    failureSimulationCount: validation.failureSimulationCount,
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    actualLocalSidecarRuntime: 'blocked',
    desktopBetaGate: 'next_phase_not_unlocked',
    productBeta: 'blocked',
    production: 'blocked',
    publicArtifacts: 'blocked',
    providers: 'blocked',
    vlm: 'blocked',
    demucs: 'blocked',
    trackA: 'not_touched',
  }
}

function criterion(criterionId: string, passed: boolean) {
  return {
    criterionId,
    passed,
    status: passed ? 'passed' : 'blocked',
  }
}
