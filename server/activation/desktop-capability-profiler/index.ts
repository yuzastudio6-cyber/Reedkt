import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  DESKTOP_CAPABILITY_FIXTURES,
  DESKTOP_CAPABILITY_PRIVACY_POLICY,
  DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
  DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION,
  buildDesktopCapabilityRouteHandoff,
  collectDesktopCapabilityProfile,
  runDesktopCapabilityFixtures,
} from '../../../src/lib/track-b/desktop-capability-profiler'
import type {
  DesktopCapabilityFixtureResult,
  RawDesktopCapabilitySignals,
} from '../../../src/lib/track-b/desktop-capability-profiler'
import type { DesktopCapabilityProfilerReports } from './desktop-capability-profiler-types'

export const DESKTOP_CAPABILITY_PROFILER_PHASE = '44E'
export const DESKTOP_CAPABILITY_PROFILER_RUN_ID = 'phase44e-desktop-capability-profiler-20260604'
export const DESKTOP_CAPABILITY_PROFILER_BRANCH = 'codex/rp-activation-44e-desktop-capability-profiler'
export const DESKTOP_CAPABILITY_PROFILER_BASE_BRANCH = 'codex/rp-activation-44d-web-capability-profiler'
export const DESKTOP_CAPABILITY_PROFILER_REPORT_DIR = 'docs/activation-phase-44e-desktop-capability-profiler-reports'

export const DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS = [
  'phase_44e_desktop_capability_profiler_plan.json',
  'phase_44e_desktop_capability_source_evidence.json',
  'phase_44e_desktop_capability_web_research.md',
  'phase_44e_desktop_capability_profile_schema.json',
  'phase_44e_desktop_capability_privacy_policy.json',
  'phase_44e_desktop_capability_bucket_policy.json',
  'phase_44e_desktop_capability_fixture_manifest.json',
  'phase_44e_desktop_capability_fixture_results.json',
  'phase_44e_desktop_capability_validation_report.json',
  'phase_44e_desktop_capability_local_profile_report.json',
  'phase_44e_desktop_capability_route_handoff.json',
  'phase_44e_desktop_capability_blocker_report.json',
  'phase_44e_desktop_capability_readiness_report.json',
  'phase_44e_private_artifact_manifest.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'Phase 44F desktop benchmark runner',
  'Phase 44G local worker sidecar',
  'Phase 44H cost estimator',
  'Phase 44J hybrid E2E simulation',
  'route execution',
  'worker execution',
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
  'network speed tests',
  'heavy CPU/GPU benchmarks',
  'live desktop profile upload',
  'persistent device identifiers',
  'hostname collection',
  'username collection',
  'MAC address collection',
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

export function getDesktopCapabilityProfilerPlan() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    branch: DESKTOP_CAPABILITY_PROFILER_BRANCH,
    baseBranch: DESKTOP_CAPABILITY_PROFILER_BASE_BRANCH,
    sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
    sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
    sourcePr167: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167',
    mode: 'safe_metadata_only_generated_fixtures',
    profileSchemaVersion: DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
    routeManifestVersion: DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION,
    desktopSafeModule: 'src/lib/track-b/desktop-capability-profiler',
    serverActivationModule: 'server/activation/desktop-capability-profiler',
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_PROFILER',
    optionalLocalProfileConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_LOCAL_PROFILE',
    localProfileDefault: 'skipped_by_policy',
    noLiveProfileUpload: true,
    noLocalPersistenceByDefault: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noBenchmarks: true,
    noTrackA: true,
    noElectronOrTauriAdded: true,
    reportDir: DESKTOP_CAPABILITY_PROFILER_REPORT_DIR,
    expectedReports: DESKTOP_CAPABILITY_PROFILER_EXPECTED_REPORTS,
    nextRecommendedPhase: 'Phase 44F desktop benchmark runner or Phase 44H cost estimator depending roadmap priority.',
  }
}

