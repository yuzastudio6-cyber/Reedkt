import {
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
  validateLocalWorkerArtifactScope,
  validateLocalWorkerPlanSnapshot,
  validateLocalWorkerProtocolVersion,
  type LocalWorkerSidecarArtifactScopeValidationRequest,
  type LocalWorkerSidecarToolId,
} from '../local-worker-sidecar'

export const HYBRID_COMPUTE_E2E_SCHEMA_VERSION = 'track-b-hybrid-compute-e2e-simulation-v1'
export const HYBRID_COMPUTE_E2E_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'
export const HYBRID_COMPUTE_E2E_PLAN_SNAPSHOT_POLICY_VERSION = 'track-b-hybrid-plan-snapshot-policy-v1'
export const HYBRID_COMPUTE_E2E_ARTIFACT_SCOPE_POLICY_VERSION = 'track-b-hybrid-artifact-scope-policy-v1'
export const HYBRID_COMPUTE_E2E_DATE = '2026-06-04'

export type HybridE2ERouteStatus =
  | 'route_enabled_restricted_internal'
  | 'route_disabled_blocked'
  | 'route_disabled_not_started'
  | 'route_disabled_excluded'
  | 'route_disabled_pending_integration'
  | 'route_handoff_only'

export type HybridE2EPlanStatus = 'passed' | 'blocked'
export type HybridE2ERouteRecommendation = 'eligible_metadata_only' | 'blocked' | 'handoff_only' | 'future_local_candidate' | 'future_server_candidate'
export type HybridE2ECostDecision = 'within_guardrail' | 'warning_only' | 'blocked'
export type HybridE2ECapacityHint = 'local_light' | 'local_medium' | 'server_worker_preferred' | 'blocked_gpu' | 'blocked_unknown'

export interface HybridE2ERouteEntryLike {
  routeId: string
  toolId: LocalWorkerSidecarToolId
  routeStatus: HybridE2ERouteStatus
  routeable: boolean
  routeExecutionAllowed: boolean
  runtimeExecutionAllowed: boolean
  blockedReasons: string[]
  capabilityIds: string[]
  privateGcsPrefixes: string[]
}

export interface HybridE2EPlanFixture {
  fixtureId: string
  description: string
  toolId: LocalWorkerSidecarToolId
  capabilityId: string
  planSnapshotId?: string
  inputArtifactScopeId?: string
  outputArtifactScopeId?: string
  privateGcsPrefix: string
  routeManifestVersion?: string
  sourcePhase: string
  confirmationPhase: string
  auditReportPath: string
  requesterContext: 'internal_qa_planning' | 'worker_orchestration_planning'
  syntheticProfileHint?: 'low_resource_desktop' | 'high_desktop_future_local' | 'server_preferred'
  estimatedCostUsd: number
  expectedRouteRecommendation: HybridE2ERouteRecommendation
  expectedBlockedReasons: string[]
  rawChatExecutionRequested?: boolean
  publicOutputRequested?: boolean
  broadMediaRequested?: boolean
  arbitraryMediaRequested?: boolean
  providerCallRequested?: boolean
  frontendSecretRequested?: boolean
  gpuRequested?: boolean
  productionRequested?: boolean
  costHardBlockRequested?: boolean
  missingCapabilityManifest?: boolean
  artifactScopeMismatch?: boolean
}

export interface HybridE2EArtifactScopeFixture {
  fixtureId: string
  description: string
  request: LocalWorkerSidecarArtifactScopeValidationRequest
  outputArtifactScopeId?: string
  expectedAccepted: boolean
  expectedBlockedReasons: string[]
}

