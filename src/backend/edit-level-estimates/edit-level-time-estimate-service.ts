import type {
  EditLevelEstimateItem,
  EditLevelEstimateRange,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'
import { findEditLevelEstimateItem } from '../../lib/edit-level-estimates-summaries'

export interface EditLevelTimeEstimateResult {
  level: ReEditProCanonicalEditLevel
  timeEstimateRange: EditLevelEstimateRange
  timeEstimateItem: EditLevelEstimateItem
  mockOnly: true
}

export function createEditLevelTimeEstimate(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelTimeEstimateResult {
  const estimatePackage = createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    timeEstimateRange: estimatePackage.timeEstimateRange,
    timeEstimateItem: findEditLevelEstimateItem(estimatePackage, 'time_estimate'),
    mockOnly: true,
  }
}
