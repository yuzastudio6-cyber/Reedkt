import type { ReEditProCanonicalEditLevel } from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export interface EditLevelQwenUsageEstimatePolicyResult {
  level: ReEditProCanonicalEditLevel
  usageEstimatePolicy: 'low_estimate' | 'medium_estimate' | 'high_estimate'
  creditBehavior: 'estimate_only_no_spend'
  notice: string
  mockOnly: true
}

export function createEditLevelQwenUsageEstimatePolicy(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQwenUsageEstimatePolicyResult {
  const qwenPackage = createEditLevelQwenPlanningProfilePackage(input.level)

  return {
    level: input.level,
    usageEstimatePolicy: qwenPackage.usageEstimatePolicy,
    creditBehavior: qwenPackage.creditBehavior,
    notice: `${qwenPackage.usageEstimatePolicy.replaceAll('_', ' ')}; estimate only; no credit reservation or spend.`,
    mockOnly: true,
  }
}
