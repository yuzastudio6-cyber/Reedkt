import type { ReEditProCanonicalEditLevel } from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export interface EditLevelQwenFallbackReport {
  level: ReEditProCanonicalEditLevel
  fallbacks: string[]
  warnings: string[]
  degradedDimensionCount: number
  mockOnly: true
}

export function createEditLevelQwenFallbackReport(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenFallbackReport {
  const qwenPackage = createEditLevelQwenPlanningProfilePackage(input.level)

  return {
    level: input.level,
    fallbacks: qwenPackage.fallbackPolicy,
    warnings: qwenPackage.warnings,
    degradedDimensionCount: qwenPackage.degradedDimensions.length,
    mockOnly: true,
  }
}
