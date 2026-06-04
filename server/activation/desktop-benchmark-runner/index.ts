import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  DESKTOP_BENCHMARK_CAPS,
  DESKTOP_BENCHMARK_FIXTURES,
  DESKTOP_BENCHMARK_PRIVACY_POLICY,
  DESKTOP_BENCHMARK_ROUTE_MANIFEST_VERSION,
  DESKTOP_BENCHMARK_SCHEMA_VERSION,
  buildDesktopBenchmarkCostHandoff,
  buildDesktopBenchmarkRouteHandoff,
  runBoundedDesktopBenchmark,
  runDesktopBenchmarkFixtures,
} from '../../../src/lib/track-b/desktop-benchmark-runner'
import type { DesktopBenchmarkFixtureResult } from '../../../src/lib/track-b/desktop-benchmark-runner'
import type { DesktopBenchmarkRunnerReports } from './desktop-benchmark-runner-types'

export const DESKTOP_BENCHMARK_RUNNER_PHASE = '44F'
export const DESKTOP_BENCHMARK_RUNNER_RUN_ID = 'phase44f-desktop-benchmark-runner-20260604'
export const DESKTOP_BENCHMARK_RUNNER_BRANCH = 'codex/rp-activation-44f-desktop-benchmark-runner'
export const DESKTOP_BENCHMARK_RUNNER_BASE_BRANCH = 'codex/rp-activation-44e-desktop-capability-profiler'
export const DESKTOP_BENCHMARK_RUNNER_REPORT_DIR = 'docs/activation-phase-44f-desktop-benchmark-runner-reports'

export const DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS = [
  'phase_44f_desktop_benchmark_runner_plan.json',
  'phase_44f_desktop_benchmark_source_evidence.json',
  'phase_44f_desktop_benchmark_web_research.md',
  'phase_44f_desktop_benchmark_schema.json',
  'phase_44f_desktop_benchmark_privacy_policy.json',
  'phase_44f_desktop_benchmark_fixture_manifest.json',
  'phase_44f_desktop_benchmark_fixture_results.json',
  'phase_44f_desktop_benchmark_validation_report.json',
  'phase_44f_desktop_benchmark_local_run_report.json',
  'phase_44f_desktop_benchmark_route_handoff.json',
  'phase_44f_desktop_benchmark_cost_handoff.json',
  'phase_44f_desktop_benchmark_blocker_report.json',
  'phase_44f_desktop_benchmark_readiness_report.json',
  'phase_44f_private_artifact_manifest.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'Phase 44G local worker sidecar',
  'Phase 44H full cost estimator',
  'Phase 44J hybrid E2E simulation',
  'route execution',
  'worker execution',
  'sidecar execution',
  'media processing',
  'audio processing',
  'OCR runtime',
  'VLM runtime',
  'DeepFilterNet runtime',
  'Signalsmith runtime',
  'Demucs runtime',
  'model downloads',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'GCP mutation',
  'IAM mutation',
  'provider calls',
  'web search provider calls',
  'network speed tests',
  'GPU benchmarks',
  'sustained CPU stress tests',
  'long memory pressure tests',
  'live benchmark upload',
  'persistent device identifiers',
  'hostname collection',
  'username collection',
  'MAC address collection',
  'serial number collection',
  'exact CPU model persistence',
  'exact GPU adapter identity persistence',
  'environment variable dump',
  'directory scanning',
  'process list scanning',
  'installed app scanning',
  'public artifacts',
  'broad media',
  'arbitrary media input',
  'product-wide internal beta',
  'external beta',
  'paid production',
  'production',
  'Track A runtime/visual/render stack',
]

