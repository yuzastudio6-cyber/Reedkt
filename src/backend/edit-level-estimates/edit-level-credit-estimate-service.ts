import type {
  EditLevelEstimateItem,
  EditLevelEstimateRange,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'
import { findEditLevelEstimateItem } from '../../lib/edit-level-estimates-summaries'

export interface EditLevelCreditEstimateResult {
  level: ReEditProCanonicalEditLevel
  creditEstimateRange: EditLevelEstimateRange
  creditEstimateMultiplier: number
  creditEstimateItem: EditLevelEstimateItem
  estimateOnly: true
  creditsReservedOrSpent: false
  creditRecordCreated: false
  mockOnly: true
}

export function createEditLevelCreditEstimate(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelCreditEstimateResult {
  const estimatePackage = createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    creditEstimateRange: estimatePackage.creditEstimateRange,
    creditEstimateMultiplier: estimatePackage.creditEstimateMultiplier,
    creditEstimateItem: findEditLevelEstimateItem(estimatePackage, 'credit_estimate'),
    estimateOnly: true,
    creditsReservedOrSpent: false,
    creditRecordCreated: false,
    mockOnly: true,
  }
}
