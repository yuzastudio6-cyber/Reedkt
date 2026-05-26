import type { ProductionRegistryWorkerType } from '../../tool-registry'
import type {
  ReadinessImageSummary,
  ReadinessWorkerSummary,
} from './readiness-validation-types'

export function mapImageSummaryToWorkerSummary(
  workerType: ProductionRegistryWorkerType,
  imageSummary: ReadinessImageSummary,
): ReadinessWorkerSummary {
  return {
    workerType,
    imageRole: imageSummary.imageRole,
    expectedTools: [...imageSummary.expectedTools],
    requiredTools: [...imageSummary.requiredTools],
    optionalTools: [...imageSummary.optionalTools],
    missingTools: [...imageSummary.missingTools],
    blockedTools: [...imageSummary.blockedTools],
    modelWeightBlockedTools: [...imageSummary.modelWeightBlockedTools],
    evaluationOnlyTools: [...imageSummary.evaluationOnlyTools],
    readinessScore: imageSummary.readinessScore,
    productionAllowed: imageSummary.productionAllowed,
    blockers: [...imageSummary.blockers],
    warnings: [...imageSummary.warnings],
  }
}

export function findWorkerSummary(
  workerSummaries: ReadinessWorkerSummary[],
  workerType: ProductionRegistryWorkerType,
): ReadinessWorkerSummary | undefined {
  return workerSummaries.find((summary) => summary.workerType === workerType)
}