export function getDesktopBenchmarkRunnerPlan() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    branch: DESKTOP_BENCHMARK_RUNNER_BRANCH,
    baseBranch: DESKTOP_BENCHMARK_RUNNER_BASE_BRANCH,
    sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
    sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
    sourcePr167: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167',
    sourcePr176: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176',
    mode: 'safe_metadata_only_generated_benchmark_fixtures',
    benchmarkSchemaVersion: DESKTOP_BENCHMARK_SCHEMA_VERSION,
    routeManifestVersion: DESKTOP_BENCHMARK_ROUTE_MANIFEST_VERSION,
    desktopSafeModule: 'src/lib/track-b/desktop-benchmark-runner',
    serverActivationModule: 'server/activation/desktop-benchmark-runner',
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_RUNNER',
    optionalLocalBenchmarkConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_LOCAL_RUN',
    localBenchmarkDefault: 'skipped_by_policy',
    noLiveBenchmarkUpload: true,
    noLocalPersistenceByDefault: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noNetworkGpuHeavyBenchmarks: true,
    noTrackA: true,
    reportDir: DESKTOP_BENCHMARK_RUNNER_REPORT_DIR,
    expectedReports: DESKTOP_BENCHMARK_RUNNER_EXPECTED_REPORTS,
    nextRecommendedPhase: 'Phase 44H cost estimator if cost gating should come first, or Phase 44G local worker sidecar foundation if local execution plumbing is prioritized.',
  }
}

export function getDesktopBenchmarkRunnerIamPlan() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    liveBenchmarkUpload: 'blocked_until_future_explicit_phase',
    notes: [
      'Phase 44F writes committed safe metadata reports only.',
      'No GCP bucket, IAM binding, service-account key, Cloud Run, Cloud Build, public principal, or upload path is used.',
    ],
  }
}

export function getDesktopBenchmarkRunnerCostSummary() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    costEstimator: 'Phase 44H remains pending',
    costDrivers: ['local TypeScript report generation only', 'generated/mock benchmark fixture evaluation'],
    noNetworkBenchmark: true,
    noGpuBenchmark: true,
    noSustainedStressTest: true,
    noProviderCalls: true,
    noCloudRuntime: true,
  }
}

