import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type { TrackBCapabilityManifest, TrackBToolId } from '../track-b-capability-manifests/track-b-capability-manifest-types'
import {
  TRACK_B_CAPABILITY_MANIFESTS,
  TRACK_B_TOOL_IDS,
} from '../track-b-capability-manifests/track-b-tool-registry'
import type { TrackBCostCapacityClass, TrackBRouteEntry, TrackBRouteReports, TrackBRouteStatus } from './track-b-route-types'

export const TRACK_B_TOOL_ROUTE_MANIFEST_PHASE = '44I'
export const TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID = 'phase44i-trackb-tool-route-manifest-integration-20260604'
export const TRACK_B_TOOL_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'
export const TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
export const TRACK_B_TOOL_ROUTE_MANIFEST_BRANCH = 'codex/rp-activation-44i-trackb-tool-route-manifest-integration'
export const TRACK_B_TOOL_ROUTE_MANIFEST_BASE_BRANCH = 'codex/rp-trackb-capability-manifest-baseline'

export const TRACK_B_ROUTE_STATUSES: TrackBRouteStatus[] = [
  'route_enabled_restricted_internal',
  'route_disabled_blocked',
  'route_disabled_not_started',
  'route_disabled_excluded',
  'route_disabled_pending_integration',
  'route_handoff_only',
]

export const TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS = [
  'track_b_tool_route_manifest_plan.json',
  'track_b_route_tool_registry.json',
  'track_b_tool_route_manifest.json',
  'track_b_route_enabled_internal_manifest.json',
  'track_b_route_disabled_manifest.json',
  'track_b_route_plan_snapshot_policy.json',
  'track_b_route_artifact_scope_policy.json',
  'track_b_route_consumer_policy.json',
  'track_b_route_failure_policy.json',
  'track_b_route_cost_capacity_summary.json',
  'track_b_route_test_command_manifest.json',
  'track_b_route_validation_report.json',
  'track_b_route_integration_report.json',
  'track_b_route_private_artifact_manifest.json',
] as const

const REQUIRED_PLAN_SNAPSHOT_FIELDS = [
  'planSnapshotId',
  'toolId',
  'approvedCapabilityId',
  'sourcePhase',
  'routeManifestVersion',
  'inputArtifactScopeId',
  'outputArtifactScopeId',
  'privateGcsPrefix',
  'requesterContext',
  'noRawPromptExecution',
  'noProviderCallUnlessApproved',
  'publicOutputAllowed',
  'broadMediaAllowed',
  'arbitraryMediaAllowed',
  'confirmationPhase',
  'auditReportPath',
  'failureBehavior',
]

const REQUIRED_ARTIFACT_SCOPE_FIELDS = [
  'inputArtifactScopeId',
  'outputArtifactScopeId',
  'privateGcsPrefix',
  'allowedInputArtifactTypes',
  'allowedOutputArtifactTypes',
  'maxInputCount',
  'maxDurationSeconds',
  'maxFrameCount',
  'maxAudioDurationSeconds',
  'publicOutputAllowed',
  'signedUrlSourceOfTruthAllowed',
  'committedPayloadAllowed',
]

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
  'worker execution',
  'IAM/GCP mutation',
  'raw chat execution',
  'direct tool execution from model output',
  'frontend service-role secrets',
  'Track A runtime/visual/render stack',
]

const ENABLED_TOOLS = new Set<TrackBToolId>([
  'deepfilternet',
  'signalsmith_stretch',
  'paddleocr',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
])

const HANDOFF_TOOLS = new Set<TrackBToolId>(['paddlepaddle', 'tool_route_manifest_integration'])
const BLOCKED_TOOLS = new Set<TrackBToolId>(['demucs'])
const EXCLUDED_TOOLS = new Set<TrackBToolId>(['qwen3_vl', 'vllm'])
const NOT_STARTED_TOOLS = new Set<TrackBToolId>([
  'web_capability_profiler',
  'desktop_capability_profiler',
  'local_worker_sidecar_planning',
  'cost_estimator',
])

