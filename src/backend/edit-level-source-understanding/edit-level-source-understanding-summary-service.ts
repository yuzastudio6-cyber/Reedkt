import type {
  EditLevelSourceUnderstandingPolicyPackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelSourceUnderstandingPolicyPackage } from '../../lib/edit-level-source-understanding-rules'

export interface EditLevelSourceUnderstandingSummaryResult {
  level: ReEditProCanonicalEditLevel
  userFacingSummary: string
  technicalSummary: string
  warnings: string[]
  layerCount: number
  mockOnly: true
}

export function createEditLevelSourceUnderstandingSummary(input: {
  level: ReEditProCanonicalEditLevel
  routingPackage?: EditLevelSourceUnderstandingPolicyPackage
}): EditLevelSourceUnderstandingSummaryResult {
  const routingPackage = input.routingPackage ?? createEditLevelSourceUnderstandingPolicyPackage(input.level)

  return {
    level: input.level,
    userFacingSummary: routingPackage.userFacingSummary,
    technicalSummary: routingPackage.technicalSummary,
    warnings: routingPackage.warnings,
    layerCount: routingPackage.layers.length,
    mockOnly: true,
  }
}
