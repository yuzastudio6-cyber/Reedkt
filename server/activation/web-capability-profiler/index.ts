import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  WEB_CAPABILITY_BUCKET_POLICY,
  WEB_CAPABILITY_FIXTURES,
  WEB_CAPABILITY_PRIVACY_POLICY,
  WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
  WEB_CAPABILITY_ROUTE_MANIFEST_VERSION,
  buildWebCapabilityRouteHandoff,
  runWebCapabilityFixtures,
} from '../../../src/lib/track-b/web-capability-profiler'
import type { WebCapabilityFixtureResult } from '../../../src/lib/track-b/web-capability-profiler'
import type { WebCapabilityProfilerReports } from './web-capability-profiler-types'

export const WEB_CAPABILITY_PROFILER_PHASE = '44D'
export const WEB_CAPABILITY_PROFILER_RUN_ID = 'phase44d-web-capability-profiler-20260604'
export const WEB_CAPABILITY_PROFILER_BRANCH = 'codex/rp-activation-44d-web-capability-profiler'
export const WEB_CAPABILITY_PROFILER_BASE_BRANCH = 'codex/rp-activation-44i-trackb-tool-route-manifest-integration'
export const WEB_CAPABILITY_PROFILER_REPORT_DIR = 'docs/activation-phase-44d-web-capability-profiler-reports'

export const WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS = [
  'phase_44d_web_capability_profiler_plan.json',
  'phase_44d_web_capability_source_evidence.json',
  'phase_44d_web_capability_web_research.md',
  'phase_44d_web_capability_profile_schema.json',
  'phase_44d_web_capability_privacy_policy.json',
  'phase_44d_web_capability_bucket_policy.json',
  'phase_44d_web_capability_fixture_manifest.json',
  'phase_44d_web_capability_fixture_results.json',
  'phase_44d_web_capability_validation_report.json',
  'phase_44d_web_capability_route_handoff.json',
  'phase_44d_web_capability_blocker_report.json',
  'phase_44d_web_capability_readiness_report.json',
  'phase_44d_private_artifact_manifest.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'desktop capability profiler',
  'local worker sidecar',
  'cost estimator',
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
  'web search providers',
  'network benchmarks',
  'live browser profile upload',
  'persistent device identifiers',
  'raw full user agent persistence',
  'exact screen resolution persistence',
  'detailed GPU adapter identity persistence',
  'public artifacts',
  'public output',
  'broad media',
  'arbitrary media input',
  'product-wide internal beta',
  'external beta',
  'paid production',
  'production',
  'Track A runtime/visual/render stack',
]

export function getWebCapabilityProfilerPlan() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    branch: WEB_CAPABILITY_PROFILER_BRANCH,
    baseBranch: WEB_CAPABILITY_PROFILER_BASE_BRANCH,
    sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
    sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
    mode: 'safe_metadata_only_generated_fixtures',
    profileSchemaVersion: WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
    routeManifestVersion: WEB_CAPABILITY_ROUTE_MANIFEST_VERSION,
    browserSafeModule: 'src/lib/track-b/web-capability-profiler',
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_WEB_CAPABILITY_PROFILER',
    noLiveBrowserUpload: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noProviders: true,
    noDockerCloudGpuIamMutation: true,
    noBetaProductionUnlock: true,
    trackA: 'not_touched',
    reportDir: WEB_CAPABILITY_PROFILER_REPORT_DIR,
    expectedReports: WEB_CAPABILITY_PROFILER_EXPECTED_REPORTS,
    nextRecommendedPhase: 'Phase 44E desktop capability profiler unless roadmap priority selects Phase 44H cost estimator first.',
  }
}

export function getWebCapabilityProfilerIamPlan() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    liveProfileUpload: 'blocked_until_future_explicit_phase',
    notes: [
      'Phase 44D writes committed safe metadata reports only.',
      'No GCP bucket, IAM binding, service-account key, Cloud Run, Cloud Build, public principal, or upload path is used.',
    ],
  }
}

export function getWebCapabilityProfilerCostSummary() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    costEstimator: 'Phase 44H remains pending',
    costDrivers: ['local TypeScript report generation only'],
    noNetworkBenchmark: true,
    noLiveBrowserBenchmark: true,
    noProviderCalls: true,
    noCloudRuntime: true,
  }
}

