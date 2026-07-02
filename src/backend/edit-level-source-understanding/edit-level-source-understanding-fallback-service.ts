import type { ReEditProCanonicalEditLevel } from '../../types'
import { createEditLevelSourceUnderstandingPolicyPackage } from '../../lib/edit-level-source-understanding-rules'

export interface EditLevelSourceUnderstandingFallbackReport {
  level: ReEditProCanonicalEditLevel
  fallbacks: string[]
  warnings: string[]
  degradedLayerCount: number
  mockOnly: true
}

export function createEditLevelSourceUnderstandingFallbackReport(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelSourceUnderstandingFallbackReport {
  const routingPackage = createEditLevelSourceUnderstandingPolicyPackage(input.level)

  return {
    level: input.level,
    fallbacks: routingPackage.fallbackPolicy,
    warnings: routingPackage.warnings,
    degradedLayerCount: routingPackage.degradedLayers.length,
    mockOnly: true,
  }
}