export function getTrackBToolRouteManifestPlan() {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    branch: TRACK_B_TOOL_ROUTE_MANIFEST_BRANCH,
    baseBranch: TRACK_B_TOOL_ROUTE_MANIFEST_BASE_BRANCH,
    sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
    sourceCapabilityManifestDir: 'docs/activation-track-b-capability-manifests-reports',
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    mode: 'metadata_gating_only_no_runtime_execution',
    statusVocabulary: TRACK_B_ROUTE_STATUSES,
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_TRACK_B_ROUTE_MANIFEST_INTEGRATION',
    noRuntimeExecution: true,
    noWorkerExecution: true,
    noMediaAudioOcrVlmExecution: true,
    noDockerCloudGpuIamMutation: true,
    noProviderCalls: true,
    noBetaProductionUnlock: true,
    trackA: 'not_touched',
    globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
    reportDir: TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
    nextRecommendedPhase: 'Phase 44D web capability profiler or Phase 44E desktop capability profiler depending roadmap priority.',
  }
}

export function getTrackBToolRouteManifestIamPlan() {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    recommendedFutureIamShape: 'object_prefix_conditions_per_approved_artifact_scope_only',
    notes: [
      'Phase 44I creates route metadata and policy reports only.',
      'No bucket creation, IAM binding, service-account key, public principal, Cloud Run, Cloud Build, or GCP mutation is part of this phase.',
    ],
  }
}

export function getTrackBToolRouteManifestCostSummary() {
  return buildCostCapacitySummary(buildTrackBRouteEntries())
}

export async function writeTrackBToolRouteManifestArtifacts(reportDir = TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR): Promise<void> {
  const reports = buildTrackBToolRouteReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_tool_route_manifest_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_tool_registry.json'), reports.routeToolRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_tool_route_manifest.json'), reports.routeManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_enabled_internal_manifest.json'), reports.enabledInternalManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_disabled_manifest.json'), reports.disabledManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_plan_snapshot_policy.json'), reports.planSnapshotPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_artifact_scope_policy.json'), reports.artifactScopePolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_consumer_policy.json'), reports.consumerPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_failure_policy.json'), reports.failurePolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_cost_capacity_summary.json'), reports.costCapacitySummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_test_command_manifest.json'), reports.testCommandManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_integration_report.json'), reports.integrationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'track_b_route_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'track_b_route_integration_report.md'), renderRouteReportMarkdown(reports))
}

export function readTrackBToolRouteManifestSummary() {
  const routes = buildTrackBRouteEntries()
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: buildValidationReport(routes).status,
    routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
    totalRoutes: routes.length,
    enabledRestrictedInternal: routes.filter((route) => route.routeStatus === 'route_enabled_restricted_internal').map((route) => route.toolId),
    handoffOnly: routes.filter((route) => route.routeStatus === 'route_handoff_only').map((route) => route.toolId),
    disabledOrExcluded: routes.filter((route) => ['route_disabled_blocked', 'route_disabled_excluded'].includes(route.routeStatus)).map((route) => route.toolId),
    notStarted: routes.filter((route) => route.routeStatus === 'route_disabled_not_started').map((route) => route.toolId),
    runtimeExecution: 'blocked',
    routeExecution: 'blocked',
    production: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildTrackBToolRouteReports(): TrackBRouteReports {
  const routes = buildTrackBRouteEntries()
  const validationReport = buildValidationReport(routes)
  const enabled = routes.filter((route) => route.routeStatus === 'route_enabled_restricted_internal')
  const disabled = routes.filter((route) => route.routeStatus !== 'route_enabled_restricted_internal')

  return {
    plan: getTrackBToolRouteManifestPlan(),
    routeToolRegistry: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: validationReport.status,
      sourceCapabilityManifestToolIds: TRACK_B_TOOL_IDS,
      routes: routes.map((route) => ({
        routeId: route.routeId,
        toolId: route.toolId,
        family: route.family,
        routeStatus: route.routeStatus,
        routeable: route.routeable,
        runtimeExecutionAllowed: route.runtimeExecutionAllowed,
        routeExecutionAllowed: route.routeExecutionAllowed,
      })),
    },
    routeManifest: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: validationReport.status,
      routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
      sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
      routes,
    },
    enabledInternalManifest: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: 'metadata_eligibility_only',
      runtimeExecutionAllowed: false,
      routeExecutionAllowed: false,
      enabledRoutes: enabled,
    },
    disabledManifest: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: 'fail_closed',
      disabledRoutes: disabled,
    },
    planSnapshotPolicy: buildPlanSnapshotPolicy(),
    artifactScopePolicy: buildArtifactScopePolicy(),
    consumerPolicy: buildConsumerPolicy(routes),
    failurePolicy: buildFailurePolicy(),
    costCapacitySummary: buildCostCapacitySummary(routes),
    testCommandManifest: buildTestCommandManifest(routes),
    validationReport,
    integrationReport: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: validationReport.status,
      routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
      consumedCapabilityManifestBaseline: true,
      sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
      totalRoutes: routes.length,
      enabledRestrictedInternalRoutes: enabled.length,
      disabledRoutes: disabled.length,
      runtimeExecutionAllowed: false,
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
      rawChatExecution: 'blocked',
      publicOutput: 'blocked',
      providerCalls: 'blocked',
      broadMedia: 'blocked',
      arbitraryMedia: 'blocked',
      production: 'blocked',
      externalBeta: 'blocked',
      paidProduction: 'blocked',
      trackA: 'not_touched',
      globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
      nextRecommendedPhase: 'Phase 44D web capability profiler or Phase 44E desktop capability profiler depending roadmap priority.',
    },
    privateArtifactManifest: {
      phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
      runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
      status: 'committed_metadata_only_no_private_upload',
      privateUpload: 'not_run',
      privateRead: 'not_run',
      objectCount: 0,
      noMediaAudioModelPayloads: true,
    },
  }
}

