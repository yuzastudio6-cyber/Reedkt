import { productionToolProfiles } from './production-tool-profiles'
import { PRODUCTION_TOOL_IDS } from './production-tool-types'
import type {
  ProductionRegistryWorkerType,
  ProductionToolCategory,
  ProductionToolId,
  ProductionToolProfile,
  ProductionToolRegistrySummary,
  ProductionToolStatus,
} from './production-tool-types'
import { evaluateToolLicensePolicy, assertToolLicenseAllowed } from './tool-license-policy'
import { evaluateToolModelWeightPolicy, assertToolModelWeightPolicyAllowed } from './model-weight-policy'
import { assertRuntimePolicyAllowsProduction, assertRuntimePolicyAllowsWorker } from './tool-runtime-policy'

export * from './production-tool-types'
export * from './production-tool-profiles'
export * from './tool-runtime-policy'
export * from './tool-license-policy'
export * from './model-weight-policy'
export * from './tool-fallback-policy'
export * from './tool-qa-policy'
export * from './ai-graphics-tool-call-readiness'
export * from './ai-graphics-tool-call-handoff'
export * from './ai-graphics-tool-call-plan-evaluator'
export * from './ai-graphics-on-demand-runtime-admission'
export * from './ai-graphics-beta-readiness-gate'
export * from './ai-graphics-external-beta-evidence-scaffold'
export * from './ai-graphics-external-beta-evidence-packet'
export * from './ai-graphics-external-beta-evidence-admission-bundle'
export * from './ai-graphics-external-beta-readiness-gate'
export * from './ai-graphics-external-beta-launch-controls'
export * from './ai-graphics-external-beta-candidate-evidence-assembly'
export * from './ai-graphics-external-beta-controlled-runtime-execution-approval'
export * from './ai-graphics-external-beta-live-enqueue-authorization'
export * from './ai-graphics-external-beta-callable-scope'
export * from './ai-graphics-external-beta-callable-request-admission'
export * from './ai-graphics-external-agent-execution-gate'
export * from './ai-graphics-external-agent-tool-adapter-authorization'
export * from './ai-graphics-external-agent-cpu-static-adapter-smoke'
export * from './ai-graphics-external-agent-cpu-static-private-worker-handoff-admission'
export * from './ai-graphics-external-beta-api-route-boundary'
export * from './ai-graphics-external-beta-api-route-queue-insertion-proof'
export * from './ai-graphics-external-beta-api-route-queue-smoke-authorization'
export * from './ai-graphics-external-beta-api-route-queue-smoke-proof'
export * from './ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
export * from './ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission'
export * from './ai-graphics-external-beta-api-route-controlled-worker-runtime-proof'
export * from './ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization'
export * from './ai-graphics-external-beta-api-route-worker-runtime-smoke-proof'
export * from './ai-graphics-external-beta-per-tool-callable-result-gate'
export * from './ai-graphics-external-beta-per-tool-traffic-enablement-gate'
export * from './ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization'
export * from './ai-graphics-external-beta-controlled-traffic-runtime-soak-result'
export * from './ai-graphics-external-beta-activation-go-no-go'
export * from './ai-graphics-external-beta-all-21-activation-rollup'
export * from './ai-graphics-external-beta-activated-launch-readiness'
export * from './ai-graphics-external-beta-controlled-on-demand-status-bridge'
export * from './ai-graphics-external-beta-api-route-handler-contract'
export * from './ai-graphics-external-beta-api-route-handler-gateway-binding'
export * from './ai-graphics-external-beta-api-route-handler-gateway-full-proof'
export * from './ai-graphics-external-beta-api-route-mount-readiness'
export * from './ai-graphics-external-beta-api-route-mount-implementation-review'
export * from './ai-graphics-external-beta-api-route-mount-implementation-qa'
export * from './ai-graphics-external-beta-api-route-backend-adapter-contract'
export * from './ai-graphics-external-beta-api-route-backend-adapter'
export * from './ai-graphics-external-beta-api-route-backend-adapter-smoke'
export * from './ai-graphics-production-launch-controls'
export * from './ai-graphics-production-launch-go-no-go'
export * from './ai-graphics-production-traffic-cutover'
export * from './ai-graphics-production-tool-call-gateway-handoff'
export * from './ai-graphics-production-worker-queue-admission'
export * from './ai-graphics-production-service-role-queue-transaction-dry-proof'
export * from './ai-graphics-production-controlled-dispatch-authorization-proof'
export * from './ai-graphics-production-controlled-worker-dispatch-smoke-proof'
export * from './ai-graphics-production-controlled-worker-runtime-smoke-authorization'
export * from './ai-graphics-production-controlled-worker-runtime-smoke-proof'
export * from './ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof'
export * from './ai-graphics-production-controlled-per-tool-callable-result-proof'
export * from './ai-graphics-production-controlled-per-tool-traffic-enablement-proof'
export * from './ai-graphics-production-launch-readiness-gap'
export * from './ai-graphics-external-beta-service-role-queue-smoke-authorization'
export * from './ai-graphics-external-beta-launch-gap-report'
export * from './ai-graphics-external-beta-launch-go-no-go'
export * from './ai-graphics-external-beta-end-to-end-readiness'
export * from './ai-graphics-external-beta-runtime-admission'
export * from './ai-graphics-external-beta-tool-call-gateway'
export * from './ai-graphics-external-beta-worker-enqueue-adapter'
export * from './ai-graphics-external-beta-backend-queue-submission'
export * from './ai-graphics-external-beta-service-role-queue-transaction'
export * from './ai-graphics-external-beta-local-queue-storage'
export * from './ai-graphics-external-beta-runtime-queue-service-bridge'
export * from './ai-graphics-external-beta-service-role-queue-smoke-readiness'
export * from './ai-graphics-external-beta-service-role-queue-smoke-preflight'
export * from './ai-graphics-external-beta-service-role-queue-smoke-proof'
export * from './ai-graphics-external-beta-worker-dispatch-readiness'
export * from './ai-graphics-external-beta-worker-dispatch-smoke'
export * from './ai-graphics-external-beta-worker-dispatch-smoke-proof'
export * from './ai-graphics-external-beta-private-artifact-manifest'
export * from './ai-graphics-external-beta-tool-route-runtime-proof'
export * from './ai-graphics-external-beta-per-tool-runtime-proof'
export * from './ai-graphics-external-beta-cpu-static-cohort-admission'
export * from './ai-graphics-external-beta-cpu-static-runtime-admission'
export * from './ai-graphics-external-beta-native-gpu-proof-collection'
export * from './ai-graphics-external-beta-native-gpu-proof-operator-handoff'
export * from './ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold'
export * from './ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector'
export * from './ai-graphics-tool-route-readiness'
export * from './ai-graphics-worker-handoff-readiness'
export * from './ai-graphics-model-weight-manifest-readiness'
export * from './ai-graphics-model-weight-source-catalog'
export * from './ai-graphics-model-weight-checksum-evidence'
export * from './ai-graphics-model-weight-checksum-evidence-scaffold'
export * from './ai-graphics-model-weight-manifest-authoring'
export * from './ai-graphics-model-weight-manifest-supplement'
export * from './ai-graphics-model-weight-manifest-supplement-scaffold'
export * from './ai-graphics-model-weight-private-evidence-intake'
export * from './ai-graphics-gpu-runtime-proof-command-plan'
export * from './ai-graphics-model-weight-manifest-scaffold'
export * from './ai-graphics-gpu-runtime-proof-result'
export * from './ai-graphics-gpu-runtime-proof-local-preflight'
export * from './ai-graphics-beta-activation-gap-report'
export * from './ai-graphics-beta-evidence-bundle'
export * from './ai-graphics-beta-evidence-local-assembly'
export * from './ai-graphics-beta-tool-call-readiness'
export * from './ai-graphics-internal-beta-owner-approval'
export * from './ai-graphics-beta-execution-handoff-readiness'
export * from './ai-graphics-internal-beta-dry-run-readiness'
export * from './ai-graphics-internal-beta-worker-payload-readiness'
export * from './ai-graphics-internal-beta-production-worker-job-readiness'
export * from './ai-graphics-internal-beta-production-worker-gate-readiness'
export * from './ai-graphics-beta-production-readiness-rollup'
export * from './ai-graphics-internal-beta-go-no-go'
export * from './ai-graphics-internal-beta-go-no-go-owner-approval'
export * from './ai-graphics-internal-beta-runtime-enqueue-approval'
export * from './ai-graphics-internal-beta-queue-admission-readiness'
export * from './ai-graphics-internal-beta-queue-adapter-readiness'
export * from './ai-graphics-internal-beta-queue-dispatcher-readiness'
export * from './ai-graphics-internal-beta-backend-queue-storage-readiness'
export * from './ai-graphics-internal-beta-service-role-queue-transaction-readiness'
export * from './ai-graphics-cross-owner-coordination'

