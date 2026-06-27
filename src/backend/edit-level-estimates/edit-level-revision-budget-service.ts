import type {
  EditLevelEstimateItem,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'
import { findEditLevelEstimateItem } from '../../lib/edit-level-estimates-summaries'

export interface EditLevelRevisionBudgetResult {
  level: ReEditProCanonicalEditLevel
  revisionBudgetFuture: number
  revisionBudgetItem: EditLevelEstimateItem
  mockOnly: true
}

export function createEditLevelRevisionBudget(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelRevisionBudgetResult {
  const estimatePackage = createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    revisionBudgetFuture: estimatePackage.revisionBudgetFuture,
    revisionBudgetItem: findEditLevelEstimateItem(estimatePackage, 'revision_budget_future'),
    mockOnly: true,
  }
}
