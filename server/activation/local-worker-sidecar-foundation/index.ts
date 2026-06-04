import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { TRACK_B_TOOL_IDS } from '../track-b-capability-manifests/track-b-tool-registry'
import { TRACK_B_TOOL_ROUTE_MANIFEST_VERSION, buildTrackBRouteEntries } from '../track-b-tool-route-manifest'
import {
  LOCAL_WORKER_SIDECAR_FIXTURES,
  LOCAL_WORKER_SIDECAR_GLOBAL_BLOCKED_SCOPES,
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
  buildFixtureControllerHello,
  buildFixtureSidecarHello,
  buildLocalWorkerSidecarArtifactScopePolicy,
  buildLocalWorkerSidecarLifecyclePolicy,
  buildLocalWorkerSidecarPlanSnapshotPolicy,
  buildLocalWorkerSidecarProtocolSchema,
  buildLocalWorkerSidecarSecurityPolicy,
  runLocalWorkerSidecarFixtures,
} from '../../../src/lib/track-b/local-worker-sidecar'
import type { LocalWorkerSidecarFixtureResult } from '../../../src/lib/track-b/local-worker-sidecar'
import type { LocalWorkerSidecarFoundationReports } from './local-worker-sidecar-foundation-types'

export const LOCAL_WORKER_SIDECAR_PHASE = '44G'
export const LOCAL_WORKER_SIDECAR_RUN_ID = 'phase44g-local-worker-sidecar-foundation-20260604'
export const LOCAL_WORKER_SIDECAR_BRANCH = 'codex/rp-activation-44g-local-worker-sidecar-foundation'
export const LOCAL_WORKER_SIDECAR_BASE_BRANCH = 'codex/rp-activation-44h-trackb-cost-estimator'
export const LOCAL_WORKER_SIDECAR_REPORT_DIR = 'docs/activation-phase-44g-local-worker-sidecar-foundation-reports'

export const LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS = [
  'phase_44g_local_worker_sidecar_plan.json',
  'phase_44g_local_worker_sidecar_source_evidence.json',
  'phase_44g_local_worker_sidecar_protocol_schema.json',
  'phase_44g_local_worker_sidecar_plan_snapshot_policy.json',
  'phase_44g_local_worker_sidecar_artifact_scope_policy.json',
  'phase_44g_local_worker_sidecar_security_policy.json',
  'phase_44g_local_worker_sidecar_lifecycle_policy.json',
  'phase_44g_local_worker_sidecar_fixture_manifest.json',
  'phase_44g_local_worker_sidecar_fixture_results.json',
  'phase_44g_local_worker_sidecar_validation_report.json',
  'phase_44g_local_worker_sidecar_noop_handshake_report.json',
  'phase_44g_local_worker_sidecar_route_handoff.json',
  'phase_44g_local_worker_sidecar_cost_handoff.json',
  'phase_44g_local_worker_sidecar_capability_handoff.json',
  'phase_44g_local_worker_sidecar_blocker_report.json',
  'phase_44g_local_worker_sidecar_readiness_report.json',
  'phase_44g_private_artifact_manifest.json',
] as const

const SOURCE_PRS = {
  pr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
  pr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
  pr167: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167',
  pr176: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176',
  pr177: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/177',
  pr180: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/180',
}

export function getLocalWorkerSidecarPlan() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    branch: LOCAL_WORKER_SIDECAR_BRANCH,
    baseBranch: LOCAL_WORKER_SIDECAR_BASE_BRANCH,
    sourcePrs: SOURCE_PRS,
    mode: 'metadata_only_protocol_policy_mock_fixtures',
    protocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
    sharedProtocolLibrary: 'src/lib/track-b/local-worker-sidecar',
    serverActivationModule: 'server/activation/local-worker-sidecar-foundation',
    reportDir: LOCAL_WORKER_SIDECAR_REPORT_DIR,
    expectedReports: LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS,
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_FOUNDATION',
    optionalNoopHandshakeConfirmation: 'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_NOOP_HANDSHAKE',
    optionalNoopHandshakeDefault: 'skipped_by_policy',
    localWorkerSidecarPlanning: 'phase_complete_restricted_scope_after_validation',
    noRouteExecution: true,
    noWorkerExecution: true,
    noToolExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    nextRecommendedPhase: 'Phase 44J hybrid compute E2E simulation after route/cost/sidecar metadata is complete.',
  }
}

export function getLocalWorkerSidecarIamPlan() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    gcpMutation: 'blocked',
    cloudResources: 'not_used',
    notes: [
      'Phase 44G writes committed safe metadata reports only.',
      'No bucket, IAM binding, service-account key, Cloud Run, Cloud Build, public principal, or GCP mutation is part of this phase.',
    ],
  }
}

export function getLocalWorkerSidecarCostSummary() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    providerCalls: 'not_run',
    dockerCloudRunCloudBuild: 'not_run',
    costEstimatorSource: 'Phase 44H static cost estimator remains planning-only',
  }
}