export function isProductionToolId(toolId: string): toolId is ProductionToolId {
  return PRODUCTION_TOOL_IDS.includes(toolId as ProductionToolId)
}

export function getProductionToolProfile(toolId: ProductionToolId | string): ProductionToolProfile | undefined {
  return isProductionToolId(toolId)
    ? productionToolProfiles.find((profile) => profile.toolId === toolId)
    : undefined
}

export function listProductionToolProfiles(): ProductionToolProfile[] {
  return [...productionToolProfiles]
}

export function getProductionToolsByWorkerType(workerType: ProductionRegistryWorkerType): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.workerType === workerType)
}

export function getProductionToolsByCategory(category: ProductionToolCategory): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.category === category)
}

export function getProductionToolsByStatus(status: ProductionToolStatus): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.productionStatus === status)
}

export function getGpuRequiredTools(): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.gpuRequired)
}

export function getLaunchCoreProductionTools(): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.launchCore)
}

export function getToolsNeedingLicenseReview(): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => {
    const licenseResult = evaluateToolLicensePolicy(profile)
    const modelWeightResult = evaluateToolModelWeightPolicy(profile)
    return !licenseResult.allowed ||
      licenseResult.warnings.length > 0 ||
      !modelWeightResult.allowed ||
      profile.productionStatus === 'needs_license_review'
  })
}