export async function writeWebCapabilityProfilerArtifacts(reportDir = WEB_CAPABILITY_PROFILER_REPORT_DIR): Promise<void> {
  const reports = buildWebCapabilityProfilerReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_profiler_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44d_web_capability_web_research.md'), reports.webResearchMarkdown)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_profile_schema.json'), reports.profileSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_privacy_policy.json'), reports.privacyPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_bucket_policy.json'), reports.bucketPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_fixture_results.json'), reports.fixtureResults)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_route_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_web_capability_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44d_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readWebCapabilityProfilerSummary() {
  const reports = buildWebCapabilityProfilerReports()
  const validationReport = reports.validationReport as { status?: string }
  const readinessReport = reports.readinessReport as { webCapabilityProfilerStatus?: string }
  const fixtureResults = reports.fixtureResults as { fixtures?: WebCapabilityFixtureResult[] }
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: validationReport.status,
    webCapabilityProfilerStatus: readinessReport.webCapabilityProfilerStatus,
    fixtureCount: fixtureResults.fixtures?.length ?? 0,
    liveBrowserUpload: 'blocked',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildWebCapabilityProfilerReports(): WebCapabilityProfilerReports {
  const fixtureResults = runWebCapabilityFixtures(WEB_CAPABILITY_FIXTURES)
  const validationReport = buildValidationReport(fixtureResults)
  const firstFixtureHandoff = buildWebCapabilityRouteHandoff(fixtureResults[0].profile)
  const status = validationReport.status
  return {
    plan: getWebCapabilityProfilerPlan(),
    sourceEvidence: buildSourceEvidence(),
    profileSchema: buildProfileSchema(),
    privacyPolicy: buildPrivacyPolicyReport(),
    bucketPolicy: buildBucketPolicyReport(),
    fixtureManifest: {
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status: 'generated_mock_fixtures_only',
      fixtures: WEB_CAPABILITY_FIXTURES.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        description: fixture.description,
        expectedHints: fixture.expectedHints,
        expectedWarnings: fixture.expectedWarnings,
        expectedBlockedReasons: fixture.expectedBlockedReasons,
      })),
    },
    fixtureResults: {
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status,
      fixtures: fixtureResults,
    },
    validationReport,
    routeHandoff: {
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status: 'hints_only_route_execution_blocked',
      sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
      routeManifestVersion: WEB_CAPABILITY_ROUTE_MANIFEST_VERSION,
      webCapabilityProfilerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      handoffExample: firstFixtureHandoff,
      routeHints: [
        'prefer_server_worker',
        'browser_preview_metadata_possible',
        'browser_image_metadata_possible',
        'webgpu_present_but_unapproved',
        'webcodecs_present_but_media_processing_blocked',
        'low_storage_avoid_browser_processing',
        'cross_origin_isolation_required_for_threads',
        'unknown_capability_fail_closed',
      ],
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
      toolChoiceAuthority: 'planner_and_future_route_gate_only',
      browserProfilingCannotOverrideBlockedRoutes: true,
      costEstimatorRequired: 'Phase 44H',
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
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status: status === 'passed' ? 'no_phase_44d_blockers' : 'blocked',
      blockers: validationReport.blockers,
      globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    },
    readinessReport: {
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status,
      webCapabilityProfilerStatus: status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
      browserSafeModule: 'added',
      serverActivationModule: 'added',
      schema: status,
      privacyPolicy: status,
      fixtureCoverage: status,
      liveBrowserProfiling: 'not_run',
      liveProfileUpload: 'not_run',
      routeExecution: 'blocked',
      workerExecution: 'blocked',
      desktopCapabilityProfiler: 'pending',
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
      nextRecommendedPhase: 'Phase 44E desktop capability profiler unless roadmap priority selects Phase 44H cost estimator first.',
    },
    privateArtifactManifest: {
      phase: WEB_CAPABILITY_PROFILER_PHASE,
      runId: WEB_CAPABILITY_PROFILER_RUN_ID,
      status: 'not_required_metadata_committed_only',
      privateUpload: 'not_run',
      privateRead: 'not_run',
      objectCount: 0,
      noPrivatePayloadsCommitted: true,
    },
    iamPlan: getWebCapabilityProfilerIamPlan(),
    costSummary: getWebCapabilityProfilerCostSummary(),
    webResearchMarkdown: renderWebResearchMarkdown(),
  }
}

