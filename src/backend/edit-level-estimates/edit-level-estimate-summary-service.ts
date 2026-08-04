import type {
  EditLevelEstimatePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'
import { createEditLevelEstimateTechnicalSummary } from '../../lib/edit-level-estimates-summaries'

export interface EditLevelEstimateSummaryResult {
  level: ReEditProCanonicalEditLevel
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  itemCount: number
  futureGatedItemCount: number
  needsProductValueItemCount: number
  mockOnly: true
}

export function createEditLevelEstimateSummary(input: {
  level: ReEditProCanonicalEditLevel
  estimatePackage?: EditLevelEstimatePackage
}): EditLevelEstimateSummaryResult {
  const estimatePackage = input.estimatePackage ?? createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    userFacingSummary: estimatePackage.userFacingSummary,
    technicalSummary: createEditLevelEstimateTechnicalSummary(input.level, estimatePackage),
    warnings: estimatePackage.warnings,
    itemCount: estimatePackage.estimateItems.length,
    futureGatedItemCount: estimatePackage.futureGatedItems.length,
    needsProductValueItemCount: estimatePackage.needsProductValueItems.length,
    mockOnly: true,
  }
}