export function buildTrackBRouteEntries(): TrackBRouteEntry[] {
  return TRACK_B_CAPABILITY_MANIFESTS.map((capability) => buildRouteEntry(capability))
}

function buildRouteEntry(capability: TrackBCapabilityManifest): TrackBRouteEntry {
  const routeStatus = routeStatusForTool(capability.toolId)
  const family = capability.family === 'hybrid_compute_cost_routing' ? 'hybrid_compute' : capability.family
  const capabilityIds = capabilityIdsForTool(capability.toolId)
  const routeable = routeStatus === 'route_enabled_restricted_internal'
  const privateGcsPrefixes = privatePrefixesForFamily(family)
  const blockedReasons = blockedReasonsForRoute(capability, routeStatus)

  return {
    routeId: `track_b_${capability.toolId}`,
    toolId: capability.toolId,
    family,
    track: 'track_b',
    capabilityIds,
    routeStatus,
    routeable,
    routeableReason: routeable
      ? 'restricted internal metadata eligibility only; runtime and route execution remain blocked in Phase 44I'
      : routeableReasonForDisabled(capability.toolId, routeStatus),
    initialInternalTestingIncluded: capability.initialInternalTestingGroup === 'included',
    allowedConsumers: allowedConsumersForTool(capability.toolId),
    blockedConsumers: [
      'frontend_direct_runtime',
      'raw_chat_executor',
      'public_output_publisher',
      'production_router',
      'external_beta_router',
      'provider_gateway_without_approval',
    ],
    ownershipBoundary: capability.ownerBoundary,
    approvedInputArtifactTypes: approvedInputsForFamily(family, capability.toolId),
    blockedInputArtifactTypes: [
      'arbitrary_file_path',
      'arbitrary_gcs_prefix',
      'public_url',
      'signed_url_source_of_truth',
      'committed_private_payload',
      'broad_user_media',
      'unapproved_model_weight',
    ],
    approvedOutputArtifactTypes: approvedOutputsForFamily(family, capability.toolId),
    blockedOutputArtifactTypes: [
      'public_artifact',
      'committed_media_payload',
      'committed_audio_payload',
      'committed_model_payload',
      'raw_private_transcript',
      'provider_log_with_secrets',
    ],
    requiredPlanSnapshotFields: REQUIRED_PLAN_SNAPSHOT_FIELDS,
    requiredArtifactScopeFields: REQUIRED_ARTIFACT_SCOPE_FIELDS,
    requiredConfirmations: routeable
      ? ['future_tool_specific_confirmation_phase_required', 'approved_plan_snapshot_required', 'approved_artifact_scope_required']
      : ['blocked_until_status_changes_in_future_approved_phase'],
    runtimeAdapterStatus: runtimeAdapterStatusForRoute(routeStatus),
    runtimeExecutionAllowed: false,
    routeExecutionAllowed: false,
    privateGcsPrefixes,
    publicOutputAllowed: false,
    providerCallsAllowed: false,
    broadMediaAllowed: false,
    arbitraryMediaAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    failureBehavior: 'fail_closed_return_blocked_reason_never_fallback_to_raw_execution',
    costCapacityClass: costClassForTool(capability.toolId),
    costEstimateSource: costEstimateSourceForTool(capability.toolId),
    prerequisitePhases: capability.evidence.map((evidence) => evidence.phase),
    evidenceRefs: capability.evidence,
    testCommands: capability.testCommands,
    blockedReasons,
    nextRequiredPhase: nextPhaseForTool(capability.toolId, capability.nextPhase),
  }
}

