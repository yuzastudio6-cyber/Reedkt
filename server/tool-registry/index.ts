import {
  allProfessionalToolCatalogProfiles,
  nonE2EToolCapabilityProfiles,
  productionToolProfiles,
} from './production-tool-profiles'
import {
  NON_E2E_TOOL_CAPABILITY_IDS,
  PRODUCTION_TOOL_IDS,
  RUNNER_ONLY_FOUNDATION_IDS,
} from './production-tool-types'
import type {
  NonE2EToolCapabilityCatalogSummary,
  NonE2EToolCapabilityId,
  NonE2EToolCapabilityProfile,
  ProfessionalToolCatalogId,
  ProfessionalToolCatalogProfile,
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
export * from './tool-capability-manifest-types'
export * from './tool-capability-manifest-registry'
export * from './tool-runtime-status-registry'
export * from './professional-tool-adapter-contracts'
export * from './professional-tool-adapter-plan'
export * from './professional-tool-adapter-source-truth'
export * from './professional-tool-adapter-execution'
export * from './professional-tool-adapter-registered-runners'
export * from './professional-tool-adapter-private-media-runners'
export * from './professional-tool-architecture-program'

export function isProductionToolId(toolId: string): toolId is ProductionToolId {
  return (PRODUCTION_TOOL_IDS as readonly string[]).includes(toolId)
}

export function isNonE2EToolCapabilityId(
  toolId: string,
): toolId is NonE2EToolCapabilityId {
  return (NON_E2E_TOOL_CAPABILITY_IDS as readonly string[]).includes(toolId)
}

export function getProductionToolProfile(toolId: ProductionToolId | string): ProductionToolProfile | undefined {
  return isProductionToolId(toolId)
    ? productionToolProfiles.find((profile) => profile.toolId === toolId)
    : undefined
}

export function listProductionToolProfiles(): ProductionToolProfile[] {
  return [...productionToolProfiles]
}

export function getNonE2EToolCapabilityProfile(
  toolId: NonE2EToolCapabilityId | string,
): NonE2EToolCapabilityProfile | undefined {
  return isNonE2EToolCapabilityId(toolId)
    ? nonE2EToolCapabilityProfiles.find((profile) => profile.toolId === toolId)
    : undefined
}

export function listNonE2EToolCapabilityProfiles():
NonE2EToolCapabilityProfile[] {
  return [...nonE2EToolCapabilityProfiles]
}

export function getKnownProfessionalToolCatalogProfile(
  toolId: ProfessionalToolCatalogId | string,
): ProfessionalToolCatalogProfile | undefined {
  return allProfessionalToolCatalogProfiles.find(
    (profile) => profile.toolId === toolId,
  )
}

export function listAllProfessionalToolCatalogProfiles():
ProfessionalToolCatalogProfile[] {
  return [...allProfessionalToolCatalogProfiles]
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
      'Non-end-to-end capability candidates are cataloged separately and cannot enter the production registry or dispatch path.',
      'Model/checkpoint licenses are tracked separately from package/repository licenses.',
    ],
  }
}

export function summarizeNonE2EToolCapabilityCatalog():
NonE2EToolCapabilityCatalogSummary {
  const runnerOnlyFoundationSet = new Set<string>(
    RUNNER_ONLY_FOUNDATION_IDS,
  )

  return {
    totalCapabilities: nonE2EToolCapabilityProfiles.length,
    runnerOnlyFoundations: [...RUNNER_ONLY_FOUNDATION_IDS],
    remainingUnprovenCapabilities: NON_E2E_TOOL_CAPABILITY_IDS.filter(
      (toolId) => !runnerOnlyFoundationSet.has(toolId),
    ),
    toolCallAllowed: false,
    plannerSelectionAllowed: false,
    workManifestAdmissionAllowed: false,
    dispatchAllowed: false,
    notes: [
      'These identities preserve design, licensing, model, and readiness evidence only.',
      'They are excluded from ProductionToolId runtime schemas and canonical tool selection.',
      'A capability can move into the production registry only after exact canonical E2E and job-adapter proof.',
    ],
  }
}
