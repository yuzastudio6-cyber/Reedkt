import type {
  EditLevelEstimateItemId,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'

export interface EditLevelEstimateFallbackReport {
  level: ReEditProCanonicalEditLevel
  fallbacks: string[]
  warnings: string[]
  degradedItems: EditLevelEstimateItemId[]
  futureGatedItems: EditLevelEstimateItemId[]
  mockOnly: true
}

export function createEditLevelEstimateFallbackReport(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelEstimateFallbackReport {
  const estimatePackage = createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    fallbacks: estimatePackage.estimateItems.map((item) => `${item.displayName}: ${item.fallback}`),
    warnings: estimatePackage.warnings,
    degradedItems: estimatePackage.degradedItems,
    futureGatedItems: estimatePackage.futureGatedItems,
    mockOnly: true,
  }
}
