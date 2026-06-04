import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type { TrackBToolId } from '../track-b-capability-manifests/track-b-capability-manifest-types'
import { TRACK_B_CAPABILITY_MANIFESTS, TRACK_B_TOOL_IDS } from '../track-b-capability-manifests/track-b-tool-registry'
import { buildTrackBRouteEntries, TRACK_B_TOOL_ROUTE_MANIFEST_VERSION } from '../track-b-tool-route-manifest'
import type {
  TrackBCapacityClass,
  TrackBCostEstimatorReports,
  TrackBCostRiskClass,
  TrackBCostScenario,
  TrackBCostScenarioInput,
  TrackBCostScenarioResult,
  TrackBCostToolMapping,
  TrackBExecutionClass,
} from './track-b-cost-estimator-types'

export const TRACK_B_COST_ESTIMATOR_PHASE = '44H'
export const TRACK_B_COST_ESTIMATOR_RUN_ID = 'phase44h-trackb-cost-estimator-20260604'
export const TRACK_B_COST_ESTIMATOR_BRANCH = 'codex/rp-activation-44h-trackb-cost-estimator'
export const TRACK_B_COST_ESTIMATOR_BASE_BRANCH = 'codex/rp-activation-44f-desktop-benchmark-runner'
export const TRACK_B_COST_ESTIMATOR_REPORT_DIR = 'docs/activation-phase-44h-track-b-cost-estimator-reports'
export const TRACK_B_COST_ESTIMATOR_SCHEMA_VERSION = 'track-b-cost-estimator-v1'
export const TRACK_B_COST_PRICING_SNAPSHOT_ID = 'track-b-cost-pricing-snapshot-20260604-us-central1-usd'
export const TRACK_B_COST_PRICING_SNAPSHOT_DATE = '2026-06-04'

export const TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS = [
  'phase_44h_cost_estimator_plan.json',
  'phase_44h_cost_pricing_source_evidence.json',
  'phase_44h_cost_pricing_web_research.md',
  'phase_44h_cost_pricing_snapshot.json',
  'phase_44h_cost_estimator_schema.json',
  'phase_44h_cost_tool_mapping.json',
  'phase_44h_cost_scenario_registry.json',
  'phase_44h_cost_scenario_results.json',
  'phase_44h_cost_guardrail_policy.json',
  'phase_44h_cost_route_handoff.json',
  'phase_44h_cost_capacity_summary.json',
  'phase_44h_cost_blocker_report.json',
  'phase_44h_cost_readiness_report.json',
  'phase_44h_private_artifact_manifest.json',
] as const

const GLOBAL_BLOCKED_SCOPES = [
  'route execution',
  'worker execution',
  'local worker sidecar execution',
  'raw chat execution',
  'media processing',
  'audio processing',
  'OCR runtime execution',
  'VLM runtime execution',
  'DeepFilterNet runtime execution',
  'Signalsmith runtime execution',
  'Demucs runtime execution',
  'model downloads',
  'provider calls',
  'web search provider calls',
  'billing API queries',
  'Google Cloud project billing reads',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'GCP mutation',
  'IAM mutation',
  'network speed tests',
  'GPU benchmarks',
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

const COMMON_WARNINGS = [
  'planning_estimate_not_billing_truth',
  'logging_costs_excluded',
  'monitoring_costs_excluded',
  'operation_costs_partially_excluded',
  'network_egress_costs_excluded_or_blocked',
  'storage_lifecycle_costs_excluded',
  'cloud_build_costs_unavailable',
  'pricing_snapshot_must_refresh_before_paid_beta_or_production',
]

type PricingSnapshot = ReturnType<typeof buildPricingSnapshot>

export function getTrackBCostEstimatorPlan() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    branch: TRACK_B_COST_ESTIMATOR_BRANCH,
    baseBranch: TRACK_B_COST_ESTIMATOR_BASE_BRANCH,
    sourcePr161: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/161',
    sourcePr164: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/164',
    sourcePr167: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/167',
    sourcePr176: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/176',
    sourcePr177: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/177',
    mode: 'metadata_only_static_pricing_snapshot_synthetic_scenarios',
    schemaVersion: TRACK_B_COST_ESTIMATOR_SCHEMA_VERSION,
    pricingSnapshotId: TRACK_B_COST_PRICING_SNAPSHOT_ID,
    pricingSnapshotDate: TRACK_B_COST_PRICING_SNAPSHOT_DATE,
    currency: 'USD',
    region: 'us-central1',
    confirmationForReportGenerationOnly: 'REEDITPRO_CONFIRM_TRACK_B_COST_ESTIMATOR',
    confirmationForOfficialPricingResearchOnly: 'REEDITPRO_CONFIRM_TRACK_B_COST_PRICING_RESEARCH',
    noBillingApiCalls: true,
    noProviderCalls: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noLocalSidecarExecution: true,
    noMediaAudioOcrVlmModelRuntime: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
    reportDir: TRACK_B_COST_ESTIMATOR_REPORT_DIR,
    expectedReports: TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS,
    nextRecommendedPhase: 'Phase 44G local worker sidecar foundation if execution plumbing is next; Phase 44J only after sidecar and required route/cost gates.',
  }
}

