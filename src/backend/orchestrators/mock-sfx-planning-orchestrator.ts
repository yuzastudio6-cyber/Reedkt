import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXScenario,
  getLakeComoMockSFXScenario,
  getNoSFXMockScenario,
  getSignatureMockSFXScenario,
  type MockSFXScenario,
} from '../mock/mock-sfx-scenarios'
import {
  createSFXDirectorPlan,
  createSFXPlanningSummary,
} from '../services/sfx-director-service'
import { unwrapServiceResult } from '../service-result'

export function runMockSFXPlanningFlow(
  scenario: MockSFXScenario = getDefaultMockSFXScenario(),
  db: MockDatabase = createMockDatabase(),
) {
  const result = unwrapServiceResult(createSFXDirectorPlan(db, scenario))

  return {
    scenario,
    ...result,
    planningSummary: createSFXPlanningSummary(result),
  }
}

export function runMockLakeComoSFXPlanningFlow(
  db: MockDatabase = createMockDatabase(),
) {
  return runMockSFXPlanningFlow(getLakeComoMockSFXScenario(), db)
}

export function runMockNoSFXPlanningFlow(
  db: MockDatabase = createMockDatabase(),
) {
  return runMockSFXPlanningFlow(getNoSFXMockScenario(), db)
}

export function runMockSignatureSFXPlanningFlow(
  db: MockDatabase = createMockDatabase(),
) {
  return runMockSFXPlanningFlow(getSignatureMockSFXScenario(), db)
}