export function getDesktopCapabilityProfilerIamPlan() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    liveProfileUpload: 'blocked_until_future_explicit_phase',
    notes: [
      'Phase 44E writes committed safe metadata reports only.',
      'No GCP bucket, IAM binding, service-account key, Cloud Run, Cloud Build, public principal, or upload path is used.',
    ],
  }
}

export function getDesktopCapabilityProfilerCostSummary() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    costEstimator: 'Phase 44H remains pending',
    costDrivers: ['local TypeScript report generation only'],
    noNetworkBenchmark: true,
    noCpuGpuBenchmark: true,
    noProviderCalls: true,
    noCloudRuntime: true,
  }
}

export async function writeDesktopCapabilityProfilerArtifacts(
  reportDir = DESKTOP_CAPABILITY_PROFILER_REPORT_DIR,
  options: { includeLocalProfile?: boolean } = {},
): Promise<void> {
  const reports = buildDesktopCapabilityProfilerReports(options)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_profiler_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44e_desktop_capability_web_research.md'), reports.webResearchMarkdown)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_profile_schema.json'), reports.profileSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_privacy_policy.json'), reports.privacyPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_bucket_policy.json'), reports.bucketPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_fixture_results.json'), reports.fixtureResults)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_local_profile_report.json'), reports.localProfileReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_route_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_desktop_capability_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44e_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readDesktopCapabilityProfilerSummary() {
  const reports = buildDesktopCapabilityProfilerReports()
  const validationReport = reports.validationReport as { status?: string }
  const readinessReport = reports.readinessReport as { desktopCapabilityProfilerStatus?: string }
  const fixtureResults = reports.fixtureResults as { fixtures?: DesktopCapabilityFixtureResult[] }
  const localProfile = reports.localProfileReport as { status?: string }
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: validationReport.status,
    desktopCapabilityProfilerStatus: readinessReport.desktopCapabilityProfilerStatus,
    fixtureCount: fixtureResults.fixtures?.length ?? 0,
    localProfile: localProfile.status,
    liveProfileUpload: 'blocked',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildDesktopCapabilityProfilerReports(
  options: { includeLocalProfile?: boolean } = {},
): DesktopCapabilityProfilerReports {
  const fixtureResults = runDesktopCapabilityFixtures(DESKTOP_CAPABILITY_FIXTURES)
  const localProfileReport = buildLocalProfileReport(options.includeLocalProfile === true)
  const validationReport = buildValidationReport(fixtureResults, localProfileReport)
  const firstFixtureHandoff = buildDesktopCapabilityRouteHandoff(fixtureResults[0].profile)
  const status = validationReport.status
  return {
    plan: getDesktopCapabilityProfilerPlan(),
    sourceEvidence: buildSourceEvidence(),
    profileSchema: buildProfileSchema(),
    privacyPolicy: buildPrivacyPolicyReport(),
    bucketPolicy: buildBucketPolicyReport(),
    fixtureManifest: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: 'generated_mock_fixtures_only',
      fixtures: DESKTOP_CAPABILITY_FIXTURES.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        description: fixture.description,
        expectedHints: fixture.expectedHints,
        expectedWarnings: fixture.expectedWarnings,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
    },
    fixtureResults: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status,
      fixtures: fixtureResults,
    },
    validationReport,
    localProfileReport,
    routeHandoff: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: 'hints_only_route_execution_blocked',
      sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
      sourcePr167: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167',
      routeManifestVersion: DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION,
      desktopCapabilityProfilerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      handoffExample: firstFixtureHandoff,
      routeHints: [
        'local_processing_candidate_but_execution_blocked',
        'server_worker_preferred',
        'desktop_route_possible_future',
        'media_extraction_blocked_ffmpeg_unavailable',
        'renderer_sandbox_requires_main_process_bridge',
        'low_resource_avoid_local_heavy_processing',
        'unknown_capability_fail_closed',
      ],
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
      toolChoiceAuthority: 'planner_and_future_route_gate_only',
      desktopProfilingCannotOverrideBlockedRoutes: true,
      costEstimatorRequired: 'Phase 44H',
      desktopBenchmarkRunnerRequired: 'Phase 44F',
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
    blockerReport: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: status === 'passed' ? 'no_phase_44e_blockers' : 'blocked',
      blockers: validationReport.blockers,
      globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    },
    readinessReport: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status,
      desktopCapabilityProfilerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      desktopSafeModule: 'added',
      serverActivationModule: 'added',
      schema: status,
      privacyPolicy: status,
      fixtureCoverage: status,
      localProfileCollection: localProfileReport.status,
      liveProfileUpload: 'not_run',
      routeExecution: 'blocked',
      workerExecution: 'blocked',
      desktopBenchmarkRunner: 'pending',
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
      nextRecommendedPhase: 'Phase 44F desktop benchmark runner or Phase 44H cost estimator depending roadmap priority.',
    },
    privateArtifactManifest: {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: 'not_required_metadata_committed_only',
      privateUpload: 'not_run',
      privateRead: 'not_run',
      objectCount: 0,
      noPrivatePayloadsCommitted: true,
      liveDesktopProfilePersisted: false,
    },
    iamPlan: getDesktopCapabilityProfilerIamPlan(),
    costSummary: getDesktopCapabilityProfilerCostSummary(),
    webResearchMarkdown: renderWebResearchMarkdown(),
  }
}

