import type { MusicDirectorPlanningInput, MusicDirectorPlanningResult } from '../backend-types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import {
  createMusicDirectorPlanningInputFromScenario,
  mockLakeComoMusicDirectorScenario,
} from '../mock/mock-music-director-scenarios'
import { createMusicDirectorPlan, createMusicPlanningSummary } from '../services/music-director-service'
import { ok, type ServiceResult } from '../service-result'

export interface MockMusicPlanningOrchestratorResult extends MusicDirectorPlanningResult {
  planningSummary: string
}

export function runMockMusicDirectorPlanningFlow(
  input: MusicDirectorPlanningInput,
  db: MockDatabase = createMockDatabase(),
): ServiceResult<MockMusicPlanningOrchestratorResult> {
  const planResult = createMusicDirectorPlan(db, input)

  if (!planResult.ok) {
    return planResult
  }

  const planningSummary = createMusicPlanningSummary(planResult.data)

  return ok(
    {
      ...planResult.data,
      planningSummary,
    },
    planResult.data.warnings,
  )
}

export function runMockLakeComoMusicPlanningFlow(
  db: MockDatabase = createMockDatabase(),
): ServiceResult<MockMusicPlanningOrchestratorResult> {
  return runMockMusicDirectorPlanningFlow(createMusicDirectorPlanningInputFromScenario(mockLakeComoMusicDirectorScenario), db)
}
