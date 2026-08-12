import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { listSelectableToolCapabilityCards } from '../tool-calling/tool-capability-card-loader'
import { isProductionToolId } from '../tool-registry'

const removedParallelRuntimePaths = [
  'server/services/canonical-source-visual-intelligence-owner-service.ts',
  'server/services/canonical-visual-intelligence-source-gpu-evidence-service.ts',
  'server/smoke/visual-intelligence-source-gpu-evidence-smoke.ts',
] as const

for (const path of removedParallelRuntimePaths) {
  assert.equal(existsSync(path), false, `${path} must remain absent`)
}

const app = source('server/app.ts')
const runtimeTypes = source('server/types.ts')
const routeHelpers = source('server/routes/route-helpers.ts')
const productionRuntime = source(
  'server/visual-intelligence/visual-intelligence-production-runtime.ts',
)
const readRoutes = source('server/routes/visual-intelligence-routes.ts')
const orchestraRoutes = source(
  'server/routes/visual-intelligence-orchestra-routes.ts',
)
const l4AttemptOwner = source(
  'server/services/canonical-source-analysis-l4-probe-attempt-owner.ts',
)
const l4VisualEvidenceAttemptOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-attempt-owner.ts',
)
const l4VisualEvidenceAuthorityRepository = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-authority-repository.ts',
)
const l4VisualEvidenceWorkerBootstrapOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner.ts',
)
const l4VisualEvidenceWorkerEvidenceOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-worker-evidence-owner.ts',
)
const l4VisualEvidenceToolArtifactOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-tool-artifact-owner.ts',
)
const l4VisualEvidenceTerminalReconciliationOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-terminal-reconciliation-owner.ts',
)
const l4VisualEvidenceAdmissionOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-admission-owner.ts',
)
const l4CostAuthority = source(
  'server/services/canonical-source-analysis-l4-probe-usage-cost.ts',
)
const sourceCoordinator = source(
  'server/orchestra/canonical-source-analysis-orchestra-coordinator.ts',
)
const sourceOrchestraWorkOwner = source(
  'server/services/canonical-source-analysis-orchestra-work-owner.ts',
)
const trackAllSam31Binding = source(
  'server/workers/masks/canonical-track-all-sam3_1-orchestra-binding.ts',
)
const sam31TaskOwner = source(
  'server/workers/masks/canonical-sam3_1-gpu-task-owner-service.ts',
)
const sam31FundedRuntimeComposition = source(
  'server/services/canonical-sam3_1-funded-gpu-runtime-composition.ts',
)
const sam31ApprovedTrackAllSourceRepository = source(
  'server/services/canonical-sam3_1-approved-track-all-task-source-repository.ts',
)
const trackAllSam31AuthenticatedStartService = source(
  'server/services/canonical-track-all-sam3_1-authenticated-gpu-start-service.ts',
)
const trackAllSam31L4TaskQaAuthenticatedStartService = source(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service.ts',
)
const trackAllSam31L4TaskQaFundedRuntimeComposition = source(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-funded-gpu-runtime-composition.ts',
)
const trackAllSam31L4TaskQaOwner = source(
  'server/workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service.ts',
)
const trackAllSam31Routes = source(
  'server/routes/track-all-sam3_1-routes.ts',
)
const legacyWorkerRouter = source(
  'server/workers/production/production-worker-router.ts',
)
const legacyWorkerDispatcher = source(
  'server/workers/production/production-worker-dispatcher.ts',
)
const workerRouteBridge = source(
  'server/tool-calling/worker-route-bridge.ts',
)
const toolCapabilityCardLoader = source(
  'server/tool-calling/tool-capability-card-loader.ts',
)
const projectEditBriefBrowserClient = source(
  'src/lib/project-edit-brief-api-client.ts',
)
const projectEditBriefBrowserOptions = source(
  'src/lib/reeditpro-api-client-types.ts',
)
const projectEditBriefVisualPanel = source(
  'src/components/projects/brief/ProjectEditBriefVisualContextPanel.tsx',
)
const currentGpuFixtureSources = [
  source('server/smoke/canonical-professional-google-cloud-gpu-job-launch-port-smoke.ts'),
  source('server/smoke/canonical-professional-gpu-job-lifecycle-smoke.ts'),
  source('server/smoke/canonical-sam3_1-funded-gpu-runtime-composition-smoke.ts'),
  source('server/smoke/edit-planning-authority-smoke.ts'),
  source('server/smoke/private-worker-resource-usage-cost-evidence-smoke.ts'),
  source('server/smoke/production-readiness-validation-smoke.ts'),
]
const activeEditLevelVisualPolicySources = [
  source('src/types/edit-level.ts'),
  source('src/types/edit-level-tool-router.ts'),
  source('src/types/edit-level-source-understanding.ts'),
  source('src/types/edit-level-qwen-planning.ts'),
  source('src/types/edit-level-qa-gates.ts'),
  source('src/types/edit-level-estimates.ts'),
  source('src/lib/edit-level-tool-router-rules.ts'),
  source('src/lib/edit-level-source-understanding-rules.ts'),
  source('src/lib/edit-level-qwen-planning-rules.ts'),
  source('src/lib/edit-level-qa-gates-rules.ts'),
  source('src/lib/edit-level-estimates-rules.ts'),
  source('src/lib/mock-edit-level-profiles.ts'),
]

