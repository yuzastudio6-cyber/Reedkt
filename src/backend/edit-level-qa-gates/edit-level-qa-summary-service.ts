import type {
  EditLevelQAGatePackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQAGatePackage } from '../../lib/edit-level-qa-gates-rules'
import { createEditLevelQAGateTechnicalSummary } from '../../lib/edit-level-qa-gates-summaries'

export interface EditLevelQAGateSummaryResult {
  level: ReEditProCanonicalEditLevel
  userFacingSummary: string
  technicalSummary: string
  readinessSummary: string
  warnings: string[]
  gateCount: number
  mockOnly: true
}

export function createEditLevelQAGateSummary(input: {
  level: ReEditProCanonicalEditLevel
  qaPackage?: EditLevelQAGatePackage
}): EditLevelQAGateSummaryResult {
  const qaPackage = input.qaPackage ?? createEditLevelQAGatePackage(input.level)

  return {
    level: input.level,
    userFacingSummary: qaPackage.userFacingSummary,
    technicalSummary: createEditLevelQAGateTechnicalSummary(input.level, qaPackage),
    readinessSummary: qaPackage.readinessSummary,
    warnings: qaPackage.warnings,
    gateCount: qaPackage.gates.length,
    mockOnly: true,
  }
}