function routeStatusForTool(toolId: TrackBToolId): TrackBRouteStatus {
  if (ENABLED_TOOLS.has(toolId)) return 'route_enabled_restricted_internal'
  if (HANDOFF_TOOLS.has(toolId)) return 'route_handoff_only'
  if (BLOCKED_TOOLS.has(toolId)) return 'route_disabled_blocked'
  if (EXCLUDED_TOOLS.has(toolId)) return 'route_disabled_excluded'
  if (NOT_STARTED_TOOLS.has(toolId)) return 'route_disabled_not_started'
  return 'route_disabled_pending_integration'
}

function capabilityIdsForTool(toolId: TrackBToolId): string[] {
  const capabilityIds: Record<TrackBToolId, string[]> = {
    deepfilternet: ['bounded_speech_cleanup', 'internal_audio_qa_planning'],
    signalsmith_stretch: ['bounded_timing_stretch', 'internal_timing_qa_planning'],
    demucs: [],
    paddleocr: ['internal_ocr_qa_planning', 'safe_zone_ocr_signal'],
    paddlepaddle: ['ocr_runtime_foundation'],
    qwen3_vl: [],
    vllm: [],
    opencv: ['internal_media_data_shape_metrics', 'bounded_frame_metrics'],
    pyav: ['internal_media_container_probe', 'bounded_metadata_decode'],
    pyscenedetect: ['bounded_scene_manifest'],
    sharp_libvips: ['image_resize', 'thumbnail_generation', 'metadata_extraction', 'format_conversion'],
    duckdb: ['internal_qa_aggregation', 'metadata_reporting'],
    polars: ['internal_qa_transforms', 'metadata_reporting'],
    web_capability_profiler: [],
    desktop_capability_profiler: [],
    local_worker_sidecar_planning: [],
    cost_estimator: [],
    tool_route_manifest_integration: ['route_manifest_metadata_handoff'],
  }
  return capabilityIds[toolId]
}

function allowedConsumersForTool(toolId: TrackBToolId): string[] {
  if (toolId === 'sharp_libvips') {
    return ['internal_qa_planning', 'future_worker_orchestration', 'web_search_capture', 'ai_tools_graphics', 'track_a_visual_pipeline', 'media_data_qa']
  }
  if (toolId === 'paddlepaddle') return ['paddleocr_runtime_foundation_only']
  if (toolId === 'tool_route_manifest_integration') return ['internal_qa_planning', 'future_worker_orchestration']
  return ['internal_qa_planning', 'future_worker_orchestration']
}

function approvedInputsForFamily(family: TrackBRouteEntry['family'], toolId: TrackBToolId): string[] {
  if (toolId === 'tool_route_manifest_integration') return ['committed_capability_manifest_json', 'approved_plan_snapshot_metadata']
  if (family === 'audio_timing') return ['approved_private_audio_metadata', 'approved_bounded_audio_artifact_ref', 'approved_plan_snapshot_metadata']
  if (family === 'ocr') return ['approved_private_ocr_metadata', 'approved_safe_zone_artifact_ref', 'approved_plan_snapshot_metadata']
  if (family === 'vlm') return []
  if (family === 'media_data') return ['approved_private_media_metadata', 'approved_generated_fixture_metadata', 'approved_controlled_sample_metadata', 'approved_plan_snapshot_metadata']
  return []
}

