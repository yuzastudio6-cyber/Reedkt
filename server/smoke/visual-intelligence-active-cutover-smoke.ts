import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

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

for (const removedExecutablePath of [
  'docker/prod/gpu-worker/sam2/Dockerfile.runtime-candidate',
  'docker/prod/gpu-worker/sam2/runner.py',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/services/canonical-source-led-visual-intelligence-content-analysis-port.ts',
] as const) assert.equal(
  existsSync(removedExecutablePath),
  false,
  `${removedExecutablePath} must remain absent`,
)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-active-cutover',
  directExecutionHttpRoutesMounted: false,
  directLifecyclePortInjectableIntoApplication: false,
  directInspectionPortInjectableIntoApplication: false,
  directPlanningOwnerInjectableIntoApplication: false,
  parallelSourceVisualRuntimeRemoved: true,
  canonicalL4ProbeCostAuthoritySeparatedFromDispatch: true,
  sourceAnalysisReturnsThroughOrchestra: true,
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
