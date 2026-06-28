import type {
  EditLevelQwenPlanningDimensionId,
  EditLevelQwenPlanningDimensionRoute,
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningRequiredness,
  EditLevelQwenPlanningStatus,
  EditLevelQwenPromptPolicy,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelQwenPlanningProfilePackage } from './edit-level-qwen-planning-rules'

export function createEditLevelQwenPlanningUserSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return createEditLevelQwenPlanningProfilePackage(level).userFacingSummary
}

export function createEditLevelQwenPlanningTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return createEditLevelQwenPlanningProfilePackage(level).technicalSummary
}

export function createEditLevelQwenDimensionSummary(route: EditLevelQwenPlanningDimensionRoute): string {
  return `${route.displayName}: ${route.policyValue}; ${requirednessLabel(route.requiredness)}, ${statusLabel(route.status)}.`
}

export function createEditLevelQwenPromptPolicySummary(policy: EditLevelQwenPromptPolicy): string {
  return `${policy.promptContextPolicy} future prompt context, estimated ${policy.maxPromptContextTokensEstimate} tokens. ${policy.userFacingSummary}`
}

export function createEditLevelQwenFallbackSummary(
  level: ReEditProCanonicalEditLevel,
): string[] {
  return createEditLevelQwenPlanningProfilePackage(level).fallbackPolicy
}

export function findEditLevelQwenPlanningDimensionRoute(
  qwenPackage: EditLevelQwenPlanningProfilePackage,
  dimensionId: EditLevelQwenPlanningDimensionId,
): EditLevelQwenPlanningDimensionRoute {
  const route = qwenPackage.dimensions.find((item) => item.dimensionId === dimensionId)

  if (!route) {
    throw new Error(`Missing Edit Level Qwen planning dimension route: ${dimensionId}`)
  }

  return route
}

export function qwenReasoningLabel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'standard reasoning'
  if (level === 'premium') return 'deep creative reasoning'
  return 'studio multi-pass reasoning'
}

export function structuredOutputLabel(policy: EditLevelQwenPlanningProfilePackage['structuredOutputPolicy']): string {
  if (policy === 'simple_professional_plan_hints') return 'simple professional plan hints'
  if (policy === 'layered_creative_plan_hints') return 'layered creative plan hints'
  return 'studio multi-layer plan hints'
}

export function statusLabel(status: EditLevelQwenPlanningStatus): string {
  return status.replaceAll('_', ' ')
}

export function requirednessLabel(requiredness: EditLevelQwenPlanningRequiredness): string {
  return requiredness.replaceAll('_', ' ')
}