function approvedOutputsForFamily(family: TrackBRouteEntry['family'], toolId: TrackBToolId): string[] {
  if (toolId === 'tool_route_manifest_integration') return ['route_manifest_metadata_report']
  if (family === 'audio_timing') return ['private_audio_qa_metadata', 'private_timing_qa_metadata']
  if (family === 'ocr') return ['private_ocr_qa_metadata', 'safe_zone_signal_metadata']
  if (family === 'vlm') return []
  if (family === 'media_data') return ['private_media_data_qa_metadata', 'private_reporting_metadata']
  return []
}

function privatePrefixesForFamily(family: TrackBRouteEntry['family']): string[] {
  if (family === 'audio_timing') return ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36*/']
  if (family === 'ocr') return ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37*/']
  if (family === 'vlm') return []
  if (family === 'media_data') return ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46*/']
  return ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44*/']
}

function blockedReasonsForRoute(capability: TrackBCapabilityManifest, routeStatus: TrackBRouteStatus): string[] {
  if (routeStatus === 'route_enabled_restricted_internal') {
    return ['runtime_execution_blocked_in_phase44i', 'route_execution_blocked_until_future_approved_plan_snapshot_artifact_scope_phase']
  }
  if (capability.toolId === 'demucs') return ['blocked_pending_training_data_provenance', 'runtime_disabled', 'model_download_disabled', 'source_separation_disabled']
  if (capability.toolId === 'qwen3_vl') return ['excluded_for_initial_internal_testing', 'phase39c_generated_runtime_blocked']
  if (capability.toolId === 'vllm') return ['excluded_for_initial_internal_testing', 'qwen_vllm_path_blocked_by_phase39c_evidence']
  if (NOT_STARTED_TOOLS.has(capability.toolId)) return ['not_started', 'dedicated_future_phase_required']
  if (routeStatus === 'route_handoff_only') return ['handoff_metadata_only_no_direct_user_route']
  return capability.blockedCapabilities
}

function routeableReasonForDisabled(toolId: TrackBToolId, routeStatus: TrackBRouteStatus): string {
  if (routeStatus === 'route_handoff_only') return 'handoff metadata only; not directly routeable as a user-facing runtime tool'
  if (toolId === 'demucs') return 'blocked pending Demucs training-data/model-artifact provenance and human/legal review'
  if (toolId === 'qwen3_vl') return 'excluded from initial internal testing while generated VLM runtime verification is blocked'
  if (toolId === 'vllm') return 'excluded because Qwen/vLLM path remains blocked by Phase 39C evidence'
  if (routeStatus === 'route_disabled_not_started') return 'not started; future Track B phase required'
  return 'disabled pending future approved integration'
}

function runtimeAdapterStatusForRoute(routeStatus: TrackBRouteStatus): string {
  if (routeStatus === 'route_enabled_restricted_internal') return 'metadata_declared_runtime_adapter_not_invoked'
  if (routeStatus === 'route_handoff_only') return 'handoff_metadata_only'
  if (routeStatus === 'route_disabled_not_started') return 'not_started'
  return 'disabled'
}

function costClassForTool(toolId: TrackBToolId): TrackBCostCapacityClass {
  if (['duckdb', 'polars'].includes(toolId)) return 'cpu_low'
  if (['deepfilternet', 'signalsmith_stretch', 'paddleocr', 'paddlepaddle', 'opencv', 'pyav', 'pyscenedetect', 'sharp_libvips'].includes(toolId)) return 'cpu_medium'
  if (['qwen3_vl', 'vllm'].includes(toolId)) return 'gpu_required'
  if (toolId === 'demucs') return 'blocked_unknown'
  return 'pending_estimator'
}

