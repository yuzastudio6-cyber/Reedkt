import { buildApprovedWorkflowPayload, ProductionWorkflowArtifactStore, productionWorkflowScenarios, runProductionWorkflowScenario } from '../e2e/production-workflow'
import { buildProductionWorkflowFallbackSummary } from '../e2e/production-workflow/production-workflow-fallback-summary-builder'
import { buildProductionWorkflowFixture } from '../e2e/production-workflow/production-workflow-fixture-builder'
import { buildProductionWorkflowQASummary } from '../e2e/production-workflow/production-workflow-qa-summary-builder'
import { buildProductionWorkflowReadinessSummary } from '../e2e/production-workflow/production-workflow-readiness-gate'
import { runProductionWorkerRuntime } from '../workers/production'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const blockedScenario = scenarioById('production-blocked-readiness')
const productionReport = await runProductionWorkflowScenario({ scenario: blockedScenario, mode: 'production_ready' })
check(productionReport.status === 'blocked', 'production_ready workflow must be blocked when readiness/model/manual blockers remain.')
check(!productionReport.productionReadyAllowed, 'production_ready workflow must not be allowed with current blockers.')
check(productionReport.readinessSummary.modelWeightBlockerCount > 0 || productionReport.readinessSummary.blockerCount > 0, 'Readiness/model blockers must be summarized.')

const revideoSummary = buildProductionWorkflowReadinessSummary({ mode: 'production_ready', revideoRequested: true })
check(!revideoSummary.productionReadyAllowed && revideoSummary.warnings.some((warning) => warning.includes('Revideo')), 'production_ready workflow must block Revideo requests.')

const signedSummary = buildProductionWorkflowReadinessSummary({ mode: 'production_ready', signedUrlDetected: true })
check(!signedSummary.productionReadyAllowed && signedSummary.warnings.some((warning) => warning.includes('Signed URL')), 'production_ready workflow must block signed URL artifacts.')

const rawPromptSummary = buildProductionWorkflowReadinessSummary({ mode: 'production_ready', rawPromptDetected: true })
check(!rawPromptSummary.productionReadyAllowed && rawPromptSummary.warnings.some((warning) => warning.includes('Raw prompt')), 'production_ready workflow must block raw prompt execution fields.')

check(productionReport.readinessSummary.modelWeightBlockerCount > 0, 'production_ready workflow must block missing/blocked model weights.')

const upstreamQaSummary = buildProductionWorkflowReadinessSummary({ mode: 'production_ready', upstreamBlockingQa: true })
check(!upstreamQaSummary.productionReadyAllowed, 'production_ready final render must block when upstream blocking QA failed.')

const finalDeliveryWithoutExport = buildProductionWorkflowQASummary({
  qaResults: [mockGate('final_delivery', 'blocked', true)],
})
check(!finalDeliveryWithoutExport.finalDeliveryAllowed, 'final_delivery must be blocked without final_export.')

const fallbackSummary = buildProductionWorkflowFallbackSummary([{
  stage: 'final_render_export_execution',
  status: 'blocked',
  artifacts: [],
  qaResults: [mockGate('render_asset_integrity', 'blocked', true)],
  skippedReasons: [],
  fallbackDecisions: ['bypass blocking QA and continue'],
  blockers: ['blocking QA'],
  warnings: [],
  outputSummary: {},
}])
check(fallbackSummary.qaBypassDetected, 'Fallback decisions cannot bypass blocking QA.')

const fixture = buildProductionWorkflowFixture(productionWorkflowScenarios[0])
const cpuGpuPayload = buildApprovedWorkflowPayload({
  fixture,
  stage: 'media_foundation',
  workerType: 'cpu_analysis_worker',
  requestedToolIds: ['real_esrgan'],
  requestedRecipeIds: ['video_enhancement_recipe'],
  requiredQualityGateTypes: ['enhancement_artifacts'],
  metadata: { mediaFoundation: { mode: 'dry_run' } },
})
const cpuGpuRoute = await runProductionWorkerRuntime({ payload: cpuGpuPayload })
check(cpuGpuRoute.status === 'blocked', 'GPU tools cannot be routed to CPU/render stages.')

const artifactStore = new ProductionWorkflowArtifactStore()
let signedRejected = false
try {
  artifactStore.rejectSignedUrl('https://storage.example/source.mp4?X-Goog-Signature=abc')
} catch {
  signedRejected = true
}
check(signedRejected, 'Artifact store must reject signed URL artifact paths.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'production_ready_readiness_blocked',
    'revideo_blocked',
    'signed_url_blocked',
    'raw_prompt_blocked',
    'model_weights_blocked',
    'upstream_qa_blocked',
    'final_delivery_without_export_blocked',
    'fallback_cannot_bypass_qa',
    'gpu_tool_cpu_route_blocked',
    'readiness_blockers_summarized',
  ],
  readinessBlockers: productionReport.readinessSummary.blockerCount,
  modelWeightBlockers: productionReport.readinessSummary.modelWeightBlockerCount,
}, null, 2))

function scenarioById(scenarioId: string) {
  const scenario = productionWorkflowScenarios.find((item) => item.scenarioId === scenarioId)
  if (!scenario) throw new Error(`Missing scenario ${scenarioId}`)
  return scenario
}

function mockGate(gateType: QualityGateResult['gateType'], status: QualityGateResult['status'], blocking: boolean): QualityGateResult {
  return {
    id: `gate-${gateType}`,
    workspaceId: 'workspace-e2e-blockers',
    projectId: 'project-e2e-blockers',
    mediaAssetId: 'media-e2e-blockers',
    toolExecutionPlanId: 'tool-e2e-blockers',
    recipeId: 'final_export_recipe',
    gateType,
    status,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: [],
    recommendations: [],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking,
    humanReviewRequired: blocking,
  }
}
