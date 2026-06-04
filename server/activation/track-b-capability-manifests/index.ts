import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type { TrackBCapabilityReports, TrackBToolId } from './track-b-capability-manifest-types'
import {
  TRACK_B_CAPABILITY_MANIFESTS,
  TRACK_B_CAPABILITY_STATUSES,
  TRACK_B_TOOL_IDS,
} from './track-b-tool-registry'

export const TRACK_B_CAPABILITY_MANIFEST_PHASE = '44I-A'
export const TRACK_B_CAPABILITY_MANIFEST_RUN_ID = 'phase44ia-trackb-capability-manifest-baseline-20260604'
export const TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR = 'docs/activation-track-b-capability-manifests-reports'
export const TRACK_B_CAPABILITY_MANIFEST_BRANCH = 'codex/rp-trackb-capability-manifest-baseline'
export const TRACK_B_CAPABILITY_MANIFEST_BASE_BRANCH = 'codex/rp-activation-36m-audio-timing-internal-beta-readiness-gate'

export const TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS = [
  'track_b_capability_manifest_plan.json',
  'track_b_tool_registry.json',
  'track_b_capability_manifests.json',
  'track_b_initial_internal_testing_manifest.json',
  'track_b_blocked_capabilities_manifest.json',
  'track_b_consumer_boundary_manifest.json',
  'track_b_runtime_requirements_manifest.json',
  'track_b_artifact_policy_manifest.json',
  'track_b_cost_capacity_manifest.json',
  'track_b_test_command_manifest.json',
  'track_b_route_manifest_handoff.json',
  'track_b_readiness_summary.json',
  'track_b_manifest_validation_report.json',
  'track_b_capability_manifest_report.json',
  'track_b_private_artifact_manifest.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'production',
  'paid production',
  'product-wide internal beta',
  'external beta',
  'broad media',
  'arbitrary media input',
  'public artifacts',
  'public output',
  'provider calls',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'model downloads',
  'media/audio/OCR/VLM runtime execution',
  'IAM/GCP mutation',
  'raw chat execution',
  'frontend service-role secrets',
  'Track A runtime/visual/render stack',
]

export function getTrackBCapabilityManifestPlan() {
  return {
    phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
    runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
    branch: TRACK_B_CAPABILITY_MANIFEST_BRANCH,
    baseBranch: TRACK_B_CAPABILITY_MANIFEST_BASE_BRANCH,
    sourcePr159: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/159',
    mode: 'reporting_manifest_only',
    purpose: 'Track B restricted internal testing eligibility baseline, separate from production tool registry and production routing.',
    canonicalToolIds: TRACK_B_TOOL_IDS,
    statusVocabulary: TRACK_B_CAPABILITY_STATUSES,
    noRuntimeExecution: true,
    noMediaProcessing: true,
    noModelDownloads: true,
    noProviderCalls: true,
    noDockerCloudGpuIamMutation: true,
    noBetaOrProductionUnlock: true,
    trackA: 'not_touched',
    reportDir: TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR,
    nextRequiredPhase: 'Phase 44I actual tool route manifest integration remains pending.',
  }
}

export function getTrackBCapabilityManifestIamPlan() {
  return {
    phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
    runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    notes: [
      'This phase writes committed metadata reports only.',
      'No bucket creation, IAM binding, service-account key, public principal, Cloud Run, Cloud Build, or GCP mutation is part of Phase 44I-A.',
    ],
  }
}

export function getTrackBCapabilityManifestCostSummary() {
  return {
    phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
    runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
    status: 'metadata_only_zero_cloud_runtime_cost',
    estimatedCloudCostUsd: 0,
    costDrivers: ['local TypeScript report generation only'],
    noDocker: true,
    noCloudBuild: true,
    noCloudRun: true,
    noGpuJobs: true,
    noMediaRuntime: true,
    noProviderCalls: true,
  }
}

export async function writeTrackBCapabilityManifestArtifacts(reportDir = TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR): Promise<void> {
  const reports = buildTrackBCapabilityReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_capability_manifest_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_tool_registry.json'), reports.toolRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_capability_manifests.json'), reports.combinedManifests)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_initial_internal_testing_manifest.json'), reports.initialInternalTestingManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_blocked_capabilities_manifest.json'), reports.blockedCapabilities)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_consumer_boundary_manifest.json'), reports.consumerBoundaries)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_runtime_requirements_manifest.json'), reports.runtimeRequirements)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_artifact_policy_manifest.json'), reports.artifactPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_cost_capacity_manifest.json'), reports.costCapacity)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_test_command_manifest.json'), reports.testCommands)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_manifest_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_readiness_summary.json'), reports.readinessSummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_manifest_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_capability_manifest_report.json'), reports.capabilityManifestReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'track_b_capability_manifest_report.md'), renderCapabilityReportMarkdown(reports))

  for (const [toolId, manifest] of Object.entries(reports.perTool) as Array<[TrackBToolId, typeof reports.perTool[TrackBToolId]]>) {
    await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'tool-manifests', `${toolId}.json`), manifest)
  }
}