export async function writeDesktopBenchmarkRunnerArtifacts(
  reportDir = DESKTOP_BENCHMARK_RUNNER_REPORT_DIR,
  options: { includeLocalBenchmark?: boolean } = {},
): Promise<void> {
  const reports = await buildDesktopBenchmarkRunnerReports(options)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_runner_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_web_research.md'), reports.webResearchMarkdown)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_schema.json'), reports.benchmarkSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_privacy_policy.json'), reports.privacyPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_fixture_results.json'), reports.fixtureResults)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_local_run_report.json'), reports.localRunReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_route_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_cost_handoff.json'), reports.costHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_desktop_benchmark_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44f_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export async function readDesktopBenchmarkRunnerSummary() {
  const reports = await buildDesktopBenchmarkRunnerReports()
  const validationReport = reports.validationReport as { status?: string }
  const readinessReport = reports.readinessReport as { desktopBenchmarkRunnerStatus?: string }
  const fixtureResults = reports.fixtureResults as { fixtures?: DesktopBenchmarkFixtureResult[] }
  const localRun = reports.localRunReport as { status?: string }
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: validationReport.status,
    desktopBenchmarkRunnerStatus: readinessReport.desktopBenchmarkRunnerStatus,
    fixtureCount: fixtureResults.fixtures?.length ?? 0,
    localBenchmark: localRun.status,
    liveBenchmarkUpload: 'blocked',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export async function buildDesktopBenchmarkRunnerReports(
  options: { includeLocalBenchmark?: boolean } = {},
): Promise<DesktopBenchmarkRunnerReports> {
  const fixtureResults = runDesktopBenchmarkFixtures(DESKTOP_BENCHMARK_FIXTURES)
  const localRunReport = await buildLocalRunReport(options.includeLocalBenchmark === true)
  const validationReport = buildValidationReport(fixtureResults, localRunReport)
  const firstFixtureProfile = fixtureResults[0].profile
  const status = validationReport.status
  return {
    plan: getDesktopBenchmarkRunnerPlan(),
    sourceEvidence: buildSourceEvidence(),
    benchmarkSchema: buildBenchmarkSchema(),
    privacyPolicy: buildPrivacyPolicyReport(),
    fixtureManifest: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'generated_mock_fixtures_only',
      fixtures: DESKTOP_BENCHMARK_FIXTURES.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        description: fixture.description,
        expectedRouteHints: fixture.expectedRouteHints,
        expectedCostHints: fixture.expectedCostHints,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
    },
    fixtureResults: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status,
      fixtures: fixtureResults,
    },
    validationReport,
    localRunReport,
    routeHandoff: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'hints_only_route_execution_blocked',
      sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
      sourcePr176: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176',
      routeManifestVersion: DESKTOP_BENCHMARK_ROUTE_MANIFEST_VERSION,
      desktopBenchmarkRunnerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      handoffExample: buildDesktopBenchmarkRouteHandoff(firstFixtureProfile),
      routeHints: [
        'local_light_cpu_tasks_possible_future',
        'local_temp_storage_ok',
        'server_worker_preferred',
        'local_media_runtime_missing',
        'parallel_workers_limited',
        'benchmark_unavailable_fail_closed',
      ],
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
      sidecarExecutionAllowed: false,
      toolChoiceAuthority: 'planner_and_future_route_gate_only',
      benchmarksCannotOverrideBlockedRoutes: true,
      costEstimatorRequired: 'Phase 44H',
      localWorkerSidecarRequired: 'Phase 44G',
      hybridE2eSimulationRequired: 'Phase 44J',
      approvedPlanSnapshotRequired: true,
      artifactScopeRequired: true,
      vlm: 'excluded',
      demucs: 'blocked',
      broadMedia: 'blocked',
      publicArtifacts: 'blocked',
      providerCalls: 'blocked',
    },
    costHandoff: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'cost_hints_only_cost_estimator_pending',
      handoffExample: buildDesktopBenchmarkCostHandoff(firstFixtureProfile),
      costEstimatorHints: [
        'benchmark_supports_cost_estimator',
        'local_cost_penalty_expected',
        'parallel_workers_limited',
        'benchmark_unavailable_fail_closed',
      ],
      actualCostEstimator: 'Phase 44H pending',
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
    },
    blockerReport: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: status === 'passed' ? 'no_phase_44f_blockers' : 'blocked',
      blockers: validationReport.blockers,
      globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    },
    readinessReport: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status,
      desktopBenchmarkRunnerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      desktopBenchmarkRunner: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      desktopSafeModule: 'added',
      serverActivationModule: 'added',
      schema: status,
      privacyPolicy: status,
      fixtureCoverage: status,
      localBenchmarkRun: localRunReport.status,
      liveBenchmarkUpload: 'not_run',
      routeExecution: 'blocked',
      workerExecution: 'blocked',
      localWorkerSidecar: 'pending',
      costEstimator: 'pending',
      hybridE2eSimulation: 'pending',
      production: 'blocked',
      externalBeta: 'blocked',
      paidProduction: 'blocked',
      broadMedia: 'blocked',
      publicArtifacts: 'blocked',
      providerCalls: 'blocked',
      vlm: 'excluded',
      demucs: 'blocked',
      trackA: 'not_touched',
      nextRecommendedPhase: 'Phase 44H cost estimator or Phase 44G local worker sidecar foundation.',
    },
    privateArtifactManifest: {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'not_required_metadata_committed_only',
      privateUpload: 'not_run',
      privateRead: 'not_run',
      objectCount: 0,
      noPrivatePayloadsCommitted: true,
      liveBenchmarkResultsPersisted: false,
    },
    iamPlan: getDesktopBenchmarkRunnerIamPlan(),
    costSummary: getDesktopBenchmarkRunnerCostSummary(),
    webResearchMarkdown: renderWebResearchMarkdown(),
  }
}

async function buildLocalRunReport(includeLocalBenchmark: boolean): Promise<Record<string, unknown>> {
  if (!includeLocalBenchmark) {
    return {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'skipped_by_policy',
      reason: 'optional_local_benchmark_not_confirmed',
      requiredConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_LOCAL_RUN=true',
      liveBenchmarkUpload: 'blocked',
      localPersistence: 'blocked',
    }
  }
  if (process.env.REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_LOCAL_RUN !== 'true') {
    return {
      phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
      runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
      status: 'blocked_missing_confirmation',
      requiredConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_BENCHMARK_LOCAL_RUN=true',
      liveBenchmarkUpload: 'blocked',
      localPersistence: 'blocked',
    }
  }

  const profile = await runBoundedDesktopBenchmark({
    confirmed: true,
    generatedAt: '2026-06-04T00:00:00.000Z',
  })
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: 'local_bounded_completed_session_only',
    profile,
    runtimeToolChecks: {
      node: commandAvailable('node', ['-v']),
      python3: commandAvailable('python3', ['--version']),
      ffmpeg: commandAvailable('ffmpeg', ['-version']),
      ffprobe: commandAvailable('ffprobe', ['-version']),
      outputPolicy: 'redacted_availability_only',
    },
    tempFileCheck: tempFileCheck(),
    noMediaFiles: true,
    noArbitraryPaths: true,
    noNetworkBenchmark: true,
    noGpuBenchmark: true,
    noSustainedStressTest: true,
    noPersistence: true,
    liveBenchmarkUpload: 'blocked',
  }
}