export interface HybridE2EPlanValidationResult {
  fixtureId: string
  status: HybridE2EPlanStatus
  accepted: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface HybridE2EArtifactScopeResult {
  fixtureId: string
  status: HybridE2EPlanStatus
  accepted: boolean
  blockedReasons: string[]
  missingExpectedBlockedReasons: string[]
}

export interface HybridE2ERouteSimulationResult {
  fixtureId: string
  toolId: LocalWorkerSidecarToolId
  status: HybridE2EPlanStatus
  recommendation: HybridE2ERouteRecommendation
  routeId?: string
  routeStatus?: HybridE2ERouteStatus
  routeExecutionAllowed: false
  runtimeExecutionAllowed: false
  workerExecutionAllowed: false
  noExecutionPerformed: true
  blockedReasons: string[]
  warnings: string[]
}

export interface HybridE2ECostSimulationResult {
  fixtureId: string
  toolId: LocalWorkerSidecarToolId
  status: HybridE2EPlanStatus
  decision: HybridE2ECostDecision
  estimatedCostUsd: number
  warningThresholdUsd: number
  hardBlockThresholdUsd: number
  capacityHint: HybridE2ECapacityHint
  noBillingApiCalls: true
  noExecutionPerformed: true
  blockedReasons: string[]
  warnings: string[]
}

export interface HybridE2ESidecarSimulationResult {
  fixtureId: string
  status: HybridE2EPlanStatus
  planValidationAccepted: boolean
  artifactScopeAccepted: boolean
  executionBlocked: true
  executionBlockedReason: 'phase44j_metadata_simulation_no_execution'
  sidecarProtocolVersion: string
  blockedReasons: string[]
  warnings: string[]
}

export interface HybridE2EFailureSimulationResult {
  fixtureId: string
  status: 'passed'
  blocked: true
  blockedReasons: string[]
  noFallbackToRawExecution: true
  noExecutionPerformed: true
}

export interface HybridE2EValidationReport {
  status: 'passed' | 'blocked'
  planFixtureCount: number
  artifactScopeFixtureCount: number
  routeSimulationCount: number
  costSimulationCount: number
  sidecarSimulationCount: number
  failureSimulationCount: number
  missingExpectations: string[]
  noExecutionPerformed: true
}

export const HYBRID_COMPUTE_E2E_GLOBAL_BLOCKED_SCOPES = [
  'route execution',
  'runtime execution',
  'worker execution',
  'actual local sidecar execution',
  'tool execution',
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
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'GCP mutation',
  'IAM mutation',
  'billing API calls',
  'public artifacts',
  'public output',
  'broad media',
  'arbitrary media input',
  'signed URLs as source of truth',
  'frontend service-role secret access',
  'product-wide internal beta',
  'external beta',
  'paid production',
  'production',
  'Track A runtime/visual/render stack',
] as const

const PRIVATE_REPORT_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44j/hybrid-compute-e2e-simulation/'
const PRIVATE_AUDIO_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36j/controlled-real-media-timing-stretch/'
const PRIVATE_MEDIA_DATA_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46e/media-data-internal-beta-readiness-gate/'
const PRIVATE_OCR_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/'

export function buildHybridComputeE2ESimulationSchema() {
  return {
    schemaVersion: HYBRID_COMPUTE_E2E_SCHEMA_VERSION,
    generatedAt: HYBRID_COMPUTE_E2E_DATE,
    simulationMode: 'synthetic_metadata_only',
    noExecutionPerformed: true,
    routeManifestVersion: HYBRID_COMPUTE_E2E_ROUTE_MANIFEST_VERSION,
    planSnapshotPolicyVersion: HYBRID_COMPUTE_E2E_PLAN_SNAPSHOT_POLICY_VERSION,
    artifactScopePolicyVersion: HYBRID_COMPUTE_E2E_ARTIFACT_SCOPE_POLICY_VERSION,
    routeRecommendations: ['eligible_metadata_only', 'blocked', 'handoff_only', 'future_local_candidate', 'future_server_candidate'],
    requiredPlanSnapshotFields: [
      'planSnapshotId',
      'toolId',
      'approvedCapabilityId',
      'sourcePhase',
      'routeManifestVersion',
      'inputArtifactScopeId',
      'outputArtifactScopeId',
      'privateGcsPrefix',
      'requesterContext',
      'confirmationPhase',
      'auditReportPath',
      'failureBehavior',
    ],
    blockedInputs: HYBRID_COMPUTE_E2E_GLOBAL_BLOCKED_SCOPES,
  }
}

export function buildHybridComputeE2EPlanFixtures(): HybridE2EPlanFixture[] {
  return [
    eligiblePlan('plan-audio-deepfilternet-internal', 'DeepFilterNet bounded speech-cleanup metadata route simulation.', 'deepfilternet', 'bounded_speech_cleanup', 'phase36m_audio_timing_gate', PRIVATE_AUDIO_PREFIX),
    eligiblePlan('plan-audio-signalsmith-internal', 'Signalsmith bounded timing/stretch metadata route simulation.', 'signalsmith_stretch', 'bounded_timing_stretch', 'phase36m_audio_timing_gate', PRIVATE_AUDIO_PREFIX),
    eligiblePlan('plan-media-data-sharp-thumbnail', 'Sharp/libvips internal metadata-only thumbnail route simulation.', 'sharp_libvips', 'thumbnail_generation', 'phase46e_media_data_gate', PRIVATE_MEDIA_DATA_PREFIX),
    eligiblePlan('plan-media-data-duckdb-reporting', 'DuckDB metadata reporting route simulation.', 'duckdb', 'metadata_reporting', 'phase46e_media_data_gate', PRIVATE_REPORT_PREFIX),
    eligiblePlan('plan-ocr-safe-zone', 'PaddleOCR safe-zone metadata route simulation.', 'paddleocr', 'safe_zone_ocr_signal', 'phase37e_ocr_safe_zone_gate', PRIVATE_OCR_PREFIX),
    blockedPlan('plan-vlm-blocked', 'VLM route simulation remains excluded by Phase 39C evidence.', 'qwen3_vl', 'vlm_runtime_candidate', ['vlm_route_blocked']),
    blockedPlan('plan-demucs-blocked', 'Demucs route simulation remains blocked pending provenance/legal review.', 'demucs', 'source_separation', ['demucs_route_blocked']),
    {
      ...eligiblePlan('plan-broad-media-blocked', 'Broad media request must fail closed before route/cost/sidecar handoff.', 'opencv', 'bounded_frame_metrics', 'phase46e_media_data_gate', PRIVATE_MEDIA_DATA_PREFIX),
      broadMediaRequested: true,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['broad_media_blocked'],
    },
    {
      ...eligiblePlan('plan-public-output-blocked', 'Public output request must fail closed before route handoff.', 'sharp_libvips', 'image_resize', 'phase46e_media_data_gate', PRIVATE_MEDIA_DATA_PREFIX),
      publicOutputRequested: true,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['public_output_blocked'],
    },
    {
      ...eligiblePlan('plan-provider-call-blocked', 'Provider call request must fail closed; providers are outside Phase 44J.', 'paddleocr', 'safe_zone_ocr_signal', 'phase37e_ocr_safe_zone_gate', PRIVATE_OCR_PREFIX),
      providerCallRequested: true,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['provider_calls_blocked'],
    },
    {
      ...eligiblePlan('plan-raw-chat-execution-blocked', 'Raw chat execution request must never become a route input.', 'duckdb', 'metadata_reporting', 'phase46e_media_data_gate', PRIVATE_REPORT_PREFIX),
      rawChatExecutionRequested: true,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['raw_chat_execution_blocked'],
    },
    {
      ...eligiblePlan('plan-missing-artifact-scope-blocked', 'Missing output artifact scope must fail closed.', 'polars', 'metadata_reporting', 'phase46e_media_data_gate', PRIVATE_REPORT_PREFIX),
      outputArtifactScopeId: undefined,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['missing_outputArtifactScopeId'],
    },
    {
      ...eligiblePlan('plan-cost-hard-block', 'Cost hard-block fixture must fail closed without route or worker execution.', 'pyscenedetect', 'bounded_scene_manifest', 'phase46e_media_data_gate', PRIVATE_MEDIA_DATA_PREFIX),
      costHardBlockRequested: true,
      estimatedCostUsd: 7.5,
      expectedRouteRecommendation: 'blocked',
      expectedBlockedReasons: ['cost_hard_block_requested'],
    },
    {
      ...eligiblePlan('plan-low-resource-server-preferred', 'Low-resource desktop profile should prefer future server worker planning only.', 'pyav', 'bounded_metadata_decode', 'phase46e_media_data_gate', PRIVATE_MEDIA_DATA_PREFIX),
      syntheticProfileHint: 'low_resource_desktop',
      expectedRouteRecommendation: 'future_server_candidate',
      expectedBlockedReasons: [],
    },
    {
      ...eligiblePlan('plan-high-desktop-future-local-candidate', 'High desktop profile can become a future local candidate, still without execution.', 'duckdb', 'metadata_reporting', 'phase46e_media_data_gate', PRIVATE_REPORT_PREFIX),
      syntheticProfileHint: 'high_desktop_future_local',
      expectedRouteRecommendation: 'future_local_candidate',
      expectedBlockedReasons: [],
    },
  ]
}

export function buildHybridComputeE2EArtifactScopeFixtures(): HybridE2EArtifactScopeFixture[] {
  return [
    artifactFixture('artifact-private-generated-scope', 'Private generated fixture metadata scope.', 'hybrid-generated-scope', ['generated_fixture_metadata', 'report_json'], `${PRIVATE_REPORT_PREFIX}generated/`, false, []),
    artifactFixture('artifact-private-controlled-scope', 'Private controlled sample metadata scope.', 'hybrid-controlled-scope', ['controlled_sample_metadata', 'report_json'], `${PRIVATE_REPORT_PREFIX}controlled/`, false, []),
    artifactFixture('artifact-private-reporting-scope', 'Private reporting metadata scope.', 'hybrid-reporting-scope', ['report_json', 'scorecard_json'], `${PRIVATE_REPORT_PREFIX}reporting/`, false, []),
    artifactFixture('artifact-block-public-output', 'Public artifact request must fail closed.', 'hybrid-public-blocked-scope', ['report_json'], `${PRIVATE_REPORT_PREFIX}public-blocked/`, true, ['public_artifact_blocked']),
    artifactFixture('artifact-block-arbitrary-path', 'Arbitrary local paths must fail closed.', 'hybrid-arbitrary-path-scope', ['report_json'], `${PRIVATE_REPORT_PREFIX}arbitrary-path-blocked/`, false, ['arbitrary_path_blocked'], { arbitraryPathRequested: true }),
    artifactFixture('artifact-block-signed-url-source', 'Signed URLs cannot be source of truth.', 'hybrid-signed-url-scope', ['report_json'], `${PRIVATE_REPORT_PREFIX}signed-url-blocked/`, false, ['signed_url_source_of_truth_blocked'], { signedUrlAsSourceOfTruth: true }),
    {
      fixtureId: 'artifact-block-missing-output-scope',
      description: 'Missing output artifact scope must fail closed.',
      request: {
        type: 'artifact_scope_validate_request',
        artifactScopeId: 'hybrid-missing-output-scope',
        artifactClasses: ['report_json'],
        privateGcsPrefix: `${PRIVATE_REPORT_PREFIX}missing-output/`,
        localTempScope: 'ephemeral_only',
      },
      outputArtifactScopeId: undefined,
      expectedAccepted: false,
      expectedBlockedReasons: ['missing_output_artifact_scope'],
    },
  ]
}

export function validateHybridPlanSnapshot(fixture: HybridE2EPlanFixture): HybridE2EPlanValidationResult {
  const response = validateLocalWorkerPlanSnapshot({
    type: 'plan_snapshot_validate_request',
    planSnapshotId: fixture.planSnapshotId,
    routeId: `track_b_${fixture.toolId}`,
    toolId: fixture.toolId,
    capabilityId: fixture.capabilityId,
    inputArtifactScopeId: fixture.inputArtifactScopeId,
    outputArtifactScopeId: fixture.outputArtifactScopeId,
    requestedAction: 'validate_only',
    confirmationPhase: fixture.confirmationPhase,
    sourcePhase: fixture.sourcePhase,
    routeManifestVersion: fixture.routeManifestVersion,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    publicOutputAllowed: fixture.publicOutputRequested,
    broadMediaAllowed: fixture.broadMediaRequested,
    arbitraryMediaAllowed: fixture.arbitraryMediaRequested,
    providerCallsAllowed: fixture.providerCallRequested,
    rawChatText: fixture.rawChatExecutionRequested ? 'redacted_raw_chat_not_allowed' : undefined,
    signedUrlAsSourceOfTruth: false,
    maxRuntimeBounds: { maxDurationSeconds: 0, maxInputCount: 0, maxOutputSizeBytes: 0 },
    auditReportPath: fixture.auditReportPath,
  })
  const blockedReasons = [...response.blockedReasons]
  if (fixture.frontendSecretRequested) blockedReasons.push('frontend_secret_request_blocked')
  if (fixture.gpuRequested) blockedReasons.push('gpu_runtime_blocked')
  if (fixture.productionRequested) blockedReasons.push('production_blocked')
  if (fixture.costHardBlockRequested) blockedReasons.push('cost_hard_block_requested')
  if (fixture.missingCapabilityManifest) blockedReasons.push('missing_capability_manifest')
  if (fixture.artifactScopeMismatch) blockedReasons.push('artifact_scope_mismatch')

  return {
    fixtureId: fixture.fixtureId,
    status: blockedReasons.length === 0 ? 'passed' : 'blocked',
    accepted: blockedReasons.length === 0,
    blockedReasons,
    warnings: response.warnings,
  }
}

export function runHybridArtifactScopeFixtures(fixtures = buildHybridComputeE2EArtifactScopeFixtures()): HybridE2EArtifactScopeResult[] {
  return fixtures.map((fixture) => {
    const response = validateLocalWorkerArtifactScope(fixture.request)
    const blockedReasons = [...response.blockedReasons]
    if (!fixture.outputArtifactScopeId) blockedReasons.push('missing_output_artifact_scope')
    const accepted = blockedReasons.length === 0
    const missingExpectedBlockedReasons = fixture.expectedBlockedReasons.filter((reason) => !blockedReasons.includes(reason))
    const expectationMet = accepted === fixture.expectedAccepted && missingExpectedBlockedReasons.length === 0
    return {
      fixtureId: fixture.fixtureId,
      status: expectationMet ? 'passed' : 'blocked',
      accepted,
      blockedReasons,
      missingExpectedBlockedReasons,
    }
  })
}

export function simulateHybridRouteDecisions(
  routeEntries: HybridE2ERouteEntryLike[],
  fixtures = buildHybridComputeE2EPlanFixtures(),
): HybridE2ERouteSimulationResult[] {
  const routes = new Map(routeEntries.map((entry) => [entry.toolId, entry]))
  return fixtures.map((fixture) => {
    const validation = validateHybridPlanSnapshot(fixture)
    const route = routes.get(fixture.toolId)
    const blockedReasons = [...validation.blockedReasons]
    const warnings = [...validation.warnings]

    if (!route) blockedReasons.push('missing_route_manifest_entry')
    if (route?.routeExecutionAllowed) blockedReasons.push('unexpected_route_execution_allowed')
    if (route?.runtimeExecutionAllowed) blockedReasons.push('unexpected_runtime_execution_allowed')

    let recommendation: HybridE2ERouteRecommendation = 'blocked'
    if (blockedReasons.length === 0 && route) {
      if (route.routeStatus === 'route_handoff_only') recommendation = 'handoff_only'
      else if (route.routeStatus === 'route_enabled_restricted_internal') {
        if (fixture.syntheticProfileHint === 'high_desktop_future_local') recommendation = 'future_local_candidate'
        else if (fixture.syntheticProfileHint === 'low_resource_desktop' || fixture.syntheticProfileHint === 'server_preferred') recommendation = 'future_server_candidate'
        else recommendation = 'eligible_metadata_only'
      } else {
        blockedReasons.push(...route.blockedReasons)
      }
    }
    if (recommendation !== fixture.expectedRouteRecommendation) blockedReasons.push(`unexpected_route_recommendation:${recommendation}`)

    return {
      fixtureId: fixture.fixtureId,
      toolId: fixture.toolId,
      status: blockedReasons.length === 0 || recommendation !== 'blocked' ? (blockedReasons.some((reason) => reason.startsWith('unexpected_')) ? 'blocked' : 'passed') : 'passed',
      recommendation,
      routeId: route?.routeId,
      routeStatus: route?.routeStatus,
      routeExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      workerExecutionAllowed: false,
      noExecutionPerformed: true,
      blockedReasons,
      warnings,
    }
  })
}

export function simulateHybridCostDecisions(fixtures = buildHybridComputeE2EPlanFixtures()): HybridE2ECostSimulationResult[] {
  const warningThresholdUsd = 1
  const hardBlockThresholdUsd = 5
  return fixtures.map((fixture) => {
    const validation = validateHybridPlanSnapshot(fixture)
    const blockedReasons = [...validation.blockedReasons]
    const warnings = [...validation.warnings]
    if (fixture.toolId === 'qwen3_vl' || fixture.toolId === 'vllm') blockedReasons.push('vlm_gpu_cost_blocked')
    if (fixture.toolId === 'demucs') blockedReasons.push('demucs_cost_blocked_pending_provenance')
    if (fixture.providerCallRequested) blockedReasons.push('provider_cost_blocked')
    if (fixture.broadMediaRequested) blockedReasons.push('broad_media_cost_blocked')
    if (fixture.gpuRequested) blockedReasons.push('gpu_cost_blocked')
    if (fixture.productionRequested) blockedReasons.push('production_cost_blocked')
    if (fixture.estimatedCostUsd > hardBlockThresholdUsd) blockedReasons.push('cost_hard_block_threshold_exceeded')
    if (fixture.estimatedCostUsd > warningThresholdUsd && fixture.estimatedCostUsd <= hardBlockThresholdUsd) warnings.push('cost_warning_threshold_exceeded')

    const decision: HybridE2ECostDecision = blockedReasons.length > 0 ? 'blocked' : warnings.includes('cost_warning_threshold_exceeded') ? 'warning_only' : 'within_guardrail'
    return {
      fixtureId: fixture.fixtureId,
      toolId: fixture.toolId,
      status: decision === 'blocked' && fixture.expectedRouteRecommendation !== 'blocked' ? 'blocked' : 'passed',
      decision,
      estimatedCostUsd: fixture.estimatedCostUsd,
      warningThresholdUsd,
      hardBlockThresholdUsd,
      capacityHint: capacityHintForFixture(fixture),
      noBillingApiCalls: true,
      noExecutionPerformed: true,
      blockedReasons,
      warnings,
    }
  })
}

export function simulateHybridSidecarValidations(
  artifacts = buildHybridComputeE2EArtifactScopeFixtures(),
  fixtures = buildHybridComputeE2EPlanFixtures(),
): HybridE2ESidecarSimulationResult[] {
  const artifactById = new Map(artifacts.map((artifact) => [artifact.outputArtifactScopeId, artifact]))
  return fixtures.map((fixture) => {
    const planValidation = validateHybridPlanSnapshot(fixture)
    const artifact = artifactById.get(fixture.outputArtifactScopeId)
    const artifactResult = artifact
      ? runHybridArtifactScopeFixtures([artifact])[0]
      : {
          accepted: false,
          blockedReasons: ['missing_output_artifact_scope'],
          status: 'blocked' as const,
        }
    const blockedReasons = [...planValidation.blockedReasons, ...artifactResult.blockedReasons]
    return {
      fixtureId: fixture.fixtureId,
      status: fixture.expectedRouteRecommendation === 'blocked' || (planValidation.accepted && artifactResult.accepted) ? 'passed' : 'blocked',
      planValidationAccepted: planValidation.accepted,
      artifactScopeAccepted: artifactResult.accepted,
      executionBlocked: true,
      executionBlockedReason: 'phase44j_metadata_simulation_no_execution',
      sidecarProtocolVersion: LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
      blockedReasons,
      warnings: [...planValidation.warnings, 'sidecar_execution_blocked_by_phase44j_policy'],
    }
  })
}

export function runHybridFailureSimulation(): HybridE2EFailureSimulationResult[] {
  return [
    failure('failure-missing-capability-manifest', ['missing_capability_manifest']),
    failure('failure-route-version-mismatch', ['route_manifest_version_mismatch']),
    failure('failure-artifact-mismatch', ['artifact_scope_mismatch']),
    failure('failure-cost-hard-block', ['cost_hard_block_threshold_exceeded']),
    failure('failure-blocked-route-execution', ['route_execution_not_allowed', 'runtime_execution_not_allowed']),
    failure('failure-raw-chat', ['raw_chat_execution_blocked']),
    failure('failure-public-artifact', ['public_artifact_blocked']),
    failure('failure-provider-call', ['provider_calls_blocked']),
    failure('failure-broad-media', ['broad_media_blocked']),
    failure('failure-vlm', ['vlm_route_blocked']),
    failure('failure-demucs', ['demucs_route_blocked']),
    failure('failure-sidecar-protocol-mismatch', validateLocalWorkerProtocolVersion('track-b-sidecar-protocol-v0')),
    failure('failure-frontend-secret-request', ['frontend_secret_request_blocked']),
  ]
}

export function validateHybridComputeE2ESimulation(
  routeResults: HybridE2ERouteSimulationResult[],
  costResults: HybridE2ECostSimulationResult[],
  sidecarResults: HybridE2ESidecarSimulationResult[],
  artifactResults: HybridE2EArtifactScopeResult[],
  failureResults: HybridE2EFailureSimulationResult[],
): HybridE2EValidationReport {
  const planFixtures = buildHybridComputeE2EPlanFixtures()
  const missingExpectations: string[] = []
  if (planFixtures.length !== 15) missingExpectations.push(`expected_15_plan_fixtures_got_${planFixtures.length}`)
  if (artifactResults.length !== 7) missingExpectations.push(`expected_7_artifact_scope_fixtures_got_${artifactResults.length}`)
  for (const fixture of planFixtures) {
    const route = routeResults.find((result) => result.fixtureId === fixture.fixtureId)
    if (!route) missingExpectations.push(`missing_route_result:${fixture.fixtureId}`)
    else if (route.recommendation !== fixture.expectedRouteRecommendation) missingExpectations.push(`route_expectation_mismatch:${fixture.fixtureId}`)
    for (const reason of fixture.expectedBlockedReasons) {
      if (!route?.blockedReasons.includes(reason)) missingExpectations.push(`missing_route_blocker:${fixture.fixtureId}:${reason}`)
    }
  }
  for (const artifact of artifactResults) {
    if (artifact.status !== 'passed') missingExpectations.push(`artifact_fixture_failed:${artifact.fixtureId}`)
  }
  for (const route of routeResults) {
    if (route.routeExecutionAllowed || route.runtimeExecutionAllowed || route.workerExecutionAllowed || !route.noExecutionPerformed) {
      missingExpectations.push(`execution_flag_not_blocked:${route.fixtureId}`)
    }
  }
  for (const cost of costResults) {
    if (!cost.noBillingApiCalls || !cost.noExecutionPerformed) missingExpectations.push(`cost_execution_or_billing_not_blocked:${cost.fixtureId}`)
  }
  for (const sidecar of sidecarResults) {
    if (!sidecar.executionBlocked) missingExpectations.push(`sidecar_execution_not_blocked:${sidecar.fixtureId}`)
  }
  for (const failureResult of failureResults) {
    if (!failureResult.blocked || !failureResult.noFallbackToRawExecution || !failureResult.noExecutionPerformed) {
      missingExpectations.push(`failure_fixture_did_not_fail_closed:${failureResult.fixtureId}`)
    }
  }

  return {
    status: missingExpectations.length === 0 ? 'passed' : 'blocked',
    planFixtureCount: planFixtures.length,
    artifactScopeFixtureCount: artifactResults.length,
    routeSimulationCount: routeResults.length,
    costSimulationCount: costResults.length,
    sidecarSimulationCount: sidecarResults.length,
    failureSimulationCount: failureResults.length,
    missingExpectations,
    noExecutionPerformed: true,
  }
}

function eligiblePlan(
  fixtureId: string,
  description: string,
  toolId: LocalWorkerSidecarToolId,
  capabilityId: string,
  sourcePhase: string,
  privateGcsPrefix: string,
): HybridE2EPlanFixture {
  return {
    fixtureId,
    description,
    toolId,
    capabilityId,
    planSnapshotId: `phase44j-${fixtureId}-snapshot`,
    inputArtifactScopeId: `phase44j-${fixtureId}-input-scope`,
    outputArtifactScopeId: 'hybrid-reporting-scope',
    privateGcsPrefix,
    routeManifestVersion: HYBRID_COMPUTE_E2E_ROUTE_MANIFEST_VERSION,
    sourcePhase,
    confirmationPhase: 'phase44j_simulation_only_no_execution_confirmation',
    auditReportPath: `docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports/${fixtureId}.json`,
    requesterContext: 'internal_qa_planning',
    estimatedCostUsd: 0.15,
    expectedRouteRecommendation: 'eligible_metadata_only',
    expectedBlockedReasons: [],
  }
}

function blockedPlan(
  fixtureId: string,
  description: string,
  toolId: LocalWorkerSidecarToolId,
  capabilityId: string,
  expectedBlockedReasons: string[],
): HybridE2EPlanFixture {
  return {
    ...eligiblePlan(fixtureId, description, toolId, capabilityId, 'blocked_route_source_evidence', PRIVATE_REPORT_PREFIX),
    expectedRouteRecommendation: 'blocked',
    expectedBlockedReasons,
  }
}

function artifactFixture(
  fixtureId: string,
  description: string,
  artifactScopeId: string,
  artifactClasses: string[],
  privateGcsPrefix: string,
  publicOutputRequested: boolean,
  expectedBlockedReasons: string[],
  overrides: Partial<LocalWorkerSidecarArtifactScopeValidationRequest> = {},
): HybridE2EArtifactScopeFixture {
  return {
    fixtureId,
    description,
    request: {
      type: 'artifact_scope_validate_request',
      artifactScopeId,
      artifactClasses,
      privateGcsPrefix,
      localTempScope: 'ephemeral_only',
      publicOutputRequested,
      ...overrides,
    },
    outputArtifactScopeId: artifactScopeId,
    expectedAccepted: expectedBlockedReasons.length === 0,
    expectedBlockedReasons,
  }
}

function capacityHintForFixture(fixture: HybridE2EPlanFixture): HybridE2ECapacityHint {
  if (fixture.toolId === 'qwen3_vl' || fixture.toolId === 'vllm' || fixture.gpuRequested) return 'blocked_gpu'
  if (fixture.toolId === 'demucs') return 'blocked_unknown'
  if (fixture.syntheticProfileHint === 'low_resource_desktop' || fixture.syntheticProfileHint === 'server_preferred') return 'server_worker_preferred'
  if (fixture.syntheticProfileHint === 'high_desktop_future_local') return 'local_medium'
  if (fixture.toolId === 'duckdb' || fixture.toolId === 'polars' || fixture.toolId === 'sharp_libvips') return 'local_light'
  return 'server_worker_preferred'
}

function failure(fixtureId: string, blockedReasons: string[]): HybridE2EFailureSimulationResult {
  return {
    fixtureId,
    status: 'passed',
    blocked: true,
    blockedReasons,
    noFallbackToRawExecution: true,
    noExecutionPerformed: true,
  }
}
