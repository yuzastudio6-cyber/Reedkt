import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS,
  TRACK_B_COST_ESTIMATOR_REPORT_DIR,
  buildTrackBCostEstimatorReports,
} from '../activation/track-b-cost-estimator'
import { TRACK_B_TOOL_IDS } from '../activation/track-b-capability-manifests/track-b-tool-registry'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:track-b-cost-estimator:plan',
  'activation:track-b-cost-estimator',
  'activation:track-b-cost-estimator:report',
  'activation:track-b-cost-estimator:summary',
  'activation:track-b-cost-estimator:iam-plan',
  'activation:track-b-cost-estimator:cost-summary',
  'smoke:activation-track-b-cost-estimator',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const moduleDir = 'server/activation/track-b-cost-estimator'
assert(existsSync(moduleDir), 'Track B cost estimator module missing.')
assert(!existsSync('server/workers/track-b-cost-estimator'), 'Phase 44H must not add a worker.')

for (const { file, text } of readAllFiles(moduleDir)) {
  assert(!text.includes('cloudbilling.googleapis.com'), `Billing API endpoint must not be referenced: ${file}`)
  assert(!/billing\.accounts/i.test(text), `Billing account APIs must not be referenced: ${file}`)
  assert(!text.includes('fetch('), `Cost estimator must not perform network fetches: ${file}`)
  assert(!text.includes('providerKey'), `Cost estimator must not mention provider keys: ${file}`)
  assert(!text.includes('SERVICE_ROLE'), `Cost estimator must not use service-role env: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Cost estimator must not import Track A: ${file}`)
}

const reports = buildTrackBCostEstimatorReports()

const pricingEvidence = reports.pricingSourceEvidence as {
  usesLiveBillingApi?: boolean
  authoritativeBilling?: boolean
  planningOnly?: boolean
  sources?: Array<{ sourceId?: string; exactRatesCaptured?: boolean }>
}
assert(pricingEvidence.usesLiveBillingApi === false, 'Pricing evidence must not use live Billing API.')
assert(pricingEvidence.authoritativeBilling === false, 'Pricing evidence must not claim authoritative billing.')
assert(pricingEvidence.planningOnly === true, 'Pricing evidence must be planning-only.')
for (const sourceId of [
  'google_cloud_run_pricing',
  'google_artifact_registry_pricing',
  'google_cloud_storage_pricing',
  'google_compute_gpu_pricing',
  'google_cloud_pricing_calculator',
]) {
  assert(pricingEvidence.sources?.some((source) => source.sourceId === sourceId), `Missing pricing source ${sourceId}`)
}

const pricingSnapshot = reports.pricingSnapshot as {
  rates?: Record<string, unknown>
  planningEstimateOnly?: boolean
  authoritativeBilling?: boolean
  usesLiveBillingApi?: boolean
}
assert(pricingSnapshot.planningEstimateOnly === true, 'Pricing snapshot must be planning-only.')
assert(pricingSnapshot.authoritativeBilling === false, 'Pricing snapshot must not be authoritative billing.')
assert(pricingSnapshot.usesLiveBillingApi === false, 'Pricing snapshot must not use live Billing API.')
assert(pricingSnapshot.rates?.cloudRunJobsCpuVcpuSecondUsd === 0.000018, 'Cloud Run Jobs CPU rate mismatch.')
assert(pricingSnapshot.rates?.cloudRunJobsMemoryGibSecondUsd === 0.000002, 'Cloud Run Jobs memory rate mismatch.')
assert(pricingSnapshot.rates?.cloudRunJobsGpuL4NoZonalRedundancySecondUsd === 0.0001867, 'Cloud Run L4 evidence rate mismatch.')
assert(pricingSnapshot.rates?.artifactRegistryStorageOverFreeTierGibMonthUsd === 0.10, 'Artifact Registry storage rate mismatch.')

const toolMapping = reports.toolMapping as { toolCount?: number; tools?: Array<{ toolId?: string; estimateAllowed?: boolean; runtimeClass?: string; blockers?: string[] }> }
assert(toolMapping.toolCount === 18, 'Tool mapping must include 18 Track B tools.')
for (const toolId of TRACK_B_TOOL_IDS) {
  assert(toolMapping.tools?.some((tool) => tool.toolId === toolId), `Missing tool mapping: ${toolId}`)
}
for (const toolId of ['qwen3_vl', 'vllm', 'demucs']) {
  const tool = toolMapping.tools?.find((entry) => entry.toolId === toolId)
  assert(tool?.estimateAllowed === false, `${toolId} estimate must be blocked.`)
  assert((tool.blockers?.length ?? 0) > 0, `${toolId} must include blockers.`)
}