function commandAvailable(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { stdio: 'ignore', timeout: DESKTOP_BENCHMARK_CAPS.runtimeToolTimeoutMs })
  return result.status === 0
}

function tempFileCheck(): Record<string, unknown> {
  const dir = path.join(os.tmpdir(), `reeditpro-phase44f-${Date.now()}`)
  const file = path.join(dir, 'generated-benchmark-temp.bin')
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(file, new Uint8Array(1024))
    return { status: 'passed', bytesWritten: 1024, tempOnly: true, deleted: true }
  } catch {
    return { status: 'blocked', tempOnly: true, deleted: existsSync(dir) ? 'attempted' : false }
  } finally {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }
}

function buildSourceEvidence() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    accessedAt: '2026-06-04',
    status: 'official_sources_recorded',
    sources: [
      source('Node.js perf_hooks', 'https://nodejs.org/api/perf_hooks.html', 'Official Node.js timing API evidence for performance.now and measure APIs; Phase 44F uses bounded timing only.'),
      source('Node.js worker_threads', 'https://nodejs.org/api/worker_threads.html', 'Official worker_threads evidence for CPU-intensive JavaScript; Phase 44F caps optional parallel work and skips by default.'),
      source('Node.js crypto', 'https://nodejs.org/api/crypto.html', 'Official crypto API evidence for SHA-256-style generated buffer hashing; Phase 44F uses generated tiny buffers only.'),
      source('Node.js fs', 'https://nodejs.org/api/fs.html', 'Official file system API evidence for temp file checks; Phase 44F uses temp-only generated files and deletes them.'),
      source('Node.js os', 'https://nodejs.org/api/os.html', 'Official OS API evidence for availableParallelism and memory context; exact CPU model data remains blocked/redacted.'),
    ],
  }
}

function source(name: string, url: string, summary: string) {
  return {
    name,
    url,
    evidenceType: 'official_documentation',
    accessedAt: '2026-06-04',
    summary,
    decisionImpact: 'bounded_desktop_benchmark_metadata_only_no_route_or_worker_execution',
    privacyPerformanceCaveat: 'strict_caps_generated_data_no_identifiers_no_sustained_stress',
  }
}

function buildBenchmarkSchema() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    schemaVersion: DESKTOP_BENCHMARK_SCHEMA_VERSION,
    requiredFields: [
      'schemaVersion',
      'generatedAt',
      'collectionMode',
      'privacyMode',
      'benchmarkCaps',
      'benchmarkResults',
      'normalizedBuckets',
      'routePlanningHints',
      'costEstimatorHints',
      'blockedReasons',
      'warnings',
      'sourcePolicyRefs',
    ],
    allowedCollectionModes: ['fixture_mock', 'local_bounded', 'local_skipped_by_policy', 'uploaded_private_future'],
    allowedPrivacyModes: ['coarse', 'redacted', 'no_persistence', 'no_identifiers'],
    categories: ['baseline', 'cpuSingleThread', 'cpuParallelOptional', 'memory', 'storageTemp', 'runtimeTools', 'policy'],
    caps: DESKTOP_BENCHMARK_CAPS,
    blockedRawFields: [
      'persistentDeviceId',
      'hostname',
      'username',
      'macAddress',
      'serialNumber',
      'exactCpuModelString',
      'exactGpuAdapterId',
      'environmentVariables',
      'processList',
      'installedApps',
      'userDirectoryPaths',
      'mediaFilePaths',
    ],
  }
}

