import type {
  EditLevelEstimateItem,
  EditLevelEstimateItemId,
  EditLevelEstimatePackage,
  EditLevelEstimateStatus,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelEstimatePackage } from './edit-level-estimates-rules'

export function estimateStatusLabel(status: EditLevelEstimateStatus): string {
  return status.replaceAll('_', ' ')
}

export function qwenPassBudgetLabel(value: number | 'multi_pass'): string {
  return value === 'multi_pass' ? 'multi-pass' : `${value} pass${value === 1 ? '' : 'es'}`
}

export function createEditLevelEstimateUserSummary(level: ReEditProCanonicalEditLevel): string {
  return createEditLevelEstimatePackage(level).userFacingSummary
}

export function createEditLevelEstimateTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): string {
  return `${estimatePackage.displayName}: ${estimateStatusLabel(estimatePackage.estimateStatus)}, ${estimatePackage.timeEstimateRange.label}, ${estimatePackage.creditEstimateMultiplier.toFixed(1)}x multiplier, render/revision/variant future budgets ${estimatePackage.renderPassBudgetFuture}/${estimatePackage.revisionBudgetFuture}/${estimatePackage.variantBudgetFuture}, and all side-effect flags remain false.`
}

export function createEditLevelEstimateItemSummary(item: EditLevelEstimateItem): string {
  return `${item.displayName}: ${String(item.estimateValue)} ${item.unit === 'none' ? '' : item.unit}. ${item.userFacingSummary}`.trim()
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