const scenarioResults = reports.scenarioResults as { scenarios?: Array<{ scenarioId?: string; status?: string; output?: { blockers?: string[]; noExecutionPerformed?: boolean } }> }
assert(scenarioResults.scenarios?.length === 10, 'Scenario results must include 10 scenarios.')
for (const scenarioId of ['vlm_blocked_scenario', 'demucs_blocked_scenario', 'route_execution_blocked_scenario']) {
  const scenario = scenarioResults.scenarios?.find((entry) => entry.scenarioId === scenarioId)
  assert(scenario?.status === 'blocked', `${scenarioId} must be blocked.`)
  assert(scenario.output?.noExecutionPerformed === true, `${scenarioId} must not execute.`)
}
assert(scenarioResults.scenarios?.every((scenario) => scenario.output?.noExecutionPerformed === true), 'Every scenario must report noExecutionPerformed.')

const guardrails = reports.guardrailPolicy as {
  gpuCostRequiresExplicitApproval?: boolean
  broadMediaCostAlwaysBlocked?: boolean
  providerCostRequiresProviderPhase?: boolean
  routeExecutionBehavior?: string
}
assert(guardrails.gpuCostRequiresExplicitApproval === true, 'GPU cost must require explicit future approval.')
assert(guardrails.broadMediaCostAlwaysBlocked === true, 'Broad media cost must always be blocked.')
assert(guardrails.providerCostRequiresProviderPhase === true, 'Provider cost must require provider phase.')
assert(guardrails.routeExecutionBehavior === 'block_until_phase44j_or_later', 'Route execution must remain blocked.')

const routeHandoff = reports.routeHandoff as {
  routeExecutionAllowed?: boolean
  workerExecutionAllowed?: boolean
  localSidecarExecutionAllowed?: boolean
  cannotOverrideBlockedToolStatus?: boolean
  cannotApproveVlm?: boolean
  cannotApproveDemucs?: boolean
  cannotApproveBroadMedia?: boolean
}
assert(routeHandoff.routeExecutionAllowed === false, 'Route execution must be blocked.')
assert(routeHandoff.workerExecutionAllowed === false, 'Worker execution must be blocked.')
assert(routeHandoff.localSidecarExecutionAllowed === false, 'Local sidecar execution must be blocked.')
assert(routeHandoff.cannotOverrideBlockedToolStatus === true, 'Estimator cannot override blocked routes.')
assert(routeHandoff.cannotApproveVlm === true, 'Estimator cannot approve VLM.')
assert(routeHandoff.cannotApproveDemucs === true, 'Estimator cannot approve Demucs.')
assert(routeHandoff.cannotApproveBroadMedia === true, 'Estimator cannot approve broad media.')

const readiness = reports.readinessReport as {
  costEstimatorStatus?: string
  localWorkerSidecar?: string
  hybridE2eSimulation?: string
  production?: string
  externalBeta?: string
  broadMedia?: string
  publicArtifacts?: string
  vlm?: string
  demucs?: string
  trackA?: string
}
assert(readiness.costEstimatorStatus === 'phase_complete_restricted_scope', 'Cost estimator readiness status mismatch.')
assert(readiness.localWorkerSidecar === 'pending', 'Local sidecar must remain pending.')
assert(readiness.hybridE2eSimulation === 'pending', 'Hybrid E2E must remain pending.')
assert(readiness.production === 'blocked', 'Production must remain blocked.')
assert(readiness.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readiness.broadMedia === 'blocked', 'Broad media must remain blocked.')
assert(readiness.publicArtifacts === 'blocked', 'Public artifacts must remain blocked.')
assert(readiness.vlm === 'excluded', 'VLM must remain excluded.')
assert(readiness.demucs === 'blocked', 'Demucs must remain blocked.')
assert(readiness.trackA === 'not_touched', 'Track A must remain untouched.')

for (const reportFile of TRACK_B_COST_ESTIMATOR_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('phase_44h_'), `Unexpected Phase 44H report name: ${reportFile}`)
}
assert(TRACK_B_COST_ESTIMATOR_REPORT_DIR.includes('activation-phase-44h-track-b-cost-estimator-reports'), 'Report directory mismatch.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44H',
  toolMappingCount: toolMapping.toolCount,
  scenarioCount: scenarioResults.scenarios?.length,
  costEstimatorStatus: readiness.costEstimatorStatus,
  billingApiCalls: 'not_run',
  routeExecution: 'blocked',
  workerExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