function buildLocalProfileReport(includeLocalProfile: boolean): Record<string, unknown> {
  if (!includeLocalProfile) {
    return {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: 'skipped_by_policy',
      reason: 'optional_local_profile_collection_not_confirmed',
      requiredConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_LOCAL_PROFILE=true',
      liveProfileUpload: 'blocked',
      localPersistence: 'blocked',
    }
  }
  if (process.env.REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_LOCAL_PROFILE !== 'true') {
    return {
      phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
      runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
      status: 'blocked_missing_confirmation',
      requiredConfirmation: 'REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_LOCAL_PROFILE=true',
      liveProfileUpload: 'blocked',
      localPersistence: 'blocked',
    }
  }

  const rawSignals: RawDesktopCapabilitySignals = {
    runtimeKind: 'node_only',
    osPlatform: process.platform,
    osArch: process.arch,
    packagedAppStatus: 'dev',
    availableParallelism: typeof os.availableParallelism === 'function' ? os.availableParallelism() : undefined,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    cpuArchitecture: process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : 'other',
    processCpuUsageAvailable: typeof process.cpuUsage === 'function',
    ffmpegAvailable: commandAvailable('ffmpeg', ['-version']),
    ffprobeAvailable: commandAvailable('ffprobe', ['-version']),
    pythonAvailable: commandAvailable('python3', ['--version']),
    sharpAvailable: 'unknown',
    nodeVersionMajor: Number.parseInt(process.versions.node.split('.')[0] ?? '', 10),
    tempDirWritable: tempDirWritable(),
    estimatedFreeDiskBytes: undefined,
  }
  const profile = collectDesktopCapabilityProfile(rawSignals)
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: 'collected_session_only_redacted',
    profile,
    noHostname: true,
    noUsername: true,
    noMacAddress: true,
    noEnvironmentDump: true,
    noDirectoryScan: true,
    noNetworkSpeedTest: true,
    noPersistence: true,
    liveProfileUpload: 'blocked',
  }
}

function commandAvailable(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { stdio: 'ignore' })
  return result.status === 0
}

function tempDirWritable(): boolean {
  const dir = path.join(os.tmpdir(), `reeditpro-phase44e-${Date.now()}`)
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'probe.txt'), 'ok')
    return true
  } catch {
    return false
  } finally {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }
}