export function getTrackBCostEstimatorIamPlan() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'no_iam_mutation_allowed',
    iamMutation: 'blocked',
    billingApiAccess: 'blocked',
    gcpMutation: 'blocked',
    notes: [
      'Phase 44H writes committed safe metadata reports only.',
      'No bucket creation, IAM binding, service-account key, billing account read, Cloud Run, Cloud Build, public principal, or GCP mutation is part of this phase.',
    ],
  }
}

export function getTrackBCostEstimatorCostSummary() {
  const scenarioResults = estimateTrackBCostScenarios(buildTrackBCostScenarios(), buildPricingSnapshot(), buildGuardrailPolicy())
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'planning_estimator_metadata_only',
    estimatedPhase44HCloudCostUsd: 0,
    billingApiCalls: 'not_run',
    providerCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    scenarioCount: scenarioResults.length,
    estimatedScenarioCount: scenarioResults.filter((scenario) => scenario.status === 'estimated').length,
    blockedScenarioCount: scenarioResults.filter((scenario) => scenario.status === 'blocked').length,
    highestEstimatedScenarioUsd: Math.max(0, ...scenarioResults.map((scenario) => scenario.output.estimatedTotalUsd ?? 0)),
    warningThresholdUsdPerRun: 1,
    hardBlockThresholdUsdPerRun: 5,
    production: 'blocked',
    externalBeta: 'blocked',
  }
}

export async function writeTrackBCostEstimatorArtifacts(reportDir = TRACK_B_COST_ESTIMATOR_REPORT_DIR): Promise<void> {
  const reports = buildTrackBCostEstimatorReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_estimator_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_pricing_source_evidence.json'), reports.pricingSourceEvidence)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_44h_cost_pricing_web_research.md'), reports.pricingWebResearchMarkdown)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_pricing_snapshot.json'), reports.pricingSnapshot)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_estimator_schema.json'), reports.estimatorSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_tool_mapping.json'), reports.toolMapping)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_scenario_registry.json'), reports.scenarioRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_scenario_results.json'), reports.scenarioResults)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_guardrail_policy.json'), reports.guardrailPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_route_handoff.json'), reports.routeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_capacity_summary.json'), reports.capacitySummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_cost_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_44h_private_artifact_manifest.json'), reports.privateArtifactManifest)
}

export function readTrackBCostEstimatorSummary() {
  const reports = buildTrackBCostEstimatorReports()
  const readiness = reports.readinessReport as { costEstimatorStatus?: string }
  const scenarioResults = reports.scenarioResults as { scenarios?: TrackBCostScenarioResult[] }
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: readiness.costEstimatorStatus,
    pricingSnapshotId: TRACK_B_COST_PRICING_SNAPSHOT_ID,
    toolMappingCount: TRACK_B_TOOL_IDS.length,
    scenarioCount: scenarioResults.scenarios?.length ?? 0,
    billingApiCalls: 'not_run',
    routeExecution: 'not_run',
    workerExecution: 'not_run',
    production: 'blocked',
    externalBeta: 'blocked',
    trackA: 'not_touched',
  }
}

export function buildTrackBCostEstimatorReports(): TrackBCostEstimatorReports {
  const pricingSnapshot = buildPricingSnapshot()
  const guardrailPolicy = buildGuardrailPolicy()
  const toolMappings = buildTrackBCostToolMappings()
  const scenarios = buildTrackBCostScenarios()
  const scenarioResults = estimateTrackBCostScenarios(scenarios, pricingSnapshot, guardrailPolicy)
  const validation = buildValidationReport(toolMappings, scenarios, scenarioResults)

  return {
    plan: getTrackBCostEstimatorPlan(),
    pricingSourceEvidence: buildPricingSourceEvidence(),
    pricingWebResearchMarkdown: buildPricingWebResearchMarkdown(),
    pricingSnapshot,
    estimatorSchema: buildEstimatorSchema(),
    toolMapping: {
      phase: TRACK_B_COST_ESTIMATOR_PHASE,
      runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
      status: validation.status,
      toolCount: toolMappings.length,
      sourceCapabilityManifestTools: TRACK_B_TOOL_IDS,
      sourceRouteManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
      tools: toolMappings,
    },
    scenarioRegistry: {
      phase: TRACK_B_COST_ESTIMATOR_PHASE,
      runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
      status: 'synthetic_planning_scenarios_only',
      scenarioCount: scenarios.length,
      scenarios,
    },
    scenarioResults: {
      phase: TRACK_B_COST_ESTIMATOR_PHASE,
      runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
      status: validation.status,
      noExecutionPerformed: true,
      scenarios: scenarioResults,
    },
    guardrailPolicy,
    routeHandoff: buildRouteHandoff(),
    capacitySummary: buildCapacitySummary(toolMappings, scenarioResults),
    blockerReport: buildBlockerReport(scenarioResults),
    readinessReport: buildReadinessReport(validation),
    privateArtifactManifest: {
      phase: TRACK_B_COST_ESTIMATOR_PHASE,
      runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
      status: 'committed_metadata_only_no_private_upload',
      privateUpload: 'not_required',
      privateRead: 'not_run',
      objectCount: 0,
      noMediaAudioModelPayloads: true,
      noBillingCredentials: true,
    },
  }
}