export function getToolsWithModelWeights(): ProductionToolProfile[] {
  return productionToolProfiles.filter((profile) => profile.modelWeightsRequired)
}

export function assertToolAllowedForProduction(toolId: ProductionToolId | string): void {
  const profile = getProductionToolProfile(toolId)

  if (!profile) {
    throw new Error(`Unknown production tool: ${toolId}`)
  }

  assertRuntimePolicyAllowsProduction(profile)
  assertToolLicenseAllowed(profile)
  assertToolModelWeightPolicyAllowed(profile)
}

export function assertToolAllowedForWorker(
  toolId: ProductionToolId | string,
  workerType: ProductionRegistryWorkerType,
): void {
  const profile = getProductionToolProfile(toolId)

  if (!profile) {
    throw new Error(`Unknown production tool: ${toolId}`)
  }

  assertRuntimePolicyAllowsWorker(profile, workerType)
}

export function assertToolModelWeightsAllowed(toolId: ProductionToolId | string): void {
  const profile = getProductionToolProfile(toolId)

  if (!profile) {
    throw new Error(`Unknown production tool: ${toolId}`)
  }

  assertToolModelWeightPolicyAllowed(profile)
}

export function summarizeProductionToolRegistry(): ProductionToolRegistrySummary {
  const launchCoreTools = getLaunchCoreProductionTools().map((profile) => profile.toolId)
  const gpuRequiredTools = getGpuRequiredTools().map((profile) => profile.toolId)
  const toolsNeedingLicenseReview = getToolsNeedingLicenseReview().map((profile) => profile.toolId)
  const toolsWithModelWeights = getToolsWithModelWeights().map((profile) => profile.toolId)
  const evaluationOnlyTools = getProductionToolsByStatus('evaluation_only').map((profile) => profile.toolId)
  const blockedTools = getProductionToolsByStatus('blocked').map((profile) => profile.toolId)
  const categories = Array.from(new Set(productionToolProfiles.map((profile) => profile.category))).sort()
  const workerTypes = Array.from(new Set(productionToolProfiles.map((profile) => profile.workerType))).sort()

  return {
    totalTools: productionToolProfiles.length,
    launchCoreTools,
    gpuRequiredTools,
    toolsNeedingLicenseReview,
    toolsWithModelWeights,
    evaluationOnlyTools,
    blockedTools,
    categories,
    workerTypes,
    notes: [
      'Production registry metadata is server-only and does not install or execute tools.',
      'Workers execute approved plan snapshots and private storage artifacts, not raw chat.',
      'Frontend preview/planning IDs remain separate from backend-heavy ProductionToolId profiles.',
      'Revideo is evaluation-only and blocked from core render execution.',
      'Model/checkpoint licenses are tracked separately from package/repository licenses.',
    ],
  }
}
