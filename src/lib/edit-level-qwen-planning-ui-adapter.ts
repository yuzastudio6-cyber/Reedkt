import type {
  EditLevelQwenFallbackNoticeModel,
  EditLevelQwenPlanningDimensionListModel,
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningSummaryModel,
  EditLevelQwenUsageEstimateNoticeModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import {
  createEditLevelQwenPlanningBoundarySummary,
  createEditLevelQwenPlanningProfilePackage,
} from './edit-level-qwen-planning-rules'
import {
  qwenReasoningLabel,
  structuredOutputLabel,
} from './edit-level-qwen-planning-summaries'
import { hideInternalToolNamesInCopy } from './tool-display-labels'

export function loadEditLevelQwenPlanningForUI(
  level: ReEditProCanonicalEditLevel,
): EditLevelQwenPlanningProfilePackage {
  return createEditLevelQwenPlanningProfilePackage(level)
}

export function createEditLevelQwenPlanningSummaryModel(
  level: ReEditProCanonicalEditLevel,
  qwenPackage: EditLevelQwenPlanningProfilePackage = createEditLevelQwenPlanningProfilePackage(level),
): EditLevelQwenPlanningSummaryModel {
  return {
    level,
    displayName: qwenPackage.displayName,
    qwenReasoningDepth: qwenReasoningLabel(level),
    planningPassPolicy: qwenPackage.planningPassPolicy.replaceAll('_', ' '),
    promptContextPolicy: qwenPackage.promptContextPolicy,
    markerChatPolicy: qwenPackage.markerChatPolicy,
    preferenceDNAPolicy: qwenPackage.preferenceDNAPolicy,
    qaExplanationPolicy: qwenPackage.qaExplanationPolicy,
    structuredOutputPolicy: structuredOutputLabel(qwenPackage.structuredOutputPolicy),
    userFacingSummary: hideInternalToolNamesInCopy(qwenPackage.userFacingSummary),
    highlights: [
      hideInternalToolNamesInCopy(qwenPackage.userFacingSummary),
      hideInternalToolNamesInCopy(qwenPackage.promptPolicy.userFacingSummary),
      `Structured output policy: ${structuredOutputLabel(qwenPackage.structuredOutputPolicy)}.`,
      'No AI planning call, asset service call, plan generation, render, or credit operation starts from this selection.',
    ],
    mockOnly: true,
  }
}

export function createEditLevelQwenPlanningDimensionListModel(
  level: ReEditProCanonicalEditLevel,
  qwenPackage: EditLevelQwenPlanningProfilePackage = createEditLevelQwenPlanningProfilePackage(level),
): EditLevelQwenPlanningDimensionListModel {
  return {
    level,
    displayName: qwenPackage.displayName,
    required: qwenPackage.dimensions.filter((route) => route.requiredness === 'required'),
    recommended: qwenPackage.dimensions.filter((route) => route.requiredness === 'recommended'),
    futureGated: qwenPackage.dimensions.filter((route) =>
      ['runtime_disabled', 'provider_required', 'worker_required', 'future_gated'].includes(route.status),
    ),
    degradedOrFallback: qwenPackage.dimensions.filter((route) => qwenPackage.degradedDimensions.includes(route.dimensionId)),
    notUsed: qwenPackage.dimensions.filter((route) => route.requiredness === 'not_used' || route.status === 'not_required'),
    mockOnly: true,
  }
}

export function createEditLevelQwenFallbackNoticeModel(
  level: ReEditProCanonicalEditLevel,
  qwenPackage: EditLevelQwenPlanningProfilePackage = createEditLevelQwenPlanningProfilePackage(level),
): EditLevelQwenFallbackNoticeModel {
  return {
    level,
    displayName: qwenPackage.displayName,
    notices: qwenPackage.fallbackPolicy.map(hideInternalToolNamesInCopy),
    boundary: hideInternalToolNamesInCopy(createEditLevelQwenPlanningBoundarySummary().join(' ')),
    mockOnly: true,
  }
}

export function createEditLevelQwenUsageEstimateNoticeModel(
  level: ReEditProCanonicalEditLevel,
  qwenPackage: EditLevelQwenPlanningProfilePackage = createEditLevelQwenPlanningProfilePackage(level),
): EditLevelQwenUsageEstimateNoticeModel {
  return {
    level,
    displayName: qwenPackage.displayName,
    usageEstimatePolicy: qwenPackage.usageEstimatePolicy,
    creditBehavior: qwenPackage.creditBehavior,
    notice: `${qwenPackage.usageEstimatePolicy.replaceAll('_', ' ')} for future AI planning. Estimate only: no AI planning call, no plan generation, no credit reservation, and no credit spend.`,
    mockOnly: true,
  }
}