for (const activeEditLevelSource of activeEditLevelVisualPolicySources) {
  assert.doesNotMatch(
    activeEditLevelSource,
    /qwen25vl|Qwen25VL|Qwen2\.5-VL/u,
  )
  assert.match(
    activeEditLevelSource,
    /visual_intelligence|Visual Intelligence|visualIntelligence/u,
  )
}

assert.match(app, /createVisualIntelligenceOrchestraRoutes/u)
assert.match(app, /createVisualIntelligenceRoutes/u)
assert.match(app, /createTrackAllSam31Routes/u)
assert.doesNotMatch(app, /createQwenMarkerChatBetaRoutes/u)

for (const activeMountSource of [app, runtimeTypes, routeHelpers]) {
  assert.doesNotMatch(
    activeMountSource,
    /visualIntelligenceLifecyclePort|visualIntelligenceInspectionCoordinatorPort|visualIntelligencePlanningOperationRequestOwnerPort/u,
  )
}

assert.match(productionRuntime, /orchestraJobRuntimePort/u)
assert.match(productionRuntime, /orchestraLifecyclePort/u)
assert.match(
  productionRuntime,
  /visual-intelligence-production-runtime-v18/u,
)
assert.doesNotMatch(
  productionRuntime,
  /canonical-a100-batch-job-invocation-service|createGoogleBatchA100JobInvocationPort/u,
)
assert.match(
  productionRuntime,
  /source_transcript_vertex_a100_invocation_port_not_ready/u,
)
assert.match(
  productionRuntime,
  /google_cloud_vertex_custom_job_a2_ultra/u,
)
assert.match(
  productionRuntime,
  /createVisualIntelligenceCanonicalPreparedEvidenceStore/u,
)
assert.match(
  productionRuntime,
  /createSourceAnalysisOrchestraCoordinator/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisOrchestraWorkOwner/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner/u,
)
assert.match(
  productionRuntime,
  /createGoogleCloudRunL4VisualEvidenceExecutionPort/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner/u,
)
assert.match(
  productionRuntime,
  /createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner/u,
)
assert.match(
  productionRuntime,
  /operationAuthorityPort:[\s\S]*cloudRunOperationAuthorityPort/u,
)
assert.match(
  l4VisualEvidenceWorkerBootstrapOwner,
  /exactCreateOnlyEnvelopeConsumptionAdmissionReleaseAndOperationReread/u,
)
assert.match(
  l4VisualEvidenceWorkerBootstrapOwner,
  /sourceBytesRead: false/u,
)
assert.match(
  l4VisualEvidenceWorkerBootstrapOwner,
  /toolExecutionStarted: false/u,
)
assert.doesNotMatch(
  l4VisualEvidenceWorkerBootstrapOwner,
  /qwen|sam2|child_process|execFile|spawn|shellCommand/u,
)
assert.match(
  l4VisualEvidenceWorkerEvidenceOwner,
  /terminalCloudRunExecutionClaimed: z\.literal\(false\)/u,
)
assert.match(
  l4VisualEvidenceWorkerEvidenceOwner,
  /scaleBackToZeroClaimedByWorker: z\.literal\(false\)/u,
)
assert.match(
  l4VisualEvidenceWorkerEvidenceOwner,
  /substantiveCpuMediaProcessingUsed: z\.literal\(false\)/u,
)
assert.doesNotMatch(
  l4VisualEvidenceWorkerEvidenceOwner,
  /qwen|sam2|customerWalletOrLedgerMutated: true/u,
)
assert.match(
  l4VisualEvidenceToolArtifactOwner,
  /textContentIsUntrustedMediaEvidence: z\.literal\(true\)/u,
)
assert.match(
  l4VisualEvidenceToolArtifactOwner,
  /instructionsFromTextAreNeverExecuted: z\.literal\(true\)/u,
)
assert.match(
  l4VisualEvidenceToolArtifactOwner,
  /substantiveCpuMediaProcessingUsed: z\.literal\(false\)/u,
)
assert.doesNotMatch(l4VisualEvidenceToolArtifactOwner, /qwen|sam2|child_process/u)
assert.match(
  l4VisualEvidenceTerminalReconciliationOwner,
  /google_cloud_run_v2_terminal_execution_reread/u,
)
assert.match(
  l4VisualEvidenceTerminalReconciliationOwner,
  /billing_account_effective_pricing_api|accountEffectivePricingRereadVerified/u,
)
assert.match(
  l4VisualEvidenceTerminalReconciliationOwner,
  /publicListPriceUsedAsSettlementAuthority: z\.literal\(false\)/u,
)
assert.match(
  l4VisualEvidenceTerminalReconciliationOwner,
  /terminalGpuInstanceCount: z\.literal\(0\)/u,
)
assert.doesNotMatch(
  l4VisualEvidenceTerminalReconciliationOwner,
  /qwen|sam2|customerCreditsMutated: z\.literal\(true\)|walletOrLedgerMutationPerformed: true/u,
)
assert.doesNotMatch(
  productionRuntime,
  /readonly visualEvidenceAdmissionReadPort|readonly visualEvidenceReleaseReadPort|readonly visualEvidenceTerminalReadPort/u,
)
assert.doesNotMatch(
  productionRuntime,
  /readonly orchestraWorkReadPort/u,
)
assert.doesNotMatch(
  productionRuntime,
  /createCanonicalPlanningVisualIntelligenceOperationOwner|createVisualIntelligenceInspectionCoordinator|readonly lifecyclePort/u,
)