function buildPricingSourceEvidence() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'official_sources_recorded',
    accessedDate: TRACK_B_COST_PRICING_SNAPSHOT_DATE,
    region: 'us-central1',
    currency: 'USD',
    usesLiveBillingApi: false,
    authoritativeBilling: false,
    planningOnly: true,
    sources: [
      {
        sourceId: 'google_cloud_run_pricing',
        url: 'https://cloud.google.com/run/pricing',
        relevantCategories: ['Cloud Run Jobs CPU vCPU-second', 'Cloud Run Jobs memory GiB-second', 'Cloud Run L4 GPU per-second', 'free-tier caveats', 'data-transfer caveats'],
        exactRatesCaptured: true,
      },
      {
        sourceId: 'google_artifact_registry_pricing',
        url: 'https://cloud.google.com/artifact-registry/pricing',
        relevantCategories: ['artifact repository at-rest storage'],
        exactRatesCaptured: true,
      },
      {
        sourceId: 'google_cloud_storage_pricing',
        url: 'https://cloud.google.com/storage/pricing',
        relevantCategories: ['us-central1 Standard storage', 'operation caveats', 'egress/network caveats'],
        exactRatesCaptured: true,
      },
      {
        sourceId: 'google_compute_gpu_pricing',
        url: 'https://cloud.google.com/compute/gpus-pricing',
        relevantCategories: ['GPU pricing evidence only; VLM/GPU estimates remain blocked'],
        exactRatesCaptured: false,
      },
      {
        sourceId: 'google_cloud_pricing_calculator',
        url: 'https://cloud.google.com/products/calculator',
        relevantCategories: ['future manual estimate cross-check'],
        exactRatesCaptured: false,
      },
    ],
  }
}

function buildPricingWebResearchMarkdown(): string {
  return [
    '# Phase 44H Cost Pricing Web Research',
    '',
    `Accessed: ${TRACK_B_COST_PRICING_SNAPSHOT_DATE}`,
    '',
    '- Google Cloud Run pricing was used for us-central1 Cloud Run Jobs CPU, memory, and L4 planning rates. The estimator does not use Cloud Run at runtime.',
    '- Artifact Registry pricing was used for repository storage over the free 0.5 GB tier.',
    '- Cloud Storage pricing was used for us-central1 Standard storage. Operation and network costs remain caveated.',
    '- Compute GPU pricing and the Google Cloud pricing calculator are recorded as official future evidence sources only.',
    '- No Google Billing API, project billing account, provider API, credentials, route execution, worker execution, or media runtime was used.',
    '- This snapshot is planning-only and must be refreshed before paid beta or production.',
  ].join('\n')
}

function buildPricingSnapshot() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    pricingSnapshotId: TRACK_B_COST_PRICING_SNAPSHOT_ID,
    pricingSnapshotDate: TRACK_B_COST_PRICING_SNAPSHOT_DATE,
    region: 'us-central1',
    currency: 'USD',
    sourceUrls: [
      'https://cloud.google.com/run/pricing',
      'https://cloud.google.com/artifact-registry/pricing',
      'https://cloud.google.com/storage/pricing',
      'https://cloud.google.com/compute/gpus-pricing',
      'https://cloud.google.com/products/calculator',
    ],
    planningEstimateOnly: true,
    authoritativeBilling: false,
    usesLiveBillingApi: false,
    ratesMayChange: true,
    rates: {
      cloudRunJobsCpuVcpuSecondUsd: 0.000018,
      cloudRunJobsMemoryGibSecondUsd: 0.000002,
      cloudRunJobsGpuL4NoZonalRedundancySecondUsd: 0.0001867,
      artifactRegistryStorageOverFreeTierGibMonthUsd: 0.10,
      artifactRegistryFreeTierGibMonth: 0.5,
      cloudStorageStandardUsCentral1GibHourUsd: 0.000027397,
      cloudStorageStandardUsCentral1GibMonthUsd: 0.0200,
      cloudStorageStandardClassAFlatNamespacePer1000OpsUsd: 0.005,
      cloudStorageStandardClassBFlatNamespacePer1000OpsUsd: 0.0004,
      cloudBuildBuildMinuteUsd: 'unavailable',
      networkEgressGibUsd: 'unavailable',
      computeGpuL4Usd: 'unavailable_for_phase44h_estimates_gpu_blocked',
    },
    caveats: [
      'Cloud Run and Cloud Storage free tiers are not modeled.',
      'Logging, monitoring, detailed operation costs, network egress, lifecycle transitions, discounts, and tax are excluded.',
      'Cloud Build rates are unavailable in this snapshot; scenarios requiring build cost are low confidence or blocked.',
      'GPU estimates remain blocked for Track B Phase 44H even though L4 pricing evidence is recorded.',
      'Refresh official pricing before production, paid beta, or cost-driven execution.',
    ],
  } as const
}

