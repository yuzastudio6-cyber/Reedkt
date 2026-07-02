import {
  getProductionToolProfile,
  type ProductionRegistryWorkerType,
  type ProductionToolId,
} from '../../tool-registry'
import {
  productionContainerImageExpectations,
  type ProductionContainerImageExpectation,
  type ProductionContainerImageRole,
} from '../production-readiness'

export interface ContainerImageReadinessManifestEntry extends ProductionContainerImageExpectation {
  workerType: ProductionRegistryWorkerType
  requiredToolIds: ProductionToolId[]
  optionalToolIds: ProductionToolId[]
  futureOnlyToolIds: ProductionToolId[]
  evaluationOnlyToolIds: ProductionToolId[]
  modelWeightToolIds: ProductionToolId[]
}

const workerTypeByImageRole: Record<ProductionContainerImageRole, ProductionRegistryWorkerType> = {
  api: 'api_service',
  cpu_worker: 'cpu_analysis_worker',
  gpu_worker: 'gpu_ai_worker',
  render_worker: 'render_worker',
  qa_worker: 'qa_worker',
  tool_readiness_worker: 'tool_readiness_worker',
}

function splitToolIds(toolIds: ProductionToolId[]): Pick<
  ContainerImageReadinessManifestEntry,
  'requiredToolIds' | 'optionalToolIds' | 'futureOnlyToolIds' | 'evaluationOnlyToolIds' | 'modelWeightToolIds'
> {
  const requiredToolIds: ProductionToolId[] = []
  const optionalToolIds: ProductionToolId[] = []
  const futureOnlyToolIds: ProductionToolId[] = []
  const evaluationOnlyToolIds: ProductionToolId[] = []
  const modelWeightToolIds: ProductionToolId[] = []

  for (const toolId of toolIds) {
    const profile = getProductionToolProfile(toolId)

    if (!profile) {
      optionalToolIds.push(toolId)
      continue
    }

    if (profile.launchCore && profile.productionStatus !== 'evaluation_only') {
      requiredToolIds.push(toolId)
    } else {
      optionalToolIds.push(toolId)
    }

    if (profile.productionStatus === 'future') futureOnlyToolIds.push(toolId)
    if (profile.productionStatus === 'evaluation_only') evaluationOnlyToolIds.push(toolId)
    if (profile.modelWeightsRequired) modelWeightToolIds.push(toolId)
  }

  return {
    requiredToolIds,
    optionalToolIds,
    futureOnlyToolIds,
    evaluationOnlyToolIds,
    modelWeightToolIds,
  }
}

export const containerImageReadinessManifest: ContainerImageReadinessManifestEntry[] =
  productionContainerImageExpectations.map((expectation) => ({
    ...expectation,
    workerType: workerTypeByImageRole[expectation.imageRole],
    ...splitToolIds(expectation.expectedToolIds),
  }))

export function listContainerImageReadinessManifest(): ContainerImageReadinessManifestEntry[] {
  return containerImageReadinessManifest.map((entry) => ({
    ...entry,
    expectedToolIds: [...entry.expectedToolIds],
    forbiddenToolIds: [...entry.forbiddenToolIds],
    notes: [...entry.notes],
    requiredToolIds: [...entry.requiredToolIds],
    optionalToolIds: [...entry.optionalToolIds],
    futureOnlyToolIds: [...entry.futureOnlyToolIds],
    evaluationOnlyToolIds: [...entry.evaluationOnlyToolIds],
    modelWeightToolIds: [...entry.modelWeightToolIds],
  }))
}

export function getContainerImageReadinessManifestEntry(
  imageRole: ProductionContainerImageRole,
): ContainerImageReadinessManifestEntry | undefined {
  return listContainerImageReadinessManifest().find((entry) => entry.imageRole === imageRole)
}