assert.equal(occurrences(readRoutes, 'router.post('), 1)
assert.match(readRoutes, /VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE/u)
assert.doesNotMatch(
  readRoutes,
  /VISUAL_INTELLIGENCE_EXECUTION_ROUTE|VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE|VISUAL_INTELLIGENCE_INSPECTION_ROUTE/u,
)
assert.equal(occurrences(orchestraRoutes, 'router.post('), 1)
assert.match(orchestraRoutes, /ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE/u)
assert.match(orchestraRoutes, /requireStrictInternalServiceAuth/u)
assert.match(orchestraRoutes, /requireIdempotency/u)

assert.match(
  l4AttemptOwner,
  /canonical-source-analysis-l4-probe-usage-cost/u,
)
assert.match(
  l4AttemptOwner,
  /internal\.visual_intelligence\.probe_source_timing\.v1/u,
)
assert.doesNotMatch(
  l4AttemptOwner,
  /canonical-visual-intelligence-source-gpu-evidence-service/u,
)
assert.match(
  l4VisualEvidenceAttemptOwner,
  /internal\.visual_intelligence\.prepare_source_visual_evidence\.v1/u,
)
assert.match(
  l4VisualEvidenceAttemptOwner,
  /createGoogleCloudRunL4VisualEvidenceExecutionPort/u,
)
assert.match(
  l4VisualEvidenceAttemptOwner,
  /REEDITPRO_GPU_INVOCATION_ID/u,
)
assert.match(
  l4VisualEvidenceAuthorityRepository,
  /canonical-source-analysis-l4-visual-evidence-authority-repository-v1/u,
)
assert.match(l4VisualEvidenceAuthorityRepository, /persistAdmissionCreateOnly/u)
assert.match(l4VisualEvidenceAuthorityRepository, /persistReleaseCreateOnly/u)
assert.match(l4VisualEvidenceAuthorityRepository, /persistTerminalCreateOnly/u)
assert.match(
  l4VisualEvidenceAuthorityRepository,
  /cloudRunOperationAuthorityPort/u,
)
assert.match(
  l4VisualEvidenceAuthorityRepository,
  /persistAcceptedOperationCreateOnly/u,
)
assert.match(
  l4VisualEvidenceAuthorityRepository,
  /readExactAcceptedOperation/u,
)
assert.match(l4VisualEvidenceAuthorityRepository, /exactCreateOnlyRereadVerified/u)
assert.doesNotMatch(l4VisualEvidenceAuthorityRepository, /new Set\(/u)
assert.doesNotMatch(
  l4VisualEvidenceAuthorityRepository,
  /GoogleAuth|fetch\(|child_process|run\.googleapis\.com|jobs:run/u,
)
assert.match(
  l4VisualEvidenceAdmissionOwner,
  /billing_account_effective_pricing_api/u,
)
assert.match(
  l4VisualEvidenceAdmissionOwner,
  /exactPreparedFinalizedProbeReleaseToolchainAndRateRereadVerified/u,
)
assert.doesNotMatch(
  l4VisualEvidenceAdmissionOwner,
  /customerCreditMutated:\s*true|gpuJobStarted:\s*true|publicListPrice/u,
)
assert.doesNotMatch(
  l4VisualEvidenceAttemptOwner,
  /WEEDITPRO_GPU_ACCELERATOR_CLASS|sam2|substantiveCpuMediaProcessingAllowed:\s*z\.literal\(true\)/u,
)
assert.match(
  l4CostAuthority,
  /canonical-source-analysis-l4-probe-usage-cost-v1/u,
)
assert.match(l4CostAuthority, /exactCurrentBillingAccountPriceReread/u)
assert.match(l4CostAuthority, /scaleBackToZeroVerified/u)
assert.doesNotMatch(
  l4CostAuthority,
  /GoogleAuth|fetch\(|child_process|run\.googleapis\.com|jobs:run/u,
)

assert.match(sourceCoordinator, /executeOneShot/u)
assert.match(sourceCoordinator, /orchestraRuntime\.execute/u)
assert.match(sourceCoordinator, /reconcileForPlanning/u)
assert.doesNotMatch(
  sourceCoordinator,
  /createQwenVisualUnderstandingProvider|sam2|directTimelineMutationAllowed:\s*true/u,
)
assert.match(
  sourceOrchestraWorkOwner,
  /workBuiltOnlyFromCanonicalRereads:\s*true/u,
)
assert.match(
  sourceOrchestraWorkOwner,
  /browserOrCallerPreparedEvidenceAccepted:\s*false/u,
)
assert.match(
  sourceOrchestraWorkOwner,
  /assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifactSet/u,
)
assert.doesNotMatch(
  sourceOrchestraWorkOwner,
  /createQwenVisualUnderstandingProvider|sam2|directProviderOrGpuDispatchAllowed:\s*true/u,
)

assert.match(trackAllSam31Binding, /targetSkillKey:\s*z\.literal\('track_all'\)/u)
assert.match(trackAllSam31Binding, /trackAllOwnsTrackingAndMaskArtifacts/u)
assert.match(
  trackAllSam31Binding,
  /visualIntelligenceMayInspectButNotCreateOrMutateTrackingArtifacts/u,
)
assert.match(
  trackAllSam31Binding,
  /directUserOrPeerSkillDispatchAccepted:\s*z\.literal\(false\)/u,
)
assert.match(
  trackAllSam31Binding,
  /peerSkillSupportRequestAcceptedOnlyThroughOrchestra:\s*z\.literal\(true\)/u,
)
assert.match(sam31TaskOwner, /canonical-sam3_1-gpu-task-context-v2/u)
assert.match(sam31TaskOwner, /assertCanonicalTrackAllSam31OrchestraBinding/u)
assert.match(sam31TaskOwner, /SAM 3\.1 task context hash is invalid/u)
assert.doesNotMatch(
  sam31TaskOwner,
  /createVisualIntelligenceOrchestraInvocationCompiler|visualIntelligenceMayDispatch/u,
)
assert.match(
  sam31FundedRuntimeComposition,
  /createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner/u,
)
assert.match(
  sam31FundedRuntimeComposition,
  /createCanonicalSam31GpuTaskContextOwner/u,
)
assert.match(
  sam31FundedRuntimeComposition,
  /createCanonicalSam31PreparingCloudJobLaunchPort/u,
)
assert.match(
  sam31FundedRuntimeComposition,
  /startCanonicalSam31PlanFundedGpuJob/u,
)
assert.match(
  sam31FundedRuntimeComposition,
  /rawCloudLaunchPortExposed: false/u,
)
assert.doesNotMatch(
  sam31FundedRuntimeComposition,
  /qwen|sam2|cpuOnlySubstantiveExecutionAllowed:\s*true/u,
)
assert.match(
  sam31ApprovedTrackAllSourceRepository,
  /gcs_create_only_exact_reread/u,
)
assert.match(
  sam31ApprovedTrackAllSourceRepository,
  /createCanonicalTrackAllSam31OrchestraBinding/u,
)
assert.match(
  sam31ApprovedTrackAllSourceRepository,
  /callerOrBrowserMaterialAccepted:\s*z\.literal\(false\)/u,
)
assert.doesNotMatch(
  sam31ApprovedTrackAllSourceRepository,
  /qwen|sam2|cpuOnlySubstantiveExecutionAllowed:\s*true/u,
)
assert.match(
  trackAllSam31AuthenticatedStartService,
  /startCanonicalSam31PlanFundedGpuJob/u,
)
assert.match(
  trackAllSam31AuthenticatedStartService,
  /createCanonicalProfessionalGpuFundedLifecycleIdentity/u,
)
assert.doesNotMatch(
  trackAllSam31AuthenticatedStartService,
  /startCanonicalProfessionalGpuPlanFundedJob|rawCloudLaunchPort:\s*/u,
)
assert.match(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /rereadExactSam31MaskManifest/u,
)
assert.match(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /persistMaterialCreateOnly/u,
)
assert.match(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /startCanonicalTrackAllSam31L4TaskQaPlanFundedGpuJob/u,
)
assert.match(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /payload\.subjectRequests\[0\]\?\.anchorRequired/u,
)
assert.doesNotMatch(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /anchorManifestRef:\s*subject\.anchorRequired[\s\S]*result\.manifestRef/u,
)
assert.match(
  trackAllSam31L4TaskQaFundedRuntimeComposition,
  /createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort/u,
)
assert.match(
  trackAllSam31L4TaskQaFundedRuntimeComposition,
  /rawCloudLaunchPortExposed: false/u,
)
assert.match(
  trackAllSam31L4TaskQaOwner,
  /persistWorkerTaskCreateOnly/u,
)
assert.match(
  trackAllSam31L4TaskQaOwner,
  /createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort/u,
)
assert.doesNotMatch(
  trackAllSam31L4TaskQaAuthenticatedStartService,
  /qwen|sam2|cpuOnlySubstantiveExecutionAllowed:\s*true/u,
)
assert.match(trackAllSam31Routes, /requireStrictInternalServiceAuth/u)
assert.match(trackAllSam31Routes, /requireIdempotency/u)
assert.match(
  trackAllSam31Routes,
  /trackAllSam31AuthenticatedGpuStartRuntimePort/u,
)
assert.match(
  trackAllSam31Routes,
  /trackAllSam31L4TaskQaAuthenticatedStartRuntimePort/u,
)
assert.doesNotMatch(trackAllSam31Routes, /qwen|sam2|modelId|body\.model/u)
assert.match(
  legacyWorkerRouter,
  /legacy_mask_worker_route_retired_track_all_orchestra_sam3_1_required/u,
)
assert.doesNotMatch(
  legacyWorkerRouter,
  /runMaskCompositionPipeline|gpu_ai_worker_mask_composition_execution|cpu_analysis_worker_mask_composition_dry_run/u,
)
assert.match(
  legacyWorkerDispatcher,
  /hasRetiredLegacyMaskRouteRequest/u,
)
assert.match(
  legacyWorkerDispatcher,
  /LEGACY_MASK_WORKER_ROUTE_RETIRED/u,
)
assert.match(
  legacyWorkerDispatcher,
  /No legacy CPU, generic GPU, render, or QA mask lease was created/u,
)
assert.match(
  workerRouteBridge,
  /canonical_track_all_orchestra_sam3_1_dispatch_required/u,
)
assert.doesNotMatch(
  workerRouteBridge,
  /gpu_ai_worker_mask_composition_execution|cpu_analysis_worker_mask_composition_dry_run/u,
)
assert.match(
  toolCapabilityCardLoader,
  /hasRetiredOrNonE2EToolId/u,
)
assert.match(
  toolCapabilityCardLoader,
  /!isProductionToolId\(toolId\)/u,
)
const selectableToolCards = listSelectableToolCapabilityCards()
for (const card of selectableToolCards) {
  assert.equal(isProductionToolId(card.toolId), true)
  for (const fallbackToolId of card.fallbackToolIds) {
    assert.equal(isProductionToolId(fallbackToolId), true)
  }
}
for (const nonAdmissibleToolId of ['sam2', 'sam3_1', 'birefnet'] as const) {
  assert.equal(
    selectableToolCards.some(
      (card) => String(card.toolId) === nonAdmissibleToolId,
    ),
    false,
  )
}

for (const removedExecutablePath of [
  'docker/prod/gpu-worker/sam2/Dockerfile.runtime-candidate',
  'docker/prod/gpu-worker/sam2/runner.py',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/services/canonical-source-led-visual-intelligence-content-analysis-port.ts',
  'src/lib/project-source-video-frame-sampler.ts',
  'src/components/projects/brief/ProjectEditBriefAnalyzeVisualContextButton.tsx',
  'tests/e2e/project-edit-brief-visual-context.spec.ts',
] as const) assert.equal(
  existsSync(removedExecutablePath),
  false,
  `${removedExecutablePath} must remain absent`,
)

for (const activeBrowserSource of [
  projectEditBriefBrowserClient,
  projectEditBriefBrowserOptions,
  projectEditBriefVisualPanel,
]) assert.doesNotMatch(
  activeBrowserSource,
  /liveQwen25VLVisualContext|qwen25VLVisualContextRuntime|loadQwen25VLVisualContextReadiness|\/v1\/project-edit-brief\/marker-visual-context|\/v1\/qwen25vl-beta\/readiness|sampleProjectSourceVideoFramesForMarker/u,
)
assert.match(projectEditBriefVisualPanel, /Awaiting Orchestra/u)
assert.match(projectEditBriefVisualPanel, /Authenticated report/u)

for (const currentGpuFixtureSource of currentGpuFixtureSources) {
  assert.doesNotMatch(
    currentGpuFixtureSource,
    /(?:requestedToolNames|packageEvidence|toolId|canonicalToolId|approvedToolIds|toolIds|operationId)\s*(?:=|:)\s*(?:\[\s*)?['"](?:sam2|tool\.sam2)/u,
  )
}

console.log(JSON.stringify({
  smoke: 'visual-intelligence-active-cutover',
  directExecutionHttpRoutesMounted: false,
  directLifecyclePortInjectableIntoApplication: false,
  directInspectionPortInjectableIntoApplication: false,
  directPlanningOwnerInjectableIntoApplication: false,
  parallelSourceVisualRuntimeRemoved: true,
  canonicalL4ProbeCostAuthoritySeparatedFromDispatch: true,
  sourceAnalysisReturnsThroughOrchestra: true,
  sam31RequiresExactTrackAllOrchestraBinding: true,
  sam31FundedRuntimeCompositionUsesCanonicalOwners: true,
  legacyDirectMaskWorkerRoutesRetired: true,
  nonE2EToolStudyCardsExcludedFromSelection: true,
  browserSampledFrameQwenPathRetired: true,
  currentGpuFixturesUseSam31InsteadOfSam2: true,
  visualIntelligenceMayInspectButNotOwnSam31Artifacts: true,
  activeQwenVisualRuntimeMounted: false,
  activeSam2ExecutableRuntimePresent: false,
  historicalEvidenceCompatibilityPreserved: true,
}, null, 2))

function source(path: string): string {
  assert.equal(existsSync(path), true, `${path} must exist`)
  return readFileSync(path, 'utf8')
}

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}