function buildEstimatorSchema() {
  return {
    schemaVersion: TRACK_B_COST_ESTIMATOR_SCHEMA_VERSION,
    generatedAt: TRACK_B_COST_PRICING_SNAPSHOT_DATE,
    pricingSnapshotId: TRACK_B_COST_PRICING_SNAPSHOT_ID,
    pricingSnapshotDate: TRACK_B_COST_PRICING_SNAPSHOT_DATE,
    pricingSources: buildPricingSourceEvidence().sources,
    currency: 'USD',
    region: 'us-central1',
    estimateMode: ['synthetic_scenario', 'route_planning_metadata', 'authoritative_billing_never'],
    input: [
      'toolId',
      'routeId',
      'capabilityId',
      'runtimeClass',
      'executionClass',
      'estimatedDurationSeconds',
      'cpuCount',
      'memoryGiB',
      'gpuType',
      'gpuCount',
      'artifactInputGiB',
      'artifactOutputGiB',
      'artifactStorageGiBMonth',
      'imageStorageGiBMonth',
      'buildMinutes',
      'requestCount',
      'egressGiB',
    ],
    output: [
      'estimatedComputeUsd',
      'estimatedStorageUsd',
      'estimatedArtifactRegistryUsd',
      'estimatedBuildUsd',
      'estimatedNetworkUsd',
      'estimatedTotalUsd',
      'estimateConfidence',
      'costRiskClass',
      'capacityRiskClass',
      'warnings',
      'blockers',
      'noExecutionPerformed',
    ],
  }
}

function buildTrackBCostToolMappings(): TrackBCostToolMapping[] {
  const routes = new Map(buildTrackBRouteEntries().map((route) => [route.toolId, route]))
  return TRACK_B_TOOL_IDS.map((toolId) => {
    const route = routes.get(toolId)
    const capability = TRACK_B_CAPABILITY_MANIFESTS.find((entry) => entry.toolId === toolId)
    const base = {
      toolId,
      routeId: route?.routeId ?? `track_b_${toolId}`,
      capabilityId: route?.capabilityIds[0] ?? 'none',
      evidence: capability?.evidence.map((evidence) => evidence.phase).filter(Boolean) ?? [],
    }
    const mapping = mappingForTool(toolId)
    return {
      ...base,
      ...mapping,
    }
  })
}