function costEstimateSourceForTool(toolId: TrackBToolId): string {
  if (['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator', 'tool_route_manifest_integration'].includes(toolId)) {
    return 'pending_future_hybrid_compute_cost_phase'
  }
  if (['qwen3_vl', 'vllm', 'demucs'].includes(toolId)) return 'blocked_route_no_estimate'
  return 'rough_class_from_prior_track_b_evidence_not_phase44h_estimator'
}

function nextPhaseForTool(toolId: TrackBToolId, defaultNextPhase: string): string {
  const next: Partial<Record<TrackBToolId, string>> = {
    web_capability_profiler: 'Phase 44D web capability profiler',
    desktop_capability_profiler: 'Phase 44E desktop capability profiler',
    local_worker_sidecar_planning: 'Phase 44G local worker sidecar planning',
    cost_estimator: 'Phase 44H cost estimator',
    tool_route_manifest_integration: 'Phase 44I complete; Phase 44J only after 44D-H if route integration needs profiler/cost evidence',
  }
  return next[toolId] ?? defaultNextPhase
}

function buildPlanSnapshotPolicy() {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'required_for_future_execution',
    requiredFields: REQUIRED_PLAN_SNAPSHOT_FIELDS,
    blockedInputs: [
      'raw_chat_text_direct_worker_invocation',
      'arbitrary_file_path',
      'arbitrary_gcs_prefix',
      'public_url',
      'signed_url_source_of_truth',
      'frontend_service_role_secret_access',
      'unapproved_runtime_adapter',
    ],
    defaultBooleans: {
      noRawPromptExecution: true,
      noProviderCallUnlessApproved: true,
      publicOutputAllowed: false,
      broadMediaAllowed: false,
      arbitraryMediaAllowed: false,
    },
    failureBehavior: 'fail_closed_return_route_blocker',
  }
}

function buildArtifactScopePolicy() {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'private_artifact_scope_required',
    requiredFields: REQUIRED_ARTIFACT_SCOPE_FIELDS,
    families: {
      audio_timing: {
        allowedPrivatePrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36*/'],
        allowedInputArtifactClasses: ['approved_private_audio_metadata', 'approved_bounded_audio_artifact_ref'],
        allowedOutputArtifactClasses: ['private_audio_qa_metadata', 'private_timing_qa_metadata'],
      },
      ocr: {
        allowedPrivatePrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37*/'],
        allowedInputArtifactClasses: ['approved_private_ocr_metadata', 'approved_safe_zone_artifact_ref'],
        allowedOutputArtifactClasses: ['private_ocr_qa_metadata', 'safe_zone_signal_metadata'],
      },
      vlm: {
        allowedPrivatePrefixes: [],
        allowedInputArtifactClasses: [],
        allowedOutputArtifactClasses: [],
        status: 'blocked_excluded',
      },
      media_data: {
        allowedPrivatePrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46*/'],
        allowedInputArtifactClasses: ['approved_private_media_metadata', 'approved_generated_fixture_metadata', 'approved_controlled_sample_metadata'],
        allowedOutputArtifactClasses: ['private_media_data_qa_metadata', 'private_reporting_metadata'],
      },
      hybrid_compute: {
        allowedPrivatePrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44*/'],
        allowedInputArtifactClasses: ['committed_capability_manifest_json', 'approved_plan_snapshot_metadata'],
        allowedOutputArtifactClasses: ['route_manifest_metadata_report'],
        status: 'metadata_only_pending_future_phases',
      },
    },
    publicArtifactRule: false,
    privateArtifactsOnly: true,
    committedMediaAudioModelPayloads: 'blocked',
    committedPrivateArtifacts: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    futureIamRecommendation: 'use object prefix conditions per approved artifact scope',
  }
}

