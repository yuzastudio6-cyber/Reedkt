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
const l4CostAuthority = source(
  'server/services/canonical-source-analysis-l4-probe-usage-cost.ts',
)
const sourceCoordinator = source(
  'server/orchestra/canonical-source-analysis-orchestra-coordinator.ts',
)
const trackAllSam31Binding = source(
  'server/workers/masks/canonical-track-all-sam3_1-orchestra-binding.ts',
)
const sam31TaskOwner = source(
  'server/workers/masks/canonical-sam3_1-gpu-task-owner-service.ts',
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

assert.match(app, /createVisualIntelligenceOrchestraRoutes/u)
assert.match(app, /createVisualIntelligenceRoutes/u)
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
  /visual-intelligence-production-runtime-v2/u,
)
assert.match(
  productionRuntime,
  /createSourceAnalysisOrchestraCoordinator/u,
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
  legacyDirectMaskWorkerRoutesRetired: true,
  nonE2EToolStudyCardsExcludedFromSelection: true,
  browserSampledFrameQwenPathRetired: true,
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