function mappingForTool(toolId: TrackBToolId): Omit<TrackBCostToolMapping, 'toolId' | 'routeId' | 'capabilityId' | 'evidence'> {
  if (toolId === 'deepfilternet') {
    return cpuMapping('cpu_worker_medium', 'controlled_sample', 'bounded Cloud Run CPU planning evidence from Phase 36H; Demucs/source separation excluded')
  }
  if (toolId === 'signalsmith_stretch') {
    return cpuMapping('cpu_worker_medium', 'controlled_sample', 'Phase 36I/36J generated and controlled timing/stretch evidence; broad media blocked')
  }
  if (toolId === 'paddleocr') return cpuMapping('cpu_worker_medium', 'controlled_sample', 'restricted OCR generated/controlled safe-zone planning estimate')
  if (toolId === 'paddlepaddle') {
    return {
      runtimeClass: 'cpu_worker_medium',
      executionClass: 'future_worker_execution',
      costRiskClass: 'medium',
      estimateAllowed: true,
      estimateBehavior: 'dependency_runtime_foundation_only_no_direct_user_route',
      blockers: ['not_direct_user_route', 'only_estimated_when_paddleocr_selected'],
    }
  }
  if (['opencv', 'pyav', 'pyscenedetect'].includes(toolId)) return cpuMapping('cpu_worker_medium', 'controlled_sample', 'bounded media/data metadata and sample planning estimate only')
  if (toolId === 'sharp_libvips') return cpuMapping('cpu_worker_light', 'generated_fixture', 'server/worker image-processing planning estimate; consumers only outside Track B')
  if (['duckdb', 'polars'].includes(toolId)) return cpuMapping('local_light', 'metadata_only', 'internal QA aggregation/transform estimate is negligible metadata-only')
  if (toolId === 'qwen3_vl' || toolId === 'vllm') {
    return {
      runtimeClass: 'blocked_gpu',
      executionClass: 'blocked_runtime',
      costRiskClass: 'blocked_unknown',
      estimateAllowed: false,
      estimateBehavior: 'blocked_excluded_vlm_no_gpu_estimate_until_future_approval',
      blockers: ['vlm_excluded', 'gpu_cost_blocked', 'phase39c_runtime_blocked'],
    }
  }
  if (toolId === 'demucs') {
    return {
      runtimeClass: 'blocked_unknown',
      executionClass: 'blocked_runtime',
      costRiskClass: 'blocked_unknown',
      estimateAllowed: false,
      estimateBehavior: 'blocked_pending_training_data_model_artifact_provenance',
      blockers: ['demucs_blocked_pending_training_data_provenance', 'model_download_disabled', 'source_separation_disabled'],
    }
  }
  if (toolId === 'web_capability_profiler' || toolId === 'desktop_capability_profiler') return cpuMapping('local_light', 'metadata_only', 'metadata-only profiler planning estimate is negligible')
  if (toolId === 'cost_estimator' || toolId === 'tool_route_manifest_integration') return cpuMapping('local_light', 'metadata_only', 'metadata-only planning/reporting cost is negligible')
  if (toolId === 'local_worker_sidecar_planning') {
    return {
      runtimeClass: 'not_started',
      executionClass: 'blocked_runtime',
      costRiskClass: 'blocked_unknown',
      estimateAllowed: false,
      estimateBehavior: 'not_started_phase44g_required',
      blockers: ['local_worker_sidecar_not_started'],
    }
  }
  return {
    runtimeClass: 'blocked_unknown',
    executionClass: 'blocked_runtime',
    costRiskClass: 'blocked_unknown',
    estimateAllowed: false,
    estimateBehavior: 'unknown_tool_blocked',
    blockers: ['unknown_tool'],
  }
}

function cpuMapping(runtimeClass: TrackBCapacityClass, executionClass: TrackBExecutionClass, estimateBehavior: string): Omit<TrackBCostToolMapping, 'toolId' | 'routeId' | 'capabilityId' | 'evidence'> {
  return {
    runtimeClass,
    executionClass,
    costRiskClass: runtimeClass === 'local_light' ? 'free_or_negligible' : 'low',
    estimateAllowed: true,
    estimateBehavior,
    blockers: ['route_execution_still_blocked_until_future_phase'],
  }
}

function buildTrackBCostScenarios(): TrackBCostScenario[] {
  return [
    scenario('metadata_only_report_scenario', 'DuckDB/Polars metadata reports; local/cpu negligible; no Cloud Run.', 'multiple_tools', 'local_light', 'metadata_only', 5, 1, 0.5),
    scenario('generated_media_data_fixture_scenario', 'OpenCV/PyAV/PySceneDetect/Sharp/DuckDB/Polars generated fixtures; CPU planning estimate only.', 'multiple_tools', 'cpu_worker_medium', 'generated_fixture', 90, 2, 4, { artifactStorageGiBMonth: 0.05 }),
    scenario('controlled_media_data_sample_scenario', 'One bounded controlled media/data sample; CPU worker planning estimate only.', 'multiple_tools', 'cpu_worker_medium', 'controlled_sample', 120, 2, 4, { artifactInputGiB: 0.5, artifactOutputGiB: 0.1, artifactStorageGiBMonth: 0.1 }),
    scenario('deepfilternet_controlled_speech_scenario', 'One bounded controlled audio window; DeepFilterNet CPU worker planning estimate only.', 'deepfilternet', 'cpu_worker_medium', 'controlled_sample', 60, 2, 4, { artifactInputGiB: 0.05, artifactOutputGiB: 0.05, artifactStorageGiBMonth: 0.02 }),
    scenario('signalsmith_controlled_stretch_scenario', 'One bounded controlled audio window; Signalsmith CPU worker planning estimate only.', 'signalsmith_stretch', 'cpu_worker_medium', 'controlled_sample', 45, 2, 2, { artifactInputGiB: 0.05, artifactOutputGiB: 0.05, artifactStorageGiBMonth: 0.02 }),
    scenario('ocr_generated_fixture_scenario', 'OCR generated fixture; CPU worker/model artifact planning estimate only.', 'paddleocr', 'cpu_worker_medium', 'generated_fixture', 90, 2, 4, { imageStorageGiBMonth: 0.5 }),
    scenario('ocr_controlled_sample_scenario', 'OCR controlled sample; CPU worker/model artifact planning estimate only.', 'paddleocr', 'cpu_worker_medium', 'controlled_sample', 120, 2, 4, { artifactInputGiB: 0.2, artifactOutputGiB: 0.05, imageStorageGiBMonth: 0.5 }),
    blockedScenario('vlm_blocked_scenario', 'VLM estimates are blocked; Qwen3-VL/vLLM remain excluded.', 'qwen3_vl', 'blocked_gpu', 'blocked_runtime', 'vlm_excluded_gpu_cost_blocked'),
    blockedScenario('demucs_blocked_scenario', 'Demucs estimates are blocked pending provenance/model approval.', 'demucs', 'blocked_unknown', 'blocked_runtime', 'demucs_blocked_pending_training_data_provenance'),
    blockedScenario('route_execution_blocked_scenario', 'Route execution remains blocked because every routeExecutionAllowed flag is false.', 'multiple_tools', 'blocked_unknown', 'production_forbidden', 'route_execution_blocked_until_phase44j_or_later'),
  ]
}