function buildConsumerPolicy(routes: TrackBRouteEntry[]) {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'consumer_boundaries_defined',
    allowedConsumers: [
      'internal_qa_planning_services',
      'future_worker_orchestration',
      'web_search_capture_for_sharp_only',
      'ai_tools_graphics_for_sharp_only',
      'track_a_visual_pipeline_for_sharp_only',
    ],
    trackBDoesNotOwn: [
      'web_search_provider_stack',
      'AI Tools creative graphics workflows',
      'Track A visual pipeline',
      'map/geospatial stack',
    ],
    consumerRequirements: [
      'respect_approved_capability_ids',
      'private_artifacts_only',
      'no_frontend_secrets',
      'no_public_output',
      'no_raw_chat_execution',
      'approved_plan_snapshots_required',
    ],
    sharpLibvipsConsumers: routes.find((route) => route.toolId === 'sharp_libvips')?.allowedConsumers ?? [],
  }
}

function buildFailurePolicy() {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'fail_closed',
    rules: [
      'route_resolution_failure_returns_blocked_reason_not_raw_execution',
      'disabled_tools_cannot_route',
      'excluded_tools_cannot_route',
      'unknown_capability_fails_closed',
      'missing_artifact_scope_fails_closed',
      'public_output_request_fails_closed',
      'broad_media_request_fails_closed',
      'provider_call_request_fails_closed_unless_explicit_provider_phase_approves',
      'frontend_server_secret_request_fails_closed',
      'vlm_request_fails_closed',
      'demucs_request_fails_closed',
      'route_manifest_version_mismatch_fails_closed',
    ],
  }
}

function buildCostCapacitySummary(routes: TrackBRouteEntry[]) {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'route_metadata_only_not_phase44h_cost_estimator',
    trueCostEstimator: 'Phase 44H remains required',
    classes: ['cpu_low', 'cpu_medium', 'cpu_heavy', 'gpu_required', 'blocked_unknown', 'pending_estimator'],
    routes: routes.map((route) => ({
      toolId: route.toolId,
      family: route.family,
      costCapacityClass: route.costCapacityClass,
      costEstimateSource: route.costEstimateSource,
    })),
  }
}

function buildTestCommandManifest(routes: TrackBRouteEntry[]) {
  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: 'safe_report_commands_only',
    routeManifestCommands: [
      'npm run smoke:activation-track-b-tool-route-manifest',
      'npm run activation:track-b-tool-route-manifest:report',
      'npm run activation:track-b-tool-route-manifest:summary',
      'npm run activation:track-b-capability-manifests:report',
    ],
    familyCommands: routes.map((route) => ({
      toolId: route.toolId,
      commands: route.testCommands,
      runtimeCommandsAreConfirmationGatedAndNotExecutedInPhase44I: true,
    })),
  }
}