function buildSourceEvidence() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    accessedAt: '2026-06-04',
    status: 'official_sources_recorded',
    sources: [
      source('Node.js os.availableParallelism', 'https://nodejs.org/api/os.html#osavailableparallelism', 'Official Node.js OS API for recommended parallelism metadata; Phase 44E buckets the value and does not benchmark.'),
      source('Node.js os.totalmem', 'https://nodejs.org/api/os.html#ostotalmem', 'Official Node.js OS API for total memory in bytes; Phase 44E stores only coarse buckets.'),
      source('Node.js os.freemem', 'https://nodejs.org/api/os.html#osfreemem', 'Official Node.js OS API for free memory in bytes; Phase 44E stores only coarse buckets.'),
      source('Node.js os.arch', 'https://nodejs.org/api/os.html#osarch', 'Official Node.js OS API for compiled architecture; Phase 44E stores architecture buckets only.'),
      source('Node.js os.machine', 'https://nodejs.org/api/os.html#osmachine', 'Official Node.js OS API for machine type; Phase 44E treats this as future optional coarse evidence only.'),
      source('Node.js os.cpus caution', 'https://nodejs.org/api/os.html#oscpus', 'Official Node.js docs caution against using os.cpus().length for parallelism; Phase 44E avoids exact CPU model persistence.'),
      source('Electron process API', 'https://www.electronjs.org/docs/latest/api/process', 'Official Electron process metadata source for future coarse Electron context detection; Phase 44E does not require Electron.'),
      source('Electron process sandboxing', 'https://www.electronjs.org/docs/latest/tutorial/sandbox', 'Official Electron sandboxing guidance; Phase 44E treats sandboxed renderers as requiring a future main-process bridge.'),
    ],
    tauriEvidence: 'not_recorded_repo_has_no_tauri_stack',
  }
}

function source(name: string, url: string, summary: string) {
  return {
    name,
    url,
    evidenceType: 'official_documentation',
    accessedAt: '2026-06-04',
    summary,
    decisionImpact: 'coarse_desktop_capability_metadata_only_no_execution',
    privacyCaveat: 'bucket_or_redact_values_no_identifier_persistence',
  }
}

function buildProfileSchema() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    schemaVersion: DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
    requiredFields: [
      'schemaVersion',
      'generatedAt',
      'collectionMode',
      'privacyMode',
      'capabilityBuckets',
      'routePlanningHints',
      'blockedReasons',
      'warnings',
      'sourcePolicyRefs',
    ],
    allowedCollectionModes: ['fixture_mock', 'local_profile_session_only', 'local_profile_skipped_by_policy', 'uploaded_private_future'],
    allowedPrivacyModes: ['coarse', 'redacted', 'no_persistence', 'no_identifiers'],
    capabilityCategories: ['environment', 'compute', 'graphics', 'mediaRuntime', 'storage', 'policy'],
    blockedRawFields: [
      'persistentDeviceId',
      'hostname',
      'username',
      'macAddress',
      'networkInterfaces',
      'exactCpuModelString',
      'exactGpuAdapterId',
      'environmentVariables',
      'processList',
      'installedApps',
      'pathList',
    ],
  }
}

function buildPrivacyPolicyReport() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: 'privacy_preserving_coarse_session_profile_only',
    policy: DESKTOP_CAPABILITY_PRIVACY_POLICY,
    liveProfileUploadConsent: 'future_explicit_phase_required',
  }
}

function buildBucketPolicyReport() {
  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: 'coarse_buckets_only',
    buckets: {
      environment: ['runtimeKind', 'osPlatformBucket', 'osArchBucket', 'packagedAppStatus', 'sandboxedRenderer', 'contextIsolation'],
      compute: ['availableParallelismBucket', 'totalMemoryBucket', 'freeMemoryBucket', 'cpuArchitecture', 'cpuModelClass'],
      graphics: ['gpuInfoAvailable', 'gpuClass', 'webgpuDesktopAvailable'],
      mediaRuntime: ['ffmpegAvailable', 'ffprobeAvailable', 'sharpAvailable', 'pythonAvailable', 'nodeVersionBucket', 'electronVersionBucket'],
      storage: ['tempDirWritable', 'estimatedFreeDiskBucket'],
      policy: ['privacyRiskLevel', 'fingerprintingRiskLevel', 'allowedForRoutePlanning', 'allowedForWorkerExecution', 'allowedForCostEstimator'],
    },
    rawIdentifiers: 'blocked',
    exactValues: 'redacted_or_bucketed',
  }
}

