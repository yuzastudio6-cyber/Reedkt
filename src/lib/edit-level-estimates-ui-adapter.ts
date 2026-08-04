import type {
  EditLevelCreditEstimateNoticeModel,
  EditLevelEstimateBoundaryNoticeModel,
  EditLevelEstimateItemListModel,
  EditLevelEstimatePackage,
  EditLevelEstimateSummaryModel,
  EditLevelRenderBudgetNoticeModel,
  EditLevelRevisionBudgetNoticeModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import {
  createEditLevelEstimateBoundarySummary,
  createEditLevelEstimatePackage,
} from './edit-level-estimates-rules'
import {
  createEditLevelEstimateBudgetSummary,
  estimateStatusLabel,
  qwenPassBudgetLabel,
} from './edit-level-estimates-summaries'

export function loadEditLevelEstimatesForUI(level: ReEditProCanonicalEditLevel): EditLevelEstimatePackage {
  return createEditLevelEstimatePackage(level)
}

export function createEditLevelEstimateSummaryModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelEstimateSummaryModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    estimateStatusLabel: estimateStatusLabel(estimatePackage.estimateStatus),
    timeEstimateSummary: estimatePackage.timeEstimateRange.label,
    creditEstimateSummary: `${estimatePackage.creditEstimateMultiplier.toFixed(1)}x placeholder multiplier`,
    creditEstimateMultiplier: `${estimatePackage.creditEstimateMultiplier.toFixed(1)}x`,
    analysisPassBudget: `${estimatePackage.analysisPassBudget} pass${estimatePackage.analysisPassBudget === 1 ? '' : 'es'}`,
    qwenReasoningPassBudget: qwenPassBudgetLabel(estimatePackage.qwenReasoningPassBudget),
    renderPassBudgetFuture: estimatePackage.renderPassBudgetFuture,
    revisionBudgetFuture: estimatePackage.revisionBudgetFuture,
    variantBudgetFuture: estimatePackage.variantBudgetFuture,
    userFacingSummary: estimatePackage.userFacingSummary,
    highlights: [
      estimatePackage.userFacingSummary,
      createEditLevelEstimateBudgetSummary(estimatePackage),
      'Estimate only - no credits are reserved and no render starts.',
      'Workers, render, export, final pricing, and credit gates remain future-gated.',
    ],
    mockOnly: true,
  }
}

export function createEditLevelEstimateItemListModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelEstimateItemListModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    estimateItems: estimatePackage.estimateItems,
    futureGatedItems: estimatePackage.estimateItems.filter((item) => item.futureGated),
    degradedItems: estimatePackage.estimateItems.filter((item) => estimatePackage.degradedItems.includes(item.estimateId)),
    needsProductValueItems: estimatePackage.estimateItems.filter((item) => estimatePackage.needsProductValueItems.includes(item.estimateId)),
    mockOnly: true,
  }
}

export function createEditLevelCreditEstimateNoticeModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelCreditEstimateNoticeModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    creditEstimateMultiplier: estimatePackage.creditEstimateMultiplier,
    creditEstimateRange: estimatePackage.creditEstimateRange,
    notice: `${estimatePackage.creditEstimateMultiplier.toFixed(1)}x multiplier placeholder. Estimate only - no credits are reserved, spent, or recorded. Final pricing and credit values need product values and future credit gates.`,
    estimateOnly: true,
    creditsReservedOrSpent: false,
    creditRecordCreated: false,
    mockOnly: true,
  }
}

export function createEditLevelRenderBudgetNoticeModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelRenderBudgetNoticeModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    renderPassBudgetFuture: estimatePackage.renderPassBudgetFuture,
    variantBudgetFuture: estimatePackage.variantBudgetFuture,
    notice: `Future render pass budget: ${estimatePackage.renderPassBudgetFuture}. Future variant budget: ${estimatePackage.variantBudgetFuture}. No render/export starts in RP-EDITLEVEL-09.`,
    futureGated: true,
    renderJobCreated: false,
    mockOnly: true,
  }
}

export function createEditLevelRevisionBudgetNoticeModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelRevisionBudgetNoticeModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    revisionBudgetFuture: estimatePackage.revisionBudgetFuture,
    notice: `Future revision budget: ${estimatePackage.revisionBudgetFuture}. This is planning metadata only, not a committed service promise or credit reservation.`,
    futureGated: true,
    mockOnly: true,
  }
}

export function createEditLevelEstimateBoundaryNoticeModel(
  level: ReEditProCanonicalEditLevel,
  estimatePackage: EditLevelEstimatePackage = createEditLevelEstimatePackage(level),
): EditLevelEstimateBoundaryNoticeModel {
  return {
    level,
    displayName: estimatePackage.displayName,
    shortCopy: 'Estimate only - no credits are reserved and no render starts.',
    detailedCopy: 'This estimate reflects planned depth and future budget. ReEditPro will not reserve credits, start workers, render, or export until the future approval/credit/render gates are active.',
    notices: createEditLevelEstimateBoundarySummary(),
    mockOnly: true,
  }
}
