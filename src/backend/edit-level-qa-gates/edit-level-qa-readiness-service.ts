import type {
  EditLevelQAGatePackage,
  EditLevelQAReadinessStatus,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQAGatePackage } from '../../lib/edit-level-qa-gates-rules'

export interface EditLevelQAReadinessReport {
  level: ReEditProCanonicalEditLevel
  readinessStatus: EditLevelQAReadinessStatus
  readinessSummary: string
  blockingGateCount: number
  futureGateCount: number
  mockOnly: true
}

export function createEditLevelQAReadinessReport(input: {
  level: ReEditProCanonicalEditLevel
  qaPackage?: EditLevelQAGatePackage
}): EditLevelQAReadinessReport {
  const qaPackage = input.qaPackage ?? createEditLevelQAGatePackage(input.level)

  return {
    level: input.level,
    readinessStatus: qaPackage.readinessStatus,
    readinessSummary: qaPackage.readinessSummary,
    blockingGateCount: qaPackage.blockingGates.length,
    futureGateCount: qaPackage.futureOnlyGates.length,
    mockOnly: true,
  }
}