export function buildTrackBCapabilityReports(): TrackBCapabilityReports {
  const perTool = Object.fromEntries(TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => [manifest.toolId, manifest])) as TrackBCapabilityReports['perTool']
  const included = TRACK_B_CAPABILITY_MANIFESTS.filter((manifest) => manifest.initialInternalTestingGroup === 'included')
  const excluded = TRACK_B_CAPABILITY_MANIFESTS.filter((manifest) => manifest.initialInternalTestingGroup === 'excluded')
  const notStarted = TRACK_B_CAPABILITY_MANIFESTS.filter((manifest) => manifest.initialInternalTestingGroup === 'not_started')
  const validation = buildValidationReport()

  return {
    plan: getTrackBCapabilityManifestPlan(),
    toolRegistry: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      canonicalToolIds: TRACK_B_TOOL_IDS,
      tools: TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => ({
        toolId: manifest.toolId,
        displayName: manifest.displayName,
        family: manifest.family,
        status: manifest.status,
        initialInternalTestingGroup: manifest.initialInternalTestingGroup,
      })),
    },
    combinedManifests: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      manifests: TRACK_B_CAPABILITY_MANIFESTS,
    },
    initialInternalTestingManifest: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      includedRestrictedInternalReady: included.map((manifest) => manifest.toolId),
      excludedBlocked: excluded.map((manifest) => manifest.toolId),
      notStarted: notStarted.map((manifest) => manifest.toolId),
      compositeExclusions: [
        {
          id: 'qwen_vlm_vllm',
          status: 'excluded_for_initial_internal_testing',
          tools: ['qwen3_vl', 'vllm'],
          reason: 'Phase 39C remains blocked; Qwen3-VL/vLLM generated runtime verification did not pass.',
        },
      ],
      routeExecution: 'blocked_until_phase_44i_actual_route_manifest_integration',
      rawChatExecution: 'blocked',
      approvedPlanSnapshotRequired: true,
    },
    blockedCapabilities: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
      blockedTools: TRACK_B_CAPABILITY_MANIFESTS
        .filter((manifest) => !manifest.restrictedInternalTestingEligible)
        .map((manifest) => ({
          toolId: manifest.toolId,
          status: manifest.status,
          blockedCapabilities: manifest.blockedCapabilities,
          nextPhase: manifest.nextPhase,
        })),
      demucsRuntimeDisabled: true,
      vlmRuntimeRetriesBlocked: true,
      productionBetaBroadMediaBlocked: true,
    },
    consumerBoundaries: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      frontendServiceRoleSecrets: 'blocked',
      heavyNativeFrontendImports: 'blocked',
      consumerOnlyBoundaries: TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => ({
        toolId: manifest.toolId,
        ownerBoundary: manifest.ownerBoundary,
        consumers: manifest.consumerBoundaries,
      })),
      sharpLibvipsBoundary: {
        owner: 'Track B owns core runtime hardening, server/worker policy, private artifact policy, and dependency caveats.',
        consumersOnly: ['web search', 'AI Tools graphics', 'Track A visual pipeline'],
        runtimeImportPolicy: 'server_worker_only_frontend_forbidden',
      },
    },
    runtimeRequirements: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: 'baseline_only_no_runtime_execution',
      requirements: TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => ({
        toolId: manifest.toolId,
        runtimeLocationPolicy: manifest.runtimeLocationPolicy,
        runtimeEvidenceStatus: manifest.runtimeEvidenceStatus,
        noRuntimeExecutedInThisPhase: true,
      })),
    },
    artifactPolicy: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: 'metadata_only',
      publicArtifacts: 'blocked',
      signedUrlsAsSourceOfTruth: 'blocked',
      committedPayloads: 'blocked',
      policies: TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => ({
        toolId: manifest.toolId,
        privateArtifactPolicy: manifest.privateArtifactPolicy,
      })),
    },
    costCapacity: getTrackBCapabilityManifestCostSummary(),
    testCommands: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: 'safe_command_manifest_only',
      commands: TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => ({
        toolId: manifest.toolId,
        commands: manifest.testCommands,
      })),
    },
    routeHandoff: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: 'handoff_pending',
      routeIntegrationStatus: 'phase_44i_required',
      baselineOnly: true,
      approvedPlanSnapshotsRequired: true,
      artifactScopeRequired: true,
      rawChatExecution: 'blocked',
      directToolExecutionFromModelOutput: 'blocked',
      workersExecuteApprovedPlanSnapshotsOnly: true,
      productionRouting: 'blocked',
      nextPhase: 'Phase 44I actual tool route manifest integration',
    },
    readinessSummary: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      trackBManifestBaseline: 'complete',
      includedRestrictedInternalReady: included.map((manifest) => manifest.toolId),
      excludedBlocked: excluded.map((manifest) => manifest.toolId),
      notStarted: notStarted.map((manifest) => manifest.toolId),
      production: 'blocked',
      externalBeta: 'blocked',
      paidProduction: 'blocked',
      broadMedia: 'blocked',
      publicArtifacts: 'blocked',
      providers: 'blocked',
      trackA: 'not_touched',
    },
    validationReport: validation,
    capabilityManifestReport: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: validation.status,
      summary: 'Track B capability manifest baseline generated for restricted internal testing eligibility only.',
      toolCount: TRACK_B_CAPABILITY_MANIFESTS.length,
      reportOnly: true,
      productionRouting: 'blocked',
      routeIntegrationPending: true,
      validation,
    },
    privateArtifactManifest: {
      phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
      runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
      status: 'committed_metadata_only_no_private_upload',
      privateUpload: 'not_run',
      privateRead: 'not_run',
      objectCount: 0,
      noMediaAudioModelPayloads: true,
    },
    perTool,
  }
}

