import type { ReEditProCanonicalEditLevel } from '../../types'
import { createEditLevelQAGatePackage } from '../../lib/edit-level-qa-gates-rules'

export interface EditLevelQAFallbackReport {
  level: ReEditProCanonicalEditLevel
  fallbacks: string[]
  warnings: string[]
  degradedGateCount: number
  mockOnly: true
}

export function createEditLevelQAFallbackReport(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelQAFallbackReport {
  const qaPackage = createEditLevelQAGatePackage(input.level)

  return {
    level: input.level,
    fallbacks: qaPackage.fallbackPolicy,
    warnings: qaPackage.warnings,
    degradedGateCount: qaPackage.degradedGates.length,
    mockOnly: true,
  }
}