export async function writeLocalWorkerSidecarArtifacts(reportDir = LOCAL_WORKER_SIDECAR_REPORT_DIR): Promise<void> {
  const reports = buildLocalWorkerSidecarReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_protocol_schema.json'), reports.protocolSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_plan_snapshot_policy.json'), reports.planSnapshotPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_artifact_scope_policy.json'), reports.artifactScopePolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_security_policy.json'), reports.securityPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_lifecycle_policy.json'), reports.lifecyclePolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_fixture_results.json'), reports.fixtureResults)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_noop_handshake_report.json'), reports.noopHandshakeReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_route_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_cost_handoff.json'), reports.costHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_capability_handoff.json'), reports.capabilityHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_local_worker_sidecar_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44g_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readLocalWorkerSidecarSummary() {
  const reports = buildLocalWorkerSidecarReports()
  const readiness = reports.readinessReport as { localWorkerSidecarPlanning?: string }
  const validation = reports.validationReport as { status?: string; fixtureCount?: number }
  const noop = reports.noopHandshakeReport as { status?: string }
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: validation.status,
    localWorkerSidecarPlanning: readiness.localWorkerSidecarPlanning,
    fixtureCount: validation.fixtureCount,
    optionalNoopHandshake: noop.status,
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    toolExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildLocalWorkerSidecarReports(): LocalWorkerSidecarFoundationReports {
  const fixtureResults = runLocalWorkerSidecarFixtures()
  const validationReport = buildValidationReport(fixtureResults)
  const status = validationReport.status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked'

  return {
    plan: getLocalWorkerSidecarPlan(),
    sourceEvidence: buildSourceEvidence(),
    protocolSchema: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      ...buildLocalWorkerSidecarProtocolSchema(),
      fixtureMessages: {
        sidecarHello: buildFixtureSidecarHello(),
        controllerHello: buildFixtureControllerHello(),
      },
    },
    planSnapshotPolicy: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      ...buildLocalWorkerSidecarPlanSnapshotPolicy(),
    },
    artifactScopePolicy: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      ...buildLocalWorkerSidecarArtifactScopePolicy(),
    },
    securityPolicy: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      ...buildLocalWorkerSidecarSecurityPolicy(),
    },
    lifecyclePolicy: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      ...buildLocalWorkerSidecarLifecyclePolicy(),
    },
    fixtureManifest: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      status: 'generated_mock_fixtures_only',
      fixtureCount: LOCAL_WORKER_SIDECAR_FIXTURES.length,
      fixtures: LOCAL_WORKER_SIDECAR_FIXTURES.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        description: fixture.description,
        expectedAccepted: fixture.expectedAccepted,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
    },
    fixtureResults: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      status: fixtureResults.every((fixture) => fixture.status === 'passed') ? 'passed' : 'blocked',
      fixtures: fixtureResults,
    },
    validationReport,
    noopHandshakeReport: buildNoopHandshakeReport(),
    routeHandoff: buildRouteHandoff(),
    costHandoff: buildCostHandoff(),
    capabilityHandoff: buildCapabilityHandoff(),
    blockerReport: buildBlockerReport(validationReport.status),
    readinessReport: buildReadinessReport(status),
    privateArtifactManifest: {
      phase: LOCAL_WORKER_SIDECAR_PHASE,
      runId: LOCAL_WORKER_SIDECAR_RUN_ID,
      status: 'committed_metadata_only',
      privateUploadRequired: false,
      privatePayloadsCommitted: false,
      reportDir: LOCAL_WORKER_SIDECAR_REPORT_DIR,
      reportCount: LOCAL_WORKER_SIDECAR_EXPECTED_REPORTS.length,
    },
  }
}

function buildSourceEvidence() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    accessedDate: '2026-06-04',
    sources: [
      {
        sourceId: 'node_child_process',
        title: 'Node.js child_process',
        url: 'https://nodejs.org/api/child_process.html',
        evidenceSummary: 'Official docs describe spawn, execFile, fork, timeout, maxBuffer, and shell behavior for subprocesses.',
        decisionImpact: 'Future sidecar process launch policy requires no shell strings, explicit executable and argv, bounded timeout, bounded output, and scrubbed environment.',
        securityCaveat: 'Phase 44G does not use subprocess execution; optional no-op remains skipped by policy.',
      },
      {
        sourceId: 'node_worker_threads',
        title: 'Node.js worker_threads',
        url: 'https://nodejs.org/api/worker_threads.html',
        evidenceSummary: 'Official docs describe worker threads as useful for CPU-intensive JavaScript and distinct from child processes.',
        decisionImpact: 'Worker threads are future execution evidence only and do not approve worker or sidecar execution in Phase 44G.',
        securityCaveat: 'Shared-memory and worker execution remain blocked until a later explicit execution phase.',
      },
      {
        sourceId: 'electron_ipc',
        title: 'Electron IPC',
        url: 'https://www.electronjs.org/docs/latest/tutorial/ipc',
        evidenceSummary: 'Official Electron docs describe IPC as the bridge between main and renderer processes.',
        decisionImpact: 'Future Electron handoff must use a narrow main-process bridge; this repo does not add Electron in Phase 44G.',
        securityCaveat: 'No Electron runtime or renderer Node access is introduced.',
      },
      {
        sourceId: 'electron_context_isolation',
        title: 'Electron context isolation',
        url: 'https://www.electronjs.org/docs/latest/tutorial/context-isolation',
        evidenceSummary: 'Official Electron docs describe context isolation as a security boundary for preload APIs.',
        decisionImpact: 'Any future desktop bridge must require context isolation and narrow preload APIs.',
        securityCaveat: 'No desktop shell is added in Phase 44G.',
      },
    ],
    tauriEvidence: 'not_recorded_repo_has_no_tauri_stack',
  }
}