export function readTrackBCapabilityManifestSummary() {
  const reports = buildTrackBCapabilityReports()
  return reports.readinessSummary
}

function buildValidationReport() {
  const ids = TRACK_B_CAPABILITY_MANIFESTS.map((manifest) => manifest.toolId)
  const missing = TRACK_B_TOOL_IDS.filter((toolId) => !ids.includes(toolId))
  const extra = ids.filter((toolId) => !TRACK_B_TOOL_IDS.includes(toolId))
  const duplicateIds = ids.filter((toolId, index) => ids.indexOf(toolId) !== index)
  const invalidStatuses = TRACK_B_CAPABILITY_MANIFESTS.filter((manifest) => !TRACK_B_CAPABILITY_STATUSES.includes(manifest.status))
  const initialIncluded = TRACK_B_CAPABILITY_MANIFESTS.filter((manifest) => manifest.initialInternalTestingGroup === 'included').map((manifest) => manifest.toolId).sort()
  const expectedIncluded = ['deepfilternet', 'duckdb', 'opencv', 'paddleocr', 'paddlepaddle', 'polars', 'pyav', 'pyscenedetect', 'sharp_libvips', 'signalsmith_stretch'].sort()
  const blockers = [
    ...missing.map((toolId) => `missing_tool:${toolId}`),
    ...extra.map((toolId) => `extra_tool:${toolId}`),
    ...duplicateIds.map((toolId) => `duplicate_tool:${toolId}`),
    ...invalidStatuses.map((manifest) => `invalid_status:${manifest.toolId}:${manifest.status}`),
    arraysEqual(initialIncluded, expectedIncluded) ? undefined : 'initial_internal_testing_included_set_mismatch',
  ].filter(Boolean)

  return {
    phase: TRACK_B_CAPABILITY_MANIFEST_PHASE,
    runId: TRACK_B_CAPABILITY_MANIFEST_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    toolCount: TRACK_B_CAPABILITY_MANIFESTS.length,
    canonicalToolIdsPresent: missing.length === 0 && extra.length === 0,
    all18ToolIdsPresent: TRACK_B_CAPABILITY_MANIFESTS.length === 18,
    canonicalStatusVocabularyOnly: invalidStatuses.length === 0,
    vlmCompositeExclusionPresent: true,
    demucsRuntimeDisabled: true,
    sharpLibvipsOwnershipBoundaryPresent: true,
    hybridToolsNotStarted: ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator', 'tool_route_manifest_integration'].every((toolId) => {
      const manifest = TRACK_B_CAPABILITY_MANIFESTS.find((item) => item.toolId === toolId)
      return manifest?.status === 'not_started'
    }),
    productionBetaBroadMediaProviderBlocks: true,
    rawChatExecutionBlocked: true,
    frontendServiceRoleSecretsBlocked: true,
    approvedPlanSnapshotArtifactScopeRequired: true,
    routeIntegrationPending: true,
    trackA: 'not_touched',
    blockers,
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function renderCapabilityReportMarkdown(reports: TrackBCapabilityReports): string {
  const summary = reports.readinessSummary
  const toolRows = TRACK_B_CAPABILITY_MANIFESTS
    .map((manifest) => `| \`${manifest.toolId}\` | ${manifest.family} | ${manifest.status} | ${manifest.initialInternalTestingGroup} |`)
    .join('\n')
  return `# Track B Capability Manifest Baseline

Status: ${String(summary.status)}

This report is manifest-only. It does not execute runtimes, process media/audio/OCR/VLM, mutate GCP/IAM, call providers, or unlock beta/production.

| Tool | Family | Status | Initial testing group |
| --- | --- | --- | --- |
${toolRows}

Route handoff: Phase 44I remains required for actual tool route manifest integration. Workers must execute approved plan snapshots within approved artifact scopes only. Raw chat execution remains blocked.
`
}