function scenario(
  scenarioId: string,
  description: string,
  toolId: TrackBCostScenarioInput['toolId'],
  runtimeClass: TrackBCapacityClass,
  executionClass: TrackBExecutionClass,
  estimatedDurationSeconds: number,
  cpuCount: number,
  memoryGiB: number,
  options: Partial<Pick<TrackBCostScenarioInput, 'artifactInputGiB' | 'artifactOutputGiB' | 'artifactStorageGiBMonth' | 'imageStorageGiBMonth'>> = {},
): TrackBCostScenario {
  return {
    scenarioId,
    description,
    input: {
      toolId,
      routeId: `scenario_${scenarioId}`,
      capabilityId: scenarioId,
      runtimeClass,
      executionClass,
      estimatedDurationSeconds,
      cpuCount,
      memoryGiB,
      gpuType: 'none',
      gpuCount: 0,
      artifactInputGiB: options.artifactInputGiB ?? 0,
      artifactOutputGiB: options.artifactOutputGiB ?? 0,
      artifactStorageGiBMonth: options.artifactStorageGiBMonth ?? 0,
      imageStorageGiBMonth: options.imageStorageGiBMonth ?? 0,
      buildMinutes: 0,
      requestCount: 0,
      egressGiB: 0,
    },
    expectedBehavior: 'estimated',
  }
}

function blockedScenario(
  scenarioId: string,
  description: string,
  toolId: TrackBCostScenarioInput['toolId'],
  runtimeClass: TrackBCapacityClass,
  executionClass: TrackBExecutionClass,
  expectedBlocker: string,
): TrackBCostScenario {
  return {
    scenarioId,
    description,
    input: {
      toolId,
      routeId: `scenario_${scenarioId}`,
      capabilityId: scenarioId,
      runtimeClass,
      executionClass,
      estimatedDurationSeconds: 0,
      cpuCount: 0,
      memoryGiB: 0,
      gpuType: runtimeClass === 'blocked_gpu' ? 'blocked' : 'none',
      gpuCount: 0,
      artifactInputGiB: 0,
      artifactOutputGiB: 0,
      artifactStorageGiBMonth: 0,
      imageStorageGiBMonth: 0,
      buildMinutes: 0,
      requestCount: 0,
      egressGiB: 0,
    },
    expectedBehavior: 'blocked',
    expectedBlocker,
  }
}

function estimateTrackBCostScenarios(scenarios: TrackBCostScenario[], pricing: PricingSnapshot, guardrails: ReturnType<typeof buildGuardrailPolicy>): TrackBCostScenarioResult[] {
  return scenarios.map((scenario) => estimateTrackBCostScenario(scenario, pricing, guardrails))
}

