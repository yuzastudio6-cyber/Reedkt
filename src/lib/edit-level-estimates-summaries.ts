import type {
  EditLevelEstimateItem,
  EditLevelEstimateItemId,
  EditLevelEstimatePackage,
  EditLevelEstimateStatus,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelEstimatePackage } from './edit-level-estimates-rules'
import { hideInternalToolNamesInCopy } from './tool-display-labels'

export function estimateStatusLabel(status: EditLevelEstimateStatus): string {
  if (status === 'estimate_ready_mock') return 'local estimate ready'
  if (status === 'estimate_ready_with_warnings') return 'estimate ready with warnings'
  if (status === 'estimate_degraded_by_missing_tool') return 'estimate degraded by missing activity'
  if (status === 'estimate_needs_product_value') return 'needs product value'
  if (status === 'future_gated') return 'future gated'
  return status.replaceAll('_', ' ')
}

export function qwenPassBudgetLabel(value: number | 'multi_pass'): string {
  return value === 'multi_pass' ? 'multi-pass' : `${value} pass${value === 1 ? '' : 'es'}`
}

export function createEditLevelEstimateUserSummary(level: ReEditProCanonicalEditLevel): string {
  return hideInternalToolNamesInCopy(createEditLevelEstimatePackage(level).userFacingSummary)
}

export function createEditLevelEstimateTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): string {
  return hideInternalToolNamesInCopy(`${estimatePackage.displayName}: ${estimateStatusLabel(estimatePackage.estimateStatus)}, ${estimatePackage.timeEstimateRange.label}, ${estimatePackage.creditEstimateMultiplier.toFixed(1)}x multiplier, render/revision/variant future budgets ${estimatePackage.renderPassBudgetFuture}/${estimatePackage.revisionBudgetFuture}/${estimatePackage.variantBudgetFuture}, and all side-effect flags remain false.`)
}

export function createEditLevelEstimateItemSummary(item: EditLevelEstimateItem): string {
  return hideInternalToolNamesInCopy(`${item.displayName}: ${String(item.estimateValue)} ${item.unit === 'none' ? '' : item.unit}. ${item.userFacingSummary}`.trim())
}

export function findEditLevelEstimateItem(
  estimatePackage: EditLevelEstimatePackage,
  estimateId: EditLevelEstimateItemId,
): EditLevelEstimateItem {
  const item = estimatePackage.estimateItems.find((candidate) => candidate.estimateId === estimateId)

  if (!item) {
    throw new Error(`Missing Edit Level estimate item: ${estimateId}`)
  }

  return item
}

export function createEditLevelEstimateBudgetSummary(estimatePackage: EditLevelEstimatePackage): string {
  return `${estimatePackage.displayName} estimate: ${estimatePackage.timeEstimateRange.label}, ${estimatePackage.creditEstimateMultiplier.toFixed(1)}x credit multiplier placeholder, ${estimatePackage.analysisPassBudget} analysis passes, future render/revision/variant ${estimatePackage.renderPassBudgetFuture}/${estimatePackage.revisionBudgetFuture}/${estimatePackage.variantBudgetFuture}.`
}
