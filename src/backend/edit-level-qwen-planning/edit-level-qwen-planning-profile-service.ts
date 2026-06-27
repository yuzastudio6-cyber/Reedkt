import type {
  EditLevelQwenPlanningProfilePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export function createMockEditLevelQwenPlanningProfile(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenPlanningProfilePackage {
  return createEditLevelQwenPlanningProfilePackage(input.level)
}

export function createMockEditLevelQwenPlanningProfiles(): EditLevelQwenPlanningProfilePackage[] {
  return [
    createEditLevelQwenPlanningProfilePackage('normal'),
    createEditLevelQwenPlanningProfilePackage('premium'),
    createEditLevelQwenPlanningProfilePackage('ultra_premium'),
  ]
}

export function getMockEditLevelQwenPlanningProfileByLevel(
  level: ReEditProCanonicalEditLevel,
): EditLevelQwenPlanningProfilePackage {
  return createEditLevelQwenPlanningProfilePackage(level)
}