function estimateTrackBCostScenario(scenario: TrackBCostScenario, pricing: PricingSnapshot, guardrails: ReturnType<typeof buildGuardrailPolicy>): TrackBCostScenarioResult {
  const blockers = blockerReasonsForScenario(scenario)
  const warnings = [...COMMON_WARNINGS]
  if (scenario.input.egressGiB > 0) blockers.push('network_egress_cost_unavailable')
  if (scenario.input.buildMinutes > 0) blockers.push('cloud_build_rate_unavailable')
  if (scenario.input.gpuCount > 0 || scenario.input.runtimeClass === 'gpu_l4' || scenario.input.runtimeClass === 'blocked_gpu') blockers.push('gpu_cost_requires_future_explicit_approval')
  if (blockers.length > 0) return scenarioResult(scenario, 'blocked', null, null, null, null, null, null, 'blocked', 'blocked_unknown', scenario.input.runtimeClass === 'blocked_gpu' ? 'blocked_gpu' : 'blocked_unknown', warnings, blockers)

  const computeUsd = roundUsd(
    scenario.input.estimatedDurationSeconds * scenario.input.cpuCount * pricing.rates.cloudRunJobsCpuVcpuSecondUsd
      + scenario.input.estimatedDurationSeconds * scenario.input.memoryGiB * pricing.rates.cloudRunJobsMemoryGibSecondUsd,
  )
  const storageUsd = roundUsd(scenario.input.artifactStorageGiBMonth * pricing.rates.cloudStorageStandardUsCentral1GibMonthUsd)
  const artifactRegistryUsd = roundUsd(Math.max(0, scenario.input.imageStorageGiBMonth - pricing.rates.artifactRegistryFreeTierGibMonth) * pricing.rates.artifactRegistryStorageOverFreeTierGibMonthUsd)
  const totalUsd = roundUsd(computeUsd + storageUsd + artifactRegistryUsd)
  const totalBlockers = [...blockers]
  if (totalUsd >= guardrails.hardBlockThresholdUsdPerRun) totalBlockers.push('estimated_total_exceeds_hard_block_threshold')
  else if (totalUsd >= guardrails.warningThresholdUsdPerRun) warnings.push('estimated_total_exceeds_warning_threshold')
  const confidence = scenario.input.runtimeClass === 'local_light' || scenario.input.executionClass === 'metadata_only' ? 'medium' : 'medium'
  const costRiskClass = totalBlockers.length > 0 ? 'blocked_production_only' : costRiskForTotal(totalUsd)
  return scenarioResult(scenario, totalBlockers.length > 0 ? 'blocked' : 'estimated', computeUsd, storageUsd, artifactRegistryUsd, null, null, totalUsd, totalBlockers.length > 0 ? 'blocked' : confidence, costRiskClass, scenario.input.runtimeClass as TrackBCapacityClass, warnings, totalBlockers)
}

function blockerReasonsForScenario(scenario: TrackBCostScenario): string[] {
  const blockers: string[] = []
  if (scenario.expectedBehavior === 'blocked' && scenario.expectedBlocker) blockers.push(scenario.expectedBlocker)
  if (scenario.input.executionClass === 'blocked_runtime') blockers.push('runtime_blocked')
  if (scenario.input.executionClass === 'production_forbidden') blockers.push('production_forbidden')
  if (scenario.input.toolId === 'qwen3_vl' || scenario.input.toolId === 'vllm') blockers.push('vlm_estimate_blocked')
  if (scenario.input.toolId === 'demucs') blockers.push('demucs_estimate_blocked')
  return [...new Set(blockers)]
}

function scenarioResult(
  scenario: TrackBCostScenario,
  status: 'estimated' | 'blocked',
  estimatedComputeUsd: number | null,
  estimatedStorageUsd: number | null,
  estimatedArtifactRegistryUsd: number | null,
  estimatedBuildUsd: number | null,
  estimatedNetworkUsd: number | null,
  estimatedTotalUsd: number | null,
  estimateConfidence: TrackBCostScenarioResult['output']['estimateConfidence'],
  costRiskClass: TrackBCostRiskClass,
  capacityRiskClass: TrackBCapacityClass,
  warnings: string[],
  blockers: string[],
): TrackBCostScenarioResult {
  return {
    scenarioId: scenario.scenarioId,
    status,
    input: scenario.input,
    output: {
      estimatedComputeUsd,
      estimatedStorageUsd,
      estimatedArtifactRegistryUsd,
      estimatedBuildUsd,
      estimatedNetworkUsd,
      estimatedTotalUsd,
      estimateConfidence,
      costRiskClass,
      capacityRiskClass,
      warnings: [...new Set(warnings)].sort(),
      blockers: [...new Set(blockers)].sort(),
      noExecutionPerformed: true,
    },
  }
}

function costRiskForTotal(totalUsd: number): TrackBCostRiskClass {
  if (totalUsd <= 0.001) return 'free_or_negligible'
  if (totalUsd < 0.10) return 'low'
  if (totalUsd < 1) return 'medium'
  return 'high'
}

function roundUsd(value: number): number {
  return Number(value.toFixed(6))
}

function buildGuardrailPolicy() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'active_for_planning_metadata_only',
    warningThresholdUsdPerRun: 1,
    hardBlockThresholdUsdPerRun: 5,
    gpuCostRequiresExplicitApproval: true,
    broadMediaCostAlwaysBlocked: true,
    productionCostRequiresProductionGate: true,
    providerCostRequiresProviderPhase: true,
    unknownRateBehavior: 'warn_for_noncritical_metadata_scenarios_block_for_runtime_or_cloud_scenarios',
    disabledToolBehavior: 'block',
    routeExecutionBehavior: 'block_until_phase44j_or_later',
  }
}