function buildValidationReport(routes: TrackBRouteEntry[]) {
  const ids = routes.map((route) => route.toolId)
  const missingTools = TRACK_B_TOOL_IDS.filter((toolId) => !ids.includes(toolId))
  const missingFields = routes.flatMap((route) => requiredRouteEntryFields
    .filter((field) => !(field in route))
    .map((field) => `${route.toolId}:${field}`))
  const enabled = routes.filter((route) => route.routeStatus === 'route_enabled_restricted_internal')
  const expectedEnabled = ['deepfilternet', 'signalsmith_stretch', 'paddleocr', 'opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'].sort()
  const blockers = [
    ...missingTools.map((toolId) => `missing_tool:${toolId}`),
    ...missingFields.map((field) => `missing_field:${field}`),
    compareSorted(enabled.map((route) => route.toolId), expectedEnabled) ? undefined : 'enabled_restricted_internal_route_set_mismatch',
    routes.every((route) => route.runtimeExecutionAllowed === false) ? undefined : 'runtime_execution_allowed_in_phase44i',
    routes.every((route) => route.routeExecutionAllowed === false) ? undefined : 'route_execution_allowed_in_phase44i',
    routes.find((route) => route.toolId === 'demucs')?.routeStatus === 'route_disabled_blocked' ? undefined : 'demucs_not_blocked',
    routes.find((route) => route.toolId === 'qwen3_vl')?.routeStatus === 'route_disabled_excluded' ? undefined : 'qwen3_vl_not_excluded',
    routes.find((route) => route.toolId === 'vllm')?.routeStatus === 'route_disabled_excluded' ? undefined : 'vllm_not_excluded',
    ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator'].every((toolId) => routes.find((route) => route.toolId === toolId)?.routeStatus === 'route_disabled_not_started') ? undefined : 'hybrid_profiler_cost_routes_not_disabled_not_started',
    routes.find((route) => route.toolId === 'sharp_libvips')?.allowedConsumers.includes('track_a_visual_pipeline') ? undefined : 'sharp_libvips_consumer_boundary_missing',
  ].filter(Boolean)

  return {
    phase: TRACK_B_TOOL_ROUTE_MANIFEST_PHASE,
    runId: TRACK_B_TOOL_ROUTE_MANIFEST_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    totalRoutes: routes.length,
    all18ToolIdsPresent: missingTools.length === 0 && routes.length === 18,
    everyRouteHasRequiredFields: missingFields.length === 0,
    enabledRoutesRestrictedOnly: compareSorted(enabled.map((route) => route.toolId), expectedEnabled),
    runtimeExecutionAllowedFalse: routes.every((route) => route.runtimeExecutionAllowed === false),
    routeExecutionAllowedFalse: routes.every((route) => route.routeExecutionAllowed === false),
    demucsBlocked: routes.find((route) => route.toolId === 'demucs')?.routeStatus === 'route_disabled_blocked',
    vlmExcluded: ['qwen3_vl', 'vllm'].every((toolId) => routes.find((route) => route.toolId === toolId)?.routeStatus === 'route_disabled_excluded'),
    hybridToolsNotStarted: ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator'].every((toolId) => routes.find((route) => route.toolId === toolId)?.routeStatus === 'route_disabled_not_started'),
    noRawChatExecution: true,
    noFrontendServiceRoleSecrets: true,
    noPublicArtifacts: true,
    noProviderCalls: true,
    noBroadMedia: true,
    noArbitraryMedia: true,
    productionExternalBetaPaidProductionBlocked: true,
    trackA: 'not_touched',
    blockers,
  }
}

const requiredRouteEntryFields: Array<keyof TrackBRouteEntry> = [
  'routeId',
  'toolId',
  'family',
  'track',
  'capabilityIds',
  'routeStatus',
  'routeable',
  'routeableReason',
  'initialInternalTestingIncluded',
  'allowedConsumers',
  'blockedConsumers',
  'ownershipBoundary',
  'approvedInputArtifactTypes',
  'blockedInputArtifactTypes',
  'approvedOutputArtifactTypes',
  'blockedOutputArtifactTypes',
  'requiredPlanSnapshotFields',
  'requiredArtifactScopeFields',
  'requiredConfirmations',
  'runtimeAdapterStatus',
  'runtimeExecutionAllowed',
  'routeExecutionAllowed',
  'privateGcsPrefixes',
  'publicOutputAllowed',
  'providerCallsAllowed',
  'broadMediaAllowed',
  'arbitraryMediaAllowed',
  'productionAllowed',
  'externalBetaAllowed',
  'failureBehavior',
  'costCapacityClass',
  'costEstimateSource',
  'prerequisitePhases',
  'evidenceRefs',
  'testCommands',
  'blockedReasons',
  'nextRequiredPhase',
]

function compareSorted(a: string[], b: string[]): boolean {
  const left = [...a].sort()
  const right = [...b].sort()
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function renderRouteReportMarkdown(reports: TrackBRouteReports): string {
  const routeManifest = reports.routeManifest as { routes?: TrackBRouteEntry[] }
  const rows = (routeManifest.routes ?? [])
    .map((route) => `| \`${route.toolId}\` | ${route.routeStatus} | ${route.routeable ? 'yes' : 'no'} | ${route.costCapacityClass} |`)
    .join('\n')
  return `# Track B Tool Route Manifest Integration

Status: ${String((reports.validationReport as { status?: string }).status)}

Phase 44I creates route metadata and fail-closed gating policy only. It does not execute tools, workers, media, audio, OCR, VLM, Docker, Cloud Build, Cloud Run, providers, GCP/IAM mutation, beta, production, or Track A work.

| Tool | Route status | Routeable metadata | Cost class |
| --- | --- | --- | --- |
${rows}

Workers still require approved plan snapshots, approved artifact scopes, tool-specific future confirmation phases, and private artifacts only.
`
}