function buildValidationReport(fixtureResults: LocalWorkerSidecarFixtureResult[]) {
  const failedFixtures = fixtureResults.filter((fixture) => fixture.status !== 'passed')
  const routeEntries = buildTrackBRouteEntries()
  const everyRouteExecutionBlocked = routeEntries.every((entry) => entry.routeExecutionAllowed === false && entry.runtimeExecutionAllowed === false)
  const blockers: string[] = []
  if (failedFixtures.length > 0) blockers.push('fixture_validation_failed')
  if (!everyRouteExecutionBlocked) blockers.push('route_or_runtime_execution_enabled')
  if (TRACK_B_TOOL_IDS.length !== 18) blockers.push('track_b_tool_count_mismatch')

  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    failedFixtureIds: failedFixtures.map((fixture) => fixture.fixtureId),
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    optionalNoopHandshakeDefault: 'skipped_by_policy',
    sharedProtocolLibraryIsPureTypescript: true,
    serviceRoleSecretsInFrontend: false,
    trackAImports: false,
    blockers,
  }
}

function buildNoopHandshakeReport() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'skipped_by_policy',
    requiredConfirmation: 'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_NOOP_HANDSHAKE=true',
    doesNotBlockPhase44G: true,
    subprocessStarted: false,
    shellUsed: false,
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    toolExecution: 'not_run',
    mediaProcessing: 'not_run',
    providerCalls: 'not_run',
  }
}

function buildRouteHandoff() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'protocol_validation_handoff_only',
    sourceRouteManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    cannotChooseToolsByItself: true,
    cannotOverrideRouteManifest: true,
    cannotOverrideCapabilityManifest: true,
    cannotApproveVlm: true,
    cannotApproveDemucs: true,
    cannotApproveBroadMedia: true,
    phase44jRequiredBeforeHybridE2e: true,
    futureExecutionRequiresApprovedPlanSnapshotAndArtifactScope: true,
  }
}

function buildCostHandoff() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'cost_guardrail_handoff_only',
    costEstimatorSource: 'Phase 44H static cost estimator',
    routeExecutionCostNotEstimatedFromRuntime: true,
    cannotOverrideCostGuardrails: true,
    gpuProviderBroadMediaCostsBlocked: true,
    futureExecutionMustPassCostPolicy: true,
  }
}

function buildCapabilityHandoff() {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: 'capability_manifest_handoff_only',
    trackBToolCount: TRACK_B_TOOL_IDS.length,
    localWorkerSidecarPlanning: 'phase_complete_restricted_scope',
    capabilitiesConsumed: ['PR #161 capability manifests', 'PR #164 route manifests', 'PR #167 web profiler', 'PR #176 desktop profiler', 'PR #177 desktop benchmark', 'PR #180 cost estimator'],
    disabledCapabilitiesRemainDisabled: ['demucs', 'qwen3_vl', 'vllm'],
  }
}

function buildBlockerReport(validationStatus: string) {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    status: validationStatus === 'passed' ? 'phase44g_complete_with_execution_blockers_remaining' : 'blocked',
    remainingBlockedScopes: LOCAL_WORKER_SIDECAR_GLOBAL_BLOCKED_SCOPES,
    nextRequiredPhaseForHybridE2e: 'Phase 44J',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    localExecution: 'blocked_until_future_explicit_execution_phase',
  }
}

function buildReadinessReport(localWorkerSidecarPlanning: string) {
  return {
    phase: LOCAL_WORKER_SIDECAR_PHASE,
    runId: LOCAL_WORKER_SIDECAR_RUN_ID,
    localWorkerSidecarPlanning,
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    toolExecution: 'blocked',
    hybridE2eSimulation: 'pending_phase44j',
    webCapabilityProfiler: 'phase_complete_restricted_scope',
    desktopCapabilityProfiler: 'phase_complete_restricted_scope',
    desktopBenchmarkRunner: 'phase_complete_restricted_scope',
    costEstimator: 'phase_complete_restricted_scope',
    production: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    broadMedia: 'blocked',
    publicArtifacts: 'blocked',
    providers: 'blocked',
    vlm: 'excluded',
    demucs: 'blocked',
    trackA: 'not_touched',
  }
}