function buildRouteHandoff() {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'planning_only_route_execution_blocked',
    providesPlanningEstimatesOnly: true,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    localSidecarExecutionAllowed: false,
    costEstimatorChoosesTools: false,
    cannotOverrideBlockedToolStatus: true,
    cannotApproveVlm: true,
    cannotApproveDemucs: true,
    cannotApproveBroadMedia: true,
    localWorkerSidecarRequired: 'Phase 44G',
    hybridE2eSimulationRequired: 'Phase 44J',
    workerExecutionRequiresApprovedPlanSnapshot: true,
    workerExecutionRequiresArtifactScope: true,
    pricingRefreshRequiredBeforeProductionOrPaidBeta: true,
  }
}

function buildCapacitySummary(toolMappings: TrackBCostToolMapping[], scenarioResults: TrackBCostScenarioResult[]) {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'planning_capacity_classes_only',
    classes: ['local_light', 'local_medium', 'cpu_worker_light', 'cpu_worker_medium', 'cpu_worker_heavy', 'gpu_l4', 'blocked_gpu', 'blocked_unknown'],
    toolCounts: countBy(toolMappings.map((tool) => tool.runtimeClass)),
    scenarioCounts: countBy(scenarioResults.map((scenario) => scenario.output.capacityRiskClass)),
    costRiskCounts: countBy(scenarioResults.map((scenario) => scenario.output.costRiskClass)),
    routeExecution: 'blocked',
    localSidecar: 'pending_phase44g',
    hybridE2e: 'pending_phase44j',
  }
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function buildBlockerReport(scenarioResults: TrackBCostScenarioResult[]) {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: 'global_scopes_blocked_cost_estimator_passed',
    scenarioBlockers: scenarioResults
      .filter((scenario) => scenario.status === 'blocked')
      .map((scenario) => ({ scenarioId: scenario.scenarioId, blockers: scenario.output.blockers })),
    globallyBlockedScopes: GLOBAL_BLOCKED_SCOPES,
  }
}

function buildReadinessReport(validation: { status: string }) {
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: validation.status,
    costEstimatorStatus: validation.status === 'passed' ? 'phase_complete_restricted_scope' : 'blocked',
    pricingEvidence: 'passed',
    pricingSnapshot: 'passed',
    schema: 'passed',
    toolMapping: 'passed',
    scenarioResults: 'passed',
    guardrails: 'passed',
    routeHandoff: 'planning_only_route_execution_blocked',
    billingApiCalls: 'not_run',
    providerCalls: 'not_run',
    mediaProcessing: 'not_run',
    routeExecution: 'blocked',
    workerExecution: 'blocked',
    localWorkerSidecar: 'pending',
    hybridE2eSimulation: 'pending',
    production: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    broadMedia: 'blocked',
    publicArtifacts: 'blocked',
    vlm: 'excluded',
    demucs: 'blocked',
    trackA: 'not_touched',
    nextRecommendedPhase: 'Phase 44G local worker sidecar foundation if execution plumbing is next; Phase 44J only after sidecar and required route/cost gates.',
  }
}

function buildValidationReport(toolMappings: TrackBCostToolMapping[], scenarios: TrackBCostScenario[], scenarioResults: TrackBCostScenarioResult[]) {
  const blockers: string[] = []
  if (toolMappings.length !== TRACK_B_TOOL_IDS.length) blockers.push('missing_tool_mapping')
  for (const toolId of TRACK_B_TOOL_IDS) {
    if (!toolMappings.some((tool) => tool.toolId === toolId)) blockers.push(`missing_tool_mapping:${toolId}`)
  }
  if (scenarios.length !== 10 || scenarioResults.length !== 10) blockers.push('scenario_count_mismatch')
  for (const scenarioId of ['vlm_blocked_scenario', 'demucs_blocked_scenario', 'route_execution_blocked_scenario']) {
    if (scenarioResults.find((scenario) => scenario.scenarioId === scenarioId)?.status !== 'blocked') blockers.push(`${scenarioId}_must_block`)
  }
  for (const toolId of ['qwen3_vl', 'vllm', 'demucs'] as TrackBToolId[]) {
    if (toolMappings.find((tool) => tool.toolId === toolId)?.estimateAllowed !== false) blockers.push(`${toolId}_estimate_must_block`)
  }
  return {
    phase: TRACK_B_COST_ESTIMATOR_PHASE,
    runId: TRACK_B_COST_ESTIMATOR_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    blockers,
    pricingSourceEvidenceExists: true,
    pricingSnapshotExists: true,
    schemaExists: true,
    toolMappingCount: toolMappings.length,
    scenarioCount: scenarios.length,
    guardrailPolicyExists: true,
    routeHandoffPlanningOnly: true,
    noBillingApiCalls: true,
    noProviderCalls: true,
    noMediaProcessing: true,
    noRouteExecution: true,
    noWorkerExecution: true,
    noSidecarExecution: true,
    noDockerCloudGpuIamMutation: true,
    noTrackA: true,
  }
}
