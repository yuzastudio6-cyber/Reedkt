import type {
  EditLevelQwenStructuredOutputPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export interface EditLevelQwenStructuredOutputPolicyResult {
  level: ReEditProCanonicalEditLevel
  structuredOutputPolicy: EditLevelQwenStructuredOutputPolicy
  summary: string
  mockOnly: true
}

export function createMockEditLevelQwenStructuredOutputPolicy(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenStructuredOutputPolicyResult {
  const qwenPackage = createEditLevelQwenPlanningProfilePackage(input.level)

  return {
    level: input.level,
    structuredOutputPolicy: qwenPackage.structuredOutputPolicy,
    summary: qwenPackage.dimensions.find((dimension) => dimension.dimensionId === 'plan_hint_complexity')?.userFacingSummary ?? qwenPackage.structuredOutputPolicy,
    mockOnly: true,
  }
}

export function createAllMockEditLevelQwenStructuredOutputPolicies(): EditLevelQwenStructuredOutputPolicyResult[] {
  return [
    createMockEditLevelQwenStructuredOutputPolicy({ level: 'normal' }),
    createMockEditLevelQwenStructuredOutputPolicy({ level: 'premium' }),
    createMockEditLevelQwenStructuredOutputPolicy({ level: 'ultra_premium' }),
  ]
}