function buildSourceEvidence() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    accessedAt: '2026-06-04',
    status: 'official_sources_recorded',
    sources: [
      source('WebCodecs API', 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API', 'MDN documents browser audio/video encode/decode APIs and Dedicated Worker availability; Phase 44D records availability only and does not process media.'),
      source('WebGPU API', 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API', 'MDN documents WebGPU as limited availability; Phase 44D treats presence as unapproved planning metadata only.'),
      source('GPU.requestAdapter', 'https://developer.mozilla.org/docs/Web/API/GPU/requestAdapter', 'MDN marks requestAdapter as secure-context dependent and limited availability; Phase 44D does not persist adapter vendor/device details.'),
      source('SharedArrayBuffer', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer', 'MDN documents cross-origin isolation requirements for shared memory; Phase 44D warns when isolation is missing.'),
      source('Navigator.hardwareConcurrency', 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency', 'MDN documents logical processor count; Phase 44D buckets the value and never stores exact values.'),
      source('Navigator.deviceMemory', 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory', 'MDN documents approximate memory; Phase 44D buckets the value and treats absence as unknown.'),
      source('StorageManager.estimate', 'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate', 'MDN documents approximate usage/quota estimates; Phase 44D buckets estimates and does not request persistence.'),
      source('OffscreenCanvas', 'https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas', 'MDN documents off-main-thread canvas capability; Phase 44D records availability only.'),
      source('Network Information API', 'https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API', 'MDN documents coarse connection information with limited support; Phase 44D records optional coarse values only and performs no speed test.'),
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
    decisionImpact: 'coarse_availability_metadata_only_no_execution',
  }
}

function buildProfileSchema() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    schemaVersion: WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
    requiredFields: [
      'schemaVersion',
      'generatedAt',
      'collectionMode',
      'privacyMode',
      'capabilityBuckets',
      'routePlanningHints',
      'blockedReasons',
      'warnings',
      'unsupportedApis',
      'sourcePolicyRefs',
    ],
    allowedCollectionModes: ['fixture_mock', 'live_browser_local_only', 'uploaded_private_future'],
    allowedPrivacyModes: ['coarse', 'no_persistence', 'no_identifiers'],
    capabilityCategories: ['environment', 'compute', 'graphics', 'media', 'storage', 'network', 'policy'],
    blockedRawFields: ['persistentDeviceId', 'rawUserAgent', 'exactScreenResolution', 'gpuAdapterVendor', 'gpuAdapterDevice', 'ipAddress'],
  }
}

function buildPrivacyPolicyReport() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: 'privacy_preserving_coarse_session_profile_only',
    policy: WEB_CAPABILITY_PRIVACY_POLICY,
    liveProfileUploadConsent: 'future_explicit_phase_required',
  }
}

function buildBucketPolicyReport() {
  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: 'coarse_buckets_only',
    policy: WEB_CAPABILITY_BUCKET_POLICY,
  }
}

function buildValidationReport(fixtureResults: WebCapabilityFixtureResult[]) {
  const blockers = [
    fixtureResults.every((result) => result.status === 'passed') ? undefined : 'fixture_validation_failed',
    WEB_CAPABILITY_PRIVACY_POLICY.persistentDeviceIdentifier === 'blocked' ? undefined : 'persistent_device_identifier_not_blocked',
    WEB_CAPABILITY_PRIVACY_POLICY.rawFullUserAgent === 'blocked' ? undefined : 'raw_user_agent_not_blocked',
    WEB_CAPABILITY_PRIVACY_POLICY.exactScreenResolution === 'blocked' ? undefined : 'exact_screen_resolution_not_blocked',
    WEB_CAPABILITY_PRIVACY_POLICY.detailedGpuAdapterVendorDevice === 'blocked' ? undefined : 'detailed_gpu_identity_not_blocked',
    WEB_CAPABILITY_PRIVACY_POLICY.networkSpeedTest === 'blocked' ? undefined : 'network_speed_test_not_blocked',
  ].filter(Boolean)

  return {
    phase: WEB_CAPABILITY_PROFILER_PHASE,
    runId: WEB_CAPABILITY_PROFILER_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    fixtureCount: fixtureResults.length,
    fixtureIds: fixtureResults.map((result) => result.fixtureId),
    allFixturesPassed: fixtureResults.every((result) => result.status === 'passed'),
    browserSafeModule: 'src/lib/track-b/web-capability-profiler',
    schemaExists: true,
    privacyPolicyExists: true,
    routeHandoffHintsOnly: true,
    noPersistentDeviceId: true,
    noRawUserAgentStorage: true,
    noExactScreenResolution: true,
    noDetailedGpuIdentity: true,
    noNetworkSpeedTest: true,
    noProviderCalls: true,
    noMediaProcessing: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    productionExternalBetaPaidProductionBlocked: true,
    trackA: 'not_touched',
    blockers,
  }
}

function renderWebResearchMarkdown(): string {
  return `# Phase 44D Web Capability Source Research

Accessed: 2026-06-04

Phase 44D uses official browser API documentation as source evidence and records only coarse availability metadata.

- MDN WebCodecs: browser encode/decode API evidence; media processing remains blocked.
- MDN WebGPU and GPU.requestAdapter: secure-context and limited-availability evidence; adapter identity is redacted.
- MDN SharedArrayBuffer: shared memory requires cross-origin isolation for usable worker sharing.
- MDN hardwareConcurrency and deviceMemory: values are bucketed and exact values are not persisted.
- MDN StorageManager.estimate: quota/usage estimates are approximate and bucketed; persistence is not requested.
- MDN OffscreenCanvas: availability is recorded only.
- MDN Network Information API: optional coarse connection data only; no speed test or endpoint ping.

Sources:

- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- https://developer.mozilla.org/docs/Web/API/GPU/requestAdapter
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
`
}
