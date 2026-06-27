import type {
  EditLevelQwenPlanningProfilePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export interface EditLevelQwenPlanningSummaryResult {
  level: ReEditProCanonicalEditLevel
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  dimensionCount: number
  mockOnly: true
}

export function createEditLevelQwenPlanningSummary(input: {
  level: ReEditProCanonicalEditLevel
  qwenPackage?: EditLevelQwenPlanningProfilePackage
}): EditLevelQwenPlanningSummaryResult {
  const qwenPackage = input.qwenPackage ?? createEditLevelQwenPlanningProfilePackage(input.level)

  return {
    level: input.level,
    userFacingSummary: qwenPackage.userFacingSummary,
    technicalSummary: qwenPackage.technicalSummary,
    warnings: qwenPackage.warnings,
    dimensionCount: qwenPackage.dimensions.length,
    mockOnly: true,
  }
}