function buildValidationReport(fixtureResults: DesktopCapabilityFixtureResult[], localProfileReport: Record<string, unknown>) {
  const blockers = [
    fixtureResults.every((result) => result.status === 'passed') ? undefined : 'fixture_validation_failed',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked' ? undefined : 'persistent_device_identifier_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.hostname === 'blocked' ? undefined : 'hostname_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.username === 'blocked' ? undefined : 'username_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.macAddresses === 'blocked' ? undefined : 'mac_addresses_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.environmentVariableDump === 'blocked' ? undefined : 'environment_dump_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.directoryScanning === 'blocked' ? undefined : 'directory_scanning_not_blocked',
    DESKTOP_CAPABILITY_PRIVACY_POLICY.networkSpeedTest === 'blocked' ? undefined : 'network_speed_test_not_blocked',
    localProfileReport.status === 'blocked_missing_confirmation' ? 'local_profile_confirmation_missing' : undefined,
  ].filter(Boolean)

  return {
    phase: DESKTOP_CAPABILITY_PROFILER_PHASE,
    runId: DESKTOP_CAPABILITY_PROFILER_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    fixtureIds: fixtureResults.map((result) => result.fixtureId),
    allFixturesPassed: fixtureResults.every((result) => result.status === 'passed'),
    desktopSafeModule: 'src/lib/track-b/desktop-capability-profiler',
    schemaExists: true,
    privacyPolicyExists: true,
    routeHandoffHintsOnly: true,
    noPersistentDeviceId: true,
    noHostname: true,
    noUsername: true,
    noMacAddress: true,
    noNetworkInterfaceRawData: true,
    noExactCpuModelString: true,
    noExactGpuIdentity: true,
    noFileSystemScan: true,
    noEnvironmentVariableDump: true,
    noNetworkSpeedTest: true,
    noHeavyBenchmarks: true,
    noProviderCalls: true,
    noMediaProcessing: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noElectronOrTauriAdded: true,
    productionExternalBetaPaidProductionBlocked: true,
    trackA: 'not_touched',
    blockers,
  }
}

function renderWebResearchMarkdown(): string {
  return `# Phase 44E Desktop Capability Source Research

Accessed: 2026-06-04

Phase 44E uses official Node.js and Electron documentation as source evidence and records only coarse capability metadata. The repository does not currently use Electron or Tauri as an app shell, so Electron is future-supported evidence only and Tauri evidence is not required for this phase.

- Node.js \`os.availableParallelism()\`: recommended parallelism metadata; Phase 44E buckets the value and does not benchmark.
- Node.js \`os.totalmem()\` and \`os.freemem()\`: memory evidence; Phase 44E stores only coarse memory buckets.
- Node.js \`os.arch()\` and \`os.machine()\`: architecture/machine evidence; Phase 44E stores architecture buckets and treats machine detail as future optional coarse evidence only.
- Node.js \`os.cpus()\`: official docs include CPU details and caution against using CPU count as parallelism; Phase 44E avoids exact CPU model persistence.
- Electron process docs and sandbox docs: future Electron support should keep renderer profiles coarse and use a main-process bridge for sandboxed renderer contexts. Phase 44E does not add Electron.

Sources:

- https://nodejs.org/api/os.html#osavailableparallelism
- https://nodejs.org/api/os.html#ostotalmem
- https://nodejs.org/api/os.html#osfreemem
- https://nodejs.org/api/os.html#osarch
- https://nodejs.org/api/os.html#osmachine
- https://nodejs.org/api/os.html#oscpus
- https://www.electronjs.org/docs/latest/api/process
- https://www.electronjs.org/docs/latest/tutorial/sandbox
`
}