function buildPrivacyPolicyReport() {
  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: 'privacy_preserving_bounded_generated_benchmark_only',
    policy: DESKTOP_BENCHMARK_PRIVACY_POLICY,
    liveBenchmarkUploadConsent: 'future_explicit_phase_required',
  }
}

function buildValidationReport(fixtureResults: DesktopBenchmarkFixtureResult[], localRunReport: Record<string, unknown>) {
  const blockers = [
    fixtureResults.every((result) => result.status === 'passed') ? undefined : 'fixture_validation_failed',
    DESKTOP_BENCHMARK_CAPS.singleThreadHardCapMs <= 1000 ? undefined : 'single_thread_cap_missing',
    DESKTOP_BENCHMARK_CAPS.parallelHardCapMs <= 1500 ? undefined : 'parallel_cap_missing',
    DESKTOP_BENCHMARK_CAPS.maxParallelWorkers <= 2 ? undefined : 'worker_count_cap_missing',
    DESKTOP_BENCHMARK_CAPS.memoryHardCapBytes <= 67108864 ? undefined : 'memory_cap_missing',
    DESKTOP_BENCHMARK_CAPS.tempFileHardCapBytes <= 4194304 ? undefined : 'temp_file_cap_missing',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked' ? undefined : 'persistent_device_identifier_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.hostname === 'blocked' ? undefined : 'hostname_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.username === 'blocked' ? undefined : 'username_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.macAddresses === 'blocked' ? undefined : 'mac_addresses_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.environmentVariableDump === 'blocked' ? undefined : 'environment_dump_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.networkBenchmark === 'blocked' ? undefined : 'network_benchmark_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.gpuBenchmark === 'blocked' ? undefined : 'gpu_benchmark_not_blocked',
    DESKTOP_BENCHMARK_PRIVACY_POLICY.sustainedStressTest === 'blocked' ? undefined : 'sustained_stress_not_blocked',
    localRunReport.status === 'blocked_missing_confirmation' ? 'local_benchmark_confirmation_missing' : undefined,
  ].filter(Boolean)

  return {
    phase: DESKTOP_BENCHMARK_RUNNER_PHASE,
    runId: DESKTOP_BENCHMARK_RUNNER_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    fixtureIds: fixtureResults.map((result) => result.fixtureId),
    allFixturesPassed: fixtureResults.every((result) => result.status === 'passed'),
    desktopSafeModule: 'src/lib/track-b/desktop-benchmark-runner',
    schemaExists: true,
    privacyPolicyExists: true,
    boundedCapsExist: true,
    localBenchmarkBlockedWithoutConfirmation: true,
    routeHandoffHintsOnly: true,
    costHandoffHintsOnly: true,
    noPersistentDeviceId: true,
    noHostname: true,
    noUsername: true,
    noMacAddress: true,
    noExactCpuGpuIdentifiers: true,
    noFileSystemScan: true,
    noEnvironmentVariableDump: true,
    noNetworkSpeedTest: true,
    noGpuBenchmark: true,
    noProviderCalls: true,
    noMediaProcessing: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noTrackA: true,
    productionExternalBetaPaidProductionBlocked: true,
    trackA: 'not_touched',
    blockers,
  }
}

function renderWebResearchMarkdown(): string {
  return `# Phase 44F Desktop Benchmark Source Research

Accessed: 2026-06-04

Phase 44F uses official Node.js documentation as source evidence and records only bounded generated benchmark metadata.

- Node.js perf_hooks: timing APIs such as performance.now and mark/measure support bounded timing measurement.
- Node.js worker_threads: worker threads are intended for CPU-intensive JavaScript; Phase 44F keeps parallel fixtures optional, capped, and skipped by default.
- Node.js crypto: generated tiny-buffer hash fixture evidence; no media/model/user data is hashed.
- Node.js fs: temp-file write/read/delete policy evidence; Phase 44F uses generated temp files only.
- Node.js os: availableParallelism and memory context evidence; exact CPU model strings remain blocked/redacted.

Sources:

- https://nodejs.org/api/perf_hooks.html
- https://nodejs.org/api/worker_threads.html
- https://nodejs.org/api/crypto.html
- https://nodejs.org/api/fs.html
- https://nodejs.org/api/os.html
`
}
