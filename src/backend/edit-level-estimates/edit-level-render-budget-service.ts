import type {
  EditLevelEstimateItem,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'
import { findEditLevelEstimateItem } from '../../lib/edit-level-estimates-summaries'

export interface EditLevelRenderBudgetResult {
  level: ReEditProCanonicalEditLevel
  renderPassBudgetFuture: number
  variantBudgetFuture: number
  renderBudgetItem: EditLevelEstimateItem
  variantBudgetItem: EditLevelEstimateItem
  renderJobCreated: false
  mockOnly: true
}

export function createEditLevelRenderBudget(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelRenderBudgetResult {
  const estimatePackage = createEditLevelEstimatePackage(input.level)

  return {
    level: input.level,
    renderPassBudgetFuture: estimatePackage.renderPassBudgetFuture,
    variantBudgetFuture: estimatePackage.variantBudgetFuture,
    renderBudgetItem: findEditLevelEstimateItem(estimatePackage, 'render_pass_budget_future'),
    variantBudgetItem: findEditLevelEstimateItem(estimatePackage, 'variant_budget_future'),
    renderJobCreated: false,
    mockOnly: true,
  }
}
